
const express = require('express');
const { registerUser, loginUser, validateUser, telegramLoginAndSignup, sessionBasedAuth } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();


// Registration route
router.post('/register', registerUser);

// Login route
router.post('/login', loginUser);
router.post('/telegramOauth', telegramLoginAndSignup)
router.get('/verifysession', sessionBasedAuth)
router.get('/validate', protect, validateUser)

module.exports = router;
