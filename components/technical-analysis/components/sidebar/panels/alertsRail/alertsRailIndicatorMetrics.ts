import type { ChartDataPoint } from "../../../../lib/Indicators/TechnicalIndicators";
import type { SidebarTechnicalData } from "../../TechnicalAnalysisSidebar.types";
import { buildRuntimeIndicatorAlertValues } from "./alertsRailIndicatorMetricExtractors";
import type { IndicatorAlertValue } from "./alertsRailTypes";

export interface IndicatorAlertSeriesOptions {
  livePrice?: number | null;
  source?: string;
  timeframe?: string;
  updatedAt?: string;
}

const INDICATOR_SOURCE = "daily-series";
const INDICATOR_TIMEFRAME = "1D";

export const calculateAlertTechnicalSnapshot = (
  data: ChartDataPoint[],
  livePrice?: number | null,
): SidebarTechnicalData | null => {
  if (data.length < 50) return null;
  const latestClose = getClosePrice(data[data.length - 1]);
  const latestPrice = toPositiveFinite(livePrice) ?? latestClose;
  if (latestPrice === null) return null;

  const rsi = calculateLatestRsiValue(data, 14);
  const sma20 = calculateLatestSmaValue(data, 20);
  const sma50 = calculateLatestSmaValue(data, 50);
  if (rsi === null || sma20 === null || sma50 === null || sma50 <= 0 || sma20 <= 0) return null;

  const rsiScore = clampScore((rsi - 30) * 2.5);
  const trendScore = clampScore(50 + ((sma20 - sma50) / sma50) * 500);
  const priceScore = clampScore(50 + ((latestPrice - sma20) / sma20) * 1000);
  const score = clampScore(rsiScore * 0.4 + trendScore * 0.3 + priceScore * 0.3);
  const sentiment = score < 25 ? "Strong sell" : score < 45 ? "Sell" : score < 55 ? "Neutral" : score < 75 ? "Buy" : "Strong buy";
  return { rsi, score, sentiment, sma20, sma50 };
};

export const buildIndicatorAlertValuesFromSeries = (
  data: ChartDataPoint[],
  options: IndicatorAlertSeriesOptions = {},
): Record<string, IndicatorAlertValue> | undefined => {
  const source = options.source || INDICATOR_SOURCE;
  const timeframe = options.timeframe || INDICATOR_TIMEFRAME;
  const updatedAt = options.updatedAt || readLatestSeriesTime(data);
  const values = buildRuntimeIndicatorAlertValues(data, { source, timeframe, updatedAt });

  const current = calculateAlertTechnicalSnapshot(data, options.livePrice);
  if (current) {
    const previous = data.length > 1 ? calculateAlertTechnicalSnapshot(data.slice(0, -1), null) : null;
    if (!values["technical:rsi14"]) {
      values["technical:rsi14"] = buildIndicatorValue("technical:rsi14", "RSI 14", current.rsi, previous?.rsi ?? null, source, timeframe, updatedAt);
    }
    values["technical:score"] = buildIndicatorValue("technical:score", "Score technique", current.score, previous?.score ?? null, source, timeframe, updatedAt);
    values["technical:sma20"] = buildIndicatorValue("technical:sma20", "SMA 20", current.sma20, previous?.sma20 ?? null, source, timeframe, updatedAt);
    values["technical:sma50"] = buildIndicatorValue("technical:sma50", "SMA 50", current.sma50, previous?.sma50 ?? null, source, timeframe, updatedAt);
  }

  return Object.keys(values).length > 0 ? values : undefined;
};

const buildIndicatorValue = (
  key: string,
  label: string,
  value: number,
  previousValue: number | null,
  source: string,
  timeframe: string,
  updatedAt?: string,
): IndicatorAlertValue => ({
  key,
  label,
  previousValue,
  source,
  timeframe,
  ...(updatedAt ? { updatedAt } : {}),
  value,
});

const calculateLatestSmaValue = (data: ChartDataPoint[], period: number): number | null => {
  if (data.length < period) return null;
  let sum = 0;
  for (let index = data.length - period; index < data.length; index += 1) {
    const close = getClosePrice(data[index]);
    if (close === null) return null;
    sum += close;
  }
  return roundMetric(sum / period);
};

const calculateLatestRsiValue = (data: ChartDataPoint[], period: number): number | null => {
  if (data.length <= period) return null;
  let avgGain = 0;
  let avgLoss = 0;

  for (let index = 1; index <= period; index += 1) {
    const currentClose = getClosePrice(data[index]);
    const previousClose = getClosePrice(data[index - 1]);
    if (currentClose === null || previousClose === null) return null;
    const diff = currentClose - previousClose;
    if (diff >= 0) avgGain += diff;
    else avgLoss -= diff;
  }

  avgGain /= period;
  avgLoss /= period;
  let latestRsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let index = period + 1; index < data.length; index += 1) {
    const currentClose = getClosePrice(data[index]);
    const previousClose = getClosePrice(data[index - 1]);
    if (currentClose === null || previousClose === null) return null;
    const diff = currentClose - previousClose;
    avgGain = (avgGain * (period - 1) + (diff >= 0 ? diff : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (diff < 0 ? -diff : 0)) / period;
    latestRsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }

  return roundMetric(latestRsi);
};

const getClosePrice = (point: ChartDataPoint | undefined) => (
  point && Number.isFinite(point.close) && point.close > 0 ? point.close : null
);

const toPositiveFinite = (value: number | null | undefined) => (
  value !== null && value !== undefined && Number.isFinite(value) && value > 0 ? value : null
);

const clampScore = (value: number) => Math.max(0, Math.min(100, value));

const roundMetric = (value: number) => parseFloat(value.toFixed(2));

const readLatestSeriesTime = (data: ChartDataPoint[]) => {
  const time = data[data.length - 1]?.time;
  return typeof time === "string" && time.trim().length > 0 ? time : undefined;
};
