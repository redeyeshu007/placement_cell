/**
 * POST /api/perf/seed
 * Bulk-inserts synthetic student records for load testing.
 * Body: { count: number; batch: number; prefix?: string; cleanup?: boolean }
 * - cleanup: true → deletes all perf-test records before inserting
 * Requires x-admin-key: psna-admin header.
 */
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

const DEPTS   = ['CSE', 'ECE', 'IT', 'MECH', 'EEE', 'CIVIL', 'AIDS', 'AIML', 'CSD'];
const SKILLS  = ['Python', 'Java', 'React', 'Node.js', 'MongoDB', 'SQL', 'C++', 'Django',
                 'TypeScript', 'Docker', 'AWS', 'Machine Learning', 'TensorFlow', 'Flutter'];
const STATES  = ['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana'];

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number) {
  return Math.floor(rand(min, max + 1));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickMany<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

export async function POST(req: NextRequest) {
  if (req.headers.get('x-admin-key') !== 'psna-admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    await dbConnect();
    const col = mongoose.connection.collection('students');

    const body = await req.json().catch(() => ({}));
    const count   = Math.min(5000, Math.max(1, parseInt(body.count ?? '1000')));
    const batch   = parseInt(body.batch ?? '2026');
    const prefix  = (body.prefix ?? 'PERF').toUpperCase();
    const cleanup = body.cleanup === true;

    // Optional cleanup — remove prior perf test records
    let deleted = 0;
    if (cleanup) {
      const res = await col.deleteMany({ id: { $regex: `^${prefix}` } });
      deleted = res.deletedCount;
    }

    const now = new Date();

    // Generate synthetic student documents
    const docs = Array.from({ length: count }, (_, i) => {
      const regNo    = `${prefix}${String(i + 1).padStart(6, '0')}`;
      const dept     = pick(DEPTS);
      const cgpa     = parseFloat(rand(5.5, 9.8).toFixed(2));
      const active   = randInt(0, 2);
      const total    = active + randInt(0, 3);
      const skills   = pickMany(SKILLS, randInt(2, 8));
      const hacks    = randInt(0, 5);
      const certs    = randInt(0, 4);
      const leetSolved = randInt(0, 350);
      const tenthPct = parseFloat(rand(60, 98).toFixed(2));
      const twelfthPct = parseFloat(rand(60, 98).toFixed(2));

      return {
        id: regNo,
        name: `Test Student ${i + 1}`,
        batch,
        dept,
        cgpa,
        cgpaSemester: 5,
        totalBacklogs: total,
        activeBacklogs: active,
        skills,
        hackathons: hacks,
        certifications: certs,
        password: regNo,
        profileComplete: Math.random() > 0.3,
        email: `${regNo.toLowerCase()}@test.edu`,
        alternateEmail: `${regNo.toLowerCase()}@psnatest.edu.in`,
        phone: `9${String(randInt(100000000, 999999999))}`,
        gender: Math.random() > 0.4 ? 'Male' : 'Female',
        section: pick(['A', 'B', 'C', 'D']),
        accommodation: Math.random() > 0.5 ? 'Hosteller' : 'Day Scholar',
        nationality: 'Indian',
        tenthPercent: tenthPct,
        tenthYearOfPassing: 2020,
        tenthSchool: `Test School ${randInt(1, 50)}`,
        twelfthPercent: twelfthPct,
        twelfthYearOfPassing: 2022,
        twelfthSchool: `Test HSS ${randInt(1, 50)}`,
        allSubjectsClearedFirstAttempt: total === 0,
        certificationName: certs > 0 ? 'AWS Cloud Practitioner' : '',
        certificationDuration: certs > 0 ? '3 months' : '',
        certificationVendor: certs > 0 ? 'Amazon' : '',
        addressLine1: `${randInt(1, 999)} Test Street`,
        addressLine2: `Test Colony`,
        district: 'Dindigul',
        state: pick(STATES),
        postalCode: `624${String(randInt(100, 999))}`,
        githubLink: `https://github.com/testuser${i + 1}`,
        leetcodeUsername: `testuser${i + 1}`,
        leetcodeSolved: leetSolved,
        leetcodeEasy: Math.floor(leetSolved * 0.5),
        leetcodeMedium: Math.floor(leetSolved * 0.35),
        leetcodeHard: Math.floor(leetSolved * 0.15),
        resumeStrengthScore: randInt(30, 90),
        resumeStrengthLevel: ['Weak', 'Moderate', 'Strong', 'Excellent'][randInt(0, 3)],
        resumeExperienceScore: randInt(20, 80),
        resumeExperienceLevel: ['Fresher', 'Intern', 'Experienced'][randInt(0, 2)],
        resumeProjects: Array.from({ length: randInt(0, 5) }, (_, j) => `Project ${j + 1}`),
        validatedProjectsCount: randInt(0, 3),
        quizBonusScore: randInt(30, 100),
        lastQuizDate: new Date().toISOString().slice(0, 10),
        domain: pick(['Web', 'ML', 'Mobile', 'DevOps', 'Data Science']),
        createdAt: now,
        updatedAt: now,
      };
    });

    // Batch in chunks of 500 to avoid MongoDB 16MB document limit per batch
    const CHUNK = 500;
    let inserted = 0;
    const errors: string[] = [];

    for (let i = 0; i < docs.length; i += CHUNK) {
      const chunk = docs.slice(i, i + CHUNK);
      try {
        const res = await col.insertMany(chunk, { ordered: false });
        inserted += res.insertedCount;
      } catch (err: any) {
        inserted += err.result?.nInserted ?? 0;
        if (err.writeErrors) {
          for (const we of err.writeErrors.slice(0, 5)) {
            errors.push(`${chunk[we.index]?.id}: duplicate`);
          }
        }
      }
    }

    const total = await col.countDocuments({ id: { $regex: `^${prefix}` } });

    return NextResponse.json({
      ok: true,
      requested: count,
      inserted,
      skipped: count - inserted,
      deleted,
      totalPerfRecords: total,
      errors: errors.slice(0, 10),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/perf/seed — removes all perf test records
export async function DELETE(req: NextRequest) {
  if (req.headers.get('x-admin-key') !== 'psna-admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  try {
    await dbConnect();
    const col = mongoose.connection.collection('students');
    const prefix = new URL(req.url).searchParams.get('prefix') ?? 'PERF';
    const res = await col.deleteMany({ id: { $regex: `^${prefix.toUpperCase()}` } });
    return NextResponse.json({ deleted: res.deletedCount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
