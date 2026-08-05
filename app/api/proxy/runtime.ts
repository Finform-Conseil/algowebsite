// ================================================================================
// FICHIER : app/api/proxy/runtime.ts
// RÔLE   : Singletons partagés du proxy, à l'échelle de l'isolate.
//          Extraits du route handler (SRP) pour être importés à la fois par
//          `[...path]/route.ts` (écriture) et `metrics/route.ts` (lecture), sans
//          exporter d'objets non-handler depuis un fichier de route Next.js.
// ================================================================================

import { SingleFlight } from './single-flight';
import { ProxyMetrics } from './metrics';

/**
 * [ANTI-STAMPEDE #2] Coalescer unique par isolate : les GET cacheables concurrents
 * sur la même clé partagent un seul appel backend. Borné (protection OOM).
 */
export const requestCoalescer = new SingleFlight({ maxInFlight: 10000 });

/**
 * [OBSERVABILITÉ #4] Collecteur de métriques par isolate : latence p50/p95/p99,
 * hit-rate cache, coalescing, distribution des statuts. Mémoire O(1) (reservoir).
 */
export const proxyMetrics = new ProxyMetrics({ reservoirSize: 2000 });
