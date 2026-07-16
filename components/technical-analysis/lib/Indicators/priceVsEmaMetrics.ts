import type { PriceVsEmaMetricState, PriceVsEmaQualityTone } from "../../config/indicators/advancedIndicatorsTypes";
import type { LiveSnapshot } from "../../config/market/marketSnapshotTypes";
import {
  PRICE_VS_EMA_METRIC_SPECS,
  type PriceVsEmaMetricSpec,
} from "../../config/indicators/priceVsEmaMetrics";
import type { ChartDataPoint } from "./TechnicalIndicators";

export interface PriceVsEmaMetricResult {
  spec: PriceVsEmaMetricSpec;
  state: PriceVsEmaMetricState;
  close: number | null;
  ema: number | null;
  distance: number | null;
  distancePercent: number | null;
  epsilonPercent: number | null;
  tickSize: number | null;
  availableBars: number;
  requiredBars: number;
  signalBarTimestamp: string | null;
  timeframe: string;
  isConfirmedBar: boolean;
  qualityLabel: string;
  qualityTone: PriceVsEmaQualityTone;
  reason: string;
}

const MIN_VOLUME_LIQUIDITY_RATIO = 0.2;
const TICK_INFERENCE_LOOKBACK = 500;
const DEFAULT_TIMEFRAME_MS = 24 * 60 * 60 * 1000;

const isFinitePositive = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const getFiniteCloseSeries = (chartData: ChartDataPoint[], liveSnapshot?: LiveSnapshot | null): number[] => {
  const closes = chartData
    .map((point) => point.close)
    .filter((close): close is number => Number.isFinite(close));
  const livePrice = liveSnapshot?.price;

  if (closes.length > 0 && isFinitePositive(livePrice)) {
    closes[closes.length - 1] = livePrice;
  }

  return closes;
};

const calculateInitialSma = (closes: number[], period: number): number => {
  let sum = 0;
  for (let index = 0; index < period; index++) {
    sum += closes[index];
  }
  return sum / period;
};

const calculateEmaExact = (closes: number[], period: number): number | null => {
  if (closes.length < period) return null;

  const alpha = 2 / (period + 1);
  let ema = calculateInitialSma(closes, period);

  for (let index = period; index < closes.length; index++) {
    ema = closes[index] * alpha + ema * (1 - alpha);
  }

  return ema;
};

const inferTickSize = (chartData: ChartDataPoint[]): number | null => {
  const values = new Set<number>();
  const startIndex = Math.max(0, chartData.length - TICK_INFERENCE_LOOKBACK);

  for (let index = startIndex; index < chartData.length; index++) {
    const point = chartData[index];
    [point.open, point.high, point.low, point.close].forEach((value) => {
      if (isFinitePositive(value)) values.add(value);
    });
  }

  const sorted = Array.from(values).sort((a, b) => a - b);
  let minDiff = Number.POSITIVE_INFINITY;

  for (let index = 1; index < sorted.length; index++) {
    const diff = sorted[index] - sorted[index - 1];
    if (diff > 0 && diff < minDiff) minDiff = diff;
  }

  if (Number.isFinite(minDiff)) return minDiff;
  const latestClose = chartData[chartData.length - 1]?.close;
  if (!Number.isFinite(latestClose)) return null;
  return Math.abs(latestClose) >= 1 ? 1 : 0.01;
};

const parseTimestampMs = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string" || value.trim().length === 0) return null;

  const numeric = Number(value);
  if (Number.isFinite(numeric)) return numeric;

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const timeframeToMs = (timeframe: string): number => {
  const normalized = timeframe.trim().toUpperCase();
  const match = normalized.match(/^(\d+)?([MHDW])$/);
  if (!match) return DEFAULT_TIMEFRAME_MS;

  const amount = Math.max(1, Number(match[1] ?? 1));
  const unit = match[2];
  if (unit === "M") return amount * 60 * 1000;
  if (unit === "H") return amount * 60 * 60 * 1000;
  if (unit === "D") return amount * DEFAULT_TIMEFRAME_MS;
  return amount * 7 * DEFAULT_TIMEFRAME_MS;
};

const resolveMetricState = (
  distancePercent: number | null,
  epsilonPercent: number | null,
): PriceVsEmaMetricState => {
  if (distancePercent === null || epsilonPercent === null) return "unknown";
  if (Math.abs(distancePercent) <= epsilonPercent) return "neutral";
  return distancePercent > 0 ? "above" : "below";
};

