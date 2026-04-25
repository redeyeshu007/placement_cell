/**
 * MATCHING ENGINE (CORE LOGIC)
 *
 * Match Score =
 * (CGPA * 0.3) + (Skill Match % * 0.3) + (Hackathons * 0.15) +
 * (Certifications * 0.15) - (Backlog Penalty * 0.2)
 *
 * PRS (Placement Readiness Score) — 10 factors:
 *   CGPA              20%
 *   Skills            15%
 *   Hackathons        10%
 *   Certifications    10%
 *   LeetCode          10%
 *   Resume Strength   15%
 *   Projects          5%
 *   Valid GitHub Proj  5%
 *   Experience        5%
 *   Arrear Penalty    -5 pts per active backlog
 */

export interface Student {
  id: string;
  name: string;
  dept: string;
  cgpa: number;
  totalBacklogs: number;
  activeBacklogs: number;
  skills: string[];
  hackathons: number;
  certifications: number;
  resume_link?: string;
  githubLink?: string;
  domain?: string;
  // Persisted extras
  leetcodeUsername?: string;
  leetcodeSolved?: number;
  resumeProjects?: string[];
  validatedProjectsCount?: number;
  resumeStrengthScore?: number;
  resumeStrengthLevel?: string;
  resumeExperienceScore?: number;
  resumeExperienceLevel?: string;
  resumeExperienceSummary?: string;
  quizBonusScore?: number;  // 0-100; default 50 neutral
  lastQuizDate?: string;    // "YYYY-MM-DD"
  tenthPercent?: number;
  twelfthPercent?: number;
}

export interface Company {
  id: string;
  name: string;
  role?: string;
  salary?: string;
  requirementType?: 'open' | 'skill-based' | 'interested';
  requiredSkills: string[];
  prioritySkills: string[];
  minCgpa: number;
  allowedBacklogs: number;
  noHistoryOfArrears?: boolean;
  selectCount?: number; // 0 = no cap
  min10thPercent?: number;
  min12thPercent?: number;
  acceptedStudents?: string[];
  finalAccepted?: string[];
  finalRejected?: string[];
}

export function calculateMatch(student: Student, company: Company) {
  // 1. Filter Check (Base Eligibility)
  const isCgpaEligible = student.cgpa >= company.minCgpa;
  
  const tenth = Number(student.tenthPercent) || 0;
  const twelfth = Number(student.twelfthPercent) || 0;
  const is10thEligible = !company.min10thPercent || tenth >= company.min10thPercent;
  const is12thEligible = !company.min12thPercent || twelfth >= company.min12thPercent;
  const isArrearHistoryEligible = !company.noHistoryOfArrears || student.totalBacklogs === 0;

  // allowedBacklogs === -1 means no restriction
  const isBacklogEligible = company.allowedBacklogs === undefined || company.allowedBacklogs === -1 || student.activeBacklogs <= company.allowedBacklogs;

  if (!isCgpaEligible || !isBacklogEligible || !is10thEligible || !is12thEligible || !isArrearHistoryEligible) {
    return {
      score: 0,
      isEligible: false,
      reasons: [
        !isCgpaEligible && `CGPA ${student.cgpa} below required ${company.minCgpa}`,
        !isBacklogEligible && `${student.activeBacklogs} active backlogs exceeds allowed ${company.allowedBacklogs}`,
        !is10thEligible && `10th percentage ${tenth}% is below required ${company.min10thPercent}%`,
        !is12thEligible && `12th percentage ${twelfth}% is below required ${company.min12thPercent}%`,
        !isArrearHistoryEligible && `This drive requires zero arrear history. You have ${student.totalBacklogs} total backlog(s) on record`
      ].filter(Boolean) as string[]
    };
  }

  // 2. Skill Match Calculation
  const matchedSkills = student.skills.filter(skill =>
    company.requiredSkills.some(rs => rs.toLowerCase() === skill.toLowerCase())
  );
  const skillMatchPercent = company.requiredSkills.length > 0
    ? (matchedSkills.length / company.requiredSkills.length) * 100
    : 100;

  // 3. Scoring Components
  const cgpaScore        = (student.cgpa / 10) * 100 * 0.3;
  const skillScore       = skillMatchPercent * 0.3;
  const hackathonScore   = Math.min(student.hackathons * 20, 100) * 0.15;
  const certScore        = Math.min(student.certifications * 25, 100) * 0.15;
  const backlogPenalty   = student.activeBacklogs * 10 * 0.2;
  const totalScore       = Math.round(cgpaScore + skillScore + hackathonScore + certScore - backlogPenalty);

  // 4. Explanation Generation
  const explanations = [];
  if (skillMatchPercent >= 80) explanations.push("Strong skill alignment");
  if (student.cgpa >= 8.5) explanations.push("Exceptional academic record");
  if (student.hackathons >= 2) explanations.push("Proven problem-solving drive");
  if (student.activeBacklogs > 0) explanations.push("Active backlog is a risk factor");

  const missingPrioritySkills = company.prioritySkills.filter(ps =>
    !student.skills.some(ss => ss.toLowerCase() === ps.toLowerCase())
  );

  return {
    score: Math.max(0, Math.min(100, totalScore)),
    isEligible: true,
    skillMatchPercent,
    matchedSkills,
    missingPrioritySkills,
    explanations
  };
}

