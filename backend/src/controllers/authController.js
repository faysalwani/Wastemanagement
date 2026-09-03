const crypto = require('crypto');
const { User, PendingRegistration, Notification } = require('../models');
const sendEmail = require('../utils/sendEmail');

// ============================================================================
// 1. CITIZEN REGISTRATION PIPELINE (INITIATE & VERIFY VIA OTP)
// ============================================================================

// @desc    Step 1: Initiate Citizen Signup (Validate details, generate OTP, hold in staging)
// @route   POST /api/v1/auth/register/initiate
// @access  Public
exports.initiateRegistration = async (req, res, next) => {
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

    // Field Validations
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Please provide your full name.' },
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Please provide an email address.' },
      });
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
    const normalizedEmail = email.toLowerCase().trim();

    if (!emailRegex.test(normalizedEmail)) {
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

    // Check if email already exists in active Users
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 409,
          message: 'An account with this email address already exists. Please sign in.',
        },
      });
    }

    // Coordinates default to Srinagar center [lon, lat]
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

    // Generate 6-digit OTP
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = crypto.createHash('sha256').update(rawOtp).digest('hex');
    const now = Date.now();

    // Check if there is already a pending registration with cooldown
    const existingPending = await PendingRegistration.findOne({ email: normalizedEmail });
    if (existingPending && existingPending.otpCooldownUntil && existingPending.otpCooldownUntil.getTime() > now) {
      const remainingSeconds = Math.ceil((existingPending.otpCooldownUntil.getTime() - now) / 1000);
      return res.status(429).json({
        success: false,
        error: {
          code: 429,
          message: `Please wait ${remainingSeconds} seconds before requesting a new registration code.`,
          remainingSeconds,
        },
      });
    }

    // Store or replace in PendingRegistration staging collection
    await PendingRegistration.findOneAndUpdate(
      { email: normalizedEmail },
      {
        name: name.trim(),
        email: normalizedEmail,
        password: password, // Will be hashed when moving to User model
        phone: phone ? phone.trim() : undefined,
        wardName: wardName ? wardName.trim() : 'Lal Chowk',
        address: address ? address.trim() : 'Srinagar, Jammu & Kashmir',
        location: locationData,
        otpHash,
        otpExpires: new Date(now + 10 * 60 * 1000), // 10 minutes
        otpCooldownUntil: new Date(now + 60 * 1000), // 60 seconds
        otpAttempts: 0,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Dispatch verification email
    await sendEmail({
      email: normalizedEmail,
      subject: 'Verify Your Citizen Account — EcoCycle Srinagar',
      text: `Your EcoCycle citizen verification code is: ${rawOtp}. Valid for 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; rounded: 16px;">
          <h2 style="color: #059669;">Welcome to EcoCycle Srinagar 🌿</h2>
          <p>Please enter the following 6-digit verification code to activate your Citizen account:</p>
          <div style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #0f172a; padding: 16px 0; font-family: monospace;">
            ${rawOtp}
          </div>
          <p style="color: #64748b; font-size: 12px;">This code will expire in 10 minutes. Do not share this code with anyone.</p>
        </div>
      `,
      otp: rawOtp,
    });

    res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been dispatched to ${normalizedEmail}.`,
      cooldownSeconds: 60,
      demoOtp: rawOtp, // For automated testing and viva examination presentation
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Step 2: Verify Registration OTP and Activate Citizen Account
// @route   POST /api/v1/auth/register/verify
// @access  Public
exports.verifyRegistration = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Please provide both email and the 6-digit verification code.' },
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const pending = await PendingRegistration.findOne({ email: normalizedEmail });

    if (!pending) {
      return res.status(400).json({
        success: false,
        error: {
          code: 400,
          message: 'No pending registration found for this email, or the verification session expired. Please sign up again.',
        },
      });
    }

    // Check expiry
    if (Date.now() > pending.otpExpires.getTime()) {
      await PendingRegistration.deleteOne({ _id: pending._id });
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Verification code has expired. Please restart signup.' },
      });
    }

    // Brute force check
    if (pending.otpAttempts >= 5) {
      await PendingRegistration.deleteOne({ _id: pending._id });
      return res.status(429).json({
        success: false,
        error: {
          code: 429,
          message: 'Too many failed verification attempts. Registration canceled. Please try again.',
        },
      });
    }

    // Validate OTP hash
    const inputHash = crypto.createHash('sha256').update(otp.trim()).digest('hex');
    if (inputHash !== pending.otpHash) {
      pending.otpAttempts += 1;
      await pending.save();

      const remaining = 5 - pending.otpAttempts;
      return res.status(400).json({
        success: false,
        error: {
          code: 400,
          message: `Invalid verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
          remaining,
        },
      });
    }

    // OTP matched -> Create permanent active User strictly with CITIZEN role
    const user = await User.create({
      name: pending.name,
      email: pending.email,
      password: pending.password, // Pre-save hook hashes with bcrypt automatically
      role: 'CITIZEN',
      phone: pending.phone,
      wardName: pending.wardName,
      address: pending.address,
      location: pending.location,
      ecoCredits: 0,
      tier: 'BRONZE',
      isActive: true,
      lastOtpVerifiedAt: new Date(),
    });

    // Clean up staging record
    await PendingRegistration.deleteOne({ _id: pending._id });

    // Welcome Notification
    await Notification.create({
      userId: user._id,
      type: 'SYSTEM_BROADCAST',
      title: 'Welcome to EcoCycle Srinagar! 🌿',
      message: `Welcome ${user.name}! Your Citizen account is active. Join community segregation and earn Eco-Credits.`,
    });

    // 28-day JWT token issued for Citizen
    const token = user.generateAuthToken();

    res.status(201).json({
      success: true,
      message: 'Citizen account activated successfully! Welcome to EcoCycle.',
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

// ============================================================================
// 2. CITIZEN LOGIN (EMAIL + PASSWORD WITH ~30-DAY PERIODIC OTP RE-VERIFICATION)
// ============================================================================

// @desc    Citizen Authentication via Email + Password
// @route   POST /api/v1/auth/login-citizen
// @access  Public
exports.loginCitizen = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Please provide both email and password.' },
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password +otpCooldownUntil');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 401, message: 'Invalid email or password.' },
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: { code: 403, message: 'Your account has been deactivated. Please contact municipal support.' },
      });
    }

    // Role Context Guard: If account is DRIVER, ADMIN, or SUPER_ADMIN, reject from Citizen portal
    if (user.role !== 'CITIZEN') {
      const targetPortal = user.role === 'DRIVER' ? 'Driver' : 'Admin';
      return res.status(403).json({
        success: false,
        error: {
          code: 403,
          message: `Access Denied: This account is registered as '${user.role}'. Please select the ${targetPortal} login portal.`,
        },
      });
    }

    // Verify Password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: { code: 401, message: 'Invalid email or password.' },
      });
    }

    // Check ~30-Day Periodic OTP Verification Requirement
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const lastVerified = user.lastOtpVerifiedAt ? user.lastOtpVerifiedAt.getTime() : 0;
    const isExpired = Date.now() - lastVerified > THIRTY_DAYS_MS;

    if (isExpired) {
      // Generate 6-digit OTP for monthly re-verification
      const rawOtp = crypto.randomInt(100000, 1000000).toString();
      const otpHash = crypto.createHash('sha256').update(rawOtp).digest('hex');
      const now = Date.now();

      user.otpHash = otpHash;
      user.otpExpires = new Date(now + 10 * 60 * 1000);
      user.otpCooldownUntil = new Date(now + 60 * 1000);
      user.otpAttempts = 0;
      await user.save({ validateBeforeSave: false });

      await sendEmail({
        email: user.email,
        subject: 'Monthly Security Verification — EcoCycle Srinagar',
        text: `Your monthly citizen login verification code is: ${rawOtp}. Valid for 10 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; rounded: 16px;">
            <h2 style="color: #059669;">Monthly Security Verification 🔒</h2>
            <p>To keep your Citizen account secure, periodic email verification is required once every 30 days.</p>
            <div style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #0f172a; padding: 16px 0; font-family: monospace;">
              ${rawOtp}
            </div>
            <p style="color: #64748b; font-size: 12px;">Expires in 10 minutes.</p>
          </div>
        `,
        otp: rawOtp,
      });

      return res.status(200).json({
        success: true,
        requireMonthlyOtp: true,
        message: 'Monthly security verification required. A 6-digit code has been sent to your email.',
        cooldownSeconds: 60,
        demoOtp: rawOtp,
      });
    }

    // Normal Login: Issue 28-day JWT token
    const token = user.generateAuthToken();

    res.status(200).json({
      success: true,
      message: 'Authenticated successfully.',
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

// @desc    Verify Citizen Monthly OTP
// @route   POST /api/v1/auth/verify-monthly-otp
// @access  Public
exports.verifyMonthlyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Please provide email and 6-digit code.' },
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+otpHash +otpExpires +otpAttempts');

    if (!user || user.role !== 'CITIZEN') {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'Citizen account not found.' },
      });
    }

    if (!user.otpHash || !user.otpExpires) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'No active OTP verification session found. Please sign in again.' },
      });
    }

    if (Date.now() > user.otpExpires.getTime()) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Verification code has expired. Please sign in again.' },
      });
    }

    if (user.otpAttempts >= 5) {
      user.otpHash = undefined;
      user.otpExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(429).json({
        success: false,
        error: { code: 429, message: 'Too many failed attempts. Code invalidated. Please sign in again.' },
      });
    }

    const inputHash = crypto.createHash('sha256').update(otp.trim()).digest('hex');
    if (inputHash !== user.otpHash) {
      user.otpAttempts += 1;
      await user.save({ validateBeforeSave: false });
      const remaining = 5 - user.otpAttempts;
      return res.status(400).json({
        success: false,
        error: { code: 400, message: `Invalid code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.` },
      });
    }

    // Successful monthly verification -> update lastOtpVerifiedAt
    user.lastOtpVerifiedAt = new Date();
    user.otpHash = undefined;
    user.otpExpires = undefined;
    user.otpAttempts = 0;
    user.otpCooldownUntil = undefined;
    await user.save({ validateBeforeSave: false });

    const token = user.generateAuthToken();

    res.status(200).json({
      success: true,
      message: 'Monthly security verification successful.',
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

// ============================================================================
// 3. STAFF AUTHENTICATION (EMAIL + OTP ONLY — NO PASSWORDS)
// ============================================================================

// @desc    Request Staff OTP (Driver / Admin / Super Admin)
// @route   POST /api/v1/auth/send-staff-otp
// @access  Public
exports.sendStaffOtp = async (req, res, next) => {
  try {
    const { email, expectedPortal } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Please provide your registered staff email.' },
      });
    }

    if (!expectedPortal || !['ADMIN', 'DRIVER'].includes(expectedPortal)) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: "expectedPortal must be 'ADMIN' or 'DRIVER'." },
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+otpCooldownUntil +otpExpires');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'No staff account found with this email address.' },
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: { code: 403, message: 'Staff account has been deactivated. Contact municipal administration.' },
      });
    }

    // Role Context Checks (Never trust frontend context without database verification!)
    if (expectedPortal === 'ADMIN') {
      if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          success: false,
          error: {
            code: 403,
            message: `Access Denied: Account '${user.email}' is registered as '${user.role}' and lacks Administrative privileges.`,
          },
        });
      }
    } else if (expectedPortal === 'DRIVER') {
      if (user.role !== 'DRIVER') {
        return res.status(403).json({
          success: false,
          error: {
            code: 403,
            message: `Access Denied: Account '${user.email}' is registered as '${user.role}', not as a Municipal Driver.`,
          },
        });
      }
    }

    // 60-second cooldown check
    const now = Date.now();
    if (user.otpCooldownUntil && user.otpCooldownUntil.getTime() > now) {
      const remainingSeconds = Math.ceil((user.otpCooldownUntil.getTime() - now) / 1000);
      return res.status(429).json({
        success: false,
        error: {
          code: 429,
          message: `Please wait ${remainingSeconds} seconds before requesting a new login code.`,
          remainingSeconds,
        },
      });
    }

    // Generate 6-digit numeric OTP
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = crypto.createHash('sha256').update(rawOtp).digest('hex');

    user.otpHash = otpHash;
    user.otpExpires = new Date(now + 10 * 60 * 1000); // 10 mins
    user.otpCooldownUntil = new Date(now + 60 * 1000); // 60s
    user.otpAttempts = 0;
    await user.save({ validateBeforeSave: false });

    // Send via email
    await sendEmail({
      email: user.email,
      subject: `${user.role} Secure Access Code — EcoCycle Srinagar`,
      text: `Your ${user.role} login verification code is: ${rawOtp}. Valid for 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #cbd5e1; rounded: 16px;">
          <h2 style="color: #0f172a;">${user.role} Identity Verification 🛡️</h2>
          <p>You requested login access to the Srinagar Municipal Waste Logistics Grid.</p>
          <div style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #0f172a; padding: 16px 0; font-family: monospace;">
            ${rawOtp}
          </div>
          <p style="color: #64748b; font-size: 12px;">Valid for 10 minutes. If you did not request this, inform the Super Administrator immediately.</p>
        </div>
      `,
      otp: rawOtp,
    });

    res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been dispatched to ${user.email}.`,
      cooldownSeconds: 60,
      demoOtp: rawOtp,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Verify Staff OTP and Issue Role-Specific JWT Session
// @route   POST /api/v1/auth/verify-staff-otp
// @access  Public
exports.verifyStaffOtp = async (req, res, next) => {
  try {
    const { email, otp, expectedPortal } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Please provide email and the 6-digit code.' },
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+otpHash +otpExpires +otpAttempts');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'Staff account not found.' },
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: { code: 403, message: 'Account has been deactivated.' },
      });
    }

    // Role Context Checks
    if (expectedPortal === 'ADMIN' && !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 403, message: 'Access Denied: Non-administrative account.' },
      });
    }

    if (expectedPortal === 'DRIVER' && user.role !== 'DRIVER') {
      return res.status(403).json({
        success: false,
        error: { code: 403, message: 'Access Denied: Non-driver account.' },
      });
    }

    if (!user.otpHash || !user.otpExpires) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'No active OTP request found. Please request a new code.' },
      });
    }

    if (Date.now() > user.otpExpires.getTime()) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Verification code has expired. Please request a new code.' },
      });
    }

    if (user.otpAttempts >= 5) {
      user.otpHash = undefined;
      user.otpExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(429).json({
        success: false,
        error: { code: 429, message: 'Too many failed verification attempts. Code invalidated.' },
      });
    }

    const inputHash = crypto.createHash('sha256').update(otp.trim()).digest('hex');
    if (inputHash !== user.otpHash) {
      user.otpAttempts += 1;
      await user.save({ validateBeforeSave: false });
      const remaining = 5 - user.otpAttempts;
      return res.status(400).json({
        success: false,
        error: { code: 400, message: `Invalid code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.` },
      });
    }

    // Clear OTP state
    user.otpHash = undefined;
    user.otpExpires = undefined;
    user.otpAttempts = 0;
    user.otpCooldownUntil = undefined;
    await user.save({ validateBeforeSave: false });

    // Issues role-based session (SUPER_ADMIN: 7d, ADMIN: 14d, DRIVER: 21d)
    const token = user.generateAuthToken();

    const dashboardRoute =
      user.role === 'SUPER_ADMIN'
        ? '/super-admin'
        : user.role === 'ADMIN'
        ? '/admin'
        : '/driver';

    res.status(200).json({
      success: true,
      message: `${user.role} authentication successful.`,
      token,
      dashboardRoute,
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

// ============================================================================
// 4. FORGOT PASSWORD (CITIZEN ONLY)
// ============================================================================

// @desc    Request password reset OTP (Citizen accounts only)
// @route   POST /api/v1/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Please provide an email address.' },
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    // If account not found: Return generic message to prevent account enumeration
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account is associated with this email, a password reset code has been dispatched.',
      });
    }

    // Privileged accounts do NOT use passwords
    if (['DRIVER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 400,
          message: 'This account uses secure email OTP authentication. Password reset is not available for staff accounts.',
        },
      });
    }

    // Generate single-use reset OTP (expires in 15 minutes)
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = crypto.createHash('sha256').update(rawOtp).digest('hex');

    user.resetPasswordOtpHash = otpHash;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save({ validateBeforeSave: false });

    await sendEmail({
      email: user.email,
      subject: 'Password Reset Code — EcoCycle Srinagar',
      text: `Your password reset code is: ${rawOtp}. Valid for 15 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #cbd5e1; rounded: 16px;">
          <h2 style="color: #e11d48;">Citizen Password Reset 🔑</h2>
          <p>We received a request to reset your EcoCycle citizen account password.</p>
          <div style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #0f172a; padding: 16px 0; font-family: monospace;">
            ${rawOtp}
          </div>
          <p style="color: #64748b; font-size: 12px;">Valid for 15 minutes. If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
      otp: rawOtp,
    });

    res.status(200).json({
      success: true,
      message: 'If an account is associated with this email, a password reset code has been dispatched.',
      demoOtp: rawOtp,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Reset password with OTP
// @route   POST /api/v1/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Please provide email, verification code, and new password.' },
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'New password must be at least 6 characters in length.' },
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+resetPasswordOtpHash +resetPasswordExpires');

    if (!user || user.role !== 'CITIZEN') {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Invalid or expired password reset request.' },
      });
    }

    if (!user.resetPasswordOtpHash || !user.resetPasswordExpires) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'No active password reset request found.' },
      });
    }

    if (Date.now() > user.resetPasswordExpires.getTime()) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Password reset code has expired. Please request a new one.' },
      });
    }

    const inputHash = crypto.createHash('sha256').update(otp.trim()).digest('hex');
    if (inputHash !== user.resetPasswordOtpHash) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Invalid password reset code.' },
      });
    }

    // Set new password (pre-save hook hashes it automatically)
    user.password = newPassword;
    // Invalidate any active sessions
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    user.resetPasswordOtpHash = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Your password has been reset successfully. You can now sign in with your new password.',
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================================
// 5. PROFILE & UTILITY METHODS
// ============================================================================

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

