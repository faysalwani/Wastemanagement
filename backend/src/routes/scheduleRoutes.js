const express = require('express');
const router = express.Router();
const {
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} = require('../controllers/scheduleController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', getSchedules);
router.post('/', protect, authorize('ADMIN', 'SUPER_ADMIN'), createSchedule);
router.patch('/:id', protect, authorize('ADMIN', 'SUPER_ADMIN'), updateSchedule);
router.delete('/:id', protect, authorize('ADMIN', 'SUPER_ADMIN'), deleteSchedule);

module.exports = router;
