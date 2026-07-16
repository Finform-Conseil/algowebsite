import type { ChartDataPoint } from "../../lib/Indicators/TechnicalIndicators";
import {
  TV_AUTO_SCALE_PADDING,
  TV_COMPARE_PRICE_AXIS_DEZOOM_PADDING,
  clamp,
} from "./viewportMath";

const getLastFiniteCloseInViewport = (
  data: ChartDataPoint[],
  startIdx: number,
  endIdx: number,
): number | null => {
  const start = Math.max(0, startIdx);
  const end = Math.min(data.length - 1, endIdx);

  for (let index = end; index >= start; index--) {
    const close = data[index]?.close;
    if (Number.isFinite(close)) return close;
  }

  return null;
};

const resolvePriceAxisAutoPadding = ({
  basePadding,
  center,
  hasComparisonEndLabels,
  priceAxisValue,
  visibleMin,
  visibleMax,
}: {
  basePadding: number;
  center: number;
  hasComparisonEndLabels: boolean;
  priceAxisValue: number | null;
  visibleMin: number;
  visibleMax: number;
}): { top: number; bottom: number } => {
  if (!hasComparisonEndLabels) return { top: basePadding, bottom: basePadding };

  const range = visibleMax - visibleMin;
  const safeRange = range > 0 ? range : Math.max(Math.abs(center), 1);
  const finitePrice = priceAxisValue ?? center;
  const priceRatio = range > 0 ? clamp((finitePrice - visibleMin) / range, 0, 1) : 0.5;
  const dezoomPadding = Math.max(basePadding * 2, safeRange * TV_COMPARE_PRICE_AXIS_DEZOOM_PADDING);

  return priceRatio >= 0.5
    ? { top: basePadding + dezoomPadding, bottom: basePadding }
    : { top: basePadding, bottom: basePadding + dezoomPadding };
};

export const resolveAutoViewportPriceRange = ({
  chartData,
  startIdx,
  endIdx,
  hasComparisonEndLabels = false,
  lastPriceAxisValue,
}: {
  chartData: ChartDataPoint[];
  startIdx: number;
  endIdx: number;
  hasComparisonEndLabels?: boolean;
  lastPriceAxisValue?: number;
}) => {
  let visibleMin = Infinity;
  let visibleMax = -Infinity;
  const start = Math.max(0, Math.min(chartData.length - 1, Math.round(startIdx)));
  const end = Math.max(start, Math.min(chartData.length - 1, Math.round(endIdx)));

  for (let index = start; index <= end; index++) {
    const point = chartData[index];
    if (!point) continue;
    visibleMin = Math.min(visibleMin, point.low);
    visibleMax = Math.max(visibleMax, point.high);
  }

  if (visibleMin === Infinity) {
    visibleMin = 0;
    visibleMax = 100;
  }

  const range = visibleMax - visibleMin;
  const center = (visibleMax + visibleMin) / 2;
  const padding = range === 0 ? visibleMin * TV_AUTO_SCALE_PADDING : range * TV_AUTO_SCALE_PADDING;
  const priceAxisValue = Number.isFinite(lastPriceAxisValue)
    ? lastPriceAxisValue as number
    : getLastFiniteCloseInViewport(chartData, start, end);
  const autoPadding = resolvePriceAxisAutoPadding({
    basePadding: padding,
    center,
    hasComparisonEndLabels,
    priceAxisValue,
    visibleMin,
    visibleMax,
  });

  return {
    visibleMin,
    visibleMax,
    center,
    padding,
    min: visibleMin - autoPadding.bottom,
    max: visibleMax + autoPadding.top,
  };
};
