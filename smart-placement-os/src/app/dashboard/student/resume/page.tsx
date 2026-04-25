"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Briefcase,
  Trophy,
  GitBranch,
  Code,
  Target,
  RefreshCcw,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchFromGAS, updateStudent, analyzeResume } from "@/lib/api";
import { Student } from "@/lib/matching";
import { cn } from "@/lib/utils";

type Stage = "idle" | "uploading" | "parsing" | "analyzing" | "validating" | "done" | "error";

type Detected = {
  skills: string[];
  projects: string[];
  hackathons: number;
  internshipLevel: string;
  internshipSummary: string;
  hasInternship: boolean;
  atsScore: number;
  atsLevel: string;
  validatedProjects: number;
  validatedMatches: { project: string; repo: string | null; confidence: number }[];
  githubChecked: boolean;
};

const STAGE_LABELS: Record<Stage, string> = {
  idle: "Ready",
  uploading: "Uploading PDF…",
  parsing: "Extracting text & projects…",
  analyzing: "Running ATS analysis…",
  validating: "Validating GitHub projects…",
  done: "Complete",
  error: "Error",
};

function extractGithubUsername(url: string | undefined): string | null {
  if (!url) return null;
  const m = url.match(/github\.com\/([^/?#]+)/i);
  if (!m) return null;
  return m[1].replace(/\.git$/i, "").trim() || null;
}

export default function ResumePage() {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState("");
  const [detected, setDetected] = useState<Detected | null>(null);
  const [resumePdfBase64, setResumePdfBase64] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedId = localStorage.getItem("spos_user_id");
    if (!savedId) { router.push("/auth/login"); return; }
    (async () => {
      const students = await fetchFromGAS("getStudents");
      const s = (students as any[]).find((x: any) => String(x.id) === savedId);
      if (!s) { router.push("/auth/login"); return; }
      setStudent(s);
      // Hydrate previously detected results so the user sees their last upload
      if (s.resumeStrengthScore != null) {
        setDetected({
          skills: s.skills ?? [],
          projects: s.resumeProjects ?? [],
          hackathons: s.hackathons ?? 0,
          internshipLevel: s.resumeExperienceLevel ?? "Fresher",
          internshipSummary: s.resumeExperienceSummary ?? "",
          hasInternship: ["Intern", "Part-time", "1yr+", "2yr+"].includes(s.resumeExperienceLevel ?? ""),
          atsScore: s.resumeStrengthScore ?? 0,
          atsLevel: s.resumeStrengthLevel ?? "—",
          validatedProjects: s.validatedProjectsCount ?? 0,
          validatedMatches: [],
          githubChecked: false,
        });
      }
      setLoading(false);
    })();
  }, [router]);

  const handleUpload = async (file: File) => {
    if (!student) return;
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }
    setError("");
    setDetected(null);

    try {
      // 1. Read as base64 and persist immediately
      setStage("uploading");
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      setResumePdfBase64(base64);
      await fetch(`/api/students/${encodeURIComponent(student.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumePdf: base64 }),
      });

      // 2. Parse PDF → skills + projects + rawText
      setStage("parsing");
      const fd = new FormData();
      fd.append("file", file);
      const parseRes = await fetch("/api/resume/parse", { method: "POST", body: fd });
      if (!parseRes.ok) throw new Error((await parseRes.json()).error ?? "Parse failed");
      const parsed = await parseRes.json() as { skills: string[]; projects: string[]; rawText: string };

      // 3. AI analysis → ATS score, internship, hackathons
      setStage("analyzing");
      const analysis = await analyzeResume(parsed.rawText, student.id);

      // 4. Optional GitHub validation
      setStage("validating");
      let validatedProjects = 0;
      let validatedMatches: Detected["validatedMatches"] = [];
      let githubChecked = false;
      const ghUser = extractGithubUsername(student.githubLink);
      if (ghUser && parsed.projects.length > 0) {
        try {
          const repoRes = await fetch(`/api/github/repos/${encodeURIComponent(ghUser)}`);
          if (repoRes.ok) {
            const repos = await repoRes.json();
            const summary = (Array.isArray(repos) ? repos : []).map((r: any) => ({
              name: r.name, description: r.description ?? null, language: r.language ?? null,
            }));
            const matchRes = await fetch("/api/github/validate-projects", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ resumeProjects: parsed.projects, repos: summary }),
            });
            if (matchRes.ok) {
              const { matches } = await matchRes.json();
              validatedMatches = (matches ?? []).map((m: any) => ({
                project: m.resumeProject, repo: m.repoName, confidence: m.confidence,
              }));
              validatedProjects = validatedMatches.filter(m => m.repo && m.confidence >= 50).length;
              githubChecked = true;
            }
          }
        } catch {
          /* GitHub validation is best-effort, non-fatal */
        }
      }

      // 5. Persist merged results
      const mergedSkills = [...new Set([...(student.skills ?? []), ...parsed.skills])];
      await updateStudent(student.id, {
        skills: mergedSkills,
        resumeProjects: parsed.projects,
        validatedProjectsCount: validatedProjects,
        resumeRawText: parsed.rawText.slice(0, 3000),
        hackathons: analysis.hackathonsCount,
        resumeStrengthScore: analysis.strengthScore,
        resumeStrengthLevel: analysis.strengthLevel,
        resumeExperienceScore: analysis.experienceScore,
        resumeExperienceLevel: analysis.experienceLevel,
        resumeExperienceSummary: analysis.experienceSummary,
      });

      setStudent(prev => prev ? {
        ...prev,
        skills: mergedSkills,
        resumeProjects: parsed.projects,
        validatedProjectsCount: validatedProjects,
        hackathons: analysis.hackathonsCount,
        resumeStrengthScore: analysis.strengthScore,
        resumeStrengthLevel: analysis.strengthLevel,
        resumeExperienceLevel: analysis.experienceLevel,
        resumeExperienceSummary: analysis.experienceSummary,
      } as Student : prev);

      setDetected({
        skills: parsed.skills,
        projects: parsed.projects,
        hackathons: analysis.hackathonsCount,
        internshipLevel: analysis.experienceLevel,
        internshipSummary: analysis.experienceSummary,
        hasInternship: analysis.hasInternship,
        atsScore: analysis.strengthScore,
        atsLevel: analysis.strengthLevel,
        validatedProjects,
        validatedMatches,
        githubChecked,
      });
      setStage("done");
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong while processing your resume.");
      setStage("error");
    }
  };

  if (loading || !student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#0f3b9c]">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <div className="text-sm font-semibold tracking-wide">Loading…</div>
      </div>
    );
  }

  const busy = stage !== "idle" && stage !== "done" && stage !== "error";
  const hasResults = detected !== null;

  return (
    <div className="space-y-10 pt-10 pb-24">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <div className="px-2.5 py-1 rounded bg-[#0f3b9c]/10 text-[#0f3b9c] text-xs font-bold uppercase tracking-wide">AI Optimised</div>
          <div className="px-2.5 py-1 rounded bg-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wide">Auto-Detect</div>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Resume Analyzer</h1>
        <p className="text-sm text-slate-500">Upload your resume PDF — we'll detect skills, projects, hackathons, internships, ATS score, and validate against your GitHub.</p>
      </div>

      {/* Upload card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-10 shadow-sm">
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }}
        />
        <div className="flex flex-col items-center text-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-[#0f3b9c]/10 flex items-center justify-center">
            <FileText className="w-10 h-10 text-[#0f3b9c]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">
              {hasResults ? "Re-upload to refresh analysis" : "Upload your resume"}
            </h2>
            <p className="text-sm text-slate-500 max-w-md">
              PDF only. Your resume is parsed locally then analyzed by our AI to score ATS readiness and extract everything that matters.
            </p>
          </div>

          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className={cn(
              "flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-sm transition-all shadow-lg",
              busy
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-[#0f3b9c] text-white hover:bg-[#0a2d7a] shadow-[#0f3b9c]/20"
            )}
          >
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
            {busy ? STAGE_LABELS[stage] : (hasResults ? "Upload New Resume" : "Choose PDF File")}
          </button>

          {/* Stage progress */}
          <AnimatePresence>
            {busy && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="w-full max-w-md"
              >
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {(["uploading", "parsing", "analyzing", "validating"] as Stage[]).map((s, i) => {
                    const idx = ["uploading", "parsing", "analyzing", "validating"].indexOf(stage);
                    const done = i < idx;
                    const active = i === idx;
                    return (
                      <div key={s} className="flex flex-col items-center gap-1.5 flex-1">
                        <div className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center transition-all",
                          done ? "bg-emerald-500 text-white"
                            : active ? "bg-[#0f3b9c] text-white"
                            : "bg-slate-100 text-slate-300"
                        )}>
                          {done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                        </div>
                        <span className={cn(active ? "text-[#0f3b9c]" : "text-slate-400")}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm font-semibold text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <AnimatePresence>
        {detected && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            {/* ATS Score — hero card */}
            <div className="bg-gradient-to-br from-[#0f3b9c] to-[#1e54c4] rounded-3xl p-10 text-white shadow-xl">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/70">ATS Readiness Score</span>
                  </div>
                  <div className="flex items-end gap-3 mb-2">
                    <div className="text-7xl font-black tracking-tighter leading-none">{detected.atsScore}</div>
                    <div className="text-2xl font-bold text-white/60 mb-2">/ 100</div>
                  </div>
                  <div className="text-sm font-semibold uppercase tracking-widest text-white/80">{detected.atsLevel}</div>
                </div>
                <div className="grid grid-cols-2 gap-3 md:gap-6">
                  <ScoreBadge label="Above 85" pass={detected.atsScore >= 85} />
                  <ScoreBadge label="Has Internship" pass={detected.hasInternship} />
                </div>
              </div>
            </div>

            {/* Detected metrics grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <MetricCard
                icon={<Code className="w-5 h-5" />}
                label="Skills Detected"
                value={detected.skills.length.toString()}
                accent="#0f3b9c"
              >
                <div className="flex flex-wrap gap-1.5 mt-3 max-h-32 overflow-y-auto">
                  {detected.skills.slice(0, 20).map(s => (
                    <span key={s} className="px-2 py-0.5 rounded-md bg-[#0f3b9c]/10 text-[#0f3b9c] text-[11px] font-semibold">{s}</span>
                  ))}
                  {detected.skills.length === 0 && <span className="text-xs text-slate-400 italic">No skills detected</span>}
                </div>
              </MetricCard>

              <MetricCard
                icon={<Trophy className="w-5 h-5" />}
                label="Hackathons"
                value={detected.hackathons.toString()}
                accent="#f59e0b"
              >
                <p className="text-xs text-slate-500 mt-3">
                  {detected.hackathons > 0
                    ? `${detected.hackathons} hackathon${detected.hackathons > 1 ? "s" : ""} / coding contest${detected.hackathons > 1 ? "s" : ""} detected`
                    : "No hackathons mentioned in your resume"}
                </p>
              </MetricCard>

              <MetricCard
                icon={<Briefcase className="w-5 h-5" />}
                label="Internship"
                value={detected.hasInternship ? "Yes" : "No"}
                accent={detected.hasInternship ? "#10b981" : "#94a3b8"}
              >
                <div className="text-xs text-slate-500 mt-3">
                  <div className="font-semibold text-slate-700 mb-1">{detected.internshipLevel}</div>
                  <p className="line-clamp-3">{detected.internshipSummary || "No internship found"}</p>
                </div>
              </MetricCard>

              <MetricCard
                icon={<FileText className="w-5 h-5" />}
                label="Projects"
                value={detected.projects.length.toString()}
                accent="#9333ea"
              >
                <ul className="text-xs text-slate-600 mt-3 space-y-1 max-h-32 overflow-y-auto">
                  {detected.projects.slice(0, 6).map((p, i) => (
                    <li key={i} className="line-clamp-1">• {p}</li>
                  ))}
                  {detected.projects.length === 0 && <li className="text-slate-400 italic">No projects detected</li>}
                </ul>
              </MetricCard>

              <MetricCard
                icon={<GitBranch className="w-5 h-5" />}
                label="Valid GitHub Projects"
                value={detected.githubChecked ? `${detected.validatedProjects}/${detected.projects.length}` : "—"}
                accent="#0ea5e9"
              >
                {detected.githubChecked ? (
                  <ul className="text-xs text-slate-600 mt-3 space-y-1 max-h-32 overflow-y-auto">
                    {detected.validatedMatches.filter(m => m.repo && m.confidence >= 50).slice(0, 5).map((m, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span className="line-clamp-1">{m.project} → <span className="font-mono text-[#0ea5e9]">{m.repo}</span></span>
                      </li>
                    ))}
                    {detected.validatedProjects === 0 && (
                      <li className="text-slate-400 italic">No matching repos found on your GitHub</li>
                    )}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500 mt-3">
                    {student.githubLink
                      ? "Couldn't reach GitHub. Try again later."
                      : "Add a GitHub link to your profile to validate projects."}
                  </p>
                )}
              </MetricCard>

              <MetricCard
                icon={<Target className="w-5 h-5" />}
                label="Overall Health"
                value={overallLabel(detected)}
                accent={overallColor(detected)}
              >
                <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                  {improvementHint(detected)}
                </p>
              </MetricCard>
            </div>

            {stage === "done" && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm font-semibold text-emerald-700 w-fit">
                <CheckCircle2 className="w-4 h-4" /> Saved to your profile — your PRS score is now updated.
              </div>
            )}

            <button
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-all disabled:opacity-50"
            >
              <RefreshCcw className="w-4 h-4" /> Re-analyze with new resume
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ScoreBadge({ label, pass }: { label: string; pass: boolean }) {
  return (
    <div className={cn(
      "px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2",
      pass ? "bg-emerald-400/20 text-emerald-100" : "bg-white/10 text-white/60"
    )}>
      {pass ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      {label}
    </div>
  );
}

function MetricCard({ icon, label, value, accent, children }: {
  icon: React.ReactNode; label: string; value: string; accent: string; children?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accent}1a`, color: accent }}>
          {icon}
        </div>
        <div className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</div>
      </div>
      <div className="text-3xl font-black tracking-tighter" style={{ color: accent }}>{value}</div>
      {children}
    </div>
  );
}

