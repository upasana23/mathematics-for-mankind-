import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Lightbulb, BookOpen, Send, X, Copy, Check, Brain, RotateCcw, AlertCircle } from 'lucide-react';
import API_BASE from '../config/api';

const QUICK_PROMPTS = [
  '💡 Give me the next clue',
  '🔍 Explain simpler',
  '📐 Which theorem applies?',
  '📝 Show full step-by-step',
];

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Strip LaTeX delimiters (\( \), \[ \], $...$ , $$...$$) and markdown bold/italic
const cleanText = (raw = '') =>
  raw
    // Remove inline LaTeX \( ... \) and \[ ... \]
    .replace(/\\\(([\s\S]*?)\\\)/g, '$1')
    .replace(/\\\[([\s\S]*?)\\\]/g, '$1')
    // Remove block $$ ... $$
    .replace(/\$\$([\s\S]*?)\$\$/g, '$1')
    // Remove inline $ ... $
    .replace(/\$([^$\n]+?)\$/g, '$1')
    // Remove LaTeX backslash commands like \frac, \sqrt etc. but keep the content inside braces
    .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, '$1')
    // Remove any remaining lone LaTeX backslash commands
    .replace(/\\[a-zA-Z]+/g, '')
    // Remove markdown bold **text** and __text__
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    // Remove markdown italic *text* and _text_
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Collapse any extra blank lines introduced
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const callGeminiDirect = async ({ doubtText, imageBase64, mimeType, mode, userPrompt }) => {
  const isHintMode = mode !== 'solution';

  const NO_LATEX_RULE = `
IMPORTANT FORMATTING RULES (strictly follow):
- Do NOT use LaTeX notation of any kind. Do NOT use \\( ... \\), \\[ ... \\], $...$ or $$ ... $$.
- Do NOT use backslash commands like \\frac, \\sqrt, \\int, \\alpha, \\theta, \\cdot, etc.
- Write all mathematical expressions in plain readable text. Examples:
    - Instead of \\( x^2 + 5x + 6 = 0 \\), write: x^2 + 5x + 6 = 0
    - Instead of \\( \\frac{a}{b} \\), write: a/b
    - Instead of \\( \\sqrt{x} \\), write: sqrt(x)
    - Instead of \\( \\alpha \\), write: alpha
    - Instead of \\( \\int_0^1 x dx \\), write: integral from 0 to 1 of x dx
- Do NOT use markdown bold (**text**) or italic (*text*).
- You MAY use emoji section headers like 🎯, 💡, 🧭, ❓ as plain text.
- Keep all output as clean, plain readable English text.`;

  const systemInstruction = isHintMode
    ? `You are an expert, encouraging Mathematics Teacher & Mentor at "Mathematics for Mankind".
Your goal is: "Solve on your own with help of AI".
DO NOT simply give away the final numerical answer or final expression immediately. Instead, guide the student with conceptual clues and hints so they can experience the joy of solving it themselves!
Structure your guidance into these sections:
1. 🎯 Core Concept: What fundamental theorem, formula, or mathematical property is this problem testing?
2. 💡 Clue 1 (How to Start): What is the very first step to write on paper?
3. 🧭 Clue 2 (Key Bridge): What intermediate equation or relationship connects the knowns to the unknowns?
4. ❓ Self-Check Challenge: A probing question for the student to verify their work and arrive at the final answer themselves.
End with a warm, motivating sentence.${NO_LATEX_RULE}`
    : `You are a Master Mathematics Teacher at "Mathematics for Mankind".
Provide a rigorous, clear, complete step-by-step solution and derivation.
Structure your response into:
1. 📐 Given & Target Objective
2. 🔬 Step-by-Step Derivation & Calculations
3. 🎯 Final Solution / Result
4. 💡 Exam Tip & Common Pitfalls to Avoid
Explain every calculation clearly so the student masters the method thoroughly.${NO_LATEX_RULE}`;

  const parts = [];
  if (imageBase64) {
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    parts.push({
      inlineData: {
        mimeType: mimeType || 'image/jpeg',
        data: cleanBase64,
      },
    });
  }

  const promptText = `${systemInstruction}\n\nStudent's Problem / Doubt:\n${doubtText || '(See attached math scratchpad/problem image)'}${userPrompt ? `\n\nStudent's specific question: ${userPrompt}` : ''}`;
  parts.push({ text: promptText });

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts }] }),
    signal: AbortSignal.timeout(25000),
  });

  const contentType = res.headers.get('content-type') || '';
  if (!res.ok) {
    let errMsg = `Gemini API HTTP ${res.status}`;
    if (contentType.includes('application/json')) {
      const errJson = await res.json();
      errMsg = errJson.error?.message || errMsg;
    }
    throw new Error(errMsg);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No explanation returned by Gemini.');
  return text;
};

