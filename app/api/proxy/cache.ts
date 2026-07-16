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
}

export interface ICacheAdapter {
  get: (key: string) => Promise<CachedResponse | null>;
  set: (key: string, response: Response, ttlSeconds: number) => Promise<void>;
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

    const path = key.replace('proxy-cache:', '');
    let ttl = proxyConfig.cache.defaultTtlSeconds;

    for (const [regex, duration] of proxyConfig.cache.routeTtls.entries()) {
      if (regex.test(path)) {
        ttl = duration;
        break;
      }
    }

    if (ttl <= 0) return null;

    const isExpired = (Date.now() - entry.timestamp) / 1000 > ttl;
    if (isExpired) {
      inMemoryCache.delete(key);
      return null;
    }

    return entry;
  },
  async set(key: string, response: Response, ttlSeconds: number): Promise<void> {
    if (ttlSeconds <= 0) return;

    const responseClone = response.clone();
    const body = await responseClone.text();
    const headers: Record<string, string> = {};

    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const entry: CachedResponse = {
      body,
      status: response.status,
      headers,
      timestamp: Date.now(),
    };

    inMemoryCache.set(key, entry);
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
      const responseClone = response.clone();
      const body = await responseClone.text();
      const headers: Record<string, string> = {};

      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      const dataToCache: Omit<CachedResponse, 'timestamp'> & { timestamp?: number } = {
        body,
        status: response.status,
        headers,
      };

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