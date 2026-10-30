/*============================================================================
 * Tracks.hpp - 4 Concrete Track Implementations + TrackFactory
 * C++17 OOP Mini-Project: AI Engineer Interview Prep
 *
 * OOP Concepts Demonstrated:
 *   - Inheritance: Each track derives from InterviewTrack
 *   - Runtime Polymorphism: overriding virtual methods (vtable dispatch)
 *   - Factory Pattern: TrackFactory returns std::unique_ptr<InterviewTrack>
 *   - STL: std::vector, std::map for question banks
 *============================================================================*/
#pragma once

#include "InterviewEngine.hpp"
#include <algorithm>
#include <random>

namespace interviewprep {

// ============================================================================
// Track 1: LLMs & Transformer Architectures
// ============================================================================
class LLMTransformersTrack : public InterviewTrack {
public:
    LLMTransformersTrack() {
        telemetryBus().notify(TelemetryEvent(
            "Track", "CTOR",
            "LLMTransformersTrack", "constructor",
            "[CTOR] LLMTransformersTrack allocated | vtable -> LLMTransformersTrack"
        ));
    }

    ~LLMTransformersTrack() override {
        telemetryBus().notify(TelemetryEvent(
            "Track", "DTOR",
            "LLMTransformersTrack", "destructor",
            "[DTOR] ~LLMTransformersTrack() -> releasing track resources"
        ));
    }

    std::string trackName() const override { return "LLMs & Transformer Architectures"; }

    std::string systemPrompt() const override {
        return "You are a Staff AI Research Engineer. Ask deep technical questions about "
               "Transformers, Attention mechanisms (MHA, GQA, FlashAttention), PyTorch "
               "implementation details, and LoRA/QLoRA fine-tuning. Include Python code.";
    }

    Question getRoundQuestion(int round) const override {
        telemetryBus().notify(TelemetryEvent(
            "Polymorphism", "VTABLE",
            "LLMTransformersTrack", "getRoundQuestion",
            "[VTABLE] InterviewTrack::getRoundQuestion() overridden by LLMTransformersTrack | Round " + std::to_string(round)
        ));

        if (round == 1) {
            return Question{
                1,
                "AI Coding Challenge: Scaled Dot-Product Attention",
                "import torch\nimport torch.nn.functional as F\n\n"
                "def scaled_dot_product_attention(Q, K, V, mask=None):\n"
                "    \"\"\"\n"
                "    Q, K: [batch, num_heads, seq_len, head_dim]\n"
                "    V:    [batch, num_heads, seq_len, head_dim]\n"
                "    mask: [batch, 1, seq_len, seq_len] (optional causal)\n"
                "    \"\"\"\n"
                "    # 1. Why divide by sqrt(d_k) before softmax?\n"
                "    # 2. Write the 3-line PyTorch implementation.\n",
                "Implement scaled dot-product attention and explain what happens to softmax "
                "gradients when d_k is large if the scaling factor is omitted.",
                "Senior"
            };
        } else if (round == 2) {
            return Question{
                2,
                "LoRA Linear Layer Implementation",
                "import torch.nn as nn\n\n"
                "class LoRALinear(nn.Module):\n"
                "    def __init__(self, in_f, out_f, rank=8, alpha=16.0):\n"
                "        super().__init__()\n"
                "        self.linear = nn.Linear(in_f, out_f)\n"
                "        self.linear.weight.requires_grad = False\n"
                "        self.scaling = alpha / rank\n"
                "        # TASK: Define A and B initialization\n",
                "Why must matrix B be initialized to zero and A to Gaussian so that "
                "delta_W = 0 at t=0? Complete the forward pass.",
                "Senior"
            };
        } else {
            return Question{
                3,
                "Multi-Head vs Grouped-Query Attention (GQA)",
                "# MHA: 32 Query heads, 32 Key heads, 32 Value heads\n"
                "# GQA: 32 Query heads,  8 Key heads,  8 Value heads\n",
                "Explain how GQA reduces KV-cache memory bandwidth during autoregressive "
                "generation without degrading model quality.",
                "Senior"
            };
        }
    }