const AiTutorModal = ({ isOpen, onClose, doubtText = '', image = null }) => {
  const [mode, setMode] = useState('hints'); // 'hints' or 'solution'
  const [isLoading, setIsLoading] = useState(false);
  const [aiAnswer, setAiAnswer] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [followUp, setFollowUp] = useState('');
  const [conversation, setConversation] = useState([]);
  const answerRef = useRef(null);

  // Request AI generation
  const requestAiSolve = async (selectedMode = mode, customPrompt = '') => {
    setIsLoading(true);
    setError('');

    let imageBase64 = null;
    let mimeType = 'image/jpeg';

    if (image) {
      if (image.startsWith('data:')) {
        imageBase64 = image;
        const mimeMatch = image.match(/^data:([^;]+);/);
        if (mimeMatch) mimeType = mimeMatch[1];
      }
    }

    const effectiveDoubtText = image && !image.startsWith('data:') && image.startsWith('http')
      ? `${doubtText || 'Mathematical problem'}\n[Attached Image Reference: ${image}]`
      : doubtText;

    let answerText = '';

    // 1. First attempt via backend
    try {
      const res = await fetch(`${API_BASE}/api/doubts/ai-solve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doubtText: effectiveDoubtText,
          imageBase64,
          mimeType,
          mode: selectedMode,
          userPrompt: customPrompt,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.answer) {
          answerText = data.answer;
        }
      }
    } catch (backendErr) {
      console.warn('Backend AI endpoint attempt skipped, switching to direct Gemini:', backendErr.message);
    }

    // 2. Direct client fallback to Gemini if backend is offline or un-restarted
    if (!answerText) {
      try {
        answerText = await callGeminiDirect({
          doubtText: effectiveDoubtText,
          imageBase64,
          mimeType,
          mode: selectedMode,
          userPrompt: customPrompt,
        });
      } catch (geminiErr) {
        console.error('Gemini direct error:', geminiErr);
        setError(geminiErr.message || 'Failed to connect to AI Tutor.');
        setIsLoading(false);
        return;
      }
    }

    setAiAnswer(answerText);

    if (customPrompt) {
      setConversation((prev) => [
        ...prev,
        { role: 'user', text: customPrompt },
        { role: 'ai', text: answerText },
      ]);
      setFollowUp('');
    } else {
      setConversation([{ role: 'ai', text: answerText }]);
    }
    setIsLoading(false);
  };

  // Trigger solve on open if doubtText or image is present
  useEffect(() => {
    if (isOpen && (doubtText || image)) {
      setConversation([]);
      setAiAnswer('');
      setError('');
      requestAiSolve(mode);
    }
  }, [isOpen, doubtText, image]);

  const handleModeChange = (newMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    requestAiSolve(newMode);
  };

  const handleCopy = () => {
    if (!aiAnswer) return;
    navigator.clipboard.writeText(aiAnswer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFollowUpSubmit = (e) => {
    e.preventDefault();
    if (!followUp.trim() || isLoading) return;
    requestAiSolve(mode, followUp.trim());
  };

  const handleQuickPrompt = (prompt) => {
    if (isLoading) return;
    if (prompt.includes('full step-by-step')) {
      setMode('solution');
      requestAiSolve('solution', 'Please provide the complete step-by-step mathematical derivation.');
    } else {
      requestAiSolve(mode, prompt);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-navy-900 to-slate-950 border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10"
        >
          {/* Top Glow Accents */}
          <div className="absolute -top-16 -left-16 w-36 h-36 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-purple-500/25 rounded-full blur-3xl pointer-events-none" />

          {/* Modal Header */}
          <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between relative z-10 bg-white/[0.02]">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-purple-600 flex items-center justify-center shadow-lg shadow-teal-500/20 text-white">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg sm:text-xl font-bold text-white">AI Math Mentor</h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center">
                    <Sparkles size={10} className="mr-1 text-yellow-300" /> Powered by Gemini
                  </span>
                </div>
                <p className="text-xs text-slate-400">Solve on your own with guided socratic hints & clues</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="px-4 sm:px-6 pt-3 pb-2 bg-black/20 border-b border-white/5 flex items-center justify-between flex-wrap gap-2">
            <div className="flex bg-slate-800/80 p-1 rounded-xl border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => handleModeChange('hints')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  mode === 'hints'
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Lightbulb size={13} />
                <span>Hints (Solve on your own)</span>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange('solution')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  mode === 'solution'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BookOpen size={13} />
                <span>Full Derivation</span>
              </button>
            </div>

            <div className="flex items-center space-x-1">
              {aiAnswer && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center space-x-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-white/5 transition-colors"
                  title="Copy AI Guidance"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => requestAiSolve(mode)}
                disabled={isLoading}
                className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-white/5 transition-colors disabled:opacity-50"
                title="Regenerate"
              >
                <RotateCcw size={14} className={isLoading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Problem Banner Preview */}
          {(doubtText || image) && (
            <div className="px-4 sm:px-6 py-2.5 bg-purple-950/20 border-b border-purple-500/10 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center space-x-2 truncate">
                <span className="font-semibold text-purple-300 shrink-0">Problem:</span>
                <span className="truncate text-slate-200">{doubtText || '(Image attached)'}</span>
              </div>
              {image && (
                <div className="shrink-0 ml-2 w-7 h-7 rounded overflow-hidden border border-white/20">
                  <img src={image} alt="Doubt thumb" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          )}

          {/* Modal Body - Conversation & Answer */}
          <div ref={answerRef} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar text-sm">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start text-red-300 text-xs sm:text-sm">
                <AlertCircle size={18} className="mr-2 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">Could not load AI guidance</p>
                  <p className="text-red-300/80">{error}</p>
                </div>
              </div>
            )}

            {isLoading && !aiAnswer && (
              <div className="py-12 flex flex-col items-center justify-center space-y-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-purple-600 animate-pulse flex items-center justify-center text-white">
                    <Sparkles className="w-7 h-7 animate-spin-slow" />
                  </div>
                  <div className="absolute inset-0 rounded-2xl bg-purple-500/30 blur-xl animate-ping pointer-events-none" />
                </div>
                <div className="text-center">
                  <p className="text-white font-medium">Gemini is analyzing your doubt...</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Formulating core mathematical concepts & guided hints
                  </p>
                </div>
              </div>
            )}

            {/* AI Messages */}
            {conversation.map((msg, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-purple-900/30 border border-purple-500/20 text-purple-100 ml-8'
                    : 'bg-black/40 border border-white/10 text-slate-200'
                }`}
              >
                {msg.role === 'user' && (
                  <p className="text-xs font-semibold text-purple-300 mb-1">Your Question:</p>
                )}
                <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm text-slate-200 selection:bg-purple-500 selection:text-white">
                  {cleanText(msg.text)}
                </div>
              </div>
            ))}

            {isLoading && aiAnswer && (
              <div className="flex items-center space-x-2 text-xs text-purple-300 py-2">
                <Sparkles size={14} className="animate-spin" />
                <span>Formulating follow-up hint...</span>
              </div>
            )}
          </div>

          {/* Quick Action Chips */}
          <div className="px-4 sm:px-6 py-2 bg-slate-900/60 border-t border-white/5 flex items-center space-x-2 overflow-x-auto custom-scrollbar no-scrollbar">
            <span className="text-[11px] text-slate-400 shrink-0">Suggestions:</span>
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleQuickPrompt(prompt)}
                disabled={isLoading}
                className="shrink-0 text-xs px-2.5 py-1 rounded-full bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/30 text-slate-300 hover:text-white transition-all disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Follow-up Question Input */}
          <div className="p-3 sm:p-4 bg-black/40 border-t border-white/10">
            <form onSubmit={handleFollowUpSubmit} className="relative flex items-center">
              <input
                type="text"
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                placeholder="Ask a follow-up or request clarification on this step..."
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl pl-4 pr-12 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all"
              />
              <button
                type="submit"
                disabled={!followUp.trim() || isLoading}
                className="absolute right-1.5 p-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold disabled:opacity-40 disabled:hover:bg-teal-500 transition-colors"
                title="Send follow-up"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AiTutorModal;
