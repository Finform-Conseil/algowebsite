"use client";

import React, {
  useLayoutEffect,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  useState,
  useDeferredValue,
  createContext,
  useContext,
} from "react";
import dynamic from "next/dynamic";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { animate } from "framer-motion";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import {
  CandlestickChart,
  LineChart,
  BarChart,
  ScatterChart,
  PieChart,
} from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  AxisPointerComponent,
  TitleComponent,
  LegendComponent,
  TimelineComponent,
} from "echarts/components";
import clsx from "clsx";

// Contexts & UI
import {
  TickerSelectorProvider,
  useTickerSelector,
} from "../design-system/commons/TickerSelectorModal";

// Redux
import {
  selectChartConfig,
  selectAdvancedIndicators,
  selectIndicatorPeriods,
  selectChartAppearance,
  selectDataMode,
  selectMarketSnapshots,
  removeComparisonSymbol,
  clearComparisonSymbols,
  setTimeRange,
  setModalOpen,
} from "./store/technicalAnalysisSlice";
import type { RootState } from "@/core/infrastructure/store";
import toolbarConfig from "./toolbar-config-antigravity.json";
import { Drawing, ToolbarConfig } from "./config/TechnicalAnalysisTypes";

// Register ECharts modules
echarts.use([
  CanvasRenderer,
  CandlestickChart,
  LineChart,
  BarChart,
  ScatterChart,
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  AxisPointerComponent,
  TitleComponent,
  LegendComponent,
  TimelineComponent,
  PieChart,
]);

// Extracted Components
import { ChartToolbar } from "./components/toolbar/ChartToolbar";
import TechnicalAnalysisSidebar from "./components/sidebar/TechnicalAnalysisSidebar";
import type { DisplaySecurity } from "./config/TechnicalAnalysisTypes";
import { TechnicalAnalysisFooter } from "./components/footer/TechnicalAnalysisFooter";
import { MemoizedCurrencySelector } from "./components/common/CurrencySelector";
import type { CurrencyCode } from "./components/common/CurrencySelector";
import {
  BROKER_CATALOG,
  type Broker,
  type BrokerConnectionState,
  type BrokerModalProps,
  type BrokerOrderIntent,
} from "./components/modals/BrokerModal";
import { ModalOrchestrator } from "./components/modals/ModalOrchestrator";
import { ToolbarButton } from "./components/toolbar/ToolbarButton";
import { VerticalDrawingToolbar } from "./components/toolbar/VerticalDrawingToolbar";

// Hooks & Libs
import { useDrawingManager } from "./hooks/useDrawingManager";
import { useOverlayRenderer } from "./hooks/useOverlayRenderer";
import { useMarketData, useLiveMetrics, useComparisonManager } from "./hooks/MarketData/useMarketData";
import { useEChartsRenderer } from "./hooks/useEChartsRenderer";
import { useTechnicalAnalysisActions } from "./hooks/useTechnicalAnalysisActions";
import { useToolbarHandlers } from "./hooks/useToolbarHandlers";
import { useCursorRenderer } from "./hooks/useCursorRenderer";
import { useAlertMonitor } from "./hooks/useAlertMonitor";
import { useFloatingToolbar } from "./hooks/useFloatingToolbar";
import { useCurrencyConverter } from "./hooks/MarketData/useCurrencyConverter";
import { useObjectTreePanel } from "./hooks/useObjectTreePanel";
import { TimeAxisControls } from "./components/toolbar/TimeAxisControls/TimeAxisControls";
import { PriceAxisOverlay, type PriceAxisActionId, } from "./components/overlays/PriceAxisOverlay";
import { ObjectTreePanel } from "./components/modals/ObjectTreePanel";
import { BRVM_SECURITIES, type BRVMSecurity } from "@/core/data/brvm-securities";
import { useGlobalNotification } from "../design-system/layouts/HeaderHome/context/GlobalNotificationContext";
import { ChartDataPoint } from "./lib/Indicators/TechnicalIndicators";

// [TENOR 2026 SRE] Extracted Hooks Imports
import { useBrokerState } from "./hooks/useBrokerState";
import { useCurrencyState } from "./hooks/useCurrencyState";
import { usePriceAxisMenu, formatPriceAxisLabel } from "./hooks/usePriceAxisMenu";

// ============================================================================
// [TENOR 2026 SRE] STRICT MEMOIZATION SHIELD
// ============================================================================
const MemoizedChartToolbar = React.memo(ChartToolbar);
const MemoizedSidebar = React.memo(TechnicalAnalysisSidebar);
const MemoizedFooter = React.memo(TechnicalAnalysisFooter);
const MemoizedModalOrchestrator = React.memo(ModalOrchestrator);

// ============================================================================
// CONSTANTS & STATIC DATA
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

const MemoizedBrokerModal = dynamic<BrokerModalProps>(
  () => import("./components/modals/BrokerModal").then((m) => m.MemoizedBrokerModal),
  { ssr: false, loading: () => null }
);

const TickerSelectorModal = dynamic(
  () => import("../design-system/commons/TickerSelectorModal").then((m) => m.TickerSelectorModal),
  { ssr: false, loading: () => null }
);

