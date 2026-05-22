import { useEffect, useState, useRef, RefObject, MutableRefObject, useMemo, useCallback } from "react";
import * as echarts from "echarts/core";
import { useDispatch } from "react-redux";
import {
  ChartState,
  AdvancedIndicatorsState,
  IndicatorPeriods,
  ChartAppearance,
  UiState,
  BollingerSettings,
} from "../config/TechnicalAnalysisTypes";
import { calculateAcceleratorOscillator, calculateADX, calculateALMA, calculateAPO, calculateAroon, calculateAroonOscillator, calculateAwesomeOscillator, calculateCCI, calculateCMO, calculateCoppockCurve, calculateDEMA, calculateDPO, calculateDYMI, calculateElderBullBearPower, calculateEMA, calculateFisherTransform, calculateHMA, calculateKAMA, calculateMACD, calculateMFI, calculateMassIndex, calculateMomentum, calculatePPO, calculateParabolicSAR, calculateROC, calculateRVI, calculateSMA, calculateSMMA, calculateSTC, calculateSupertrend, calculateTEMA, calculateTRIX, calculateTSI, calculateUltimateOscillator, calculateVWMA, calculateVortex, calculateWilliamsR, calculateWMA, calculateZLEMA, ChartDataPoint } from "../lib/Indicators/TechnicalIndicators";
import {
  useChartViewport,
  TV_Y_AXIS_WIDTH,
  TV_X_AXIS_HEIGHT,
  MAIN_GRID_LEFT,
  clamp,
  getSafeGridRect
} from "./useChartViewport";
import { createIndicatorsWorker } from "../lib/workers/createIndicatorsWorker";
import {
  getCompareSeriesColor,
  getCompareSeriesId,
  isCompareSeriesVisibleForTimeframe,
  normalizeCompareSymbol,
  type CompareSeriesPriceSource,
  type CompareSeriesSettings,
} from "../config/compareSeries";
import {
  buildDirectionalOhlcvSeries,
  type DirectionalVolumeDataPoint,
} from "../lib/chart/directionalOhlcv";
import {
  buildEmaSeriesDefinitions,
  buildSmaSeriesDefinitions,
  mergeMovingAveragePeriods,
  resolveTrendSignalSourceAveragePeriods,
} from "../config/movingAverageSeries";
import { resolvePriceVsSmaSourceAveragePeriods } from "../config/priceVsSmaMetrics";
import { resolvePriceVsEmaSourceAveragePeriods } from "../config/priceVsEmaMetrics";
import {
  buildAdvancedMovingAverageSeriesDefinitions,
  type AdvancedMovingAverageFamily,
} from "../config/advancedMovingAverageSeries";
import {
  buildChartTypeSeries,
} from "../lib/chart-types/renderers/buildEChartsOption";

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
  chartInstanceRef: MutableRefObject<echarts.ECharts | null>;
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

type CustomRenderApi = {
  value: (dimension: number) => unknown;
  coord: (data: unknown[]) => number[];
  style: (style: Record<string, unknown>) => Record<string, unknown>;
};

interface LineRenderOptions {
  showPointMarkers?: boolean;
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
}

const formatAxisPriceValue = (value: number): string => {
  const decimals = Math.abs(value) < 10 ? 4 : 2;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const toFiniteNumber = (value: unknown): number | null => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

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
  time: string
): number | null => {
  const exactPrice = lookup.exact.get(time.trim());
  if (Number.isFinite(exactPrice)) return exactPrice as number;
  const dailyPrice = lookup.daily.get(toDayKey(time));
  return Number.isFinite(dailyPrice) ? dailyPrice as number : null;
};

