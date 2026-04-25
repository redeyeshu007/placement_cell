import { NextRequest, NextResponse } from 'next/server';
import type { PipelineStage } from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Student from '@/models/Student';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const safeInt = (v: string | null, fallback: number) => { const n = parseInt(v ?? ''); return Number.isFinite(n) ? n : fallback; };
    const page    = Math.max(1, safeInt(searchParams.get('page'), 1));
    const limit   = Math.min(500, Math.max(1, safeInt(searchParams.get('limit'), 500)));
    const batch   = searchParams.get('batch');
    const search  = searchParams.get('search')?.trim();
    const dept    = searchParams.get('dept');
    const paginate = searchParams.get('paginate') === '1';

    // Build filter — uses indexes for fast queries
    const filter: Record<string, unknown> = {};
    const batchNum = safeInt(batch, NaN);
    if (Number.isFinite(batchNum)) filter.batch = batchNum;
    if (dept)   filter.dept  = dept;
    if (search) {
      // Regex on indexed id field + name field (covers reg-no and name lookup)
      filter.$or = [
        { id:   { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
      ];
    }

    // Compute a lightweight `hasResumePdf` boolean on the server so list consumers
    // can tell who uploaded a resume without paying the cost of shipping ~200-500KB
    // of base64 per student. resumePdf itself is then stripped.
    const pipeline: PipelineStage[] = [
      { $match: filter },
      { $addFields: {
        hasResumePdf: {
          $gt: [{ $strLenCP: { $ifNull: ['$resumePdf', ''] } }, 100],
        },
      } },
      { $unset: ['resumePdf', 'resumeRawText', '__v'] },
      { $sort: { batch: -1, id: 1 } },
    ];

    if (paginate) {
      const skip = (page - 1) * limit;
      const [students, total] = await Promise.all([
        Student.aggregate([...pipeline, { $skip: skip }, { $limit: limit }]),
        Student.countDocuments(filter),
      ]);
      return NextResponse.json({
        students,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    }

    const students = await Student.aggregate(pipeline);
    return NextResponse.json(students);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { id, name, dept, cgpa, totalBacklogs, activeBacklogs } = body;
    if (!id || !name) return NextResponse.json({ error: 'id and name are required' }, { status: 400 });

    const existing = await Student.findOne({ id: String(id).trim() });
    if (existing) return NextResponse.json({ error: 'Student with this register number already exists' }, { status: 409 });

    const student = await Student.create({
      id: String(id).trim(),
      name: String(name).trim(),
      dept: String(dept ?? '').trim(),
      cgpa: parseFloat(cgpa) || 0,
      totalBacklogs: parseInt(totalBacklogs) || 0,
      activeBacklogs: parseInt(activeBacklogs) || 0,
      password: String(id).trim(),
      profileComplete: false,
    });
    return NextResponse.json(student, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { studentIds, update } = body;
    if (!studentIds || !Array.isArray(studentIds) || !update) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    
    if (req.headers.get('x-admin-key') !== 'psna-admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const result = await Student.updateMany(
      { id: { $in: studentIds } },
      { $set: update }
    );
    
    return NextResponse.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

