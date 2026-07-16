import type { ChartDataPoint } from "../../Indicators/TechnicalIndicators";
import { normalizeChartType, type AnyChartType, type ChartTransformResult, type ChartWarning, type RawBar, type SourceMapEntry } from "../domain/types";
import { normalizeRawBars } from "../domain/validateBars";
import { CHART_TYPE_REGISTRY } from "../registry/chartTypeRegistry";
import type { ChartOptionPart, ChartTypePalette, ChartTypeRenderPlan } from "./types";

const CHART_TITLE_WARNING_CODES = new Set([
  "SYNTHETIC_PRICE",
]);

export interface BuildChartTypeSeriesOptions {
  chartType: AnyChartType;
  chartData: ChartDataPoint[];
  baseDates: string[];
  displaySymbol: string;
  palette: ChartTypePalette;
  latestPrice: number;
  visible: boolean;
}

export const buildChartTypeSeries = ({
  chartType,
  chartData,
  baseDates,
  displaySymbol,
  palette,
  latestPrice,
  visible,
}: BuildChartTypeSeriesOptions): ChartTypeRenderPlan => {
  const normalizedBars = normalizeRawBars(chartData);
  const normalizedChartType = normalizeChartType(chartType);
  const registryEntry = CHART_TYPE_REGISTRY[normalizedChartType];
  const transformResult = registryEntry.transform({ bars: normalizedBars.bars });
  const warnings = [...normalizedBars.warnings, ...transformResult.warnings];
  const dates = resolveRenderDates(transformResult, baseDates);
  const volumeSourceData = resolveVolumeSourceData(transformResult, dates, normalizedBars.bars, baseDates);
  const series = registryEntry.renderer({
    id: "main-series",
    name: displaySymbol,
    result: transformResult,
    palette,
    latestPrice,
    visible,
    dateLabels: dates,
  });

  return {
    dates,
    series: ensureMainSeriesVisibility(series, visible),
    warnings,
    synthetic: transformResult.synthetic,
    volumeSourceData,
  };
};

const ensureMainSeriesVisibility = (series: ChartOptionPart[], visible: boolean): ChartOptionPart[] =>
  visible ? series : series.map((item) => ({
    ...item,
    itemStyle: { ...(item.itemStyle as Record<string, unknown> | undefined), opacity: 0 },
    lineStyle: { ...(item.lineStyle as Record<string, unknown> | undefined), opacity: 0 },
  }));

const resolveRenderDates = (result: ChartTransformResult, baseDates: string[]): string[] => {
  if (result.kind === "ohlc") return mapSourceDates(result.bars.map((bar) => bar.sourceMap), baseDates);
  if (result.kind === "volume_candles") return mapSourceDates(result.bars.map((bar) => bar.sourceMap), baseDates);
  if (result.kind === "line") return mapSourceDates(result.points.map((point) => point.sourceMap), baseDates);
  if (result.kind === "columns") return mapSourceDates(result.points.map((point) => point.sourceMap), baseDates);
  if (result.kind === "high_low") return mapSourceDates(result.items.map((item) => item.sourceMap), baseDates);
  if (result.kind === "footprint") return mapSourceDates(result.candles.map((item) => item.sourceMap), baseDates);
  if (result.kind === "profile") return mapSourceDates(result.bars.map((bar) => bar.sourceMap), baseDates);
  if (result.kind === "tpo") return mapSourceDates(result.profiles.map((item) => item.sourceMap), baseDates);
  if (result.kind === "custom") return result.items.map((_, index) => `#${index + 1}`);
  return baseDates;
};

type VolumeRenderBar = Pick<RawBar, "time" | "open" | "high" | "low" | "close" | "volume"> & {
  sourceMap?: SourceMapEntry;
  sourceIndex?: number;
};

const mapSourceDates = (sourceMaps: SourceMapEntry[], baseDates: string[]): string[] =>
  sourceMaps.map((sourceMap, index) => {
    const label = resolveSourceDate(sourceMap, baseDates);
    return label ? `${label}${sourceMaps.length > baseDates.length ? ` #${index + 1}` : ""}` : `#${index + 1}`;
  });

const resolveSourceDate = (sourceMap: SourceMapEntry, baseDates: string[]): string | undefined =>
  baseDates[sourceMap.sourceEndIndex] ?? baseDates[sourceMap.sourceStartIndex];

const formatFallbackTime = (time: number): string => {
  const date = new Date(time);
  return Number.isFinite(date.getTime()) ? date.toISOString() : "";
};

const resolveVolumeDate = (bar: VolumeRenderBar, index: number, dates: string[], baseDates: string[]): string => {
  if (dates[index]) return dates[index];
  if (bar.sourceMap) {
    const mappedDate = resolveSourceDate(bar.sourceMap, baseDates);
    if (mappedDate) return mappedDate;
  }
  if (bar.sourceIndex !== undefined && baseDates[bar.sourceIndex]) return baseDates[bar.sourceIndex];
  return formatFallbackTime(bar.time) || `#${index + 1}`;
};

const toVolumeChartDataPoint = (bar: VolumeRenderBar, index: number, dates: string[], baseDates: string[]): ChartDataPoint => ({
  time: resolveVolumeDate(bar, index, dates, baseDates),
  open: bar.open,
  high: bar.high,
  low: bar.low,
  close: bar.close,
  volume: bar.volume ?? 0,
});

const resolveVolumeSourceData = (
  result: ChartTransformResult,
  dates: string[],
  fallbackBars: VolumeRenderBar[],
  baseDates: string[],
): ChartDataPoint[] => {
  if (result.kind === "ohlc" || result.kind === "volume_candles" || result.kind === "profile") {
    return result.bars.map((bar, index) => toVolumeChartDataPoint(bar, index, dates, baseDates));
  }
  if (result.kind === "footprint") {
    return result.candles.map((bar, index) => toVolumeChartDataPoint(bar, index, dates, baseDates));
  }
  return fallbackBars.map((bar, index) => toVolumeChartDataPoint(bar, index, dates, baseDates));
};

export const formatChartTypeWarnings = (warnings: ChartWarning[]): string =>
  warnings
    .filter((warning) => CHART_TITLE_WARNING_CODES.has(warning.code))
    .map((warning) => warning.message)
    .join(" ");
