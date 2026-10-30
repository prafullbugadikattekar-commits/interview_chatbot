/**
 * AI Interview Bot - C++ OOP Architecture Emulator
 * Faithfully mirrors the 4 Pillars of Object-Oriented Programming from main.cpp
 * 
 * 1. ENCAPSULATION: GroqAPI encapsulates credentials, network calls, and payload sanitation
 * 2. ABSTRACTION: Abstract base class Interviewer hides prompt mechanics and defines interface
 * 3. INHERITANCE: Specialized derived interviewers (Technical, Behavioral, System Design)
 * 4. POLYMORPHISM: Dynamic dispatch via base class references and virtual method table (vtable)
 */

export class OOPEventDispatcher {
  constructor() {
    this.listeners = [];
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notify(event) {
    this.listeners.forEach(cb => {
      try {
        cb(event);
      } catch (e) {
        console.error("OOP Dispatcher error:", e);
      }
    });
  }
}

export const oopEvents = new OOPEventDispatcher();

// ============================================================================
// 1. ENCAPSULATION: GroqAPI
// Encapsulates private API state, payload sanitization, and fallback mechanics
// ============================================================================
export class GroqAPI {
  #apiKey;
  #model;
  #endpoint;

  constructor(key = "", modelName = "openai/gpt-oss-120b") {
    this.#apiKey = key ? key.trim() : "";
    this.#model = (modelName === "chatgpt-120b-oss" || modelName === "gpt-oss-120b")
      ? "openai/gpt-oss-120b"
      : modelName;
    this.#endpoint = "/api/interview";

    oopEvents.notify({
      pillar: "Encapsulation",
      badge: "Private State",
      class: "GroqAPI",
      method: "constructor",
      message: `Initialized GroqAPI instance. Model: ${this.#model}. Credentials secured within private memory (#apiKey).`
    });
  }

  // Public getter to safely inspect model name without exposing API key
  getModel() {
    return this.#model;
  }

  // Public method for sending prompt
  async sendPrompt(sysPrompt, history, round = 1, lastAnswer = "") {
    oopEvents.notify({
      pillar: "Encapsulation",
      badge: "Method Boundary",
      class: "GroqAPI",
      method: "sendPrompt",
      message: `GroqAPI::sendPrompt() invoked for round ${round}. Internal payload construction & TLS network transmission protected.`
    });

    try {
      const response = await fetch(this.#endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: lastAnswer,
          sysPrompt: sysPrompt,
          history: history,
          round: round,
          model: this.#model
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Request failed");
      }

      if (data.model && data.model !== this.#model) {
        this.#model = data.model;
        oopEvents.notify({
          pillar: "Encapsulation",
          badge: "Dynamic Fallback",
          class: "GroqAPI",
          method: "sendPrompt",
          message: `Automatic fallback triggered. Active model switched to: ${this.#model}`
        });
      }

      return data.content;
    } catch (err) {
      console.warn("GroqAPI error, using offline dynamic fallback:", err);
      // Offline fallback simulation matching main.cpp
      if (round < 0) {
        return "Score: 8.7/10 | Strengths: Solid grasp of RAII idiom, clean memory ownership, clear structure | Areas for Improvement: Address concurrency race conditions | Verdict: HIRE";
      }
      return (round === 1)
        ? "Interviewer: Great answer. How would you ensure exception safety and avoid memory leaks using RAII and smart pointers?"
        : "Interviewer: Good. How does this architecture scale when multiple threads concurrently access shared resources?";
    }
  }
}

// ============================================================================
// 2. ABSTRACTION: Abstract Base Class Interviewer
// Defines the contract and hides conversation history & orchestration mechanics
// ============================================================================
export class Interviewer {
  constructor(candidateName, apiKey, maxRounds = 3, model = "openai/gpt-oss-120b") {
    if (new.target === Interviewer) {
      throw new TypeError("Abstract class 'Interviewer' cannot be instantiated directly with new. Must instantiate a derived class.");
    }
    this.candidate = candidateName || "Candidate";
    this.api = new GroqAPI(apiKey, model);
    this.conversation = "";
    this.maxRounds = maxRounds;
    this.currentRound = 0;
    this.isCompleted = false;

    oopEvents.notify({
      pillar: "Abstraction",
      badge: "Abstract Base Constructor",
      class: "Interviewer",
      method: "constructor",
      message: `Base class 'Interviewer' initialized for candidate '${this.candidate}' (${this.maxRounds} rounds). Virtual interface instantiated.`
    });
  }

  // Pure virtual method interface definitions
  getTrackName() {
    throw new Error("Pure virtual function Interviewer::getTrackName() called without override!");
  }

  getSystemPrompt() {
    throw new Error("Pure virtual function Interviewer::getSystemPrompt() called without override!");
  }

  getOpeningQuestion() {
    throw new Error("Pure virtual function Interviewer::getOpeningQuestion() called without override!");
  }

