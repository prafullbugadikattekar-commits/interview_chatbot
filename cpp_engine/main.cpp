/*============================================================================
 * main.cpp — IntervueAI C++17 OOP Interview Bot (Console Entrypoint)
 *
 * Demonstrates:
 *   - Abstraction: IInterviewer interface
 *   - Encapsulation: Candidate and InterviewSession private states
 *   - Inheritance: TechnicalInterviewer and BehavioralInterviewer
 *   - Runtime Polymorphism: std::unique_ptr<IInterviewer> dynamic dispatch
 *   - Compile-Time Polymorphism: operator+= and operator<< overloads
 *   - Templates: QuestionRepository<std::string>
 *   - Exception Handling: try-catch with InterviewSessionException
 *
 * Compile:
 *   g++ -std=c++17 cpp_engine/main.cpp -o cpp_engine/interview_bot.exe
 *============================================================================*/

#include "InterviewEngine.hpp"
#include <iostream>
#include <string>
#include <memory>
#include <limits>

using namespace intervue;

int main() {
    std::cout << "\n======================================================\n";
    std::cout << "         IntervueAI — C++17 Mock Interview Bot         \n";
    std::cout << "        Object-Oriented Software Systems Project       \n";
    std::cout << "======================================================\n\n";

    try {
        std::string name, role, level;
        std::cout << "Enter your name: ";
        std::getline(std::cin, name);
        if (name.empty()) name = "Alex";

        std::cout << "Enter target role (e.g., Software Engineer, Data Scientist, Web Dev): ";
        std::getline(std::cin, role);
        if (role.empty()) role = "Software Engineer (DSA)";

        std::cout << "Enter experience level (Fresher / Junior / Mid-Level / Senior): ";
        std::getline(std::cin, level);
        if (level.empty()) level = "Mid-Level";

        std::cout << "\nChoose Interview Track:\n";
        std::cout << "  1. Technical Interviewer (DSA, Architecture, Concurrency)\n";
        std::cout << "  2. Behavioral Interviewer (Leadership, STAR Method, Conflict)\n";
        std::cout << "Select track (1 or 2): ";

        int trackChoice = 1;
        if (!(std::cin >> trackChoice)) {
            trackChoice = 1;
            std::cin.clear();
            std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
        } else {
            std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
        }

        // --- POLYMORPHISM: Base Interface Pointer bound to Derived Object ---
        std::unique_ptr<IInterviewer> interviewer;
        if (trackChoice == 2) {
            interviewer = std::make_unique<BehavioralInterviewer>();
        } else {
            interviewer = std::make_unique<TechnicalInterviewer>(role);
        }

        // --- ENCAPSULATION: Candidate & InterviewSession ---
        Candidate candidate(name, role, level);
        const int totalRounds = 3;
        InterviewSession session(candidate, std::move(interviewer), totalRounds);

        session.start();

        std::cout << "\n------------------------------------------------------\n";
        std::cout << "  Starting " << session.getInterviewer().getTrackName() << "\n";
        std::cout << "  Candidate: " << session.getCandidate().getName() << " | Role: " << session.getCandidate().getTargetRole() << "\n";
        std::cout << "------------------------------------------------------\n\n";

        for (int round = 1; round <= totalRounds; ++round) {
            std::string question = session.getNextQuestion();

            std::cout << "[Round " << round << " of " << totalRounds << "]\n";
            std::cout << "Interviewer: " << question << "\n\n";
            std::cout << "Your Answer: ";

            std::string answer;
            std::getline(std::cin, answer);

            std::string feedback;
            double score = session.submitAnswer(answer, feedback);

            std::cout << "\n--> Evaluation (Score: " << std::fixed << std::setprecision(1) << score << " / 10.0)\n";
            std::cout << "--> Feedback: " << feedback << "\n";
            std::cout << "------------------------------------------------------\n\n";
        }

        // --- COMPILE-TIME POLYMORPHISM: Stream Scorecard via operator<< ---
        std::cout << session.getScorecard();

        // --- TEMPLATES: QuestionRepository Demonstration ---
        QuestionRepository<std::string> repo;
        repo.add("System Architecture");
        repo.add("Algorithm Efficiency");
        std::cout << "\n[System Info] Total Evaluation Rubric Items in Repository: " << repo.count() << "\n\n";

    } catch (const InterviewSessionException& ex) {
        std::cerr << "\n[Session Error (" << ex.getErrorCode() << ")]: " << ex.what() << "\n";
        return 1;
    } catch (const std::exception& ex) {
        std::cerr << "\n[Unexpected Error]: " << ex.what() << "\n";
        return 1;
    }

    return 0;
}
