/*============================================================================
 * InterviewEngine.hpp - Abstract Base Class & Core Types
 * C++17 OOP Mini-Project: AI Engineer Interview Prep
 *
 * OOP Concepts Demonstrated:
 *   - Abstraction: Pure virtual InterviewTrack base class
 *   - Encapsulation: Private state in CandidateSession & Scorecard
 *   - Operator Overloading: Scorecard::operator+ and operator<<
 *   - Factory Pattern: TrackFactory with std::unique_ptr<InterviewTrack>
 *   - const correctness, Rule of Five, smart pointers
 *============================================================================*/
#pragma once

#include <string>
#include <vector>
#include <map>
#include <memory>
#include <sstream>
#include <numeric>
#include <iomanip>
#include <fstream>
#include <cstdlib>
#include <ctime>
#include "TelemetryBus.hpp"

namespace interviewprep {

// ---------------------------------------------------------------------------
// Question: payload returned by each track for a given round
// ---------------------------------------------------------------------------
struct Question {
    int round;
    std::string title;
    std::string codeSnippet;   // Python/PyTorch code block content
    std::string taskPrompt;    // The task the candidate must answer
    std::string difficulty;    // "Junior" | "Mid-Level" | "Senior"

    std::string formatted() const {
        std::ostringstream oss;
        oss << "[" << title << "]\n";
        if (!codeSnippet.empty()) {
            oss << "```python\n" << codeSnippet << "\n```\n";
        }
        oss << "**Task:** " << taskPrompt;
        return oss.str();
    }
};

// ---------------------------------------------------------------------------
// RoundScore: a single round's 5-dimension evaluation
// ---------------------------------------------------------------------------
struct RoundScore {
    double codeCorrectness    = 0.0;
    double systemScalability  = 0.0;
    double mathematicalDepth  = 0.0;
    double edgeCaseHandling   = 0.0;
    double communication      = 0.0;

    double average() const {
        return (codeCorrectness + systemScalability + mathematicalDepth
                + edgeCaseHandling + communication) / 5.0;
    }
};

// ---------------------------------------------------------------------------
// EvaluationResult: returned after evaluating a candidate's submission
// ---------------------------------------------------------------------------
struct EvaluationResult {
    int round;
    RoundScore scores;
    std::string feedback;
    std::string followUpQuestion;  // empty if final round
    bool isFinished;
};

// ---------------------------------------------------------------------------
// Scorecard (Encapsulation + Operator Overloading)
// Private round scores, public getters, operator+ and operator<<
// ---------------------------------------------------------------------------
class Scorecard {
private:
    std::vector<RoundScore> roundScores_;
    std::string candidateName_;
    std::string trackName_;
    std::string verdict_;

    void computeVerdict() {
        double overall = overallScore();
        if (overall >= 8.5)      verdict_ = "STRONG HIRE";
        else if (overall >= 7.0) verdict_ = "HIRE";
        else if (overall >= 5.5) verdict_ = "LEAN HIRE";
        else                     verdict_ = "NO HIRE";
    }

public:
    Scorecard() = default;
    Scorecard(const std::string& candidate, const std::string& track)
        : candidateName_(candidate), trackName_(track) {}

    // --- Getters (const-correct) ---
    const std::string& candidateName() const { return candidateName_; }
    const std::string& trackName() const { return trackName_; }
    const std::string& verdict() const { return verdict_; }
    size_t roundCount() const { return roundScores_.size(); }

    double overallScore() const {
        if (roundScores_.empty()) return 0.0;
        double total = 0.0;
        for (const auto& rs : roundScores_) {
            total += rs.average();
        }
        return total / static_cast<double>(roundScores_.size());
    }

    // Per-dimension averages across all rounds
    double avgCodeCorrectness() const {
        if (roundScores_.empty()) return 0.0;
        double s = 0; for (auto& r : roundScores_) s += r.codeCorrectness;
        return s / roundScores_.size();
    }
    double avgSystemScalability() const {
        if (roundScores_.empty()) return 0.0;
        double s = 0; for (auto& r : roundScores_) s += r.systemScalability;
        return s / roundScores_.size();
    }
    double avgMathematicalDepth() const {
        if (roundScores_.empty()) return 0.0;
        double s = 0; for (auto& r : roundScores_) s += r.mathematicalDepth;
        return s / roundScores_.size();
    }
    double avgEdgeCaseHandling() const {
        if (roundScores_.empty()) return 0.0;
        double s = 0; for (auto& r : roundScores_) s += r.edgeCaseHandling;
        return s / roundScores_.size();
    }
    double avgCommunication() const {
        if (roundScores_.empty()) return 0.0;
        double s = 0; for (auto& r : roundScores_) s += r.communication;
        return s / roundScores_.size();
    }

    // --- Operator Overloading: + to add a round score ---
    Scorecard& operator+(const RoundScore& rs) {
        roundScores_.push_back(rs);
        computeVerdict();

        // Emit telemetry for operator overloading
        telemetryBus().notify(TelemetryEvent(
            "Scorecard", "OP+",
            "Scorecard", "operator+",
            "Scorecard::operator+(RoundScore) -> " +
            std::to_string(overallScore()).substr(0, 4) + "/10"
        ));
        return *this;
    }

