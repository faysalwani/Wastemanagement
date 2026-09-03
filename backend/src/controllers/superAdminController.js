const { User, AuditLog } = require('../models');

// @desc    Get paginated users with search and role/status filtering
// @route   GET /api/v1/super-admin/users
// @access  Private (SUPER_ADMIN only)
exports.getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    const filter = {};

    // Filter by role
    if (req.query.role && ['CITIZEN', 'DRIVER', 'ADMIN', 'SUPER_ADMIN'].includes(req.query.role.toUpperCase())) {
      filter.role = req.query.role.toUpperCase();
    }

    // Filter by active status
    if (req.query.status) {
      if (req.query.status.toUpperCase() === 'ACTIVE') filter.isActive = true;
      if (req.query.status.toUpperCase() === 'SUSPENDED') filter.isActive = false;
    }

    // Search query by name or email
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search.trim(), 'i');
      filter.$or = [{ name: searchRegex }, { email: searchRegex }, { wardName: searchRegex }];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password -otpHash -otpExpires -otpAttempts -otpCooldownUntil')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: users,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single user details by ID
// @route   GET /api/v1/super-admin/users/:id
// @access  Private (SUPER_ADMIN only)
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select(
      '-password -otpHash -otpExpires -otpAttempts -otpCooldownUntil'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'User not found.' },
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user role (Promote / Demote)
// @route   PATCH /api/v1/super-admin/users/:id/role
// @access  Private (SUPER_ADMIN only)
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role, reason } = req.body;

    if (!role || !['CITIZEN', 'DRIVER', 'ADMIN', 'SUPER_ADMIN'].includes(role.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: {
          code: 400,
          message: "Invalid role specified. Must be 'CITIZEN', 'DRIVER', 'ADMIN', or 'SUPER_ADMIN'.",
        },
      });
    }

    const newRole = role.toUpperCase();
    const targetUserId = req.params.id;

    // Guard: Prevent self-modification
    if (req.user._id.toString() === targetUserId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 400,
          message: 'Super Administrators cannot modify their own privileged role.',
        },
      });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'Target user not found.' },
      });
    }

    // Guard: Prevent demoting the last active Super Admin
    if (targetUser.role === 'SUPER_ADMIN' && newRole !== 'SUPER_ADMIN') {
      const superAdminCount = await User.countDocuments({ role: 'SUPER_ADMIN', isActive: true });
      if (superAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: 'Operation rejected: Cannot demote or remove the last remaining active Super Administrator.',
          },
        });
      }
    }

    const previousRole = targetUser.role;
    targetUser.role = newRole;
    // Invalidate existing sessions immediately
    targetUser.tokenVersion = (targetUser.tokenVersion || 0) + 1;
    await targetUser.save({ validateBeforeSave: false });

    // Record in Audit Log
    await AuditLog.create({
      performedBy: req.user._id,
      targetUser: targetUser._id,
      action: 'ROLE_CHANGE',
      previousValue: previousRole,
      newValue: newRole,
      reason: reason ? reason.trim() : `Role updated from ${previousRole} to ${newRole}`,
      ipAddress: req.ip || '127.0.0.1',
    });

    res.status(200).json({
      success: true,
      message: `User role successfully updated from ${previousRole} to ${newRole}.`,
      data: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        isActive: targetUser.isActive,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user status (Suspend / Reactivate)
// @route   PATCH /api/v1/super-admin/users/:id/status
// @access  Private (SUPER_ADMIN only)
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { isActive, reason } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: "Please provide boolean 'isActive' field (true or false)." },
      });
    }

    const targetUserId = req.params.id;

    // Guard: Prevent self-suspension
    if (req.user._id.toString() === targetUserId) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Super Administrators cannot suspend their own account.' },
      });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'Target user not found.' },
      });
    }

    // Guard: Prevent deactivating the last active Super Admin
    if (targetUser.role === 'SUPER_ADMIN' && isActive === false) {
      const superAdminCount = await User.countDocuments({ role: 'SUPER_ADMIN', isActive: true });
      if (superAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: 'Operation rejected: Cannot deactivate the last remaining active Super Administrator.',
          },
        });
      }
    }

    const previousStatus = targetUser.isActive;
    targetUser.isActive = isActive;
    // Invalidate existing sessions immediately
    targetUser.tokenVersion = (targetUser.tokenVersion || 0) + 1;
    await targetUser.save({ validateBeforeSave: false });

    // Record in Audit Log
    await AuditLog.create({
      performedBy: req.user._id,
      targetUser: targetUser._id,
      action: isActive ? 'ACCOUNT_REACTIVATED' : 'ACCOUNT_SUSPENDED',
      previousValue: String(previousStatus),
      newValue: String(isActive),
      reason: reason ? reason.trim() : `Account ${isActive ? 'reactivated' : 'suspended'} by Super Administrator`,
      ipAddress: req.ip || '127.0.0.1',
    });

    res.status(200).json({
      success: true,
      message: `User account has been ${isActive ? 'reactivated' : 'suspended'}.`,
      data: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        isActive: targetUser.isActive,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get system security audit logs
// @route   GET /api/v1/super-admin/audit-logs
// @access  Private (SUPER_ADMIN only)
exports.getAuditLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;

    const total = await AuditLog.countDocuments();
    const logs = await AuditLog.find()
      .populate('performedBy', 'name email role')
      .populate('targetUser', 'name email role')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: logs,
    });
  } catch (err) {
    next(err);
  }
};
