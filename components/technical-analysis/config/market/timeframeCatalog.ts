import { createMarketDataCacheKey } from "./marketDataCacheKey";

export const CHART_TIMEFRAMES = ["1m", "5m", "15m", "30m", "1H", "4H", "1D", "1W", "1M"] as const;

export type ChartTimeframe = (typeof CHART_TIMEFRAMES)[number];
export type TimeframeDataSourceKind = "native" | "aggregate" | "unavailable";

export interface TimeframeDefinition {
  timeframe: ChartTimeframe;
  seconds: 60 | 300 | 900 | 1800 | 3600 | 14400 | 86400 | 604800 | 2592000;
  label: string;
  querySupported: true;
  aggregationSource?: "1D";
}

export type TimeframeDataStrategy =
  | { kind: "native"; timeframe: ChartTimeframe; apiTimeframe: number }
  | { kind: "aggregate"; timeframe: "1W" | "1M"; sourceTimeframe: "1D"; sourceApiTimeframe: 86400 }
  | { kind: "unavailable"; timeframe: ChartTimeframe; apiTimeframe: number };

export const TIMEFRAME_DEFINITIONS: Record<ChartTimeframe, TimeframeDefinition> = {
  "1m": { timeframe: "1m", seconds: 60, label: "1 min", querySupported: true },
  "5m": { timeframe: "5m", seconds: 300, label: "5 min", querySupported: true },
  "15m": { timeframe: "15m", seconds: 900, label: "15 min", querySupported: true },
  "30m": { timeframe: "30m", seconds: 1800, label: "30 min", querySupported: true },
  "1H": { timeframe: "1H", seconds: 3600, label: "1 heure", querySupported: true },
  "4H": { timeframe: "4H", seconds: 14400, label: "4 heures", querySupported: true },
  "1D": { timeframe: "1D", seconds: 86400, label: "1 jour", querySupported: true },
  "1W": { timeframe: "1W", seconds: 604800, label: "1 semaine", querySupported: true, aggregationSource: "1D" },
  "1M": { timeframe: "1M", seconds: 2592000, label: "1 mois", querySupported: true, aggregationSource: "1D" },
};

export const normalizeChartTimeframe = (value: unknown): ChartTimeframe | null => {
  if (typeof value !== "string" || value.length === 0) return null;
  switch (value) {
    case "1m": return "1m";
    case "5m": return "5m";
    case "15m": return "15m";
    case "30m": return "30m";
    case "1h":
    case "1H": return "1H";
    case "4h":
    case "4H": return "4H";
    case "1d":
    case "1D": return "1D";
    case "1w":
    case "1W": return "1W";
    case "1M": return "1M";
    default: return null;
  }
};

export const isChartTimeframe = (value: unknown): value is ChartTimeframe =>
  normalizeChartTimeframe(value) !== null;

export const getTimeframeSeconds = (value: unknown): number | null => {
  const timeframe = normalizeChartTimeframe(value);
  return timeframe ? TIMEFRAME_DEFINITIONS[timeframe].seconds : null;
};

export const getTimeframeDurationDays = (value: unknown): number => {
  const seconds = getTimeframeSeconds(value);
  return seconds === null ? 1 : seconds / 86400;
};

export const canAggregateTimeframe = (value: unknown): value is "1W" | "1M" => {
  const timeframe = normalizeChartTimeframe(value);
  return timeframe === "1W" || timeframe === "1M";
};

export const resolveTimeframeDataStrategy = (
  value: unknown,
  nativeCount: number,
): TimeframeDataStrategy | null => {
  const timeframe = normalizeChartTimeframe(value);
  if (!timeframe) return null;
  const definition = TIMEFRAME_DEFINITIONS[timeframe];
  const hasNativeData = Number.isSafeInteger(nativeCount) && nativeCount > 0;
  if (hasNativeData) {
    return { kind: "native", timeframe, apiTimeframe: definition.seconds };
  }
  if (definition.aggregationSource === "1D" && canAggregateTimeframe(timeframe)) {
    return {
      kind: "aggregate",
      timeframe,
      sourceTimeframe: "1D",
      sourceApiTimeframe: 86400,
    };
  }
  return { kind: "unavailable", timeframe, apiTimeframe: definition.seconds };
};

export const createTimeframeMarketDataCacheKey = (
  market: string | null | undefined,
  symbol: string | null | undefined,
  timeframe?: string | null,
  sourceKind: "equity" | "index" = "equity",
  sourceId?: string | null,
): string => {
  const baseKey = createMarketDataCacheKey(market, symbol);
  const normalizedTimeframe = normalizeChartTimeframe(timeframe);
  if (!baseKey) return baseKey;
  const sourceSuffix = sourceKind === "index"
    ? `::index:${String(sourceId ?? "").trim() || "unresolved"}`
    : "";
  const timeframeSuffix = normalizedTimeframe && normalizedTimeframe !== "1D"
    ? `::${normalizedTimeframe}`
    : "";
  return `${baseKey}${sourceSuffix}${timeframeSuffix}`;
};

export const getSelectableTimeframes = (): readonly ChartTimeframe[] => CHART_TIMEFRAMES;
