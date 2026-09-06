const express = require('express');
const router = express.Router();
const {
  getAlerts,
  acknowledgeAlert,
  resolveAlert,
} = require('../controllers/alertController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, authorize('ADMIN', 'SUPER_ADMIN'), getAlerts);
router.patch('/:id/acknowledge', protect, authorize('ADMIN', 'SUPER_ADMIN'), acknowledgeAlert);
router.patch('/:id/resolve', protect, authorize('ADMIN', 'SUPER_ADMIN'), resolveAlert);

module.exports = router;
