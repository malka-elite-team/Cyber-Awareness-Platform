const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

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
