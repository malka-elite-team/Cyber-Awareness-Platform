const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();

// ==========================================
// POST /api/auth/register — إنشاء حساب جديد
// ==========================================
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  // التحقق من وجود البيانات المطلوبة
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // التحقق من طول كلمة المرور
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
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
