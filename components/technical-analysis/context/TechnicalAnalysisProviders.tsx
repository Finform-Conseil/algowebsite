/**
 * [TENOR 2026 SRE] Technical Analysis Providers Tree
 * [ADR-008] Provider Hell Extraction: Encapsulates all global states and contexts
 * for the Technical Analysis module. Ensures strict initialization order and
 * preserves the O(1) Incremental Memoization shield for live ticks.
 */

"use client";

import React, { createContext, useMemo, useRef, useContext } from "react";
import { useSelector, shallowEqual } from "react-redux";
import * as echarts from "echarts/core";

// --- Types & Constants ---
import type { RootState } from "@/core/infrastructure/store";
import { BRVM_SECURITIES, type BRVMSecurity } from "@/core/data/brvm-securities";
import { ChartDataPoint } from "../lib/Indicators/TechnicalIndicators";
import type { CurrencyCode } from "../components/common/CurrencySelector";
import { selectChartConfig, selectDataMode } from "../store/technicalAnalysisSlice";

// --- Hooks ---
import { useBrokerState } from "../hooks/useBrokerState";
import { useCurrencyState } from "../hooks/useCurrencyState";
import { useMarketData } from "../hooks/MarketData/useMarketData";
import { useDrawingManager } from "../hooks/useDrawingManager";
import { useCurrencyConverter } from "../hooks/MarketData/useCurrencyConverter";
import { TickerSelectorModal, TickerSelectorProvider, useTickerSelector } from "@/components/design-system/commons/TickerSelectorModal";

// ============================================================================
// CONSTANTS
// ============================================================================

const FALLBACK_RATES: Record<string, number> = {
  XOF: 655.957,
  XAF: 655.957,
  USD: 1.08,
  EUR: 1,
  GBP: 0.85,
  NGN: 1600.5,
  KES: 130.5,
  ZAR: 19.5,
  MAD: 10.8,
  EGP: 47.2,
  GHS: 13.5,
};

// ============================================================================
// CONTEXT DEFINITIONS & EXPORTS
// ============================================================================

export const BrokerContext = createContext<ReturnType<typeof useBrokerState> | null>(null);
export const CurrencyContext = createContext<ReturnType<typeof useCurrencyState> | null>(null);

export type ChartRefs = {
  mainContainerRef: React.RefObject<HTMLDivElement>;
  cursorCanvasRef: React.RefObject<HTMLCanvasElement>;
  drawingCanvasRef: React.RefObject<HTMLCanvasElement>;
  stockChartRef: React.RefObject<HTMLDivElement>;
  layersStackRef: React.RefObject<HTMLDivElement>;
  chartViewWrapperRef: React.RefObject<HTMLDivElement>;
  fullscreenChartContainerRef: React.RefObject<HTMLDivElement>;
  chartInstanceRef: React.MutableRefObject<echarts.ECharts | null>;
  lastZoomRangeRef: React.MutableRefObject<{ start: number; end: number }>;
  sidebarToggleRef: React.RefObject<HTMLButtonElement>;
  sidebarRef: React.RefObject<HTMLDivElement>;
  chartFooterRef: React.RefObject<HTMLDivElement>;
  verticalToolbarRef: React.RefObject<HTMLDivElement>;
  sidebarBackdropRef: React.RefObject<HTMLDivElement>;
  benefitsChartRef: React.RefObject<HTMLDivElement>;
  dividendsChartRef: React.RefObject<HTMLDivElement>;
  drawingToolbarRef: React.RefObject<HTMLDivElement>;
  drawingTooltipRef: React.RefObject<HTMLDivElement>;
  cursorPriceBadgeRef: React.RefObject<HTMLDivElement>;
  cursorPriceTextRef: React.RefObject<HTMLSpanElement>;
  cursorPriceActionRef: React.RefObject<HTMLButtonElement>;
  lastPriceBadgeRef: React.RefObject<HTMLDivElement>;
  lastPriceLineRef: React.RefObject<HTMLDivElement>;
};

export const ChartRefsContext = createContext<ChartRefs | null>(null);

export type MarketDataState = ReturnType<typeof useMarketData>;
export const MarketDataContext = createContext<MarketDataState | null>(null);

export type ChartStateData = {
  security: BRVMSecurity;
  effectiveRate: number;
  displaySymbolName: string;
  userInitials: string;
  globalIsLoading: boolean;
  displayChartData: ChartDataPoint[];
  isMainChartVisible: boolean;
  setIsMainChartVisible: React.Dispatch<React.SetStateAction<boolean>>;
};
export const ChartStateContext = createContext<ChartStateData | null>(null);

export type DrawingState = ReturnType<typeof useDrawingManager>;
export const DrawingContext = createContext<DrawingState | null>(null);

// ============================================================================
// PROVIDER IMPLEMENTATIONS
// ============================================================================

const BrokerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const state = useBrokerState();
  return <BrokerContext.Provider value={state}>{children}</BrokerContext.Provider>;
};

