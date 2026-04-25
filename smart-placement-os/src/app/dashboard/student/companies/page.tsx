"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Info,
  X,
  Target,
  AlertCircle,
  Lightbulb,
  Zap,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, ReactNode } from "react";
import { fetchFromGAS } from "@/lib/api";
import { Student, Company, getStudentStatus, StudentStatus } from "@/lib/matching";

export default function CompaniesPage() {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [acceptLoading, setAcceptLoading] = useState<string | null>(null);

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

      const currentStudent = (studData as any[]).find((s: any) => String(s.id) === savedId);
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

  const handleAcceptInvite = async (company: Company, action: 'accept' | 'decline', e: React.MouseEvent) => {
    e.stopPropagation();
    if (!student) return;
    setAcceptLoading(company.id);
    try {
      const res = await fetch(`/api/companies/${encodeURIComponent(company.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: student.id, action }),
      });
      if (res.ok) {
        const data = await res.json();
        setCompanies(prev => prev.map(c => c.id === company.id
          ? { ...c, acceptedStudents: data.acceptedStudents }
          : c
        ));
      }
    } catch { /* ignore */ }
    finally { setAcceptLoading(null); }
  };

  const companyStatuses = useMemo(() => {
    if (!student) return new Map<string, StudentStatus>();
    const map = new Map<string, StudentStatus>();
    for (const company of companies) {
      map.set(company.id, getStudentStatus(student, company, allStudents));
    }
    return map;
  }, [student, companies, allStudents]);

  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading || !student) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#0f3b9c]">
      <div className="w-10 h-10 border-4 border-[#0f3b9c]/20 border-t-[#0f3b9c] rounded-full animate-spin mb-4" />
      <div className="text-sm font-semibold tracking-wide">Scanning Companies Database...</div>
    </div>
  );

  return (
    <div className="space-y-10 pt-10 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-3">
             <div className="px-2.5 py-1 rounded bg-[#0f3b9c]/10 text-[#0f3b9c] text-xs font-bold tracking-wide uppercase">Active Recruiters</div>
             <div className="px-2.5 py-1 rounded bg-slate-100 text-slate-500 text-xs font-bold tracking-wide uppercase">Batch 2026</div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Recruitment Drives</h1>
          <p className="text-sm font-medium text-slate-500">Your eligibility and shortlisting status for all active drives</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#0f3b9c] transition-colors" />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#0f3b9c]/5 focus:border-[#0f3b9c] w-full transition-all"
            />
          </div>
          <button className="p-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-[#0f3b9c]/10 hover:text-[#0f3b9c] transition-all">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompanies.map((company, i) => {
          const status = companyStatuses.get(company.id);
          const isSelected = status?.status === 'selected';
          const isEligible = status?.status !== 'not-eligible';

          const badgeConfig = isSelected
            ? { label: 'SHORTLISTED', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="w-3 h-3" /> }
            : isEligible
              ? { label: 'ELIGIBLE', cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Clock className="w-3 h-3" /> }
              : { label: 'NOT ELIGIBLE', cls: 'bg-red-50 text-red-600 border-red-200', icon: <XCircle className="w-3 h-3" /> };

          return (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={company.id}
              onClick={() => setSelectedCompany(company)}
              className="jobia-card group cursor-pointer flex flex-col"
            >
              <div className="flex items-start justify-between mb-8">
                <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-2xl text-[#0f3b9c] shadow-sm group-hover:bg-[#0f3b9c] group-hover:text-white transition-all">
                  {company.name[0]}
                </div>
                {status && isEligible && (
                  <div className="text-right">
                    <div className="text-2xl font-bold leading-none mb-1 text-[#0f3b9c]">#{status.rank}</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">of {status.totalEligible}</div>
                  </div>
                )}
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-[#0f3b9c] transition-colors">{company.name}</h3>
              <p className="text-xs text-slate-500 font-medium mb-1">{company.role || 'Software Engineer'}{company.salary ? ` • ${company.salary}` : ''}</p>
              <p className="text-xs text-slate-400 font-medium mb-8">
                {company.requirementType === 'skill-based' ? 'Skill-Based' : company.requirementType === 'interested' ? 'Interested Students' : 'Open to All'} • On-Campus
              </p>

              <div className="flex flex-wrap gap-2 mb-8 mt-auto">
                <span className="px-2.5 py-1 rounded-md bg-slate-50 text-[10px] font-bold uppercase text-slate-600 border border-slate-100 flex items-center gap-1.5">
                  <Target className="w-3 h-3" /> {company.minCgpa} CGPA
                </span>
                <span className="px-2.5 py-1 rounded-md bg-slate-50 text-[10px] font-bold uppercase text-slate-600 border border-slate-100 flex items-center gap-1.5">
                  <Lock className="w-3 h-3" /> {(company.allowedBacklogs === undefined || company.allowedBacklogs === -1) ? 'No Backlog Limit' : `≤${company.allowedBacklogs} Arrears`}
                </span>
                {company.noHistoryOfArrears && (
                  <span className="px-2.5 py-1 rounded-md bg-red-50 text-[10px] font-bold uppercase text-red-600 border border-red-100">
                    Zero History
                  </span>
                )}
              </div>

              <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-2">
                {company.requirementType === 'interested' && isEligible ? (() => {
                  const hasAccepted = (company.acceptedStudents ?? []).includes(student.id);
                  return hasAccepted ? (
                    <div className="flex items-center gap-2 flex-1">
                      <div className="px-3 py-1 rounded-md text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3" /> Accepted
                      </div>
                      <button onClick={e => handleAcceptInvite(company, 'decline', e)}
                        disabled={acceptLoading === company.id}
                        className="px-3 py-1 rounded-md text-[10px] font-bold border bg-red-50 text-red-600 border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50">
                        Withdraw
                      </button>
                    </div>
                  ) : (
                    <button onClick={e => handleAcceptInvite(company, 'accept', e)}
                      disabled={acceptLoading === company.id}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                      {acceptLoading === company.id
                        ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <CheckCircle2 className="w-3.5 h-3.5" />}
                      Accept Invite
                    </button>
                  );
                })() : (
                  <div className={cn("px-3 py-1 rounded-md text-[10px] font-bold border flex items-center gap-1.5", badgeConfig.cls)}>
                    {badgeConfig.icon} {badgeConfig.label}
                  </div>
                )}
                <button className="text-[11px] font-bold text-[#0f3b9c] flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all ml-auto">
                  Details <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredCompanies.length === 0 && (
        <div className="text-center py-24 bg-white rounded-3xl border border-slate-100">
           <Building2 className="w-12 h-12 text-slate-200 mx-auto mb-4" />
           <p className="text-slate-400 font-semibold italic">No companies matching your search criteria.</p>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {selectedCompany && (
          <Modal onClose={() => setSelectedCompany(null)} title={selectedCompany.name}>
            <CompanyDetailView
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

function Modal({ children, onClose, title }: { children: ReactNode, onClose: () => void, title: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden text-slate-900"
      >
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="text-xl font-bold text-[#0f3b9c]">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}

function CompanyDetailView({ student, company, status }: { student: Student; company: Company; status: StudentStatus | undefined }) {
  if (!status) return null;

  const isSelected = status.status === 'selected';
  const isEligible = status.status !== 'not-eligible';

  return (
    <div className="space-y-8">
      {/* Status Banner */}
      <div className={cn(
        "p-6 rounded-2xl border flex items-center gap-4",
        isSelected ? "bg-emerald-50 border-emerald-200" : isEligible ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"
      )}>
        <div className="shrink-0">
          {isSelected
            ? <CheckCircle2 className="w-9 h-9 text-emerald-600" />
            : isEligible
              ? <Clock className="w-9 h-9 text-amber-600" />
              : <XCircle className="w-9 h-9 text-red-600" />
          }
        </div>
        <div>
          <div className={cn("text-lg font-bold", isSelected ? "text-emerald-700" : isEligible ? "text-amber-700" : "text-red-700")}>
            {isSelected ? "You are shortlisted for this drive!" : isEligible ? "Eligible — awaiting final selection" : "Not eligible for this drive"}
          </div>
          {isEligible && (
            <div className="text-sm font-medium text-slate-600 mt-0.5">
              Ranked <span className="font-bold">#{status.rank}</span> out of <span className="font-bold">{status.totalEligible}</span> eligible students
              {company.selectCount ? ` • Top ${company.selectCount} will be selected` : ' • No selection cap'}
            </div>
          )}
        </div>
      </div>

      {/* Score Breakdown */}
      {isEligible && (
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Score Breakdown</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 rounded-2xl bg-[#0f3b9c] text-white text-center">
              <div className="text-3xl font-extrabold mb-1">{status.combinedScore}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">Combined Score</div>
            </div>
            <div className="p-6 rounded-2xl bg-indigo-50 border border-indigo-100 text-center">
              <div className="text-3xl font-extrabold text-indigo-700 mb-1">{status.prsScore}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">PRS Score</div>
            </div>
            <div className="p-6 rounded-2xl bg-amber-50 border border-amber-100 text-center">
              <div className="text-3xl font-extrabold text-amber-600 mb-1">{status.skillMatchPercent}%</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Skill Match</div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reasons */}
      {!isEligible && status.reasons.length > 0 && (
        <div className="p-6 rounded-2xl bg-red-50 border border-red-100">
          <h4 className="flex items-center gap-2 text-red-800 font-bold text-sm mb-4">
            <AlertCircle className="w-4 h-4" /> Why You Are Not Eligible
          </h4>
          <ul className="space-y-3">
            {status.reasons.map((reason, i) => (
              <li key={i} className="text-sm font-semibold text-red-600 flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Improvement Suggestions */}
      {status.suggestions.length > 0 && (
        <div className="p-6 rounded-2xl bg-blue-50 border border-blue-100">
          <h4 className="flex items-center gap-2 text-blue-700 font-bold text-sm mb-4">
            <Lightbulb className="w-4 h-4" /> How to Improve Your Chances
          </h4>
          <ul className="space-y-3">
            {status.suggestions.map((tip, i) => (
              <li key={i} className="text-sm font-semibold text-blue-700 flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Threshold Analysis */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#0f3b9c]" /> Drive Requirements
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <RequirementBox
            icon={<Target className="text-blue-600" />}
            label="Min CGPA"
            value={company.minCgpa}
            current={student.cgpa}
            pass={student.cgpa >= company.minCgpa}
          />
          <RequirementBox
            icon={<Lock className="text-amber-600" />}
            label="Max Active Backlogs"
            value={(company.allowedBacklogs === undefined || company.allowedBacklogs === -1) ? 'No Limit' : company.allowedBacklogs}
            current={student.activeBacklogs}
            pass={(company.allowedBacklogs === undefined || company.allowedBacklogs === -1) || student.activeBacklogs <= company.allowedBacklogs}
          />
        </div>
        {company.noHistoryOfArrears && (
          <div className={cn(
            "p-4 rounded-xl border flex items-center gap-3",
            student.totalBacklogs === 0 ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"
          )}>
            {student.totalBacklogs === 0
              ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              : <XCircle className="w-5 h-5 text-red-600 shrink-0" />
            }
            <div className="text-sm font-semibold text-slate-700">
              Zero arrear history required — you have <span className="font-bold">{student.totalBacklogs}</span> total backlog(s) on record
            </div>
          </div>
        )}
      </div>

      {/* Required Skills */}
      {company.requiredSkills.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Technical Requirements</h4>
          <div className="grid grid-cols-1 gap-3">
            {company.requiredSkills.map(skill => {
              const hasSkill = student.skills.some(s => s.toLowerCase() === skill.toLowerCase());
              const isPriority = company.prioritySkills.some(ps => ps.toLowerCase() === skill.toLowerCase());
              return (
                <div key={skill} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-700 uppercase tracking-wide">{skill}</span>
                    {isPriority && (
                      <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded uppercase tracking-wide">Priority</span>
                    )}
                  </div>
                  {hasSkill ? (
                    <div className="px-3 py-1.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                    </div>
                  ) : (
                    <div className="px-3 py-1.5 rounded-md bg-slate-200 text-slate-500 text-[10px] font-bold flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" /> Missing
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function RequirementBox({ icon, label, value, current, pass }: { icon: ReactNode; label: string; value: any; current: any; pass: boolean }) {
  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-100 space-y-4">
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">{icon}</div>
        <div className={cn("text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest", pass ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600")}>
          {pass ? "Meets Requirement" : "Does Not Meet"}
        </div>
      </div>
      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight">{value}</div>
        <div className="text-[10px] font-medium text-slate-400 mt-2">Your value: <span className={cn("font-bold", pass ? "text-slate-900" : "text-red-500")}>{current}</span></div>
      </div>
    </div>
  );
}
