const TelegramBot = require("node-telegram-bot-api")

// Set webhook with better error handling
const setWebhook = async () => {
    const token = process.env.TELEGRAM_TOKEN;
    const bot = new TelegramBot(token);

    try {
        const webhookUrl = 'https://babyroy-rjjm.onrender.com/webhook';
        const result = await bot.setWebHook(webhookUrl);
        console.log('Webhook set successfully:', result);
    } catch (error) {
        console.error('Failed to set webhook:', error);
    }
};


module.exports = {setWebhook}