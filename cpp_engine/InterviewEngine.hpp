/*============================================================================
 * InterviewEngine.hpp — IntervueAI C++17 OOP Interview Bot Engine
 *
 * This engine models the Object-Oriented architecture of the AI Mock Interview
 * Bot itself, demonstrating the core pillars of Object-Oriented Programming:
 *
 * 1. ABSTRACTION:
 *    - Pure virtual interface `IInterviewer` defining interview contracts.
 * 2. ENCAPSULATION:
 *    - `Candidate` and `InterviewSession` protect internal state with private
 *      fields, strict validation, and exception handling.
 * 3. INHERITANCE:
 *    - `TechnicalInterviewer` and `BehavioralInterviewer` inherit from `IInterviewer`.
 * 4. RUNTIME POLYMORPHISM:
 *    - Virtual dynamic dispatch via base interface pointers (vtable/vptr).
 * 5. COMPILE-TIME POLYMORPHISM & TEMPLATES:
 *    - Operator overloading (`operator+=`, `operator<<`) and `QuestionRepository<T>`.
 *============================================================================*/

#pragma once

#include <iostream>
#include <string>
#include <vector>
#include <memory>
#include <map>
#include <sstream>
#include <iomanip>
#include <algorithm>
#include <stdexcept>
#include <numeric>

namespace intervue {

// ============================================================================
// EXCEPTION HANDLING: Custom Domain Exception
// ============================================================================
class InterviewSessionException : public std::runtime_error {
private:
    std::string errorCode_;

public:
    InterviewSessionException(const std::string& msg, const std::string& code = "SESSION_ERR")
        : std::runtime_error(msg), errorCode_(code) {}

    const std::string& getErrorCode() const { return errorCode_; }
};

// ============================================================================
// ENCAPSULATION: Candidate Class
// Stores candidate information, target role, and round scores privately.
// ============================================================================
class Candidate {
private:
    std::string name_;
    std::string targetRole_;
    std::string experienceLevel_;
    std::vector<double> roundScores_;
    std::vector<std::string> answerHistory_;

public:
    Candidate(const std::string& name = "Candidate",
              const std::string& role = "Software Engineer",
              const std::string& level = "Mid-Level")
        : name_(name), targetRole_(role), experienceLevel_(level) {
        if (name_.empty()) name_ = "Candidate";
    }

    // --- Getters (Const Correctness) ---
    const std::string& getName() const { return name_; }
    const std::string& getTargetRole() const { return targetRole_; }
    const std::string& getExperienceLevel() const { return experienceLevel_; }
    const std::vector<double>& getRoundScores() const { return roundScores_; }
    const std::vector<std::string>& getAnswerHistory() const { return answerHistory_; }

    // --- Setters with Validation ---
    void setTargetRole(const std::string& role) {
        if (!role.empty()) targetRole_ = role;
    }

    void setExperienceLevel(const std::string& level) {
        if (!level.empty()) experienceLevel_ = level;
    }

    // Record score for a round (Validated between 0.0 and 10.0)
    void recordAnswer(const std::string& answer, double score) {
        if (score < 0.0) score = 0.0;
        if (score > 10.0) score = 10.0;
        answerHistory_.push_back(answer);
        roundScores_.push_back(score);
    }

    // Calculate Average Score
    double getAverageScore() const {
        if (roundScores_.empty()) return 0.0;
        double sum = std::accumulate(roundScores_.begin(), roundScores_.end(), 0.0);
        return sum / roundScores_.size();
    }
};

// ============================================================================
// ABSTRACTION: Pure Virtual Interface — IInterviewer
// Defines the contract that every specialized interviewer role MUST implement.
// ============================================================================
class IInterviewer {
public:
    virtual ~IInterviewer() = default;

