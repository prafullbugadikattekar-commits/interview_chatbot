import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// IntervueAI API Route — /api/interview
// General-purpose AI Mock Interviewer for ANY role or topic.
// Backed by Groq (llama-3.3-70b-versatile), Gemini, or offline realistic engine.
// ============================================================================

interface QuestionItem {
  id: number;
  questionText: string;
  topic: string;
}

interface EvaluationResult {
  evaluation: {
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  };
  nextQuestion: QuestionItem | null;
}

// ─── System prompt for AI Interviewer ────────────────────────────────────────
function getSystemPrompt(role: string, level: string, isFinal: boolean) {
  return `You are a professional, realistic Senior Technical & Behavioral Interviewer at a top tier tech company conducting a mock interview for the role of "${role}" at the "${level}" experience level.

Your goal:
1. Conduct a rigorous, natural conversation like an expert human interviewer.
2. Evaluate the candidate's answer fairly and objectively:
   - If the candidate's response is accurate, well-reasoned, and demonstrates clear understanding, award a 9.0 or 10.0. Do NOT artificially cap scores at 7 or 8.
   - If the answer has minor inaccuracies or omissions, score between 6.5 and 8.5.
   - If the answer is vague or incorrect, score between 3.0 and 6.0 with constructive guidance.
3. Provide 1 to 2 sentences of realistic, spoken feedback.
4. If this is NOT the final question, provide the next logical interview question that naturally follows up on what was discussed or tests another critical domain for the "${role}" position.
5. If this is the final question (${isFinal}), set nextQuestion to null.

CRITICAL: Return ONLY a valid JSON object matching this exact schema. No markdown wrapping, no code fences, no introductory text:
{
  "evaluation": {
    "score": <number between 0.0 and 10.0>,
    "feedback": "<1-2 sentences of realistic feedback from the interviewer>",
    "strengths": ["<strength 1>", "<strength 2>"],
    "improvements": ["<actionable improvement 1>"]
  },
  "nextQuestion": ${isFinal ? 'null' : `{
    "id": <number>,
    "questionText": "<the next realistic interview question>",
    "topic": "<brief topic or category>"
  }`}
}`;
}

