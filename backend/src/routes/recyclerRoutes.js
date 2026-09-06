const express = require('express');
const router = express.Router();
const {
  getRecyclers,
  getRecyclerById,
  createRecycler,
  updateRecycler,
  deleteRecycler,
} = require('../controllers/recyclerController');

const { protect, authorize } = require('../middleware/authMiddleware');

// Public listing and facility details
router.get('/', getRecyclers);
router.get('/:id', getRecyclerById);

// Admin management
router.post('/', protect, authorize('ADMIN', 'SUPER_ADMIN'), createRecycler);
router.patch('/:id', protect, authorize('ADMIN', 'SUPER_ADMIN'), updateRecycler);
router.delete('/:id', protect, authorize('ADMIN', 'SUPER_ADMIN'), deleteRecycler);

module.exports = router;
