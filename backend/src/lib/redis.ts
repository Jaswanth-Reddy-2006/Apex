import { createClient } from "redis";

let redisClient: any = null;
let isRedisAvailable = false;
const memoryCache = new Map<string, string>();

async function initRedis() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.warn("[Redis] REDIS_URL not configured. Falling back to in-memory store.");
    return;
  }

  try {
    const client = createClient({ url: redisUrl });

    client.on("error", (err) => {
      console.warn("[Redis] Connection error:", err.message);
      isRedisAvailable = false;
    });

    await client.connect();
    console.log("[Redis] Connected successfully.");
    redisClient = client;
    isRedisAvailable = true;
  } catch (err: any) {
    console.warn("[Redis] Failed to initialize client:", err.message || err);
    isRedisAvailable = false;
  }
}

// Non-blocking initialization
initRedis();

export const redis = {
  async get(key: string): Promise<string | null> {
    if (isRedisAvailable && redisClient) {
      try {
        return await redisClient.get(key);
      } catch (err) {
        console.warn(`[Redis] Get failed for ${key}:`, err);
      }
    }
    return memoryCache.get(key) || null;
  },

  async set(key: string, value: string, options?: { EX?: number }): Promise<void> {
    if (isRedisAvailable && redisClient) {
      try {
        await redisClient.set(key, value, options);
        return;
      } catch (err) {
        console.warn(`[Redis] Set failed for ${key}:`, err);
      }
    }
    memoryCache.set(key, value);
    if (options?.EX) {
      setTimeout(() => {
        memoryCache.delete(key);
      }, options.EX * 1000);
    }
  },

  async del(key: string): Promise<void> {
    if (isRedisAvailable && redisClient) {
      try {
        await redisClient.del(key);
        return;
      } catch (err) {
        console.warn(`[Redis] Del failed for ${key}:`, err);
      }
    }
    memoryCache.delete(key);
  },
};
export default redis;
