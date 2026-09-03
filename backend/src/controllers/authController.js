const { User, Notification } = require('../models');

// @desc    Register a new user (Citizen, Driver, or Admin with secret)
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      role = 'CITIZEN',
      adminSecret,
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

    // Role assignment rules:
    // DRIVER allowed; ADMIN strictly requires valid adminSecret; otherwise coerced to CITIZEN
    let userRole = 'CITIZEN';
    const validAdminSecret = process.env.ADMIN_SECRET || 'SrinagarAdmin2026';

    if (role === 'DRIVER') {
      userRole = 'DRIVER';
    } else if (role === 'ADMIN' && adminSecret === validAdminSecret) {
      userRole = 'ADMIN';
    } else {
      userRole = 'CITIZEN';
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

    // Create user with bcrypt pre-save hash
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: userRole,
      phone: phone ? phone.trim() : undefined,
      wardName: wardName ? wardName.trim() : 'Lal Chowk',
      address: address ? address.trim() : 'Srinagar, J&K',
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
      message: `Welcome ${user.name}! Your ${user.role} account is active. You received +20 Eco-Credits as a sign-up bonus.`,
      data: { welcomeBonus: 20 },
    });

    const token = user.generateAuthToken();

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to EcoCycle.',
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

// @desc    Authenticate user & return JWT token
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
          message: 'No account found with this email address.',
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
