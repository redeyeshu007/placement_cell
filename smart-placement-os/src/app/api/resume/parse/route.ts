import { NextRequest, NextResponse } from 'next/server';

// Common technical skills to detect in resume text. Match is case-insensitive,
// word-boundary aware so "go" doesn't match inside "goggle".
const SKILL_DICTIONARY = [
  // Languages
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'C', 'Go', 'Rust',
  'Kotlin', 'Swift', 'Ruby', 'PHP', 'Scala', 'Dart', 'R', 'MATLAB',
  // Web / frontend
  'React', 'Next.js', 'Vue', 'Angular', 'Svelte', 'HTML', 'CSS', 'Tailwind',
  'Bootstrap', 'jQuery', 'Redux', 'GraphQL',
  // Backend / runtimes
  'Node.js', 'Express', 'Django', 'Flask', 'FastAPI', 'Spring', 'Spring Boot',
  '.NET', 'Laravel', 'Rails',
  // Mobile
  'React Native', 'Flutter', 'Android', 'iOS',
  // Databases
  'MongoDB', 'PostgreSQL', 'MySQL', 'SQLite', 'Redis', 'Cassandra', 'DynamoDB',
  'Firebase', 'Supabase', 'SQL', 'NoSQL',
  // Cloud / DevOps
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'Terraform',
  'Ansible', 'CI/CD', 'Linux', 'Bash',
  // Data / ML
  'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Keras',
  'Scikit-learn', 'Pandas', 'NumPy', 'OpenCV', 'NLP', 'Computer Vision',
  'Data Science', 'Power BI', 'Tableau',
  // Tools
  'Git', 'GitHub', 'GitLab', 'Jira', 'Figma', 'Postman', 'VS Code',
];

function extractSkills(text: string): string[] {
  const found = new Set<string>();
  for (const skill of SKILL_DICTIONARY) {
    // Escape regex specials in skill name
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(^|[^A-Za-z0-9_])${escaped}([^A-Za-z0-9_]|$)`, 'i');
    if (re.test(text)) found.add(skill);
  }
  return [...found];
}

function extractProjects(text: string): string[] {
  // Find a "Projects" section; capture lines until the next major section header.
  const SECTION_TERMS = [
    'experience', 'education', 'skills', 'certifications', 'achievements',
    'awards', 'publications', 'interests', 'languages', 'references',
  ];
  const lines = text.split(/\r?\n/);
  const idx = lines.findIndex(l => /^\s*projects?\s*$/i.test(l) || /^\s*projects?\s*[:\-]/i.test(l));
  if (idx === -1) return [];

  const projects: string[] = [];
  let current = '';
  const flush = () => {
    const trimmed = current.trim();
    if (trimmed.length >= 6 && trimmed.length <= 200) projects.push(trimmed);
    current = '';
  };

  for (let i = idx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) { flush(); continue; }
    // Stop at next section header
    if (SECTION_TERMS.some(t => new RegExp(`^\\s*${t}\\s*[:\\-]?\\s*$`, 'i').test(line))) break;
    // Bullet or new project entry
    if (/^[•\-\*•]\s+/.test(line) || /^[A-Z][^a-z]{2,}/.test(line)) {
      flush();
      current = line.replace(/^[•\-\*•]\s+/, '');
    } else {
      current = current ? `${current} ${line}` : line;
    }
    if (projects.length >= 12) break;
  }
  flush();
  return projects.slice(0, 10);
}

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

    const skills = extractSkills(rawText);
    const projects = extractProjects(rawText);

    return NextResponse.json({ skills, projects, rawText });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Failed to parse PDF' },
      { status: 500 }
    );
  }
}