    // Pure virtual methods (Abstraction)
    virtual std::string getTrackName() const = 0;
    virtual std::string getRoleFocus() const = 0;
    virtual std::string generateQuestion(int round, const std::string& previousAnswer) = 0;
    virtual double evaluateResponse(const std::string& question,
                                    const std::string& answer,
                                    std::string& outFeedback) = 0;
};

// ============================================================================
// UTILITY: ScoreEvaluator
// Encapsulates the algorithmic grading rubric.
// ============================================================================
class ScoreEvaluator {
public:
    static double grade(const std::string& answer,
                        const std::vector<std::string>& keywords,
                        std::string& feedback) {
        if (answer.empty()) {
            feedback = "No answer provided. Candidate skipped or did not respond.";
            return 0.0;
        }

        std::string lower = answer;
        std::transform(lower.begin(), lower.end(), lower.begin(), ::tolower);

        // Count words for depth
        std::stringstream ss(answer);
        std::string word;
        int wordCount = 0;
        while (ss >> word) wordCount++;

        double score = 5.0; // Base score for attempting

        if (wordCount >= 50) score += 2.5;
        else if (wordCount >= 25) score += 1.5;
        else if (wordCount >= 10) score += 0.5;

        int keywordHits = 0;
        for (const auto& kw : keywords) {
            std::string lkw = kw;
            std::transform(lkw.begin(), lkw.end(), lkw.begin(), ::tolower);
            if (lower.find(lkw) != std::string::npos) {
                keywordHits++;
            }
        }

        if (keywordHits >= 3) score += 2.5;
        else if (keywordHits >= 1) score += 1.5;

        // Cap score at 10.0
        score = std::min(10.0, std::max(2.0, score));

        if (score >= 9.0) {
            feedback = "Outstanding response! Thorough technical grounding and clear real-world trade-off analysis.";
        } else if (score >= 7.5) {
            feedback = "Strong answer covering the essential principles with good structure.";
        } else if (score >= 6.0) {
            feedback = "Good foundation. Consider expanding on edge cases, system trade-offs, and scalability.";
        } else {
            feedback = "Adequate effort, but lacked depth and concrete architectural details.";
        }

        return score;
    }
};

// ============================================================================
// INHERITANCE & POLYMORPHISM: TechnicalInterviewer
// Specializes in DSA, system design, coding, and architecture questions.
// ============================================================================
class TechnicalInterviewer : public IInterviewer {
private:
    std::string technicalDomain_;
    std::vector<std::string> questionBank_;

public:
    explicit TechnicalInterviewer(const std::string& domain = "Software Engineering & DSA")
        : technicalDomain_(domain) {
        questionBank_ = {
            "Can you explain how a Hash Map resolves collisions, and compare separate chaining with open addressing?",
            "How would you design a distributed caching layer (like Redis) to handle 100,000 requests per second?",
            "What is the difference between concurrency and parallelism? How do threads avoid race conditions?",
            "Explain the CAP theorem and describe how you would choose between consistency and availability.",
            "Walk me through a time you identified a critical performance bottleneck in code and how you resolved it."
        };
    }

    std::string getTrackName() const override {
        return "Technical Assessment Track";
    }

    std::string getRoleFocus() const override {
        return technicalDomain_;
    }

    std::string generateQuestion(int round, const std::string& /*previousAnswer*/) override {
        if (round <= 0) round = 1;
        size_t idx = static_cast<size_t>(round - 1) % questionBank_.size();
        return questionBank_[idx];
    }

    double evaluateResponse(const std::string& /*question*/,
                            const std::string& answer,
                            std::string& outFeedback) override {
        std::vector<std::string> technicalKeywords = {
            "complexity", "memory", "cache", "concurrency", "thread",
            "latency", "scalability", "lock", "mutex", "hash", "tradeoff"
        };
        return ScoreEvaluator::grade(answer, technicalKeywords, outFeedback);
    }
};

// ============================================================================
// INHERITANCE & POLYMORPHISM: BehavioralInterviewer
// Specializes in leadership, conflict resolution, and the STAR framework.
// ============================================================================
class BehavioralInterviewer : public IInterviewer {
private:
    std::vector<std::string> behavioralQuestions_;

public:
    BehavioralInterviewer() {
        behavioralQuestions_ = {
            "Tell me about a time you had a technical disagreement with a colleague. How did you resolve it?",
            "Describe a situation where a critical project deadline was at risk. What actions did you take?",
            "Can you share an experience where you made a mistake or pushed a bug to production? How did you respond?",
            "How do you handle ambiguous requirements when kicking off a new feature or project?",
            "Tell me about a project or achievement you are most proud of in your engineering career."
        };
    }

    std::string getTrackName() const override {
        return "Behavioral & Leadership Track (STAR Method)";
    }

    std::string getRoleFocus() const override {
        return "Culture, Teamwork & Leadership";
    }

    std::string generateQuestion(int round, const std::string& /*previousAnswer*/) override {
        if (round <= 0) round = 1;
        size_t idx = static_cast<size_t>(round - 1) % behavioralQuestions_.size();
        return behavioralQuestions_[idx];
    }

    double evaluateResponse(const std::string& /*question*/,
                            const std::string& answer,
                            std::string& outFeedback) override {
        std::vector<std::string> behavioralKeywords = {
            "situation", "task", "action", "result", "team", "learned",
            "communicated", "stakeholders", "outcome", "feedback", "resolved"
        };
        return ScoreEvaluator::grade(answer, behavioralKeywords, outFeedback);
    }
};

// ============================================================================
// TEMPLATES: QuestionRepository<T>
// Generic question container demonstrating template metaprogramming.
// ============================================================================
template <typename T>
class QuestionRepository {
private:
    std::vector<T> items_;

public:
    void add(const T& item) {
        items_.push_back(item);
    }

