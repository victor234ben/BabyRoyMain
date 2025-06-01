
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
// Handle /start command with optional parameters
bot.onText(/\/start(.*)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const startParam = match[1] ? match[1].trim() : '';

  // Extract referral code if present (format: /start 3343545)
  const referralCode = startParam || '';

  console.log("Start command received:", {
    chatId,
    startParam,
    referralCode,
    fullText: msg.text,
    userId: msg.from?.id,
    username: msg.from?.username
  });

  // Send the image first
  await bot.sendPhoto(chatId, 'https://res.cloudinary.com/dtcbirvxc/image/upload/v1747334030/kvqmrisqgphhhlsx3u8u.png', {
    caption: referralCode ?
      `Welcome to BabyRoy! 🎉\nYou were invited by a friend! Get ready for bonus rewards!` :
      'Welcome to BabyRoy! 🎉'
  });

  // Build the mini app URL with referral code as URL parameter as additional safety
  let miniAppUrl = 'https://babyroy-rjjm.onrender.com/';

  // Add referral code to URL as backup method
  if (referralCode) {
    miniAppUrl += `?ref=${encodeURIComponent(referralCode)}`;
    console.log(`Mini app URL with referral: ${miniAppUrl}`);
  }

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

  // If there's a referral code, send additional message for better UX
  if (referralCode) {
    setTimeout(async () => {
      await bot.sendMessage(chatId, '🎁 Special referral bonus awaiting you!', {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🚀 Claim Bonus & Launch App',
                web_app: {
                  url: miniAppUrl,
                },
              },
            ],
          ],
        },
      });
    }, 1500); // Slightly longer delay for better UX
  }

  // Store referral attempt in database/log for debugging
  if (referralCode) {
    console.log(`Referral attempt logged: User ${chatId} with code ${referralCode}`);
    // You could store this in your database for tracking/debugging
  }
});

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

// Add this route to handle URLs with referral parameters
app.get('/', (req, res) => {
  // Extract referral code from query parameters
  const referralCode = req.query.ref || req.query.start;

  if (referralCode) {
    console.log('Frontend loaded with referral code:', referralCode);
  }

  res.sendFile(path.resolve(__dirname, '../frontend/dist', 'index.html'));
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
