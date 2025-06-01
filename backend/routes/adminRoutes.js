
const express = require('express');
const {
  createTask,
  updateTask,
  deleteTask,
  getTaskSubmissions,
  reviewSubmission,
  getUsers,
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected and require admin role
router.use(protect, admin);

// Task management routes
router.post('/tasks', createTask);
router.put('/tasks/:id', updateTask);
router.delete('/tasks/:id', deleteTask);

// Task submissions review routes
router.get('/submissions', getTaskSubmissions);
router.put('/submissions/:id', reviewSubmission);

// User management routes
router.get('/users', getUsers);

module.exports = router;
