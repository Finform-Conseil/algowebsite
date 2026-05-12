import { useEffect, useState, useRef, RefObject, MutableRefObject, useMemo, useCallback } from "react";
import * as echarts from "echarts/core";
import { useDispatch } from "react-redux";
import {
  ChartState,
  AdvancedIndicatorsState,
  IndicatorPeriods,
  ChartAppearance,
  UiState,
  GridOption,
  XAxisOption,
  YAxisOption,
  SeriesOption,
  BollingerSettings,
} from "../config/TechnicalAnalysisTypes";
import {
  ChartDataPoint,
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollinger,
  calculateStochastic,
  calculateStochasticRSI,
  calculateIchimoku,
  calculateATR,
  calculateCCI,
  calculateWilliamsR,
  calculateROC,
  calculateOBV
} from "../lib/Indicators/TechnicalIndicators";
import { useChartViewport, TV_Y_AXIS_WIDTH, TV_X_AXIS_HEIGHT, MAIN_GRID_LEFT, clamp, getSafeGridRect } from "./useChartViewport";

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
  bollingerSettings: BollingerSettings; // [TENOR 2026 HDR] Added Bollinger Settings
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
}

// ============================================================================
// CONSTANTES SPÉCIFIQUES AUX BADGES
// ============================================================================
const TV_AXIS_BADGE_RIGHT_INSET = 8;
const TV_AXIS_ACTION_GAP = 3;
const TV_CURSOR_BADGE_MIN_WIDTH = 72;

