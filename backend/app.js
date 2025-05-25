
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

const token = process.env.TELEGRAM_TOKEN;
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
  origin: ["http://localhost:8080",
    "https://babyroy.onrender.com/",
    'https://t.me',
    'https://web.telegram.org',
    'https://telegram.org',
    'https://tonkeeper.com',
    'https://*.ton.org',
    'https://connect.tonhubapi.com',
    'https://bridge.tonapi.io',
    'https://cdn.jsdelivr.net',
    'https://unpkg.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api', limiter);

const bot = new TelegramBot(token);
bot.setWebHook('https://babyroy.onrender.com/');
// 📩 Listen for '/start' command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  // 👇 Send message with Web App button
  bot.sendMessage(chatId, 'Welcome! Tap below to launch the mini app:', {
    reply_markup: {
      keyboard: [
        [
          {
            text: 'Open BabyRoy Mini App',
            web_app: {
              url: 'https://babyroy.onrender.com/',
            },
          },
        ],
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  });
});

bot.on("polling_error", console.error);


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

app.post('/telegram-webhook', (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.post('/api/telegram-connected', (req, res) => {
  const { user, connectedAt } = req.body;
  console.log('📲 Telegram Mini App connected!');
  console.log('User info:', user);
  console.log('Time:', connectedAt);

  res.json({ status: 'received' });
})


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