    EvaluationResult evaluateSubmission(int round, const std::string& code) override {
        telemetryBus().notify(TelemetryEvent(
            "Polymorphism", "VTABLE",
            "LLMTransformersTrack", "evaluateSubmission",
            "[VTABLE] InterviewTrack::evaluateSubmission() overridden by LLMTransformersTrack"
        ));

        RoundScore scores;
        bool mentionsScaling = code.find("sqrt") != std::string::npos || code.find("scale") != std::string::npos;
        bool mentionsCode    = code.find("matmul") != std::string::npos || code.find("softmax") != std::string::npos;
        bool mentionsLora    = code.find("lora") != std::string::npos || code.find("LoRA") != std::string::npos;
        bool mentionsGQA     = code.find("GQA") != std::string::npos || code.find("grouped") != std::string::npos;

        scores.codeCorrectness   = mentionsCode ? 8.5 + (mentionsScaling ? 1.0 : 0.0) : 6.0;
        scores.systemScalability = (mentionsGQA || mentionsLora) ? 8.8 : 7.0;
        scores.mathematicalDepth = mentionsScaling ? 9.0 : 6.5;
        scores.edgeCaseHandling  = code.length() > 100 ? 8.0 : 6.5;
        scores.communication     = code.length() > 50  ? 8.5 : 7.0;

        bool finished = (round >= 3);
        std::string followUp = "";
        if (!finished) {
            auto next = getRoundQuestion(round + 1);
            followUp = next.formatted();
        }

        return EvaluationResult{round, scores,
            "Strong grasp of Transformer internals and attention scaling.",
            followUp, finished};
    }
};

// ============================================================================
// Track 2: Advanced RAG & Vector Retrieval
// ============================================================================
class AdvancedRAGTrack : public InterviewTrack {
public:
    AdvancedRAGTrack() {
        telemetryBus().notify(TelemetryEvent(
            "Track", "CTOR",
            "AdvancedRAGTrack", "constructor",
            "[CTOR] AdvancedRAGTrack allocated | vtable -> AdvancedRAGTrack"
        ));
    }
    ~AdvancedRAGTrack() override {
        telemetryBus().notify(TelemetryEvent(
            "Track", "DTOR", "AdvancedRAGTrack", "destructor",
            "[DTOR] ~AdvancedRAGTrack() -> releasing track resources"
        ));
    }

    std::string trackName() const override { return "Advanced RAG & Vector Retrieval"; }

    std::string systemPrompt() const override {
        return "You are a Lead GenAI Retrieval Systems Architect. Ask deep questions on "
               "RAG: Hybrid Search (BM25 + Dense), RRF, Cross-Encoder Rerankers, Chunking, "
               "and HNSW vector index tuning. Include Python code.";
    }

    Question getRoundQuestion(int round) const override {
        telemetryBus().notify(TelemetryEvent(
            "Polymorphism", "VTABLE",
            "AdvancedRAGTrack", "getRoundQuestion",
            "[VTABLE] InterviewTrack::getRoundQuestion() overridden by AdvancedRAGTrack | Round " + std::to_string(round)
        ));

        if (round == 1) {
            return Question{1,
                "Reciprocal Rank Fusion (RRF)",
                "def reciprocal_rank_fusion(dense: dict, bm25: dict, k=60):\n"
                "    # RRF(d) = sum(1/(k + rank_i(d)))\n"
                "    # TASK: combine both ranking lists\n"
                "    pass\n",
                "Implement RRF and explain why it's more robust than linear score "
                "interpolation (alpha * S_dense + (1-alpha) * S_sparse).",
                "Senior"};
        } else if (round == 2) {
            return Question{2,
                "Parent-Child Hierarchical Chunking",
                "# Naive: 500-char chunks with 50 overlap\n"
                "# Better: embed small child chunks, retrieve parent context\n",
                "Design a hierarchical chunking strategy for 100-page financial reports. "
                "What metadata filters would you attach?",
                "Senior"};
        } else {
            return Question{3,
                "Cross-Encoder Reranking Pipeline",
                "# Stage 1: Bi-encoder retrieval (top-100)\n"
                "# Stage 2: Cross-encoder reranking (top-10)\n",
                "Explain the latency vs accuracy trade-off of cross-encoder reranking "
                "and how to batch efficiently at scale.",
                "Senior"};
        }
    }

    EvaluationResult evaluateSubmission(int round, const std::string& code) override {
        telemetryBus().notify(TelemetryEvent(
            "Polymorphism", "VTABLE",
            "AdvancedRAGTrack", "evaluateSubmission",
            "[VTABLE] InterviewTrack::evaluateSubmission() overridden by AdvancedRAGTrack"
        ));

        RoundScore scores;
        bool mentionsRRF    = code.find("RRF") != std::string::npos || code.find("rank") != std::string::npos;
        bool mentionsChunk  = code.find("chunk") != std::string::npos || code.find("parent") != std::string::npos;
        scores.codeCorrectness   = mentionsRRF ? 8.8 : 6.5;
        scores.systemScalability = mentionsChunk ? 9.0 : 7.0;
        scores.mathematicalDepth = mentionsRRF ? 8.5 : 6.0;
        scores.edgeCaseHandling  = code.length() > 80 ? 8.2 : 6.5;
        scores.communication     = code.length() > 40 ? 8.5 : 7.0;

        bool finished = (round >= 3);
        std::string followUp = "";
        if (!finished) {
            auto next = getRoundQuestion(round + 1);
            followUp = next.formatted();
        }
        return EvaluationResult{round, scores,
            "Good understanding of production RAG pipelines.", followUp, finished};
    }
};

// ============================================================================
// Track 3: AI Agents & Function Calling
// ============================================================================
class AIAgentsTrack : public InterviewTrack {
public:
    AIAgentsTrack() {
        telemetryBus().notify(TelemetryEvent(
            "Track", "CTOR", "AIAgentsTrack", "constructor",
            "[CTOR] AIAgentsTrack allocated | vtable -> AIAgentsTrack"
        ));
    }
    ~AIAgentsTrack() override {
        telemetryBus().notify(TelemetryEvent(
            "Track", "DTOR", "AIAgentsTrack", "destructor",
            "[DTOR] ~AIAgentsTrack() -> releasing track resources"
        ));
    }

