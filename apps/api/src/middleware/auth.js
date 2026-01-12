const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getRolePermissions, hasPermission, hasAnyPermission, hasAllPermissions } = require('../config/permissions');

// Helper function to authenticate and attach user to request
const authenticateUser = async (req) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    throw new Error('No authentication token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || !user.is_active) {
      throw new Error('Invalid authentication token');
    }

    // Remove password_hash from user object
    const userCopy = { ...user };
    delete userCopy.password_hash;

    // Add permissions to user object
    userCopy.permissions = getRolePermissions(user.role);

    req.user = userCopy;
    req.userId = user.id;

    return userCopy;
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid authentication token');
    }
    if (error.name === 'TokenExpiredError') {
      throw new Error('Authentication token expired');
    }
    throw error;
  }
};

const auth = async (req, res, next) => {
  try {
    await authenticateUser(req);
    next();
  } catch (error) {
    res.status(401).json({ error: error.message || 'Invalid authentication token' });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    const user = await authenticateUser(req);

    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    const status = error.message === 'No authentication token provided' ? 401 : 403;
    res.status(status).json({ error: error.message || 'Admin access required' });
  }
};

const staffAuth = async (req, res, next) => {
  try {
    const user = await authenticateUser(req);

    if (user.role !== 'admin' && user.role !== 'super_admin' && user.role !== 'staff') {
      return res.status(403).json({ error: 'Staff access required' });
    }

    next();
  } catch (error) {
    const status = error.message === 'No authentication token provided' ? 401 : 403;
    res.status(status).json({ error: error.message || 'Staff access required' });
  }
};

// Permission-based middleware - check if user has a specific permission
const checkPermission = (permission) => {
  return async (req, res, next) => {
    try {
      const user = await authenticateUser(req);

      if (!hasPermission(user.role, permission)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          message: `You do not have permission to perform this action. Required: ${permission}`
        });
      }

      next();
    } catch (error) {
      const status = error.message === 'No authentication token provided' ? 401 : 403;
      res.status(status).json({ error: error.message || 'Authentication required' });
    }
  };
};

// Check if user has any of the given permissions
const checkAnyPermission = (permissions) => {
  return async (req, res, next) => {
    try {
      const user = await authenticateUser(req);

      if (!hasAnyPermission(user.role, permissions)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          message: `You do not have permission to perform this action. Required one of: ${permissions.join(', ')}`
        });
      }

      next();
    } catch (error) {
      const status = error.message === 'No authentication token provided' ? 401 : 403;
      res.status(status).json({ error: error.message || 'Authentication required' });
    }
  };
};

// Check if user has all of the given permissions
const checkAllPermissions = (permissions) => {
  return async (req, res, next) => {
    try {
      const user = await authenticateUser(req);

      if (!hasAllPermissions(user.role, permissions)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          message: `You do not have permission to perform this action. Required all of: ${permissions.join(', ')}`
        });
      }

      next();
    } catch (error) {
      const status = error.message === 'No authentication token provided' ? 401 : 403;
      res.status(status).json({ error: error.message || 'Authentication required' });
    }
  };
};

module.exports = {
  auth,
  adminAuth,
  staffAuth,
  checkPermission,
  checkAnyPermission,
  checkAllPermissions,
};
