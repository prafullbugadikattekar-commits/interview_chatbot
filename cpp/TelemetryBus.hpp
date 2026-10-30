/*============================================================================
 * TelemetryBus.hpp - Template Observer Pattern Event Bus
 * C++17 OOP Mini-Project: AI Engineer Interview Prep
 *
 * OOP Concepts Demonstrated:
 *   - Templates (Generic EventBus<T>)
 *   - Observer Pattern via std::function callbacks
 *   - STL: std::vector, std::function, std::chrono
 *   - Encapsulation: private subscriber list with public subscribe/notify
 *============================================================================*/
#pragma once

#include <vector>
#include <functional>
#include <string>
#include <chrono>
#include <iostream>
#include <iomanip>
#include <sstream>

namespace interviewprep {

// ---------------------------------------------------------------------------
// TelemetryEvent: payload emitted on every OOP dispatch
// ---------------------------------------------------------------------------
struct TelemetryEvent {
    std::string domain;     // e.g. "System", "Evaluation", "Scorecard"
    std::string badge;      // e.g. "CTOR", "VTABLE", "OP+"
    std::string component;  // C++ class name
    std::string method;     // method name
    std::string message;    // human-readable description
    std::string timestamp;  // ISO-like timestamp

    TelemetryEvent() = default;

    TelemetryEvent(const std::string& d, const std::string& b,
                   const std::string& c, const std::string& m,
                   const std::string& msg)
        : domain(d), badge(b), component(c), method(m), message(msg)
    {
        auto now = std::chrono::system_clock::now();
        auto t = std::chrono::system_clock::to_time_t(now);
        std::ostringstream oss;
        oss << std::put_time(std::localtime(&t), "%H:%M:%S");
        timestamp = oss.str();
    }
};

// ---------------------------------------------------------------------------
// EventBus<T> - Generic Observer Pattern (Template Class)
// Subscribers register std::function<void(const T&)> callbacks.
// When notify() is called, all subscribers are invoked.
// ---------------------------------------------------------------------------
template<typename T>
class EventBus {
private:
    std::vector<std::function<void(const T&)>> subscribers_;

public:
    EventBus() = default;

    // Subscribe a callback, returns subscriber index
    size_t subscribe(std::function<void(const T&)> callback) {
        subscribers_.push_back(std::move(callback));
        return subscribers_.size() - 1;
    }

    // Notify all subscribers with an event
    void notify(const T& event) const {
        for (const auto& cb : subscribers_) {
            try {
                cb(event);
            } catch (const std::exception& e) {
                std::cerr << "[EventBus] Subscriber error: " << e.what() << "\n";
            }
        }
    }

    // Get number of active subscribers
    size_t subscriberCount() const {
        return subscribers_.size();
    }

    // Clear all subscribers
    void clear() {
        subscribers_.clear();
    }
};

// ---------------------------------------------------------------------------
// Global telemetry bus instance (singleton-like for the application)
// ---------------------------------------------------------------------------
inline EventBus<TelemetryEvent>& telemetryBus() {
    static EventBus<TelemetryEvent> instance;
    return instance;
}

} // namespace interviewprep
