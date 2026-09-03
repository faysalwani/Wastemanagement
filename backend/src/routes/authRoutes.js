const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

// Testing route for verifying RBAC authorization
const { authorize } = require('../middleware/authMiddleware');
router.get(
  '/admin-check',
  protect,
  authorize('ADMIN'),
  (req, res) => {
    res.status(200).json({ success: true, message: 'Admin access granted.' });
  }
);

module.exports = router;
