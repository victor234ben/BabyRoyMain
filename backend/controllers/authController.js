
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

// Function to get session data
const getSessionData = (token) => {
  const data = sessionStore.get(token);
  if (!data) return null;

  if (new Date() > data.expiresAt) {
    sessionStore.delete(token);
    return null;
  }

  return data;
};

const sessionBasedAuth = async (req, res) => {
  const { sessionToken } = req.body;

  try {
    if (!sessionToken) {
      return res.status(400).json({
        success: false,
        message: "Session token is required",
        error: "MISSING_SESSION_TOKEN"
      });
    }

    // Get session data from store
    const sessionData = getSessionData(sessionToken);

    if (!sessionData) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired session token",
        error: "INVALID_SESSION_TOKEN"
      });
    }

    // Find the user in database
    const user = await User.findById(sessionData.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        error: "USER_NOT_FOUND"
      });
    }

    // Update user's last active time
    await User.findByIdAndUpdate(user._id, {
      $set: { lastActive: new Date() }
    });

    console.log(`✅ Session-based authentication successful for user: ${user._id}`);

    // Generate JWT token for the session
    generateToken(user._id, res);

    // Remove the session token as it's now consumed
    sessionStore.delete(sessionToken);

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
        totalEarned: user.totalEarned,
      },
    });

  } catch (error) {
    console.error("Error in session-based authentication:", error);
    res.status(500).json({
      success: false,
      message: "Authentication failed",
      error: error.message
    });
  }
};

// to do tier one, tier two 1-50 1000 point 50+ 5000points per referrals
// Update your existing telegramLoginAndSignup to handle both session and telegram auth
const telegramLoginAndSignup = async (req, res) => {
  const { telegramId, first_name, last_name, username, sessionToken } = req.body;

  try {
    // If session token is provided, use session-based auth
    if (sessionToken) {
      return await sessionBasedAuth(req, res);
    }

    // Original telegram-based authentication
    if (!telegramId) {
      return res.status(400).json({
        success: false,
        message: "Telegram ID or session token is required",
        error: "MISSING_CREDENTIALS"
      });
    }

    // ONLY find existing user - no creation here
    const user = await User.findOne({ telegramId });

    if (!user) {
      console.log(`❌ User not found for telegramId: ${telegramId}`);
      return res.status(404).json({
        success: false,
        message: "User not found. Please start the bot first with /start command.",
        error: "USER_NOT_FOUND"
      });
    }

    // User exists - update their info with latest from Telegram
    const updatedUser = await User.findOneAndUpdate(
      { telegramId },
      {
        $set: {
          first_name: first_name || user.first_name,
          last_name: last_name || user.last_name,
          username: username || user.username,
          lastActive: new Date()
        }
      },
      { new: true }
    );

    console.log(`✅ Found and authenticated user: ${updatedUser._id}`);

    // Generate JWT token
    generateToken(updatedUser._id, res);

    res.status(200).json({
      success: true,
      user: {
        _id: updatedUser._id,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        username: updatedUser.username,
        telegramId: updatedUser.telegramId,
        referralCode: updatedUser.referralCode,
        points: updatedUser.points,
        totalEarned: updatedUser.totalEarned,
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


module.exports = { registerUser, loginUser, validateUser, telegramLoginAndSignup, sessionBasedAuth };
