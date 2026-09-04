import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dns from 'dns';

// Configure DNS to avoid querySrv ECONNREFUSED issues on Windows / certain ISPs
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (dnsErr) {
  console.warn('DNS server configuration fallback warning:', dnsErr.message);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });
dotenv.config();
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import User from './models/User.js';
import roleCheck from './middleware/roleCheck.js';
import noteRoutes from './routes/noteRoutes.js';
import doubtRoutes from './routes/doubtRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'mathematics-for-mankind-fallback-secret';

// ── Middleware ──────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// ── Helper: Local User Fallback Store ───────────────────
const getLocalUsers = () => {
  try {
    const filePath = join(__dirname, 'data_users.json');
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading local users file:', e);
  }
  return [];
};

const saveLocalUsers = (users) => {
  try {
    const filePath = join(__dirname, 'data_users.json');
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
  } catch (e) {
    console.error('Error writing local users file:', e);
  }
};

const findUserByName = async (name) => {
  const cleanName = (name || '').trim();
  if (!cleanName) return null;

  if (mongoose.connection.readyState === 1) {
    try {
      const escapeRegex = (str) => str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      const dbUser = await User.findOne({ 
        name: { $regex: new RegExp('^' + escapeRegex(cleanName) + '$', 'i') } 
      });
      if (dbUser) return dbUser;
    } catch (e) {
      console.warn('MongoDB query warning, using local store:', e.message);
    }
  }
  const users = getLocalUsers();
  return users.find((u) => u.name.trim().toLowerCase() === cleanName.toLowerCase()) || null;
};

const createUser = async (data) => {
  if (mongoose.connection.readyState === 1) {
    try {
      return await User.create(data);
    } catch (e) {
      console.warn('MongoDB create warning, saving to local store:', e.message);
    }
  }
  const users = getLocalUsers();
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(data.password, salt);
  const newUser = {
    _id: 'local_' + Date.now(),
    name: data.name,
    school: data.school || '',
    classLevel: data.classLevel || '10',
    role: data.role || 'student',
    password: hashedPassword,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  saveLocalUsers(users);
  return newUser;
};

const verifyPassword = async (user, candidatePassword) => {
  if (user && typeof user.comparePassword === 'function') {
    return await user.comparePassword(candidatePassword);
  }
  if (user && user.password) {
    return await bcrypt.compare(candidatePassword, user.password);
  }
  return false;
};

// ── Helper: generate JWT ───────────────────────────────
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id || user.id, name: user.name, role: user.role, classLevel: user.classLevel },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// ── Routes ─────────────────────────────────────────────

// REGISTER
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, school, classLevel, password, role, adminSecret } = req.body;

    if (!name || !password) {
      return res.status(400).json({ message: 'Name and password are required.' });
    }

    if (role === 'teacher') {
      const envSecret = process.env.ADMIN_SECRET_KEY;
      if (!envSecret || adminSecret !== envSecret) {
        return res.status(403).json({ message: 'Invalid Admin Secret Key. Access denied.' });
      }
    }

    const existingUser = await findUserByName(name);
    if (existingUser) {
      return res.status(409).json({ message: 'A user with this name already exists.' });
    }

    const user = await createUser({
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
        id: user._id || user.id,
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

    const user = await findUserByName(name);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials. User not found.' });
    }

    const isMatch = await verifyPassword(user, password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials. Wrong password.' });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user._id || user.id,
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

// ── YouTube Latest Videos Route ────────────────────────
let cachedYouTubeVideos = null;
let lastYouTubeFetchTime = 0;
const YOUTUBE_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes cache

app.get('/api/youtube/latest', async (req, res) => {
  const now = Date.now();
  if (cachedYouTubeVideos && (now - lastYouTubeFetchTime < YOUTUBE_CACHE_DURATION)) {
    return res.json({ success: true, videos: cachedYouTubeVideos, source: 'cache' });
  }

  try {
    const channelId = 'UC_Vh4We28mI7QMZsI61ZM6g';
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`YouTube responded with HTTP ${response.status}`);
    }

    const xmlText = await response.text();
    const entries = [];
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;

    while ((match = entryRegex.exec(xmlText)) !== null && entries.length < 3) {
      const entryXml = match[1];
      const videoIdMatch = entryXml.match(/<yt:videoId>([\s\S]*?)<\/yt:videoId>/);
      const titleMatch = entryXml.match(/<title>([\s\S]*?)<\/title>/);
      const linkMatch = entryXml.match(/<link[^>]+href="([^"]+)"/);
      const publishedMatch = entryXml.match(/<published>([\s\S]*?)<\/published>/);

      const videoId = videoIdMatch ? videoIdMatch[1].trim() : '';
      let title = titleMatch ? titleMatch[1] : '';
      title = title
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();

      const link = linkMatch ? linkMatch[1] : (videoId ? `https://www.youtube.com/watch?v=${videoId}` : 'https://www.youtube.com/@mathematicsformankind-onlinecl/videos');
      const pubDate = publishedMatch ? publishedMatch[1].trim() : new Date().toISOString();
      const thumbnail = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=400';

      if (videoId || title) {
        entries.push({
          guid: videoId || String(entries.length),
          link,
          thumbnail,
          title,
          pubDate,
        });
      }
    }

    if (entries.length > 0) {
      cachedYouTubeVideos = entries;
      lastYouTubeFetchTime = now;
      return res.json({ success: true, videos: entries, source: 'network' });
    }

    if (cachedYouTubeVideos) {
      return res.json({ success: true, videos: cachedYouTubeVideos, source: 'stale-cache' });
    }

    throw new Error('No video entries found in channel feed');
  } catch (err) {
    console.error('YouTube RSS fetch warning:', err.message);
    if (cachedYouTubeVideos) {
      return res.json({ success: true, videos: cachedYouTubeVideos, source: 'stale-cache' });
    }
    return res.status(502).json({ success: false, message: err.message });
  }
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

// ── Start Server & Connect to MongoDB ──────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI, { family: 4, serverSelectionTimeoutMS: 5000 })
    .then(() => {
      console.log('✅ MongoDB connected successfully');
    })
    .catch((err) => {
      console.error('⚠️ MongoDB connection error:', err.message);
    });
} else {
  console.warn('⚠️ MONGO_URI is missing in environment configuration.');
}
