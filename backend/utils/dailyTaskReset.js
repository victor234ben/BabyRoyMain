
const User = require('../models/userModel');

// Reset daily task counters
const resetDailyTasks = async (userId) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const now = new Date();
    const lastReset = new Date(user.lastDailyReset);
    
    // Check if it's a new day (different day)
    if (now.toDateString() !== lastReset.toDateString()) {
      user.dailyTasksCompleted = 0;
      user.dailyPointsEarned = 0;
      user.lastDailyReset = now;
      await user.save();
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error resetting daily tasks:', error);
    throw error;
  }
};

module.exports = { resetDailyTasks };
