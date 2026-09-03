const express = require('express');
const router = express.Router();
const {
  initiateRegistration,
  verifyRegistration,
  loginCitizen,
  verifyMonthlyOtp,
  sendStaffOtp,
  verifyStaffOtp,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  checkEmail,
  // Adapters
  registerDirect,
  loginDirect,
  sendOtpUniversal,
  verifyOtpUniversal,
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Primary Citizen Registration Pipeline (Initiate -> OTP Verify -> Citizen)
router.post('/register/initiate', initiateRegistration);
router.post('/register/verify', verifyRegistration);

// Primary Citizen Login (Email + Password + Monthly OTP)
router.post('/login-citizen', loginCitizen);
router.post('/verify-monthly-otp', verifyMonthlyOtp);

// Primary Staff (Driver / Admin / Super Admin) Login (OTP Only — No Passwords)
router.post('/send-staff-otp', sendStaffOtp);
router.post('/verify-staff-otp', verifyStaffOtp);

// Citizen Password Recovery
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Backward-Compatible API Adapters
router.post('/register', registerDirect);
router.post('/login', loginDirect);
router.post('/send-otp', sendOtpUniversal);
router.post('/verify-otp', verifyOtpUniversal);
router.get('/admin-check', protect, authorize('ADMIN'), (req, res) => {
  res.status(200).json({ success: true, message: 'Admin access granted.' });
});

// Profile & Utilities
router.get('/check-email', checkEmail);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

module.exports = router;
