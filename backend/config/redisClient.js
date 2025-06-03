const { createClient } = require('redis');

const redisClient = createClient({
    url: 'redis://default:jrYzRF1Zkyn7rtpqHM59vtOqYym43LE3@redis-16941.c15.us-east-1-2.ec2.redns.redis-cloud.com:16941' // or Redis Cloud URL
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

(async () => {
    await redisClient.connect();
})();

module.exports = redisClient;