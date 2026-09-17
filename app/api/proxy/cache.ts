// ================================================================================
// FICHIER : src/app/api/proxy/cache.ts
// RÔLE : COUCHE D'ABSTRACTION POUR LE CACHE (AVEC CIRCUIT BREAKER)
// VERSION : EDGE-COMPATIBLE 2.1
// ================================================================================
// NOTE ARCHITECTURALE : L'adaptateur de cache par fichier JSON a été supprimé
// car il utilisait les API Node.js (`fs`, `path`), incompatibles avec l'Edge Runtime.
// Seules les stratégies compatibles Edge (Redis, in-memory, none) sont conservées.
// ================================================================================

import { redisClient, redisConfigurationState } from '@/core/infra/cache/redis-client';
import { proxyConfig } from './config';
import {
  RedisResilienceGate,
  resolveRedisBudgetMs,
  withRedisLatencyBudget,
} from './redis-resilience';

// --- Définition de l'Interface (le Contrat) ---
export interface CachedResponse {
  body: string;
  status: number;
  headers: Record<string, string>;
  timestamp: number;
  // [FIX #3] Instant d'expiration ABSOLU (ms epoch), calculé au `set` depuis le
  // ttlSeconds effectif. C'est la SOURCE DE VÉRITÉ de l'expiration : le `get` ne
  // re-dérive plus le TTL depuis les regex (comportement incohérent supprimé).
  expiresAt: number;
}

export interface ICacheAdapter {
  get: (key: string) => Promise<CachedResponse | null>;
  set: (key: string, response: Response, ttlSeconds: number) => Promise<void>;
}

const REDIS_OPERATION_BUDGET_MS = resolveRedisBudgetMs(
  process.env.PROXY_REDIS_CACHE_BUDGET_MS,
  500,
);
const MAX_IN_MEMORY_CACHE_ENTRIES = 2_000;
const redisGate = new RedisResilienceGate({
  latencyBreachThreshold: 3,
  latencyCooldownMs: 15_000,
  failureCooldownMs: 60_000,
});

/**
 * [FIX #3 — DRY] Construit une entrée de cache canonique à partir d'une réponse.
 * Unique fabrique partagée par TOUS les adaptateurs : garantit que `timestamp` et
 * `expiresAt` sont TOUJOURS renseignés de façon cohérente (fin des contrats qui
 * mentent, ex: redisAdapter qui omettait `timestamp`).
 */
async function buildCacheEntry(response: Response, ttlSeconds: number): Promise<CachedResponse> {
  const body = await response.clone().text();
  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });
  const now = Date.now();
  return {
    body,
    status: response.status,
    headers,
    timestamp: now,
    expiresAt: now + ttlSeconds * 1000,
  };
}

// --- Implémentation 1 : Adaptateur Nul (Cache Désactivé) ---
const noOpCacheAdapter: ICacheAdapter = {
  async get(_key: string): Promise<CachedResponse | null> {
    return null;
  },
  async set(_key: string, _response: Response, _ttlSeconds: number): Promise<void> {
    return;
  }
};

// --- Implémentation 2 : Adaptateur EN MÉMOIRE / L1 ---
const inMemoryCache = new Map<string, CachedResponse>();

const setMemoryEntry = (key: string, entry: CachedResponse): void => {
  if (!inMemoryCache.has(key) && inMemoryCache.size >= MAX_IN_MEMORY_CACHE_ENTRIES) {
    const oldestKey = inMemoryCache.keys().next().value;
    if (oldestKey) inMemoryCache.delete(oldestKey);
  }
  inMemoryCache.set(key, entry);
};

const inMemoryAdapter: ICacheAdapter = {
  async get(key: string): Promise<CachedResponse | null> {
    const entry = inMemoryCache.get(key);
    if (!entry) return null;

    // [FIX #3] Expiration lue depuis `expiresAt` (posé au set), plus AUCUNE
    // re-dérivation du TTL via les regex. Cohérent, déterministe, sans staleness.
    if (Date.now() >= entry.expiresAt) {
      inMemoryCache.delete(key);
      return null;
    }

    return entry;
  },
  async set(key: string, response: Response, ttlSeconds: number): Promise<void> {
    if (ttlSeconds <= 0) return;
    setMemoryEntry(key, await buildCacheEntry(response, ttlSeconds));
  }
};

