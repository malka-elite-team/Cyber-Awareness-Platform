const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();

// ==========================================
// GET /api/tips — جلب جميع النصائح
// ==========================================
router.get('/', async (req, res) => {
  try {
    const db = admin.firestore();
    const tipsSnapshot = await db.collection('tips').orderBy('order', 'asc').get();
    
    const tips = [];
    tipsSnapshot.forEach(doc => {
      tips.push({ id: doc.id, ...doc.data() });
    });

    res.status(200).json(tips);
  } catch (error) {
    console.error('Error fetching tips:', error);
    res.status(500).json({ error: 'Failed to fetch tips' });
  }
});

// ==========================================
// GET /api/tips/:id — جلب نصيحة واحدة
// ==========================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = admin.firestore();
    
    const tipDoc = await db.collection('tips').doc(id).get();
    
    if (!tipDoc.exists) {
      return res.status(404).json({ error: 'Tip not found' });
    }

    res.status(200).json({ id: tipDoc.id, ...tipDoc.data() });
  } catch (error) {
    console.error('Error fetching single tip:', error);
    res.status(500).json({ error: 'Failed to fetch the tip' });
  }
});

module.exports = router;
