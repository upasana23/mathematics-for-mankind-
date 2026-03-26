import express from 'express';
import Doubt from '../models/Doubt.js';
import auth from '../middleware/auth.js';
import isTeacher from '../middleware/isTeacher.js';
import upload from '../config/cloudinary.js';

const router = express.Router();

// POST /api/doubts - Submit a doubt (Student)
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { title, description } = req.body;
    
    const newDoubt = await Doubt.create({
      studentId: req.user.id,
      studentName: req.user.name,
      classLevel: req.user.classLevel || '10', // From JWT
      title,
      description: description || '',
      imageUrl: req.file ? req.file.path : null, // Cloudinary URL
      status: 'Pending'
    });

    res.status(201).json(newDoubt);
  } catch (err) {
    console.error('Submit doubt error:', err.message);
    res.status(500).json({ message: 'Server error: could not submit doubt.' });
  }
});

// GET /api/doubts/my - See own doubts (Student)
router.get('/my', auth, async (req, res) => {
  try {
    const doubts = await Doubt.find({ studentId: req.user.id }).sort({ createdAt: -1 });
    res.json(doubts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/doubts/admin - See all doubts (Teacher)
router.get('/admin', auth, isTeacher, async (req, res) => {
  try {
    const doubts = await Doubt.find({ status: 'Pending' }).sort({ classLevel: 1, createdAt: -1 });
    res.json(doubts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/doubts/:id/solve - Solve a doubt (Teacher)
router.put('/:id/solve', auth, isTeacher, upload.single('solutionImage'), async (req, res) => {
  try {
    const { solutionText } = req.body;
    const doubt = await Doubt.findById(req.params.id);
    
    if (!doubt) {
      return res.status(404).json({ message: 'Doubt not found' });
    }

    doubt.status = 'Solved';
    doubt.solutionText = solutionText || doubt.solutionText;
    if (req.file) {
      doubt.solutionImageUrl = req.file.path;
    }

    await doubt.save();
    res.json(doubt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
