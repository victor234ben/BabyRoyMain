
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const TelegramBot = require('node-telegram-bot-api');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const referralRoutes = require('./routes/referralRoutes');
const adminRoutes = require('./routes/adminRoutes');
const verifyRoutes = require('./routes/verityTaskRoutes')
const cookieParser = require('cookie-parser');
const path = require('path');
const { setWebhook } = require('./config/telegramWebhook');
const User = require('./models/userModel');
const Reward = require('./models/rewardModel');

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token);
const app = express();
app.set('trust proxy', 1);

// Security middleware
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for TonConnect UI
        "'unsafe-eval'", // ✅ ADD THIS - Required for some TonConnect operations
        'https://telegram.org',
        'https://cdn.gpteng.co',
        'https://raw.githubusercontent.com',
        'https://api.telegram.org',
        'https://unpkg.com',
        'https://tonconnect.io',
        'https://wallet.ton.org',
        'https://tonkeeper.com',
        'https://cdn.jsdelivr.net', // ✅ ADD THIS - Common CDN for TonConnect
        'https://cdnjs.cloudflare.com' // ✅ ADD THIS - Another common CDN
      ],
      connectSrc: [
        "'self'",
        'https://api.telegram.org',
        'https://raw.githubusercontent.com',
        'https://tonapi.io',
        'wss://bridge.tonapi.io',
        'https://connect.tonhubapi.com',
        'wss://bridge.tonhubapi.com',
        // TonConnect bridge endpoints
        'https://walletbot.me',
        'https://sse-bridge.hot-labs.org',
        'https://bridge.tonapi.io',
        'wss://bridge.hot-labs.org', // ✅ ADD THIS - WebSocket version
        // Wallet-specific endpoints
        'https://app.tobiwallet.app',
        'https://xtonwallet.com',
        'https://tonhub.com',
        'https://tonkeeper.com',
        'https://wallet.ton.org',
        // ✅ ADD THESE - Additional TonConnect bridges
        'https://tonhubapi.com',
        'wss://bridge.tonhubapi.com',
        'https://bridge.tonconnect.org',
        'wss://bridge.tonconnect.org',
        // ✅ ADD THESE - Wallet discovery endpoints
        'https://tonapi.io/v2',
        'https://toncenter.com/api/v2',
        'https://ton.org/api'
      ],
      frameSrc: [
        "'self'",
        'https://t.me',
        'https://tonkeeper.com',
        'https://wallet.ton.org',
        'https://tonhub.com',
        'https://app.tobiwallet.app',
        'https://xtonwallet.com',
        'https://telegram.org', // ✅ ADD THIS - For Telegram Web App
        'https://web.telegram.org' // ✅ ADD THIS - For Telegram Web version
      ],
      frameAncestors: ["'self'", "https://web.telegram.org", "https://webk.telegram.org", "https://webz.telegram.org"],
      imgSrc: [
        "'self'",
        'data:', // ✅ Important for base64 images
        'blob:', // ✅ ADD THIS - For dynamically generated images
        'https://res.cloudinary.com',
        'https://static.okx.com',
        'https://public.bnbstatic.com',
        'https://wallet.tg',
        'https://tonkeeper.com',
        'https://static.mytonwallet.io',
        'https://tonhub.com',
        'https://raw.githubusercontent.com',
        'https://fintopio.com',
        'https://s.pvcliping.com',
        'https://img.gatedataimg.com',
        'https://img.bitgetimg.com',
        'https://app.tobiwallet.app',
        'https://xtonwallet.com',
        'https://wallet.ton.org',
        'https://chain-cdn.uxuy.com',
        'https://hk.tpstatic.net',
        'https://pub.tomo.inc/',
        'https://cdn.mirailabs.co',
        // ✅ ADD THESE - Additional wallet icons
        'https://tonconnect.io',
        'https://cdn.jsdelivr.net',
        'https://avatars.githubusercontent.com'
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // ✅ ADD THIS - Required for TonConnect UI styles
        'https://fonts.googleapis.com',
        'https://cdn.jsdelivr.net',
        'https://cdnjs.cloudflare.com'
      ],
      fontSrc: [
        "'self'",
        'https://fonts.gstatic.com',
        'https://fonts.googleapis.com',
        'data:' // ✅ ADD THIS - For embedded fonts
      ],
      workerSrc: [
        "'self'",
        'blob:' // ✅ ADD THIS - For web workers
      ],
      childSrc: [
        "'self'",
        'blob:' // ✅ ADD THIS - For iframe content
      ],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
      // ✅ ADD THIS - Allows manifest files to be loaded
      manifestSrc: ["'self'"]
    },
  })
);


