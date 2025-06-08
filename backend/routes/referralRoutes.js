
const express = require('express');
const {
  getUserReferralInfo,
  getReferralsList,
  validateReferralCode,
} = require('../controllers/referralController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Public route
router.get('/validate/:code', validateReferralCode);

// Protected routes
router.use(protect);
router.get('/', getUserReferralInfo);
router.get('/list', getReferralsList);

module.exports = router;
