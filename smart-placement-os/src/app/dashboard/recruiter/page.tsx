"use client";

import { motion } from "framer-motion";
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Sparkles,
  ChevronRight,
  BrainCircuit,
  AlertCircle,
  Building2,
  Users,
  CheckCircle2,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, ReactNode } from "react";
import { fetchFromGAS } from "@/lib/api";
import { calculateMatch, Student, Company } from "@/lib/matching";

export default function RecruiterDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [requirements, setRequirements] = useState<Company>({
    id: "REQ-001",
    name: "Google India",
    requiredSkills: ["Python", "Java", "DSA", "System Design"],
    prioritySkills: ["DSA", "System Design"],
    minCgpa: 8.0,
    allowedBacklogs: -1
  });

  useEffect(() => {
    async function loadData() {
      const data = await fetchFromGAS('getStudents');
      setStudents(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const results = students.map(s => ({
    student: s,
    match: calculateMatch(s, requirements)
  })).sort((a, b) => b.match.score - a.match.score);

  const eligibleCount = results.filter(r => r.match.isEligible).length;

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#0f3b9c]">
      <div className="w-10 h-10 border-4 border-[#0f3b9c]/20 border-t-[#0f3b9c] rounded-full animate-spin mb-4" />
      <div className="text-sm font-semibold tracking-wide">Initializing Talent Interface...</div>
    </div>
  );

  return (
    <div className="space-y-10 pb-24">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-3">
             <div className="px-2.5 py-1 rounded bg-[#0f3b9c]/10 text-[#0f3b9c] text-xs font-bold tracking-wide uppercase">Partner Portal</div>
             <div className="px-2.5 py-1 rounded bg-slate-100 text-slate-500 text-xs font-bold tracking-wide uppercase">Drives: Active</div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Recruitment Gateway</h1>
          <p className="text-sm font-medium text-slate-500">Shortlist and manage high-potential candidates from PSNA College</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-5 py-2.5 rounded-xl bg-[#0f3b9c] text-white hover:bg-blue-800 text-xs font-bold transition-all shadow-lg shadow-[#0f3b9c]/20 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Hiring Goal
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Config Section */}
        <div className="lg:col-span-4 space-y-8">
          <section className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
               <h2 className="text-lg font-bold text-slate-900">Filter Parameters</h2>
               <Filter className="w-4 h-4 text-slate-300" />
            </div>

            <div className="space-y-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Job Profile</label>
                  <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 text-sm font-bold text-[#0f3b9c] flex items-center gap-2">
                     <Building2 className="w-4 h-4" /> Software Engineer L3
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Min CGPA</label>
                     <input 
                       type="number"
                       step="0.1"
                       className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[#0f3b9c] focus:ring-4 focus:ring-[#0f3b9c]/5 transition-all"
                       value={requirements.minCgpa}
                       onChange={(e) => setRequirements({...requirements, minCgpa: parseFloat(e.target.value)})}
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Backlogs</label>
                     <input 
                       type="number"
                       className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[#0f3b9c] focus:ring-4 focus:ring-[#0f3b9c]/5 transition-all"
                       value={requirements.allowedBacklogs}
                       onChange={(e) => setRequirements({...requirements, allowedBacklogs: parseInt(e.target.value) || -1})}
                     />
                  </div>
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stack Requirements</label>
                  <div className="flex flex-wrap gap-2">
                    {requirements.requiredSkills.map(skill => (
                      <span key={skill} className="px-3 py-1.5 bg-slate-50 text-[#0f3b9c] rounded-lg text-[10px] font-bold border border-slate-100 flex items-center gap-2">
                        {skill} <Plus className="w-3 h-3 rotate-45 text-slate-300" />
                      </span>
                    ))}
                    <button className="px-3 py-1.5 bg-white border border-dashed border-slate-200 text-slate-400 rounded-lg text-[10px] font-bold hover:bg-slate-50 transition-all">
                      + Add Target
                    </button>
                  </div>
               </div>

               <button className="w-full py-4 rounded-xl bg-slate-900 text-white font-bold text-xs uppercase tracking-widest hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2">
                 <Sparkles className="w-4 h-4 text-blue-400" /> Refresh Intelligence
               </button>
            </div>
          </section>

          {/* Smart Insights */}
          <div className="bg-[#0f3b9c] rounded-[2rem] p-8 text-white shadow-xl shadow-[#0f3b9c]/20">
             <div className="flex items-center gap-3 mb-6">
                <BrainCircuit className="w-6 h-6 text-blue-300" />
                <h3 className="font-bold text-sm tracking-tight">Hiring Insights</h3>
             </div>
             
             {eligibleCount < 10 ? (
               <div className="space-y-6">
                  <div className="p-4 rounded-xl bg-white/10 border border-white/5">
                    <p className="text-xs text-blue-100 font-medium leading-relaxed">
                      Deep filtering detected <span className="font-bold text-white">{eligibleCount}</span> optimal matches. 
                    </p>
                  </div>
                  <div className="space-y-3">
                    <button className="w-full text-left text-[10px] font-bold text-white hover:text-blue-200 transition-colors flex items-center gap-2 bg-white/5 p-3 rounded-lg border border-white/5">
                      <Target className="w-3.5 h-3.5 text-blue-300" /> Relax CGPA to 7.5 (+12 candidates)
                    </button>
                    <button className="w-full text-left text-[10px] font-bold text-white hover:text-blue-200 transition-colors flex items-center gap-2 bg-white/5 p-3 rounded-lg border border-white/5">
                      <Target className="w-3.5 h-3.5 text-blue-300" /> Allow 1 backlog (+6 high-skill)
                    </button>
                  </div>
               </div>
             ) : (
               <p className="text-sm text-blue-100 font-medium opacity-80 italic">The current talent pool is robust with {eligibleCount} qualifying candidates.</p>
             )}
          </div>
        </div>

        {/* Right Column: Results List */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="space-y-1">
               <h2 className="text-xl font-bold text-slate-900">Shortlisted Candidates</h2>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{eligibleCount} Candidates Synchronized</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input type="text" placeholder="Filter names..." className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-4 focus:ring-[#0f3b9c]/5 focus:border-[#0f3b9c] w-48" />
              </div>
              <button className="px-5 py-2.5 rounded-lg bg-white border border-slate-200 text-[#0f3b9c] text-xs font-bold hover:bg-slate-50 transition-all flex items-center gap-2">
                <Download className="w-4 h-4" /> Export
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {results.map((r, i) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                key={r.student.id} 
                className={cn(
                  "bg-white p-6 rounded-2xl border transition-all flex flex-col sm:flex-row items-center justify-between gap-6",
                  r.match.isEligible ? "border-slate-100 shadow-sm" : "border-slate-100 opacity-50 bg-slate-50/30"
                )}
              >
                <div className="flex items-center gap-5 w-full sm:w-auto">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 shadow-sm border border-slate-100 flex items-center justify-center font-bold text-sm text-[#0f3b9c]">
                    {r.student.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-900">{r.student.name}</h3>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest tabular-nums">ID {r.student.id}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                       <span>{r.student.dept}</span>
                       <span className="text-slate-200">|</span>
                       <span className={cn(r.student.cgpa >= requirements.minCgpa ? "text-[#0f3b9c]" : "text-slate-400")}>CGPA {r.student.cgpa}</span>
                       <span className="text-slate-200">|</span>
                       <span className={cn((requirements.allowedBacklogs === -1 || r.student.activeBacklogs <= requirements.allowedBacklogs) ? "text-[#0f3b9c]" : "text-red-400")}>{r.student.activeBacklogs} Backlogs</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-right">
                    <div className={cn(
                      "text-3xl font-extrabold tracking-tighter tabular-nums",
                      r.match.score > 80 ? "text-emerald-600" : r.match.score > 60 ? "text-[#0f3b9c]" : "text-amber-500"
                    )}>
                      {r.match.score}%
                    </div>
                    <div className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Match Index</div>
                  </div>
                  
                  <button className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-[#0f3b9c] hover:text-white transition-all group">
                     <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

                {/* Mobile specific reason view */}
                {!r.match.isEligible && (
                  <div className="w-full text-[10px] font-bold text-red-400 uppercase tracking-tight sm:hidden text-center">
                    Blocking: {r.match.reasons?.join(', ')}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
