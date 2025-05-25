const mongoose = require('mongoose');
const Task = require('./models/taskModel');

// Replace with your MongoDB connection string
const mongoURI = 'mongodb+srv://victor234ben:XrIp0BgNbw25jp2q@cluster0.2yl9jx8.mongodb.net/babyRoy';

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
    action: "inviteFriends?inviteNumber=10",
    verificationData: "manual",
    taskType: "ingame",
    isActive: true,
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
    icon: "https://res.cloudinary.com/dtcbirvxc/image/upload/v1747595237/jzmj6fpdsfzjklos3sfi.png"
  },
  {
    title: "Complete Onboarding",
    description: "Complete the onboarding steps after signing up.",
    type: "one-time",
    category: "learn",
    pointsReward: 1000,
    requirements: "Finish all onboarding steps.",
    verificationMethod: "auto",
    verificationData: "",
    taskType: "ingame",
    isActive: true,
  },
];
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

// deleteDemoTasks()

