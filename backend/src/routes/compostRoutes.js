const express = require('express');
const router = express.Router();
const {
  getRecommendation,
  createActivity,
  getMyActivities,
  updateActivityStatus,
  deleteActivity,
} = require('../controllers/compostController');
const { protect } = require('../middleware/authMiddleware');

router.post('/recommend', getRecommendation);
router.post('/activities', protect, createActivity);
router.get('/activities', protect, getMyActivities);
router.patch('/activities/:id/status', protect, updateActivityStatus);
router.delete('/activities/:id', protect, deleteActivity);

module.exports = router;
