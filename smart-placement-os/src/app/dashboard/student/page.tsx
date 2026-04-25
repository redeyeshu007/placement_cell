"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Target,
  AlertCircle,
  TrendingUp,
  Building2,
  Info,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ArrowUpRight,
  Code,
  Globe,
  Award,
  Zap,
  Star,
  Lightbulb
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useMemo, ReactNode } from "react";
import React from "react";
import { fetchFromGAS, updateStudent } from "@/lib/api";
import { Student, Company, getStudentStatus, StudentStatus } from "@/lib/matching";

export default function StudentDashboard() {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  useEffect(() => {
    const savedId = localStorage.getItem("spos_user_id");
    if (!savedId) {
      router.push("/auth/login");
      return;
    }

    async function loadData() {
      const [studData, compData] = await Promise.all([
        fetchFromGAS('getStudents'),
        fetchFromGAS('getCompanies')
      ]);

      const currentStudent = studData.find((s: any) => String(s.id) === savedId);
      if (!currentStudent) {
        router.push("/auth/login");
        return;
      }

      setStudent(currentStudent);
      setAllStudents(studData);
      setCompanies(compData);
      setLoading(false);
    }
    loadData();
  }, [router]);

  // Pre-compute statuses for all companies (memoized to avoid recomputation on every render)
  const companyStatuses = useMemo(() => {
    if (!student) return new Map<string, StudentStatus>();
    const map = new Map<string, StudentStatus>();
    for (const company of companies) {
      map.set(company.id, getStudentStatus(student, company, allStudents));
    }
    return map;
  }, [student, companies, allStudents]);

  if (loading || !student) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#0f3b9c]">
      <div className="w-10 h-10 border-4 border-[#0f3b9c]/20 border-t-[#0f3b9c] rounded-full animate-spin mb-4" />
      <div className="text-sm font-semibold tracking-wide">Loading Dashboard Data...</div>
    </div>
  );

  const selectedCount = [...companyStatuses.values()].filter(s => s.status === 'selected').length;

  return (
    <div className="space-y-10 pt-10 pb-24">
      {/* Identity Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-3">
             <div className="px-2.5 py-1 rounded bg-slate-100 text-slate-600 text-xs font-semibold tracking-wide">ID: {student.id}</div>
             <div className="px-2.5 py-1 rounded bg-[#0f3b9c]/10 text-[#0f3b9c] text-xs font-semibold tracking-wide">verified</div>
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-slate-900">{student.name}</h1>
            <div className="flex items-center gap-3">
              <div className="text-sm font-medium text-slate-500">
                {(student as any).batch ? `Batch ${(student as any).batch}` : 'Batch —'} • {student.dept || '—'}
              </div>
              <div className="text-[10px] font-bold text-[#0f3b9c] uppercase tracking-widest mt-1">
                PSNA COLLEGE OF ENGINEERING AND TECHNOLOGY
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <div className="bg-white border border-slate-200 px-6 py-4 rounded-xl flex items-center gap-4 shadow-sm">
            <div>
              <span className="text-xs font-medium text-slate-500 block">Shortlisted In</span>
              <span className="text-sm font-bold text-emerald-600">{selectedCount} Drive{selectedCount !== 1 ? 's' : ''}</span>
            </div>
            <Trophy className="w-8 h-8 text-emerald-500" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Aggregate CGPA" value={student.cgpa.toString()} sub="Current standing" icon={<TrendingUp />} color="#0f3b9c" />
        <StatCard label="Skill Quotient" value={`${Math.min(100, student.skills.length * 15)}%`} sub="Portfolio strength" icon={<Zap />} color="#f59e0b" />
        <StatCard label="Active Backlogs" value={student.activeBacklogs.toString()} sub="Current risk level" icon={<AlertCircle />} color={student.activeBacklogs > 0 ? "#ef4444" : "#10b981"} />
        <StatCard label="Certifications" value={student.certifications.toString()} sub="Verified credentials" icon={<Award />} color="#6366f1" />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <Building2 className="w-6 h-6 text-[#0f3b9c]" /> Active Drives
            </h2>
          </div>

          {companies.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm font-medium">
              No active drives at the moment. Check back soon.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {companies.map((company, i) => {
                const status = companyStatuses.get(company.id);
                return (
                  <DriveCard
                    key={company.id}
                    company={company}
                    status={status}
                    index={i}
                    onClick={() => setSelectedCompany(company)}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
               <TrendingUp className="w-5 h-5 text-[#0f3b9c]" /> Quick Insights
            </h3>
            <div className="space-y-5">
               <InsightItem title="How Shortlisting Works" desc="The system auto-ranks eligible students. No manual apply — your profile data determines selection." color="#0f3b9c" />
               <InsightItem title="Boost Your Score" desc="Upload resume and sync LeetCode to improve your PRS before deadlines." color="#f59e0b" />
               <InsightItem title="GitHub Projects" desc="Validate GitHub projects via the Projects tab to earn extra ranking points." color="#10b981" />
            </div>
          </div>

          <CodingStats studentId={student.id} initialUsername={(student as any).leetcodeUsername || undefined} />

          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
             <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
               <Globe className="w-5 h-5 text-[#0f3b9c]" /> Important Links
             </h3>
             <div className="space-y-3">
               <button onClick={() => window.open(student.githubLink, '_blank')} className="w-full flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-200 hover:border-[#0f3b9c] hover:text-[#0f3b9c] transition-all group font-semibold text-sm text-slate-700">
                 GitHub Profile
                 <ArrowUpRight className="w-4 h-4" />
               </button>
               <button onClick={() => window.open(student.resume_link, '_blank')} className="w-full flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-200 hover:border-[#0f3b9c] hover:text-[#0f3b9c] transition-all group font-semibold text-sm text-slate-700">
                 View Resume
                 <ArrowUpRight className="w-4 h-4" />
               </button>
             </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedCompany && (
          <Modal onClose={() => setSelectedCompany(null)} title={selectedCompany.name}>
            <DriveDetailView
              student={student}
              company={selectedCompany}
              status={companyStatuses.get(selectedCompany.id)}
            />
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Drive Card ───────────────────────────────────────────────────────────────

function DriveCard({ company, status, index, onClick }: {
  company: Company;
  status: StudentStatus | undefined;
  index: number;
  onClick: () => void;
}) {
  const statusConfig = {
    'selected': {
      badge: 'SHORTLISTED',
      badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      cardBorder: 'border-emerald-200',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
    'eligible-not-selected': {
      badge: 'ELIGIBLE',
      badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200',
      cardBorder: 'border-amber-100',
      icon: <Clock className="w-3.5 h-3.5" />,
    },
    'not-eligible': {
      badge: 'NOT ELIGIBLE',
      badgeClass: 'bg-red-50 text-red-600 border border-red-200',
      cardBorder: 'border-slate-200',
      icon: <XCircle className="w-3.5 h-3.5" />,
    },
  };

  const cfg = status ? statusConfig[status.status] : statusConfig['not-eligible'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      onClick={onClick}
      className={cn("jobia-card cursor-pointer group flex flex-col border", cfg.cardBorder)}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="w-12 h-12 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-xl text-indigo-600">
          {company.name[0]}
        </div>
        {status && status.status !== 'not-eligible' && (
          <div className="text-right">
            <div className="text-2xl font-bold leading-none mb-1 text-[#0f3b9c]">
              #{status.rank}
            </div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-widest">
              of {status.totalEligible}
            </div>
          </div>
        )}
      </div>

      <h3 className="text-lg font-bold text-slate-800 mb-1">{company.name}</h3>
      <div className="text-xs text-slate-500 font-medium mb-1">
        {company.role || 'Software Engineer'} {company.salary ? `• ${company.salary}` : ''}
      </div>
      <div className="text-xs text-slate-400 font-medium mb-6">
        {company.requirementType === 'skill-based' ? 'Skill-Based' : 'Open to All'} • 2026 Batch
      </div>

      <div className="flex flex-wrap gap-2 mb-8 mt-auto">
        {company.requiredSkills.slice(0, 3).map(skill => (
          <span key={skill} className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
            {skill}
          </span>
        ))}
        {company.requiredSkills.length > 3 && (
          <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-500 text-xs font-medium border border-slate-200">
            +{company.requiredSkills.length - 3}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <div className={cn("px-3 py-1 rounded flex items-center gap-1.5 text-xs font-bold", cfg.badgeClass)}>
          {cfg.icon} {cfg.badge}
        </div>
        <button className="text-sm font-semibold text-[#0f3b9c] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          Details <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Drive Detail View ────────────────────────────────────────────────────────

function DriveDetailView({ student, company, status }: {
  student: Student;
  company: Company;
  status: StudentStatus | undefined;
}) {
  if (!status) return null;

  const isSelected = status.status === 'selected';
  const isEligible = status.status !== 'not-eligible';

  return (
    <div className="space-y-8">
      {/* Status Banner */}
      <div className={cn(
        "p-5 rounded-xl border flex items-center gap-4",
        isSelected
          ? "bg-emerald-50 border-emerald-200"
          : isEligible
            ? "bg-amber-50 border-amber-200"
            : "bg-red-50 border-red-200"
      )}>
        <div className="shrink-0">
          {isSelected
            ? <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            : isEligible
              ? <Clock className="w-8 h-8 text-amber-600" />
              : <XCircle className="w-8 h-8 text-red-600" />
          }
        </div>
        <div>
          <div className={cn(
            "text-lg font-bold",
            isSelected ? "text-emerald-700" : isEligible ? "text-amber-700" : "text-red-700"
          )}>
            {isSelected ? "You are shortlisted!" : isEligible ? "Eligible — awaiting final selection" : "Not eligible for this drive"}
          </div>
          {isEligible && (
            <div className="text-sm font-medium text-slate-600 mt-0.5">
              Rank <span className="font-bold">#{status.rank}</span> out of <span className="font-bold">{status.totalEligible}</span> eligible students
              {company.selectCount ? ` • Top ${company.selectCount} selected` : ' • No cap set'}
            </div>
          )}
        </div>
      </div>

      {/* Score Breakdown */}
      {isEligible && (
        <div>
          <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">Your Score Breakdown</h4>
          <div className="grid grid-cols-3 gap-3">
            <ScoreTile label="Combined Score" value={`${status.combinedScore}`} unit="pts" color="#0f3b9c" />
            <ScoreTile label="PRS Score" value={`${status.prsScore}`} unit="pts" color="#6366f1" />
            <ScoreTile label="Skill Match" value={`${status.skillMatchPercent}`} unit="%" color="#f59e0b" />
          </div>
        </div>
      )}

      {/* Rejection Reasons */}
      {!isEligible && status.reasons.length > 0 && (
        <div className="p-5 rounded-xl bg-red-50 border border-red-100">
          <h4 className="flex items-center gap-2 text-red-700 font-bold text-sm mb-3">
            <AlertCircle className="w-4 h-4" /> Why You Are Not Eligible
          </h4>
          <ul className="space-y-2">
            {status.reasons.map((reason, i) => (
              <li key={i} className="text-sm font-medium text-red-600 flex items-start gap-2">
                <span className="mt-1 shrink-0">•</span> {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Improvement Suggestions */}
      {status.suggestions.length > 0 && (
        <div className="p-5 rounded-xl bg-blue-50 border border-blue-100">
          <h4 className="flex items-center gap-2 text-blue-700 font-bold text-sm mb-3">
            <Lightbulb className="w-4 h-4" /> How to Improve Your Chances
          </h4>
          <ul className="space-y-2">
            {status.suggestions.map((tip, i) => (
              <li key={i} className="text-sm font-medium text-blue-700 flex items-start gap-2">
                <span className="mt-1 shrink-0 text-blue-400">→</span> {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Drive Requirements */}
      <div>
        <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">Drive Requirements</h4>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <RequirementTile label="Min CGPA" value={company.minCgpa.toString()} met={student.cgpa >= company.minCgpa} />
          <RequirementTile label="Max Active Backlogs" value={(company.allowedBacklogs === undefined || company.allowedBacklogs === -1) ? 'No Limit' : company.allowedBacklogs.toString()} met={(company.allowedBacklogs === undefined || company.allowedBacklogs === -1) || student.activeBacklogs <= company.allowedBacklogs} />
          {company.noHistoryOfArrears && (
            <RequirementTile label="Arrear History" value="Zero required" met={student.totalBacklogs === 0} />
          )}
          {company.selectCount ? (
            <RequirementTile label="Seats Available" value={company.selectCount.toString()} met={true} />
          ) : null}
        </div>

        {company.requiredSkills.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Required Skills</div>
            {company.requiredSkills.map(skill => {
              const hasSkill = student.skills.some(s => s.toLowerCase() === skill.toLowerCase());
              const isPriority = company.prioritySkills.some(ps => ps.toLowerCase() === skill.toLowerCase());
              return (
                <div key={skill} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-700">{skill}</span>
                    {isPriority && (
                      <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded uppercase tracking-wide">Priority</span>
                    )}
                  </div>
                  {hasSkill ? (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded">Verified</span>
                  ) : (
                    <span className="text-xs font-bold text-red-600 bg-red-100 px-2.5 py-1 rounded">Gap</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreTile({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  return (
    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
      <div className="text-2xl font-bold mb-0.5" style={{ color }}>{value}<span className="text-sm ml-0.5">{unit}</span></div>
      <div className="text-[10px] font-semibold uppercase text-slate-400 tracking-wide">{label}</div>
    </div>
  );
}

function RequirementTile({ label, value, met }: { label: string; value: string; met: boolean }) {
  return (
    <div className={cn(
      "p-3 rounded-lg border flex items-center justify-between",
      met ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"
    )}>
      <div>
        <div className="text-[10px] font-semibold uppercase text-slate-500 tracking-wide">{label}</div>
        <div className="text-sm font-bold text-slate-800">{value}</div>
      </div>
      {met ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({ children, onClose, title }: { children: ReactNode, onClose: () => void, title: string }) {
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
        className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden text-slate-900"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="text-xl font-bold">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-md transition-colors text-slate-500"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Shared Sub-components ────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon, color }: { label: string, value: string, sub: string, icon: ReactNode, color: string }) {
  return (
    <div className="jobia-card border-slate-200 flex flex-col group p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}10`, color: color }}>
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold text-slate-900 mb-1">{value}</div>
      <p className="text-sm font-medium text-slate-500">{sub}</p>
    </div>
  );
}

function InsightItem({ title, desc, color }: { title: string, desc: string, color: string }) {
  return (
    <div className="group cursor-default flex gap-4">
      <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ backgroundColor: color }} />
      <div>
        <h4 className="text-sm font-bold text-slate-800">{title}</h4>
        <p className="text-sm text-slate-500 mt-1">{desc}</p>
      </div>
    </div>
  );
}

function CodingStats({ studentId, initialUsername }: { studentId: string; initialUsername?: string }) {
  const [username, setUsername] = useState(initialUsername || "");
  const [isEditing, setIsEditing] = useState(!initialUsername);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fetchedFor = useRef<string>("");

  useEffect(() => {
    if (username && !isEditing && fetchedFor.current !== username) {
      fetchedFor.current = username;
      setLoading(true);
      fetch(`/api/leetcode/${username}?studentId=${studentId}`)
        .then(res => res.json())
        .then(data => {
          if (data.status === "success") {
            setStats(data);
          } else {
            console.error("LeetCode Error:", data.message);
            setStats(null);
          }
        })
        .catch(() => setStats(null))
        .finally(() => setLoading(false));
    }
  }, [username, isEditing, studentId]);

  const saveUsername = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem("username") as HTMLInputElement;
    const val = input.value.trim();
    if (!val) return;
    setSaving(true);
    try {
      await updateStudent(studentId, { leetcodeUsername: val });
    } catch {
      // DB failed — continue with local-only save
    } finally {
      localStorage.setItem(`leetcode_${studentId}`, val);
      setUsername(val);
      setIsEditing(false);
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
           <Code className="w-5 h-5 text-[#0f3b9c]" /> Coding Stats
        </h3>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="text-xs font-semibold text-[#0f3b9c] hover:underline">
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={saveUsername} className="flex flex-col gap-3">
          <p className="text-xs font-medium text-slate-500">Connect LeetCode Profile</p>
          <input
            name="username"
            defaultValue={username}
            placeholder="Username"
            className="w-full px-3 py-2 rounded-md bg-white border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0f3b9c] focus:border-transparent"
          />
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-md bg-[#0f3b9c] text-white text-sm font-semibold hover:bg-[#0c2a70] transition-colors w-full disabled:opacity-60">
            {saving ? "Saving..." : "Sync Stats"}
          </button>
        </form>
      ) : loading ? (
        <div className="py-6 flex items-center justify-center text-slate-400 text-sm font-medium">
          Loading Data...
        </div>
      ) : stats ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-center">
              <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">Easy</div>
              <div className="text-xl font-bold text-emerald-600">{stats.easySolved}</div>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-center">
              <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">Medium</div>
              <div className="text-xl font-bold text-amber-500">{stats.mediumSolved}</div>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-center">
              <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">Hard</div>
              <div className="text-xl font-bold text-red-500">{stats.hardSolved}</div>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-center flex flex-col justify-center">
              <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">Rank</div>
              <div className="text-sm truncate font-bold text-slate-800">#{stats.ranking}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 p-3 rounded-lg text-center">API Error / Invalid User</div>
      )}
    </div>
  );
}
