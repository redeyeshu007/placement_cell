/**
 * MONGODB API INTEGRATION
 */

export async function fetchFromGAS(action: string, payload: Record<string, unknown> = {}) {
  try {
    let endpoint = '';
    if (action === 'getStudents') endpoint = '/api/students';
    else if (action === 'getCompanies') endpoint = '/api/companies';
    else if (action === 'apply') {
      console.log("Application submitted:", payload);
      return { success: true };
    } else {
      throw new Error(`Unknown action: ${action}`);
    }

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) throw new Error(`API reported ${response.status}`);
    const data = await response.json();
    if (action === 'getCompanies' && Array.isArray(data)) {
      // Deduplicate by id to remove any duplicates from multiple fetches
      return data.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
    }
    return data;
  } catch (error) {
    console.error("Database Fetch Error:", error);
    return [];
  }
}

export async function createCompany(data: {
  name: string;
  role: string;
  salary: string;
  requirementType: 'open' | 'skill-based' | 'interested';
  requiredSkills: string[];
  prioritySkills: string[];
  minCgpa: number;
  allowedBacklogs: number;
  noHistoryOfArrears: boolean;
  selectCount: number;
  min10thPercent?: number;
  min12thPercent?: number;
}) {
  const response = await fetch('/api/companies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Create failed: ${response.status}`);
  }
  return await response.json();
}

export async function deleteCompany(id: string) {
  const response = await fetch(`/api/companies/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error(`Deletion failed: ${response.status}`);
  return await response.json();
}

export async function submitApplication(
  studentId: string, studentName: string,
  companyId: string, companyName: string
) {
  return fetchFromGAS('apply', { studentId, studentName, companyId, companyName });
}

export async function updateStudent(
  studentId: string,
  data: Partial<{
    skills: string[];
    hackathons: number;
    certifications: number;
    leetcodeUsername: string;
    leetcodeSolved: number;
    resumeProjects: string[];
    validatedProjectsCount: number;
    resume_link: string;
    githubLink: string;
    resumeStrengthScore: number;
    resumeStrengthLevel: string;
    resumeExperienceScore: number;
    resumeExperienceLevel: string;
    resumeExperienceSummary: string;
    resumeRawText: string;
    quizBonusScore: number;
    lastQuizDate: string;
  }>
) {
  const response = await fetch(`/api/students/${encodeURIComponent(studentId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`Update failed: ${response.status}`);
  return await response.json();
}

export async function analyzeResume(rawText: string, studentId: string) {
  const response = await fetch('/api/resume/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rawText, studentId }),
  });
  if (!response.ok) throw new Error(`Analysis failed: ${response.status}`);
  return await response.json() as {
    strengthScore: number;
    strengthLevel: string;
    experienceScore: number;
    experienceLevel: string;
    experienceSummary: string;
    hasInternship: boolean;
    projectQualityScore: number;
    hackathonsCount: number;
  };
}
