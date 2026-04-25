"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap, User, Mail, MapPin, Phone, Users, Briefcase,
  GitBranch, Link2, Code, ArrowRight, Lock, CheckCircle2, Loader2,
  AlertCircle, ChevronDown, BookOpen, FileText, Shield,
} from "lucide-react";
import { useRouter } from "next/navigation";

const DEPARTMENTS = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "IT", "AIDS", "AIML", "CSD", "Other"];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const SECTIONS = ["A", "B", "C", "D"];
const HOSTEL_NAMES = ["New Gents Hostel", "NRI Hostel", "Girls Hostel"];
const GIRLS_HOSTEL = "Girls Hostel";
const STEPS = ["Personal", "Academic", "Identity", "Profiles"] as const;
type Step = typeof STEPS[number];

function Field({ label, icon, children, required, locked }: {
  label: string; icon?: React.ReactNode; children: React.ReactNode;
  required?: boolean; locked?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
        {required && <span className="text-red-500">*</span>}
        {locked && <Lock className="w-3 h-3 text-amber-500" />}
      </label>
      <div className={icon ? "relative" : undefined}>
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>}
        {children}
      </div>
    </div>
  );
}

function inputCls(hasIcon = false) {
  return `w-full ${hasIcon ? "pl-10" : "pl-4"} pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-semibold outline-none focus:border-[#0f3b9c] focus:ring-4 focus:ring-[#0f3b9c]/5 transition-all placeholder:text-slate-300`;
}

function selectCls() {
  return "w-full appearance-none pl-4 pr-8 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-semibold outline-none focus:border-[#0f3b9c] focus:ring-4 focus:ring-[#0f3b9c]/5";
}

