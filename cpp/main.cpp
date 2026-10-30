/*============================================================================
 * main.cpp - Entry Point for AI Engineer Interview Prep (C++17 OOP)
 * Supports two modes:
 *   1. Interactive Console Mode (stdin/stdout)
 *   2. JSON IPC Mode (--json flag) for bridge with Node.js server.js
 *
 * Usage:
 *   ./interview_engine                     # Interactive console
 *   ./interview_engine --json              # JSON IPC mode (reads JSON from stdin)
 *
 * JSON IPC Protocol:
 *   Input:  {"action":"start","trackId":1,"candidate":"Nitin","difficulty":"Senior"}
 *   Input:  {"action":"answer","text":"..."}
 *   Output: {"type":"question","round":1,"content":"...","track":"..."}
 *   Output: {"type":"result","round":3,"finished":true,"scorecard":{...}}
 *============================================================================*/

#include <iostream>
#include <string>
#include <sstream>
#include <cstring>
#include "Evaluator.hpp"

using namespace interviewprep;

// ---------------------------------------------------------------------------
// Simple JSON helpers (no external library needed for this mini-project)
// ---------------------------------------------------------------------------
std::string jsonEscape(const std::string& s) {
    std::string out;
    out.reserve(s.size() + 20);
    for (char c : s) {
        switch (c) {
            case '"':  out += "\\\""; break;
            case '\\': out += "\\\\"; break;
            case '\n': out += "\\n"; break;
            case '\r': out += "\\r"; break;
            case '\t': out += "\\t"; break;
            default:   out += c;
        }
    }
    return out;
}

std::string extractJsonString(const std::string& json, const std::string& key) {
    std::string search = "\"" + key + "\":\"";
    auto pos = json.find(search);
    if (pos == std::string::npos) return "";
    pos += search.size();
    auto end = json.find('"', pos);
    if (end == std::string::npos) return "";
    return json.substr(pos, end - pos);
}

int extractJsonInt(const std::string& json, const std::string& key) {
    std::string search = "\"" + key + "\":";
    auto pos = json.find(search);
    if (pos == std::string::npos) return 1;
    pos += search.size();
    while (pos < json.size() && json[pos] == ' ') pos++;
    std::string num;
    while (pos < json.size() && (json[pos] >= '0' && json[pos] <= '9')) {
        num += json[pos++];
    }
    return num.empty() ? 1 : std::stoi(num);
}

// ---------------------------------------------------------------------------
// JSON IPC Mode
// ---------------------------------------------------------------------------
void runJsonMode() {
    std::unique_ptr<Evaluator> evaluator;
    std::string line;

    // Subscribe telemetry to output JSON events
    telemetryBus().subscribe([](const TelemetryEvent& evt) {
        std::cout << "{\"type\":\"telemetry\",\"domain\":\""
                  << jsonEscape(evt.domain) << "\",\"badge\":\""
                  << jsonEscape(evt.badge) << "\",\"component\":\""
                  << jsonEscape(evt.component) << "\",\"method\":\""
                  << jsonEscape(evt.method) << "\",\"message\":\""
                  << jsonEscape(evt.message) << "\",\"timestamp\":\""
                  << evt.timestamp << "\"}" << std::endl;
    });

    while (std::getline(std::cin, line)) {
        if (line.empty()) continue;

        std::string action = extractJsonString(line, "action");

        if (action == "start") {
            int trackId = extractJsonInt(line, "trackId");
            std::string candidate = extractJsonString(line, "candidate");
            std::string difficulty = extractJsonString(line, "difficulty");
            if (candidate.empty()) candidate = "Candidate";
            if (difficulty.empty()) difficulty = "Senior";

            evaluator = std::make_unique<Evaluator>(trackId, candidate, 3, difficulty);
            auto q = evaluator->start();

            std::cout << "{\"type\":\"question\",\"round\":1,\"track\":\""
                      << jsonEscape(evaluator->trackName())
                      << "\",\"content\":\"" << jsonEscape(q.formatted())
                      << "\"}" << std::endl;

        } else if (action == "answer" && evaluator) {
            std::string text = extractJsonString(line, "text");
            auto result = evaluator->submitAnswer(text);

            if (result.isFinished) {
                std::cout << "{\"type\":\"result\",\"round\":" << result.round
                          << ",\"finished\":true,\"feedback\":\""
                          << jsonEscape(result.feedback)
                          << "\",\"scorecard\":" << evaluator->scorecardJSON()
                          << "}" << std::endl;
            } else {
                std::cout << "{\"type\":\"question\",\"round\":" << (result.round + 1)
                          << ",\"content\":\"" << jsonEscape(result.followUpQuestion)
                          << "\",\"feedback\":\"" << jsonEscape(result.feedback)
                          << "\"}" << std::endl;
            }

        } else if (action == "quit") {
            break;
        }
    }
}