// ─── PRS Breakdown ────────────────────────────────────────────────────────────
export interface PRSBreakdown {
  // Raw dimension scores (0-100 each)
  cgpa: number;
  skills: number;
  hackathons: number;
  certifications: number;
  leetcode: number;
  resumeStrength: number;
  projects: number;
  validProjects: number;
  experience: number;
  quiz: number;
  // Composite
  composite: number;
  // Legacy aliases used by prs/page.tsx
  academic: number;
  technical: number;
  problemSolving: number;
  communication: number;
  professional: number;
}

export function computePRS(student: Student): PRSBreakdown {
  // ── Dimension scores (0-100) ──────────────────────────────────────────────
  const cgpa         = Math.min(100, (student.cgpa / 10) * 100);
  const skills       = Math.min(100, (student.skills.length / 8) * 100);
  const hackathons   = Math.min(100, student.hackathons * 20);
  const certifications = Math.min(100, student.certifications * 25);

  // LeetCode: 200 solved = 100%; use stored count or 0
  const solved       = student.leetcodeSolved ?? 0;
  const leetcode     = Math.min(100, (solved / 200) * 100);

  // Resume strength: from OpenAI analysis (0-100), default 0 if not analyzed
  const resumeStrength = student.resumeStrengthScore ?? 0;

  // Projects: 5 resume projects = 100%
  const projectCount = (student.resumeProjects ?? []).length;
  const projects     = Math.min(100, (projectCount / 5) * 100);

  // Validated GitHub projects: 3 = 100%
  const validCount   = student.validatedProjectsCount ?? 0;
  const validProjects = Math.min(100, (validCount / 3) * 100);

  // Experience: from OpenAI (0-100), default 0
  const experience   = student.resumeExperienceScore ?? 0;

  // Daily quiz bonus: 0-100 scale, default 50 (neutral).
  // Rises with correct answers, falls when days are missed.
  const quiz = Math.min(100, Math.max(0, student.quizBonusScore ?? 50));

  // ── Weighted composite (weights sum to 1.0) ───────────────────────────────
  const weighted =
    cgpa          * 0.20 +
    skills        * 0.15 +
    hackathons    * 0.10 +
    certifications * 0.10 +
    leetcode      * 0.10 +
    resumeStrength * 0.15 +
    projects      * 0.05 +
    validProjects * 0.05 +
    experience    * 0.05 +
    quiz          * 0.05;

  // Arrear penalty: -5 pts per active backlog (capped at -20)
  const penalty = Math.min(20, student.activeBacklogs * 5);

  const composite = Math.max(0, Math.min(100, Math.round(weighted - penalty)));

  return {
    cgpa, skills, hackathons, certifications,
    leetcode, resumeStrength, projects, validProjects, experience,
    quiz,
    composite,
    // Legacy aliases so prs/page.tsx components keep working
    academic:       cgpa,
    technical:      skills,
    problemSolving: Math.round((hackathons + leetcode) / 2),
    communication:  certifications,
    professional:   Math.round((resumeStrength + experience) / 2),
  };
}

