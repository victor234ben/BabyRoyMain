const express = require('express');
const { adminAuthController } = require('../controllers/adminAuthController');
const Task = require('../models/taskModel');
const router = express.Router();

// Auth routes
router.post('/auth/login', adminAuthController.login);
router.post('/auth/create-admin', adminAuthController.createAdmin);
router.post('/auth/logout', adminAuthController.logout);
router.get('/auth/profile', adminAuthController.verifyToken, adminAuthController.getProfile);

// Task management routes (protected)
// Get all tasks
router.get('/tasks', adminAuthController.verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, type, taskType, status } = req.query;
    
    // Build filter object
    const filter = {};
    if (category) filter.category = category;
    if (type) filter.type = type;
    if (taskType) filter.taskType = taskType;
    if (status) filter.status = status;

    const tasks = await Task.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Task.countDocuments(filter);

    res.status(200).json({
      success: true,
      tasks,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get single task
router.get('/tasks/:id', adminAuthController.verifyToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.status(200).json({
      success: true,
      task
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create new task
router.post('/tasks', adminAuthController.verifyToken, async (req, res) => {
  try {
    const task = await Task.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Update task
router.put('/tasks/:id', adminAuthController.verifyToken, async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      task
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Delete task
router.delete('/tasks/:id', adminAuthController.verifyToken, async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Toggle task active status
router.patch('/tasks/:id/toggle-status', adminAuthController.verifyToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    task.isActive = !task.isActive;
    await task.save();

    res.status(200).json({
      success: true,
      message: `Task ${task.isActive ? 'activated' : 'deactivated'} successfully`,
      task
    });
  } catch (error) {
    console.error('Toggle task status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get dashboard stats
router.get('/dashboard/stats', adminAuthController.verifyToken, async (req, res) => {
  try {
    const totalTasks = await Task.countDocuments();
    const activeTasks = await Task.countDocuments({ isActive: true });
    const inactiveTasks = await Task.countDocuments({ isActive: false });
    
    const tasksByCategory = await Task.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const tasksByType = await Task.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalTasks,
        activeTasks,
        inactiveTasks,
        tasksByCategory,
        tasksByType
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;