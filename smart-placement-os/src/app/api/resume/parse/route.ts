import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are an expert technical recruiter and resume parser.
Extract the technical skills and project names from the provided resume text.
Return ONLY a valid JSON object with the following structure:
{
  "skills": ["skill1", "skill2"],
  "projects": ["Project Title 1", "Project Title 2"]
}
For skills, list all technical skills, programming languages, frameworks, databases, tools, and cloud platforms.
For projects, extract only the names/titles of the key projects mentioned (do not include descriptions or bullet points). Limit to a maximum of 8 projects.`;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 503 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    // Lazy import — pdf-parse loads pdfjs which references DOM globals at module load
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data });
    const result = await parser.getText();
    await parser.destroy();
    const rawText = (result.text ?? '').trim();

    if (!rawText) {
      return NextResponse.json({ error: 'Could not extract text from PDF' }, { status: 422 });
    }

    // Truncate text to stay within token limits
    const truncated = rawText.slice(0, 4000);

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Resume text:\n\n${truncated}` },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const raw = response.choices[0]?.message?.content ?? '{}';
    let analysis: { skills?: string[]; projects?: string[] };
    try {
      analysis = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: 'OpenAI returned invalid JSON' }, { status: 500 });
    }

    const skills = Array.isArray(analysis.skills) ? analysis.skills : [];
    const projects = Array.isArray(analysis.projects) ? analysis.projects : [];

    return NextResponse.json({ skills, projects, rawText });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Failed to parse PDF' },
      { status: 500 }
    );
  }
}
