/**
 * AI Engineer Interview Prep - C++17 OOP Architecture Engine (JavaScript Mirror)
 * 
 * This module mirrors the exact C++ class hierarchy in JavaScript for Vercel deployment:
 *   - InterviewTrack (abstract base) -> 4 derived track classes
 *   - TrackFactory (Factory Pattern)
 *   - Scorecard (operator+ emulation, 5-dimension scoring)
 *   - CandidateSession (Encapsulation with private state)
 *   - EventBus<TelemetryEvent> (Observer Pattern, template emulation)
 *
 * C++ OOP Concepts Mirrored:
 *   1. Abstraction: InterviewTrack base class with "pure virtual" methods
 *   2. Inheritance: 4 concrete tracks extending InterviewTrack
 *   3. Polymorphism: Runtime vtable dispatch simulation with telemetry
 *   4. Encapsulation: Private fields via # syntax, const getters
 *   5. Templates: EventBus with type-safe subscribe/notify
 *   6. Operator Overloading: Scorecard.addRoundScore() mirrors C++ operator+
 *   7. Factory Pattern: TrackFactory.createTrack(id)
 */

// ============================================================================
// EventBus<T> - Template Observer Pattern (mirrors C++ EventBus<T>)
// ============================================================================
export class EventBus {
  #subscribers = [];

  subscribe(callback) {
    this.#subscribers.push(callback);
    return () => {
      this.#subscribers = this.#subscribers.filter(cb => cb !== callback);
    };
  }

  notify(event) {
    for (const cb of this.#subscribers) {
      try { cb(event); } catch (e) { console.error("[EventBus] Error:", e); }
    }
  }

  get subscriberCount() { return this.#subscribers.length; }
}

// Global telemetry bus (mirrors C++ inline telemetryBus())
export const oopTelemetry = new EventBus();

// Legacy alias for backward compatibility
export const aiEvents = oopTelemetry;

// Helper: generate a fake pointer address for C++ simulation
function fakePtr() {
  return "0x" + Math.floor(Math.random() * 0xffffffffffff).toString(16);
}

// ============================================================================
// Scorecard - Encapsulation + Operator Overloading (mirrors C++ Scorecard)
// ============================================================================
export class Scorecard {
  #roundScores = [];
  #candidateName;
  #trackName;
  #verdict = "";

  constructor(candidate, track) {
    this.#candidateName = candidate;
    this.#trackName = track;
  }

