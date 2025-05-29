// Set webhook with better error handling
export const setWebhook = async () => {
  try {
    const webhookUrl = 'https://babyroy-rjjm.onrender.com/webhook';
    const result = await bot.setWebHook(webhookUrl);
    console.log('Webhook set successfully:', result);
  } catch (error) {
    console.error('Failed to set webhook:', error);
  }
};
