const mongoose = require('mongoose');
const Task = require('./models/taskModel');
const User = require('./models/userModel');

// Replace with your MongoDB connection string
const mongoURI = process.env.MONGO_URI;

// Connect to MongoDB
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Error connecting to MongoDB', err));

// Create demo tasks
const demoTasks = [
  {
    title: "Daily Login",
    description: "Log in daily to earn rewards.",
    type: "daily",
    category: "engagement",
    pointsReward: 500,
    requirements: "Login to your account.",
    verificationMethod: "auto",
    verificationData: "",
    taskType: "ingame",
    isActive: true,
    isOnboarding: true,
  },
  {
    title: "Join Telegram Group",
    description: "Join our official Telegram group to stay updated.",
    type: "one-time",
    category: "social",
    pointsReward: 1000,
    requirements: "Click the link and join the group.",
    verificationMethod: "action",
    verificationData: "https://t.me/BabyRoyarmy",
    action: "telegram",
    taskType: "ingame",
    isActive: true,
    isOnboarding: true,
    icon: "https://res.cloudinary.com/dtcbirvxc/image/upload/v1747595252/livk3oxncma1p1bvxqbw.webp"
  },
  {
    title: "Connect Wallet",
    description: "Conect ton wallet.",
    type: "one-time",
    category: "engagement",
    pointsReward: 500,
    requirements: "Connect wallet",
    verificationMethod: "action",
    action: "connect",
    icon: "https://res.cloudinary.com/dtcbirvxc/image/upload/v1747595230/jrprhzwmc34gkeajuowy.png",
    verificationData: "manual",
    taskType: "ingame",
    isActive: true,
    isOnboarding: true,
  },
  {
    icon: "https://res.cloudinary.com/dtcbirvxc/image/upload/v1747595368/bs5erycda2v6dpxi94uw.svg",
    title: "Invite 10 friends",
    description: "Invite a total number of 10 friends",
    type: "one-time",
    category: "social",
    pointsReward: 5000,
    requirements: "Invite friends",
    verificationMethod: "action",
    action: "invite",
    verificationData: "manual",
    taskType: "ingame",
    isActive: true,
    isOnboarding: true,
  },
  {
    title: "Follow Youtube Channel",
    description: "Join our official Youtube Channel to stay updated.",
    type: "one-time",
    category: "social",
    pointsReward: 2000,
    requirements: "Click the link and join the group.",
    verificationMethod: "link-visit",
    verificationData: "https://youtube.com/@BabyRoymeme",
    taskType: "ingame",
    isActive: true,
    isOnboarding: true,
    icon: "https://res.cloudinary.com/dtcbirvxc/image/upload/v1747596738/uslzgesagojpmarq8hdj.webp"
  },
  {
    title: "Follow Twitter",
    description: "Join our official TwitterAccount to stay updated.",
    type: "one-time",
    category: "social",
    pointsReward: 2000,
    requirements: "Click the link and join the group.",
    verificationMethod: "link-visit",
    verificationData: "https://x.com/BabyRoymeme",
    taskType: "ingame",
    isActive: true,
    isOnboarding: true,
    icon: "https://res.cloudinary.com/dtcbirvxc/image/upload/v1747595237/jzmj6fpdsfzjklos3sfi.png"
  },
  {
    title: "Tweet about BabyRoy",
    description: "",
    type: "one-time",
    category: "social",
    pointsReward: 1000,
    requirements: "Click and tweet",
    verificationMethod: "link-visit",
    verificationData: "https://x.com/BabyRoymeme",
    taskType: "ingame",
    isActive: true,
    isOnboarding: true,
    icon: "https://res.cloudinary.com/dtcbirvxc/image/upload/v1747595237/jzmj6fpdsfzjklos3sfi.png"
  },
  {
    title: "Complete Onboarding",
    description: "Complete the onboarding steps after signing up.",
    type: "one-time",
    category: "learn",
    pointsReward: 1000,
    requirements: "Finish all onboarding steps.",
    verificationMethod: "action",
    action: "completeOnboarding",
    verificationData: "",
    taskType: "ingame",
    isActive: true,
    isOnboarding: false,
  },
];

const createUsers = async () => {
  try {

    const users = [];

    const baseTelegramId = 100000;

    for (let i = 0; i < 20; i++) {
      const user = {
        name: `User ${i + 1}`,
        first_name: `First${i + 1}`,
        last_name: `Last${i + 1}`,
        email: `user${i + 1}@demo.com`,
        password: 'Password123!',
        telegramId: baseTelegramId + i,
        walletAddress: `0xWalletAddress${i + 1}`,
        referralCode: `REFCODE${i + 1}`,
        referredBy: i < 10 ? '683d6c5b21a9fd31c735fd19' : '683f620536bf344f8bd0677f',
      };

      users.push(user);
    }

    const createdUsers = await User.insertMany(users);
    console.log(`${createdUsers.length} users created`);
    mongoose.disconnect();
  } catch (error) {
    console.error('Error creating users:', error);
    mongoose.disconnect();
  }
};

// Function to add demo tasks to the database
const addDemoTasks = async () => {
  try {
    await Task.insertMany(demoTasks);
    console.log('Demo tasks added successfully!');
    mongoose.connection.close(); // Close the connection after inserting
  } catch (err) {
    console.error('Error adding demo tasks:', err);
    mongoose.connection.close(); // Close the connection on error as well
  }
};

const deleteDemoTasks = async (req, res) => {
  try {
    const res = await Task.deleteMany()
    console.log("task deleted sucessfull")
  } catch (error) {
    console.log(error)
  }
}
// Run the function
addDemoTasks();


// createUsers();

// deleteDemoTasks()