function overallLabel(d: Detected): string {
  const score =
    (d.atsScore >= 85 ? 1 : 0) +
    (d.hasInternship ? 1 : 0) +
    (d.hackathons >= 1 ? 1 : 0) +
    (d.skills.length >= 6 ? 1 : 0) +
    (d.projects.length >= 2 ? 1 : 0);
  if (score >= 4) return "Excellent";
  if (score >= 3) return "Strong";
  if (score >= 2) return "Decent";
  return "Needs Work";
}

function overallColor(d: Detected): string {
  const lbl = overallLabel(d);
  return lbl === "Excellent" ? "#10b981"
    : lbl === "Strong" ? "#0f3b9c"
    : lbl === "Decent" ? "#f59e0b"
    : "#ef4444";
}

function improvementHint(d: Detected): string {
  if (d.atsScore < 85) return "Boost your ATS score: add quantified bullets, action verbs, and more keywords matching your target roles.";
  if (!d.hasInternship) return "An internship would significantly strengthen your profile — apply for one this season.";
  if (d.hackathons === 0) return "Participate in 1-2 hackathons to demonstrate problem-solving drive.";
  if (d.projects.length < 3) return "Add more projects (aim for 3-5) with deployed links or GitHub repos.";
  if (d.githubChecked && d.validatedProjects < d.projects.length) return "Some resume projects don't match any GitHub repo. Push the missing code.";
  return "Your resume looks solid — keep iterating with each new project or certification.";
}
