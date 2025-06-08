
const express = require('express');
const { getUserProfile, updateUserProfile, getUserDashboard } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(protect);

// Get and update user profile
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);

// User dashboard data
router.get('/dashboard', getUserDashboard);

module.exports = router;
