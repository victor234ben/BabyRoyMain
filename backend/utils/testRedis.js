const testRedis = async () => {
    try {
        await redisClient.set('test', 'value');
        const result = await redisClient.get('test');
        console.log('Redis test result:', result);
        await redisClient.del('test');
    } catch (error) {
        console.error('Redis test failed:', error);
    }
};

module.exports = { testRedis }