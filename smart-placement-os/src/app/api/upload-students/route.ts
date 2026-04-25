import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';
import * as XLSX from 'xlsx';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    const batch = parseInt(String(formData.get('batch') ?? '')) || null;
    if (!batch) return NextResponse.json({ error: 'Batch year is required' }, { status: 400 });
    const dept = String(formData.get('dept') ?? '').trim().toUpperCase();
    if (!dept) return NextResponse.json({ error: 'Department is required' }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const regNos: string[] = [];

    if (file.name.endsWith('.csv')) {
      const text = buffer.toString('utf-8');
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const start = /^[a-z]/i.test(lines[0]) && isNaN(Number(lines[0])) ? 1 : 0;
      for (let i = start; i < lines.length; i++) {
        const val = lines[i].split(',')[0].replace(/^"|"$/g, '').trim().replace(/\.0$/, '');
        if (val) regNos.push(val);
      }
    } else {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { header: 1, defval: '' });
      const start = raw.length > 0 && isNaN(Number(String(raw[0][0]).trim())) ? 1 : 0;
      for (let i = start; i < raw.length; i++) {
        const val = String(raw[i][0] ?? '').trim().replace(/\.0$/, '');
        if (val) regNos.push(val);
      }
    }

    if (regNos.length === 0) return NextResponse.json({ error: 'No register numbers found in file' }, { status: 400 });

    const col = mongoose.connection.collection('students');
    const now = new Date();

    // Find existing IDs in one query instead of N individual findOne calls
    const existing = await col.distinct('id', { id: { $in: regNos } });
    const existingSet = new Set(existing);

    const toInsert = regNos.filter(r => !existingSet.has(r));
    const skipped  = regNos.length - toInsert.length;

    let created = 0;
    const errors: string[] = [];

    if (toInsert.length > 0) {
      // Bulk insert in one round-trip — vastly faster than one-by-one for 1000+ records
      const docs = toInsert.map(regNo => ({
        id: regNo,
        name: '',
        batch,
        dept,
        password: regNo,
        profileComplete: false,
        skills: [],
        hackathons: 0,
        certifications: 0,
        totalBacklogs: 0,
        activeBacklogs: 0,
        cgpa: 0,
        quizBonusScore: 50,
        resumeProjects: [],
        validatedProjectsCount: 0,
        createdAt: now,
        updatedAt: now,
      }));

      try {
        // ordered: false means remaining docs still insert even if some fail (e.g., duplicate key race)
        const result = await col.insertMany(docs, { ordered: false });
        created = result.insertedCount;
      } catch (err) {
        // BulkWriteError: some succeeded, some failed
        const bulkErr = err as { result?: { nInserted?: number }; writeErrors?: { index: number; errmsg: string }[]; message?: string };
        created = bulkErr.result?.nInserted ?? 0;
        if (bulkErr.writeErrors) {
          for (const we of bulkErr.writeErrors) {
            errors.push(`${toInsert[we.index]}: ${we.errmsg}`);
          }
        } else {
          errors.push(bulkErr.message ?? 'Unknown bulk write error');
        }
      }
    }

    return NextResponse.json({ created, skipped, errors });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Upload failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
