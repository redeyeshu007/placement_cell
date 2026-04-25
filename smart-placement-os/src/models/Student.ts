import mongoose, { Schema, Document } from 'mongoose';

export interface IStudent extends Document {
  id: string;
  name: string;
  dept: string;
  cgpa: number;
  cgpaSemester?: number;
  totalBacklogs: number;
  activeBacklogs: number;
  skills: string[];
  hackathons: number;
  certifications: number;

  // Batch
  batch?: number;
  profilePhoto?: string;

  // Auth
  password?: string;

  // Mandatory profile fields — locked after profileComplete = true, admin-only editable
  // Personal
  firstName?: string;
  fatherName?: string;
  fullNameWithInitial?: string;
  gender?: string;
  section?: string;
  dob?: string;
  nationality?: string;
  accommodation?: string;
  hostelName?: string;
  hostelBlock?: string;
  roomNumber?: string;
  email?: string;
  alternateEmail?: string;
  phone?: string;
  fatherOccupation?: string;
  fatherPhone?: string;
  motherName?: string;
  motherOccupation?: string;
  motherPhone?: string;
  // Academic marks
  tenthPercent?: number;
  tenthYearOfPassing?: number;
  tenthSchool?: string;
  twelfthPercent?: number;
  twelfthYearOfPassing?: number;
  twelfthSchool?: string;
  diplomaYearAdmitted?: number;
  diplomaPercent?: number;
  diplomaYearOfPassing?: number;
  allSubjectsClearedFirstAttempt?: boolean;
  certificationName?: string;
  certificationDuration?: string;
  certificationVendor?: string;
  // Identity
  aadharNumber?: string;
  hasPanCard?: boolean;
  panCardNumber?: string;
  hasPassport?: boolean;
  passportNumber?: string;
  // Address (split)
  addressLine1?: string;
  addressLine2?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  // Legacy single-field address
  address?: string;
  profileComplete?: boolean;
  updateRequested?: boolean;
  updateReason?: string;
  updateApproved?: boolean;

  // Optional profile fields — always editable by student
  resume_link?: string;
  resumePdf?: string;
  githubLink?: string;
  linkedinProfile?: string;
  hackerrankProfile?: string;
  domain?: string;
  leetcodeUsername?: string;
  leetcodeSolved?: number;
  leetcodeEasy?: number;
  leetcodeMedium?: number;
  leetcodeHard?: number;
  leetcodeRanking?: number;
  leetcodeLastSync?: Date;
  resumeProjects?: string[];
  validatedProjectsCount?: number;
  resumeStrengthScore?: number;
  resumeStrengthLevel?: string;
  resumeExperienceScore?: number;
  resumeExperienceLevel?: string;
  resumeExperienceSummary?: string;
  resumeRawText?: string;
  quizBonusScore?: number;
  lastQuizDate?: string;
}

const StudentSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, default: '' },
  dept: { type: String, default: '' },
  cgpa: { type: Number, default: 0 },
  cgpaSemester: { type: Number },
  totalBacklogs: { type: Number, default: 0 },
  activeBacklogs: { type: Number, default: 0 },
  skills: { type: [String], default: [] },
  hackathons: { type: Number, default: 0 },
  certifications: { type: Number, default: 0 },

  batch: { type: Number },
  profilePhoto: { type: String },
  password: { type: String },

  firstName: { type: String },
  fatherName: { type: String },
  fullNameWithInitial: { type: String },
  gender: { type: String },
  section: { type: String },
  dob: { type: String },
  nationality: { type: String },
  accommodation: { type: String },
  hostelName: { type: String },
  hostelBlock: { type: String },
  roomNumber: { type: String },
  email: { type: String },
  alternateEmail: { type: String },
  address: { type: String },
  phone: { type: String },
  fatherOccupation: { type: String },
  fatherPhone: { type: String },
  motherName: { type: String },
  motherOccupation: { type: String },
  motherPhone: { type: String },
  tenthPercent: { type: Number },
  tenthYearOfPassing: { type: Number },
  tenthSchool: { type: String },
  twelfthPercent: { type: Number },
  twelfthYearOfPassing: { type: Number },
  twelfthSchool: { type: String },
  diplomaYearAdmitted: { type: Number },
  diplomaPercent: { type: Number },
  diplomaYearOfPassing: { type: Number },
  allSubjectsClearedFirstAttempt: { type: Boolean },
  certificationName: { type: String },
  certificationDuration: { type: String },
  certificationVendor: { type: String },
  aadharNumber: { type: String },
  hasPanCard: { type: Boolean },
  panCardNumber: { type: String },
  hasPassport: { type: Boolean },
  passportNumber: { type: String },
  addressLine1: { type: String },
  addressLine2: { type: String },
  district: { type: String },
  state: { type: String },
  postalCode: { type: String },
  profileComplete: { type: Boolean, default: false },
  updateRequested: { type: Boolean, default: false },
  updateReason: { type: String },
  updateApproved: { type: Boolean, default: false },

  resume_link: { type: String },
  resumePdf: { type: String },
  githubLink: { type: String },
  linkedinProfile: { type: String },
  hackerrankProfile: { type: String },
  domain: { type: String },
  leetcodeUsername: { type: String },
  leetcodeSolved: { type: Number },
  leetcodeEasy: { type: Number },
  leetcodeMedium: { type: Number },
  leetcodeHard: { type: Number },
  leetcodeRanking: { type: Number },
  leetcodeLastSync: { type: Date },
  resumeProjects: { type: [String], default: [] },
  validatedProjectsCount: { type: Number, default: 0 },
  resumeStrengthScore: { type: Number },
  resumeStrengthLevel: { type: String },
  resumeExperienceScore: { type: Number },
  resumeExperienceLevel: { type: String },
  resumeExperienceSummary: { type: String },
  resumeRawText: { type: String },
  quizBonusScore: { type: Number, default: 50 },
  lastQuizDate: { type: String },
}, { timestamps: true });

// Indexes for fast queries on 1000+ student datasets
StudentSchema.index({ batch: 1 });
StudentSchema.index({ dept: 1 });
StudentSchema.index({ cgpa: -1 });
StudentSchema.index({ activeBacklogs: 1 });
StudentSchema.index({ batch: 1, dept: 1 });
StudentSchema.index({ batch: 1, cgpa: -1 });
StudentSchema.index({ profileComplete: 1 });

// Force re-registration so new indexes are always applied.
// Safe because the schema is deterministic and idempotent in MongoDB.
delete (mongoose.models as Record<string, unknown>).Student;
export default mongoose.model<IStudent>('Student', StudentSchema);
