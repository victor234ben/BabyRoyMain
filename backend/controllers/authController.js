
const redisClient = require('../config/redisClient.js');
const User = require('../models/userModel.js');
const generateToken = require('../utils/generateToken');
const generateReferralCode = require('../utils/referralCodeGenerator');
const jwt = require('jsonwebtoken');

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
const getSessionData = async (token) => {
  try {
    console.log(`🔍 Looking for session: session:${token}`);

    const sessionString = await redisClient.get(`session:${token}`);
    console.log(`🔍 Redis response:`, sessionString ? "Found" : "Not found");

    if (!sessionString) return null;

    const session = JSON.parse(sessionString);
    console.log(`🔍 Parsed session data:`, session);

    // Optionally verify expiration (not strictly needed since Redis auto-expires)
    if (new Date() > new Date(session.expiresAt)) {
      console.log(`⏰ Session expired, deleting...`);
      await redisClient.del(`session:${token}`);
      return null;
    }

    return session;
  } catch (error) {
    console.error(`❌ Error getting session data:`, error);
    return null;
  }
};

const deleteSessionToken = async (token) => {
  try {
    await redisClient.del(`session:${token}`);
    console.log(`Session token deleted: ${token}`);
  } catch (error) {
    console.error("Error deleting session token:", error);
  }
};

// Fixed session-based authentication - should redirect to frontend instead of returning JSON
const sessionBasedAuth = async (req, res) => {
  const sessionToken = req.query.session;
  // console.log("🔍 [DEBUG] Session token received:", sessionToken);

  try {
    if (!sessionToken) {
      // Redirect to login with error instead of returning JSON
      return res.redirect(`${process.env.FRONTEND_URL || 'https://babyroy-rjjm.onrender.com'}/?error=missing_session`);
    }

    // Get session data from store
    const sessionData = await getSessionData(sessionToken);
    // console.log("🔍 [DEBUG] Session data retrieved:", sessionData);

    if (!sessionData) {
      // Redirect to login with error instead of returning JSON
      return res.redirect(`${process.env.FRONTEND_URL || 'https://babyroy-rjjm.onrender.com'}/?error=invalid_session`);
    }

    // Find the user in database using the userId from session
    console.log("🔍 [DEBUG] Looking for user with ID:", sessionData.userId);
    const user = await User.findById(sessionData.userId);

    if (!user) {
      // Try finding by telegramId as fallback
      const userByTelegram = await User.findOne({ telegramId: sessionData.telegramId });
      if (!userByTelegram) {
        return res.redirect(`${process.env.FRONTEND_URL || 'https://babyroy-rjjm.onrender.com'}/?error=user_not_found`);
      }
      // Use the found user
      user = userByTelegram;
    }

    // Update user's last active time
    await User.findByIdAndUpdate(user._id, {
      $set: { lastActive: new Date() }
    });

    console.log(`✅ [DEBUG] Session-based authentication successful for user: ${user._id}`);

    // Generate JWT token for the session
    const jwtToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET ,
      { expiresIn: '7d' }
    );

    // Remove the session token as it's now consumed
    await deleteSessionToken(sessionToken);

    // Set JWT token as HTTP-only cookie
    res.cookie('token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Redirect to dashboard with success parameter
    const redirectUrl = `${process.env.FRONTEND_URL || 'https://babyroy-rjjm.onrender.com'}/dashboard?auth=success`;

    console.log(`✅ [DEBUG] Redirecting to: ${redirectUrl}`);
    return res.redirect(redirectUrl);

  } catch (error) {
    console.error("❌ [DEBUG] Error in session-based authentication:", error);
    return res.redirect(`${process.env.FRONTEND_URL || 'https://babyroy-rjjm.onrender.com'}/?error=auth_failed`);
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
