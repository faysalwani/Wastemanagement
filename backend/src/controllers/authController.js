const { User, Notification } = require('../models');

// @desc    Register a new citizen
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, wardName, address, coordinates } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 400,
          message: 'Please provide name, email, and password.',
        },
      });
    }

    // Check if email already registered
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 409,
          message: 'An account with this email address already exists.',
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

    // Note: Public self-registration ALWAYS creates a CITIZEN.
    // DRIVER and ADMIN roles are provisioned exclusively by administrators.
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'CITIZEN',
      phone: phone ? phone.trim() : undefined,
      wardName: wardName ? wardName.trim() : 'Lal Chowk',
      address: address ? address.trim() : 'Srinagar, J&K',
      location: locationData,
      ecoCredits: 0,
      tier: 'BRONZE',
    });

    const token = user.generateAuthToken();

    res.status(201).json({
      success: true,
      message: 'Citizen account registered successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
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

    // Find user and explicitly select password hash
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 401,
          message: 'Invalid email or password credentials.',
        },
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: {
          code: 403,
          message: 'Account is deactivated. Please contact municipal administrator.',
        },
      });
    }

    // Verify password match
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: {
          code: 401,
          message: 'Invalid email or password credentials.',
        },
      });
    }

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

// @desc    Get currently authenticated user profile
// @route   GET /api/v1/auth/me
// @access  Private (All Roles)
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Check unread notification count
    const unreadNotifications = await Notification.countDocuments({
      userId: user._id,
      isRead: false,
    });

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
        unreadNotifications,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user profile & location coordinates
// @route   PUT /api/v1/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, wardName, address, coordinates } = req.body;
    const user = await User.findById(req.user.id);

    if (name) user.name = name.trim();
    if (phone) user.phone = phone.trim();
    if (wardName) user.wardName = wardName.trim();
    if (address) user.address = address.trim();

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