// ============================================================================
// 🛡️ REDIS RESILIENCE GATE
// Latency degradation and genuine connectivity failures are different states.
// ============================================================================
if (redisConfigurationState === 'placeholder') {
  console.warn('[CACHE_INIT] Placeholders détectés dans .env pour Redis. Cache distant désactivé.');
}

function canUseRedis() {
  return Boolean(redisClient) && redisGate.canAttempt();
}

function recordRedisFailure(error: unknown) {
  const classification = redisGate.recordFailure(error);
  if (classification.kind === 'latency') {
    if (classification.opened) {
      console.warn(
        `[REDIS_DEGRADED] Cache : budget de latence dépassé à répétition. ` +
        `L1 mémoire prioritaire pendant ${classification.bypassMs}ms.`,
      );
    }
    return;
  }

  const message = error instanceof Error ? error.message : String(error);
  console.error(
    `[CIRCUIT BREAKER] Cache : panne Redis confirmée (${message}). ` +
    `Bypass distant pendant ${classification.bypassMs}ms.`,
  );
}

// --- Implémentation 3 : Adaptateur Redis (Pour la Production sur l'Edge) ---
const redisAdapter: ICacheAdapter = {
  async get(key: string): Promise<CachedResponse | null> {
    // Redis mode is two-level: L1 memory must be checked before any remote RTT.
    const localEntry = await inMemoryAdapter.get(key);
    if (localEntry) return localEntry;
    if (!canUseRedis()) return null;

    try {
      const remoteEntry = await withRedisLatencyBudget(
        redisClient!.get<CachedResponse>(key),
        { component: 'cache', operation: 'GET', budgetMs: REDIS_OPERATION_BUDGET_MS },
      );
      redisGate.recordSuccess();
      if (!remoteEntry || Date.now() >= remoteEntry.expiresAt) return null;
      setMemoryEntry(key, remoteEntry);
      return remoteEntry;
    } catch (error) {
      recordRedisFailure(error);
      return null;
    }
  },
  async set(key: string, response: Response, ttlSeconds: number): Promise<void> {
    if (ttlSeconds <= 0) return;

    // L1 is committed before remote persistence. A slow Upstash round-trip may
    // never become a multi-second blocker on the trading data path.
    const dataToCache = await buildCacheEntry(response, ttlSeconds);
    setMemoryEntry(key, dataToCache);
    if (!canUseRedis()) return;

    try {
      await withRedisLatencyBudget(
        redisClient!.set(key, dataToCache, { ex: ttlSeconds }),
        { component: 'cache', operation: 'SET', budgetMs: REDIS_OPERATION_BUDGET_MS },
      );
      redisGate.recordSuccess();
    } catch (error) {
      recordRedisFailure(error);
    }
  }
};

// --- Sélection Intelligente de l'Adaptateur ---
let cacheAdapter: ICacheAdapter;

if (proxyConfig.cache.strategy === 'none') {
  cacheAdapter = noOpCacheAdapter;
} else if (proxyConfig.cache.strategy === 'memory') {
  cacheAdapter = inMemoryAdapter;
} else if (proxyConfig.cache.strategy === 'redis' && redisClient) {
  cacheAdapter = redisAdapter;
} else if (proxyConfig.cache.strategy === 'redis') {
  // Local development deliberately disables the remote transport by default;
  // keep the L1 cache semantics instead of falling all the way back to no cache.
  cacheAdapter = inMemoryAdapter;
} else {
  console.warn(`[CACHE_INIT] Stratégie de cache '${proxyConfig.cache.strategy}' inconnue. Fallback sur 'none'.`);
  cacheAdapter = noOpCacheAdapter;
}

export const getCachedResponse = (key: string) => cacheAdapter.get(key);
export const setCachedResponse = (key: string, response: Response, ttlSeconds: number) => cacheAdapter.set(key, response, ttlSeconds);
// --- EOF ---