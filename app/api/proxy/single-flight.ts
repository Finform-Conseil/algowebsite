// ================================================================================
// FICHIER : app/api/proxy/single-flight.ts
// RÔLE   : Façade TYPÉE du single-flight (anti-stampede).
//          Logique canonique dans `./single-flight.mjs` (source de vérité unique,
//          testée par `single-flight.test.mjs`). Zéro duplication (DRY).
// ================================================================================

import { SingleFlight as _SingleFlight } from './single-flight.mjs';

export interface SingleFlightOptions {
  /** Borne dure du nombre de vols concurrents suivis (protection OOM). */
  maxInFlight?: number;
}

export interface ISingleFlight {
  /** Nombre de vols actuellement en cours (diagnostic / métriques). */
  readonly size: number;
  /**
   * Exécute `fn` sous déduplication par `key`.
   * @param onCoalesced Notifié uniquement quand cet appel est un follower.
   */
  run<T>(key: string, fn: () => Promise<T>, onCoalesced?: () => void): Promise<T>;
}

export const SingleFlight: new (options?: SingleFlightOptions) => ISingleFlight =
  _SingleFlight as unknown as new (options?: SingleFlightOptions) => ISingleFlight;
