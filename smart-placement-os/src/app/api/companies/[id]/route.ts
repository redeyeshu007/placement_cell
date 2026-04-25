import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Company from '@/models/Company';

// Student accepts/declines an invite OR admin records final decision
// Student: { studentId, action: 'accept'|'decline' }
// Admin:   { studentId, adminDecision: 'accept'|'reject'|'reset', adminKey }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();
    const { studentId } = body;
    if (!studentId) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

    // Admin final decision path
    if (body.adminDecision !== undefined) {
      if (req.headers.get('x-admin-key') !== 'psna-admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      const { adminDecision } = body;
      if (!['accept', 'reject', 'reset'].includes(adminDecision)) {
        return NextResponse.json({ error: 'Invalid adminDecision' }, { status: 400 });
      }
      
      const studentIds = Array.isArray(studentId) ? studentId : [studentId];
      let update: any;
      
      if (adminDecision === 'accept') {
        update = { $addToSet: { finalAccepted: { $each: studentIds } }, $pullAll: { finalRejected: studentIds } };
      } else if (adminDecision === 'reject') {
        update = { $addToSet: { finalRejected: { $each: studentIds } }, $pullAll: { finalAccepted: studentIds } };
      } else {
        update = { $pullAll: { finalAccepted: studentIds, finalRejected: studentIds } };
      }
      const company = await Company.findOneAndUpdate({ id }, update, { new: true });
      if (!company) return NextResponse.json({ error: 'Drive not found' }, { status: 404 });
      return NextResponse.json({ finalAccepted: company.finalAccepted, finalRejected: company.finalRejected });
    }

    // Student invite accept/decline path
    const { action } = body;
    if (!['accept', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    const update = action === 'accept'
      ? { $addToSet: { acceptedStudents: studentId } }
      : { $pull: { acceptedStudents: studentId } };
    const company = await Company.findOneAndUpdate({ id }, update, { new: true });
    if (!company) return NextResponse.json({ error: 'Drive not found' }, { status: 404 });
    return NextResponse.json({ acceptedStudents: company.acceptedStudents });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    
    const deletedCompany = await Company.findOneAndDelete({ id: id });
    
    if (!deletedCompany) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, message: "Drive deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
