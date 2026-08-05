// ================================================================================
// FICHIER : app/api/proxy/path-normalizer.mjs
// RÔLE   : SOURCE DE VÉRITÉ UNIQUE DU CONTRAT DE PATH DJANGO (Trailing-Slash Policy)
// NIVEAU : Production Grade — Pure, Deterministic, Formally Testable
// ================================================================================
//
// PROBLÈME RÉSOLU (Défaut #4 de l'audit) :
//   Le backend Django tourne avec APPEND_SLASH=True et redirige (301) toute route
//   d'API sans slash final. Un GET sans slash produit une redirection dont le corps
//   peut être vide/HTML, que le client parse comme "empty or malformed (HTTP 200)".
//
//   Auparavant, la responsabilité du slash était DISPERSÉE dans ~26 fichiers
//   `*.api.ts` (violation DRY) et le proxy ne normalisait QUE POST/PUT/PATCH/DELETE,
//   laissant TOUS les GET `getAll*` cassés.
//
// DÉCISION (SRP + DRY) :
//   La politique de trailing-slash est une règle du domaine "contrat de transport
//   Django", extraite ici en UNE fonction pure, prouvée par path-normalizer.test.mjs.
//   Le wrapper TypeScript (path-normalizer.ts) se contente de la ré-exporter typée.
//
// INVARIANTS (voir tests) :
//   1. Un path ressource obtient TOUJOURS exactement un slash final.
//   2. Idempotence : normalize(normalize(p)) === normalize(p).
//   3. Un path fichier à extension (ex: `.csv`) N'obtient PAS de slash.
//   4. La query string n'est jamais touchée (concaténée en aval).
//   5. Slash initial unique garanti (`//x` -> `/x`).
//   6. Fonction pure : aucune dépendance d'environnement, aucun effet de bord.
// ================================================================================

/**
 * Le dernier segment ressemble-t-il à un fichier à extension (ex: `report.csv`) ?
 * De tels chemins ne reçoivent PAS de slash final (Django/statique -> 404 sinon).
 * @param {string} pathname
 * @returns {boolean}
 */
function lastSegmentLooksLikeFile(pathname) {
  // On raisonne sur le path SANS slash(es) final(aux) : ainsi `files/x.csv/`
  // et `files/x.csv` sont jugés identiquement (un slash final erroné sur un
  // fichier ne doit pas masquer l'extension).
  const trimmed = pathname.replace(/\/+$/, '');
  const lastSlash = trimmed.lastIndexOf('/');
  const lastSegment = lastSlash === -1 ? trimmed : trimmed.slice(lastSlash + 1);
  const dotIndex = lastSegment.indexOf('.');
  return dotIndex > 0 && dotIndex < lastSegment.length - 1;
}

/**
 * Normalise le PATHNAME NU (sans query string) vers le contrat Django APPEND_SLASH,
 * de façon cohérente pour TOUTES les méthodes HTTP.
 * @param {string} pathname
 * @returns {string}
 */
export function normalizeDjangoPath(pathname) {
  if (!pathname || pathname === '/') {
    return '/';
  }

  let normalized = '/' + pathname.replace(/^\/+/, '');

  if (lastSegmentLooksLikeFile(normalized)) {
    return normalized.endsWith('/') ? normalized.slice(0, -1) : normalized;
  }

  if (!normalized.endsWith('/')) {
    normalized += '/';
  }

  return normalized;
}
