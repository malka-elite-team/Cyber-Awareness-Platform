const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const helmet = require('helmet');
const { Redis } = require('@upstash/redis');
const { Ratelimit } = require('@upstash/ratelimit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
app.use(helmet()); // Sets various HTTP headers for security

// Strict CORS Configuration
const allowedOrigins = [
  'https://cyber-awareness-platform-beta.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173' // Common Vite port
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));

app.use(express.json({ limit: '10kb' })); // Limit body size to prevent DoS

// ============================================================
// Global Rate Limiting (حماية عامة لكل الـ Backend)
// 100 طلب في الدقيقة لكل IP — يحمي من هجمات DoS
// ============================================================
const globalRedis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const globalRatelimit = new Ratelimit({
  redis: globalRedis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  prefix: 'global',
});

// طبقة حماية محلية عامة (لمنع استنزاف Upstash)
const globalBlockedIPs = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [ip, unblockTime] of globalBlockedIPs) {
    if (now > unblockTime) {
      globalBlockedIPs.delete(ip);
    }
  }
}, 60 * 1000); // تنظيف كل دقيقة

app.use(async (req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  // الطبقة 1: فحص محلي
  const blockedUntil = globalBlockedIPs.get(ip);
  if (blockedUntil && Date.now() < blockedUntil) {
    return res.status(429).json({ error: 'Too many requests. Slow down.' });
  }

  try {
    // الطبقة 2: فحص عبر Upstash
    const { success, remaining } = await globalRatelimit.limit(ip);

    if (!success) {
      globalBlockedIPs.set(ip, Date.now() + 60 * 1000); // حظر لمدة دقيقة محلياً
      return res.status(429).json({ error: 'Too many requests. Slow down.' });
    }

    next();
  } catch (error) {
    console.error('Global rate limit error:', error);
    // Fail CLOSED: لا نسمح بالمرور إذا تعطل Redis
    res.status(503).json({ error: 'Service temporarily unavailable.' });
  }
});

// Firebase Admin Setup
// We check if the environment variables are present to avoid crashes if they aren't set yet
if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    console.log('Firebase Admin initialized ✅');
  } catch (error) {
    console.error('Firebase Admin initialization error ❌:', error);
  }
} else {
  console.warn('Firebase environment variables are missing. Firebase Admin not initialized.');
}

// Routes
app.get('/', (req, res) => {
  res.json({ status: 'Backend is running ✅' });
});

// Import and use routes
const authRoutes = require('./routes/auth');
const tipsRoutes = require('./routes/tips');
const quizRoutes = require('./routes/quiz');
const verifyToken = require('./middleware/verifyToken');

app.use('/api/auth', authRoutes);
app.use('/api/tips', verifyToken, tipsRoutes);
app.use('/api/quiz', verifyToken, quizRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app; // For Vercel