// ─── Question Banks for Offline Fallback (Comprehensive for all roles) ──────
const ROLE_QUESTION_BANKS: Record<string, QuestionItem[]> = {
  'Software Engineer (DSA)': [
    {
      id: 1,
      topic: 'Data Structures & Complexity',
      questionText: 'Can you explain the difference between an Array and a Linked List in memory? When would you prefer a Doubly Linked List over a dynamic array like std::vector or ArrayList, considering CPU cache locality and time complexities?',
    },
    {
      id: 2,
      topic: 'Algorithms (Sorting & Searching)',
      questionText: 'How would you find the k-th largest element in an unsorted stream of numbers in real time? Compare the time and space complexity of using a Min-Heap versus the Quickselect algorithm.',
    },
    {
      id: 3,
      topic: 'Dynamic Programming & Graph Traversal',
      questionText: 'Explain how you approach solving the Shortest Path problem in a weighted graph. When would you use Dijkstra’s algorithm versus Bellman-Ford, and how does Dijkstra behave with negative weights?',
    },
    {
      id: 4,
      topic: 'Hash Maps & Collision Resolution',
      questionText: 'How does a Hash Map handle collisions under the hood? Contrast separate chaining with open addressing (linear probing), and explain how load factor triggers rehashing.',
    },
    {
      id: 5,
      topic: 'Trees & Balanced BSTs',
      questionText: 'What is the purpose of self-balancing Binary Search Trees like AVL or Red-Black trees? What guarantees do they provide for search, insertion, and deletion times in the worst case?',
    },
  ],
  'Full-Stack Web Developer': [
    {
      id: 1,
      topic: 'Frontend Architecture & Rendering',
      questionText: 'Can you explain the key differences between Server-Side Rendering (SSR), Static Site Generation (SSG), and Client-Side Rendering (CSR)? In what scenarios would you choose SSR over SSG?',
    },
    {
      id: 2,
      topic: 'State Management & Asynchrony',
      questionText: 'How does the JavaScript Event Loop work with the Call Stack, Microtask Queue (Promises), and Macrotask Queue (setTimeout)? What common bugs happen when developers misunderstand microtasks?',
    },
    {
      id: 3,
      topic: 'Backend & API Architecture',
      questionText: 'When designing a RESTful API, how do you handle idempotency for payment or checkout endpoints? How would you implement rate limiting to protect your endpoints from abuse?',
    },
    {
      id: 4,
      topic: 'Database & Data Modeling',
      questionText: 'How do you decide between a relational database (like PostgreSQL) and a NoSQL document database (like MongoDB) for a new production application? What role does indexing play in query performance?',
    },
    {
      id: 5,
      topic: 'Security & Optimization',
      questionText: 'What are the main security vulnerabilities in modern web apps (such as CSRF, XSS, and SQL Injection), and what defense-in-depth measures do you put in place to mitigate them?',
    },
  ],
  'Data Science & AI': [
    {
      id: 1,
      topic: 'Machine Learning Fundamentals',
      questionText: 'Explain the bias-variance tradeoff. How do techniques like regularization (L1 Lasso vs. L2 Ridge) and ensemble methods (Random Forest vs. Gradient Boosting) address bias and variance?',
    },
    {
      id: 2,
      topic: 'Evaluation Metrics & Validation',
      questionText: 'In a heavily imbalanced classification problem (e.g., fraud detection with 99.8% negative cases), why is accuracy misleading? Which metrics would you monitor and why (Precision, Recall, PR-AUC, F1)?',
    },
    {
      id: 3,
      topic: 'Deep Learning & Transformers',
      questionText: 'How does the Multi-Head Self-Attention mechanism in Transformer architectures work? Why did Transformers replace recurrent networks (LSTMs/GRUs) for natural language and sequence tasks?',
    },
    {
      id: 4,
      topic: 'Generative AI & LLMs',
      questionText: 'What is Retrieval-Augmented Generation (RAG), and how does it compare to parameter fine-tuning (LoRA)? How do you mitigate hallucinations in production LLM pipelines?',
    },
    {
      id: 5,
      topic: 'Model Deployment & MLOps',
      questionText: 'How do you detect and handle data drift and concept drift once an ML model is deployed to production? Walk me through your monitoring and retraining strategy.',
    },
  ],
  'Python / Java / C++': [
    {
      id: 1,
      topic: 'Core OOP & Memory Management',
      questionText: 'Compare how memory allocation and garbage collection/deallocation work in Python, Java, and C++. What are the trade-offs of manual memory management (RAII/pointers) versus automated generational garbage collection?',
    },
    {
      id: 2,
      topic: 'Polymorphism & Dynamic Dispatch',
      questionText: 'Explain how runtime polymorphism is implemented under the hood in C++ (vtable and vptr) versus Java (virtual method table) and Python (dynamic duck typing). What is the performance overhead?',
    },
    {
      id: 3,
      topic: 'Concurrency & Thread Safety',
      questionText: 'How do Python (with its GIL), Java (with JVM threads and synchronized blocks), and C++ (with std::thread, std::mutex, and atomic operations) handle multi-threaded concurrency?',
    },
    {
      id: 4,
      topic: 'Exception Handling & Resource Safety',
      questionText: 'How do you ensure exception safety and avoid resource leaks? Compare RAII in C++ with try-with-resources in Java and context managers (with statements) in Python.',
    },
    {
      id: 5,
      topic: 'Modern Idioms & Design Patterns',
      questionText: 'Explain how you would implement the Factory or Strategy design pattern in your primary language. When is composition preferred over inheritance in software architecture?',
    },
  ],
  'System Design': [
    {
      id: 1,
      topic: 'Horizontal Scaling & Load Balancing',
      questionText: 'How would you design a load-balancing layer for an application receiving 100,000 requests per second? Explain consistent hashing and how it prevents cache stampedes when adding or removing backend nodes.',
    },
    {
      id: 2,
      topic: 'Database Sharding & Replication',
      questionText: 'Explain the difference between vertical scaling and horizontal database sharding. How do you choose a shard key, and how does the CAP theorem guide your consistency versus availability trade-offs?',
    },
    {
      id: 3,
      topic: 'Caching Strategies',
      questionText: 'Walk me through a distributed caching strategy (e.g., Redis / Memcached). What are the differences between Cache-Aside, Write-Through, and Write-Behind? How do you prevent cache penetration and cache avalanches?',
    },
    {
      id: 4,
      topic: 'Asynchronous Processing & Message Queues',
      questionText: 'Why are distributed message brokers like Apache Kafka or RabbitMQ essential in microservices? How do you achieve at-least-once versus exactly-once message delivery semantics?',
    },
    {
      id: 5,
      topic: 'High Availability & Resiliency',
      questionText: 'How do circuit breaker patterns, exponential backoff with jitter, and dead-letter queues make large distributed systems resilient against cascading network failures?',
    },
  ],
  'HR & Behavioral': [
    {
      id: 1,
      topic: 'Conflict Resolution (STAR Method)',
      questionText: 'Tell me about a time you had a strong technical disagreement with a team member or manager. How did you handle the situation, what was your approach to finding common ground, and what was the outcome?',
    },
    {
      id: 2,
      topic: 'Tight Deadlines & Prioritization',
      questionText: 'Describe a situation where a critical project deadline was at risk due to scope creep or unforeseen technical roadblocks. How did you prioritize tasks and communicate expectations to stakeholders?',
    },
    {
      id: 3,
      topic: 'Handling Failure & Learning',
      questionText: 'Can you share an instance where you pushed a bug to production or made a design choice that failed? How did you respond in the moment, what did you learn, and what steps did you take to prevent it from happening again?',
    },
    {
      id: 4,
      topic: 'Mentorship & Collaboration',
      questionText: 'How do you approach code reviews and onboarding junior engineers? Give an example of how you provided critical feedback while maintaining a supportive, positive team culture.',
    },
    {
      id: 5,
      topic: 'Career Motivation & Ambition',
      questionText: 'Why are you interested in this specific role and domain? Where do you see your engineering leadership or technical expertise growing over the next 2 to 3 years?',
    },
  ],
};

