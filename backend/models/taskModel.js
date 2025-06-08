
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true,
    },
    description: {
      type: String,
    },
    type: {
      type: String,
      enum: ['one-time', 'daily', 'weekly'],
      required: [true, 'Please specify task type'],
    },
    category: {
      type: String,
      enum: ['social', 'content', 'engagement', 'learn', 'other'],
      default: 'other',
    },
    pointsReward: {
      type: Number,
      required: [true, 'Please specify points reward'],
      min: 0,
    },
    requirements: {
      type: String,
    },
    action: {
      type: String,
      default: "",
    },
    verificationMethod: {
      type: String,
      enum: ['auto', 'link-visit', "action"],
      default: 'auto',
    },
    verificationData: {
      type: String, // Can store URL, social handle, or other data needed for verification
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isOnboarding: {
      type: Boolean,
      default: false,
    },
    taskType: {
      type: String,
      default: "ingame",
      enum: ["ingame", "partners"]
    },
    status: {
      type: String,
      enum: ["available", "pending"],
      defaullt: "available"
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    icon: {
      type: String,
      default: "https://res.cloudinary.com/dtcbirvxc/image/upload/v1747334030/kvqmrisqgphhhlsx3u8u.png"
    },
  },
  {
    timestamps: true,
  }
);

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
