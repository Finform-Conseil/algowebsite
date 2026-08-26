import type { ChartDataPoint } from "../../lib/Indicators/TechnicalIndicators";

export interface LayoutOhlcState {
  open: string;
  high: string;
  low: string;
  close: string;
  change: string;
  changePercent: string;
  volume: string;
  time: string;
}

export interface LayoutSeriesStats {
  first: ChartDataPoint;
  last: ChartDataPoint;
  changePercent: number;
  isStale: boolean;
}

const LAYOUT_EMPTY_VALUE = "--";
const LAYOUT_NO_DATE = "No date";
const LAYOUT_STALE_DAYS = 10;
const MS_PER_DAY = 86_400_000;

export const createEmptyLayoutOhlcState = (): LayoutOhlcState => ({
  open: LAYOUT_EMPTY_VALUE,
  high: LAYOUT_EMPTY_VALUE,
  low: LAYOUT_EMPTY_VALUE,
  close: LAYOUT_EMPTY_VALUE,
  change: LAYOUT_EMPTY_VALUE,
  changePercent: LAYOUT_EMPTY_VALUE,
  volume: LAYOUT_EMPTY_VALUE,
  time: "",
});

const hasFinitePrice = (value: number): boolean =>
  Number.isFinite(value) && value > 0;

export const isRenderableOhlcvPoint = (
  point: ChartDataPoint | undefined
): point is ChartDataPoint =>
  Boolean(
    point &&
      typeof point.time === "string" &&
      point.time.length > 0 &&
      hasFinitePrice(point.open) &&
      hasFinitePrice(point.high) &&
      hasFinitePrice(point.low) &&
      hasFinitePrice(point.close)
  );

export const getRenderableOhlcvSeries = (data: readonly ChartDataPoint[]): ChartDataPoint[] =>
  data.filter(isRenderableOhlcvPoint);

export const formatLayoutPrice = (value: number | null | undefined): string => {
  if (typeof value !== "number" || !Number.isFinite(value)) return LAYOUT_EMPTY_VALUE;
  return value.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatLayoutCompactPrice = (value: number | null | undefined): string => {
  if (typeof value !== "number" || !Number.isFinite(value)) return LAYOUT_EMPTY_VALUE;
  return value.toLocaleString("fr-FR", {
    maximumFractionDigits: value >= 100 ? 0 : 2,
  });
};

export const formatLayoutVolume = (value: number | null | undefined): string => {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return LAYOUT_EMPTY_VALUE;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return value.toString();
};

export const formatLayoutDate = (value: string): string => {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return LAYOUT_NO_DATE;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(timestamp);
};

export const formatLayoutShortDate = (value: string): string => {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  }).format(timestamp);
};

export const formatLayoutDateTime = (value: string): string => {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return LAYOUT_NO_DATE;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
};

export const getLayoutBullBearColor = (
  close: number,
  open: number,
  upColor = "#00e676",
  downColor = "#ff1744"
): string => (close >= open ? upColor : downColor);

export const getLayoutSeriesStats = (
  data: readonly ChartDataPoint[]
): LayoutSeriesStats | null => {
  const series = getRenderableOhlcvSeries(data);
  const first = series[0];
  const last = series[series.length - 1];
  if (!first || !last) return null;

  const changePercent = first.close === 0 ? 0 : ((last.close - first.close) / first.close) * 100;
  const lastTimestamp = Date.parse(last.time);
  const staleDays = Number.isFinite(lastTimestamp) ? (Date.now() - lastTimestamp) / MS_PER_DAY : Infinity;

  return {
    first,
    last,
    changePercent,
    isStale: staleDays > LAYOUT_STALE_DAYS,
  };
};

export const createLayoutOhlcState = (
  point: ChartDataPoint | undefined,
  previousPoint?: ChartDataPoint,
): LayoutOhlcState => {
  if (!isRenderableOhlcvPoint(point)) return createEmptyLayoutOhlcState();

  const previousClose = isRenderableOhlcvPoint(previousPoint) && previousPoint.close !== 0
    ? previousPoint.close
    : null;
  const change = previousClose === null ? null : point.close - previousClose;
  const changePercent = change === null || previousClose === null
    ? null
    : (change / previousClose) * 100;
  const sign = change !== null && change >= 0 ? "+" : "";

  return {
    open: formatLayoutPrice(point.open),
    high: formatLayoutPrice(point.high),
    low: formatLayoutPrice(point.low),
    close: formatLayoutPrice(point.close),
    change: change === null ? LAYOUT_EMPTY_VALUE : `${sign}${formatLayoutPrice(change)}`,
    changePercent: changePercent === null ? LAYOUT_EMPTY_VALUE : `${sign}${changePercent.toFixed(2)}%`,
    volume: formatLayoutVolume(point.volume),
    time: formatLayoutDateTime(point.time),
  };
};

export const getLayoutPriceChangeColor = (
  point: ChartDataPoint | undefined,
  previousPoint: ChartDataPoint | undefined,
  upColor = "#00e676",
  downColor = "#ff1744",
): string => {
  if (!isRenderableOhlcvPoint(point)) return "#94a3b8";
  const comparisonPrice = isRenderableOhlcvPoint(previousPoint) ? previousPoint.close : point.open;
  return point.close >= comparisonPrice ? upColor : downColor;
};
