"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Timer, CheckCircle2, XCircle,
  Trophy, Lock, Sparkles, Calendar,
  TrendingUp, TrendingDown, Minus,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { fetchFromGAS, updateStudent } from "@/lib/api";
import { computePRS, Student } from "@/lib/matching";

// ─── Types ────────────────────────────────────────────────────────────────────

type AppPhase = 'loading' | 'locked' | 'ready' | 'generating' | 'quiz' | 'results';
type QPhase = 'thinking' | 'answering';

interface Question {
  q: string;
  opts: string[];
  ans: number;
  exp: string;
}

interface QuizResult {
  correct: number;
  total: number;
  bonusDelta: number;
  newBonus: number;
  answers: (number | null)[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

const FALLBACK: Question[] = [
  { q: "What is the time complexity of binary search?", opts: ["O(n)", "O(log n)", "O(n²)", "O(1)"], ans: 1, exp: "Binary search halves the search space each step → O(log n)." },
  { q: "Which data structure follows LIFO order?", opts: ["Queue", "Stack", "Array", "Graph"], ans: 1, exp: "Stack = Last-In-First-Out. Last pushed is first popped." },
  { q: "In OOP, what is encapsulation?", opts: ["Inheriting class properties", "Bundling data and methods, hiding internal state", "Overriding parent methods", "Creating class instances"], ans: 1, exp: "Encapsulation binds data and methods together and restricts direct access to internals." },
  { q: "What does HTTP stand for?", opts: ["HyperText Transfer Protocol", "High Transfer Text Protocol", "HyperText Transmission Protocol", "Hybrid Transfer Technology"], ans: 0, exp: "HTTP = HyperText Transfer Protocol — the foundation of web data communication." },
  { q: "Which HTTP method is used to create a new resource?", opts: ["GET", "DELETE", "POST", "PUT"], ans: 2, exp: "POST creates a new resource. GET retrieves, PUT updates, DELETE removes." },
  { q: "What is a foreign key in a relational database?", opts: ["Always-unique key in its table", "Key referencing another table's primary key", "An encrypted index", "Composite primary key"], ans: 1, exp: "Foreign key establishes a table relationship by referencing another table's primary key." },
  { q: "What does '===' check in JavaScript?", opts: ["Value equality only", "Value AND type equality (strict)", "Type equality only", "Memory reference"], ans: 1, exp: "'===' is strict equality — both value and type must match, no type coercion." },
  { q: "What is a deadlock in operating systems?", opts: ["CPU overload crash", "Memory exhaustion", "Processes blocked waiting on each other indefinitely", "An infinite loop"], ans: 2, exp: "Deadlock = circular wait — each process holds resources the others need." },
  { q: "Which sorting algorithm has the best average-case time?", opts: ["Bubble Sort", "Selection Sort", "Quick Sort", "Insertion Sort"], ans: 2, exp: "Quick Sort averages O(n log n). Bubble and Selection are O(n²)." },
  { q: "What is the purpose of Git version control?", opts: ["To compile code", "To track and manage code changes over time", "To deploy applications", "To run tests"], ans: 1, exp: "VCS tracks changes, enables collaboration, and allows reverting to earlier states." },
];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function QuizPage() {
  const [studentId, setStudentId] = useState<string | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [appPhase, setAppPhase] = useState<AppPhase>('loading');
  const [qPhase, setQPhase] = useState<QPhase>('thinking');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [countdown, setCountdown] = useState(3);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [prevResult, setPrevResult] = useState<QuizResult | null>(null);

  // Refs for stale-closure-safe access inside timers
  const answersRef    = useRef<(number | null)[]>([]);
  const currentQRef   = useRef(0);
  const questionsRef  = useRef<Question[]>([]);
  const studentRef    = useRef<Student | null>(null);
  const studentIdRef  = useRef<string | null>(null);
  const selectedRef   = useRef(false); // prevents double-advance per question (timer-safe)
  const [answerLocked, setAnswerLocked] = useState(false); // mirrors selectedRef for render

  // Keep refs in sync
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { currentQRef.current = currentQ; }, [currentQ]);
  useEffect(() => { questionsRef.current = questions; }, [questions]);
  useEffect(() => { studentRef.current = student; }, [student]);
  useEffect(() => { studentIdRef.current = studentId; }, [studentId]);

  // ── Load student + check daily lock ────────────────────────────────────────
  useEffect(() => {
    const id = localStorage.getItem('spos_user_id');
    if (!id) return;
    setStudentId(id); // eslint-disable-line react-hooks/set-state-in-effect
    studentIdRef.current = id;

    const lastDate   = localStorage.getItem(`spos_quiz_date_${id}`);
    const savedResult = localStorage.getItem(`spos_quiz_result_${id}`);

    async function init() {
      const studData = await fetchFromGAS('getStudents');
      const s: Student | undefined = studData.find((x: any) => String(x.id) === id);
      if (s) { setStudent(s); studentRef.current = s; }

      // Already played today
      if (lastDate === todayStr()) {
        if (savedResult) {
          try { setPrevResult(JSON.parse(savedResult)); } catch {}
        }
        setAppPhase('locked');
        return;
      }

      // Missed a day → apply penalty once per calendar day
      if (lastDate && lastDate < todayStr()) {
        const lastPenalty = localStorage.getItem(`spos_quiz_penalty_${id}`);
        if (lastPenalty !== todayStr()) {
          localStorage.setItem(`spos_quiz_penalty_${id}`, todayStr());
          const cur = s?.quizBonusScore ?? 50;
          const penalized = Math.max(0, cur - 5);
          updateStudent(id!, { quizBonusScore: penalized }).catch(() => {});
          if (s) { const updated = { ...s, quizBonusScore: penalized }; setStudent(updated); studentRef.current = updated; }
        }
      }

      setAppPhase('ready');
    }
    init();
  }, []);  

  // ── Finish + save results ───────────────────────────────────────────────────
  const finishQuiz = useCallback(() => {
    const finalAnswers = [...answersRef.current];
    const qs = questionsRef.current;
    const correct = finalAnswers.reduce<number>(
      (acc, ans, i) => acc + (ans !== null && ans === qs[i]?.ans ? 1 : 0),
      0
    );

    // PRS logic:
    //  correct > 0  → +2 per correct answer (capped at +10)
    //  correct === 0 → no change
    //  missed day   → already penalized at load time
    const bonusDelta = correct > 0 ? Math.min(10, correct * 2) : 0;
    const curBonus   = studentRef.current?.quizBonusScore ?? 50;
    const newBonus   = Math.max(0, Math.min(100, curBonus + bonusDelta));
    const today      = todayStr();

    const result: QuizResult = { correct, total: qs.length, bonusDelta, newBonus, answers: finalAnswers };

    localStorage.setItem(`spos_quiz_date_${studentIdRef.current}`, today);
    localStorage.setItem(`spos_quiz_result_${studentIdRef.current}`, JSON.stringify(result));

    if (studentIdRef.current) {
      updateStudent(studentIdRef.current, { quizBonusScore: newBonus, lastQuizDate: today }).catch(() => {});
    }

    setQuizResult(result);
    setAppPhase('results');
  }, []);  

  // ── Advance to next question (or finish) ────────────────────────────────────
  const advanceQuestion = useCallback(() => {
    const next = currentQRef.current + 1;
    if (next < questionsRef.current.length) {
      currentQRef.current = next;
      setCurrentQ(next);
      setQPhase('thinking');
      selectedRef.current = false;
      setAnswerLocked(false);
    } else {
      finishQuiz();
    }
  }, []); // eslint-disable-line

  // ── Per-question phase timer ────────────────────────────────────────────────
  useEffect(() => {
    if (appPhase !== 'quiz') return;

    const duration = qPhase === 'thinking' ? 3 : 4;
    setCountdown(duration); // eslint-disable-line react-hooks/set-state-in-effect
    let remaining = duration;
    let done = false;

    const id = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0 && !done) {
        done = true;
        clearInterval(id);
        if (qPhase === 'thinking') {
          setQPhase('answering');
        } else if (!selectedRef.current) {
          // Timer expired without selection — advance with null answer
          advanceQuestion();
        }
      }
    }, 1000);

