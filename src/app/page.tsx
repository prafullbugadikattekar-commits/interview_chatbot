'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  User,
  Send,
  Plus,
  ChevronLeft,
  ChevronRight,
  Award,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  Briefcase,
  Layers,
  StopCircle,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

type ExperienceLevel = 'Fresher' | 'Junior' | 'Mid-Level' | 'Senior';
type QuestionCountOption = 5 | 10 | -1; // -1 represents Endless

interface Message {
  id: string;
  sender: 'ai' | 'candidate';
  text: string;
  timestamp: string;
  evaluation?: {
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  };
  questionNumber?: number;
  topic?: string;
}

interface ScorecardData {
  role: string;
  level: string;
  totalQuestions: number;
  averageScore: number;
  verdict: string;
  strengths: string[];
  improvements: string[];
}

const PRESET_ROLES = [
  'Software Engineer (DSA)',
  'Full-Stack Web Developer',
  'Data Science & AI',
  'Python / Java / C++',
  'System Design',
  'HR & Behavioral',
  'Custom Role...',
];

// ============================================================================
// Main Application Component
// ============================================================================

export default function IntervueApp() {
  // Sidebar State
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Configuration State
  const [selectedRole, setSelectedRole] = useState('Software Engineer (DSA)');
  const [customRoleText, setCustomRoleText] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('Mid-Level');
  const [questionCount, setQuestionCount] = useState<QuestionCountOption>(5);

  // Active Session State
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const [currentQuestionTopic, setCurrentQuestionTopic] = useState('');
  const [currentQuestionText, setCurrentQuestionText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Conversation Thread
  const [messages, setMessages] = useState<Message[]>([]);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scorecard Modal State
  const [showScorecard, setShowScorecard] = useState(false);
  const [scorecardData, setScorecardData] = useState<ScorecardData | null>(null);

  const activeRoleName = selectedRole === 'Custom Role...' ? (customRoleText.trim() || 'Software Engineer') : selectedRole;

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus textarea when interview becomes active or when question finishes
  useEffect(() => {
    if (isInterviewActive && !loading) {
      textareaRef.current?.focus();
    }
  }, [isInterviewActive, loading]);

  // ──────────────────────────────────────────────────────────────────────────
  // Start New Interview
  // ──────────────────────────────────────────────────────────────────────────
  const startNewInterview = async () => {
    setLoading(true);
    setErrorMsg('');
    setShowScorecard(false);
    setUserInput(''); // Ensure input box is always empty

    try {
      const res = await fetch(
        `/api/interview?role=${encodeURIComponent(activeRoleName)}&level=${encodeURIComponent(experienceLevel)}`
      );
      if (!res.ok) throw new Error('Failed to start interview session.');
      const data = await res.json();

      const firstQ = data.question;
      setCurrentQuestionNumber(1);
      setCurrentQuestionTopic(firstQ.topic || 'General Overview');
      setCurrentQuestionText(firstQ.questionText);
      setIsInterviewActive(true);

      // Initialize Chat with Welcome + First Question
      const initialMessage: Message = {
        id: Math.random().toString(36).substring(2, 9),
        sender: 'ai',
        text: firstQ.questionText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        questionNumber: 1,
        topic: firstQ.topic,
      };

      setMessages([initialMessage]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error connecting to interview engine');
    } finally {
      setLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Submit Candidate Answer
  // ──────────────────────────────────────────────────────────────────────────
  const handleSendMessage = async () => {
    if (!userInput.trim() || loading || !isInterviewActive) return;

    const candidateAnswer = userInput.trim();
    setUserInput(''); // Immediately clear input box

    // 1. Append candidate's message to chat
    const userMessage: Message = {
      id: Math.random().toString(36).substring(2, 9),
      sender: 'candidate',
      text: candidateAnswer,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setLoading(true);
    setErrorMsg('');

    try {
      const payload = {
        answer: candidateAnswer,
        currentQuestion: {
          id: currentQuestionNumber,
          questionText: currentQuestionText,
          topic: currentQuestionTopic,
        },
        questionNumber: currentQuestionNumber,
        maxQuestions: questionCount,
        role: activeRoleName,
        level: experienceLevel,
        conversationHistory: updatedHistory.map((m) => ({
          role: m.sender === 'candidate' ? 'user' : 'assistant',
          content: m.text,
        })),
      };

      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Evaluation service response error.');
      const data = await res.json();

      const evaluation = data.evaluation;
      const nextQuestion = data.nextQuestion;

      // 2. Build AI's response text
      let aiResponseText = '';
      if (evaluation.feedback) {
        aiResponseText += `${evaluation.feedback}\n\n`;
      }
      if (nextQuestion) {
        aiResponseText += `${nextQuestion.questionText}`;
      } else {
        aiResponseText += `That concludes our interview session for the ${activeRoleName} position. Thank you for walking me through your thought process! You can view your full performance report above.`;
      }

      const aiMessage: Message = {
        id: Math.random().toString(36).substring(2, 9),
        sender: 'ai',
        text: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        evaluation: {
          score: evaluation.score,
          feedback: evaluation.feedback,
          strengths: evaluation.strengths || [],
          improvements: evaluation.improvements || [],
        },
        questionNumber: nextQuestion ? currentQuestionNumber + 1 : undefined,
        topic: nextQuestion ? nextQuestion.topic : undefined,
      };

      setMessages((prev) => [...prev, aiMessage]);

      if (nextQuestion) {
        setCurrentQuestionNumber((prev) => prev + 1);
        setCurrentQuestionTopic(nextQuestion.topic);
        setCurrentQuestionText(nextQuestion.questionText);
      } else {
        // Interview Completed
        setIsInterviewActive(false);
        generateScorecardSummary([...updatedHistory, aiMessage]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit response');
    } finally {
      setLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Conclude Interview & Generate Scorecard
  // ──────────────────────────────────────────────────────────────────────────
  const concludeInterview = () => {
    setIsInterviewActive(false);
    generateScorecardSummary(messages);
  };

  const generateScorecardSummary = (history: Message[]) => {
    const evaluations = history.filter((m) => m.evaluation).map((m) => m.evaluation!);
    if (evaluations.length === 0) {
      setScorecardData({
        role: activeRoleName,
        level: experienceLevel,
        totalQuestions: 0,
        averageScore: 0,
        verdict: 'Session Incomplete',
        strengths: ['Started session'],
        improvements: ['Complete at least one interview round to receive feedback'],
      });
      setShowScorecard(true);
      return;
    }

    const totalScore = evaluations.reduce((acc, curr) => acc + curr.score, 0);
    const avg = Math.round((totalScore / evaluations.length) * 10) / 10;

    let verdict = 'Needs Improvement';
    if (avg >= 9.0) verdict = 'Strong Hire (Exceptional Mastery)';
    else if (avg >= 7.5) verdict = 'Hire (Solid Engineering Depth)';
    else if (avg >= 6.0) verdict = 'Lean Hire (Re-evaluate Gaps)';

    const allStrengths = Array.from(new Set(evaluations.flatMap((e) => e.strengths))).slice(0, 4);
    const allImprovements = Array.from(new Set(evaluations.flatMap((e) => e.improvements))).slice(0, 3);

    setScorecardData({
      role: activeRoleName,
      level: experienceLevel,
      totalQuestions: evaluations.length,
      averageScore: avg,
      verdict,
      strengths: allStrengths,
      improvements: allImprovements,
    });
    setShowScorecard(true);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Download Report (.md)
  // ──────────────────────────────────────────────────────────────────────────
  const downloadReport = () => {
    if (!scorecardData) return;

    let content = `# IntervueAI Technical & Behavioral Mock Interview Report\n\n`;
    content += `**Target Role:** ${scorecardData.role}\n`;
    content += `**Experience Level:** ${scorecardData.level}\n`;
    content += `**Date:** ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`;
    content += `**Overall Score:** ${scorecardData.averageScore} / 10.0\n`;
    content += `**Hiring Verdict:** ${scorecardData.verdict}\n\n`;
    content += `---\n\n`;

    content += `## Key Strengths\n`;
    scorecardData.strengths.forEach((s) => {
      content += `- ${s}\n`;
    });
    content += `\n## Areas for Improvement\n`;
    scorecardData.improvements.forEach((i) => {
      content += `- ${i}\n`;
    });
    content += `\n---\n\n## Interview Transcript\n\n`;

    messages.forEach((m) => {
      if (m.sender === 'ai') {
        content += `### AI Interviewer (${m.timestamp})\n${m.text}\n\n`;
        if (m.evaluation) {
          content += `> **Score:** ${m.evaluation.score}/10.0\n\n`;
        }
      } else {
        content += `### Candidate (${m.timestamp})\n${m.text}\n\n`;
      }
    });

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IntervueAI_Report_${scorecardData.role.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
      {/* ────────────────────────────────────────────────────────────────────
          LEFT SIDEBAR (260px wide, Collapsible)
      ──────────────────────────────────────────────────────────────────── */}
      <aside
        className={`${
          sidebarOpen ? 'w-[260px]' : 'w-0'
        } transition-all duration-200 shrink-0 border-r border-zinc-800 bg-zinc-900 flex flex-col justify-between overflow-hidden relative z-20`}
      >
        <div className="flex flex-col h-full p-4 space-y-5 overflow-y-auto">
          {/* Header Title */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-zinc-100 text-zinc-950 flex items-center justify-center font-bold text-sm">
                <Bot className="w-4 h-4 text-zinc-950" />
              </div>
              <h1 className="font-bold text-sm tracking-tight text-zinc-100">IntervueAI</h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* New Interview Button */}
          <button
            onClick={startNewInterview}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Interview</span>
          </button>

          {/* Configuration Section */}
          <div className="space-y-4 pt-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Interview Settings
            </div>

            {/* Target Role Selector */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-300 font-medium flex items-center gap-1.5">
                <Briefcase className="w-3 h-3 text-zinc-400" />
                <span>Target Role</span>
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                disabled={isInterviewActive}
                className="w-full text-xs rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-2 text-zinc-200 outline-none focus:border-zinc-500 transition-colors"
              >
                {PRESET_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>

              {/* Custom Role Input */}
              {selectedRole === 'Custom Role...' && (
                <input
                  type="text"
                  placeholder="e.g., DevOps Engineer, iOS Dev..."
                  value={customRoleText}
                  onChange={(e) => setCustomRoleText(e.target.value)}
                  disabled={isInterviewActive}
                  className="w-full text-xs rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-zinc-200 placeholder-zinc-500 outline-none focus:border-zinc-500 transition-colors mt-1.5"
                />
              )}
            </div>

            {/* Experience Level */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-300 font-medium">Experience Level</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['Fresher', 'Junior', 'Mid-Level', 'Senior'] as ExperienceLevel[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setExperienceLevel(level)}
                    disabled={isInterviewActive}
                    className={`text-[11px] py-1.5 px-2 rounded-md font-medium border text-center transition-colors ${
                      experienceLevel === level
                        ? 'border-zinc-100 bg-zinc-100 text-zinc-950 font-semibold'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Count */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-300 font-medium">Session Length</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { label: '5 Qs', val: 5 },
                  { label: '10 Qs', val: 10 },
                  { label: 'Endless', val: -1 },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setQuestionCount(item.val as QuestionCountOption)}
                    disabled={isInterviewActive}
                    className={`text-[11px] py-1.5 rounded-md font-medium border text-center transition-colors ${
                      questionCount === item.val
                        ? 'border-zinc-100 bg-zinc-100 text-zinc-950 font-semibold'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* End Session Button */}
          {isInterviewActive && (
            <div className="pt-2">
              <button
                onClick={concludeInterview}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition-colors cursor-pointer"
              >
                <StopCircle className="w-3.5 h-3.5 text-zinc-400" />
                <span>End & View Report</span>
              </button>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* AI Engine Status (Powered via .env) */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-zinc-300 font-medium">AI Engine Active</span>
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">.env</span>
          </div>
        </div>
      </aside>

      {/* ────────────────────────────────────────────────────────────────────
          MAIN CENTER PANEL (CHATGPT-STYLE INTERFACE)
      ──────────────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col h-full bg-zinc-950 relative overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-12 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                title="Open Sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-zinc-200">{activeRoleName}</span>
              <span className="text-zinc-400">•</span>
              <span className="text-zinc-400">{experienceLevel}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {isInterviewActive && (
              <span className="text-zinc-400 font-mono">
                Round {currentQuestionNumber}
                {questionCount !== -1 && ` of ${questionCount}`}
              </span>
            )}
            {messages.length > 0 && (
              <button
                onClick={() => generateScorecardSummary(messages)}
                className="text-xs px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
              >
                <Award className="w-3.5 h-3.5 text-zinc-400" />
                <span>Scorecard</span>
              </button>
            )}
          </div>
        </header>

        {/* Chat Thread Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-6 max-w-4xl w-full mx-auto">
          {/* Welcome Screen if no messages */}
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4 py-12">
              <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-100">
                <Bot className="w-6 h-6 text-zinc-200" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-lg font-bold text-zinc-100">Welcome to IntervueAI</h2>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Real-time mock interviews tailored to any software engineering or behavioral role.
                  Questions adapt naturally as you respond.
                </p>
              </div>

              <div className="w-full pt-2">
                <button
                  onClick={startNewInterview}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-semibold text-xs transition-colors shadow-sm cursor-pointer"
                >
                  Start {activeRoleName} Interview
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 w-full pt-2 text-left">
                <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 text-[11px] text-zinc-400">
                  <span className="font-semibold text-zinc-200 block mb-0.5">Natural Follow-ups</span>
                  Interviewer adjusts depth based on your explanations.
                </div>
                <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 text-[11px] text-zinc-400">
                  <span className="font-semibold text-zinc-200 block mb-0.5">Fair Scoring</span>
                  Accurate answers earn full 9/10 or 10/10 marks.
                </div>
              </div>
            </div>
          )}

          {/* Conversation Messages */}
          {messages.map((message) => {
            const isAI = message.sender === 'ai';

            return (
              <div
                key={message.id}
                className={`flex gap-3 md:gap-4 ${
                  isAI ? 'items-start' : 'items-start justify-end'
                }`}
              >
                {/* AI Avatar */}
                {isAI && (
                  <div className="w-7 h-7 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-zinc-300" />
                  </div>
                )}

                {/* Message Bubble Container */}
                <div className={`space-y-2 max-w-2xl ${isAI ? 'w-full' : ''}`}>
                  {/* Evaluation Score Badge if present */}
                  {message.evaluation && (
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs">
                      <span className="font-mono font-bold text-zinc-100">
                        Score: {message.evaluation.score.toFixed(1)} / 10.0
                      </span>
                      {message.evaluation.score >= 8.5 ? (
                        <span className="text-[10px] text-emerald-400 font-medium">Strong Response</span>
                      ) : message.evaluation.score >= 6.5 ? (
                        <span className="text-[10px] text-amber-400 font-medium">Satisfactory</span>
                      ) : (
                        <span className="text-[10px] text-zinc-400 font-medium">Review Concepts</span>
                      )}
                    </div>
                  )}

                  {/* Main Bubble */}
                  <div
                    className={`rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                      isAI
                        ? 'bg-zinc-900 border border-zinc-800 text-zinc-200'
                        : 'bg-zinc-800 text-zinc-100 ml-auto border border-zinc-700'
                    }`}
                  >
                    {message.text}
                  </div>

                  {/* Timestamp & Meta */}
                  <div
                    className={`text-[10px] text-zinc-400 font-mono px-1 flex items-center gap-2 ${
                      isAI ? '' : 'justify-end'
                    }`}
                  >
                    <span>{message.timestamp}</span>
                    {message.topic && (
                      <>
                        <span>•</span>
                        <span>{message.topic}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Candidate Avatar */}
                {!isAI && (
                  <div className="w-7 h-7 rounded-md bg-zinc-700 border border-zinc-600 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-zinc-200" />
                  </div>
                )}
              </div>
            );
          })}

          {/* AI Thinking Indicator */}
          {loading && (
            <div className="flex gap-3 items-center">
              <div className="w-7 h-7 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-zinc-300" />
              </div>
              <div className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-400" />
                <span>Interviewer is evaluating your response...</span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-lg bg-zinc-900 border border-red-900/50 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Bottom Message Input Bar */}
        <div className="border-t border-zinc-800 bg-zinc-950 p-4 shrink-0">
          <div className="max-w-4xl mx-auto space-y-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative flex items-end gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-2 focus-within:border-zinc-600 transition-colors"
            >
              <textarea
                ref={textareaRef}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={!isInterviewActive || loading}
                placeholder={
                  isInterviewActive
                    ? 'Type your answer here... (Enter to send, Shift+Enter for new line)'
                    : 'Click "New Interview" or "Start Interview" to begin...'
                }
                rows={2}
                className="w-full resize-none bg-transparent px-2 py-1 text-sm text-zinc-100 placeholder-zinc-500 outline-none max-h-36 disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={!isInterviewActive || !userInput.trim() || loading}
                className="p-2 rounded-lg bg-zinc-100 text-zinc-950 hover:bg-zinc-200 disabled:opacity-30 disabled:hover:bg-zinc-100 transition-colors cursor-pointer shrink-0"
                title="Send answer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
              <span>IntervueAI</span>
              <span>{userInput.length} chars</span>
            </div>
          </div>
        </div>
      </main>

      {/* ────────────────────────────────────────────────────────────────────
          SUMMARY SCORECARD MODAL
      ──────────────────────────────────────────────────────────────────── */}
      {showScorecard && scorecardData && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-zinc-100" />
                <h3 className="font-bold text-base text-zinc-100">Interview Evaluation Scorecard</h3>
              </div>
              <button
                onClick={() => setShowScorecard(false)}
                className="text-zinc-400 hover:text-zinc-200 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Score & Verdict Card */}
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono text-zinc-400 uppercase">Overall Rating</span>
                <div className="text-3xl font-extrabold text-zinc-100 tracking-tight mt-0.5">
                  {scorecardData.averageScore.toFixed(1)}
                  <span className="text-base text-zinc-400 font-normal"> / 10.0</span>
                </div>
                <div className="text-xs font-semibold text-zinc-300 mt-1">{scorecardData.verdict}</div>
              </div>

              <div className="text-right text-xs text-zinc-400 space-y-1 font-mono">
                <div>Role: {scorecardData.role}</div>
                <div>Level: {scorecardData.level}</div>
                <div>Rounds: {scorecardData.totalQuestions}</div>
              </div>
            </div>

            {/* Strengths & Improvements */}
            <div className="space-y-3 text-xs">
              {scorecardData.strengths.length > 0 && (
                <div className="space-y-1.5">
                  <div className="font-semibold text-zinc-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-zinc-300" />
                    <span>Demonstrated Strengths</span>
                  </div>
                  <ul className="space-y-1 pl-5 list-disc text-zinc-400">
                    {scorecardData.strengths.map((str, idx) => (
                      <li key={idx}>{str}</li>
                    ))}
                  </ul>
                </div>
              )}

              {scorecardData.improvements.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <div className="font-semibold text-zinc-200 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Areas for Growth</span>
                  </div>
                  <ul className="space-y-1 pl-5 list-disc text-zinc-400">
                    {scorecardData.improvements.map((imp, idx) => (
                      <li key={idx}>{imp}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
              <button
                onClick={downloadReport}
                className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Report (.md)</span>
              </button>

              <button
                onClick={() => {
                  setShowScorecard(false);
                  startNewInterview();
                }}
                className="px-4 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>New Session</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
