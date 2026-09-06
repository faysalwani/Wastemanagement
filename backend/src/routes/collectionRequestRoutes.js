const express = require('express');
const router = express.Router();
const {
  createRequest,
  getRequests,
  getMyRequests,
  updateRequestStatus,
  cancelRequest,
} = require('../controllers/collectionRequestController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, createRequest);
router.get('/my', protect, getMyRequests);
router.get('/', protect, authorize('ADMIN', 'SUPER_ADMIN'), getRequests);
router.patch('/:id/status', protect, authorize('ADMIN', 'SUPER_ADMIN'), updateRequestStatus);
router.delete('/:id', protect, cancelRequest);

module.exports = router;
