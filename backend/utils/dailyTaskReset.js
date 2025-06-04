const User = require('../models/userModel');
const TaskCompletion = require('../models/taskCompletionModel');
const Task = require('../models/taskModel'); // Add Task model import

// Reset daily task counters and completions
const resetDailyTasks = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    const now = new Date();
    const lastReset = new Date(user.lastDailyReset);

    // Check if it's past 1 AM on a new day
    const shouldReset = checkIfShouldReset(now, lastReset);

    if (shouldReset) {
      // Reset user daily counters
      user.dailyTasksCompleted = 0;
      user.dailyPointsEarned = 0;
      user.lastDailyReset = now;

      // Get daily tasks first
      const dailyTasks = await Task.find({
        type: "daily"
      }).select('_id');

      const dailyTaskIds = dailyTasks.map(task => task._id);

      if (dailyTaskIds.length > 0) {
        await TaskCompletion.deleteMany({
          user: userId,
          task: { $in: dailyTaskIds }
        });
      }

      await user.save();
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error resetting daily tasks:', error);
    throw error;
  }
};

// Helper function to check if reset should happen (at 1 AM)
const checkIfShouldReset = (now, lastReset) => {
  const currentHour = now.getHours();
  const lastResetDate = lastReset.toDateString();
  const currentDate = now.toDateString();

  // If it's a different day and current time is 1 AM or later
  if (currentDate !== lastResetDate && currentHour >= 1) {
    return true;
  }

  // If it's the same day but we haven't reset yet and it's past 1 AM
  if (currentDate === lastResetDate) {
    const lastResetHour = lastReset.getHours();
    // If last reset was before 1 AM today and now it's 1 AM or later
    if (lastResetHour < 1 && currentHour >= 1) {
      return true;
    }
  }

  return false;
};

// Alternative function if you want to reset at exactly 1 AM using cron job
const scheduleDailyReset = () => {
  const cron = require('node-cron');

  // Schedule to run at 1:00 AM every day
  cron.schedule('0 1 * * *', async () => {
    try {
      console.log('Running daily task reset at 1 AM...');

      // Get all users and reset their daily tasks
      const users = await User.find({});

      for (const user of users) {
        await resetDailyTasksForUser(user._id);
      }

      console.log('Daily task reset completed for all users');
    } catch (error) {
      console.error('Error in scheduled daily reset:', error);
    }
  });
};

// Simplified reset function for cron job
const resetDailyTasksForUser = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      return false;
    }

    // Reset user daily counters
    user.dailyTasksCompleted = 0;
    user.dailyPointsEarned = 0;
    user.lastDailyReset = new Date();

    // Get daily tasks first
    const dailyTasks = await Task.find({
      type: "daily"
    }).select('_id');

    const dailyTaskIds = dailyTasks.map(task => task._id);

    // Reset only daily task completions status (keep records for points history)
    if (dailyTaskIds.length > 0) {
      await TaskCompletion.updateMany(
        {
          user: userId,
          task: { $in: dailyTaskIds } // Only update daily tasks
        },
        {
          $set: {
            status: 'available', // or 'incomplete' - whatever your initial status is
            completedAt: null,
            submissionData: '',
            // Keep pointsAwarded for history
          }
        }
      );
    } if (dailyTaskIds.length > 0) {
      await TaskCompletion.deleteMany({
        user: userId,
        task: { $in: dailyTaskIds }
      });
    }

    await user.save();
    return true;
  } catch (error) {
    console.error(`Error resetting daily tasks for user ${userId}:`, error);
    throw error;
  }
};

module.exports = {
  resetDailyTasks,
  scheduleDailyReset,
  resetDailyTasksForUser
};