import type { ChartDataPoint } from "../../lib/Indicators/TechnicalIndicators";
import { aggregateOhlcv, normalizeOhlcvSeries } from "./ohlcvAggregation";
import {
  canAggregateTimeframe,
  getTimeframeSeconds,
  normalizeChartTimeframe,
  type ChartTimeframe,
  type TimeframeDataSourceKind,
} from "./timeframeCatalog";

export interface TimeframeSeriesResolution {
  timeframe: ChartTimeframe;
  source: TimeframeDataSourceKind;
  series: ChartDataPoint[];
  nativeError: unknown | null;
}

export type TimeframeSeriesFetcher = (apiTimeframeSeconds: number) => Promise<ChartDataPoint[]>;

const normalizeFetchedSeries = (series: ChartDataPoint[]): ChartDataPoint[] =>
  normalizeOhlcvSeries(Array.isArray(series) ? series : []);

export const loadTimeframeSeries = async (
  requestedTimeframe: unknown,
  fetchSeries: TimeframeSeriesFetcher,
): Promise<TimeframeSeriesResolution> => {
  const timeframe = normalizeChartTimeframe(requestedTimeframe);
  if (!timeframe) throw new Error("Unsupported chart timeframe.");

  const apiTimeframe = getTimeframeSeconds(timeframe);
  if (apiTimeframe === null) throw new Error("Timeframe API mapping is unavailable.");

  let nativeError: unknown | null = null;
  try {
    const nativeSeries = normalizeFetchedSeries(await fetchSeries(apiTimeframe));
    if (nativeSeries.length > 0) {
      return { timeframe, source: "native", series: nativeSeries, nativeError: null };
    }
  } catch (error: unknown) {
    nativeError = error;
    if (!canAggregateTimeframe(timeframe)) throw error;
  }

  if (!canAggregateTimeframe(timeframe)) {
    return { timeframe, source: "unavailable", series: [], nativeError };
  }

  const dailySeries = normalizeFetchedSeries(await fetchSeries(86400));
  const aggregated = aggregateOhlcv(dailySeries, timeframe);
  return {
    timeframe,
    source: aggregated.length > 0 ? "aggregate" : "unavailable",
    series: aggregated,
    nativeError,
  };
};
