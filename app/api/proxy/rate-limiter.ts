// ================================================================================
// FICHIER : src/app/api/proxy/rate-limiter.ts
// RÔLE : RATE LIMITER HYBRIDE (REDIS + IN-MEMORY FALLBACK)
// NIVEAU : HDR (Habilitation à Diriger des Recherches) - Production Grade
// ================================================================================
import { proxyConfig } from './config';
import { Redis } from '@upstash/redis';

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN ? Redis.fromEnv() : null;

if (!redis && proxyConfig.rateLimitingEnabled) {
  console.warn("[SECURITY] PROXY_RATE_LIMITING_ENABLED est 'true' mais Redis n'est pas configuré. Le Fallback In-Memory sera utilisé exclusivement.");
}

// ============================================================================
// 🛡️ IN-MEMORY FALLBACK (ALGORITHME FIXED WINDOW)
// Protection vitale contre les attaques DDoS si Redis tombe (Évite le Fail-Open)
// Compatible Edge Runtime (Pas de setInterval persistant, Lazy Cleanup)
// ============================================================================
class InMemoryRateLimiter {
  private limits = new Map<string, { count: number; resetTime: number }>();
  private lastCleanup = Date.now();
  // Protection OOM stricte pour Vercel Edge / Cloudflare Workers (128MB limit)
  private readonly MAX_MAP_SIZE = 50000;

  public check(identifier: string, limit: number, windowSec: number) {
    const now = Date.now();

    // Nettoyage paresseux (Lazy Cleanup) toutes les 60 secondes
    // Évite les fuites mémoire sans nécessiter de setInterval bloquant
    if (now - this.lastCleanup > 60000) {
      this.cleanUp(now);
      this.lastCleanup = now;
    }

    // Protection OOM extrême : Si l'attaquant utilise une rotation d'IPs massive (Botnet)
    if (this.limits.size > this.MAX_MAP_SIZE) {
      console.warn(`[RATE_LIMITER_OOM_SHIELD] Map size exceeded ${this.MAX_MAP_SIZE}. Forcing emergency flush to prevent isolate crash.`);
      this.limits.clear();
    }

    const record = this.limits.get(identifier);

    if (!record || now > record.resetTime) {
      this.limits.set(identifier, { count: 1, resetTime: now + windowSec * 1000 });
      return { isRateLimited: false, remaining: limit - 1 };
    }

    if (record.count >= limit) {
      return { isRateLimited: true, remaining: 0 };
    }

    record.count += 1;
    return { isRateLimited: false, remaining: limit - record.count };
  }

  private cleanUp(now: number) {
    for (const [key, record] of this.limits.entries()) {
      if (now > record.resetTime) {
        this.limits.delete(key);
      }
    }
  }
}

const localLimiter = new InMemoryRateLimiter();

// ============================================================================
// 🛡️ CIRCUIT BREAKER REDIS
// ============================================================================
let redisIsDown = false;
let redisDownSince = 0;
const REDIS_COOLDOWN = 60000; // 1 minute de pénalité avant de retenter Redis

function checkRedisStatus() {
  if (redisIsDown && Date.now() - redisDownSince > REDIS_COOLDOWN) {
    redisIsDown = false;
    console.log("[CIRCUIT BREAKER] Rate Limiter : Tentative de reconnexion à Redis...");
  }
  return !redisIsDown && redis;
}

function markRedisDown(error: unknown) {
  if (!redisIsDown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[CIRCUIT BREAKER] Rate Limiter : Connexion Redis échouée (${msg}). Bascule sur le Fallback In-Memory pour 60s.`);
    redisIsDown = true;
    redisDownSince = Date.now();
  }
}

export async function checkRateLimit(identifier: string) {
  // Si le rate limiting est désactivé, on laisse passer
  if (!proxyConfig.rateLimitingEnabled) {
    return { isRateLimited: false, headers: {} };
  }

  const limit = proxyConfig.rateLimit.maxRequests;
  const windowSec = proxyConfig.rateLimit.window;

  // 1. TENTATIVE REDIS (Distributed Rate Limiting)
  if (checkRedisStatus()) {
    try {
      const key = `proxy_rate_limit:${identifier}`;
      const result = await redis!.multi()
        .incr(key)
        .expire(key, windowSec, 'NX')
        .exec();

      const count = result[0] as number;
      const isRateLimited = count > limit;
      const remaining = isRateLimited ? 0 : limit - count;

      return {
        isRateLimited,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Strategy': 'redis'
        }
      };
    } catch (error) {
      // Déclenchement du Circuit Breaker
      markRedisDown(error);
      // ⚠️ CRITICAL FIX (SCAR-110): Ne pas retourner ici (Fail-Open). 
      // On "fall through" vers le fallback in-memory ci-dessous.
    }
  }

  // 2. FALLBACK IN-MEMORY (Local Rate Limiting)
  // Si Redis est down ou non configuré, on utilise la mémoire locale de l'isolate Edge/Node.
  // Cela empêche le "Fail-Open" catastrophique qui laisserait passer un DDoS vers le backend Django.
  const localResult = localLimiter.check(identifier, limit, windowSec);

  return {
    isRateLimited: localResult.isRateLimited,
    headers: {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': localResult.remaining.toString(),
      'X-RateLimit-Strategy': 'local-fallback'
    }
  };
}
// --- EOF ---