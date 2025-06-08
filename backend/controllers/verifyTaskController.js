const axios = require('axios')
const Task = require('../models/taskModel');
const TaskCompletion = require('../models/taskCompletionModel');
const User = require('../models/userModel')

const TELEGRAM_GROUP_USERNAME = process.env.TELEGRAM_GROUP_USERNAME;
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;

const verifyTelegram = async (req, res) => {
    try {

        console.log("called top")
        const { telegramId, taskId } = req.body;

        if (!telegramId || !taskId) {
            return res.status(400).json({ success: false, message: 'telegramId and taskId are required.' });
        }

        const task = await Task.findById(taskId);

        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found.' });
        }

        let userStatus;
        try {
            const telegramRes = await axios.get(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getChatMember?chat_id=${TELEGRAM_GROUP_USERNAME}&user_id=${telegramId}`)


            userStatus = telegramRes?.data?.result.status;

        } catch (telegramError) {
            console.error('Telegram API Error:', telegramError?.response?.data || telegramError.message);
            return res.status(500).json({ success: false, message: 'Failed to verify Telegram membership.' });
        }

        if (!['member', 'administrator', 'creator'].includes(userStatus)) {
            return res.status(403).json({ success: false, message: 'User has not joined the Telegram group.' });
        }

        // Check if task completion already exists
        let completion = await TaskCompletion.findOne({
            user: req.user._id,
            task: task._id,
        }).select('status submissionData');

        if (!completion) {
            completion = await TaskCompletion.create({
                user: req.user._id,
                task: task._id,
                status: 'pending',
                pointsAwarded: task.pointsReward,
                completedAt: new Date(),
                submissionData: '',
            });
        }

        return res.status(200).json({
            success: true,
            task: {
                ...task._doc,
                userStatus: completion.status,
                userSubmission: completion.submissionData,
            },
        });
    } catch (error) {
        console.error('Unexpected Server Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error.',
        });
    }
};

const connectWallet = async (req, res) => {
    try {
        const { walletAddress, taskId } = req.body;

        if (!walletAddress || !taskId) {
            return res.status(400).json({ success: false, message: 'Missing wallet address or task ID' });
        }

        // Save wallet address to user
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { walletAddress },
            { new: true }
        );

        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

        // Check if already completed
        let completion = await TaskCompletion.findOne({
            user: req.user._id,
            task: task._id,
        }).select('status submissionData');

        if (!completion) {
            completion = await TaskCompletion.create({
                user: req.user._id,
                task: task._id,
                status: 'pending',
                pointsAwarded: task.pointsReward,
                completedAt: new Date(),
                submissionData: '',
            });
        }

        return res.status(200).json({
            success: true,
            task: {
                ...task._doc,
                userStatus: completion.status,
                userSubmission: completion.submissionData,
            },
        });

    } catch (error) {
        console.error('Wallet connect error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

const verifyInvite = async (req, res) => {
    const { taskId, totalInvited } = req.body;
    const inviteThreshold = totalInvited
    const userId = req.user._id

    try {
        // Count how many users this user has referred
        const totalReferred = await User.countDocuments({ referredBy: userId });


        if (totalReferred >= inviteThreshold) {
            const task = await Task.findById(taskId);
            if (!task) {
                return res.status(404).json({ success: false, message: 'Task not found' });
            }

            // Check if completion already exists
            let completion = await TaskCompletion.findOne({
                user: req.user._id,
                task: task._id,
            }).select('status submissionData');

            if (!completion) {
                completion = await TaskCompletion.create({
                    user: req.user._id,
                    task: task._id,
                    status: 'pending',
                    pointsAwarded: 0,
                    completedAt: new Date(),
                    submissionData: '',
                });
            }
            return res.status(200).json({
                success: true,
                task: {
                    ...task._doc,
                    userStatus: completion.status,
                    userSubmission: completion.submissionData,
                },
            });
        } else {
            return res.status(400).json({
                success: false,
                message: `You need more invites. Referred: ${totalReferred}, Required: ${inviteThreshold + 1}`,
            });
        }
    } catch (error) {
        console.log("Error in verifyInvite controller:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

const completeOnboarding = async (req, res) => {
    const { taskId } = req.body;
    const userId = req.user._id;
    try {
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        // Get all onboarding tasks (should be 7 ideally)
        const allOnboardingTasks = await Task.find({ isOnboarding: true }).select('_id');
        const onboardingTaskIds = allOnboardingTasks.map(t => t._id.toString());

        // Get completed onboarding tasks for this user
        const userCompletedTasks = await TaskCompletion.find({
            user: userId,
            task: { $in: onboardingTaskIds },
            status: 'approved'
        }).select('task');

        const completedTaskIds = userCompletedTasks.map(t => t.task.toString());

        const hasCompletedAll = onboardingTaskIds.every(id => completedTaskIds.includes(id));

        if (!hasCompletedAll) {
            return res.status(400).json({
                success: false,
                message: 'You must complete all onboarding tasks before proceeding.',
            });
        }

        // Check or create completion record for current task
        let completion = await TaskCompletion.findOne({
            user: userId,
            task: task._id,
        }).select('status submissionData');

        if (!completion) {
            completion = await TaskCompletion.create({
                user: userId,
                task: task._id,
                status: 'pending',
                pointsAwarded: 0,
                completedAt: new Date(),
                submissionData: '',
            });
        }

        return res.status(200).json({
            success: true,
            task: {
                ...task._doc,
                userStatus: completion.status,
                userSubmission: completion.submissionData,
            },
        });

    } catch (error) {
        console.error('Error in completeOnboarding Controller', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = { verifyTelegram, connectWallet, verifyInvite, completeOnboarding }