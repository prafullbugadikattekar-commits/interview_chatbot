/**
 * Interview Prep - AI Engineer Technical Interview Controller
 * Manages dual modes (GUI & AI Dev Console), speech interaction,
 * Python/PyTorch code handling, and real-time AI competency telemetry.
 */

import {
  createAIInterviewer,
  aiEvents
} from './ai-interview-engine.js';

// Application State
const state = {
  activeMode: 'gui', // 'gui' or 'term'
  candidateName: 'Candidate',
  trackChoice: '1',
  model: 'llama-3.3-70b-versatile',
  isSpeaking: true,
  isRecording: false,
  eventCount: 0,
  bot: null
};

// DOM References
const elements = {
  // Mode Switcher
  btnModeGui: document.getElementById('btn-mode-gui'),
  btnModeTerm: document.getElementById('btn-mode-term'),
  guiContainer: document.getElementById('gui-mode-container'),
  termContainer: document.getElementById('terminal-mode-container'),

  // Controls & Config
  trackSelect: document.getElementById('track-select'),
  candidateInput: document.getElementById('candidate-name-input'),
  btnStartSession: document.getElementById('btn-start-session'),
  guiTrackTitle: document.getElementById('gui-track-title'),
  guiActiveModel: document.getElementById('gui-active-model'),
  roundsIndicator: document.getElementById('rounds-indicator'),

  // GUI Chat
  chatMessages: document.getElementById('chat-messages'),
  guiUserInput: document.getElementById('gui-user-input'),
  btnGuiSend: document.getElementById('btn-gui-send'),
  btnVoiceInput: document.getElementById('btn-voice-input'),
  btnSpeakToggle: document.getElementById('btn-speak-toggle'),

  // Terminal Console
  terminalBody: document.getElementById('terminal-body'),
  termUserInput: document.getElementById('term-user-input'),
  termInputPrefix: document.getElementById('term-input-prefix'),

  // Telemetry Inspector
  oopEventFeed: document.getElementById('oop-event-feed'),
  eventCountBadge: document.getElementById('event-count-badge')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initModeSwitcher();
  initAITelemetryListener();
  initSpeechFeatures();

  // Start initial interview session
  restartSession();
});

// ============================================================================
// 1. Mode Switcher (GUI vs Terminal)
// ============================================================================
function initModeSwitcher() {
  elements.btnModeGui.addEventListener('click', () => {
    state.activeMode = 'gui';
    elements.btnModeGui.classList.add('active');
    elements.btnModeTerm.classList.remove('active');
    elements.guiContainer.style.display = 'flex';
    elements.termContainer.style.display = 'none';
    elements.guiUserInput.focus();
  });

  elements.btnModeTerm.addEventListener('click', () => {
    state.activeMode = 'term';
    elements.btnModeTerm.classList.add('active');
    elements.btnModeGui.classList.remove('active');
    elements.guiContainer.style.display = 'none';
    elements.termContainer.style.display = 'flex';
    elements.termUserInput.focus();
  });
}

// ============================================================================
// 2. Real-Time AI Telemetry Listener
// ============================================================================
function initAITelemetryListener() {
  aiEvents.subscribe(event => {
    state.eventCount++;
    elements.eventCountBadge.textContent = `${state.eventCount} events`;

    const entry = document.createElement('div');
    entry.className = `event-entry polymorphism`;

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    entry.innerHTML = `
      <div class="event-header">
        <span class="event-pillar" style="color: #a78bfa;">[${event.domain}] ${event.badge}</span>
        <span class="event-time">${timeStr}</span>
      </div>
      <div class="event-msg">${escapeHtml(event.message)}</div>
    `;

    elements.oopEventFeed.prepend(entry);
  });
}

// ============================================================================
// 3. Interview Session Lifecycle
// ============================================================================
elements.btnStartSession.addEventListener('click', restartSession);
elements.trackSelect.addEventListener('change', restartSession);