const formatAxisPriceValue = (value: number): string => {
  const decimals = Math.abs(value) < 10 ? 4 : 2;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
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
}: UseEChartsRendererProps) => {
  const dispatch = useDispatch();
  const [legendSelection, setLegendSelection] = useState<Record<string, boolean>>({});
  const legendSelectionRef = useRef<Record<string, boolean>>({});

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
  // [TENOR 2026 SRE] SYNCHRONOUS MATH PIPELINE
  // ============================================================================
  const indicatorsData = useMemo(() => {
    const res: Record<string, (number | string)[]> = {};
    if (chartData.length === 0) return res;

    try {
      // SMA
      if (chartConfig.indicators.sma) {
        if (chartConfig.indicators.activeSma.includes(indicatorPeriods.sma1)) res.sma1 = calculateSMA(chartData, indicatorPeriods.sma1);
        if (chartConfig.indicators.activeSma.includes(indicatorPeriods.sma2)) res.sma2 = calculateSMA(chartData, indicatorPeriods.sma2);
        if (chartConfig.indicators.activeSma.includes(indicatorPeriods.sma3)) res.sma3 = calculateSMA(chartData, indicatorPeriods.sma3);
        if (chartConfig.indicators.activeSma.includes(50)) res.sma50 = calculateSMA(chartData, 50);
        if (chartConfig.indicators.activeSma.includes(200)) res.sma200 = calculateSMA(chartData, 200);
      }

      // EMA
      if (chartConfig.indicators.ema) {
        if (chartConfig.indicators.activeEma.includes(5)) res.ema5 = calculateEMA(chartData, 5);
        if (chartConfig.indicators.activeEma.includes(10)) res.ema10 = calculateEMA(chartData, 10);
      }

      // Advanced
      if (advancedIndicators.rsi) res.rsi = calculateRSI(chartData, indicatorPeriods.rsiPeriod);
      
      if (advancedIndicators.macd) {
        const macd = calculateMACD(chartData);
        res.macdLine = macd.macdLine;
        res.macdSignal = macd.signalLine;
        res.macdHist = macd.histogram;
      }

      // [TENOR 2026 HDR] BOLLINGER BANDS
      if (advancedIndicators.bollinger || advancedIndicators.bbWidth || advancedIndicators.bbPercentB) {
        // Fallback to defaults if settings are somehow missing
        const period = bollingerSettings?.length ?? 20;
        const multiplier = bollingerSettings?.multiplier ?? 2.0;
        
        const boll = calculateBollinger(chartData, period, multiplier);
        
        if (advancedIndicators.bollinger) {
          res.bollUpper = boll.upper;
          res.bollMiddle = boll.middle;
          res.bollLower = boll.lower;
        }
        if (advancedIndicators.bbWidth) res.bbWidth = boll.width;
        if (advancedIndicators.bbPercentB) res.bbPercentB = boll.percentB;
      }

      if (advancedIndicators.stochastic) {
        const stoch = calculateStochastic(chartData, 14, 3, 3); // TV Defaults
        res.stochK = stoch.kLine;
        res.stochD = stoch.dLine;
      }

      if (advancedIndicators.stochRsi) {
        const stochRsi = calculateStochasticRSI(chartData, 14, 14, 3, 3); // TV Defaults
        res.stochRsiK = stochRsi.kLine;
        res.stochRsiD = stochRsi.dLine;
      }

      // [TENOR 2026] Ichimoku Cloud
      if (advancedIndicators.ichimoku) {
        const ichi = calculateIchimoku(chartData, 9, 26, 52, 26); // TV Defaults
        res.tenkan = ichi.tenkan;
        res.kijun = ichi.kijun;
        res.senkouA = ichi.senkouA;
        res.senkouB = ichi.senkouB;
        res.chikou = ichi.chikou;
      }

      if (advancedIndicators.atr) res.atr = calculateATR(chartData);
      if (advancedIndicators.cci) res.cci = calculateCCI(chartData);
      if (advancedIndicators.williamsR) res.williamsR = calculateWilliamsR(chartData);
      if (advancedIndicators.roc) res.roc = calculateROC(chartData);
      if (advancedIndicators.obv) res.obv = calculateOBV(chartData);

    } catch (err) {
      console.error("[SRE] Synchronous Math Pipeline Error:", err);
    }
    return res;
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
    const upColor = chartAppearance.upColor;
    const downColor = chartAppearance.downColor;
    const textColor = "#a0aec0";

    const lastCandle = chartData.length > 0 ? chartData[chartData.length - 1] : null;
    const latestPrice = lastCandle ? lastCandle.close : 0;
    const isLivePositive = lastCandle ? lastCandle.close >= lastCandle.open : true;
    const liveColor = isLivePositive ? upColor : downColor;

    // [TENOR 2026 HDR] Added BB Width and BB %B to active oscillators
    const activeOscillators = [
      advancedIndicators.rsi ? "RSI" : null,
      advancedIndicators.macd ? "MACD" : null,
      advancedIndicators.stochastic ? "Stoch" : null,
      advancedIndicators.stochRsi ? "StochRSI" : null,
      advancedIndicators.atr ? "ATR" : null,
      advancedIndicators.cci ? "CCI" : null,
      advancedIndicators.williamsR ? "Will%R" : null,
      advancedIndicators.roc ? "ROC" : null,
      advancedIndicators.obv ? "OBV" : null,
      advancedIndicators.bbWidth ? "BB Width" : null,
      advancedIndicators.bbPercentB ? "BB %B" : null,
    ].filter(Boolean) as string[];

    const isPanelVisible = (name: string) => legendSelection[name] !== false;
    const shouldRenderVolumePanel = chartAppearance.showVolume && isPanelVisible("Volume");

    let visiblePanelsCount = 0;
    if (shouldRenderVolumePanel) visiblePanelsCount++;
    activeOscillators.forEach(osc => {
      if (isPanelVisible(osc)) visiblePanelsCount++;
    });

    const panelHeightPrecent = 20;
    const spacingPercent = 6;
    const bottomMargin = 5;
    const topMargin = 8;

    const totalPanelsHeight = visiblePanelsCount * (panelHeightPrecent + spacingPercent);
    const mainChartHeight = 100 - topMargin - bottomMargin - totalPanelsHeight;

    const gridOptions: GridOption[] = [];
    const xAxisOptions: XAxisOption[] = [];
    const yAxisOptions: YAxisOption[] = [];

    const capitalizeFr = (str: string) => {
      if (!str) return "";
      return str.charAt(0).toUpperCase() + str.slice(1).replace(/\./g, '');
    };

    let lastVisibleMonth: number | null = null;
    let lastVisibleYear: number | null = null;

    const smartXAxisFormatter = (value: string, index: number) => {
      if (!value) return "";
      const date = new Date(value);
      const prevDateStr = index > 0 && index < dates.length ? dates[index - 1] : null;
      const prevDate = prevDateStr ? new Date(prevDateStr) : null;

      const currentYear = date.getFullYear();
      const currentMonth = date.getMonth();

      const isNewYear = !prevDate || currentYear !== prevDate.getFullYear();
      const isNewMonth = !prevDate || currentMonth !== prevDate.getMonth();
      const isFirstLabel = index === 0;
      const isNewDay = !prevDate || date.getDate() !== prevDate.getDate();

      const hasTime = value.includes("T") && !value.includes("T00:00:00");

      const showYear = isFirstLabel || (isNewYear && lastVisibleYear !== currentYear);
      const showMonth = isNewMonth && lastVisibleMonth !== currentMonth && !showYear;

      if (showYear) {
        lastVisibleYear = currentYear;
        lastVisibleMonth = currentMonth;
        return `{bold|${currentYear}}`;
      }
      if (showMonth) {
        lastVisibleMonth = currentMonth;
        const monthStr = capitalizeFr(date.toLocaleDateString('fr-FR', { month: 'short' }));
        return `{bold|${monthStr}}`;
      }
      if (hasTime && isNewDay) {
        return `{bold|${date.getDate()}}`;
      }
      if (hasTime) {
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      }
      return `${date.getDate()}`;
    };

    const gridLeft = MAIN_GRID_LEFT;
    const gridRightMargin = TV_Y_AXIS_WIDTH;

    // --- 0: MAIN GRID ---
    gridOptions.push({
      left: gridLeft,
      right: gridRightMargin,
      top: `${topMargin}%`,
      height: `${Math.max(30, mainChartHeight)}%`,
      containLabel: false,
    });

    xAxisOptions.push({
      id: "main-xaxis",
      type: "category",
      data: dates,
      boundaryGap: false,
      axisLine: { onZero: false, lineStyle: { color: textColor } },
      splitLine: { show: false },
      min: "dataMin",
      max: "dataMax",
      axisPointer: {
        z: 50,
        label: {
          show: true,
          backgroundColor: '#1e222d',
          color: '#ffffff',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter: function (params: any) {
            if (!params.value) return "";
            const date = new Date(params.value);
            const dayName = capitalizeFr(date.toLocaleDateString('fr-FR', { weekday: 'short' }));
            const day = date.getDate().toString().padStart(2, '0');
            const month = capitalizeFr(date.toLocaleDateString('fr-FR', { month: 'short' }));
            const year = date.getFullYear().toString();
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');

            const hasTime = params.value.includes("T") && !params.value.includes("T00:00:00");

            if (hasTime) {
              return `${dayName} ${day} ${month} ${year} ${hours}:${minutes}`;
            } else {
              return `${dayName} ${day} ${month} ${year}`;
            }
          }
        }
      },
      axisLabel: {
        color: textColor,
        formatter: smartXAxisFormatter,
        hideOverlap: true,
        rich: {
          bold: { fontWeight: 'bold', color: '#d1d4dc' }
        }
      }
    });

    yAxisOptions.push({
      id: "price-yaxis",
      position: "right",
      scale: true,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: {
        show: chartAppearance.showGrid,
        lineStyle: { color: "rgba(42, 46, 57, 0.5)", type: "dashed" }
      },
      axisLabel: {
        color: textColor,
        fontSize: 11,
        formatter: (value: number) => {
          const decimals = value < 10 ? 4 : 2;
          return value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
        }
      },
      axisPointer: {
        show: uiState.cursorMode !== "arrow",
        label: { show: false }
      },
    });

    let currentTopPercent = topMargin + Math.max(30, mainChartHeight) + spacingPercent;

    // --- 1: VOLUME GRID ---
    if (shouldRenderVolumePanel) {
      gridOptions.push({
        left: gridLeft,
        right: gridRightMargin,
        top: `${currentTopPercent}%`,
        height: `${panelHeightPrecent}%`,
        containLabel: false,
      });

      xAxisOptions.push({
        id: "volume-xaxis",
        type: "category",
        gridIndex: 1,
        data: dates,
        boundaryGap: false,
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        min: "dataMin",
        max: "dataMax",
      });

      yAxisOptions.push({
        id: "volume-yaxis",
        position: "right",
        scale: true,
        gridIndex: 1,
        axisLabel: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisPointer: {
          show: uiState.cursorMode !== "arrow",
          label: { show: false }
        },
        max: (value: { max: number }) => {
          const avg = volumes.reduce((acc: number, v: (number | string)[]) => acc + (Number(v[1]) || 0), 0) / (volumes.length || 1);
          const softMax = avg * 5;
          if (avg === 0) return value.max * 1.1 || 100;
          return Math.min(value.max, softMax) || value.max || 100;
        },
      });

      currentTopPercent += panelHeightPrecent + spacingPercent;
    }

    const candlestickData = values;

    const seriesOptions: SeriesOption[] = [
      chartConfig.chartType === "candlestick" ? {
        id: "main-series",
        name: displaySymbol,
        type: "candlestick",
        data: candlestickData,
        itemStyle: {
          color: upColor,
          color0: downColor,
          borderColor: undefined,
          borderColor0: undefined,
          opacity: isMainChartVisible ? 1 : 0,
        },
        markLine: {
          symbol: ['none', 'none'],
          animation: false,
          silent: true,
          data: [
            {
              yAxis: latestPrice,
              label: {
                show: false,
              },
              lineStyle: {
                color: liveColor,
                type: 'dashed',
                width: 1,
                opacity: 0.8
              }
            }
          ]
        }
      } : {
        id: "main-series",
        name: displaySymbol,
        type: "line",
        data: chartData.map((item: ChartDataPoint) => item.close),
        itemStyle: { color: upColor, opacity: isMainChartVisible ? 1 : 0 },
        lineStyle: { opacity: isMainChartVisible ? 1 : 0 },
        showSymbol: true,
        symbolSize: 6,
        markLine: {
          symbol: ['none', 'none'],
          animation: false,
          silent: true,
          data: [
            {
              yAxis: latestPrice,
              label: {
                show: false,
              },
              lineStyle: {
                color: liveColor,
                type: 'dashed',
                width: 1,
                opacity: 0.8
              }
            }
          ]
        }
      },
    ];

    if (shouldRenderVolumePanel) {
      seriesOptions.push({
        id: "volume-bar",
        name: "Volume",
        type: "bar",
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: volumes,
        barWidth: '65%',
        barMinHeight: 3,
        itemStyle: {
          color: (params: { value: (number | string)[] }) => Number(params.value[2]) > 0 ? upColor : downColor,
          opacity: 0.8,
        },
        showBackground: true,
        backgroundStyle: {
          color: 'rgba(255, 255, 255, 0.03)',
        }
      });
    } else if (chartAppearance.showVolume) {
      seriesOptions.push({
        id: "volume-legend-proxy",
        name: "Volume",
        type: "line",
        xAxisIndex: 0,
        yAxisIndex: 0,
        data: [],
        showSymbol: false,
        silent: true,
        legendHoverLink: false,
        lineStyle: { opacity: 0 },
        itemStyle: { color: "rgba(126, 116, 240, 0.38)" },
      });
    }

    // --- INJECT INDICATORS ---
    const commonLineProps = {
      type: "line" as const,
      smooth: true,
      showSymbol: false, // [TENOR 2026 FIX] Clean lines without dots
    };

    const activeSmas = chartConfig.indicators.activeSma || [];
    if (chartConfig.indicators.sma) {
      if (activeSmas.includes(indicatorPeriods.sma1) && indicatorsData.sma1) {
        seriesOptions.push({
          ...commonLineProps,
          id: `sma-${indicatorPeriods.sma1}`,
          name: `SMA ${indicatorPeriods.sma1}`,
          data: indicatorsData.sma1,
          lineStyle: { opacity: 0.8, width: 1.5, color: "#45c3a1" },
          itemStyle: { color: "#45c3a1" },
        });
      }
      if (activeSmas.includes(indicatorPeriods.sma2) && indicatorsData.sma2) {
        seriesOptions.push({
          ...commonLineProps,
          id: `sma-${indicatorPeriods.sma2}`,
          name: `SMA ${indicatorPeriods.sma2}`,
          data: indicatorsData.sma2,
          lineStyle: { opacity: 0.8, width: 1.5, color: "#f06467" },
          itemStyle: { color: "#f06467" },
        });
      }
      if (activeSmas.includes(indicatorPeriods.sma3) && indicatorsData.sma3) {
        seriesOptions.push({
          ...commonLineProps,
          id: `sma-${indicatorPeriods.sma3}`,
          name: `SMA ${indicatorPeriods.sma3}`,
          data: indicatorsData.sma3,
          lineStyle: { opacity: 0.8, width: 1.5, color: "#FF9F04" },
          itemStyle: { color: "#FF9F04" },
        });
      }
      if (activeSmas.includes(50) && indicatorsData.sma50) {
        seriesOptions.push({
          ...commonLineProps,
          id: "sma-50",
          name: "SMA 50",
          data: indicatorsData.sma50,
          lineStyle: { opacity: 0.8, width: 1.5, color: "#2E93fA" },
          itemStyle: { color: "#2E93fA" },
        });
      }
      if (activeSmas.includes(200) && indicatorsData.sma200) {
        seriesOptions.push({
          ...commonLineProps,
          id: "sma-200",
          name: "SMA 200",
          data: indicatorsData.sma200,
          lineStyle: { opacity: 0.8, width: 2, color: "#66DA26" },
          itemStyle: { color: "#66DA26" },
        });
      }
    }

    if (chartConfig.indicators.ema) {
      const activeEmas = chartConfig.indicators.activeEma || [];
      if (activeEmas.includes(5) && indicatorsData.ema5) {
        seriesOptions.push({
          ...commonLineProps,
          id: "ema-5",
          name: "EMA 5",
          data: indicatorsData.ema5,
          lineStyle: { opacity: 0.8, width: 1.5, color: "#9C27B0" },
          itemStyle: { color: "#9C27B0" },
        });
      }
      if (activeEmas.includes(10) && indicatorsData.ema10) {
        seriesOptions.push({
          ...commonLineProps,
          id: "ema-10",
          name: "EMA 10",
          data: indicatorsData.ema10,
          lineStyle: { opacity: 0.8, width: 1.5, color: "#E91E63" },
          itemStyle: { color: "#E91E63" },
        });
      }
    }

    // [TENOR 2026] ICHIMOKU CLOUD (MAIN PANE OVERLAY)
    if (advancedIndicators.ichimoku && indicatorsData.tenkan) {
      seriesOptions.push({
        id: "ichimoku-tenkan",
        name: "Tenkan",
        type: "line",
        data: indicatorsData.tenkan,
        showSymbol: false,
        lineStyle: { width: 1.5, color: "#2962FF" },
        itemStyle: { color: "#2962FF" },
      });
      seriesOptions.push({
        id: "ichimoku-kijun",
        name: "Kijun",
        type: "line",
        data: indicatorsData.kijun,
        showSymbol: false,
        lineStyle: { width: 1.5, color: "#B71C1C" },
        itemStyle: { color: "#B71C1C" },
      });
      seriesOptions.push({
        id: "ichimoku-chikou",
        name: "Chikou",
        type: "line",
        data: indicatorsData.chikou,
        showSymbol: false,
        lineStyle: { width: 1.5, color: "#43A047" },
        itemStyle: { color: "#43A047" },
      });
      seriesOptions.push({
        id: "ichimoku-senkouA",
        name: "Senkou A",
        type: "line",
        data: indicatorsData.senkouA,
        showSymbol: false,
        lineStyle: { width: 1, color: "#A5D6A7" },
        itemStyle: { color: "#A5D6A7" },
      });
      seriesOptions.push({
        id: "ichimoku-senkouB",
        name: "Senkou B",
        type: "line",
        data: indicatorsData.senkouB,
        showSymbol: false,
        lineStyle: { width: 1, color: "#EF9A9A" },
        itemStyle: { color: "#EF9A9A" },
      });

      // [TENOR 2026] KUMO CLOUD POLYGON FILL
      const cloudData = [];
      for (let i = 1; i < indicatorsData.senkouA.length; i++) {
        cloudData.push([
          i,
          indicatorsData.senkouA[i],
          indicatorsData.senkouB[i],
          indicatorsData.senkouA[i - 1],
          indicatorsData.senkouB[i - 1]
        ]);
      }

      seriesOptions.push({
        id: "ichimoku-cloud",
        name: "Kumo Cloud",
        type: "custom",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        renderItem: function (params: any, api: any) {
          const valA1 = api.value(1);
          const valB1 = api.value(2);
          const valA0 = api.value(3);
          const valB0 = api.value(4);

          if (valA0 === "-" || valB0 === "-" || valA1 === "-" || valB1 === "-" || isNaN(valA0) || isNaN(valB0) || isNaN(valA1) || isNaN(valB1)) return;

          const p0 = api.coord([api.value(0) - 1, valA0]);
          const p1 = api.coord([api.value(0), valA1]);
          const p2 = api.coord([api.value(0), valB1]);
          const p3 = api.coord([api.value(0) - 1, valB0]);

          const isBullish = valA1 >= valB1;

          return {
            type: 'polygon',
            shape: { points: [p0, p1, p2, p3] },
            style: api.style({ fill: isBullish ? 'rgba(67, 160, 71, 0.15)' : 'rgba(244, 67, 54, 0.15)' })
          };
        },
        data: cloudData,
        z: 0 // Behind candles
      });
    }

    // [TENOR 2026 HDR] BOLLINGER BANDS (MAIN PANE OVERLAY)
    if (advancedIndicators.bollinger && indicatorsData.bollUpper && indicatorsData.bollLower && indicatorsData.bollMiddle) {
      const bs = bollingerSettings || {
        showUpper: true, showMiddle: true, showLower: true, showFill: true,
        upperColor: "#2962FF", middleColor: "#FF6D00", lowerColor: "#2962FF",
        fillColor: "#2196F3", fillOpacity: 0.05
      };

      // 1. The Fill (Custom Series Polygon)
      if (bs.showFill) {
        const fillData = [];
        for (let i = 1; i < indicatorsData.bollUpper.length; i++) {
          fillData.push([
            i,
            indicatorsData.bollUpper[i],
            indicatorsData.bollLower[i],
            indicatorsData.bollUpper[i - 1],
            indicatorsData.bollLower[i - 1]
          ]);
        }
        seriesOptions.push({
          id: "boll-fill",
          name: "BB Background",
          type: "custom",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          renderItem: function (params: any, api: any) {
            const valU1 = api.value(1);
            const valL1 = api.value(2);
            const valU0 = api.value(3);
            const valL0 = api.value(4);

            if (valU0 === "-" || valL0 === "-" || valU1 === "-" || valL1 === "-" || isNaN(valU0) || isNaN(valL0) || isNaN(valU1) || isNaN(valL1)) return;

            const p0 = api.coord([api.value(0) - 1, valU0]);
            const p1 = api.coord([api.value(0), valU1]);
            const p2 = api.coord([api.value(0), valL1]);
            const p3 = api.coord([api.value(0) - 1, valL0]);

            return {
              type: 'polygon',
              shape: { points: [p0, p1, p2, p3] },
              style: api.style({ fill: bs.fillColor })
            };
          },
          data: fillData,
          itemStyle: { opacity: bs.fillOpacity ?? 0.05 },
          z: 0 // Behind candles
        });
      }

      // 2. The Lines
      if (bs.showUpper) {
        seriesOptions.push({
          ...commonLineProps,
          id: "boll-upper",
          name: "BB Upper",
          data: indicatorsData.bollUpper,
          lineStyle: { opacity: 1, width: 1.5, color: bs.upperColor },
          itemStyle: { color: bs.upperColor },
        });
      }
      if (bs.showMiddle) {
        seriesOptions.push({
          ...commonLineProps,
          id: "boll-mid",
          name: "BB Middle",
          data: indicatorsData.bollMiddle,
          lineStyle: { opacity: 1, width: 1.5, color: bs.middleColor },
          itemStyle: { color: bs.middleColor },
        });
      }
      if (bs.showLower) {
        seriesOptions.push({
          ...commonLineProps,
          id: "boll-lower",
          name: "BB Lower",
          data: indicatorsData.bollLower,
          lineStyle: { opacity: 1, width: 1.5, color: bs.lowerColor },
          itemStyle: { color: bs.lowerColor },
        });
      }
    }

    const comparePalette = ["#2E93fA", "#66DA26", "#E91E63", "#FF9F04", "#775DD0"];
    comparisonSeries.forEach((entry, idx) => {
      const closes = entry.data.map((p) => p.close).filter((v) => Number.isFinite(v));
      const base = closes.length > 0 ? closes[0] : NaN;
      if (!Number.isFinite(base) || base === 0) return;

      const normalized = entry.data.map((p) => {
        if (!Number.isFinite(p.close)) return null;
        return ((p.close - base) / base) * 100;
      });

      seriesOptions.push({
        id: `compare-${entry.symbol}`,
        name: `${entry.symbol} (%)`,
        type: "line",
        data: normalized,
        showSymbol: false,
        smooth: true,
        lineStyle: { width: 1.8, color: comparePalette[idx % comparePalette.length], opacity: 0.95 },
        itemStyle: { color: comparePalette[idx % comparePalette.length] },
      });
    });

    // --- 2+: OSCILLATOR GRIDS ---
    activeOscillators.forEach((osc, idx) => {
      const gridIndex = gridOptions.length;
      const oscVisible = isPanelVisible(osc);

      gridOptions.push({
        left: gridLeft,
        right: gridRightMargin,
        top: oscVisible ? `${currentTopPercent}%` : '100%',
        height: oscVisible ? `${panelHeightPrecent}%` : '0%',
        containLabel: false,
      });

      xAxisOptions.push({
        id: `osc-xaxis-${idx}`,
        type: "category",
        gridIndex: gridIndex,
        data: dates,
        boundaryGap: false,
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        min: "dataMin",
        max: "dataMax",
      });

      // [TENOR 2026 HDR] TV-Parity: Fixed Y-Axis bounds for bounded oscillators
      const isBounded0to100 = osc === "RSI" || osc === "Stoch" || osc === "StochRSI";
      const isBoundedWillR = osc === "Will%R";

      yAxisOptions.push({
        id: `osc-yaxis-${idx}`,
        position: "right",
        gridIndex: gridIndex,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: {
          show: chartAppearance.showGrid,
          lineStyle: { color: "rgba(42, 46, 57, 0.5)", type: "dashed" }
        },
        axisLabel: { color: textColor, fontSize: 10 },
        scale: !(isBounded0to100 || isBoundedWillR),
        min: isBounded0to100 ? 0 : (isBoundedWillR ? -100 : undefined),
        max: isBounded0to100 ? 100 : (isBoundedWillR ? 0 : undefined),
        axisPointer: {
          show: uiState.cursorMode !== "arrow",
          label: { show: true }
        },
      });

      if (osc === "RSI" && indicatorsData.rsi) {
        seriesOptions.push({
          id: "rsi-series",
          name: "RSI",
          type: "line",
          xAxisIndex: gridIndex,
          yAxisIndex: gridIndex,
          data: indicatorsData.rsi,
          showSymbol: false,
          lineStyle: { width: 1.5, color: "#7E57C2" }, // TV Purple
          markArea: {
            silent: true,
            itemStyle: { color: "rgba(126, 87, 194, 0.08)" },
            data: [[{ yAxis: 30 }, { yAxis: 70 }]]
          },
          markLine: {
            silent: true,
            symbol: ['none', 'none'],
            label: { show: false },
            lineStyle: { color: "rgba(120, 123, 134, 0.5)", type: "dashed", width: 1 },
            data: [
              { yAxis: 70 },
              { yAxis: 30 },
              { yAxis: 50, lineStyle: { type: "dotted" } }
            ]
          }
        });
      } else if (osc === "MACD" && indicatorsData.macdLine) {
        const histData = (indicatorsData.macdHist as number[]).map((val, i) => [i, val]);
        seriesOptions.push(
          {
            id: "macd-hist",
            name: "MACD",
            type: "bar",
            xAxisIndex: gridIndex,
            yAxisIndex: gridIndex,
            data: histData,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            itemStyle: { color: (p: any) => (p.value[1] > 0 ? upColor : downColor) },
          },
          {
            id: "macd-line",
            name: "MACD Line",
            type: "line",
            xAxisIndex: gridIndex,
            yAxisIndex: gridIndex,
            data: indicatorsData.macdLine,
            showSymbol: false,
            lineStyle: { width: 1, color: "#fff" },
          },
          {
            id: "macd-signal",
            name: "Signal",
            type: "line",
            xAxisIndex: gridIndex,
            yAxisIndex: gridIndex,
            data: indicatorsData.macdSignal,
            showSymbol: false,
            lineStyle: { width: 1, color: "#FF9F04" },
          }
        );
      } else if (osc === "Stoch" && indicatorsData.stochK) {
        seriesOptions.push(
          {
            id: "stoch-k",
            name: "%K",
            type: "line",
            xAxisIndex: gridIndex,
            yAxisIndex: gridIndex,
            data: indicatorsData.stochK,
            showSymbol: false,
            lineStyle: { width: 1.5, color: "#2962FF" }, // TV Blue
            markArea: {
              silent: true,
              itemStyle: { color: "rgba(33, 150, 243, 0.08)" },
              data: [[{ yAxis: 20 }, { yAxis: 80 }]]
            },
            markLine: {
              silent: true,
              symbol: ['none', 'none'],
              label: { show: false },
              lineStyle: { color: "rgba(120, 123, 134, 0.5)", type: "dashed", width: 1 },
              data: [
                { yAxis: 80 },
                { yAxis: 20 },
                { yAxis: 50, lineStyle: { type: "dotted" } }
              ]
            }
          },
          {
            id: "stoch-d",
            name: "%D",
            type: "line",
            xAxisIndex: gridIndex,
            yAxisIndex: gridIndex,
            data: indicatorsData.stochD,
            showSymbol: false,
            lineStyle: { width: 1.5, color: "#FF6D00" }, // TV Orange
          }
        );
      } else if (osc === "StochRSI" && indicatorsData.stochRsiK) {
        seriesOptions.push(
          {
            id: "stochrsi-k",
            name: "StochRSI %K",
            type: "line",
            xAxisIndex: gridIndex,
            yAxisIndex: gridIndex,
            data: indicatorsData.stochRsiK,
            showSymbol: false,
            lineStyle: { width: 1.5, color: "#2962FF" },
            markArea: {
              silent: true,
              itemStyle: { color: "rgba(33, 150, 243, 0.08)" },
              data: [[{ yAxis: 20 }, { yAxis: 80 }]]
            },
            markLine: {
              silent: true,
              symbol: ['none', 'none'],
              label: { show: false },
              lineStyle: { color: "rgba(120, 123, 134, 0.5)", type: "dashed", width: 1 },
              data: [
                { yAxis: 80 },
                { yAxis: 20 },
                { yAxis: 50, lineStyle: { type: "dotted" } }
              ]
            }
          },
          {
            id: "stochrsi-d",
            name: "StochRSI %D",
            type: "line",
            xAxisIndex: gridIndex,
            yAxisIndex: gridIndex,
            data: indicatorsData.stochRsiD,
            showSymbol: false,
            lineStyle: { width: 1.5, color: "#FF6D00" },
          }
        );
      } else if (osc === "ATR" && indicatorsData.atr) {
        seriesOptions.push({
          id: "atr-series",
          name: "ATR",
          type: "line",
          xAxisIndex: gridIndex,
          yAxisIndex: gridIndex,
          data: indicatorsData.atr,
          showSymbol: false,
          lineStyle: { width: 1.5, color: "#d50000" },
        });
      } else if (osc === "CCI" && indicatorsData.cci) {
        seriesOptions.push({
          id: "cci-series",
          name: "CCI",
          type: "line",
          xAxisIndex: gridIndex,
          yAxisIndex: gridIndex,
          data: indicatorsData.cci,
          showSymbol: false,
          lineStyle: { width: 1.5, color: "#00E676" },
        });
      } else if (osc === "Will%R" && indicatorsData.williamsR) {
        seriesOptions.push({
          id: "willr-series",
          name: "Williams %R",
          type: "line",
          xAxisIndex: gridIndex,
          yAxisIndex: gridIndex,
          data: indicatorsData.williamsR,
          showSymbol: false,
          lineStyle: { width: 1.5, color: "#FFEB3B" },
          markArea: {
            silent: true,
            itemStyle: { color: "rgba(255, 235, 59, 0.08)" },
            data: [[{ yAxis: -80 }, { yAxis: -20 }]]
          },
          markLine: {
            silent: true,
            symbol: ['none', 'none'],
            label: { show: false },
            lineStyle: { color: "rgba(120, 123, 134, 0.5)", type: "dashed", width: 1 },
            data: [
              { yAxis: -20 },
              { yAxis: -80 },
              { yAxis: -50, lineStyle: { type: "dotted" } }
            ]
          },
        });
      } else if (osc === "ROC" && indicatorsData.roc) {
        seriesOptions.push({
          id: "roc-series",
          name: "ROC",
          type: "line",
          xAxisIndex: gridIndex,
          yAxisIndex: gridIndex,
          data: indicatorsData.roc,
          showSymbol: false,
          lineStyle: { width: 1.5, color: "#2196F3" },
          markLine: {
            silent: true,
            symbol: ['none', 'none'],
            label: { show: false },
            lineStyle: { color: "rgba(120, 123, 134, 0.5)", type: "dashed", width: 1 },
            data: [{ yAxis: 0 }],
          },
        });
      } else if (osc === "OBV" && indicatorsData.obv) {
        seriesOptions.push({
          id: "obv-series",
          name: "OBV",
          type: "line",
          xAxisIndex: gridIndex,
          yAxisIndex: gridIndex,
          data: indicatorsData.obv,
          showSymbol: false,
          lineStyle: { width: 1.5, color: "#FF5722" },
        });
      } else if (osc === "BB Width" && indicatorsData.bbWidth) {
        seriesOptions.push({
          id: "bb-width-series",
          name: "BB Width",
          type: "line",
          xAxisIndex: gridIndex,
          yAxisIndex: gridIndex,
          data: indicatorsData.bbWidth,
          showSymbol: false,
          lineStyle: { width: 1.5, color: "#FF6D00" }, // TV Orange
        });
      } else if (osc === "BB %B" && indicatorsData.bbPercentB) {
        seriesOptions.push({
          id: "bb-percentb-series",
          name: "BB %B",
          type: "line",
          xAxisIndex: gridIndex,
          yAxisIndex: gridIndex,
          data: indicatorsData.bbPercentB,
          showSymbol: false,
          lineStyle: { width: 1.5, color: "#2962FF" }, // TV Blue
          markLine: {
            silent: true,
            symbol: ['none', 'none'],
            label: { show: false },
            lineStyle: { color: "rgba(120, 123, 134, 0.5)", type: "dashed", width: 1 },
            data: [
              { yAxis: 1 },
              { yAxis: 0.8, lineStyle: { type: "dotted" } },
              { yAxis: 0.5, lineStyle: { type: "dotted" } },
              { yAxis: 0.2, lineStyle: { type: "dotted" } },
              { yAxis: 0 }
            ]
          }
        });
      }

      if (oscVisible) currentTopPercent += panelHeightPrecent + spacingPercent;
    });

    const legendData = [
      chartAppearance.showVolume ? "Volume" : null,
      ...seriesOptions
        .filter((opt) => opt.id !== "main-series" && opt.name !== "Volume" && opt.id !== "boll-fill" && opt.id !== "ichimoku-cloud")
        .map((opt) => opt.name),
    ].filter((name): name is string => !!name);

    const option: echarts.EChartsCoreOption = {
      backgroundColor: "transparent",
      animation: false,
      title: {
        text: displaySymbol,
        left: 0,
        textStyle: { color: textColor, fontSize: 14, fontWeight: "normal" },
      },
      legend: {
        top: 0,
        left: 'center',
        selectedMode: 'multiple',
        selected: legendSelectionRef.current,
        z: 1000,
        padding: [5, 10],
        itemGap: 15,
        data: legendData,
        textStyle: { color: textColor },
        icon: "roundRect",
        itemWidth: 15,
        itemHeight: 10,
      },
      tooltip: { show: false },
      axisPointer: { show: false },
      grid: gridOptions,
      xAxis: xAxisOptions,
      yAxis: yAxisOptions,
      dataZoom: [
        {
          id: 'time-zoom',
          type: "inside",
          xAxisIndex: xAxisOptions.map((_, i) => i),
          zoomOnMouseWheel: false,
          moveOnMouseMove: false,
          filterMode: 'filter',
        }
      ],
      series: seriesOptions,
    };

    // [TENOR 2026 SRE] RAF Cleanup Enforcement
    let rafId: number;
    rafId = requestAnimationFrame(() => {
      if (isMountedRef.current && chart && !chart.isDisposed()) {
        chart.setOption(option, true);
        applyViewport();
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleLegendChange = (params: any) => {
      if (!isMountedRef.current) return;
      const nextSelection = { ...(params.selected || {}) };
      legendSelectionRef.current = nextSelection;
      setLegendSelection(nextSelection);
    };

    chart.on('legendselectchanged', handleLegendChange);

    return () => {
      cancelAnimationFrame(rafId);
      cancelAnimationFrame(resizeRafId);
      if (chart && !chart.isDisposed()) {
        chart.off('legendselectchanged', handleLegendChange);
      }
      resizeObserver.disconnect();
    };
  }, [
    chartData,
    chartConfig,
    advancedIndicators,
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
    extendedChartData
  ]);

  return { indicatorsData };
};

// --- EOF ---