const MemoizedPremiumLoader = React.memo(() => (
  <div className={"gp-chart-loading-overlay"} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(10, 21, 31, 0.4)", backdropFilter: "blur(4px)", zIndex: 100 }}>
    <div className={"ios-loader"}>
      <div className={"bar1"}></div><div className={"bar2"}></div><div className={"bar3"}></div>
      <div className={"bar4"}></div><div className={"bar5"}></div><div className={"bar6"}></div>
      <div className={"bar7"}></div><div className={"bar8"}></div><div className={"bar9"}></div>
      <div className={"bar10"}></div><div className={"bar11"}></div><div className={"bar12"}></div>
    </div>
  </div>
));
MemoizedPremiumLoader.displayName = "MemoizedPremiumLoader";

interface TradeHUDProps {
  convertedLivePrice: number;
  setIsBrokerModalOpen: (val: boolean) => void;
}

const MemoizedTradeHUD = React.memo(({ convertedLivePrice, setIsBrokerModalOpen }: TradeHUDProps) => {
  const spread = convertedLivePrice > 1000 ? 1 : 0.01;
  return (
    <div className="gp-trade-btn-container">
      <div className="gp-trade-btn sell" onClick={() => setIsBrokerModalOpen(true)}>
        <span className="price">{convertedLivePrice.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</span>
        <span className="label">SELL</span>
      </div>
      <div className="gp-trade-spread">{spread}</div>
      <div className="gp-trade-btn buy" onClick={() => setIsBrokerModalOpen(true)}>
        <span className="price">{(convertedLivePrice + spread).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</span>
        <span className="label">BUY</span>
      </div>
    </div>
  );
});
MemoizedTradeHUD.displayName = "MemoizedTradeHUD";

const formatPriceAxisTimeLabel = (value?: string | number | null): string => {
  if (!value) return "--:--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--:--";
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
};

const createUiId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `price-axis-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

// ============================================================================
// [TENOR 2026 SRE] CONTEXT PROVIDERS (Inversion of Control)
// ============================================================================
const BrokerContext = createContext<ReturnType<typeof useBrokerState> | null>(null);
const CurrencyContext = createContext<ReturnType<typeof useCurrencyState> | null>(null);

const BrokerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const state = useBrokerState();
  return <BrokerContext.Provider value={state}>{children}</BrokerContext.Provider>;
};

const CurrencyProvider: React.FC<{ children: React.ReactNode, initialCurrency: CurrencyCode }> = ({ children, initialCurrency }) => {
  const state = useCurrencyState(initialCurrency);
  return <CurrencyContext.Provider value={state}>{children}</CurrencyContext.Provider>;
};

// ============================================================================
// [TENOR 2026 SRE] CONNECTED LEAF COMPONENTS (Zero-Lag Render Bypassing)
// ============================================================================
const ConnectedTradeHUD = React.memo(({ chartData, security, effectiveRate }: { chartData: ChartDataPoint[], security: BRVMSecurity, effectiveRate: number }) => {
  const liveSnapshot = useSelector((state: RootState) => selectMarketSnapshots(state)[security.ticker]);
  const { convertedLivePrice } = useLiveMetrics(chartData, liveSnapshot, security, effectiveRate);
  const brokerState = useContext(BrokerContext);
  if (!brokerState) return null;
  return <MemoizedTradeHUD convertedLivePrice={convertedLivePrice} setIsBrokerModalOpen={brokerState.setIsBrokerModalOpen} />;
});
ConnectedTradeHUD.displayName = "ConnectedTradeHUD";

const ConnectedSidebar = React.memo(({ security, chartData, currentVolume, avgVolume, dataMode, isObjectTreeOpen, onToggleObjectTree, overlayContent, benefitsChartRef, dividendsChartRef, effectiveRate, isLoading, sidebarRef }: any) => {
  const liveSnapshot = useSelector((state: RootState) => selectMarketSnapshots(state)[security.ticker]);
  const { convertedLivePrice, convertedLiveChange, liveChangePercent, isMarketPositive } = useLiveMetrics(chartData, liveSnapshot, security, effectiveRate);
  
  // [TENOR 2026] Currency Context Injection
  const currencyState = useContext(CurrencyContext);
  const displaySecurity = useMemo<DisplaySecurity>(() => ({
    ...security,
    currency: currencyState?.selectedCurrency || "XOF"
  }), [security, currencyState?.selectedCurrency]);

  return (
    <MemoizedSidebar
      sidebarRef={sidebarRef}
      security={displaySecurity}
      chartData={chartData}
      livePrice={convertedLivePrice}
      isMarketPositive={isMarketPositive}
      liveChange={convertedLiveChange}
      liveChangePercent={liveChangePercent}
      lastUpdate={liveSnapshot?.lastUpdate}
      liveVolume={liveSnapshot?.volume || currentVolume}
      liveMarketCap={liveSnapshot?.marketCap}
      liveReturnYTD={liveSnapshot?.returnYTD}
      livePeRatio={liveSnapshot?.peRatio}
      currentVolume={currentVolume}
      avgVolume={avgVolume}
      benefitsChartRef={benefitsChartRef}
      dividendsChartRef={dividendsChartRef}
      isLoading={isLoading}
      dataMode={dataMode}
      overlayContent={overlayContent}
      isObjectTreeOpen={isObjectTreeOpen}
      onToggleObjectTree={onToggleObjectTree}
    />
  );
});
ConnectedSidebar.displayName = "ConnectedSidebar";

const ConnectedPriceAxisOverlay = React.memo(({ displaySymbolName, chartData, security, effectiveRate, fullscreenChartContainerRef, cursorPriceActionRef, cursorPriceBadgeRef, cursorPriceTextRef, lastPriceBadgeRef, lastPriceLineRef, addDrawing, setSelectedDrawingId, dispatch }: any) => {
  const liveSnapshot = useSelector((state: RootState) => selectMarketSnapshots(state)[security.ticker]);
  const { convertedLastCandleClose, isLastPricePositive, lastCandleTime } = useLiveMetrics(chartData, liveSnapshot, security, effectiveRate);
  const brokerState = useContext(BrokerContext);
  const { priceAxisActionMenu, closePriceAxisActionMenu, handleAxisPriceActionButtonClick } = usePriceAxisMenu(fullscreenChartContainerRef, cursorPriceActionRef);
  const { addNotification } = useGlobalNotification();

  const lastPriceTimeLabel = useMemo(() => formatPriceAxisTimeLabel(lastCandleTime), [lastCandleTime]);

  const handlePriceAxisAction = useCallback((actionId: PriceAxisActionId) => {
    const priceLabel = priceAxisActionMenu.priceLabel;
    const priceValue = priceAxisActionMenu.priceValue;

    if (!priceAxisActionMenu.isOpen || !Number.isFinite(priceValue)) return;

    if (actionId === "alert") {
      dispatch(setModalOpen({ modal: "alerts", isOpen: true }));
      addNotification({ title: "Alerte préparée", message: `${displaySymbolName} au niveau ${priceLabel}`, type: "info", iconType: "faBell" });
      closePriceAxisActionMenu();
      return;
    }

    if (actionId === "horizontal-line") {
      const latestPoint = chartData[chartData.length - 1];
      if (latestPoint) {
        const newDrawing: Drawing = {
          id: createUiId(),
          type: "horizontal_line",
          points: [{ time: latestPoint.time, value: priceValue }],
          style: { color: "#2962ff", lineWidth: 2, lineStyle: "solid", fillColor: "#2962ff", fillOpacity: 0.08 },
        };
        addDrawing(newDrawing);
        setSelectedDrawingId(newDrawing.id);
      }
      addNotification({ title: "Niveau tracé", message: `Ligne horizontale ajoutée à ${priceLabel}`, type: "success", iconType: "faCheck" });
      closePriceAxisActionMenu();
      return;
    }

    const side = actionId === "sell-limit" ? "sell" : "buy";
    const orderType = actionId === "sell-limit" ? "limit" : actionId === "buy-stop" ? "stop" : "market";

    if (brokerState) {
      brokerState.openPrefilledBrokerFlow({ symbol: displaySymbolName, side, orderType, triggerPrice: priceValue, triggerLabel: priceLabel });
    }
    addNotification({ title: "Ticket prérempli", message: `${side.toUpperCase()} ${displaySymbolName} @ ${priceLabel} ${orderType}`, type: "info", iconType: "faChartLine" });
    closePriceAxisActionMenu();
  }, [addDrawing, addNotification, closePriceAxisActionMenu, dispatch, chartData, displaySymbolName, brokerState, priceAxisActionMenu, setSelectedDrawingId]);

  return (
    <PriceAxisOverlay
      displaySymbolName={displaySymbolName}
      convertedLivePrice={convertedLastCandleClose}
      lastPriceTimeLabel={lastPriceTimeLabel}
      isLastPricePositive={isLastPricePositive}
      cursorPriceBadgeRef={cursorPriceBadgeRef}
      cursorPriceTextRef={cursorPriceTextRef}
      cursorPriceActionRef={cursorPriceActionRef}
      lastPriceBadgeRef={lastPriceBadgeRef}
      lastPriceLineRef={lastPriceLineRef}
      priceAxisActionMenu={priceAxisActionMenu}
      formatPriceAxisLabel={formatPriceAxisLabel}
      handleAxisPriceActionButtonClick={handleAxisPriceActionButtonClick}
      handlePriceAxisAction={handlePriceAxisAction}
    />
  );
});
ConnectedPriceAxisOverlay.displayName = "ConnectedPriceAxisOverlay";

// ============================================================================
// MAIN COMPONENT (Pure Orchestrator)
// ============================================================================
const TechnicalAnalysisInner: React.FC = () => {
  // --- REDUX STATE (GRANULAR SRE SELECTION) ---
  const dispatch = useDispatch();
  const chartConfig = useSelector(selectChartConfig, shallowEqual);
  const advancedIndicators = useSelector(selectAdvancedIndicators, shallowEqual);
  const indicatorPeriods = useSelector(selectIndicatorPeriods, shallowEqual);
  const chartAppearance = useSelector(selectChartAppearance, shallowEqual);
  const dataMode = useSelector(selectDataMode);

  // [TENOR 2026 SRE FIX] SCAR-PERF-01: Granular Selectors to prevent God Component Re-renders
  // By selecting primitive values instead of the entire `uiState` object, we guarantee that
  // toggling a modal (which mutates `state.technicalAnalysis.ui.modals`) will NOT trigger
  // a re-render of this massive component.
  const isZenMode = useSelector((state: RootState) => state.technicalAnalysis.ui.isZenMode);
  const isAnonyme = useSelector((state: RootState) => state.technicalAnalysis.ui.isAnonyme);
  const selectedPseudo = useSelector((state: RootState) => state.technicalAnalysis.ui.selectedPseudo);
  const cursorMode = useSelector((state: RootState) => state.technicalAnalysis.ui.cursorMode);
  const selectedTimeRange = useSelector((state: RootState) => state.technicalAnalysis.ui.selectedTimeRange);
  const comparisonSymbols = useSelector((state: RootState) => state.technicalAnalysis.ui.comparisonSymbols, shallowEqual);
  const replayState = useSelector((state: RootState) => state.technicalAnalysis.ui.replay, shallowEqual);
  const isCapturing = useSelector((state: RootState) => state.technicalAnalysis.ui.isCapturing);
  const isPublishing = useSelector((state: RootState) => state.technicalAnalysis.ui.isPublishing);

  // Proxy object to satisfy legacy hooks without triggering re-renders on modal toggles
  const uiStateProxy = useMemo(() => ({
    isZenMode,
    isAnonyme,
    selectedPseudo,
    cursorMode,
    selectedTimeRange,
    isPublishing,
    isCapturing,
    dataMode,
    comparisonSymbols,
    searchMode: "replace" as const,
    modals: {} as any, // Modals are decoupled!
    replay: replayState,
    isLockedAll: false,
    areDrawingsHidden: false
  }), [isZenMode, isAnonyme, selectedPseudo, cursorMode, selectedTimeRange, isPublishing, isCapturing, dataMode, comparisonSymbols, replayState]);

  // --- CONTEXTS ---
  const { selectedTicker, isLoading: isTickerLoading, openModal: openTickerSelector } = useTickerSelector();
  const { addNotification } = useGlobalNotification();
  const currencyState = useContext(CurrencyContext);
  const brokerState = useContext(BrokerContext);

  // --- DYNAMIC DATA BINDING ---
  const security = useMemo(() => {
    if (!selectedTicker?.ticker) return BRVM_SECURITIES[0];
    return BRVM_SECURITIES.find((s) => s.ticker === selectedTicker.ticker) || BRVM_SECURITIES[0];
  }, [selectedTicker]);

  // --- REFS (Layout Orchestration) ---
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const cursorCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const stockChartRef = useRef<HTMLDivElement>(null);
  const layersStackRef = useRef<HTMLDivElement>(null);
  const chartViewWrapperRef = useRef<HTMLDivElement>(null);
  const fullscreenChartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  const lastZoomRangeRef = useRef<{ start: number; end: number }>({ start: 0, end: 100 });
  const sidebarToggleRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const chartFooterRef = useRef<HTMLDivElement>(null);
  const verticalToolbarRef = useRef<HTMLDivElement>(null);
  const sidebarBackdropRef = useRef<HTMLDivElement>(null);
  const benefitsChartRef = useRef<HTMLDivElement>(null);
  const drawingToolbarRef = useRef<HTMLDivElement>(null);
  const drawingTooltipRef = useRef<HTMLDivElement>(null);
  const dividendsChartRef = useRef<HTMLDivElement>(null);
  const cursorPriceBadgeRef = useRef<HTMLDivElement>(null);
  const cursorPriceTextRef = useRef<HTMLSpanElement>(null);
  const cursorPriceActionRef = useRef<HTMLButtonElement>(null);
  const lastPriceBadgeRef = useRef<HTMLDivElement>(null);
  const lastPriceLineRef = useRef<HTMLDivElement>(null);

  // --- LOCAL STATE (Data & Simulation) ---
  const { chartData, setChartData, isLoading: marketIsLoading, startReplay, stopReplay, showReplayFullText, setShowReplayFullText, currentVolume, avgVolume } = useMarketData(dataMode, selectedTicker?.ticker);
  const [prevTicker, setPrevTicker] = useState<string | undefined>(security.ticker);

  // Safely manage comparison data fetching
  useComparisonManager(comparisonSymbols, dataMode);

  if (security.ticker !== prevTicker) {
    setPrevTicker(security.ticker);
    currencyState?.setSelectedCurrency(security.currency || "XOF");
  }

  // --- CURRENCY CONVERSION HOOK ---
  const { exchangeRate, isConverting } = useCurrencyConverter(security.currency || "XOF", currencyState?.selectedCurrency || "XOF");

  const effectiveRate = useMemo(() => {
    const base = security.currency || "XOF";
    const target = currencyState?.selectedCurrency || "XOF";
    if (base === target) return 1;
    if (exchangeRate !== 1) return exchangeRate;
    const rateBase = FALLBACK_RATES[base] || 1;
    const rateTarget = FALLBACK_RATES[target] || 1;
    return rateTarget / rateBase;
  }, [exchangeRate, security.currency, currencyState?.selectedCurrency]);

  const globalIsLoading = isTickerLoading || (marketIsLoading && chartData.length === 0) || isConverting;

  useTechnicalAnalysisActions(setChartData);

  const handleTimeRangeSelect = useCallback((range: string) => {
    dispatch(setTimeRange(range));
  }, [dispatch]);

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

  const displayChartData = useMemo(() => {
    const sourceData = filteredChartData;
    if (effectiveRate === 1) return sourceData;
    return sourceData.map((d) => ({
      ...d,
      open: d.open * effectiveRate,
      high: d.high * effectiveRate,
      low: d.low * effectiveRate,
      close: d.close * effectiveRate,
    }));
  }, [filteredChartData, effectiveRate]);

  const userFirstName = "";
  const userEmail = "";
  const userInitials = (userFirstName.substring(0, 2) || userEmail.substring(0, 2) || "DA").toUpperCase();
  const displaySymbolName = isAnonyme ? selectedPseudo : selectedTicker?.ticker || chartConfig.symbol;

  // [TENOR 2026 SRE] ECharts Internal API - Protected by try/catch inside useEChartsRenderer
  // We calculate a lightweight lastPriceAxisValue here just for the Y-axis markLine.
  const lastCandle = displayChartData.length > 0 ? displayChartData[displayChartData.length - 1] : null;
  const lightweightLastPrice = lastCandle ? lastCandle.close : 0;

  const comparisonSeries = useMemo(() =>
    (comparisonSymbols || [])
      .map((symbol) => ({ symbol, data: [] })) // Data is fetched by useComparisonManager into Redux, EChartsRenderer will read it
      .filter((entry) => entry.symbol.length > 0),
    [comparisonSymbols]
  );

  // --- DRAWING MANAGER HOOK ---
  const {
    activeTool,
    setActiveTool,
    drawings,
    selectedDrawingId,
    setSelectedDrawingId,
    updateDrawing,
    deleteDrawing,
    addDrawing,
    reorderDrawing,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleDoubleClick,
    gridRect,
    saveAsDefault,
    resetStyle,
    namedTemplates,
    saveNamedTemplate,
    applyNamedTemplate,
    deleteNamedTemplate,
  } = useDrawingManager({ chartInstanceRef, drawingCanvasRef, chartData: displayChartData });

  // --- OBJECT TREE & DATA WINDOW HOOK ---
  const {
    isOpen: isObjectTreeOpen,
    activeTab: objectTreeTab,
    togglePanel: toggleObjectTree,
    setActiveTab: setObjectTreeTab,
    dataWindow,
  } = useObjectTreePanel({
    chartInstanceRef: chartInstanceRef as React.RefObject<echarts.ECharts | null>,
    chartData: displayChartData
  });

  const selectedDrawing = drawings.find((d: Drawing) => d.id === selectedDrawingId);
  const dr = selectedDrawing;
  const [isMainChartVisible, setIsMainChartVisible] = useState(true);

  useAlertMonitor({ chartData: displayChartData, addNotification });

  const {
    activeToolbarPopup,
    setActiveToolbarPopup,
    isSavingAs,
    setIsSavingAs,
    newTemplateName,
    setNewTemplateName,
    toolbarOffsetRef,
    handleToolbarDragStart,
    handleLockToggle,
    handleClone,
    handleVisualOrder,
    handleClearAllDrawings,
    handleHide,
    handleReverse,
    handleCopyToClipboard,
  } = useFloatingToolbar({
    drawings,
    selectedDrawingId,
    updateDrawing,
    addDrawing,
    setSelectedDrawingId,
    deleteDrawing,
    addNotification,
    drawingToolbarRef
  });

  const { handleColorChange, handleFillChange, handleLineStyleChange, handleTextColorChange } = useToolbarHandlers({
    drawings,
    selectedDrawingId,
    updateDrawing,
    setActiveToolbarPopup
  });

  const setIsDrawingSettingsModalOpen = useCallback((val: boolean) => dispatch(setModalOpen({ modal: "drawingSettings", isOpen: val })), [dispatch]);
  const setIsAlertModalOpen = useCallback((val: boolean) => dispatch(setModalOpen({ modal: "alerts", isOpen: val })), [dispatch]);
  const handleOpenDatePicker = useCallback((isOpen: boolean) => {
    dispatch(setModalOpen({ modal: "datePicker", isOpen }));
  }, [dispatch]);

  useOverlayRenderer({
    selectedDrawingId,
    drawings,
    chartInstanceRef,
    drawingCanvasRef,
    drawingToolbarRef,
    drawingTooltipRef,
    gridRect,
    toolbarOffsetRef,
    chartData: displayChartData
  });

  useEffect(() => {
    chartInstanceRef.current?.resize();
    const timer = setTimeout(() => {
      chartInstanceRef.current?.resize();
      requestAnimationFrame(() => {
        chartInstanceRef.current?.resize();
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [isZenMode]);

  // Route-specific Viewport Locking
  useEffect(() => {
    document.documentElement.classList.add("gp-dashboard-lock");
    document.body.classList.add("gp-dashboard-lock");
    return () => {
      document.documentElement.classList.remove("gp-dashboard-lock");
      document.body.classList.remove("gp-dashboard-lock");
    };
  }, []);

  useEChartsRenderer({
    stockChartRef,
    chartInstanceRef,
    chartData: displayChartData,
    chartConfig,
    advancedIndicators,
    indicatorPeriods,
    chartAppearance,
    uiState: uiStateProxy,
    displaySymbol: displaySymbolName,
    lastZoomRangeRef,
    cursorPriceBadgeRef,
    cursorPriceTextRef,
    cursorPriceActionRef,
    lastPriceBadgeRef,
    lastPriceLineRef,
    lastPriceAxisValue: lightweightLastPrice,
    isMainChartVisible,
    comparisonSeries,
  });

  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
  }, []);

  useCursorRenderer({
    canvasRef: cursorCanvasRef,
    containerRef: layersStackRef,
    mode: cursorMode,
    chartRef: chartInstanceRef as React.RefObject<echarts.ECharts>,
    chartData: displayChartData,
  });

  useLayoutEffect(() => {
    if (!mainContainerRef.current) return;
    animate(mainContainerRef.current, { opacity: [0.95, 1] }, { duration: 0.15, ease: "easeOut" });
  }, []);

  // Force uncollapse of right sidebar if Object Tree is toggled ON
  useLayoutEffect(() => {
    const sidebar = sidebarRef.current;
    if (isObjectTreeOpen && sidebar && sidebar.classList.contains("sidebar-closed")) {
      sidebar.style.visibility = "visible";
      animate(sidebar, { opacity: 1, x: "0%" }, { duration: 0.2, ease: "easeOut" });
      sidebar.classList.remove("sidebar-closed");
    }
  }, [isObjectTreeOpen]);

  const updateSidebarState = useCallback(() => {
    const sidebarToggle = sidebarToggleRef.current;
    const sidebar = sidebarRef.current;
    const chartFooter = chartFooterRef.current;
    const verticalToolbar = verticalToolbarRef.current;

    if (!sidebarToggle || !sidebar) return;

    const isClosed = sidebar.classList.contains("sidebar-closed");
    sidebarToggle.classList.toggle("flipped", isClosed);

    const isSmall = window.matchMedia("(max-width: 575.98px)").matches;
    const isMedium = window.matchMedia("(max-width: 820px)").matches;

    if (chartFooter && verticalToolbar) {
      verticalToolbar.style.display = "flex";
      if (chartViewWrapperRef.current) chartViewWrapperRef.current.style.display = "flex";

      if (isSmall) chartFooter.style.display = "none";
      else if (isMedium) chartFooter.style.display = isClosed ? "flex" : "none";
      else chartFooter.style.display = "flex";
    }
  }, []);

  const handleSidebarBackdropClick = useCallback(() => {
    const sidebar = sidebarRef.current;
    if (sidebar) {
      animate(sidebar, { opacity: 0, x: "100%" }, {
        duration: 0.2, ease: "easeIn", onComplete: () => {
          sidebar.style.visibility = "hidden";
        }
      });
      sidebar.classList.add("sidebar-closed");
      updateSidebarState();
    }
  }, [updateSidebarState]);

  useLayoutEffect(() => {
    const sidebarToggle = sidebarToggleRef.current;
    const sidebar = sidebarRef.current;

    if (!sidebarToggle || !sidebar) return;

    const initialSetup = () => {
      updateSidebarState();
    };

    const handleToggleClick = () => {
      const root = mainContainerRef.current;
      const sidebar = sidebarRef.current;
      if (!root || !sidebar) return;

      const isCurrentlyClosed = root.classList.contains("sidebar-closed");

      if (isCurrentlyClosed) {
        root.classList.remove("sidebar-closed");
        sidebar.classList.remove("sidebar-closed");
      } else {
        root.classList.add("sidebar-closed");
        sidebar.classList.add("sidebar-closed");
      }
      updateSidebarState();
    };

    initialSetup();
    sidebarToggle.addEventListener("click", handleToggleClick);
    window.addEventListener("resize", initialSetup);

    return () => {
      sidebarToggle.removeEventListener("click", handleToggleClick);
      window.removeEventListener("resize", initialSetup);
    };
  }, [updateSidebarState]);

  // [TENOR 2026 SRE] REACT 18 CONCURRENT DECOUPLING
  const deferredChartData = useDeferredValue(displayChartData);

  return (
    <div ref={mainContainerRef} className={clsx("technical-analysis-root", isZenMode && "is-zen-mode")}>
      <div className={"gp-global-wrapper"}>
        <div className={clsx("page-content-wrapper", "mt-1")}>
          <MemoizedChartToolbar
            userInitials={userInitials}
            displaySymbol={displaySymbolName}
            openTickerSelector={openTickerSelector}
            stopReplay={stopReplay}
          />

          {comparisonSymbols.length > 0 && (
            <div className="d-flex align-items-center gap-2 px-3 py-1" style={{ background: "rgba(11,24,39,0.55)" }}>
              <span style={{ color: "#9aa4b2", fontSize: "12px" }}>Compare %</span>
              {comparisonSymbols.map((symbol) => (
                <button key={symbol} className="btn btn-sm btn-outline-light" onClick={() => dispatch(removeComparisonSymbol(symbol))} title={`Retirer ${symbol}`}>
                  {symbol} ×
                </button>
              ))}
              <button className="btn btn-sm btn-outline-warning" onClick={() => dispatch(clearComparisonSymbols())} title="Effacer toutes les comparaisons">
                Clear
              </button>
            </div>
          )}

          <div className={clsx("gp-main-layout-container", "gsap-target-main-container")}>
            <div ref={sidebarBackdropRef} className={"gp-sidebar-backdrop"} onClick={handleSidebarBackdropClick} />

            <div className={"gp-chart-main-section"}>
              <VerticalDrawingToolbar
                activeTool={activeTool}
                setActiveTool={setActiveTool}
                mainContainerRef={mainContainerRef as React.RefObject<HTMLDivElement>}
                verticalToolbarRef={verticalToolbarRef}
                handleClearAllDrawings={handleClearAllDrawings}
              />

              <div ref={chartViewWrapperRef} className={"gp-chart-view-wrapper"}>
                <div ref={fullscreenChartContainerRef} className={clsx("gp-chart-container", isZenMode && "zen-mode")} style={{ position: "relative" }}>
                  {replayState.isActive && (
                    <div className={clsx("replay-badge", showReplayFullText ? "is-full" : "is-collapsed")} onClick={() => setShowReplayFullText((prev) => !prev)}>
                      <span className={"replay-dot"} />
                      {showReplayFullText && <div className={"replay-text-wrapper"}><span>Replay</span></div>}
                    </div>
                  )}

                  <div className={"gp-chart-layers-stack"} ref={layersStackRef} style={{ position: "relative", flexGrow: 1, minHeight: 0, overflow: "hidden" }}>
                    <div id="gp-stock-chart" className={clsx("technical-analysis-chart", `cursor-mode-${cursorMode.split("-")[0]}`)} ref={stockChartRef} style={{ width: "100%", height: "100%", touchAction: "none" }}></div>
                    <canvas ref={cursorCanvasRef} className={"gp-cursor-canvas"} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 10 }} />
                    <canvas
                      ref={drawingCanvasRef}
                      className={"gp-cursor-canvas"}
                      style={{
                        position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
                        pointerEvents: activeTool || drawings.length > 0 ? "auto" : "none",
                        zIndex: 50, cursor: activeTool ? "crosshair" : "default",
                        clipPath: gridRect ? `polygon(0% ${gridRect.y}px, 100% ${gridRect.y}px, 100% ${gridRect.y + gridRect.height}px, 0% ${gridRect.y + gridRect.height}px)` : "none",
                        touchAction: "none"
                      }}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerCancel={handlePointerUp}
                      onLostPointerCapture={handlePointerUp}
                      onDoubleClick={handleDoubleClick}
                      onContextMenu={(e) => e.preventDefault()}
                    />

                    <ConnectedTradeHUD chartData={displayChartData} security={security} effectiveRate={effectiveRate} />

                    {currencyState && (
                      <MemoizedCurrencySelector
                        selectedCurrency={currencyState.selectedCurrency}
                        setSelectedCurrency={currencyState.setSelectedCurrency}
                        isCurrencyOpen={currencyState.isCurrencyOpen}
                        setIsCurrencyOpen={currencyState.setIsCurrencyOpen}
                        currencyQuery={currencyState.currencyQuery}
                        setCurrencyQuery={currencyState.setCurrencyQuery}
                        currencyBtnRef={currencyState.currencyBtnRef}
                        currencyPos={currencyState.currencyPos}
                        setCurrencyPos={currencyState.setCurrencyPos}
                      />
                    )}

                    {brokerState && (
                      <MemoizedBrokerModal
                        isBrokerModalOpen={brokerState.isBrokerModalOpen}
                        setIsBrokerModalOpen={brokerState.setIsBrokerModalOpen}
                        selectedBroker={brokerState.selectedBroker}
                        setSelectedBroker={brokerState.setSelectedBroker}
                        brokerConnectionState={brokerState.brokerConnectionState}
                        setBrokerConnectionState={brokerState.setBrokerConnectionState}
                        orderIntent={brokerState.brokerOrderIntent}
                        setOrderIntent={brokerState.setBrokerOrderIntent}
                      />
                    )}

                    <ConnectedPriceAxisOverlay
                      displaySymbolName={displaySymbolName}
                      chartData={displayChartData}
                      security={security}
                      effectiveRate={effectiveRate}
                      fullscreenChartContainerRef={fullscreenChartContainerRef}
                      cursorPriceActionRef={cursorPriceActionRef}
                      cursorPriceBadgeRef={cursorPriceBadgeRef}
                      cursorPriceTextRef={cursorPriceTextRef}
                      lastPriceBadgeRef={lastPriceBadgeRef}
                      lastPriceLineRef={lastPriceLineRef}
                      addDrawing={addDrawing}
                      setSelectedDrawingId={setSelectedDrawingId}
                      dispatch={dispatch}
                    />

                    <TimeAxisControls chartInstanceRef={chartInstanceRef} />

                    {globalIsLoading && <MemoizedPremiumLoader />}

                    <div className="gp-drawing-overlay-shield" style={{ position: "absolute", top: gridRect ? gridRect.y : 30, left: gridRect ? gridRect.x : 15, width: gridRect ? gridRect.width : 800, height: gridRect ? gridRect.height : 600, pointerEvents: "none", overflow: "hidden", clipPath: "inset(0)", zIndex: 60 }}>
                      <div ref={drawingToolbarRef} className="gp-drawing-quick-toolbar-box" onPointerDown={handleToolbarDragStart} style={{ display: "none", position: "absolute", transform: "translate(-50%, -100%)", backgroundColor: "rgba(16, 42, 67, 0.95)", backdropFilter: "blur(10px)", borderRadius: "6px", padding: "6px 8px", zIndex: 1000, flexDirection: "row", alignItems: "center", gap: "4px", border: "1px solid rgba(255, 255, 255, 0.1)", boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)", pointerEvents: "auto", cursor: "default", touchAction: "none" }}>
                        {selectedDrawing?.type && (toolbarConfig as unknown as ToolbarConfig).drawings[selectedDrawing.type]?.toolbar.map((btnId: string) => (
                          <ToolbarButton
                            key={btnId}
                            buttonId={btnId}
                            selectedDrawing={selectedDrawing}
                            activeToolbarPopup={activeToolbarPopup}
                            setActiveToolbarPopup={setActiveToolbarPopup}
                            drawings={drawings}
                            selectedDrawingId={selectedDrawingId}
                            setSelectedDrawingId={setSelectedDrawingId}
                            updateDrawing={updateDrawing}
                            deleteDrawing={deleteDrawing}
                            handleColorChange={handleColorChange}
                            handleFillChange={handleFillChange}
                            handleLineStyleChange={handleLineStyleChange}
                            handleTextColorChange={handleTextColorChange}
                            handleHide={handleHide}
                            handleReverse={handleReverse}
                            handleCopyToClipboard={handleCopyToClipboard}
                            namedTemplates={namedTemplates}
                            applyNamedTemplate={applyNamedTemplate}
                            deleteNamedTemplate={deleteNamedTemplate}
                            saveNamedTemplate={saveNamedTemplate}
                            saveAsDefault={saveAsDefault}
                            resetStyle={resetStyle}
                            isSavingAs={isSavingAs}
                            setIsSavingAs={setIsSavingAs}
                            newTemplateName={newTemplateName}
                            setNewTemplateName={setNewTemplateName}
                            setIsDrawingSettingsModalOpen={setIsDrawingSettingsModalOpen}
                            setActiveDrawingSettingsTab={() => { }}
                            setIsAlertModalOpen={setIsAlertModalOpen}
                            setActiveAlertTab={() => { }}
                            handleLockToggle={handleLockToggle}
                            handleClone={handleClone}
                            handleVisualOrder={handleVisualOrder}
                            toolbarConfig={toolbarConfig as unknown as ToolbarConfig}
                          />
                        ))}
                      </div>
                      <div ref={drawingTooltipRef} style={{ position: "absolute", display: "none", zIndex: 101, backgroundColor: "rgba(15, 23, 42, 0.9)", backdropFilter: "blur(4px)", padding: "4px 6px", borderRadius: "4px", color: "#e2e8f0", fontSize: "10px", fontWeight: 500, fontFamily: "Inter, sans-serif", whiteSpace: "pre-line", pointerEvents: "none", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 2px 4px rgba(0,0,0,0.2)", lineHeight: "1.2" }} />
                    </div>
                  </div>
                </div>
                <MemoizedFooter
                  chartFooterRef={chartFooterRef}
                  selectedTimeRange={selectedTimeRange}
                  handleTimeRangeSelect={handleTimeRangeSelect}
                  setIsDatePickerModalOpen={handleOpenDatePicker}
                />
              </div>
            </div>

            {/* [TENOR 2026 SRE] DECOUPLED SIDEBAR & OBJECT TREE */}
            <div style={{ position: "relative", display: "flex", flexShrink: 0 }}>
              <ConnectedSidebar
                sidebarRef={sidebarRef}
                security={security}
                chartData={deferredChartData}
                currentVolume={currentVolume ?? 0}
                avgVolume={avgVolume ?? 0}
                benefitsChartRef={benefitsChartRef}
                dividendsChartRef={dividendsChartRef}
                isLoading={globalIsLoading}
                dataMode={dataMode}
                isObjectTreeOpen={isObjectTreeOpen}
                onToggleObjectTree={toggleObjectTree}
                overlayContent={isObjectTreeOpen ? (
                  <ObjectTreePanel
                    isOpen={isObjectTreeOpen}
                    activeTab={objectTreeTab}
                    setActiveTab={setObjectTreeTab}
                    drawings={drawings}
                    selectedDrawingId={selectedDrawingId}
                    setSelectedDrawingId={setSelectedDrawingId}
                    updateDrawing={updateDrawing}
                    deleteDrawing={deleteDrawing}
                    handleClone={handleClone}
                    handleVisualOrder={handleVisualOrder}
                    reorderDrawing={reorderDrawing}
                    dataWindow={dataWindow}
                    symbolDisplay={`${security.ticker} · BRVM, 1D`}
                    isMainChartVisible={isMainChartVisible}
                    setIsMainChartVisible={setIsMainChartVisible}
                  />
                ) : null}
                effectiveRate={effectiveRate}
              />
            </div>
          </div>
        </div>
        <button ref={sidebarToggleRef} id="gp-sidebar-toggle" className={"gp-sidebar-toggle-btn"} title="Basculer la barre latérale">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 6 l6 6 l-6 6" /></svg>
        </button>
      </div>
      <MemoizedModalOrchestrator
        dr={dr}
        updateDrawing={updateDrawing}
        startReplay={startReplay}
        setChartData={setChartData}
      />
    </div>
  );
};

const TechnicalAnalysis: React.FC = () => {
  return (
    <TickerSelectorProvider initialTicker="BOAB">
      <BrokerProvider>
        <CurrencyProvider initialCurrency="XOF">
          <TechnicalAnalysisInner />
        </CurrencyProvider>
      </BrokerProvider>
      <TickerSelectorModal />
    </TickerSelectorProvider>
  );
};

export default TechnicalAnalysis;
// --- EOF ---
