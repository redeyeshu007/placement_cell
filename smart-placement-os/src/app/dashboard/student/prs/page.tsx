"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart2, Code, GraduationCap, Brain, Mic,
  TrendingUp, ArrowUpRight, Star, AlertCircle,
  Award, FileText, GitBranch,
  Trophy, Zap, BookOpen, Sparkles,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import React from "react";
import { fetchFromGAS } from "@/lib/api";
import { Student, computePRS } from "@/lib/matching";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

function getLevel(score: number) {
  if (score >= 82) return { label: "Elite", color: "#0f3b9c", bg: "#e0e7ff", next: null };
  if (score >= 68) return { label: "Professional", color: "#1e40af", bg: "#dbeafe", next: 82 };
  if (score >= 54) return { label: "Competitive", color: "#2563eb", bg: "#eff6ff", next: 68 };
  if (score >= 40) return { label: "Rising", color: "#3b82f6", bg: "#f0f9ff", next: 54 };
  return { label: "Foundational", color: "#64748b", bg: "#f8fafc", next: 40 };
}

// ─── Animated Ring ────────────────────────────────────────────────────────────
function ScoreRing({ score, level }: { score: number; level: any }) {
  const r = 90;
  const circumference = 2 * Math.PI * r;
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    let frame: number;
    let start: number | null = null;
    const duration = 1500;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setDisplayed(Math.round(progress * score));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const offset = circumference - (displayed / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="240" height="240" className="-rotate-90">
        <circle cx="120" cy="120" r={r} fill="none" stroke="#f1f5f9" strokeWidth="12" />
        <circle
          cx="120"
          cy="120"
          r={r}
          fill="none"
          stroke={level.color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.1s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-7xl font-extrabold text-[#0f3b9c] tracking-tighter tabular-nums leading-none">{displayed}</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2">Readiness Index</span>
      </div>
    </div>
  );
}

// ─── Dimension Card ───────────────────────────────────────────────────────────
function DimensionCard({
  icon,
  label,
  score,
  color,
  tip,
  delay,
  weight,
}: {
  icon: React.ReactNode;
  label: string;
  score: number;
  color: string;
  tip: string;
  delay: number;
  weight?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow group"
    >
      <div className="flex items-start justify-between mb-5">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform"
          style={{ backgroundColor: `${color}10`, color }}
        >
          {icon}
        </div>
        <div className="text-right">
          <div className="text-3xl font-extrabold tracking-tight tabular-nums" style={{ color }}>
            {Math.round(score)}
          </div>
          {weight && (
            <div className="text-[9px] font-bold uppercase tracking-widest mt-1 px-1.5 py-0.5 rounded" style={{ backgroundColor: `${color}15`, color }}>
              {weight} weight
            </div>
          )}
        </div>
      </div>

      <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wide">{label}</h3>

      <div className="h-1.5 bg-slate-100 rounded-full mb-4 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ delay: delay + 0.3, duration: 1.2, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>

      <p className="text-xs text-slate-500 font-medium leading-relaxed italic">
        {tip}
      </p>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PRSPage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedId = localStorage.getItem("spos_user_id");
    if (!savedId) { router.push("/auth/login"); return; }
    async function load() {
      const data = await fetchFromGAS("getStudents");
      const s = (data as any[]).find((x: any) => String(x.id) === savedId);
      if (!s) { router.push("/auth/login"); return; }
      setStudent(s);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading || !student)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#0f3b9c]">
        <div className="w-10 h-10 border-4 border-[#0f3b9c]/20 border-t-[#0f3b9c] rounded-full animate-spin mb-4" />
        <div className="text-sm font-semibold tracking-wide">Syncing Progress Data...</div>
      </div>
    );

  const scores = computePRS(student);
  const level = getLevel(scores.composite);

  const solved = (student as any).leetcodeSolved ?? 0;
  const arrearPenalty = Math.min(20, student.activeBacklogs * 5);

  const dimensions = [
    {
      icon: <GraduationCap className="w-6 h-6" />,
      label: "CGPA",
      score: scores.cgpa,
      color: "#6366f1",
      weight: "20%",
      tip: scores.cgpa < 75
        ? `CGPA ${student.cgpa} — target 8.5+ to unlock tier-1 companies.`
        : `Excellent CGPA ${student.cgpa}. A major differentiator in shortlisting.`,
    },
    {
      icon: <Code className="w-6 h-6" />,
      label: "Skills",
      score: scores.skills,
      color: "#0f3b9c",
      weight: "15%",
      tip: scores.skills < 60
        ? `${student.skills.length} skills detected. Aim for 8+ to hit full score.`
        : `Strong skill portfolio (${student.skills.length} skills). Keep it industry-current.`,
    },
    {
      icon: <Brain className="w-6 h-6" />,
      label: "Hackathons",
      score: scores.hackathons,
      color: "#f59e0b",
      weight: "10%",
      tip: student.hackathons < 2
        ? "Participate in hackathons — signals high-pressure problem solving."
        : `${student.hackathons} hackathons. You're in the top 5% of candidates.`,
    },
    {
      icon: <Mic className="w-6 h-6" />,
      label: "Certifications",
      score: scores.certifications,
      color: "#10b981",
      weight: "10%",
      tip: student.certifications < 2
        ? "Add 2+ industry certifications to boost credibility."
        : `${student.certifications} certifications. Strong professional credential signal.`,
    },
    {
      icon: <Trophy className="w-6 h-6" />,
      label: "LeetCode",
      score: scores.leetcode,
      color: "#f97316",
      weight: "10%",
      tip: solved === 0
        ? "Connect your LeetCode profile on the dashboard to track solved problems."
        : solved < 100
          ? `${solved} problems solved. Aim for 200+ for a perfect LeetCode score.`
          : `${solved} problems solved — exceptional DSA preparation.`,
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      label: "Resume Strength",
      score: scores.resumeStrength,
      color: "#8b5cf6",
      weight: "15%",
      tip: scores.resumeStrength === 0
        ? "Upload your resume on the Resume Builder page to get an AI strength score."
        : scores.resumeStrength < 60
          ? `AI rated your resume ${(student as any).resumeStrengthLevel ?? "Moderate"}. Add quantified impact and action verbs.`
          : `AI rated your resume ${(student as any).resumeStrengthLevel ?? "Strong"} — ATS-ready and impactful.`,
    },
    {
      icon: <FileText className="w-6 h-6" />,
      label: "Resume Projects",
      score: scores.projects,
      color: "#06b6d4",
      weight: "5%",
      tip: (student as any).resumeProjects?.length > 0
        ? `${(student as any).resumeProjects.length} projects in resume. 5+ hits full score.`
        : "Upload your resume to extract project names automatically.",
    },
    {
      icon: <GitBranch className="w-6 h-6" />,
      label: "Valid GitHub Projects",
      score: scores.validProjects,
      color: "#059669",
      weight: "5%",
      tip: (student as any).validatedProjectsCount > 0
        ? `${(student as any).validatedProjectsCount} resume projects verified on GitHub.`
        : "Sync GitHub repos and upload resume to validate projects.",
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      label: "Experience",
      score: scores.experience,
      color: "#ec4899",
      weight: "5%",
      tip: scores.experience === 0
        ? "Upload your resume — AI will detect internships and work experience."
        : `Experience level: ${(student as any).resumeExperienceLevel ?? "detected"}. ${(student as any).resumeExperienceSummary ?? ""}`,
    },
    {
      icon: <Zap className="w-6 h-6" />,
      label: "Arrear Penalty",
      score: Math.max(0, 100 - arrearPenalty * 5),
      color: student.activeBacklogs > 0 ? "#ef4444" : "#10b981",
      weight: "-5/backlog",
      tip: student.activeBacklogs === 0
        ? "No active arrears — clean academic record."
        : `${student.activeBacklogs} active backlog(s) → -${arrearPenalty} pts penalty. Clear to recover score.`,
    },
  ];

  const weakest = [...dimensions].sort((a, b) => a.score - b.score)[0];

  return (
    <div className="space-y-12 pt-10 pb-24">
      {/* Header section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-8 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-4">
             <div className="px-2.5 py-1 rounded bg-[#0f3b9c]/10 text-[#0f3b9c] text-xs font-bold tracking-wide uppercase">Performance Hub</div>
             <div className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-600 text-xs font-bold tracking-wide uppercase border border-emerald-100 flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> Live Score
             </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Placement Readiness Score</h1>
          <p className="text-sm font-medium text-slate-500">Comprehensive analysis of your industry readiness quotient</p>
        </div>

        <div className="flex items-center gap-4 bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm">
           <div className="text-right">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current Tier</div>
              <div className="text-lg font-extrabold text-[#0f3b9c]">{level.label}</div>
           </div>
           <Award className="w-8 h-8 text-[#0f3b9c]" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Score Visualizer */}
        <div className="lg:col-span-4 flex flex-col gap-8">
           <div className="bg-white border border-slate-100 rounded-[3rem] p-12 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#0f3b9c]/5 rounded-full blur-3xl -mr-24 -mt-24" />
              <ScoreRing score={scores.composite} level={level} />
              <div className="mt-8 text-center space-y-1">
                 <div className="text-2xl font-bold text-slate-900">{level.label}</div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Tier Accreditation</p>
              </div>
           </div>



           {/* Priority Fix */}
           <div className="bg-amber-50 rounded-[2rem] p-8 border border-amber-100">
              <div className="flex items-center gap-3 mb-4">
                 <AlertCircle className="w-5 h-5 text-amber-600" />
                 <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Priority Optimization</span>
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">{weakest.label}</h4>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">{weakest.tip}</p>
           </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="lg:col-span-8 space-y-10">
           <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                 <BarChart2 className="w-5 h-5 text-[#0f3b9c]" /> Quotient Analysis
              </h2>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {dimensions.map((d, i) => (
                <DimensionCard key={d.label} {...d} delay={i * 0.07} />
              ))}
           </div>

           {/* Call to Action */}
           <div className="mt-8 p-10 rounded-[2.5rem] bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl shadow-slate-200">
              <div className="space-y-3">
                 <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Skill Growth Boost</span>
                 </div>
                 <h3 className="text-2xl font-bold tracking-tight">Daily Cognitive Challenge</h3>
                 <p className="text-sm text-slate-400 font-medium">Earn +5 points every day towards your problem solving score.</p>
              </div>
              <button 
                onClick={() => router.push("/dashboard/student/quiz")}
                className="px-8 py-4 bg-[#0f3b9c] text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-900/40"
              >
                Launch Quiz <ArrowUpRight className="w-4 h-4" />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}

function RequirementBox({ icon, label, value, current, pass } : { icon: React.ReactNode, label: string, value: any, current: any, pass: boolean }) {
  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-100 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">{icon}</div>
        <div className={cn("text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest", pass ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600")}>
          {pass ? "Verified" : "Sync Error"}
        </div>
      </div>
      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight">{value}</div>
        <div className="text-[10px] font-medium text-slate-400 mt-2">Candidate Status: <span className={cn("font-bold", pass ? "text-slate-900" : "text-red-500")}>{current}</span></div>
      </div>
    </div>
  );
}