// ---------------------------------------------------------------------------
// Interactive Console Mode
// ---------------------------------------------------------------------------
void runInteractiveMode() {
    // Console telemetry listener
    telemetryBus().subscribe([](const TelemetryEvent& evt) {
        std::cout << "  [" << evt.badge << "] " << evt.message << "\n";
    });

    std::cout << "================================================================\n"
              << "  AI ENGINEER INTERVIEW PREP (C++17 OOP Engine)\n"
              << "  Demonstrating: Abstraction | Inheritance | Polymorphism\n"
              << "                 Encapsulation | Templates | Operator Overloading\n"
              << "================================================================\n\n";

    std::cout << "Select Interview Track:\n"
              << "  1. LLMs & Transformers (PyTorch, Attention, LoRA)\n"
              << "  2. Advanced RAG & Vector Retrieval (RRF, Chunking)\n"
              << "  3. AI Agents & Function Calling (ReAct, Evals)\n"
              << "  4. ML Systems & Inference (vLLM, KV Cache)\n"
              << "Choice (1-4): ";

    int trackId;
    std::cin >> trackId;
    std::cin.ignore();
    if (trackId < 1 || trackId > 4) trackId = 1;

    std::cout << "\nDifficulty Level:\n"
              << "  1. Junior AI Engineer\n"
              << "  2. Mid-Level AI Engineer\n"
              << "  3. Senior AI Engineer\n"
              << "Level (1-3): ";

    int level;
    std::cin >> level;
    std::cin.ignore();
    std::string difficulty = "Senior";
    if (level == 1) difficulty = "Junior";
    else if (level == 2) difficulty = "Mid-Level";

    std::cout << "\nCandidate Name: ";
    std::string name;
    std::getline(std::cin, name);
    if (name.empty()) name = "Candidate";

    std::cout << "\n";

    // Create evaluator using Factory + polymorphism
    Evaluator evaluator(trackId, name, 3, difficulty);

    // Start interview
    auto opening = evaluator.start();
    std::cout << "\n[Interviewer - Round 1]\n"
              << opening.formatted() << "\n\n";

    // Interview loop
    for (int round = 1; round <= 3; round++) {
        std::cout << name << "> ";
        std::string answer;
        std::getline(std::cin, answer);
        if (answer.empty()) answer = "I would approach this by...";

        std::cout << "\n";
        auto result = evaluator.submitAnswer(answer);

        if (result.isFinished) {
            std::cout << "\n" << evaluator.scorecard() << "\n";
        } else {
            std::cout << "\n[Interviewer - Round " << (round + 1) << "]\n"
                      << result.followUpQuestion << "\n\n";
        }
    }

    // Export transcript
    std::string filename = "interview_transcript_" + name + ".md";
    evaluator.exportTranscript(filename);
    std::cout << "\nTranscript saved to: " << filename << "\n";
}

// ---------------------------------------------------------------------------
// Main Entry Point
// ---------------------------------------------------------------------------
int main(int argc, char* argv[]) {
    std::srand(static_cast<unsigned>(std::time(nullptr)));

    bool jsonMode = false;
    for (int i = 1; i < argc; i++) {
        if (std::strcmp(argv[i], "--json") == 0) {
            jsonMode = true;
        }
    }

    if (jsonMode) {
        runJsonMode();
    } else {
        runInteractiveMode();
    }

    return 0;
}
