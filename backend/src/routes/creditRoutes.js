const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getLedger,
  getCitizenSummary,
  getLeaderboard,
  getWasteDiversionMetrics,
  getWalletDetails,
  getUserWasteDiversionMetrics,
  getRewardConfig,
  updateRewardConfig,
} = require('../controllers/creditController');

router.get('/ledger', protect, getLedger);
router.get('/wallet', protect, getWalletDetails);
router.get('/citizen-summary', protect, getCitizenSummary);
router.get('/leaderboard', getLeaderboard);
router.get('/diversion', getWasteDiversionMetrics);
router.get('/my-diversion', protect, getUserWasteDiversionMetrics);

router.get('/config', getRewardConfig);
router.patch('/config', protect, authorize('ADMIN', 'SUPER_ADMIN'), updateRewardConfig);

module.exports = router;

