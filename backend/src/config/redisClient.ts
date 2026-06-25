import { createRedisConnection } from './redis.js';

// Export a singleton Redis client for the whole app
export const redisClient = createRedisConnection();
