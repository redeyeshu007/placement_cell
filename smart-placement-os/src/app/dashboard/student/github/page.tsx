"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  GitBranch,
  Star,
  GitFork,
  Code2,
  ExternalLink,
  RefreshCcw,
  AlertCircle,
  ArrowUpRight,
  Flame,
  Clock,
  CheckCircle2,
  Lock,
  CalendarPlus,
  CalendarClock,
  ShieldCheck,
  FileSearch,
  XCircle,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import React from "react";
import { fetchFromGAS, updateStudent } from "@/lib/api";
import { Student } from "@/lib/matching";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────
interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  language: string | null;
  created_at: string;
  pushed_at: string;
  updated_at: string;
  topics: string[];
  visibility: string;
  fork: boolean;
  size: number;
  default_branch: string;
  open_issues_count: number;
}

// ─── Language colour map ──────────────────────────────────────────────────────
const LANG_COLORS: Record<string, string> = {
  JavaScript: "#F7DF1E",
  TypeScript: "#3178C6",
  Python: "#3572A5",
  Java: "#B07219",
  "C++": "#F34B7D",
  C: "#555555",
  Go: "#00ADD8",
  Rust: "#DEA584",
  Ruby: "#701516",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  HTML: "#E34C26",
  CSS: "#563D7C",
  Shell: "#89E051",
  "C#": "#178600",
  PHP: "#4F5D95",
  "Jupyter Notebook": "#DA5B0B",
};

