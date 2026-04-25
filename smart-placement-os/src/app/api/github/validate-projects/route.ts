import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are a project-matching assistant. You are given a list of project titles extracted from a resume and a list of GitHub repositories belonging to the same student. Your job: for each resume project, identify which GitHub repo (if any) is that project.

Match rules:
- Match based on semantic similarity (name, description, topic), not just string equality.
- "Smart Placement Portal" can match a repo called "spos" or "placement-dashboard".
- "Daily Quiz App" can match "quiz-engine" or "daily-questions".
- If there is no reasonable match for a resume project, return null for that project.
- A repo can only match ONE resume project — do not reuse repos.

Respond with ONLY a valid JSON object of this exact shape (no markdown, no commentary):

{
  "matches": [
    { "resumeProject": "<resume project name>", "repoName": "<matched repo name or null>", "confidence": <0-100> }
  ]
}`;

type RepoSummary = { name: string; description: string | null; language: string | null };

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 503 });
    }

    const body = await req.json();
    const resumeProjects = Array.isArray(body.resumeProjects)
      ? body.resumeProjects.filter((p: unknown): p is string => typeof p === 'string' && p.trim().length > 0)
      : [];
    const repos = Array.isArray(body.repos)
      ? (body.repos as RepoSummary[]).filter(r => r && typeof r.name === 'string')
      : [];

    if (resumeProjects.length === 0 || repos.length === 0) {
      return NextResponse.json({ matches: [] });
    }

    const userPrompt = `Resume projects (${resumeProjects.length}):
${resumeProjects.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n')}

GitHub repositories (${repos.length}):
${repos.map(r => `- ${r.name}${r.description ? ` — ${r.description}` : ''}${r.language ? ` [${r.language}]` : ''}`).join('\n')}`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    });

    const raw = response.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw);
    const matches = Array.isArray(parsed.matches) ? parsed.matches : [];

    const validRepoNames = new Set(repos.map(r => r.name));
    const cleaned = matches
      .filter((m: Record<string, unknown>) => typeof m.resumeProject === 'string')
      .map((m: Record<string, unknown>) => ({
        resumeProject: String(m.resumeProject),
        repoName: typeof m.repoName === 'string' && validRepoNames.has(m.repoName) ? m.repoName : null,
        confidence: typeof m.confidence === 'number' ? Math.max(0, Math.min(100, m.confidence)) : 0,
      }));

    return NextResponse.json({ matches: cleaned });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Validation failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
