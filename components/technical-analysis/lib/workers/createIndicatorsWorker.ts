/**
 * [TENOR 2026 HDR] createIndicatorsWorker.ts
 *
 * [SCAR-WORKER-ROOT RESOLUTION] — Modern Bundler Pattern (Negative Entropy)
 * ============================================================================
 * Problème précédent : Le code mathématique était dupliqué sous forme de string
 * pour forcer un Blob Worker, créant une dette technique massive et un risque
 * de désynchronisation des formules (ex: RSI, MACD).
 *
 * Solution SRE 2026 : Éradication de la duplication. Utilisation de l'API standard
 * `new URL(..., import.meta.url)`. Next.js (Turbopack/Webpack) analyse statiquement
 * cette syntaxe, compile `indicators.worker.ts` dans un chunk séparé, applique
 * un hash pour le cache-busting, et gère le HMR nativement.
 * ============================================================================
 */


/**
 * Creates a new Web Worker using the native bundler pattern.
 * This pattern bypasses browser HTTP caching issues automatically via Webpack/Turbopack hashing.
 * Call worker.terminate() when done.
 */
export const createIndicatorsWorker = (): Worker => {
  // Le flag type: 'module' est crucial pour permettre au worker d'importer
  // les fonctions pures depuis TechnicalIndicators.ts via les ES Modules.
  return new Worker(new URL('./indicators.worker.ts', import.meta.url), {
    type: 'module',
    name: 'AlgowayIndicatorsWorker'
  });
};

// --- EOF ---