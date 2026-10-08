import type { ChartDataPoint } from "../Indicators/TechnicalIndicators";
import type { VolumeColorMode } from "../../config/state/chartStateTypes";

export type CandleDirection = 1 | -1;
export type DirectionalVolumeDataPoint = [number, number, CandleDirection];

export type DirectionalVolumeBarValue = number | "-" | [string, number | "-"];

export interface DirectionalVolumeBarDataItem {
  value: DirectionalVolumeBarValue;
  itemStyle: {
    color: string;
    opacity: number;
  };
}

export interface DirectionalCandleItemStyle {
  color: string;
  color0: string;
  borderColor: string;
  borderColor0: string;
}

export interface DirectionalCandlestickDataItem {
  value: [number, number, number, number];
  itemStyle: DirectionalCandleItemStyle;
}

export interface DirectionalOhlcvPalette {
  upColor: string;
  downColor: string;
}

export interface DirectionalOhlcvOptions extends DirectionalOhlcvPalette {
  volumeColorMode?: VolumeColorMode;
}

export interface DirectionalOhlcvSeries {
  dates: string[];
  directions: CandleDirection[];
  candleDirections: CandleDirection[];
  volumeDirections: CandleDirection[];
  candles: DirectionalCandlestickDataItem[];
  volumes: DirectionalVolumeDataPoint[];
}

const DEFAULT_CANDLE_DIRECTION: CandleDirection = 1;

// Vela 0.7.2 native Volume renderer contract.
export const VELA_VOLUME_OVERLAY_HEIGHT_FRAC = 0.20;
export const VELA_VOLUME_FILL_ALPHA = 0.5;
export const VELA_VOLUME_BAR_WIDTH_RATIO = 0.7;

export const resolveCandleDirection = (
  point: Pick<ChartDataPoint, "open" | "close">,
  previous: Pick<ChartDataPoint, "close"> | undefined,
  fallbackDirection: CandleDirection = DEFAULT_CANDLE_DIRECTION
): CandleDirection => {
  if (point.close > point.open) return 1;
  if (point.close < point.open) return -1;
  if (previous && point.close > previous.close) return 1;
  if (previous && point.close < previous.close) return -1;
  return fallbackDirection;
};

export const buildCandleDirections = (points: ChartDataPoint[]): CandleDirection[] => {
  let lastDirection: CandleDirection = DEFAULT_CANDLE_DIRECTION;

  return points.map((point, index) => {
    const direction = resolveCandleDirection(point, points[index - 1], lastDirection);
    lastDirection = direction;
    return direction;
  });
};

export const buildSessionChangeDirections = (points: ChartDataPoint[]): CandleDirection[] => {
  let lastDirection: CandleDirection = DEFAULT_CANDLE_DIRECTION;

  return points.map((point, index) => {
    const previous = points[index - 1];
    if (previous && point.close > previous.close) {
      lastDirection = 1;
    } else if (previous && point.close < previous.close) {
      lastDirection = -1;
    }
    return lastDirection;
  });
};

export const buildVolumeDirections = (
  points: ChartDataPoint[],
  mode: VolumeColorMode = "candle-body"
): CandleDirection[] =>
  mode === "session-change" ? buildSessionChangeDirections(points) : buildCandleDirections(points);

export const getCandleDirectionColor = (
  direction: CandleDirection,
  upColor: string,
  downColor: string
): string => (direction > 0 ? upColor : downColor);

const buildDirectionalCandleStyle = (
  direction: CandleDirection,
  palette: DirectionalOhlcvPalette
): DirectionalCandleItemStyle => {
  const color = getCandleDirectionColor(direction, palette.upColor, palette.downColor);
  return { color, color0: color, borderColor: color, borderColor0: color };
};

export const buildDirectionalCandlestickData = (
  points: ChartDataPoint[],
  palette: DirectionalOhlcvPalette,
  directions: CandleDirection[] = buildCandleDirections(points)
): DirectionalCandlestickDataItem[] =>
  points.map((point, index) => ({
    value: [point.open, point.close, point.low, point.high],
    itemStyle: buildDirectionalCandleStyle(directions[index] ?? DEFAULT_CANDLE_DIRECTION, palette),
  }));

/**
 * @internal Keep raw direction tuples out of ECharts bar series.
 * Use buildDirectionalVolumeBarData for rendered volume bars.
 */
