// ================================================================================
// FICHIER : app/api/proxy/metrics.mjs
// RÔLE   : SOURCE DE VÉRITÉ — Collecteur de métriques du proxy (Observabilité #4).
// NIVEAU : Production Grade — O(1) mémoire, Formally Testable
// ================================================================================
//
// PROBLÈME RÉSOLU (Blocage #4 de l'audit — observabilité) :
//   À l'échelle, "ça marche ?" ne suffit pas. Il faut MESURER : latence p50/p95/p99,
//   hit-rate du cache, distribution des statuts, coalescing effectif, état circuit.
//   Sans métriques, une dérive de latence ou un effondrement de hit-rate reste
//   invisible jusqu'à l'incident.
//
// CONTRAINTE D'ÉCHELLE — mémoire bornée :
//   On ne peut PAS stocker toutes les latences (millions de requêtes). On utilise
//   un RESERVOIR SAMPLING (Algorithme R de Vitter) : un échantillon uniforme de
//   taille fixe, statistiquement représentatif, en mémoire O(reservoirSize).
//   Les percentiles sont estimés sur ce réservoir.
//
// GARANTIES (voir metrics.test.mjs) :
//   1. percentile(0..100) correct par interpolation "nearest-rank" sur données triées.
//   2. hitRate = hits / (hits + misses), 0 si aucun échantillon.
//   3. Réservoir borné : jamais plus de reservoirSize latences stockées.
//   4. snapshot() est un instantané immuable (pas de fuite de l'état interne).
//   5. reset() remet tous les compteurs à zéro (utile pour fenêtres glissantes).
//   6. Pur : aucun effet de bord externe, déterministe hors échantillonnage aléatoire.
// ================================================================================

/**
 * Estime un percentile (0..100) sur un tableau de nombres via "nearest-rank".
 * @param {number[]} sortedAsc - Valeurs triées croissantes.
 * @param {number} p - Percentile demandé dans [0, 100].
 * @returns {number} La valeur estimée (0 si vide).
 */
export function percentile(sortedAsc, p) {
  const n = sortedAsc.length;
  if (n === 0) return 0;
  if (p <= 0) return sortedAsc[0];
  if (p >= 100) return sortedAsc[n - 1];
  // nearest-rank : rang = ceil(p/100 * n), index 1-based -> 0-based
  const rank = Math.ceil((p / 100) * n);
  const idx = Math.min(n - 1, Math.max(0, rank - 1));
  return sortedAsc[idx];
}

export class ProxyMetrics {
  /**
   * @param {object} [options]
   * @param {number} [options.reservoirSize=1000] Taille de l'échantillon de latences.
   * @param {() => number} [options.rng=Math.random] Générateur (injectable pour tests).
   */
  constructor(options = {}) {
    this._reservoirSize = options.reservoirSize ?? 1000;
    this._rng = options.rng ?? Math.random;
    this.reset();
  }

  /** Remet tous les compteurs et l'échantillon à zéro. */
  reset() {
    /** @type {number[]} */
    this._latencies = [];
    this._seen = 0;          // total de latences observées (pour le sampling)
    this._cacheHits = 0;
    this._cacheMisses = 0;
    this._coalesced = 0;
    /** @type {Record<string, number>} */
    this._statusClasses = {}; // '2xx' | '4xx' | '5xx' | ...
    this._total = 0;
  }

  /**
   * Enregistre une latence (ms) via reservoir sampling (Algorithme R).
   * @param {number} ms
   */
  recordLatency(ms) {
    if (typeof ms !== 'number' || !Number.isFinite(ms) || ms < 0) return;
    this._seen++;
    if (this._latencies.length < this._reservoirSize) {
      this._latencies.push(ms);
      return;
    }
    // Remplace un élément avec probabilité reservoirSize/_seen (uniforme).
    const j = Math.floor(this._rng() * this._seen);
    if (j < this._reservoirSize) {
      this._latencies[j] = ms;
    }
  }

  /** @param {boolean} isHit */
  recordCache(isHit) {
    if (isHit) this._cacheHits++;
    else this._cacheMisses++;
  }

  /** Incrémente le compteur de requêtes coalescées (followers single-flight). */
  recordCoalesced() {
    this._coalesced++;
  }

  /**
   * Enregistre le statut HTTP final renvoyé au client.
   * @param {number} status
   */
  recordStatus(status) {
    this._total++;
    const cls = `${Math.floor(status / 100)}xx`;
    this._statusClasses[cls] = (this._statusClasses[cls] ?? 0) + 1;
  }

  /** @returns {number} hits / (hits + misses), 0 si aucun. */
  get hitRate() {
    const denom = this._cacheHits + this._cacheMisses;
    return denom === 0 ? 0 : this._cacheHits / denom;
  }

  /**
   * Instantané IMMUABLE des métriques courantes (pour un endpoint /metrics ou logs).
   * @returns {object}
   */
  snapshot() {
    const sorted = [...this._latencies].sort((a, b) => a - b);
    return {
      totalRequests: this._total,
      latencyMs: {
        p50: percentile(sorted, 50),
        p95: percentile(sorted, 95),
        p99: percentile(sorted, 99),
        samples: sorted.length,
      },
      cache: {
        hits: this._cacheHits,
        misses: this._cacheMisses,
        hitRate: Number(this.hitRate.toFixed(4)),
      },
      coalescedRequests: this._coalesced,
      statusClasses: { ...this._statusClasses },
    };
  }
}
