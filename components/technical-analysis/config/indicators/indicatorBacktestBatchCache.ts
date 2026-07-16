import type { ChartDataPoint } from "../../lib/Indicators/TechnicalIndicators";
import type { IndicatorPeriods } from "./advancedIndicatorsTypes";

export interface IndicatorBacktestBatchInput {
  data: readonly ChartDataPoint[];
  symbol: string;
}

export interface IndicatorBacktestCacheDescriptor extends IndicatorBacktestBatchInput {
  cacheKey: string;
}

const MAX_BACKTEST_BATCH_TICKERS = 6;
const MAX_FINGERPRINT_BARS = 360;
const BACKTEST_WORKER_TIMEOUT_BASE_MS = 4_000;
const BACKTEST_WORKER_TIMEOUT_PER_1000_CANDLES_MS = 1_200;
const BACKTEST_WORKER_TIMEOUT_MAX_MS = 30_000;
const HASH_OFFSET = 2166136261;
const HASH_PRIME = 16777619;

export const normalizeIndicatorBacktestBatchInputs = (
  primary: IndicatorBacktestBatchInput,
  comparisons: readonly IndicatorBacktestBatchInput[] = [],
): IndicatorBacktestBatchInput[] => {
  const inputs: IndicatorBacktestBatchInput[] = [];
  const seen = new Set<string>();
  pushBatchInput(inputs, seen, primary, true);
  comparisons.forEach((candidate) => pushBatchInput(inputs, seen, candidate, false));
  return inputs.slice(0, MAX_BACKTEST_BATCH_TICKERS);
};

export const createIndicatorBacktestCacheDescriptor = (
  input: IndicatorBacktestBatchInput,
  indicatorPeriods: IndicatorPeriods,
): IndicatorBacktestCacheDescriptor => ({
  data: input.data,
  symbol: normalizeBacktestSymbol(input.symbol),
  cacheKey: createIndicatorBacktestCacheKey(input, indicatorPeriods),
});

export const createIndicatorBacktestCacheKey = (
  input: IndicatorBacktestBatchInput,
  indicatorPeriods: IndicatorPeriods,
): string => [
  normalizeBacktestSymbol(input.symbol),
  createIndicatorPeriodsFingerprint(indicatorPeriods),
  createChartDataFingerprint(input.data),
].join(":");

export const normalizeBacktestSymbol = (symbol: string): string => {
  const normalized = symbol.trim().toUpperCase();
  return normalized.length > 0 ? normalized : "UNKNOWN";
};

export const resolveIndicatorBacktestWorkerTimeoutMs = (
  inputs: readonly IndicatorBacktestBatchInput[],
): number => {
  const candleCount = inputs.reduce((total, input) => total + Math.max(0, input.data.length), 0);
  const scaledTimeout = BACKTEST_WORKER_TIMEOUT_BASE_MS
    + Math.ceil(candleCount / 1_000) * BACKTEST_WORKER_TIMEOUT_PER_1000_CANDLES_MS;

  return Math.min(BACKTEST_WORKER_TIMEOUT_MAX_MS, Math.max(BACKTEST_WORKER_TIMEOUT_BASE_MS, scaledTimeout));
};

const pushBatchInput = (
  inputs: IndicatorBacktestBatchInput[],
  seen: Set<string>,
  input: IndicatorBacktestBatchInput,
  allowEmpty: boolean,
): void => {
  const symbol = normalizeBacktestSymbol(input.symbol);
  if (seen.has(symbol)) return;
  if (!allowEmpty && input.data.length === 0) return;
  seen.add(symbol);
  inputs.push({ data: input.data, symbol });
};

const createIndicatorPeriodsFingerprint = (periods: IndicatorPeriods): string => (
  `${periods.sma1}|${periods.sma2}|${periods.sma3}|${periods.rsiPeriod}`
);

const createChartDataFingerprint = (data: readonly ChartDataPoint[]): string => {
  const start = Math.max(0, data.length - MAX_FINGERPRINT_BARS);
  let hash = updateHash(HASH_OFFSET, `${data.length}|${start}`);
  for (let index = start; index < data.length; index += 1) {
    hash = updateHash(hash, formatPointForHash(data[index]));
  }
  return hash.toString(36);
};

const formatPointForHash = (point: ChartDataPoint): string => [
  point.time,
  formatNumberForHash(point.open),
  formatNumberForHash(point.high),
  formatNumberForHash(point.low),
  formatNumberForHash(point.close),
  formatNumberForHash(point.volume),
  formatNumberForHash(point.tradesCount ?? point.trades_count ?? null),
].join(",");

const formatNumberForHash = (value: number | null | undefined): string => (
  typeof value === "number" && Number.isFinite(value) ? value.toFixed(4) : "x"
);

const updateHash = (current: number, value: string): number => {
  let hash = current >>> 0;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, HASH_PRIME) >>> 0;
  }
  return hash;
};
