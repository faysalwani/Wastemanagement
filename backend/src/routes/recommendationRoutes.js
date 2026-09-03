const express = require('express');
const router = express.Router();
const {
  getRecommendation,
  getRecyclers,
} = require('../controllers/recommendationController');

router.post('/evaluate', getRecommendation);
router.get('/recyclers', getRecyclers);

module.exports = router;
