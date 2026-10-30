/*============================================================================
 * Evaluator.hpp - Interview Orchestrator
 * C++17 OOP Mini-Project: AI Engineer Interview Prep
 *
 * Coordinates the interview flow: track creation, round progression,
 * answer evaluation, scorecard aggregation, and transcript export.
 *============================================================================*/
#pragma once

#include "Tracks.hpp"

namespace interviewprep {

class Evaluator {
private:
    std::unique_ptr<InterviewTrack> track_;
    CandidateSession session_;

public:
    Evaluator(int trackId, const std::string& candidateName,
              int maxRounds = 3, const std::string& difficulty = "Senior")
        : track_(TrackFactory::createTrack(trackId)),
          session_(candidateName, track_->trackName(), maxRounds, difficulty)
    {
        telemetryBus().notify(TelemetryEvent(
            "Engine", "CTOR",
            "Evaluator", "constructor",
            "[CTOR] Evaluator initialized | Track: " + track_->trackName() +
            " | Candidate: " + candidateName
        ));
    }

    ~Evaluator() {
        telemetryBus().notify(TelemetryEvent(
            "Engine", "DTOR",
            "Evaluator", "destructor",
            "[DTOR] ~Evaluator() -> cleanup"
        ));
    }

    // Get the opening question for round 1
    Question start() {
        session_.advanceRound();
        auto q = track_->getRoundQuestion(1);
        session_.addToLog("**Interviewer (Round 1):** " + q.formatted());
        return q;
    }

    // Submit an answer and get back evaluation + next question (or final scorecard)
    EvaluationResult submitAnswer(const std::string& answer) {
        int round = session_.currentRound();
        session_.addToLog("**" + session_.name() + " (Round " +
                          std::to_string(round) + "):** " + answer);

        auto result = track_->evaluateSubmission(round, answer);

        // Add round score to scorecard using operator+
        session_.scorecard() + result.scores;

        telemetryBus().notify(TelemetryEvent(
            "Evaluation", "OP+",
            "Scorecard", "operator+",
            "[OP+] Scorecard::operator+(Round " + std::to_string(round) +
            " Score) -> overall " +
            std::to_string(session_.scorecard().overallScore()).substr(0, 4) + "/10"
        ));

        if (result.isFinished) {
            session_.markCompleted();
            session_.addToLog("---\n## Final Evaluation\n");
            std::ostringstream sc;
            sc << session_.scorecard();
            session_.addToLog(sc.str());

            telemetryBus().notify(TelemetryEvent(
                "Scorecard", "FINAL",
                "Evaluator", "submitAnswer",
                "Interview complete. Verdict: " + session_.scorecard().verdict() +
                " | Overall: " + std::to_string(session_.scorecard().overallScore()).substr(0, 4)
            ));
        } else {
            session_.advanceRound();
            auto nextQ = track_->getRoundQuestion(session_.currentRound());
            result.followUpQuestion = nextQ.formatted();
            session_.addToLog("**Interviewer (Round " +
                              std::to_string(session_.currentRound()) + "):** " +
                              nextQ.formatted());
        }

        return result;
    }

    // Accessors
    const CandidateSession& session() const { return session_; }
    const Scorecard& scorecard() const { return session_.scorecard(); }
    std::string trackName() const { return track_->trackName(); }

    // Export transcript
    void exportTranscript(const std::string& filename) const {
        session_.exportTranscript(filename);
    }

    // Get scorecard as JSON-like string for IPC
    std::string scorecardJSON() const {
        const auto& sc = session_.scorecard();
        std::ostringstream oss;
        oss << std::fixed << std::setprecision(1);
        oss << "{"
            << "\"overall\":" << sc.overallScore()
            << ",\"codeCorrectness\":" << sc.avgCodeCorrectness()
            << ",\"systemScalability\":" << sc.avgSystemScalability()
            << ",\"mathematicalDepth\":" << sc.avgMathematicalDepth()
            << ",\"edgeCaseHandling\":" << sc.avgEdgeCaseHandling()
            << ",\"communication\":" << sc.avgCommunication()
            << ",\"verdict\":\"" << sc.verdict() << "\""
            << ",\"candidate\":\"" << sc.candidateName() << "\""
            << ",\"track\":\"" << sc.trackName() << "\""
            << ",\"rounds\":" << sc.roundCount()
            << "}";
        return oss.str();
    }
};

} // namespace interviewprep
