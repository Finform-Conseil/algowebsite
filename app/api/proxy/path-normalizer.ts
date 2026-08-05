// ================================================================================
// FICHIER : app/api/proxy/path-normalizer.ts
// RÔLE   : Façade TYPÉE de la politique de trailing-slash Django.
//          La logique canonique vit dans `./path-normalizer.mjs` (source de vérité
//          unique, testée par `path-normalizer.test.mjs`). Ce fichier n'ajoute QUE
//          le typage pour la couche TypeScript du proxy — aucune duplication.
// ================================================================================

import { normalizeDjangoPath as _normalizeDjangoPath } from './path-normalizer.mjs';

/**
 * Normalise le pathname NU (sans query string) vers le contrat Django APPEND_SLASH,
 * de manière cohérente pour toutes les méthodes HTTP.
 *
 * @param pathname - Chemin ressource (avec/sans slash initial ou final).
 * @returns Chemin canonique : slash initial garanti, slash final si ressource,
 *          pas de slash pour un fichier à extension.
 */
export const normalizeDjangoPath: (pathname: string) => string = _normalizeDjangoPath;
