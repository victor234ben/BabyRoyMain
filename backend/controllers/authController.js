
const User = require('../models/userModel.js');
const generateToken = require('../utils/generateToken');
const generateReferralCode = require('../utils/referralCodeGenerator');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, referralCode } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    // Find referrer if referral code provided
    let referredBy = null;

    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer) {
        referredBy = referrer._id;
      } else {
        referredBy = ""
      }
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      referralCode: generateReferralCode(),
      referredBy,
    });

    if (user) {
      // If a valid referral was used, reward the referrer
      // if (referredBy) {
      //   await processReferralReward(referredBy);
      // }

      generateToken(user._id, res)

      res.status(201).json({
        success: true,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
          referralCode: user.referralCode,
          points: user.points,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid user data',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email }).select('+password');

    // Check user exists and password matches
    if (user && (await user.matchPassword(password))) {
      generateToken(user._id, res)
      res.status(200).json({
        success: true,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
          referralCode: user.referralCode,
          points: user.points,
        },
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// to do tier one, tier two 1-50 1000 point 50+ 5000points per referrals
const telegramLoginAndSignup = async (req, res) => {
  const { telegramId, first_name, last_name, username } = req.body;

  console.log("Telegram OAuth request:", { telegramId, first_name, last_name, username });

  try {
    // Find existing user (should exist from /start command)
    let user = await User.findOne({ telegramId });

    if (user) {
      // User exists - update their info with latest from Telegram
      user = await User.findOneAndUpdate(
        { telegramId },
        {
          $set: {
            first_name: first_name || user.first_name,
            last_name: last_name || user.last_name,
            username: username || user.username,
            // Add any other fields you want to update from Telegram OAuth
            lastActive: new Date()
          }
        },
        { new: true }
      );

      console.log(`Updated existing user: ${user._id}`);
    } else {
      // Fallback: Create user if somehow they don't exist
      // This shouldn't happen often with your new flow
      console.log("User not found in database, creating new user (fallback)");

      user = await User.create({
        first_name,
        last_name,
        username,
        telegramId,
        referralCode: generateReferralCode(),
        points: 0,
        referredBy: null // No referral code processing here anymore
      });

      console.log(`Created new user (fallback): ${user._id}`);
    }

    // Generate JWT token
    generateToken(user._id, res);

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        telegramId: user.telegramId,
        referralCode: user.referralCode,
        points: user.points,
      },
    });

  } catch (error) {
    console.error("Error in telegramLoginAndSignup:", error);
    res.status(500).json({
      success: false,
      message: "Authentication failed",
      error: error.message
    });
  }
};

const validateUser = (req, res) => {
  const user = req.user
  res.json({ user })
}


module.exports = { registerUser, loginUser, validateUser, telegramLoginAndSignup };
