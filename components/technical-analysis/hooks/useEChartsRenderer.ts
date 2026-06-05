import { useEffect, useState, useRef, RefObject, MutableRefObject, useMemo, useCallback } from "react";
import * as echarts from "echarts/core";
import { BarChart, CandlestickChart, CustomChart, LineChart, PieChart, ScatterChart } from "echarts/charts";
import {
  AxisPointerComponent,
  DataZoomComponent,
  GraphicComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  MarkPointComponent,
  TimelineComponent,
  TitleComponent,
  TooltipComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { useDispatch } from "react-redux";
import type { AdvancedIndicatorsState, IndicatorPeriods, BollingerSettings } from "../config/indicators/advancedIndicatorsTypes";
import type { ChartState, ChartAppearance } from "../config/state/chartStateTypes";
import type { UiState } from "../config/state/uiStateTypes";
import { calculateAcceleratorOscillator, calculateADLine, calculateADX, calculateALMA, calculateAPO, calculateATR, calculateAroon, calculateAroonOscillator, calculateAwesomeOscillator, calculateCCI, calculateCMF, calculateCMO, calculateChaikinOscillator, calculateChaikinVolatility, calculateCoppockCurve, calculateDEMA, calculateDPO, calculateDYMI, calculateDonchianChannels, calculateElderBullBearPower, calculateElderForceIndex, calculateEMA, calculateEOM, calculateFisherTransform, calculateFiftyTwoWeekLevels, calculateHMA, calculateHistoricalRecordLevels, calculateHistoricalVolatility, calculateKAMA, calculateKST, calculateKeltnerChannels, calculateKlingerOscillator, calculateLinearRegressionIndicator, calculateMACD, calculateMFI, calculateMassIndex, calculateMomentum, calculateMovingAverageCrossSignals, calculateNATR, calculateNVI, calculateOBV, calculatePPO, calculatePVI, calculateParabolicSAR, calculatePivotPointsFibonacci, calculatePivotPointsStandard, calculatePriceActionSignals, calculateCandlestickPatterns, calculatePriceStdDev, calculateROC, calculateRVI, calculateSMA, calculateSMMA, calculateSTC, calculateSupertrend, calculateTEMA, calculateTRIX, calculateTSI, calculateUlcerIndex, calculateUltimateOscillator, calculateVROC, calculateVWAP, calculateVWMA, calculateVolumeOscillator, calculateVolumeProfile, calculateVortex, calculateWilliamsR, calculateWMA, calculateZLEMA, ChartDataPoint } from "../lib/Indicators/TechnicalIndicators";
import {
  useChartViewport,
  TV_Y_AXIS_WIDTH,
  TV_X_AXIS_HEIGHT,
  MAIN_GRID_LEFT,
  clamp,
  getSafeGridRect,
  resolveAutoViewportPriceRange,
  resolveInitialViewportWindow,
  resolveTimeDataZoomAxisIndexes,
  type ChartMutationScheduler,
  type PriceLevelViewportMarker,
  type ZoomRangeSnapshot
} from "./useChartViewport";
import { createIndicatorsWorker } from "../lib/workers/createIndicatorsWorker";
import {
  getCompareSeriesColor,
  getCompareSeriesId,
  isCompareSeriesVisibleForTimeframe,
  normalizeCompareSymbol,
  type CompareSeriesSettings,
} from "../config/compare-series/compareSeries";
import {
  buildDirectionalOhlcvSeries,
  buildDirectionalVolumeBarData,
  type DirectionalVolumeDataPoint,
} from "../lib/chart/directionalOhlcv";
import {
  buildEmaSeriesDefinitions,
  buildSmaSeriesDefinitions,
  mergeMovingAveragePeriods,
  resolveTrendSignalSourceAveragePeriods,
} from "../config/indicators/movingAverageSeries";
import { resolvePriceVsSmaSourceAveragePeriods } from "../config/indicators/priceVsSmaMetrics";
import { resolvePriceVsEmaSourceAveragePeriods } from "../config/indicators/priceVsEmaMetrics";
import {
  buildAdvancedMovingAverageSeriesDefinitions,
  type AdvancedMovingAverageFamily,
} from "../config/indicators/advancedMovingAverageSeries";
import {
  CANDLESTICK_PATTERN_PRIORITY,
  buildCandlestickPatternSignalSummary,
  getCandlestickPatternPresentation,
  type CandlestickPatternKey,
  type CandlestickPatternSignalSummary,
} from "../config/indicators/candlestickPatternPresentation";
import {
  buildChartTypeSeries,
} from "../lib/chart-types/renderers/buildChartTypeSeries";
import {
  PRICE_CUSTOM_SERIES_BINDING,
  buildBandFillData,
  renderBandPolygon,
  type CustomRenderApi,
} from "./chart-rendering/bandSeries";
import {
  buildCompareSymbolMarkPoint,
  buildComparisonLineData,
  formatCompareEndValueLabel,
  getLastFiniteComparisonPoint,
  normalizeComparisonValues,
} from "./chart-rendering/comparisonSeries";
import type { EChartsInstance, TechnicalEChartsOption } from "../lib/types/echarts";

let areEChartsModulesRegistered = false;

const CHART_OPTION_REPLACE_MERGE = ["series", "xAxis", "yAxis", "grid", "dataZoom", "graphic"];

const applyChartOption = (chart: EChartsInstance, option: TechnicalEChartsOption): void => {
  chart.setOption(option, {
    notMerge: false,
    replaceMerge: CHART_OPTION_REPLACE_MERGE,
    lazyUpdate: false,
  });
};

const registerEChartsModules = (): void => {
  if (areEChartsModulesRegistered) return;

  echarts.use([
    CanvasRenderer,
    CandlestickChart,
    LineChart,
    BarChart,
    ScatterChart,
    CustomChart,
    GridComponent,
    TooltipComponent,
    DataZoomComponent,
    AxisPointerComponent,
    GraphicComponent,
    TitleComponent,
    LegendComponent,
    MarkLineComponent,
    MarkPointComponent,
    TimelineComponent,
    PieChart,
  ]);
  areEChartsModulesRegistered = true;
};

// ============================================================================
// [TENOR 2026 FIX] SCAR-TS-01: Exported Interface to fix TS 2304
// ============================================================================
export interface UseEChartsRendererProps {
  stockChartRef: RefObject<HTMLDivElement | null>;
  /** [TENOR 2026 SRE FIX] SCAR-MULTICHART-EVENT-SCOPE:
   * The stable layers-stack container. In multi-chart mode the parent of
   * stockChartRef becomes a grid cell div instead of this element, so we
   * receive it explicitly to keep DOM event listeners on the correct node.
   */
  layersStackRef?: RefObject<HTMLDivElement | null>;
  chartInstanceRef: MutableRefObject<EChartsInstance | null>;
  chartData: ChartDataPoint[];
  chartConfig: ChartState;
  advancedIndicators: AdvancedIndicatorsState;
  indicatorPeriods: IndicatorPeriods;
  bollingerSettings: BollingerSettings;
  chartAppearance: ChartAppearance;
  uiState: UiState;
  displaySymbol: string;
  lastZoomRangeRef?: MutableRefObject<{ start: number; end: number; barsFromRightStart?: number; barsFromRightEnd?: number; }>;
  cursorPriceBadgeRef?: RefObject<HTMLDivElement | null>;
  cursorPriceTextRef?: RefObject<HTMLSpanElement | null>;
  cursorPriceActionRef?: RefObject<HTMLButtonElement | null>;
  lastPriceBadgeRef?: RefObject<HTMLDivElement | null>;
  lastPriceLineRef?: RefObject<HTMLDivElement | null>;
  lastPriceAxisValue?: number;
  isMainChartVisible?: boolean;
  comparisonSeries?: Array<{ symbol: string; data: ChartDataPoint[]; settings: CompareSeriesSettings }>;
  onCompareSeriesSettingsRequest?: (symbol: string) => void;
  onChartVisualReady?: () => void;
  hasLiveStitchedCandle?: boolean;
  hiddenObjectIds?: Record<string, boolean>;
}

// ============================================================================
// CONSTANTES SPÉCIFIQUES AUX BADGES
// ============================================================================
const TV_AXIS_BADGE_RIGHT_INSET = 8;
const TV_AXIS_ACTION_GAP = 3;
const TV_CURSOR_BADGE_MIN_WIDTH = 72;
type ChartOptionPart = Record<string, unknown>;

type RenderableSeriesOption = {
  data?: unknown;
  type?: unknown;
};

const hasRenderableSeriesData = (chart: EChartsInstance): boolean => {
  const option = chart.getOption();
  if (!option || typeof option !== "object") return false;

  const series = (option as { series?: unknown }).series;
  if (!Array.isArray(series)) return false;

  return series.some((entry) => {
    const seriesOption = entry as RenderableSeriesOption;
    if (!Array.isArray(seriesOption.data) || seriesOption.data.length === 0) return false;
    return seriesOption.type === "candlestick" || seriesOption.type === "bar" || seriesOption.type === "line" || seriesOption.type === "custom";
  });
};

type ViewportSeedableOption = TechnicalEChartsOption & {
  dataZoom?: unknown;
  xAxis?: unknown;
  yAxis?: unknown;
};

const withStableInitialViewport = ({
  option,
  chartData,
  hasComparisonEndLabels,
  lastPriceAxisValue,
  zoomRange,
}: {
  option: TechnicalEChartsOption;
  chartData: ChartDataPoint[];
  hasComparisonEndLabels: boolean;
  lastPriceAxisValue?: number;
  zoomRange?: ZoomRangeSnapshot;
}): TechnicalEChartsOption => {
  if (chartData.length === 0) return option;

  const seedableOption = option as ViewportSeedableOption;
  const viewport = resolveInitialViewportWindow(chartData.length, zoomRange);
  const priceRange = resolveAutoViewportPriceRange({
    chartData,
    startIdx: viewport.startIdx,
    endIdx: viewport.endIdx,
    hasComparisonEndLabels,
    lastPriceAxisValue,
  });
  const timeAxisIndexes = resolveTimeDataZoomAxisIndexes(seedableOption);
  const currentDataZoom = Array.isArray(seedableOption.dataZoom) ? seedableOption.dataZoom : [];
  let hasTimeZoom = false;
  const dataZoom = currentDataZoom.map((zoom) => {
    if (!zoom || typeof zoom !== "object") return zoom;

    const zoomOption = zoom as Record<string, unknown>;
    if (zoomOption.id !== "time-zoom") return zoom;

    hasTimeZoom = true;
    return {
      ...zoomOption,
      xAxisIndex: timeAxisIndexes,
      filterMode: "none",
      startValue: viewport.startIdx,
      endValue: viewport.endIdx,
    };
  });

  if (!hasTimeZoom) {
    dataZoom.push({
      id: "time-zoom",
      type: "inside",
      xAxisIndex: timeAxisIndexes,
      zoomOnMouseWheel: false,
      moveOnMouseMove: false,
      filterMode: "none",
      startValue: viewport.startIdx,
      endValue: viewport.endIdx,
    });
  }

  const yAxis = Array.isArray(seedableOption.yAxis)
    ? seedableOption.yAxis.map((axis, index) => {
        if (!axis || typeof axis !== "object") return axis;
        const axisOption = axis as Record<string, unknown>;
        if (index !== 0 && axisOption.id !== "price-yaxis") return axis;
        return { ...axisOption, min: priceRange.min, max: priceRange.max };
      })
    : seedableOption.yAxis && typeof seedableOption.yAxis === "object"
      ? { ...(seedableOption.yAxis as Record<string, unknown>), min: priceRange.min, max: priceRange.max }
      : seedableOption.yAxis;

  return {
    ...option,
    dataZoom,
    yAxis,
  };
};

interface LineRenderOptions {
  showPointMarkers?: boolean;
  allowProjection?: boolean;
}

interface PriceSignalMarkerOptions {
  legendName?: string;
  latestOnly?: boolean;
  maxMarkers?: number;
  minBarGap?: number;
  symbolSize?: number;
  opacity?: number;
}

interface ChartBuilderContext {
  dates: string[];
  volumes: DirectionalVolumeDataPoint[];
  chartData: ChartDataPoint[];
  extendedChartData: ChartDataPoint[];
  chartConfig: ChartState;
  advancedIndicators: AdvancedIndicatorsState;
  indicatorPeriods: IndicatorPeriods;
  bollingerSettings: BollingerSettings;
  chartAppearance: ChartAppearance;
  uiState: UiState;
  displaySymbol: string;
  indicatorsData: Record<string, (number | string)[]>;
  comparisonSeries: Array<{ symbol: string; data: ChartDataPoint[]; settings: CompareSeriesSettings }>;
  hiddenObjectIds: Record<string, boolean>;
  latestPrice: number;
  liveColor: string;
  isMainChartVisible: boolean;
  legendSelection: Record<string, boolean>;
  comparisonBaselineIndex: number;
  hasLiveStitchedCandle: boolean;
}

const formatAxisPriceValue = (value: number): string => {
  const decimals = Math.abs(value) < 10 ? 4 : 2;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const formatSignalNumber = (value: number | null, fractionDigits = 2): string => {
  if (value === null || !Number.isFinite(value)) return "N/D";
  return value.toLocaleString("fr-FR", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
};

const toFiniteNumber = (value: unknown): number | null => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const resolveIndicatorQualityLabel = (
  data: ChartDataPoint[],
  requiredBars: number,
  hasLiveStitchedCandle: boolean,
): string => {
  if (data.length < requiredBars) return "Historique insuffisant";

  const recentBars = data.slice(-Math.min(20, data.length));
  const validCloses = recentBars
    .map((point) => toFiniteNumber(point.close))
    .filter((value): value is number => value !== null);
  if (validCloses.length < Math.min(5, recentBars.length)) return "Indicateur non calculable";

  const hasSuspiciousRange = recentBars.some((point) => {
    const high = toFiniteNumber(point.high);
    const low = toFiniteNumber(point.low);
    const close = toFiniteNumber(point.close);
    if (high === null || low === null || close === null || close <= 0) return true;
    return high < low || (high - low) / close > 0.35;
  });
  if (hasSuspiciousRange) return "Range suspect";

  const uniqueCloseCount = new Set(validCloses.map((value) => value.toFixed(8))).size;
  if (uniqueCloseCount <= 1) return "Série plate";

  const positiveVolumeCount = recentBars.filter((point) => {
    const volume = toFiniteNumber(point.volume);
    return volume !== null && volume > 0;
  }).length;
  if (positiveVolumeCount <= Math.max(1, Math.floor(recentBars.length * 0.25))) return "Faible liquidité";

  const lastTimestamp = Date.parse(String(data[data.length - 1]?.time ?? ""));
  if (Number.isFinite(lastTimestamp) && Date.now() - lastTimestamp > 14 * 86_400_000) {
    return "Dernière transaction ancienne";
  }

  return hasLiveStitchedCandle ? "Signal live" : "Signal confirmé";
};

const resolveVolumeFlowQualityLabel = (
  data: ChartDataPoint[],
  requiredBars: number,
  hasLiveStitchedCandle: boolean,
  requiresRange = false,
): string => {
  if (data.length < requiredBars) return "Historique insuffisant";

  const recentBars = data.slice(-Math.min(20, data.length));
  const validVolumes = recentBars
    .map((point) => toFiniteNumber(point.volume))
    .filter((value): value is number => value !== null && value >= 0);
  if (validVolumes.length < Math.min(5, recentBars.length)) return "Volume manquant";

  const positiveVolumeCount = validVolumes.filter((volume) => volume > 0).length;
  if (positiveVolumeCount <= Math.max(1, Math.floor(recentBars.length * 0.25))) return "Volume faible";

  if (requiresRange) {
    const hasNullRange = recentBars.some((point) => {
      const high = toFiniteNumber(point.high);
      const low = toFiniteNumber(point.low);
      return high !== null && low !== null && high === low;
    });
    if (hasNullRange) return "Range nul";
  }

  const validCloses = recentBars
    .map((point) => toFiniteNumber(point.close))
    .filter((value): value is number => value !== null);
  const uniqueCloseCount = new Set(validCloses.map((value) => value.toFixed(8))).size;
  if (uniqueCloseCount <= 1) return "Flux volume non fiable";

  const lastTimestamp = Date.parse(String(data[data.length - 1]?.time ?? ""));
  if (Number.isFinite(lastTimestamp) && Date.now() - lastTimestamp > 14 * 86_400_000) {
    return "Dernière transaction ancienne";
  }

  return hasLiveStitchedCandle ? "Signal live" : "Signal confirmé";
};

const getLastFiniteSeriesValue = (values: Array<number | string> | undefined): number | null => {
  if (!values) return null;
  for (let index = values.length - 1; index >= 0; index--) {
    const value = toFiniteNumber(values[index]);
    if (value !== null) return value;
  }
  return null;
};

const formatAdxTrendStrength = (adx: number | null): string | null => {
  if (adx === null) return null;
  if (adx < 20) return "None";
  if (adx < 25) return "Weak";
  if (adx < 50) return "Moderate";
  if (adx < 75) return "Strong";
  return "Very strong";
};

const buildEChartsOption = ({
  dates,
  volumes,
  chartData,
  chartConfig,
  advancedIndicators,
  indicatorPeriods,
  bollingerSettings,
  chartAppearance,
  uiState,
  displaySymbol,
  indicatorsData,
  comparisonSeries,
  hiddenObjectIds,
  latestPrice,
  liveColor,
  isMainChartVisible,
  legendSelection,
  comparisonBaselineIndex,
  hasLiveStitchedCandle,
}: ChartBuilderContext): TechnicalEChartsOption => {
  const upColor = chartAppearance.upColor;
  const downColor = chartAppearance.downColor;
  const textColor = "#a0aec0";

  const isObjectVisible = (id: string) => hiddenObjectIds[id] !== true;
  const isCci20Active = advancedIndicators.cci20 || advancedIndicators.cci;
  const hasVisibleCciPanel = (advancedIndicators.cci14 && isObjectVisible("cci14"))
    || (advancedIndicators.cci20 && isObjectVisible("cci20"))
    || (advancedIndicators.cci && isObjectVisible("cci"));
  const hasVisibleWilliamsRPanel = (advancedIndicators.williamsR14 && isObjectVisible("williamsR14"))
    || (advancedIndicators.williamsR && isObjectVisible("williamsR"));
  const hasVisibleRocPanel = (advancedIndicators.roc10 && isObjectVisible("roc10"))
    || (advancedIndicators.roc20 && isObjectVisible("roc20"))
    || (advancedIndicators.roc && isObjectVisible("roc"));
  const hasVisibleRawMomentumPanel = (advancedIndicators.momentum10 && isObjectVisible("momentum10"))
    || (advancedIndicators.momentum20 && isObjectVisible("momentum20"));
  const hasVisibleTsiPanel = advancedIndicators.tsi
    && isObjectVisible("tsi")
    && (isObjectVisible("tsi-line") || isObjectVisible("tsi-signal"));
  const hasVisibleRviPanel = advancedIndicators.rvi
    && isObjectVisible("rvi")
    && (isObjectVisible("rvi-line") || isObjectVisible("rvi-signal"));
  const hasVisibleFisherPanel = advancedIndicators.fisherTransform
    && isObjectVisible("fisherTransform")
    && (isObjectVisible("fisher-line") || isObjectVisible("fisher-signal"));
  const hasVisibleElderPanel = advancedIndicators.elderBullBear
    && isObjectVisible("elderBullBear")
    && (isObjectVisible("elder-bull") || isObjectVisible("elder-bear"));
  const hasVisiblePpoPanel = advancedIndicators.ppo
    && isObjectVisible("ppo")
    && (isObjectVisible("ppo-line") || isObjectVisible("ppo-signal") || isObjectVisible("ppo-histogram"));
  const hasVisibleAdxPanel = advancedIndicators.adx
    && isObjectVisible("adx")
    && (isObjectVisible("adx-line") || isObjectVisible("adx-plus-di") || isObjectVisible("adx-minus-di"));
  const hasVisibleAroonPanel = advancedIndicators.aroon
    && isObjectVisible("aroon")
    && (isObjectVisible("aroon-up") || isObjectVisible("aroon-down"));
  const hasVisibleSupertrendOverlay = advancedIndicators.supertrend
    && isObjectVisible("supertrend")
    && (isObjectVisible("supertrend-line") || isObjectVisible("supertrend-signal"));
  const hasVisibleVortexPanel = advancedIndicators.vortex
    && isObjectVisible("vortex")
    && (isObjectVisible("vortex-plus") || isObjectVisible("vortex-minus"));
  const hasVisibleKstPanel = advancedIndicators.kst
    && isObjectVisible("kst")
    && (isObjectVisible("kst-line") || isObjectVisible("kst-signal"));
  const hasVisibleLinearRegressionOverlay = advancedIndicators.linearRegression
    && isObjectVisible("linearRegression")
    && isObjectVisible("linear-reg-value");
  const hasVisibleLinearRegressionSlopePanel = advancedIndicators.linearRegression
    && isObjectVisible("linearRegression")
    && isObjectVisible("linear-reg-slope");
  const hasVisibleDonchianOverlay = advancedIndicators.donchian
    && isObjectVisible("donchian")
    && (isObjectVisible("donchian-upper") || isObjectVisible("donchian-middle") || isObjectVisible("donchian-lower"));
  const hasVisibleKeltnerOverlay = advancedIndicators.keltner
    && isObjectVisible("keltner")
    && (isObjectVisible("keltner-upper") || isObjectVisible("keltner-middle") || isObjectVisible("keltner-lower"));
  const hasVisibleVolumeProfileOverlay = advancedIndicators.volumeProfile
    && isObjectVisible("volumeProfile")
    && (isObjectVisible("volume-profile-rows") || isObjectVisible("vp-poc") || isObjectVisible("vp-vah") || isObjectVisible("vp-val"));
  const hasVisiblePivotStandardOverlay = advancedIndicators.pivotPointsStandard
    && isObjectVisible("pivotPointsStandard")
    && (
      isObjectVisible("pivot-standard-p")
      || isObjectVisible("pivot-standard-r1")
      || isObjectVisible("pivot-standard-r2")
      || isObjectVisible("pivot-standard-r3")
      || isObjectVisible("pivot-standard-s1")
      || isObjectVisible("pivot-standard-s2")
      || isObjectVisible("pivot-standard-s3")
    );
  const hasVisiblePivotFibonacciOverlay = advancedIndicators.pivotPointsFibonacci
    && isObjectVisible("pivotPointsFibonacci")
    && (
      isObjectVisible("pivot-fib-p")
      || isObjectVisible("pivot-fib-r1")
      || isObjectVisible("pivot-fib-r2")
      || isObjectVisible("pivot-fib-r3")
      || isObjectVisible("pivot-fib-s1")
      || isObjectVisible("pivot-fib-s2")
      || isObjectVisible("pivot-fib-s3")
    );
  const hasVisibleMovingAverageCrossesOverlay = advancedIndicators.movingAverageCrosses
    && isObjectVisible("movingAverageCrosses")
    && (isObjectVisible("golden-cross-marker") || isObjectVisible("death-cross-marker"));
  const hasVisibleVwapOverlay = advancedIndicators.vwap
    && isObjectVisible("vwap")
    && (isObjectVisible("vwap-line") || isObjectVisible("price-above-vwap-state"));
  const hasVisibleFiftyTwoWeekHighOverlay = advancedIndicators.fiftyTwoWeekHigh
    && isObjectVisible("fiftyTwoWeekHigh")
    && (isObjectVisible("52w-high-level") || isObjectVisible("new-52w-high-marker"));
  const hasVisibleFiftyTwoWeekLowOverlay = advancedIndicators.fiftyTwoWeekLow
    && isObjectVisible("fiftyTwoWeekLow")
    && (isObjectVisible("52w-low-level") || isObjectVisible("new-52w-low-marker"));
  const hasVisibleAthOverlay = advancedIndicators.ath
    && isObjectVisible("ath")
    && (isObjectVisible("ath-level") || isObjectVisible("new-ath-marker"));
  const hasVisibleAtlOverlay = advancedIndicators.atl
    && isObjectVisible("atl")
    && (isObjectVisible("atl-level") || isObjectVisible("new-atl-marker"));
  const hasVisibleBreakoutResistanceOverlay = advancedIndicators.breakoutResistance
    && isObjectVisible("breakoutResistance")
    && isObjectVisible("breakout-resistance-marker");
  const hasVisibleBreakdownSupportOverlay = advancedIndicators.breakdownSupport
    && isObjectVisible("breakdownSupport")
    && isObjectVisible("breakdown-support-marker");
  const hasVisibleGapUpOverlay = advancedIndicators.gapUp
    && isObjectVisible("gapUp")
    && isObjectVisible("gap-up-marker");
  const hasVisibleGapDownOverlay = advancedIndicators.gapDown
    && isObjectVisible("gapDown")
    && isObjectVisible("gap-down-marker");
  const hasVisibleTrueGapUpOverlay = advancedIndicators.trueGapUp
    && isObjectVisible("trueGapUp")
    && isObjectVisible("true-gap-up-marker");
  const hasVisibleTrueGapDownOverlay = advancedIndicators.trueGapDown
    && isObjectVisible("trueGapDown")
    && isObjectVisible("true-gap-down-marker");
  const hasVisibleGapPctOverlay = advancedIndicators.gapPct
    && isObjectVisible("gapPct")
    && isObjectVisible("gap-pct-label");
  const hasVisibleConsecutiveUpDaysOverlay = advancedIndicators.consecutiveUpDays
    && isObjectVisible("consecutiveUpDays")
    && isObjectVisible("up-streak-badge");
  const hasVisibleConsecutiveDownDaysOverlay = advancedIndicators.consecutiveDownDays
    && isObjectVisible("consecutiveDownDays")
    && isObjectVisible("down-streak-badge");
  const hasVisibleInsideBarOverlay = advancedIndicators.insideBar
    && isObjectVisible("insideBar")
    && isObjectVisible("inside-bar-outline");
  const hasVisibleOutsideBarOverlay = advancedIndicators.outsideBar
    && isObjectVisible("outsideBar")
    && isObjectVisible("outside-bar-outline");
  const hasVisibleDojiOverlay = advancedIndicators.doji
    && isObjectVisible("doji")
    && isObjectVisible("doji-marker");
  const hasVisibleLongLeggedDojiOverlay = advancedIndicators.longLeggedDoji
    && isObjectVisible("longLeggedDoji")
    && isObjectVisible("long-legged-doji-marker");
  const hasVisibleRickshawManOverlay = advancedIndicators.rickshawMan
    && isObjectVisible("rickshawMan")
    && isObjectVisible("rickshaw-man-marker");
  const hasVisibleDragonflyDojiOverlay = advancedIndicators.dragonflyDoji
    && isObjectVisible("dragonflyDoji")
    && isObjectVisible("dragonfly-doji-marker");
  const hasVisibleGravestoneDojiOverlay = advancedIndicators.gravestoneDoji
    && isObjectVisible("gravestoneDoji")
    && isObjectVisible("gravestone-doji-marker");
  const hasVisibleTristarOverlay = advancedIndicators.tristar
    && isObjectVisible("tristar")
    && isObjectVisible("tristar-zone");
  const hasVisibleHammerOverlay = advancedIndicators.hammer
    && isObjectVisible("hammer")
    && isObjectVisible("hammer-marker");
  const hasVisibleHangingManOverlay = advancedIndicators.hangingMan
    && isObjectVisible("hangingMan")
    && isObjectVisible("hanging-man-marker");
  const hasVisibleTakuriOverlay = advancedIndicators.takuri
    && isObjectVisible("takuri")
    && isObjectVisible("takuri-marker");
  const hasVisibleInvertedHammerOverlay = advancedIndicators.invertedHammer
    && isObjectVisible("invertedHammer")
    && isObjectVisible("inverted-hammer-marker");
  const hasVisibleShootingStarOverlay = advancedIndicators.shootingStar
    && isObjectVisible("shootingStar")
    && isObjectVisible("shooting-star-marker");
  const hasVisibleMarubozuBullOverlay = advancedIndicators.marubozuBull
    && isObjectVisible("marubozuBull")
    && isObjectVisible("marubozu-bull-outline");
  const hasVisibleMarubozuBearOverlay = advancedIndicators.marubozuBear
    && isObjectVisible("marubozuBear")
    && isObjectVisible("marubozu-bear-outline");
  const hasVisibleSpinningTopOverlay = advancedIndicators.spinningTop
    && isObjectVisible("spinningTop")
    && isObjectVisible("spinning-top-marker");
  const hasVisibleHistoricalVolatilityPanel = (advancedIndicators.hv10 && isObjectVisible("hv10"))
    || (advancedIndicators.hv20 && isObjectVisible("hv20"))
    || (advancedIndicators.hv30 && isObjectVisible("hv30"))
    || (advancedIndicators.hv60 && isObjectVisible("hv60"))
    || (advancedIndicators.hv90 && isObjectVisible("hv90"))
    || (advancedIndicators.hv252 && isObjectVisible("hv252"));
  const hasVisibleObvPanel = advancedIndicators.obv && isObjectVisible("obv");
  const hasVisibleAdLinePanel = advancedIndicators.adLine && isObjectVisible("adLine");
  const hasVisibleCmfPanel = advancedIndicators.cmf20 && isObjectVisible("cmf20");
  const hasVisibleNviPanel = advancedIndicators.nvi && isObjectVisible("nvi");
  const hasVisiblePviPanel = advancedIndicators.pvi && isObjectVisible("pvi");
  const hasVisibleChaikinOscPanel = advancedIndicators.chaikinOsc && isObjectVisible("chaikinOsc");
  const hasVisibleVolumeOscPanel = advancedIndicators.volumeOsc && isObjectVisible("volumeOsc");
  const hasVisibleVrocPanel = advancedIndicators.vroc14 && isObjectVisible("vroc14");
  const hasVisibleKlingerPanel = advancedIndicators.klinger
    && isObjectVisible("klinger")
    && (isObjectVisible("klinger-osc") || isObjectVisible("klinger-signal"));
  const hasVisibleElderForcePanel = advancedIndicators.elderForceIndex
    && isObjectVisible("elderForceIndex")
    && (isObjectVisible("elder-force-raw") || isObjectVisible("force-index-13"));
  const hasVisibleEomPanel = advancedIndicators.eom14 && isObjectVisible("eom14");
  const visibleComparisonSeries = comparisonSeries
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => {
      const id = getCompareSeriesId(entry.symbol);
      return isObjectVisible(id) && isCompareSeriesVisibleForTimeframe(entry.settings, chartConfig.timeframe);
    });
  const hasVisibleComparisonSeries = visibleComparisonSeries.length > 0;

  const mainSeriesVisible = isMainChartVisible && isObjectVisible("main-series");
  const chartTypePlan = buildChartTypeSeries({
    chartType: chartConfig.chartType,
    chartData,
    baseDates: dates,
    displaySymbol,
    palette: { upColor, downColor, textColor, liveColor },
    latestPrice,
    visible: mainSeriesVisible,
  });
  const volumeSourceSeries = buildDirectionalOhlcvSeries(chartTypePlan.volumeSourceData, {
    upColor,
    downColor,
    volumeColorMode: chartAppearance.volumeColorMode,
  });
  const renderDates = chartTypePlan.dates;
  const mainSeriesData = chartTypePlan.series.find((series) => series.id === "main-series")?.data;
  const renderedMainSeriesPointCount = Array.isArray(mainSeriesData) ? mainSeriesData.length : chartData.length;
  const priceOverlayPointCount = Math.min(renderDates.length, chartTypePlan.volumeSourceData.length || chartData.length, renderedMainSeriesPointCount);

  const shouldRenderVolumePanel = (chartConfig.indicators.volume || chartAppearance.showVolume) && isObjectVisible("volume") && !chartTypePlan.synthetic;

  const oscillatorPanels = [
    advancedIndicators.rsi && isObjectVisible("rsi") ? "RSI" : null,
    advancedIndicators.macd && isObjectVisible("macd") ? "MACD" : null,
    hasVisiblePpoPanel ? "PPO" : null,
    advancedIndicators.apo && isObjectVisible("apo") ? "APO" : null,
    hasVisibleAdxPanel ? "ADX" : null,
    hasVisibleAroonPanel ? "Aroon" : null,
    advancedIndicators.aroonOsc && isObjectVisible("aroonOsc") ? "Aroon Osc" : null,
    hasVisibleVortexPanel ? "Vortex" : null,
    advancedIndicators.trix && isObjectVisible("trix") ? "TRIX" : null,
    advancedIndicators.stc && isObjectVisible("stc") ? "STC" : null,
    advancedIndicators.massIndex && isObjectVisible("massIndex") ? "Mass Index" : null,
    hasVisibleKstPanel ? "KST" : null,
    hasVisibleLinearRegressionSlopePanel ? "LinReg Slope" : null,
    advancedIndicators.stochastic && isObjectVisible("stochastic") ? "Stoch" : null,
    advancedIndicators.atr && isObjectVisible("atr") ? "ATR 14" : null,
    advancedIndicators.atr20 && isObjectVisible("atr20") ? "ATR 20" : null,
    advancedIndicators.natr14 && isObjectVisible("natr14") ? "NATR 14" : null,
    hasVisibleHistoricalVolatilityPanel ? "HV" : null,
    advancedIndicators.stdDev20 && isObjectVisible("stdDev20") ? "Std Dev 20" : null,
    advancedIndicators.chaikinVol && isObjectVisible("chaikinVol") ? "Chaikin Volatility" : null,
    advancedIndicators.ulcerIndex && isObjectVisible("ulcerIndex") ? "Ulcer Index" : null,
    hasVisibleCciPanel ? "CCI" : null,
    advancedIndicators.mfi14 && isObjectVisible("mfi14") ? "MFI" : null,
    hasVisibleWilliamsRPanel ? "Will%R" : null,
    hasVisibleRocPanel ? "ROC" : null,
    hasVisibleRawMomentumPanel ? "Momentum" : null,
    advancedIndicators.cmo14 && isObjectVisible("cmo14") ? "CMO" : null,
    advancedIndicators.dymi && isObjectVisible("dymi") ? "DYMI" : null,
    advancedIndicators.ultimateOsc && isObjectVisible("ultimateOsc") ? "Ultimate" : null,
    advancedIndicators.dpo20 && isObjectVisible("dpo20") ? "DPO" : null,
    hasVisibleTsiPanel ? "TSI" : null,
    advancedIndicators.awesomeOsc && isObjectVisible("awesomeOsc") ? "AO" : null,
    advancedIndicators.acOsc && isObjectVisible("acOsc") ? "AC" : null,
    hasVisibleRviPanel ? "RVI" : null,
    hasVisibleFisherPanel ? "Fisher" : null,
    hasVisibleElderPanel ? "Elder" : null,
    advancedIndicators.coppock && isObjectVisible("coppock") ? "Coppock" : null,
    hasVisibleObvPanel ? "OBV" : null,
    hasVisibleAdLinePanel ? "A/D Line" : null,
    hasVisibleCmfPanel ? "CMF 20" : null,
    hasVisibleNviPanel ? "NVI" : null,
    hasVisiblePviPanel ? "PVI" : null,
    hasVisibleChaikinOscPanel ? "Chaikin Oscillator" : null,
    hasVisibleVolumeOscPanel ? "Volume Oscillator" : null,
    hasVisibleVrocPanel ? "VROC 14" : null,
    hasVisibleKlingerPanel ? "Klinger" : null,
    hasVisibleElderForcePanel ? "Elder Force Index" : null,
    hasVisibleEomPanel ? "EOM 14" : null,
    advancedIndicators.stochRsi && isObjectVisible("stochRsi") ? "StochRSI" : null,
    advancedIndicators.bbWidth && isObjectVisible("bbWidth") ? "BB Width" : null,
    advancedIndicators.bbPercentB && isObjectVisible("bbPercentB") ? "BB %B" : null,
  ].filter((panel): panel is string => panel !== null);

  const gridLeft = hasVisibleComparisonSeries ? 60 : MAIN_GRID_LEFT;
  const gridRight = TV_Y_AXIS_WIDTH;
  const topMarginPercent = 8;
  const bottomMarginPercent = 5;

  const panelCount = (shouldRenderVolumePanel ? 1 : 0) + oscillatorPanels.length;
  const panelSpacingPercent = panelCount > 1 ? 2.5 : 6;
  const panelHeightPercent = panelCount <= 1 ? 20 : Math.min(20, Math.max(7, (100 - topMarginPercent - bottomMarginPercent - 35 - panelSpacingPercent * panelCount) / panelCount));
  const mainGridHeightPercent = Math.max(
    panelCount <= 1 ? 30 : 35,
    100 - topMarginPercent - bottomMarginPercent - panelCount * (panelHeightPercent + panelSpacingPercent)
  );

  let nextPanelTopPercent = topMarginPercent + mainGridHeightPercent + panelSpacingPercent;

  const gridOptions: ChartOptionPart[] = [];
  const xAxisOptions: ChartOptionPart[] = [];
  const yAxisOptions: ChartOptionPart[] = [];
  const seriesOptions: ChartOptionPart[] = [];
  const graphicOptions: ChartOptionPart[] = [];
  const priceOverlayStatusNotes: string[] = [];
  let comparisonYAxisIndex = 0;

  const addPriceOverlayStatusNote = (text: string) => {
    if (priceOverlayStatusNotes.length >= 4 || priceOverlayStatusNotes.includes(text)) return;
    priceOverlayStatusNotes.push(text);
  };

  const getVolumeAxisMax = (value: { max: number }): number => {
    const averageVolume = volumeSourceSeries.volumes.reduce((acc, volumePoint) => acc + (Number(volumePoint[1]) || 0), 0) / (volumeSourceSeries.volumes.length || 1);
    const fallbackMax = value.max * 1.1 || 100;
    if (averageVolume <= 0) return fallbackMax;
    return Math.min(value.max, averageVolume * 5) || fallbackMax;
  };

  const getPriceAxisBoundaryPadding = (value: { min: number; max: number }): number => {
    const min = Number(value.min);
    const max = Number(value.max);
    if (!Number.isFinite(min) || !Number.isFinite(max)) return 0;
    const span = Math.max(max - min, Math.abs(min) * 0.001, Math.abs(max) * 0.001, 1);
    return span * 0.035;
  };

  const getPriceAxisMin = (value: { min: number; max: number }): number => {
    const min = Number(value.min);
    return Number.isFinite(min) ? min - getPriceAxisBoundaryPadding(value) : 0;
  };

  const getPriceAxisMax = (value: { min: number; max: number }): number => {
    const max = Number(value.max);
    return Number.isFinite(max) ? max + getPriceAxisBoundaryPadding(value) : 0;
  };

  const priceAxisBoundaryLevelPadding = (
    hasVisibleFiftyTwoWeekHighOverlay
    || hasVisibleFiftyTwoWeekLowOverlay
    || hasVisibleAthOverlay
    || hasVisibleAtlOverlay
  )
    ? { min: getPriceAxisMin, max: getPriceAxisMax }
    : {};

  gridOptions.push({
    left: gridLeft,
    right: gridRight,
    top: `${topMarginPercent}%`,
    height: `${Math.max(30, mainGridHeightPercent)}%`,
    containLabel: false,
  });

  xAxisOptions.push({
    id: "main-xaxis",
    type: "category",
    data: renderDates,
    boundaryGap: false,
    axisLine: { onZero: false, lineStyle: { color: textColor } },
    axisLabel: { color: textColor, hideOverlap: true },
    splitLine: { show: false },
    min: "dataMin",
    max: "dataMax",
  });

  yAxisOptions.push({
    id: "price-yaxis",
    position: "right",
    scale: true,
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { show: chartAppearance.showGrid, lineStyle: { color: "rgba(42, 46, 57, 0.5)", type: "dashed" } },
    axisLabel: { color: textColor, fontSize: 11, formatter: formatAxisPriceValue },
    axisPointer: { show: uiState.cursorMode !== "arrow", label: { show: false } },
    ...priceAxisBoundaryLevelPadding,
  });


  seriesOptions.push(...chartTypePlan.series);

  if (shouldRenderVolumePanel) {
    const volumeGridIndex = gridOptions.length;
    const volumeXAxisIndex = xAxisOptions.length;
    const volumeYAxisIndex = yAxisOptions.length;

    gridOptions.push({
      left: gridLeft,
      right: gridRight,
      top: `${nextPanelTopPercent}%`,
      height: `${panelHeightPercent}%`,
      containLabel: false,
    });

    xAxisOptions.push({
      id: "volume-xaxis",
      type: "category",
      gridIndex: volumeGridIndex,
      data: renderDates,
      boundaryGap: false,
      axisLabel: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      min: "dataMin",
      max: "dataMax"
    });

    yAxisOptions.push({
      id: "volume-yaxis",
      position: "right",
      gridIndex: volumeGridIndex,
      scale: true,
      axisLabel: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisPointer: { show: uiState.cursorMode !== "arrow", label: { show: false } },
      max: getVolumeAxisMax,
    });

    seriesOptions.push({
      id: "volume-bar",
      name: "Volume",
      type: "bar",
      xAxisIndex: volumeXAxisIndex,
      yAxisIndex: volumeYAxisIndex,
      encode: { x: 0, y: 1 },
      data: buildDirectionalVolumeBarData(volumeSourceSeries.volumes, { upColor, downColor }, 0.8, renderDates.length, renderDates),
      barWidth: "65%",
    });

    nextPanelTopPercent += panelHeightPercent + panelSpacingPercent;
  }

  const pushLine = (
    id: string,
    name: string,
    data: (number | string)[] | undefined,
    color: string,
    options: LineRenderOptions = {},
  ) => {
    if (!data || !isObjectVisible(id)) return;
    const showPointMarkers = options.showPointMarkers === true;
    const pointMarkerOptions = showPointMarkers
      ? { showSymbol: true, symbol: "circle", symbolSize: 4, emphasis: { scale: 1.35 } }
      : { showSymbol: false };
    const pointLimit = options.allowProjection === true
      ? Math.min(data.length, renderDates.length)
      : Math.min(data.length, priceOverlayPointCount);
    const lineData = Array.from({ length: pointLimit }, (_unused, index) => {
      const date = renderDates[index];
      if (!date) return null;
      return [date, toFiniteNumber(data[index])];
    });
    if (!lineData.some((point) => point !== null && point[1] !== null)) return;

    seriesOptions.push({
      id,
      name,
      type: "line",
      xAxisIndex: 0,
      yAxisIndex: 0,
      encode: { x: 0, y: 1 },
      data: lineData,
      ...pointMarkerOptions,
      clip: true,
      smooth: false,
      z: 18,
      lineStyle: { opacity: 0.9, width: 1.5, color },
      itemStyle: { color },
    });
  };

  const pushPriceLevelLine = (
    id: string,
    name: string,
    data: (number | string)[] | undefined,
    color: string,
    label: string,
  ) => {
    if (!data || !isObjectVisible(id)) return;
    const pointLimit = Math.min(data.length, priceOverlayPointCount);
    let latestLevel: number | null = null;
    const lineData = Array.from({ length: pointLimit }, (_unused, index) => {
      const date = renderDates[index];
      if (!date) return null;
      const value = toFiniteNumber(data[index]);
      if (value !== null) latestLevel = value;
      return [date, value];
    });
    if (latestLevel === null || !lineData.some((point) => point !== null && point[1] !== null)) return;

    seriesOptions.push({
      id,
      name,
      type: "line",
      xAxisIndex: 0,
      yAxisIndex: 0,
      encode: { x: 0, y: 1 },
      data: lineData,
      showSymbol: false,
      clip: true,
      step: "end",
      connectNulls: false,
      z: 28,
      legendHoverLink: false,
      lineStyle: { opacity: 0.9, width: 1.2, color, type: "dashed" },
      itemStyle: { color },
      markLine: {
        silent: true,
        symbol: ["none", "none"],
        animation: false,
        lineStyle: { color, opacity: 0.95, type: "dashed", width: 1.35 },
        label: {
          show: true,
          formatter: label,
          position: "end",
          color: "#ffffff",
          backgroundColor: color,
          borderRadius: 2,
          padding: [2, 4],
          distance: 6,
          fontSize: 10,
          fontWeight: 700,
        },
        data: [{ yAxis: latestLevel, name: label }],
      },
      labelLayout: { moveOverlap: "shiftY" },
    });
  };

  const pushPriceSignalMarkers = (
    id: string,
    name: string,
    signalData: (number | string)[] | undefined,
    color: string,
    direction: "up" | "down",
    priceSource: "high" | "low" | "close",
    options: PriceSignalMarkerOptions = {},
  ) => {
    if (!signalData || !isObjectVisible(id)) return;
    const pointLimit = Math.min(signalData.length, chartData.length, priceOverlayPointCount);
    const markerIndexes: number[] = [];
    const minBarGap = options.minBarGap ?? 1;
    const maxMarkers = options.maxMarkers ?? 16;
    let previousIndex = -Number.POSITIVE_INFINITY;

    for (let index = 0; index < pointLimit; index++) {
      const signalValue = toFiniteNumber(signalData[index]);
      if (signalValue !== 1 || index - previousIndex < minBarGap) continue;
      markerIndexes.push(index);
      previousIndex = index;
    }

    const visibleIndexes = options.latestOnly
      ? markerIndexes.slice(-1)
      : markerIndexes.slice(-maxMarkers);
    if (visibleIndexes.length === 0) return;

    const markerData = visibleIndexes.map((index) => {
      const date = renderDates[index];
      const price = toFiniteNumber(chartData[index]?.[priceSource]) ?? toFiniteNumber(chartData[index]?.close);
      if (!date || price === null) return null;
      return { value: [date, price], itemStyle: { color } };
    });
    if (!markerData.some((point) => point !== null)) return;

    seriesOptions.push({
      id,
      name: options.legendName ?? name,
      type: "scatter",
      xAxisIndex: 0,
      yAxisIndex: 0,
      data: markerData,
      symbol: "triangle",
      symbolRotate: direction === "up" ? 0 : 180,
      symbolSize: options.symbolSize ?? 8,
      symbolOffset: direction === "up" ? [0, 7] : [0, -7],
      z: 26,
      silent: true,
      legendHoverLink: false,
      tooltip: { show: false },
      itemStyle: { color, opacity: options.opacity ?? 0.82 },
      emphasis: { disabled: true },
    });
  };

  const getSignalIndexes = (
    signalData: (number | string)[] | undefined,
    options: { maxMarkers?: number; minBarGap?: number; threshold?: number; absolute?: boolean } = {},
  ): number[] => {
    if (!signalData) return [];
    const pointLimit = Math.min(signalData.length, chartData.length, priceOverlayPointCount);
    const markerIndexes: number[] = [];
    const threshold = options.threshold ?? 1;
    const minBarGap = options.minBarGap ?? 1;
    let previousIndex = -Number.POSITIVE_INFINITY;

    for (let index = 0; index < pointLimit; index++) {
      const signalValue = toFiniteNumber(signalData[index]);
      if (signalValue === null || (options.absolute ? Math.abs(signalValue) < threshold : signalValue < threshold) || index - previousIndex < minBarGap) continue;
      markerIndexes.push(index);
      previousIndex = index;
    }

    return markerIndexes.slice(-(options.maxMarkers ?? 24));
  };

  const getSeriesValue = (params: { value?: unknown }, dimension: number): number | null => {
    if (!Array.isArray(params.value)) return null;
    return toFiniteNumber(params.value[dimension]);
  };

  const hasSignalInVisibleWindow = (
    signalData: (number | string)[] | undefined,
    options: { minBarGap?: number; threshold?: number; absolute?: boolean } = {},
  ): boolean => getSignalIndexes(signalData, {
    maxMarkers: 1,
    minBarGap: options.minBarGap ?? 0,
    threshold: options.threshold ?? 1,
    absolute: options.absolute,
  }).length > 0;

  const countSignalsInVisibleWindow = (
    signalData: (number | string)[] | undefined,
    options: { threshold?: number; absolute?: boolean } = {},
  ): number => {
    if (!signalData) return 0;
    const pointLimit = Math.min(signalData.length, chartData.length, priceOverlayPointCount);
    const threshold = options.threshold ?? 1;
    let count = 0;

    for (let index = 0; index < pointLimit; index++) {
      const signalValue = toFiniteNumber(signalData[index]);
      if (signalValue === null) continue;
      const comparableValue = options.absolute ? Math.abs(signalValue) : signalValue;
      if (comparableValue >= threshold) count += 1;
    }

    return count;
  };

  const shouldRenderSignalOverlay = (
    label: string,
    signalData: (number | string)[] | undefined,
    options: { minBarGap?: number; threshold?: number; absolute?: boolean } = {},
  ): boolean => {
    const hasSignal = hasSignalInVisibleWindow(signalData, options);
    if (!hasSignal) addPriceOverlayStatusNote(`${label}: 0 signal`);
    return hasSignal;
  };

  const pushGapMarkers = (
    id: string,
    name: string,
    signalData: (number | string)[] | undefined,
    gapPctData: (number | string)[] | undefined,
    color: string,
    direction: "up" | "down",
    showPercentLabel: boolean,
    options: { maxMarkers?: number; minBarGap?: number; symbolSize?: number; opacity?: number; visibilityId?: string } = {},
  ) => {
    if (!signalData || !isObjectVisible(options.visibilityId ?? id)) return;
    const markerIndexes = getSignalIndexes(signalData, {
      maxMarkers: options.maxMarkers ?? 14,
      minBarGap: options.minBarGap ?? 2,
    });
    if (markerIndexes.length === 0) return;

    const markerData = markerIndexes.map((index) => {
      const date = renderDates[index];
      const open = toFiniteNumber(chartData[index]?.open);
      const previousClose = index > 0 ? toFiniteNumber(chartData[index - 1]?.close) : null;
      const gapPct = gapPctData ? toFiniteNumber(gapPctData[index]) : null;
      if (!date || open === null || previousClose === null) return null;
      return { value: [date, (open + previousClose) / 2, gapPct], itemStyle: { color } };
    }).filter((point): point is { value: (string | number | null)[]; itemStyle: { color: string } } => point !== null);
    if (markerData.length === 0) return;

    seriesOptions.push({
      id,
      name,
      type: "scatter",
      xAxisIndex: 0,
      yAxisIndex: 0,
      encode: { x: 0, y: 1, tooltip: 2 },
      data: markerData,
      symbol: "diamond",
      symbolSize: options.symbolSize ?? 7,
      z: 27,
      silent: true,
      legendHoverLink: false,
      itemStyle: { color, opacity: options.opacity ?? 0.78 },
      label: {
        show: showPercentLabel,
        formatter: (params: { value?: unknown }) => {
          const pct = getSeriesValue(params, 2);
          if (pct === null) return "";
          const prefix = pct > 0 ? "+" : "";
          return `${prefix}${formatSignalNumber(pct, 2)}%`;
        },
        position: direction === "up" ? "top" : "bottom",
        color,
        backgroundColor: "rgba(15, 23, 42, 0.78)",
        borderColor: color,
        borderWidth: 1,
        borderRadius: 2,
        padding: [2, 4],
        fontSize: 9,
        fontWeight: 700,
      },
      emphasis: { disabled: true },
    });
  };

  const pushStreakBadges = (
    id: string,
    name: string,
    streakData: (number | string)[] | undefined,
    color: string,
    direction: "up" | "down",
  ) => {
    if (!streakData || !isObjectVisible(id)) return;
    const markerIndexes = getSignalIndexes(streakData, { maxMarkers: 16, minBarGap: 2, threshold: 2 });
    if (markerIndexes.length === 0) return;

    const markerData = markerIndexes.map((index) => {
      const date = renderDates[index];
      const count = toFiniteNumber(streakData[index]);
      const price = direction === "up"
        ? toFiniteNumber(chartData[index]?.high)
        : toFiniteNumber(chartData[index]?.low);
      if (!date || count === null || count < 2 || price === null) return null;
      return { value: [date, price, count] };
    }).filter((point): point is { value: (string | number)[] } => point !== null);
    if (markerData.length === 0) return;

    seriesOptions.push({
      id,
      name,
      type: "scatter",
      xAxisIndex: 0,
      yAxisIndex: 0,
      encode: { x: 0, y: 1, tooltip: 2 },
      data: markerData,
      symbol: "circle",
      symbolSize: 1,
      symbolOffset: direction === "up" ? [0, -13] : [0, 13],
      z: 30,
      silent: true,
      legendHoverLink: false,
      itemStyle: { color: "transparent", opacity: 0 },
      label: {
        show: true,
        formatter: (params: { value?: unknown }) => {
          const count = getSeriesValue(params, 2);
          if (count === null) return "";
          return direction === "up" ? `+${count}` : `-${count}`;
        },
        position: direction === "up" ? "top" : "bottom",
        color: "#ffffff",
        backgroundColor: color,
        borderRadius: 2,
        padding: [2, 4],
        fontSize: 9,
        fontWeight: 800,
      },
      emphasis: { disabled: true },
    });
  };

  const pushBarStructureOutlines = (
    id: string,
    name: string,
    signalData: (number | string)[] | undefined,
    color: string,
    lineWidth: number,
    opacity: number,
  ) => {
    if (!signalData || !isObjectVisible(id)) return;
    const markerIndexes = getSignalIndexes(signalData, { maxMarkers: 96, minBarGap: 1 });
    if (markerIndexes.length === 0) return;

    const outlineData = markerIndexes.map((index) => {
      const low = toFiniteNumber(chartData[index]?.low);
      const high = toFiniteNumber(chartData[index]?.high);
      if (low === null || high === null) return null;
      return [index, low, high];
    }).filter((point): point is number[] => point !== null);
    if (outlineData.length === 0) return;

    seriesOptions.push({
      id,
      name,
      type: "custom",
      ...PRICE_CUSTOM_SERIES_BINDING,
      data: outlineData,
      silent: true,
      z: 31,
      renderItem: (params: { coordSys?: { width: number } }, api: CustomRenderApi) => {
        const xIndex = toFiniteNumber(api.value(0));
        const low = toFiniteNumber(api.value(1));
        const high = toFiniteNumber(api.value(2));
        if (!params.coordSys || xIndex === null || low === null || high === null) return undefined;

        const highCoord = api.coord([xIndex, high]);
        const lowCoord = api.coord([xIndex, low]);
        const bandWidth = Math.max(4, Math.min(15, (params.coordSys.width / Math.max(1, priceOverlayPointCount)) * 0.72));
        const top = Math.min(highCoord[1], lowCoord[1]);
        const height = Math.max(3, Math.abs(lowCoord[1] - highCoord[1]));
        return {
          type: "rect",
          shape: {
            x: highCoord[0] - bandWidth / 2,
            y: top,
            width: bandWidth,
            height,
          },
          style: api.style({ fill: "rgba(0,0,0,0)", stroke: color, lineWidth, opacity }),
        };
      },
    });
  };

  type CandlestickPatternSeriesMap = Partial<Record<CandlestickPatternKey, (number | string)[]>>;
  type CandlestickQualityKey = "insufficientHistory" | "missingOHLC" | "invalidOHLC" | "zeroRange" | "noTradeSession" | "stalePrice" | "corporateActionSuspected" | "lowReliabilityBecauseIlliquid";
  type CandlestickQualitySeriesMap = Partial<Record<CandlestickQualityKey, (number | string)[]>>;

  const isCandlestickSignalActive = (signalData: (number | string)[] | undefined, index: number): boolean => {
    const value = toFiniteNumber(signalData?.[index]);
    return value !== null && Math.abs(value) > 0;
  };

  const isTristarSignalActive = (signalData: (number | string)[] | undefined, index: number): boolean => {
    const value = toFiniteNumber(signalData?.[index]);
    return value !== null && Math.abs(value) === 100;
  };

  const isIndexCoveredByTristar = (tristarData: (number | string)[] | undefined, index: number): boolean => {
    if (!tristarData) return false;
    for (let tristarIndex = index; tristarIndex <= index + 2 && tristarIndex < tristarData.length; tristarIndex++) {
      if (isTristarSignalActive(tristarData, tristarIndex) && index >= tristarIndex - 2) return true;
    }
    return false;
  };

  const shouldRenderCandlestickPattern = (
    pattern: CandlestickPatternKey,
    index: number,
    patternSeries: CandlestickPatternSeriesMap,
  ): boolean => {
    if (pattern !== "tristar" && isIndexCoveredByTristar(patternSeries.tristar, index)) return false;
    const patternRank = CANDLESTICK_PATTERN_PRIORITY.indexOf(pattern);
    if (patternRank < 0) return false;
    return !CANDLESTICK_PATTERN_PRIORITY
      .slice(0, patternRank)
      .some((candidate) => isCandlestickSignalActive(patternSeries[candidate], index));
  };

  const getCandlestickPatternIndexes = (
    signalData: (number | string)[] | undefined,
    pattern: CandlestickPatternKey,
    patternSeries: CandlestickPatternSeriesMap,
  ): number[] => {
    const presentation = getCandlestickPatternPresentation(pattern);
    return getSignalIndexes(signalData, {
      maxMarkers: presentation.maxMarkers,
      minBarGap: presentation.minBarGap,
      absolute: true,
    }).filter((index) => shouldRenderCandlestickPattern(pattern, index, patternSeries));
  };

  const pushCandlestickPatternMarkers = (
    signalData: (number | string)[] | undefined,
    pattern: CandlestickPatternKey,
    patternSeries: CandlestickPatternSeriesMap,
    confirmedData?: (number | string)[],
  ): number => {
    const presentation = getCandlestickPatternPresentation(pattern);
    if (!signalData || !isObjectVisible(presentation.markerId)) return 0;

    const markerIndexes = getCandlestickPatternIndexes(signalData, pattern, patternSeries);
    if (markerIndexes.length === 0) return 0;

    const markerPoints = markerIndexes.map((index) => {
      const date = renderDates[index];
      const high = toFiniteNumber(chartData[index]?.high);
      const low = toFiniteNumber(chartData[index]?.low);
      const open = toFiniteNumber(chartData[index]?.open);
      const close = toFiniteNumber(chartData[index]?.close);
      if (!date || high === null || low === null || open === null || close === null) return null;
      const midpoint = (open + close) / 2;
      const price = presentation.position === "above" ? high : presentation.position === "below" ? low : midpoint;
      const confirmed = toFiniteNumber(confirmedData?.[index]);
      const opacity = confirmed === 0 ? 0.66 : presentation.opacity ?? 0.96;
      return {
        index,
        value: [date, price, confirmed],
        itemStyle: {
          color: presentation.color,
          opacity,
          borderColor: presentation.borderColor,
          borderWidth: 1,
        },
      };
    }).filter((point): point is {
      index: number;
      value: (string | number | null)[];
      itemStyle: { color: string; opacity: number; borderColor: string; borderWidth: number };
    } => point !== null);
    if (markerPoints.length === 0) return 0;

    const bandColor = presentation.verticalBandColor;
    if (bandColor) {
      const bandWidthRatio = presentation.verticalBandWidthRatio ?? 0.62;
      const bandZ = presentation.verticalBandZ ?? Math.max(0, presentation.z - 40);
      seriesOptions.push({
        id: `${presentation.markerId}-vertical-band`,
        type: "custom",
        ...PRICE_CUSTOM_SERIES_BINDING,
        data: markerPoints.map(({ index, value }) => [index, value[1]]),
        silent: true,
        legendHoverLink: false,
        tooltip: { show: false },
        z: bandZ,
        renderItem: (
          params: { coordSys?: { x: number; y: number; width: number; height: number } },
          api: CustomRenderApi,
        ) => {
          const xIndex = toFiniteNumber(api.value(0));
          const price = toFiniteNumber(api.value(1));
          if (!params.coordSys || xIndex === null || price === null) return undefined;

          const centerCoord = api.coord([xIndex, price]);
          const centerX = toFiniteNumber(centerCoord[0]);
          if (centerX === null) return undefined;

          const pointWidth = params.coordSys.width / Math.max(1, priceOverlayPointCount);
          const bandWidth = Math.max(4, Math.min(18, pointWidth * bandWidthRatio));
          return {
            type: "rect",
            shape: {
              x: centerX - bandWidth / 2,
              y: params.coordSys.y,
              width: bandWidth,
              height: params.coordSys.height,
            },
            style: { fill: bandColor, stroke: "rgba(0,0,0,0)" },
          };
        },
      });
    }

    const markerData = markerPoints.map(({ value, itemStyle }) => ({ value, itemStyle }));

    seriesOptions.push({
      id: presentation.markerId,
      name: presentation.legendName,
      type: "scatter",
      xAxisIndex: 0,
      yAxisIndex: 0,
      encode: { x: 0, y: 1, tooltip: 2 },
      data: markerData,
      symbol: presentation.symbol,
      symbolRotate: presentation.symbolRotate,
      symbolSize: presentation.symbolSize,
      symbolOffset: presentation.symbolOffset,
      z: presentation.z,
      silent: true,
      legendHoverLink: false,
      tooltip: { show: false },
      itemStyle: {
        color: presentation.color,
        borderColor: presentation.borderColor,
        borderWidth: 1,
        opacity: presentation.opacity ?? 0.96,
      },
      label: {
        show: presentation.showChartLabel && Boolean(presentation.chartLabel ?? presentation.shortLabel),
        formatter: (params: { value?: unknown }) => {
          const chartLabel = presentation.chartLabel ?? presentation.shortLabel;
          if (!chartLabel) return "";
          const confirmed = getSeriesValue(params, 2);
          return confirmed === 1 ? `${chartLabel}+` : chartLabel;
        },
        position: presentation.labelPosition,
        color: presentation.labelTextColor,
        backgroundColor: presentation.labelBackgroundColor,
        borderColor: presentation.labelBorderColor ?? presentation.borderColor,
        borderWidth: presentation.labelBorderWidth ?? 1,
        borderRadius: presentation.labelBorderRadius ?? 3,
        padding: presentation.labelPadding ?? [2, 5],
        fontSize: presentation.labelFontSize ?? 9,
        fontWeight: presentation.labelFontWeight ?? 800,
        lineHeight: presentation.labelLineHeight ?? 12,
        distance: presentation.labelDistance ?? 3,
      },
      labelLayout: { hideOverlap: true },
      emphasis: { disabled: true },
    });
    return markerData.length;
  };

  const pushMarubozuBodyOutlines = (
    id: string,
    name: string,
    signalData: (number | string)[] | undefined,
    color: string,
    pattern: CandlestickPatternKey,
    patternSeries: CandlestickPatternSeriesMap,
    options: { maxMarkers?: number; minBarGap?: number; lineWidth?: number; opacity?: number } = {},
  ): number => {
    if (!signalData || !isObjectVisible(id)) return 0;
    const markerIndexes = getSignalIndexes(signalData, {
      maxMarkers: options.maxMarkers ?? 36,
      minBarGap: options.minBarGap ?? 1,
      absolute: true,
    }).filter((index) => shouldRenderCandlestickPattern(pattern, index, patternSeries));
    if (markerIndexes.length === 0) return 0;

    const outlineData = markerIndexes.map((index) => {
      const open = toFiniteNumber(chartData[index]?.open);
      const close = toFiniteNumber(chartData[index]?.close);
      if (open === null || close === null) return null;
      return [index, open, close];
    }).filter((point): point is number[] => point !== null);
    if (outlineData.length === 0) return 0;

    seriesOptions.push({
      id,
      name,
      type: "custom",
      ...PRICE_CUSTOM_SERIES_BINDING,
      data: outlineData,
      silent: true,
      z: 33,
      renderItem: (params: { coordSys?: { width: number } }, api: CustomRenderApi) => {
        const xIndex = toFiniteNumber(api.value(0));
        const open = toFiniteNumber(api.value(1));
        const close = toFiniteNumber(api.value(2));
        if (!params.coordSys || xIndex === null || open === null || close === null) return undefined;

        const openCoord = api.coord([xIndex, open]);
        const closeCoord = api.coord([xIndex, close]);
        const bandWidth = Math.max(5, Math.min(18, (params.coordSys.width / Math.max(1, priceOverlayPointCount)) * 0.82));
        const top = Math.min(openCoord[1], closeCoord[1]);
        const height = Math.max(3, Math.abs(openCoord[1] - closeCoord[1]));
        return {
          type: "rect",
          shape: {
            x: openCoord[0] - bandWidth / 2,
            y: top,
            width: bandWidth,
            height,
          },
          style: api.style({
            fill: "rgba(0,0,0,0)",
            stroke: color,
            lineWidth: options.lineWidth ?? 2.2,
            opacity: options.opacity ?? 0.95,
          }),
        };
      },
    });
    return outlineData.length;
  };

  const pushTristarZones = (
    id: string,
    name: string,
    tristarData: (number | string)[] | undefined,
    options: { maxZones?: number } = {},
  ): number => {
    if (!tristarData || !isObjectVisible(id)) return 0;
    const pointLimit = Math.min(tristarData.length, chartData.length, priceOverlayPointCount);
    const zoneIndexes: number[] = [];
    for (let index = 2; index < pointLimit; index++) {
      if (isTristarSignalActive(tristarData, index)) zoneIndexes.push(index);
    }

    const visibleIndexes = zoneIndexes.slice(-(options.maxZones ?? 18));
    if (visibleIndexes.length === 0) return 0;

    const zoneData = visibleIndexes.map((index) => {
      const direction = toFiniteNumber(tristarData[index]);
      const lows = [chartData[index - 2]?.low, chartData[index - 1]?.low, chartData[index]?.low].map(toFiniteNumber);
      const highs = [chartData[index - 2]?.high, chartData[index - 1]?.high, chartData[index]?.high].map(toFiniteNumber);
      const lowValues = lows.filter((value): value is number => value !== null);
      const highValues = highs.filter((value): value is number => value !== null);
      if (direction === null || lowValues.length !== 3 || highValues.length !== 3) return null;
      return [index - 2, index, Math.min(...lowValues), Math.max(...highValues), direction > 0 ? 1 : -1];
    }).filter((point): point is number[] => point !== null);
    if (zoneData.length === 0) return 0;

    seriesOptions.push({
      id,
      name,
      type: "custom",
      ...PRICE_CUSTOM_SERIES_BINDING,
      data: zoneData,
      silent: true,
      z: 30,
      renderItem: (params: { coordSys?: { width: number } }, api: CustomRenderApi) => {
        const startIndex = toFiniteNumber(api.value(0));
        const endIndex = toFiniteNumber(api.value(1));
        const low = toFiniteNumber(api.value(2));
        const high = toFiniteNumber(api.value(3));
        const direction = toFiniteNumber(api.value(4));
        if (!params.coordSys || startIndex === null || endIndex === null || low === null || high === null || direction === null) return undefined;

        const highStartCoord = api.coord([startIndex, high]);
        const lowEndCoord = api.coord([endIndex, low]);
        const candlePadding = Math.max(4, Math.min(14, (params.coordSys.width / Math.max(1, priceOverlayPointCount)) * 0.48));
        const left = Math.min(highStartCoord[0], lowEndCoord[0]) - candlePadding;
        const right = Math.max(highStartCoord[0], lowEndCoord[0]) + candlePadding;
        const top = Math.min(highStartCoord[1], lowEndCoord[1]);
        const height = Math.max(8, Math.abs(lowEndCoord[1] - highStartCoord[1]));
        const bullish = direction > 0;
        const color = bullish ? "#22c55e" : "#f43f5e";
        const fill = bullish ? "rgba(34,197,94,0.08)" : "rgba(244,63,94,0.08)";
        return {
          type: "rect",
          shape: { x: left, y: top, width: Math.max(8, right - left), height },
          style: api.style({ fill, stroke: color, lineWidth: 1.6, opacity: 0.94 }),
        };
      },
    });
    return zoneData.length;
  };

  const getLatestRenderableIndex = (...series: Array<(number | string)[] | undefined>): number | null => {
    const maxIndex = Math.min(chartData.length, priceOverlayPointCount) - 1;
    for (let index = maxIndex; index >= 0; index--) {
      if (series.every((item) => !item || toFiniteNumber(item[index]) !== null)) return index;
    }
    return null;
  };

  const hasFiniteSeriesValue = (data: (number | string)[] | undefined): boolean =>
    Boolean(data?.some((value) => toFiniteNumber(value) !== null));

  const resolveRenderableSeries = (
    primary: (number | string)[] | undefined,
    fallback: (number | string)[] | undefined,
  ): (number | string)[] =>
    hasFiniteSeriesValue(primary) ? primary as (number | string)[] : fallback ?? [];

  const getMovingAverageLineData = (
    family: "sma" | "ema",
    dataKey: string,
    period: number,
  ): (number | string)[] => {
    const workerData = indicatorsData[dataKey];
    if (workerData) return workerData;

    return family === "sma"
      ? calculateSMA(chartData, period)
      : calculateEMA(chartData, period);
  };

  const getAdvancedMovingAverageLineData = (
    family: AdvancedMovingAverageFamily,
    dataKey: string,
    period: number,
  ): (number | string)[] => {
    const workerData = indicatorsData[dataKey];
    if (workerData) return workerData;

    if (family === "wma") return calculateWMA(chartData, period);
    if (family === "dema") return calculateDEMA(chartData, period);
    if (family === "tema") return calculateTEMA(chartData, period);
    if (family === "hma") return calculateHMA(chartData, period);
    if (family === "zlema") return calculateZLEMA(chartData, period);
    if (family === "alma") return calculateALMA(chartData, period);
    if (family === "smma") return calculateSMMA(chartData, period);
    if (family === "kama") return calculateKAMA(chartData, period);
    return calculateVWMA(chartData, period);
  };

  if (chartConfig.indicators.sma) {
    buildSmaSeriesDefinitions(indicatorPeriods, chartConfig.indicators.activeSma).forEach((series) => {
      pushLine(
        series.id,
        series.label,
        getMovingAverageLineData("sma", series.dataKey, series.period),
        series.color,
        { showPointMarkers: true },
      );
    });
  }

  if (chartConfig.indicators.ema) {
    buildEmaSeriesDefinitions(chartConfig.indicators.activeEma).forEach((series) => {
      pushLine(
        series.id,
        series.label,
        getMovingAverageLineData("ema", series.dataKey, series.period),
        series.color,
        { showPointMarkers: true },
      );
    });
  }

  buildAdvancedMovingAverageSeriesDefinitions(chartConfig.indicators).forEach((series) => {
    pushLine(
      series.seriesId,
      series.label,
      getAdvancedMovingAverageLineData(series.family, series.dataKey, series.period),
      series.color,
      { showPointMarkers: true },
    );
  });

  if (advancedIndicators.ichimoku) {
    pushLine("ichimoku-tenkan", "Tenkan", indicatorsData.tenkan, "#2962FF");
    pushLine("ichimoku-kijun", "Kijun", indicatorsData.kijun, "#B71C1C");
    pushLine("ichimoku-chikou", "Chikou", indicatorsData.chikou, "#43A047");
    pushLine("ichimoku-senkouA", "Senkou A", indicatorsData.senkouA, "#A5D6A7", { allowProjection: true });
    pushLine("ichimoku-senkouB", "Senkou B", indicatorsData.senkouB, "#EF9A9A", { allowProjection: true });

    const cloudData = buildBandFillData(indicatorsData.senkouA, indicatorsData.senkouB, renderDates.length);
    if (cloudData.length > 0) {
      seriesOptions.push({
        id: "ichimoku-cloud",
        name: "Kumo Cloud",
        type: "custom",
        ...PRICE_CUSTOM_SERIES_BINDING,
        renderItem: (_params: unknown, api: CustomRenderApi) => {
          const senkouA = toFiniteNumber(api.value(1));
          const senkouB = toFiniteNumber(api.value(2));
          const fill = senkouA !== null && senkouB !== null && senkouA >= senkouB ? "rgba(67, 160, 71, 0.15)" : "rgba(244, 67, 54, 0.15)";
          return renderBandPolygon(api, fill);
        },
        data: cloudData,
        z: 0,
      });
    }
  }

  if (advancedIndicators.bollinger) {
    const showBollingerFill = bollingerSettings.showFill !== false;
    const allowBollingerProjection = bollingerSettings.offset > 0;
    const bollingerPointLimit = allowBollingerProjection ? renderDates.length : priceOverlayPointCount;
    const bollingerFillData = buildBandFillData(indicatorsData.bollUpper, indicatorsData.bollLower, bollingerPointLimit);

    if (showBollingerFill && bollingerFillData.length > 0) {
      seriesOptions.push({
        id: "boll-fill",
        name: "BB Background",
        type: "custom",
        ...PRICE_CUSTOM_SERIES_BINDING,
        renderItem: (_params: unknown, api: CustomRenderApi) => renderBandPolygon(api, bollingerSettings.fillColor),
        data: bollingerFillData,
        itemStyle: { opacity: bollingerSettings.fillOpacity ?? 0.05 },
        z: 0,
      });
    }

    pushLine("boll-upper", "BB Upper", indicatorsData.bollUpper, bollingerSettings.upperColor, { allowProjection: allowBollingerProjection });
    pushLine("boll-mid", "BB Middle", indicatorsData.bollMiddle, bollingerSettings.middleColor, { allowProjection: allowBollingerProjection });
    pushLine("boll-lower", "BB Lower", indicatorsData.bollLower, bollingerSettings.lowerColor, { allowProjection: allowBollingerProjection });
  }

  if (hasVisibleDonchianOverlay) {
    const fallbackDonchian = indicatorsData.donchianUpper && indicatorsData.donchianMiddle && indicatorsData.donchianLower
      ? null
      : calculateDonchianChannels(chartData, 20);
    const upper = indicatorsData.donchianUpper ?? fallbackDonchian?.upper ?? [];
    const middle = indicatorsData.donchianMiddle ?? fallbackDonchian?.middle ?? [];
    const lower = indicatorsData.donchianLower ?? fallbackDonchian?.lower ?? [];
    const fillData = buildBandFillData(upper, lower, priceOverlayPointCount);

    if (isObjectVisible("donchian-upper") && isObjectVisible("donchian-lower") && fillData.length > 0) {
      seriesOptions.push({
        id: "donchian-fill",
        name: "Donchian Background",
        type: "custom",
        ...PRICE_CUSTOM_SERIES_BINDING,
        renderItem: (_params: unknown, api: CustomRenderApi) => renderBandPolygon(api, "rgba(6, 182, 212, 0.10)"),
        data: fillData,
        z: 0,
      });
    }

    pushLine("donchian-upper", "Donchian Upper", upper, "#06b6d4");
    pushLine("donchian-middle", "Donchian Middle", middle, "#67e8f9");
    pushLine("donchian-lower", "Donchian Lower", lower, "#06b6d4");
  }

  if (hasVisibleKeltnerOverlay) {
    const fallbackKeltner = indicatorsData.keltnerUpper && indicatorsData.keltnerMiddle && indicatorsData.keltnerLower
      ? null
      : calculateKeltnerChannels(chartData, 20, 2, 20);
    const upper = indicatorsData.keltnerUpper ?? fallbackKeltner?.upper ?? [];
    const middle = indicatorsData.keltnerMiddle ?? fallbackKeltner?.middle ?? [];
    const lower = indicatorsData.keltnerLower ?? fallbackKeltner?.lower ?? [];
    const fillData = buildBandFillData(upper, lower, priceOverlayPointCount);

    if (isObjectVisible("keltner-upper") && isObjectVisible("keltner-lower") && fillData.length > 0) {
      seriesOptions.push({
        id: "keltner-fill",
        name: "Keltner Background",
        type: "custom",
        ...PRICE_CUSTOM_SERIES_BINDING,
        renderItem: (_params: unknown, api: CustomRenderApi) => renderBandPolygon(api, "rgba(245, 158, 11, 0.10)"),
        data: fillData,
        z: 0,
      });
    }

    pushLine("keltner-upper", "Keltner Upper", upper, "#f59e0b");
    pushLine("keltner-middle", "Keltner Middle", middle, "#fbbf24");
    pushLine("keltner-lower", "Keltner Lower", lower, "#f59e0b");
  }

  if (hasVisibleVolumeProfileOverlay && priceOverlayPointCount > 0) {
    const profile = calculateVolumeProfile(chartData, {
      rangeMode: "last_n_bars",
      numberOfRows: 80,
      valueAreaPercent: 70,
      maxBars: Math.min(150, chartData.length),
    });
    const lastRenderableIndex = priceOverlayPointCount - 1;

    if (profile && profile.rows.length > 0) {
      const profileBarData = profile.rows.map((row) => [
        lastRenderableIndex,
        row.priceLow,
        row.priceHigh,
        row.totalVolume,
        profile.maxVolume,
        row.isValueArea ? 1 : 0,
      ]);

      if (isObjectVisible("volume-profile-rows")) {
        seriesOptions.push({
          id: "volume-profile-rows",
          name: "Volume Profile",
          type: "custom",
          coordinateSystem: "cartesian2d",
          xAxisIndex: 0,
          yAxisIndex: 0,
          encode: { x: 0 },
          clip: true,
          data: profileBarData,
          silent: true,
          z: 7,
          renderItem: (params: { coordSys?: { x: number; width: number } }, api: CustomRenderApi) => {
            const priceLowValue = toFiniteNumber(api.value(1));
            const priceHighValue = toFiniteNumber(api.value(2));
            const volumeValue = toFiniteNumber(api.value(3));
            const maxVolumeValue = toFiniteNumber(api.value(4));
            const isValueArea = Number(api.value(5)) === 1;
            if (!params.coordSys || priceLowValue === null || priceHighValue === null || volumeValue === null || maxVolumeValue === null || maxVolumeValue <= 0) {
              return undefined;
            }

            const yHigh = api.coord([lastRenderableIndex, priceHighValue])[1];
            const yLow = api.coord([lastRenderableIndex, priceLowValue])[1];
            const maxProfileWidth = Math.min(180, params.coordSys.width * 0.18);
            const barWidth = Math.max(1, maxProfileWidth * (volumeValue / maxVolumeValue));
            return {
              type: "rect",
              shape: {
                x: params.coordSys.x + params.coordSys.width - barWidth,
                y: Math.min(yHigh, yLow),
                width: barWidth,
                height: Math.max(1, Math.abs(yLow - yHigh)),
              },
              style: api.style({
                fill: isValueArea ? "rgba(14, 165, 233, 0.30)" : "rgba(148, 163, 184, 0.18)",
                stroke: "rgba(15, 23, 42, 0.22)",
                lineWidth: 0.4,
              }),
            };
          },
        });
      }

      const buildProfileLevelLine = (level: number | null): (number | string)[] =>
        level === null ? [] : new Array(priceOverlayPointCount).fill(level);

      if (isObjectVisible("vp-poc")) pushLine("vp-poc", "POC", buildProfileLevelLine(profile.poc), "#f59e0b");
      if (isObjectVisible("vp-vah")) pushLine("vp-vah", "VAH", buildProfileLevelLine(profile.vah), "#22d3ee");
      if (isObjectVisible("vp-val")) pushLine("vp-val", "VAL", buildProfileLevelLine(profile.val), "#22d3ee");

      graphicOptions.push({
        type: "text",
        right: gridRight + 16,
        top: 38,
        silent: true,
        z: 80,
        style: {
          text: `Volume Profile · Profil approximatif · VA ${profile.valueAreaPercent}%`,
          fill: "rgba(160, 174, 192, 0.78)",
          font: "600 10px Inter, system-ui, sans-serif",
        },
      });
    } else {
      graphicOptions.push({
        type: "text",
        right: gridRight + 16,
        top: 38,
        silent: true,
        z: 80,
        style: {
          text: "Volume Profile indisponible",
          fill: "rgba(248, 113, 113, 0.82)",
          font: "600 10px Inter, system-ui, sans-serif",
        },
      });
    }
  }

  if (hasVisiblePivotStandardOverlay) {
    const fallbackStandardPivots = indicatorsData.pivotStandard
      && indicatorsData.pivotR1
      && indicatorsData.pivotR2
      && indicatorsData.pivotR3
      && indicatorsData.pivotS1
      && indicatorsData.pivotS2
      && indicatorsData.pivotS3
      ? null
      : calculatePivotPointsStandard(chartData);
    const standardSpecs = [
      { id: "pivot-standard-p", name: "Pivot", key: "pivotStandard", data: fallbackStandardPivots?.pivot, color: "#cbd5e1", label: "P" },
      { id: "pivot-standard-r1", name: "R1", key: "pivotR1", data: fallbackStandardPivots?.r1, color: "#fb7185", label: "R1" },
      { id: "pivot-standard-r2", name: "R2", key: "pivotR2", data: fallbackStandardPivots?.r2, color: "#f43f5e", label: "R2" },
      { id: "pivot-standard-r3", name: "R3", key: "pivotR3", data: fallbackStandardPivots?.r3, color: "#e11d48", label: "R3" },
      { id: "pivot-standard-s1", name: "S1", key: "pivotS1", data: fallbackStandardPivots?.s1, color: "#34d399", label: "S1" },
      { id: "pivot-standard-s2", name: "S2", key: "pivotS2", data: fallbackStandardPivots?.s2, color: "#10b981", label: "S2" },
      { id: "pivot-standard-s3", name: "S3", key: "pivotS3", data: fallbackStandardPivots?.s3, color: "#059669", label: "S3" },
    ];
    standardSpecs.forEach((spec) => {
      pushPriceLevelLine(
        spec.id,
        `Standard ${spec.name}`,
        indicatorsData[spec.key] ?? spec.data ?? [],
        spec.color,
        spec.label,
      );
    });
  }

  if (hasVisiblePivotFibonacciOverlay) {
    const fallbackFibonacciPivots = indicatorsData.pivotFibP
      && indicatorsData.pivotFibR1
      && indicatorsData.pivotFibR2
      && indicatorsData.pivotFibR3
      && indicatorsData.pivotFibS1
      && indicatorsData.pivotFibS2
      && indicatorsData.pivotFibS3
      ? null
      : calculatePivotPointsFibonacci(chartData);
    const fibonacciSpecs = [
      { id: "pivot-fib-p", name: "Pivot", key: "pivotFibP", data: fallbackFibonacciPivots?.pivot, color: "#c4b5fd", label: "P" },
      { id: "pivot-fib-r1", name: "Fib R1", key: "pivotFibR1", data: fallbackFibonacciPivots?.r1, color: "#fbbf24", label: "Fib R1" },
      { id: "pivot-fib-r2", name: "Fib R2", key: "pivotFibR2", data: fallbackFibonacciPivots?.r2, color: "#f59e0b", label: "Fib R2" },
      { id: "pivot-fib-r3", name: "Fib R3", key: "pivotFibR3", data: fallbackFibonacciPivots?.r3, color: "#d97706", label: "Fib R3" },
      { id: "pivot-fib-s1", name: "Fib S1", key: "pivotFibS1", data: fallbackFibonacciPivots?.s1, color: "#67e8f9", label: "Fib S1" },
      { id: "pivot-fib-s2", name: "Fib S2", key: "pivotFibS2", data: fallbackFibonacciPivots?.s2, color: "#22d3ee", label: "Fib S2" },
      { id: "pivot-fib-s3", name: "Fib S3", key: "pivotFibS3", data: fallbackFibonacciPivots?.s3, color: "#0891b2", label: "Fib S3" },
    ];
    fibonacciSpecs.forEach((spec) => {
      pushPriceLevelLine(
        spec.id,
        spec.name,
        indicatorsData[spec.key] ?? spec.data ?? [],
        spec.color,
        spec.label,
      );
    });
  }

  if (hasVisibleMovingAverageCrossesOverlay) {
    const fallbackCrosses = hasFiniteSeriesValue(indicatorsData.goldenCross) && hasFiniteSeriesValue(indicatorsData.deathCross)
      ? null
      : calculateMovingAverageCrossSignals(chartData, 50, 200);
    pushPriceSignalMarkers(
      "golden-cross-marker",
      "Golden Cross",
      resolveRenderableSeries(indicatorsData.goldenCross, fallbackCrosses?.goldenCross),
      "#22c55e",
      "up",
      "low",
      { legendName: "Croisements de moyennes", maxMarkers: 10, minBarGap: 6, symbolSize: 7, opacity: 0.78 },
    );
    pushPriceSignalMarkers(
      "death-cross-marker",
      "Death Cross",
      resolveRenderableSeries(indicatorsData.deathCross, fallbackCrosses?.deathCross),
      "#ef4444",
      "down",
      "high",
      { legendName: "Croisements de moyennes", maxMarkers: 10, minBarGap: 6, symbolSize: 7, opacity: 0.78 },
    );
  }

  if (hasVisibleVwapOverlay) {
    const fallbackVwap = hasFiniteSeriesValue(indicatorsData.vwap)
      && hasFiniteSeriesValue(indicatorsData.priceAboveVwap)
      && hasFiniteSeriesValue(indicatorsData.vwapDistancePct)
      ? null
      : calculateVWAP(chartData);
    const vwapLine = resolveRenderableSeries(indicatorsData.vwap, fallbackVwap?.vwap);
    const priceAboveVwap = resolveRenderableSeries(indicatorsData.priceAboveVwap, fallbackVwap?.priceAboveVwap);
    const vwapDistancePct = resolveRenderableSeries(indicatorsData.vwapDistancePct, fallbackVwap?.distancePct);

    if (isObjectVisible("vwap-line")) {
      pushLine("vwap-line", "VWAP", vwapLine, "#14b8a6");
    }

    if (isObjectVisible("price-above-vwap-state")) {
      const latestIndex = getLatestRenderableIndex(vwapLine, priceAboveVwap);
      if (latestIndex !== null) {
        const isAbove = toFiniteNumber(priceAboveVwap[latestIndex]) === 1;
        const distanceText = formatSignalNumber(toFiniteNumber(vwapDistancePct[latestIndex]), 2);
        graphicOptions.push({
          type: "text",
          right: gridRight + 16,
          top: 56,
          silent: true,
          z: 80,
          style: {
            text: `VWAP · ${isAbove ? "au-dessus" : "en-dessous"} · ${distanceText}%`,
            fill: isAbove ? "rgba(34, 197, 94, 0.88)" : "rgba(248, 113, 113, 0.88)",
            font: "600 10px Inter, system-ui, sans-serif",
          },
        });
      }
    }
  }

  let fiftyTwoWeekFallback: ReturnType<typeof calculateFiftyTwoWeekLevels> | null = null;
  const getFiftyTwoWeekFallback = () => {
    if (!fiftyTwoWeekFallback) fiftyTwoWeekFallback = calculateFiftyTwoWeekLevels(chartData);
    return fiftyTwoWeekFallback;
  };

  if (hasVisibleFiftyTwoWeekHighOverlay) {
    const fallback = hasFiniteSeriesValue(indicatorsData.fiftyTwoWeekHigh) && hasFiniteSeriesValue(indicatorsData.newFiftyTwoWeekHigh)
      ? null
      : getFiftyTwoWeekFallback();
    pushPriceLevelLine(
      "52w-high-level",
      "52W High",
      resolveRenderableSeries(indicatorsData.fiftyTwoWeekHigh, fallback?.high),
      "#f97316",
      "52W High",
    );
    pushPriceSignalMarkers(
      "new-52w-high-marker",
      "New 52W High",
      resolveRenderableSeries(indicatorsData.newFiftyTwoWeekHigh, fallback?.newHigh),
      "#fb923c",
      "down",
      "high",
      { legendName: "52W High", latestOnly: true, symbolSize: 7, opacity: 0.78 },
    );
  }

  if (hasVisibleFiftyTwoWeekLowOverlay) {
    const fallback = hasFiniteSeriesValue(indicatorsData.fiftyTwoWeekLow) && hasFiniteSeriesValue(indicatorsData.newFiftyTwoWeekLow)
      ? null
      : getFiftyTwoWeekFallback();
    pushPriceLevelLine(
      "52w-low-level",
      "52W Low",
      resolveRenderableSeries(indicatorsData.fiftyTwoWeekLow, fallback?.low),
      "#38bdf8",
      "52W Low",
    );
    pushPriceSignalMarkers(
      "new-52w-low-marker",
      "New 52W Low",
      resolveRenderableSeries(indicatorsData.newFiftyTwoWeekLow, fallback?.newLow),
      "#0ea5e9",
      "up",
      "low",
      { legendName: "52W Low", latestOnly: true, symbolSize: 7, opacity: 0.78 },
    );
  }

  let historicalRecordFallback: ReturnType<typeof calculateHistoricalRecordLevels> | null = null;
  const getHistoricalRecordFallback = () => {
    if (!historicalRecordFallback) historicalRecordFallback = calculateHistoricalRecordLevels(chartData);
    return historicalRecordFallback;
  };

  if (hasVisibleAthOverlay) {
    const fallback = hasFiniteSeriesValue(indicatorsData.ath) && hasFiniteSeriesValue(indicatorsData.newAth)
      ? null
      : getHistoricalRecordFallback();
    pushPriceLevelLine("ath-level", "ATH", resolveRenderableSeries(indicatorsData.ath, fallback?.ath), "#facc15", "ATH");
    pushPriceSignalMarkers(
      "new-ath-marker",
      "New ATH",
      resolveRenderableSeries(indicatorsData.newAth, fallback?.newAth),
      "#fde047",
      "down",
      "high",
      { legendName: "ATH", latestOnly: true, symbolSize: 7, opacity: 0.78 },
    );
  }

  if (hasVisibleAtlOverlay) {
    const fallback = hasFiniteSeriesValue(indicatorsData.atl) && hasFiniteSeriesValue(indicatorsData.newAtl)
      ? null
      : getHistoricalRecordFallback();
    pushPriceLevelLine("atl-level", "ATL", resolveRenderableSeries(indicatorsData.atl, fallback?.atl), "#a78bfa", "ATL");
    pushPriceSignalMarkers(
      "new-atl-marker",
      "New ATL",
      resolveRenderableSeries(indicatorsData.newAtl, fallback?.newAtl),
      "#c084fc",
      "up",
      "low",
      { legendName: "ATL", latestOnly: true, symbolSize: 7, opacity: 0.78 },
    );
  }

  let priceActionFallback: ReturnType<typeof calculatePriceActionSignals> | null = null;
  const getPriceActionFallback = () => {
    if (!priceActionFallback) priceActionFallback = calculatePriceActionSignals(chartData, { lookback: 20, minBreakTicks: 1, minGapTicks: 1 });
    return priceActionFallback;
  };
  const getPriceActionSeries = (workerKey: string, fallbackKey: keyof ReturnType<typeof calculatePriceActionSignals>) => {
    const workerSeries = indicatorsData[workerKey];
    return hasFiniteSeriesValue(workerSeries) ? workerSeries as (number | string)[] : getPriceActionFallback()[fallbackKey];
  };
  const needsGapPctLabels = hasVisibleGapPctOverlay;

  if (hasVisibleBreakoutResistanceOverlay) {
    const breakoutResistanceSeries = getPriceActionSeries("breakoutResistance", "breakoutResistance");
    if (shouldRenderSignalOverlay("Breakout résistance", breakoutResistanceSeries, { minBarGap: 3 })) {
      pushPriceSignalMarkers(
        "breakout-resistance-marker",
        "Breakout résistance",
        breakoutResistanceSeries,
        "#22c55e",
        "down",
        "high",
        { legendName: "Cassures techniques", maxMarkers: 12, minBarGap: 3, symbolSize: 8, opacity: 0.84 },
      );
    }
  }

  if (hasVisibleBreakdownSupportOverlay) {
    const breakdownSupportSeries = getPriceActionSeries("breakdownSupport", "breakdownSupport");
    if (shouldRenderSignalOverlay("Breakdown support", breakdownSupportSeries, { minBarGap: 3 })) {
      pushPriceSignalMarkers(
        "breakdown-support-marker",
        "Breakdown support",
        breakdownSupportSeries,
        "#f43f5e",
        "up",
        "low",
        { legendName: "Cassures techniques", maxMarkers: 12, minBarGap: 3, symbolSize: 8, opacity: 0.84 },
      );
    }
  }

  if (hasVisibleGapUpOverlay || needsGapPctLabels) {
    const gapUpSeries = getPriceActionSeries("gapUp", "gapUp");
    if (shouldRenderSignalOverlay("Gap Up", gapUpSeries, { minBarGap: 2 })) {
      pushGapMarkers(
        "gap-up-marker",
        "Gaps",
        gapUpSeries,
        getPriceActionSeries("gapPct", "gapPct"),
        "#22d3ee",
        "up",
        needsGapPctLabels,
        { visibilityId: hasVisibleGapUpOverlay ? "gap-up-marker" : "gap-pct-label" },
      );
    }
  }

  if (hasVisibleGapDownOverlay || needsGapPctLabels) {
    const gapDownSeries = getPriceActionSeries("gapDown", "gapDown");
    if (shouldRenderSignalOverlay("Gap Down", gapDownSeries, { minBarGap: 2 })) {
      pushGapMarkers(
        "gap-down-marker",
        "Gaps",
        gapDownSeries,
        getPriceActionSeries("gapPct", "gapPct"),
        "#fb7185",
        "down",
        needsGapPctLabels,
        { visibilityId: hasVisibleGapDownOverlay ? "gap-down-marker" : "gap-pct-label" },
      );
    }
  }

  if (hasVisibleTrueGapUpOverlay) {
    const trueGapUpSeries = getPriceActionSeries("trueGapUp", "trueGapUp");
    if (shouldRenderSignalOverlay("True Gap Up", trueGapUpSeries, { minBarGap: 1 })) {
      pushGapMarkers(
        "true-gap-up-marker",
        "True Gaps",
        trueGapUpSeries,
        getPriceActionSeries("gapPct", "gapPct"),
        "#67e8f9",
        "up",
        needsGapPctLabels,
        { symbolSize: 9, minBarGap: 1, opacity: 0.92 },
      );
    }
  }

  if (hasVisibleTrueGapDownOverlay) {
    const trueGapDownSeries = getPriceActionSeries("trueGapDown", "trueGapDown");
    if (shouldRenderSignalOverlay("True Gap Down", trueGapDownSeries, { minBarGap: 1 })) {
      pushGapMarkers(
        "true-gap-down-marker",
        "True Gaps",
        trueGapDownSeries,
        getPriceActionSeries("gapPct", "gapPct"),
        "#fda4af",
        "down",
        needsGapPctLabels,
        { symbolSize: 9, minBarGap: 1, opacity: 0.92 },
      );
    }
  }

  if (hasVisibleConsecutiveUpDaysOverlay) {
    const upStreakSeries = getPriceActionSeries("upStreak", "upStreak");
    if (shouldRenderSignalOverlay("Jours hausse", upStreakSeries)) {
      pushStreakBadges("up-streak-badge", "Séquences directionnelles", upStreakSeries, "#16a34a", "up");
    }
  }

  if (hasVisibleConsecutiveDownDaysOverlay) {
    const downStreakSeries = getPriceActionSeries("downStreak", "downStreak");
    if (shouldRenderSignalOverlay("Jours baisse", downStreakSeries)) {
      pushStreakBadges("down-streak-badge", "Séquences directionnelles", downStreakSeries, "#dc2626", "down");
    }
  }

  if (hasVisibleInsideBarOverlay) {
    const insideBarSeries = getPriceActionSeries("insideBar", "insideBar");
    if (shouldRenderSignalOverlay("Inside Bar", insideBarSeries)) {
      pushBarStructureOutlines("inside-bar-outline", "Structure de barres", insideBarSeries, "#a78bfa", 1.1, 0.82);
    }
  }

  if (hasVisibleOutsideBarOverlay) {
    const outsideBarSeries = getPriceActionSeries("outsideBar", "outsideBar");
    if (shouldRenderSignalOverlay("Outside Bar", outsideBarSeries)) {
      pushBarStructureOutlines("outside-bar-outline", "Structure de barres", outsideBarSeries, "#f59e0b", 1.8, 0.94);
    }
  }

  let candlestickPatternFallback: ReturnType<typeof calculateCandlestickPatterns> | null = null;
  const getCandlestickPatternFallback = () => {
    if (!candlestickPatternFallback) candlestickPatternFallback = calculateCandlestickPatterns(chartData, { requireVolumeForPattern: false });
    return candlestickPatternFallback;
  };
  const getCandlestickPatternSeries = (workerKey: string, fallbackKey: keyof ReturnType<typeof calculateCandlestickPatterns>) => {
    const workerSeries = indicatorsData[workerKey];
    return hasFiniteSeriesValue(workerSeries) ? workerSeries as (number | string)[] : getCandlestickPatternFallback()[fallbackKey];
  };
  const hasAnyVisibleCandlestickPatternOverlay = hasVisibleDojiOverlay
    || hasVisibleLongLeggedDojiOverlay
    || hasVisibleRickshawManOverlay
    || hasVisibleDragonflyDojiOverlay
    || hasVisibleGravestoneDojiOverlay
    || hasVisibleTristarOverlay
    || hasVisibleHammerOverlay
    || hasVisibleHangingManOverlay
    || hasVisibleTakuriOverlay
    || hasVisibleInvertedHammerOverlay
    || hasVisibleShootingStarOverlay
    || hasVisibleMarubozuBullOverlay
    || hasVisibleMarubozuBearOverlay
    || hasVisibleSpinningTopOverlay;
  const candlestickPatternSeries: CandlestickPatternSeriesMap = hasAnyVisibleCandlestickPatternOverlay ? {
    tristar: getCandlestickPatternSeries("tristar", "tristar"),
    takuri: getCandlestickPatternSeries("takuri", "takuri"),
    hammer: getCandlestickPatternSeries("hammer", "hammer"),
    hangingMan: getCandlestickPatternSeries("hangingMan", "hangingMan"),
    invertedHammer: getCandlestickPatternSeries("invertedHammer", "invertedHammer"),
    shootingStar: getCandlestickPatternSeries("shootingStar", "shootingStar"),
    marubozuBull: getCandlestickPatternSeries("marubozuBull", "marubozuBull"),
    marubozuBear: getCandlestickPatternSeries("marubozuBear", "marubozuBear"),
    spinningTop: getCandlestickPatternSeries("spinningTop", "spinningTop"),
    dragonflyDoji: getCandlestickPatternSeries("dragonflyDoji", "dragonflyDoji"),
    gravestoneDoji: getCandlestickPatternSeries("gravestoneDoji", "gravestoneDoji"),
    rickshawMan: getCandlestickPatternSeries("rickshawMan", "rickshawMan"),
    longLeggedDoji: getCandlestickPatternSeries("longLeggedDoji", "longLeggedDoji"),
    doji: getCandlestickPatternSeries("doji", "doji"),
  } : {};
  const candlestickQualitySeries: CandlestickQualitySeriesMap = hasAnyVisibleCandlestickPatternOverlay ? {
    insufficientHistory: getCandlestickPatternSeries("candlestickInsufficientHistory", "insufficientHistory"),
    missingOHLC: getCandlestickPatternSeries("candlestickMissingOHLC", "missingOHLC"),
    invalidOHLC: getCandlestickPatternSeries("candlestickInvalidOHLC", "invalidOHLC"),
    zeroRange: getCandlestickPatternSeries("candlestickZeroRange", "zeroRange"),
    noTradeSession: getCandlestickPatternSeries("candlestickNoTradeSession", "noTradeSession"),
    stalePrice: getCandlestickPatternSeries("candlestickStalePrice", "stalePrice"),
    corporateActionSuspected: getCandlestickPatternSeries("candlestickCorporateActionSuspected", "corporateActionSuspected"),
    lowReliabilityBecauseIlliquid: getCandlestickPatternSeries("candlestickLowReliabilityBecauseIlliquid", "lowReliabilityBecauseIlliquid"),
  } : {};
  const criticalCandlestickQualityNotes: Array<[string, number]> = hasAnyVisibleCandlestickPatternOverlay ? ([
    ["OHLC manquant", countSignalsInVisibleWindow(candlestickQualitySeries.missingOHLC)],
    ["OHLC invalide", countSignalsInVisibleWindow(candlestickQualitySeries.invalidOHLC)],
    ["corporate action", countSignalsInVisibleWindow(candlestickQualitySeries.corporateActionSuspected)],
  ] as Array<[string, number]>).filter(([, count]) => count > 0) : [];

  const selectedCandlestickPatternSeries = [
    hasVisibleTristarOverlay ? candlestickPatternSeries.tristar : undefined,
    hasVisibleTakuriOverlay ? candlestickPatternSeries.takuri : undefined,
    hasVisibleHammerOverlay ? candlestickPatternSeries.hammer : undefined,
    hasVisibleHangingManOverlay ? candlestickPatternSeries.hangingMan : undefined,
    hasVisibleInvertedHammerOverlay ? candlestickPatternSeries.invertedHammer : undefined,
    hasVisibleShootingStarOverlay ? candlestickPatternSeries.shootingStar : undefined,
    hasVisibleMarubozuBullOverlay ? candlestickPatternSeries.marubozuBull : undefined,
    hasVisibleMarubozuBearOverlay ? candlestickPatternSeries.marubozuBear : undefined,
    hasVisibleSpinningTopOverlay ? candlestickPatternSeries.spinningTop : undefined,
    hasVisibleDragonflyDojiOverlay ? candlestickPatternSeries.dragonflyDoji : undefined,
    hasVisibleGravestoneDojiOverlay ? candlestickPatternSeries.gravestoneDoji : undefined,
    hasVisibleRickshawManOverlay ? candlestickPatternSeries.rickshawMan : undefined,
    hasVisibleLongLeggedDojiOverlay ? candlestickPatternSeries.longLeggedDoji : undefined,
    hasVisibleDojiOverlay ? candlestickPatternSeries.doji : undefined,
  ];
  const hasVisibleCandlestickPatternSignal = selectedCandlestickPatternSeries.some((series) =>
    hasSignalInVisibleWindow(series, { absolute: true }),
  );
  if (hasAnyVisibleCandlestickPatternOverlay && !hasVisibleCandlestickPatternSignal) {
    addPriceOverlayStatusNote("Patterns chandeliers: 0 signal confirmé sur la fenêtre");
    if (criticalCandlestickQualityNotes.length > 0) {
      const visibleNotes = criticalCandlestickQualityNotes.slice(0, 2).map(([label, count]) => `${label}: ${count}`);
      const overflowCount = criticalCandlestickQualityNotes.length - visibleNotes.length;
      addPriceOverlayStatusNote(`Barres ignorées: ${visibleNotes.join(" · ")}${overflowCount > 0 ? ` · +${overflowCount}` : ""}`);
    }
  }

  const candlestickPatternSignalSummaries: CandlestickPatternSignalSummary[] = [];
  const recordCandlestickPatternSummary = (pattern: CandlestickPatternKey, count: number) => {
    if (count <= 0) return;
    const presentation = getCandlestickPatternPresentation(pattern);
    candlestickPatternSignalSummaries.push({
      legendName: presentation.legendName,
      shortLabel: presentation.shortLabel,
      count,
    });
  };

  if (hasVisibleTristarOverlay) {
    recordCandlestickPatternSummary(
      "tristar",
      pushTristarZones("tristar-zone", getCandlestickPatternPresentation("tristar").legendName, candlestickPatternSeries.tristar),
    );
  }

  if (hasVisibleTakuriOverlay) {
    recordCandlestickPatternSummary("takuri", pushCandlestickPatternMarkers(candlestickPatternSeries.takuri, "takuri", candlestickPatternSeries));
  }

  if (hasVisibleHammerOverlay) {
    recordCandlestickPatternSummary(
      "hammer",
      pushCandlestickPatternMarkers(candlestickPatternSeries.hammer, "hammer", candlestickPatternSeries, getCandlestickPatternSeries("hammerConfirmed", "hammerConfirmed")),
    );
  }

  if (hasVisibleHangingManOverlay) {
    recordCandlestickPatternSummary(
      "hangingMan",
      pushCandlestickPatternMarkers(candlestickPatternSeries.hangingMan, "hangingMan", candlestickPatternSeries, getCandlestickPatternSeries("hangingManConfirmed", "hangingManConfirmed")),
    );
  }

  if (hasVisibleInvertedHammerOverlay) {
    recordCandlestickPatternSummary(
      "invertedHammer",
      pushCandlestickPatternMarkers(candlestickPatternSeries.invertedHammer, "invertedHammer", candlestickPatternSeries, getCandlestickPatternSeries("invertedHammerConfirmed", "invertedHammerConfirmed")),
    );
  }

  if (hasVisibleShootingStarOverlay) {
    recordCandlestickPatternSummary(
      "shootingStar",
      pushCandlestickPatternMarkers(candlestickPatternSeries.shootingStar, "shootingStar", candlestickPatternSeries, getCandlestickPatternSeries("shootingStarConfirmed", "shootingStarConfirmed")),
    );
  }

  if (hasVisibleMarubozuBullOverlay) {
    const presentation = getCandlestickPatternPresentation("marubozuBull");
    recordCandlestickPatternSummary(
      "marubozuBull",
      pushMarubozuBodyOutlines(presentation.markerId, presentation.legendName, candlestickPatternSeries.marubozuBull, presentation.color, "marubozuBull", candlestickPatternSeries),
    );
  }

  if (hasVisibleMarubozuBearOverlay) {
    const presentation = getCandlestickPatternPresentation("marubozuBear");
    recordCandlestickPatternSummary(
      "marubozuBear",
      pushMarubozuBodyOutlines(presentation.markerId, presentation.legendName, candlestickPatternSeries.marubozuBear, presentation.color, "marubozuBear", candlestickPatternSeries),
    );
  }

  if (hasVisibleSpinningTopOverlay) {
    recordCandlestickPatternSummary("spinningTop", pushCandlestickPatternMarkers(candlestickPatternSeries.spinningTop, "spinningTop", candlestickPatternSeries));
  }

  if (hasVisibleDragonflyDojiOverlay) {
    recordCandlestickPatternSummary("dragonflyDoji", pushCandlestickPatternMarkers(candlestickPatternSeries.dragonflyDoji, "dragonflyDoji", candlestickPatternSeries));
  }

  if (hasVisibleGravestoneDojiOverlay) {
    recordCandlestickPatternSummary("gravestoneDoji", pushCandlestickPatternMarkers(candlestickPatternSeries.gravestoneDoji, "gravestoneDoji", candlestickPatternSeries));
  }

  if (hasVisibleRickshawManOverlay) {
    recordCandlestickPatternSummary("rickshawMan", pushCandlestickPatternMarkers(candlestickPatternSeries.rickshawMan, "rickshawMan", candlestickPatternSeries));
  }

  if (hasVisibleLongLeggedDojiOverlay) {
    recordCandlestickPatternSummary("longLeggedDoji", pushCandlestickPatternMarkers(candlestickPatternSeries.longLeggedDoji, "longLeggedDoji", candlestickPatternSeries));
  }

  if (hasVisibleDojiOverlay) {
    recordCandlestickPatternSummary("doji", pushCandlestickPatternMarkers(candlestickPatternSeries.doji, "doji", candlestickPatternSeries));
  }

  const candlestickPatternSignalSummary = buildCandlestickPatternSignalSummary(candlestickPatternSignalSummaries);
  if (candlestickPatternSignalSummary) addPriceOverlayStatusNote(candlestickPatternSignalSummary);

  if (hasVisibleLinearRegressionOverlay) {
    const fallbackLinearRegression = indicatorsData.linearRegValue
      ? null
      : calculateLinearRegressionIndicator(chartData);
    pushLine(
      "linear-reg-value",
      "LinReg Value",
      indicatorsData.linearRegValue ?? fallbackLinearRegression?.value ?? [],
      "#818cf8",
    );
  }

  if (advancedIndicators.parabolicSar && isObjectVisible("parabolicSar")) {
    const fallbackSar = indicatorsData.parabolicSar && indicatorsData.parabolicSarSignal
      ? null
      : calculateParabolicSAR(chartData);
    const sarSeries = indicatorsData.parabolicSar ?? fallbackSar?.sar ?? [];
    const sarSignal = indicatorsData.parabolicSarSignal ?? fallbackSar?.signal ?? [];
    const renderedSarPointCount = Math.min(renderDates.length, chartData.length, renderedMainSeriesPointCount);

    if (isObjectVisible("parabolic-sar")) {
      seriesOptions.push({
        id: "parabolic-sar",
        name: "SAR",
        type: "scatter",
        xAxisIndex: 0,
        yAxisIndex: 0,
        data: Array.from({ length: renderedSarPointCount }, (_unused, index) => {
          const value = sarSeries[index];
          const price = toFiniteNumber(value);
          if (price === null) return null;
          const date = renderDates[index];
          if (!date) return null;
          const direction = toFiniteNumber(sarSignal[index]);
          return {
            value: [date, price],
            itemStyle: { color: direction !== null && direction < 0 ? downColor : upColor },
          };
        }),
        symbol: "circle",
        symbolSize: 5,
        z: 24,
      });
    }

    if (isObjectVisible("parabolic-sar-signal")) {
      seriesOptions.push({
        id: "parabolic-sar-signal",
        name: "SAR Signal",
        type: "scatter",
        xAxisIndex: 0,
        yAxisIndex: 0,
        data: Array.from({ length: renderedSarPointCount }, (_unused, index) => {
          const value = sarSignal[index];
          const direction = toFiniteNumber(value);
          const previousDirection = index > 0 ? toFiniteNumber(sarSignal[index - 1]) : null;
          if (direction === null || previousDirection === null || direction === previousDirection) return null;
          const price = direction > 0
            ? toFiniteNumber(chartData[index]?.low)
            : toFiniteNumber(chartData[index]?.high);
          if (price === null) return null;
          const date = renderDates[index];
          if (!date) return null;
          return {
            value: [date, price],
            itemStyle: { color: direction > 0 ? upColor : downColor },
          };
        }),
        symbol: "diamond",
        symbolSize: 9,
        z: 25,
      });
    }
  }

  if (hasVisibleSupertrendOverlay) {
    const fallbackSupertrend = indicatorsData.supertrend && indicatorsData.supertrendSignal
      ? null
      : calculateSupertrend(chartData, 10, 3);
    const supertrendSeries = indicatorsData.supertrend ?? fallbackSupertrend?.supertrend ?? [];
    const supertrendSignal = indicatorsData.supertrendSignal ?? fallbackSupertrend?.signal ?? [];
    const renderedSupertrendPointCount = Math.min(
      renderDates.length,
      chartData.length,
      renderedMainSeriesPointCount,
      supertrendSeries.length,
      supertrendSignal.length,
    );

    if (isObjectVisible("supertrend-line")) {
      const buildSupertrendLineData = (expectedDirection: 1 | -1) =>
        Array.from({ length: renderedSupertrendPointCount }, (_unused, index) => {
          const date = renderDates[index];
          const price = toFiniteNumber(supertrendSeries[index]);
          const direction = toFiniteNumber(supertrendSignal[index]);
          if (!date || price === null || direction !== expectedDirection) return [date, null];
          return [date, price];
        });
      const upTrendData = buildSupertrendLineData(1);
      const downTrendData = buildSupertrendLineData(-1);

      seriesOptions.push(
        {
          id: "supertrend-line-up",
          name: "Supertrend",
          type: "line",
          xAxisIndex: 0,
          yAxisIndex: 0,
          data: upTrendData,
          showSymbol: false,
          connectNulls: false,
          lineStyle: { width: 1.6, color: upColor, opacity: 0.95 },
          itemStyle: { color: upColor },
          z: 23,
        },
        {
          id: "supertrend-line-down",
          name: "Supertrend",
          type: "line",
          xAxisIndex: 0,
          yAxisIndex: 0,
          data: downTrendData,
          showSymbol: false,
          connectNulls: false,
          lineStyle: { width: 1.6, color: downColor, opacity: 0.95 },
          itemStyle: { color: downColor },
          z: 23,
        },
      );
    }

    if (isObjectVisible("supertrend-signal")) {
      seriesOptions.push({
        id: "supertrend-signal",
        name: "Supertrend Signal",
        type: "scatter",
        xAxisIndex: 0,
        yAxisIndex: 0,
        data: Array.from({ length: renderedSupertrendPointCount }, (_unused, index) => {
          const direction = toFiniteNumber(supertrendSignal[index]);
          const previousDirection = index > 0 ? toFiniteNumber(supertrendSignal[index - 1]) : null;
          if (direction === null || previousDirection === null || direction === previousDirection) return null;
          const trendPrice = toFiniteNumber(supertrendSeries[index]);
          const fallbackPrice = direction > 0
            ? toFiniteNumber(chartData[index]?.low)
            : toFiniteNumber(chartData[index]?.high);
          const price = trendPrice ?? fallbackPrice;
          const date = renderDates[index];
          if (price === null || !date) return null;
          return {
            value: [date, price],
            itemStyle: { color: direction > 0 ? upColor : downColor },
          };
        }),
        symbol: "diamond",
        symbolSize: 8,
        z: 26,
      });
    }
  }

  const oscillatorGuide = (levels: number[]) => ({
    silent: true,
    symbol: ["none", "none"],
    label: { show: false },
    lineStyle: { color: "rgba(120, 123, 134, 0.5)", type: "dashed", width: 1 },
    data: levels.map((level) => ({ yAxis: level })),
  });

  const buildDeltaHistogramData = (data: (number | string)[] | undefined) => {
    let previousValue: number | null = null;
    return (data ?? []).map((value, index) => {
      const currentValue = typeof value === "number" && Number.isFinite(value) ? value : null;
      const isRising = currentValue !== null && previousValue !== null
        ? currentValue >= previousValue
        : true;
      if (currentValue !== null) previousValue = currentValue;

      return {
        value: [index, currentValue],
        itemStyle: { color: isRising ? upColor : downColor },
      };
    });
  };

  const pushDeltaHistogram = (
    xAxisIndex: number,
    yAxisIndex: number,
    id: string,
    name: string,
    data: (number | string)[] | undefined,
  ) => {
    seriesOptions.push({
      id,
      name,
      type: "bar",
      xAxisIndex,
      yAxisIndex,
      data: buildDeltaHistogramData(data),
      barWidth: "62%",
      markLine: oscillatorGuide([0]),
    });
  };

  const pushOscillatorLine = (
    xAxisIndex: number,
    yAxisIndex: number,
    id: string,
    name: string,
    data: (number | string)[] | undefined,
    color: string,
    extra: ChartOptionPart = {}
  ) => {
    if (!data) return;
    seriesOptions.push({
      id,
      name,
      type: "line",
      xAxisIndex,
      yAxisIndex,
      data,
      showSymbol: false,
      lineStyle: { width: 1.5, color },
      itemStyle: { color },
      ...extra,
    });
  };

  const addPanelNote = (text: string) => {
    graphicOptions.push({
      type: "text",
      left: gridLeft + 8,
      top: `${nextPanelTopPercent + 0.35}%`,
      silent: true,
      z: 80,
      style: {
        text,
        fill: "rgba(160, 174, 192, 0.72)",
        font: "600 10px Inter, system-ui, sans-serif",
      },
    });
  };

  oscillatorPanels.forEach((panelName, index) => {
    const gridIndex = gridOptions.length;
    const xAxisIndex = xAxisOptions.length;
    const yAxisIndex = yAxisOptions.length;

    const bounded0to100 = panelName === "RSI" || panelName === "Stoch" || panelName === "StochRSI" || panelName === "MFI" || panelName === "DYMI" || panelName === "Ultimate" || panelName === "ADX" || panelName === "Aroon" || panelName === "STC";
    const boundedWillR = panelName === "Will%R";
    const boundedCmo = panelName === "CMO";
    const boundedAroonOsc = panelName === "Aroon Osc";
    const boundedCmf = panelName === "CMF 20";
    const zeroBasedPositive = panelName === "ATR 14"
      || panelName === "ATR 20"
      || panelName === "NATR 14"
      || panelName === "HV"
      || panelName === "Std Dev 20"
      || panelName === "Ulcer Index";

    gridOptions.push({
      left: gridLeft,
      right: gridRight,
      top: `${nextPanelTopPercent}%`,
      height: `${panelHeightPercent}%`,
      containLabel: false
    });

    xAxisOptions.push({
      id: `osc-xaxis-${index}`,
      type: "category",
      gridIndex,
      data: renderDates,
      boundaryGap: false,
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      min: "dataMin",
      max: "dataMax"
    });

    yAxisOptions.push({
      id: `osc-yaxis-${index}`,
      position: "right",
      gridIndex,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: chartAppearance.showGrid, lineStyle: { color: "rgba(42, 46, 57, 0.5)", type: "dashed" } },
      axisLabel: { color: textColor, fontSize: 10 },
      scale: !(bounded0to100 || boundedWillR || boundedCmo || boundedAroonOsc || boundedCmf || zeroBasedPositive),
      min: bounded0to100 || zeroBasedPositive ? 0 : boundedWillR || boundedCmo || boundedAroonOsc ? -100 : boundedCmf ? -1 : undefined,
      max: bounded0to100 ? 100 : boundedWillR ? 0 : boundedCmo || boundedAroonOsc ? 100 : boundedCmf ? 1 : undefined,
      axisPointer: { show: uiState.cursorMode !== "arrow", label: { show: true } },
    });

    if (panelName === "PPO") addPanelNote("PPO = MACD normalized %");
    if (panelName === "APO") addPanelNote("APO = MACD Line absolute");

    if (panelName === "RSI") {
      pushOscillatorLine(xAxisIndex, yAxisIndex, "rsi-series", "RSI", indicatorsData.rsi, "#7E57C2", {
        markArea: { silent: true, itemStyle: { color: "rgba(126, 87, 194, 0.08)" }, data: [[{ yAxis: 30 }, { yAxis: 70 }]] },
        markLine: oscillatorGuide([70, 30, 50]),
      });
    } else if (panelName === "MACD") {
      const fallbackMacd = indicatorsData.macdLine && indicatorsData.macdSignal && indicatorsData.macdHist ? null : calculateMACD(chartData);
      seriesOptions.push({
        id: "macd-hist",
        name: "MACD Histogram",
        type: "bar",
        xAxisIndex,
        yAxisIndex,
        data: (indicatorsData.macdHist ?? fallbackMacd?.histogram ?? []).map((value, i) => [i, value]),
        itemStyle: { color: (params: { value: (number | string)[] }) => Number(params.value[1]) > 0 ? upColor : downColor },
      });
      pushOscillatorLine(xAxisIndex, yAxisIndex, "macd-line", "MACD Line", indicatorsData.macdLine ?? fallbackMacd?.macdLine ?? [], "#ffffff");
      pushOscillatorLine(xAxisIndex, yAxisIndex, "macd-signal", "MACD Signal", indicatorsData.macdSignal ?? fallbackMacd?.signalLine ?? [], "#FF9F04");
    } else if (panelName === "PPO") {
      const fallbackPpo = indicatorsData.ppo && indicatorsData.ppoSignal && indicatorsData.ppoHistogram ? null : calculatePPO(chartData);
      if (isObjectVisible("ppo-histogram")) {
        seriesOptions.push({
          id: "ppo-histogram",
          name: "PPO Histogram",
          type: "bar",
          xAxisIndex,
          yAxisIndex,
          data: (indicatorsData.ppoHistogram ?? fallbackPpo?.histogram ?? []).map((value, dataIndex) => [dataIndex, value]),
          itemStyle: { color: (params: { value: (number | string)[] }) => Number(params.value[1]) > 0 ? upColor : downColor },
          markLine: oscillatorGuide([0]),
        });
      }
      if (isObjectVisible("ppo-line")) {
        pushOscillatorLine(
          xAxisIndex,
          yAxisIndex,
          "ppo-line",
          "PPO Line",
          indicatorsData.ppo ?? fallbackPpo?.ppoLine ?? [],
          "#38bdf8",
        );
      }
      if (isObjectVisible("ppo-signal")) {
        pushOscillatorLine(
          xAxisIndex,
          yAxisIndex,
          "ppo-signal",
          "PPO Signal",
          indicatorsData.ppoSignal ?? fallbackPpo?.signalLine ?? [],
          "#f59e0b",
        );
      }
    } else if (panelName === "APO") {
      pushOscillatorLine(
        xAxisIndex,
        yAxisIndex,
        "apo-series",
        "APO",
        indicatorsData.apo ?? calculateAPO(chartData),
        "#f97316",
        { markLine: oscillatorGuide([0]) },
      );
    } else if (panelName === "ADX") {
      const fallbackAdx = indicatorsData.adx14 && indicatorsData.plusDI14 && indicatorsData.minusDI14 ? null : calculateADX(chartData, 14);
      const adxLine = indicatorsData.adx14 ?? fallbackAdx?.adx ?? [];
      const trendStrength = formatAdxTrendStrength(getLastFiniteSeriesValue(adxLine));
      if (trendStrength) addPanelNote(`Trend Strength: ${trendStrength}`);

      if (isObjectVisible("adx-line")) {
        pushOscillatorLine(
          xAxisIndex,
          yAxisIndex,
          "adx-line",
          "ADX",
          adxLine,
          "#c084fc",
          { markLine: oscillatorGuide([50, 25, 20]) },
        );
      }
      if (isObjectVisible("adx-plus-di")) {
        pushOscillatorLine(
          xAxisIndex,
          yAxisIndex,
          "adx-plus-di",
          "+DI",
          indicatorsData.plusDI14 ?? fallbackAdx?.plusDI ?? [],
          "#22c55e",
        );
      }
      if (isObjectVisible("adx-minus-di")) {
        pushOscillatorLine(
          xAxisIndex,
          yAxisIndex,
          "adx-minus-di",
          "-DI",
          indicatorsData.minusDI14 ?? fallbackAdx?.minusDI ?? [],
          "#ef4444",
        );
      }
    } else if (panelName === "Aroon") {
      const fallbackAroon = indicatorsData.aroonUp14 && indicatorsData.aroonDown14 ? null : calculateAroon(chartData, 14);
      if (isObjectVisible("aroon-up")) {
        pushOscillatorLine(
          xAxisIndex,
          yAxisIndex,
          "aroon-up",
          "Aroon Up",
          indicatorsData.aroonUp14 ?? fallbackAroon?.up ?? [],
          "#22c55e",
          { markLine: oscillatorGuide([70, 50, 30]) },
        );
      }
      if (isObjectVisible("aroon-down")) {
        pushOscillatorLine(
          xAxisIndex,
          yAxisIndex,
          "aroon-down",
          "Aroon Down",
          indicatorsData.aroonDown14 ?? fallbackAroon?.down ?? [],
          "#ef4444",
        );
      }
    } else if (panelName === "Aroon Osc") {
      pushOscillatorLine(
        xAxisIndex,
        yAxisIndex,
        "aroon-osc-series",
        "Aroon Osc",
        indicatorsData.aroonOsc14 ?? calculateAroonOscillator(chartData, 14),
        "#38bdf8",
        { markLine: oscillatorGuide([90, 0, -90]) },
      );
    } else if (panelName === "Vortex") {
      const fallbackVortex = indicatorsData.vortexPlus14 && indicatorsData.vortexMinus14
        ? null
        : calculateVortex(chartData, 14);
      if (isObjectVisible("vortex-plus")) {
        pushOscillatorLine(
          xAxisIndex,
          yAxisIndex,
          "vortex-plus",
          "Vortex +",
          indicatorsData.vortexPlus14 ?? fallbackVortex?.plus ?? [],
          "#22c55e",
          { markLine: oscillatorGuide([1]) },
        );
      }
      if (isObjectVisible("vortex-minus")) {
        pushOscillatorLine(
          xAxisIndex,
          yAxisIndex,
          "vortex-minus",
          "Vortex -",
          indicatorsData.vortexMinus14 ?? fallbackVortex?.minus ?? [],
          "#ef4444",
        );
      }
    } else if (panelName === "TRIX") {
      pushOscillatorLine(
        xAxisIndex,
        yAxisIndex,
        "trix-series",
        "TRIX",
        indicatorsData.trix18 ?? calculateTRIX(chartData, 18),
        "#a78bfa",
        { markLine: oscillatorGuide([0]) },
      );
    } else if (panelName === "STC") {
      pushOscillatorLine(
        xAxisIndex,
        yAxisIndex,
        "stc-series",
        "STC",
        indicatorsData.stc ?? calculateSTC(chartData),
        "#06b6d4",
        {
          markArea: { silent: true, itemStyle: { color: "rgba(6, 182, 212, 0.08)" }, data: [[{ yAxis: 25 }, { yAxis: 75 }]] },
          markLine: oscillatorGuide([75, 50, 25]),
        },
      );
    } else if (panelName === "Mass Index") {
      pushOscillatorLine(
        xAxisIndex,
        yAxisIndex,
        "mass-index-series",
        "Mass Index",
        indicatorsData.massIndex ?? calculateMassIndex(chartData),
        "#f59e0b",
        { markLine: oscillatorGuide([27, 26.5]) },
      );
    } else if (panelName === "KST") {
      addPanelNote(`KST · ${resolveIndicatorQualityLabel(chartData, 53, hasLiveStitchedCandle)}`);
      const fallbackKst = indicatorsData.kst && indicatorsData.kstSignal
        ? null
        : calculateKST(chartData);
      if (isObjectVisible("kst-line")) {
        pushOscillatorLine(
          xAxisIndex,
          yAxisIndex,
          "kst-line",
          "KST",
          indicatorsData.kst ?? fallbackKst?.kst ?? [],
          "#38bdf8",
          { markLine: oscillatorGuide([0]) },
        );
      }
      if (isObjectVisible("kst-signal")) {
        pushOscillatorLine(
          xAxisIndex,
          yAxisIndex,
          "kst-signal",
          "KST Signal",
          indicatorsData.kstSignal ?? fallbackKst?.signalLine ?? [],
          "#f59e0b",
        );
      }
    } else if (panelName === "LinReg Slope") {
      addPanelNote(`LinReg Slope · ${resolveIndicatorQualityLabel(chartData, 100, hasLiveStitchedCandle)}`);
      const fallbackLinearRegression = indicatorsData.linearRegSlope
        ? null
        : calculateLinearRegressionIndicator(chartData);
      pushOscillatorLine(
        xAxisIndex,
        yAxisIndex,
        "linear-reg-slope",
        "LinReg Slope",
        indicatorsData.linearRegSlope ?? fallbackLinearRegression?.slope ?? [],
        "#a78bfa",
        { markLine: oscillatorGuide([0]) },
      );
    } else if (panelName === "Stoch") {
      pushOscillatorLine(xAxisIndex, yAxisIndex, "stoch-k", "%K", indicatorsData.stochK, "#2962FF", {
        markArea: { silent: true, itemStyle: { color: "rgba(33, 150, 243, 0.08)" }, data: [[{ yAxis: 20 }, { yAxis: 80 }]] },
        markLine: oscillatorGuide([80, 20, 50]),
      });
      pushOscillatorLine(xAxisIndex, yAxisIndex, "stoch-d", "%D", indicatorsData.stochD, "#FF6D00");
    } else if (panelName === "StochRSI") {
      pushOscillatorLine(xAxisIndex, yAxisIndex, "stochrsi-k", "StochRSI %K", indicatorsData.stochRsiK, "#2962FF", {
        markArea: { silent: true, itemStyle: { color: "rgba(33, 150, 243, 0.08)" }, data: [[{ yAxis: 20 }, { yAxis: 80 }]] },
        markLine: oscillatorGuide([80, 20, 50]),
      });
      pushOscillatorLine(xAxisIndex, yAxisIndex, "stochrsi-d", "StochRSI %D", indicatorsData.stochRsiD, "#FF6D00");
    } else if (panelName === "ATR 14") {
      addPanelNote(`ATR 14 · ${resolveIndicatorQualityLabel(chartData, 14, hasLiveStitchedCandle)}`);
      pushOscillatorLine(
        xAxisIndex,
        yAxisIndex,
        "atr-series",
        "ATR 14",
        indicatorsData.atr ?? calculateATR(chartData, 14),
        "#d50000",
        { markLine: oscillatorGuide([0]) },
      );
    } else if (panelName === "ATR 20") {
      addPanelNote(`ATR 20 · ${resolveIndicatorQualityLabel(chartData, 20, hasLiveStitchedCandle)}`);
      pushOscillatorLine(
        xAxisIndex,
        yAxisIndex,
        "atr20-series",
        "ATR 20",
        indicatorsData.atr20 ?? calculateATR(chartData, 20),
        "#fb7185",
        { markLine: oscillatorGuide([0]) },
      );
    } else if (panelName === "NATR 14") {
      addPanelNote(`NATR 14 · ${resolveIndicatorQualityLabel(chartData, 14, hasLiveStitchedCandle)}`);
      pushOscillatorLine(
        xAxisIndex,
        yAxisIndex,
        "natr14-series",
        "NATR 14",
        indicatorsData.natr14 ?? calculateNATR(chartData, 14),
        "#22c55e",
        { markLine: oscillatorGuide([0]) },
      );
    } else if (panelName === "HV") {
      const hvSpecs = [
        { active: advancedIndicators.hv10, visible: isObjectVisible("hv10"), id: "hv10-series", name: "HV 10", key: "hv10", period: 10, color: "#38bdf8" },
        { active: advancedIndicators.hv20, visible: isObjectVisible("hv20"), id: "hv20-series", name: "HV 20", key: "hv20", period: 20, color: "#22c55e" },
        { active: advancedIndicators.hv30, visible: isObjectVisible("hv30"), id: "hv30-series", name: "HV 30", key: "hv30", period: 30, color: "#f59e0b" },
        { active: advancedIndicators.hv60, visible: isObjectVisible("hv60"), id: "hv60-series", name: "HV 60", key: "hv60", period: 60, color: "#a78bfa" },
        { active: advancedIndicators.hv90, visible: isObjectVisible("hv90"), id: "hv90-series", name: "HV 90", key: "hv90", period: 90, color: "#fb7185" },
        { active: advancedIndicators.hv252, visible: isObjectVisible("hv252"), id: "hv252-series", name: "HV 252", key: "hv252", period: 252, color: "#eab308" },
      ];
      const requiredBars = Math.max(11, ...hvSpecs.filter((spec) => spec.active && spec.visible).map((spec) => spec.period + 1));
      addPanelNote(`HV · rendements log annualisés % · ${resolveIndicatorQualityLabel(chartData, requiredBars, hasLiveStitchedCandle)}`);
      let guideAttached = false;
      hvSpecs.forEach((spec) => {
        if (!spec.active || !spec.visible) return;
        const extra = guideAttached ? {} : { markLine: oscillatorGuide([0]) };
        guideAttached = true;
        pushOscillatorLine(
          xAxisIndex,
          yAxisIndex,
          spec.id,
          spec.name,
          indicatorsData[spec.key] ?? calculateHistoricalVolatility(chartData, spec.period),
          spec.color,
          extra,
        );
      });
    } else if (panelName === "Std Dev 20") {
      addPanelNote(`Std Dev 20 · prix brut · ${resolveIndicatorQualityLabel(chartData, 20, hasLiveStitchedCandle)}`);
      pushOscillatorLine(
        xAxisIndex,
        yAxisIndex,
        "std-dev20-series",
        "Std Dev 20",
        indicatorsData.stdDev20 ?? calculatePriceStdDev(chartData, 20),
        "#14b8a6",
        { markLine: oscillatorGuide([0]) },
      );
    } else if (panelName === "Chaikin Volatility") {
      addPanelNote(`Chaikin Volatility · range High-Low lissé · ${resolveIndicatorQualityLabel(chartData, 20, hasLiveStitchedCandle)}`);
      pushOscillatorLine(
        xAxisIndex,
        yAxisIndex,
        "chaikin-vol-series",
        "Chaikin Volatility",
        indicatorsData.chaikinVol ?? calculateChaikinVolatility(chartData, 10, 10),
        "#f97316",
        { markLine: oscillatorGuide([0]) },
      );
    } else if (panelName === "Ulcer Index") {
      addPanelNote(`Ulcer Index · downside risk · ${resolveIndicatorQualityLabel(chartData, 14, hasLiveStitchedCandle)}`);
      pushOscillatorLine(
        xAxisIndex,
        yAxisIndex,
        "ulcer-index-series",
        "Ulcer Index",
        indicatorsData.ulcerIndex ?? calculateUlcerIndex(chartData, 14),
        "#e11d48",
        { markLine: oscillatorGuide([0]) },
      );
    } else if (panelName === "CCI") {
      let guideAttached = false;
      const nextCciGuide = () => {
        if (guideAttached) return {};
        guideAttached = true;
        return { markLine: oscillatorGuide([100, 0, -100]) };
      };

      if (advancedIndicators.cci14 && isObjectVisible("cci14")) {
        pushOscillatorLine(
          xAxisIndex,
          yAxisIndex,
          "cci14-series",
          "CCI 14",
          indicatorsData.cci14 ?? calculateCCI(chartData, 14),
          "#f59e0b",
          nextCciGuide(),
        );
      }
      if (isCci20Active && (advancedIndicators.cci ? isObjectVisible("cci") : isObjectVisible("cci20"))) {
        pushOscillatorLine(
          xAxisIndex,
          yAxisIndex,
          "cci20-series",
          "CCI 20",
          indicatorsData.cci20 ?? indicatorsData.cci ?? calculateCCI(chartData, 20),
          "#00E676",
          nextCciGuide(),
        );
      }
    } else if (panelName === "MFI") {
      pushOscillatorLine(xAxisIndex, yAxisIndex, "mfi14-series", "MFI 14", indicatorsData.mfi14 ?? calculateMFI(chartData, 14), "#10b981", {
        markArea: { silent: true, itemStyle: { color: "rgba(16, 185, 129, 0.08)" }, data: [[{ yAxis: 20 }, { yAxis: 80 }]] },
        markLine: oscillatorGuide([80, 50, 20]),
      });
    }
    else if (panelName === "Will%R") {
      pushOscillatorLine(xAxisIndex, yAxisIndex, "willr14-series", "Williams %R 14", indicatorsData.williamsR14 ?? indicatorsData.williamsR ?? calculateWilliamsR(chartData, 14), "#FFEB3B", {
        markArea: { silent: true, itemStyle: { color: "rgba(255, 235, 59, 0.08)" }, data: [[{ yAxis: -80 }, { yAxis: -20 }]] },
        markLine: oscillatorGuide([-20, -80, -50]),
      });
    } else if (panelName === "ROC") {
      let guideAttached = false;
      const nextRocGuide = () => {
        if (guideAttached) return {};
        guideAttached = true;
        return { markLine: oscillatorGuide([0]) };
      };
      const isRoc10Active = advancedIndicators.roc10 || advancedIndicators.roc;
      const isRoc10Visible = (advancedIndicators.roc10 && isObjectVisible("roc10"))
        || (advancedIndicators.roc && isObjectVisible("roc"));
      if (isRoc10Active && isRoc10Visible) {
        pushOscillatorLine(
          xAxisIndex,
          yAxisIndex,
          "roc10-series",
          "ROC 10",
          indicatorsData.roc10 ?? indicatorsData.roc ?? calculateROC(chartData, 10),
          "#2196F3",
          nextRocGuide(),
        );
      }
      if (advancedIndicators.roc20 && isObjectVisible("roc20")) {
        pushOscillatorLine(
          xAxisIndex,
          yAxisIndex,
          "roc20-series",
          "ROC 20",
          indicatorsData.roc20 ?? calculateROC(chartData, 20),
          "#38BDF8",
          nextRocGuide(),
        );
      }
    } else if (panelName === "Momentum") {
      let guideAttached = false;
      const nextMomentumGuide = () => {
        if (guideAttached) return {};
        guideAttached = true;
        return { markLine: oscillatorGuide([0]) };
      };
      if (advancedIndicators.momentum10 && isObjectVisible("momentum10")) {
        pushOscillatorLine(
          xAxisIndex,
          yAxisIndex,
          "momentum10-series",
          "Momentum 10",
          indicatorsData.momentum10 ?? calculateMomentum(chartData, 10),
          "#FF2E93",
          nextMomentumGuide(),
        );
      }
      if (advancedIndicators.momentum20 && isObjectVisible("momentum20")) {
        pushOscillatorLine(
          xAxisIndex,
          yAxisIndex,
          "momentum20-series",
          "Momentum 20",
          indicatorsData.momentum20 ?? calculateMomentum(chartData, 20),
          "#F97316",
          nextMomentumGuide(),
        );
      }
    } else if (panelName === "CMO") {
      pushOscillatorLine(xAxisIndex, yAxisIndex, "cmo14-series", "CMO 14", indicatorsData.cmo14 ?? calculateCMO(chartData, 14), "#FB7185", {
        markLine: oscillatorGuide([50, 0, -50]),
      });
    } else if (panelName === "DYMI") {
      pushOscillatorLine(xAxisIndex, yAxisIndex, "dymi-series", "DYMI", indicatorsData.dymi ?? calculateDYMI(chartData), "#A855F7", {
        markLine: oscillatorGuide([70, 50, 30]),
      });
    } else if (panelName === "Ultimate") {
      pushOscillatorLine(xAxisIndex, yAxisIndex, "ultimate-osc-series", "Ultimate Osc", indicatorsData.ultimateOsc ?? calculateUltimateOscillator(chartData), "#F43F5E", {
        markLine: oscillatorGuide([70, 50, 30]),
      });
    } else if (panelName === "DPO") {
      pushOscillatorLine(xAxisIndex, yAxisIndex, "dpo20-series", "DPO 20", indicatorsData.dpo20 ?? calculateDPO(chartData, 20), "#06B6D4", {
        markLine: oscillatorGuide([0]),
      });
    } else if (panelName === "TSI") {
      const fallbackTsi = indicatorsData.tsi && indicatorsData.tsiSignal ? null : calculateTSI(chartData);
      if (isObjectVisible("tsi-line")) {
        pushOscillatorLine(
          xAxisIndex,
          yAxisIndex,
          "tsi-line",
          "TSI",
          indicatorsData.tsi ?? fallbackTsi?.tsi ?? [],
          "#8B5CF6",
          { markLine: oscillatorGuide([0]) },
        );
      }
      if (isObjectVisible("tsi-signal")) {
        pushOscillatorLine(
          xAxisIndex,
          yAxisIndex,
          "tsi-signal",
          "TSI Signal",
          indicatorsData.tsiSignal ?? fallbackTsi?.signalLine ?? [],
          "#F59E0B",
        );
      }
    } else if (panelName === "AO") {
      pushDeltaHistogram(
        xAxisIndex,
        yAxisIndex,
        "awesome-osc-series",
        "Awesome Osc",
        indicatorsData.awesomeOsc ?? calculateAwesomeOscillator(chartData),
      );
    } else if (panelName === "AC") {
      pushDeltaHistogram(
        xAxisIndex,
        yAxisIndex,
        "ac-osc-series",
        "AC Osc",
        indicatorsData.acOsc ?? calculateAcceleratorOscillator(chartData),
      );
    } else if (panelName === "RVI") {
      const fallbackRvi = indicatorsData.rvi && indicatorsData.rviSignal ? null : calculateRVI(chartData);
      if (isObjectVisible("rvi-line")) {
        pushOscillatorLine(
          xAxisIndex,
          yAxisIndex,
          "rvi-line",
          "RVI",
          indicatorsData.rvi ?? fallbackRvi?.rvi ?? [],
          "#22d3ee",
          { markLine: oscillatorGuide([0]) },
        );
      }
      if (isObjectVisible("rvi-signal")) {
        pushOscillatorLine(
          xAxisIndex,
          yAxisIndex,
          "rvi-signal",
          "RVI Signal",
          indicatorsData.rviSignal ?? fallbackRvi?.signalLine ?? [],
          "#facc15",
        );
      }
    } else if (panelName === "Fisher") {
      const fallbackFisher = indicatorsData.fisher && indicatorsData.fisherSignal ? null : calculateFisherTransform(chartData);
      if (isObjectVisible("fisher-line")) {
        pushOscillatorLine(
          xAxisIndex,
          yAxisIndex,
          "fisher-line",
          "Fisher",
          indicatorsData.fisher ?? fallbackFisher?.fisher ?? [],
          "#e879f9",
          { markLine: oscillatorGuide([0]) },
        );
      }
      if (isObjectVisible("fisher-signal")) {
        pushOscillatorLine(
          xAxisIndex,
          yAxisIndex,
          "fisher-signal",
          "Fisher Signal",
          indicatorsData.fisherSignal ?? fallbackFisher?.signalLine ?? [],
          "#f59e0b",
        );
      }
    } else if (panelName === "Elder") {
      const fallbackElder = indicatorsData.elderBull && indicatorsData.elderBear ? null : calculateElderBullBearPower(chartData);
      if (isObjectVisible("elder-bull")) {
        pushOscillatorLine(
          xAxisIndex,
          yAxisIndex,
          "elder-bull",
          "Elder Bull",
          indicatorsData.elderBull ?? fallbackElder?.bull ?? [],
          "#22c55e",
          { markLine: oscillatorGuide([0]) },
        );
      }
      if (isObjectVisible("elder-bear")) {
        pushOscillatorLine(
          xAxisIndex,
          yAxisIndex,
          "elder-bear",
          "Elder Bear",
          indicatorsData.elderBear ?? fallbackElder?.bear ?? [],
          "#ef4444",
        );
      }
    } else if (panelName === "Coppock") {
      pushOscillatorLine(
        xAxisIndex,
        yAxisIndex,
        "coppock-series",
        "Coppock",
        indicatorsData.coppock ?? calculateCoppockCurve(chartData),
        "#84cc16",
        { markLine: oscillatorGuide([0]) },
      );
    } else if (panelName === "OBV") {
      addPanelNote(`OBV · ${resolveVolumeFlowQualityLabel(chartData, 2, hasLiveStitchedCandle)}`);
      pushOscillatorLine(
        xAxisIndex,
        yAxisIndex,
        "obv-series",
        "OBV",
        indicatorsData.obv ?? calculateOBV(chartData),
        "#FF5722",
      );
    } else if (panelName === "A/D Line") {
      addPanelNote(`A/D Line · ${resolveVolumeFlowQualityLabel(chartData, 1, hasLiveStitchedCandle, true)}`);
      pushOscillatorLine(
        xAxisIndex,
        yAxisIndex,
        "ad-line-series",
        "A/D Line",
        indicatorsData.adLine ?? calculateADLine(chartData),
        "#10b981",
      );
    } else if (panelName === "CMF 20") {
      addPanelNote(`CMF 20 · volume-prix -1/+1 · ${resolveVolumeFlowQualityLabel(chartData, 20, hasLiveStitchedCandle, true)}`);
      pushOscillatorLine(
        xAxisIndex,
        yAxisIndex,
        "cmf20-series",
        "CMF 20",
        indicatorsData.cmf20 ?? calculateCMF(chartData, 20),
        "#22c55e",
        { markLine: oscillatorGuide([0.05, 0, -0.05]) },
      );
    } else if (panelName === "NVI") {
      addPanelNote(`NVI · indice volume faible · ${resolveVolumeFlowQualityLabel(chartData, 2, hasLiveStitchedCandle)}`);
      pushOscillatorLine(
        xAxisIndex,
        yAxisIndex,
        "nvi-series",
        "NVI",
        indicatorsData.nvi ?? calculateNVI(chartData),
        "#38bdf8",
        { markLine: oscillatorGuide([1000]) },
      );
    } else if (panelName === "PVI") {
      addPanelNote(`PVI · indice volume fort · ${resolveVolumeFlowQualityLabel(chartData, 2, hasLiveStitchedCandle)}`);
      pushOscillatorLine(
        xAxisIndex,
        yAxisIndex,
        "pvi-series",
        "PVI",
        indicatorsData.pvi ?? calculatePVI(chartData),
        "#f59e0b",
        { markLine: oscillatorGuide([1000]) },
      );
    } else if (panelName === "Chaikin Oscillator") {
      addPanelNote(`Chaikin Oscillator · momentum A/D · ${resolveVolumeFlowQualityLabel(chartData, 10, hasLiveStitchedCandle, true)}`);
      pushOscillatorLine(
        xAxisIndex,
        yAxisIndex,
        "chaikin-osc-series",
        "Chaikin Oscillator",
        indicatorsData.chaikinOsc ?? calculateChaikinOscillator(chartData, 3, 10),
        "#f97316",
        { markLine: oscillatorGuide([0]) },
      );
    } else if (panelName === "Volume Oscillator") {
      addPanelNote(`Volume Oscillator · SMA5/SMA20 % · ${resolveVolumeFlowQualityLabel(chartData, 20, hasLiveStitchedCandle)}`);
      pushOscillatorLine(
        xAxisIndex,
        yAxisIndex,
        "volume-osc-series",
        "Volume Oscillator",
        indicatorsData.volumeOsc ?? calculateVolumeOscillator(chartData, 5, 20),
        "#a855f7",
        { markLine: oscillatorGuide([0]) },
      );
    } else if (panelName === "VROC 14") {
      addPanelNote(`VROC 14 · volume ROC % · ${resolveVolumeFlowQualityLabel(chartData, 15, hasLiveStitchedCandle)}`);
      pushOscillatorLine(
        xAxisIndex,
        yAxisIndex,
        "vroc14-series",
        "VROC 14",
        indicatorsData.vroc14 ?? calculateVROC(chartData, 14),
        "#22d3ee",
        { markLine: oscillatorGuide([0]) },
      );
    } else if (panelName === "Klinger") {
      addPanelNote(`Klinger · VF EMA34/55 + signal EMA13 · ${resolveVolumeFlowQualityLabel(chartData, 68, hasLiveStitchedCandle, true)}`);
      const fallbackKlinger = indicatorsData.klingerOsc && indicatorsData.klingerSignal
        ? null
        : calculateKlingerOscillator(chartData, 34, 55, 13);
      if (isObjectVisible("klinger-osc")) {
        pushOscillatorLine(
          xAxisIndex,
          yAxisIndex,
          "klinger-osc",
          "Klinger Osc",
          indicatorsData.klingerOsc ?? fallbackKlinger?.oscillator ?? [],
          "#0ea5e9",
          { markLine: oscillatorGuide([0]) },
        );
      }
      if (isObjectVisible("klinger-signal")) {
        pushOscillatorLine(
          xAxisIndex,
          yAxisIndex,
          "klinger-signal",
          "Klinger Signal",
          indicatorsData.klingerSignal ?? fallbackKlinger?.signalLine ?? [],
          "#f59e0b",
        );
      }
    } else if (panelName === "Elder Force Index") {
      addPanelNote(`Elder Force Index · raw + EMA13 · ${resolveVolumeFlowQualityLabel(chartData, 14, hasLiveStitchedCandle)}`);
      const fallbackForce = indicatorsData.elderForceRaw && indicatorsData.forceIndex13
        ? null
        : calculateElderForceIndex(chartData, 13);
      if (isObjectVisible("elder-force-raw")) {
        pushOscillatorLine(
          xAxisIndex,
          yAxisIndex,
          "elder-force-raw",
          "Elder Force Raw",
          indicatorsData.elderForceRaw ?? fallbackForce?.raw ?? [],
          "#fb7185",
          { markLine: oscillatorGuide([0]) },
        );
      }
      if (isObjectVisible("force-index-13")) {
        pushOscillatorLine(
          xAxisIndex,
          yAxisIndex,
          "force-index-13",
          "Force Index 13",
          indicatorsData.forceIndex13 ?? fallbackForce?.forceIndex13 ?? [],
          "#f43f5e",
        );
      }
    } else if (panelName === "EOM 14") {
      addPanelNote(`EOM 14 · HL2/volume lissé · ${resolveVolumeFlowQualityLabel(chartData, 15, hasLiveStitchedCandle, true)}`);
      pushOscillatorLine(
        xAxisIndex,
        yAxisIndex,
        "eom14-series",
        "EOM 14",
        indicatorsData.eom14 ?? calculateEOM(chartData, 14, 100_000_000),
        "#8b5cf6",
        { markLine: oscillatorGuide([0]) },
      );
    } else if (panelName === "BB Width") pushOscillatorLine(xAxisIndex, yAxisIndex, "bb-width-series", "BB Width", indicatorsData.bbWidth, "#FF6D00");
    else if (panelName === "BB %B") pushOscillatorLine(xAxisIndex, yAxisIndex, "bb-percentb-series", "BB %B", indicatorsData.bbPercentB, "#2962FF", { markLine: oscillatorGuide([1, 0.8, 0.5, 0.2, 0]) });

    nextPanelTopPercent += panelHeightPercent + panelSpacingPercent;
  });

  if (hasVisibleComparisonSeries) {
    comparisonYAxisIndex = yAxisOptions.length;
    yAxisOptions.push({
      id: "compare-yaxis",
      position: "left",
      gridIndex: 0,
      scale: true,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { color: textColor, fontSize: 11, formatter: (value: number) => value.toFixed(1) + "%" },
    });
  }

  visibleComparisonSeries.forEach(({ entry, index }) => {
    const id = getCompareSeriesId(entry.symbol);

    const color = entry.settings.color || getCompareSeriesColor(index);
    const normalized = normalizeComparisonValues(
      entry.data,
      chartData,
      comparisonBaselineIndex,
      entry.settings.priceSource,
    );
    const symbolMarkPoint = buildCompareSymbolMarkPoint(entry.symbol, color, dates, normalized);
    const lastPoint = getLastFiniteComparisonPoint(dates, normalized);
    const lineData = buildComparisonLineData(dates, normalized);

    seriesOptions.push({
      id,
      name: entry.symbol,
      type: "line",
      xAxisIndex: 0,
      yAxisIndex: comparisonYAxisIndex,
      encode: { x: 0, y: 1 },
      data: lineData,
      showSymbol: false,
      connectNulls: true,
      smooth: true,
      z: 30,
      lineStyle: {
        width: entry.settings.lineWidth,
        type: entry.settings.lineStyle,
        color,
        opacity: 0.98,
      },
      itemStyle: { color },
      ...(entry.settings.showPriceLine && lastPoint
        ? {
            markLine: {
              symbol: ["none", "none"],
              animation: false,
              silent: true,
              label: { show: false },
              lineStyle: { color, type: "dashed", width: 1, opacity: 0.85 },
              data: [{ yAxis: lastPoint.value }],
            },
          }
        : {}),
      endLabel: {
        show: true,
        formatter: (params: { value?: unknown }) => formatCompareEndValueLabel(params.value),
        color: "#ffffff",
        backgroundColor: color,
        borderWidth: 0,
        borderRadius: [0, 1, 1, 0],
        padding: [2, 4],
        distance: 4,
        fontSize: 11,
        fontWeight: 700,
      },
      labelLayout: { moveOverlap: "shiftY" },
      ...(symbolMarkPoint ? { markPoint: symbolMarkPoint } : {}),
    });
  });

  const hiddenLegendSeriesIds = new Set([
    "bollinger-fill",
    "donchian-fill",
    "keltner-fill",
    "price-above-vwap-state",
    "new-52w-high-marker",
    "new-52w-low-marker",
    "new-ath-marker",
    "new-atl-marker",
    "gap-pct-label",
  ]);

  const legendData = Array.from(new Set(
    seriesOptions
      .filter((series) => {
        const seriesId = typeof series.id === "string" ? series.id : "";
        return seriesId !== "main-series" && !hiddenLegendSeriesIds.has(seriesId);
      })
      .map((series) => series.name)
      .filter((name): name is string => typeof name === "string"),
  ));

  if (priceOverlayStatusNotes.length > 0) {
    graphicOptions.push({
      type: "text",
      left: gridLeft + 8,
      top: 54,
      silent: true,
      z: 90,
      style: {
        text: priceOverlayStatusNotes.join(" · "),
        fill: "rgba(203, 213, 225, 0.78)",
        font: "600 10px Inter, system-ui, sans-serif",
        backgroundColor: "rgba(15, 23, 42, 0.68)",
        borderColor: "rgba(71, 85, 105, 0.55)",
        borderWidth: 1,
        borderRadius: 4,
        padding: [4, 6],
      },
    });
  }

  return {
    backgroundColor: "transparent",
    animation: false,
    title: {
      text: displaySymbol,
      left: 0,
      textStyle: { color: textColor, fontSize: 14, fontWeight: "normal" },
    },
    legend: {
      top: 0,
      left: "center",
      selectedMode: "multiple",
      selected: legendSelection,
      data: legendData,
      textStyle: { color: textColor },
      icon: "roundRect",
      itemWidth: 15,
      itemHeight: 10
    },
    tooltip: { show: false },
    axisPointer: { show: false },
    grid: gridOptions,
    xAxis: xAxisOptions,
    yAxis: yAxisOptions,
    graphic: graphicOptions,
    dataZoom: [{ id: "time-zoom", type: "inside", xAxisIndex: xAxisOptions.map((_, index) => index), zoomOnMouseWheel: false, moveOnMouseMove: false, filterMode: "none" }],
    series: seriesOptions,
  };
};

// ============================================================================
// [TENOR 2026] SCAR-SRP-01: MONOLITH FISSION
// ============================================================================

// ----------------------------------------------------------------------------
// HOOK 1: CHART BADGES (Direct DOM Manipulation via Getter Pattern)
// ----------------------------------------------------------------------------
interface UseChartBadgesProps {
  chartInstanceRef: MutableRefObject<EChartsInstance | null>;
  getChartContainer: () => HTMLDivElement | null;
  /** [TENOR 2026 SRE FIX] SCAR-MULTICHART-EVENT-SCOPE:
   * Stable container getter (gp-chart-layers-stack). Used for coordinate
   * calculations so badge positioning is correct in all layout modes.
   */
  getLayersStack: () => HTMLDivElement | null;
  getCursorBadge: () => HTMLDivElement | null;
  getCursorText: () => HTMLSpanElement | null;
  getCursorAction: () => HTMLButtonElement | null;
  getLastBadge: () => HTMLDivElement | null;
  getLastLine: () => HTMLDivElement | null;
  lastPriceAxisValue?: number;
  uiState: UiState;
}

const useChartBadges = ({
  chartInstanceRef,
  getChartContainer,
  getLayersStack,
  getCursorBadge,
  getCursorText,
  getCursorAction,
  getLastBadge,
  getLastLine,
  lastPriceAxisValue,
  uiState
}: UseChartBadgesProps) => {
  const hideCursorPriceAxisBadge = useCallback(() => {
    const cursorBadge = getCursorBadge();
    const cursorAction = getCursorAction();
    if (cursorBadge) {
      cursorBadge.style.opacity = "0";
      cursorBadge.style.visibility = "hidden";
    }
    if (cursorAction) {
      cursorAction.style.opacity = "0";
      cursorAction.style.visibility = "hidden";
    }
  }, [getCursorBadge, getCursorAction]);

  const hideLastPriceAxisBadge = useCallback(() => {
    const lastBadge = getLastBadge();
    const lastLine = getLastLine();
    if (lastBadge) {
      lastBadge.style.opacity = "0";
      lastBadge.style.visibility = "hidden";
    }
    if (lastLine) {
      lastLine.style.opacity = "0";
      lastLine.style.visibility = "hidden";
    }
  }, [getLastBadge, getLastLine]);

  const getMainGridVerticalBounds = useCallback((containerHeight: number) => {
    const chart = chartInstanceRef.current;
    const container = getChartContainer();
    if (chart && !chart.isDisposed() && container) {
      const rect = getSafeGridRect(chart, container);
      if (rect && Number.isFinite(rect.y) && Number.isFinite(rect.height)) {
        return {
          top: rect.y,
          bottom: rect.y + rect.height,
        };
      }
    }
    return {
      top: 0,
      bottom: Math.max(0, containerHeight - TV_X_AXIS_HEIGHT),
    };
  }, [chartInstanceRef, getChartContainer]);

  const updateLastPriceAxisBadge = useCallback(() => {
    const chart = chartInstanceRef.current;
    // [TENOR 2026 SRE FIX] SCAR-MULTICHART-EVENT-SCOPE:
    // Use getLayersStack() (stable gp-chart-layers-stack) instead of
    // getChartContainer()?.parentElement which returns the transient grid
    // cell in multi-chart mode, causing wrong Y-coordinate calculations.
    const containerEl = getLayersStack();
    const lastBadge = getLastBadge();
    const lastLine = getLastLine();

    if (!chart || chart.isDisposed() || !containerEl || !lastBadge || !lastLine || !Number.isFinite(lastPriceAxisValue)) {
      hideLastPriceAxisBadge();
      return;
    }

    const containerHeight = containerEl.getBoundingClientRect().height;
    const { top, bottom } = getMainGridVerticalBounds(containerHeight);

    try {
      const pixelValue = chart.convertToPixel({ yAxisIndex: 0 }, lastPriceAxisValue as number);
      const yPixel = Array.isArray(pixelValue) ? Number(pixelValue[1]) : Number(pixelValue);

      if (!Number.isFinite(yPixel)) {
        hideLastPriceAxisBadge();
        return;
      }

      const clampedY = clamp(yPixel, top + 11, bottom - 11);

      lastBadge.style.top = `${Math.round(clampedY)}px`;
      lastBadge.style.opacity = "1";
      lastBadge.style.visibility = "visible";

      lastLine.style.opacity = "0";
      lastLine.style.visibility = "hidden";
    } catch {
      hideLastPriceAxisBadge();
    }
  }, [chartInstanceRef, getLayersStack, getMainGridVerticalBounds, hideLastPriceAxisBadge, lastPriceAxisValue, getLastBadge, getLastLine]);

  const updateCursorPriceAxisBadge = useCallback((clientX: number, clientY: number) => {
    const chart = chartInstanceRef.current;
    // [TENOR 2026 SRE FIX] SCAR-MULTICHART-EVENT-SCOPE:
    // Use getLayersStack() (stable gp-chart-layers-stack) for coordinate space.
    // In multi-chart mode getChartContainer()?.parentElement was the grid cell
    // which has a header row, causing localX/localY to be offset by ~32px and
    // making isInsideMainChart always false → crosshair never rendered.
    const containerEl = getLayersStack();
    const cursorBadge = getCursorBadge();
    const cursorText = getCursorText();
    const cursorAction = getCursorAction();

    if (
      uiState.cursorMode === "arrow" ||
      !chart ||
      chart.isDisposed() ||
      !containerEl ||
      !cursorBadge ||
      !cursorText ||
      !cursorAction
    ) {
      hideCursorPriceAxisBadge();
      return;
    }

    const rect = containerEl.getBoundingClientRect();
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;

    const { top, bottom } = getMainGridVerticalBounds(rect.height);
    const gridRightPx = rect.width - TV_Y_AXIS_WIDTH;

    const isInsideMainChart = localX >= 0 && localX <= gridRightPx && localY >= top && localY <= bottom;

    if (!isInsideMainChart) {
      hideCursorPriceAxisBadge();
      return;
    }

    try {
      const pointInData = chart.convertFromPixel({ xAxisIndex: 0, yAxisIndex: 0 }, [localX, localY]);

      if (!Array.isArray(pointInData) || !Number.isFinite(Number(pointInData[1]))) {
        hideCursorPriceAxisBadge();
        return;
      }

      const priceValue = Number(pointInData[1]);
      const formattedPrice = formatAxisPriceValue(priceValue);
      const clampedY = clamp(localY, top + 11, bottom - 11);

      cursorText.textContent = formattedPrice;
      cursorBadge.style.top = `${Math.round(clampedY)}px`;
      cursorBadge.style.opacity = "1";
      cursorBadge.style.visibility = "visible";

      const badgeWidth = Math.max(TV_CURSOR_BADGE_MIN_WIDTH, Math.ceil(cursorBadge.getBoundingClientRect().width));

      cursorAction.style.top = `${Math.round(clampedY)}px`;
      cursorAction.style.right = `${TV_AXIS_BADGE_RIGHT_INSET + badgeWidth + TV_AXIS_ACTION_GAP}px`;
      cursorAction.style.opacity = "1";
      cursorAction.style.visibility = "visible";
      cursorAction.dataset.price = priceValue.toString();
      cursorAction.dataset.priceLabel = formattedPrice;
    } catch {
      hideCursorPriceAxisBadge();
    }
  }, [chartInstanceRef, getCursorAction, getCursorBadge, getCursorText, getMainGridVerticalBounds, hideCursorPriceAxisBadge, getLayersStack, uiState.cursorMode]);

  return { updateCursorPriceAxisBadge, updateLastPriceAxisBadge };
};

// ============================================================================
// MAIN HOOK: useEChartsRenderer (Orchestrator)
// ============================================================================
export const useEChartsRenderer = ({
  stockChartRef,
  chartInstanceRef,
  chartData,
  chartConfig,
  advancedIndicators,
  indicatorPeriods,
  bollingerSettings,
  chartAppearance,
  uiState,
  displaySymbol,
  lastZoomRangeRef,
  cursorPriceBadgeRef,
  cursorPriceTextRef,
  cursorPriceActionRef,
  lastPriceBadgeRef,
  lastPriceLineRef,
  lastPriceAxisValue,
  isMainChartVisible = true,
  comparisonSeries = [],
  onCompareSeriesSettingsRequest,
  onChartVisualReady,
  hasLiveStitchedCandle = false,
  hiddenObjectIds = {},
  layersStackRef,
}: UseEChartsRendererProps) => {
  const dispatch = useDispatch();
  const [legendSelection, setLegendSelection] = useState<Record<string, boolean>>({});
  const legendSelectionRef = useRef<Record<string, boolean>>({});
  const comparisonBaselineRafRef = useRef<number | null>(null);
  const comparisonBaselineIndexRef = useRef(0);

  // [TENOR 2026 SRE] Strict Lifecycle Guard for RAFs and Observers
  const isMountedRef = useRef(true);
  const [hasSize, setHasSize] = useState(false);
  const chartMutationTasksRef = useRef<Map<string, Parameters<ChartMutationScheduler>[1]>>(new Map());
  const chartMutationOrderRef = useRef<string[]>([]);
  const chartMutationRafRef = useRef<number | null>(null);
  const isChartMutationFlushingRef = useRef(false);

  const clearChartMutationQueue = useCallback(() => {
    if (chartMutationRafRef.current !== null) {
      cancelAnimationFrame(chartMutationRafRef.current);
      chartMutationRafRef.current = null;
    }
    chartMutationTasksRef.current.clear();
    chartMutationOrderRef.current = [];
  }, []);

  const flushChartMutationQueue = useCallback(function flushChartMutationQueue() {
    chartMutationRafRef.current = null;

    if (!isMountedRef.current) {
      clearChartMutationQueue();
      return;
    }

    const chart = chartInstanceRef.current;
    if (!chart || chart.isDisposed()) {
      clearChartMutationQueue();
      return;
    }

    const nextKey = chartMutationOrderRef.current.shift();
    if (!nextKey) return;

    const mutation = chartMutationTasksRef.current.get(nextKey);
    chartMutationTasksRef.current.delete(nextKey);
    if (!mutation) {
      if (chartMutationOrderRef.current.length > 0) {
        chartMutationRafRef.current = requestAnimationFrame(flushChartMutationQueue);
      }
      return;
    }

    isChartMutationFlushingRef.current = true;
    try {
      mutation(chart);
    } catch (error) {
      console.warn("[SRE] ECharts mutation failed", error);
    } finally {
      isChartMutationFlushingRef.current = false;
    }

    if (chartMutationOrderRef.current.length > 0) {
      chartMutationRafRef.current = requestAnimationFrame(flushChartMutationQueue);
    }
  }, [chartInstanceRef, clearChartMutationQueue]);

  const scheduleChartMutation = useCallback<ChartMutationScheduler>((key, mutation) => {
    if (!chartMutationTasksRef.current.has(key)) {
      chartMutationOrderRef.current.push(key);
    }
    chartMutationTasksRef.current.set(key, mutation);

    if (chartMutationRafRef.current === null && !isChartMutationFlushingRef.current) {
      chartMutationRafRef.current = requestAnimationFrame(flushChartMutationQueue);
    }
  }, [flushChartMutationQueue]);

  const renderChartData = chartData;
  const renderComparisonSeries = comparisonSeries;
  const isInitialChartRenderDeferred = false;
  const renderAdvancedIndicators = advancedIndicators;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearChartMutationQueue();
    };
  }, [clearChartMutationQueue]);

  // [TENOR 2026 FIX] Getter Pattern to hide Ref mutation from ESLint
  const getChartContainer = useCallback(() => stockChartRef.current, [stockChartRef]);
  // [TENOR 2026 SRE FIX] SCAR-MULTICHART-EVENT-SCOPE: Prefer layersStackRef as the
  // stable event target. In multi-chart mode stockChartRef.parentElement changes to
  // a grid cell div, so we must use this stable container ref instead.
  const getLayersStack = useCallback(
    () => layersStackRef?.current ?? stockChartRef.current?.parentElement as HTMLDivElement | null ?? null,
    [layersStackRef, stockChartRef]
  );
  const getCursorBadge = useCallback(() => cursorPriceBadgeRef?.current || null, [cursorPriceBadgeRef]);
  const getCursorText = useCallback(() => cursorPriceTextRef?.current || null, [cursorPriceTextRef]);
  const getCursorAction = useCallback(() => cursorPriceActionRef?.current || null, [cursorPriceActionRef]);
  const getLastBadge = useCallback(() => lastPriceBadgeRef?.current || null, [lastPriceBadgeRef]);
  const getLastLine = useCallback(() => lastPriceLineRef?.current || null, [lastPriceLineRef]);
  const hasVisibleComparisonEndLabels = useMemo(
    () => renderComparisonSeries.some((entry) => (
      !hiddenObjectIds[getCompareSeriesId(entry.symbol)] &&
      isCompareSeriesVisibleForTimeframe(entry.settings, chartConfig.timeframe)
    )),
    [chartConfig.timeframe, renderComparisonSeries, hiddenObjectIds],
  );
  const visibleCompareSymbolLookup = useMemo(
    () => new Map(renderComparisonSeries.map((entry) => [normalizeCompareSymbol(entry.symbol), entry.symbol])),
    [renderComparisonSeries],
  );
  const trendSignalSourceAveragePeriods = useMemo(
    () => resolveTrendSignalSourceAveragePeriods(uiState.movingAverageTrendSignals),
    [uiState.movingAverageTrendSignals],
  );
  const priceVsSmaSourceAveragePeriods = useMemo(
    () => resolvePriceVsSmaSourceAveragePeriods(uiState.priceVsSmaMetrics),
    [uiState.priceVsSmaMetrics],
  );
  const priceVsEmaSourceAveragePeriods = useMemo(
    () => resolvePriceVsEmaSourceAveragePeriods(uiState.priceVsEmaMetrics),
    [uiState.priceVsEmaMetrics],
  );
  const effectiveChartIndicators = useMemo(() => {
    const activeSma = mergeMovingAveragePeriods(
      chartConfig.indicators.activeSma,
      trendSignalSourceAveragePeriods.sma,
      priceVsSmaSourceAveragePeriods,
    );
    const activeEma = mergeMovingAveragePeriods(
      chartConfig.indicators.activeEma,
      trendSignalSourceAveragePeriods.ema,
      priceVsEmaSourceAveragePeriods,
    );

    return {
      ...chartConfig.indicators,
      sma: chartConfig.indicators.sma || trendSignalSourceAveragePeriods.sma.length > 0 || priceVsSmaSourceAveragePeriods.length > 0,
      ema: chartConfig.indicators.ema || trendSignalSourceAveragePeriods.ema.length > 0 || priceVsEmaSourceAveragePeriods.length > 0,
      activeSma,
      activeEma,
    };
  }, [chartConfig.indicators, priceVsEmaSourceAveragePeriods, priceVsSmaSourceAveragePeriods, trendSignalSourceAveragePeriods]);
  const effectiveChartConfig = useMemo(() => ({
    ...chartConfig,
    indicators: effectiveChartIndicators,
  }), [chartConfig, effectiveChartIndicators]);
  const renderChartConfig = effectiveChartConfig;

  useEffect(() => () => {
    const chart = chartInstanceRef.current;
    if (chart && !chart.isDisposed()) {
      chart.dispose();
    }
    chartInstanceRef.current = null;
  }, [chartInstanceRef]);

  // ============================================================================
  // [TENOR 2026 SRE] TIME AXIS DILATION (ICHIMOKU & BOLLINGER PROJECTION)
  // Extends the dataset into the future to allow ECharts to render projected lines.
  // [FIX] SCAR-BOLLINGER-OFFSET: Dynamically calculates max required future offset.
  // ============================================================================
  const extendedChartData = useMemo(() => {
    let maxOffset = 0;
    if (renderAdvancedIndicators.ichimoku) {
      maxOffset = Math.max(maxOffset, 26);
    }
    if (renderAdvancedIndicators.bollinger && bollingerSettings.offset > 0) {
      maxOffset = Math.max(maxOffset, bollingerSettings.offset);
    }

    if (maxOffset === 0) return renderChartData;

    const ext = [...renderChartData];
    if (ext.length > 0) {
      let currTime = new Date(ext[ext.length - 1].time).getTime();
      const dayMs = 24 * 60 * 60 * 1000;
      for (let i = 0; i < maxOffset; i++) {
        currTime += dayMs;
        const dt = new Date(currTime);
        if (dt.getDay() === 6) currTime += 2 * dayMs; // Skip Saturday
        else if (dt.getDay() === 0) currTime += dayMs; // Skip Sunday
        ext.push({ time: new Date(currTime).toISOString(), open: NaN, high: -Infinity, low: Infinity, close: NaN, volume: 0 });
      }
    }
    return ext;
  }, [renderChartData, renderAdvancedIndicators.ichimoku, renderAdvancedIndicators.bollinger, bollingerSettings.offset]);

  // ============================================================================
  // [TENOR 2026 SRE] ASYNCHRONOUS MATH PIPELINE (WEB WORKER)
  // SCAR-162: Eradicates UI Freezes and Race Conditions via messageId.
  // ============================================================================
  const [indicatorsData, setIndicatorsData] = useState<Record<string, (number | string)[]>>({});
  const workerRef = useRef<Worker | null>(null);
  const messageIdRef = useRef<number>(0);

  // Initialize and cleanup worker
  useEffect(() => {
    workerRef.current = createIndicatorsWorker();
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  // Trigger worker computation when dependencies change
  useEffect(() => {
    const worker = workerRef.current;
    if (!worker) return;

    const currentMessageId = ++messageIdRef.current;

    if (isInitialChartRenderDeferred || renderChartData.length === 0) {
      setIndicatorsData({});
      return;
    }

    // 1. Serialize Data (Zero-Copy Transferable Object)
    const FIELDS_PER_CANDLE = 7;
    const buffer = new ArrayBuffer(renderChartData.length * FIELDS_PER_CANDLE * 8); // 8 bytes per Float64
    const flatData = new Float64Array(buffer);

    for (let i = 0; i < renderChartData.length; i++) {
      const bar = renderChartData[i];
      const offset = i * FIELDS_PER_CANDLE;
      // Pass timestamp as number for the worker to reconstruct
      flatData[offset + 0] = new Date(bar.time).getTime();
      flatData[offset + 1] = bar.open;
      flatData[offset + 2] = bar.high;
      flatData[offset + 3] = bar.low;
      flatData[offset + 4] = bar.close;
      flatData[offset + 5] = bar.volume;
      const tradesCount = bar.tradesCount ?? bar.trades_count;
      flatData[offset + 6] = typeof tradesCount === "number" && Number.isFinite(tradesCount) ? tradesCount : NaN;
    }

    // 2. Setup Response Handler
    worker.onmessage = (e: MessageEvent) => {
      // [TENOR 2026 SRE] Race Condition Shield
      if (e.data.messageId !== currentMessageId) return;
      if (!isMountedRef.current) return;

      if (!e.data.success) {
        console.error("[SRE] Worker Math Error:", e.data.error);
        return;
      }

      const rawResults = e.data.results;
      const formattedResults: Record<string, (number | string)[]> = {};

      // Convert Float64Array back to standard array, mapping NaN to "-" for ECharts
      for (const key in rawResults) {
        formattedResults[key] = Array.from(rawResults[key], (v: number) => Number.isNaN(v) ? "-" : v);
      }

      setIndicatorsData(formattedResults);
    };

    // 3. Post Message
    worker.postMessage({
      messageId: currentMessageId,
      buffer,
      length: renderChartData.length,
      config: {
        indicators: renderChartConfig.indicators,
        advancedIndicators: renderAdvancedIndicators,
        indicatorPeriods,
        bollingerSettings
      }
    }, [buffer]); // Transfer ownership of the buffer

  }, [isInitialChartRenderDeferred, renderChartData, renderChartConfig.indicators, renderAdvancedIndicators, indicatorPeriods, bollingerSettings]);

  // ============================================================================
  // [TENOR 2026 SRE] O(N) DATA EXTRACTION (axis anchored to real candles)
  // ============================================================================
  const { dates, volumes } = useMemo(() => {
    const directionalSeries = buildDirectionalOhlcvSeries(renderChartData, {
      upColor: chartAppearance.upColor,
      downColor: chartAppearance.downColor,
      volumeColorMode: chartAppearance.volumeColorMode,
    });

    return {
      dates: directionalSeries.dates,
      volumes: directionalSeries.volumes,
    };
  }, [
    chartAppearance.downColor,
    chartAppearance.upColor,
    chartAppearance.volumeColorMode,
    renderChartData,
  ]);

  // 2. Badges Engine
  // [TENOR 2026 SRE FIX] SCAR-MULTICHART-EVENT-SCOPE: pass getLayersStack so badge
  // coordinate math uses the stable container, not the transient grid cell parent.
  const { updateCursorPriceAxisBadge, updateLastPriceAxisBadge } = useChartBadges({
    chartInstanceRef,
    getChartContainer,
    getLayersStack,
    getCursorBadge,
    getCursorText,
    getCursorAction,
    getLastBadge,
    getLastLine,
    lastPriceAxisValue,
    uiState
  });

  const chartInteractionScopeKey = `${uiState.multiChartLayout.layoutId}:${uiState.multiChartLayout.activeChartId}`;

  const priceLevelViewportMarkers = useMemo<PriceLevelViewportMarker[]>(() => {
    if (renderChartData.length === 0) return [];

    const markers: PriceLevelViewportMarker[] = [];
    const isVisible = (id: string) => !hiddenObjectIds[id];
    let fiftyTwoWeekFallback: ReturnType<typeof calculateFiftyTwoWeekLevels> | null = null;
    let historicalRecordFallback: ReturnType<typeof calculateHistoricalRecordLevels> | null = null;

    const getFiftyTwoWeekFallback = () => {
      if (!fiftyTwoWeekFallback) fiftyTwoWeekFallback = calculateFiftyTwoWeekLevels(renderChartData);
      return fiftyTwoWeekFallback;
    };
    const getHistoricalRecordFallback = () => {
      if (!historicalRecordFallback) historicalRecordFallback = calculateHistoricalRecordLevels(renderChartData);
      return historicalRecordFallback;
    };
    const pushMarker = (
      enabled: boolean,
      parentId: string,
      levelId: string,
      label: string,
      color: string,
      series: (number | string)[] | undefined,
      fallbackSeries: () => (number | string)[] | undefined,
    ) => {
      if (!enabled || !isVisible(parentId) || !isVisible(levelId)) return;

      const value = getLastFiniteSeriesValue(series) ?? getLastFiniteSeriesValue(fallbackSeries());
      if (value !== null) {
        markers.push({ id: levelId, label, value, color });
      }
    };

    pushMarker(
      renderAdvancedIndicators.fiftyTwoWeekHigh,
      "fiftyTwoWeekHigh",
      "52w-high-level",
      "52W H",
      "#f97316",
      indicatorsData.fiftyTwoWeekHigh,
      () => getFiftyTwoWeekFallback().high,
    );
    pushMarker(
      renderAdvancedIndicators.fiftyTwoWeekLow,
      "fiftyTwoWeekLow",
      "52w-low-level",
      "52W L",
      "#38bdf8",
      indicatorsData.fiftyTwoWeekLow,
      () => getFiftyTwoWeekFallback().low,
    );
    pushMarker(
      renderAdvancedIndicators.ath,
      "ath",
      "ath-level",
      "ATH",
      "#facc15",
      indicatorsData.ath,
      () => getHistoricalRecordFallback().ath,
    );
    pushMarker(
      renderAdvancedIndicators.atl,
      "atl",
      "atl-level",
      "ATL",
      "#a78bfa",
      indicatorsData.atl,
      () => getHistoricalRecordFallback().atl,
    );

    return markers;
  }, [
    hiddenObjectIds,
    indicatorsData.ath,
    indicatorsData.atl,
    indicatorsData.fiftyTwoWeekHigh,
    indicatorsData.fiftyTwoWeekLow,
    renderAdvancedIndicators.ath,
    renderAdvancedIndicators.atl,
    renderAdvancedIndicators.fiftyTwoWeekHigh,
    renderAdvancedIndicators.fiftyTwoWeekLow,
    renderChartData,
  ]);

  // 3. Viewport Engine (Extracted to useChartViewport.ts for SRP)
  // Keep viewport anchored to executable candles; projections must not push the main series left.
  // [TENOR 2026 SRE FIX] SCAR-MULTICHART-EVENT-SCOPE: use getLayersStack (stable ref) instead
  // of getChartContainer so that DOM event listeners bind to the correct container in all layouts.
  const { applyViewport, resetManualYViewport } = useChartViewport({
    chartInstanceRef,
    getChartContainer: getLayersStack,
    chartData: renderChartData,
    lastZoomRangeRef,
    updateCursorPriceAxisBadge,
    updateLastPriceAxisBadge,
    interactionScopeKey: chartInteractionScopeKey,
    hasComparisonEndLabels: hasVisibleComparisonEndLabels,
    lastPriceAxisValue,
    priceLevelMarkers: priceLevelViewportMarkers,
    scheduleChartMutation,
  });

  // ============================================================================
  // [TENOR 2026 HDR] DYNAMIC COMPARISON BASELINE (TradingView Parity)
  // Recalculates the 0% baseline based on the first visible point during zoom.
  // ============================================================================
  const updateComparisonBaselines = useCallback(() => {
    if (!isMountedRef.current || !chartInstanceRef.current || chartInstanceRef.current.isDisposed() || renderComparisonSeries.length === 0) return;

    try {
      const chart = chartInstanceRef.current;
      const option = chart.getOption();
      const dz = option.dataZoom as any[];
      let startIdx = 0;

      if (dz && dz.length > 0 && dz[0].startValue !== undefined) {
        startIdx = Math.max(0, Math.floor(dz[0].startValue));
      }

      comparisonBaselineIndexRef.current = startIdx;

      const newSeries = renderComparisonSeries
        .filter((entry) => (
          !hiddenObjectIds[getCompareSeriesId(entry.symbol)] &&
          isCompareSeriesVisibleForTimeframe(entry.settings, chartConfig.timeframe)
        ))
        .map((entry) => {
          const normalized = normalizeComparisonValues(entry.data, renderChartData, startIdx, entry.settings.priceSource);
          return {
            id: getCompareSeriesId(entry.symbol),
            data: buildComparisonLineData(dates, normalized),
          };
        });

      // Update only the series data without triggering a full re-render or datazoom event.
      scheduleChartMutation("comparison-baselines", (targetChart) => {
        targetChart.setOption({ series: newSeries });
      });
    } catch (e) {
      console.warn("[SRE] Failed to update comparison baselines", e);
    }
  }, [chartConfig.timeframe, renderComparisonSeries, chartInstanceRef, hiddenObjectIds, renderChartData, dates, scheduleChartMutation]);

  const scheduleComparisonBaselines = useCallback(() => {
    if (renderComparisonSeries.length === 0 || comparisonBaselineRafRef.current !== null) return;
    comparisonBaselineRafRef.current = requestAnimationFrame(() => {
      comparisonBaselineRafRef.current = null;
      updateComparisonBaselines();
    });
  }, [renderComparisonSeries.length, updateComparisonBaselines]);

  // --- ECHARTS RENDER LOGIC (React Cycle) ---
  useEffect(() => {
    const container = stockChartRef.current;
    if (!container || renderChartData.length === 0) return;

    const existingChart = chartInstanceRef.current;
    if (existingChart?.isDisposed()) {
      chartInstanceRef.current = null;
    } else if (existingChart && existingChart.getDom() !== container) {
      existingChart.dispose();
      chartInstanceRef.current = null;
    }

    // [TENOR 2026 SRE FIX] Resize Resilience
    let resizeRafId: number;
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        if (!hasSize) setHasSize(true);
      } else {
        if (hasSize) setHasSize(false);
      }

      resizeRafId = requestAnimationFrame(() => {
        if (isMountedRef.current && chartInstanceRef.current && !chartInstanceRef.current.isDisposed()) {
          scheduleChartMutation("resize", (targetChart) => {
            targetChart.resize();
          });
          scheduleChartMutation("post-resize-viewport-reset", () => {
            resetManualYViewport();
          });
        }
      });
    });

    resizeObserver.observe(container);

    if (!hasSize) {
      if (container.clientWidth > 0 && container.clientHeight > 0) {
        setHasSize(true);
      }
      return () => {
        cancelAnimationFrame(resizeRafId);
        resizeObserver.disconnect();
      };
    }

    if (!chartInstanceRef.current) {
      registerEChartsModules();
      chartInstanceRef.current = echarts.init(container);
    }

    const chart = chartInstanceRef.current;
    let hasReportedVisualReady = false;
    const visualReadyRafIds: number[] = [];

    const reportVisualReady = () => {
      if (hasReportedVisualReady || !isMountedRef.current || chart.isDisposed()) return;
      if (!hasRenderableSeriesData(chart)) return;
      hasReportedVisualReady = true;
      onChartVisualReady?.();
    };

    const scheduleVisualReadyFallback = () => {
      const firstRafId = requestAnimationFrame(() => {
        const secondRafId = requestAnimationFrame(reportVisualReady);
        visualReadyRafIds.push(secondRafId);
      });
      visualReadyRafIds.push(firstRafId);
    };

    // Calculate live price and color for the builder
    const lastCandle = renderChartData.length > 0 ? renderChartData[renderChartData.length - 1] : null;
    const latestPrice = lastCandle ? lastCandle.close : 0;
    const isLivePositive = lastCandle ? lastCandle.close >= lastCandle.open : true;
    const liveColor = isLivePositive ? chartAppearance.upColor : chartAppearance.downColor;

    // ============================================================================
    // [TENOR 2026 SRE] PURE BUILDER DELEGATION
    // ============================================================================
    const builderContext: ChartBuilderContext = {
      dates,
      volumes,
      chartData: renderChartData,
      extendedChartData,
      chartConfig: renderChartConfig,
      advancedIndicators: renderAdvancedIndicators,
      indicatorPeriods,
      bollingerSettings,
      chartAppearance,
      uiState,
      displaySymbol,
      indicatorsData,
      comparisonSeries: renderComparisonSeries,
      hiddenObjectIds,
      latestPrice,
      liveColor,
      isMainChartVisible,
      legendSelection: legendSelectionRef.current,
      comparisonBaselineIndex: comparisonBaselineIndexRef.current,
      hasLiveStitchedCandle,
    };

    const option = withStableInitialViewport({
      option: buildEChartsOption(builderContext),
      chartData: renderChartData,
      hasComparisonEndLabels: hasVisibleComparisonEndLabels,
      lastPriceAxisValue,
      zoomRange: lastZoomRangeRef?.current,
    });

    // [TENOR 2026 SRE] RAF Cleanup Enforcement
    let rafId: number;
    rafId = requestAnimationFrame(() => {
      if (isMountedRef.current && chart && !chart.isDisposed()) {
        scheduleChartMutation("full-option", (targetChart) => {
          applyChartOption(targetChart, option);
        });
        scheduleChartMutation("post-option-viewport", () => {
          applyViewport();
        });
        if (renderComparisonSeries.length > 0) {
          scheduleComparisonBaselines();
        }
        scheduleVisualReadyFallback();
      }
    });

    const handleLegendChange = (params: any) => {
      if (!isMountedRef.current) return;
      const nextSelection = { ...(params.selected || {}) };
      const normalizedName = typeof params.name === "string" ? normalizeCompareSymbol(params.name) : "";
      const compareSymbol = visibleCompareSymbolLookup.get(normalizedName);
      if (compareSymbol) {
        nextSelection[params.name] = true;
        onCompareSeriesSettingsRequest?.(compareSymbol);
      }
      legendSelectionRef.current = nextSelection;
      setLegendSelection(nextSelection);
    };

    const handleCompareSeriesClick = (params: any) => {
      if (!isMountedRef.current) return;
      const seriesId = typeof params.seriesId === "string" ? params.seriesId : "";
      const seriesName = typeof params.seriesName === "string" ? params.seriesName : "";
      const isCompareSeries = seriesId.startsWith("compare-") || visibleCompareSymbolLookup.has(normalizeCompareSymbol(seriesName));
      if (!isCompareSeries) return;
      const normalizedName = seriesId.startsWith("compare-")
        ? seriesId.slice("compare-".length)
        : normalizeCompareSymbol(seriesName);
      const compareSymbol = visibleCompareSymbolLookup.get(normalizedName);
      if (compareSymbol) onCompareSeriesSettingsRequest?.(compareSymbol);
    };

    chart.on('finished', reportVisualReady);
    chart.on('legendselectchanged', handleLegendChange);
    chart.on('click', handleCompareSeriesClick);
    chart.on('datazoom', scheduleComparisonBaselines);
    chart.on('restore', scheduleComparisonBaselines);

    return () => {
      cancelAnimationFrame(rafId);
      cancelAnimationFrame(resizeRafId);
      visualReadyRafIds.forEach((visualReadyRafId) => cancelAnimationFrame(visualReadyRafId));
      if (comparisonBaselineRafRef.current !== null) {
        cancelAnimationFrame(comparisonBaselineRafRef.current);
        comparisonBaselineRafRef.current = null;
      }
      if (chart && !chart.isDisposed()) {
        chart.off('finished', reportVisualReady);
        chart.off('legendselectchanged', handleLegendChange);
        chart.off('click', handleCompareSeriesClick);
        chart.off('datazoom', scheduleComparisonBaselines);
        chart.off('restore', scheduleComparisonBaselines);
      }
      resizeObserver.disconnect();
    };
  }, [
    isInitialChartRenderDeferred,
    renderChartData,
    chartConfig,
    renderChartConfig,
    effectiveChartIndicators,
    renderAdvancedIndicators,
    uiState,
    uiState.replay.isActive,
    displaySymbol,
    chartAppearance,
    indicatorPeriods,
    bollingerSettings,
    uiState.cursorMode,
    indicatorsData,
    dispatch,
    chartInstanceRef,
    stockChartRef,
    lastZoomRangeRef,
    cursorPriceBadgeRef,
    cursorPriceTextRef,
    cursorPriceActionRef,
    lastPriceBadgeRef,
    lastPriceAxisValue,
    uiState.dataMode,
    // [TENOR 2026 SRE FIX] SCAR-MULTICHART-EVENT-SCOPE: chartInteractionScopeKey ensures
    // the effect re-runs when the layout switches (1→4→6 charts), which forces ECharts
    // to detect the DOM mismatch (getDom() !== container) and re-initialize on the
    // correct stockChartRef.current node.
    chartInteractionScopeKey,
    legendSelection,
    applyViewport,
    resetManualYViewport,
    updateCursorPriceAxisBadge,
    updateLastPriceAxisBadge,
    isMainChartVisible,
    renderComparisonSeries,
    hasSize,
    dates,
    volumes,
    extendedChartData,
    hiddenObjectIds,
    hasLiveStitchedCandle,
    hasVisibleComparisonEndLabels,
    scheduleChartMutation,
    scheduleComparisonBaselines,
    visibleCompareSymbolLookup,
    onCompareSeriesSettingsRequest,
    onChartVisualReady
  ]);

  return { indicatorsData };
};

// --- EOF ---
