import mongoose, { Schema, Document } from 'mongoose';

export interface ICompany extends Document {
  id: string;
  name: string;
  role: string;
  salary: string;
  requirementType: 'open' | 'skill-based' | 'interested';
  requiredSkills: string[];
  prioritySkills: string[];
  minCgpa: number;
  allowedBacklogs: number;
  noHistoryOfArrears: boolean;
  selectCount: number;
  min10thPercent: number;
  min12thPercent: number;
  acceptedStudents: string[];   // student IDs who accepted the invite (interested drives)
  finalAccepted: string[];      // admin-confirmed selections
  finalRejected: string[];      // admin-rejected from shortlist
}

const CompanySchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  role: { type: String, default: 'Software Engineer' },
  salary: { type: String, default: '' },
  requirementType: { type: String, enum: ['open', 'skill-based', 'interested'], default: 'open' },
  requiredSkills: { type: [String], default: [] },
  prioritySkills: { type: [String], default: [] },
  minCgpa: { type: Number, default: 0 },
  allowedBacklogs: { type: Number, default: -1 },
  noHistoryOfArrears: { type: Boolean, default: false },
  selectCount: { type: Number, default: 0 }, // 0 = no hard cap
  min10thPercent: { type: Number, default: 0 },
  min12thPercent: { type: Number, default: 0 },
  acceptedStudents: { type: [String], default: [] },
  finalAccepted: { type: [String], default: [] },
  finalRejected: { type: [String], default: [] },
}, {
  timestamps: true,
  id: false,
});

delete (mongoose.models as Record<string, unknown>).Company;
export default mongoose.model<ICompany>('Company', CompanySchema);
