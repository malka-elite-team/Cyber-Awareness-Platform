const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();

// ==========================================
// GET /api/quiz/questions — جلب الأسئلة
// يقبل ?tipId=xxx لجلب أسئلة نصيحة معينة
// ==========================================
router.get('/questions', async (req, res) => {
  try {
    const { tipId } = req.query;
    const db = admin.firestore();
    
    let query = db.collection('quiz_questions');
    if (tipId) {
      query = query.where('tipId', '==', tipId);
    } else {
      query = query.orderBy(admin.firestore.FieldPath.documentId(), 'asc');
    }
    
    const questionsSnapshot = await query.get();
    
    const questions = [];
    questionsSnapshot.forEach(doc => {
      const data = doc.data();
      // إزالة الإجابة الصحيحة لأسباب أمنية قبل إرسالها للـ Frontend
      const { correct, ...safeData } = data;
      questions.push({ id: doc.id, ...safeData });
    });

    // إذا تم الفلترة بواسطة tipId، نرتب النتائج محلياً لتجنب مشاكل الـ Indexes
    if (tipId) {
      questions.sort((a, b) => a.id.localeCompare(b.id));
    }

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
    const { answers, tipId } = req.body;
    
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Answers array is required' });
    }

    const db = admin.firestore();
    
    let query = db.collection('quiz_questions');
    if (tipId) {
      query = query.where('tipId', '==', tipId);
    } else {
      query = query.orderBy(admin.firestore.FieldPath.documentId(), 'asc');
    }
    
    const questionsSnapshot = await query.get();
    const questions = [];
    questionsSnapshot.forEach(doc => questions.push({ id: doc.id, ...doc.data() }));

    if (tipId) {
      questions.sort((a, b) => a.id.localeCompare(b.id));
    }

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
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

    // حفظ النتيجة في Firestore
    // req.user يأتي من الـ verifyToken middleware
    const userId = req.user.uid;
    const resultData = {
      userId,
      tipId: tipId || null, // حفظ الـ tipId لمعرفة أي نصيحة تم اجتيازها
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

// ==========================================
// GET /api/quiz/progress — جلب نسبة تقدم المستخدم (Learning Progress)
// ==========================================
router.get('/progress', async (req, res) => {
  try {
    const userId = req.user.uid;
    const db = admin.firestore();
    
    // 1. جلب كل النصائح لمعرفة العدد الكلي
    const tipsSnapshot = await db.collection('tips').get();
    const totalTips = tipsSnapshot.size;
    const allTipsIds = [];
    tipsSnapshot.forEach(doc => allTipsIds.push(doc.id));

    // 2. جلب نتائج المستخدم الناجحة لمعرفة النصائح المنجزة
    const resultsSnapshot = await db.collection('quiz_results')
      .where('userId', '==', userId)
      .get();
    
    const completedTipIds = new Set();
    resultsSnapshot.forEach(doc => {
      const data = doc.data();
      // نعتبر النصيحة منجزة إذا كان المستخدم قد جرب الكويز وحصل على أي نتيجة (أو يمكنك اشتراط نسبة معينة)
      if (data.tipId && data.percentage > 0) {
        completedTipIds.add(data.tipId);
      }
    });

    const completedTipsCount = completedTipIds.size;
    const progressPercentage = totalTips > 0 ? Math.round((completedTipsCount / totalTips) * 100) : 0;

    // 3. تحديد النصيحة التالية (أول نصيحة غير منجزة)
    let nextTipId = null;
    for (const tipId of allTipsIds) {
      if (!completedTipIds.has(tipId)) {
        nextTipId = tipId;
        break;
      }
    }

    res.status(200).json({
      completedTips: completedTipsCount,
      totalTips: totalTips,
      progressPercentage: progressPercentage,
      nextTipId: nextTipId // قد تكون null إذا أكمل كل شيء
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

module.exports = router;