  // Template Method: Orchestrates the interview steps
  start() {
    this.currentRound = 1;
    // Dynamic dispatch to overridden getOpeningQuestion()
    const opener = this.getOpeningQuestion();
    this.conversation += `Interviewer: ${opener}\n`;

    oopEvents.notify({
      pillar: "Polymorphism",
      badge: "Vtable Dispatch",
      class: this.constructor.name,
      method: "getOpeningQuestion",
      message: `Vtable resolved virtual call Interviewer::getOpeningQuestion() -> ${this.constructor.name}::getOpeningQuestion()`
    });

    return opener;
  }

  async submitAnswer(answer) {
    if (this.isCompleted) {
      throw new Error("Interview is already completed.");
    }

    this.conversation += `${this.candidate}: ${answer}\n`;

    // Check if we reached the maximum rounds
    if (this.currentRound >= this.maxRounds) {
      this.isCompleted = true;
      oopEvents.notify({
        pillar: "Abstraction",
        badge: "Template Lifecycle",
        class: "Interviewer",
        method: "submitAnswer",
        message: `Max rounds (${this.maxRounds}) reached. Abstract engine initiating final evaluation scorecard.`
      });

      // Call API for final evaluation report
      const evalPrompt = "Evaluate candidate performance: give Score out of 10, Strengths, Areas for Improvement, and Verdict (Hire/No Hire).";
      const report = await this.api.sendPrompt(evalPrompt, this.conversation, -1, answer);
      return {
        isFinished: true,
        report: report,
        round: this.currentRound,
        maxRounds: this.maxRounds
      };
    }

    // Dynamic dispatch to overridden getSystemPrompt()
    const sysPrompt = this.getSystemPrompt();
    oopEvents.notify({
      pillar: "Polymorphism",
      badge: "Virtual Dispatch",
      class: this.constructor.name,
      method: "getSystemPrompt",
      message: `Dynamic dispatch: Interviewer::getSystemPrompt() -> ${this.constructor.name}::getSystemPrompt()`
    });

    const nextQuestion = await this.api.sendPrompt(sysPrompt, this.conversation, this.currentRound, answer);
    this.conversation += `Interviewer: ${nextQuestion}\n`;
    this.currentRound += 1;

    return {
      isFinished: false,
      question: nextQuestion,
      round: this.currentRound,
      maxRounds: this.maxRounds
    };
  }

  getConversationHistory() {
    return this.conversation;
  }
}

// ============================================================================
// 3. INHERITANCE: Specialized Derived Interviewers
// ============================================================================

// Derived Class 1: Technical Interviewer (C++ Systems & Memory)
export class TechnicalInterviewer extends Interviewer {
  constructor(candidateName, apiKey, maxRounds = 3, model = "openai/gpt-oss-120b") {
    super(candidateName, apiKey, maxRounds, model);
    oopEvents.notify({
      pillar: "Inheritance",
      badge: "Derived Specialization",
      class: "TechnicalInterviewer",
      method: "constructor",
      message: "Derived class 'TechnicalInterviewer' inherits from 'Interviewer' (C++ Systems, Memory, Concurrency track)."
    });
  }

  getTrackName() {
    return "C++ Systems Technical";
  }

  getSystemPrompt() {
    return "You are an expert C++ Technical Interviewer. Always evaluate the candidate's code analysis or implementation. Include concise C++ code snippets inside ```cpp ... ``` markdown blocks for follow-up questions.";
  }

