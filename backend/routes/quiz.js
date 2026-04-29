const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();

// ==========================================
// GET /api/quiz/questions — جلب الأسئلة
// ==========================================
router.get('/questions', async (req, res) => {
  try {
    const db = admin.firestore();
    // Use FieldPath.documentId() since the ID is the document ID, not a field
    const questionsSnapshot = await db.collection('quiz_questions').orderBy(admin.firestore.FieldPath.documentId(), 'asc').get();
    
    const questions = [];
    questionsSnapshot.forEach(doc => {
      const data = doc.data();
      // إزالة الإجابة الصحيحة لأسباب أمنية قبل إرسالها للـ Frontend
      const { correct, ...safeData } = data;
      questions.push({ id: doc.id, ...safeData });
    });

    res.status(200).json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// ==========================================
// POST /api/quiz/submit — استلام الإجابات وحساب النتيجة
// ==========================================
router.post('/submit', async (req, res) => {
  try {
    const { answers } = req.body;
    
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Answers array is required' });
    }

    const db = admin.firestore();
    
    // جلب الأسئلة الصحيحة من قاعدة البيانات لحساب النتيجة
    const questionsSnapshot = await db.collection('quiz_questions').orderBy(admin.firestore.FieldPath.documentId(), 'asc').get();
    const questions = [];
    questionsSnapshot.forEach(doc => questions.push(doc.data()));

    if (answers.length !== questions.length) {
      return res.status(400).json({ error: `Expected ${questions.length} answers, but got ${answers.length}` });
    }

    let score = 0;
    // مقارنة إجابة المستخدم بالإجابة الصحيحة
    for (let i = 0; i < questions.length; i++) {
      if (answers[i] === questions[i].correct) {
        score++;
      }
    }

    const total = questions.length;
    const percentage = Math.round((score / total) * 100);

    // حفظ النتيجة في Firestore
    // req.user يأتي من الـ verifyToken middleware
    const userId = req.user.uid;
    const resultData = {
      userId,
      score,
      total,
      percentage,
      date: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('quiz_results').add(resultData);

    // إرجاع النتيجة للمستخدم
    res.status(200).json({ score, total, percentage });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

// ==========================================
// GET /api/quiz/results — جلب نتائج المستخدم الحالي
// ==========================================
router.get('/results', async (req, res) => {
  try {
    const userId = req.user.uid;
    const db = admin.firestore();
    
    const resultsSnapshot = await db.collection('quiz_results')
      .where('userId', '==', userId)
      .get();
    
    const results = [];
    resultsSnapshot.forEach(doc => {
      const data = doc.data();
      results.push({ id: doc.id, ...data });
    });

    // ترتيب النتائج محلياً لتجنب الحاجة لإنشاء Index في Firestore
    results.sort((a, b) => {
      const dateA = a.date ? a.date.toDate().getTime() : 0;
      const dateB = b.date ? b.date.toDate().getTime() : 0;
      return dateB - dateA;
    });

    res.status(200).json(results);
  } catch (error) {
    console.error('Error fetching quiz results:', error);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

module.exports = router;
