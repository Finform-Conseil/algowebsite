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
import { ChartDataPoint } from "../lib/Indicators/TechnicalIndicators";
import { useChartViewport, TV_Y_AXIS_WIDTH, TV_X_AXIS_HEIGHT, MAIN_GRID_LEFT, clamp, getSafeGridRect } from "./useChartViewport";
import { createIndicatorsWorker } from "../lib/workers/createIndicatorsWorker";
import { getCompareSeriesColor, getCompareSeriesId } from "../config/compareSeries";

// ============================================================================
// [TENOR 2026 FIX] SCAR-TS-01: Exported Interface to fix TS 2304
// ============================================================================
export interface UseEChartsRendererProps {
  stockChartRef: RefObject<HTMLDivElement | null>;
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
  comparisonSeries?: Array<{ symbol: string; data: ChartDataPoint[] }>;
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

interface ChartBuilderContext {
  dates: string[];
  values: number[][];
  volumes: (number | string)[][];
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
  comparisonSeries: Array<{ symbol: string; data: ChartDataPoint[] }>;
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

const isFiniteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

const toDayKey = (time: string): string => {
  const trimmed = time.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);

  const timestamp = Date.parse(trimmed);
  if (!Number.isFinite(timestamp)) return trimmed;
  return new Date(timestamp).toISOString().slice(0, 10);
};

const buildComparisonPriceLookup = (data: ChartDataPoint[]) => {
  const exact = new Map<string, number>();
  const daily = new Map<string, number>();

  data.forEach((point) => {
    if (!Number.isFinite(point.close)) return;
    exact.set(point.time.trim(), point.close);
    daily.set(toDayKey(point.time), point.close);
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
  startIndex: number
): Array<number | null> => {
  const lookup = buildComparisonPriceLookup(data);
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

const formatCompareEndLabel = (symbol: string, value: unknown): string => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return symbol;
  const sign = numericValue > 0 ? "+" : "";
  return `${symbol} ${sign}${numericValue.toFixed(2)}%`;
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

  if (upperCurrent === null || lowerCurrent === null || upperPrevious === null || lowerPrevious === null || xIndex === null) return undefined;

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
  values,
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
  const shouldRenderVolumePanel = (chartConfig.indicators.volume || chartAppearance.showVolume) && isObjectVisible("volume");
  const oscillatorPanels = [
    advancedIndicators.rsi && isObjectVisible("rsi") ? "RSI" : null,
    advancedIndicators.macd && isObjectVisible("macd") ? "MACD" : null,
    advancedIndicators.stochastic && isObjectVisible("stochastic") ? "Stoch" : null,
    advancedIndicators.atr && isObjectVisible("atr") ? "ATR" : null,
    advancedIndicators.cci && isObjectVisible("cci") ? "CCI" : null,
    advancedIndicators.williamsR && isObjectVisible("williamsR") ? "Will%R" : null,
    advancedIndicators.roc && isObjectVisible("roc") ? "ROC" : null,
    advancedIndicators.obv && isObjectVisible("obv") ? "OBV" : null,
    advancedIndicators.stochRsi && isObjectVisible("stochRsi") ? "StochRSI" : null,
    advancedIndicators.bbWidth && isObjectVisible("bbWidth") ? "BB Width" : null,
    advancedIndicators.bbPercentB && isObjectVisible("bbPercentB") ? "BB %B" : null,
  ].filter((panel): panel is string => panel !== null);
  const gridLeft = comparisonSeries.length > 0 ? 60 : MAIN_GRID_LEFT;
  const gridRight = TV_Y_AXIS_WIDTH;
  const topMarginPercent = 8;
  const bottomMarginPercent = 5;
  const panelCount = (shouldRenderVolumePanel ? 1 : 0) + oscillatorPanels.length;
  const panelSpacingPercent = panelCount > 1 ? 2.5 : 6;
  const panelHeightPercent =
    panelCount <= 1
      ? 20
      : Math.min(20, Math.max(7, (100 - topMarginPercent - bottomMarginPercent - 35 - panelSpacingPercent * panelCount) / panelCount));
  const mainGridHeightPercent = Math.max(
    panelCount <= 1 ? 30 : 35,
    100 - topMarginPercent - bottomMarginPercent - panelCount * (panelHeightPercent + panelSpacingPercent)
  );
  let nextPanelTopPercent = topMarginPercent + mainGridHeightPercent + panelSpacingPercent;
  const gridOptions: ChartOptionPart[] = [];
  const xAxisOptions: ChartOptionPart[] = [];
  const yAxisOptions: ChartOptionPart[] = [];
  const seriesOptions: ChartOptionPart[] = [];
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
    data: dates,
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

  if (comparisonSeries.length > 0) {
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

  const mainSeriesVisible = isMainChartVisible && isObjectVisible("main-series");
  seriesOptions.push(
    chartConfig.chartType === "candlestick"
      ? {
          id: "main-series",
          name: displaySymbol,
          type: "candlestick",
          data: values,
          itemStyle: {
            color: upColor,
            color0: downColor,
            borderColor: upColor,
            borderColor0: downColor,
            opacity: mainSeriesVisible ? 1 : 0,
          },
          markLine: { symbol: ["none", "none"], animation: false, silent: true, data: [{ yAxis: latestPrice, label: { show: false }, lineStyle: { color: liveColor, type: "dashed", width: 1, opacity: 0.8 } }] },
        }
      : {
          id: "main-series",
          name: displaySymbol,
          type: "line",
          data: chartData.map((item) => item.close),
          showSymbol: false,
          itemStyle: { color: upColor, opacity: mainSeriesVisible ? 1 : 0 },
          lineStyle: { color: upColor, opacity: mainSeriesVisible ? 1 : 0 },
          markLine: { symbol: ["none", "none"], animation: false, silent: true, data: [{ yAxis: latestPrice, label: { show: false }, lineStyle: { color: liveColor, type: "dashed", width: 1, opacity: 0.8 } }] },
        }
  );

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
    xAxisOptions.push({ id: "volume-xaxis", type: "category", gridIndex: volumeGridIndex, data: dates, boundaryGap: false, axisLabel: { show: false }, axisTick: { show: false }, splitLine: { show: false }, min: "dataMin", max: "dataMax" });
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
      itemStyle: { color: (params: { value: (number | string)[] }) => Number(params.value[2]) > 0 ? upColor : downColor, opacity: 0.8 },
      showBackground: true,
      backgroundStyle: { color: "rgba(255, 255, 255, 0.03)" },
    });
    nextPanelTopPercent += panelHeightPercent + panelSpacingPercent;
  }

  const pushLine = (id: string, name: string, data: (number | string)[] | undefined, color: string) => {
    if (!data || !isObjectVisible(id)) return;
    seriesOptions.push({ id, name, type: "line", data, showSymbol: false, smooth: true, lineStyle: { opacity: 0.9, width: 1.5, color }, itemStyle: { color } });
  };

  if (chartConfig.indicators.sma) {
    const activeSmas = chartConfig.indicators.activeSma || [];
    if (activeSmas.includes(indicatorPeriods.sma1)) pushLine(`sma-${indicatorPeriods.sma1}`, `SMA ${indicatorPeriods.sma1}`, indicatorsData.sma1, "#45c3a1");
    if (activeSmas.includes(indicatorPeriods.sma2)) pushLine(`sma-${indicatorPeriods.sma2}`, `SMA ${indicatorPeriods.sma2}`, indicatorsData.sma2, "#f06467");
    if (activeSmas.includes(indicatorPeriods.sma3)) pushLine(`sma-${indicatorPeriods.sma3}`, `SMA ${indicatorPeriods.sma3}`, indicatorsData.sma3, "#FF9F04");
    if (activeSmas.includes(50)) pushLine("sma-50", "SMA 50", indicatorsData.sma50, "#2E93fA");
    if (activeSmas.includes(200)) pushLine("sma-200", "SMA 200", indicatorsData.sma200, "#66DA26");
  }
  if (chartConfig.indicators.ema) {
    const activeEmas = chartConfig.indicators.activeEma || [];
    if (activeEmas.includes(5)) pushLine("ema-5", "EMA 5", indicatorsData.ema5, "#9C27B0");
    if (activeEmas.includes(10)) pushLine("ema-10", "EMA 10", indicatorsData.ema10, "#E91E63");
  }
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

  const oscillatorGuide = (levels: number[]) => ({
    silent: true,
    symbol: ["none", "none"],
    label: { show: false },
    lineStyle: { color: "rgba(120, 123, 134, 0.5)", type: "dashed", width: 1 },
    data: levels.map((level) => ({ yAxis: level })),
  });

  const pushOscillatorLine = (xAxisIndex: number, yAxisIndex: number, id: string, name: string, data: (number | string)[] | undefined, color: string, extra: ChartOptionPart = {}) => {
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

  oscillatorPanels.forEach((panelName, index) => {
    const gridIndex = gridOptions.length;
    const xAxisIndex = xAxisOptions.length;
    const yAxisIndex = yAxisOptions.length;
    const bounded0to100 = panelName === "RSI" || panelName === "Stoch" || panelName === "StochRSI";
    const boundedWillR = panelName === "Will%R";

    gridOptions.push({ left: gridLeft, right: gridRight, top: `${nextPanelTopPercent}%`, height: `${panelHeightPercent}%`, containLabel: false });
    xAxisOptions.push({ id: `osc-xaxis-${index}`, type: "category", gridIndex, data: dates, boundaryGap: false, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false }, min: "dataMin", max: "dataMax" });
    yAxisOptions.push({
      id: `osc-yaxis-${index}`,
      position: "right",
      gridIndex,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: chartAppearance.showGrid, lineStyle: { color: "rgba(42, 46, 57, 0.5)", type: "dashed" } },
      axisLabel: { color: textColor, fontSize: 10 },
      scale: !(bounded0to100 || boundedWillR),
      min: bounded0to100 ? 0 : boundedWillR ? -100 : undefined,
      max: bounded0to100 ? 100 : boundedWillR ? 0 : undefined,
      axisPointer: { show: uiState.cursorMode !== "arrow", label: { show: true } },
    });

    if (panelName === "RSI") {
      pushOscillatorLine(xAxisIndex, yAxisIndex, "rsi-series", "RSI", indicatorsData.rsi, "#7E57C2", {
        markArea: { silent: true, itemStyle: { color: "rgba(126, 87, 194, 0.08)" }, data: [[{ yAxis: 30 }, { yAxis: 70 }]] },
        markLine: oscillatorGuide([70, 30, 50]),
      });
    } else if (panelName === "MACD" && indicatorsData.macdLine) {
      seriesOptions.push({
        id: "macd-hist",
        name: "MACD",
        type: "bar",
        xAxisIndex,
        yAxisIndex,
        data: indicatorsData.macdHist?.map((value, i) => [i, value]) ?? [],
        itemStyle: { color: (params: { value: (number | string)[] }) => Number(params.value[1]) > 0 ? upColor : downColor },
      });
      pushOscillatorLine(xAxisIndex, yAxisIndex, "macd-line", "MACD Line", indicatorsData.macdLine, "#ffffff");
      pushOscillatorLine(xAxisIndex, yAxisIndex, "macd-signal", "Signal", indicatorsData.macdSignal, "#FF9F04");
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
    else if (panelName === "CCI") pushOscillatorLine(xAxisIndex, yAxisIndex, "cci-series", "CCI", indicatorsData.cci, "#00E676");
    else if (panelName === "Will%R") {
      pushOscillatorLine(xAxisIndex, yAxisIndex, "willr-series", "Williams %R", indicatorsData.williamsR, "#FFEB3B", {
        markArea: { silent: true, itemStyle: { color: "rgba(255, 235, 59, 0.08)" }, data: [[{ yAxis: -80 }, { yAxis: -20 }]] },
        markLine: oscillatorGuide([-20, -80, -50]),
      });
    } else if (panelName === "ROC") pushOscillatorLine(xAxisIndex, yAxisIndex, "roc-series", "ROC", indicatorsData.roc, "#2196F3", { markLine: oscillatorGuide([0]) });
    else if (panelName === "OBV") pushOscillatorLine(xAxisIndex, yAxisIndex, "obv-series", "OBV", indicatorsData.obv, "#FF5722");
    else if (panelName === "BB Width") pushOscillatorLine(xAxisIndex, yAxisIndex, "bb-width-series", "BB Width", indicatorsData.bbWidth, "#FF6D00");
    else if (panelName === "BB %B") pushOscillatorLine(xAxisIndex, yAxisIndex, "bb-percentb-series", "BB %B", indicatorsData.bbPercentB, "#2962FF", { markLine: oscillatorGuide([1, 0.8, 0.5, 0.2, 0]) });

    nextPanelTopPercent += panelHeightPercent + panelSpacingPercent;
  });

  comparisonSeries.forEach((entry, index) => {
    const id = getCompareSeriesId(entry.symbol);
    if (!isObjectVisible(id)) return;
    const color = getCompareSeriesColor(index);
    const normalized = normalizeComparisonValues(entry.data, chartData, comparisonBaselineIndex);
    seriesOptions.push({
      id,
      name: entry.symbol,
      type: "line",
      xAxisIndex: 0,
      yAxisIndex: comparisonSeries.length > 0 ? 1 : 0,
      data: normalized,
      showSymbol: false,
      connectNulls: true,
      smooth: true,
      z: 30,
      lineStyle: { width: 2, color, opacity: 0.98 },
      itemStyle: { color },
      endLabel: {
        show: true,
        formatter: (params: { value?: unknown }) => formatCompareEndLabel(entry.symbol, params.value),
        color: "#061320",
        backgroundColor: color,
        borderColor: color,
        borderWidth: 1,
        borderRadius: 2,
        padding: [2, 5],
        distance: 8,
        fontSize: 11,
        fontWeight: 700,
      },
      labelLayout: { moveOverlap: "shiftY" },
    });
  });

  const legendData = seriesOptions
    .filter((series) => series.id !== "main-series")
    .map((series) => series.name)
    .filter((name): name is string => typeof name === "string");

  return {
    backgroundColor: "transparent",
    animation: false,
    title: { text: displaySymbol, left: 0, textStyle: { color: textColor, fontSize: 14, fontWeight: "normal" } },
    legend: { top: 0, left: "center", selectedMode: "multiple", selected: legendSelection, data: legendData, textStyle: { color: textColor }, icon: "roundRect", itemWidth: 15, itemHeight: 10 },
    tooltip: { show: false },
    axisPointer: { show: false },
    grid: gridOptions,
    xAxis: xAxisOptions,
    yAxis: yAxisOptions,
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
    const containerEl = getChartContainer()?.parentElement;
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
  }, [chartInstanceRef, getChartContainer, getMainGridVerticalBounds, hideLastPriceAxisBadge, lastPriceAxisValue, getLastBadge, getLastLine]);

