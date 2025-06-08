const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Protect routes - verify user is authenticated via cookie
const protect = async (req, res, next) => {
  const token = req.cookies.jwt; // get token from cookies

  if (!token) {
    res.status(401);
    const error = new Error('Not authorized, token failed');
    error.status = 401; // Optional, if you want to customize status codes
    return next(error);
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      res.status(401);
      const error = new Error('Not authorized, token failed');
      error.status = 401; // Optional, if you want to customize status codes
      return next(error);
    }

    next();
  } catch (error) {
    res.status(401);
    return next(new Error('Not authorized, token failed'));

  }
};

// Admin middleware
const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401);
    return next(new Error('Not authorized, as an admin'));
  }
};

module.exports = { protect, admin };
