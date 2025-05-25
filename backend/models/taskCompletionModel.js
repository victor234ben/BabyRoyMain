
const mongoose = require('mongoose');

const taskCompletionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    submissionData: {
      type: String,
      default: '', // Can store proof of completion
    },
    pointsAwarded: {
      type: Number,
      default: 0,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate task completions
taskCompletionSchema.index({ user: 1, task: 1 }, { unique: true });

const TaskCompletion = mongoose.model('TaskCompletion', taskCompletionSchema);

module.exports = TaskCompletion;