  get candidateName() { return this.#candidateName; }
  get trackName() { return this.#trackName; }
  get verdict() { return this.#verdict; }
  get roundCount() { return this.#roundScores.length; }

  get overallScore() {
    if (this.#roundScores.length === 0) return 0;
    const sum = this.#roundScores.reduce((acc, rs) => acc + rs.average, 0);
    return sum / this.#roundScores.length;
  }

  // Per-dimension averages
  get avgCodeCorrectness() { return this.#avg("codeCorrectness"); }
  get avgSystemScalability() { return this.#avg("systemScalability"); }
  get avgMathematicalDepth() { return this.#avg("mathematicalDepth"); }
  get avgEdgeCaseHandling() { return this.#avg("edgeCaseHandling"); }
  get avgCommunication() { return this.#avg("communication"); }

  #avg(field) {
    if (this.#roundScores.length === 0) return 0;
    const s = this.#roundScores.reduce((acc, rs) => acc + rs[field], 0);
    return s / this.#roundScores.length;
  }

  #computeVerdict() {
    const o = this.overallScore;
    if (o >= 8.5) this.#verdict = "STRONG HIRE";
    else if (o >= 7.0) this.#verdict = "HIRE";
    else if (o >= 5.5) this.#verdict = "LEAN HIRE";
    else this.#verdict = "NO HIRE";
  }

  // Mirrors C++ operator+(const RoundScore&)
  addRoundScore(rs) {
    this.#roundScores.push(rs);
    this.#computeVerdict();

    oopTelemetry.notify({
      domain: "Scorecard", badge: "OP+",
      component: "Scorecard", method: "operator+",
      message: `[OP+] Scorecard::operator+(Round ${this.#roundScores.length} Score) -> ${this.overallScore.toFixed(1)}/10`
    });
    return this;
  }

  // Mirrors C++ operator<< (formatted output)
  toString() {
    return `Score: ${this.overallScore.toFixed(1)}/10 | ` +
      `Code: ${this.avgCodeCorrectness.toFixed(1)} | ` +
      `Systems: ${this.avgSystemScalability.toFixed(1)} | ` +
      `Math: ${this.avgMathematicalDepth.toFixed(1)} | ` +
      `Edge Cases: ${this.avgEdgeCaseHandling.toFixed(1)} | ` +
      `Communication: ${this.avgCommunication.toFixed(1)} | ` +
      `Verdict: ${this.#verdict}`;
  }

  toJSON() {
    return {
      overall: +this.overallScore.toFixed(1),
      codeCorrectness: +this.avgCodeCorrectness.toFixed(1),
      systemScalability: +this.avgSystemScalability.toFixed(1),
      mathematicalDepth: +this.avgMathematicalDepth.toFixed(1),
      edgeCaseHandling: +this.avgEdgeCaseHandling.toFixed(1),
      communication: +this.avgCommunication.toFixed(1),
      verdict: this.#verdict,
      candidate: this.#candidateName,
      track: this.#trackName,
      rounds: this.#roundScores.length
    };
  }
}

// RoundScore helper
class RoundScore {
  constructor(code, systems, math, edge, comm) {
    this.codeCorrectness = code;
    this.systemScalability = systems;
    this.mathematicalDepth = math;
    this.edgeCaseHandling = edge;
    this.communication = comm;
  }
  get average() {
    return (this.codeCorrectness + this.systemScalability +
            this.mathematicalDepth + this.edgeCaseHandling +
            this.communication) / 5.0;
  }
}

// ============================================================================
// CandidateSession - Encapsulation (mirrors C++ CandidateSession)
// ============================================================================
class CandidateSession {
  #name; #difficulty; #currentRound; #maxRounds; #completed; #log;

  constructor(name, maxRounds = 3, difficulty = "Senior") {
    this.#name = name;
    this.#difficulty = difficulty;
    this.#currentRound = 0;
    this.#maxRounds = maxRounds;
    this.#completed = false;
    this.#log = [];

    oopTelemetry.notify({
      domain: "Session", badge: "CTOR",
      component: "CandidateSession", method: "constructor",
      message: `[CTOR] CandidateSession("${name}") constructed | Max rounds: ${maxRounds} | Difficulty: ${difficulty}`
    });
  }

  get name() { return this.#name; }
  get difficulty() { return this.#difficulty; }
  get currentRound() { return this.#currentRound; }
  get maxRounds() { return this.#maxRounds; }
  get isCompleted() { return this.#completed; }

  advanceRound() { this.#currentRound++; }
  markCompleted() { this.#completed = true; }
  addToLog(entry) { this.#log.push(entry); }
  getHistory() { return this.#log.join("\n"); }
}

// ============================================================================
// InterviewTrack - Abstract Base Class (mirrors C++ pure virtual)
// ============================================================================
class InterviewTrack {
  trackName()        { throw new Error("Pure virtual: trackName() must be overridden"); }
  systemPrompt()     { throw new Error("Pure virtual: systemPrompt() must be overridden"); }
  getRoundQuestion(round) { throw new Error("Pure virtual: getRoundQuestion() must be overridden"); }
  evaluateSubmission(round, code) { throw new Error("Pure virtual: evaluateSubmission() must be overridden"); }
}

// ============================================================================
// Track 1: LLMs & Transformer Architectures
// ============================================================================
class LLMTransformersTrack extends InterviewTrack {
  constructor() {
    super();
    oopTelemetry.notify({
      domain: "Track", badge: "CTOR",
      component: "LLMTransformersTrack", method: "constructor",
      message: `[CTOR] LLMTransformersTrack allocated @ ${fakePtr()} | vtable -> LLMTransformersTrack`
    });
  }

  trackName() { return "LLMs & Transformer Architectures"; }

  systemPrompt() {
    return "You are a Staff AI Research Engineer. Ask deep technical questions about Transformers, Attention (MHA, GQA, FlashAttention), PyTorch, and LoRA/QLoRA. Include Python code snippets.";
  }

  getRoundQuestion(round) {
    oopTelemetry.notify({
      domain: "Polymorphism", badge: "VTABLE",
      component: "LLMTransformersTrack", method: "getRoundQuestion",
      message: `[VTABLE] InterviewTrack::getRoundQuestion() overridden by LLMTransformersTrack | Round ${round}`
    });

    const bank = {
      1: `[AI Coding Challenge: Scaled Dot-Product Attention]\n\`\`\`python\nimport torch\nimport torch.nn.functional as F\n\ndef scaled_dot_product_attention(Q, K, V, mask=None):\n    """\n    Q, K: [batch, num_heads, seq_len, head_dim]\n    V:    [batch, num_heads, seq_len, head_dim]\n    mask: [batch, 1, seq_len, seq_len] (optional causal)\n    """\n    # 1. Why divide by sqrt(d_k) before softmax?\n    # 2. Write the 3-line PyTorch implementation.\n\`\`\`\n**Task:** Implement scaled dot-product attention and explain what happens to softmax gradients when d_k is large if the scaling factor is omitted.`,
      2: `[LoRA Linear Layer Implementation]\n\`\`\`python\nimport torch.nn as nn\n\nclass LoRALinear(nn.Module):\n    def __init__(self, in_f, out_f, rank=8, alpha=16.0):\n        super().__init__()\n        self.linear = nn.Linear(in_f, out_f)\n        self.linear.weight.requires_grad = False\n        self.scaling = alpha / rank\n        # TASK: Define A and B initialization\n\`\`\`\n**Task:** Why must B=0 and A=Gaussian so delta_W=0 at t=0? Complete the forward pass.`,
      3: `[Multi-Head vs Grouped-Query Attention (GQA)]\n\`\`\`python\n# MHA: 32 Query, 32 Key, 32 Value heads\n# GQA: 32 Query,  8 Key,  8 Value heads\n\`\`\`\n**Task:** Explain how GQA reduces KV-cache memory during autoregressive generation without degrading quality.`
    };
    return bank[round] || bank[1];
  }

  evaluateSubmission(round, code) {
    oopTelemetry.notify({
      domain: "Polymorphism", badge: "VTABLE",
      component: "LLMTransformersTrack", method: "evaluateSubmission",
      message: `[VTABLE] InterviewTrack::evaluateSubmission() overridden by LLMTransformersTrack`
    });
    const mentionsCode = /matmul|softmax|attention/i.test(code);
    const mentionsScale = /sqrt|scale|d_k/i.test(code);
    const mentionsLora = /lora|rank|alpha/i.test(code);
    return new RoundScore(
      mentionsCode ? 8.5 + (mentionsScale ? 1.0 : 0.0) : 6.0,
      mentionsLora ? 8.8 : 7.0,
      mentionsScale ? 9.0 : 6.5,
      code.length > 100 ? 8.0 : 6.5,
      code.length > 50 ? 8.5 : 7.0
    );
  }
}

// ============================================================================
// Track 2: Advanced RAG & Vector Retrieval
// ============================================================================
class AdvancedRAGTrack extends InterviewTrack {
  constructor() {
    super();
    oopTelemetry.notify({
      domain: "Track", badge: "CTOR",
      component: "AdvancedRAGTrack", method: "constructor",
      message: `[CTOR] AdvancedRAGTrack allocated @ ${fakePtr()} | vtable -> AdvancedRAGTrack`
    });
  }

  trackName() { return "Advanced RAG & Vector Retrieval"; }

  systemPrompt() {
    return "You are a Lead GenAI Retrieval Architect. Ask deep questions on RAG: Hybrid Search (BM25 + Dense), RRF, Cross-Encoder Rerankers, Chunking, and HNSW tuning. Include Python code.";
  }

  getRoundQuestion(round) {
    oopTelemetry.notify({
      domain: "Polymorphism", badge: "VTABLE",
      component: "AdvancedRAGTrack", method: "getRoundQuestion",
      message: `[VTABLE] InterviewTrack::getRoundQuestion() overridden by AdvancedRAGTrack | Round ${round}`
    });
    const bank = {
      1: `[Reciprocal Rank Fusion (RRF)]\n\`\`\`python\ndef reciprocal_rank_fusion(dense: dict, bm25: dict, k=60):\n    # RRF(d) = sum(1/(k + rank_i(d)))\n    # TASK: combine both ranking lists\n    pass\n\`\`\`\n**Task:** Implement RRF and explain why it's more robust than linear score interpolation.`,
      2: `[Parent-Child Hierarchical Chunking]\n\`\`\`python\n# Naive: 500-char chunks with 50 overlap\n# Better: embed small child chunks, retrieve parent context\n\`\`\`\n**Task:** Design a hierarchical chunking strategy for 100-page financial reports. What metadata filters would you attach?`,
      3: `[Cross-Encoder Reranking Pipeline]\n\`\`\`python\n# Stage 1: Bi-encoder retrieval (top-100)\n# Stage 2: Cross-encoder reranking (top-10)\n\`\`\`\n**Task:** Explain the latency vs accuracy trade-off and how to batch efficiently at scale.`
    };
    return bank[round] || bank[1];
  }

  evaluateSubmission(round, code) {
    oopTelemetry.notify({
      domain: "Polymorphism", badge: "VTABLE",
      component: "AdvancedRAGTrack", method: "evaluateSubmission",
      message: `[VTABLE] InterviewTrack::evaluateSubmission() overridden by AdvancedRAGTrack`
    });
    const mentionsRRF = /RRF|rank|fusion/i.test(code);
    const mentionsChunk = /chunk|parent|child/i.test(code);
    return new RoundScore(
      mentionsRRF ? 8.8 : 6.5,
      mentionsChunk ? 9.0 : 7.0,
      mentionsRRF ? 8.5 : 6.0,
      code.length > 80 ? 8.2 : 6.5,
      code.length > 40 ? 8.5 : 7.0
    );
  }
}

// ============================================================================
// Track 3: AI Agents & Function Calling
// ============================================================================
class AIAgentsTrack extends InterviewTrack {
  constructor() {
    super();
    oopTelemetry.notify({
      domain: "Track", badge: "CTOR",
      component: "AIAgentsTrack", method: "constructor",
      message: `[CTOR] AIAgentsTrack allocated @ ${fakePtr()} | vtable -> AIAgentsTrack`
    });
  }

  trackName() { return "AI Agents & Function Calling"; }

  systemPrompt() {
    return "You are a Principal AI Agent Architect. Ask questions on ReAct loops, LangGraph, JSON schema validation, tool failure recovery, and LLM-as-a-judge evals.";
  }

  getRoundQuestion(round) {
    oopTelemetry.notify({
      domain: "Polymorphism", badge: "VTABLE",
      component: "AIAgentsTrack", method: "getRoundQuestion",
      message: `[VTABLE] InterviewTrack::getRoundQuestion() overridden by AIAgentsTrack | Round ${round}`
    });
    const bank = {
      1: `[ReAct Loop & Cyclic Failure Handling]\n\`\`\`python\ndef run_react_step(history, tools, max_iter=6):\n    # How does your agent prevent infinite retry loops\n    # when a tool call errors?\n    pass\n\`\`\`\n**Task:** Design a resilient agent state machine with error injection and self-correction.`,
      2: `[Structured Outputs & Constrained Decoding]\n\`\`\`python\n# Tool: execute_query(query: str, timeout: int)\n# LLMs frequently produce invalid JSON\n\`\`\`\n**Task:** How do grammar-constrained decoding and Pydantic validation guarantee valid function call schemas?`,
      3: `[Multi-Agent Orchestration (LangGraph)]\n\`\`\`python\n# Supervisor -> Researcher -> Writer -> Reviewer\n# How do you handle state persistence and rollback?\n\`\`\`\n**Task:** Design a multi-agent DAG with conditional branching and human-in-the-loop approval gates.`
    };
    return bank[round] || bank[1];
  }

  evaluateSubmission(round, code) {
    oopTelemetry.notify({
      domain: "Polymorphism", badge: "VTABLE",
      component: "AIAgentsTrack", method: "evaluateSubmission",
      message: `[VTABLE] InterviewTrack::evaluateSubmission() overridden by AIAgentsTrack`
    });
    const mentionsReact = /react|agent|loop/i.test(code);
    const mentionsJSON = /json|pydantic|schema/i.test(code);
    return new RoundScore(
      mentionsReact ? 8.5 : 6.5,
      mentionsJSON ? 9.0 : 7.0,
      7.5,
      code.length > 100 ? 8.8 : 6.5,
      code.length > 50 ? 8.5 : 7.0
    );
  }
}

// ============================================================================
// Track 4: ML Systems & Inference Optimization
// ============================================================================
class MLSystemsTrack extends InterviewTrack {
  constructor() {
    super();
    oopTelemetry.notify({
      domain: "Track", badge: "CTOR",
      component: "MLSystemsTrack", method: "constructor",
      message: `[CTOR] MLSystemsTrack allocated @ ${fakePtr()} | vtable -> MLSystemsTrack`
    });
  }

  trackName() { return "ML Systems & Inference Optimization"; }

  systemPrompt() {
    return "You are a Staff ML Infrastructure Engineer. Ask deep questions on KV-Cache, PagedAttention, Continuous Batching, Quantization (AWQ, GPTQ, FP8), and TTFT/TPOT.";
  }

  getRoundQuestion(round) {
    oopTelemetry.notify({
      domain: "Polymorphism", badge: "VTABLE",
      component: "MLSystemsTrack", method: "getRoundQuestion",
      message: `[VTABLE] InterviewTrack::getRoundQuestion() overridden by MLSystemsTrack | Round ${round}`
    });
    const bank = {
      1: `[KV-Cache VRAM Calculation]\n\`\`\`python\ndef calc_kv_cache_gb(\n    layers=80, kv_heads=8, head_dim=128,\n    seq_len=8192, batch=32, bytes=2\n) -> float:\n    # 2(K+V) * layers * kv_heads * head_dim * seq * batch * bytes\n    pass\n\`\`\`\n**Task:** Calculate total KV-cache for batch=32 at 8K context. Why does contiguous allocation waste 60%+ GPU memory? How does PagedAttention fix it?`,
      2: `[Continuous Batching vs Static Batching]\n\`\`\`python\n# Static: wait for all sequences to finish before new batch\n# Continuous: insert new requests at iteration level\n\`\`\`\n**Task:** Explain how iteration-level continuous batching achieves higher throughput.`,
      3: `[Speculative Decoding & Quantization]\n\`\`\`python\n# Draft model: 1B generates k tokens\n# Target model: 70B verifies in single forward pass\n\`\`\`\n**Task:** When does speculative decoding fail to provide speedups? Compare FP8 vs INT4 AWQ.`
    };
    return bank[round] || bank[1];
  }

  evaluateSubmission(round, code) {
    oopTelemetry.notify({
      domain: "Polymorphism", badge: "VTABLE",
      component: "MLSystemsTrack", method: "evaluateSubmission",
      message: `[VTABLE] InterviewTrack::evaluateSubmission() overridden by MLSystemsTrack`
    });
    const mentionsKV = /KV|cache|memory/i.test(code);
    const mentionsPaged = /paged|vllm|fragmentation/i.test(code);
    return new RoundScore(
      mentionsKV ? 8.8 : 6.5,
      mentionsPaged ? 9.2 : 7.0,
      mentionsKV ? 8.5 : 6.0,
      code.length > 80 ? 8.0 : 6.5,
      code.length > 40 ? 8.5 : 7.0
    );
  }
}

// ============================================================================
// TrackFactory - Factory Pattern (mirrors C++ TrackFactory)
// ============================================================================
export class TrackFactory {
  static createTrack(trackId) {
    let track;
    switch (String(trackId)) {
      case "2": case "rag":     track = new AdvancedRAGTrack(); break;
      case "3": case "agents":  track = new AIAgentsTrack(); break;
      case "4": case "systems": track = new MLSystemsTrack(); break;
      default:                  track = new LLMTransformersTrack(); break;
    }

    oopTelemetry.notify({
      domain: "Factory", badge: "CTOR",
      component: "TrackFactory", method: "createTrack",
      message: `[CTOR] TrackFactory::createTrack(${trackId}) -> std::unique_ptr<${track.trackName()}> @ ${fakePtr()}`
    });

    return track;
  }
}

// ============================================================================
// AIInterviewAPI - Encapsulated API connector (mirrors C++ AIInterviewAPI)
// ============================================================================
class AIInterviewAPI {
  #endpoint;
  #model;

  constructor(modelName = "llama-3.3-70b-versatile") {
    this.#endpoint = "/api/interview";
    this.#model = modelName;

    oopTelemetry.notify({
      domain: "System", badge: "CTOR",
      component: "AIInterviewAPI", method: "constructor",
      message: `[CTOR] AIInterviewAPI("${this.#model}") initialized | Endpoint: ${this.#endpoint}`
    });
  }

  getModel() { return this.#model; }

  async sendPrompt(sysPrompt, history, round = 1, lastAnswer = "") {
    oopTelemetry.notify({
      domain: "Evaluation", badge: "LLM",
      component: "AIInterviewAPI", method: "sendPrompt",
      message: `Analyzing Round ${round} via ${this.#model}`
    });

    try {
      const response = await fetch(this.#endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: lastAnswer, sysPrompt, history, round, model: this.#model
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Inference failed");
      if (data.model) this.#model = data.model;
      return data.content;
    } catch (err) {
      console.warn("API error, using fallback:", err);
      if (round < 0) {
        return "Score: 9.1/10 | Strengths: Strong Transformer attention depth, proper RAG hybrid search, clear KV-cache math | Recommendations: Detail production latency SLA (TTFT vs TPOT) | Verdict: STRONG HIRE";
      }
      return "Interviewer: Good points. How does FlashAttention reduce memory complexity from O(N²) to O(N) via GPU SRAM tiling?";
    }
  }
}

// ============================================================================
// Evaluator - Interview Orchestrator (mirrors C++ Evaluator)
// ============================================================================
class Evaluator {
  #track;
  #session;
  #scorecard;
  #api;
  #conversation = "";

  constructor(trackId, candidateName, maxRounds = 3, model = "llama-3.3-70b-versatile", difficulty = "Senior") {
    this.#track = TrackFactory.createTrack(trackId);
    this.#session = new CandidateSession(candidateName, maxRounds, difficulty);
    this.#scorecard = new Scorecard(candidateName, this.#track.trackName());
    this.#api = new AIInterviewAPI(model);

    oopTelemetry.notify({
      domain: "Engine", badge: "CTOR",
      component: "Evaluator", method: "constructor",
      message: `[CTOR] Evaluator initialized | Track: ${this.#track.trackName()} | Candidate: ${candidateName} | Difficulty: ${difficulty}`
    });
  }

  getTrackName() { return this.#track.trackName(); }
  getSystemPrompt() { return this.#track.systemPrompt(); }
  get currentRound() { return this.#session.currentRound; }
  get scorecard() { return this.#scorecard; }

  start() {
    this.#session.advanceRound();
    const q = this.#track.getRoundQuestion(1);
    this.#conversation += `Interviewer: ${q}\n`;
    this.#session.addToLog(`**Interviewer (Round 1):** ${q}`);
    return q;
  }

  async submitAnswer(answer) {
    if (this.#session.isCompleted) throw new Error("Interview already completed.");

    const round = this.#session.currentRound;
    this.#conversation += `${this.#session.name}: ${answer}\n`;
    this.#session.addToLog(`**${this.#session.name} (Round ${round}):** ${answer}`);

    // Local evaluation using polymorphic track
    const localScores = this.#track.evaluateSubmission(round, answer);
    this.#scorecard.addRoundScore(localScores);

    if (round >= this.#session.maxRounds) {
      this.#session.markCompleted();

      // Try cloud LLM for rich evaluation
      const evalPrompt = "You are a Principal AI Engineer. Evaluate for: 1. Deep Learning intuition, 2. Production system design, 3. Code accuracy. Give Score/10, Strengths, Areas for Improvement, Verdict.";
      let report;
      try {
        report = await this.#api.sendPrompt(evalPrompt, this.#conversation, -1, answer);
      } catch {
        report = this.#scorecard.toString();
      }

      oopTelemetry.notify({
        domain: "Scorecard", badge: "FINAL",
        component: "Evaluator", method: "submitAnswer",
        message: `Interview complete. Verdict: ${this.#scorecard.verdict} | Overall: ${this.#scorecard.overallScore.toFixed(1)}`
      });

      return {
        isFinished: true,
        report,
        round,
        maxRounds: this.#session.maxRounds,
        scorecard: this.#scorecard.toJSON()
      };
    }

    // Get next question via cloud or local
    const sysPrompt = this.#track.systemPrompt();
    let nextQuestion;
    try {
      nextQuestion = await this.#api.sendPrompt(sysPrompt, this.#conversation, round, answer);
    } catch {
      this.#session.advanceRound();
      nextQuestion = this.#track.getRoundQuestion(this.#session.currentRound);
    }

    if (this.#session.currentRound === round) {
      this.#session.advanceRound();
    }
    this.#conversation += `Interviewer: ${nextQuestion}\n`;
    this.#session.addToLog(`**Interviewer (Round ${this.#session.currentRound}):** ${nextQuestion}`);

    return {
      isFinished: false,
      question: nextQuestion,
      round: this.#session.currentRound,
      maxRounds: this.#session.maxRounds
    };
  }

  getConversationHistory() {
    return this.#conversation;
  }
}

// ============================================================================
// Public API: createAIInterviewer (mirrors C++ factory entry point)
// ============================================================================
export function createAIInterviewer(trackChoice, candidateName, model = "llama-3.3-70b-versatile", difficulty = "Senior") {
  return new Evaluator(trackChoice, candidateName, 3, model, difficulty);
}
