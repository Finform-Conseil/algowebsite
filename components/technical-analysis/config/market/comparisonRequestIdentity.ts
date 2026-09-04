import { normalizeMarketDataScope } from "./marketDataCacheKey";
import {
  createTimeframeMarketDataCacheKey,
  normalizeChartTimeframe,
  type ChartTimeframe,
} from "./timeframeCatalog";

export interface ComparisonMarketRequest {
  symbol: string;
  market: string;
  timeframe?: string;
  sourceKind?: "equity" | "index";
  sourceId?: string;
}

export interface NormalizedComparisonMarketRequest {
  symbol: string;
  market: string;
  timeframe: ChartTimeframe;
  sourceKind: "equity" | "index";
  sourceId: string;
}

/**
 * Produces the canonical data-subscription set for peer charts.
 *
 * UI-only state (viewport, active styling, drawing state, etc.) must never enter
 * this identity. The returned order is deterministic so React effects can depend
 * on the serialized key rather than on freshly allocated layout objects.
 */
export const normalizeComparisonRequests = (
  requests: readonly ComparisonMarketRequest[],
): NormalizedComparisonMarketRequest[] => {
  const unique = new Map<string, NormalizedComparisonMarketRequest>();

  for (const request of requests) {
    const symbol = String(request?.symbol ?? "").trim().toUpperCase();
    const market = normalizeMarketDataScope(request?.market);
    const timeframe = normalizeChartTimeframe(request?.timeframe ?? "1D");
    const sourceKind = request?.sourceKind === "index" ? "index" : "equity";
    const sourceId = String(request?.sourceId ?? "").trim();

    if (!symbol || !market || !timeframe) continue;
    if (sourceKind === "index" && !sourceId) continue;

    const requestKey = createTimeframeMarketDataCacheKey(
      market,
      symbol,
      timeframe,
      sourceKind,
      sourceId,
    );
    unique.set(requestKey, { symbol, market, timeframe, sourceKind, sourceId });
  }

  return Array.from(unique.entries())
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([, request]) => request);
};

/**
 * Stable semantic identity for the whole peer-data subscription set.
 * Equivalent requests always yield the same primitive key even when Redux or
 * React reconstructs the surrounding layout objects during zoom/pan updates.
 */
export const createComparisonRequestSetKey = (
  requests: readonly ComparisonMarketRequest[],
): string => JSON.stringify(normalizeComparisonRequests(requests));

export const parseComparisonRequestSetKey = (
  key: string,
): NormalizedComparisonMarketRequest[] => {
  if (!key) return [];
  const parsed = JSON.parse(key) as unknown;
  if (!Array.isArray(parsed)) return [];
  return parsed as NormalizedComparisonMarketRequest[];
};
