import type { ChartType } from "../../lib/chart-types";
import type { ChartAppearance, ChartState } from "../state/chartStateTypes";
import type {
  AdvancedIndicatorsState,
  BollingerSettings,
  IndicatorPeriods,
  MovingAverageTrendSignalsState,
  PriceVsEmaMetricsState,
  PriceVsSmaMetricsState,
} from "../indicators/advancedIndicatorsTypes";
import { normalizeMovingAverageTrendSignals } from "../indicators/movingAverageSeries";
import { normalizePriceVsEmaMetrics } from "../indicators/priceVsEmaMetrics";
import { normalizePriceVsSmaMetrics } from "../indicators/priceVsSmaMetrics";
import type { MultiChartLayoutCell, MultiChartLayoutState } from "./multiChartLayoutTypes";
import type { ChartTimeframe, TimeframeDataSourceKind } from "../market/timeframeCatalog";
import { normalizeChartTimeframe } from "../market/timeframeCatalog";

export type MultiChartAssetKind = "equity" | "index";

export interface MultiChartViewportState {
  startTime: string | null;
  endTime: string | null;
  yScale: number;
  isYManual: boolean;
}

export interface MultiChartIndicatorSnapshot {
  chart: ChartState["indicators"];
  advanced: AdvancedIndicatorsState;
  periods: IndicatorPeriods;
  bollinger: BollingerSettings;
  ui: {
    movingAverageTrendSignals: MovingAverageTrendSignalsState;
    priceVsSmaMetrics: PriceVsSmaMetricsState;
    priceVsEmaMetrics: PriceVsEmaMetricsState;
  };
}

export interface MultiChartCellRuntimeState {
  sourceKind: MultiChartAssetKind;
  sourceId: string;
  chartType: ChartType;
  timeframe: ChartTimeframe;
  dateRange: string;
  viewport: MultiChartViewportState;
  drawingScope: string;
  indicatorState: MultiChartIndicatorSnapshot | null;
  appearance: ChartAppearance | null;
  dataSource: TimeframeDataSourceKind | "unknown";
}

export type CompleteMultiChartLayoutCell = MultiChartLayoutCell & MultiChartCellRuntimeState;

export type CompleteMultiChartLayoutState = MultiChartLayoutState & {
  schemaVersion: 2;
  maximizedChartId: string | null;
  charts: CompleteMultiChartLayoutCell[];
};

export const DEFAULT_MULTI_CHART_VIEWPORT: MultiChartViewportState = Object.freeze({
  startTime: null,
  endTime: null,
  yScale: 1,
  isYManual: false,
});

const VALID_CHART_TYPES = new Set<ChartType>([
  "bars",
  "candles",
  "hollow_candles",
  "volume_candles",
  "line",
  "line_with_markers",
  "step_line",
  "area",
  "hlc_area",
  "baseline",
  "columns",
  "high_low",
  "volume_footprint",
  "time_price_opportunity",
  "session_volume_profile",
  "heikin_ashi",
  "renko",
  "line_break",
  "kagi",
  "point_and_figure",
  "range",
]);

const isFinitePositive = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const asString = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;

const normalizeChartType = (value: unknown, sourceKind: MultiChartAssetKind): ChartType => {
  if (sourceKind === "index") return "line";
  return typeof value === "string" && VALID_CHART_TYPES.has(value as ChartType)
    ? value as ChartType
    : "candles";
};

const normalizeSourceKind = (value: unknown): MultiChartAssetKind =>
  value === "index" ? "index" : "equity";

const normalizeDataSource = (value: unknown): MultiChartCellRuntimeState["dataSource"] => {
  if (value === "native" || value === "aggregate" || value === "unavailable") return value;
  return "unknown";
};

export const cloneMultiChartAppearance = (value: unknown): ChartAppearance | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Partial<ChartAppearance>;
  if (!candidate.statusLine || typeof candidate.statusLine !== "object") return null;
  if (typeof candidate.upColor !== "string" || typeof candidate.downColor !== "string") return null;
  if (typeof candidate.backgroundColor !== "string") return null;
  return {
    ...(candidate as ChartAppearance),
    statusLine: { ...(candidate.statusLine as ChartAppearance["statusLine"]) },
  };
};

const normalizeViewport = (value: unknown): MultiChartViewportState => {
  if (!value || typeof value !== "object") return { ...DEFAULT_MULTI_CHART_VIEWPORT };
  const candidate = value as Partial<MultiChartViewportState>;
  return {
    startTime: typeof candidate.startTime === "string" ? candidate.startTime : null,
    endTime: typeof candidate.endTime === "string" ? candidate.endTime : null,
    yScale: isFinitePositive(candidate.yScale) ? candidate.yScale : 1,
    isYManual: Boolean(candidate.isYManual),
  };
};

const cloneNumberArray = (value: unknown): number[] =>
  Array.isArray(value)
    ? value.filter((entry): entry is number => typeof entry === "number" && Number.isFinite(entry))
    : [];

