"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import {
  LayoutDashboard,
  Building2,
  UserCircle,
  LogOut,
  BarChart2,
  Brain,
  FileText,
  GitBranch,
  Menu,
  X,
  Lock,
  Pencil,
  Save,
  Loader2,
  CheckCircle2,
  ChevronRight,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

const studentItems = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard/student" },
  { name: "Companies", icon: Building2, href: "/dashboard/student/companies" },
  { name: "Profile", icon: UserCircle, href: "/dashboard/student/profile" },
  { name: "PRS", icon: BarChart2, href: "/dashboard/student/prs" },
  { name: "Quiz", icon: Brain, href: "/dashboard/student/quiz" },
  { name: "Resume", icon: FileText, href: "/dashboard/student/resume" },
  { name: "Github", icon: GitBranch, href: "/dashboard/student/github" },
];

const adminItems = [
  { name: "Admin Panel", icon: LayoutDashboard, href: "/dashboard/admin" },
];

const DEPTS = ["CSE", "IT", "ECE", "EEE", "MECH", "CIVIL", "AIDS", "AIML", "CSD", "Other"];

// ─── Profile Drawer ───────────────────────────────────────────────────────────
function ProfileDrawer({
  studentId,
  onClose,
}: {
  studentId: string;
  onClose: () => void;
}) {
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // form state — mandatory
  const [name, setName] = useState("");
  const [dept, setDept] = useState("");
  const [cgpa, setCgpa] = useState("");
  const [cgpaSem, setCgpaSem] = useState<number | "">(1);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [fatherOccupation, setFatherOccupation] = useState("");
  const [fatherPhone, setFatherPhone] = useState("");
  const [motherName, setMotherName] = useState("");
  const [motherOccupation, setMotherOccupation] = useState("");
  const [motherPhone, setMotherPhone] = useState("");

  // form state — optional
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [leetcode, setLeetcode] = useState("");
  const [hackerrank, setHackerrank] = useState("");
  const [resumeLink, setResumeLink] = useState("");

  useEffect(() => {
    fetch(`/api/students/${studentId}`)
      .then((r) => r.json())
      .then((data) => {
        setStudent(data);
        setName(data.name ?? "");
        setDept(data.dept ?? "");
        setCgpa(data.cgpa ?? "");
        setCgpaSem(data.cgpaSemester ?? 1);
        setEmail(data.email ?? "");
        setPhone(data.phone ?? "");
        setAddress(data.address ?? "");
        setFatherOccupation(data.fatherOccupation ?? "");
        setFatherPhone(data.fatherPhone ?? "");
        setMotherName(data.motherName ?? "");
        setMotherOccupation(data.motherOccupation ?? "");
        setMotherPhone(data.motherPhone ?? "");
        setGithub(data.githubLink ?? "");
        setLinkedin(data.linkedinProfile ?? "");
        setLeetcode(data.leetcodeUsername ?? "");
        setHackerrank(data.hackerrankProfile ?? "");
        setResumeLink(data.resume_link ?? "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [studentId]);

  const frozen = student?.profileComplete === true;

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const payload: Record<string, any> = {
        githubLink: github,
        linkedinProfile: linkedin,
        leetcodeUsername: leetcode,
        hackerrankProfile: hackerrank,
        resume_link: resumeLink,
      };

      if (!frozen) {
        payload.name = name;
        payload.dept = dept;
        payload.cgpa = parseFloat(cgpa) || 0;
        payload.cgpaSemester = Number(cgpaSem);
        payload.email = email;
        payload.phone = phone;
        payload.address = address;
        payload.fatherOccupation = fatherOccupation;
        payload.fatherPhone = fatherPhone;
        payload.motherName = motherName;
        payload.motherOccupation = motherOccupation;
        payload.motherPhone = motherPhone;
      }

      const res = await fetch(`/api/students/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? `Server error ${res.status}`);
      }

      const updated = await res.json();
      setStudent(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message ?? "Error saving. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const LockedField = ({ label, value }: { label: string; value: string }) => (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <Lock className="w-3 h-3 text-amber-400" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
      </div>
      <div className="w-full bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700">
        {value || <span className="text-slate-300 font-normal italic">Not set</span>}
      </div>
    </div>
  );

  const InputField = ({
    label, value, setter, type = "text", placeholder = "",
  }: {
    label: string; value: string; setter: (v: string) => void; type?: string; placeholder?: string;
  }) => (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => setter(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-[#0f3b9c] focus:ring-2 focus:ring-[#0f3b9c]/10 transition-all placeholder:text-slate-300"
      />
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex justify-end"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">My Profile</h2>
            {frozen && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <Lock className="w-3 h-3 text-amber-500" />
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Mandatory fields locked by admin</span>
              </div>
            )}
            {!frozen && !loading && (
              <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">All fields editable</span>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-[#0f3b9c]">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
              {/* Saved badge */}
              <AnimatePresence>
                {saved && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-semibold"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Saved successfully
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-semibold">{error}</div>
              )}

              {/* Mandatory Fields */}
              <section className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                  {frozen ? <Lock className="w-3.5 h-3.5 text-amber-500" /> : <Pencil className="w-3.5 h-3.5 text-[#0f3b9c]" />}
                  Personal &amp; Academic
                </h3>

                {frozen ? (
                  <div className="space-y-3">
                    <LockedField label="Full Name" value={student?.name} />
                    <LockedField label="Department" value={student?.dept} />
                    <div className="grid grid-cols-2 gap-3">
                      <LockedField label="CGPA" value={String(student?.cgpa ?? "")} />
                      <LockedField label="Semester" value={student?.cgpaSemester ? `Sem ${student.cgpaSemester}` : ""} />
                    </div>
                    <LockedField label="Email" value={student?.email} />
                    <LockedField label="Phone" value={student?.phone} />
                    <LockedField label="Address" value={student?.address} />
                    <LockedField label="Father's Occupation" value={(student as any)?.fatherOccupation} />
                    <LockedField label="Father's Mobile" value={(student as any)?.fatherPhone} />
                    <LockedField label="Mother's Name" value={(student as any)?.motherName} />
                    <LockedField label="Mother's Occupation" value={(student as any)?.motherOccupation} />
                    <LockedField label="Mother's Mobile" value={(student as any)?.motherPhone} />
                    <p className="text-[10px] text-amber-600 font-semibold bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                      Contact your placement admin to update locked fields.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <InputField label="Full Name" value={name} setter={setName} placeholder="Your full name" />
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Department</label>
                      <select
                        value={dept}
                        onChange={(e) => setDept(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-[#0f3b9c] transition-all"
                      >
                        <option value="">Select dept…</option>
                        {DEPTS.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <InputField label="CGPA" value={String(cgpa)} setter={setCgpa} type="number" placeholder="8.50" />
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Semester</label>
                        <select
                          value={cgpaSem}
                          onChange={(e) => setCgpaSem(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-[#0f3b9c] transition-all"
                        >
                          {[1,2,3,4,5,6,7,8].map((n) => <option key={n} value={n}>Sem {n}</option>)}
                        </select>
                      </div>
                    </div>
                    <InputField label="Email" value={email} setter={setEmail} type="email" placeholder="you@example.com" />
                    <InputField label="Phone" value={phone} setter={setPhone} placeholder="+91 99999 99999" />
                    <InputField label="Address" value={address} setter={setAddress} placeholder="City, State" />
                    <InputField label="Father's Occupation" value={fatherOccupation} setter={setFatherOccupation} placeholder="e.g. Farmer, Business" />
                    <InputField label="Father's Mobile" value={fatherPhone} setter={setFatherPhone} placeholder="10-digit number" />
                    <InputField label="Mother's Name" value={motherName} setter={setMotherName} placeholder="Mother's full name" />
                    <InputField label="Mother's Occupation" value={motherOccupation} setter={setMotherOccupation} placeholder="e.g. Homemaker, Teacher" />
                    <InputField label="Mother's Mobile" value={motherPhone} setter={setMotherPhone} placeholder="10-digit number" />
                    <p className="text-[10px] text-slate-400 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                      These fields will be <strong>locked</strong> when admin freezes your profile.
                    </p>
                  </div>
                )}
              </section>

              {/* Optional / Links — always editable */}
              <section className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                  <Link2 className="w-3.5 h-3.5 text-[#0f3b9c]" /> Links &amp; Profiles
                  <span className="text-[9px] normal-case font-medium text-slate-400">(always editable)</span>
                </h3>
                <InputField label="GitHub URL" value={github} setter={setGithub} placeholder="https://github.com/username" />
                <InputField label="LinkedIn URL" value={linkedin} setter={setLinkedin} placeholder="https://linkedin.com/in/username" />
                <InputField label="LeetCode Username" value={leetcode} setter={setLeetcode} placeholder="username" />
                <InputField label="HackerRank URL" value={hackerrank} setter={setHackerrank} placeholder="https://hackerrank.com/username" />
                <InputField label="Resume Link" value={resumeLink} setter={setResumeLink} placeholder="https://drive.google.com/..." />
              </section>
            </div>

            {/* Footer */}
            <div className="shrink-0 px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0f3b9c] text-white font-bold text-sm hover:bg-blue-800 transition-all disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving…" : "Save Profile"}
              </button>
              <button onClick={onClose} className="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-100 transition-all">
                Close
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [name, setName] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [studentId, setStudentId] = useState<string>("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const savedId = localStorage.getItem("spos_user_id");
    const savedRole = localStorage.getItem("spos_user_role");
    if (!savedId) return;
    setRole(savedRole || "student");
    setStudentId(savedId);
    if (savedRole === "admin") {
      setName("Dr.S.Satheeshbabu");
    } else {
      fetch(`/api/students/${savedId}`)
        .then((r) => r.json())
        .then((data) => { if (data?.name) setName(data.name); })
        .catch(() => {});
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("spos_user_id");
    localStorage.removeItem("spos_user_role");
    router.push("/");
  };

  const isDashboard = pathname.startsWith("/dashboard");
  const currentItems = role === "admin" ? adminItems : studentItems;

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={cn(
            "flex items-center transition-all duration-300",
            !isDashboard ? "h-24 justify-center" : "h-16 justify-between"
          )}>
            <div className={cn(
              "flex items-center transition-all duration-300",
              !isDashboard ? "flex-col sm:flex-row gap-6" : "gap-4"
            )}>
              <img
                src="/psna-logo.png"
                alt="PSNA Logo"
                className={cn("w-auto object-contain transition-all duration-300", !isDashboard ? "h-16" : "h-10")}
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
              <div className={cn("flex flex-col transition-all duration-300", !isDashboard ? "items-center sm:items-start" : "items-start")}>
                <div className={cn("font-black uppercase tracking-[0.15em] transition-all duration-300 text-[#0f3b9c]", !isDashboard ? "text-xl md:text-2xl" : "text-[9px]")}>
                  PSNA COLLEGE OF ENGINEERING AND TECHNOLOGY
                </div>
                <div className={cn("font-bold uppercase tracking-[0.3em] text-[#0f3b9c]/80 transition-all duration-300", !isDashboard ? "text-sm md:text-base mt-1" : "text-[7px] mt-0.5")}>
                  PLACEMENT HUB
                </div>
              </div>
            </div>

            {isDashboard && (
              <>
                <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
                  {currentItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all duration-200",
                          isActive ? "bg-[#0f3b9c] text-white shadow-md shadow-[#0f3b9c]/20" : "text-slate-600 hover:bg-slate-100 hover:text-[#0f3b9c]"
                        )}
                      >
                        <item.icon className="w-4 h-4" />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>

                <div className="flex items-center gap-4">
                  {name && (
                    <button
                      onClick={() => role === "student" ? setProfileOpen(true) : undefined}
                      className={cn(
                        "hidden lg:flex items-center gap-3 pl-4 border-l border-slate-200 transition-all",
                        role === "student" ? "cursor-pointer hover:opacity-80 group" : "cursor-default"
                      )}
                    >
                      <div className="w-9 h-9 rounded-xl bg-[#0f3b9c] flex items-center justify-center text-white text-sm font-bold shadow-inner">
                        {name[0]}
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] leading-none mb-1">
                          {role === "admin" ? "Administrator" : "Student"}
                        </span>
                        <span className="text-sm font-bold text-slate-900 max-w-[140px] truncate leading-none">{name}</span>
                      </div>
                      {role === "student" && (
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#0f3b9c] transition-colors" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 text-slate-600 text-sm font-bold hover:bg-red-50 hover:text-red-600 transition-all border border-slate-200 hover:border-red-100"
                  >
                    <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                  <button
                    className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  >
                    {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {mobileMenuOpen && isDashboard && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {currentItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium",
                      isActive ? "bg-[#0f3b9c]/10 text-[#0f3b9c]" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
              {role === "student" && name && (
                <button
                  onClick={() => { setMobileMenuOpen(false); setProfileOpen(true); }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:bg-slate-100"
                >
                  <UserCircle className="w-5 h-5" /> My Profile
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Profile Drawer */}
      <AnimatePresence>
        {profileOpen && studentId && (
          <ProfileDrawer studentId={studentId} onClose={() => setProfileOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
