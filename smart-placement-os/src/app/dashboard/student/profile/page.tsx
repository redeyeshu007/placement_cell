"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  MapPin,
  Phone,
  ExternalLink,
  Award,
  Code,
  Briefcase,
  ArrowUpRight,
  GitBranch,
  ChevronRight,
  Pencil,
  X,
  Save,
  Loader2,
  CheckCircle2,
  Lock,
  Link2,
  Unlock,
  SendHorizonal,
  AlertCircle,
  Camera,
} from "lucide-react";
import { useRef } from "react";
import { useEffect, useState, ReactNode } from "react";
import { updateStudent } from "@/lib/api";
import { Student, computePRS } from "@/lib/matching";
import { SkillTagEditor } from "@/components/SkillTagEditor";
import Link from "next/link";

// ─── Locked field helpers (defined at module level to preserve input focus) ───
const lockedInpCls = "w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-semibold outline-none focus:border-[#0f3b9c] focus:ring-2 focus:ring-[#0f3b9c]/10 transition-all";

function EField({
  label, k, type = "text", canEdit, value, onChange,
}: {
  label: string; k: string; type?: string;
  canEdit: boolean; value: string;
  onChange: (k: string, v: string) => void;
}) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</div>
      {canEdit
        ? <input type={type} value={value} onChange={e => onChange(k, e.target.value)} className={lockedInpCls} />
        : <div className="font-semibold text-slate-700 break-words">{value || <span className="text-slate-300 italic font-normal text-xs">Not set</span>}</div>}
    </div>
  );
}

function ESelect({
  label, k, options, canEdit, value, onChange,
}: {
  label: string; k: string; options: string[];
  canEdit: boolean; value: string;
  onChange: (k: string, v: string) => void;
}) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</div>
      {canEdit
        ? <select value={value} onChange={e => onChange(k, e.target.value)} className={lockedInpCls}>
            <option value="">Select</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        : <div className="font-semibold text-slate-700">{value || <span className="text-slate-300 italic font-normal text-xs">Not set</span>}</div>}
    </div>
  );
}

