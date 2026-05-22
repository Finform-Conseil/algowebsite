import type { ChartDataPoint } from "../../Indicators/TechnicalIndicators";
import { normalizeChartType, type AnyChartType, type ChartTransformResult, type ChartWarning, type SourceMapEntry } from "../domain/types";
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
  const series = registryEntry.renderer({
    id: "main-series",
    name: displaySymbol,
    result: transformResult,
    palette,
    latestPrice,
    visible,
    dateLabels: dates,
  });

  return { dates, series: ensureMainSeriesVisibility(series, visible), warnings, synthetic: transformResult.synthetic };
};

const ensureMainSeriesVisibility = (series: ChartOptionPart[], visible: boolean): ChartOptionPart[] =>
  visible ? series : series.map((item) => ({
    ...item,
    itemStyle: { ...(item.itemStyle as Record<string, unknown> | undefined), opacity: 0 },
    lineStyle: { ...(item.lineStyle as Record<string, unknown> | undefined), opacity: 0 },
  }));

const resolveRenderDates = (result: ChartTransformResult, baseDates: string[]): string[] => {
  if (result.kind === "ohlc") {
    return result.synthetic ? mapSourceDates(result.bars.map((bar) => bar.sourceMap), baseDates) : baseDates;
  }
  if (result.kind === "volume_candles") return baseDates;
  if (result.kind === "line") return baseDates;
  if (result.kind === "columns") return baseDates;
  if (result.kind === "high_low") return baseDates;
  if (result.kind === "footprint") return mapSourceDates(result.candles.map((item) => item.sourceMap), baseDates);
  if (result.kind === "profile") return baseDates;
  if (result.kind === "tpo") return mapSourceDates(result.profiles.map((item) => item.sourceMap), baseDates);
  if (result.kind === "custom") return result.items.map((_, index) => `#${index + 1}`);
  return baseDates;
};

const mapSourceDates = (sourceMaps: SourceMapEntry[], baseDates: string[]): string[] =>
  sourceMaps.map((sourceMap, index) => {
    const label = baseDates[sourceMap.sourceEndIndex] ?? baseDates[sourceMap.sourceStartIndex];
    return label ? `${label}${sourceMaps.length > baseDates.length ? ` #${index + 1}` : ""}` : `#${index + 1}`;
  });

export const formatChartTypeWarnings = (warnings: ChartWarning[]): string =>
  warnings
    .filter((warning) => CHART_TITLE_WARNING_CODES.has(warning.code))
    .map((warning) => warning.message)
    .join(" ");
