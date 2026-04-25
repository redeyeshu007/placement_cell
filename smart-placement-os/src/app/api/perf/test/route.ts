/**
 * GET /api/perf/test
 * Runs a suite of performance benchmarks against the live database.
 * Returns timing data for all critical operations.
 * Requires x-admin-key: psna-admin header.
 */
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

interface BenchResult {
  name: string;
  ms: number;
  records?: number;
  status: 'pass' | 'warn' | 'fail';
  note?: string;
}

async function bench(
  name: string,
  fn: () => Promise<{ records?: number; note?: string }>,
  thresholds = { warn: 500, fail: 2000 }
): Promise<BenchResult> {
  const t0 = Date.now();
  try {
    const { records, note } = await fn();
    const ms = Date.now() - t0;
    const status = ms < thresholds.warn ? 'pass' : ms < thresholds.fail ? 'warn' : 'fail';
    return { name, ms, records, status, note };
  } catch (err: any) {
    const ms = Date.now() - t0;
    return { name, ms, status: 'fail', note: err.message };
  }
}

export async function GET(req: NextRequest) {
  if (req.headers.get('x-admin-key') !== 'psna-admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  await dbConnect();
  const col = mongoose.connection.collection('students');
  const companiesCol = mongoose.connection.collection('companies');

  const results: BenchResult[] = [];

  // ── 1. Total count ────────────────────────────────────────────────────────
  results.push(await bench('COUNT: Total students', async () => {
    const n = await col.countDocuments();
    return { records: n, note: `${n} students in DB` };
  }, { warn: 100, fail: 500 }));

  // ── 2. Full collection scan (what the old API was doing) ──────────────────
  results.push(await bench('FETCH: All students (all fields) — old behavior', async () => {
    const docs = await col.find({}).toArray();
    const bytes = JSON.stringify(docs).length;
    return { records: docs.length, note: `Payload: ${(bytes / 1024).toFixed(0)} KB` };
  }, { warn: 1000, fail: 5000 }));

  // ── 3. Optimized fetch (strip heavy fields) ───────────────────────────────
  results.push(await bench('FETCH: All students (no resumePdf/rawText) — optimized', async () => {
    const docs = await col.find({}, { projection: { resumePdf: 0, resumeRawText: 0, profilePhoto: 0, __v: 0 } }).toArray();
    const bytes = JSON.stringify(docs).length;
    return { records: docs.length, note: `Payload: ${(bytes / 1024).toFixed(0)} KB` };
  }, { warn: 500, fail: 2000 }));

  // ── 4. Indexed batch filter ───────────────────────────────────────────────
  results.push(await bench('FILTER: By batch (indexed)', async () => {
    const docs = await col.find({ batch: 2026 }, { projection: { resumePdf: 0, resumeRawText: 0 } }).toArray();
    return { records: docs.length };
  }, { warn: 200, fail: 1000 }));

  // ── 5. CGPA range filter ──────────────────────────────────────────────────
  results.push(await bench('FILTER: CGPA ≥ 7.5 (indexed)', async () => {
    const docs = await col.find({ cgpa: { $gte: 7.5 } }, { projection: { id: 1, name: 1, cgpa: 1 } }).toArray();
    return { records: docs.length };
  }, { warn: 200, fail: 1000 }));

  // ── 6. Compound filter (batch + dept + cgpa) ──────────────────────────────
  results.push(await bench('FILTER: batch+dept+cgpa compound (indexed)', async () => {
    const docs = await col.find(
      { batch: 2026, dept: 'CSE', cgpa: { $gte: 7.0 } },
      { projection: { id: 1, name: 1, cgpa: 1, dept: 1 } }
    ).toArray();
    return { records: docs.length };
  }, { warn: 200, fail: 1000 }));

  // ── 7. Text / regex search ─────────────────────────────────────────────────
  results.push(await bench('SEARCH: Name regex (like search bar)', async () => {
    const docs = await col.find(
      { $or: [{ id: { $regex: 'PERF000', $options: 'i' } }, { name: { $regex: 'Test Student 1', $options: 'i' } }] },
      { projection: { id: 1, name: 1 } }
    ).toArray();
    return { records: docs.length };
  }, { warn: 300, fail: 1500 }));

  // ── 8. Pagination ─────────────────────────────────────────────────────────
  results.push(await bench('PAGINATE: Page 1 of 50 (skip/limit)', async () => {
    const docs = await col.find({}, { projection: { resumePdf: 0, resumeRawText: 0 } })
      .sort({ batch: -1, id: 1 })
      .skip(0)
      .limit(50)
      .toArray();
    return { records: docs.length };
  }, { warn: 200, fail: 800 }));

  // ── 9. Single student lookup ──────────────────────────────────────────────
  results.push(await bench('LOOKUP: Single student by id (indexed)', async () => {
    const first = await col.findOne({}, { projection: { id: 1 } });
    if (!first) return { note: 'No students found' };
    const doc = await col.findOne({ id: first.id });
    return { records: doc ? 1 : 0 };
  }, { warn: 50, fail: 200 }));

  // ── 10. Bulk update (50 records) ──────────────────────────────────────────
  results.push(await bench('BULK UPDATE: 50 students quizBonusScore', async () => {
    const ids = await col.find({ id: { $regex: '^PERF' } }, { projection: { id: 1 } }).limit(50).toArray();
    if (ids.length === 0) return { note: 'No PERF records; run /api/perf/seed first' };
    const idList = ids.map(d => d.id);
    const res = await col.updateMany(
      { id: { $in: idList } },
      { $set: { quizBonusScore: 75, updatedAt: new Date() } }
    );
    return { records: res.modifiedCount };
  }, { warn: 300, fail: 1500 }));

  // ── 11. Aggregation: dept distribution ────────────────────────────────────
  results.push(await bench('AGGREGATE: Students per department', async () => {
    const agg = await col.aggregate([
      { $group: { _id: '$dept', count: { $sum: 1 }, avgCgpa: { $avg: '$cgpa' } } },
      { $sort: { count: -1 } },
    ]).toArray();
    return { records: agg.length, note: agg.map(a => `${a._id}: ${a.count}`).join(', ').slice(0, 120) };
  }, { warn: 300, fail: 1500 }));

  // ── 12. Aggregation: top 10 by PRS proxy (cgpa + skills count) ───────────
  results.push(await bench('AGGREGATE: Top 10 by CGPA × skills', async () => {
    const agg = await col.aggregate([
      { $match: { activeBacklogs: 0, cgpa: { $gte: 6.0 } } },
      { $addFields: { skillCount: { $size: { $ifNull: ['$skills', []] } }, prsProxy: { $add: [{ $multiply: ['$cgpa', 10] }, { $size: { $ifNull: ['$skills', []] } }] } } },
      { $sort: { prsProxy: -1 } },
      { $limit: 10 },
      { $project: { id: 1, name: 1, cgpa: 1, skillCount: 1, prsProxy: 1 } },
    ]).toArray();
    return { records: agg.length };
  }, { warn: 500, fail: 2000 }));

  // ── 13. Companies fetch ───────────────────────────────────────────────────
  results.push(await bench('FETCH: All companies', async () => {
    const docs = await companiesCol.find({}).toArray();
    return { records: docs.length };
  }, { warn: 200, fail: 1000 }));

  // ── 14. Duplicate check ───────────────────────────────────────────────────
  results.push(await bench('INTEGRITY: Duplicate id check', async () => {
    const dupes = await col.aggregate([
      { $group: { _id: '$id', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
    ]).toArray();
    return { records: dupes.length, note: dupes.length === 0 ? 'No duplicates ✓' : `${dupes.length} duplicate IDs found!` };
  }, { warn: 500, fail: 2000 }));

  // ── 15. Index existence check ─────────────────────────────────────────────
  results.push(await bench('INDEXES: Check student collection indexes', async () => {
    const indexes = await col.indexes();
    const indexNames = indexes.map((ix: any) => Object.keys(ix.key).join('+'));
    return { records: indexes.length, note: indexNames.join(', ') };
  }, { warn: 50, fail: 200 }));

  // Summary
  const pass = results.filter(r => r.status === 'pass').length;
  const warn = results.filter(r => r.status === 'warn').length;
  const fail = results.filter(r => r.status === 'fail').length;
  const totalMs = results.reduce((sum, r) => sum + r.ms, 0);

  return NextResponse.json({
    summary: { pass, warn, fail, totalMs, tests: results.length },
    results,
    thresholds: { pass: '< 500ms', warn: '500-2000ms', fail: '> 2000ms' },
    timestamp: new Date().toISOString(),
  });
}
