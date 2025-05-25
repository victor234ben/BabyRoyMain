
const Task = require('../models/taskModel');
const User = require('../models/userModel');
const TaskCompletion = require('../models/taskCompletionModel');
const Reward = require('../models/rewardModel');

// @desc    Create a new task
// @route   POST /api/admin/tasks
// @access  Private/Admin
const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      category,
      pointsReward,
      requirements,
      verificationMethod,
      verificationData,
      expiresAt,
    } = req.body;
    
    const task = await Task.create({
      title,
      description,
      type,
      category,
      pointsReward,
      requirements,
      verificationMethod,
      verificationData,
      expiresAt: expiresAt || null,
    });
    
    res.status(201).json({
      success: true,
      task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update a task
// @route   PUT /api/admin/tasks/:id
// @access  Private/Admin
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }
    
    const updates = req.body;
    const updatedTask = await Task.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    
    res.status(200).json({
      success: true,
      task: updatedTask,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete a task
// @route   DELETE /api/admin/tasks/:id
// @access  Private/Admin
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }
    
    await task.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Task removed',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all task submissions (pending review)
// @route   GET /api/admin/submissions
// @access  Private/Admin
const getTaskSubmissions = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Get only pending submissions
    const total = await TaskCompletion.countDocuments({ status: 'pending' });
    
    const submissions = await TaskCompletion.find({ status: 'pending' })
      .sort({ createdAt: 1 }) // Oldest first
      .skip(startIndex)
      .limit(limit)
      .populate({
        path: 'user',
        select: 'name email',
      })
      .populate({
        path: 'task',
        select: 'title pointsReward',
      });
    
    res.status(200).json({
      success: true,
      count: submissions.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      submissions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Review task submission (approve/reject)
// @route   PUT /api/admin/submissions/:id
// @access  Private/Admin
const reviewSubmission = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    
    if (!status || (status !== 'approved' && status !== 'rejected')) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid status (approved/rejected)',
      });
    }
    
    const submission = await TaskCompletion.findById(req.params.id);
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found',
      });
    }
    
    if (submission.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `This submission has already been ${submission.status}`,
      });
    }
    
    // Update submission status
    submission.status = status;
    submission.reviewedBy = req.user._id;
    submission.reviewedAt = Date.now();
    
    if (status === 'rejected') {
      submission.rejectionReason = rejectionReason || 'Submission did not meet requirements';
    } else if (status === 'approved') {
      // Get task info for reward
      const task = await Task.findById(submission.task);
      
      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Associated task not found',
        });
      }
      
      // Update user points
      const user = await User.findById(submission.user);
      
      if (user) {
        user.points += task.pointsReward;
        user.totalEarned += task.pointsReward;
        
        // Update daily stats if task is daily
        if (task.type === 'daily') {
          user.dailyPointsEarned += task.pointsReward;
          user.dailyTasksCompleted += 1;
        }
        
        await user.save();
        
        // Record reward
        submission.pointsAwarded = task.pointsReward;
        
        await Reward.create({
          user: user._id,
          amount: task.pointsReward,
          type: 'task',
          source: task._id,
          sourceModel: 'Task',
          description: `Completed task: ${task.title}`,
        });
      }
    }
    
    await submission.save();
    
    res.status(200).json({
      success: true,
      message: `Submission ${status} successfully`,
      submission,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all users (for admin)
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const search = req.query.search || '';
    
    // Build search query
    const searchQuery = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
          ],
        }
      : {};
    
    const total = await User.countDocuments(searchQuery);
    
    const users = await User.find(searchQuery)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);
    
    res.status(200).json({
      success: true,
      count: users.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createTask,
  updateTask,
  deleteTask,
  getTaskSubmissions,
  reviewSubmission,
  getUsers,
};
