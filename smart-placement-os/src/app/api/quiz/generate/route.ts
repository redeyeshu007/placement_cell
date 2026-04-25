import { NextRequest, NextResponse } from 'next/server';

interface Question {
  q: string;
  opts: string[];
  ans: number;
  exp: string;
}

const FALLBACK: Question[] = [
  { q: "What is the time complexity of binary search?", opts: ["O(n)", "O(log n)", "O(n²)", "O(1)"], ans: 1, exp: "Binary search halves the search space each step → O(log n)." },
  { q: "Which data structure follows LIFO order?", opts: ["Queue", "Stack", "Array", "Graph"], ans: 1, exp: "Stack = Last-In-First-Out. Last pushed is first popped." },
  { q: "In OOP, what is encapsulation?", opts: ["Inheriting class properties", "Bundling data and methods while restricting access", "Overriding parent methods", "Creating class instances"], ans: 1, exp: "Encapsulation binds data and methods together and hides internal state." },
  { q: "What does HTTP stand for?", opts: ["HyperText Transfer Protocol", "High Transfer Text Protocol", "HyperText Transmission Protocol", "Hybrid Transfer Technology Protocol"], ans: 0, exp: "HTTP = HyperText Transfer Protocol — the foundation of web communication." },
  { q: "Which HTTP method is used to create a new resource?", opts: ["GET", "DELETE", "POST", "PUT"], ans: 2, exp: "POST creates a new resource. GET retrieves, PUT updates, DELETE removes." },
  { q: "What is a foreign key in a relational database?", opts: ["A key that is always unique in its table", "A key that references another table's primary key", "An encrypted index", "A composite primary key"], ans: 1, exp: "A foreign key establishes a relationship by referencing another table's primary key." },
  { q: "What does the '===' operator check in JavaScript?", opts: ["Only value equality", "Both value and type equality (strict)", "Only type equality", "Memory address equality"], ans: 1, exp: "'===' is strict equality — checks both value AND type without type coercion." },
  { q: "What is a deadlock in operating systems?", opts: ["CPU overload causing a crash", "Memory exhaustion error", "Two or more processes blocked waiting on each other indefinitely", "A process that never terminates"], ans: 2, exp: "Deadlock = circular wait — processes hold resources the other needs, blocking forever." },
  { q: "Which sorting algorithm has the best average-case time complexity?", opts: ["Bubble Sort", "Selection Sort", "Quick Sort", "Insertion Sort"], ans: 2, exp: "Quick Sort averages O(n log n). Bubble and Selection Sort are O(n²)." },
  { q: "What is the purpose of a version control system like Git?", opts: ["To compile source code", "To track and manage code changes over time", "To deploy code to production", "To run automated tests"], ans: 1, exp: "VCS tracks changes, enables team collaboration, and allows reverting to previous states." },
  { q: "What does REST stand for in web APIs?", opts: ["Remote Execution State Transfer", "Representational State Transfer", "Reactive Service Technology", "Resource Endpoint Schema Template"], ans: 1, exp: "REST = Representational State Transfer — an architectural style for web services using HTTP." },
  { q: "Which data structure is best for implementing a priority queue?", opts: ["Array", "Linked List", "Heap", "Stack"], ans: 2, exp: "A Heap (min or max) provides O(log n) insert and O(1) peek — ideal for priority queues." },
  { q: "What is the difference between a process and a thread?", opts: ["No difference", "A process is heavyweight with its own memory; a thread shares memory with its process", "A thread has its own memory space", "Processes are faster than threads"], ans: 1, exp: "Processes have isolated memory; threads share the parent process's memory space (lighter weight)." },
  { q: "What does SQL JOIN do?", opts: ["Deletes rows from two tables", "Combines rows from two or more tables based on a related column", "Creates a new table", "Sorts rows across tables"], ans: 1, exp: "JOIN combines rows from multiple tables based on a matching column (foreign/primary key)." },
  { q: "In CSS, what does 'position: absolute' do?", opts: ["Positions element relative to viewport", "Positions element relative to nearest positioned ancestor", "Removes element from flow, fixed to screen", "Positions relative to parent element only"], ans: 1, exp: "position: absolute removes the element from normal flow, positioned relative to its nearest positioned ancestor." },
];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export async function POST(req: NextRequest) {
  try {
    const { skills = [] } = await req.json();

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey.includes('placeholder') || apiKey.startsWith('sk-proj-your')) {
      return NextResponse.json(shuffle(FALLBACK).slice(0, 10));
    }

    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey });

    const skillList = (skills as string[])
      .filter(Boolean)
      .slice(0, 6)
      .join(', ') || 'computer science fundamentals, data structures, algorithms';

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      max_tokens: 2500,
      messages: [{
        role: 'system',
        content: 'You are a placement interview quiz generator for engineering students. Generate relevant, accurate multiple choice questions.',
      }, {
        role: 'user',
        content: `Generate exactly 10 placement quiz questions for a student whose resume includes these skills: ${skillList}.

Return only this JSON structure:
{
  "questions": [
    {
      "q": "concise question text",
      "opts": ["Option A", "Option B", "Option C", "Option D"],
      "ans": 0,
      "exp": "brief explanation of the correct answer"
    }
  ]
}

Rules:
- "ans" is the 0-based index of the correct answer (0, 1, 2, or 3)
- All 4 options must be plausible (no obviously wrong options)
- Questions must directly test knowledge relevant to the listed skills
- Keep each question to 1–2 sentences maximum
- Mix conceptual understanding and practical application
- Difficulty: roughly 50% easy, 50% medium
- Cover different aspects of the listed skills across the 10 questions`,
      }],
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw);
    const questions: Question[] = Array.isArray(parsed.questions) ? parsed.questions : [];

    // Validate structure
    const valid = questions.filter(
      q => typeof q.q === 'string' &&
           Array.isArray(q.opts) && q.opts.length === 4 &&
           typeof q.ans === 'number' && q.ans >= 0 && q.ans <= 3
    );

    if (valid.length < 5) {
      return NextResponse.json(shuffle(FALLBACK).slice(0, 10));
    }

    return NextResponse.json(valid.slice(0, 10));
  } catch {
    return NextResponse.json(shuffle(FALLBACK).slice(0, 10));
  }
}
