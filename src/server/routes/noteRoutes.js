import express from 'express';
import mongoose from 'mongoose';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Note from '../models/Note.js';
import roleCheck from '../middleware/roleCheck.js';
import upload, { uploadToCloudinary } from '../config/cloudinary.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const NOTES_FILE = join(__dirname, '..', 'data_notes.json');

const getLocalNotes = () => {
  try {
    if (fs.existsSync(NOTES_FILE)) {
      return JSON.parse(fs.readFileSync(NOTES_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading local notes file:', e);
  }
  return [];
};

const saveLocalNotes = (notes) => {
  try {
    fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2));
  } catch (e) {
    console.error('Error writing local notes file:', e);
  }
};

// GET /api/notes - Fetch notes
router.get('/', async (req, res) => {
  try {
    const { classLevel } = req.query;
    if (mongoose.connection.readyState === 1) {
      try {
        const filter = classLevel ? { classLevel: String(classLevel) } : {};
        const notes = await Note.find(filter).sort({ createdAt: -1 });
        return res.json(notes);
      } catch (dbErr) {
        console.warn('MongoDB notes fetch warning:', dbErr.message);
      }
    }
    let notes = getLocalNotes();
    if (classLevel) {
      notes = notes.filter((n) => String(n.classLevel) === String(classLevel));
    }
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

    let fileUrl;
    try {
      fileUrl = await uploadToCloudinary(req.file.buffer, req.file.originalname);
    } catch (cloudErr) {
      return res.status(500).json({ message: cloudErr.message });
    }

    const notePayload = {
      title,
      classLevel: String(classLevel),
      category: category || 'Other',
      fileUrl,
      uploadedBy: req.user?.id || req.user?._id
    };

    let savedNote = null;

    if (mongoose.connection.readyState === 1) {
      try {
        savedNote = await Note.create(notePayload);
      } catch (dbErr) {
        console.warn('MongoDB note create warning:', dbErr.message);
      }
    }

    // Always mirror to local backup store as well
    const localNote = {
      _id: savedNote?._id ? String(savedNote._id) : ('note_' + Date.now()),
      title,
      classLevel: String(classLevel),
      category: category || 'Other',
      fileUrl,
      uploadedBy: req.user?.id || req.user?._id,
      createdAt: savedNote?.createdAt || new Date().toISOString(),
    };
    const notes = getLocalNotes();
    notes.unshift(localNote);
    saveLocalNotes(notes);

    return res.status(201).json(savedNote || localNote);
  } catch (err) {
    console.error('Note upload error:', err);
    res.status(500).json({ message: err.message });
  }
});


// PUT /api/notes/:id - Update Note (Teacher Only)
router.put('/:id', roleCheck, async (req, res) => {
  try {
    const { title, classLevel, category } = req.body;
    if (mongoose.connection.readyState === 1) {
      try {
        const updatedNote = await Note.findByIdAndUpdate(
          req.params.id,
          { title, classLevel, category },
          { new: true }
        );
        if (updatedNote) return res.json(updatedNote);
      } catch (dbErr) {
        console.warn('MongoDB note update warning:', dbErr.message);
      }
    }
    const notes = getLocalNotes();
    const note = notes.find((n) => n._id === req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    note.title = title || note.title;
    note.classLevel = classLevel || note.classLevel;
    note.category = category || note.category;
    saveLocalNotes(notes);
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/notes/:id - Delete Note (Teacher Only)
router.delete('/:id', roleCheck, async (req, res) => {
  try {
    const targetId = req.params.id;
    if (mongoose.connection.readyState === 1) {
      try {
        const deletedNote = await Note.findByIdAndDelete(targetId);
        if (deletedNote) return res.json({ message: 'Note deleted successfully' });
      } catch (dbErr) {
        console.warn('MongoDB note delete warning:', dbErr.message);
      }
    }
    let notes = getLocalNotes();
    const initialLen = notes.length;
    notes = notes.filter((n) => String(n._id || n.id) !== String(targetId));
    if (notes.length === initialLen) return res.status(404).json({ message: 'Note not found' });
    saveLocalNotes(notes);
    res.json({ message: 'Note deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