export const buildDirectionalVolumeData = (
  points: ChartDataPoint[],
  directions: CandleDirection[] = buildCandleDirections(points)
): DirectionalVolumeDataPoint[] =>
  points.map((point, index) => [index, point.volume, directions[index] ?? DEFAULT_CANDLE_DIRECTION]);

const buildVolumeBarValue = (
  index: number,
  volume: number | "-",
  dates?: string[],
): DirectionalVolumeBarValue => {
  const date = dates?.[index];
  return date ? [date, volume] : volume;
};

export const resolveStableVolumeAxisMax = (
  volumes: DirectionalVolumeDataPoint[],
  spikeCapMultiplier = 5,
  headroomMultiplier = 1.11,
): number => {
  const positiveVolumes = volumes
    .map((entry) => Number(entry?.[1]))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (positiveVolumes.length === 0) return 100;

  const rawMax = Math.max(...positiveVolumes);
  const sorted = positiveVolumes.slice().sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)] ?? rawMax;
  const safeSpikeCapMultiplier = Number.isFinite(spikeCapMultiplier) && spikeCapMultiplier > 0
    ? spikeCapMultiplier
    : 5;
  const safeHeadroomMultiplier = Number.isFinite(headroomMultiplier) && headroomMultiplier > 0
    ? headroomMultiplier
    : 1.11;
  const spikeCap = median > 0 ? median * safeSpikeCapMultiplier : rawMax;
  const stableMax = Math.min(rawMax, spikeCap);

  return Number.isFinite(stableMax) && stableMax > 0
    ? stableMax * safeHeadroomMultiplier
    : 100;
};

export const resolveVisibleVolumeOverlayAxisMax = (
  points: readonly Pick<ChartDataPoint, "volume">[],
  startIdx: number,
  endIdx: number,
  heightFrac: number = VELA_VOLUME_OVERLAY_HEIGHT_FRAC,
): number => {
  if (points.length === 0) return 100;

  const from = Math.max(0, Math.min(points.length - 1, Math.floor(Math.min(startIdx, endIdx))));
  const to = Math.max(from, Math.min(points.length - 1, Math.ceil(Math.max(startIdx, endIdx))));
  let visibleMax = 0;

  for (let index = from; index <= to; index += 1) {
    const volume = Number(points[index]?.volume);
    if (Number.isFinite(volume) && volume > visibleMax) visibleMax = volume;
  }

  if (!(visibleMax > 0)) return 100;
  const safeHeightFrac = Number.isFinite(heightFrac)
    ? Math.min(0.5, Math.max(0.05, heightFrac))
    : VELA_VOLUME_OVERLAY_HEIGHT_FRAC;

  return visibleMax / safeHeightFrac;
};

export const buildDirectionalVolumeBarData = (
  volumes: DirectionalVolumeDataPoint[],
  palette: DirectionalOhlcvPalette,
  opacity: number,
  pointCount: number = volumes.length,
  dates?: string[],
): DirectionalVolumeBarDataItem[] => {
  const renderedBars: DirectionalVolumeBarDataItem[] = volumes.slice(0, pointCount).map(([_index, volume, direction], index) => ({
    value: buildVolumeBarValue(index, volume, dates),
    itemStyle: {
      color: getCandleDirectionColor(direction, palette.upColor, palette.downColor),
      opacity,
    },
  }));

  return renderedBars.concat(Array.from({ length: Math.max(0, pointCount - volumes.length) }, (_unused, offset) => ({
    value: buildVolumeBarValue(volumes.length + offset, "-", dates),
    itemStyle: {
      color: "rgba(0, 0, 0, 0)",
      opacity: 0,
    },
  })));
};

export const buildDirectionalOhlcvSeries = (
  points: ChartDataPoint[],
  options: DirectionalOhlcvOptions
): DirectionalOhlcvSeries => {
  const candleDirections = buildCandleDirections(points);
  const volumeDirections = buildVolumeDirections(points, options.volumeColorMode);

  return {
    dates: points.map((point) => point.time),
    directions: candleDirections,
    candleDirections,
    volumeDirections,
    candles: buildDirectionalCandlestickData(points, options, candleDirections),
    volumes: buildDirectionalVolumeData(points, volumeDirections),
  };
};
