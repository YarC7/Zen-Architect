import { Redis } from "@upstash/redis";

// Only initialize if the environment variables are present,
// making it safe for client-side environments (though Redis should only be used on the server)
export const redisUrl = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL)?.trim();
export const redisToken = (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN)?.trim();

export const redis =
  redisUrl && redisToken
    ? new Redis({
        url: redisUrl,
        token: redisToken,
      })
    : null;

/**
 * Generic caching wrapper for Upstash Redis.
 * Tries to fetch data from Redis first. If not found, calls the fetcher
 * function and stores the result in Redis for future calls.
 * 
 * Works gracefully even if Redis is not configured (simply bypasses).
 * 
 * @param key Unique key for the cache entry
 * @param fetcher Async function to fetch the data if not cached
 * @param ttlSeconds Time-to-live in seconds (default 5 minutes)
 */
export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  // If Redis isn't configured, bypass cache and directly invoke fetcher
  if (!redis) {
    return fetcher();
  }

  try {
    const cachedData = await redis.get<T>(key);
    if (cachedData !== null && cachedData !== undefined) {
      return cachedData;
    }
  } catch (err) {
    console.error(`[Redis] Failed to GET key "${key}":`, err);
  }

  // Fetch fresh data if not in cache or if error occurred
  const data = await fetcher();

  // If we got valid data, stash it in Redis
  if (data !== null && data !== undefined) {
    try {
      await redis.setex(key, ttlSeconds, data);
    } catch (err) {
      console.error(`[Redis] Failed to SET key "${key}":`, err);
    }
  }

  return data;
}

/**
 * Clears a specific key or keys from the cache.
 */
export async function invalidateCache(keys: string | string[]) {
  if (!redis) return;
  
  const keyArray = Array.isArray(keys) ? keys : [keys];
  if (keyArray.length === 0) return;

  try {
    await redis.del(...keyArray);
  } catch (err) {
    console.error(`[Redis] Failed to DELETE keys:`, err);
  }
}
