const express = require('express');
const router = express.Router();
const {
  register,
  login,
  sendOtp,
  verifyOtp,
  getMe,
  updateProfile,
  checkEmail,
  changePassword,
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.get('/check-email', checkEmail);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

// RBAC check route
router.get('/admin-check', protect, authorize('ADMIN'), (req, res) => {
  res.status(200).json({ success: true, message: 'Admin access granted.' });
});

module.exports = router;
