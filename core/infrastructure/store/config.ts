// src/core/infrastructure/store/api/config.ts

/**
 * Configuration centralisée pour la couche API.
 * Version: Fondations d'Acier
 */
export const apiConfig = {
  /**
   * L'identifiant du service d'authentification dans le proxy.
   * Doit correspondre à une clé dans `proxyConfig.apiTargets`.
   */

  openMeteoId: '7',
  openStreetMapId: '8',
  githubRawId: '9',

  /**
   * Routes qui sont considérées comme publiques et ne nécessitent pas de token de session.
   * La clé est le chemin de l'API (sans l'ID de service), la valeur est un Set des méthodes HTTP autorisées.
   * 🧬 LÉGAT-VULCAN PRIME: [CORRECTION INTÉGRALE CI=6]
   * Standardisation de tous les chemins SANS slash final pour assurer la cohérence.
   */
  publicApiRoutes: new Map<string, Set<string>>(
    [


      ['/v1/forecast', new Set(['GET'])],
      ['/reverse', new Set(['GET'])],
      ['/Fredysessie/brvm-data-public', new Set(['GET'])],



    ]),

  /**
   * @deprecated Depuis le FIX #4 (audit proxy), la politique de trailing-slash
   * n'est PLUS pilotée par cette liste. Le proxy applique désormais le contrat
   * APPEND_SLASH de Django de manière cohérente pour TOUTES les méthodes via la
   * source de vérité unique et testée `app/api/proxy/path-normalizer`.
   * Conservé pour rétro-compatibilité de lecture ; ne plus l'utiliser comme
   * autorité de décision.
   */
  enforceTrailingSlashForMethods: new Set(['POST', 'PUT', 'PATCH', 'DELETE']),

  /**
   * URL de base pour tous les appels API initiés par le CLIENT.
   * Pointe vers notre proxy Next.js pour centraliser la sécurité et le routage.
   */
  baseUrl: '/api/proxy',
};