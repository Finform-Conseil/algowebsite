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
} from "../config/TechnicalAnalysisTypes";
import {
  ChartDataPoint,
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollinger,
  calculateStochastic,
  calculateATR,
  calculateCCI,
  calculateWilliamsR,
  calculateROC,
  calculateOBV
} from "../lib/Indicators/TechnicalIndicators";
import { setChartConfig } from "../store/technicalAnalysisSlice";
import { createIndicatorsWorker } from "../lib/workers/createIndicatorsWorker";
import { useChartViewport, TV_Y_AXIS_WIDTH, TV_X_AXIS_HEIGHT, MAIN_GRID_LEFT, clamp } from "./useChartViewport";

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
  /** [TENOR 2026] Indique si la dernière bougie a été enrichie par une injection live scraper (SIS). */
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
// HOOK 1: INDICATORS ENGINE (Web Worker & Fallback)
// ----------------------------------------------------------------------------
interface UseChartIndicatorsProps {
  chartData: ChartDataPoint[];
  chartConfig: ChartState;
  advancedIndicators: AdvancedIndicatorsState;
  indicatorPeriods: IndicatorPeriods;
}

interface PendingJob {
  buffer: ArrayBuffer;
  length: number;
  config: any;
}

const useChartIndicators = ({ chartData, chartConfig, advancedIndicators, indicatorPeriods }: UseChartIndicatorsProps) => {
  const [asyncIndicators, setAsyncIndicators] = useState<Record<string, (number | string)[]>>({});
  const [workerFailed, setWorkerFailed] = useState(false);

  const workerRef = useRef<Worker | null>(null);
  const isWorkerBusyRef = useRef(false);
  const currentMessageIdRef = useRef(0);
  const workerMessageTimeoutRef = useRef<number | null>(null);
  const pendingJobRef = useRef<PendingJob | null>(null);

  // [TENOR 2026 SRE] Strict Lifecycle Guard
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const clearWorkerMessageTimeout = useCallback(() => {
    if (workerMessageTimeoutRef.current !== null) {
      window.clearTimeout(workerMessageTimeoutRef.current);
      workerMessageTimeoutRef.current = null;
    }
  }, []);

  const setupWorker = useCallback(() => {
    try {
      // [SCAR-WORKER-ROOT FIX] Blob Worker — bypasses browser HTTP cache entirely.
      const worker = createIndicatorsWorker();

      worker.onmessage = (e: MessageEvent) => {
        if (!isMountedRef.current) return; // Guard against unmounted state

        clearWorkerMessageTimeout();

        if (e.data.messageId === currentMessageIdRef.current) {
          if (e.data.success) {
            const processed: Record<string, number[]> = {};
            for (const key in e.data.results) {
              processed[key] = Array.from(e.data.results[key]);
            }
            setAsyncIndicators(processed);
          } else {
            console.error("[EChartsRenderer] Worker Error:", e.data.error);
            setWorkerFailed(true);
          }
        }

        // Process next job in queue (LIFO destructive queue for market data)
        if (pendingJobRef.current) {
          const job = pendingJobRef.current;
          pendingJobRef.current = null;

          currentMessageIdRef.current += 1;
          const nextMessageId = currentMessageIdRef.current;

          workerMessageTimeoutRef.current = window.setTimeout(() => {
            if (!isMountedRef.current) return;
            console.warn("[EChartsRenderer] Worker timeout. Forcing synchronous fallback.");
            isWorkerBusyRef.current = false;
            workerRef.current?.terminate();
            workerRef.current = null;
            setWorkerFailed(true);
          }, 5000);

          worker.postMessage(
            { messageId: nextMessageId, buffer: job.buffer, length: job.length, config: job.config },
            [job.buffer]
          );
        } else {
          isWorkerBusyRef.current = false;
        }
      };

      worker.onerror = (err) => {
        if (!isMountedRef.current) return;
        console.warn("[EChartsRenderer] Worker failed to load, falling back to sync math.", err);
        isWorkerBusyRef.current = false;
        clearWorkerMessageTimeout();
        setTimeout(() => { if (isMountedRef.current) setWorkerFailed(true); }, 0);
      };

      worker.onmessageerror = (err) => {
        if (!isMountedRef.current) return;
        console.warn("[EChartsRenderer] Worker message channel failed, falling back to sync math.", err);
        isWorkerBusyRef.current = false;
        clearWorkerMessageTimeout();
        setTimeout(() => { if (isMountedRef.current) setWorkerFailed(true); }, 0);
      };

      return worker;
    } catch (err) {
      if (!isMountedRef.current) return null;
      console.warn("[EChartsRenderer] Worker initialization failed, falling back to sync math.", err);
      clearWorkerMessageTimeout();
      setTimeout(() => { if (isMountedRef.current) setWorkerFailed(true); }, 0);
      return null;
    }
  }, [clearWorkerMessageTimeout]);

  // [TENOR 2026 FIX] SCAR-162: Setup worker ONLY on mount to prevent cascading renders
  useEffect(() => {
    const worker = setupWorker();
    if (worker) {
      workerRef.current = worker;
    }
    return () => {
      clearWorkerMessageTimeout();
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, [setupWorker, clearWorkerMessageTimeout]);

  useEffect(() => {
    if (workerFailed || !workerRef.current || chartData.length === 0) return;

    const FIELDS_PER_CANDLE = 6;
    const length = chartData.length;
    const buffer = new Float64Array(length * FIELDS_PER_CANDLE);

    for (let i = 0; i < length; i++) {
      const c = chartData[i];
      const offset = i * FIELDS_PER_CANDLE;
      buffer[offset + 0] = 0;
      buffer[offset + 1] = c.open;
      buffer[offset + 2] = c.high;
      buffer[offset + 3] = c.low;
      buffer[offset + 4] = c.close;
      buffer[offset + 5] = c.volume;
    }

    const config = {
      indicators: chartConfig.indicators,
      advancedIndicators,
      indicatorPeriods,
    };

    // [TENOR 2026 FIX] Queue management instead of worker recreation
    if (isWorkerBusyRef.current) {
      pendingJobRef.current = { buffer: buffer.buffer, length, config };
      return;
    }

    isWorkerBusyRef.current = true;
    currentMessageIdRef.current += 1;
    const messageId = currentMessageIdRef.current;

    clearWorkerMessageTimeout();
    workerMessageTimeoutRef.current = window.setTimeout(() => {
      if (!isMountedRef.current) return;
      console.warn("[EChartsRenderer] Worker timeout (15s). datasetSize=" + chartData.length + ". Forcing synchronous fallback.");
      isWorkerBusyRef.current = false;
      workerRef.current?.terminate();
      workerRef.current = null;
      setWorkerFailed(true);
    }, 15000);

    workerRef.current.postMessage(
      { messageId, buffer: buffer.buffer, length, config },
      [buffer.buffer]
    );
  }, [advancedIndicators, chartConfig.indicators, chartData, clearWorkerMessageTimeout, indicatorPeriods, workerFailed]);

  const syncIndicators = useMemo(() => {
    if (!workerFailed) return {};

    // [TENOR 2026 SRE FIX] SCAR-WORKER-FALLBACK: High-Performance Graceful Degradation
    // 5000 points is a safe upper bound for 2026 mobile CPUs to handle synchronously.
    if (chartData.length > 5000) {
      console.error("[SRE] Web Worker failed and dataset is exceptionally large (>" + chartData.length + ") for synchronous fallback. Indicators disabled to prevent UI freeze.");
      return {};
    }

    const res: Record<string, (number | string)[]> = {};

    if (chartConfig.indicators.sma) {
      if (chartConfig.indicators.activeSma.includes(indicatorPeriods.sma1)) res.sma1 = calculateSMA(chartData, indicatorPeriods.sma1);
      if (chartConfig.indicators.activeSma.includes(indicatorPeriods.sma2)) res.sma2 = calculateSMA(chartData, indicatorPeriods.sma2);
      if (chartConfig.indicators.activeSma.includes(indicatorPeriods.sma3)) res.sma3 = calculateSMA(chartData, indicatorPeriods.sma3);
      if (chartConfig.indicators.activeSma.includes(50)) res.sma50 = calculateSMA(chartData, 50);
      if (chartConfig.indicators.activeSma.includes(200)) res.sma200 = calculateSMA(chartData, 200);
    }

    if (chartConfig.indicators.ema) {
      if (chartConfig.indicators.activeEma.includes(5)) res.ema5 = calculateEMA(chartData, 5);
      if (chartConfig.indicators.activeEma.includes(10)) res.ema10 = calculateEMA(chartData, 10);
    }

    if (advancedIndicators.rsi) res.rsi = calculateRSI(chartData, indicatorPeriods.rsiPeriod);
    if (advancedIndicators.macd) {
      const macd = calculateMACD(chartData);
      res.macdLine = macd.macdLine;
      res.macdSignal = macd.signalLine;
      res.macdHist = macd.histogram;
    }
    if (advancedIndicators.bollinger) {
      const boll = calculateBollinger(chartData, 20, 2);
      res.bollUpper = boll.upper;
      res.bollMiddle = boll.middle;
      res.bollLower = boll.lower;
    }
    if (advancedIndicators.stochastic) {
      const stoch = calculateStochastic(chartData);
      res.stochK = stoch.kLine;
      res.stochD = stoch.dLine;
    }
    if (advancedIndicators.atr) res.atr = calculateATR(chartData);
    if (advancedIndicators.cci) res.cci = calculateCCI(chartData);
    if (advancedIndicators.williamsR) res.williamsR = calculateWilliamsR(chartData);
    if (advancedIndicators.roc) res.roc = calculateROC(chartData);
    if (advancedIndicators.obv) res.obv = calculateOBV(chartData);

    return res;
  }, [chartData, chartConfig.indicators, advancedIndicators, indicatorPeriods, workerFailed]);

  return { indicatorsData: workerFailed ? syncIndicators : asyncIndicators };
};

// ----------------------------------------------------------------------------
// HOOK 2: CHART BADGES (Direct DOM Manipulation via Getter Pattern)
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
    if (chart && !chart.isDisposed()) {
      try {
        const gridComponent = (chart as any).getModel?.().getComponent?.("grid", 0);
        const rect = gridComponent?.coordinateSystem?.getRect?.() as any;
        if (rect && Number.isFinite(rect.y) && Number.isFinite(rect.height)) {
          return {
            top: rect.y,
            bottom: rect.y + rect.height,
          };
        }
      } catch {
        // Fallback
      }
    }
    return {
      top: 0,
      bottom: Math.max(0, containerHeight - TV_X_AXIS_HEIGHT),
    };
  }, [chartInstanceRef]);

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

      lastLine.style.top = `${Math.round(clampedY)}px`;
      lastLine.style.opacity = "1";
      lastLine.style.visibility = "visible";
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

  // 1. Indicators Engine
  const { indicatorsData } = useChartIndicators({
    chartData,
    chartConfig,
    advancedIndicators,
    indicatorPeriods
  });

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
  const { applyViewport, resetManualYViewport } = useChartViewport({
    chartInstanceRef,
    getChartContainer,
    chartData,
    lastZoomRangeRef,
    updateCursorPriceAxisBadge,
    updateLastPriceAxisBadge
  });

  // --- ECHARTS RENDER LOGIC (React Cycle) ---
  useEffect(() => {
    if (!stockChartRef.current || chartData.length === 0) return;

    // [TENOR 2026 SRE FIX] Resize Resilience — Ensuring ResizeObserver is always attached.
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

    const dates = chartData.map((item: ChartDataPoint) => item.time);
    const values = chartData.map((item: ChartDataPoint) => [item.open, item.close, item.low, item.high]);
    const volumes = chartData.map((item: ChartDataPoint, index: number) => [
      index,
      item.volume,
      item.close > item.open ? 1 : -1,
    ]);

    const lastCandle = chartData.length > 0 ? chartData[chartData.length - 1] : null;
    const latestPrice = lastCandle ? lastCandle.close : 0;
    const isLivePositive = lastCandle ? lastCandle.close >= lastCandle.open : true;
    const liveColor = isLivePositive ? upColor : downColor;

    const activeOscillators = [
      advancedIndicators.rsi ? "RSI" : null,
      advancedIndicators.macd ? "MACD" : null,
      advancedIndicators.stochastic ? "Stoch" : null,
      advancedIndicators.atr ? "ATR" : null,
      advancedIndicators.cci ? "CCI" : null,
      advancedIndicators.williamsR ? "Will%R" : null,
      advancedIndicators.roc ? "ROC" : null,
      advancedIndicators.obv ? "OBV" : null,
    ].filter(Boolean) as string[];

    const isPanelVisible = (name: string) => legendSelection[name] !== false;

    let visiblePanelsCount = 0;
    if (chartAppearance.showVolume && isPanelVisible('Volume')) visiblePanelsCount++;
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
    if (chartAppearance.showVolume) {
      const volVisible = isPanelVisible('Volume');
      gridOptions.push({
        left: gridLeft,
        right: gridRightMargin,
        top: volVisible ? `${currentTopPercent}%` : '100%',
        height: volVisible ? `${panelHeightPrecent}%` : '0%',
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
          const avg = volumes.reduce((acc: number, v: number[]) => acc + (v[1] || 0), 0) / (volumes.length || 1);
          const softMax = avg * 5;
          if (avg === 0) return value.max * 1.1 || 100;
          return Math.min(value.max, softMax) || value.max || 100;
        },
      });

      if (volVisible) currentTopPercent += panelHeightPrecent + spacingPercent;
    }

    const candlestickData = values;

    const seriesOptions: SeriesOption[] = [
      chartConfig.chartType === "candlestick"
        ? {
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
        }
        : {
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

    if (chartAppearance.showVolume) {
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
          color: (params: { value: number[] }) => params.value[2] > 0 ? upColor : downColor,
          opacity: 0.8,
        },
        showBackground: true,
        backgroundStyle: {
          color: 'rgba(255, 255, 255, 0.03)',
        }
      });
    }

    // --- INJECT INDICATORS ---
    const commonLineProps = {
      type: "line" as const,
      smooth: true,
      showSymbol: true,
      symbolSize: 4,
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

    if (advancedIndicators.bollinger && indicatorsData.bollUpper) {
      seriesOptions.push(
        {
          ...commonLineProps,
          id: "boll-upper",
          name: "Boll Upper",
          data: indicatorsData.bollUpper,
          lineStyle: { opacity: 0.5, width: 1, type: "dashed", color: "#ccc" },
        },
        {
          ...commonLineProps,
          id: "boll-lower",
          name: "Boll Lower",
          data: indicatorsData.bollLower,
          lineStyle: { opacity: 0.5, width: 1, type: "dashed", color: "#ccc" },
        },
        {
          ...commonLineProps,
          id: "boll-mid",
          name: "Boll Mid",
          data: indicatorsData.bollMiddle,
          lineStyle: { opacity: 0.8, width: 1, color: "#ffa726" },
        }
      );
    }

    // --- 2+: OSCILLATOR GRIDS ---
    activeOscillators.forEach((osc, idx) => {
      const gridIndex = (chartAppearance.showVolume ? 2 : 1) + idx;
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
        scale: true,
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
          lineStyle: { width: 1.5, color: "#b388ff" },
          markLine: {
            data: [{ yAxis: 30 }, { yAxis: 70 }],
            label: { show: false },
            lineStyle: { type: "dotted", color: "#666" },
          },
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
            name: "Stoch %K",
            type: "line",
            xAxisIndex: gridIndex,
            yAxisIndex: gridIndex,
            data: indicatorsData.stochK,
            showSymbol: false,
            lineStyle: { width: 1.5, color: "#2E93fA" },
          },
          {
            id: "stoch-d",
            name: "Stoch %D",
            type: "line",
            xAxisIndex: gridIndex,
            yAxisIndex: gridIndex,
            data: indicatorsData.stochD,
            showSymbol: false,
            lineStyle: { width: 1.5, color: "#FF9F04" },
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
          markLine: {
            data: [{ yAxis: -20 }, { yAxis: -80 }],
            label: { show: false },
            lineStyle: { type: "dotted", color: "#666" },
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
            data: [{ yAxis: 0 }],
            label: { show: false },
            lineStyle: { type: "dashed", color: "#666" },
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
      }

      if (oscVisible) currentTopPercent += panelHeightPrecent + spacingPercent;
    });

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
        data: seriesOptions
          .filter((opt) => opt.id !== "main-series" && opt.id !== "volume-bar")
          .map((opt) => opt.name)
          .filter((name): name is string => !!name),
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

    const handleLegendChange = (params: any) => {
      if (!isMountedRef.current) return;
      legendSelectionRef.current = params.selected;
      setLegendSelection(params.selected);
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
  ]);

  return { indicatorsData };
};
// --- EOF ---
