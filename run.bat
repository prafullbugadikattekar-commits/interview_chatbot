@echo off
title AI Interview Bot (Groq OOP C++)
cd /d "%~dp0"
echo ========================================================
echo   AI Interview Bot - College OOP Project (Groq Edition)
echo ========================================================
echo.

REM Check compiler
set GXX=C:\msys64\ucrt64\bin\g++.exe
if not exist "%GXX%" (
    where g++.exe >nul 2>&1
    if %errorlevel% equ 0 (
        set GXX=g++.exe
    ) else (
        echo [ERROR] g++ not found. Please install MinGW/MSYS2 or add g++ to PATH.
        pause
        exit /b 1
    )
)

echo Compiling main.cpp...
"%GXX%" -std=c++17 -O2 main.cpp -lwinhttp -o interview_bot.exe
if %errorlevel% neq 0 (
    echo [ERROR] Compilation failed!
    pause
    exit /b %errorlevel%
)

echo [OK] Compilation successful!
echo Launching interview_bot.exe...
echo.
interview_bot.exe
echo.
pause
