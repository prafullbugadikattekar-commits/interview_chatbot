#include <iostream>
#include <string>
#include <vector>
#include <memory>
#include <random>
#include <ctime>
#include <windows.h>
#include <winhttp.h>

// ============================================================================
// 1. ENCAPSULATION: GroqAPI encapsulates network communication & API credentials
// ============================================================================
class GroqAPI {
private:
    std::string apiKey;
    std::string model;

    std::string escape(const std::string& s) {
        std::string out;
        for (char c : s) {
            if (c == '\"') out += "\\\"";
            else if (c == '\\') out += "\\\\";
            else if (c == '\n') out += "\\n";
            else out += c;
        }
        return out;
    }

    std::string parseContent(const std::string& json) {
        size_t pos = json.find("\"content\": \"");
        if (pos == std::string::npos) pos = json.find("\"content\":\"");
        if (pos == std::string::npos) return json;
        pos = json.find('\"', pos + 10) + 1;
        std::string res;
        for (size_t i = pos; i < json.length() && json[i] != '\"'; ++i) {
            if (json[i] == '\\' && i + 1 < json.length()) {
                char next = json[++i];
                res += (next == 'n' ? '\n' : (next == 't' ? '\t' : next));
            } else res += json[i];
        }
        return res;
    }

    // Helper: Sends HTTP POST request to Groq API with specified model
    std::string requestModel(const std::string& mdl, const std::string& sysPrompt, const std::string& history) {
        std::string payload = "{\"model\":\"" + mdl + "\",\"messages\":["
            "{\"role\":\"system\",\"content\":\"" + escape(sysPrompt) + "\"},"
            "{\"role\":\"user\",\"content\":\"" + escape(history) + "\"}]}";

        HINTERNET s = WinHttpOpen(L"Bot/1.0", WINHTTP_ACCESS_TYPE_DEFAULT_PROXY, 0, 0, 0);
        HINTERNET c = WinHttpConnect(s, L"api.groq.com", INTERNET_DEFAULT_HTTPS_PORT, 0);
        HINTERNET r = WinHttpOpenRequest(c, L"POST", L"/openai/v1/chat/completions", 0, 0, 0, WINHTTP_FLAG_SECURE);

        std::string hdr = "Content-Type: application/json\r\nAuthorization: Bearer " + apiKey + "\r\n";
        std::wstring wHdr(hdr.begin(), hdr.end());
        WinHttpAddRequestHeaders(r, wHdr.c_str(), -1L, WINHTTP_ADDREQ_FLAG_ADD);
        WinHttpSendRequest(r, 0, 0, (LPVOID)payload.c_str(), payload.length(), payload.length(), 0);
        WinHttpReceiveResponse(r, 0);

        std::string body;
        DWORD dwSize = 0;
        while (WinHttpQueryDataAvailable(r, &dwSize) && dwSize > 0) {
            std::vector<char> buf(dwSize + 1, 0);
            DWORD read = 0;
            if (WinHttpReadData(r, buf.data(), dwSize, &read)) body.append(buf.data(), read);
        }
        WinHttpCloseHandle(r); WinHttpCloseHandle(c); WinHttpCloseHandle(s);
        return body;
    }

public:
    GroqAPI(std::string key, std::string modelName = "openai/gpt-oss-120b")
        : apiKey(std::move(key)), model(std::move(modelName)) {
        // Map common alias "chatgpt-120b-oss" to Groq's official API identifier
        if (model == "chatgpt-120b-oss" || model == "gpt-oss-120b") {
            model = "openai/gpt-oss-120b";
        }
    }

    std::string sendPrompt(const std::string& sysPrompt, const std::string& history, int round = 1) {
        if (apiKey.empty() || apiKey == "demo") {
            if (round < 0) return "Score: 8.5/10 | Strengths: Clear logic, RAII usage | Improve: Edge-case coverage | Verdict: HIRE";
            return (round == 1) ? "Interviewer: Good answer. How would you handle exception safety and memory leaks here?"
                                : "Interviewer: Great. How does this scale under high concurrency and multi-threading?";
        }

        // 1. Try requested model (e.g. openai/gpt-oss-120b)
        std::string body = requestModel(model, sysPrompt, history);

        // 2. If model not found or restricted on free tier, auto-fallback to llama-3.3-70b-versatile
        if (body.find("model_not_found") != std::string::npos || body.find("does not exist") != std::string::npos) {
            std::string fallback = (model == "openai/gpt-oss-120b") ? "llama-3.3-70b-versatile" : "openai/gpt-oss-120b";
            std::string fallbackBody = requestModel(fallback, sysPrompt, history);
            if (fallbackBody.find("error") == std::string::npos) {
                model = fallback;
                return parseContent(fallbackBody);
            }
            // 3. Ultra-stable fallback: llama-3.1-8b-instant
            fallbackBody = requestModel("llama-3.1-8b-instant", sysPrompt, history);
            if (fallbackBody.find("error") == std::string::npos) {
                model = "llama-3.1-8b-instant";
                return parseContent(fallbackBody);
            }
        }

        return parseContent(body);
    }
};

// ============================================================================
// 2. ABSTRACTION: Abstract Base Class Interviewer defines the interface
// ============================================================================
class Interviewer {
protected:
    std::string candidate;
    GroqAPI api;
    std::string conversation;
    int maxRounds;

public:
    Interviewer(std::string name, std::string key, int rounds, std::string model)
        : candidate(std::move(name)), api(std::move(key), std::move(model)), maxRounds(rounds) {}
    virtual ~Interviewer() = default;

    virtual std::string getTrackName() const = 0;
    virtual std::string getSystemPrompt() const = 0;
    virtual std::string getOpeningQuestion() const = 0;

