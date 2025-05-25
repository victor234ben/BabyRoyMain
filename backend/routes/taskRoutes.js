
const express = require('express');
const { getTasks, getTaskById, completeTask } = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(protect);

// Task routes
router.get('/', getTasks);
router.get('/:id', getTaskById);
router.post('/:id/complete', completeTask);

module.exports = router;
