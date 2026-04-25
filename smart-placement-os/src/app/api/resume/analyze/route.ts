import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are an expert technical recruiter and resume evaluator for engineering college placements.
Analyze the given resume text and respond with ONLY a valid JSON object — no markdown, no explanation.

The JSON must have exactly these fields:
{
  "strengthScore": <integer 0-100>,
  "strengthLevel": <"Weak" | "Moderate" | "Strong" | "Excellent">,
  "experienceScore": <integer 0-100>,
  "experienceLevel": <"Fresher" | "Intern" | "Part-time" | "1yr+" | "2yr+">,
  "experienceSummary": <string, 1-2 sentences summarizing work/intern experience>,
  "hasInternship": <boolean>,
  "projectQualityScore": <integer 0-100>,
  "hackathonsCount": <integer 0-20>
}

Scoring guide:
- strengthScore: judge formatting, content depth, keyword density, action verbs, quantified impact, ATS readiness — this is the ATS score
- experienceScore: 0=no experience, 20=coursework projects only, 40=internship <3mo, 60=internship 3-6mo, 80=1yr work, 100=2yr+ work
- projectQualityScore: judge complexity, tech stack depth, real-world relevance, GitHub/deployed links present
- hackathonsCount: count distinct hackathons, coding contests, or competitions the candidate participated in (e.g. Smart India Hackathon, Hackverse, Code Gladiators). 0 if none mentioned.`;

export async function POST(req: NextRequest) {
  try {
    const { rawText, studentId } = await req.json();
    if (!rawText || typeof rawText !== 'string') {
      return NextResponse.json({ error: 'rawText required' }, { status: 400 });
    }
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 503 });
    }

    // Truncate to ~3000 chars to stay within token budget
    const truncated = rawText.slice(0, 3000);

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Resume text:\n\n${truncated}` },
      ],
      temperature: 0.2,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    });

    const raw = response.choices[0]?.message?.content ?? '{}';
    let analysis: Record<string, any>;
    try {
      analysis = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: 'OpenAI returned invalid JSON' }, { status: 500 });
    }

    // Validate and clamp numeric fields
    const result = {
      strengthScore:      clamp(Number(analysis.strengthScore ?? 50), 0, 100),
      strengthLevel:      String(analysis.strengthLevel ?? 'Moderate'),
      experienceScore:    clamp(Number(analysis.experienceScore ?? 0), 0, 100),
      experienceLevel:    String(analysis.experienceLevel ?? 'Fresher'),
      experienceSummary:  String(analysis.experienceSummary ?? 'No prior experience detected.'),
      hasInternship:      Boolean(analysis.hasInternship ?? false),
      projectQualityScore: clamp(Number(analysis.projectQualityScore ?? 40), 0, 100),
      hackathonsCount:    clamp(Number(analysis.hackathonsCount ?? 0), 0, 20),
    };

    // Optionally persist to DB if studentId provided
    if (studentId) {
      try {
        await fetch(`${req.nextUrl.origin}/api/students/${encodeURIComponent(studentId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resumeStrengthScore: result.strengthScore,
            resumeStrengthLevel: result.strengthLevel,
            resumeExperienceScore: result.experienceScore,
            resumeExperienceLevel: result.experienceLevel,
            resumeExperienceSummary: result.experienceSummary,
            hackathons: result.hackathonsCount,
          }),
        });
      } catch { /* non-fatal */ }
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Analysis failed' }, { status: 500 });
  }
}

function clamp(n: number, min: number, max: number) {
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
}
