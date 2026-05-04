// CHEMIN : src/shared/utils/resilient-scraper.ts
// VERSION : 1.6.0 [TENOR 2026 HDR - OOM SHIELD & SEMANTIC FIX]
// RÔLE : UTILITAIRE DE SCRAPING HAUTE DISPONIBILITÉ AVEC CACHE REDIS & BACKGROUND SWR

import { Agent, fetch } from 'undici';
import { getCircuitBreaker } from './circuit-breaker';
import { redisClient } from '@/core/infrastructure/security/rate/redis-rate-limiter';

// ============================================================================
// 🔒 SECURITY CONFIGURATION (SCAR-117 FIX)
// ============================================================================
const isDev = process.env.NODE_ENV === 'development';
const ignoreBrvmSsl = process.env.IGNORE_BRVM_SSL_ERRORS === 'true';

/**
 * [TENOR 2026] POOLS ISOLÉS PAR DOMAINE
 * Expansion du pool BRVM à 5 connections pour éviter la saturation lors des ralentissements.
 */
const brvmAgent = new Agent({
  connect: {
    rejectUnauthorized: !(isDev || ignoreBrvmSsl),
    timeout: 8000 // TCP+TLS : fail-fast si le serveur ne répond pas (Diagnostic Confirmé)
  },
  pipelining: 0, // Désactivation du pipelining pour Drupal 7 (P0 Fix)
  keepAliveTimeout: 4000, // Aligné sur les serveurs Apache/Drupal (P0 Fix)
  keepAliveMaxTimeout: 8000,
  connections: 5,
  headersTimeout: 18000, // Sous le timeout global pour laisser undici throw (Diagnostic Confirmé)
  bodyTimeout: 15000
});

const fastAgent = new Agent({
  connect: {
    rejectUnauthorized: !isDev,
    timeout: 5000
  },
  pipelining: 1,
  keepAliveTimeout: 60000,
  connections: 10,
  headersTimeout: 15000,
  bodyTimeout: 15000
});

export function getDispatcher(url: string) {
  if (url.includes('brvm.org')) return brvmAgent;
  return fastAgent;
}

// [HDR] Circuit Breaker pour la source BRVM
const brvmCircuit = getCircuitBreaker('BRVM_SOURCE', {
  failureThreshold: 3, // Plus agressif (HDR)
  resetTimeout: 30000, // 30s de cooldown
  halfOpenMaxAttempts: 1
});

interface ScraperOptions {
  timeout?: number;
  retries?: number;
  cacheTtl?: number;
  staleTtl?: number;
}

// ============================================================================
// 🛡️ CIRCUIT BREAKER REDIS
// ============================================================================
let redisIsDown = false;
let redisDownSince = 0;
const REDIS_COOLDOWN = 30000;

function checkRedisStatus() {
  if (redisIsDown && Date.now() - redisDownSince > REDIS_COOLDOWN) {
    redisIsDown = false;
  }
  return !redisIsDown && redisClient;
}

async function withRedisTimeout<T>(promise: Promise<T>, ms: number = 3000): Promise<T | null> {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('REDIS_TIMEOUT')), ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } catch (err: unknown) {
    if ((err as Error).message === 'REDIS_TIMEOUT') {
      if (!redisIsDown) {
        console.error(`[ResilientScraper] Redis Circuit breaker activated. Bypass 30s.`);
        redisIsDown = true;
        redisDownSince = Date.now();
      }
    }
    return null;
  } finally {
    // @ts-expect-error - Nettoyage obligatoire du timer
    if (timeoutId) clearTimeout(timeoutId);
  }
}

// ============================================================================
// 💾 CACHE LAYER & BACKGROUND SWR
// ============================================================================
// [TENOR 2026 SRE FIX] OOM Shield & Semantic Correction
// Renamed l2Cache to l1Cache (since it's in-memory RAM, Redis is L2).
// Implemented a strict size limit (MAX_L1_CACHE_SIZE) with FIFO eviction
// to prevent Out-Of-Memory (OOM) crashes on long-running Node.js servers.
const MAX_L1_CACHE_SIZE = 1000;
const l1Cache = new Map<string, { data: string; timestamp: number }>();
const inFlightBackgroundRequests = new Map<string, Promise<void>>();
const L1_TTL = 60000;

function setL1CacheSafe(key: string, data: string, timestamp: number) {
  if (l1Cache.size >= MAX_L1_CACHE_SIZE) {
    // Map.prototype.keys() returns an iterator in insertion order.
    // The first key is the oldest inserted key (FIFO eviction).
    const oldestKey = l1Cache.keys().next().value;
    if (oldestKey) l1Cache.delete(oldestKey);
  }
  l1Cache.set(key, { data, timestamp });
}