export const cloneMultiChartIndicatorSnapshot = (value: unknown): MultiChartIndicatorSnapshot | null => {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<MultiChartIndicatorSnapshot>;
  if (!candidate.chart || !candidate.advanced || !candidate.periods || !candidate.bollinger) return null;

  return {
    chart: {
      sma: Boolean(candidate.chart.sma),
      ema: Boolean(candidate.chart.ema),
      volume: Boolean(candidate.chart.volume),
      // Persisted snapshots predate study-level visibility. Missing means visible.
      volumeVisible: candidate.chart.volumeVisible !== false,
      activeSma: cloneNumberArray(candidate.chart.activeSma),
      activeEma: cloneNumberArray(candidate.chart.activeEma),
      activeWma: cloneNumberArray(candidate.chart.activeWma),
      activeDema: cloneNumberArray(candidate.chart.activeDema),
      activeTema: cloneNumberArray(candidate.chart.activeTema),
      activeHma: cloneNumberArray(candidate.chart.activeHma),
      activeZlema: cloneNumberArray(candidate.chart.activeZlema),
      activeAlma: cloneNumberArray(candidate.chart.activeAlma),
      activeSmma: cloneNumberArray(candidate.chart.activeSmma),
      activeKama: cloneNumberArray(candidate.chart.activeKama),
      activeVwma: cloneNumberArray(candidate.chart.activeVwma),
    },
    advanced: { ...candidate.advanced } as AdvancedIndicatorsState,
    periods: { ...candidate.periods } as IndicatorPeriods,
    bollinger: { ...candidate.bollinger } as BollingerSettings,
    ui: {
      movingAverageTrendSignals: normalizeMovingAverageTrendSignals(candidate.ui?.movingAverageTrendSignals),
      priceVsSmaMetrics: normalizePriceVsSmaMetrics(candidate.ui?.priceVsSmaMetrics),
      priceVsEmaMetrics: normalizePriceVsEmaMetrics(candidate.ui?.priceVsEmaMetrics),
    },
  };
};

export const completeMultiChartCell = (
  cell: MultiChartLayoutCell | Partial<CompleteMultiChartLayoutCell>,
  index = 0,
): CompleteMultiChartLayoutCell => {
  const sourceKind = normalizeSourceKind((cell as Partial<CompleteMultiChartLayoutCell>).sourceKind);
  const timeframe = normalizeChartTimeframe(
    (cell as Partial<CompleteMultiChartLayoutCell>).timeframe ?? cell.interval,
  ) ?? "1D";
  const symbol = asString(cell.symbol);
  const exchange = symbol ? asString(cell.exchange) : "";
  const chartId = asString(cell.chartId) || `chart_${index + 1}`;
  const indicators = Array.isArray(cell.indicators)
    ? cell.indicators.filter((entry): entry is string => typeof entry === "string")
    : [];

  return {
    chartId,
    symbol,
    exchange,
    interval: timeframe,
    indicators,
    isActive: Boolean(cell.isActive),
    sourceKind,
    sourceId: asString((cell as Partial<CompleteMultiChartLayoutCell>).sourceId),
    chartType: normalizeChartType((cell as Partial<CompleteMultiChartLayoutCell>).chartType, sourceKind),
    timeframe,
    dateRange: asString((cell as Partial<CompleteMultiChartLayoutCell>).dateRange, "Tout"),
    viewport: normalizeViewport((cell as Partial<CompleteMultiChartLayoutCell>).viewport),
    drawingScope: asString((cell as Partial<CompleteMultiChartLayoutCell>).drawingScope, chartId),
    indicatorState: cloneMultiChartIndicatorSnapshot((cell as Partial<CompleteMultiChartLayoutCell>).indicatorState),
    appearance: cloneMultiChartAppearance((cell as Partial<CompleteMultiChartLayoutCell>).appearance),
    dataSource: normalizeDataSource((cell as Partial<CompleteMultiChartLayoutCell>).dataSource),
  };
};

export const completeMultiChartLayout = (
  layout: MultiChartLayoutState | Partial<CompleteMultiChartLayoutState>,
): CompleteMultiChartLayoutState => {
  const rawCharts = Array.isArray(layout.charts) ? layout.charts : [];
  const charts = rawCharts.map((cell, index) => completeMultiChartCell(cell, index));
  const firstBound = charts.find((cell) => Boolean(cell.symbol));
  const requestedActive = asString(layout.activeChartId);
  const active = charts.find((cell) => cell.chartId === requestedActive && Boolean(cell.symbol)) ?? firstBound ?? charts[0];
  const activeChartId = active?.chartId ?? "chart_1";
  charts.forEach((cell) => {
    cell.isActive = cell.chartId === activeChartId;
  });
  const maximizedCandidate = asString((layout as Partial<CompleteMultiChartLayoutState>).maximizedChartId);
  const maximizedChartId = charts.some((cell) => cell.chartId === maximizedCandidate)
    ? maximizedCandidate
    : null;

  return {
    ...(layout as MultiChartLayoutState),
    schemaVersion: 2,
    charts,
    activeChartId,
    maximizedChartId,
  };
};
