const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Quiz route is working' });
});

module.exports = router;
