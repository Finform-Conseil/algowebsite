/**
 * [TENOR 2026 SRE] Technical Analysis Providers Tree
 * [ADR-008] Provider Hell Extraction: Encapsulates all global states and contexts
 * for the Technical Analysis module. Ensures strict initialization order and
 * preserves the O(1) Incremental Memoization shield for live ticks.
 */

"use client";

import React, { createContext, useMemo, useRef, useContext, useEffect, useLayoutEffect } from "react";
import dynamic from "next/dynamic";
import {
  useSelector,
  shallowEqual } from "react-redux";

// --- Types & Constants ---
import type { RootState } from "@/core/infra/store";
import { useAppDispatch } from "@/core/infra/store/hooks";
import { useCurrency } from "@/hooks/useCurrency";
import type { EChartsInstance } from "../lib/types/echarts";
import type { BRVMSecurity } from "@/core/data/brvm-securities";
import { ChartDataPoint } from "../lib/Indicators/TechnicalIndicators";
import { selectActiveMarket, selectChartConfig, selectDataMode, selectModals, selectUiState } from "../store/selectors";

// --- Hooks ---
import { useBrokerState } from "../hooks/useBrokerState";
import { useMarketData } from "../hooks/MarketData/useMarketData";
import { useDrawingManager } from "../hooks/useDrawingManager";
import type { CurrencyConversionStatus } from "../hooks/MarketData/useCurrencyConverter";
import { TickerSelectorProvider, useTickerSelector } from "@/components/design-system/commons/TickerSelectorModal";
import { readPersistedMarketPreference } from "../hooks/MarketData/marketPreferencePersistence";
import { setActiveMarket } from "../store/technicalAnalysisSlice";

// ============================================================================
// CONTEXT DEFINITIONS & EXPORTS
// ============================================================================

export const BrokerContext = createContext<ReturnType<typeof useBrokerState> | null>(null);

export type ChartRefs = {
  mainContainerRef: React.RefObject<HTMLDivElement>;
  cursorCanvasRef: React.RefObject<HTMLCanvasElement>;
  drawingCanvasRef: React.RefObject<HTMLCanvasElement>;
  stockChartRef: React.RefObject<HTMLDivElement>;
  layersStackRef: React.RefObject<HTMLDivElement>;
  chartViewWrapperRef: React.RefObject<HTMLDivElement>;
  fullscreenChartContainerRef: React.RefObject<HTMLDivElement>;
  chartInstanceRef: React.MutableRefObject<EChartsInstance | null>;
  lastZoomRangeRef: React.MutableRefObject<{ start: number; end: number }>;
  sidebarToggleRef: React.RefObject<HTMLButtonElement>;
  sidebarRef: React.RefObject<HTMLDivElement>;
  chartFooterRef: React.RefObject<HTMLDivElement>;
  verticalToolbarRef: React.RefObject<HTMLDivElement>;
  sidebarBackdropRef: React.RefObject<HTMLDivElement>;
  benefitsChartRef: React.RefObject<HTMLDivElement>;
  dividendsChartRef: React.RefObject<HTMLDivElement>;
  drawingToolbarRef: React.RefObject<HTMLDivElement>;
  cursorPriceBadgeRef: React.RefObject<HTMLDivElement>;
  cursorPriceTextRef: React.RefObject<HTMLSpanElement>;
  cursorPriceActionRef: React.RefObject<HTMLButtonElement>;
  lastPriceBadgeRef: React.RefObject<HTMLDivElement>;
  lastPriceLineRef: React.RefObject<HTMLDivElement>;
};

export const ChartRefsContext = createContext<ChartRefs | null>(null);

export type MarketDataState = ReturnType<typeof useMarketData>;
export const MarketDataContext = createContext<MarketDataState | null>(null);

const normalizeApiLabel = (value: string | undefined): string => value?.trim() || "";

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const MarketPreferenceGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();

  useIsomorphicLayoutEffect(() => {
    const preference = readPersistedMarketPreference();
    if (preference) dispatch(setActiveMarket(preference));
  }, [dispatch]);

  return children;
};

export type ChartStateData = {
  security: BRVMSecurity;
  effectiveRate: number;
  baseCurrency: string;
  targetCurrency: string;
  currencyDisplayLabel: string;
  conversionStatus: CurrencyConversionStatus;
  isCurrencyRateUnavailable: boolean;
  displaySymbolName: string;
  userInitials: string;
  globalIsLoading: boolean;
  displayChartData: ChartDataPoint[];
  hasLiveStitchedCandle: boolean;
  isMainChartVisible: boolean;
  setIsMainChartVisible: React.Dispatch<React.SetStateAction<boolean>>;
};
export const ChartStateContext = createContext<ChartStateData | null>(null);

