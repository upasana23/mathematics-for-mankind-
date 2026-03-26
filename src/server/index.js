import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import User from './models/User.js';
import roleCheck from './middleware/roleCheck.js';
import noteRoutes from './routes/noteRoutes.js';
import doubtRoutes from './routes/doubtRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'mathematics-for-mankind-fallback-secret';

// ── Middleware ──────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// ── Helper: generate JWT ───────────────────────────────
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// ── Routes ─────────────────────────────────────────────

// REGISTER
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, school, classLevel, password, role, adminSecret } = req.body;

    // Validate required fields
    if (!name || !password) {
      return res.status(400).json({ message: 'Name and password are required.' });
    }

    // If teacher, validate admin secret
    if (role === 'teacher') {
      const envSecret = process.env.ADMIN_SECRET_KEY;
      if (!envSecret || adminSecret !== envSecret) {
        return res.status(403).json({ message: 'Invalid Admin Secret Key. Access denied.' });
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ name });
    if (existingUser) {
      return res.status(409).json({ message: 'A user with this name already exists.' });
    }

    // Create user
    const user = await User.create({
      name,
      school: school || '',
      classLevel: classLevel || '10',
      role: role || 'student',
      password,
    });

    const token = generateToken(user);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        school: user.school,
        classLevel: user.classLevel,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Register error details:', err);
    res.status(500).json({ message: `Server error: ${err.message}` });
  }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
  try {
    const { name, password } = req.body;

    if (!name || !password) {
      return res.status(400).json({ message: 'Name and password are required.' });
    }

    const user = await User.findOne({ name });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials. User not found.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials. Wrong password.' });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        school: user.school,
        classLevel: user.classLevel,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Login error details:', err);
    res.status(500).json({ message: `Server error: ${err.message}` });
  }
});

app.use('/api/notes', noteRoutes);
app.use('/api/doubts', doubtRoutes);

// SOLUTIONS (Keeping placeholders for now)
app.get('/api/solutions', async (req, res) => {
  res.json({ message: 'Fetching all solutions...' });
});

app.post('/api/solutions', roleCheck, async (req, res) => {
  res.status(201).json({ message: 'Solution created by teacher.' });
});

app.put('/api/solutions/:id', roleCheck, async (req, res) => {
  res.json({ message: `Solution ${req.params.id} updated by teacher.` });
});

app.delete('/api/solutions/:id', roleCheck, async (req, res) => {
  res.json({ message: `Solution ${req.params.id} deleted by teacher.` });
});

// ── Error Handling Middleware ─────────────────────────
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: `Multer Error: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
});

// ── Connect to MongoDB and start ───────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