const CurrencyProvider: React.FC<{ children: React.ReactNode; initialCurrency: CurrencyCode }> = ({
  children,
  initialCurrency,
}) => {
  const state = useCurrencyState(initialCurrency);
  return <CurrencyContext.Provider value={state}>{children}</CurrencyContext.Provider>;
};

const ChartRefsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const refs: ChartRefs = {
    mainContainerRef: useRef<HTMLDivElement>(null),
    cursorCanvasRef: useRef<HTMLCanvasElement>(null),
    drawingCanvasRef: useRef<HTMLCanvasElement>(null),
    stockChartRef: useRef<HTMLDivElement>(null),
    layersStackRef: useRef<HTMLDivElement>(null),
    chartViewWrapperRef: useRef<HTMLDivElement>(null),
    fullscreenChartContainerRef: useRef<HTMLDivElement>(null),
    chartInstanceRef: useRef<echarts.ECharts | null>(null),
    lastZoomRangeRef: useRef({ start: 0, end: 100 }),
    sidebarToggleRef: useRef<HTMLButtonElement>(null),
    sidebarRef: useRef<HTMLDivElement>(null),
    chartFooterRef: useRef<HTMLDivElement>(null),
    verticalToolbarRef: useRef<HTMLDivElement>(null),
    sidebarBackdropRef: useRef<HTMLDivElement>(null),
    benefitsChartRef: useRef<HTMLDivElement>(null),
    dividendsChartRef: useRef<HTMLDivElement>(null),
    drawingToolbarRef: useRef<HTMLDivElement>(null),
    drawingTooltipRef: useRef<HTMLDivElement>(null),
    cursorPriceBadgeRef: useRef<HTMLDivElement>(null),
    cursorPriceTextRef: useRef<HTMLSpanElement>(null),
    cursorPriceActionRef: useRef<HTMLButtonElement>(null),
    lastPriceBadgeRef: useRef<HTMLDivElement>(null),
    lastPriceLineRef: useRef<HTMLDivElement>(null),
  };
  return <ChartRefsContext.Provider value={refs}>{children}</ChartRefsContext.Provider>;
};

const MarketDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dataMode = useSelector(selectDataMode);
  const { selectedTicker } = useTickerSelector();
  const marketData = useMarketData(dataMode, selectedTicker?.ticker);
  return <MarketDataContext.Provider value={marketData}>{children}</MarketDataContext.Provider>;
};

const ChartStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const marketDataContext = useContext(MarketDataContext);
  if (!marketDataContext) throw new Error("ChartStateProvider must be used within MarketDataProvider");
  const { chartData, isLoading: marketIsLoading } = marketDataContext;

  const { selectedTicker, isLoading: isTickerLoading } = useTickerSelector();
  const currencyState = useContext(CurrencyContext);
  const chartConfig = useSelector(selectChartConfig, shallowEqual);
  const selectedTimeRange = useSelector((state: RootState) => state.technicalAnalysis.ui.selectedTimeRange);
  const isAnonyme = useSelector((state: RootState) => state.technicalAnalysis.ui.isAnonyme);
  const selectedPseudo = useSelector((state: RootState) => state.technicalAnalysis.ui.selectedPseudo);

  const security = useMemo(() => {
    if (!selectedTicker?.ticker) return BRVM_SECURITIES[0];
    return BRVM_SECURITIES.find((s) => s.ticker === selectedTicker.ticker) || BRVM_SECURITIES[0];
  }, [selectedTicker]);

  const { exchangeRate, isConverting } = useCurrencyConverter(
    security.currency || "XOF",
    currencyState?.selectedCurrency || "XOF"
  );

  const effectiveRate = useMemo(() => {
    const base = security.currency || "XOF";
    const target = currencyState?.selectedCurrency || "XOF";
    if (base === target) return 1;
    if (exchangeRate !== 1) return exchangeRate;
    const rateBase = FALLBACK_RATES[base] || 1;
    const rateTarget = FALLBACK_RATES[target] || 1;
    return rateTarget / rateBase;
  }, [exchangeRate, security.currency, currencyState?.selectedCurrency]);

  // [TENOR 2026 FIX] SCAR-UX-LOADER: Restored marketIsLoading dependency to prevent 2-minute blank chart
  const globalIsLoading = isTickerLoading || isConverting || (marketIsLoading && chartData.length === 0);

  const filteredChartData = useMemo(() => {
    if (chartData.length === 0) return chartData;
    const range = selectedTimeRange;
    if (range === "Tout" || !range) return chartData;

    const now = new Date();
    let cutoffDate: Date | null = null;

    if (range === "1J") {
      cutoffDate = new Date(now);
      cutoffDate.setDate(cutoffDate.getDate() - 1);
    } else if (range === "5J") {
      cutoffDate = new Date(now);
      cutoffDate.setDate(cutoffDate.getDate() - 5);
    } else if (range === "1M") {
      cutoffDate = new Date(now);
      cutoffDate.setMonth(cutoffDate.getMonth() - 1);
    } else if (range === "3M") {
      cutoffDate = new Date(now);
      cutoffDate.setMonth(cutoffDate.getMonth() - 3);
    } else if (range === "6M") {
      cutoffDate = new Date(now);
      cutoffDate.setMonth(cutoffDate.getMonth() - 6);
    } else if (range === "YTD") {
      cutoffDate = new Date(now.getFullYear(), 0, 1);
    } else if (range === "1Y") {
      cutoffDate = new Date(now);
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
    } else if (range === "5Y") {
      cutoffDate = new Date(now);
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 5);
    }

    if (!cutoffDate) return chartData;

    const cutoff = cutoffDate.getTime();
    const filtered = chartData.filter((point) => new Date(point.time).getTime() >= cutoff);
    return filtered.length > 0 ? filtered : chartData.slice(-1);
  }, [chartData, selectedTimeRange]);

  // ============================================================================
  // [TENOR 2026 SRE] INCREMENTAL MEMOIZATION (O(1) LIVE TICK SHIELD)
  // SCAR-PERF-MAP: Eradicates O(N) array mapping at 60Hz.
  // ============================================================================
  const convertedRef = useRef<{ rate: number; source: ChartDataPoint[]; result: ChartDataPoint[] }>({
    rate: 1,
    source: [],
    result: [],
  });

  const displayChartData = useMemo(() => {
    const sourceData = filteredChartData;
    if (effectiveRate === 1) return sourceData;

    const cache = convertedRef.current;
    let result: ChartDataPoint[];

    // [TENOR 2026 FIX] Torvalds Warning: Check historical integrity
    const isSameStart =
      cache.source.length > 0 &&
      sourceData.length > 0 &&
      cache.source[0].time === sourceData[0].time &&
      cache.source[0].close === sourceData[0].close;

    // Incremental update: If rate is identical, start is identical, and data grew or updated the last candle
    if (cache.rate === effectiveRate && isSameStart && sourceData.length >= cache.source.length - 1) {
      // Safely reuse all but the last 2 candles to handle live tick updates seamlessly
      const reuseCount = Math.max(0, cache.result.length - 2);
      result = cache.result.slice(0, reuseCount);
      for (let i = reuseCount; i < sourceData.length; i++) {
        const d = sourceData[i];
        result.push({
          ...d,
          open: d.open * effectiveRate,
          high: d.high * effectiveRate,
          low: d.low * effectiveRate,
          close: d.close * effectiveRate,
        });
      }
    } else {
      // Full recompute (Only happens on currency change, major timeframe shift, or historical mutation)
      result = sourceData.map((d) => ({
        ...d,
        open: d.open * effectiveRate,
        high: d.high * effectiveRate,
        low: d.low * effectiveRate,
        close: d.close * effectiveRate,
      }));
    }

    convertedRef.current = { rate: effectiveRate, source: sourceData, result };
    return result;
  }, [filteredChartData, effectiveRate]);

  const userInitials = "DA";
  const displaySymbolName = isAnonyme ? selectedPseudo : chartConfig.symbol || selectedTicker?.ticker || "BOAB";
  const [isMainChartVisible, setIsMainChartVisible] = React.useState(true);

  const value = useMemo(
    () => ({
      security,
      effectiveRate,
      globalIsLoading,
      displayChartData,
      userInitials,
      displaySymbolName,
      isMainChartVisible,
      setIsMainChartVisible,
    }),
    [
      security,
      effectiveRate,
      globalIsLoading,
      displayChartData,
      userInitials,
      displaySymbolName,
      isMainChartVisible,
      setIsMainChartVisible,
    ]
  );

  return <ChartStateContext.Provider value={value}>{children}</ChartStateContext.Provider>;
};

const DrawingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const refsContext = useContext(ChartRefsContext);
  const chartStateContext = useContext(ChartStateContext);

  if (!refsContext) throw new Error("DrawingProvider must be used within ChartRefsProvider");
  if (!chartStateContext) throw new Error("DrawingProvider must be used within ChartStateProvider");

  const drawingManager = useDrawingManager({
    chartInstanceRef: refsContext.chartInstanceRef,
    drawingCanvasRef: refsContext.drawingCanvasRef,
    chartData: chartStateContext.displayChartData,
  });

  return <DrawingContext.Provider value={drawingManager}>{children}</DrawingContext.Provider>;
};

// ============================================================================
// MASTER WRAPPER
// ============================================================================

/**
 * [TENOR 2026] TechnicalAnalysisProviderTree
 * Encapsulates the strict hierarchy of contexts required by the Technical Analysis module.
 */
export const TechnicalAnalysisProviderTree: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <TickerSelectorProvider initialTicker="BOAB">
      <BrokerProvider>
        <CurrencyProvider initialCurrency="XOF">
          <ChartRefsProvider>
            <MarketDataProvider>
              <ChartStateProvider>
                <DrawingProvider>
                  {children}
                  <TickerSelectorModal />
                </DrawingProvider>
              </ChartStateProvider>
            </MarketDataProvider>
          </ChartRefsProvider>
        </CurrencyProvider>
      </BrokerProvider>
    </TickerSelectorProvider>
  );
};

// --- EOF ---