const normalizeComparisonValues = (
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

const getCompareLabelSymbolBackground = (color: string): string => {
  const match = color.match(/^#([0-9a-f]{6})$/i);
  if (!match) return color;

  const value = Number.parseInt(match[1], 16);
  const red = Math.round(((value >> 16) & 255) * 0.86);
  const green = Math.round(((value >> 8) & 255) * 0.86);
  const blue = Math.round((value & 255) * 0.86);

  return `rgb(${red}, ${green}, ${blue})`;
};

const formatCompareEndValueLabel = (value: unknown): string => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "";
  const sign = numericValue > 0 ? "+" : "";
  return `${sign}${numericValue.toFixed(2)}%`;
};

const formatCompareSymbolLabel = (symbol: string): string =>
  normalizeCompareSymbol(symbol).replace(/[{}|]/g, "");

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

const getLastFiniteComparisonPoint = (
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

const buildCompareSymbolMarkPoint = (
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

const buildBandFillData = (upper?: (number | string)[], lower?: (number | string)[]): Array<(number | string)[]> => {
  if (!upper || !lower) return [];
  const length = Math.min(upper.length, lower.length);
  const fillData: Array<(number | string)[]> = [];
  for (let index = 1; index < length; index++) {
    fillData.push([index, upper[index], lower[index], upper[index - 1], lower[index - 1]]);
  }
  return fillData;
};

const renderBandPolygon = (api: CustomRenderApi, fill: string) => {
  const upperCurrent = toFiniteNumber(api.value(1));
  const lowerCurrent = toFiniteNumber(api.value(2));
  const upperPrevious = toFiniteNumber(api.value(3));
  const lowerPrevious = toFiniteNumber(api.value(4));
  const xIndex = toFiniteNumber(api.value(0));

  if (upperCurrent === null || lowerCurrent === null || upperPrevious === null || lowerPrevious === null || xIndex === null)
    return undefined;

  return {
    type: "polygon",
    shape: {
      points: [
        api.coord([xIndex - 1, upperPrevious]),
        api.coord([xIndex, upperCurrent]),
        api.coord([xIndex, lowerCurrent]),
        api.coord([xIndex - 1, lowerPrevious]),
      ],
    },
    style: api.style({ fill }),
  };
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
}: ChartBuilderContext): echarts.EChartsCoreOption => {
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
  const renderDates = chartTypePlan.dates;
  const mainSeriesData = chartTypePlan.series.find((series) => series.id === "main-series")?.data;
  const renderedMainSeriesPointCount = Array.isArray(mainSeriesData) ? mainSeriesData.length : chartData.length;

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
    advancedIndicators.stochastic && isObjectVisible("stochastic") ? "Stoch" : null,
    advancedIndicators.atr && isObjectVisible("atr") ? "ATR" : null,
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
    advancedIndicators.obv && isObjectVisible("obv") ? "OBV" : null,
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

  const getVolumeAxisMax = (value: { max: number }): number => {
    const averageVolume = volumes.reduce((acc, volumePoint) => acc + (Number(volumePoint[1]) || 0), 0) / (volumes.length || 1);
    const fallbackMax = value.max * 1.1 || 100;
    if (averageVolume <= 0) return fallbackMax;
    return Math.min(value.max, averageVolume * 5) || fallbackMax;
  };

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
  });

  if (hasVisibleComparisonSeries) {
    yAxisOptions.push({
      id: "compare-yaxis",
      position: "left",
      scale: true,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { color: textColor, fontSize: 11, formatter: (value: number) => `${value.toFixed(1)}%` },
    });
  }

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
      data: volumes,
      barWidth: "65%",
      barMinHeight: 3,
      itemStyle: {
        color: (params: { value: (number | string)[] }) => Number(params.value[2]) > 0 ? upColor : downColor,
        opacity: 0.8
      },
      showBackground: true,
      backgroundStyle: { color: "rgba(255, 255, 255, 0.03)" },
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

    seriesOptions.push({
      id,
      name,
      type: "line",
      data,
      ...pointMarkerOptions,
      smooth: false,
      lineStyle: { opacity: 0.9, width: 1.5, color },
      itemStyle: { color },
    });
  };

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
    pushLine("ichimoku-senkouA", "Senkou A", indicatorsData.senkouA, "#A5D6A7");
    pushLine("ichimoku-senkouB", "Senkou B", indicatorsData.senkouB, "#EF9A9A");

    const cloudData = buildBandFillData(indicatorsData.senkouA, indicatorsData.senkouB);
    if (cloudData.length > 0) {
      seriesOptions.push({
        id: "ichimoku-cloud",
        name: "Kumo Cloud",
        type: "custom",
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
    const bollingerFillData = buildBandFillData(indicatorsData.bollUpper, indicatorsData.bollLower);

    if (showBollingerFill && bollingerFillData.length > 0) {
      seriesOptions.push({
        id: "boll-fill",
        name: "BB Background",
        type: "custom",
        renderItem: (_params: unknown, api: CustomRenderApi) => renderBandPolygon(api, bollingerSettings.fillColor),
        data: bollingerFillData,
        itemStyle: { opacity: bollingerSettings.fillOpacity ?? 0.05 },
        z: 0,
      });
    }

    pushLine("boll-upper", "BB Upper", indicatorsData.bollUpper, bollingerSettings.upperColor);
    pushLine("boll-mid", "BB Middle", indicatorsData.bollMiddle, bollingerSettings.middleColor);
    pushLine("boll-lower", "BB Lower", indicatorsData.bollLower, bollingerSettings.lowerColor);
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
      scale: !(bounded0to100 || boundedWillR || boundedCmo || boundedAroonOsc),
      min: bounded0to100 ? 0 : boundedWillR || boundedCmo || boundedAroonOsc ? -100 : undefined,
      max: bounded0to100 ? 100 : boundedWillR ? 0 : boundedCmo || boundedAroonOsc ? 100 : undefined,
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
    } else if (panelName === "ATR") pushOscillatorLine(xAxisIndex, yAxisIndex, "atr-series", "ATR", indicatorsData.atr, "#d50000");
    else if (panelName === "CCI") {
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
    } else if (panelName === "OBV") pushOscillatorLine(xAxisIndex, yAxisIndex, "obv-series", "OBV", indicatorsData.obv, "#FF5722");
    else if (panelName === "BB Width") pushOscillatorLine(xAxisIndex, yAxisIndex, "bb-width-series", "BB Width", indicatorsData.bbWidth, "#FF6D00");
    else if (panelName === "BB %B") pushOscillatorLine(xAxisIndex, yAxisIndex, "bb-percentb-series", "BB %B", indicatorsData.bbPercentB, "#2962FF", { markLine: oscillatorGuide([1, 0.8, 0.5, 0.2, 0]) });

    nextPanelTopPercent += panelHeightPercent + panelSpacingPercent;
  });

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

    seriesOptions.push({
      id,
      name: entry.symbol,
      type: "line",
      xAxisIndex: 0,
      yAxisIndex: hasVisibleComparisonSeries ? 1 : 0,
      data: normalized,
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

  const legendData = Array.from(new Set(
    seriesOptions
      .filter((series) => series.id !== "main-series")
      .map((series) => series.name)
      .filter((name): name is string => typeof name === "string"),
  ));

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
    dataZoom: [{ id: "time-zoom", type: "inside", xAxisIndex: xAxisOptions.map((_, index) => index), zoomOnMouseWheel: false, moveOnMouseMove: false, filterMode: "filter" }],
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
  chartInstanceRef: MutableRefObject<echarts.ECharts | null>;
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

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
    () => comparisonSeries.some((entry) => (
      !hiddenObjectIds[getCompareSeriesId(entry.symbol)] &&
      isCompareSeriesVisibleForTimeframe(entry.settings, chartConfig.timeframe)
    )),
    [chartConfig.timeframe, comparisonSeries, hiddenObjectIds],
  );
  const visibleCompareSymbolLookup = useMemo(
    () => new Map(comparisonSeries.map((entry) => [normalizeCompareSymbol(entry.symbol), entry.symbol])),
    [comparisonSeries],
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
    if (advancedIndicators.ichimoku) {
      maxOffset = Math.max(maxOffset, 26);
    }
    if (advancedIndicators.bollinger && bollingerSettings.offset > 0) {
      maxOffset = Math.max(maxOffset, bollingerSettings.offset);
    }

    if (maxOffset === 0) return chartData;

    const ext = [...chartData];
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
  }, [chartData, advancedIndicators.ichimoku, advancedIndicators.bollinger, bollingerSettings.offset]);

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

    if (chartData.length === 0) {
      setIndicatorsData({});
      return;
    }

    // 1. Serialize Data (Zero-Copy Transferable Object)
    const FIELDS_PER_CANDLE = 6;
    const buffer = new ArrayBuffer(chartData.length * FIELDS_PER_CANDLE * 8); // 8 bytes per Float64
    const flatData = new Float64Array(buffer);

    for (let i = 0; i < chartData.length; i++) {
      const bar = chartData[i];
      const offset = i * FIELDS_PER_CANDLE;
      // Pass timestamp as number for the worker to reconstruct
      flatData[offset + 0] = new Date(bar.time).getTime();
      flatData[offset + 1] = bar.open;
      flatData[offset + 2] = bar.high;
      flatData[offset + 3] = bar.low;
      flatData[offset + 4] = bar.close;
      flatData[offset + 5] = bar.volume;
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
      length: chartData.length,
      config: {
        indicators: effectiveChartIndicators,
        advancedIndicators,
        indicatorPeriods,
        bollingerSettings
      }
    }, [buffer]); // Transfer ownership of the buffer

  }, [chartData, effectiveChartIndicators, advancedIndicators, indicatorPeriods, bollingerSettings]);

  // ============================================================================
  // [TENOR 2026 SRE] O(N) DATA EXTRACTION (Uses extendedChartData for X-Axis)
  // ============================================================================
  const { dates, volumes } = useMemo(() => {
    const directionalSeries = buildDirectionalOhlcvSeries(chartData, {
      upColor: chartAppearance.upColor,
      downColor: chartAppearance.downColor,
      volumeColorMode: chartAppearance.volumeColorMode,
    });

    return {
      dates: extendedChartData.map((item) => item.time),
      volumes: directionalSeries.volumes,
    };
  }, [
    chartAppearance.downColor,
    chartAppearance.upColor,
    chartAppearance.volumeColorMode,
    chartData,
    extendedChartData,
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

  // 3. Viewport Engine (Extracted to useChartViewport.ts for SRP)
  // [TENOR 2026] Pass extendedChartData so the user can pan into the future
  // [TENOR 2026 SRE FIX] SCAR-MULTICHART-EVENT-SCOPE: use getLayersStack (stable ref) instead
  // of getChartContainer so that DOM event listeners bind to the correct container in all layouts.
  const { applyViewport, resetManualYViewport } = useChartViewport({
    chartInstanceRef,
    getChartContainer: getLayersStack,
    chartData: extendedChartData,
    lastZoomRangeRef,
    updateCursorPriceAxisBadge,
    updateLastPriceAxisBadge,
    interactionScopeKey: chartInteractionScopeKey,
    hasComparisonEndLabels: hasVisibleComparisonEndLabels,
    lastPriceAxisValue,
  });

  // ============================================================================
  // [TENOR 2026 HDR] DYNAMIC COMPARISON BASELINE (TradingView Parity)
  // Recalculates the 0% baseline based on the first visible point during zoom.
  // ============================================================================
  const updateComparisonBaselines = useCallback(() => {
    if (!isMountedRef.current || !chartInstanceRef.current || chartInstanceRef.current.isDisposed() || comparisonSeries.length === 0) return;

    try {
      const chart = chartInstanceRef.current;
      const option = chart.getOption();
      const dz = option.dataZoom as any[];
      let startIdx = 0;

      if (dz && dz.length > 0 && dz[0].startValue !== undefined) {
        startIdx = Math.max(0, Math.floor(dz[0].startValue));
      }

      comparisonBaselineIndexRef.current = startIdx;

      const newSeries = comparisonSeries
        .filter((entry) => (
          !hiddenObjectIds[getCompareSeriesId(entry.symbol)] &&
          isCompareSeriesVisibleForTimeframe(entry.settings, chartConfig.timeframe)
        ))
        .map((entry) => ({
          id: getCompareSeriesId(entry.symbol),
          data: normalizeComparisonValues(entry.data, chartData, startIdx, entry.settings.priceSource),
        }));

      // Update only the series data without triggering a full re-render or datazoom event
      chart.setOption({ series: newSeries });
    } catch (e) {
      console.warn("[SRE] Failed to update comparison baselines", e);
    }
  }, [chartConfig.timeframe, comparisonSeries, chartInstanceRef, hiddenObjectIds, chartData]);

  const scheduleComparisonBaselines = useCallback(() => {
    if (comparisonSeries.length === 0 || comparisonBaselineRafRef.current !== null) return;
    comparisonBaselineRafRef.current = requestAnimationFrame(() => {
      comparisonBaselineRafRef.current = null;
      updateComparisonBaselines();
    });
  }, [comparisonSeries.length, updateComparisonBaselines]);

  // --- ECHARTS RENDER LOGIC (React Cycle) ---
  useEffect(() => {
    const container = stockChartRef.current;
    if (!container || chartData.length === 0) return;

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
          chartInstanceRef.current.resize();
          resetManualYViewport();
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
      chartInstanceRef.current = echarts.init(container);
    }

    const chart = chartInstanceRef.current;

    // Calculate live price and color for the builder
    const lastCandle = chartData.length > 0 ? chartData[chartData.length - 1] : null;
    const latestPrice = lastCandle ? lastCandle.close : 0;
    const isLivePositive = lastCandle ? lastCandle.close >= lastCandle.open : true;
    const liveColor = isLivePositive ? chartAppearance.upColor : chartAppearance.downColor;

    // ============================================================================
    // [TENOR 2026 SRE] PURE BUILDER DELEGATION
    // ============================================================================
    const builderContext: ChartBuilderContext = {
      dates,
      volumes,
      chartData,
      extendedChartData,
      chartConfig: effectiveChartConfig,
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
      legendSelection: legendSelectionRef.current,
      comparisonBaselineIndex: comparisonBaselineIndexRef.current,
    };

    const option = buildEChartsOption(builderContext);

    // [TENOR 2026 SRE] RAF Cleanup Enforcement
    let rafId: number;
    rafId = requestAnimationFrame(() => {
      if (isMountedRef.current && chart && !chart.isDisposed()) {
        chart.setOption(option, true);
        applyViewport();
        if (comparisonSeries.length > 0) {
          scheduleComparisonBaselines();
        }
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

    chart.on('legendselectchanged', handleLegendChange);
    chart.on('click', handleCompareSeriesClick);
    chart.on('datazoom', scheduleComparisonBaselines);
    chart.on('restore', scheduleComparisonBaselines);

    return () => {
      cancelAnimationFrame(rafId);
      cancelAnimationFrame(resizeRafId);
      if (comparisonBaselineRafRef.current !== null) {
        cancelAnimationFrame(comparisonBaselineRafRef.current);
        comparisonBaselineRafRef.current = null;
      }
      if (chart && !chart.isDisposed()) {
        chart.off('legendselectchanged', handleLegendChange);
        chart.off('click', handleCompareSeriesClick);
        chart.off('datazoom', scheduleComparisonBaselines);
        chart.off('restore', scheduleComparisonBaselines);
      }
      resizeObserver.disconnect();
    };
  }, [
    chartData,
    chartConfig,
    effectiveChartConfig,
    effectiveChartIndicators,
    advancedIndicators,
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
    comparisonSeries,
    hasSize,
    dates,
    volumes,
    extendedChartData,
    hiddenObjectIds,
    scheduleComparisonBaselines,
    visibleCompareSymbolLookup,
    onCompareSeriesSettingsRequest
  ]);

  return { indicatorsData };
};

// --- EOF ---