// ─── Generic Question Generator for Custom Roles ───────────────────────────
function getQuestionsForRole(role: string): QuestionItem[] {
  // Check exact or partial matches
  for (const [key, questions] of Object.entries(ROLE_QUESTION_BANKS)) {
    if (role.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(role.toLowerCase())) {
      return questions;
    }
  }

  // If custom role, generate realistic questions
  return [
    {
      id: 1,
      topic: `${role} Fundamentals`,
      questionText: `Walk me through your background and core technical experience with ${role}. What are the most important tools, methodologies, or architectural standards you use daily?`,
    },
    {
      id: 2,
      topic: 'Problem Solving & Deep Dive',
      questionText: `What is the most technically challenging problem you have encountered in your work as a ${role}? Walk me through your step-by-step diagnostic process and the final solution.`,
    },
    {
      id: 3,
      topic: 'Best Practices & Optimization',
      questionText: `When building high-quality systems in ${role}, how do you ensure code readability, testing coverage, and performance scalability? What metrics or benchmarks do you rely on?`,
    },
    {
      id: 4,
      topic: 'Edge Cases & Troubleshooting',
      questionText: `How do you handle production incidents, race conditions, or unexpected system bottlenecks specific to ${role}? Describe a scenario where you had to debug an elusive issue under pressure.`,
    },
    {
      id: 5,
      topic: 'Industry Standards & Future Trends',
      questionText: `How do you stay current with evolving standards and emerging technologies in ${role}? What recent tool or library have you adopted that significantly improved your workflow?`,
    },
  ];
}

// ─── Realistic Fallback Evaluation Engine (Grades up to 10/10) ───────────────
function evaluateFallbackAnswer(
  answer: string,
  currentQuestion: QuestionItem,
  questionNumber: number,
  maxQuestions: number,
  role: string
): EvaluationResult {
  const trimmed = answer.trim();
  const lower = trimmed.toLowerCase();
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;

  let score = 5.0;
  const strengths: string[] = [];
  const improvements: string[] = [];

  // Depth assessment
  if (wordCount >= 100) {
    score += 2.5;
    strengths.push('Comprehensive, detailed explanation demonstrating deep subject knowledge');
  } else if (wordCount >= 50) {
    score += 1.8;
    strengths.push('Clear, structured answer covering the key concepts');
  } else if (wordCount >= 25) {
    score += 1.0;
    strengths.push('Directly addressed the question');
  } else {
    improvements.push('Answer is somewhat brief; elaborate with concrete examples and tradeoffs');
  }

  // Technical keywords analysis across roles
  const keyTerms = [
    'complexity', 'tradeoff', 'trade-off', 'performance', 'memory', 'latency',
    'scalability', 'cache', 'database', 'algorithm', 'concurrency', 'asynchronous',
    'interface', 'architecture', 'optimization', 'production', 'testing', 'security',
    'star', 'result', 'situation', 'task', 'action', 'outcome', 'metrics', 'error'
  ];

  let matches = 0;
  for (const term of keyTerms) {
    if (lower.includes(term)) matches++;
  }

  if (matches >= 4) {
    score += 2.0;
    strengths.push('Excellent use of industry-standard terminology and engineering considerations');
  } else if (matches >= 2) {
    score += 1.2;
    strengths.push('Good technical grounding and problem analysis');
  }

  // Bonus for structured reasoning (bullet points, numbered lists, code examples)
  if (trimmed.includes('1.') || trimmed.includes('- ') || trimmed.includes('for example') || trimmed.includes('whereas')) {
    score += 0.8;
    strengths.push('Well-structured comparison highlighting trade-offs');
  }

  // Ensure score is properly rounded and capped between 3.0 and 10.0
  score = Math.min(10.0, Math.max(3.5, Math.round(score * 10) / 10));

  // If score is high (9.0+), ensure feedback reflects excellence
  let feedback = '';
  if (score >= 9.0) {
    feedback = 'Outstanding response! You demonstrated thorough domain mastery, articulated clear trade-offs, and structured your answer like a senior professional.';
  } else if (score >= 7.5) {
    feedback = 'Strong answer with solid technical grounding. You covered the core principles effectively.';
  } else if (score >= 6.0) {
    feedback = 'Good initial thoughts. Consider expanding on real-world constraints, edge cases, and performance implications.';
  } else {
    feedback = 'Fair attempt. Make sure to provide concrete technical details and walk through your reasoning step by step.';
  }

  if (strengths.length === 0) {
    strengths.push('Addressed the prompt directly');
  }
  if (improvements.length === 0) {
    improvements.push('Consider mentioning edge cases and monitoring metrics');
  }

  // Next question logic
  let nextQuestion: QuestionItem | null = null;
  const isEndless = maxQuestions === -1;
  const hasMoreRounds = isEndless || questionNumber < maxQuestions;

  if (hasMoreRounds) {
    const bank = getQuestionsForRole(role);
    const nextIdx = questionNumber % bank.length;
    const baseQ = bank[nextIdx];
    nextQuestion = {
      id: questionNumber + 1,
      topic: baseQ.topic,
      questionText: baseQ.questionText,
    };
  }

  return {
    evaluation: {
      score,
      feedback,
      strengths,
      improvements,
    },
    nextQuestion,
  };
}

