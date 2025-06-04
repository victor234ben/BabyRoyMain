const jwt = require('jsonwebtoken');
const Admin = require('../models/adminModel'); // We'll create this model

// Authentication Controller
const adminAuthController = {
  // Login admin
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Please provide email and password'
        });
      }

      // Check if admin exists
      const admin = await Admin.findOne({ email }).select('+password');
      if (!admin || !admin.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check password
      const isPasswordCorrect = await admin.comparePassword(password);
      if (!isPasswordCorrect) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: admin._id,
          email: admin.email,
          role: admin.role
        },
        process.env.JWT_SECRET ,
        { expiresIn: '24h' }
      );

      // Remove password from response
      admin.password = undefined;

      res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        admin: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          role: admin.role
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },

  // Create admin (for script usage)
  createAdmin: async (req, res) => {
    try {
      const { username, email, password, role = 'admin' } = req.body;

      // Validate input
      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Please provide username, email, and password'
        });
      }

      // Check if admin already exists
      const existingAdmin = await Admin.findOne({
        $or: [{ email }, { username }]
      });

      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: 'Admin with this email or username already exists'
        });
      }

      // Create new admin
      const admin = await Admin.create({
        username,
        email,
        password,
        role
      });

      // Remove password from response
      admin.password = undefined;

      res.status(201).json({
        success: true,
        message: 'Admin created successfully',
        admin: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          role: admin.role
        }
      });

    } catch (error) {
      console.error('Create admin error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },

  // Verify token middleware
  verifyToken: async (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. No token provided.'
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET );
      const admin = await Admin.findById(decoded.id);

      if (!admin || !admin.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      }

      req.admin = admin;
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  },

  // Get current admin profile
  getProfile: async (req, res) => {
    try {
      const admin = await Admin.findById(req.admin.id).select('-password');

      res.status(200).json({
        success: true,
        admin
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },

  // Logout (client-side token removal)
  logout: async (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  }
};

module.exports = { adminAuthController };