function restartSession() {
  state.candidateName = elements.candidateInput.value.trim() || 'Candidate';
  state.trackChoice = elements.trackSelect.value;

  // Instantiate AI Interviewer for chosen domain
  state.bot = createAIInterviewer(
    state.trackChoice,
    state.candidateName,
    state.model
  );

  // Update UI headers
  elements.guiTrackTitle.textContent = state.bot.getTrackName();
  elements.guiActiveModel.textContent = `Target Domain: ${state.bot.getTrackName()} • Senior AI Engineer Track`;
  elements.termInputPrefix.textContent = `${state.candidateName}>`;

  // Reset Progress Indicators
  updateRoundDots(1, 3);

  // Clear Chat and Terminal
  elements.chatMessages.innerHTML = '';
  elements.terminalBody.innerHTML = '';

  // Terminal Banner
  termPrint('================================================================', 'term-dim');
  termPrint('   AI ENGINEER TECHNICAL INTERVIEW PREP (2026 BENCHMARK)', 'term-prompt');
  termPrint('   Transformers • Attention • LoRA • RAG Systems • AI Agents • vLLM', 'term-dim');
  termPrint('================================================================', 'term-dim');
  termPrint(`[AI System] Technical assessment initialized for candidate '${state.candidateName}'.`, 'term-oop');
  termPrint(`[Domain] ${state.bot.getTrackName()}`, 'term-oop');
  termPrint('');

  // Start interview with opening question
  const openingQ = state.bot.start();

  // Add bot opening question to GUI
  addGuiMessage('bot', openingQ, `Lead AI Evaluator (${state.bot.getTrackName()})`);

  // Add opening question to Terminal
  termPrint(`[Interviewer]:\n${openingQ}`, 'term-bot');
  termPrint('');

  // Speak opening question if enabled
  speakText(openingQ);

  // Focus input
  if (state.activeMode === 'gui') {
    elements.guiUserInput.focus();
  } else {
    elements.termUserInput.focus();
  }
}

// User Answer Submission (GUI)
elements.btnGuiSend.addEventListener('click', handleGuiSubmit);
elements.guiUserInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleGuiSubmit();
  }
});

const btnInsertTemplate = document.getElementById('btn-insert-template');
if (btnInsertTemplate) {
  btnInsertTemplate.addEventListener('click', () => {
    const template = `\`\`\`python\n# Python / PyTorch Implementation:\nimport torch\nimport torch.nn as nn\n\n\`\`\``;
    const current = elements.guiUserInput.value;
    elements.guiUserInput.value = current ? current + "\n" + template : template;
    elements.guiUserInput.focus();
  });
}

async function handleGuiSubmit() {
  const text = elements.guiUserInput.value.trim();
  if (!text) return;

  elements.guiUserInput.value = '';
  addGuiMessage('candidate', text, `${state.candidateName} (Round ${state.bot.currentRound}/3)`);

  // Sync to terminal
  termPrint(`[${state.candidateName}]:\n${text}`, 'term-candidate');

  await processAnswer(text);
}

// User Answer Submission (Terminal)
elements.termUserInput.addEventListener('keydown', async e => {
  if (e.key === 'Enter') {
    const text = elements.termUserInput.value.trim();
    if (!text) return;

    elements.termUserInput.value = '';
    termPrint(`[${state.candidateName}]:\n${text}`, 'term-candidate');

    // Sync to GUI
    addGuiMessage('candidate', text, `${state.candidateName} (Round ${state.bot.currentRound}/3)`);

    await processAnswer(text);
  }
});