// ─── Edit Modal (skills / hackathons / certifications) ───────────────────────
function EditModal({
  student,
  onClose,
  onSaved,
}: {
  student: Student;
  onClose: () => void;
  onSaved: (updated: Partial<Student>) => void;
}) {
  const [skills, setSkills] = useState<string[]>([...(student.skills ?? [])]);
  const [hackathons, setHackathons] = useState(student.hackathons ?? 0);
  const [certifications, setCertifications] = useState(student.certifications ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await updateStudent(student.id, { skills, hackathons, certifications });
      onSaved({ skills, hackathons, certifications });
      onClose();
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="w-full max-w-xl bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-900">Edit Profile Data</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-md transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto">
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Technical Skills</label>
            <SkillTagEditor skills={skills} onChange={setSkills} />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Hackathons Participated</label>
            <div className="flex items-center gap-3">
              <button onClick={() => setHackathons((n) => Math.max(0, n - 1))} className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 font-bold text-lg hover:bg-slate-200 transition-colors flex items-center justify-center">−</button>
              <span className="text-3xl font-bold text-[#0f3b9c] w-12 text-center tabular-nums">{hackathons}</span>
              <button onClick={() => setHackathons((n) => n + 1)} className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 font-bold text-lg hover:bg-slate-200 transition-colors flex items-center justify-center">+</button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Certifications Earned</label>
            <div className="flex items-center gap-3">
              <button onClick={() => setCertifications((n) => Math.max(0, n - 1))} className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 font-bold text-lg hover:bg-slate-200 transition-colors flex items-center justify-center">−</button>
              <span className="text-3xl font-bold text-[#0f3b9c] w-12 text-center tabular-nums">{certifications}</span>
              <button onClick={() => setCertifications((n) => n + 1)} className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 font-bold text-lg hover:bg-slate-200 transition-colors flex items-center justify-center">+</button>
            </div>
          </div>

          {error && <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-lg">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button onClick={onClose} className="px-5 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-lg bg-[#0f3b9c] text-white text-sm font-semibold hover:bg-blue-800 transition-colors flex items-center gap-2 disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Links Edit Modal (optional profile links) ────────────────────────────────
function LinksModal({
  student,
  onClose,
  onSaved,
}: {
  student: any;
  onClose: () => void;
  onSaved: (updated: Record<string, string>) => void;
}) {
  const [github, setGithub] = useState(student.githubLink ?? "");
  const [linkedin, setLinkedin] = useState(student.linkedinProfile ?? "");
  const [leetcode, setLeetcode] = useState(student.leetcodeUsername ?? "");
  const [hackerrank, setHackerrank] = useState(student.hackerrankProfile ?? "");
  const [resume, setResume] = useState(student.resume_link ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const payload: Record<string, string> = {
        githubLink: github,
        linkedinProfile: linkedin,
        leetcodeUsername: leetcode,
        hackerrankProfile: hackerrank,
        resume_link: resume,
      };
      await updateStudent(student.id, payload);
      onSaved(payload);
      onClose();
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, value: string, setter: (v: string) => void, placeholder: string) => (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => setter(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 font-medium outline-none focus:border-[#0f3b9c] focus:ring-2 focus:ring-[#0f3b9c]/10 transition-all placeholder:text-slate-300"
      />
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-900">Edit Links & Profiles</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-md transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {field("GitHub URL", github, setGithub, "https://github.com/username")}
          {field("LinkedIn URL", linkedin, setLinkedin, "https://linkedin.com/in/username")}
          {field("LeetCode Username", leetcode, setLeetcode, "username")}
          {field("HackerRank URL", hackerrank, setHackerrank, "https://hackerrank.com/username")}
          {field("Resume Link", resume, setResume, "https://drive.google.com/...")}
          {error && <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-lg">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button onClick={onClose} className="px-5 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-lg bg-[#0f3b9c] text-white text-sm font-semibold hover:bg-blue-800 transition-colors flex items-center gap-2 disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving…" : "Save Links"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Request Update Modal ─────────────────────────────────────────────────────
function RequestUpdateModal({ studentId, onClose, onSubmitted }: {
  studentId: string; onClose: () => void; onSubmitted: () => void;
}) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!reason.trim()) { setError("Please enter a reason for the update request."); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/students/${encodeURIComponent(studentId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updateRequested: true, updateReason: reason.trim() }),
      });
      if (!res.ok) throw new Error("Failed to submit request");
      onSubmitted();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="text-base font-bold text-slate-900">Request Profile Update</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-md transition-colors"><X className="w-4 h-4 text-slate-500" /></button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-500">Explain why you need to update your locked details. Admin will review and approve your request.</p>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Reason <span className="text-red-500">*</span></label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={4}
              placeholder="e.g. My email address has changed, need to update contact information..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm outline-none focus:border-[#0f3b9c] focus:ring-4 focus:ring-[#0f3b9c]/5 resize-none transition-all" />
          </div>
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-sm font-semibold text-red-700">{error}</p>
            </div>
          )}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors text-sm">Cancel</button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-[2] py-3 rounded-xl bg-[#0f3b9c] text-white font-bold flex items-center justify-center gap-2 hover:bg-[#0a2d7a] transition-colors text-sm disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <SendHorizonal className="w-4 h-4" />}
            {saving ? "Submitting…" : "Submit Request"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const [student, setStudent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [linksOpen, setLinksOpen] = useState(false);
  const [savedBadge, setSavedBadge] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [freezing, setFreezing] = useState(false);
  const [savingLocked, setSavingLocked] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePincodeChange = async (pin: string) => {
    setLockedFields((p: any) => ({ ...p, postalCode: pin }));
    if (!/^\d{6}$/.test(pin)) return;
    setPincodeLoading(true);
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await res.json();
      if (data[0]?.Status === "Success" && data[0]?.PostOffice?.length) {
        const po = data[0].PostOffice[0];
        setLockedFields((p: any) => ({ ...p, district: po.District, state: po.State }));
      }
    } catch { /* ignore */ }
    finally { setPincodeLoading(false); }
  };

  // Editable locked fields state
  const [lockedFields, setLockedFields] = useState<Record<string, any>>({});

  useEffect(() => {
    const savedId = localStorage.getItem("spos_user_id");
    if (!savedId) return;
    async function loadData() {
      const res = await fetch(`/api/students/${savedId}`);
      if (res.ok) {
        const data = await res.json();
        setStudent(data);
        setLockedFields({
          fatherName: data.fatherName ?? "", gender: data.gender ?? "", section: data.section ?? "",
          dob: data.dob ?? "", nationality: data.nationality ?? "",
          accommodation: data.accommodation ?? "",
          hostelName: data.hostelName ?? "", hostelBlock: data.hostelBlock ?? "", roomNumber: data.roomNumber ?? "",
          email: data.email ?? "", alternateEmail: data.alternateEmail ?? "", phone: data.phone ?? "",
          addressLine1: data.addressLine1 ?? "", addressLine2: data.addressLine2 ?? "",
          district: data.district ?? "", state: data.state ?? "", postalCode: data.postalCode ?? "",
          fatherOccupation: data.fatherOccupation ?? "", fatherPhone: data.fatherPhone ?? "",
          motherName: data.motherName ?? "", motherOccupation: data.motherOccupation ?? "", motherPhone: data.motherPhone ?? "",
          tenthPercent: data.tenthPercent ?? "", tenthYearOfPassing: data.tenthYearOfPassing ?? "", tenthSchool: data.tenthSchool ?? "",
          twelfthPercent: data.twelfthPercent ?? "", twelfthYearOfPassing: data.twelfthYearOfPassing ?? "", twelfthSchool: data.twelfthSchool ?? "",
          aadharNumber: data.aadharNumber ?? "", hasPanCard: data.hasPanCard ?? false, panCardNumber: data.panCardNumber ?? "",
          hasPassport: data.hasPassport ?? false, passportNumber: data.passportNumber ?? "",
          certificationName: data.certificationName ?? "", certificationDuration: data.certificationDuration ?? "", certificationVendor: data.certificationVendor ?? "",
          activeBacklogs: data.activeBacklogs ?? 0, totalBacklogs: data.totalBacklogs ?? 0,
        });
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleSaved = (updated: Record<string, any>) => {
    setStudent((prev: any) => prev ? { ...prev, ...updated } : prev);
    setSavedBadge(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      // Compress via canvas
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.src = url;
      await new Promise(r => { img.onload = r; });
      const canvas = document.createElement("canvas");
      const MAX = 300;
      const ratio = Math.min(MAX / img.width, MAX / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const base64 = canvas.toDataURL("image/jpeg", 0.8);
      await fetch(`/api/students/${encodeURIComponent(s.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profilePhoto: base64 }),
      });
      setStudent((prev: any) => prev ? { ...prev, profilePhoto: base64 } : prev);
      setSavedBadge(true);
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  };

  const handleSaveLockedFields = async () => {
    const acc = lockedFields.accommodation ?? "";
    const isHosteller = acc === "Hosteller" || acc === "Hosteler";
    if (isHosteller) {
      if (!lockedFields.hostelName) { alert("Hostel Name is required"); return; }
      if (!lockedFields.hostelBlock) { alert("Hostel Block is required"); return; }
      if (!lockedFields.roomNumber) { alert("Room Number is required"); return; }
    }
    setSavingLocked(true);
    try {
      const payload = { ...lockedFields };
      if (acc === "Day Scholar") {
        payload.hostelName = "";
        payload.hostelBlock = "";
        payload.roomNumber = "";
      }
      if (lockedFields.addressLine1) {
        payload.address = `${lockedFields.addressLine1}, ${lockedFields.addressLine2}, ${lockedFields.district}, ${lockedFields.state} - ${lockedFields.postalCode}`;
      }
      await fetch(`/api/students/${encodeURIComponent(s.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setStudent((prev: any) => prev ? { ...prev, ...payload } : prev);
      setSavedBadge(true);
    } finally {
      setSavingLocked(false);
    }
  };

  const handleDoneUpdating = async () => {
    setFreezing(true);
    try {
      await fetch(`/api/students/${encodeURIComponent(s?.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updateApproved: false, updateRequested: false, updateReason: "", profileComplete: true }),
      });
      setStudent((prev: any) => prev ? { ...prev, updateApproved: false, updateRequested: false, profileComplete: true } : prev);
      setSavedBadge(true);
    } finally {
      setFreezing(false);
    }
  };

  useEffect(() => {
    if (!savedBadge) return;
    const t = setTimeout(() => setSavedBadge(false), 3000);
    return () => clearTimeout(t);
  }, [savedBadge]);

  if (loading || !student)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#0f3b9c]">
        <div className="w-10 h-10 border-4 border-[#0f3b9c]/20 border-t-[#0f3b9c] rounded-full animate-spin mb-4" />
        <div className="text-sm font-semibold tracking-wide">Compiling Portfolio Data...</div>
      </div>
    );

  const s = student as any;

  return (
    <div className="space-y-10 pt-10 pb-24">
      <AnimatePresence>
        {savedBadge && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white text-sm font-semibold rounded-xl shadow-lg"
          >
            <CheckCircle2 className="w-4 h-4" /> Profile updated successfully
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Header Card */}
      <section className="bg-white rounded-[2rem] border border-slate-200 p-8 md:p-12 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#0f3b9c]/5 rounded-full blur-[80px] -mr-32 -mt-32" />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          <div className="relative shrink-0 group cursor-pointer" onClick={() => photoInputRef.current?.click()}>
            <div className="w-40 h-40 rounded-3xl bg-[#0f3b9c] flex items-center justify-center text-white text-6xl font-bold shadow-xl shadow-[#0f3b9c]/20 overflow-hidden">
              {s.profilePhoto
                ? <img src={s.profilePhoto} alt="Profile" className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                : <span>{s.name?.[0]?.toUpperCase() ?? "?"}</span>}
            </div>
            <div className="absolute inset-0 rounded-3xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {uploadingPhoto
                ? <Loader2 className="w-8 h-8 text-white animate-spin" />
                : <Camera className="w-8 h-8 text-white" />}
            </div>
            <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </div>

          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">{s.name}</h1>
              <div className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest border border-emerald-100 w-fit mx-auto md:mx-0">
                Verified Candidate
              </div>
            </div>

            <p className="text-lg font-semibold text-[#0f3b9c] uppercase tracking-wide">
              {s.dept}{(s as any).batch != null ? ` • Batch ${(s as any).batch}` : ''} • Reg: {s.id}
            </p>

            <div className="flex flex-wrap justify-center md:justify-start gap-6 pt-2">
              {s.email && (
                <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
                  <Mail className="w-4 h-4 text-slate-400" />
                  {s.email}
                </div>
              )}
              {s.phone && (
                <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
                  <Phone className="w-4 h-4 text-slate-400" />
                  {s.phone}
                </div>
              )}
              {s.address && (
                <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {s.address}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <button onClick={() => setEditOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-[#0f3b9c] hover:text-white text-sm font-bold transition-all border border-slate-200">
              <Pencil className="w-4 h-4" /> Edit Profile
            </button>
            {/* Update request controls */}
            {s.profileComplete && !s.updateApproved && !s.updateRequested && s.profileComplete && (
              <button onClick={() => setRequestOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 text-sm font-bold transition-all border border-amber-200">
                <Unlock className="w-4 h-4" /> Request Update
              </button>
            )}
            {s.profileComplete && s.updateRequested && !s.updateApproved && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Pending Admin Approval
              </div>
            )}
            {(s.updateApproved || !s.profileComplete) && (
              <button onClick={handleDoneUpdating} disabled={freezing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-sm font-bold transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-60">
                {freezing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Done Updating
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-8">
          {/* Academic Standing */}
          <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-8">Academic Standing</h3>
            <div className="space-y-8">
              <div className="flex items-end gap-2">
                <span className="text-7xl font-extrabold text-[#0f3b9c] tracking-tighter leading-none">{s.cgpa ?? "—"}</span>
                <div className="mb-1">
                  <span className="text-sm font-bold text-slate-400 uppercase block">CGPA</span>
                  {s.cgpaSemester && <span className="text-[10px] text-slate-400">Sem {s.cgpaSemester}</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="text-xl font-bold text-slate-900">{s.activeBacklogs ?? 0}</div>
                  <div className="text-[9px] font-bold uppercase text-slate-400">Arrears</div>
                </div>
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="text-xl font-bold text-slate-900">{s.certifications ?? 0}</div>
                  <div className="text-[9px] font-bold uppercase text-slate-400">Badges</div>
                </div>
              </div>
            </div>
          </div>

          {/* Locked / Editable Details */}
          {(() => {
            const canEdit = s.updateApproved || !s.profileComplete;
            const lf = lockedFields;
            const setLF = (k: string, v: string) => setLockedFields((p: any) => ({ ...p, [k]: v }));

            return (
              <>
                <div className={`bg-white rounded-[2rem] border p-8 shadow-sm ${canEdit ? "border-emerald-200" : "border-amber-100"}`}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      {canEdit ? <Unlock className="w-4 h-4 text-emerald-500" /> : <Lock className="w-4 h-4 text-amber-500" />}
                      <h3 className={`text-xs font-bold uppercase tracking-[0.2em] ${canEdit ? "text-emerald-600" : "text-amber-600"}`}>
                        {canEdit ? "Editable Details" : "Locked Details"}
                      </h3>
                    </div>
                    {canEdit && (
                      <button onClick={handleSaveLockedFields} disabled={savingLocked}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0f3b9c] text-white text-xs font-bold hover:bg-[#0a2d7a] transition-colors disabled:opacity-60">
                        {savingLocked ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Save
                      </button>
                    )}
                  </div>

                  <div className="space-y-4 text-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Personal</p>
                    <EField label="Father's Name" k="fatherName" canEdit={canEdit} value={lf.fatherName ?? ""} onChange={setLF} />
                    <ESelect
                      label="Gender"
                      k="gender"
                      options={["Male", "Female"]}
                      canEdit={canEdit}
                      value={lf.gender ?? ""}
                      onChange={(k, v) => {
                        setLockedFields((p: any) => {
                          const next = { ...p, [k]: v };
                          const isHosteller = (p.accommodation ?? "") === "Hosteller" || (p.accommodation ?? "") === "Hosteler";
                          if (v === "Female" && isHosteller) next.hostelName = "Girls Hostel";
                          return next;
                        });
                      }}
                    />
                    <ESelect label="Section" k="section" options={["A", "B", "C", "D"]} canEdit={canEdit} value={lf.section ?? ""} onChange={setLF} />
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Date of Birth</div>
                      {canEdit
                        ? <input
                            type="date"
                            value={lf.dob ? lf.dob.split('.').reverse().join('-') : ''}
                            onChange={e => {
                              const [y, m, d] = e.target.value.split('-');
                              setLF('dob', e.target.value ? `${d}.${m}.${y}` : '');
                            }}
                            max={new Date().toISOString().split('T')[0]}
                            className={lockedInpCls}
                          />
                        : <div className="font-semibold text-slate-700">{lf.dob || <span className="text-slate-300 italic font-normal text-xs">Not set</span>}</div>}
                    </div>
                    <EField label="Nationality" k="nationality" canEdit={canEdit} value={lf.nationality ?? ""} onChange={setLF} />
                    <ESelect
                      label="Hostel Status"
                      k="accommodation"
                      options={["Day Scholar", "Hosteller"]}
                      canEdit={canEdit}
                      value={lf.accommodation ?? ""}
                      onChange={(k, v) => {
                        setLockedFields((p: any) => {
                          const next = { ...p, [k]: v };
                          if (v === "Day Scholar") {
                            next.hostelName = "";
                            next.hostelBlock = "";
                            next.roomNumber = "";
                          } else if (v === "Hosteller" && (p.gender === "Female")) {
                            next.hostelName = "Girls Hostel";
                          }
                          return next;
                        });
                      }}
                    />
                    {(() => {
                      const acc = lf.accommodation ?? s.accommodation ?? "";
                      const isHosteller = acc === "Hosteller" || acc === "Hosteler";
                      if (!isHosteller) return null;
                      const isFemale = (lf.gender ?? s.gender) === "Female";
                      return (
                        <div className="space-y-3 p-3 rounded-xl bg-blue-50/40 border border-blue-100">
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Hostel Name</div>
                            {canEdit ? (
                              <>
                                <select
                                  value={lf.hostelName ?? ""}
                                  onChange={e => setLF("hostelName", e.target.value)}
                                  disabled={isFemale}
                                  className={`${lockedInpCls} ${isFemale ? "opacity-70 cursor-not-allowed bg-amber-50 border-amber-200" : ""}`}
                                >
                                  <option value="">Select hostel</option>
                                  <option value="New Gents Hostel">New Gents Hostel</option>
                                  <option value="NRI Hostel">NRI Hostel</option>
                                  <option value="Girls Hostel">Girls Hostel</option>
                                </select>
                                {isFemale && (
                                  <p className="text-[10px] font-semibold text-amber-700 mt-1 flex items-center gap-1">
                                    <Lock className="w-3 h-3" /> Auto-set to Girls Hostel
                                  </p>
                                )}
                              </>
                            ) : (
                              <div className="font-semibold text-slate-700">{lf.hostelName || <span className="text-slate-300 italic font-normal text-xs">Not set</span>}</div>
                            )}
                          </div>
                          <EField label="Hostel Block" k="hostelBlock" canEdit={canEdit} value={lf.hostelBlock ?? ""} onChange={setLF} />
                          <EField label="Room Number" k="roomNumber" canEdit={canEdit} value={lf.roomNumber ?? ""} onChange={setLF} />
                        </div>
                      );
                    })()}

                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 pt-2">Contact</p>
                    <EField label="Personal Email" k="email" type="email" canEdit={canEdit} value={lf.email ?? ""} onChange={setLF} />
                    <EField label="PSNA Email" k="alternateEmail" type="email" canEdit={canEdit} value={lf.alternateEmail ?? ""} onChange={setLF} />
                    <EField label="Mobile (WhatsApp)" k="phone" type="tel" canEdit={canEdit} value={lf.phone ?? ""} onChange={setLF} />

                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 pt-2">Address</p>
                    <EField label="Address Line 1" k="addressLine1" canEdit={canEdit} value={lf.addressLine1 ?? ""} onChange={setLF} />
                    <EField label="Address Line 2" k="addressLine2" canEdit={canEdit} value={lf.addressLine2 ?? ""} onChange={setLF} />
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Postal Code</div>
                      {canEdit
                        ? <div className="relative">
                            <input
                              type="text"
                              value={lf.postalCode ?? ""}
                              onChange={e => handlePincodeChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              placeholder="Enter 6-digit pincode"
                              maxLength={6}
                              className={lockedInpCls}
                            />
                            {pincodeLoading && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#0f3b9c]/30 border-t-[#0f3b9c] rounded-full animate-spin" />
                            )}
                          </div>
                        : <div className="font-semibold text-slate-700">{lf.postalCode || <span className="text-slate-300 italic font-normal text-xs">Not set</span>}</div>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <EField label="District" k="district" canEdit={canEdit} value={lf.district ?? ""} onChange={setLF} />
                      <EField label="State" k="state" canEdit={canEdit} value={lf.state ?? ""} onChange={setLF} />
                    </div>

                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 pt-2">Parent Details</p>
                    <EField label="Father's Occupation" k="fatherOccupation" canEdit={canEdit} value={lf.fatherOccupation ?? ""} onChange={setLF} />
                    <EField label="Father's Mobile" k="fatherPhone" type="tel" canEdit={canEdit} value={lf.fatherPhone ?? ""} onChange={setLF} />
                    <EField label="Mother's Name" k="motherName" canEdit={canEdit} value={lf.motherName ?? ""} onChange={setLF} />
                    <EField label="Mother's Occupation" k="motherOccupation" canEdit={canEdit} value={lf.motherOccupation ?? ""} onChange={setLF} />
                    <EField label="Mother's Mobile" k="motherPhone" type="tel" canEdit={canEdit} value={lf.motherPhone ?? ""} onChange={setLF} />
                  </div>

                  {!canEdit && (
                    <p className="mt-5 text-[10px] text-amber-600 font-semibold bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                      Use "Request Update" to ask admin for permission to edit.
                    </p>
                  )}
                </div>

                {/* Academic Marks */}
                <div className={`bg-white rounded-[2rem] border p-8 shadow-sm ${canEdit ? "border-emerald-200" : "border-slate-200"}`}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      {canEdit ? <Unlock className="w-4 h-4 text-emerald-500" /> : <Lock className="w-4 h-4 text-amber-500" />}
                      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">Academic Marks</h3>
                    </div>
                    {canEdit && (
                      <button onClick={handleSaveLockedFields} disabled={savingLocked}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0f3b9c] text-white text-xs font-bold hover:bg-[#0a2d7a] transition-colors disabled:opacity-60">
                        {savingLocked ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Save
                      </button>
                    )}
                  </div>
                  <div className="space-y-4 text-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">10th Standard</p>
                    <div className="grid grid-cols-2 gap-3">
                      <EField label="10th %" k="tenthPercent" type="number" canEdit={canEdit} value={String(lf.tenthPercent ?? "")} onChange={setLF} />
                      <EField label="Year of Passing" k="tenthYearOfPassing" type="number" canEdit={canEdit} value={String(lf.tenthYearOfPassing ?? "")} onChange={setLF} />
                    </div>
                    <EField label="School Name" k="tenthSchool" canEdit={canEdit} value={lf.tenthSchool ?? ""} onChange={setLF} />

                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 pt-2">12th Standard</p>
                    <div className="grid grid-cols-2 gap-3">
                      <EField label="12th %" k="twelfthPercent" type="number" canEdit={canEdit} value={String(lf.twelfthPercent ?? "")} onChange={setLF} />
                      <EField label="Year of Passing" k="twelfthYearOfPassing" type="number" canEdit={canEdit} value={String(lf.twelfthYearOfPassing ?? "")} onChange={setLF} />
                    </div>
                    <EField label="School Name" k="twelfthSchool" canEdit={canEdit} value={lf.twelfthSchool ?? ""} onChange={setLF} />

                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 pt-2">Arrears</p>
                    <div className="grid grid-cols-2 gap-3">
                      <EField label="Active Arrears" k="activeBacklogs" type="number" canEdit={canEdit} value={String(lf.activeBacklogs ?? "")} onChange={setLF} />
                      <EField label="Total History" k="totalBacklogs" type="number" canEdit={canEdit} value={String(lf.totalBacklogs ?? "")} onChange={setLF} />
                    </div>

                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 pt-2">Certification</p>
                    <EField label="Certification Name" k="certificationName" canEdit={canEdit} value={lf.certificationName ?? ""} onChange={setLF} />
                    <EField label="Duration" k="certificationDuration" canEdit={canEdit} value={lf.certificationDuration ?? ""} onChange={setLF} />
                    <EField label="Vendor / Authority" k="certificationVendor" canEdit={canEdit} value={lf.certificationVendor ?? ""} onChange={setLF} />
                  </div>
                </div>

                {/* Identity Documents */}
                <div className={`bg-white rounded-[2rem] border p-8 shadow-sm ${canEdit ? "border-emerald-200" : "border-slate-200"}`}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      {canEdit ? <Unlock className="w-4 h-4 text-emerald-500" /> : <Lock className="w-4 h-4 text-amber-500" />}
                      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">Identity Documents</h3>
                    </div>
                    {canEdit && (
                      <button onClick={handleSaveLockedFields} disabled={savingLocked}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0f3b9c] text-white text-xs font-bold hover:bg-[#0a2d7a] transition-colors disabled:opacity-60">
                        {savingLocked ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Save
                      </button>
                    )}
                  </div>
                  <div className="space-y-4 text-sm">
                    <EField label="Aadhar Number (12 digits)" k="aadharNumber" canEdit={canEdit} value={lf.aadharNumber ?? ""} onChange={setLF} />
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">PAN Card</div>
                      {canEdit
                        ? <div className="space-y-2">
                            <div className="flex gap-3">
                              {["Yes", "No"].map(o => (
                                <button key={o} type="button"
                                  onClick={() => setLockedFields((p: any) => ({ ...p, hasPanCard: o === "Yes" }))}
                                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${lf.hasPanCard === (o === "Yes") ? "bg-[#0f3b9c] text-white border-[#0f3b9c]" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                                  {o}
                                </button>
                              ))}
                            </div>
                            {lf.hasPanCard && <input value={lf.panCardNumber ?? ""} onChange={e => setLF("panCardNumber", e.target.value)} placeholder="PAN number" className={lockedInpCls} />}
                          </div>
                        : <div className="font-semibold text-slate-700">{lf.hasPanCard ? lf.panCardNumber || "Available" : "Not Available"}</div>}
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Passport</div>
                      {canEdit
                        ? <div className="space-y-2">
                            <div className="flex gap-3">
                              {["Yes", "No"].map(o => (
                                <button key={o} type="button"
                                  onClick={() => setLockedFields((p: any) => ({ ...p, hasPassport: o === "Yes" }))}
                                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${lf.hasPassport === (o === "Yes") ? "bg-[#0f3b9c] text-white border-[#0f3b9c]" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                                  {o}
                                </button>
                              ))}
                            </div>
                            {lf.hasPassport && <input value={lf.passportNumber ?? ""} onChange={e => setLF("passportNumber", e.target.value)} placeholder="Passport number" className={lockedInpCls} />}
                          </div>
                        : <div className="font-semibold text-slate-700">{lf.hasPassport ? lf.passportNumber || "Available" : "Not Available"}</div>}
                    </div>
                  </div>
                </div>
              </>
            );
          })()}

          {/* Quick Connect */}
          <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-xl shadow-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Quick Connect</h3>
              <button
                onClick={() => setLinksOpen(true)}
                className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-white transition-colors"
              >
                <Link2 className="w-3.5 h-3.5" /> Edit Links
              </button>
            </div>
            <div className="space-y-3">
              {s.githubLink && (
                <Link href={s.githubLink} target="_blank" className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all group">
                  <div className="flex items-center gap-3">
                    <GitBranch className="w-5 h-5 text-slate-400 group-hover:text-white" />
                    <span className="text-xs font-bold tracking-wide">GitHub</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 opacity-40 group-hover:opacity-100" />
                </Link>
              )}
              {s.linkedinProfile && (
                <Link href={s.linkedinProfile} target="_blank" className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all group">
                  <div className="flex items-center gap-3">
                    <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-white" />
                    <span className="text-xs font-bold tracking-wide">LinkedIn</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 opacity-40 group-hover:opacity-100" />
                </Link>
              )}
              {s.resume_link && (
                <Link href={s.resume_link} target="_blank" className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all group">
                  <div className="flex items-center gap-3">
                    <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-white" />
                    <span className="text-xs font-bold tracking-wide">Digital Resume</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 opacity-40 group-hover:opacity-100" />
                </Link>
              )}
              {(s as any).resumePdf && (
                <button
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = (s as any).resumePdf;
                    a.download = `${s.name?.replace(/\s+/g, '_') || 'resume'}.pdf`;
                    a.click();
                  }}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-white" />
                    <span className="text-xs font-bold tracking-wide">Download Resume PDF</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 opacity-40 group-hover:opacity-100" />
                </button>
              )}
              {!s.githubLink && !s.linkedinProfile && !s.resume_link && !(s as any).resumePdf && (
                <button onClick={() => setLinksOpen(true)} className="w-full text-center text-xs text-slate-500 hover:text-white transition-colors py-2">
                  + Add your links
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="lg:col-span-8 space-y-12">
          {/* Skills */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="flex items-center gap-3 text-lg font-bold text-slate-900">
                <Code className="w-5 h-5 text-[#0f3b9c]" /> Specialized Skills
              </h2>
              <button onClick={() => setEditOpen(true)} className="flex items-center gap-1.5 text-xs font-bold text-[#0f3b9c] hover:underline">
                <Pencil className="w-3.5 h-3.5" /> Edit Skills
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              {(s.skills ?? []).length > 0 ? (
                s.skills.map((skill: string, i: number) => (
                  <motion.div
                    key={skill}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wide hover:border-[#0f3b9c] hover:text-[#0f3b9c] transition-all cursor-default shadow-sm"
                  >
                    {skill}
                  </motion.div>
                ))
              ) : (
                <p className="text-sm text-slate-400 italic">
                  No skills added yet.{" "}
                  <button onClick={() => setEditOpen(true)} className="text-[#0f3b9c] font-semibold hover:underline">Add your first skill →</button>
                </p>
              )}
            </div>
          </section>

          {/* Achievements */}
          <section className="pt-10 border-t border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <h2 className="flex items-center gap-3 text-lg font-bold text-slate-900">
                <Award className="w-5 h-5 text-[#0f3b9c]" /> Professional Milestones
              </h2>
              <button onClick={() => setEditOpen(true)} className="flex items-center gap-1.5 text-xs font-bold text-[#0f3b9c] hover:underline">
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <AchievementCard
                icon={<Briefcase className="text-blue-500" />}
                title="Hackathons"
                value={String(s.hackathons ?? 0)}
                desc="Major development competitions completed."
              />
              <AchievementCard
                icon={<Award className="text-amber-500" />}
                title="Certifications"
                value={String(s.certifications ?? 0)}
                desc="Verified industry certifications earned."
              />
            </div>
          </section>

          {/* Readiness Card */}
          <section className="bg-slate-50 rounded-[2rem] border border-slate-200 p-8 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold text-slate-900 mb-1 uppercase tracking-tight">Placement Quotient</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Industry Readiness Level Assessment</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-4xl font-extrabold text-[#0f3b9c]">
                  {computePRS(student as Student).composite}%
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">System Score</div>
              </div>
              <Link href="/dashboard/student/prs" className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#0f3b9c] shadow-sm hover:bg-[#0f3b9c] hover:text-white transition-all">
                <ChevronRight className="w-6 h-6" />
              </Link>
            </div>
          </section>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {requestOpen && (
          <RequestUpdateModal
            studentId={s.id}
            onClose={() => setRequestOpen(false)}
            onSubmitted={() => setStudent((prev: any) => prev ? { ...prev, updateRequested: true } : prev)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {editOpen && (
          <EditModal
            student={student as Student}
            onClose={() => setEditOpen(false)}
            onSaved={handleSaved}
          />
        )}
        {linksOpen && (
          <LinksModal
            student={s}
            onClose={() => setLinksOpen(false)}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AchievementCard({ icon, title, value, desc }: { icon: ReactNode; title: string; value: string; desc: string }) {
  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-100 hover:border-[#0f3b9c]/30 transition-all group shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <span className="text-3xl font-extrabold text-[#0f3b9c] tracking-tight">{value}</span>
      </div>
      <h4 className="text-xs font-bold uppercase tracking-widest text-slate-900 mb-2">{title}</h4>
      <p className="text-xs font-medium text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}
