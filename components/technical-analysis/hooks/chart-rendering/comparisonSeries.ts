import type { ChartDataPoint } from "../../lib/Indicators/TechnicalIndicators";
import type { CompareSeriesPriceSource } from "../../config/compare-series/compareSeries";


const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const toDayKey = (time: string): string => {
  const trimmed = time.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  const timestamp = Date.parse(trimmed);
  if (!Number.isFinite(timestamp)) return trimmed;
  return new Date(timestamp).toISOString().slice(0, 10);
};

const getComparisonPointPrice = (
  point: ChartDataPoint,
  priceSource: CompareSeriesPriceSource,
): number => point[priceSource];

const buildComparisonPriceLookup = (
  data: ChartDataPoint[],
  priceSource: CompareSeriesPriceSource,
) => {
  const exact = new Map<string, number>();
  const daily = new Map<string, number>();
  data.forEach((point) => {
    const price = getComparisonPointPrice(point, priceSource);
    if (!Number.isFinite(price)) return;
    exact.set(point.time.trim(), price);
    daily.set(toDayKey(point.time), price);
  });
  return { exact, daily };
};

const resolveComparisonPrice = (
  lookup: ReturnType<typeof buildComparisonPriceLookup>,
  time: string,
): number | null => {
  const exactPrice = lookup.exact.get(time.trim());
  if (Number.isFinite(exactPrice)) return exactPrice as number;
  const dailyPrice = lookup.daily.get(toDayKey(time));
  return Number.isFinite(dailyPrice) ? dailyPrice as number : null;
};

export const buildComparisonPriceValues = (
  data: ChartDataPoint[],
  mainData: ChartDataPoint[],
  priceSource: CompareSeriesPriceSource,
): Array<number | null> => {
  const lookup = buildComparisonPriceLookup(data, priceSource);
  return mainData.map((point) => {
    const price = resolveComparisonPrice(lookup, point.time);
    return isFiniteNumber(price) ? price : null;
  });
};

export const buildComparisonLineData = (
  dates: string[],
  normalized: Array<number | null>,
): Array<[string, number | null]> =>
  normalized.reduce<Array<[string, number | null]>>((items, value, index) => {
    const date = dates[index];
    if (date) items.push([date, value]);
    return items;
  }, []);

export const formatCompareEndValueLabel = (value: unknown): string => {
  const rawValue = Array.isArray(value) ? value[1] : value;
  const numericValue = Number(rawValue);
  if (!Number.isFinite(numericValue)) return "";
  const fractionDigits = Math.abs(numericValue) < 10 ? 4 : 2;
  return numericValue.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
};

const COMPARE_AXIS_ESTIMATED_GLYPH_WIDTH_PX = 6.5;
const COMPARE_AXIS_LABEL_MARGIN_PX = 8;
const COMPARE_AXIS_SAFE_PADDING_PX = 8;
const COMPARE_AXIS_MIN_GUTTER_PX = 72;
const COMPARE_AXIS_MAX_GUTTER_PX = 128;

export const resolveComparisonAxisGutterPx = (
  valueSets: ReadonlyArray<ReadonlyArray<number | null>>,
  fallbackPx: number,
): number => {
  let maxLabelLength = 0;

  valueSets.forEach((values) => {
    values.forEach((value) => {
      if (!isFiniteNumber(value)) return;
      maxLabelLength = Math.max(maxLabelLength, formatCompareEndValueLabel(value).length);
    });
  });

  if (maxLabelLength === 0) return fallbackPx;

  const estimatedLabelWidth = Math.ceil(
    maxLabelLength * COMPARE_AXIS_ESTIMATED_GLYPH_WIDTH_PX
      + COMPARE_AXIS_LABEL_MARGIN_PX
      + COMPARE_AXIS_SAFE_PADDING_PX,
  );

  return Math.min(
    COMPARE_AXIS_MAX_GUTTER_PX,
    Math.max(fallbackPx, COMPARE_AXIS_MIN_GUTTER_PX, estimatedLabelWidth),
  );
};

export const getLastFiniteComparisonPoint = (
  dates: string[],
  normalized: Array<number | null>,
): { date: string; value: number } | null => {
  const lastIndex = Math.min(dates.length, normalized.length) - 1;

  for (let index = lastIndex; index >= 0; index--) {
    const value = normalized[index];
    if (isFiniteNumber(value)) return { date: dates[index], value };
  }

  return null;
};
