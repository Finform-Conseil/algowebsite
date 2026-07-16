import type { ChartRequirement, ChartTransformInput, ChartTransformResult, ChartType } from "../domain/types";
import {
  transformColumns,
  transformHeikinAshi,
  transformHighLow,
  transformKagi,
  transformLine,
  transformLineBreak,
  transformOhlc,
  transformPointFigure,
  transformRangeBars,
  transformRenko,
  transformSessionVolumeProfile,
  transformTpo,
  transformVolumeCandles,
  transformVolumeFootprint,
} from "../transforms";
import { renderBars } from "../renderers/renderBars";
import { renderBaseline } from "../renderers/renderBaseline";
import { renderCandles } from "../renderers/renderCandles";
import { renderColumns } from "../renderers/renderColumns";
import { renderFootprint } from "../renderers/renderFootprint";
import { renderHighLow } from "../renderers/renderHighLow";
import { renderHlcArea } from "../renderers/renderHlcArea";
import { renderHollowCandles } from "../renderers/renderHollowCandles";
import { renderKagi } from "../renderers/renderKagi";
import { createLineLikeRenderer } from "../renderers/renderLineLike";
import { renderPointFigure } from "../renderers/renderPointFigure";
import { renderSVP } from "../renderers/renderSVP";
import { renderTPO } from "../renderers/renderTPO";
import { renderVolumeCandles } from "../renderers/renderVolumeCandles";
import type { ChartTypeRenderer } from "../renderers/types";

export interface ChartTypeRegistryEntry {
  id: ChartType;
  label: string;
  group: "Classic" | "Line" | "Volume" | "Synthetic";
  requires: ChartRequirement[];
  synthetic: boolean;
  approximateWithoutTicks?: boolean;
  transform: (input: ChartTransformInput) => ChartTransformResult;
  renderer: ChartTypeRenderer;
}

export const CHART_TYPE_REGISTRY: Record<ChartType, ChartTypeRegistryEntry> = {
  bars: entry("bars", "Bars", "Classic", ["ohlc"], false, transformOhlc, renderBars),
  candles: entry("candles", "Candles", "Classic", ["ohlc"], false, transformOhlc, renderCandles),
  hollow_candles: entry("hollow_candles", "Hollow Candles", "Classic", ["ohlc"], false, transformOhlc, renderHollowCandles),
  volume_candles: entry("volume_candles", "Volume Candles", "Classic", ["ohlc", "volume"], false, transformVolumeCandles, renderVolumeCandles),
  line: entry("line", "Line", "Line", ["ohlc"], false, transformLine, createLineLikeRenderer("line")),
  line_with_markers: entry("line_with_markers", "Line With Markers", "Line", ["ohlc"], false, transformLine, createLineLikeRenderer("markers")),
  step_line: entry("step_line", "Step Line", "Line", ["ohlc"], false, transformLine, createLineLikeRenderer("step")),
  area: entry("area", "Area", "Line", ["ohlc"], false, transformLine, createLineLikeRenderer("area")),
  hlc_area: entry("hlc_area", "HLC Area", "Line", ["ohlc"], false, transformOhlc, renderHlcArea),
  baseline: entry("baseline", "Baseline", "Line", ["ohlc"], false, transformLine, renderBaseline),
  columns: entry("columns", "Columns", "Line", ["ohlc"], false, transformColumns, renderColumns),
  high_low: entry("high_low", "High-Low", "Classic", ["ohlc"], false, transformHighLow, renderHighLow),
  volume_footprint: entry("volume_footprint", "Volume Footprint", "Volume", ["ohlc", "volume", "intrabar"], false, transformVolumeFootprint, renderFootprint, true),
  time_price_opportunity: entry("time_price_opportunity", "Time Price Opportunity", "Volume", ["ohlc", "intrabar"], false, transformTpo, renderTPO, true),
  session_volume_profile: entry("session_volume_profile", "Session Volume Profile", "Volume", ["ohlc", "volume", "intrabar"], false, transformSessionVolumeProfile, renderSVP, true),
  heikin_ashi: entry("heikin_ashi", "Heikin Ashi", "Synthetic", ["ohlc"], true, transformHeikinAshi, renderCandles),
  renko: entry("renko", "Renko", "Synthetic", ["ohlc"], true, transformRenko, renderCandles),
  line_break: entry("line_break", "Line Break", "Synthetic", ["ohlc"], true, transformLineBreak, renderCandles),
  kagi: entry("kagi", "Kagi", "Synthetic", ["ohlc"], true, transformKagi, renderKagi),
  point_and_figure: entry("point_and_figure", "Point & Figure", "Synthetic", ["ohlc"], true, transformPointFigure, renderPointFigure),
  range: entry("range", "Range", "Synthetic", ["ohlc"], true, transformRangeBars, renderCandles),
};

export const CHART_TYPE_MENU_GROUPS = ["Classic", "Line", "Volume", "Synthetic"] as const;

function entry(
  id: ChartType,
  label: string,
  group: ChartTypeRegistryEntry["group"],
  requires: ChartRequirement[],
  synthetic: boolean,
  transform: ChartTypeRegistryEntry["transform"],
  renderer: ChartTypeRenderer,
  approximateWithoutTicks = false,
): ChartTypeRegistryEntry {
  return { id, label, group, requires, synthetic, transform, renderer, approximateWithoutTicks };
}
