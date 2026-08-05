// CHEMIN : src/core/infrastructure/security/rate/redis-rate-limiter.ts
// VERSION : 2.0.0 - Enhanced with flexible configuration and in-memory fallback
import { Redis } from '@upstash/redis';

// ============================================================================
// 🔧 CONFIGURATION TYPES
// ============================================================================
export interface RateLimitConfig {
  /** Max number of requests allowed in the window */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
}

// Default configurations for different use cases
export const RATE_LIMIT_CONFIGS = {
  auth: { limit: 5, windowMs: 5 * 60 * 1000 },     // 5 req / 5 min (auth endpoints)
  authProxy: { limit: 10, windowMs: 60 * 1000 },  // 10 req / 1 min (proxy auth)
  api: { limit: 60, windowMs: 60 * 1000 },        // 60 req / 1 min (API endpoints)
  default: { limit: 30, windowMs: 60 * 1000 },    // 30 req / 1 min (default)
} as const;

// ============================================================================
// 🔌 REDIS CLIENT (Shared instance)
// ============================================================================
export const redisClient: Redis | null = (() => {
  try {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (redisUrl && redisToken) {
      // [TENOR 2026 FIX] Detect placeholders to avoid ConnectTimeoutError (10s latency)
      const isPlaceholder = redisUrl.includes('votre-instance') || redisToken.includes('votre_token');
      
      if (!isPlaceholder) {
        console.warn('✅ [RATE_LIMITER] Redis initialized');
        return new Redis({ url: redisUrl, token: redisToken });
      } else {
        console.warn('⚠️ [RATE_LIMITER] Placeholders détectés dans .env. Fallback in-memory activé.');
      }
    }
  } catch (error) {
    console.error('❌ [RATE_LIMITER] Redis init failed:', error);
  }
  
  if (process.env.NODE_ENV === 'production') {
    console.error("CRITICAL_ERROR: Redis non configuré en production. Rate Limiting INOPÉRANT.");
  } else {
    console.warn('⚠️ [RATE_LIMITER] Redis non configuré, fallback in-memory activé');
  }
  return null;
})();

// ============================================================================
// 💾 IN-MEMORY FALLBACK STORE
// ============================================================================
const inMemoryStore = new Map<string, { count: number; timestamp: number }>();

// ============================================================================
// 🚦 FLEXIBLE RATE LIMITER
// ============================================================================

/**
 * Check rate limit with flexible configuration.
 * Uses Redis if available, falls back to in-memory store.
 * 
 * @param identifier - Unique identifier (e.g., IP, user ID, hash)
 * @param config - Rate limit configuration (limit and window)
 * @param keyPrefix - Optional prefix for the Redis key
 * @returns Object with success status and message
 */
export const checkRateLimit = async (
  identifier: string,
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.default,
  keyPrefix: string = 'rl'
): Promise<{ success: boolean; message: string }> => {
  const key = `${keyPrefix}:${identifier}`;
  const windowS = Math.ceil(config.windowMs / 1000);

  // Try Redis first
  if (redisClient) {
    try {
      const now = Date.now();
      // Use sliding window with sorted set
      await redisClient.zremrangebyscore(key, 0, now - config.windowMs);
      const count = await redisClient.zcard(key);
      
      if (count >= config.limit) {
        return { success: false, message: "Rate limit exceeded. Please try again later." };
      }
      
      await redisClient.zadd(key, { score: now, member: `${now}:${Math.random()}` });
      await redisClient.expire(key, windowS + 10);
      
      return { success: true, message: "Request allowed." };
    } catch (error) {
      console.warn('[RATE_LIMITER] Redis error, using fallback:', error);
      // Fall through to in-memory
    }
  }

  // In-memory fallback
  const now = Date.now();
  const data = inMemoryStore.get(key) || { count: 0, timestamp: now };
  
  // Reset if window expired
  if (now - data.timestamp > config.windowMs) {
    data.count = 0;
    data.timestamp = now;
  }
  
  data.count++;
  inMemoryStore.set(key, data);
  
  if (data.count > config.limit) {
    // In production without Redis, block by default for security
    if (process.env.NODE_ENV === 'production' && !redisClient) {
      return { success: false, message: "Rate limit exceeded (fallback mode)." };
    }
    return { success: false, message: "Rate limit exceeded." };
  }
  
  return { success: true, message: "Request allowed." };
};

// ============================================================================
// 🔐 AUTH-SPECIFIC RATE LIMITER (Backward compatible)
// ============================================================================

/**
 * Original auth rate limiter for backward compatibility.
 * Uses the fixed 5 req / 5 min configuration.
 */
export const checkRedisRateLimit = async (
  identifier: string
): Promise<{ success: boolean; message: string }> => {
  return checkRateLimit(identifier, RATE_LIMIT_CONFIGS.auth, 'rate_limit_auth');
};