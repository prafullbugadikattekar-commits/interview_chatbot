# AI TECHNICAL INTERVIEW BOT
## C++ Object-Oriented Programming (OOPS) Project Report & Code Walkthrough
**Author:** Nitin | **Model:** Groq `openai/gpt-oss-120b` | **Platform:** Windows C++17

---

## 1. Executive Summary
The AI Technical Interview Bot is a modern C++ console application designed to simulate realistic technical and behavioral job interviews. It integrates with Groq Cloud's free high-speed Large Language Model (LLM) API (`openai/gpt-oss-120b`) using native Windows WinHTTP (TLS 1.3 encrypted HTTPS).

The project was engineered to provide a clean, textbook demonstration of the four core pillars of Object-Oriented Programming (OOP) in C++ while remaining entirely self-contained within a single concise source file (`main.cpp`).

- **Zero External Dependencies:** Built purely using standard C++17 and native Windows WinHTTP.
- **Cloud AI Integration:** Connects to Groq's high-speed API with multi-tier automatic fallback to ensure 100% uptime.
- **Randomized Dynamic Questions:** Features dynamic question rotation so interview openers and follow-ups are never static.
- **Offline Demo Mode:** Functions seamlessly without an internet connection or API key for oral demonstrations.

---

## 2. Four Pillars of OOP Implementation

### 2.1 Encapsulation
Encapsulation is achieved in `class GroqAPI`. All sensitive data (the API authentication key, active model identifier) and low-level networking functions (JSON escaping, buffer reading, WinHTTP session initialization) are restricted under `private:` access specifiers. External classes can only communicate with the API through the public `sendPrompt()` method.

> **Key Viva Takeaway:** Encapsulation guards the internal HTTP state and API key from unauthorized external modification.

### 2.2 Abstraction
Abstraction is implemented via the abstract base class `Interviewer`. The class hides the complex mechanics of conversation history management, turn-by-turn prompt engineering, and rubric scoring behind a simple template method: `conductInterview()`.

Pure virtual functions (`= 0`) declare the necessary interface that any derived interviewer must implement: `getTrackName()`, `getSystemPrompt()`, and `getOpeningQuestion()`.

### 2.3 Inheritance
Inheritance establishes an "is-a" relationship between specialized interview roles and the generic `Interviewer` base class:
- `TechnicalInterviewer : public Interviewer` (Specializes in C++ systems, RAII, smart pointers, and concurrency)
- `BehavioralInterviewer : public Interviewer` (Specializes in leadership, conflict resolution, and the STAR method)

### 2.4 Polymorphism
Runtime dynamic polymorphism is demonstrated in `main()`. A base class pointer (`std::unique_ptr<Interviewer> bot`) dynamically binds to either a `TechnicalInterviewer` or `BehavioralInterviewer` object based on user selection at runtime. Calling `bot->conductInterview()` dispatches the appropriate virtual methods dynamically via the vtable.

---

## 3. Complete Line-by-Line Code Walkthrough

### 3.1 Header Inclusions (Lines 1–8)
```cpp
#include <iostream>   // Console I/O (cin, cout)
#include <string>     // Text & conversation management
#include <vector>     // Dynamic arrays for question banks & byte buffers
#include <memory>     // Smart pointers (unique_ptr, make_unique)
#include <random>     // Random number generation for question rotation
#include <ctime>      // System time epoch for random seeding
#include <windows.h>  // Win32 core types & handles
#include <winhttp.h>  // Native Windows HTTPS client library
```
**Significance:** The project uses native Windows WinHTTP instead of third-party libraries (like libcurl), allowing it to compile on any standard Windows MinGW/GCC setup without installing external DLLs.

### 3.2 Pillar 1: Encapsulation in GroqAPI (Lines 13–42)
```cpp
class GroqAPI {
private:
    std::string apiKey;
    std::string model;

    std::string escape(const std::string& s) { ... }
    std::string parseContent(const std::string& json) { ... }
```
- **Lines 13–16:** Private members `apiKey` and `model` store configuration safely inside the object.
- **Lines 18–27 (`escape`):** Scans incoming text character-by-character and escapes special characters (quotes to `\"`, newlines to `\n`) to prevent payload syntax errors.
- **Lines 29–42 (`parseContent`):** Searches the raw JSON response for the `"content":` key and parses the AI message text while decoding escaped characters back into readable format.

