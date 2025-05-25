
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

const telegramLoginAndSignup = async (req, res) => {
  const { telegramId, first_name, last_name } = req.body;

  // Atomically find or insert user
  const user = await User.findOneAndUpdate(
    { telegramId },
    {
      $setOnInsert: {
        first_name,
        last_name,
        telegramId,
        referralCode: generateReferralCode(), // optional
        points: 0 // default points if needed
      }
    },
    {
      new: true,      // return the document *after* update/insert
      upsert: true,   // insert if not found
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