export type DrawingState = ReturnType<typeof useDrawingManager>;
export const DrawingContext = createContext<DrawingState | null>(null);

const useRequiredTechnicalAnalysisContext = <T,>(
  context: React.Context<T | null>,
  contextName: string,
  providerName: string
): T => {
  const value = useContext(context);
  if (value === null) {
    throw new Error(`${contextName} must be used within ${providerName}`);
  }
  return value;
};

export const useBrokerContext = () => useRequiredTechnicalAnalysisContext(BrokerContext, "BrokerContext", "BrokerProvider");
export const useChartRefsContext = () => useRequiredTechnicalAnalysisContext(ChartRefsContext, "ChartRefsContext", "ChartRefsProvider");
export const useMarketDataContext = () => useRequiredTechnicalAnalysisContext(MarketDataContext, "MarketDataContext", "MarketDataProvider");
export const useChartStateContext = () => useRequiredTechnicalAnalysisContext(ChartStateContext, "ChartStateContext", "ChartStateProvider");
export const useDrawingContext = () => useRequiredTechnicalAnalysisContext(DrawingContext, "DrawingContext", "DrawingProvider");

const UNAVAILABLE_SECURITY: BRVMSecurity = Object.freeze({
  name: "",
  ticker: "",
  sector: "" as BRVMSecurity["sector"],
  marketCap: Number.NaN,
  priceChangeD1: Number.NaN,
  peRatio: Number.NaN,
  returnYTD: Number.NaN,
  revenueT12M: Number.NaN,
  epsT12M: Number.NaN,
  country: "",
  currency: "",
  status: "active",
});

const normalizeDisplaySymbol = (value: string | undefined, fallback: string): string => {
  const symbol = value?.trim().toUpperCase();
  return symbol || fallback;
};

const buildAnonymousInitials = (pseudo: string): string => {
  const cleaned = pseudo.trim();
  if (!cleaned) return "AN";

  const parts = cleaned.split(/[_\s-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return cleaned.slice(0, 2).toUpperCase();
};

// ============================================================================
// PROVIDER IMPLEMENTATIONS
// ============================================================================

const BrokerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const state = useBrokerState();
  return <BrokerContext.Provider value={state}>{children}</BrokerContext.Provider>;
};

const ChartRefsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const cursorCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const stockChartRef = useRef<HTMLDivElement>(null);
  const layersStackRef = useRef<HTMLDivElement>(null);
  const chartViewWrapperRef = useRef<HTMLDivElement>(null);
  const fullscreenChartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<EChartsInstance | null>(null);
  const lastZoomRangeRef = useRef({ start: 0, end: 100 });
  const sidebarToggleRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const chartFooterRef = useRef<HTMLDivElement>(null);
  const verticalToolbarRef = useRef<HTMLDivElement>(null);
  const sidebarBackdropRef = useRef<HTMLDivElement>(null);
  const benefitsChartRef = useRef<HTMLDivElement>(null);
  const dividendsChartRef = useRef<HTMLDivElement>(null);
  const drawingToolbarRef = useRef<HTMLDivElement>(null);
  const cursorPriceBadgeRef = useRef<HTMLDivElement>(null);
  const cursorPriceTextRef = useRef<HTMLSpanElement>(null);
  const cursorPriceActionRef = useRef<HTMLButtonElement>(null);
  const lastPriceBadgeRef = useRef<HTMLDivElement>(null);
  const lastPriceLineRef = useRef<HTMLDivElement>(null);

  const refs = useMemo<ChartRefs>(
    () => ({
      mainContainerRef,
      cursorCanvasRef,
      drawingCanvasRef,
      stockChartRef,
      layersStackRef,
      chartViewWrapperRef,
      fullscreenChartContainerRef,
      chartInstanceRef,
      lastZoomRangeRef,
      sidebarToggleRef,
      sidebarRef,
      chartFooterRef,
      verticalToolbarRef,
      sidebarBackdropRef,
      benefitsChartRef,
      dividendsChartRef,
      drawingToolbarRef,
      cursorPriceBadgeRef,
      cursorPriceTextRef,
      cursorPriceActionRef,
      lastPriceBadgeRef,
      lastPriceLineRef,
    }),
    [
      mainContainerRef,
      cursorCanvasRef,
      drawingCanvasRef,
      stockChartRef,
      layersStackRef,
      chartViewWrapperRef,
      fullscreenChartContainerRef,
      chartInstanceRef,
      lastZoomRangeRef,
      sidebarToggleRef,
      sidebarRef,
      chartFooterRef,
      verticalToolbarRef,
      sidebarBackdropRef,
      benefitsChartRef,
      dividendsChartRef,
      drawingToolbarRef,
      cursorPriceBadgeRef,
      cursorPriceTextRef,
      cursorPriceActionRef,
      lastPriceBadgeRef,
      lastPriceLineRef,
    ]
  );

  return <ChartRefsContext.Provider value={refs}>{children}</ChartRefsContext.Provider>;
};

const MarketDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dataMode = useSelector(selectDataMode);
  const activeMarket = useSelector(selectActiveMarket);
  const uiState = useSelector(selectUiState);
  const { selectedTicker, preferredTicker } = useTickerSelector();
  const activeLayoutCell = uiState.multiChartLayout.charts.find(
    (chart) => chart.chartId === uiState.multiChartLayout.activeChartId,
  );
  const isMultiChartMode = uiState.multiChartLayout.isEnabled
    && uiState.multiChartLayout.charts.length > 1;
  const layoutSymbol = isMultiChartMode ? activeLayoutCell?.symbol.trim().toUpperCase() : "";
  const layoutMarket = isMultiChartMode ? activeLayoutCell?.exchange.trim().toUpperCase() : "";
  const activeTicker = layoutSymbol || selectedTicker?.ticker || preferredTicker || undefined;
  const activeMarketScope = layoutMarket || activeMarket.ticker;
  const marketData = useMarketData(dataMode, activeTicker, undefined, activeMarketScope);
  return <MarketDataContext.Provider value={marketData}>{children}</MarketDataContext.Provider>;
};

const ChartStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const marketDataContext = useMarketDataContext();
  const { chartData, currentActionByTickerData, isLoading: marketIsLoading } = marketDataContext;
  const { selectedTicker, preferredTicker, isLoading: isTickerLoading } = useTickerSelector();
  const { displayCurrency: targetCurrency, rates, ratesFetched } = useCurrency();
  const chartConfig = useSelector(selectChartConfig, shallowEqual);
  const selectedTimeRange = useSelector((state: RootState) => state.technicalAnalysis.ui.selectedTimeRange);
  const isAnonyme = useSelector((state: RootState) => state.technicalAnalysis.ui.isAnonyme);
  const selectedPseudo = useSelector((state: RootState) => state.technicalAnalysis.ui.selectedPseudo);
  const uiState = useSelector(selectUiState);
  const activeLayoutCell = uiState.multiChartLayout.charts.find(
    (chart) => chart.chartId === uiState.multiChartLayout.activeChartId,
  );
  const isMultiChartMode = uiState.multiChartLayout.isEnabled
    && uiState.multiChartLayout.charts.length > 1;

  const security = useMemo<BRVMSecurity>(() => {
    const expectedTicker = String(
      (isMultiChartMode ? activeLayoutCell?.symbol : "")
        || selectedTicker?.ticker
        || preferredTicker
        || chartConfig.symbol
        || "",
    ).trim().toUpperCase();
    const action = currentActionByTickerData;
    const actionTicker = String(action?.ticker ?? "").trim().toUpperCase();

    if (!action || !expectedTicker || actionTicker !== expectedTicker) {
      return UNAVAILABLE_SECURITY;
    }

    return {
      ...UNAVAILABLE_SECURITY,
      name: action.society?.name ?? "",
      ticker: action.ticker ?? "",
      isin: action.isin ?? undefined,
      figi: (action as typeof action & { figi?: string }).figi,
      sector: (normalizeApiLabel(action.society?.industry?.name)
        || normalizeApiLabel(action.society?.activity?.name)) as BRVMSecurity["sector"],
      country: action.society?.country?.name ?? "",
      exchange: action.bourse?.ticker ?? "",
      currency: normalizeApiLabel(action.bourse?.currency?.symbol).toUpperCase(),
    };
  }, [activeLayoutCell?.symbol, chartConfig.symbol, currentActionByTickerData, isMultiChartMode, preferredTicker, selectedTicker?.ticker]);

  const baseCurrency = security.currency;
  const { effectiveRate, conversionStatus } = useMemo(() => {
    if (!baseCurrency || !targetCurrency || baseCurrency === targetCurrency) {
      return { effectiveRate: 1, conversionStatus: "native" as CurrencyConversionStatus };
    }

    const baseRate = rates[baseCurrency];
    const targetRate = rates[targetCurrency];
    if (!Number.isFinite(baseRate) || baseRate <= 0 || !Number.isFinite(targetRate) || targetRate <= 0) {
      return { effectiveRate: 1, conversionStatus: "unavailable" as CurrencyConversionStatus };
    }

    return {
      effectiveRate: targetRate / baseRate,
      conversionStatus: (ratesFetched ? "live" : "loading") as CurrencyConversionStatus,
    };
  }, [baseCurrency, rates, ratesFetched, targetCurrency]);

  const isCurrencyRateUnavailable = conversionStatus === "unavailable";
  const currencyDisplayLabel = targetCurrency;

  // Currency conversion is ancillary: it must never cover a chart whose API candles are already available.
  const globalIsLoading = (
    isTickerLoading && !preferredTicker && !chartConfig.symbol
  ) || (marketIsLoading && chartData.length === 0);

  const hasLiveStitchedCandle = false;

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

  const userInitials = useMemo(() => (isAnonyme ? buildAnonymousInitials(selectedPseudo) : "DA"), [isAnonyme, selectedPseudo]);
  const displaySymbolName = useMemo(
    () => normalizeDisplaySymbol(chartConfig.symbol || selectedTicker?.ticker || preferredTicker || security.ticker, ""),
    [chartConfig.symbol, preferredTicker, security.ticker, selectedTicker?.ticker]
  );
  const [isMainChartVisible, setIsMainChartVisible] = React.useState(true);

  const value = useMemo(
    () => ({
      security,
      effectiveRate,
      baseCurrency,
      targetCurrency,
      currencyDisplayLabel,
      conversionStatus,
      isCurrencyRateUnavailable,
      globalIsLoading,
      displayChartData,
      hasLiveStitchedCandle,
      userInitials,
      displaySymbolName,
      isMainChartVisible,
      setIsMainChartVisible,
    }),
    [
      security,
      effectiveRate,
      baseCurrency,
      targetCurrency,
      currencyDisplayLabel,
      conversionStatus,
      isCurrencyRateUnavailable,
      globalIsLoading,
      displayChartData,
      hasLiveStitchedCandle,
      userInitials,
      displaySymbolName,
      isMainChartVisible,
      setIsMainChartVisible,
    ]
  );

  return <ChartStateContext.Provider value={value}>{children}</ChartStateContext.Provider>;
};

const DrawingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const refsContext = useChartRefsContext();
  const chartStateContext = useChartStateContext();

  const drawingManager = useDrawingManager({
    chartInstanceRef: refsContext.chartInstanceRef,
    drawingCanvasRef: refsContext.drawingCanvasRef,
    chartData: chartStateContext.displayChartData,
  });

  return <DrawingContext.Provider value={drawingManager}>{children}</DrawingContext.Provider>;
};

// ============================================================================
// DEFERRED NON-CRITICAL MODULES
// ============================================================================

const LazyTickerSelectorModal = dynamic(
  () => import("@/components/design-system/commons/TickerSelectorModal").then((module) => module.TickerSelectorModal),
  { ssr: false, loading: () => null },
);

const LazyMarketSelectorModal = dynamic(
  () => import("../components/market/MarketSelectorModal").then((module) => module.MarketSelectorModal),
  { ssr: false, loading: () => null },
);

const DeferredTechnicalAnalysisModals: React.FC = () => {
  const { isModalOpen } = useTickerSelector();
  const isMarketSelectorOpen = useSelector(selectModals).marketSelector;
  // The ticker modal is non-critical. Mounting it eagerly triggered an initial
  // /actions lookup even while the modal was closed, duplicating MarketData's
  // metadata revalidation and delaying the chart bootstrap. Mount on first open.
  const [hasMountedTickerSelector, setHasMountedTickerSelector] = React.useState(false);
  const [hasMountedMarketSelector, setHasMountedMarketSelector] = React.useState(false);

  useEffect(() => {
    if (isModalOpen) setHasMountedTickerSelector(true);
    if (isMarketSelectorOpen) setHasMountedMarketSelector(true);
  }, [isMarketSelectorOpen, isModalOpen]);

  return (
    <>
      {hasMountedTickerSelector ? <LazyTickerSelectorModal /> : null}
      {hasMountedMarketSelector ? <LazyMarketSelectorModal /> : null}
    </>
  );
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
    <TickerSelectorProvider>
      <MarketPreferenceGate>
        <BrokerProvider>
        <ChartRefsProvider>
          <MarketDataProvider>
            <ChartStateProvider>
              <DrawingProvider>
                {children}
                <DeferredTechnicalAnalysisModals />
              </DrawingProvider>
            </ChartStateProvider>
          </MarketDataProvider>
        </ChartRefsProvider>
        </BrokerProvider>
      </MarketPreferenceGate>
    </TickerSelectorProvider>
  );
};

// --- EOF ---
