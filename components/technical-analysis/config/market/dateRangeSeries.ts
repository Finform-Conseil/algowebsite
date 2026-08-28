import type { ChartDataPoint } from "../../lib/Indicators/TechnicalIndicators";

export const CHART_DATE_RANGES = ["1J", "5J", "1M", "3M", "6M", "YTD", "1Y", "5Y", "Tout"] as const;
export type ChartDateRange = (typeof CHART_DATE_RANGES)[number];

const resolveDateRangeCutoff = (range: string, now: Date): Date | null => {
  const cutoff = new Date(now);
  switch (range) {
    case "1J":
      cutoff.setDate(cutoff.getDate() - 1);
      return cutoff;
    case "5J":
      cutoff.setDate(cutoff.getDate() - 5);
      return cutoff;
    case "1M":
      cutoff.setMonth(cutoff.getMonth() - 1);
      return cutoff;
    case "3M":
      cutoff.setMonth(cutoff.getMonth() - 3);
      return cutoff;
    case "6M":
      cutoff.setMonth(cutoff.getMonth() - 6);
      return cutoff;
    case "YTD":
      return new Date(now.getFullYear(), 0, 1);
    case "1Y":
      cutoff.setFullYear(cutoff.getFullYear() - 1);
      return cutoff;
    case "5Y":
      cutoff.setFullYear(cutoff.getFullYear() - 5);
      return cutoff;
    default:
      return null;
  }
};

export const filterChartDataByDateRange = (
  data: readonly ChartDataPoint[],
  range: string | null | undefined,
  now = new Date(),
): ChartDataPoint[] => {
  if (data.length === 0) return [];
  const normalizedRange = String(range ?? "Tout").trim() || "Tout";
  if (normalizedRange === "Tout") return data as ChartDataPoint[];
  const cutoff = resolveDateRangeCutoff(normalizedRange, now);
  if (!cutoff) return data as ChartDataPoint[];
  const cutoffTime = cutoff.getTime();
  const filtered = data.filter((point) => {
    const timestamp = Date.parse(String(point.time));
    return Number.isFinite(timestamp) && timestamp >= cutoffTime;
  });
  return filtered.length > 0 ? filtered : [data[data.length - 1]!];
};