    size_t count() const {
        return items_.size();
    }

    const T& get(size_t index) const {
        if (index >= items_.size()) {
            throw InterviewSessionException("Index out of bounds in QuestionRepository", "OUT_OF_BOUNDS");
        }
        return items_[index];
    }
};

// ============================================================================
// COMPILE-TIME POLYMORPHISM: Operator Overloading in Scorecard
// ============================================================================
class Scorecard {
private:
    std::string candidateName_;
    std::string role_;
    double cumulativeScore_{0.0};
    int totalRounds_{0};

public:
    Scorecard(const std::string& name = "", const std::string& role = "")
        : candidateName_(name), role_(role) {}

    // Operator+= overloading: accumulate score
    Scorecard& operator+=(double score) {
        cumulativeScore_ += score;
        totalRounds_++;
        return *this;
    }

    double getAverage() const {
        return totalRounds_ > 0 ? (cumulativeScore_ / totalRounds_) : 0.0;
    }

    int getTotalRounds() const {
        return totalRounds_;
    }

    // Operator<< overloading: stream output for reports
    friend std::ostream& operator<<(std::ostream& os, const Scorecard& sc) {
        os << "\n======================================================\n"
           << "                 INTERVIEW SCORECARD                  \n"
           << "======================================================\n"
           << "Candidate:       " << sc.candidateName_ << "\n"
           << "Target Role:     " << sc.role_ << "\n"
           << "Rounds Assessed: " << sc.totalRounds_ << "\n"
           << "Average Score:   " << std::fixed << std::setprecision(1)
           << sc.getAverage() << " / 10.0\n";

        if (sc.getAverage() >= 9.0) os << "Verdict:         Strong Hire (Exceptional Mastery)\n";
        else if (sc.getAverage() >= 7.5) os << "Verdict:         Hire (Solid Technical Foundation)\n";
        else if (sc.getAverage() >= 6.0) os << "Verdict:         Lean Hire / Re-evaluate Specific Areas\n";
        else os << "Verdict:         Needs Improvement\n";

        os << "======================================================\n";
        return os;
    }
};

// ============================================================================
// ENCAPSULATION & COORDINATION: InterviewSession
// Finite State Machine orchestrating candidate, interviewer, and scoring.
// ============================================================================
class InterviewSession {
public:
    enum class State { Ready, InProgress, Completed };

private:
    Candidate candidate_;
    std::unique_ptr<IInterviewer> interviewer_; // Runtime Polymorphism
    Scorecard scorecard_;
    State state_{State::Ready};
    int currentRound_{0};
    int maxRounds_{5};
    std::string lastQuestion_;

public:
    InterviewSession(const Candidate& candidate,
                     std::unique_ptr<IInterviewer> interviewer,
                     int maxRounds = 5)
        : candidate_(candidate),
          interviewer_(std::move(interviewer)),
          scorecard_(candidate.getName(), candidate.getTargetRole()),
          maxRounds_(maxRounds) {
        if (!interviewer_) {
            throw InterviewSessionException("Interviewer pointer cannot be null", "NULL_INTERVIEWER");
        }
    }

    void start() {
        if (state_ != State::Ready) {
            throw InterviewSessionException("Session already started", "INVALID_STATE");
        }
        state_ = State::InProgress;
        currentRound_ = 1;
    }

    std::string getNextQuestion(const std::string& lastAnswer = "") {
        if (state_ != State::InProgress) {
            throw InterviewSessionException("Session is not in progress", "NOT_IN_PROGRESS");
        }
        lastQuestion_ = interviewer_->generateQuestion(currentRound_, lastAnswer);
        return lastQuestion_;
    }

    double submitAnswer(const std::string& answer, std::string& feedback) {
        if (state_ != State::InProgress) {
            throw InterviewSessionException("Cannot submit answer: session inactive", "INACTIVE_SESSION");
        }

        // Evaluate using polymorphic interviewer
        double score = interviewer_->evaluateResponse(lastQuestion_, answer, feedback);

        // Update encapsulated candidate and scorecard
        candidate_.recordAnswer(answer, score);
        scorecard_ += score;

        currentRound_++;
        if (maxRounds_ > 0 && currentRound_ > maxRounds_) {
            state_ = State::Completed;
        }

        return score;
    }

    bool isFinished() const {
        return state_ == State::Completed;
    }

    const Scorecard& getScorecard() const {
        return scorecard_;
    }

    const Candidate& getCandidate() const {
        return candidate_;
    }

    const IInterviewer& getInterviewer() const {
        return *interviewer_;
    }
};

} // namespace intervue