// ─── Eligibility Check ────────────────────────────────────────────────────────
export interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
}

export function checkEligibility(student: Student, company: Company): EligibilityResult {
  const reasons: string[] = [];

  if (student.cgpa < company.minCgpa) {
    reasons.push(`CGPA ${student.cgpa} is below the required ${company.minCgpa}`);
  }
  if (company.noHistoryOfArrears && student.totalBacklogs > 0) {
    reasons.push(`This drive requires zero arrear history. You have ${student.totalBacklogs} total backlog(s) on record`);
  }
  if (company.allowedBacklogs !== undefined && company.allowedBacklogs !== -1 && student.activeBacklogs > company.allowedBacklogs) {
    reasons.push(`You have ${student.activeBacklogs} active backlog(s). Maximum allowed: ${company.allowedBacklogs}`);
  }
  if (company.min10thPercent && company.min10thPercent > 0) {
    const tenth = Number(student.tenthPercent) || 0;
    if (tenth < company.min10thPercent) {
      reasons.push(`10th percentage ${tenth}% is below required ${company.min10thPercent}%`);
    }
  }
  if (company.min12thPercent && company.min12thPercent > 0) {
    const twelfth = Number(student.twelfthPercent) || 0;
    if (twelfth < company.min12thPercent) {
      reasons.push(`12th percentage ${twelfth}% is below required ${company.min12thPercent}%`);
    }
  }

  return { eligible: reasons.length === 0, reasons };
}

// ─── Combined Drive Score (for ranking) ──────────────────────────────────────
export function computeDriveScore(student: Student, company: Company): {
  score: number;
  prsScore: number;
  skillMatchPercent: number;
  githubScore: number;
} {
  const prs = computePRS(student);
  const prsScore = prs.composite;

  // Skill match
  const requiredCount = company.requiredSkills.length;
  const matchedCount = company.requiredSkills.filter(rs =>
    student.skills.some(ss => ss.toLowerCase() === rs.toLowerCase())
  ).length;
  const skillMatchPercent = requiredCount > 0 ? (matchedCount / requiredCount) * 100 : 100;

  // GitHub relevance: validated projects + skills in repo names
  const validCount = student.validatedProjectsCount ?? 0;
  const githubScore = Math.min(100, validCount * 25);

  let score: number;
  if (company.requirementType === 'skill-based') {
    // PRS 50% + Skill match 30% + GitHub 20%
    score = prsScore * 0.5 + skillMatchPercent * 0.3 + githubScore * 0.2;
  } else {
    // Open: pure PRS
    score = prsScore;
  }

  return { score: Math.round(score), prsScore, skillMatchPercent, githubScore };
}

// ─── Shortlist Result ─────────────────────────────────────────────────────────
export interface StudentStatus {
  status: 'selected' | 'eligible-not-selected' | 'not-eligible';
  rank: number;          // rank among eligible students (1-based); 0 if not eligible
  totalEligible: number;
  combinedScore: number;
  prsScore: number;
  skillMatchPercent: number;
  githubScore: number;
  reasons: string[];     // why not eligible (empty if eligible)
  suggestions: string[]; // improvement tips
}