export async function fetchWithResilience(
  cacheKey: string,
  fetchFn: () => Promise<string>,
  options: ScraperOptions = {}
): Promise<{ data: string; status: 'HIT_L1' | 'HIT' | 'MISS' | 'STALE' | 'FALLBACK' }> {
  const { cacheTtl = 600, staleTtl = 86400 } = options;
  const fullKey = `scraper:v1:${cacheKey}`;
  const now = Date.now();

  // L1: In-Memory (Zero Latency)
  const l1Entry = l1Cache.get(fullKey);
  if (l1Entry && (now - l1Entry.timestamp < L1_TTL)) {
    return { data: l1Entry.data, status: 'HIT_L1' };
  }

  // L2: Redis (Distributed)
  let staleData: string | null = null;
  if (checkRedisStatus()) {
    const cached = await withRedisTimeout(
      redisClient!.get<{ data: string; timestamp: number }>(fullKey)
    );

    if (cached) {
      const age = (now - cached.timestamp) / 1000;
      setL1CacheSafe(fullKey, cached.data, now);

      if (age < cacheTtl) return { data: cached.data, status: 'HIT' };

      // On a une donnée STALE. On la garde en réserve.
      staleData = cached.data;
      console.warn(`[ResilientScraper] Stale data detected for ${cacheKey} (${Math.round(age)}s).`);
    }
  }

  // [HDR STRATEGY] BACKGROUND REFRESH (SWR) avec Déduplication (P0 Fix)
  if (staleData && !inFlightBackgroundRequests.has(fullKey)) {
    const refreshPromise = (async () => {
      try {
        const fresh = await fetchFn();
        setL1CacheSafe(fullKey, fresh, Date.now());

        if (checkRedisStatus()) {
          await withRedisTimeout(
            redisClient!.set(fullKey, { data: fresh, timestamp: Date.now() }, { ex: staleTtl })
          );
        }
        console.warn(`[ResilientScraper] Background refresh SUCCESS for ${cacheKey}`);
      } catch {
        console.error(`[ResilientScraper] Background refresh FAILED for ${cacheKey}`);
      } finally {
        inFlightBackgroundRequests.delete(fullKey);
      }
    })();

    inFlightBackgroundRequests.set(fullKey, refreshPromise);
    return { data: staleData, status: 'STALE' };
  }

  // L3: Live Fetch (Blocking since no cache available)
  try {
    const freshData = await fetchFn();
    setL1CacheSafe(fullKey, freshData, now);

    if (checkRedisStatus()) {
      await withRedisTimeout(
        redisClient!.set(fullKey, { data: freshData, timestamp: now }, { ex: staleTtl })
      );
    }
    return { data: freshData, status: 'MISS' };
  } catch (error) {
    console.error(`[ResilientScraper] Critical Fetch failure for ${cacheKey}:`, error);
    throw error;
  }
}

/**
 * [TENOR 2026] fetchBrvmPage avec SOURCE CIRCUIT BREAKER
 */
export async function fetchBrvmPage(url: string, timeout = 20000, maxRetries = 2): Promise<string> {
  const isBrvm = url.includes('brvm.org');
  const tag = isBrvm ? '[brvm]' : '[unknown]';

  // Protection par Circuit Breaker uniquement pour BRVM
  if (isBrvm) {
    return await brvmCircuit.execute(() => _executeFetch(url, timeout, maxRetries, tag));
  }
  return await _executeFetch(url, timeout, maxRetries, tag);
}

async function _executeFetch(url: string, timeout: number, maxRetries: number, tag: string): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    // [FIX] AbortController comme filet de sécurité UNIQUEMENT (Diagnostic Confirmé)
    // headersTimeout undici gère le vrai timeout — l'abort est au-delà (+15s)
    const timeoutId = setTimeout(() => controller.abort(new Error('ABORT_SAFETY_NET')), timeout + 15000);

    try {
      const response = await fetch(url, {
        dispatcher: getDispatcher(url),
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9',
          'Accept-Encoding': 'identity',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // [DEZOOM -1000] Si 504 ou 502, on ne retry pas agressivement, on laisse le Circuit Breaker agir.
        if (response.status >= 500) {
          throw new Error(`BRVM Source Down: ${response.status}`);
        }
        if (response.status === 403 || response.status === 429) {
          throw new Error(`BRVM Blocked: ${response.status}`);
        }
        throw new Error(`BRVM Source Error: ${response.status}`);
      }

      return await response.text();
    } catch (e: unknown) {
      clearTimeout(timeoutId);
      const err = e as { name?: string; code?: string; message?: string; cause?: { code?: string } };
      
      // Undici encapsule ses erreurs dans e.cause pour les HeadersTimeout/BodyTimeout (Diagnostic Confirmé)
      const undiciCode = err.cause?.code ?? err.code ?? '';
      const isTimeout = err.name === 'AbortError' || undiciCode === 'UND_ERR_HEADERS_TIMEOUT' || undiciCode === 'UND_ERR_BODY_TIMEOUT' || undiciCode === 'UND_ERR_CONNECT_TIMEOUT' || err.message === 'ABORT_SAFETY_NET';
      const errKind = isTimeout ? 'TIMEOUT' : undiciCode || err.name || 'UNKNOWN';

      console.error(`${tag} attempt=${attempt}/${maxRetries} kind=${errKind} url=${url} err=${err.message || String(e)}`);

      if (attempt === maxRetries) throw e;

      // [FIX] Ne pas retry les erreurs réseau bloquantes (Diagnostic Confirmé)
      const isNetworkDead = undiciCode === 'ECONNREFUSED' || err.code === 'ECONNREFUSED';
      if (isNetworkDead) throw e;

      // Backoff plus long si timeout (pas la peine de retry immédiatement) (Diagnostic Confirmé)
      const delay = isTimeout ? 3000 * attempt : 1000 * attempt;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Unreachable');
}
// --- EOF ---