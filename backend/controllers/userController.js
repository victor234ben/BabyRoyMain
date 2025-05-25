
const User = require('../models/userModel');
const TaskCompletion = require('../models/taskCompletionModel');
const Reward = require('../models/rewardModel');
const { resetDailyTasks } = require('../utils/dailyTaskReset');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    // Check and reset daily tasks if needed
    await resetDailyTasks(req.user._id);

    const user = await User.findById(req.user._id).populate('referralCount');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.totalEarned = user.points + user.totalReferralPoints
    await user.save()

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        telegramId: user.telegramId,
        walletAddress: user.walletAddress,
        referralCode: user.referralCode,
        points: user.points,
        totalEarned: user.totalEarned,
        dailyTasksCompleted: user.dailyTasksCompleted,
        dailyPointsEarned: user.dailyPointsEarned,
        totalReferralPoints: user.totalReferralPoints || 0,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update fields
    if (req.body.name) user.name = req.body.name;
    if (req.body.email) user.email = req.body.email;
    if (req.body.password) user.password = req.body.password; // Will be hashed by pre-save middleware
    if (req.body.avatar) user.avatar = req.body.avatar;
    if (req.body.telegramId) user.telegramId = req.body.telegramId;
    if (req.body.walletAddress) user.walletAddress = req.body.walletAddress;

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        telegramId: updatedUser.telegramId,
        walletAddress: updatedUser.walletAddress,
        referralCode: updatedUser.referralCode,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get user stats/dashboard data
// @route   GET /api/users/dashboard
// @access  Private
const getUserDashboard = async (req, res) => {
  try {
    // Check and reset daily tasks if needed
    await resetDailyTasks(req.user._id);

    const user = await User.findById(req.user._id).populate('referralCount');

    // Get task completion stats
    const taskCompletions = await TaskCompletion.find({
      user: req.user._id,
      status: 'approved'
    }).countDocuments();

    // Get recent rewards
    const recentRewards = await Reward.find({
      user: req.user._id
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({
        path: 'source',
        select: 'title',
        model: 'Task'
      });

    // Get referrals
    const referrals = await User.find({
      referredBy: req.user._id
    })
      .select('name avatar createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    user.totalEarned = user.points + user.totalReferralPoints
    user.save()

    res.status(200).json({
      success: true,
      dashboard: {
        points: user.points,
        totalEarned: user.totalEarned,
        tasksCompleted: taskCompletions,
        dailyTasksCompleted: user.dailyTasksCompleted,
        dailyPointsEarned: user.dailyPointsEarned,
        dailyTasksLimit: Number(process.env.DAILY_TASKS_LIMIT) || 5,
        dailyPointsCap: Number(process.env.DAILY_POINTS_CAP) || 1000,
        totalReferralPoints: user.totalReferralPoints || 0,
        recentRewards,
        referrals
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { getUserProfile, updateUserProfile, getUserDashboard };