    void conductInterview() {
        std::cout << "\n=== Starting " << getTrackName() << " Interview (" << candidate << ") ===\n\n";
        std::string q = getOpeningQuestion();
        std::cout << "[Interviewer]: " << q << "\n\n";
        conversation += "Interviewer: " + q + "\n";

        for (int r = 1; r <= maxRounds; ++r) {
            std::cout << "[" << candidate << " (Round " << r << "/" << maxRounds << ")]: ";
            std::string ans;
            if (!std::getline(std::cin, ans)) break;
            if (ans.empty()) {
                std::cout << "(Please enter a response)\n";
                --r;
                continue;
            }
            conversation += candidate + ": " + ans + "\n";

            if (r == maxRounds) break;
            std::cout << "\n[Interviewer is thinking...]\n";
            std::string nextQ = api.sendPrompt(getSystemPrompt(), conversation, r);
            std::cout << "\n[Interviewer]: " << nextQ << "\n\n";
            conversation += "Interviewer: " + nextQ + "\n";
        }

        std::cout << "\n=== FINAL EVALUATION REPORT ===\n";
        std::cout << api.sendPrompt("Evaluate candidate performance: give Score out of 10, Strengths, and Verdict (Hire/No Hire).", conversation, -1) << "\n\n";
    }
};

// ============================================================================
// 3. INHERITANCE: Specialized Derived Interviewers
// ============================================================================
class TechnicalInterviewer : public Interviewer {
public:
    TechnicalInterviewer(std::string name, std::string key, int rounds, std::string model)
        : Interviewer(std::move(name), std::move(key), rounds, std::move(model)) {}

    std::string getTrackName() const override { return "C++ Systems Technical"; }
    std::string getSystemPrompt() const override {
        return "You are a C++ Technical Interviewer. Evaluate the candidate's code reasoning and ask follow-up questions on RAII, memory, and virtual functions.";
    }
    std::string getOpeningQuestion() const override {
        static std::vector<std::string> bank = {
            "[C++ Code Challenge: Virtual Destructor Bug]\n"
            "class Base { public: ~Base() { std::cout << \"~Base\\n\"; } };\n"
            "class Derived : public Base { int* buf = new int[50]; public: ~Derived() { delete[] buf; } };\n"
            "Code executed: std::unique_ptr<Base> p = std::make_unique<Derived>();\n"
            "Question: Why does ~Derived() fail to execute, causing a memory leak? How do you fix it?",

            "[C++ Code Challenge: Move Constructor]\n"
            "class Buffer { int* data; size_t sz; public:\n"
            "  Buffer(Buffer&& other) noexcept {\n"
            "    // Task: Implement this move constructor to safely transfer ownership.\n"
            "  }\n"
            "};\n"
            "Question: Write the implementation and explain why other.data must be nulled.",

            "[C++ Code Challenge: Circular std::shared_ptr]\n"
            "struct B; struct A { std::shared_ptr<B> b; };\n"
            "struct B { std::shared_ptr<A> a; };\n"
            "Question: Why will instances of A and B never be deleted? How does std::weak_ptr resolve this?"
        };
        return bank[std::rand() % bank.size()];
    }
};

class BehavioralInterviewer : public Interviewer {
public:
    BehavioralInterviewer(std::string name, std::string key, int rounds, std::string model)
        : Interviewer(std::move(name), std::move(key), rounds, std::move(model)) {}

    std::string getTrackName() const override { return "Behavioral & Leadership"; }
    std::string getSystemPrompt() const override {
        return "You are an Engineering Manager. Ask one behavioral follow-up question using the STAR method.";
    }
    std::string getOpeningQuestion() const override {
        static std::vector<std::string> bank = {
            "Tell me about a time you had a significant technical disagreement with a team member and how you resolved it.",
            "Describe a high-pressure situation where a critical production bug occurred. How did you triage and fix it?",
            "Tell me about a project where requirements were ambiguous and you had to make tough architectural trade-offs."
        };
        return bank[std::rand() % bank.size()];
    }
};

// ============================================================================
// 4. POLYMORPHISM: Dynamic dispatch via base class pointer in main()
// ============================================================================
int main() {
    std::srand(static_cast<unsigned>(std::time(nullptr)));

    std::cout << "=== AI INTERVIEW BOT (GROQ OOP C++) ===\n\n";
    std::cout << "Enter candidate name: ";
    std::string name;
    std::getline(std::cin, name);
    if (name.empty()) name = "Candidate";

    char* envKey = getenv("GROQ_API_KEY");
    std::string key = (envKey && strlen(envKey) > 0) ? envKey : "";
    if (key.empty()) {
        std::cout << "Enter Groq API Key (or press Enter for Demo Mode): ";
        std::getline(std::cin, key);
        if (key.empty()) key = "demo";
    }

    std::cout << "Choose Track:\n  1. Technical (C++ Systems & Memory)\n  2. Behavioral (STAR & Leadership)\nChoice (1 or 2): ";
    std::string choice;
    std::getline(std::cin, choice);

    // Default to Groq official OpenAI OSS 120B model (with auto-fallback to llama-3.3-70b-versatile)
    std::string model = "openai/gpt-oss-120b";

    // Polymorphic pointer to base class
    std::unique_ptr<Interviewer> bot;
    if (choice == "2") {
        bot = std::make_unique<BehavioralInterviewer>(name, key, 3, model);
    } else {
        bot = std::make_unique<TechnicalInterviewer>(name, key, 3, model);
    }

    // Dynamic dispatch executes overridden methods at runtime
    bot->conductInterview();
    return 0;
}
