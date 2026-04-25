"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap, ArrowRight, Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchFromGAS } from "@/lib/api";

export default function LoginPage() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !password) return;

    setLoading(true);
    setError("");

    // Admin Access Logic
    if (userId.toLowerCase() === "admin" && password === "psna123") {
      localStorage.setItem("spos_user_id", "admin");
      localStorage.setItem("spos_user_role", "admin");
      router.push("/dashboard/admin");
      setLoading(false);
      return;
    }

    // Student Access Logic — check against DB password (defaults to register number)
    try {
      const students = await fetchFromGAS('getStudents');
      const inputId = String(userId).trim().replace(/\.0$/, "");
      const student = students.find((s: any) => String(s.id).replace(/\.0$/, "") === inputId);

      if (!student) {
        setError("Register number not found. Only pre-registered students can access the portal.");
        setLoading(false);
        return;
      }

      // Password check: use stored password field, fallback to register number for legacy records
      const expectedPassword = student.password ?? student.id;
      if (password !== expectedPassword) {
        setError("Incorrect password. Your default password is your register number.");
        setLoading(false);
        return;
      }

      localStorage.setItem("spos_user_id", student.id);
      localStorage.setItem("spos_user_role", "student");

      // First-time login: redirect to profile setup
      if (!student.profileComplete) {
        router.push("/auth/profile-setup");
      } else {
        router.push("/dashboard/student");
      }
    } catch (err) {
      setError("Unable to connect to service. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-3xl p-10 shadow-2xl shadow-slate-200 border border-slate-100">
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-[#0f3b9c] flex items-center justify-center shadow-lg shadow-[#0f3b9c]/20 mx-auto mb-6">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Portal Access</h1>
            <p className="text-sm font-medium text-slate-500">Sign in to your professional profile</p>
            <div className="text-[10px] font-bold text-[#0f3b9c] uppercase tracking-widest mt-4">
              PSNA COLLEGE OF ENGINEERING AND TECHNOLOGY
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Identification ID</label>
              <input
                type="text"
                placeholder="Reg. Number or Admin ID"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-slate-900 font-semibold outline-none focus:border-[#0f3b9c] focus:ring-4 focus:ring-[#0f3b9c]/5 transition-all placeholder:text-slate-300"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Secure Password</label>
              <input
                type="password"
                placeholder="••••••••••••"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-slate-900 font-semibold outline-none focus:border-[#0f3b9c] focus:ring-4 focus:ring-[#0f3b9c]/5 transition-all placeholder:text-slate-300"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-[11px] font-bold leading-relaxed"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </motion.div>
            )}

            <button
              disabled={loading}
              className="w-full bg-[#0f3b9c] hover:bg-[#0c2a70] text-white py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-lg shadow-[#0f3b9c]/20 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Connect Profile <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-[11px] text-slate-400 font-medium">
            Default password = register number. Only admin-registered students can log in.
          </p>
          <div className="mt-4 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-400">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Secure Academic Portal</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
