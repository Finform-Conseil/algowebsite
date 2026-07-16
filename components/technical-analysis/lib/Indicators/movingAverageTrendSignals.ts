import type { LiveSnapshot } from "../../config/market/marketSnapshotTypes";
import {
  MOVING_AVERAGE_TREND_SIGNAL_SPECS,
  type MovingAverageTrendSignalSpec,
} from "../../config/indicators/movingAverageSeries";
import type { ChartDataPoint } from "./TechnicalIndicators";

export type MovingAverageTrendState = "above" | "below" | "neutral" | "unknown";
export type MovingAverageTrendQualityTone = "success" | "warning" | "danger" | "muted";

export interface MovingAverageTrendSignalResult {
  spec: MovingAverageTrendSignalSpec;
  state: MovingAverageTrendState;
  close: number | null;
  average: number | null;
  distance: number | null;
  distancePercent: number | null;
  tickSize: number | null;
  epsilon: number | null;
  availableBars: number;
  requiredBars: number;
  signalBarTimestamp: string | null;
  isConfirmedBar: boolean;
  qualityLabel: string;
  qualityTone: MovingAverageTrendQualityTone;
  reason: string;
}

const MIN_VOLUME_LIQUIDITY_RATIO = 0.2;
const TICK_INFERENCE_LOOKBACK = 500;

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

const calculateSmaExact = (closes: number[], period: number): number | null => {
  if (closes.length < period) return null;

  let sum = 0;
  for (let index = closes.length - period; index < closes.length; index++) {
    sum += closes[index];
  }

  return sum / period;
};

const calculateEmaExact = (closes: number[], period: number): number | null => {
  if (closes.length < period) return null;

  let ema = 0;
  for (let index = 0; index < period; index++) {
    ema += closes[index];
  }
  ema /= period;

  const multiplier = 2 / (period + 1);
  for (let index = period; index < closes.length; index++) {
    ema = (closes[index] - ema) * multiplier + ema;
  }

  return ema;
};

const inferTickSize = (chartData: ChartDataPoint[]): number | null => {
  const values = new Set<number>();
  const startIndex = Math.max(0, chartData.length - TICK_INFERENCE_LOOKBACK);

  for (let index = startIndex; index < chartData.length; index++) {
    const point = chartData[index];
    [point.open, point.high, point.low, point.close].forEach((value) => {
      if (Number.isFinite(value) && value > 0) values.add(value);
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

const resolveTrendState = (close: number, average: number, epsilon: number): MovingAverageTrendState => {
  if (close > average + epsilon) return "above";
  if (close < average - epsilon) return "below";
  return "neutral";
};

const resolveSignalAverage = (
  spec: MovingAverageTrendSignalSpec,
  closes: number[],
): number | null => spec.family === "sma"
  ? calculateSmaExact(closes, spec.period)
  : calculateEmaExact(closes, spec.period);

const resolveLiquidityQuality = (
  chartData: ChartDataPoint[],
  liveSnapshot: LiveSnapshot | null | undefined,
  isConfirmedBar: boolean,
): { label: string; tone: MovingAverageTrendQualityTone } => {
  if (chartData.length === 0) return { label: "Historique indisponible", tone: "danger" };

  const recent = chartData.slice(-30);
  const liveVolume = liveSnapshot?.volume;
  const latestVolume = isFinitePositive(liveVolume)
    ? liveVolume
    : chartData[chartData.length - 1]?.volume;
  const validVolumes = recent.map((point) => point.volume).filter(isFinitePositive);
  const averageVolume = validVolumes.reduce((sum, volume) => sum + volume, 0) / (validVolumes.length || 1);

  if (!isFinitePositive(latestVolume) || !isFinitePositive(averageVolume)) {
    return { label: "Liquidité non prouvée", tone: "warning" };
  }

  if (latestVolume < averageVolume * MIN_VOLUME_LIQUIDITY_RATIO) {
    return { label: "Donnée peu liquide", tone: "warning" };
  }

  return isConfirmedBar
    ? { label: "Signal confirmé", tone: "success" }
    : { label: "Signal live", tone: "warning" };
};

export const calculateMovingAverageTrendSignals = (
  chartData: ChartDataPoint[],
  liveSnapshot?: LiveSnapshot | null,
): MovingAverageTrendSignalResult[] => {
  const closes = getFiniteCloseSeries(chartData, liveSnapshot);
  const close = closes.length > 0 ? closes[closes.length - 1] : null;
  const tickSize = inferTickSize(chartData);
  const epsilon = tickSize !== null ? tickSize / 2 : null;
  const signalBarTimestamp = liveSnapshot?.lastUpdate ?? chartData[chartData.length - 1]?.time ?? null;
  const isConfirmedBar = !isFinitePositive(liveSnapshot?.price);
  const quality = resolveLiquidityQuality(chartData, liveSnapshot, isConfirmedBar);

  return MOVING_AVERAGE_TREND_SIGNAL_SPECS.map((spec) => {
    const average = resolveSignalAverage(spec, closes);

    if (close === null) {
      return {
        spec,
        state: "unknown",
        close: null,
        average: null,
        distance: null,
        distancePercent: null,
        tickSize,
        epsilon,
        availableBars: closes.length,
        requiredBars: spec.period,
        signalBarTimestamp,
        isConfirmedBar,
        qualityLabel: "Historique indisponible",
        qualityTone: "danger",
        reason: "Aucun close exploitable pour ce symbole.",
      };
    }

    if (average === null || epsilon === null) {
      return {
        spec,
        state: "unknown",
        close,
        average,
        distance: null,
        distancePercent: null,
        tickSize,
        epsilon,
        availableBars: closes.length,
        requiredBars: spec.period,
        signalBarTimestamp,
        isConfirmedBar,
        qualityLabel: "Historique insuffisant",
        qualityTone: "danger",
        reason: `Il faut ${spec.period} bougies de la timeframe courante; ${closes.length} disponibles.`,
      };
    }

    const distance = close - average;
    const distancePercent = average !== 0 ? (distance / average) * 100 : null;

    return {
      spec,
      state: resolveTrendState(close, average, epsilon),
      close,
      average,
      distance,
      distancePercent,
      tickSize,
      epsilon,
      availableBars: closes.length,
      requiredBars: spec.period,
      signalBarTimestamp,
      isConfirmedBar,
      qualityLabel: quality.label,
      qualityTone: quality.tone,
      reason: `${spec.label} calcule le close courant contre ${spec.shortLabel} sur ${spec.period} bougies.`,
    };
  });
};
