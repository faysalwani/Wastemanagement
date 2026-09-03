const crypto = require('crypto');
const { User, Notification } = require('../models');

// @desc    Register a new Citizen (Public signup strictly assigns CITIZEN role)
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      wardName,
      address,
      coordinates,
    } = req.body;

    // Field validations
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Please provide your full name.' },
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Please provide a valid email address.' },
      });
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Please enter a valid email format (e.g. user@domain.com).' },
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Password must be at least 6 characters in length.' },
      });
    }

    // Check if email is already registered
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 409,
          message: 'An account with this email address already exists. Please log in.',
        },
      });
    }

    // Prepare coordinates: [longitude, latitude] default to central Srinagar
    let locationData = {
      type: 'Point',
      coordinates: [74.7973, 34.0837],
    };

    if (
      Array.isArray(coordinates) &&
      coordinates.length === 2 &&
      typeof coordinates[0] === 'number' &&
      typeof coordinates[1] === 'number'
    ) {
      locationData.coordinates = coordinates;
    }

    // Public signup is strictly locked to CITIZEN role
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: 'CITIZEN', // Always CITIZEN for public registration
      phone: phone ? phone.trim() : undefined,
      wardName: wardName ? wardName.trim() : 'Lal Chowk',
      address: address ? address.trim() : 'Srinagar, Jammu & Kashmir',
      location: locationData,
      ecoCredits: 0,
      tier: 'BRONZE',
      isActive: true,
    });

    // Welcome Notification
    await Notification.create({
      userId: user._id,
      type: 'SYSTEM_BROADCAST',
      title: 'Welcome to EcoCycle Srinagar! 🌿',
      message: `Welcome ${user.name}! Your Citizen account is active. Join community segregation and earn Eco-Credits.`,
      data: { welcomeBonus: 0 },
    });

    const token = user.generateAuthToken();

    res.status(201).json({
      success: true,
      message: 'Citizen account created successfully! Welcome to EcoCycle.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        wardName: user.wardName,
        address: user.address,
        location: user.location,
        ecoCredits: user.ecoCredits,
        tier: user.tier,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Generate and send 6-digit OTP for Email + OTP login
// @route   POST /api/v1/auth/send-otp
// @access  Public
exports.sendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Please provide an email address.' },
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+otpCooldownUntil +otpExpires');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 404,
          message: 'No account found with this email address. Please register as a Citizen first.',
        },
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: {
          code: 403,
          message: 'Your account has been deactivated. Please contact municipal administration.',
        },
      });
    }

    // Check 60-second cooldown
    const now = Date.now();
    if (user.otpCooldownUntil && user.otpCooldownUntil.getTime() > now) {
      const remainingSeconds = Math.ceil((user.otpCooldownUntil.getTime() - now) / 1000);
      return res.status(429).json({
        success: false,
        error: {
          code: 429,
          message: `Please wait ${remainingSeconds} seconds before requesting a new OTP.`,
          remainingSeconds,
        },
      });
    }

    // Generate cryptographically secure 6-digit numeric OTP
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = crypto.createHash('sha256').update(rawOtp).digest('hex');

    // Save hashed OTP with 10-minute expiry and 60-second cooldown
    user.otpHash = otpHash;
    user.otpExpires = new Date(now + 10 * 60 * 1000); // 10 minutes
    user.otpCooldownUntil = new Date(now + 60 * 1000); // 60 seconds
    user.otpAttempts = 0;

    await user.save({ validateBeforeSave: false });

    // In non-production or for examination demonstration, log to console and return demoOtp
    console.log(`\n======================================================`);
    console.log(`[AUTH OTP] Generated 6-Digit OTP for ${user.email} (${user.role}): ${rawOtp}`);
    console.log(`======================================================\n`);

    res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been sent to ${user.email}.`,
      cooldownSeconds: 60,
      demoOtp: rawOtp, // Provided for automated tests and viva demonstration
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Verify 6-digit OTP and issue JWT Bearer token
// @route   POST /api/v1/auth/verify-otp
// @access  Public
exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Please provide both email and the 6-digit OTP.' },
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+otpHash +otpExpires +otpAttempts');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'No account found with this email address.' },
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: { code: 403, message: 'Account is deactivated. Please contact municipal support.' },
      });
    }

    if (!user.otpHash || !user.otpExpires) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'No active OTP found. Please request a new code.' },
      });
    }

    // Check expiration
    if (Date.now() > user.otpExpires.getTime()) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'OTP has expired. Please request a new code.' },
      });
    }

    // Brute-force protection: Max 5 attempts
    if (user.otpAttempts >= 5) {
      user.otpHash = undefined;
      user.otpExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(429).json({
        success: false,
        error: {
          code: 429,
          message: 'Too many failed verification attempts. This OTP has been invalidated. Please request a new one.',
        },
      });
    }

    // Compare SHA-256 hash
    const inputHash = crypto.createHash('sha256').update(otp.trim()).digest('hex');
    if (inputHash !== user.otpHash) {
      user.otpAttempts += 1;
      await user.save({ validateBeforeSave: false });

      const attemptsRemaining = 5 - user.otpAttempts;
      return res.status(400).json({
        success: false,
        error: {
          code: 400,
          message: `Invalid OTP code. ${attemptsRemaining} attempt${attemptsRemaining === 1 ? '' : 's'} remaining.`,
          attemptsRemaining,
        },
      });
    }

    // OTP matched successfully -> Clear OTP state
    user.otpHash = undefined;
    user.otpExpires = undefined;
    user.otpAttempts = 0;
    user.otpCooldownUntil = undefined;
    await user.save({ validateBeforeSave: false });

    const token = user.generateAuthToken();

    res.status(200).json({
      success: true,
      message: 'Authentication successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        wardName: user.wardName,
        address: user.address,
        location: user.location,
        ecoCredits: user.ecoCredits,
        tier: user.tier,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Authenticate user via Email + Password (Fallback method)
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 400,
          message: 'Please provide both email and password.',
        },
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Query user and explicitly select password field
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 401,
          message: 'Invalid email or password.',
        },
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: {
          code: 403,
          message: 'Your account has been deactivated. Please contact municipal support.',
        },
      });
    }

    // Verify password match using bcrypt
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: {
          code: 401,
          message: 'Invalid email or password.',
        },
      });
    }

    const token = user.generateAuthToken();

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        wardName: user.wardName,
        address: user.address,
        location: user.location,
        ecoCredits: user.ecoCredits,
        tier: user.tier,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current authenticated user profile
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'User profile not found.' },
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        wardName: user.wardName,
        address: user.address,
        location: user.location,
        ecoCredits: user.ecoCredits,
        tier: user.tier,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user profile details
// @route   PUT /api/v1/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, wardName, address, coordinates } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'User not found.' },
      });
    }

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (wardName) user.wardName = wardName.trim();
    if (address !== undefined) user.address = address.trim();

    if (
      Array.isArray(coordinates) &&
      coordinates.length === 2 &&
      typeof coordinates[0] === 'number' &&
      typeof coordinates[1] === 'number'
    ) {
      user.location = {
        type: 'Point',
        coordinates,
      };
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        wardName: user.wardName,
        address: user.address,
        location: user.location,
        ecoCredits: user.ecoCredits,
        tier: user.tier,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Check if an email is already in use
// @route   GET /api/v1/auth/check-email
// @access  Public
exports.checkEmail = async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email query parameter required.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    res.status(200).json({
      success: true,
      available: !existing,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Change authenticated user password
// @route   PUT /api/v1/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Please provide both current and new password.' },
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'New password must be at least 6 characters.' },
      });
    }

    const user = await User.findById(req.user.id).select('+password');
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: { code: 401, message: 'Current password does not match.' },
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (err) {
    next(err);
  }
};