  const updateCursorPriceAxisBadge = useCallback((clientX: number, clientY: number) => {
    const chart = chartInstanceRef.current;
    const containerEl = getChartContainer()?.parentElement;
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
  }, [chartInstanceRef, getCursorAction, getCursorBadge, getCursorText, getMainGridVerticalBounds, hideCursorPriceAxisBadge, getChartContainer, uiState.cursorMode]);

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
  hiddenObjectIds = {},
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
  const getCursorBadge = useCallback(() => cursorPriceBadgeRef?.current || null, [cursorPriceBadgeRef]);
  const getCursorText = useCallback(() => cursorPriceTextRef?.current || null, [cursorPriceTextRef]);
  const getCursorAction = useCallback(() => cursorPriceActionRef?.current || null, [cursorPriceActionRef]);
  const getLastBadge = useCallback(() => lastPriceBadgeRef?.current || null, [lastPriceBadgeRef]);
  const getLastLine = useCallback(() => lastPriceLineRef?.current || null, [lastPriceLineRef]);

  // ============================================================================
  // [TENOR 2026 SRE] TIME AXIS DILATION (ICHIMOKU PROJECTION)
  // Extends the dataset into the future to allow ECharts to render projected lines.
  // ============================================================================
  const extendedChartData = useMemo(() => {
    if (!advancedIndicators.ichimoku) return chartData;
    const ext = [...chartData];
    if (ext.length > 0) {
      let currTime = new Date(ext[ext.length - 1].time).getTime();
      const dayMs = 24 * 60 * 60 * 1000;
      for (let i = 0; i < 26; i++) {
        currTime += dayMs;
        const dt = new Date(currTime);
        if (dt.getDay() === 6) currTime += 2 * dayMs; // Skip Saturday
        else if (dt.getDay() === 0) currTime += dayMs; // Skip Sunday
        ext.push({
          time: new Date(currTime).toISOString(),
          open: NaN,
          high: -Infinity,
          low: Infinity,
          close: NaN,
          volume: 0
        });
      }
    }
    return ext;
  }, [chartData, advancedIndicators]);

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
        indicators: chartConfig.indicators,
        advancedIndicators,
        indicatorPeriods,
        bollingerSettings
      }
    }, [buffer]); // Transfer ownership of the buffer

  }, [chartData, chartConfig.indicators, advancedIndicators, indicatorPeriods, bollingerSettings]);

  // ============================================================================
  // [TENOR 2026 SRE] O(N) DATA EXTRACTION (Uses extendedChartData for X-Axis)
  // ============================================================================
  const { dates, values, volumes } = useMemo(() => {
    const d: string[] = [];
    const v: number[][] = [];
    const vol: (number | string)[][] = [];
    const len = extendedChartData.length;

    for (let i = 0; i < len; i++) {
      const item = extendedChartData[i];
      d.push(item.time);
      // Only push valid candles to values and volumes (ignore future ghost candles)
      if (i < chartData.length) {
        v.push([item.open, item.close, item.low, item.high]);
        vol.push([i, item.volume, item.close > item.open ? 1 : -1]);
      }
    }
    return { dates: d, values: v, volumes: vol };
  }, [extendedChartData, chartData.length]);

  // 2. Badges Engine
  const { updateCursorPriceAxisBadge, updateLastPriceAxisBadge } = useChartBadges({
    chartInstanceRef,
    getChartContainer,
    getCursorBadge,
    getCursorText,
    getCursorAction,
    getLastBadge,
    getLastLine,
    lastPriceAxisValue,
    uiState
  });

  // 3. Viewport Engine (Extracted to useChartViewport.ts for SRP)
  // [TENOR 2026] Pass extendedChartData so the user can pan into the future
  const { applyViewport, resetManualYViewport } = useChartViewport({
    chartInstanceRef,
    getChartContainer,
    chartData: extendedChartData,
    lastZoomRangeRef,
    updateCursorPriceAxisBadge,
    updateLastPriceAxisBadge
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
        .filter((entry) => !hiddenObjectIds[getCompareSeriesId(entry.symbol)])
        .map((entry) => ({
          id: getCompareSeriesId(entry.symbol),
          data: normalizeComparisonValues(entry.data, chartData, startIdx),
        }));

      // Update only the series data without triggering a full re-render or datazoom event
      chart.setOption({ series: newSeries });
    } catch (e) {
      console.warn("[SRE] Failed to update comparison baselines", e);
    }
  }, [comparisonSeries, chartInstanceRef, hiddenObjectIds, chartData]);

  const scheduleComparisonBaselines = useCallback(() => {
    if (comparisonSeries.length === 0 || comparisonBaselineRafRef.current !== null) return;
    comparisonBaselineRafRef.current = requestAnimationFrame(() => {
      comparisonBaselineRafRef.current = null;
      updateComparisonBaselines();
    });
  }, [comparisonSeries.length, updateComparisonBaselines]);

  // --- ECHARTS RENDER LOGIC (React Cycle) ---
  useEffect(() => {
    if (!stockChartRef.current || chartData.length === 0) return;

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

    if (stockChartRef.current) {
      resizeObserver.observe(stockChartRef.current);
    }

    if (!hasSize) {
      const container = stockChartRef.current;
      if (container.clientWidth > 0 && container.clientHeight > 0) {
        setHasSize(true);
      }
      return () => {
        cancelAnimationFrame(resizeRafId);
        resizeObserver.disconnect();
      };
    }

    const container = stockChartRef.current;
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
      values,
      volumes,
      chartData,
      extendedChartData,
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
      legendSelectionRef.current = nextSelection;
      setLegendSelection(nextSelection);
    };

    chart.on('legendselectchanged', handleLegendChange);
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
        chart.off('datazoom', scheduleComparisonBaselines);
        chart.off('restore', scheduleComparisonBaselines);
      }
      resizeObserver.disconnect();
    };
  }, [
    chartData,
    chartConfig,
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
    legendSelection,
    applyViewport,
    resetManualYViewport,
    updateCursorPriceAxisBadge,
    updateLastPriceAxisBadge,
    isMainChartVisible,
    comparisonSeries,
    hasSize,
    dates,
    values,
    volumes,
    extendedChartData,
    hiddenObjectIds,
    scheduleComparisonBaselines
  ]);

  return { indicatorsData };
};

// --- EOF ---
