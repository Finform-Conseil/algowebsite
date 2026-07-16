import type { MutableRefObject, RefObject } from "react";

import type { CompareSeriesSettings } from "../../config/compare-series/compareSeries";
import type { Drawing } from "../../config/drawing/drawingModelTypes";
import type { CursorMode } from "../../hooks/useCursorRenderer";
import type { UseEChartsRendererProps } from "../../hooks/useEChartsRenderer";
import type { ChartDataPoint } from "../../lib/Indicators/TechnicalIndicators";
import type { EChartsInstance } from "../../lib/types/echarts";

export const CHART_RENDER_HOOK_ORDER = ["echarts", "overlay", "cursor"] as const;

export type ChartRenderHookStage = (typeof CHART_RENDER_HOOK_ORDER)[number];

export type GridRect = { x: number; y: number; width: number; height: number } | null;

export interface ChartComparisonSeriesInput {
  symbol: string;
  data: ChartDataPoint[];
  settings: CompareSeriesSettings;
}

export interface ChartOverlayRendererProps {
  selectedDrawingId: string | null;
  drawings: Drawing[];
  chartInstanceRef: MutableRefObject<EChartsInstance | null>;
  drawingCanvasRef: RefObject<HTMLCanvasElement | null>;
  drawingToolbarRef: RefObject<HTMLDivElement | null>;
  drawingTooltipRef: RefObject<HTMLDivElement | null>;
  gridRect: GridRect;
  toolbarOffsetRef: MutableRefObject<{ x: number; y: number }>;
  chartData: ChartDataPoint[];
  interactionScopeKey: string;
}

export interface ChartCursorRendererProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  containerRef: RefObject<HTMLElement | null>;
  eventSourceRef?: RefObject<HTMLElement | null>;
  mode: CursorMode;
  suspendForDrawing?: boolean;
  chartRef: RefObject<EChartsInstance>;
  chartData: ChartDataPoint[];
  interactionScopeKey: string;
}

export interface ChartRenderEngineProps {
  chart: UseEChartsRendererProps & {
    comparisonSeries: ChartComparisonSeriesInput[];
  };
  overlay: ChartOverlayRendererProps;
  cursor: ChartCursorRendererProps;
}