// ============================================================================
// Helper: AI Opening Question Generator (using .env API keys)
// ============================================================================

async function generateInitialQuestion(
  role: string,
  level: string,
  groqKey: string,
  geminiKey: string
): Promise<QuestionItem | null> {
  const prompt = `You are a professional, realistic Senior Technical & Behavioral Interviewer at a top-tier tech company conducting a mock interview for the role of "${role}" at the "${level}" experience level.
Generate the FIRST opening interview question. It should test core domain fundamentals, architecture, or coding concepts appropriate for this seniority.
CRITICAL: Return ONLY a valid JSON object with this exact format:
{
  "id": 1,
  "topic": "<1-3 words topic, e.g. Core Architecture, Data Structures, System Design>",
  "questionText": "<the opening question>"
}`;

  // 1. Try Groq Cloud API (.env)
  if (groqKey && (groqKey.startsWith('gsk_') || groqKey.length > 10)) {
    for (const model of ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant']) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          signal: AbortSignal.timeout(3500),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.6,
            max_tokens: 500,
            response_format: { type: 'json_object' },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content);
            if (parsed?.questionText) {
              return {
                id: 1,
                topic: parsed.topic || `${role} Fundamentals`,
                questionText: parsed.questionText,
              };
            }
          }
        }
      } catch (err) {
        console.warn(`Groq (${model}) initial question error:`, err);
      }
    }
  }

  // 2. Try Gemini API (.env)
  if (geminiKey && geminiKey.length > 5) {
    for (const model of ['gemini-2.0-flash', 'gemini-1.5-flash']) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          signal: AbortSignal.timeout(3500),
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.6,
              maxOutputTokens: 500,
              responseMimeType: 'application/json',
            },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const parsed = JSON.parse(cleaned);
            if (parsed?.questionText) {
              return {
                id: 1,
                topic: parsed.topic || `${role} Fundamentals`,
                questionText: parsed.questionText,
              };
            }
          }
        }
      } catch (err) {
        console.warn(`Gemini (${model}) initial question error:`, err);
      }
    }
  }

  return null;
}

