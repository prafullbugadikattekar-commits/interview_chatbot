# ============================================================================
# Makefile - AI Engineer Interview Prep (C++17 OOP Engine)
# ============================================================================
# Compiler: g++ (MinGW-w64 / MSYS2 / GCC)
# Standard: C++17
# Usage:
#   make            -> Build the interview engine binary
#   make run        -> Build and run in interactive console mode
#   make run-json   -> Build and run in JSON IPC mode (for server.js bridge)
#   make clean      -> Remove build artifacts
# ============================================================================

CXX      := g++
CXXFLAGS := -std=c++17 -O2 -Wall -Wextra -Wpedantic
TARGET   := interview_engine
SRC      := main.cpp
HEADERS  := InterviewEngine.hpp Tracks.hpp Evaluator.hpp TelemetryBus.hpp

# Windows: use .exe extension
ifeq ($(OS),Windows_NT)
    TARGET := $(TARGET).exe
    RM     := del /Q
else
    RM     := rm -f
endif

.PHONY: all run run-json clean

all: $(TARGET)

$(TARGET): $(SRC) $(HEADERS)
	$(CXX) $(CXXFLAGS) -o $(TARGET) $(SRC)
	@echo ""
	@echo "========================================="
	@echo "  Build successful: $(TARGET)"
	@echo "  Run:  ./$(TARGET)"
	@echo "  JSON: ./$(TARGET) --json"
	@echo "========================================="

run: $(TARGET)
	./$(TARGET)

run-json: $(TARGET)
	./$(TARGET) --json

clean:
	$(RM) $(TARGET) 2>nul || true
	@echo "Cleaned build artifacts."
