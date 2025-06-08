
const Task = require('../models/taskModel');
const TaskCompletion = require('../models/taskCompletionModel');
const User = require('../models/userModel');
const Reward = require('../models/rewardModel');
const { resetDailyTasks } = require('../utils/dailyTaskReset');

// @desc    Get all available tasks
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    // Check and reset daily tasks counter if needed
    await resetDailyTasks(req.user._id);

    // Get active tasks
    const tasks = await Task.find({ isActive: true });

    // Get user's completed tasks
    const completedTasks = await TaskCompletion.find({
      user: req.user._id,
    }).select('task status');

    // Map completion status to tasks
    const tasksWithStatus = tasks.map((task) => {
      const completion = completedTasks.find(
        (c) => c.task.toString() === task._id.toString()
      );

      return {
        ...task._doc,
        userStatus: completion ? completion.status : 'available',
      };
    });

    res.status(200).json({
      success: true,
      count: tasksWithStatus.length,
      tasks: tasksWithStatus,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single task by ID
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    const user = await User.findById(req.user._id);


    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    let completion = await TaskCompletion.findOne({
      user: req.user._id,
      task: task._id,
    }).select('status submissionData');

    // Handle auto and link-visit logic
    if (!completion && ['auto', 'link-visit'].includes(task.verificationMethod)) {
      const status = task.verificationMethod === 'auto' ? 'approved' : 'pending';

      completion = await TaskCompletion.create({
        user: req.user._id,
        task: task._id,
        status,
        pointsAwarded: status === 'approved' ? task.pointsReward : 0,
        completedAt: new Date(),
        submissionData: '',
      });

      // Optionally award points for auto
      if (status === 'approved') {
        user.points += task.pointsReward;
        user.totalEarned += task.pointsReward;
        user.dailyPointsEarned += task.pointsReward;
        if (task.type === 'daily') user.dailyTasksCompleted += 1;

        await user.save();

        await Reward.create({
          user: req.user._id,
          amount: task.pointsReward,
          type: 'task',
          source: task._id,
          sourceModel: 'Task',
          description: `Completed task: ${task.title}`,
        });
      }
    }

    res.status(200).json({
      success: true,
      task: {
        ...task._doc,
        userStatus: completion ? completion.status : 'available',
        userSubmission: completion ? completion.submissionData : null,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



// @desc    Submit task completion
// @route   POST /api/tasks/:id/complete
// @access  Private
const completeTask = async (req, res) => {
  try {
    await resetDailyTasks(req.user._id);

    const user = await User.findById(req.user._id);
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Get or create task completion
    let completion = await TaskCompletion.findOne({ user: req.user._id, task: task._id });

    if (completion) {
      if (completion.status === 'approved') {
        return res.status(400).json({
          success: false,
          message: 'You have already completed this task',
        });
      }

      if (completion.status === 'pending') {
        completion.status = 'approved';
        completion.pointsAwarded = task.pointsReward;
        completion.completedAt = new Date();
        await completion.save();
      } else {
        return res.status(400).json({
          success: false,
          message: 'This task is already in progress or submitted',
        });
      }
    } else {
      // New manual task completion (non-auto/link-visit)
      const isAuto = task.verificationMethod === 'auto';

      // Check task limits
      const dailyTasksLimit = Number(process.env.DAILY_TASKS_LIMIT) || 5;
      if (task.type === 'daily' && user.dailyTasksCompleted >= dailyTasksLimit) {
        return res.status(400).json({
          success: false,
          message: `You've reached the daily task limit of ${dailyTasksLimit}`,
        });
      }

      const dailyPointsCap = Number(process.env.DAILY_POINTS_CAP) || 1000;
      if (user.dailyPointsEarned + task.pointsReward > dailyPointsCap) {
        return res.status(400).json({
          success: false,
          message: `You've reached the daily points cap of ${dailyPointsCap}`,
        });
      }

      completion = new TaskCompletion({
        user: req.user._id,
        task: task._id,
        submissionData: req.body.submissionData || '',
        status: isAuto ? 'approved' : 'pending',
        pointsAwarded: isAuto ? task.pointsReward : 0,
      });

      if (isAuto) {
        completion.completedAt = new Date();
        await completion.save();
      }
    }

    // Update user rewards if approved
    if (completion.status === 'approved') {
      user.points += task.pointsReward;
      user.totalEarned += task.pointsReward;
      user.dailyPointsEarned += task.pointsReward;
      if (task.type === 'daily') user.dailyTasksCompleted += 1;

      await user.save();

      await Reward.create({
        user: req.user._id,
        amount: task.pointsReward,
        type: 'task',
        source: task._id,
        sourceModel: 'Task',
        description: `Completed task: ${task.title}`,
      });
    }

    res.status(200).json({
      success: true,
      message:
        completion.status === 'approved'
          ? 'Task completed successfully!'
          : 'Task submitted and pending review',
      taskCompletion: completion,
    });
  } catch (error) {
    console.error('Task completion error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



module.exports = { getTasks, getTaskById, completeTask };
