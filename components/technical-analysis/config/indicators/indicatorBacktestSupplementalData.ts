import type { ChartDataPoint } from "../../lib/Indicators/TechnicalIndicators";
import {
  normalizeBacktestSymbol,
  type IndicatorBacktestBatchInput,
} from "./indicatorBacktestBatchCache";

export type IndicatorBacktestSupplementalSeriesBySymbol = Readonly<Record<string, readonly ChartDataPoint[] | undefined>>;

const MAX_SUPPLEMENTAL_BACKTEST_TICKERS = 5;

export const selectMissingIndicatorBacktestSupplementalSymbols = (
  primarySymbol: string,
  comparisons: readonly IndicatorBacktestBatchInput[],
  supplementalSeriesBySymbol: IndicatorBacktestSupplementalSeriesBySymbol = {},
  maxSymbols = MAX_SUPPLEMENTAL_BACKTEST_TICKERS,
): string[] => {
  const primary = normalizeBacktestSymbol(primarySymbol);
  const missing: string[] = [];
  const seen = new Set([primary]);

  for (const comparison of comparisons) {
    const symbol = normalizeBacktestSymbol(comparison.symbol);
    if (seen.has(symbol)) continue;
    seen.add(symbol);
    if (comparison.data.length > 0) continue;
    if ((supplementalSeriesBySymbol[symbol]?.length ?? 0) > 0) continue;
    missing.push(symbol);
    if (missing.length >= maxSymbols) break;
  }

  return missing;
};

export const mergeIndicatorBacktestSupplementalInputs = (
  comparisons: readonly IndicatorBacktestBatchInput[],
  supplementalSeriesBySymbol: IndicatorBacktestSupplementalSeriesBySymbol = {},
): IndicatorBacktestBatchInput[] => comparisons.map((comparison) => {
  const symbol = normalizeBacktestSymbol(comparison.symbol);
  const supplementalData = supplementalSeriesBySymbol[symbol] ?? [];
  return {
    data: comparison.data.length > 0 ? comparison.data : supplementalData,
    symbol,
  };
});
