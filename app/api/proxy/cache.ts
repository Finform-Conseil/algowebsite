// ================================================================================
// FICHIER : src/app/api/proxy/cache.ts
// RÔLE : COUCHE D'ABSTRACTION POUR LE CACHE (AVEC CIRCUIT BREAKER)
// VERSION : EDGE-COMPATIBLE 2.1
// ================================================================================
// NOTE ARCHITECTURALE : L'adaptateur de cache par fichier JSON a été supprimé
// car il utilisait les API Node.js (`fs`, `path`), incompatibles avec l'Edge Runtime.
// Seules les stratégies compatibles Edge (Redis, in-memory, none) sont conservées.
// ================================================================================

import { Redis } from '@upstash/redis';
import { proxyConfig } from './config';

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

// --- Implémentation 2 : Adaptateur EN MÉMOIRE (Pour le Développement / Non-persistant) ---
const inMemoryCache = new Map<string, CachedResponse>();

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
    inMemoryCache.set(key, await buildCacheEntry(response, ttlSeconds));
  }
};

// ============================================================================
// 🛡️ CIRCUIT BREAKER REDIS (ANTI-LATENCE / ANTI-SKELETON INFINI)
// ============================================================================
let redisIsDown = false;
let redisDownSince = 0;
const REDIS_COOLDOWN = 60000; // 1 minute de pénalité avant de réessayer

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

// [TENOR 2026 FIX] Detect placeholders to avoid ConnectTimeoutError (10s latency)
const isPlaceholder = redisUrl?.includes('votre-instance') || redisToken?.includes('votre_token');

const redisClient = (redisUrl && redisToken && !isPlaceholder)
  ? Redis.fromEnv()
  : null;

if (isPlaceholder) {
  console.warn('[CACHE_INIT] Placeholders détectés dans .env pour Redis. Cache désactivé.');
}

function checkRedisStatus() {
  if (redisIsDown && Date.now() - redisDownSince > REDIS_COOLDOWN) {
    redisIsDown = false;
    console.log("[CIRCUIT BREAKER] Cache : Tentative de reconnexion à Redis...");
  }
  return !redisIsDown && redisClient;
}

function markRedisDown(error: any) {
  if (!redisIsDown) {
    console.error("[CIRCUIT BREAKER] Cache : Connexion Redis échouée. Bypass activé pour 60s.", error);
    redisIsDown = true;
    redisDownSince = Date.now();
  }
}

// --- Implémentation 3 : Adaptateur Redis (Pour la Production sur l'Edge) ---
const redisAdapter: ICacheAdapter = {
  async get(key: string): Promise<CachedResponse | null> {
    if (!checkRedisStatus()) return null; // Fail-Open: On simule un cache miss instantané

    try {
      return await redisClient!.get<CachedResponse>(key);
    } catch (error) {
      markRedisDown(error);
      return null;
    }
  },
  async set(key: string, response: Response, ttlSeconds: number): Promise<void> {
    if (ttlSeconds <= 0 || !checkRedisStatus()) return;

    try {
      // [FIX #3 — DRY + contrat honnête] Même fabrique que l'adaptateur mémoire :
      // l'entrée porte TOUJOURS `timestamp` ET `expiresAt` (l'ancienne version
      // omettait `timestamp`, rendant l'interface CachedResponse mensongère).
      // Redis gère aussi l'éviction native via `ex:` (double filet de sécurité).
      const dataToCache = await buildCacheEntry(response, ttlSeconds);
      await redisClient!.set(key, dataToCache, { ex: ttlSeconds });
    } catch (error) {
      markRedisDown(error);
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
} else {
  // Fallback sécurisé si Redis est configuré mais que les variables d'env sont manquantes
  console.warn(`[CACHE_INIT] Stratégie de cache '${proxyConfig.cache.strategy}' non disponible. Fallback sur 'none'.`);
  cacheAdapter = noOpCacheAdapter;
}

export const getCachedResponse = (key: string) => cacheAdapter.get(key);
export const setCachedResponse = (key: string, response: Response, ttlSeconds: number) => cacheAdapter.set(key, response, ttlSeconds);
// --- EOF ---