    return () => { clearInterval(id); done = true; };
  }, [appPhase, qPhase, currentQ]); // eslint-disable-line

  // ── User selects an answer ──────────────────────────────────────────────────
  const handleSelect = (optIdx: number) => {
    if (qPhase !== 'answering' || selectedRef.current) return;
    selectedRef.current = true;
    setAnswerLocked(true);

    const newAnswers = [...answersRef.current];
    newAnswers[currentQRef.current] = optIdx;
    answersRef.current = newAnswers;
    setAnswers(newAnswers);

    // Brief visual feedback (350 ms) then advance
    setTimeout(advanceQuestion, 350);
  };

  // ── Start contest ───────────────────────────────────────────────────────────
  const startContest = async () => {
    setAppPhase('generating');
    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills: studentRef.current?.skills ?? [] }),
      });
      let qs: Question[] = await res.json();
      if (!Array.isArray(qs) || qs.length < 5) qs = shuffle(FALLBACK).slice(0, 10);
      qs = qs.slice(0, 10);
      questionsRef.current = qs;
      answersRef.current = new Array(qs.length).fill(null);
      setQuestions(qs);
      setAnswers(new Array(qs.length).fill(null));
      setCurrentQ(0);
      currentQRef.current = 0;
      selectedRef.current = false;
      setAnswerLocked(false);
      setQPhase('thinking');
      setAppPhase('quiz');
    } catch {
      const qs = shuffle(FALLBACK).slice(0, 10);
      questionsRef.current = qs;
      answersRef.current = new Array(10).fill(null);
      setQuestions(qs);
      setAnswers(new Array(10).fill(null));
      setCurrentQ(0);
      currentQRef.current = 0;
      selectedRef.current = false;
      setAnswerLocked(false);
      setQPhase('thinking');
      setAppPhase('quiz');
    }
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (appPhase === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#0f3b9c]">
        <div className="w-10 h-10 border-4 border-[#0f3b9c]/20 border-t-[#0f3b9c] rounded-full animate-spin mb-4" />
        <div className="text-sm font-semibold tracking-wide">Loading Daily Contest...</div>
      </div>
    );
  }

  // ── Locked ──────────────────────────────────────────────────────────────────
  if (appPhase === 'locked') {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const hoursLeft = Math.floor((tomorrow.getTime() - now.getTime()) / 3_600_000);
    const minsLeft  = Math.floor(((tomorrow.getTime() - now.getTime()) % 3_600_000) / 60_000);

    return (
      <div className="space-y-10 pt-10 pb-24 max-w-2xl mx-auto">
        <div className="text-center space-y-5">
          <div className="w-20 h-20 rounded-3xl bg-[#0f3b9c]/5 flex items-center justify-center mx-auto">
            <Lock className="w-10 h-10 text-[#0f3b9c]" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Daily Contest Complete</h1>
            <p className="text-sm font-medium text-slate-500 mt-2">You've already played today. Come back tomorrow!</p>
          </div>
          <div className="inline-flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-8 py-4">
            <Calendar className="w-5 h-5 text-[#0f3b9c]" />
            <span className="text-sm font-bold text-slate-700">
              Next contest in <span className="text-[#0f3b9c]">{hoursLeft}h {minsLeft}m</span>
            </span>
          </div>
        </div>

        {prevResult && (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 space-y-5">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Today's Result</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-3xl font-extrabold text-[#0f3b9c]">{prevResult.correct}/{prevResult.total}</div>
                <div className="text-[10px] font-bold uppercase text-slate-400 mt-1">Score</div>
              </div>
              <div className="text-center p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-3xl font-extrabold text-slate-800">
                  {Math.round((prevResult.correct / prevResult.total) * 100)}%
                </div>
                <div className="text-[10px] font-bold uppercase text-slate-400 mt-1">Accuracy</div>
              </div>
              <div className={cn("text-center p-5 rounded-2xl border",
                prevResult.bonusDelta > 0 ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100")}>
                <div className={cn("text-3xl font-extrabold",
                  prevResult.bonusDelta > 0 ? "text-emerald-600" : "text-slate-400")}>
                  {prevResult.bonusDelta > 0 ? `+${prevResult.bonusDelta}` : '±0'}
                </div>
                <div className="text-[10px] font-bold uppercase text-slate-400 mt-1">PRS Bonus</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Generating ──────────────────────────────────────────────────────────────
  if (appPhase === 'generating') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-[#0f3b9c]/10 flex items-center justify-center">
          <Brain className="w-8 h-8 text-[#0f3b9c] animate-pulse" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 mb-2">Personalizing Your Contest</h2>
          <p className="text-sm font-medium text-slate-500 mb-4">Generating questions based on your resume skills...</p>
          <div className="flex flex-wrap justify-center gap-2">
            {(student?.skills ?? []).slice(0, 6).map(skill => (
              <span key={skill} className="px-3 py-1.5 rounded-full bg-[#0f3b9c]/10 text-[#0f3b9c] text-xs font-bold border border-[#0f3b9c]/10">
                {skill}
              </span>
            ))}
            {(!student?.skills?.length) && (
              <span className="text-xs text-slate-400 italic">Using general CS questions</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-[#0f3b9c] animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    );
  }

  // ── Ready ────────────────────────────────────────────────────────────────────
  if (appPhase === 'ready') {
    const prs = student ? computePRS(student).composite : 0;
    return (
      <div className="space-y-10 pt-10 pb-24 max-w-2xl mx-auto">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="px-3 py-1 rounded-full bg-[#0f3b9c]/10 text-[#0f3b9c] text-[10px] font-black uppercase tracking-widest">Daily Contest</div>
            <div className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">Your Daily Challenge</h1>
          <p className="text-sm font-medium text-slate-500 max-w-md mx-auto">
            10 personalized questions based on your resume. Answer correctly to boost your PRS score.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-8 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
              <div className="text-2xl font-extrabold text-[#0f3b9c]">10</div>
              <div className="text-[10px] font-bold uppercase text-slate-400 mt-1">Questions</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
              <div className="text-2xl font-extrabold text-[#0f3b9c]">7s</div>
              <div className="text-[10px] font-bold uppercase text-slate-400 mt-1">Per Question</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#0f3b9c]/5 border border-[#0f3b9c]/10 text-center">
              <div className="text-2xl font-extrabold text-[#0f3b9c]">{prs}</div>
              <div className="text-[10px] font-bold uppercase text-slate-400 mt-1">Current PRS</div>
            </div>
          </div>

          {/* Flow explanation */}
          <div className="space-y-2">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Question Flow</div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#0f3b9c] text-white flex-1">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black shrink-0">1</div>
                <div>
                  <div className="text-xs font-extrabold">Read (3s)</div>
                  <div className="text-[9px] opacity-70">No options shown</div>
                </div>
              </div>
              <div className="text-slate-300 font-bold">→</div>
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white flex-1">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black shrink-0">2</div>
                <div>
                  <div className="text-xs font-extrabold">Answer (4s)</div>
                  <div className="text-[9px] opacity-70">Select or timeout</div>
                </div>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Skill Focus Today</div>
            <div className="flex flex-wrap gap-2">
              {(student?.skills ?? []).slice(0, 8).map(skill => (
                <span key={skill} className="px-3 py-1.5 rounded-xl bg-[#0f3b9c]/5 text-[#0f3b9c] text-xs font-bold border border-[#0f3b9c]/10">
                  {skill}
                </span>
              ))}
              {!student?.skills?.length && (
                <span className="text-xs text-slate-400 italic">Add skills to your profile for personalized questions</span>
              )}
            </div>
          </div>

          {/* PRS rules */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">PRS Impact Rules</div>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                <TrendingUp className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                <div className="text-[10px] font-bold text-emerald-700">Correct → PRS ↑</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <Minus className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                <div className="text-[10px] font-bold text-slate-500">All wrong → No change</div>
              </div>
              <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-center">
                <TrendingDown className="w-4 h-4 text-red-500 mx-auto mb-1" />
                <div className="text-[10px] font-bold text-red-600">Skip day → PRS ↓</div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button onClick={startContest}
            className="inline-flex items-center gap-3 px-12 py-4 rounded-2xl bg-[#0f3b9c] text-white font-extrabold text-sm uppercase tracking-widest hover:bg-blue-800 transition-all shadow-2xl shadow-[#0f3b9c]/30">
            <Sparkles className="w-5 h-5" /> Start Daily Contest
          </button>
        </div>
      </div>
    );
  }

  // ── Quiz ─────────────────────────────────────────────────────────────────────
  if (appPhase === 'quiz' && questions.length > 0) {
    const q = questions[currentQ];
    const isThinking = qPhase === 'thinking';

    return (
      <div className="pb-24 max-w-3xl mx-auto space-y-8 pt-6">

        {/* Top bar: progress + timer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
              Q{currentQ + 1}/{questions.length}
            </span>
            <div className="flex gap-1.5">
              {questions.map((_, i) => (
                <div key={i} className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i < currentQ
                    ? (answers[i] !== null ? "w-4 bg-[#0f3b9c]" : "w-4 bg-red-300")
                    : i === currentQ ? "w-8 bg-[#0f3b9c]" : "w-4 bg-slate-200"
                )} />
              ))}
            </div>
          </div>

          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl font-extrabold text-sm tabular-nums transition-all",
            isThinking
              ? "bg-[#0f3b9c]/10 text-[#0f3b9c]"
              : countdown <= 1 ? "bg-red-50 text-red-600 animate-pulse border border-red-200"
                               : "bg-emerald-50 text-emerald-700 border border-emerald-200"
          )}>
            <Timer className="w-4 h-4" />
            {countdown}s — {isThinking ? 'Read' : 'Answer'}
          </div>
        </div>

        {/* Countdown bar (answering phase only) */}
        <AnimatePresence>
          {!isThinking && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className={cn("h-full rounded-full", countdown <= 1 ? "bg-red-400" : "bg-emerald-500")}
                initial={{ width: '100%' }}
                animate={{ width: `${(countdown / 4) * 100}%` }}
                transition={{ duration: 0.95, ease: 'linear' }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div key={`q${currentQ}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.2 }}>

            <div className={cn(
              "rounded-3xl p-10 min-h-[160px] flex flex-col justify-center transition-colors duration-400",
              isThinking
                ? "bg-[#0f3b9c] text-white shadow-2xl shadow-[#0f3b9c]/25"
                : "bg-white border border-slate-200 shadow-sm"
            )}>
              {isThinking && (
                <div className="flex items-center gap-2 mb-4 opacity-60">
                  <Brain className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Think before the options appear…</span>
                </div>
              )}
              <p className={cn("text-xl font-semibold leading-snug", isThinking ? "text-white" : "text-slate-800")}>
                {q.q}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Options (answering phase only) */}
        <AnimatePresence>
          {!isThinking && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {q.opts.map((opt, i) => {
                const isSelected = answers[currentQ] === i;
                return (
                  <button key={i} onClick={() => handleSelect(i)} disabled={answerLocked}
                    className={cn(
                      "w-full text-left p-5 rounded-2xl font-bold text-sm transition-all border-2",
                      isSelected
                        ? "bg-[#0f3b9c]/5 border-[#0f3b9c] text-[#0f3b9c]"
                        : "bg-white border-slate-100 text-slate-600 hover:border-[#0f3b9c]/30 hover:bg-slate-50 disabled:cursor-default"
                    )}>
                    <div className="flex items-center gap-4">
                      <span className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-extrabold uppercase shrink-0",
                        isSelected ? "bg-[#0f3b9c] text-white" : "bg-slate-50 text-slate-400"
                      )}>
                        {["A", "B", "C", "D"][i]}
                      </span>
                      {opt}
                    </div>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── Results ──────────────────────────────────────────────────────────────────
  if (appPhase === 'results' && quizResult) {
    const { correct, total, bonusDelta, newBonus, answers: finalAnswers } = quizResult;
    const pct = Math.round((correct / total) * 100);
    const grade = pct >= 80 ? { label: 'Excellent!', color: '#059669' }
                : pct >= 50 ? { label: 'Good Effort', color: '#0f3b9c' }
                : correct === 0 ? { label: 'Keep Practicing', color: '#dc2626' }
                : { label: 'Keep Going', color: '#d97706' };

    return (
      <div className="space-y-10 pb-24 max-w-3xl mx-auto pt-6">

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-slate-200 p-10 shadow-sm">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-28 h-28 rounded-3xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${grade.color}12`, color: grade.color }}>
              {pct >= 80 ? <Trophy className="w-12 h-12" /> :
               pct >= 50 ? <CheckCircle2 className="w-12 h-12" /> :
               <Brain className="w-12 h-12" />}
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Daily Contest Result</div>
              <div className="flex flex-wrap items-baseline gap-4 mb-4">
                <h2 className="text-5xl font-extrabold text-slate-900">{correct}/{total}</h2>
                <span className="text-xl font-bold italic" style={{ color: grade.color }}>{grade.label}</span>
              </div>

              <div className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border",
                bonusDelta > 0
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-slate-50 text-slate-500 border-slate-200"
              )}>
                {bonusDelta > 0
                  ? <><TrendingUp className="w-4 h-4" /> PRS Bonus +{bonusDelta} pts → score now {newBonus}/100</>
                  : <><Minus className="w-4 h-4" /> No PRS change — score stays at {newBonus}/100</>
                }
              </div>
            </div>

            <div className="hidden lg:flex flex-col items-center border-l border-slate-100 pl-8 shrink-0">
              <div className="text-4xl font-extrabold text-slate-800">{pct}%</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Accuracy</div>
            </div>
          </div>
        </motion.div>

        {/* Review */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#0f3b9c]" /> Review
          </h2>
          <div className="grid gap-3">
            {questions.map((q, i) => {
              const isCorrect   = finalAnswers[i] === q.ans;
              const isUnanswered = finalAnswers[i] === null;
              return (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={cn("p-6 rounded-2xl border",
                    isCorrect    ? "bg-white border-slate-100"
                  : isUnanswered ? "bg-slate-50 border-slate-200"
                  :                "bg-red-50/30 border-red-100"
                  )}>
                  <div className="flex items-start gap-4">
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                      isCorrect    ? "bg-emerald-50 text-emerald-600"
                    : isUnanswered ? "bg-slate-100 text-slate-400"
                    :                "bg-red-50 text-red-600"
                    )}>
                      {isCorrect    ? <CheckCircle2 className="w-5 h-5" />
                     : isUnanswered ? <Timer className="w-5 h-5" />
                     :                <XCircle className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 space-y-3">
                      <p className="text-sm font-bold text-slate-900 leading-snug">{q.q}</p>
                      <div className="flex flex-wrap gap-2">
                        {q.opts.map((opt, oi) => (
                          <span key={oi} className={cn(
                            "px-3 py-1 rounded-lg text-[10px] font-bold",
                            oi === q.ans          ? "bg-emerald-100 text-emerald-700"
                          : oi === finalAnswers[i] ? "bg-red-100 text-red-700"
                          :                         "bg-slate-50 text-slate-400"
                          )}>
                            {opt}
                          </span>
                        ))}
                      </div>
                      {isUnanswered && (
                        <p className="text-[11px] font-medium text-slate-400">
                          Timed out — correct: <span className="font-bold text-emerald-600">{q.opts[q.ans]}</span>
                        </p>
                      )}
                      <div className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 italic">
                        {q.exp}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold">
            <Calendar className="w-4 h-4" /> Next contest available tomorrow
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-[#0f3b9c]/20 border-t-[#0f3b9c] rounded-full animate-spin" />
    </div>
  );
}
