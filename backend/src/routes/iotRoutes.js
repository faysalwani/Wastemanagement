const express = require('express');
const router = express.Router();
const {
  ingestTelemetry,
  getBins,
  getBinHistory,
  createBin,
} = require('../controllers/iotController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/telemetry', ingestTelemetry);
router.get('/bins', getBins);
router.get('/bins/:binId/history', getBinHistory);
router.post('/bins', protect, authorize('ADMIN'), createBin);

module.exports = router;
