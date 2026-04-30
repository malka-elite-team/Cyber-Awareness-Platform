const express = require('express');
const admin = require('firebase-admin');
const { Redis } = require('@upstash/redis');
const { Ratelimit } = require('@upstash/ratelimit');
const router = express.Router();

// Setup Upstash Redis Client (using Vercel KV environment variables)
const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

// Create a new Ratelimit instance (20 requests per 15 minutes)
// 20 is reasonable for normal users (typos, refreshes, etc.)
// but blocks automated brute force attacks
const upstashRatelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(20, '15 m'),
  analytics: true,
});

// ============================================================
// طبقة حماية محلية (Local Blocklist)
// تمنع استنزاف حصة Upstash المجانية
// إذا IP محظور، نرفضه من الذاكرة مباشرة بدون ما نسأل Redis
// ============================================================
const blockedIPs = new Map(); // { ip: unblockTimestamp }

// تنظيف الـ IPs المنتهية كل 5 دقائق لمنع تراكم الذاكرة
setInterval(() => {
  const now = Date.now();
  for (const [ip, unblockTime] of blockedIPs) {
    if (now > unblockTime) {
      blockedIPs.delete(ip);
    }
  }
}, 5 * 60 * 1000);

// Custom Middleware for Auth Routes
const authLimiter = async (req, res, next) => {
  // Get client IP (works locally and on Vercel)
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  
  // === الطبقة 1: فحص محلي (بدون استهلاك Upstash) ===
  const blockedUntil = blockedIPs.get(ip);
  if (blockedUntil && Date.now() < blockedUntil) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  try {
    // === الطبقة 2: فحص عبر Upstash Redis ===
    const { success, limit, reset, remaining } = await upstashRatelimit.limit(ip);
    
    // Set standard rate limit headers
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', reset);

    if (!success) {
      // حفظ الـ IP في القائمة المحلية لمدة 15 دقيقة
      // أي طلب قادم من نفس الـ IP سيُرفض محلياً بدون سؤال Redis
      blockedIPs.set(ip, Date.now() + 15 * 60 * 1000);
      return res.status(429).json({ error: 'Too many requests from this IP, please try again after 15 minutes' });
    }
    
    next();
  } catch (error) {
    console.error('Rate limit error:', error);
    // Fail CLOSED: if Redis is down, block requests to be safe
    // أفضل نحمي المستخدمين ونرفض الطلب من أن نفتح الباب للمهاجمين
    res.status(503).json({ error: 'Service temporarily unavailable. Please try again later.' });
  }
};

// Apply rate limiter to register and login
router.use('/register', authLimiter);
router.use('/login', authLimiter);

// ==========================================
// POST /api/auth/register — إنشاء حساب جديد
// ==========================================
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  // التحقق من وجود البيانات المطلوبة
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // سياسة كلمة مرور قوية (Ethical Hacking Recommendation)
  // كحد أدنى 8 حروف، رقم، حرف كبير، رمز خاص
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ 
      error: 'Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters.' 
    });
  }

  try {
    // إنشاء المستخدم في Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
    });

    // حفظ بيانات المستخدم في Firestore
    const db = admin.firestore();
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: userRecord.email,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // إرجاع الاستجابة الناجحة
    res.status(201).json({
      message: 'User registered successfully',
      uid: userRecord.uid,
    });

  } catch (error) {
    console.error('Registration error:', error);

    // التعامل مع الأخطاء المعروفة
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ error: 'Email already in use' });
    }
    if (error.code === 'auth/invalid-email') {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (error.code === 'auth/weak-password') {
      return res.status(400).json({ error: 'Password is too weak' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==========================================
// POST /api/auth/login — تسجيل الدخول
// ==========================================
// ملاحظة: Firebase Admin SDK لا يدعم تسجيل الدخول مباشرة
// لذلك نستخدم Firebase Auth REST API للتحقق من الإيميل وكلمة المرور
// ثم نرجع الـ ID Token للمستخدم
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // التحقق من وجود البيانات المطلوبة
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const apiKey = process.env.FIREBASE_API_KEY;
  if (!apiKey) {
    console.error('FIREBASE_API_KEY is not set in environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // استخدام Firebase Auth REST API لتسجيل الدخول
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          password: password,
          returnSecureToken: true,
        }),
      }
    );

    const data = await response.json();

    // إذا فشل تسجيل الدخول
    if (data.error) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // إرجاع التوكن وبيانات المستخدم
    // تحديث آخر تسجيل دخول في Firestore
    const db = admin.firestore();
    await db.collection('users').doc(data.localId).update({
      lastLogin: admin.firestore.FieldValue.serverTimestamp(),
    }).catch(() => {
      // إذا لم يكن المستخدم موجوداً في Firestore (حالة نادرة)، ننشئه
      return db.collection('users').doc(data.localId).set({
        uid: data.localId,
        email: data.email,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    res.status(200).json({
      token: data.idToken,
      uid: data.localId,
      email: data.email,
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==========================================
// POST /api/auth/logout — تسجيل الخروج (Revoke Token)
// ==========================================
// يبطل جميع التوكنات الصادرة للمستخدم فوراً
// بعد هذا الطلب، أي توكن قديم سيُرفض حتى لو لم تنتهِ صلاحيته
router.post('/logout', async (req, res) => {
  const idToken = req.headers.authorization?.split('Bearer ')[1];

  if (!idToken) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // فك التوكن للحصول على uid
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // إبطال جميع التوكنات لهذا المستخدم
    await admin.auth().revokeRefreshTokens(decodedToken.uid);

    res.status(200).json({ message: 'Logged out successfully. All tokens revoked.' });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
});

module.exports = router;
