// ================================================================================
// FICHIER : src/shared/utils/fetchWithRetry.ts
// RÔLE : UTILITAIRE HTTP ROBUSTE AVEC RETRY, TIMEOUT, CIRCUIT BREAKER ET JITTER
// NIVEAU : HDR (Habilitation à Diriger des Recherches) - Production Grade
// ================================================================================

import { getCircuitBreaker } from './circuit-breaker';
import { getDispatcher } from './resilient-scraper';

// [TENOR 2026 FIX] SCAR-120: Global Fetch Dispatcher Bypass
// Next.js overrides the global `fetch` and strips custom dispatchers.
// We MUST import `fetch` directly from `undici` to guarantee that our custom
// Agents (with strict TLS rules and Keep-Alive settings) are actually used.
import { fetch as undiciFetch } from 'undici';

type FetchOptions = RequestInit & {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
  circuitBreakerKey?: string; // Identifiant pour le circuit breaker (ex: 'api-1')
};

/**
 * Exécute une requête fetch avec une logique de retry automatique, un timeout,
 * et un algorithme de Full Jitter pour prévenir le Thundering Herd.
 *
 * @param url - L'URL à appeler.
 * @param options - Les options de fetch, plus retries, retryDelay et timeout.
 * @returns La réponse fetch si réussie.
 * @throws Une erreur après épuisement des tentatives.
 */
export async function fetchWithRetry(url: string, options: FetchOptions = {}): Promise<Response> {
  const {
    retries = 3,
    retryDelay = 1000,
    timeout = 15000, // 15 secondes par défaut (augmentation pour stabilité)
    circuitBreakerKey,
    ...fetchOptions
  } = options;

  // Si un circuit breaker est configuré, l'utiliser
  if (circuitBreakerKey) {
    const circuitBreaker = getCircuitBreaker(circuitBreakerKey);
    return circuitBreaker.execute(async () => {
      return performFetchWithRetry(url, { retries, retryDelay, timeout, ...fetchOptions });
    });
  }

  // Sinon, appel direct sans protection circuit breaker
  return performFetchWithRetry(url, { retries, retryDelay, timeout, ...fetchOptions });
}

async function performFetchWithRetry(
  url: string,
  options: { retries: number; retryDelay: number; timeout: number } & RequestInit
): Promise<Response> {
  const { retries, retryDelay, timeout, ...fetchOptions } = options;
  const maxAttempts = retries + 1;
  let attempt = 0;

  while (attempt < maxAttempts) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort('timeout'), timeout);

    try {
      // [TENOR 2026 FIX] SCAR-120: Use undiciFetch to enforce TLS and Keep-Alive rules.
      // We cast to `any` for the options because undici's RequestInit is slightly stricter
      // than the global one, and we cast the result to `unknown as Response` to satisfy
      // Next.js's expected return type, as the proxy only reads standard properties (.body, .status).
      const response = await undiciFetch(url, {
        ...fetchOptions,
        dispatcher: getDispatcher(url),
        signal: controller.signal,
      } as any) as unknown as Response;

      clearTimeout(id);

      // On considère les erreurs 5xx comme retryables, mais pas les 4xx (sauf 408/429 eventuellement, mais restons simples)
      // Si c'est OK ou 4xx (client error), on retourne.
      // Si c'est 5xx (server error), on retry.
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }

      // Si on est ici, c'est une 5xx
      throw new Error(`Server returned ${response.status}`);
    } catch (error: unknown) {
      clearTimeout(id);

      const err = error as { name?: string; code?: string; message?: string };
      console.error(`[fetchWithRetry] Attempt ${attempt + 1}/${maxAttempts} failed: ${err.message || String(error)}`);

      attempt++;
      if (attempt >= maxAttempts) {
        throw error; // Épuisement des tentatives
      }

      // [TENOR 2026 FIX] SCAR-121: Full Jitter Algorithm (AWS Architecture Standard)
      // Remplace le backoff linéaire destructeur par un étalement stochastique de la charge.
      // Empêche le "Thundering Herd" (troupeau foudroyant) en cas de panne de l'API cible.
      const safeBaseDelay = Math.max(100, retryDelay); // Protection contre retryDelay = 0
      const minDelay = 500; // Délai minimum absolu pour ne pas spammer
      const maxBackoff = 10000; // Plafond maximum de 10 secondes

      // Calcul exponentiel: base * 2^attempt
      const exponentialDelay = safeBaseDelay * Math.pow(2, attempt);
      const cappedDelay = Math.min(maxBackoff, exponentialDelay);

      // Jitter: distribution uniforme entre 0 et (cappedDelay - minDelay)
      const jitterRange = Math.max(0, cappedDelay - minDelay);
      const jitter = Math.floor(Math.random() * (jitterRange + 1));

      const delay = minDelay + jitter;

      // console.log(`⏳ [fetchWithRetry] Attente stochastique de ${delay}ms avant retentative...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Ce code ne devrait jamais être atteint si le throw fonctionne bien
  throw new Error('All retries failed');
}