### 3.3 WinHTTP HTTPS Engine (Lines 44–70)
```cpp
std::string requestModel(const std::string& mdl, const std::string& sysPrompt, const std::string& history) {
    std::string payload = "{\"model\":\"" + mdl + "\",\"messages\":[..."};
    HINTERNET s = WinHttpOpen(L"Bot/1.0", WINHTTP_ACCESS_TYPE_DEFAULT_PROXY, 0, 0, 0);
    HINTERNET c = WinHttpConnect(s, L"api.groq.com", INTERNET_DEFAULT_HTTPS_PORT, 0);
    HINTERNET r = WinHttpOpenRequest(c, L"POST", L"/openai/v1/chat/completions", 0, 0, 0, WINHTTP_FLAG_SECURE);
    ...
    WinHttpCloseHandle(r); WinHttpCloseHandle(c); WinHttpCloseHandle(s);
    return body;
}
```
- **Line 50:** `WinHttpOpen` initializes the HTTP session handle.
- **Line 51:** `WinHttpConnect` establishes an HTTPS connection to `api.groq.com` on port 443.
- **Line 52:** `WinHttpOpenRequest` initializes a POST request to `/openai/v1/chat/completions` with `WINHTTP_FLAG_SECURE` (TLS 1.3).
- **Lines 54–56:** Attaches `Content-Type: application/json` and `Authorization: Bearer <apiKey>` headers.
- **Lines 57–66:** Sends payload, waits for response, and streams incoming chunks into a byte buffer.
- **Line 67:** Closes all handles to prevent memory leaks in compliance with RAII.

### 3.4 Dynamic Fallback & Demo Handling (Lines 72–108)
```cpp
GroqAPI(std::string key, std::string modelName = "openai/gpt-oss-120b") {
    if (model == "chatgpt-120b-oss" || model == "gpt-oss-120b") model = "openai/gpt-oss-120b";
}

std::string sendPrompt(const std::string& sysPrompt, const std::string& history, int round = 1) {
    if (apiKey.empty() || apiKey == "demo") { /* Offline dynamic simulation */ }
    std::string body = requestModel(model, sysPrompt, history);
    if (body.find("model_not_found") != std::string::npos) {
        std::string fallback = "llama-3.3-70b-versatile";
        ...
    }
    return parseContent(body);
}
```
- **Lines 72–77:** Constructor automatically resolves common alias nicknames like `chatgpt-120b-oss` to Groq's official identifier `openai/gpt-oss-120b`.
- **Lines 81–85:** If no API key is passed, the bot automatically engages Offline Demo Mode with simulated round-by-round follow-ups.
- **Lines 90–104:** If Groq rejects the model ID or the free account lacks access to 120B MoE, the system automatically retries with `llama-3.3-70b-versatile` and `llama-3.1-8b-instant` without throwing errors.

### 3.5 Pillar 2: Abstraction in Interviewer (Lines 110–156)
```cpp
class Interviewer {
protected:
    std::string candidate;
    GroqAPI api;
    std::string conversation;
    int maxRounds;
public:
    virtual ~Interviewer() = default;
    virtual std::string getTrackName() const = 0;
    virtual std::string getSystemPrompt() const = 0;
    virtual std::string getOpeningQuestion() const = 0;
    void conductInterview() { ... }
};
```
- **Lines 114–118:** Protected members give derived classes access to candidate info, API client, and conversation logs.
- **Line 123:** Virtual destructor ensures proper cleanup of derived class resources when deleted through a base class pointer.
- **Lines 125–127:** Pure virtual functions (`= 0`) define the contract. Any class inheriting from `Interviewer` MUST implement them.
- **Lines 129–155 (`conductInterview`):** The template method. Handles displaying the banner, picking the opening question, running the multi-turn question loop, sending user answers, receiving AI follow-ups, and generating the final hiring report.

### 3.6 Pillar 3: Inheritance & Question Rotation (Lines 158–198)
```cpp
class TechnicalInterviewer : public Interviewer {
public:
    std::string getTrackName() const override { return "C++ Systems Technical"; }
    std::string getSystemPrompt() const override { return "...C++ Technical Interviewer..."; }
    std::string getOpeningQuestion() const override {
        static std::vector<std::string> bank = {
            "Explain the difference between std::unique_ptr and std::shared_ptr...",
            "What is the RAII idiom in C++ and how does stack unwinding guarantee cleanup...",
            "What are move semantics in C++11/20 and difference between lvalue and rvalue..."
        };
        return bank[std::rand() % bank.size()];
    }
};
```
- **Line 161:** `TechnicalInterviewer` inherits from `Interviewer`.
- **Lines 166–169:** Overrides `getTrackName()` and `getSystemPrompt()` with C++ systems expertise.
- **Lines 170–177:** Maintains a local question bank and returns a randomly chosen opening question using `std::rand() % bank.size()` to prevent repetition across sessions.
- **Lines 180–197:** `BehavioralInterviewer` inherits identically and provides behavioral leadership scenarios following the STAR methodology.

### 3.7 Pillar 4: Polymorphism in main() (Lines 200–237)
```cpp
int main() {
    std::srand(static_cast<unsigned>(std::time(nullptr)));
    ...
    std::unique_ptr<Interviewer> bot;
    if (choice == "2") {
        bot = std::make_unique<BehavioralInterviewer>(name, key, 3, model);
    } else {
        bot = std::make_unique<TechnicalInterviewer>(name, key, 3, model);
    }
    bot->conductInterview();
    return 0;
}
```
- **Line 203:** Seeds the pseudo-random generator with the current epoch timestamp so questions vary between executions.
- **Lines 206–217:** Collects candidate name and detects the `GROQ_API_KEY` environment variable (or falls back to demo mode).
- **Line 227:** Declares a smart pointer of abstract base type `std::unique_ptr<Interviewer>`.
- **Lines 228–232:** Dynamic instantiation at runtime based on the candidate's menu choice.
- **Line 235:** Polymorphic execution. Calls `conductInterview()` through the base pointer, dynamically invoking the overridden derived virtual methods.

