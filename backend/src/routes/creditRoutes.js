const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getLedger,
  getLeaderboard,
  getWasteDiversionMetrics,
} = require('../controllers/creditController');

router.get('/ledger', protect, getLedger);
router.get('/leaderboard', getLeaderboard);
router.get('/diversion', getWasteDiversionMetrics);

module.exports = router;
