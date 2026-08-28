import type { IndiceCoursEntity } from "@/core/domain/entities/indice.entity";
import type { ChartDataPoint } from "../../lib/Indicators/TechnicalIndicators";
import { aggregateOhlcv, normalizeOhlcvSeries } from "./ohlcvAggregation";
import { normalizeChartTimeframe, type ChartTimeframe, type TimeframeDataSourceKind } from "./timeframeCatalog";

export interface IndexSeriesResolution {
  timeframe: ChartTimeframe;
  source: TimeframeDataSourceKind;
  series: ChartDataPoint[];
}

export const indiceCoursToLineChartData = (
  source: readonly IndiceCoursEntity[],
): ChartDataPoint[] => {
  const points: ChartDataPoint[] = [];
  for (const item of source) {
    const timestamp = Date.parse(String(item?.timestamp ?? ""));
    const close = Number(item?.close);
    if (!Number.isFinite(timestamp) || !Number.isFinite(close)) continue;
    points.push({
      time: new Date(timestamp).toISOString(),
      open: close,
      high: close,
      low: close,
      close,
      volume: 0,
      tradesCount: null,
    });
  }
  return normalizeOhlcvSeries(points);
};

export const resolveIndexTimeframeSeries = (
  timeframe: unknown,
  dailySeries: readonly ChartDataPoint[],
): IndexSeriesResolution | null => {
  const normalized = normalizeChartTimeframe(timeframe);
  if (!normalized) return null;
  const daily = normalizeOhlcvSeries(dailySeries);
  if (daily.length === 0) return { timeframe: normalized, source: "unavailable", series: [] };
  if (normalized === "1D") return { timeframe: normalized, source: "native", series: daily };
  if (normalized === "1W" || normalized === "1M") {
    return { timeframe: normalized, source: "aggregate", series: aggregateOhlcv(daily, normalized) };
  }
  return { timeframe: normalized, source: "unavailable", series: [] };
};
