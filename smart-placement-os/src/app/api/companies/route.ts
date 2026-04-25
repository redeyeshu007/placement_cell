import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Company from '@/models/Company';

export async function GET() {
  try {
    await dbConnect();
    const raw = await Company.find({}).lean();
    // Normalize every document so the UI always receives typed, non-null fields
    const companies = raw.map((c: any) => ({
      id: c.id,
      name: c.name,
      role: c.role ?? '',
      salary: c.salary ?? '',
      requirementType: c.requirementType ?? 'open',
      requiredSkills: c.requiredSkills ?? [],
      prioritySkills: c.prioritySkills ?? [],
      minCgpa: c.minCgpa ?? 0,
      allowedBacklogs: c.allowedBacklogs ?? 0,
      noHistoryOfArrears: Boolean(c.noHistoryOfArrears),
      selectCount: c.selectCount ?? 0,
      min10thPercent: c.min10thPercent ?? 0,
      min12thPercent: c.min12thPercent ?? 0,
      acceptedStudents: c.acceptedStudents ?? [],
      finalAccepted: c.finalAccepted ?? [],
      finalRejected: c.finalRejected ?? [],
    }));
    return NextResponse.json(companies);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    const {
      name, role, salary,
      requirementType, requiredSkills, prioritySkills,
      minCgpa, allowedBacklogs, noHistoryOfArrears, selectCount,
      min10thPercent, min12thPercent,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }

    // Generate a unique id from name + timestamp
    const id = `${name.trim().toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

    const company = await Company.create({
      id,
      name: name.trim(),
      role: role?.trim() || 'Software Engineer',
      salary: salary?.trim() || '',
      requirementType: requirementType || 'open',
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
      prioritySkills: Array.isArray(prioritySkills) ? prioritySkills : [],
      minCgpa: Number(minCgpa) || 0,
      allowedBacklogs: Number(allowedBacklogs) || 0,
      noHistoryOfArrears: Boolean(noHistoryOfArrears),
      selectCount: Number(selectCount) || 0,
      min10thPercent: Number(min10thPercent) || 0,
      min12thPercent: Number(min12thPercent) || 0,
      acceptedStudents: [],
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error('[POST /api/companies]', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
