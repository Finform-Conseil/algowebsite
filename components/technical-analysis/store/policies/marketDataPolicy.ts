import type { LiveSnapshot } from "../../config/market/marketSnapshotTypes";
import { normalizeMarketDataScope } from "../../config/market/marketDataCacheKey";
import { normalizeChartTimeframe } from "../../config/market/timeframeCatalog";
import type { ChartDataPoint } from "../../lib/Indicators/TechnicalIndicators";
import { normalizeChartSymbol } from "./chartConfigPolicy";

type RequiredSnapshotNumbers = Pick<LiveSnapshot, "price" | "prevClose" | "open" | "high" | "low">;
type NumericSnapshotKey = "volume" | "marketCap" | "sharesCount" | "peRatio" | "returnYTD";
type NullableCountKey = "tradesCount" | "trades_count";

const normalizeFiniteNumber = (value: unknown): number | null => (
  typeof value === "number" && Number.isFinite(value) ? value : null
);

const normalizeNonNegativeFiniteNumber = (value: unknown): number | null => {
  const normalized = normalizeFiniteNumber(value);
  if (normalized === null || normalized < 0) return null;
  return normalized;
};

const normalizeOptionalFiniteNumber = (value: unknown, allowNegative = false): number | undefined | null => {
  if (value === undefined) return undefined;
  const normalized = normalizeFiniteNumber(value);
  if (normalized === null) return null;
  if (!allowNegative && normalized < 0) return null;
  return normalized;
};

const normalizeOptionalCount = (value: unknown): number | null | undefined => {
  if (value === undefined || value === null) return value;
  const normalized = normalizeFiniteNumber(value);
  return normalized !== null && normalized >= 0 ? normalized : null;
};

const normalizeRequiredSnapshotNumbers = (snapshot: LiveSnapshot): RequiredSnapshotNumbers | null => {
  const price = normalizeNonNegativeFiniteNumber(snapshot.price);
  const prevClose = normalizeNonNegativeFiniteNumber(snapshot.prevClose);
  const open = normalizeNonNegativeFiniteNumber(snapshot.open);
  const high = normalizeNonNegativeFiniteNumber(snapshot.high);
  const low = normalizeNonNegativeFiniteNumber(snapshot.low);

  if (price === null || prevClose === null || open === null || high === null || low === null) return null;
  return { price, prevClose, open, high, low };
};

const applyOptionalNumericFields = (target: LiveSnapshot, source: LiveSnapshot): boolean => {
  const numericKeys: NumericSnapshotKey[] = ["volume", "marketCap", "sharesCount", "peRatio", "returnYTD"];
  for (const key of numericKeys) {
    const normalizedValue = normalizeOptionalFiniteNumber(source[key], key === "returnYTD");
    if (normalizedValue === null) return false;
    if (normalizedValue !== undefined) target[key] = normalizedValue;
  }
  return true;
};

const applyOptionalCountFields = (target: LiveSnapshot, source: LiveSnapshot): boolean => {
  const countKeys: NullableCountKey[] = ["tradesCount", "trades_count"];
  for (const key of countKeys) {
    const normalizedValue = normalizeOptionalCount(source[key]);
    if (normalizedValue === null && source[key] !== null) return false;
    if (normalizedValue !== undefined) target[key] = normalizedValue;
  }
  return true;
};

export const normalizeMarketSymbol = (symbol: string): string => normalizeChartSymbol(symbol);

export interface MarketDataPayload {
  symbol: string;
  data: ChartDataPoint[];
  market?: string;
  timeframe?: string;
  sourceKind?: "equity" | "index";
  sourceId?: string;
}

export const normalizeMarketDataPayload = (
  payload: MarketDataPayload,
): MarketDataPayload | null => {
  const symbol = normalizeMarketSymbol(payload.symbol);
  if (!symbol || !Array.isArray(payload.data)) return null;
  const market = normalizeMarketDataScope(payload.market);
  const timeframe = normalizeChartTimeframe(payload.timeframe ?? "1D") ?? "1D";
  const sourceKind = payload.sourceKind === "index" ? "index" : "equity";
  const sourceId = String(payload.sourceId ?? "").trim();
  if (sourceKind === "index" && !sourceId) return null;
  return {
    symbol,
    data: payload.data,
    ...(market ? { market } : {}),
    timeframe,
    sourceKind,
    ...(sourceId ? { sourceId } : {}),
  };
};

export const normalizeMarketSnapshotPayload = (
  payload: { symbol: string; snapshot: LiveSnapshot },
): { symbol: string; snapshot: LiveSnapshot } | null => {
  const symbol = normalizeMarketSymbol(payload.symbol || payload.snapshot.symbol);
  const requiredNumbers = normalizeRequiredSnapshotNumbers(payload.snapshot);
  const lastUpdate = typeof payload.snapshot.lastUpdate === "string" ? payload.snapshot.lastUpdate.trim() : "";

  if (!symbol || !requiredNumbers || typeof payload.snapshot.variation !== "string" || !lastUpdate) return null;

  const snapshot: LiveSnapshot = {
    ...payload.snapshot,
    ...requiredNumbers,
    symbol,
    variation: payload.snapshot.variation,
    lastUpdate,
  };

  if (!applyOptionalNumericFields(snapshot, payload.snapshot)) return null;
  if (!applyOptionalCountFields(snapshot, payload.snapshot)) return null;
  return { symbol, snapshot };
};
