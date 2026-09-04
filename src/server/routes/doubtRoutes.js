import express from 'express';
import mongoose from 'mongoose';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Doubt from '../models/Doubt.js';
import auth from '../middleware/auth.js';
import isTeacher from '../middleware/isTeacher.js';
import upload from '../config/cloudinary.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DOUBTS_FILE = join(__dirname, '..', 'data_doubts.json');

const getLocalDoubts = () => {
  try {
    if (fs.existsSync(DOUBTS_FILE)) {
      return JSON.parse(fs.readFileSync(DOUBTS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading local doubts file:', e);
  }
  return [];
};

const saveLocalDoubts = (doubts) => {
  try {
    fs.writeFileSync(DOUBTS_FILE, JSON.stringify(doubts, null, 2));
  } catch (e) {
    console.error('Error writing local doubts file:', e);
  }
};

// POST /api/doubts - Submit a doubt (Student)
router.post('/', auth, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.warn('Multer/Cloudinary upload warning:', err.message);
    }
    next();
  });
}, async (req, res) => {
  try {
    const { title, description } = req.body;
    
    if (mongoose.connection.readyState === 1) {
      try {
        const newDoubt = await Doubt.create({
          studentId: req.user.id,
          studentName: req.user.name,
          classLevel: req.user.classLevel || '10',
          title: title || 'Question Image',
          description: description || '',
          imageUrl: req.file ? req.file.path : null,
          status: 'Pending'
        });
        return res.status(201).json(newDoubt);
      } catch (dbErr) {
        console.warn('MongoDB create doubt warning, saving locally:', dbErr.message);
      }
    }

    // Local fallback
    const newDoubt = {
      _id: 'doubt_' + Date.now(),
      studentId: req.user.id,
      studentName: req.user.name,
      classLevel: req.user.classLevel || '10',
      title: title || 'Question Image',
      description: description || '',
      imageUrl: req.file ? req.file.path : null,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };
    const doubts = getLocalDoubts();
    doubts.unshift(newDoubt);
    saveLocalDoubts(doubts);
    res.status(201).json(newDoubt);
  } catch (err) {
    console.error('Submit doubt error:', err.message);
    res.status(500).json({ message: `Server error: ${err.message}` });
  }
});

// GET /api/doubts/my - See own doubts (Student)
router.get('/my', auth, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      try {
        const doubts = await Doubt.find({ studentId: req.user.id }).sort({ createdAt: -1 });
        return res.json(doubts);
      } catch (dbErr) {
        console.warn('MongoDB find doubts warning:', dbErr.message);
      }
    }
    const doubts = getLocalDoubts().filter((d) => d.studentId === req.user.id);
    res.json(doubts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/doubts/admin - See all doubts (Teacher)
router.get('/admin', auth, isTeacher, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      try {
        const doubts = await Doubt.find({ status: 'Pending' }).sort({ classLevel: 1, createdAt: -1 });
        return res.json(doubts);
      } catch (dbErr) {
        console.warn('MongoDB admin doubts warning:', dbErr.message);
      }
    }
    const doubts = getLocalDoubts().filter((d) => d.status === 'Pending');
    res.json(doubts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/doubts/:id/solve - Solve a doubt (Teacher)
router.put('/:id/solve', auth, isTeacher, (req, res, next) => {
  upload.single('solutionImage')(req, res, (err) => {
    if (err) console.warn('Multer/Cloudinary solution upload warning:', err.message);
    next();
  });
}, async (req, res) => {
  try {
    const { solutionText } = req.body;
    
    if (mongoose.connection.readyState === 1) {
      try {
        const doubt = await Doubt.findById(req.params.id);
        if (doubt) {
          doubt.status = 'Solved';
          doubt.solutionText = solutionText || doubt.solutionText;
          if (req.file) doubt.solutionImageUrl = req.file.path;
          await doubt.save();
          return res.json(doubt);
        }
      } catch (dbErr) {
        console.warn('MongoDB solve doubt warning:', dbErr.message);
      }
    }

    const doubts = getLocalDoubts();
    const doubt = doubts.find((d) => d._id === req.params.id);
    if (!doubt) {
      return res.status(404).json({ message: 'Doubt not found' });
    }
    doubt.status = 'Solved';
    doubt.solutionText = solutionText || doubt.solutionText;
    if (req.file) doubt.solutionImageUrl = req.file.path;
    saveLocalDoubts(doubts);
    res.json(doubt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/doubts/ai-solve - Solve on your own with help of AI (Hints or Full Solution)
router.post('/ai-solve', async (req, res) => {
  try {
    const { doubtText, imageBase64, mimeType, mode, userPrompt } = req.body;

    if (!doubtText && !imageBase64) {
      return res.status(400).json({ message: 'Please provide doubt description or upload an image.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        message: 'GEMINI_API_KEY is not configured in Render environment variables. Please add GEMINI_API_KEY in your Render Dashboard -> Environment tab.'
      });
    }
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
- You MAY use emoji section headers like 🎯, 💡, 🧭, ❓ as plain text labels.
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

    // Support image analysis if imageBase64 is provided
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

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
      }),
      signal: AbortSignal.timeout(25000),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `Gemini API returned HTTP ${response.status}`);
    }

    const aiAnswer = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!aiAnswer) {
      throw new Error('Gemini did not return an answer.');
    }

    res.json({
      success: true,
      answer: aiAnswer,
      mode: isHintMode ? 'hints' : 'solution',
    });
  } catch (err) {
    console.error('AI Solve error:', err.message);
    res.status(500).json({ message: `AI Tutor error: ${err.message}` });
  }
});

export default router;