function RadioGroup({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map(o => (
        <button key={o} type="button" onClick={() => onChange(o)}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-all
            ${value === o ? "bg-[#0f3b9c] border-[#0f3b9c] text-white shadow-lg shadow-[#0f3b9c]/20" : "bg-slate-50 border-slate-200 text-slate-600 hover:border-[#0f3b9c]/40"}`}>
          {o}
        </button>
      ))}
    </div>
  );
}

export default function ProfileSetupPage() {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [step, setStep] = useState<Step>("Personal");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Step 1 — Personal
  const [fatherName, setFatherName] = useState("");
  const [gender, setGender] = useState("");
  const [section, setSection] = useState("");
  const [dob, setDob] = useState("");
  const [nationality, setNationality] = useState("Indian");
  const [accommodation, setAccommodation] = useState("");
  const [hostelName, setHostelName] = useState("");
  const [hostelBlock, setHostelBlock] = useState("");
  const [roomNumber, setRoomNumber] = useState("");

  // Day Scholar → wipe hostel fields. Hosteller + Female → lock to Girls Hostel.
  useEffect(() => {
    if (accommodation === "Day Scholar") {
      setHostelName("");
      setHostelBlock("");
      setRoomNumber("");
    } else if (accommodation === "Hosteller" && gender === "Female") {
      setHostelName(GIRLS_HOSTEL);
    }
  }, [accommodation, gender]);
  const [phone, setPhone] = useState("");
  const [fatherOccupation, setFatherOccupation] = useState("");
  const [fatherPhone, setFatherPhone] = useState("");
  const [motherName, setMotherName] = useState("");
  const [motherOccupation, setMotherOccupation] = useState("");
  const [motherPhone, setMotherPhone] = useState("");

  // Step 2 — Academic
  const [email, setEmail] = useState("");
  const [alternateEmail, setAlternateEmail] = useState("");
  const [dept, setDept] = useState("");
  const [cgpa, setCgpa] = useState("");
  const [cgpaSemester, setCgpaSemester] = useState("");
  const [tenthPercent, setTenthPercent] = useState("");
  const [tenthYear, setTenthYear] = useState("");
  const [tenthSchool, setTenthSchool] = useState("");
  const [twelfthPercent, setTwelfthPercent] = useState("");
  const [twelfthYear, setTwelfthYear] = useState("");
  const [twelfthSchool, setTwelfthSchool] = useState("");
  const [diplomaYearAdmitted, setDiplomaYearAdmitted] = useState("");
  const [diplomaPercent, setDiplomaPercent] = useState("");
  const [diplomaYearOfPassing, setDiplomaYearOfPassing] = useState("");
  const [activeBacklogs, setActiveBacklogs] = useState("0");
  const [totalBacklogs, setTotalBacklogs] = useState("0");
  const [allCleared, setAllCleared] = useState("");
  const [certName, setCertName] = useState("");
  const [certDuration, setCertDuration] = useState("");
  const [certVendor, setCertVendor] = useState("");

  // Step 3 — Identity & Address
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [pincodeLoading, setPincodeLoading] = useState(false);

  const handlePincodeChange = async (pin: string) => {
    setPostalCode(pin);
    if (!/^\d{6}$/.test(pin)) return;
    setPincodeLoading(true);
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await res.json();
      if (data[0]?.Status === "Success" && data[0]?.PostOffice?.length) {
        const po = data[0].PostOffice[0];
        setDistrict(po.District);
        setState(po.State);
      }
    } catch { /* ignore */ }
    finally { setPincodeLoading(false); }
  };
  const [aadhar, setAadhar] = useState("");
  const [hasPan, setHasPan] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [hasPassport, setHasPassport] = useState("");
  const [passportNumber, setPassportNumber] = useState("");

  // Step 4 — Optional profiles
  const [githubLink, setGithubLink] = useState("");
  const [linkedinProfile, setLinkedinProfile] = useState("");
  const [leetcodeUsername, setLeetcodeUsername] = useState("");
  const [hackerrankProfile, setHackerrankProfile] = useState("");
  const [resumeLink, setResumeLink] = useState("");

  useEffect(() => {
    const id = localStorage.getItem("spos_user_id");
    const role = localStorage.getItem("spos_user_role");
    if (!id || role !== "student") { router.push("/auth/login"); return; }
    setStudentId(id);
    fetch("/api/students")
      .then(r => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then((students: any[]) => {
        const s = students.find(s => String(s.id) === id);
        if (!s) { router.push("/auth/login"); return; }
        // Redirect away if profile is frozen OR if student has already filled their name (setup already done)
        if (s.profileComplete || s.name) { router.push("/dashboard/student"); return; }
      })
      .catch(() => router.push("/auth/login"));
  }, [router]);

  function validateStep1() {
    if (!studentName.trim()) return "Full name is required";
    if (!fatherName.trim()) return "Father's name is required";
    if (!gender) return "Gender is required";
    if (!section) return "Section is required";
    if (!dob.trim()) return "Date of birth is required";
    if (!nationality.trim()) return "Nationality is required";
    if (!accommodation) return "Please select Day Scholar or Hosteller";
    if (accommodation === "Hosteller") {
      if (!hostelName) return "Hostel Name is required";
      if (!hostelBlock.trim()) return "Hostel Block is required";
      if (!roomNumber.trim()) return "Room Number is required";
    }
    if (!phone.trim() || !/^\d{10}$/.test(phone)) return "Enter a valid 10-digit WhatsApp number";

    return null;
  }

  function validateStep2() {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid personal email";
    if (!dept) return "Department is required";
    if (!cgpa || isNaN(parseFloat(cgpa)) || parseFloat(cgpa) < 0 || parseFloat(cgpa) > 10) return "Enter a valid CGPA (0–10)";
    if (!cgpaSemester) return "Select the semester for CGPA";
    if (!tenthPercent || isNaN(parseFloat(tenthPercent))) return "10th percentage is required";
    if (!tenthYear.trim()) return "10th year of passing is required";
    if (!tenthSchool.trim()) return "10th school name is required";
    if (!activeBacklogs.trim() || isNaN(parseInt(activeBacklogs))) return "Enter number of standing arrears (0 if none)";
    if (!totalBacklogs.trim() || isNaN(parseInt(totalBacklogs))) return "Enter history of arrears (0 if none)";
    if (!allCleared) return "Please indicate if all subjects were cleared in first attempt";
    return null;
  }

  function validateStep3() {
    if (!addressLine1.trim()) return "Address line 1 is required";
    if (!addressLine2.trim()) return "Address line 2 (taluk/city) is required";
    if (!district.trim()) return "District is required";
    if (!state.trim()) return "State is required";
    if (!postalCode.trim() || !/^\d{6}$/.test(postalCode)) return "Enter a valid 6-digit postal code";
    if (!aadhar.trim() || !/^\d{12}$/.test(aadhar)) return "Enter a valid 12-digit Aadhar number";
    if (!hasPan) return "Please indicate if PAN card is available";
    if (hasPan === "Yes" && !panNumber.trim()) return "Enter PAN card number";
    if (!hasPassport) return "Please indicate if passport is available";
    if (hasPassport === "Yes" && !passportNumber.trim()) return "Enter passport number";
    return null;
  }

  function goNext() {
    let err: string | null = null;
    if (step === "Personal") err = validateStep1();
    else if (step === "Academic") err = validateStep2();
    else if (step === "Identity") err = validateStep3();
    if (err) { setError(err); return; }
    setError("");
    const idx = STEPS.indexOf(step);
    setStep(STEPS[idx + 1]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setError("");
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit() {
    setSaving(true);
    setError("");
    try {
      const hasCerts = certName.trim().toUpperCase() !== "NO" && certName.trim() !== "";
      const payload: Record<string, any> = {
        // Step 1
        name: studentName.trim(),
        fatherName: fatherName.trim(),
        gender,
        section,
        dob: dob.trim(),
        nationality: nationality.trim(),
        accommodation,
        ...(accommodation === "Hosteller"
          ? {
              hostelName,
              hostelBlock: hostelBlock.trim(),
              roomNumber: roomNumber.trim(),
            }
          : { hostelName: "", hostelBlock: "", roomNumber: "" }),
        phone: phone.trim(),
        fatherOccupation: fatherOccupation.trim(),
        fatherPhone: fatherPhone.trim(),
        motherName: motherName.trim(),
        motherOccupation: motherOccupation.trim(),
        motherPhone: motherPhone.trim(),
        // Step 2
        email: email.trim(),
        alternateEmail: alternateEmail.trim(),
        dept,
        cgpa: parseFloat(cgpa),
        cgpaSemester: parseInt(cgpaSemester),
        tenthPercent: parseFloat(tenthPercent),
        tenthYearOfPassing: parseInt(tenthYear),
        tenthSchool: tenthSchool.trim(),
        activeBacklogs: parseInt(activeBacklogs),
        totalBacklogs: parseInt(totalBacklogs),
        allSubjectsClearedFirstAttempt: allCleared === "Yes",
        certificationName: certName.trim(),
        certificationDuration: certDuration.trim(),
        certificationVendor: certVendor.trim(),
        certifications: hasCerts ? 1 : 0,
        // Step 3
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim(),
        district: district.trim(),
        state: state.trim(),
        postalCode: postalCode.trim(),
        address: `${addressLine1.trim()}, ${addressLine2.trim()}, ${district.trim()}, ${state.trim()} - ${postalCode.trim()}`,
        aadharNumber: aadhar.trim(),
        hasPanCard: hasPan === "Yes",
        panCardNumber: hasPan === "Yes" ? panNumber.trim() : "",
        hasPassport: hasPassport === "Yes",
        passportNumber: hasPassport === "Yes" ? passportNumber.trim() : "",
        profileComplete: true,
      };
      if (twelfthPercent) { payload.twelfthPercent = parseFloat(twelfthPercent); payload.twelfthYearOfPassing = parseInt(twelfthYear); payload.twelfthSchool = twelfthSchool.trim(); }
      if (diplomaYearAdmitted) { payload.diplomaYearAdmitted = parseInt(diplomaYearAdmitted); payload.diplomaPercent = parseFloat(diplomaPercent); payload.diplomaYearOfPassing = parseInt(diplomaYearOfPassing); }
      if (githubLink.trim()) payload.githubLink = githubLink.trim();
      if (linkedinProfile.trim()) payload.linkedinProfile = linkedinProfile.trim();
      if (leetcodeUsername.trim()) payload.leetcodeUsername = leetcodeUsername.trim();
      if (hackerrankProfile.trim()) payload.hackerrankProfile = hackerrankProfile.trim();
      if (resumeLink.trim()) payload.resume_link = resumeLink.trim();

      const res = await fetch(`/api/students/${encodeURIComponent(studentId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save profile");
      router.push("/dashboard/student");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const stepIdx = STEPS.indexOf(step);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#0f3b9c] flex items-center justify-center shadow-lg shadow-[#0f3b9c]/20 mx-auto mb-4">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Complete Your Profile</h1>
          <p className="text-sm text-slate-500 mt-1">
            Welcome, <span className="font-bold text-[#0f3b9c]">{studentName}</span> — one-time setup required before accessing the portal
          </p>
          <div className="mt-4 inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
            <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="text-[11px] font-semibold text-amber-700">
              Details cannot be changed after submission. Contact admin for corrections.
            </span>
          </div>
        </motion.div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all
                ${step === s ? "bg-[#0f3b9c] text-white shadow-lg shadow-[#0f3b9c]/20" :
                  i < stepIdx ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                {i < stepIdx ? <CheckCircle2 className="w-3 h-3" /> : <span>{i + 1}</span>}
                {s}
              </div>
              {i < STEPS.length - 1 && <div className="w-5 h-0.5 bg-slate-200 rounded" />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ─── STEP 1: PERSONAL ─── */}
          {step === "Personal" && (
            <motion.div key="personal" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="bg-white rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 p-8 space-y-6">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2"><User className="w-4 h-4 text-[#0f3b9c]" />Personal Details</h2>
                <p className="text-xs text-slate-400 mt-0.5">Basic personal and family information</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Register Number</label>
                <div className="px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-slate-500 text-sm font-semibold">{studentId}</div>
              </div>

              <Field label="Full Name (as in official records)" icon={<User className="w-4 h-4" />} required locked>
                <input value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="e.g. Hariharan M Suresh" className={inputCls(true)} />
              </Field>

              <Field label="Father's Name (Last Name)" required locked>
                <input value={fatherName} onChange={e => setFatherName(e.target.value)} placeholder="Father's full name" className={inputCls()} />
              </Field>


              <div className="grid grid-cols-2 gap-4">
                <Field label="Gender" required locked>
                  <RadioGroup options={["Male", "Female"]} value={gender} onChange={setGender} />
                </Field>
                <Field label="Section" required locked>
                  <RadioGroup options={SECTIONS} value={section} onChange={setSection} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Date of Birth" required locked>
                  <input
                    type="date"
                    value={dob ? dob.split('.').reverse().join('-') : ''}
                    onChange={e => {
                      const [y, m, d] = e.target.value.split('-');
                      setDob(e.target.value ? `${d}.${m}.${y}` : '');
                    }}
                    max={new Date().toISOString().split('T')[0]}
                    className={inputCls()}
                  />
                </Field>
                <Field label="Nationality" required locked>
                  <input value={nationality} onChange={e => setNationality(e.target.value)} placeholder="e.g. Indian" className={inputCls()} />
                </Field>
              </div>

              <Field label="Hostel Status" required locked>
                <RadioGroup options={["Day Scholar", "Hosteller"]} value={accommodation} onChange={setAccommodation} />
              </Field>

              {accommodation === "Hosteller" && (
                <div className="space-y-4 p-4 rounded-2xl bg-blue-50/40 border border-blue-100">
                  <Field label="Hostel Name" required locked>
                    <div className="relative">
                      <select
                        value={hostelName}
                        onChange={e => setHostelName(e.target.value)}
                        disabled={gender === "Female"}
                        className={`${selectCls()} ${gender === "Female" ? "opacity-70 cursor-not-allowed bg-amber-50 border-amber-200" : ""}`}
                      >
                        <option value="">Select hostel</option>
                        {HOSTEL_NAMES.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                    {gender === "Female" && (
                      <p className="text-[10px] font-semibold text-amber-700 mt-1 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Auto-set to Girls Hostel based on gender
                      </p>
                    )}
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Hostel Block" required locked>
                      <input value={hostelBlock} onChange={e => setHostelBlock(e.target.value)} placeholder="e.g. A Block" className={inputCls()} />
                    </Field>
                    <Field label="Room Number" required locked>
                      <input value={roomNumber} onChange={e => setRoomNumber(e.target.value)} placeholder="e.g. 204" className={inputCls()} />
                    </Field>
                  </div>
                </div>
              )}

              <Field label="WhatsApp Mobile Number" icon={<Phone className="w-4 h-4" />} required locked>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="10-digit number" maxLength={10} className={inputCls(true)} />
              </Field>

              <div className="border-t border-slate-100 pt-6">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Parent Details</p>
                <div className="space-y-4">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Father</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Father's Occupation" icon={<Briefcase className="w-4 h-4" />} locked>
                      <input value={fatherOccupation} onChange={e => setFatherOccupation(e.target.value)} placeholder="e.g. Farmer, Business, Govt Job" className={inputCls(true)} />
                    </Field>
                    <Field label="Father's Mobile Number" icon={<Phone className="w-4 h-4" />} locked>
                      <input type="tel" value={fatherPhone} onChange={e => setFatherPhone(e.target.value)} placeholder="10-digit number" maxLength={10} className={inputCls(true)} />
                    </Field>
                  </div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pt-2">Mother</p>
                  <Field label="Mother's Name" icon={<Users className="w-4 h-4" />} locked>
                    <input value={motherName} onChange={e => setMotherName(e.target.value)} placeholder="Mother's full name" className={inputCls(true)} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Mother's Occupation" icon={<Briefcase className="w-4 h-4" />} locked>
                      <input value={motherOccupation} onChange={e => setMotherOccupation(e.target.value)} placeholder="e.g. Homemaker, Teacher" className={inputCls(true)} />
                    </Field>
                    <Field label="Mother's Mobile Number" icon={<Phone className="w-4 h-4" />} locked>
                      <input type="tel" value={motherPhone} onChange={e => setMotherPhone(e.target.value)} placeholder="10-digit number" maxLength={10} className={inputCls(true)} />
                    </Field>
                  </div>
                </div>
              </div>

              {error && <ErrorBanner msg={error} />}
              <NavButtons onNext={goNext} nextLabel="Academic Details" />
            </motion.div>
          )}

          {/* ─── STEP 2: ACADEMIC ─── */}
          {step === "Academic" && (
            <motion.div key="academic" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 p-8 space-y-6">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2"><BookOpen className="w-4 h-4 text-[#0f3b9c]" />Academic Information</h2>
                <p className="text-xs text-slate-400 mt-0.5">Email, marks, CGPA, arrears, and certifications</p>
              </div>

              <Field label="Personal Email ID" icon={<Mail className="w-4 h-4" />} required locked>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="yourname@gmail.com" className={inputCls(true)} />
              </Field>

              <Field label="Alternate Email (PSNA Mail ID)" icon={<Mail className="w-4 h-4" />} locked>
                <input type="email" value={alternateEmail} onChange={e => setAlternateEmail(e.target.value)} placeholder="yourname@psnamail.edu.in" className={inputCls(true)} />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Department" required locked>
                  <div className="relative">
                    <select value={dept} onChange={e => setDept(e.target.value)} className={selectCls()}>
                      <option value="">Select dept</option>
                      {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </Field>
                <Field label="UG CGPA (up to last semester)" required locked>
                  <input type="number" min="0" max="10" step="0.01" value={cgpa} onChange={e => setCgpa(e.target.value)} placeholder="e.g. 8.95" className={inputCls()} />
                </Field>
              </div>

              <Field label="CGPA Calculated Up To Semester" required locked>
                <div className="flex gap-2 flex-wrap">
                  {SEMESTERS.map(s => (
                    <button key={s} type="button" onClick={() => setCgpaSemester(String(s))}
                      className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all
                        ${cgpaSemester === String(s) ? "bg-[#0f3b9c] border-[#0f3b9c] text-white shadow-lg shadow-[#0f3b9c]/20" : "bg-slate-50 border-slate-200 text-slate-600 hover:border-[#0f3b9c]/40"}`}>
                      Sem {s}
                    </button>
                  ))}
                </div>
              </Field>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">10th Standard</p>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="10th % (e.g. 78.92)" required locked>
                    <input type="number" step="0.01" value={tenthPercent} onChange={e => setTenthPercent(e.target.value)} placeholder="78.92" className={inputCls()} />
                  </Field>
                  <Field label="Year of Passing" required locked>
                    <input type="number" value={tenthYear} onChange={e => setTenthYear(e.target.value)} placeholder="2021" className={inputCls()} />
                  </Field>
                  <Field label="School Name" required locked>
                    <input value={tenthSchool} onChange={e => setTenthSchool(e.target.value)} placeholder="School name" className={inputCls()} />
                  </Field>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">12th Standard (leave blank if Diploma)</p>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="12th %" locked>
                    <input type="number" step="0.01" value={twelfthPercent} onChange={e => setTwelfthPercent(e.target.value)} placeholder="78.92" className={inputCls()} />
                  </Field>
                  <Field label="Year of Passing" locked>
                    <input type="number" value={twelfthYear} onChange={e => setTwelfthYear(e.target.value)} placeholder="2023" className={inputCls()} />
                  </Field>
                  <Field label="School Name" locked>
                    <input value={twelfthSchool} onChange={e => setTwelfthSchool(e.target.value)} placeholder="School name" className={inputCls()} />
                  </Field>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Diploma (if applicable)</p>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Year Admitted" locked>
                    <input type="number" value={diplomaYearAdmitted} onChange={e => setDiplomaYearAdmitted(e.target.value)} placeholder="2020" className={inputCls()} />
                  </Field>
                  <Field label="Diploma %" locked>
                    <input type="number" step="0.01" value={diplomaPercent} onChange={e => setDiplomaPercent(e.target.value)} placeholder="75.00" className={inputCls()} />
                  </Field>
                  <Field label="Year of Passing" locked>
                    <input type="number" value={diplomaYearOfPassing} onChange={e => setDiplomaYearOfPassing(e.target.value)} placeholder="2023" className={inputCls()} />
                  </Field>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Arrears</p>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Standing Arrears (current)" required locked>
                    <input type="number" min="0" value={activeBacklogs} onChange={e => setActiveBacklogs(e.target.value)} placeholder="0" className={inputCls()} />
                  </Field>
                  <Field label="History of Arrears (total)" required locked>
                    <input type="number" min="0" value={totalBacklogs} onChange={e => setTotalBacklogs(e.target.value)} placeholder="0" className={inputCls()} />
                  </Field>
                </div>
                <div className="mt-4">
                  <Field label="All subjects cleared in first attempt?" required locked>
                    <RadioGroup options={["Yes", "No (History of Arrears)"]} value={allCleared} onChange={setAllCleared} />
                  </Field>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Certification (if any — enter "No" if none)</p>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Certification Name" locked>
                    <input value={certName} onChange={e => setCertName(e.target.value)} placeholder='e.g. AWS Cloud, "No"' className={inputCls()} />
                  </Field>
                  <Field label="Duration" locked>
                    <input value={certDuration} onChange={e => setCertDuration(e.target.value)} placeholder="e.g. 3 months" className={inputCls()} />
                  </Field>
                  <Field label="Vendor / Authority" locked>
                    <input value={certVendor} onChange={e => setCertVendor(e.target.value)} placeholder="e.g. Amazon, Google" className={inputCls()} />
                  </Field>
                </div>
              </div>

              {error && <ErrorBanner msg={error} />}
              <NavButtons onBack={goBack} onNext={goNext} nextLabel="Identity & Address" />
            </motion.div>
          )}

          {/* ─── STEP 3: IDENTITY & ADDRESS ─── */}
          {step === "Identity" && (
            <motion.div key="identity" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 p-8 space-y-6">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2"><Shield className="w-4 h-4 text-[#0f3b9c]" />Identity & Address</h2>
                <p className="text-xs text-slate-400 mt-0.5">Permanent address and identity documents</p>
              </div>

              <div className="border-t border-slate-100 pt-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Permanent Address</p>
                <div className="space-y-3">
                  <Field label="Line 1 — Door No., Street, Village" icon={<MapPin className="w-4 h-4" />} required locked>
                    <input value={addressLine1} onChange={e => setAddressLine1(e.target.value)} placeholder="Door number, Street, Village" className={inputCls(true)} />
                  </Field>
                  <Field label="Line 2 — Taluk, City" icon={<MapPin className="w-4 h-4" />} required locked>
                    <input value={addressLine2} onChange={e => setAddressLine2(e.target.value)} placeholder="Taluk, City" className={inputCls(true)} />
                  </Field>
                  <Field label="Postal Code" required locked>
                    <div className="relative">
                      <input
                        type="text"
                        value={postalCode}
                        onChange={e => handlePincodeChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="Enter 6-digit pincode"
                        maxLength={6}
                        className={inputCls()}
                      />
                      {pincodeLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#0f3b9c]/30 border-t-[#0f3b9c] rounded-full animate-spin" />
                      )}
                    </div>
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="District" required locked>
                      <input value={district} onChange={e => setDistrict(e.target.value)} placeholder="Auto-filled from pincode" className={`${inputCls()} ${district ? 'bg-emerald-50 border-emerald-200' : ''}`} />
                    </Field>
                    <Field label="State" required locked>
                      <input value={state} onChange={e => setState(e.target.value)} placeholder="Auto-filled from pincode" className={`${inputCls()} ${state ? 'bg-emerald-50 border-emerald-200' : ''}`} />
                    </Field>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Identity Documents</p>
                <div className="space-y-4">
                  <Field label="Aadhar Number (12 digits)" required locked>
                    <input type="number" value={aadhar} onChange={e => setAadhar(e.target.value)} placeholder="1234 5678 9012" maxLength={12} className={inputCls()} />
                  </Field>

                  <Field label="PAN Card Available?" required locked>
                    <RadioGroup options={["Yes", "No"]} value={hasPan} onChange={v => { setHasPan(v); if (v === "No") setPanNumber(""); }} />
                  </Field>
                  {hasPan === "Yes" && (
                    <Field label="PAN Card Number" required locked>
                      <input value={panNumber} onChange={e => setPanNumber(e.target.value.toUpperCase())} placeholder="ABCDE1234F" maxLength={10} className={inputCls()} />
                    </Field>
                  )}

                  <Field label="Valid Indian Passport Available?" required locked>
                    <RadioGroup options={["Yes", "No"]} value={hasPassport} onChange={v => { setHasPassport(v); if (v === "No") setPassportNumber(""); }} />
                  </Field>
                  {hasPassport === "Yes" && (
                    <Field label="Passport Number" required locked>
                      <input value={passportNumber} onChange={e => setPassportNumber(e.target.value.toUpperCase())} placeholder="A1234567" maxLength={8} className={inputCls()} />
                    </Field>
                  )}
                </div>
              </div>

              {error && <ErrorBanner msg={error} />}
              <NavButtons onBack={goBack} onNext={goNext} nextLabel="Online Profiles" />
            </motion.div>
          )}

          {/* ─── STEP 4: OPTIONAL PROFILES ─── */}
          {step === "Profiles" && (
            <motion.div key="profiles" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 p-8 space-y-6">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2"><Link2 className="w-4 h-4 text-[#0f3b9c]" />Online Profiles</h2>
                <p className="text-xs text-slate-400 mt-0.5">Skip now — these can be updated anytime from your profile page.</p>
              </div>

              <Field label="LinkedIn Profile URL" icon={<Link2 className="w-4 h-4" />}>
                <input type="url" value={linkedinProfile} onChange={e => setLinkedinProfile(e.target.value)} placeholder="https://linkedin.com/in/username" className={inputCls(true)} />
              </Field>

              <Field label="GitHub Repository Link" icon={<GitBranch className="w-4 h-4" />}>
                <input type="url" value={githubLink} onChange={e => setGithubLink(e.target.value)} placeholder="https://github.com/username" className={inputCls(true)} />
              </Field>

              <Field label="LeetCode Username" icon={<Code className="w-4 h-4" />}>
                <input value={leetcodeUsername} onChange={e => setLeetcodeUsername(e.target.value)} placeholder="LeetCode username" className={inputCls(true)} />
              </Field>

              <Field label="HackerRank Profile URL" icon={<Code className="w-4 h-4" />}>
                <input type="url" value={hackerrankProfile} onChange={e => setHackerrankProfile(e.target.value)} placeholder="https://hackerrank.com/username" className={inputCls(true)} />
              </Field>

              <Field label="Resume or Portfolio Page Link" icon={<FileText className="w-4 h-4" />}>
                <input type="url" value={resumeLink} onChange={e => setResumeLink(e.target.value)} placeholder="Drive link, portfolio URL…" className={inputCls(true)} />
              </Field>

              {error && <ErrorBanner msg={error} />}

              <div className="flex gap-3">
                <button onClick={goBack}
                  className="flex-1 py-4 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-colors">
                  Back
                </button>
                <button onClick={handleSubmit} disabled={saving}
                  className="flex-[2] py-4 bg-[#0f3b9c] text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-[#0a2d7a] transition-colors shadow-lg shadow-[#0f3b9c]/20 disabled:opacity-60">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><CheckCircle2 className="w-4 h-4" /> Complete Profile & Enter Portal</>}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
      <p className="text-sm font-semibold text-red-700">{msg}</p>
    </div>
  );
}

function NavButtons({ onBack, onNext, nextLabel }: { onBack?: () => void; onNext: () => void; nextLabel: string }) {
  return (
    <div className="flex gap-3">
      {onBack && (
        <button onClick={onBack} className="flex-1 py-4 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-colors">
          Back
        </button>
      )}
      <button onClick={onNext}
        className={`${onBack ? "flex-[2]" : "w-full"} py-4 bg-[#0f3b9c] text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-[#0a2d7a] transition-colors shadow-lg shadow-[#0f3b9c]/20`}>
        {nextLabel} <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