app.use(cookieParser())
app.use(cors({
  origin: [
    "http://localhost:8080",
    "https://babyroy-rjjm.onrender.com"
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api', limiter);


// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//setting webhook url
setWebhook()

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', verifyRoutes)

// Webhook endpoint
app.post('/webhook', (req, res) => {
  console.log('Webhook received:', JSON.stringify(req.body, null, 2));

  if (!req.body) {
    console.log('Empty request body');
    return res.sendStatus(400);
  }

  try {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  } catch (error) {
    console.error('Error processing update:', error);
    res.sendStatus(500);
  }
});

// Handle /start command with optional parameters
// Handle /start command with optional parameters and account creation
bot.onText(/\/start(.*)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id;
  const first_name = msg.from?.first_name || '';
  const last_name = msg.from?.last_name || '';
  const username = msg.from?.username || '';
  const startParam = match[1] ? match[1].trim() : '';

  // Extract referral code if present (format: /start 3343545)
  const referralCode = startParam || null;

  console.log("Start command received:", {
    chatId,
    startParam,
    referralCode,
    fullText: msg.text,
    userId,
    username,
    first_name,
    last_name
  });

  try {
    // Create/login user directly here using the telegramLoginAndSignup logic
    const userResult = await handleUserCreation({
      telegramId: userId,
      first_name,
      last_name,
      referralCode
    });

    console.log("User creation/login result:", userResult);

    // Send the image first
    await bot.sendPhoto(chatId, 'https://res.cloudinary.com/dtcbirvxc/image/upload/v1747334030/kvqmrisqgphhhlsx3u8u.png', {
      caption: referralCode ?
        `Welcome to BabyRoy! 🎉\nYou were invited by a friend! Get ready for bonus rewards!` :
        'Welcome to BabyRoy! 🎉'
    });

    // Build the mini app URL (no need for ref param since user is already created)
    const miniAppUrl = 'https://babyroy-rjjm.onrender.com/';

    // Send message with mini app button
    await bot.sendMessage(chatId, 'Tap below to launch the mini app:', {
      reply_markup: {
        keyboard: [
          [
            {
              text: referralCode ? '🎁 Open BabyRoy Mini App (Bonus!)' : 'Open BabyRoy Mini App 🚀',
              web_app: {
                url: miniAppUrl,
              },
            },
          ],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });

    // If there's a referral code and user is new, send additional message
    if (referralCode && userResult.isNewUser) {
      setTimeout(async () => {
        await bot.sendMessage(chatId, '🎁 Referral bonus has been credited to your account!', {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '🚀 Launch App & Check Balance',
                  web_app: {
                    url: miniAppUrl,
                  },
                },
              ],
            ],
          },
        });
      }, 1500);
    }

    // Log successful referral
    if (referralCode && userResult.referralApplied) {
      console.log(`✅ Referral bonus applied: User ${userId} with code ${referralCode}`);
    }

  } catch (error) {
    console.error("Error handling start command:", error);

    // Still send the basic welcome message even if user creation fails
    await bot.sendMessage(chatId, 'Welcome to BabyRoy! 🎉\nTap below to launch the mini app:', {
      reply_markup: {
        keyboard: [
          [
            {
              text: 'Open BabyRoy Mini App 🚀',
              web_app: {
                url: 'https://babyroy-rjjm.onrender.com/',
              },
            },
          ],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
  }
});

// Extract the user creation logic into a separate function
const handleUserCreation = async ({ telegramId, first_name, last_name, referralCode }) => {
  console.log("Creating/finding user with referral code:", referralCode);

  // Check if user already exists
  const existingUser = await User.findOne({ telegramId });
  let isNewUser = !existingUser;
  let referralApplied = false;

  let referredBy = null;
  let referrer = null;

  // Only process referral for NEW users
  if (!existingUser && referralCode) {
    referrer = await User.findOne({ referralCode });
    if (referrer) {
      referredBy = referrer._id;
      referralApplied = true;

      // Award referral points to the referrer
      referrer.points += 1000;
      referrer.totalEarned += 1000;
      await referrer.save();

      // Create reward record for the referrer
      await Reward.create({
        user: referrer._id,
        amount: 1000,
        type: 'referral',
        source: referral._id,
        sourceModel: 'User',
        description: `Referral bonus for inviting ${first_name}`,
      });

      console.log(`✅ Awarded 1000 points to referrer: ${referrer._id}`);
    } else {
      console.log("❌ Invalid referral code provided:", referralCode);
    }
  } else if (existingUser) {
    console.log("ℹ️ User already exists, no referral reward given");
  }

  // Atomically find or insert user
  const user = await User.findOneAndUpdate(
    { telegramId },
    {
      $setOnInsert: {
        first_name,
        last_name,
        telegramId,
        referralCode: generateReferralCode(),
        points: 0,
        referredBy
      }
    },
    {
      new: true,
      upsert: true,
    }
  );

  return {
    user: {
      _id: user._id,
      first_name: user.first_name,
      telegramId: user.telegramId,
      referralCode: user.referralCode,
      points: user.points,
    },
    isNewUser,
    referralApplied
  };
};

// **NEW: Function to handle user creation from /start command**
const handleUserCreationFromStart = async (telegramUser, referralCode) => {
  if (!telegramUser?.id) {
    console.log("No telegram user data available");
    return;
  }

  const telegramId = telegramUser.id;
  const first_name = telegramUser.first_name || '';
  const last_name = telegramUser.last_name || '';
  const username = telegramUser.username || '';

  console.log("Processing user creation from /start:", {
    telegramId,
    first_name,
    last_name,
    username,
    referralCode
  });

  // Check if user already exists
  const existingUser = await User.findOne({ telegramId });

  if (existingUser) {
    console.log(`User ${telegramId} already exists, skipping creation`);
    return existingUser;
  }

  // Handle referral logic for NEW users only
  let referredBy = null;
  let referrer = null;

  if (referralCode) {
    referrer = await User.findOne({ referralCode });
    if (referrer) {
      referredBy = referrer._id;

      // Award referral points to the referrer
      referrer.points += 1000;
      referrer.totalEarned += 1000;
      await referrer.save();

      // Create reward record for the referrer
      await Reward.create({
        user: referrer._id,
        amount: 1000,
        type: 'referral',
        source: referrer._id,
        sourceModel: 'User',
        description: `Referral bonus for inviting ${first_name}`,
      });

      console.log(`Awarded 1000 points to referrer: ${referrer._id}`);
    } else {
      console.log("Invalid referral code provided:", referralCode);
    }
  }

  // Create new user
  const user = await User.create({
    first_name,
    last_name,
    username,
    telegramId,
    referralCode: generateReferralCode(),
    points: 0,
    referredBy
  });

  console.log(`Created new user: ${user._id} for telegram ID: ${telegramId}`);
  return user;
};


// Keep your existing message handler for debugging
bot.on('message', (msg) => {
  console.log('Any message received:', {
    text: msg.text,
    chat_id: msg.chat.id,
    message_id: msg.message_id,
    date: msg.date
  });
});

app.get('/bot-info', async (req, res) => {
  try {
    const me = await bot.getMe();
    res.json(me);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to receive and log Telegram data
app.post('/debug/telegram-data', (req, res) => {
  console.log("called")
  console.log('\n🔍 === TELEGRAM DEBUG DATA RECEIVED ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('User Agent:', req.body.userAgent);

  console.log()

  // Send response back to frontend
  res.json({
    success: true,
    message: 'Telegram data received and logged',
    receivedKeys: req.body.initDataUnsafe ? Object.keys(req.body.initDataUnsafe) : [],
    hasUser: !!(req.body.initDataUnsafe?.user),
    hasStartParam: !!(req.body.initDataUnsafe?.start_param),
    timestamp: new Date().toISOString()
  });
});

// Health check route
app.get('/status', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

app.use(express.static(path.resolve(__dirname, '../frontend/dist')));

app.get('*', (req, res) => {
  console.log('✅ Frontend resolved for path:', req.originalUrl);
  res.sendFile(path.resolve(__dirname, '../frontend/dist', 'index.html'));
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

module.exports = app;
