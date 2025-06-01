
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
// Add this to your backend telegramLoginAndSignup function
const telegramLoginAndSignup = async (req, res) => {
  const { telegramId, first_name, last_name, referralCode, debugTelegramData } = req.body;

  console.log("=== BACKEND TELEGRAM LOGIN DEBUG ===");
  console.log("Received referralCode:", referralCode);
  console.log("Received debugTelegramData:", debugTelegramData);

  if (debugTelegramData) {
    console.log("🔍 Complete Telegram WebApp Data:");
    console.log("- initData:", debugTelegramData.initData);
    console.log("- initDataUnsafe:", debugTelegramData.initDataUnsafe);
    console.log("- start_param from initDataUnsafe:", debugTelegramData.initDataUnsafe?.start_param);
    console.log("- All initDataUnsafe keys:", Object.keys(debugTelegramData.initDataUnsafe || {}));
    console.log("- Platform:", debugTelegramData.platform);
    console.log("- Version:", debugTelegramData.version);
  }

  console.log("=== END DEBUG ===");

  // ... rest of your existing telegramLoginAndSignup code remains the same
  console.log("this user have a referral code included: " + referralCode);

  // Check if user already exists
  const existingUser = await User.findOne({ telegramId });

  let referredBy = null;
  let referrer = null;

  // Only process referral for NEW users
  if (!existingUser && referralCode) {
    referrer = await User.findOne({ referralCode });
    if (referrer) {
      referredBy = referrer._id;

      // Award referral points to the referrer
      referrer.points += 1000;
      referrer.totalEarned += 1000;
      await referrer.save();

      // Create reward record for the referrer
      await Reward.create({
        user: referrer._id,
        amount: 1000,
        type: 'referral',
        source: telegramId,
        sourceModel: 'User',
        description: `Referral bonus for inviting ${first_name}`,
      });

      console.log(`Awarded 1000 points to referrer: ${referrer._id}`);
    } else {
      console.log("Invalid referral code provided");
    }
  } else if (existingUser) {
    console.log("User already exists, no referral reward given");
  }

  // Atomically find or insert user
  const user = await User.findOneAndUpdate(
    { telegramId },
    {
      $setOnInsert: {
        first_name,
        last_name,
        telegramId,
        referralCode: generateReferralCode(),
        points: 0,
        referredBy
      }
    },
    {
      new: true,
      upsert: true,
    }
  );

  generateToken(user._id, res);

  res.status(201).json({
    success: true,
    user: {
      _id: user._id,
      first_name: user.first_name,
      telegramId: user.telegramId,
      referralCode: user.referralCode,
      points: user.points,
    },
  });
};

const validateUser = (req, res) => {
  const user = req.user
  res.json({ user })
}


module.exports = { registerUser, loginUser, validateUser, telegramLoginAndSignup };