---

## 4. Security & API Key Protection Analysis
A critical engineering consideration in this project is security: how is the user's API key protected against leaks?

- **Zero Hardcoding:** The API key is never written in source code or committed to files.
- **In-Memory Storage:** Environment variables (`$env:GROQ_API_KEY`) exist solely in the transient RAM of the PowerShell process and vanish upon console closure.
- **Executable Safety:** The key is supplied at runtime via stdin or `getenv()`, meaning reverse-engineering or decompiling `interview_bot.exe` reveals zero credentials.
- **Network Privacy:** Outgoing requests use Windows WinHTTP with TLS 1.3 encryption (`WINHTTP_FLAG_SECURE`), protecting bearer tokens against Wi-Fi packet sniffers.

---

## 5. Viva Voce Q&A Cheat Sheet

### Q1: Why is `Interviewer` an Abstract Class?
> **Answer:** Because it contains pure virtual functions (`= 0`) such as `getTrackName()` and `getOpeningQuestion()`. An abstract class cannot be instantiated directly; it serves as a strict blueprint for derived classes.

### Q2: Why must the base class destructor be declared `virtual`?
> **Answer:** In polymorphism, objects of derived classes are frequently deleted through base class pointers (`std::unique_ptr<Interviewer>`). If the base destructor is not virtual, only the base class destructor will be invoked, causing derived class resources to leak.

### Q3: Where does dynamic polymorphism occur in this program?
> **Answer:** In `main()` on line 235: `bot->conductInterview()`. The pointer `bot` is of type `std::unique_ptr<Interviewer>`, but at runtime it points to either a `TechnicalInterviewer` or `BehavioralInterviewer` object, dispatching virtual functions via the vtable.

### Q4: What design pattern is used in `conductInterview()`?
> **Answer:** The **Template Method Pattern**. The base class defines the skeleton of an algorithm (display banner -> ask opening question -> loop answers -> evaluate report) while deferring specific steps (question text, prompt persona) to derived classes.

### Q5: How does the random question selection work?
> **Answer:** Each derived class maintains a static vector of curated questions. In `getOpeningQuestion()`, `std::rand() % bank.size()` selects a random index, seeded by `std::srand(std::time(nullptr))` in `main()` to guarantee variety.

---

## 6. How to Build & Run
**Compilation Command (MinGW / GCC C++17):**
```powershell
g++ -std=c++17 -O2 main.cpp -lwinhttp -o interview_bot.exe
```

**Execution:**
```powershell
.\interview_bot.exe
# Or simply double-click run.bat
```

---

## 7. Dual-Tier Cloud Web Architecture & Vercel Hosting
To enable external evaluators, university professors, and prospective employers to test the AI Interview Bot without requiring a local MinGW/GCC C++ compilation environment, the project implements a **Dual-Tier Deployment Architecture**:

### 7.1 Architectural Overview
- **Native Tier (C++17 Standalone):** `main.cpp` executes natively on Windows using native WinHTTP TLS 1.3 with zero third-party dependencies, demonstrating pure C++ memory management, RAII, and virtual table dispatch.
- **Cloud Web Tier (Vercel Serverless & Modern Web UI):**
  - **Serverless API (`/api/interview.js`):** Operates on Vercel's serverless edge infrastructure to securely proxy LLM requests to Groq Cloud, preventing API key exposure and executing dynamic multi-tier fallback (`openai/gpt-oss-120b` &rarr; `llama-3.3-70b-versatile` &rarr; `llama-3.1-8b-instant`).
  - **Interactive C++ OOP Emulator (`cpp-oop-emulator.js`):** Structurally mirrors the 4 OOP pillars in ES6 classes to drive live vtable telemetry and runtime method resolution.
  - **Dual Interaction Modes:** Provides both a high-fidelity **Modern Web GUI** (with Web Speech API voice synthesis and speech-to-text dictation) and an authentic **Retro C++ Terminal Emulator** mimicking `interview_bot.exe`.
  - **Live OOP Event Telemetry:** Emits real-time visual events demonstrating polymorphic dispatch, encapsulation boundaries, and inheritance hierarchies during each interview turn.

### 7.2 Steps for Vercel Deployment
1. Push the project repository to GitHub.
2. Log into [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Select the `ai-interview-bot` repository.
4. (Optional) Set the `GROQ_API_KEY` environment variable in the Vercel project settings dashboard.
5. Click **"Deploy"**. The site deploys in under 5 seconds with zero build configuration required.

