import type { ChartDataPoint } from "../../lib/Indicators/TechnicalIndicators";
import {
  normalizeCompareSymbol,
  type CompareSeriesPriceSource,
} from "../../config/compare-series/compareSeries";

type ChartOptionPart = Record<string, unknown>;

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

export const normalizeComparisonValues = (
  data: ChartDataPoint[],
  mainData: ChartDataPoint[],
  startIndex: number,
  priceSource: CompareSeriesPriceSource,
): Array<number | null> => {
  const lookup = buildComparisonPriceLookup(data, priceSource);
  let basePrice: number | null = null;

  for (let index = Math.max(0, startIndex); index < mainData.length; index++) {
    basePrice = resolveComparisonPrice(lookup, mainData[index].time);
    if (isFiniteNumber(basePrice) && basePrice !== 0) break;
  }

  return mainData.map((point) => {
    const close = resolveComparisonPrice(lookup, point.time);
    if (!isFiniteNumber(close) || !isFiniteNumber(basePrice) || basePrice === 0) return null;
    return Number((((close - basePrice) / basePrice) * 100).toFixed(2));
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

const getCompareLabelSymbolBackground = (color: string): string => {
  const match = color.match(/^#([0-9a-f]{6})$/i);
  if (!match) return color;

  const value = Number.parseInt(match[1], 16);
  const red = Math.round(((value >> 16) & 255) * 0.86);
  const green = Math.round(((value >> 8) & 255) * 0.86);
  const blue = Math.round((value & 255) * 0.86);

  return `rgb(${red}, ${green}, ${blue})`;
};

export const formatCompareEndValueLabel = (value: unknown): string => {
  const rawValue = Array.isArray(value) ? value[1] : value;
  const numericValue = Number(rawValue);
  if (!Number.isFinite(numericValue)) return "";
  const sign = numericValue > 0 ? "+" : "";
  return `${sign}${numericValue.toFixed(2)}%`;
};

const formatCompareSymbolLabel = (symbol: string): string =>
  normalizeCompareSymbol(symbol).replace(/[{}|]/g, "");

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

export const buildCompareSymbolMarkPoint = (
  symbol: string,
  color: string,
  dates: string[],
  normalized: Array<number | null>,
): ChartOptionPart | undefined => {
  const label = formatCompareSymbolLabel(symbol);
  const lastPoint = getLastFiniteComparisonPoint(dates, normalized);
  if (!label || !lastPoint) return undefined;

  return {
    animation: false,
    silent: false,
    symbol: "rect",
    symbolSize: 1,
    data: [{
      coord: [lastPoint.date, lastPoint.value],
      label: {
        show: true,
        formatter: label,
        position: "left",
        distance: 0,
        color: "#ffffff",
        backgroundColor: getCompareLabelSymbolBackground(color),
        borderRadius: [1, 0, 0, 1],
        padding: [2, 4],
        fontSize: 11,
        fontWeight: 700,
      },
      itemStyle: { color: "transparent" },
    }],
  };
};