async function processAnswer(text) {
  // Show thinking indicator
  const typingEl = showGuiTypingIndicator();
  termPrint('\n[Interviewer is analyzing technical depth & code accuracy...]', 'term-dim');

  try {
    const result = await state.bot.submitAnswer(text);
    removeGuiTypingIndicator(typingEl);

    if (result.isFinished) {
      // Completed! Show final evaluation
      updateRoundDots(3, 3);

      addGuiMessage('bot', result.report, 'AI Engineering Scorecard', true);

      termPrint('\n================================================================', 'term-dim');
      termPrint('=== FINAL EVALUATION SCORECARD ===', 'term-eval');
      termPrint('================================================================', 'term-dim');
      termPrint(result.report, 'term-prompt');
      termPrint('');

      speakText("Interview complete. Here is your AI Engineering evaluation scorecard.");
    } else {
      // Next Round Question
      updateRoundDots(result.round, result.maxRounds);

      addGuiMessage('bot', result.question, `Interviewer (Round ${result.round}/${result.maxRounds})`);

      termPrint(`\n[Interviewer]:\n${result.question}\n`, 'term-bot');

      speakText(result.question);
    }
  } catch (err) {
    removeGuiTypingIndicator(typingEl);
    addGuiMessage('bot', `Error processing response: ${err.message}`, 'System Alert');
    termPrint(`[ERROR]: ${err.message}`, 'term-eval');
  }

  // Refocus input
  if (state.activeMode === 'gui') {
    elements.guiUserInput.focus();
  } else {
    elements.termUserInput.focus();
  }
}

// UI Code & Markdown Parser
function formatMarkdownWithCode(text) {
  if (!text) return '';
  // 1. Process ```python / ``` blocks
  let formatted = text.replace(/```(?:python|py)?([\s\S]*?)```/gi, (match, code) => {
    const escapedCode = escapeHtml(code.trim());
    return `<div class="chat-code-block">
      <div class="chat-code-header">
        <span>Python / PyTorch</span>
        <button type="button" class="copy-snippet-btn" onclick="navigator.clipboard.writeText(this.parentElement.nextElementSibling.innerText); this.innerText='Copied!'; setTimeout(()=>this.innerText='Copy', 1500);">Copy</button>
      </div>
      <code>${escapedCode}</code>
    </div>`;
  });

  // 2. Process inline `code`
  formatted = formatted.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // 3. Process bold **text**
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // 4. Process newlines
  formatted = formatted.replace(/\n/g, '<br>');

  return formatted;
}

