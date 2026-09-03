const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { classifyImage, getAIStatus } = require('../controllers/aiController');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Optional auth middleware: extracts user if token provided without rejecting guests
const optionalAuth = async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    const token = req.headers.authorization.split(' ')[1];
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'super_secret_jwt_key_srinagar_smart_waste_2026_msc_ai'
      );
      req.user = await User.findById(decoded.id);
    } catch {
      // Ignore token errors for optional auth
    }
  }
  next();
};

router.post('/classify', optionalAuth, upload.single('image'), classifyImage);
router.get('/status', getAIStatus);

module.exports = router;
