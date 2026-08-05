// ================================================================================
// FICHIER : app/api/proxy/response-guard.mjs
// RÔLE   : SOURCE DE VÉRITÉ — Détection d'interception de gateway (Défaut #5).
// NIVEAU : Production Grade — Pure, Deterministic, Formally Testable
// ================================================================================
//
// PROBLÈME RÉSOLU (Défaut #5 de l'audit) :
//   Un backend/gateway défaillant (page de login, holding sslip.io, reverse-proxy
//   d'erreur) peut renvoyer HTTP 2xx avec un corps `text/html`. Le proxy le
//   relayait aveuglément, et c'était le CLIENT qui explosait en tentant
//   `JSON.parse` -> "empty or malformed response (HTTP 200)".
//
// DÉCISION (chirurgicale, non-destructive) :
//   On NE force PAS "tout doit être JSON" — cela casserait les exports légitimes
//   (CSV, PDF, binaire, images). On cible EXACTEMENT la signature pathologique et
//   sûre : une réponse de SUCCÈS (2xx) dont le Content-Type est `text/html`.
//   À travers ce proxy de DONNÉES, une telle réponse n'est jamais une donnée API
//   légitime : c'est une interception. Le proxy la transforme en 502 Bad Gateway
//   structuré, attrapant l'erreur AU BORD au lieu de la propager à l'utilisateur.
//
// INVARIANTS (voir response-guard.test.mjs) :
//   1. 2xx + text/html            -> interception (true).
//   2. 2xx + application/json     -> OK (false).
//   3. 2xx + CSV/PDF/binaire/etc. -> OK (false)  [exports légitimes préservés].
//   4. 3xx/4xx/5xx (tout non-2xx) -> jamais signalé ici (relayé/géré ailleurs).
//   5. Content-Type absent        -> OK (false)  [on ne sur-bloque pas].
//   6. Pure : aucune dépendance d'environnement, aucun effet de bord.
// ================================================================================

/**
 * Un statut HTTP appartient-il à la classe de succès 2xx ?
 * @param {number} status
 * @returns {boolean}
 */
function isSuccessStatus(status) {
  return status >= 200 && status < 300;
}

/**
 * La réponse est-elle une interception de gateway déguisée en succès ?
 * (2xx annonçant du HTML alors que ce proxy relaie des données d'API.)
 *
 * @param {number} status - Code HTTP de la réponse backend.
 * @param {string | null | undefined} contentType - En-tête Content-Type brut.
 * @returns {boolean} true si la réponse doit être traitée comme 502 Bad Gateway.
 */
export function isGatewayInterception(status, contentType) {
  if (!isSuccessStatus(status)) {
    return false;
  }
  if (!contentType) {
    return false;
  }
  // Comparaison insensible à la casse et tolérante aux paramètres
  // (ex: "text/html; charset=utf-8").
  return contentType.toLowerCase().includes('text/html');
}