const resolveLiquidityQuality = (
  chartData: ChartDataPoint[],
  liveSnapshot: LiveSnapshot | null | undefined,
  isConfirmedBar: boolean,
  timeframe: string,
): { label: string; tone: PriceVsEmaQualityTone } => {
  if (chartData.length === 0) return { label: "Historique insuffisant", tone: "danger" };

  const latestTimestamp = parseTimestampMs(chartData[chartData.length - 1]?.time);
  if (latestTimestamp !== null) {
    const maxAgeMs = Math.max(timeframeToMs(timeframe) * 3, 7 * DEFAULT_TIMEFRAME_MS);
    if (Date.now() - latestTimestamp > maxAgeMs) {
      return { label: "Dernière transaction ancienne", tone: "warning" };
    }
  }

  const recent = chartData.slice(-30);
  const liveVolume = liveSnapshot?.volume;
  const latestVolume = isFinitePositive(liveVolume)
    ? liveVolume
    : chartData[chartData.length - 1]?.volume;
  const validVolumes = recent.map((point) => point.volume).filter(isFinitePositive);
  const averageVolume = validVolumes.reduce((sum, volume) => sum + volume, 0) / (validVolumes.length || 1);

  if (!isFinitePositive(latestVolume) || !isFinitePositive(averageVolume)) {
    return { label: "Signal à faible liquidité", tone: "warning" };
  }

  if (latestVolume < averageVolume * MIN_VOLUME_LIQUIDITY_RATIO) {
    return { label: "Signal à faible liquidité", tone: "warning" };
  }

  return isConfirmedBar
    ? { label: "Signal fiable", tone: "success" }
    : { label: "Signal live", tone: "warning" };
};

export const calculatePriceVsEmaMetrics = (
  chartData: ChartDataPoint[],
  liveSnapshot?: LiveSnapshot | null,
  timeframe = "1D",
): PriceVsEmaMetricResult[] => {
  const closes = getFiniteCloseSeries(chartData, liveSnapshot);
  const close = closes.length > 0 ? closes[closes.length - 1] : null;
  const tickSize = inferTickSize(chartData);
  const signalBarTimestamp = liveSnapshot?.lastUpdate ?? chartData[chartData.length - 1]?.time ?? null;
  const isConfirmedBar = !isFinitePositive(liveSnapshot?.price);
  const quality = resolveLiquidityQuality(chartData, liveSnapshot, isConfirmedBar, timeframe);

  return PRICE_VS_EMA_METRIC_SPECS.map((spec) => {
    const ema = calculateEmaExact(closes, spec.period);
    const distance = close !== null && ema !== null ? close - ema : null;
    const distancePercent = distance !== null && ema !== null && ema !== 0 ? (distance / ema) * 100 : null;
    const epsilonPercent = tickSize !== null && ema !== null && ema !== 0 ? (tickSize / ema) * 100 : null;
    const state = resolveMetricState(distancePercent, epsilonPercent);

    if (close === null) {
      return {
        spec,
        state: "unknown",
        close: null,
        ema: null,
        distance: null,
        distancePercent: null,
        epsilonPercent: null,
        tickSize,
        availableBars: closes.length,
        requiredBars: spec.period,
        signalBarTimestamp,
        timeframe,
        isConfirmedBar,
        qualityLabel: "Historique insuffisant",
        qualityTone: "danger",
        reason: "Aucun close exploitable pour calculer la distance prix/EMA.",
      };
    }

    if (ema === null || distance === null || distancePercent === null || epsilonPercent === null) {
      return {
        spec,
        state: "unknown",
        close,
        ema,
        distance: null,
        distancePercent: null,
        epsilonPercent,
        tickSize,
        availableBars: closes.length,
        requiredBars: spec.period,
        signalBarTimestamp,
        timeframe,
        isConfirmedBar,
        qualityLabel: "Historique insuffisant",
        qualityTone: "danger",
        reason: `Il faut ${spec.period} bougies clôturées de la timeframe ${timeframe}; ${closes.length} disponibles.`,
      };
    }

    return {
      spec,
      state,
      close,
      ema,
      distance,
      distancePercent,
      epsilonPercent,
      tickSize,
      availableBars: closes.length,
      requiredBars: spec.period,
      signalBarTimestamp,
      timeframe,
      isConfirmedBar,
      qualityLabel: quality.label,
      qualityTone: quality.tone,
      reason: `${spec.label} = ((Close - ${spec.shortLabel}) / ${spec.shortLabel}) × 100 sur la timeframe ${timeframe}; ${spec.shortLabel} est initialisée par SMA${spec.period}.`,
    };
  });
};
