const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  submitReport,
  getReports,
  getHotspots,
  verifyReport,
} = require('../controllers/reportController');

router.post('/', protect, upload.single('photo'), submitReport);
router.get('/', getReports);
router.get('/hotspots', getHotspots);
router.patch('/:id/verify', protect, authorize('ADMIN'), verifyReport);

module.exports = router;
