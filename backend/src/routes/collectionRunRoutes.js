const express = require('express');
const router = express.Router();
const {
  dispatchRoute,
  getActiveRun,
  startRun,
  updateStopStatus,
  endRun,
  getRunHistory,
  getRunById,
} = require('../controllers/collectionRunController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/dispatch', protect, authorize('ADMIN', 'SUPER_ADMIN'), dispatchRoute);
router.get('/active', protect, authorize('DRIVER', 'ADMIN', 'SUPER_ADMIN'), getActiveRun);
router.get('/history', protect, authorize('DRIVER', 'ADMIN', 'SUPER_ADMIN'), getRunHistory);
router.get('/:id', protect, authorize('DRIVER', 'ADMIN', 'SUPER_ADMIN'), getRunById);
router.patch('/:id/start', protect, authorize('DRIVER', 'ADMIN', 'SUPER_ADMIN'), startRun);
router.patch('/:id/stops/:stopSequence', protect, authorize('DRIVER', 'ADMIN', 'SUPER_ADMIN'), updateStopStatus);
router.patch('/:id/end', protect, authorize('DRIVER', 'ADMIN', 'SUPER_ADMIN'), endRun);

module.exports = router;
