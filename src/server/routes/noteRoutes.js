import express from 'express';
import Note from '../models/Note.js';
import roleCheck from '../middleware/roleCheck.js';
import upload from '../config/cloudinary.js';

const router = express.Router();

// GET /api/notes - Fetch notes
router.get('/', async (req, res) => {
  try {
    const { classLevel } = req.query;
    const filter = classLevel ? { classLevel } : {};
    const notes = await Note.find(filter).sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/notes - Create Note (Teacher Only)
router.post('/', roleCheck, upload.single('file'), async (req, res) => {
  try {
    const { title, classLevel, category } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const newNote = await Note.create({
      title,
      classLevel,
      category,
      fileUrl: req.file.path, // Cloudinary URL
      uploadedBy: req.user.id
    });

    res.status(201).json(newNote);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/notes/:id - Update Note (Teacher Only)
router.put('/:id', roleCheck, async (req, res) => {
  try {
    const { title, classLevel, category } = req.body;
    const updatedNote = await Note.findByIdAndUpdate(
      req.params.id,
      { title, classLevel, category },
      { new: true }
    );
    if (!updatedNote) return res.status(404).json({ message: 'Note not found' });
    res.json(updatedNote);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/notes/:id - Delete Note (Teacher Only)
router.delete('/:id', roleCheck, async (req, res) => {
  try {
    const deletedNote = await Note.findByIdAndDelete(req.params.id);
    if (!deletedNote) return res.status(404).json({ message: 'Note not found' });
    res.json({ message: 'Note deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
