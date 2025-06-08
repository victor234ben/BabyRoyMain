
const User = require('../models/userModel');
const Reward = require('../models/rewardModel');

// @desc    Get user's referral info
// @route   GET /api/referrals
// @access  Private
const getUserReferralInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('referralCode');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get referrals count
    const referralsCount = await User.countDocuments({
      referredBy: req.user._id,
    });

    // Use environment variables for bonus amounts
    const bonusTier1 = Number(process.env.REFERRAL_BONUS_TIER_1) || 1000; // For 1–50
    const bonusTier2 = Number(process.env.REFERRAL_BONUS_TIER_2) || 5000; // For 51+

    // Determine how many referrals fall into each tier
    let tier1Count = 0;
    let tier2Count = 0;

    if (referralsCount > 0 && referralsCount <= 50) {
      tier1Count = referralsCount;
    } else if (referralsCount > 50) {
      tier1Count = 50;
      tier2Count = referralsCount - 50;
    }

    // Total referral rewards based on tiers
    const totalReferralRewards = (tier1Count * bonusTier1) + (tier2Count * bonusTier2);

    // Optional: use last tier's bonus for "rewardPerReferral" field (if needed)
    const rewardPerReferral = referralsCount > 50 ? bonusTier2 : bonusTier1;

    user.totalReferralPoints = totalReferralRewards
    await user.save()

    // Get recent referrals (limit 10)
    const referrals = await User.find({ referredBy: req.user._id })
      .select('first_name avatar createdAt')
      .sort({ createdAt: -1 })
      .limit(10);


    // Format response
    const referralInfo = {
      referralCode: user.referralCode,
      referralLink: `${req.protocol}://${req.get('host')}/refer/${user.referralCode}`,
      referralsCount,
      totalReferralRewards,
      rewardPerReferral,
      referrals,
    };

    res.status(200).json({
      success: true,
      referralInfo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// @desc    Get user's referral list (paginated)
// @route   GET /api/referrals/list
// @access  Private
const getReferralsList = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Get total count
    const total = await User.countDocuments({
      referredBy: req.user._id,
    });

    // Get paginated list
    const referrals = await User.find({ referredBy: req.user._id })
      .select('first_name avatar email createdAt')
        .sort({ createdAt: -1 })
        .skip(startIndex)
        .limit(limit);

    res.status(200).json({
      success: true,
      count: referrals.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      referrals,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Validate a referral code
// @route   GET /api/referrals/validate/:code
// @access  Public
const validateReferralCode = async (req, res) => {
  try {
    const referralCode = req.params.code;

    if (!referralCode) {
      return res.status(400).json({
        success: false,
        message: 'No referral code provided',
      });
    }

    const referrer = await User.findOne({ referralCode }).select('first_name avatar');

    if (!referrer) {
      return res.status(404).json({
        success: false,
        message: 'Invalid referral code',
        isValid: false,
      });
    }

    res.status(200).json({
      success: true,
      isValid: true,
      referrer: {
        first_name: referrer.first_name,
        avatar: referrer.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { getUserReferralInfo, getReferralsList, validateReferralCode };
