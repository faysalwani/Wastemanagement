const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Protect routes: Verifies JWT token and attaches user to req
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 401,
        message: 'Authentication required. Please provide a valid Bearer token.',
      },
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'super_secret_jwt_key_srinagar_smart_waste_2026_msc_ai'
    );

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 401,
          message: 'User belonging to this authentication token no longer exists.',
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

    // Role Change / Password Reset Session Invalidation Guard
    if (
      decoded.tokenVersion !== undefined &&
      user.tokenVersion !== undefined &&
      decoded.tokenVersion !== user.tokenVersion
    ) {
      return res.status(401).json({
        success: false,
        error: {
          code: 401,
          message: 'Your security role or session has been updated. Please sign in again.',
        },
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: {
        code: 401,
        message: 'Invalid or expired token. Please log in again.',
      },
    });
  }
};

// Grant access to specific roles (RBAC Guard with SUPER_ADMIN hierarchy)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 401, message: 'Authentication required.' },
      });
    }

    const userRole = req.user.role;

    // Direct match
    const hasRole = roles.includes(userRole);

    // Hierarchy: SUPER_ADMIN has access to any endpoint authorized for ADMIN
    const isSuperAdminInherited = userRole === 'SUPER_ADMIN' && roles.includes('ADMIN');

    if (!hasRole && !isSuperAdminInherited) {
      return res.status(403).json({
        success: false,
        error: {
          code: 403,
          message: `Forbidden: User role '${userRole}' is unauthorized to perform this action. Required role(s): ${roles.join(', ')}`,
        },
      });
    }

    next();
  };
};

module.exports = { protect, authorize };
