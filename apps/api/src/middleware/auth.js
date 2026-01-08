const jwt = require('jsonwebtoken');
const User = require('../models/User');

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

    if (user.role !== 'admin') {
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

    if (user.role !== 'admin' && user.role !== 'staff') {
      return res.status(403).json({ error: 'Staff access required' });
    }

    next();
  } catch (error) {
    const status = error.message === 'No authentication token provided' ? 401 : 403;
    res.status(status).json({ error: error.message || 'Staff access required' });
  }
};

module.exports = { auth, adminAuth, staffAuth };
