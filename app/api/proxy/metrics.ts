// ================================================================================
// FICHIER : app/api/proxy/metrics.ts
// RÔLE   : Façade TYPÉE du collecteur de métriques (Observabilité #4).
//          Logique canonique dans `./metrics.mjs` (source de vérité, testée par
//          `metrics.test.mjs`). Zéro duplication (DRY).
// ================================================================================

import { ProxyMetrics as _ProxyMetrics, percentile as _percentile } from './metrics.mjs';

export interface MetricsSnapshot {
  totalRequests: number;
  latencyMs: { p50: number; p95: number; p99: number; samples: number };
  cache: { hits: number; misses: number; hitRate: number };
  coalescedRequests: number;
  statusClasses: Record<string, number>;
}

export interface ProxyMetricsOptions {
  reservoirSize?: number;
  rng?: () => number;
}

export interface IProxyMetrics {
  readonly hitRate: number;
  reset(): void;
  recordLatency(ms: number): void;
  recordCache(isHit: boolean): void;
  recordCoalesced(): void;
  recordStatus(status: number): void;
  snapshot(): MetricsSnapshot;
}

export const percentile: (sortedAsc: number[], p: number) => number = _percentile;

export const ProxyMetrics: new (options?: ProxyMetricsOptions) => IProxyMetrics =
  _ProxyMetrics as unknown as new (options?: ProxyMetricsOptions) => IProxyMetrics;
