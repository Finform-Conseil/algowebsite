// ================================================================================
// FICHIER : app/api/proxy/response-guard.ts
// RÔLE   : Façade TYPÉE de la détection d'interception de gateway.
//          Logique canonique dans `./response-guard.mjs` (source de vérité unique,
//          testée par `response-guard.test.mjs`). Zéro duplication (DRY).
// ================================================================================

import { isGatewayInterception as _isGatewayInterception } from './response-guard.mjs';

/**
 * La réponse backend est-elle une interception de gateway déguisée en succès
 * (2xx annonçant du `text/html`) ? Si oui, le proxy doit répondre 502.
 *
 * @param status - Code HTTP de la réponse backend.
 * @param contentType - En-tête `Content-Type` brut (ou null/undefined).
 */
export const isGatewayInterception: (
  status: number,
  contentType: string | null | undefined,
) => boolean = _isGatewayInterception;
