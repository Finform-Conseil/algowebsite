// ================================================================================
// FICHIER : app/api/proxy/single-flight.mjs
// RÔLE   : SOURCE DE VÉRITÉ — Déduplication d'exécutions concurrentes (anti-stampede).
// NIVEAU : Production Grade — Concurrency-safe, OOM-bounded, Formally Testable
// ================================================================================
//
// PROBLÈME RÉSOLU (Blocage #4 de l'audit d'échelle — "cache stampede") :
//   Quand une entrée de cache expire, N requêtes concurrentes identiques (ex: 1000
//   utilisateurs demandant /sectors/ à la même milliseconde) traversent TOUTES vers
//   le backend Django simultanément (thundering herd). À l'échelle, cela peut
//   effondrer le backend pile au moment de la ré-hydratation du cache.
//
// SOLUTION (single-flight / request coalescing, façon Go golang.org/x/sync) :
//   Pour une clé donnée, une SEULE exécution part réellement (le "leader"). Toutes
//   les requêtes concurrentes sur la même clé (les "followers") attendent et
//   partagent le MÊME résultat. Une fois résolu, le vol est retiré : la requête
//   suivante repart normalement (et touchera probablement le cache fraîchement peuplé).
//
// GARANTIES (voir single-flight.test.mjs) :
//   1. Coalescing : k appels concurrents sur la même clé => 1 seule exécution.
//   2. Nettoyage garanti : la promesse en vol est retirée en `finally` (succès OU
//      échec) — pas de fuite mémoire, pas d'erreur mise en cache indéfiniment.
//   3. Propagation d'erreur : si le leader rejette, tous les followers rejettent
//      avec la MÊME erreur (ils auraient échoué de toute façon).
//   4. Clés distinctes => exécutions indépendantes et parallèles.
//   5. Borne OOM : au-delà de maxInFlight, on n'enregistre pas le vol (exécution
//      directe, sans coalescing) plutôt que de faire croître la map sans limite.
//   6. Après résolution, une nouvelle vague sur la même clé ré-exécute (le vol
//      n'est PAS un cache : c'est une fenêtre de déduplication temporelle).
// ================================================================================

export class SingleFlight {
  /**
   * @param {object} [options]
   * @param {number} [options.maxInFlight=10000] Borne dure du nombre de vols
   *   concurrents suivis simultanément (protection OOM à l'échelle).
   */
  constructor(options = {}) {
    /** @type {Map<string, Promise<unknown>>} */
    this._inFlight = new Map();
    this._maxInFlight = options.maxInFlight ?? 10000;
  }

  /**
   * Nombre de vols actuellement en cours (diagnostic / métriques).
   * @returns {number}
   */
  get size() {
    return this._inFlight.size;
  }

  /**
   * Exécute `fn` sous déduplication par `key`. Les appels concurrents sur la même
   * clé partagent le résultat du premier (leader).
   *
   * @template T
   * @param {string} key - Clé de déduplication (typiquement la clé de cache).
   * @param {() => Promise<T>} fn - Travail coûteux (ex: fetch backend).
   * @param {() => void} [onCoalesced] - Notifié UNIQUEMENT quand cet appel est un
   *   follower (partage la promesse d'un leader existant). Permet à l'appelant
   *   d'instrumenter le coalescing SANS coupler ce module aux métriques (SRP).
   *   Toute exception levée par le callback est ignorée (l'observabilité ne doit
   *   jamais casser le chemin de requête).
   * @returns {Promise<T>}
   */
  run(key, fn, onCoalesced) {
    const existing = this._inFlight.get(key);
    if (existing !== undefined) {
      // Follower : partage la promesse du leader.
      if (onCoalesced !== undefined) {
        try {
          onCoalesced();
        } catch {
          // L'observabilité ne casse jamais le chemin de requête.
        }
      }
      return /** @type {Promise<T>} */ (existing);
    }

    // Protection OOM : si trop de vols concurrents, on n'enregistre pas celui-ci
    // (dégradation gracieuse : exécution directe, sans coalescing pour cette clé).
    if (this._inFlight.size >= this._maxInFlight) {
      return fn();
    }

    // Leader : exécute réellement et nettoie le vol quoi qu'il arrive.
    const promise = (async () => {
      try {
        return await fn();
      } finally {
        this._inFlight.delete(key);
      }
    })();

    this._inFlight.set(key, promise);
    return /** @type {Promise<T>} */ (promise);
  }
}
