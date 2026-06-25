import { Redis, type RedisOptions } from 'ioredis';
import { env } from './env.js';

export const ORDER_PROCESSING_QUEUE = 'order-processing';

export function createRedisConnection(): Redis {
  if (!env.redisUrl) {
    throw new Error('REDIS_URL is missing from environment variables');
  }

  const options: RedisOptions = {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  };

  if (env.redisUrl.startsWith('rediss://')) {
    options.tls = {};
  }

  return new Redis(env.redisUrl, options);
}