export function getStudentStatus(
  student: Student,
  company: Company,
  allStudents: Student[]
): StudentStatus {
  // Only the admin's explicit "Accept" action in the admin panel counts as
  // "shortlisted". Neither the auto-generated shortlist (acceptedStudents) nor
  // rank-based selection should inflate the student's "Shortlisted In" counter.
  const adminAccepted = (company.finalAccepted ?? []).includes(student.id);

  // Step 1: eligibility filter
  const { eligible, reasons } = checkEligibility(student, company);

  if (!eligible && !adminAccepted) {
    const suggestions = buildSuggestions(student, company, reasons);
    return {
      status: 'not-eligible',
      rank: 0, totalEligible: 0,
      combinedScore: 0, prsScore: 0, skillMatchPercent: 0, githubScore: 0,
      reasons, suggestions,
    };
  }

  // Step 2: rank all eligible students by combined score
  const isInterested = company.requirementType === 'interested';
  const accepted = company.acceptedStudents ?? [];
  const eligibleStudents = allStudents.filter(s => {
    const eligible = checkEligibility(s, company).eligible;
    if (isInterested) return eligible && accepted.includes(s.id);
    return eligible;
  });
  const ranked = eligibleStudents
    .map(s => ({ id: s.id, ...computeDriveScore(s, company) }))
    .sort((a, b) => b.score - a.score);

  const myRankIdx = ranked.findIndex(r => r.id === student.id);
  const rank = myRankIdx + 1;
  const myScores = ranked[myRankIdx] ?? computeDriveScore(student, company);

  // A student is "selected" ONLY when the admin has explicitly accepted them.
  const selected = adminAccepted;

  const selectN = company.selectCount ?? 0;
  const suggestions = selected ? [] : buildSuggestions(student, company, [], myScores, ranked[0]?.score ?? 0, selectN);

  return {
    status: selected ? 'selected' : 'eligible-not-selected',
    rank,
    totalEligible: eligibleStudents.length,
    combinedScore: myScores.score,
    prsScore: myScores.prsScore,
    skillMatchPercent: Math.round(myScores.skillMatchPercent),
    githubScore: myScores.githubScore,
    reasons: [],
    suggestions,
  };
}

function buildSuggestions(
  student: Student,
  company: Company,
  reasons: string[],
  scores?: { score: number; skillMatchPercent: number; githubScore: number },
  topScore?: number,
  selectN?: number
): string[] {
  const tips: string[] = [];

  // Eligibility-based suggestions
  if (reasons.some(r => r.includes('CGPA'))) {
    tips.push(`Improve your CGPA to at least ${company.minCgpa} to become eligible for this drive`);
  }
  if (reasons.some(r => r.includes('active backlog'))) {
    tips.push('Clear your active backlogs immediately to unlock eligibility');
  }
  if (reasons.some(r => r.includes('arrear history'))) {
    tips.push('This drive has a zero-arrear-history policy — focus on other eligible drives');
  }

  // Ranking-based suggestions (when eligible but not selected)
  if (scores && topScore !== undefined && selectN) {
    const gap = topScore - scores.score;
    if (gap > 0) tips.push(`You need ~${Math.ceil(gap)} more points to reach the top ${selectN} shortlist`);
  }

  const missingRequired = company.requiredSkills.filter(
    rs => !student.skills.some(ss => ss.toLowerCase() === rs.toLowerCase())
  );
  if (missingRequired.length > 0) {
    tips.push(`Add these missing required skills to your profile: ${missingRequired.slice(0, 3).join(', ')}`);
    tips.push(`Build GitHub projects using ${missingRequired[0]} to boost your GitHub score`);
  }

  const prs = computePRS(student);
  if (prs.resumeStrength < 60) {
    tips.push('Upload/update your resume — AI analysis will add up to 15 pts to your PRS score');
  }
  if (prs.leetcode < 50) {
    tips.push('Solve more LeetCode problems (aim for 100+) to improve your coding score');
  }
  if ((student.validatedProjectsCount ?? 0) === 0) {
    tips.push('Push resume projects to GitHub and sync to earn GitHub validation bonus');
  }
  if (prs.certifications < 50) {
    tips.push('Earn 2+ industry certifications to strengthen your profile');
  }

  return tips.slice(0, 5);
}

export function getRecommendations(student: Student, company: Company) {
  const recommendations = [];

  const missingSkills = company.requiredSkills.filter(rs =>
    !student.skills.some(ss => ss.toLowerCase() === rs.toLowerCase())
  );

  if (missingSkills.length > 0) {
    recommendations.push(`Learn ${missingSkills[0]} to increase match by approx. ${Math.round(30 / company.requiredSkills.length)}%`);
  }

  if (student.activeBacklogs > 0) {
    recommendations.push("Clear active backlogs to unlock premium eligibility");
  }

  if (student.certifications < 2) {
    recommendations.push("Add expert certifications to boost profile credibility");
  }

  return recommendations;
}