    std::string trackName() const override { return "AI Agents & Function Calling"; }

    std::string systemPrompt() const override {
        return "You are a Principal AI Agent Architect. Ask questions on ReAct loops, "
               "deterministic DAGs (LangGraph), JSON schema validation, tool failure "
               "recovery, loop detection, and LLM-as-a-judge evals (RAGAS, G-Eval).";
    }

    Question getRoundQuestion(int round) const override {
        telemetryBus().notify(TelemetryEvent(
            "Polymorphism", "VTABLE",
            "AIAgentsTrack", "getRoundQuestion",
            "[VTABLE] InterviewTrack::getRoundQuestion() overridden by AIAgentsTrack | Round " + std::to_string(round)
        ));

        if (round == 1) {
            return Question{1,
                "ReAct Loop & Cyclic Failure Handling",
                "def run_react_step(history, tools, max_iter=6):\n"
                "    # How does your agent prevent infinite retry loops\n"
                "    # when a tool call errors (e.g. SQL syntax error)?\n"
                "    pass\n",
                "Design a resilient agent state machine with error injection and "
                "self-correction. Include loop detection.",
                "Senior"};
        } else if (round == 2) {
            return Question{2,
                "Structured Outputs & Constrained Decoding",
                "# Tool: execute_query(query: str, timeout: int)\n"
                "# LLMs frequently produce invalid JSON\n",
                "How do grammar-constrained decoding (Outlines/GBNF) and Pydantic "
                "validation guarantee valid function call schemas?",
                "Senior"};
        } else {
            return Question{3,
                "Multi-Agent Orchestration (LangGraph)",
                "# Supervisor -> Researcher -> Writer -> Reviewer\n"
                "# How do you handle state persistence and rollback?\n",
                "Design a multi-agent DAG with conditional branching, human-in-the-loop "
                "approval gates, and failure rollback.",
                "Senior"};
        }
    }

    EvaluationResult evaluateSubmission(int round, const std::string& code) override {
        telemetryBus().notify(TelemetryEvent(
            "Polymorphism", "VTABLE",
            "AIAgentsTrack", "evaluateSubmission",
            "[VTABLE] InterviewTrack::evaluateSubmission() overridden by AIAgentsTrack"
        ));

        RoundScore scores;
        bool mentionsReact = code.find("ReAct") != std::string::npos || code.find("react") != std::string::npos;
        bool mentionsJSON  = code.find("JSON") != std::string::npos || code.find("Pydantic") != std::string::npos;
        scores.codeCorrectness   = mentionsReact ? 8.5 : 6.5;
        scores.systemScalability = mentionsJSON ? 9.0 : 7.0;
        scores.mathematicalDepth = 7.5;
        scores.edgeCaseHandling  = code.length() > 100 ? 8.8 : 6.5;
        scores.communication     = code.length() > 50  ? 8.5 : 7.0;

        bool finished = (round >= 3);
        std::string followUp = "";
        if (!finished) {
            auto next = getRoundQuestion(round + 1);
            followUp = next.formatted();
        }
        return EvaluationResult{round, scores,
            "Solid grasp of agentic architectures and tool calling.", followUp, finished};
    }
};

// ============================================================================
// Track 4: ML Systems & Inference Optimization
// ============================================================================
class MLSystemsTrack : public InterviewTrack {
public:
    MLSystemsTrack() {
        telemetryBus().notify(TelemetryEvent(
            "Track", "CTOR", "MLSystemsTrack", "constructor",
            "[CTOR] MLSystemsTrack allocated | vtable -> MLSystemsTrack"
        ));
    }
    ~MLSystemsTrack() override {
        telemetryBus().notify(TelemetryEvent(
            "Track", "DTOR", "MLSystemsTrack", "destructor",
            "[DTOR] ~MLSystemsTrack() -> releasing track resources"
        ));
    }

