const express = require('express');
const router = express.Router();
const {
  ingestTelemetry,
  getBins,
  getBinHistory,
  createBin,
  updateBin,
  deleteBin,
} = require('../controllers/iotController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/telemetry', ingestTelemetry);
router.get('/bins', getBins);
router.get('/bins/:binId/history', getBinHistory);
router.post('/bins', protect, authorize('ADMIN', 'SUPER_ADMIN'), createBin);
router.patch('/bins/:id', protect, authorize('ADMIN', 'SUPER_ADMIN'), updateBin);
router.delete('/bins/:id', protect, authorize('ADMIN', 'SUPER_ADMIN'), deleteBin);

module.exports = router;

