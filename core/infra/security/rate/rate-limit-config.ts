export interface RateLimitConfig {
  /** Max number of requests allowed in the window. */
  limit: number;
  /** Time window in milliseconds. */
  windowMs: number;
}

/**
 * Pure rate-limit policy constants.
 *
 * Keep this module side-effect free: callers that only need policy values must
 * not instantiate Redis clients or perform any network-related initialization.
 */
export const RATE_LIMIT_CONFIGS = {
  auth: { limit: 5, windowMs: 5 * 60 * 1000 },
  authProxy: { limit: 10, windowMs: 60 * 1000 },
  api: { limit: 60, windowMs: 60 * 1000 },
  default: { limit: 30, windowMs: 60 * 1000 },
} as const;
