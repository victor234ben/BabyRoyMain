
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
const generateReferralCode = require('./utils/referralCodeGenerator');
const { default: mongoose } = require('mongoose');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const redisClient = require('./config/redisClient');
// const { testRedis } = require('./utils/testRedis');

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token);
const app = express();
app.set('trust proxy', 1);

// Test Redis connection
// testRedis();
//setting webhook url
setWebhook()

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
    "https://babyroy-rjjm.onrender.com",
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
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

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', verifyRoutes)

// Webhook endpoint
app.post('/webhook', (req, res) => {
  // console.log('Webhook received:', JSON.stringify(req.body, null, 2));

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

// Optimized /start command with session token generation
bot.onText(/\/start(.*)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id;
  const first_name = msg.from?.first_name || '';
  const last_name = msg.from?.last_name || '';
  const username = msg.from?.username || '';
  const startParam = match[1] ? match[1].trim() : '';

  // Extract referral code if present (format: /start 3343545)
  const referralCode = startParam || null;

  // console.log("Start command received:", {
  //   chatId,
  //   startParam,
  //   referralCode,
  //   userId,
  //   username,
  //   first_name,
  //   last_name
  // });

  // Send immediate response to user while processing in background


  const sendWelcomeMessage = async (sessionToken) => {
    try {
      // Send the image first - ALWAYS send this
      await bot.sendPhoto(chatId, 'https://res.cloudinary.com/dtcbirvxc/image/upload/v1747334030/kvqmrisqgphhhlsx3u8u.png', {
        caption: referralCode ?
          `Welcome to BabyRoy! 🎉\nYou were invited by a friend! Get ready for bonus rewards!` :
          'Welcome to BabyRoy! 🎉\nReady to start your adventure?'
      });

      // Build the mini app URL with session token
      const miniAppUrl = `https://babyroy-rjjm.onrender.com/api/auth/verifysession?session=${sessionToken}`;

      // Send message with mini app button - ALWAYS send this
      await bot.sendMessage(chatId, 'Tap below to launch the mini app:', {
        reply_markup: {
          keyboard: [
            [
              {
                text: referralCode ? '🎁 Open BabyRoy Mini App (Bonus!)' : '🚀 Open BabyRoy Mini App',
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

      console.log(`✅ Welcome message sent to user ${userId} with session token`);
    } catch (error) {
      console.error("❌ Error sending welcome message:", error);

      // Fallback message if image fails
      try {
        const fallbackUrl = `https://babyroy-rjjm.onrender.com/api/auth/verifysession?session=${sessionToken}`;
        await bot.sendMessage(chatId, `Welcome to BabyRoy! 🎉${referralCode ? '\nYou were invited by a friend! Get ready for bonus rewards!' : ''}\n\nTap below to launch the mini app:`, {
          reply_markup: {
            keyboard: [
              [
                {
                  text: referralCode ? '🎁 Open BabyRoy Mini App (Bonus!)' : '🚀 Open BabyRoy Mini App',
                  web_app: {
                    url: fallbackUrl,
                  },
                },
              ],
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
          },
        });
        console.log(`✅ Fallback welcome message sent to user ${userId}`);
      } catch (fallbackError) {
        console.error("❌ Even fallback message failed:", fallbackError);
      }
    }
  };

  // Process user creation and generate session token
  const processUserCreation = async () => {
    try {
      const userResult = await handleUserCreation({
        telegramId: userId,
        first_name,
        last_name,
        username,
        referralCode
      });

      console.log("✅ User creation/login result:", userResult);

      // Generate session token for this user
      const sessionToken = generateSessionToken({
        userId: userResult.user._id,
        telegramId: userId,
        first_name,
        last_name,
        username
      });

      // Store session token temporarily (you can use Redis or in-memory store)
      await storeSessionToken(sessionToken, {
        userId: userResult.user._id,
        telegramId: userId,
        first_name,
        last_name,
        username,
        userExists: true
      });

      // Send referral bonus message if applicable
      if (referralCode && userResult.isNewUser && userResult.referralApplied) {
        setTimeout(async () => {
          try {
            const bonusUrl = `https://babyroy-rjjm.onrender.com/api/auth/verifysession?session=${sessionToken}`;
            await bot.sendMessage(chatId, '🎁 Referral bonus has been credited to your account!', {
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: '🚀 Launch App & Check Balance',
                      web_app: {
                        url: bonusUrl,
                      },
                    },
                  ],
                ],
              },
            });
            console.log(`✅ Referral bonus message sent for user ${userId}`);
          } catch (msgError) {
            console.error("Error sending referral bonus message:", msgError);
          }
        }, 2000);
      }

      return sessionToken;

    } catch (error) {
      console.error("❌ Error in user creation process:", error);
      throw error;
    }
  };

  // Execute both processes
  try {
    const sessionToken = await processUserCreation();
    await sendWelcomeMessage(sessionToken);
  } catch (error) {
    console.error("❌ Error in /start command processing:", error);

    // If user creation fails, still try to send a basic message
    try {
      await bot.sendMessage(chatId, `Welcome to BabyRoy! 🎉\n\nTap below to launch the mini app:`, {
        reply_markup: {
          keyboard: [
            [
              {
                text: '🚀 Open BabyRoy Mini App',
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
    } catch (finalError) {
      console.error("❌ Final fallback message also failed:", finalError);
    }
  }
});

// Generate session token function
const generateSessionToken = (userData) => {
  const payload = {
    userId: userData.userId,
    telegramId: userData.telegramId,
    first_name: userData.first_name,
    last_name: userData.last_name,
    username: userData.username,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (15 * 60), // 15 minutes expiry
  };

  return jwt.sign(payload, process.env.JWT_SECRET);
};


const storeSessionToken = async (token, userData) => {
  try {
    const expiresInSeconds = 15 * 60; // 15 minutes
    const sessionData = {
      ...userData,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString()
    };

    console.log(`📝 Storing session token: ${token}`);
    console.log(`📝 Session data:`, JSON.stringify(sessionData, null, 2));

    await redisClient.setEx(`session:${token}`, expiresInSeconds, JSON.stringify(sessionData));

    // Verify the token was stored
    const verification = await redisClient.get(`session:${token}`);
    if (verification) {
      console.log(`✅ Session token stored successfully in Redis`);
    } else {
      console.log(`❌ Failed to store session token in Redis`);
    }

  } catch (error) {
    console.error(`❌ Error storing session token:`, error);
    throw error;
  }
};
// Optimized user creation function with better error handling
const handleUserCreation = async ({ telegramId, first_name, last_name, username, referralCode }) => {
  // console.log("🔄 Creating/finding user with referral code:", referralCode);

  try {
    // Use a transaction for atomic operations
    const session = await mongoose.startSession();
    let result;

    await session.withTransaction(async () => {
      // Check if user already exists
      const existingUser = await User.findOne({ telegramId }).session(session);
      const isNewUser = !existingUser;

      if (existingUser) {
        // console.log("ℹ️ User already exists:", existingUser._id);

        // Update existing user info
        const updatedUser = await User.findOneAndUpdate(
          { telegramId },
          {
            $set: {
              first_name: first_name || existingUser.first_name,
              last_name: last_name || existingUser.last_name,
              username: username || existingUser.username,
              lastActive: new Date()
            }
          },
          { new: true, session }
        );

        result = {
          user: {
            _id: updatedUser._id,
            first_name: updatedUser.first_name,
            telegramId: updatedUser.telegramId,
            referralCode: updatedUser.referralCode,
            points: updatedUser.points,
          },
          isNewUser: false,
          referralApplied: false,
        };
        return;
      }

      // Handle new user creation
      let referredBy = null;
      let referrer = null;
      let referralApplied = false;

      // Lookup referrer if referralCode provided
      if (referralCode) {
        referrer = await User.findOne({ referralCode }).session(session);
        if (referrer) {
          referredBy = referrer._id;
          referralApplied = true;
          // console.log("✅ Valid referrer found:", referrer._id);
        } else {
          // console.log("❌ Invalid referral code provided:", referralCode);
        }
      }

      // Create new user
      const newUser = await User.create([{
        first_name,
        last_name,
        username,
        telegramId,
        referralCode: generateReferralCode(),
        points: referralApplied ? 1000 : 0,
        totalEarned: referralApplied ? 1000 : 0,
        referredBy,
        lastActive: new Date()
      }], { session });

      const user = newUser[0];
      console.log("✅ Created new user:", user._id);

      // Process referral rewards if applicable
      if (referrer && referralApplied) {
        // Award points to referrer
        await User.findByIdAndUpdate(
          referrer._id,
          {
            $inc: {
              points: 1000,
              totalEarned: 1000
            }
          },
          { session }
        );

        // Create reward records
        await Reward.create([
          {
            user: referrer._id,
            amount: 1000,
            type: 'referral',
            source: user._id,
            sourceModel: 'User',
            description: `Referral bonus for inviting ${first_name}`,
          },
          {
            user: user._id,
            amount: 1000,
            type: 'referral',
            source: referrer._id,
            sourceModel: 'User',
            description: `Referral bonus for joining via ${referrer.first_name}`,
          }
        ], { session });

        console.log(`✅ Referral rewards processed: ${user._id} <- ${referrer._id}`);
      }

      result = {
        user: {
          _id: user._id,
          first_name: user.first_name,
          telegramId: user.telegramId,
          referralCode: user.referralCode,
          points: user.points,
        },
        isNewUser: true,
        referralApplied,
      };
    });

    await session.endSession();
    return result;

  } catch (error) {
    console.error("❌ Error in handleUserCreation:", error);
    throw error;
  }
};

// Keep your existing message handler for debugging
// bot.on('message', (msg) => {
//   console.log('Any message received:', {
//     text: msg.text,
//     chat_id: msg.chat.id,
//     message_id: msg.message_id,
//     date: msg.date
//   });
// });

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
