const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes - Verify JWT token
 */
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for Bearer token in authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // Make sure token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
    }

    try {
      // Verify token (support both JWT_SECRET_KEY and JWT_SECRET)
      const secret = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET;
      const decoded = jwt.verify(token, secret);

      // Get user from token (support both userId and id)
      const userId = decoded.userId || decoded.id;
      req.user = await User.findById(userId).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
        });
      }

      // Check if user is active
      if (req.user.status === 'inactive' || req.user.status === 'suspended') {
        return res.status(403).json({
          success: false,
          message: 'Your account has been suspended. Please contact administrator.',
        });
      }

      next();
    } catch (err) {
      console.error('Token verification error:', err);
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        error: err.message,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error.message,
    });
  }
};

/**
 * Role-based authorization
 * @param  {...any} roles - Allowed roles (ceo, manager, employee, etc.)
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`,
        requiredRoles: roles,
      });
    }

    next();
  };
};

/**
 * Permission-based authorization
 * @param {string} permission - Required permission
 */
exports.can = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    if (!req.user.permissions || !req.user.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action',
        requiredPermission: permission,
      });
    }

    next();
  };
};

/**
 * Department-based authorization
 * @param  {...any} departments - Allowed departments
 */
exports.allowDepartments = (...departments) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    if (!departments.includes(req.user.department)) {
      return res.status(403).json({
        success: false,
        message: `Department '${req.user.department}' is not authorized to access this route`,
        allowedDepartments: departments,
      });
    }

    next();
  };
};
