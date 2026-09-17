import { Redis } from '@upstash/redis';

export type RedisConfigurationState = 'configured' | 'disabled' | 'missing' | 'placeholder';

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
// Remote Redis is a production concern by default. Local `next dev` stays on
// process-local L1/fallbacks unless a developer explicitly opts into exercising
// the remote transport with REDIS_REMOTE_ENABLED=true.
export const redisRemoteEnabled = process.env.NODE_ENV !== 'development'
  || process.env.REDIS_REMOTE_ENABLED === 'true';
const hasPlaceholderCredentials = Boolean(
  redisUrl?.includes('votre-instance') || redisToken?.includes('votre_token'),
);

export const redisConfigurationState: RedisConfigurationState = !redisRemoteEnabled
  ? 'disabled'
  : hasPlaceholderCredentials
    ? 'placeholder'
    : redisUrl && redisToken
      ? 'configured'
      : 'missing';

/**
 * Shared Upstash transport only. This module deliberately has no logging,
 * retry, circuit-breaker or rate-limit policy: callers own those concerns.
 */
export const redisClient: Redis | null = redisConfigurationState === 'configured'
  ? new Redis({ url: redisUrl!, token: redisToken! })
  : null;
