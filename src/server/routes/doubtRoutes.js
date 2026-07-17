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

export default router;
