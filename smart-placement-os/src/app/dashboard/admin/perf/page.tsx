"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Database, CheckCircle2, AlertCircle, XCircle,
  Play, Trash2, Plus, BarChart2, Clock, RefreshCcw, Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BenchResult {
  name: string;
  ms: number;
  records?: number;
  status: "pass" | "warn" | "fail";
  note?: string;
}

interface PerfReport {
  summary: { pass: number; warn: number; fail: number; totalMs: number; tests: number };
  results: BenchResult[];
  thresholds: { pass: string; warn: string; fail: string };
  timestamp: string;
}

const ADMIN_KEY = "psna-admin";

export default function PerfPage() {
  const [report, setReport] = useState<PerfReport | null>(null);
  const [running, setRunning] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [seedCount, setSeedCount] = useState("1000");
  const [seedBatch, setSeedBatch] = useState("2026");
  const [seedLog, setSeedLog] = useState("");
  const [error, setError] = useState("");

  const runTests = async () => {
    setRunning(true);
    setError("");
    setReport(null);
    try {
      const res = await fetch("/api/perf/test", {
        headers: { "x-admin-key": ADMIN_KEY },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Test run failed");
      setReport(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  };

  const seedData = async (cleanup = false) => {
    setSeeding(true);
    setSeedLog("");
    setError("");
    try {
      const res = await fetch("/api/perf/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": ADMIN_KEY },
        body: JSON.stringify({ count: parseInt(seedCount), batch: parseInt(seedBatch), cleanup }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Seed failed");
      setSeedLog(
        `✓ Inserted: ${data.inserted} | Skipped: ${data.skipped} | Deleted: ${data.deleted ?? 0} | Total PERF records: ${data.totalPerfRecords}` +
        (data.errors?.length ? `\n⚠ Errors: ${data.errors.join(", ")}` : "")
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSeeding(false);
    }
  };

  const cleanupData = async () => {
    setCleaning(true);
    setError("");
    try {
      const res = await fetch("/api/perf/seed?prefix=PERF", {
        method: "DELETE",
        headers: { "x-admin-key": ADMIN_KEY },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Cleanup failed");
      setSeedLog(`✓ Deleted ${data.deleted} PERF records from database.`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCleaning(false);
    }
  };

  const exportReport = () => {
    if (!report) return;
    const lines = [
      `SPOS Performance Report — ${report.timestamp}`,
      `Summary: ${report.summary.pass} pass | ${report.summary.warn} warn | ${report.summary.fail} fail | Total: ${report.summary.totalMs}ms`,
      "",
      "Test,Status,Time (ms),Records,Notes",
      ...report.results.map(r =>
        `"${r.name}",${r.status},${r.ms},${r.records ?? ""},${r.note ?? ""}`
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `perf-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const statusIcon = (s: BenchResult["status"]) =>
    s === "pass" ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> :
    s === "warn" ? <AlertCircle  className="w-4 h-4 text-amber-500" />   :
                   <XCircle      className="w-4 h-4 text-red-500" />;

  const statusBar = (ms: number) => {
    const pct = Math.min(100, (ms / 2000) * 100);
    const color = ms < 500 ? "bg-emerald-400" : ms < 2000 ? "bg-amber-400" : "bg-red-500";
    return (
      <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
    );
  };

  return (
    <div className="space-y-10 pt-10 pb-24 max-w-5xl mx-auto">
      {/* Header */}
      <div className="pb-8 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <div className="px-2.5 py-1 rounded bg-[#0f3b9c]/10 text-[#0f3b9c] text-xs font-bold tracking-wide uppercase">Admin Only</div>
          <div className="px-2.5 py-1 rounded bg-red-50 text-red-600 text-xs font-bold tracking-wide uppercase border border-red-100">Dev Tool</div>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Performance &amp; Load Test Dashboard</h1>
        <p className="text-sm font-medium text-slate-500">Benchmark database operations, API speed, and data integrity at 1000+ student scale</p>
      </div>

      {/* Seed Controls */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6">
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5 text-[#0f3b9c]" />
          <h2 className="text-lg font-bold text-slate-900">Step 1 — Seed Test Data</h2>
        </div>
        <p className="text-sm text-slate-500 font-medium">Insert synthetic student records prefixed with PERF. These are safe to delete after testing.</p>

        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Record Count</label>
            <input
              type="number" min="100" max="5000" value={seedCount}
              onChange={e => setSeedCount(e.target.value)}
              className="w-32 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-[#0f3b9c] outline-none focus:border-[#0f3b9c] focus:ring-2 focus:ring-[#0f3b9c]/10"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Batch Year</label>
            <input
              type="number" min="2020" max="2030" value={seedBatch}
              onChange={e => setSeedBatch(e.target.value)}
              className="w-28 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-[#0f3b9c] outline-none focus:border-[#0f3b9c] focus:ring-2 focus:ring-[#0f3b9c]/10"
            />
          </div>
          <button onClick={() => seedData(false)} disabled={seeding}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0f3b9c] text-white text-sm font-bold hover:bg-[#0a2d7a] transition-colors disabled:opacity-50">
            {seeding ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Insert Records
          </button>
          <button onClick={() => seedData(true)} disabled={seeding}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-bold hover:bg-amber-700 transition-colors disabled:opacity-50">
            {seeding ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
            Replace All PERF
          </button>
          <button onClick={cleanupData} disabled={cleaning}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200 text-sm font-bold hover:bg-red-100 transition-colors disabled:opacity-50">
            {cleaning ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete PERF Records
          </button>
        </div>

        {seedLog && (
          <div className="px-5 py-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-mono text-emerald-800 whitespace-pre-wrap">
            {seedLog}
          </div>
        )}
      </div>

      {/* Run Tests */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-[#0f3b9c]" />
            <h2 className="text-lg font-bold text-slate-900">Step 2 — Run Benchmarks</h2>
          </div>
          {report && (
            <button onClick={exportReport} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          )}
        </div>
        <p className="text-sm text-slate-500 font-medium">15 benchmarks covering fetch, filter, search, pagination, bulk update, aggregation, and integrity checks.</p>
        <button onClick={runTests} disabled={running}
          className="flex items-center gap-2 px-8 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-lg shadow-emerald-600/20">
          {running ? <><RefreshCcw className="w-4 h-4 animate-spin" /> Running 15 tests…</> : <><Play className="w-4 h-4" /> Run All Benchmarks</>}
        </button>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <XCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-sm font-semibold text-red-700">{error}</p>
          </div>
        )}
      </div>

      {/* Results */}
      <AnimatePresence>
        {report && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Passed", value: report.summary.pass, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
                { label: "Warnings", value: report.summary.warn, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
                { label: "Failed", value: report.summary.fail, color: "text-red-600", bg: "bg-red-50 border-red-200" },
                { label: "Total Time", value: `${report.summary.totalMs}ms`, color: "text-[#0f3b9c]", bg: "bg-[#0f3b9c]/5 border-[#0f3b9c]/20" },
              ].map(card => (
                <div key={card.label} className={cn("rounded-2xl border p-5 text-center", card.bg)}>
                  <div className={cn("text-3xl font-extrabold tabular-nums", card.color)}>{card.value}</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{card.label}</div>
                </div>
              ))}
            </div>

            {/* Thresholds legend */}
            <div className="flex gap-4 flex-wrap text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-600"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" /> Pass: {report.thresholds.pass}</span>
              <span className="flex items-center gap-1.5 text-amber-600"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Warn: {report.thresholds.warn}</span>
              <span className="flex items-center gap-1.5 text-red-600"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Fail: {report.thresholds.fail}</span>
              <span className="text-slate-400 ml-auto">Run at {new Date(report.timestamp).toLocaleTimeString()}</span>
            </div>

            {/* Results Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-[#0f3b9c]" />
                <span className="text-sm font-bold text-slate-900">Benchmark Results</span>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-slate-50/50 text-[10px] uppercase tracking-[0.15em] font-black text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3 text-left">Test</th>
                    <th className="px-6 py-3 text-center">Status</th>
                    <th className="px-6 py-3 text-center">Time</th>
                    <th className="px-6 py-3 text-center">Speed bar</th>
                    <th className="px-6 py-3 text-center">Records</th>
                    <th className="px-6 py-3 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {report.results.map((r, i) => (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={cn("transition-colors",
                        r.status === "pass" ? "hover:bg-emerald-50/20" :
                        r.status === "warn" ? "hover:bg-amber-50/30 bg-amber-50/10" :
                        "hover:bg-red-50/30 bg-red-50/20")}
                    >
                      <td className="px-6 py-3 font-semibold text-slate-700 text-xs">{r.name}</td>
                      <td className="px-6 py-3 text-center">{statusIcon(r.status)}</td>
                      <td className="px-6 py-3 text-center">
                        <span className={cn("font-extrabold tabular-nums text-sm",
                          r.status === "pass" ? "text-emerald-600" :
                          r.status === "warn" ? "text-amber-600" : "text-red-600")}>
                          {r.ms}ms
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex justify-center">{statusBar(r.ms)}</div>
                      </td>
                      <td className="px-6 py-3 text-center text-xs font-bold text-slate-500 tabular-nums">
                        {r.records ?? "—"}
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-400 font-medium max-w-xs truncate">
                        {r.note ?? "—"}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Recommendations */}
            {report.summary.fail > 0 || report.summary.warn > 0 ? (
              <div className="bg-amber-50 rounded-3xl border border-amber-200 p-8 space-y-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <h3 className="text-sm font-bold text-amber-800 uppercase tracking-widest">Optimization Recommendations</h3>
                </div>
                <ul className="space-y-2 text-sm font-medium text-amber-800">
                  {report.results.filter(r => r.status !== "pass").map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span><strong>{r.name}</strong> took {r.ms}ms — {
                        r.name.includes("all fields") ? "ensure heavy field projection is applied in GET /api/students" :
                        r.name.includes("regex") ? "consider a proper text index or ElasticSearch for search at scale" :
                        r.name.includes("compound") ? "add a compound index for batch+dept+cgpa" :
                        "investigate query plan with db.students.find(...).explain()"
                      }</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="bg-emerald-50 rounded-3xl border border-emerald-200 p-6 flex items-center gap-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
                <div>
                  <p className="font-bold text-emerald-800">All benchmarks passed!</p>
                  <p className="text-sm text-emerald-600 font-medium">The system handles 1000+ student records within acceptable thresholds.</p>
                </div>
              </div>
            )}

            {/* Clock icon summary */}
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <Clock className="w-3.5 h-3.5" />
              Total benchmark time: <strong className="text-slate-600">{report.summary.totalMs}ms</strong> across {report.summary.tests} tests
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
