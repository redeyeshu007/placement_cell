import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

// One-time migration: assign a department to all students in a given batch.
// POST /api/migrate-dept with JSON body { batch: 2023, dept: "CSE" }
// Requires x-admin-key header.
export async function POST(req: NextRequest) {
  try {
    if (req.headers.get('x-admin-key') !== 'psna-admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { batch, dept, overwrite } = await req.json();

    const batchNum = parseInt(String(batch));
    if (!Number.isFinite(batchNum)) {
      return NextResponse.json({ error: 'Valid batch year is required' }, { status: 400 });
    }

    const deptStr = String(dept ?? '').trim().toUpperCase();
    if (!deptStr) {
      return NextResponse.json({ error: 'Department is required' }, { status: 400 });
    }

    const col = mongoose.connection.collection('students');

    // By default only update students whose dept is empty/missing.
    // If overwrite=true, update everyone in the batch regardless of current dept.
    const filter = overwrite
      ? { batch: batchNum }
      : { batch: batchNum, $or: [{ dept: { $exists: false } }, { dept: '' }, { dept: null }] };

    const result = await col.updateMany(filter, { $set: { dept: deptStr, updatedAt: new Date() } });

    return NextResponse.json({
      matched: result.matchedCount,
      updated: result.modifiedCount,
      batch: batchNum,
      dept: deptStr,
      overwrite: Boolean(overwrite),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Migration failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