// ============================================================================
// API Handlers: GET (Open initial question) & POST (Evaluate & Continue)
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'Software Engineer (DSA)';
    const level = searchParams.get('level') || 'Mid-Level';

    // Read API keys from server environment (.env)
    const groqKey = (process.env.GROQ_API_KEY || '').trim();
    const geminiKey = (process.env.GEMINI_API_KEY || '').trim();

    // Dynamically generate opening question using .env key if available
    let aiQuestion: QuestionItem | null = null;
    try {
      aiQuestion = await generateInitialQuestion(role, level, groqKey, geminiKey);
    } catch (err) {
      console.warn('AI question generation failed, using fallback:', err);
    }

    const bank = getQuestionsForRole(role);
    const initialQuestion = aiQuestion || bank[0] || {
      id: 1,
      topic: 'Introduction & Technical Overview',
      questionText: `Welcome to your mock interview for the ${role} (${level}) position. Could you introduce yourself and walk me through your technical background and key projects?`,
    };

    return NextResponse.json({
      question: initialQuestion,
      totalQuestions: bank.length,
      role,
      level,
    });
  } catch (error) {
    console.error('GET /api/interview error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize interview session' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      answer = '',
      currentQuestion,
      questionNumber = 1,
      maxQuestions = 5,
      role = 'Software Engineer (DSA)',
      level = 'Mid-Level',
      conversationHistory = [],
    } = body;

    const isEndless = maxQuestions === -1;
    const isFinal = !isEndless && questionNumber >= maxQuestions;

    // Use API keys directly from server environment (.env)
    const groqKey = (process.env.GROQ_API_KEY || '').trim();
    const geminiKey = (process.env.GEMINI_API_KEY || '').trim();

    // ─── 1. Try Groq (llama-3.3-70b-versatile, fallback llama-3.1-8b-instant) ──
    if (groqKey && (groqKey.startsWith('gsk_') || groqKey.length > 10)) {
      const groqModels = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
      for (const groqModel of groqModels) {
        try {
          const sysPrompt = getSystemPrompt(role, level, isFinal);
          const messages = [
            { role: 'system' as const, content: sysPrompt },
            ...conversationHistory.map((msg: { role: string; content: string }) => ({
              role: msg.role === 'candidate' || msg.role === 'user' ? ('user' as const) : ('assistant' as const),
              content: msg.content,
            })),
            {
              role: 'user' as const,
              content: `INTERVIEW CONTEXT:
- Role: ${role}
- Experience Level: ${level}
- Question ${questionNumber} of ${isEndless ? 'Endless' : maxQuestions}
- Current Question: "${currentQuestion?.questionText || 'Technical Question'}"

CANDIDATE'S ANSWER:
"${answer}"

Evaluate this answer now. If it is high quality and accurate, award 9.0 to 10.0. Provide realistic feedback and ${isFinal ? 'set nextQuestion to null' : 'provide the next relevant interview question'}. Respond in valid JSON only.`,
            },
          ];

          const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            signal: AbortSignal.timeout(6000),
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${groqKey}`,
            },
            body: JSON.stringify({
              model: groqModel,
              messages,
              temperature: 0.6,
              max_tokens: 1500,
              response_format: { type: 'json_object' },
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const content = data.choices?.[0]?.message?.content;
            if (content) {
              const parsed = JSON.parse(content) as EvaluationResult;
              if (parsed.evaluation && typeof parsed.evaluation.score === 'number') {
                return NextResponse.json(parsed);
              }
            }
          }
        } catch (err) {
          console.warn(`Groq (${groqModel}) evaluation failed:`, err);
        }
      }
    }

    // ─── 2. Try Gemini API (gemini-2.0-flash, fallback gemini-1.5-flash) ────────
    if (geminiKey && geminiKey.length > 5) {
      const geminiModels = ['gemini-2.0-flash', 'gemini-1.5-flash'];
      for (const gemModel of geminiModels) {
        try {
          const prompt = `${getSystemPrompt(role, level, isFinal)}

INTERVIEW CONTEXT:
- Role: ${role}
- Experience Level: ${level}
- Question ${questionNumber} of ${isEndless ? 'Endless' : maxQuestions}
- Current Question: "${currentQuestion?.questionText || 'Technical Question'}"

CANDIDATE'S ANSWER:
"${answer}"

Evaluate this answer. Return ONLY valid JSON matching the schema.`;

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${gemModel}:generateContent?key=${geminiKey}`,
            {
              method: 'POST',
              signal: AbortSignal.timeout(6000),
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  temperature: 0.6,
                  maxOutputTokens: 1500,
                  responseMimeType: 'application/json',
                },
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
              const parsed = JSON.parse(cleaned) as EvaluationResult;
              if (parsed.evaluation && typeof parsed.evaluation.score === 'number') {
                return NextResponse.json(parsed);
              }
            }
          }
        } catch (err) {
          console.warn(`Gemini (${gemModel}) evaluation failed:`, err);
        }
      }
    }

    // ─── 3. Offline Fallback Evaluation ─────────────────────────────────────
    const result = evaluateFallbackAnswer(
      answer,
      currentQuestion || { id: questionNumber, questionText: 'Technical Question', topic: 'Core Concepts' },
      questionNumber,
      maxQuestions,
      role
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Interview API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
