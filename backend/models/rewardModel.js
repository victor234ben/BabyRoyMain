
const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      enum: ['task', 'referral', 'bonus', 'other'],
      default: 'task',
    },
    source: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'sourceModel',
    },
    sourceModel: {
      type: String,
      enum: ['Task', 'User', null],
      default: null,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processed', 'failed'],
      default: 'processed',
    },
    transactionId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

rewardSchema.index(
  { user: 1, type: 1, source: 1 },
  {
    unique: true,
    partialFilterExpression: { type: 'referral' }
  }
);

const Reward = mongoose.model('Reward', rewardSchema);

module.exports = Reward;