    std::string trackName() const override { return "ML Systems & Inference Optimization"; }

    std::string systemPrompt() const override {
        return "You are a Staff ML Infrastructure Engineer specializing in high-throughput "
               "LLM serving (vLLM, TensorRT-LLM). Ask deep questions on KV-Cache, "
               "PagedAttention, Continuous Batching, Quantization (AWQ, GPTQ, FP8).";
    }

    Question getRoundQuestion(int round) const override {
        telemetryBus().notify(TelemetryEvent(
            "Polymorphism", "VTABLE",
            "MLSystemsTrack", "getRoundQuestion",
            "[VTABLE] InterviewTrack::getRoundQuestion() overridden by MLSystemsTrack | Round " + std::to_string(round)
        ));

        if (round == 1) {
            return Question{1,
                "KV-Cache VRAM Calculation",
                "def calc_kv_cache_gb(\n"
                "    layers=80, kv_heads=8, head_dim=128,\n"
                "    seq_len=8192, batch=32, bytes=2\n"
                ") -> float:\n"
                "    # 2 (K+V) * layers * kv_heads * head_dim * seq * batch * bytes\n"
                "    pass\n",
                "Calculate total KV-cache memory for batch=32 at 8K context. Why does "
                "contiguous allocation waste 60%+ GPU memory? How does PagedAttention fix it?",
                "Senior"};
        } else if (round == 2) {
            return Question{2,
                "Continuous Batching vs Static Batching",
                "# Static: wait for all sequences to finish before new batch\n"
                "# Continuous: insert new requests at iteration level\n",
                "Explain how iteration-level continuous batching in vLLM/Orca achieves "
                "higher throughput. What is the scheduling algorithm?",
                "Senior"};
        } else {
            return Question{3,
                "Speculative Decoding & Quantization",
                "# Draft model: small 1B model generates k tokens\n"
                "# Target model: large 70B verifies in single forward pass\n",
                "When does speculative decoding fail to provide speedups? "
                "Compare FP8 vs INT4 AWQ quantization accuracy-throughput trade-offs.",
                "Senior"};
        }
    }

    EvaluationResult evaluateSubmission(int round, const std::string& code) override {
        telemetryBus().notify(TelemetryEvent(
            "Polymorphism", "VTABLE",
            "MLSystemsTrack", "evaluateSubmission",
            "[VTABLE] InterviewTrack::evaluateSubmission() overridden by MLSystemsTrack"
        ));

        RoundScore scores;
        bool mentionsKV    = code.find("KV") != std::string::npos || code.find("cache") != std::string::npos;
        bool mentionsPaged = code.find("Paged") != std::string::npos || code.find("vLLM") != std::string::npos;
        scores.codeCorrectness   = mentionsKV ? 8.8 : 6.5;
        scores.systemScalability = mentionsPaged ? 9.2 : 7.0;
        scores.mathematicalDepth = mentionsKV ? 8.5 : 6.0;
        scores.edgeCaseHandling  = code.length() > 80 ? 8.0 : 6.5;
        scores.communication     = code.length() > 40 ? 8.5 : 7.0;

        bool finished = (round >= 3);
        std::string followUp = "";
        if (!finished) {
            auto next = getRoundQuestion(round + 1);
            followUp = next.formatted();
        }
        return EvaluationResult{round, scores,
            "Excellent systems-level understanding of inference pipelines.", followUp, finished};
    }
};

// ============================================================================
// TrackFactory - Factory Pattern
// Returns std::unique_ptr<InterviewTrack> for runtime polymorphism
// ============================================================================
class TrackFactory {
public:
    static std::unique_ptr<InterviewTrack> createTrack(int trackId) {
        std::unique_ptr<InterviewTrack> track;

        switch (trackId) {
            case 1: track = std::make_unique<LLMTransformersTrack>(); break;
            case 2: track = std::make_unique<AdvancedRAGTrack>(); break;
            case 3: track = std::make_unique<AIAgentsTrack>(); break;
            case 4: track = std::make_unique<MLSystemsTrack>(); break;
            default: track = std::make_unique<LLMTransformersTrack>(); break;
        }

        // Emit factory creation telemetry
        std::ostringstream oss;
        oss << "[CTOR] TrackFactory::createTrack(" << trackId
            << ") -> std::unique_ptr<" << track->trackName() << "> @ 0x"
            << std::hex << reinterpret_cast<uintptr_t>(track.get());

        telemetryBus().notify(TelemetryEvent(
            "Factory", "CTOR",
            "TrackFactory", "createTrack",
            oss.str()
        ));

        return track;
    }
};

} // namespace interviewprep
