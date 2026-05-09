/**
 * @file src/lib/redis.ts
 * @description Redis Caching utility for Next.js application.
 */

import Redis from 'ioredis';

let redis: Redis | null = null;

if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  redis.on('error', (err) => {
    console.error('Redis Connection Error:', err);
  });
}

/**
 * Standard TTL Policies (in seconds)
 */
export const CACHE_TTL = {
  USER_DATA: 300,      // 5 minutes
  GUILD_SETTINGS: 3600, // 1 hour
  STATIC_DATA: 86400,  // 24 hours
  GLOBAL_STATS: 600,   // 10 minutes
  API_RESPONSE: 60,    // 1 minute
};

/**
 * Cache Wrapper
 */
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    if (!redis) return null;
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Redis Get Error (${key}):`, error);
      return null;
    }
  },

  async set(key: string, value: any, ttlSeconds: number = CACHE_TTL.API_RESPONSE): Promise<boolean> {
    if (!redis) return false;
    try {
      await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
      return true;
    } catch (error) {
      console.error(`Redis Set Error (${key}):`, error);
      return false;
    }
  },

  async del(key: string): Promise<boolean> {
    if (!redis) return false;
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error(`Redis Del Error (${key}):`, error);
      return false;
    }
  },

  async flush(): Promise<void> {
    if (!redis) return;
    await redis.flushall();
  }
};

export { redis };

export default cache;