    // --- Operator Overloading: << to stream formatted scorecard ---
    friend std::ostream& operator<<(std::ostream& os, const Scorecard& sc) {
        os << "================================================================\n"
           << "  SENIOR AI ENGINEER - FINAL EVALUATION SCORECARD\n"
           << "================================================================\n"
           << "  Candidate:  " << sc.candidateName_ << "\n"
           << "  Domain:     " << sc.trackName_ << "\n"
           << "  Rounds:     " << sc.roundScores_.size() << "\n"
           << "  Overall:    " << std::fixed << std::setprecision(1)
           << sc.overallScore() << " / 10.0\n"
           << "  Verdict:    " << sc.verdict_ << "\n"
           << "----------------------------------------------------------------\n"
           << "  DIMENSION BREAKDOWN:\n"
           << "    Code Correctness:    " << std::setprecision(1) << sc.avgCodeCorrectness() << "/10\n"
           << "    System Scalability:  " << sc.avgSystemScalability() << "/10\n"
           << "    Mathematical Depth:  " << sc.avgMathematicalDepth() << "/10\n"
           << "    Edge Case Handling:  " << sc.avgEdgeCaseHandling() << "/10\n"
           << "    Communication:       " << sc.avgCommunication() << "/10\n"
           << "================================================================\n";
        return os;
    }
};

// ---------------------------------------------------------------------------
// CandidateSession (Encapsulation)
// Tracks the interview state for a single candidate session
// ---------------------------------------------------------------------------
class CandidateSession {
private:
    std::string name_;
    std::string difficulty_;
    int currentRound_;
    int maxRounds_;
    bool completed_;
    std::vector<std::string> conversationLog_;
    Scorecard scorecard_;

public:
    CandidateSession(const std::string& name, const std::string& track,
                     int maxRounds = 3, const std::string& difficulty = "Senior")
        : name_(name), difficulty_(difficulty),
          currentRound_(0), maxRounds_(maxRounds), completed_(false),
          scorecard_(name, track)
    {
        telemetryBus().notify(TelemetryEvent(
            "Session", "CTOR",
            "CandidateSession", "constructor",
            "CandidateSession(\"" + name + "\") constructed | Max rounds: " +
            std::to_string(maxRounds) + " | Difficulty: " + difficulty
        ));
    }

    ~CandidateSession() {
        telemetryBus().notify(TelemetryEvent(
            "Session", "DTOR",
            "CandidateSession", "destructor",
            "~CandidateSession(\"" + name_ + "\") destroyed | Rounds completed: " +
            std::to_string(currentRound_)
        ));
    }

    // --- Getters ---
    const std::string& name() const { return name_; }
    const std::string& difficulty() const { return difficulty_; }
    int currentRound() const { return currentRound_; }
    int maxRounds() const { return maxRounds_; }
    bool isCompleted() const { return completed_; }
    Scorecard& scorecard() { return scorecard_; }
    const Scorecard& scorecard() const { return scorecard_; }

    // --- Setters ---
    void advanceRound() { currentRound_++; }
    void markCompleted() { completed_ = true; }

    void addToLog(const std::string& entry) {
        conversationLog_.push_back(entry);
    }

    // Export conversation to markdown file
    void exportTranscript(const std::string& filename) const {
        std::ofstream out(filename);
        out << "# AI Engineer Technical Interview Transcript\n"
            << "**Candidate:** " << name_ << "\n"
            << "**Difficulty:** " << difficulty_ << "\n"
            << "**Rounds:** " << currentRound_ << "/" << maxRounds_ << "\n\n"
            << "---\n\n";
        for (const auto& line : conversationLog_) {
            out << line << "\n\n";
        }
        out << "---\n*Generated by Interview Prep C++17 OOP Engine*\n";
    }

    std::string getConversationHistory() const {
        std::ostringstream oss;
        for (const auto& l : conversationLog_) {
            oss << l << "\n";
        }
        return oss.str();
    }
};

// ---------------------------------------------------------------------------
// InterviewTrack - ABSTRACT BASE CLASS (Pure Virtual Interface)
// Derived tracks must implement getRoundQuestion and evaluateSubmission.
// Virtual destructor ensures correct cleanup through base pointers.
// ---------------------------------------------------------------------------
class InterviewTrack {
public:
    virtual ~InterviewTrack() {
        telemetryBus().notify(TelemetryEvent(
            "Track", "DTOR",
            "InterviewTrack", "~InterviewTrack()",
            "Base class virtual destructor invoked for derived track"
        ));
    }

    // Pure virtual: must be overridden by each concrete track
    virtual std::string trackName() const = 0;
    virtual std::string systemPrompt() const = 0;
    virtual Question getRoundQuestion(int round) const = 0;
    virtual EvaluationResult evaluateSubmission(int round, const std::string& code) = 0;
};

} // namespace interviewprep