// UI Message Renderers
function addGuiMessage(role, content, meta = '', isEvaluation = false) {
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${role}`;

  let parsedHtml = formatMarkdownWithCode(content);

  if (isEvaluation) {
    const scoreMatch = content.match(/Score:\s*([0-9.]+)\s*\/\s*10/i);
    const scoreVal = scoreMatch ? scoreMatch[1] : '9.2';

    const verdictMatch = content.match(/Verdict:\s*([^|\n]+)/i);
    const verdictVal = verdictMatch ? verdictMatch[1].trim() : 'STRONG HIRE';

    bubble.innerHTML = `
      <div class="bubble-meta">
        <span>🏆 ${meta}</span>
        <span>Senior AI Engineer Rubric</span>
      </div>
      <div class="eval-card">
        <div class="eval-header">
          <div class="eval-score-ring">
            <span class="score-number">${scoreVal}</span>
            <div>
              <div style="font-weight: 700; color: #fff;">Overall AI Score</div>
              <div class="score-label">out of 10.0</div>
            </div>
          </div>
          <span class="verdict-badge">${verdictVal}</span>
        </div>
        <div style="font-size: 0.875rem; color: #cbd5e1; line-height: 1.6;">
          ${parsedHtml}
        </div>
        <button id="btn-download-transcript" class="btn-secondary" style="width: fit-content; margin-top: 0.5rem; font-size: 0.8rem;">
          📥 Download Technical Interview Transcript (.md)
        </button>
      </div>
    `;

    elements.chatMessages.appendChild(bubble);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;

    const dlBtn = bubble.querySelector('#btn-download-transcript');
    if (dlBtn) {
      dlBtn.addEventListener('click', downloadTranscript);
    }
    return;
  }

  bubble.innerHTML = `
    <div class="bubble-meta">
      <span>${escapeHtml(meta)}</span>
      <span>${role === 'bot' ? 'Evaluator' : 'Candidate'}</span>
    </div>
    <div>${parsedHtml}</div>
  `;

  elements.chatMessages.appendChild(bubble);
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function showGuiTypingIndicator() {
  const el = document.createElement('div');
  el.className = 'typing-indicator';
  el.innerHTML = `
    <span></span><span></span>
    <span style="animation-delay: 0s;"></span>
    <span style="margin-left: 0.5rem;">AI Evaluator is analyzing...</span>
  `;
  elements.chatMessages.appendChild(el);
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
  return el;
}

function removeGuiTypingIndicator(el) {
  if (el && el.parentNode) {
    el.parentNode.removeChild(el);
  }
}

function termPrint(text, cssClass = '') {
  const line = document.createElement('div');
  line.className = `term-line ${cssClass}`;
  line.textContent = text;
  elements.terminalBody.appendChild(line);
  elements.terminalBody.scrollTop = elements.terminalBody.scrollHeight;
}

function updateRoundDots(current, max) {
  const dots = elements.roundsIndicator.querySelectorAll('.round-dot');
  dots.forEach((dot, index) => {
    dot.className = 'round-dot';
    if (index + 1 < current) {
      dot.classList.add('completed');
    } else if (index + 1 === current) {
      dot.classList.add('active');
    }
  });
}

// ============================================================================
// 4. Speech Features (Web Speech API)
// ============================================================================
function initSpeechFeatures() {
  elements.btnSpeakToggle.addEventListener('click', () => {
    state.isSpeaking = !state.isSpeaking;
    elements.btnSpeakToggle.style.opacity = state.isSpeaking ? '1' : '0.4';
    if (!state.isSpeaking && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  });

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    elements.btnVoiceInput.addEventListener('click', () => {
      if (state.isRecording) {
        recognition.stop();
        return;
      }
      try {
        recognition.start();
        state.isRecording = true;
        elements.btnVoiceInput.classList.add('active');
      } catch (e) {
        console.warn('Speech recognition start failed:', e);
      }
    });

    recognition.onresult = event => {
      const transcript = event.results[0][0].transcript;
      if (state.activeMode === 'gui') {
        elements.guiUserInput.value += (elements.guiUserInput.value ? ' ' : '') + transcript;
      } else {
        elements.termUserInput.value += (elements.termUserInput.value ? ' ' : '') + transcript;
      }
    };

    recognition.onend = () => {
      state.isRecording = false;
      elements.btnVoiceInput.classList.remove('active');
    };

    recognition.onerror = () => {
      state.isRecording = false;
      elements.btnVoiceInput.classList.remove('active');
    };
  } else {
    elements.btnVoiceInput.title = 'Speech Recognition not supported in this browser';
    elements.btnVoiceInput.style.opacity = '0.3';
    elements.btnVoiceInput.style.cursor = 'not-allowed';
  }
}

function speakText(text) {
  if (!state.isSpeaking || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();

  // Strip code blocks from speech playback so it doesn't read raw brackets
  const cleaned = text
    .replace(/^Interviewer:\s*/i, '')
    .replace(/```[\s\S]*?```/g, ' [Refer to code snippet above] ')
    .replace(/[*_#`]/g, '');
  const utterance = new SpeechSynthesisUtterance(cleaned);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  const voices = window.speechSynthesis.getVoices();
  const enVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
  if (enVoice) utterance.voice = enVoice;

  window.speechSynthesis.speak(utterance);
}

// ============================================================================
// 5. Download Transcript
// ============================================================================
function downloadTranscript() {
  if (!state.bot) return;

  const content = `# AI Engineer Technical Interview Transcript
**Candidate:** ${state.candidateName}
**Domain:** ${state.bot.getTrackName()}
**Target Level:** Senior AI / ML Systems Engineer
**Date:** ${new Date().toLocaleString()}

---

## Technical Discussion & Code Log
${state.bot.getConversationHistory()}

---
*Generated by Interview Prep (Production AI Engineering Platform)*
`;

  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ai_engineer_interview_${state.candidateName.toLowerCase().replace(/\s+/g, '_')}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