// ============================================================================
// 6. BACKWARD-COMPATIBLE API ADAPTERS (FOR TEST HARNESSES & MIGRATION)
// ============================================================================

// @desc    Direct citizen signup adapter (Strictly assigns CITIZEN role)
// @route   POST /api/v1/auth/register
// @access  Public
exports.registerDirect = async (req, res, next) => {
  try {
    const { name, email, password, phone, wardName, address, coordinates } = req.body;

    if (!name || !name.trim() || !email || !email.trim() || !password || password.length < 6) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Please provide valid name, email, and password (min. 6 chars).' },
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: 409, message: 'An account with this email address already exists.' },
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: 'CITIZEN', // Always CITIZEN
      phone,
      wardName: wardName || 'Lal Chowk',
      address: address || 'Srinagar, Jammu & Kashmir',
      location: coordinates ? { type: 'Point', coordinates } : undefined,
      lastOtpVerifiedAt: new Date(),
    });

    const token = user.generateAuthToken();
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        wardName: user.wardName,
        ecoCredits: user.ecoCredits,
        tier: user.tier,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Direct login adapter
// @route   POST /api/v1/auth/login
// @access  Public
exports.loginDirect = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: { code: 400, message: 'Provide email and password.' } });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, error: { code: 401, message: 'Invalid email or password.' } });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: { code: 401, message: 'Invalid email or password.' } });
    }

    const token = user.generateAuthToken();
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Universal OTP send adapter
// @route   POST /api/v1/auth/send-otp
// @access  Public
exports.sendOtpUniversal = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: { code: 400, message: 'Provide email.' } });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+otpCooldownUntil');
    if (!user) {
      return res.status(404).json({ success: false, error: { code: 404, message: 'User not found.' } });
    }

    const now = Date.now();
    if (user.otpCooldownUntil && user.otpCooldownUntil.getTime() > now) {
      return res.status(429).json({ success: false, error: { code: 429, message: 'Please wait for cooldown.' } });
    }

    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    user.otpHash = crypto.createHash('sha256').update(rawOtp).digest('hex');
    user.otpExpires = new Date(now + 10 * 60 * 1000);
    user.otpCooldownUntil = new Date(now + 60 * 1000);
    user.otpAttempts = 0;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      cooldownSeconds: 60,
      demoOtp: rawOtp,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Universal OTP verify adapter
// @route   POST /api/v1/auth/verify-otp
// @access  Public
exports.verifyOtpUniversal = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, error: { code: 400, message: 'Provide email and otp.' } });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+otpHash +otpExpires +otpAttempts');
    if (!user || !user.otpHash || !user.otpExpires) {
      return res.status(400).json({ success: false, error: { code: 400, message: 'Invalid OTP session.' } });
    }

    const inputHash = crypto.createHash('sha256').update(otp.trim()).digest('hex');
    if (inputHash !== user.otpHash) {
      user.otpAttempts += 1;
      await user.save({ validateBeforeSave: false });
      return res.status(400).json({ success: false, error: { code: 400, message: 'Invalid OTP.' } });
    }

    user.otpHash = undefined;
    user.otpExpires = undefined;
    user.otpAttempts = 0;
    await user.save({ validateBeforeSave: false });

    const token = user.generateAuthToken();
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};
