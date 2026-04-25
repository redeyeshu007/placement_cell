"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Users, CheckCircle2, Building2, BarChart4,
  Plus, Trash2, Search,
  X, Loader2, Save, IndianRupee,
  Briefcase, ShieldCheck, ShieldX, Zap, Lock, Unlock,
  Trophy, Download, Eye, AlertCircle,
  Upload, UserCog, FileUp, Phone, MapPin, Mail, ArrowUpRight, Activity,
  BellRing, FileDown, Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState, useMemo, ReactNode } from "react";
import { fetchFromGAS, createCompany, deleteCompany } from "@/lib/api";
import {
  Student, Company,
  computePRS, computeDriveScore, checkEligibility,
} from "@/lib/matching";
import { SkillTagEditor } from "@/components/SkillTagEditor";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function csvCell(v: string | number): string {
  const s = String(v);
  // Force Excel to treat long numeric strings (like register numbers) as text
  if (/^\d{6,}$/.test(s)) return `"=""${s}"""`;
  return `"${s.replace(/"/g, '""')}"`;
}

function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent = '﻿' + [headers, ...rows]
    .map(row => row.map(csvCell).join(','))
    .join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Create Drive Modal ───────────────────────────────────────────────────────

function CreateDriveModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (company: any) => void;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [salary, setSalary] = useState("");
  const [requirementType, setRequirementType] = useState<"open" | "skill-based" | "interested">("open");
  const [min10thPercent, setMin10thPercent] = useState<string>("0");
  const [min12thPercent, setMin12thPercent] = useState<string>("0");
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [prioritySkills, setPrioritySkills] = useState<string[]>([]);
  const [minCgpa, setMinCgpa] = useState<string>("0");
  const [arrearMode, setArrearMode] = useState<"allow-history" | "no-history">("allow-history");
  const [allowedBacklogs, setAllowedBacklogs] = useState<string>("0");
  const [selectCount, setSelectCount] = useState<string>("10");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Company name is required."); return; }
    if (!role.trim()) { setError("Role / Position is required."); return; }
    setSaving(true);
    setError("");
    try {
      const company = await createCompany({
        name: name.trim(),
        role: role.trim(),
        salary: salary.trim(),
        requirementType,
        requiredSkills,
        prioritySkills,
        minCgpa: parseFloat(minCgpa) || 0,
        allowedBacklogs: arrearMode === "no-history" ? 0 : parseInt(allowedBacklogs) || 0,
        noHistoryOfArrears: arrearMode === "no-history",
        selectCount: parseInt(selectCount) || 0,
        min10thPercent: parseFloat(min10thPercent) || 0,
        min12thPercent: parseFloat(min12thPercent) || 0,
      });
      onCreated(company);
      onClose();
    } catch (err: any) {
      setError(err.message ?? "Failed to create drive.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 12 }}
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-slate-50 shrink-0">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Create Recruitment Drive</h2>
            <p className="text-[11px] font-medium text-slate-400 mt-0.5">Define company, role, salary & eligibility filters</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-8 space-y-8">

          {/* ── Drive Details ─────────────────────────────────────────── */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Drive Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Company Name *</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input value={name} onChange={e => setName(e.target.value)}
                    placeholder="e.g. Infosys, TCS, Zoho…"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0f3b9c]/30 focus:border-[#0f3b9c]"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Role / Position *</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input value={role} onChange={e => setRole(e.target.value)}
                    placeholder="e.g. Software Engineer, Data Analyst…"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0f3b9c]/30 focus:border-[#0f3b9c]"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">CTC / Salary Package</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={salary} onChange={e => setSalary(e.target.value)}
                  placeholder="e.g. 3.5 LPA, ₹6-8 LPA, 12,000/month…"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0f3b9c]/30 focus:border-[#0f3b9c]"
                />
              </div>
            </div>
          </section>

          {/* ── Requirements ─────────────────────────────────────────── */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Requirements</h3>
            <div className="grid grid-cols-3 gap-3">
              <button onClick={() => setRequirementType("open")}
                className={cn("flex flex-col items-start gap-2 p-4 rounded-2xl border-2 transition-all text-left",
                  requirementType === "open" ? "border-[#0f3b9c] bg-[#0f3b9c]/5" : "border-slate-200 bg-white hover:border-slate-300")}>
                <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center",
                  requirementType === "open" ? "bg-[#0f3b9c] text-white" : "bg-slate-100 text-slate-400")}>
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-extrabold text-slate-900">Open to All</div>
                  <div className="text-[11px] font-medium text-slate-400 mt-0.5">Any eligible student auto-shortlisted</div>
                </div>
              </button>
              <button onClick={() => setRequirementType("skill-based")}
                className={cn("flex flex-col items-start gap-2 p-4 rounded-2xl border-2 transition-all text-left",
                  requirementType === "skill-based" ? "border-[#0f3b9c] bg-[#0f3b9c]/5" : "border-slate-200 bg-white hover:border-slate-300")}>
                <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center",
                  requirementType === "skill-based" ? "bg-[#0f3b9c] text-white" : "bg-slate-100 text-slate-400")}>
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-extrabold text-slate-900">Skill-Based</div>
                  <div className="text-[11px] font-medium text-slate-400 mt-0.5">Only students with specific skills qualify</div>
                </div>
              </button>
              <button onClick={() => setRequirementType("interested")}
                className={cn("flex flex-col items-start gap-2 p-4 rounded-2xl border-2 transition-all text-left",
                  requirementType === "interested" ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white hover:border-slate-300")}>
                <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center",
                  requirementType === "interested" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400")}>
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-extrabold text-slate-900">Interested Students</div>
                  <div className="text-[11px] font-medium text-slate-400 mt-0.5">Students accept invite, top N by PRS selected</div>
                </div>
              </button>
            </div>
            {requirementType === "skill-based" && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 pt-1">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    Required Skills <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-600 text-[9px] font-black uppercase">Must Have</span>
                  </label>
                  <SkillTagEditor skills={requiredSkills} onChange={setRequiredSkills} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    Priority Skills <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 text-[9px] font-black uppercase">Nice to Have</span>
                  </label>
                  <SkillTagEditor skills={prioritySkills} onChange={setPrioritySkills} />
                </div>
              </motion.div>
            )}
          </section>

          {/* ── CGPA Filter ───────────────────────────────────────────── */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">CGPA Filter</h3>
            <div className="flex items-center gap-4 bg-slate-50 rounded-2xl p-5 border border-slate-200">
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Minimum CGPA Required</label>
                <p className="text-[11px] text-slate-400 font-medium">Students below this CGPA will not be eligible</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button onClick={() => setMinCgpa(v => String(Math.max(0, parseFloat(v || "0") - 0.5)))}
                  className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-lg hover:bg-slate-100 transition-colors flex items-center justify-center shadow-sm">−</button>
                <input type="number" min="0" max="10" step="0.1" value={minCgpa}
                  onChange={e => setMinCgpa(e.target.value)}
                  className="w-20 text-center py-2 rounded-xl border border-slate-200 text-xl font-extrabold text-[#0f3b9c] focus:outline-none focus:ring-2 focus:ring-[#0f3b9c]/30 focus:border-[#0f3b9c]"
                />
                <button onClick={() => setMinCgpa(v => String(Math.min(10, parseFloat(v || "0") + 0.5)))}
                  className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-lg hover:bg-slate-100 transition-colors flex items-center justify-center shadow-sm">+</button>
              </div>
            </div>
          </section>

          {/* ── Academic % Filter ────────────────────────────────────── */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Academic % Filter <span className="normal-case text-slate-300 font-medium">(0 = no requirement)</span></h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-4 bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-700 block mb-0.5">Min 10th %</label>
                  <p className="text-[10px] text-slate-400">Set 0 to skip</p>
                </div>
                <input type="number" min="0" max="100" value={min10thPercent}
                  onChange={e => setMin10thPercent(e.target.value)}
                  className="w-20 text-center py-2 rounded-xl border border-slate-200 text-lg font-extrabold text-[#0f3b9c] focus:outline-none focus:ring-2 focus:ring-[#0f3b9c]/30"
                />
              </div>
              <div className="flex items-center gap-4 bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-700 block mb-0.5">Min 12th %</label>
                  <p className="text-[10px] text-slate-400">Set 0 to skip</p>
                </div>
                <input type="number" min="0" max="100" value={min12thPercent}
                  onChange={e => setMin12thPercent(e.target.value)}
                  className="w-20 text-center py-2 rounded-xl border border-slate-200 text-lg font-extrabold text-[#0f3b9c] focus:outline-none focus:ring-2 focus:ring-[#0f3b9c]/30"
                />
              </div>
            </div>
          </section>

          {/* ── Arrear Filter ─────────────────────────────────────────── */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Arrear Filter</h3>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setArrearMode("allow-history")}
                className={cn("flex flex-col items-start gap-2 p-5 rounded-2xl border-2 transition-all text-left",
                  arrearMode === "allow-history" ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white hover:border-slate-300")}>
                <ShieldCheck className={cn("w-6 h-6", arrearMode === "allow-history" ? "text-emerald-600" : "text-slate-300")} />
                <div>
                  <div className="text-sm font-extrabold text-slate-900">History Allowed</div>
                  <div className="text-[11px] font-medium text-slate-400 mt-0.5">Past backlogs (now cleared) are OK. Only active backlogs restricted.</div>
                </div>
              </button>
              <button onClick={() => setArrearMode("no-history")}
                className={cn("flex flex-col items-start gap-2 p-5 rounded-2xl border-2 transition-all text-left",
                  arrearMode === "no-history" ? "border-red-400 bg-red-50" : "border-slate-200 bg-white hover:border-slate-300")}>
                <ShieldX className={cn("w-6 h-6", arrearMode === "no-history" ? "text-red-500" : "text-slate-300")} />
                <div>
                  <div className="text-sm font-extrabold text-slate-900">No Arrear History</div>
                  <div className="text-[11px] font-medium text-slate-400 mt-0.5">Zero tolerance — students must have never had any backlog.</div>
                </div>
              </button>
            </div>
            {arrearMode === "allow-history" && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 bg-slate-50 rounded-2xl p-5 border border-slate-200">
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Max Active Backlogs Allowed</label>
                  <p className="text-[11px] text-slate-400 font-medium">Set 0 to require all arrears cleared. Set -1 for no limit.</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button onClick={() => setAllowedBacklogs(v => String(Math.max(-1, parseInt(v || "0") - 1)))}
                    className="w-9 h-9 rounded-xl bg-white border border-slate-200 font-bold text-lg hover:bg-slate-100 transition-colors flex items-center justify-center shadow-sm">−</button>
                  <span className="w-12 text-center text-2xl font-extrabold text-[#0f3b9c] tabular-nums">{allowedBacklogs === "-1" ? "∞" : allowedBacklogs}</span>
                  <button onClick={() => setAllowedBacklogs(v => String(parseInt(v || "0") + 1))}
                    className="w-9 h-9 rounded-xl bg-white border border-slate-200 font-bold text-lg hover:bg-slate-100 transition-colors flex items-center justify-center shadow-sm">+</button>
                </div>
              </motion.div>
            )}
          </section>

          {/* ── Shortlisting Cap ─────────────────────────────────────── */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Shortlisting Cap</h3>
            <div className="flex items-center gap-4 bg-[#0f3b9c]/5 rounded-2xl p-5 border border-[#0f3b9c]/15">
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-700 block mb-1">Number of Students to Select</label>
                <p className="text-[11px] text-slate-400 font-medium">
                  Top <span className="font-bold text-[#0f3b9c]">{parseInt(selectCount) || "N"}</span> students ranked by{" "}
                  {requirementType === "skill-based" ? "PRS + Skill Match + GitHub" : "PRS score"}. Set 0 for no cap.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button onClick={() => setSelectCount(v => String(Math.max(0, parseInt(v || "0") - 1)))}
                  className="w-9 h-9 rounded-xl bg-white border border-slate-200 font-bold text-lg hover:bg-slate-100 transition-colors flex items-center justify-center shadow-sm">−</button>
                <input type="number" min="0" value={selectCount}
                  onChange={e => setSelectCount(e.target.value)}
                  className="w-20 text-center py-2 rounded-xl border border-[#0f3b9c]/30 text-xl font-extrabold text-[#0f3b9c] focus:outline-none focus:ring-2 focus:ring-[#0f3b9c]/30"
                />
                <button onClick={() => setSelectCount(v => String(parseInt(v || "0") + 1))}
                  className="w-9 h-9 rounded-xl bg-white border border-slate-200 font-bold text-lg hover:bg-slate-100 transition-colors flex items-center justify-center shadow-sm">+</button>
              </div>
            </div>
          </section>

          {error && (
            <p className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-xl">{error}</p>
          )}
        </div>

        <div className="flex items-center justify-between px-8 py-5 border-t border-slate-100 bg-slate-50 shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-[#0f3b9c] text-white text-sm font-bold hover:bg-blue-800 transition-colors shadow-lg shadow-[#0f3b9c]/20 disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Creating Drive…" : "Launch Drive"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Top Scores Modal ─────────────────────────────────────────────────────────

function TopScoresModal({ students, onClose }: { students: Student[]; onClose: () => void }) {
  const [topN, setTopN] = useState(10);

  const ranked = useMemo(() =>
    [...students]
      .map(s => ({ ...s, prs: computePRS(s) }))
      .sort((a, b) => b.prs.composite - a.prs.composite)
      .slice(0, topN),
    [students, topN]
  );

  const handleDownload = () => {
    downloadCSV(`top-${topN}-prs-scores.csv`,
      ['Rank', 'Name', 'ID', 'Department', 'CGPA', 'PRS Score', 'Academic', 'Technical', 'LeetCode', 'Resume Strength'],
      ranked.map((s, i) => [
        i + 1, s.name, s.id, s.dept, s.cgpa,
        s.prs.composite, Math.round(s.prs.cgpa), Math.round(s.prs.skills),
        Math.round(s.prs.leetcode), Math.round(s.prs.resumeStrength),
      ])
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 12 }}
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Top PRS Scores</h2>
              <p className="text-[11px] font-medium text-slate-400">Placement Readiness Score leaderboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5">
              <span className="text-xs font-bold text-slate-500">Show top</span>
              <select value={topN} onChange={e => setTopN(Number(e.target.value))}
                className="text-sm font-bold text-[#0f3b9c] border-none outline-none bg-transparent">
                {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <button onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-colors">
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-200 transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-[0.15em] font-black text-slate-400 border-b border-slate-100 sticky top-0">
              <tr>
                <th className="px-6 py-4">Rank</th>
                <th className="px-6 py-4">Candidate</th>
                <th className="px-6 py-4 text-center">CGPA</th>
                <th className="px-6 py-4 text-center">PRS Score</th>
                <th className="px-6 py-4 text-center">Backlogs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ranked.map((s, i) => (
                <tr key={s.id} className={cn("transition-colors", i < 3 ? "bg-amber-50/30" : "hover:bg-slate-50/50")}>
                  <td className="px-6 py-4">
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-black",
                      i === 0 ? "bg-amber-400 text-white" :
                      i === 1 ? "bg-slate-300 text-slate-800" :
                      i === 2 ? "bg-orange-300 text-white" :
                      "bg-slate-100 text-slate-500")}>
                      {i + 1}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-900">{s.name}</div>
                    <div className="text-[10px] font-semibold text-slate-400">{s.dept} • {s.id}</div>
                  </td>
                  <td className="px-6 py-4 text-center font-extrabold text-[#0f3b9c] tabular-nums">{s.cgpa}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#0f3b9c] to-indigo-400 transition-all"
                          style={{ width: `${s.prs.composite}%` }} />
                      </div>
                      <span className="text-sm font-extrabold text-[#0f3b9c] tabular-nums w-8">{s.prs.composite}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-black",
                      s.activeBacklogs === 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>
                      {s.activeBacklogs} active
                    </span>
                  </td>
                </tr>
              ))}
              {ranked.length === 0 && (
                <tr><td colSpan={5} className="px-8 py-16 text-center text-sm text-slate-400 font-medium">No student data available.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Shortlist Modal ──────────────────────────────────────────────────────────

function ShortlistModal({ drive, students, allDrives, onClose, onDriveUpdate }: {
  drive: Company;
  students: Student[];
  allDrives: Company[];
  onClose: () => void;
  onDriveUpdate: (updated: Partial<Company>) => void;
}) {
  const [decisionLoading, setDecisionLoading] = useState<string | null>(null);
  const [localDrive, setLocalDrive] = useState<Company>(drive);

  // Count how many OTHER drives each student has been shortlisted in
  const shortlistHistory = useMemo(() => {
    const map = new Map<string, { count: number; driveNames: string[] }>();
    for (const d of allDrives) {
      if (d.id === drive.id) continue;
      const finalAccepted = d.finalAccepted ?? [];
      for (const studentId of finalAccepted) {
        const prev = map.get(studentId) ?? { count: 0, driveNames: [] };
        map.set(studentId, { count: prev.count + 1, driveNames: [...prev.driveNames, d.name] });
      }
    }
    return map;
  }, [allDrives, drive.id]);

  const ranked = useMemo(() => {
    const isInterested = localDrive.requirementType === 'interested';
    const accepted = localDrive.acceptedStudents ?? [];
    const rejected = new Set(localDrive.finalRejected ?? []);
    const pool = students
      .filter(s => checkEligibility(s, localDrive).eligible)
      .filter(s => !isInterested || accepted.includes(s.id))
      .map(s => {
        const scores = computeDriveScore(s, localDrive);
        return { ...s, ...scores };
      })
      .sort((a, b) => b.score - a.score);

    const cap = localDrive.selectCount ?? 0;

    // Fill slots: walk down the ranked list, give a slot to each non-rejected
    // student until we've filled `cap` slots (or all, if no cap).
    let slotsLeft = cap === 0 ? Infinity : cap;
    const withFlags = pool.map((s, i) => {
      const isRejectedByAdmin = rejected.has(s.id);
      const originallyIn = cap === 0 || i < cap; // was in original cap window
      let isSelected = false;
      let isPromoted = false;
      if (!isRejectedByAdmin && slotsLeft > 0) {
        isSelected = true;
        if (!originallyIn) isPromoted = true; // moved up because someone was rejected
        slotsLeft--;
      }
      return { ...s, rank: i + 1, isSelected, isPromoted, isRejectedByAdmin };
    });
    return withFlags;
  }, [localDrive, students]);

  const shortlisted = ranked.filter(s => s.isSelected);
  const promotedCount = ranked.filter(s => s.isPromoted).length;
  const finalAccepted = localDrive.finalAccepted ?? [];
  const finalRejected = localDrive.finalRejected ?? [];
  const pendingCount = shortlisted.filter(s => !finalAccepted.includes(s.id) && !finalRejected.includes(s.id)).length;

  const handleDecision = async (studentId: string, adminDecision: 'accept' | 'reject' | 'reset') => {
    setDecisionLoading(studentId + adminDecision);
    try {
      const res = await fetch(`/api/companies/${encodeURIComponent(localDrive.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': 'psna-admin' },
        body: JSON.stringify({ studentId, adminDecision }),
      });
      if (res.ok) {
        const data = await res.json();
        const updated = { ...localDrive, finalAccepted: data.finalAccepted, finalRejected: data.finalRejected };
        setLocalDrive(updated);
        onDriveUpdate({ finalAccepted: data.finalAccepted, finalRejected: data.finalRejected });
      }
    } finally {
      setDecisionLoading(null);
    }
  };

  const handleAcceptAll = async () => {
    const pendingIds = shortlisted.filter(s => !finalAccepted.includes(s.id) && !finalRejected.includes(s.id)).map(s => s.id);
    if (pendingIds.length === 0) return;
    setDecisionLoading('accept-all');
    try {
      const res = await fetch(`/api/companies/${encodeURIComponent(localDrive.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': 'psna-admin' },
        body: JSON.stringify({ studentId: pendingIds, adminDecision: 'accept' }),
      });
      if (res.ok) {
        const data = await res.json();
        const updated = { ...localDrive, finalAccepted: data.finalAccepted, finalRejected: data.finalRejected };
        setLocalDrive(updated);
        onDriveUpdate({ finalAccepted: data.finalAccepted, finalRejected: data.finalRejected });
      }
    } finally {
      setDecisionLoading(null);
    }
  };

  const handleDownload = () => {
    // Only export students who are selected AND not rejected by admin
    const exportRows = ranked.filter(s => s.isSelected && !s.isRejectedByAdmin);
    downloadCSV(`${localDrive.name}-shortlist.csv`,
      ['Rank', 'Name', 'Register No', 'Department', 'CGPA', 'Active Backlogs', 'PRS Score', 'Skill Match %', 'Combined Score', 'Decision', 'Prev Drives Shortlisted'],
      exportRows.map((s, i) => {
        const hist = shortlistHistory.get(s.id);
        const decision = finalAccepted.includes(s.id) ? 'Accepted' : 'Pending';
        return [
          i + 1, s.name, s.id, s.dept, s.cgpa, s.activeBacklogs,
          s.prsScore, Math.round(s.skillMatchPercent), s.score,
          decision, hist ? hist.count : 0,
        ];
      })
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 12 }}
        className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-100 bg-slate-50 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#0f3b9c]/10 flex items-center justify-center font-black text-[#0f3b9c] text-sm">
                {localDrive.name[0]}
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">{localDrive.name} — Shortlist Review</h2>
                <p className="text-[11px] font-medium text-slate-400">
                  {localDrive.role} {localDrive.salary ? `• ${localDrive.salary}` : ''} •{' '}
                  {localDrive.requirementType === 'skill-based' ? 'Skill-Based' : localDrive.requirementType === 'interested' ? 'Interested Students' : 'Open to All'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleAcceptAll} disabled={decisionLoading !== null || pendingCount === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0f3b9c] text-white border border-[#0f3b9c] text-xs font-bold hover:bg-blue-800 transition-colors disabled:opacity-50">
                <CheckCircle2 className="w-3.5 h-3.5" /> Accept All
              </button>
              <button onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-colors">
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-200 transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-200">
              {shortlisted.length} Shortlisted
            </span>
            <span className="px-3 py-1 rounded-full bg-[#0f3b9c]/10 text-[#0f3b9c] text-[10px] font-black border border-[#0f3b9c]/20">
              {finalAccepted.length} Admin Accepted
            </span>
            <span className="px-3 py-1 rounded-full bg-red-50 text-red-600 text-[10px] font-black border border-red-200">
              {finalRejected.length} Admin Rejected
            </span>
            {pendingCount > 0 && (
              <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] font-black border border-amber-200">
                {pendingCount} Pending Review
              </span>
            )}
            {promotedCount > 0 && (
              <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-[10px] font-black border border-purple-200">
                {promotedCount} Promoted
              </span>
            )}
            {localDrive.selectCount ? (
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black border border-slate-200">
                Cap: {localDrive.selectCount} seats
              </span>
            ) : null}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-y-auto flex-1">
          {ranked.length === 0 ? (
            <div className="py-20 text-center">
              <AlertCircle className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-400">No eligible students for this drive.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-[0.15em] font-black text-slate-400 border-b border-slate-100 sticky top-0">
                <tr>
                  <th className="px-5 py-4">Rank</th>
                  <th className="px-5 py-4">Candidate</th>
                  <th className="px-5 py-4 text-center">CGPA</th>
                  <th className="px-5 py-4 text-center">PRS</th>
                  <th className="px-5 py-4 text-center">Score</th>
                  <th className="px-5 py-4 text-center">History</th>
                  <th className="px-5 py-4 text-center">Status</th>
                  <th className="px-5 py-4 text-center">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ranked.map(s => {
                  const hist = shortlistHistory.get(s.id);
                  const isAccepted = finalAccepted.includes(s.id);
                  const isRejected = finalRejected.includes(s.id);
                  const loading = decisionLoading?.startsWith(s.id);
                  return (
                    <tr key={s.id} className={cn("transition-colors",
                      isRejected ? "bg-red-50/30 opacity-50" :
                      isAccepted ? "bg-emerald-50/40" :
                      s.isPromoted ? "bg-purple-50/40 hover:bg-purple-50/60" :
                      s.isSelected ? "bg-emerald-50/10 hover:bg-emerald-50/30" :
                      "hover:bg-slate-50/50 opacity-40")}>
                      <td className="px-5 py-4">
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-black",
                          s.rank === 1 ? "bg-amber-400 text-white" :
                          s.rank === 2 ? "bg-slate-300 text-slate-800" :
                          s.rank === 3 ? "bg-orange-300 text-white" :
                          "bg-slate-100 text-slate-500")}>
                          {s.rank}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">{s.name}</div>
                        <div className="text-[10px] font-semibold text-slate-400">{s.dept} • {s.id}</div>
                      </td>
                      <td className="px-5 py-4 text-center font-extrabold text-[#0f3b9c] tabular-nums">{s.cgpa}</td>
                      <td className="px-5 py-4 text-center font-extrabold text-indigo-600 tabular-nums">{s.prsScore}</td>
                      <td className="px-5 py-4 text-center font-extrabold text-slate-900 tabular-nums">{s.score}</td>
                      <td className="px-5 py-4 text-center">
                        {hist && hist.count > 0 ? (
                          <div className="group relative inline-block">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-black border border-amber-200 cursor-default">
                              <Trophy className="w-3 h-3" /> {hist.count} drive{hist.count > 1 ? 's' : ''}
                            </span>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 bg-slate-900 text-white text-[10px] rounded-xl px-3 py-2 whitespace-nowrap shadow-xl max-w-[200px]">
                              {hist.driveNames.join(', ')}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-300 font-semibold">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        {isAccepted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Accepted
                          </span>
                          ) : isRejected ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-[10px] font-black border border-red-200">
                            <ShieldX className="w-3 h-3" /> Rejected
                          </span>
                        ) : s.isPromoted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 text-[10px] font-black border border-purple-200">
                            <ArrowUpRight className="w-3 h-3" /> Promoted
                          </span>
                        ) : s.isSelected ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black border border-blue-200">
                            <Zap className="w-3 h-3" /> Shortlisted
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-400 text-[10px] font-black">Not Selected</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        {s.isSelected && (
                          <div className="flex items-center justify-center gap-1.5">
                            {isAccepted || isRejected ? (
                              <button onClick={() => handleDecision(s.id, 'reset')}
                                disabled={!!loading}
                                className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 text-[10px] font-bold hover:bg-slate-200 transition-colors border border-slate-200 disabled:opacity-50">
                                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Reset'}
                              </button>
                            ) : (
                              <>
                                <button onClick={() => handleDecision(s.id, 'accept')}
                                  disabled={!!loading}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-[10px] font-black hover:bg-emerald-700 transition-colors disabled:opacity-50">
                                  {decisionLoading === s.id + 'accept' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                  Accept
                                </button>
                                <button onClick={() => handleDecision(s.id, 'reject')}
                                  disabled={!!loading}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-600 text-white text-[10px] font-black hover:bg-red-700 transition-colors disabled:opacity-50">
                                  {decisionLoading === s.id + 'reject' ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldX className="w-3 h-3" />}
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer summary */}
        {shortlisted.length > 0 && (
          <div className="px-8 py-4 border-t border-slate-100 bg-slate-50 shrink-0 flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">
              Review each shortlisted candidate. Decisions are saved instantly.
            </p>
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="text-emerald-600">{finalAccepted.length} accepted</span>
              <span className="text-red-500">{finalRejected.length} rejected</span>
              <span className="text-amber-600">{pendingCount} pending</span>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Arrear Policy Badge ──────────────────────────────────────────────────────

function ArrearBadge({ noHistory, allowedBacklogs }: { noHistory: boolean; allowedBacklogs: number }) {
  if (noHistory) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-[9px] font-black uppercase border border-red-100 whitespace-nowrap">
        <Lock className="w-2.5 h-2.5" /> No History
      </span>
    );
  }
  if (allowedBacklogs === undefined || allowedBacklogs === -1) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase border border-emerald-100 whitespace-nowrap">
        <ShieldCheck className="w-2.5 h-2.5" /> No Restriction
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase border border-emerald-100 whitespace-nowrap">
      <ShieldCheck className="w-2.5 h-2.5" /> ≤{allowedBacklogs} Active
    </span>
  );
}

// ─── Student Profile View Modal ───────────────────────────────────────────────

function ProfileSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 pb-2">{title}</p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">{children}</div>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value?: string | number | boolean | null }) {
  const display = value === true ? 'Yes' : value === false ? 'No' : value;
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
      <div className="text-sm font-semibold text-slate-800 mt-0.5">{display || <span className="text-slate-300 italic font-normal text-xs">Not provided</span>}</div>
    </div>
  );
}

function StudentProfileModal({ student, onClose }: { student: any; onClose: () => void }) {
  const s = student;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 12 }}
        className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-slate-50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0f3b9c] text-white flex items-center justify-center text-xl font-extrabold overflow-hidden">
              {s.profilePhoto
                ? <img src={s.profilePhoto} alt="" className="w-full h-full object-cover" />
                : s.name?.[0] || s.id?.[0] || '?'}
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">{s.name || 'Profile Incomplete'}</h2>
              <p className="text-xs font-bold text-slate-400">{s.id} · {s.dept || '—'} · Batch {s.batch || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border
              ${s.profileComplete ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
              {s.profileComplete ? 'Profile Complete' : 'Pending Setup'}
            </span>
            {s.resumePdf && (
              <button
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = s.resumePdf;
                  a.download = `${s.name || s.id}_resume.pdf`;
                  a.click();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0f3b9c] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#0a2d7a] transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Resume
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-200 transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-8 space-y-8">
          <ProfileSection title="Personal Information">
            <ProfileRow label="Father's Name" value={s.fatherName} />
            <ProfileRow label="Gender" value={s.gender} />
            <ProfileRow label="Section" value={s.section} />
            <ProfileRow label="Date of Birth" value={s.dob} />
            <ProfileRow label="Nationality" value={s.nationality} />
            <ProfileRow label="Hostel Status" value={s.accommodation} />
            {(s.accommodation === "Hosteller" || s.accommodation === "Hosteler") && (
              <>
                <ProfileRow label="Hostel Name" value={s.hostelName} />
                <ProfileRow label="Hostel Block" value={s.hostelBlock} />
                <ProfileRow label="Room Number" value={s.roomNumber} />
              </>
            )}
          </ProfileSection>

          <ProfileSection title="Contact">
            <ProfileRow label="Personal Email" value={s.email} />
            <ProfileRow label="PSNA Email" value={s.alternateEmail} />
            <ProfileRow label="Mobile (WhatsApp)" value={s.phone} />
          </ProfileSection>

          <ProfileSection title="Parent Details">
            <ProfileRow label="Father's Occupation" value={s.fatherOccupation} />
            <ProfileRow label="Father's Mobile" value={s.fatherPhone} />
            <ProfileRow label="Mother's Name" value={s.motherName} />
            <ProfileRow label="Mother's Occupation" value={s.motherOccupation} />
            <ProfileRow label="Mother's Mobile" value={s.motherPhone} />
          </ProfileSection>

          <ProfileSection title="Academic">
            <ProfileRow label="CGPA" value={s.cgpa ? `${s.cgpa} (Sem ${s.cgpaSemester ?? '—'})` : undefined} />
            <ProfileRow label="Standing Arrears" value={s.activeBacklogs ?? 0} />
            <ProfileRow label="Total Arrear History" value={s.totalBacklogs ?? 0} />
            <ProfileRow label="All Cleared First Attempt" value={s.allSubjectsClearedFirstAttempt} />
            <ProfileRow label="10th %" value={s.tenthPercent ? `${s.tenthPercent}% — ${s.tenthYearOfPassing}` : undefined} />
            <ProfileRow label="10th School" value={s.tenthSchool} />
            <ProfileRow label="12th %" value={s.twelfthPercent ? `${s.twelfthPercent}% — ${s.twelfthYearOfPassing}` : undefined} />
            <ProfileRow label="12th School" value={s.twelfthSchool} />
            {s.diplomaPercent && <>
              <ProfileRow label="Diploma %" value={`${s.diplomaPercent}%`} />
              <ProfileRow label="Diploma Year" value={s.diplomaYearOfPassing} />
            </>}
          </ProfileSection>

          <ProfileSection title="Certifications">
            <ProfileRow label="Certification" value={s.certificationName} />
            <ProfileRow label="Duration" value={s.certificationDuration} />
            <ProfileRow label="Vendor / Authority" value={s.certificationVendor} />
          </ProfileSection>

          <ProfileSection title="Address">
            <ProfileRow label="Line 1" value={s.addressLine1} />
            <ProfileRow label="Line 2" value={s.addressLine2} />
            <ProfileRow label="District" value={s.district} />
            <ProfileRow label="State" value={s.state} />
            <ProfileRow label="Postal Code" value={s.postalCode} />
          </ProfileSection>

          <ProfileSection title="Identity Documents">
            <ProfileRow label="Aadhar" value={s.aadharNumber ? `XXXX XXXX ${String(s.aadharNumber).slice(-4)}` : undefined} />
            <ProfileRow label="PAN Card" value={s.hasPanCard ? s.panCardNumber || 'Available' : 'Not Available'} />
            <ProfileRow label="Passport" value={s.hasPassport ? s.passportNumber || 'Available' : 'Not Available'} />
          </ProfileSection>

          <ProfileSection title="Skills & Placement">
            <div className="col-span-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Skills</div>
              {(s.skills ?? []).length > 0
                ? <div className="flex flex-wrap gap-2">{s.skills.map((sk: string) => <span key={sk} className="px-3 py-1 bg-[#0f3b9c]/10 text-[#0f3b9c] text-xs font-bold rounded-lg">{sk}</span>)}</div>
                : <span className="text-slate-300 italic text-xs font-normal">No skills added</span>}
            </div>
            <ProfileRow label="Hackathons" value={s.hackathons ?? 0} />
            <ProfileRow label="Certifications (count)" value={s.certifications ?? 0} />
            <ProfileRow label="LeetCode Username" value={s.leetcodeUsername} />
            <ProfileRow label="LeetCode Solved" value={s.leetcodeSolved} />
            <ProfileRow label="GitHub" value={s.githubLink} />
            <ProfileRow label="LinkedIn" value={s.linkedinProfile} />
            <ProfileRow label="Resume Link" value={s.resume_link} />
            <ProfileRow label="Resume Strength" value={s.resumeStrengthScore ? `${s.resumeStrengthScore} (${s.resumeStrengthLevel})` : undefined} />
          </ProfileSection>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Upload Students Modal ────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();
const BATCH_YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);
const UPLOAD_DEPARTMENTS = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "IT", "AIDS", "AIML", "CSD"];

function UploadStudentsModal({ onClose, onUploaded }: { onClose: () => void; onUploaded: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [batch, setBatch] = useState<string>("");
  const [dept, setDept] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number; errors: string[] } | null>(null);
  const [error, setError] = useState("");

  async function handleUpload() {
    if (!file) return;
    if (!batch) { setError("Please select the batch year before uploading."); return; }
    if (!dept) { setError("Please select the department before uploading."); return; }
    setUploading(true);
    setError("");
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("batch", batch);
      fd.append("dept", dept);
      const res = await fetch("/api/upload-students", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setResult(data);
      onUploaded();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 12 }}
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-slate-50">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Upload Student Register Numbers</h2>
            <p className="text-[11px] font-medium text-slate-400 mt-0.5">CSV or Excel (.xlsx) — one register number per row. Students fill all details themselves on first login.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-200 transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <div className="p-8 space-y-6">
          {/* Batch Year Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Batch Year <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {BATCH_YEARS.map(y => (
                <button key={y} type="button" onClick={() => setBatch(String(y))}
                  className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all
                    ${batch === String(y)
                      ? "bg-[#0f3b9c] border-[#0f3b9c] text-white shadow-lg shadow-[#0f3b9c]/20"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:border-[#0f3b9c]/40"}`}>
                  {y}
                </button>
              ))}
            </div>
            {batch && (
              <p className="text-[11px] text-slate-400 font-medium">
                Students in this file will be tagged as <span className="font-bold text-[#0f3b9c]">Batch {batch}</span>
              </p>
            )}
          </div>

          {/* Department Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Department <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {UPLOAD_DEPARTMENTS.map(d => (
                <button key={d} type="button" onClick={() => setDept(d)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all
                    ${dept === d
                      ? "bg-[#0f3b9c] border-[#0f3b9c] text-white shadow-lg shadow-[#0f3b9c]/20"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:border-[#0f3b9c]/40"}`}>
                  {d}
                </button>
              ))}
            </div>
            {dept && (
              <p className="text-[11px] text-slate-400 font-medium">
                Every student in this file will be tagged as <span className="font-bold text-[#0f3b9c]">{dept}</span>
              </p>
            )}
          </div>

          <label className={`flex flex-col items-center gap-3 p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all
            ${file ? "border-[#0f3b9c] bg-[#0f3b9c]/5" : "border-slate-200 hover:border-[#0f3b9c]/50 hover:bg-slate-50"}`}>
            <FileUp className={`w-8 h-8 ${file ? "text-[#0f3b9c]" : "text-slate-300"}`} />
            <div className="text-center">
              <p className="text-sm font-bold text-slate-700">{file ? file.name : "Click to choose file"}</p>
              <p className="text-xs text-slate-400 mt-0.5">Supports .csv and .xlsx</p>
            </div>
            <input type="file" accept=".csv,.xlsx,.xls" className="hidden"
              onChange={e => { setFile(e.target.files?.[0] ?? null); setResult(null); setError(""); }} />
          </label>

          <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-500 space-y-1">
            <p className="font-bold text-slate-700 mb-1">File format:</p>
            <p>One register number per row. Header row optional.</p>
            <p className="font-mono bg-white px-2 py-1 rounded border border-slate-200 text-slate-700 mt-1">23CSR001<br/>23CSR002<br/>23CSR003</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-sm font-semibold text-red-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
              <p className="text-sm font-extrabold text-emerald-800">Upload Complete</p>
              <div className="flex gap-4 text-xs font-bold">
                <span className="text-emerald-700">✓ {result.created} accounts created</span>
                <span className="text-slate-500">— {result.skipped} already registered (skipped)</span>
              </div>
              {result.errors.length > 0 && (
                <div className="text-xs text-red-600 space-y-0.5 max-h-24 overflow-y-auto">
                  {result.errors.map((e, i) => <p key={i}>⚠ {e}</p>)}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors">
              {result ? "Close" : "Cancel"}
            </button>
            {!result && (
              <button onClick={handleUpload} disabled={!file || !batch || !dept || uploading}
                className="flex-[2] py-3 rounded-2xl bg-[#0f3b9c] text-white font-bold flex items-center justify-center gap-2 hover:bg-[#0a2d7a] transition-colors shadow-lg shadow-[#0f3b9c]/20 disabled:opacity-50">
                {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><Upload className="w-4 h-4" /> Upload & Register</>}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Admin Edit Student Modal ─────────────────────────────────────────────────

function AdminEditStudentModal({ student, onClose, onSaved }: {
  student: Student & { email?: string; address?: string; phone?: string; fatherOccupation?: string; fatherPhone?: string; motherName?: string; motherOccupation?: string; motherPhone?: string; cgpaSemester?: number; profileComplete?: boolean; linkedinProfile?: string; hackerrankProfile?: string; };
  onClose: () => void;
  onSaved: (updated: any) => void;
}) {
  const [name, setName] = useState(student.name ?? "");
  const [dept, setDept] = useState(student.dept ?? "");
  const [cgpa, setCgpa] = useState(String(student.cgpa ?? ""));
  const [cgpaSemester, setCgpaSemester] = useState(String(student.cgpaSemester ?? ""));
  const [totalBacklogs, setTotalBacklogs] = useState(String(student.totalBacklogs ?? 0));
  const [activeBacklogs, setActiveBacklogs] = useState(String(student.activeBacklogs ?? 0));
  const [email, setEmail] = useState(student.email ?? "");
  const [address, setAddress] = useState(student.address ?? "");
  const [phone, setPhone] = useState(student.phone ?? "");
  const [fatherOccupation, setFatherOccupation] = useState((student as any).fatherOccupation ?? "");
  const [fatherPhone, setFatherPhone] = useState((student as any).fatherPhone ?? "");
  const [motherName, setMotherName] = useState((student as any).motherName ?? "");
  const [motherOccupation, setMotherOccupation] = useState((student as any).motherOccupation ?? "");
  const [motherPhone, setMotherPhone] = useState((student as any).motherPhone ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const DEPTS = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "IT", "AIDS", "AIML", "CSD", "Other"];

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/students/${encodeURIComponent(student.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-key": "psna-admin" },
        body: JSON.stringify({
          name: name.trim(), dept, cgpa: parseFloat(cgpa) || 0,
          cgpaSemester: parseInt(cgpaSemester) || undefined,
          totalBacklogs: parseInt(totalBacklogs) || 0, activeBacklogs: parseInt(activeBacklogs) || 0,
          email: email.trim(), address: address.trim(), phone: phone.trim(),
          fatherOccupation: fatherOccupation.trim(), fatherPhone: fatherPhone.trim(),
          motherName: motherName.trim(), motherOccupation: motherOccupation.trim(), motherPhone: motherPhone.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      onSaved(data);
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  function inp(cls = "") {
    return `w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-semibold outline-none focus:border-[#0f3b9c] focus:ring-4 focus:ring-[#0f3b9c]/5 transition-all ${cls}`;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 12 }}
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-slate-50 shrink-0">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <UserCog className="w-5 h-5 text-[#0f3b9c]" /> Edit Student — {student.id}
            </h2>
            <p className="text-[11px] font-medium text-slate-400 mt-0.5">Admin override: all fields editable including locked profile data</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-200 transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-8 space-y-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Academic Details</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><label className="text-xs font-bold text-slate-600">Full Name</label>
                <input value={name} onChange={e => setName(e.target.value)} className={inp()} />
              </div>
              <div className="space-y-1"><label className="text-xs font-bold text-slate-600">Department</label>
                <select value={dept} onChange={e => setDept(e.target.value)} className={inp()}>
                  <option value="">Select</option>
                  {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="space-y-1"><label className="text-xs font-bold text-slate-600">CGPA</label>
                <input type="number" min="0" max="10" step="0.01" value={cgpa} onChange={e => setCgpa(e.target.value)} className={inp()} />
              </div>
              <div className="space-y-1"><label className="text-xs font-bold text-slate-600">CGPA Up To Semester</label>
                <input type="number" min="1" max="8" value={cgpaSemester} onChange={e => setCgpaSemester(e.target.value)} placeholder="e.g. 5" className={inp()} />
              </div>
              <div className="space-y-1"><label className="text-xs font-bold text-slate-600">Total Backlogs (History)</label>
                <input type="number" min="0" value={totalBacklogs} onChange={e => setTotalBacklogs(e.target.value)} className={inp()} />
              </div>
              <div className="space-y-1"><label className="text-xs font-bold text-slate-600">Active Backlogs</label>
                <input type="number" min="0" value={activeBacklogs} onChange={e => setActiveBacklogs(e.target.value)} className={inp()} />
              </div>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Contact & Personal</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inp()} placeholder="student@email.com" />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1"><MapPin className="w-3 h-3" /> Address</label>
                <input value={address} onChange={e => setAddress(e.target.value)} className={inp()} placeholder="Full address" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} className={inp()} placeholder="10-digit number" maxLength={10} />
              </div>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Parent / Guardian</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><label className="text-xs font-bold text-slate-600">Father's Occupation</label>
                <input value={fatherOccupation} onChange={e => setFatherOccupation(e.target.value)} className={inp()} />
              </div>
              <div className="space-y-1"><label className="text-xs font-bold text-slate-600">Father's Mobile</label>
                <input value={fatherPhone} onChange={e => setFatherPhone(e.target.value)} className={inp()} maxLength={10} />
              </div>
              <div className="space-y-1"><label className="text-xs font-bold text-slate-600">Mother's Name</label>
                <input value={motherName} onChange={e => setMotherName(e.target.value)} className={inp()} />
              </div>
              <div className="space-y-1"><label className="text-xs font-bold text-slate-600">Mother's Occupation</label>
                <input value={motherOccupation} onChange={e => setMotherOccupation(e.target.value)} className={inp()} />
              </div>
              <div className="space-y-1"><label className="text-xs font-bold text-slate-600">Mother's Mobile</label>
                <input value={motherPhone} onChange={e => setMotherPhone(e.target.value)} className={inp()} maxLength={10} />
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-sm font-semibold text-red-700">{error}</p>
            </div>
          )}
        </div>
        <div className="px-8 py-5 border-t border-slate-100 flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-[2] py-3 rounded-2xl bg-[#0f3b9c] text-white font-bold flex items-center justify-center gap-2 hover:bg-[#0a2d7a] transition-colors shadow-lg shadow-[#0f3b9c]/20 disabled:opacity-50">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── CSV Field Definitions ────────────────────────────────────────────────────
const ALL_CSV_FIELDS: { label: string; key: string; getValue: (s: any) => string | number }[] = [
  { label: 'Batch',                   key: 'batch',                   getValue: s => s.batch ?? '' },
  { label: 'Department',              key: 'dept',                    getValue: s => s.dept ?? '' },
  { label: 'Section',                 key: 'section',                 getValue: s => s.section ?? '' },
  { label: 'Gender',                  key: 'gender',                  getValue: s => s.gender ?? '' },
  { label: 'Date of Birth',           key: 'dob',                     getValue: s => s.dob ?? '' },
  { label: 'Nationality',             key: 'nationality',             getValue: s => s.nationality ?? '' },
  { label: 'Hostel Status',           key: 'accommodation',           getValue: s => s.accommodation ?? '' },
  { label: 'Hostel Name',             key: 'hostelName',              getValue: s => s.hostelName ?? '' },
  { label: 'Hostel Block',            key: 'hostelBlock',             getValue: s => s.hostelBlock ?? '' },
  { label: 'Room Number',             key: 'roomNumber',              getValue: s => s.roomNumber ?? '' },
  { label: 'CGPA',                    key: 'cgpa',                    getValue: s => s.cgpa ?? '' },
  { label: 'CGPA Semester',           key: 'cgpaSemester',            getValue: s => s.cgpaSemester ?? '' },
  { label: 'Active Arrears',          key: 'activeBacklogs',          getValue: s => s.activeBacklogs ?? 0 },
  { label: 'Total Arrears',           key: 'totalBacklogs',           getValue: s => s.totalBacklogs ?? 0 },
  { label: 'All Cleared First Attempt', key: 'allCleared',           getValue: s => s.allSubjectsClearedFirstAttempt ? 'Yes' : 'No' },
  { label: 'Personal Email',          key: 'email',                   getValue: s => s.email ?? '' },
  { label: 'PSNA Email',              key: 'alternateEmail',          getValue: s => s.alternateEmail ?? '' },
  { label: 'Mobile',                  key: 'phone',                   getValue: s => s.phone ?? '' },
  { label: "Father's Occupation",     key: 'fatherOccupation',        getValue: s => s.fatherOccupation ?? '' },
  { label: "Father's Mobile",         key: 'fatherPhone',             getValue: s => s.fatherPhone ?? '' },
  { label: "Mother's Name",           key: 'motherName',              getValue: s => s.motherName ?? '' },
  { label: "Mother's Occupation",     key: 'motherOccupation',        getValue: s => s.motherOccupation ?? '' },
  { label: "Mother's Mobile",         key: 'motherPhone',             getValue: s => s.motherPhone ?? '' },
  { label: '10th %',                  key: 'tenthPercent',            getValue: s => s.tenthPercent ?? '' },
  { label: '10th Year',               key: 'tenthYear',               getValue: s => s.tenthYearOfPassing ?? '' },
  { label: '10th School',             key: 'tenthSchool',             getValue: s => s.tenthSchool ?? '' },
  { label: '12th %',                  key: 'twelfthPercent',          getValue: s => s.twelfthPercent ?? '' },
  { label: '12th Year',               key: 'twelfthYear',             getValue: s => s.twelfthYearOfPassing ?? '' },
  { label: '12th School',             key: 'twelfthSchool',           getValue: s => s.twelfthSchool ?? '' },
  { label: 'Aadhar',                  key: 'aadharNumber',            getValue: s => s.aadharNumber ?? '' },
  { label: 'PAN Available',           key: 'hasPanCard',              getValue: s => s.hasPanCard ? 'Yes' : 'No' },
  { label: 'PAN Number',              key: 'panCardNumber',           getValue: s => s.panCardNumber ?? '' },
  { label: 'Passport Available',      key: 'hasPassport',             getValue: s => s.hasPassport ? 'Yes' : 'No' },
  { label: 'Passport Number',         key: 'passportNumber',          getValue: s => s.passportNumber ?? '' },
  { label: 'Address Line 1',          key: 'addressLine1',            getValue: s => s.addressLine1 ?? '' },
  { label: 'Address Line 2',          key: 'addressLine2',            getValue: s => s.addressLine2 ?? '' },
  { label: 'District',                key: 'district',                getValue: s => s.district ?? '' },
  { label: 'State',                   key: 'state',                   getValue: s => s.state ?? '' },
  { label: 'Postal Code',             key: 'postalCode',              getValue: s => s.postalCode ?? '' },
  { label: 'GitHub',                  key: 'githubLink',              getValue: s => s.githubLink ?? '' },
  { label: 'LinkedIn',                key: 'linkedinProfile',         getValue: s => s.linkedinProfile ?? '' },
  { label: 'LeetCode Username',       key: 'leetcodeUsername',        getValue: s => s.leetcodeUsername ?? '' },
  { label: 'HackerRank',              key: 'hackerrankProfile',       getValue: s => s.hackerrankProfile ?? '' },
  { label: 'Resume Link',             key: 'resume_link',             getValue: s => s.resume_link ?? '' },
  { label: 'Skills',                  key: 'skills',                  getValue: s => (s.skills ?? []).join('; ') },
  { label: 'Hackathons',              key: 'hackathons',              getValue: s => s.hackathons ?? 0 },
  { label: 'LeetCode Solved',         key: 'leetcodeSolved',          getValue: s => s.leetcodeSolved ?? '' },
  { label: 'Resume Strength Score',   key: 'resumeStrengthScore',     getValue: s => s.resumeStrengthScore ?? '' },
  { label: 'Resume Strength Level',   key: 'resumeStrengthLevel',     getValue: s => s.resumeStrengthLevel ?? '' },
  { label: 'Quiz Bonus Score',        key: 'quizBonusScore',          getValue: s => s.quizBonusScore ?? '' },
  { label: 'Profile Complete',        key: 'profileComplete',         getValue: s => s.profileComplete ? 'Yes' : 'No' },
];

function CsvFieldPickerModal({
  students, batch, onClose,
}: { students: any[]; batch: string; onClose: () => void }) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(ALL_CSV_FIELDS.map(f => f.key))
  );

  const toggle = (key: string) => setSelected(prev => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });

  const handleDownload = () => {
    const fields = ALL_CSV_FIELDS.filter(f => selected.has(f.key));
    const headers = ['Register No', 'Name', ...fields.map(f => f.label)];
    const rows = students.map(s => [s.id ?? '', s.name ?? '', ...fields.map(f => f.getValue(s))]);
    const label = batch ? `batch-${batch}` : 'students';
    downloadCSV(`${label}-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    onClose();
  };

  const groups = [
    { title: 'Academic', keys: ['batch','dept','section','cgpa','cgpaSemester','activeBacklogs','totalBacklogs','allCleared','tenthPercent','tenthYear','tenthSchool','twelfthPercent','twelfthYear','twelfthSchool'] },
    { title: 'Personal', keys: ['gender','dob','nationality','accommodation','hostelName','hostelBlock','roomNumber','email','alternateEmail','phone','fatherOccupation','fatherPhone','motherName','motherOccupation','motherPhone'] },
    { title: 'Address & Identity', keys: ['addressLine1','addressLine2','district','state','postalCode','aadharNumber','hasPanCard','panCardNumber','hasPassport','passportNumber'] },
    { title: 'Profiles & Skills', keys: ['githubLink','linkedinProfile','leetcodeUsername','hackerrankProfile','resume_link','skills','hackathons','leetcodeSolved','resumeStrengthScore','resumeStrengthLevel','quizBonusScore','profileComplete'] },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 12 }}
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-slate-50 shrink-0">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Select Fields to Export</h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {batch ? `Batch ${batch}` : 'All Students'} · {students.length} records · Register No & Name always included
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Mandatory fields */}
          <div className="flex gap-3">
            {['Register No', 'Name'].map(f => (
              <div key={f} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0f3b9c]/5 border border-[#0f3b9c]/20 text-xs font-bold text-[#0f3b9c]">
                <CheckCircle2 className="w-3.5 h-3.5" /> {f} <span className="text-[9px] text-slate-400 font-normal ml-1">mandatory</span>
              </div>
            ))}
          </div>

          {/* Field groups */}
          {groups.map(group => {
            const groupFields = ALL_CSV_FIELDS.filter(f => group.keys.includes(f.key));
            const allChecked = groupFields.every(f => selected.has(f.key));
            return (
              <div key={group.title}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{group.title}</p>
                  <button onClick={() => {
                    setSelected(prev => {
                      const next = new Set(prev);
                      groupFields.forEach(f => allChecked ? next.delete(f.key) : next.add(f.key));
                      return next;
                    });
                  }} className="text-[10px] font-bold text-[#0f3b9c] hover:underline">
                    {allChecked ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {groupFields.map(f => (
                    <button key={f.key} onClick={() => toggle(f.key)}
                      className={cn("flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold text-left transition-all",
                        selected.has(f.key)
                          ? "bg-[#0f3b9c]/5 border-[#0f3b9c]/30 text-[#0f3b9c]"
                          : "bg-white border-slate-200 text-slate-500 hover:border-slate-300")}>
                      <div className={cn("w-4 h-4 rounded flex items-center justify-center border shrink-0",
                        selected.has(f.key) ? "bg-[#0f3b9c] border-[#0f3b9c]" : "border-slate-300")}>
                        {selected.has(f.key) && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </div>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-400 font-medium">{selected.size + 2} fields selected</p>
          <div className="flex gap-3">
            <button onClick={() => setSelected(new Set(ALL_CSV_FIELDS.map(f => f.key)))}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors">
              Select All
            </button>
            <button onClick={() => setSelected(new Set())}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors">
              Clear All
            </button>
            <button onClick={handleDownload}
              className="flex items-center gap-2 px-6 py-2 rounded-xl bg-[#0f3b9c] text-white text-xs font-black uppercase tracking-widest hover:bg-[#0a2d7a] transition-colors">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Drive CSV Field Picker ───────────────────────────────────────────────────

const ALL_DRIVE_FIELDS: { label: string; key: string; getValue: (c: any) => string | number }[] = [
  { label: 'Role',              key: 'role',              getValue: c => c.role ?? '' },
  { label: 'Salary',           key: 'salary',            getValue: c => c.salary ?? '' },
  { label: 'Requirement Type', key: 'requirementType',   getValue: c => c.requirementType ?? '' },
  { label: 'Min CGPA',         key: 'minCgpa',           getValue: c => c.minCgpa ?? 0 },
  { label: 'Min 10th %',       key: 'min10thPercent',    getValue: c => c.min10thPercent ?? 0 },
  { label: 'Min 12th %',       key: 'min12thPercent',    getValue: c => c.min12thPercent ?? 0 },
  { label: 'Arrear Policy',    key: 'noHistoryOfArrears',getValue: c => c.noHistoryOfArrears ? 'No History' : 'History Allowed' },
  { label: 'Max Active Backlogs', key: 'allowedBacklogs',getValue: c => c.allowedBacklogs ?? 0 },
  { label: 'Seats',            key: 'selectCount',       getValue: c => c.selectCount || 'No cap' },
  { label: 'Required Skills',  key: 'requiredSkills',    getValue: c => (c.requiredSkills ?? []).join('; ') },
  { label: 'Priority Skills',  key: 'prioritySkills',    getValue: c => (c.prioritySkills ?? []).join('; ') },
  { label: 'Accepted Students',key: 'acceptedStudents',  getValue: c => (c.acceptedStudents ?? []).length },
];

function DriveCsvPickerModal({ companies, onClose }: { companies: any[]; onClose: () => void }) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(ALL_DRIVE_FIELDS.map(f => f.key))
  );

  const toggle = (key: string) => setSelected(prev => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });

  const handleDownload = () => {
    const fields = ALL_DRIVE_FIELDS.filter(f => selected.has(f.key));
    const headers = ['Company', ...fields.map(f => f.label)];
    const rows = companies.map(c => [c.name ?? '', ...fields.map(f => f.getValue(c))]);
    downloadCSV(`drives-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 12 }}
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">

        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-slate-50 shrink-0">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Export Drives</h2>
            <p className="text-[11px] font-medium text-slate-400 mt-0.5">Choose which fields to include. Company name is mandatory.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-8 py-6 space-y-3">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 opacity-60">
            <div className="w-4 h-4 rounded bg-[#0f3b9c] flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs font-bold text-slate-700">Company Name</span>
            <span className="ml-auto text-[10px] font-black text-[#0f3b9c] uppercase tracking-widest">Required</span>
          </div>
          {ALL_DRIVE_FIELDS.map(f => (
            <button key={f.key} onClick={() => toggle(f.key)}
              className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-all",
                selected.has(f.key) ? "bg-[#0f3b9c]/5 border-[#0f3b9c]/30" : "bg-white border-slate-200 hover:border-slate-300")}>
              <div className={cn("w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all",
                selected.has(f.key) ? "bg-[#0f3b9c] border-[#0f3b9c]" : "border-slate-300")}>
                {selected.has(f.key) && <CheckCircle2 className="w-3 h-3 text-white" />}
              </div>
              <span className="text-xs font-bold text-slate-700">{f.label}</span>
            </button>
          ))}
        </div>

        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-400 font-medium">{selected.size + 1} fields selected</p>
          <div className="flex gap-3">
            <button onClick={() => setSelected(new Set(ALL_DRIVE_FIELDS.map(f => f.key)))}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors">
              Select All
            </button>
            <button onClick={() => setSelected(new Set())}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors">
              Clear All
            </button>
            <button onClick={handleDownload}
              className="flex items-center gap-2 px-6 py-2 rounded-xl bg-[#0f3b9c] text-white text-xs font-black uppercase tracking-widest hover:bg-[#0a2d7a] transition-colors">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Reminder Modal — shows students with missing mandatory fields ────────────

// Mandatory fields that MUST be filled for a profile to count as complete.
// "critical" fields are highlighted in red in the UI and PDF.
type ReminderField = { key: string; label: string; category: 'Personal' | 'Academic' | 'Address' | 'Identity' | 'Profile' | 'Links'; critical?: boolean };
const REMINDER_FIELDS: ReminderField[] = [
  // Personal
  { key: 'name',           label: 'Full Name',        category: 'Personal', critical: true },
  { key: 'email',          label: 'Email',            category: 'Personal', critical: true },
  { key: 'phone',          label: 'Phone Number',     category: 'Personal', critical: true },
  { key: 'dob',            label: 'Date of Birth',    category: 'Personal' },
  { key: 'gender',         label: 'Gender',           category: 'Personal' },
  { key: 'fatherName',     label: "Father's Name",    category: 'Personal' },
  { key: 'motherName',     label: "Mother's Name",    category: 'Personal' },
  { key: 'fatherPhone',    label: "Father's Phone",   category: 'Personal' },
  // Academic
  { key: 'dept',           label: 'Department',       category: 'Academic', critical: true },
  { key: 'section',        label: 'Section',          category: 'Academic' },
  { key: 'cgpa',           label: 'CGPA',             category: 'Academic', critical: true },
  { key: 'tenthPercent',   label: '10th %',           category: 'Academic' },
  { key: 'twelfthPercent', label: '12th %',           category: 'Academic' },
  // Address
  { key: 'addressLine1',   label: 'Address',          category: 'Address' },
  { key: 'district',       label: 'District',         category: 'Address' },
  { key: 'state',          label: 'State',            category: 'Address' },
  { key: 'postalCode',     label: 'Postal Code',      category: 'Address' },
  // Identity
  { key: 'aadharNumber',   label: 'Aadhar Number',    category: 'Identity' },
  // Profile (resume + photo)
  { key: 'resumePdf',      label: 'Resume PDF',       category: 'Profile', critical: true },
  { key: 'profilePhoto',   label: 'Profile Photo',    category: 'Profile' },
  // Links
  { key: 'githubLink',     label: 'GitHub Link',      category: 'Links', critical: true },
  { key: 'linkedinProfile',label: 'LinkedIn Profile', category: 'Links' },
  { key: 'leetcodeUsername', label: 'LeetCode Username', category: 'Links' },
  { key: 'hackerrankProfile',label: 'HackerRank Profile', category: 'Links' },
];

function isFieldMissing(student: any, key: string): boolean {
  // Special case: resumePdf is stripped from list responses for bandwidth;
  // the API sends a `hasResumePdf` boolean instead.
  if (key === 'resumePdf') return !student.hasResumePdf;
  const v = student[key];
  if (v === null || v === undefined) return true;
  if (typeof v === 'string' && v.trim() === '') return true;
  if (typeof v === 'number' && (key === 'cgpa' || key.includes('Percent')) && v === 0) return true;
  return false;
}

function ReminderModal({ students, onClose }: { students: any[]; onClose: () => void }) {
  const [deptFilter, setDeptFilter] = useState<string>('');
  const [batchFilter, setBatchFilter] = useState<string>('');
  const [sectionFilter, setSectionFilter] = useState<string>('');

  const depts = useMemo(() => Array.from(new Set(students.map(s => s.dept).filter(Boolean))).sort(), [students]);
  const batches = useMemo(() => Array.from(new Set(students.map(s => s.batch).filter(Boolean))).sort((a, b) => b - a), [students]);
  const sections = useMemo(() => Array.from(new Set(students.map(s => s.section).filter(Boolean))).sort(), [students]);

  // For each student, compute list of missing fields
  const report = useMemo(() => {
    return students
      .filter(s => !deptFilter || s.dept === deptFilter)
      .filter(s => !batchFilter || String(s.batch) === batchFilter)
      .filter(s => !sectionFilter || s.section === sectionFilter)
      .map(s => {
        const missing = REMINDER_FIELDS.filter(f => isFieldMissing(s, f.key));
        return { student: s, missing };
      })
      .filter(r => r.missing.length > 0)
      .sort((a, b) => b.missing.length - a.missing.length);
  }, [students, deptFilter, batchFilter, sectionFilter]);

  const totalMissing = report.length;
  const criticalCount = report.filter(r => r.missing.some(f => f.critical)).length;

  const handleDownloadPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const autoTableModule = await import('jspdf-autotable');
    const autoTable = autoTableModule.default;

    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // ── Header band ───────────────────────────────────────────────────────
    doc.setFillColor(15, 59, 156);
    doc.rect(0, 0, pageWidth, 70, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('PSNA COLLEGE OF ENGINEERING AND TECHNOLOGY', pageWidth / 2, 30, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Profile Completion Reminder Report', pageWidth / 2, 50, { align: 'center' });

    // ── Meta strip ────────────────────────────────────────────────────────
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const metaY = 88;
    doc.text(`Generated: ${new Date().toLocaleString()}`, 30, metaY);

    const filterParts: string[] = [];
    if (batchFilter) filterParts.push(`Batch ${batchFilter}`);
    if (deptFilter) filterParts.push(`Dept ${deptFilter}`);
    if (sectionFilter) filterParts.push(`Section ${sectionFilter}`);
    const filterText = filterParts.length ? filterParts.join('  |  ') : 'All Students';
    doc.text(`Filters: ${filterText}`, pageWidth / 2, metaY, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.text(`Incomplete: ${totalMissing}   Critical: ${criticalCount}`, pageWidth - 30, metaY, { align: 'right' });

    // ── Divider ──────────────────────────────────────────────────────────
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(30, metaY + 10, pageWidth - 30, metaY + 10);

    // ── Table ────────────────────────────────────────────────────────────
    autoTable(doc, {
      startY: metaY + 20,
      head: [['#', 'Register No', 'Name', 'Dept', 'Critical Missing', 'Other Missing']],
      body: report.map((r, i) => {
        const critical = r.missing.filter(f => f.critical).map(f => f.label);
        const other    = r.missing.filter(f => !f.critical).map(f => f.label);
        return [
          String(i + 1),
          r.student.id ?? '',
          r.student.name || '(not set)',
          r.student.dept || '-',
          critical.length ? critical.join(', ') : '-',
          other.length ? other.join(', ') : '-',
        ];
      }),
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 5,
        lineColor: [220, 220, 220],
        lineWidth: 0.3,
        overflow: 'linebreak',
        valign: 'top',
      },
      headStyles: {
        fillColor: [15, 59, 156],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'left',
        cellPadding: 7,
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 30, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 105, fontStyle: 'bold', textColor: [15, 59, 156] },
        2: { cellWidth: 110 },
        3: { cellWidth: 50, halign: 'center', fontStyle: 'bold' },
        4: { cellWidth: 210, textColor: [180, 30, 30], fontStyle: 'bold' },
        5: { cellWidth: 'auto', textColor: [90, 90, 90] },
      },
      margin: { left: 30, right: 30, top: 50 },
      didDrawPage: (data) => {
        // Footer page number
        const page = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `PSNA Placement OS  |  Page ${data.pageNumber} of ${page}`,
          pageWidth / 2,
          pageHeight - 15,
          { align: 'center' }
        );
      },
    });

    doc.save(`profile_reminder_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl w-full max-w-5xl my-8 overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-br from-orange-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">Profile Completion Reminder</h2>
              <p className="text-xs font-medium text-slate-500">Students with missing mandatory fields</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-all">
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </div>
          <select value={batchFilter} onChange={e => setBatchFilter(e.target.value)} className="px-3 py-2 text-xs font-bold text-slate-700 rounded-lg border border-slate-200 bg-white outline-none">
            <option value="">All Batches</option>
            {batches.map(b => <option key={b} value={String(b)}>Batch {b}</option>)}
          </select>
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="px-3 py-2 text-xs font-bold text-slate-700 rounded-lg border border-slate-200 bg-white outline-none">
            <option value="">All Departments</option>
            {depts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={sectionFilter} onChange={e => setSectionFilter(e.target.value)} className="px-3 py-2 text-xs font-bold text-slate-700 rounded-lg border border-slate-200 bg-white outline-none">
            <option value="">All Sections</option>
            {sections.map(s => <option key={s} value={s}>Section {s}</option>)}
          </select>
          <div className="flex-1" />
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="font-bold text-slate-700">{totalMissing} Incomplete</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="font-bold text-slate-700">{criticalCount} Critical</span>
            </div>
          </div>
          <button
            onClick={handleDownloadPDF}
            disabled={report.length === 0}
            className="px-5 py-2 rounded-lg bg-[#0f3b9c] text-white hover:bg-[#0a2d7a] disabled:opacity-40 disabled:cursor-not-allowed text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all"
          >
            <FileDown className="w-3.5 h-3.5" /> Download PDF
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {report.length === 0 ? (
            <div className="p-16 text-center">
              <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
              <p className="text-lg font-black text-slate-800">All profiles are complete!</p>
              <p className="text-sm font-medium text-slate-500 mt-1">No students match the current filters with missing fields.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-white sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-5 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest w-12">#</th>
                  <th className="px-5 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Register No</th>
                  <th className="px-5 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Name</th>
                  <th className="px-5 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Dept</th>
                  <th className="px-5 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Missing Fields</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.map((r, i) => (
                  <tr key={r.student.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4 text-xs font-bold text-slate-400">{i + 1}</td>
                    <td className="px-5 py-4 font-mono text-xs font-black text-[#0f3b9c]">{r.student.id}</td>
                    <td className="px-5 py-4 text-sm font-bold text-slate-900">{r.student.name || <span className="italic text-slate-400 text-xs font-normal">Not set</span>}</td>
                    <td className="px-5 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">{r.student.dept || '—'}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {r.missing.map(f => (
                          <span key={f.key} className={cn(
                            "px-2 py-1 rounded-md text-[10px] font-bold",
                            f.critical ? "bg-red-50 text-red-700 border border-red-200" : "bg-slate-100 text-slate-600 border border-slate-200"
                          )}>
                            {f.critical && '⚠ '}{f.label}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Admin Dashboard ─────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"candidates" | "drives">("candidates");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTopScores, setShowTopScores] = useState(false);
  const [shortlistDrive, setShortlistDrive] = useState<Company | null>(null);
  const [search, setSearch] = useState("");
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editStudent, setEditStudent] = useState<any | null>(null);
  const [viewStudent, setViewStudent] = useState<any | null>(null);
  const [freezeLoadingId, setFreezeLoadingId] = useState<string | null>(null);
  const [batchFreezeLoading, setBatchFreezeLoading] = useState<string | null>(null);
  const [downloadBatch, setDownloadBatch] = useState<string>("");
  const [showCsvPicker, setShowCsvPicker] = useState(false);
  const [csvPickerStudents, setCsvPickerStudents] = useState<any[]>([]);
  const [showDriveCsvPicker, setShowDriveCsvPicker] = useState(false);
  const [showReminder, setShowReminder] = useState(false);

  const handleBatchFreeze = async (batchYear: number, freeze: boolean) => {
    const key = `${batchYear}-${freeze}`;
    setBatchFreezeLoading(key);
    try {
      const targets = students.filter((s: any) => Number(s.batch) === batchYear);
      const studentIds = targets.map((s: any) => s.id);
      if (studentIds.length > 0) {
        await fetch(`/api/students`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "x-admin-key": "psna-admin" },
          body: JSON.stringify({ 
            studentIds, 
            update: { profileComplete: freeze, updateApproved: false, updateRequested: false } 
          }),
        });
      }
      setStudents(prev => prev.map((st: any) =>
        Number(st.batch) === batchYear
          ? { ...st, profileComplete: freeze, updateApproved: false, updateRequested: false }
          : st
      ));
    } catch { alert("Batch operation failed."); }
    finally { setBatchFreezeLoading(null); }
  };

  const handleDeleteStudent = async (s: any) => {
    if (!confirm(`Delete ${s.name || s.id}? This cannot be undone.`)) return;
    try {
      await fetch(`/api/students/${encodeURIComponent(s.id)}`, {
        method: "DELETE",
        headers: { "x-admin-key": "psna-admin" },
      });
      setStudents(prev => prev.filter((st: any) => st.id !== s.id));
    } catch { alert("Failed to delete student."); }
  };

  const handleDeleteBatch = async (batchYear: number) => {
    const targets = students.filter((s: any) => Number(s.batch) === batchYear);
    if (!confirm(`Delete ALL ${targets.length} students in Batch ${batchYear}? This cannot be undone.`)) return;
    try {
      await Promise.all(targets.map((s: any) =>
        fetch(`/api/students/${encodeURIComponent(s.id)}`, {
          method: "DELETE",
          headers: { "x-admin-key": "psna-admin" },
        })
      ));
      setStudents(prev => prev.filter((st: any) => Number(st.batch) !== batchYear));
    } catch { alert("Batch delete failed."); }
  };

  useEffect(() => {
    async function loadData() {
      const [studData, compData] = await Promise.all([
        fetchFromGAS("getStudents"),
        fetchFromGAS("getCompanies"),
      ]);
      setStudents(studData);
      setCompanies(compData);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleFreezeToggle = async (s: any) => {
    setFreezeLoadingId(s.id);
    const newFrozen = !s.profileComplete;
    try {
      await fetch(`/api/students/${encodeURIComponent(s.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-key": "psna-admin" },
        body: JSON.stringify({ profileComplete: newFrozen, updateApproved: false, updateRequested: false }),
      });
      setStudents(prev => prev.map((st: any) => st.id === s.id ? { ...st, profileComplete: newFrozen, updateApproved: false, updateRequested: false } : st));
    } catch { alert("Failed to update freeze state."); }
    finally { setFreezeLoadingId(null); }
  };

  const handleApproveUpdate = async (s: any) => {
    setFreezeLoadingId(s.id);
    try {
      await fetch(`/api/students/${encodeURIComponent(s.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-key": "psna-admin" },
        body: JSON.stringify({ updateApproved: true, updateRequested: false }),
      });
      setStudents(prev => prev.map((st: any) => st.id === s.id ? { ...st, updateApproved: true, updateRequested: false } : st));
    } catch { alert("Failed to approve request."); }
    finally { setFreezeLoadingId(null); }
  };

  const handleDeleteDrive = async (id: string, name: string) => {
    if (!confirm(`Delete recruitment drive for ${name}?`)) return;
    try {
      await deleteCompany(id);
      setCompanies(prev => prev.filter(c => c.id !== id));
    } catch {
      alert("Failed to delete drive.");
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesBatch = selectedBatch === "" || String((s as any).batch) === selectedBatch;
    const matchesSearch = search === "" ||
      (s.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (s.id ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (s.dept ?? '').toLowerCase().includes(search.toLowerCase());
    return matchesBatch && matchesSearch;
  });

  const filteredCompanies = companies.filter(c =>
    search === "" ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.role ?? "").toLowerCase().includes(search.toLowerCase())
  );

  // Memoize PRS for candidate table display
  const studentPRS = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of students) map.set(s.id, computePRS(s).composite);
    return map;
  }, [students]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#0f3b9c]">
      <div className="w-10 h-10 border-4 border-[#0f3b9c]/20 border-t-[#0f3b9c] rounded-full animate-spin mb-4" />
      <div className="text-sm font-semibold tracking-wide">Accessing Administrative Core...</div>
    </div>
  );

  return (
    <div className="space-y-10 pb-24">
      {/* Header */}
      <div className="flex flex-col items-center text-center gap-8 pb-10 border-b border-slate-200">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Administrative Terminal</h1>
          <p className="text-sm font-medium text-slate-500 mt-2">Secure oversight and candidate management portal for PSNA College</p>
        </div>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <button
            onClick={() => setShowTopScores(true)}
            className="px-8 py-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm"
          >
            <Trophy className="w-4 h-4" /> Top Scores
          </button>
          <a
            href="/dashboard/admin/perf"
            className="px-8 py-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm"
          >
            <Activity className="w-4 h-4" /> Perf Tests
          </a>
          <button
            onClick={() => setShowReminder(true)}
            className="px-8 py-3.5 rounded-2xl bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100 text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm"
          >
            <BellRing className="w-4 h-4" /> Reminder
          </button>
          <button
            onClick={() => { setShowUploadModal(true); setActiveTab("candidates"); }}
            className="px-8 py-3.5 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-black uppercase tracking-widest transition-all shadow-2xl shadow-emerald-600/20 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" /> Upload Students
          </button>
          <div className="flex items-center rounded-2xl border border-[#0f3b9c]/30 overflow-hidden shadow-2xl shadow-[#0f3b9c]/10">
            <select
              value={downloadBatch}
              onChange={e => setDownloadBatch(e.target.value)}
              className="px-4 py-3.5 bg-white text-xs font-bold text-slate-700 border-r border-[#0f3b9c]/20 outline-none"
            >
              <option value="">All Batches</option>
              {Array.from(new Set(students.map((s: any) => s.batch).filter(Boolean))).sort((a: any, b: any) => b - a).map((b: any) => (
                <option key={b} value={String(b)}>Batch {b}</option>
              ))}
            </select>
            <button
              onClick={() => {
                const src = downloadBatch ? students.filter((s: any) => String(s.batch) === downloadBatch) : students;
                setCsvPickerStudents(src as any[]);
                setShowCsvPicker(true);
              }}
              className="px-6 py-3.5 bg-[#0f3b9c] text-white hover:bg-[#0a2d7a] text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Download
            </button>
          </div>
          <button
            onClick={() => { setShowCreateModal(true); setActiveTab("drives"); }}
            className="px-8 py-3.5 rounded-2xl bg-[#0f3b9c] text-white hover:bg-blue-800 text-xs font-black uppercase tracking-widest transition-all shadow-2xl shadow-[#0f3b9c]/30 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Drive
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Candidates" value={students.length.toString()} delta={`${students.length} records`} icon={<Users className="text-blue-500" />} />
        <StatCard label="Eligible Pool" value={students.filter(s => s.activeBacklogs === 0 && s.cgpa >= 6).length.toString()} delta="No active arrears" icon={<CheckCircle2 className="text-emerald-500" />} />
        <StatCard label="Active Drives" value={companies.length.toString()} delta="Live" icon={<Building2 className="text-indigo-500" />} />
        <StatCard label="Skill-Based Drives" value={companies.filter(c => c.requirementType === "skill-based").length.toString()} delta="Filtered" icon={<BarChart4 className="text-amber-500" />} />
      </div>

      {/* Tab Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner">
          {(["candidates", "drives"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn("px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                activeTab === tab ? "bg-white text-[#0f3b9c] shadow-sm" : "text-slate-500 hover:text-slate-700")}>
              {tab === "candidates" ? "Candidate Registry" : "Recruitment Registry"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-10 lg:col-start-2">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">

            {/* Table Header / Search */}
            <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row items-center gap-6 bg-slate-50/30">
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                  {activeTab === "candidates"
                    ? <><Users className="w-5 h-5 text-[#0f3b9c]" /> Candidate Registry</>
                    : <><Building2 className="w-5 h-5 text-[#0f3b9c]" /> Recruitment Registry</>}
                </h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">
                  {activeTab === "candidates" ? `${filteredStudents.length} candidates` : `${filteredCompanies.length} active drives`}
                </p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => {
                    if (activeTab === 'candidates') {
                      setCsvPickerStudents(filteredStudents as any[]);
                      setShowCsvPicker(true);
                    } else {
                      setShowDriveCsvPicker(true);
                    }
                  }}
                  className="p-3.5 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-[#0f3b9c] hover:border-[#0f3b9c]/30 transition-all shadow-sm"
                  title="Export to CSV"
                >
                  <Download className="w-5 h-5" />
                </button>
                {activeTab === "candidates" && (() => {
                  const batches = Array.from(new Set(students.map((s: any) => s.batch).filter(Boolean))).sort((a: any, b: any) => b - a) as number[];
                  return batches.length > 0 ? (
                    <select
                      value={selectedBatch}
                      onChange={e => setSelectedBatch(e.target.value)}
                      className="py-3 px-4 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-[#0f3b9c]/10 focus:border-[#0f3b9c] outline-none transition-all shadow-sm"
                    >
                      <option value="">All Batches</option>
                      {batches.map(b => <option key={b} value={String(b)}>Batch {b}</option>)}
                    </select>
                  ) : null;
                })()}
                <div className="relative flex-1 sm:w-72">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder={activeTab === "candidates" ? "Search by name, ID, dept…" : "Search drives…"}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-[#0f3b9c]/10 focus:border-[#0f3b9c] outline-none transition-all shadow-sm"
                  />
                </div>
                {activeTab === "drives" && (
                  <button onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#0f3b9c] text-white text-xs font-black uppercase tracking-widest hover:bg-blue-800 transition-all shadow-lg shadow-[#0f3b9c]/20 whitespace-nowrap">
                    <Plus className="w-4 h-4" /> New Drive
                  </button>
                )}
              </div>
            </div>

            {/* Pending Update Requests Banner */}
            {activeTab === "candidates" && (() => {
              const pending = students.filter((s: any) => s.updateRequested && !s.updateApproved);
              if (!pending.length) return null;
              return (
                <div className="mx-8 mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-black uppercase tracking-widest text-amber-700 mb-3">
                    ⏳ {pending.length} Pending Update Request{pending.length > 1 ? 's' : ''}
                  </p>
                  <div className="space-y-2">
                    {pending.map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-amber-100">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{s.name || s.id} <span className="text-xs text-slate-400 font-normal">({s.id})</span></p>
                          <p className="text-xs text-slate-500 mt-0.5 italic">"{s.updateReason}"</p>
                        </div>
                        <button onClick={() => handleApproveUpdate(s)} disabled={freezeLoadingId === s.id}
                          className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-60">
                          {freezeLoadingId === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          Approve
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Batch Freeze / Unfreeze */}
            {activeTab === "candidates" && (() => {
              const batches = Array.from(new Set(students.map((s: any) => s.batch).filter(Boolean))).sort((a: any, b: any) => b - a) as number[];
              if (!batches.length) return null;
              return (
                <div className="mx-8 mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-3">Batch Freeze Controls</p>
                  <div className="flex flex-wrap gap-3">
                    {batches.map(b => {
                      const batchStudents = students.filter((s: any) => Number(s.batch) === b);
                      const allFrozen = batchStudents.every((s: any) => s.profileComplete);
                      const allUnfrozen = batchStudents.every((s: any) => !s.profileComplete);
                      const freezeKey = `${b}-true`;
                      const unfreezeKey = `${b}-false`;
                      return (
                        <div key={b} className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">
                          <span className="text-xs font-black text-slate-700 mr-1">Batch {b}</span>
                          <span className="text-[10px] text-slate-400 font-medium mr-2">({batchStudents.length} students)</span>
                          <button
                            onClick={() => handleBatchFreeze(b, false)}
                            disabled={batchFreezeLoading !== null || allUnfrozen}
                            className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                          >
                            {batchFreezeLoading === unfreezeKey ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unlock className="w-3 h-3" />}
                            Unfreeze All
                          </button>
                          <button
                            onClick={() => handleBatchFreeze(b, true)}
                            disabled={batchFreezeLoading !== null || allFrozen}
                            className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                          >
                            {batchFreezeLoading === freezeKey ? <Loader2 className="w-3 h-3 animate-spin" /> : <Lock className="w-3 h-3" />}
                            Freeze All
                          </button>
                          <button
                            onClick={() => handleDeleteBatch(b)}
                            disabled={batchFreezeLoading !== null}
                            className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[10px] font-black uppercase tracking-widest hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                          >
                            <Trash2 className="w-3 h-3" /> Delete Batch
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Table Body */}
            <div className="overflow-x-auto">
              {activeTab === "candidates" ? (
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 border-b border-slate-100">
                    <tr>
                      <th className="px-8 py-5">Candidate ID</th>
                      <th className="px-8 py-5">Name</th>
                      <th className="px-8 py-5">Department</th>
                      <th className="px-8 py-5 text-center">CGPA</th>
                      <th className="px-8 py-5 text-center">Backlogs</th>
                      <th className="px-8 py-5 text-center">PRS Score</th>
                      <th className="px-8 py-5 text-center">Profile</th>
                      <th className="px-8 py-5 text-right">Edit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map(s => {
                      const prs = studentPRS.get(s.id) ?? 0;
                      const sAny = s as any;
                      return (
                        <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-5 font-mono text-xs font-bold text-[#0f3b9c]">{s.id}</td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-[#0f3b9c] text-white flex items-center justify-center text-sm font-bold overflow-hidden shrink-0">
                                {sAny.profilePhoto
                                  ? <img src={sAny.profilePhoto} alt="" className="w-full h-full object-cover" />
                                  : s.name?.[0] || "?"}
                              </div>
                              <span className="text-sm font-bold text-slate-900">{s.name || <span className="text-slate-400 italic font-normal text-xs">Pending setup</span>}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">{s.dept}</td>
                          <td className="px-8 py-5 text-center font-extrabold text-[#0f3b9c] tabular-nums">{s.cgpa}</td>
                          <td className="px-8 py-5 text-center">
                            <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-black uppercase",
                              s.activeBacklogs === 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>
                              {s.activeBacklogs} active
                            </span>
                          </td>
                          <td className="px-8 py-5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full bg-[#0f3b9c] transition-all" style={{ width: `${prs}%` }} />
                              </div>
                              <span className="text-xs font-extrabold text-[#0f3b9c] tabular-nums w-6">{prs}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-center">
                            {sAny.profileComplete ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Complete</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Pending</span>
                              </div>
                            )}
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => setViewStudent(sAny)}
                                className="p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all border border-slate-200"
                                title="View Full Profile">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button onClick={() => setEditStudent(sAny)}
                                className="p-2.5 rounded-xl bg-[#0f3b9c]/5 text-[#0f3b9c] hover:bg-[#0f3b9c]/15 transition-all border border-[#0f3b9c]/20"
                                title="Edit Student">
                                <UserCog className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleFreezeToggle(sAny)}
                                disabled={freezeLoadingId === s.id}
                                title={sAny.profileComplete ? "Unfreeze Profile" : "Freeze Profile"}
                                className={cn("p-2.5 rounded-xl transition-all border disabled:opacity-50",
                                  sAny.profileComplete
                                    ? "bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-200"
                                    : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200")}>
                                {freezeLoadingId === s.id
                                  ? <Loader2 className="w-4 h-4 animate-spin" />
                                  : sAny.profileComplete
                                    ? <Lock className="w-4 h-4" />
                                    : <Unlock className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={async () => {
                                  const res = await fetch(`/api/students/${encodeURIComponent(s.id)}`);
                                  const data = await res.json();
                                  if (!data.resumePdf) { alert('No resume uploaded for this student.'); return; }
                                  const link = document.createElement('a');
                                  link.href = data.resumePdf;
                                  link.download = `${s.id}_resume.pdf`;
                                  link.click();
                                }}
                                title="Download Resume PDF"
                                className="p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all border border-blue-200">
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(sAny)}
                                title="Delete Student"
                                className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all border border-red-200">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredStudents.length === 0 && (
                      <tr><td colSpan={8} className="px-8 py-16 text-center text-sm font-semibold text-slate-400">No candidates match your search.</td></tr>
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-5">Company</th>
                      <th className="px-6 py-5">Role</th>
                      <th className="px-6 py-5">Salary</th>
                      <th className="px-6 py-5 text-center">Requirements</th>
                      <th className="px-6 py-5 text-center">Min CGPA</th>
                      <th className="px-6 py-5 text-center">Arrear Policy</th>
                      <th className="px-6 py-5 text-center">Seats</th>
                      <th className="px-6 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCompanies.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#0f3b9c]/10 text-[#0f3b9c] flex items-center justify-center font-extrabold text-xs shrink-0">
                              {c.name[0]}
                            </div>
                            <span className="text-sm font-bold text-slate-900 whitespace-nowrap">{c.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-xs font-bold text-slate-600 whitespace-nowrap">
                          {c.role || <span className="text-slate-300 font-medium">—</span>}
                        </td>
                        <td className="px-6 py-5">
                          {c.salary
                            ? <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-black border border-emerald-100 whitespace-nowrap">{c.salary}</span>
                            : <span className="text-slate-300 text-xs font-medium">—</span>}
                        </td>
                        <td className="px-6 py-5 text-center">
                          {c.requirementType === "skill-based" ? (
                            <div className="inline-flex flex-col items-center gap-1">
                              <span className="px-2.5 py-1 rounded-full bg-[#0f3b9c]/10 text-[#0f3b9c] text-[9px] font-black uppercase">Skill-Based</span>
                              {c.requiredSkills?.length > 0 && (
                                <span className="text-[9px] text-slate-400 font-semibold">
                                  {c.requiredSkills.slice(0, 2).join(", ")}{c.requiredSkills.length > 2 ? ` +${c.requiredSkills.length - 2}` : ""}
                                </span>
                              )}
                            </div>
                          ) : c.requirementType === "interested" ? (
                            <div className="inline-flex flex-col items-center gap-1">
                              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase border border-emerald-200">Interested</span>
                              <span className="text-[9px] text-slate-400 font-semibold">{(c as any).acceptedStudents?.length ?? 0} accepted</span>
                            </div>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[9px] font-black uppercase">Open to All</span>
                          )}
                        </td>
                        <td className="px-6 py-5 text-center font-extrabold text-[#0f3b9c] tabular-nums">
                          {c.minCgpa > 0 ? c.minCgpa : <span className="text-slate-300 font-medium">—</span>}
                        </td>
                        <td className="px-6 py-5 text-center">
                          <ArrearBadge noHistory={c.noHistoryOfArrears ?? false} allowedBacklogs={c.allowedBacklogs ?? 0} />
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className="text-xs font-bold text-slate-600 tabular-nums">
                            {c.selectCount ? c.selectCount : <span className="text-slate-400 font-medium">No cap</span>}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setShortlistDrive(c)}
                              className="p-2.5 rounded-xl bg-[#0f3b9c]/5 text-[#0f3b9c] hover:bg-[#0f3b9c]/15 transition-all border border-[#0f3b9c]/20"
                              title="View Shortlist"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                const isInterested = c.requirementType === 'interested';
                                const accepted = (c as any).acceptedStudents ?? [];
                                const rejected = new Set<string>((c as any).finalRejected ?? []);
                                const pool = (students as any[])
                                  .filter(s => checkEligibility(s as any, c as any).eligible)
                                  .filter(s => !isInterested || accepted.includes(s.id))
                                  .filter(s => !rejected.has(s.id))
                                  .map(s => ({ ...s, score: computeDriveScore(s as any, c as any).score }))
                                  .sort((a, b) => b.score - a.score);
                                const cap = (c as any).selectCount ?? 0;
                                // Fill cap slots, accounting for removed rejected students
                                const selected = cap > 0 ? pool.slice(0, cap) : pool;
                                setCsvPickerStudents(selected);
                                setShowCsvPicker(true);
                              }}
                              className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all border border-emerald-200"
                              title="Download Shortlisted Students (excludes rejected)"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteDrive(c.id, c.name)}
                              className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm border border-red-100"
                              title="Delete Drive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredCompanies.length === 0 && (
                      <tr><td colSpan={8} className="px-8 py-16 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <Building2 className="w-10 h-10 text-slate-200" />
                          <div>
                            <p className="text-sm font-bold text-slate-400">No drives yet</p>
                            <button onClick={() => setShowCreateModal(true)} className="mt-2 text-xs font-bold text-[#0f3b9c] hover:underline">
                              Create your first drive →
                            </button>
                          </div>
                        </div>
                      </td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateDriveModal
            onClose={() => setShowCreateModal(false)}
            onCreated={company => setCompanies(prev => [...prev, company])}
          />
        )}
        {showTopScores && (
          <TopScoresModal students={students} onClose={() => setShowTopScores(false)} />
        )}
        {shortlistDrive && (
          <ShortlistModal
            drive={shortlistDrive}
            students={students}
            allDrives={companies}
            onClose={() => setShortlistDrive(null)}
            onDriveUpdate={updated => {
              setCompanies(prev => prev.map(c => c.id === shortlistDrive.id ? { ...c, ...updated } : c));
              setShortlistDrive(prev => prev ? { ...prev, ...updated } : prev);
            }}
          />
        )}
        {viewStudent && (
          <StudentProfileModal
            student={viewStudent}
            onClose={() => setViewStudent(null)}
          />
        )}
        {showUploadModal && (
          <UploadStudentsModal
            onClose={() => setShowUploadModal(false)}
            onUploaded={async () => {
              const studData = await fetchFromGAS("getStudents");
              setStudents(studData);
            }}
          />
        )}
        {editStudent && (
          <AdminEditStudentModal
            student={editStudent}
            onClose={() => setEditStudent(null)}
            onSaved={updated => {
              setStudents(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated } : s));
              setEditStudent(null);
            }}
          />
        )}
        {showCsvPicker && (
          <CsvFieldPickerModal
            students={csvPickerStudents}
            batch={downloadBatch}
            onClose={() => setShowCsvPicker(false)}
          />
        )}
        {showDriveCsvPicker && (
          <DriveCsvPickerModal
            companies={filteredCompanies as any[]}
            onClose={() => setShowDriveCsvPicker(false)}
          />
        )}
        {showReminder && (
          <ReminderModal students={students as any[]} onClose={() => setShowReminder(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, delta, icon }: { label: string; value: string; delta: string; icon: ReactNode }) {
  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm group hover:border-[#0f3b9c]/30 transition-all">
      <div className="flex items-center justify-between mb-8">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:scale-110 transition-all">
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-2 mb-1">
        <div className="text-4xl font-extrabold text-slate-900 tracking-tight">{value}</div>
        <div className="text-[10px] font-bold text-slate-400 uppercase">{delta}</div>
      </div>
      <div className="w-full h-1 bg-slate-50 rounded-full mt-4 overflow-hidden">
        <div className="h-full bg-[#0f3b9c]/20 w-3/4 rounded-full" />
      </div>
    </div>
  );
}
