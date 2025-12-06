const { createClient } = require('redis');

let redisClient = null;

const connectRedis = async () => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis Connected');
    });

    redisClient.on('disconnect', () => {
      console.log('⚠️ Redis Disconnected');
    });

    await redisClient.connect();

    return redisClient;
  } catch (error) {
    console.error('❌ Redis Connection Error:', error.message);
    return null;
  }
};

const getRedisClient = () => {
  return redisClient;
};

const setCache = async (key, value, expireSeconds = 120) => {
  try {
    if (redisClient && redisClient.isOpen) {
      await redisClient.setEx(key, expireSeconds, JSON.stringify(value));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Redis setCache error:', error);
    return false;
  }
};

const getCache = async (key) => {
  try {
    if (redisClient && redisClient.isOpen) {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    }
    return null;
  } catch (error) {
    console.error('Redis getCache error:', error);
    return null;
  }
};

const deleteCache = async (key) => {
  try {
    if (redisClient && redisClient.isOpen) {
      await redisClient.del(key);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Redis deleteCache error:', error);
    return false;
  }
};

const clearCache = async (pattern = '*') => {
  try {
    if (redisClient && redisClient.isOpen) {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error('Redis clearCache error:', error);
    return false;
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  setCache,
  getCache,
  deleteCache,
  clearCache
};