  getOpeningQuestion() {
    const bank = [
      `[C++ Coding Challenge 1: Polymorphism & Memory Leak]\nInspect the following C++ code snippet:\n\`\`\`cpp\nclass Base {\npublic:\n    Base() { std::cout << "Base created\\n"; }\n    ~Base() { std::cout << "Base destroyed\\n"; } // What is the defect here?\n};\n\nclass Derived : public Base {\n    int* buffer;\npublic:\n    Derived() : buffer(new int[100]) { std::cout << "Derived created\\n"; }\n    ~Derived() { delete[] buffer; std::cout << "Derived destroyed\\n"; }\n};\n\nint main() {\n    std::unique_ptr<Base> ptr = std::make_unique<Derived>();\n    return 0;\n}\n\`\`\`\n**Task:** Explain what bug occurs when \`ptr\` goes out of scope, why \`Derived::~Derived()\` is never called, and write the exact fix.`,

      `[C++ Coding Challenge 2: Implement Move Constructor]\nLook at the following RAII buffer class:\n\`\`\`cpp\nclass DynamicBuffer {\nprivate:\n    int* data;\n    size_t length;\npublic:\n    DynamicBuffer(size_t len) : length(len), data(new int[len]) {}\n    ~DynamicBuffer() { delete[] data; }\n\n    // TASK: Implement the move constructor below to transfer ownership:\n    DynamicBuffer(DynamicBuffer&& other) noexcept {\n        // [Write your C++ implementation here]\n    }\n};\n\`\`\`\n**Task:** Write the complete move constructor implementation and explain why \`other.data\` must be set to \`nullptr\`.`,

      `[C++ Coding Challenge 3: Break Circular Dependency]\nReview this cyclic relationship:\n\`\`\`cpp\nstruct NodeB;\nstruct NodeA {\n    std::shared_ptr<NodeB> next;\n    ~NodeA() { std::cout << "NodeA destroyed\\n"; }\n};\n\nstruct NodeB {\n    std::shared_ptr<NodeA> prev; // Causes memory leak!\n    ~NodeB() { std::cout << "NodeB destroyed\\n"; }\n};\n\`\`\`\n**Task:** Explain why neither object is ever deallocated, and rewrite \`NodeB\` using \`std::weak_ptr\` to resolve the cycle.`
    ];
    return bank[Math.floor(Math.random() * bank.size())];
  }
}

// Derived Class 2: Behavioral & Leadership Interviewer
export class BehavioralInterviewer extends Interviewer {
  constructor(candidateName, apiKey, maxRounds = 3, model = "openai/gpt-oss-120b") {
    super(candidateName, apiKey, maxRounds, model);
    oopEvents.notify({
      pillar: "Inheritance",
      badge: "Derived Specialization",
      class: "BehavioralInterviewer",
      method: "constructor",
      message: "Derived class 'BehavioralInterviewer' inherits from 'Interviewer' (STAR Method, Leadership, Conflict Resolution track)."
    });
  }

  getTrackName() {
    return "Behavioral & Leadership";
  }

  getSystemPrompt() {
    return "You are an Engineering Manager conducting a behavioral interview. Ask one targeted follow-up question using the STAR (Situation, Task, Action, Result) method.";
  }

  getOpeningQuestion() {
    const bank = [
      "Tell me about a time you had a significant technical disagreement with a team member. How did you resolve it constructively?",
      "Describe a high-pressure situation where a critical production bug occurred. How did you triage, resolve, and prevent it from recurring?",
      "Tell me about a project where requirements were ambiguous and you had to make tough architectural trade-offs.",
      "Can you give an example of a technical project where you failed or made a mistake? What did you learn and how did you adapt?"
    ];
    return bank[Math.floor(Math.random() * bank.size())];
  }
}

// Derived Class 3: System Design & Architecture Interviewer
export class SystemDesignInterviewer extends Interviewer {
  constructor(candidateName, apiKey, maxRounds = 3, model = "openai/gpt-oss-120b") {
    super(candidateName, apiKey, maxRounds, model);
    oopEvents.notify({
      pillar: "Inheritance",
      badge: "Derived Specialization",
      class: "SystemDesignInterviewer",
      method: "constructor",
      message: "Derived class 'SystemDesignInterviewer' inherits from 'Interviewer' (High Scalability, Distributed Systems track)."
    });
  }

  getTrackName() {
    return "System Design & Architecture";
  }

  getSystemPrompt() {
    return "You are a Principal Software Architect conducting a system design interview. Ask one concise follow-up question on scalability, database partitioning, caching, or trade-offs.";
  }

  getOpeningQuestion() {
    const bank = [
      "How would you design a distributed, high-throughput rate limiter capable of handling 500,000 requests per second across multiple data centers?",
      "Design a real-time notification service (like WhatsApp or Slack). How would you manage millions of persistent WebSocket connections?",
      "How would you architect a distributed key-value store with strong consistency vs eventual consistency tradeoffs (CAP theorem)?"
    ];
    return bank[Math.floor(Math.random() * bank.size())];
  }
}

// ============================================================================
// 4. POLYMORPHISM: Factory / Dynamic Instantiation
// Mirrors: std::unique_ptr<Interviewer> bot = std::make_unique<DerivedClass>(...)
// ============================================================================
export function createInterviewBot(trackChoice, candidateName, apiKey, rounds = 3, model = "openai/gpt-oss-120b") {
  let bot;

  if (trackChoice === "2" || trackChoice === "behavioral") {
    bot = new BehavioralInterviewer(candidateName, apiKey, rounds, model);
  } else if (trackChoice === "3" || trackChoice === "system-design") {
    bot = new SystemDesignInterviewer(candidateName, apiKey, rounds, model);
  } else {
    bot = new TechnicalInterviewer(candidateName, apiKey, rounds, model);
  }

  oopEvents.notify({
    pillar: "Polymorphism",
    badge: "Runtime Binding",
    class: "Factory Dispatch",
    method: "createInterviewBot",
    message: `Dynamic dispatch bound base reference 'Interviewer*' to concrete instance '${bot.constructor.name}'. Track: '${bot.getTrackName()}'.`
  });

  return bot;
}
