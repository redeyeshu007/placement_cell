import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/models/Student';
import mongoose from 'mongoose';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const student = await Student.findOne({ id }).lean();
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    return NextResponse.json(student);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Fields a student can edit themselves (optional profile + placement data)
const STUDENT_EDITABLE = [
  'skills', 'hackathons', 'certifications', 'profilePhoto', 'resumePdf',
  'leetcodeUsername', 'leetcodeSolved',
  'resumeProjects', 'validatedProjectsCount',
  'resume_link', 'githubLink', 'linkedinProfile', 'hackerrankProfile',
  'resumeStrengthScore', 'resumeStrengthLevel',
  'resumeExperienceScore', 'resumeExperienceLevel', 'resumeExperienceSummary',
  'resumeRawText', 'quizBonusScore', 'lastQuizDate', 'domain',
];

// Mandatory fields only an admin can set (including completing the profile)
const MANDATORY_FIELDS = [
  'name', 'dept', 'cgpa', 'cgpaSemester',
  'totalBacklogs', 'activeBacklogs',
  'email', 'address', 'phone',
  'accommodation', 'hostelName', 'hostelBlock', 'roomNumber',
  'profileComplete', 'password',
  'updateRequested', 'updateReason', 'updateApproved',
];

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    const isAdmin = req.headers.get('x-admin-key') === 'psna-admin';

    let allowedKeys: string[];

    if (isAdmin) {
      // Admin can update everything
      allowedKeys = [...STUDENT_EDITABLE, ...MANDATORY_FIELDS];
    } else {
      // Student: check if profile is frozen
      const existing = await Student.findOne({ id }, { profileComplete: 1 }).lean<{ profileComplete?: boolean } | null>();
      if (!existing) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

      if (existing.profileComplete === true) {
        // Frozen — only optional fields
        allowedKeys = STUDENT_EDITABLE;
      } else {
        // Not frozen — allow mandatory + optional (student can edit everything until admin freezes)
        allowedKeys = [...STUDENT_EDITABLE, ...MANDATORY_FIELDS];
      }
    }

    const update: Record<string, any> = {};
    for (const key of allowedKeys) {
      if (key in body) update[key] = body[key];
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Use raw MongoDB collection to avoid Mongoose 'id' virtual field conflicts
    const col = mongoose.connection.collection('students');

    // If the student is changing their LeetCode username, invalidate the cached
    // stats so the next sync fetches fresh data for the new handle (prevents
    // stale stats from the previous username being served).
    const $unset: Record<string, ''> = {};
    if ('leetcodeUsername' in update) {
      const current = await col.findOne({ id }, { projection: { leetcodeUsername: 1 } });
      const newUsername = String(update.leetcodeUsername ?? '').trim();
      if ((current?.leetcodeUsername ?? '') !== newUsername) {
        $unset.leetcodeSolved = '';
        $unset.leetcodeEasy = '';
        $unset.leetcodeMedium = '';
        $unset.leetcodeHard = '';
        $unset.leetcodeRanking = '';
        $unset.leetcodeLastSync = '';
      }
    }

    const updateOps: Record<string, unknown> = { $set: { ...update, updatedAt: new Date() } };
    if (Object.keys($unset).length > 0) updateOps.$unset = $unset;

    const result = await col.findOneAndUpdate(
      { id: id },
      updateOps,
      { returnDocument: 'after' }
    );

    if (!result) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Keep PATCH for profile-setup page compatibility
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    const allowedKeys = [
      // Students fill these themselves — not pre-set by admin
      'name', 'dept', 'cgpa', 'cgpaSemester', 'activeBacklogs', 'totalBacklogs',
      'email', 'alternateEmail', 'address', 'phone',
      'fatherOccupation', 'fatherPhone',
      'motherName', 'motherOccupation', 'motherPhone',
      'profileComplete',
      'updateRequested', 'updateReason', 'updateApproved',
      'firstName', 'fatherName', 'fullNameWithInitial', 'gender', 'section',
      'dob', 'nationality', 'accommodation', 'hostelName', 'hostelBlock', 'roomNumber',
      'tenthPercent', 'tenthYearOfPassing', 'tenthSchool',
      'twelfthPercent', 'twelfthYearOfPassing', 'twelfthSchool',
      'diplomaYearAdmitted', 'diplomaPercent', 'diplomaYearOfPassing',
      'allSubjectsClearedFirstAttempt', 'totalBacklogs', 'activeBacklogs',
      'certificationName', 'certificationDuration', 'certificationVendor', 'certifications',
      'aadharNumber', 'hasPanCard', 'panCardNumber', 'hasPassport', 'passportNumber',
      'addressLine1', 'addressLine2', 'district', 'state', 'postalCode',
      'githubLink', 'linkedinProfile', 'hackerrankProfile', 'leetcodeUsername', 'resume_link', 'skills',
      'profilePhoto', 'resumePdf',
    ];

    const update: Record<string, any> = {};
    for (const key of allowedKeys) {
      if (key in body) update[key] = body[key];
    }

    const col = mongoose.connection.collection('students');
    const updated = await col.findOneAndUpdate(
      { id: id },
      { $set: { ...update, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!updated) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (req.headers.get('x-admin-key') !== 'psna-admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  try {
    await dbConnect();
    const { id } = await params;
    const col = mongoose.connection.collection('students');
    const result = await col.deleteOne({ id });
    if (result.deletedCount === 0) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