// Extract a GitHub username from any form of profile URL.
// Handles query strings (?tab=repositories), leading @, trailing slashes,
// and bare usernames.
function extractGithubUsername(link: string): string {
  if (!link) return "";
  let s = link.trim();
  // Strip protocol + host if present
  s = s.replace(/^https?:\/\/(www\.)?github\.com\//i, "");
  // Strip leading @ or slashes
  s = s.replace(/^[@/]+/, "");
  // Strip query string and hash
  s = s.split(/[?#]/)[0];
  // Take only the first path segment (ignore /tab/repositories, /repos, etc.)
  s = s.split("/")[0];
  // Clean trailing whitespace/punctuation
  return s.trim();
}

function langColor(lang: string | null) {
  if (!lang) return "#94a3b8"; // slate-400
  return LANG_COLORS[lang] ?? "#94a3b8";
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

// ─── Repo Card ────────────────────────────────────────────────────────────────
function RepoCard({ repo, delay }: { repo: GithubRepo; delay: number }) {
  const color = langColor(repo.language);
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-white border border-slate-200 rounded-xl p-6 group flex flex-col hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden"
      onClick={() => window.open(repo.html_url, "_blank")}
    >
      <div 
        className="absolute top-0 left-0 w-1 h-full opacity-70"
        style={{ backgroundColor: color }}
      />
      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-bold text-[#0f3b9c] group-hover:underline flex items-center gap-2">
            {repo.name}
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0f3b9c]" />
          </h3>
          <div className="flex items-center gap-2">
            {repo.fork && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                Fork
              </span>
            )}
            {repo.visibility === "private" && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Private
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-600 mb-4 line-clamp-2 min-h-[2.5rem]">
        {repo.description ?? "No description provided."}
      </p>

      {/* Topics */}
      {repo.topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-5 mt-auto">
          {repo.topics.slice(0, 4).map((t) => (
            <span
              key={t}
              className="px-2.5 py-1 rounded-md text-[10px] font-semibold text-[#0f3b9c] bg-[#0f3b9c]/10"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* ── Date row ── */}
      <div className="grid grid-cols-2 gap-3 mb-4 mt-auto border-t border-slate-100 pt-4">
        <div className="flex items-center gap-2">
          <CalendarPlus className="w-4 h-4 text-slate-400" />
          <div className="flex flex-col">
            <span className="text-[10px] font-medium text-slate-500">Created</span>
            <span className="text-xs font-semibold text-slate-800">{formatDate(repo.created_at)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-slate-400" />
          <div className="flex flex-col">
            <span className="text-[10px] font-medium text-slate-500">Last Push</span>
            <span className="text-xs font-semibold text-slate-800">{formatDate(repo.pushed_at)}</span>
          </div>
        </div>
      </div>

      {/* Stats footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <div className="flex items-center gap-4">
          {repo.language && (
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: color }} />
              <span className="text-xs font-semibold text-slate-600">
                {repo.language}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-slate-600">
            <Star className="w-4 h-4" />
            <span className="text-xs font-semibold">{repo.stargazers_count}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <GitFork className="w-4 h-4" />
            <span className="text-xs font-semibold">{repo.forks_count}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <Clock className="w-4 h-4" />
          <span className="text-xs font-medium">{timeAgo(repo.pushed_at)}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────
function StatPill({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white border border-slate-200 px-6 py-4 rounded-xl flex items-center gap-4 shadow-sm w-full md:w-auto flex-1 min-w-[200px]">
      <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15`, color }}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-900 leading-tight">{value}</div>
        <div className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-0.5">{label}</div>
      </div>
    </div>
  );
}

// ─── Project name fuzzy matcher ───────────────────────────────────────────────
function matchProject(resumeName: string, repoName: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[-_\s.]/g, "");
  const rn = norm(repoName);
  const pn = norm(resumeName);
  return rn === pn || rn.includes(pn) || pn.includes(rn);
}

// ─── Validated Projects Tab ───────────────────────────────────────────────────
function ValidatedProjectsTab({
  resumeProjects,
  repos,
  aiMatches,
}: {
  resumeProjects: string[];
  repos: GithubRepo[];
  aiMatches: { resumeProject: string; repoName: string | null; confidence: number }[];
}) {
  const validated = useMemo(() => {
    const repoByName = new Map(repos.map(r => [r.name, r]));
    return resumeProjects.map(proj => {
      // Prefer AI match; fall back to fuzzy string match
      const ai = aiMatches.find(m => m.resumeProject === proj);
      const aiRepo = ai?.repoName ? repoByName.get(ai.repoName) ?? null : null;
      const repo = aiRepo ?? repos.find(r => matchProject(proj, r.name)) ?? null;
      return { name: proj, repo, confidence: ai?.confidence ?? (repo ? 60 : 0) };
    });
  }, [resumeProjects, repos, aiMatches]);
  const found   = validated.filter(v => v.repo !== null);
  const missing = validated.filter(v => v.repo === null);

  if (resumeProjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
          <FileSearch className="w-10 h-10 text-slate-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">No Resume Uploaded Yet</h3>
          <p className="text-sm text-slate-500 max-w-sm">
            Upload your resume on the{" "}
            <a href="/dashboard/student/resume" className="text-[#0f3b9c] font-semibold hover:underline">Resume Builder page</a>{" "}
            to extract and validate your projects against GitHub.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-4">
        <StatPill icon={<ShieldCheck className="w-6 h-6" />} label="GitHub Validated" value={found.length}   color="#10b981" />
        <StatPill icon={<XCircle className="w-6 h-6" />}     label="Not on GitHub"    value={missing.length} color="#f59e0b" />
        <StatPill icon={<FileSearch className="w-6 h-6" />}  label="Total in Resume"  value={resumeProjects.length} color="#6366f1" />
      </div>

      {repos.length === 0 && (
        <div className="flex items-start gap-3 p-5 rounded-xl bg-amber-50 border border-amber-100">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-amber-700">
            Sync your GitHub repos first (click "Sync Repos") to validate resume projects.
          </p>
        </div>
      )}

      {found.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            GitHub-Validated Projects
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">{found.length}</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {found.map(({ name, repo }) => (
              <motion.div key={name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                onClick={() => repo && window.open(repo.html_url, "_blank")}
                className="bg-white border border-emerald-100 rounded-xl p-5 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer group">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-slate-900 truncate">{name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase shrink-0">Verified</span>
                  </div>
                  <div className="text-xs text-slate-500 font-medium flex items-center gap-3">
                    <span className="text-[#0f3b9c] font-semibold group-hover:underline">{repo?.name}</span>
                    {repo?.language && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: langColor(repo.language) }} />{repo.language}</span>}
                    <span className="flex items-center gap-1"><Star className="w-3 h-3" />{repo?.stargazers_count}</span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-[#0f3b9c] transition-colors shrink-0" />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {missing.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-amber-500" />
            Resume-Only Projects
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-100">{missing.length}</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium">These projects appear in your resume but have no matching public GitHub repository.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {missing.map(({ name }) => (
              <div key={name} className="bg-white border border-amber-100 rounded-xl p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                  <XCircle className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold text-slate-700 truncate block">{name}</span>
                  <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide">No matching repo found</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function GithubProjectsPage() {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"repos" | "validated">("repos");
  const [filterLang, setFilterLang] = useState("ALL");
  const [showForksOnly, setShowForksOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"pushed" | "created" | "stars" | "forks">("pushed");
  const [aiMatches, setAiMatches] = useState<{ resumeProject: string; repoName: string | null; confidence: number }[]>([]);

  useEffect(() => {
    const savedId = localStorage.getItem("spos_user_id");
    if (!savedId) { router.push("/auth/login"); return; }
    async function load() {
      const data = await fetchFromGAS("getStudents");
      const s = data.find((x: any) => String(x.id) === savedId);
      if (!s) { router.push("/auth/login"); return; }
      setStudent(s);
      setLoading(false);
    }
    load();
  }, [router]);

  useEffect(() => {
    if (!student?.githubLink) return;
    fetchRepos(student.githubLink);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student]);

  async function fetchRepos(link: string) {
    setFetching(true);
    setError(null);
    try {
      const username = extractGithubUsername(link);
      if (!username) throw new Error("Could not extract GitHub username from the stored link.");
      
      const res = await fetch(`/api/github/repos/${encodeURIComponent(username)}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 403) {
          throw new Error("GitHub API rate limit exceeded. The institution needs an authorized sync token.");
        }
        throw new Error(errorData.error || `Proxy Error: ${res.status}`);
      }
      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new Error(data?.error || data?.message || "GitHub returned an unexpected response.");
      }
      setRepos(data as GithubRepo[]);

      // Validate resume projects against GitHub repos.
      // Prefer semantic matching via OpenAI; fall back to naive string matching if it fails.
      const resumeProjects: string[] = (student as any)?.resumeProjects ?? [];
      if (resumeProjects.length > 0 && student) {
        let count = 0;
        try {
          const validateRes = await fetch('/api/github/validate-projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              resumeProjects,
              repos: data.map(r => ({ name: r.name, description: r.description, language: r.language })),
            }),
          });
          if (validateRes.ok) {
            const json = await validateRes.json();
            const matches = Array.isArray(json.matches) ? json.matches : [];
            setAiMatches(matches);
            count = matches.filter((m: { repoName: string | null }) => m.repoName).length;
          } else {
            throw new Error('AI validation unavailable');
          }
        } catch {
          // Fallback: naive string matching
          const fallback = resumeProjects.map(proj => {
            const repo = data.find(r => matchProject(proj, r.name));
            return { resumeProject: proj, repoName: repo?.name ?? null, confidence: repo ? 60 : 0 };
          });
          setAiMatches(fallback);
          count = fallback.filter(m => m.repoName).length;
        }
        updateStudent(student.id, { validatedProjectsCount: count }).catch(() => {});
      } else {
        setAiMatches([]);
      }
    } catch (err: any) {
      setError(err.message ?? "Unknown error fetching repos.");
    } finally {
      setFetching(false);
    }
  }

  if (loading || !student)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#0f3b9c]">
        <div className="w-10 h-10 border-4 border-[#0f3b9c]/20 border-t-[#0f3b9c] rounded-full animate-spin mb-4" />
        <div className="text-sm font-semibold tracking-wide">Connecting to GitHub...</div>
      </div>
    );

  if (!student.githubLink)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center gap-6">
        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
          <GitBranch className="w-10 h-10 text-slate-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">No GitHub Linked</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Your profile does not have a GitHub link attached. Contact your placement coordinator to add it.
          </p>
        </div>
      </div>
    );

  const username = extractGithubUsername(student.githubLink) ?? "";
  const safeRepos = Array.isArray(repos) ? repos : [];
  const allLangs = ["ALL", ...Array.from(new Set(safeRepos.map(r => r.language).filter(Boolean) as string[]))];
  const originalCount = safeRepos.filter(r => !r.fork).length;
  const totalStars = safeRepos.reduce((s, r) => s + (r.stargazers_count ?? 0), 0);
  const topLang = allLangs.slice(1).reduce(
    (best, lang) => {
      const n = safeRepos.filter(r => r.language === lang).length;
      return n > best.n ? { lang, n } : best;
    },
    { lang: "—", n: 0 }
  );

  const filtered = safeRepos
    .filter(r => filterLang === "ALL" || r.language === filterLang)
    .filter(r => !showForksOnly || r.fork)
    .sort((a, b) => {
      if (sortBy === "stars")   return b.stargazers_count - a.stargazers_count;
      if (sortBy === "forks")   return b.forks_count - a.forks_count;
      if (sortBy === "created") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime(); // default: last push
    });

  return (
    <div className="space-y-8 pt-10 pb-16">

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="px-3 py-1.5 rounded-md bg-[#0f3b9c]/10 text-[#0f3b9c] text-xs font-bold tracking-wide">Live GitHub Data</div>
            <a
              href={student.githubLink} target="_blank" rel="noreferrer"
              className="group flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-100 hover:bg-[#0f3b9c]/10 hover:text-[#0f3b9c] text-slate-700 text-xs font-bold transition-colors"
            >
              @{username} <ArrowUpRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" />
            </a>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">GitHub Projects</h1>
          <p className="text-sm text-slate-500 font-medium">{student.name} • All Repositories</p>
          {/* Tab switcher */}
          <div className="flex items-center gap-1 mt-4 bg-slate-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setTab("repos")}
              className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                tab === "repos" ? "bg-white text-[#0f3b9c] shadow-sm" : "text-slate-500 hover:text-slate-700")}
            >
              <GitBranch className="w-3.5 h-3.5" /> All Repos
            </button>
            <button
              onClick={() => setTab("validated")}
              className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                tab === "validated" ? "bg-white text-[#0f3b9c] shadow-sm" : "text-slate-500 hover:text-slate-700")}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Validated Projects
              {(student as any).resumeProjects?.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#0f3b9c]/10 text-[#0f3b9c] text-[10px] font-extrabold">
                  {(student as any).resumeProjects.length}
                </span>
              )}
            </button>
          </div>
        </div>
        <button
          onClick={() => fetchRepos(student.githubLink!)}
          disabled={fetching}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0f3b9c] text-white font-semibold text-sm hover:bg-[#0c2a70] transition-colors disabled:opacity-50 shrink-0 shadow-sm"
        >
          <RefreshCcw className={cn("w-4 h-4", fetching && "animate-spin")} />
          {fetching ? "Syncing..." : "Sync Repos"}
        </button>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-start gap-4 p-6 rounded-xl bg-red-50 border border-red-100"
          >
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-red-800 mb-1">Synchronization Error</div>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading skeletons */}
      {fetching && repos.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-slate-100 border border-slate-200 rounded-xl h-64 animate-pulse" />
          ))}
        </div>
      )}

      {/* ── ALL REPOS TAB ─────────────────────────────────────────────────── */}
      {tab === "repos" && (
        <>
          {/* Data loaded */}
          {!fetching && repos.length > 0 && (
            <>
              {/* Stat pills */}
              <div className="flex flex-wrap gap-4">
                <StatPill icon={<GitBranch className="w-6 h-6" />} label="Total Repos"  value={repos.length}  color="#0f3b9c" />
                <StatPill icon={<Code2 className="w-6 h-6" />}     label="Original"     value={originalCount} color="#6366f1" />
                <StatPill icon={<Star className="w-6 h-6" />}      label="Total Stars"  value={totalStars}    color="#f59e0b" />
                <StatPill icon={<Flame className="w-6 h-6" />}     label="Top Language" value={topLang.lang}  color="#ef4444" />
              </div>

              {/* Controls bar */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap gap-4 items-center shadow-sm">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Language</span>
                  {allLangs.map(lang => (
                    <button key={lang} onClick={() => setFilterLang(lang)}
                      className={cn("px-3 py-1.5 rounded-md text-xs font-semibold transition-colors",
                        filterLang === lang ? "bg-[#0f3b9c] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>
                      {lang === "ALL" ? "All" : (
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: langColor(lang) }} />
                          {lang}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="hidden md:block w-px h-6 bg-slate-200" />
                <button onClick={() => setShowForksOnly(f => !f)}
                  className={cn("px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5",
                    showForksOnly ? "bg-[#0f3b9c] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>
                  <GitFork className="w-3.5 h-3.5" /> Forks Only
                </button>
                <div className="hidden md:block w-px h-6 bg-slate-200" />
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Sort</span>
                  <select className="bg-slate-100 border-none rounded-md text-sm font-semibold text-slate-700 py-1.5 pl-3 pr-8 focus:ring-2 focus:ring-[#0f3b9c] focus:outline-none focus:bg-white"
                    value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
                    <option value="pushed">Last Update</option>
                    <option value="created">Created Date</option>
                    <option value="stars">Stars Count</option>
                    <option value="forks">Forks Count</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 px-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-medium text-slate-600">
                  Showing <span className="font-bold text-slate-800">{filtered.length}</span> of {repos.length} repositories
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((repo, i) => <RepoCard key={repo.id} repo={repo} delay={Math.min(i * 0.04, 0.6)} />)}
              </div>
              {filtered.length === 0 && (
                <div className="text-center py-20 text-slate-400 font-semibold text-sm">No repositories match this filter.</div>
              )}
            </>
          )}

          {!fetching && repos.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                <GitBranch className="w-8 h-8 text-slate-400" />
              </div>
              <p className="font-semibold text-slate-500 text-sm max-w-sm text-center">
                Click "Sync Repos" to load your GitHub projects and statistics.
              </p>
            </div>
          )}
        </>
      )}

      {/* ── VALIDATED PROJECTS TAB ────────────────────────────────────────── */}
      {tab === "validated" && (
        <ValidatedProjectsTab
          resumeProjects={(student as any).resumeProjects ?? []}
          repos={repos}
          aiMatches={aiMatches}
        />
      )}
    </div>
  );
}
