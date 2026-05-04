"use client";

import React, {
  useLayoutEffect,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  useState,
  useDeferredValue,
} from "react";
import dynamic from "next/dynamic";
import { useDispatch, useSelector } from "react-redux";
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
  TickerBreadcrumbTrigger,
  useTickerSelector,
} from "../design-system/commons/TickerSelectorModal";

// Redux
import {
  selectChartConfig,
  selectAdvancedIndicators,
  selectIndicatorPeriods,
  selectChartAppearance,
  selectUiState,
  selectDataMode,
  selectMarketData,
  removeComparisonSymbol,
  clearComparisonSymbols,
  setTimeRange,
  setModalOpen,
} from "./store/technicalAnalysisSlice";
import toolbarConfig from "./toolbar-config-antigravity.json"; // Force HMR: JSON updated
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
import { ChartHeader } from "./components/header/ChartHeader";
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
  type BrokerOrderIntent
} from "./components/modals/BrokerModal";
import { ModalOrchestrator } from "./components/modals/ModalOrchestrator";
import { ToolbarButton } from "./components/toolbar/ToolbarButton";
import { VerticalDrawingToolbar } from "./components/toolbar/VerticalDrawingToolbar";

// Hooks & Libs
import { useDrawingManager } from "./hooks/useDrawingManager";
import { useOverlayRenderer } from "./hooks/useOverlayRenderer";
import { useMarketData } from "./hooks/MarketData/useMarketData";
import { useEChartsRenderer } from "./hooks/useEChartsRenderer";
import { useTechnicalAnalysisActions } from "./hooks/useTechnicalAnalysisActions";
import { useToolbarHandlers } from "./hooks/useToolbarHandlers";
import { useCursorRenderer } from "./hooks/useCursorRenderer";
import { useAlertMonitor } from "./hooks/useAlertMonitor";
import { useFloatingToolbar } from "./hooks/useFloatingToolbar";
import { useCurrencyConverter } from "./hooks/MarketData/useCurrencyConverter";
import { useObjectTreePanel } from "./hooks/useObjectTreePanel";

// [TENOR 2026] Bootstrap CSS est maintenant importé au niveau de layout.tsx 
// AVANT le SCSS global pour résoudre les conflits de Reboot.

import { TimeAxisControls } from "./components/toolbar/TimeAxisControls/TimeAxisControls";
import { PriceAxisOverlay, type PriceAxisActionId, type PriceAxisActionMenuState } from "./components/overlays/PriceAxisOverlay";
import { ObjectTreePanel } from "./components/modals/ObjectTreePanel";
import { CommonPageHeader } from "../design-system/commons/CommonPageHeader";
import { BRVM_SECURITIES } from "@/core/data/brvm-securities";
import { useGlobalNotification } from "../design-system/layouts/HeaderHome/context/GlobalNotificationContext";

// ============================================================================
// [TENOR 2026 SRE] STRICT MEMOIZATION SHIELD
// ============================================================================
// Wrapping heavy UI components in React.memo to prevent cascading re-renders
// when the God Component updates due to high-frequency market ticks.
const MemoizedChartToolbar = React.memo(ChartToolbar);
const MemoizedSidebar = React.memo(TechnicalAnalysisSidebar);
const MemoizedFooter = React.memo(TechnicalAnalysisFooter);
const MemoizedModalOrchestrator = React.memo(ModalOrchestrator);

const ComparisonDataWarmup = React.memo(function ComparisonDataWarmup({
  symbol,
  mode,
}: {
  symbol: string;
  mode: "mock" | "real";
}) {
  useMarketData(mode, symbol);
  return null;
});

// ============================================================================
// CONSTANTS & STATIC DATA
// ============================================================================
const FALLBACK_RATES: Record<string, number> = {
  "XOF": 655.957,
  "XAF": 655.957,
  "USD": 1.08,
  "EUR": 1,
  "GBP": 0.85,
  "NGN": 1600.50,
  "KES": 130.50,
  "ZAR": 19.50,
  "MAD": 10.80,
  "EGP": 47.20,
  "GHS": 13.50
};

const MemoizedBrokerModal = dynamic<BrokerModalProps>(
  () => import("./components/modals/BrokerModal").then((module) => module.MemoizedBrokerModal),
  {
    ssr: false,
    loading: () => null,
  },
);

const TickerSelectorModal = dynamic(
  () => import("../design-system/commons/TickerSelectorModal").then(
    (module) => module.TickerSelectorModal,
  ),
  {
    ssr: false,
    loading: () => null,
  },
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
        <span className="price">{convertedLivePrice.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</span>
        <span className="label">SELL</span>
      </div>
      <div className="gp-trade-spread">{spread}</div>
      <div className="gp-trade-btn buy" onClick={() => setIsBrokerModalOpen(true)}>
        <span className="price">{(convertedLivePrice + spread).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</span>
        <span className="label">BUY</span>
      </div>
    </div>
  );
});
MemoizedTradeHUD.displayName = "MemoizedTradeHUD";

const PRICE_AXIS_MENU_TARGET_WIDTH = 336;
const PRICE_AXIS_MENU_MIN_WIDTH = 248;
const PRICE_AXIS_MENU_MIN_MARGIN = 12;

const formatPriceAxisLabel = (value: number): string => {
  const decimals = Math.abs(value) < 10 ? 4 : 2;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const formatPriceAxisTimeLabel = (value?: string | number | null): string => {
  if (!value) return "--:--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--:--";
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const createUiId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `price-axis-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const TechnicalAnalysisInner: React.FC = () => {
  // --- REDUX STATE ---
  const dispatch = useDispatch();
  const chartConfig = useSelector(selectChartConfig);
  const advancedIndicators = useSelector(selectAdvancedIndicators);
  const indicatorPeriods = useSelector(selectIndicatorPeriods);
  const chartAppearance = useSelector(selectChartAppearance);
  const uiState = useSelector(selectUiState);
  const dataMode = useSelector(selectDataMode);
  const marketDataCache = useSelector(selectMarketData);

  // --- CONTEXTS ---
  const { selectedTicker, isLoading: isTickerLoading, openModal: openTickerSelector } = useTickerSelector();
  const { addNotification } = useGlobalNotification();

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
  const {
    chartData,
    setChartData,
    isLoading: marketIsLoading,
    startReplay,
    stopReplay,
    showReplayFullText,
    setShowReplayFullText,
    liveSnapshot,
    currentVolume,
    avgVolume,
  } = useMarketData(dataMode, selectedTicker?.ticker);

  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [currencyQuery, setCurrencyQuery] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(security.currency || "XOF");
  const [prevTicker, setPrevTicker] = useState<string | undefined>(security.ticker);

  if (security.ticker !== prevTicker) {
    setPrevTicker(security.ticker);
    setSelectedCurrency(security.currency || "XOF");
  }

  const currencyBtnRef = useRef<HTMLDivElement>(null);
  const [currencyPos, setCurrencyPos] = useState({ top: 0, left: 0 });

  const [isBrokerModalOpen, setIsBrokerModalOpen] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState<Broker | null>(null);
  const [brokerConnectionState, setBrokerConnectionState] = useState<BrokerConnectionState>("idle");
  const [brokerOrderIntent, setBrokerOrderIntent] = useState<BrokerOrderIntent | null>(null);

  const [priceAxisActionMenu, setPriceAxisActionMenu] = useState<PriceAxisActionMenuState>({
    isOpen: false,
    priceValue: 0,
    priceLabel: "",
    top: 0,
    left: 0,
    width: 0,
  });

  // --- CURRENCY CONVERSION HOOK ---
  const { exchangeRate, isConverting } = useCurrencyConverter(security.currency || "XOF", selectedCurrency);

  const effectiveRate = useMemo(() => {
    const base = security.currency || "XOF";
    if (base === selectedCurrency) return 1;
    if (exchangeRate !== 1) return exchangeRate;
    const rateBase = FALLBACK_RATES[base] || 1;
    const rateTarget = FALLBACK_RATES[selectedCurrency] || 1;
    return rateTarget / rateBase;
  }, [exchangeRate, security.currency, selectedCurrency]);

  const displaySecurity = useMemo<DisplaySecurity>(() => ({
    ...security,
    currency: selectedCurrency
  }), [security, selectedCurrency]);

  const globalIsLoading = isTickerLoading || (marketIsLoading && chartData.length === 0) || isConverting;

  useTechnicalAnalysisActions(setChartData);

  const handleTimeRangeSelect = useCallback((range: string) => {
    dispatch(setTimeRange(range));
  }, [dispatch]);

  const filteredChartData = useMemo(() => {
    if (chartData.length === 0) return chartData;
    const range = uiState.selectedTimeRange;
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
  }, [chartData, uiState.selectedTimeRange]);

  const displayChartData = useMemo(() => {
    const sourceData = filteredChartData;
    if (effectiveRate === 1) return sourceData;
    return sourceData.map(d => ({
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

  const activeRawData = chartData;
  const lastCandle = activeRawData.length > 0 ? activeRawData[activeRawData.length - 1] : null;
  const prevCandle = activeRawData.length > 1 ? activeRawData[activeRawData.length - 2] : null;

  const livePrice = liveSnapshot ? liveSnapshot.price : lastCandle ? lastCandle.close : security.marketCap > 0 ? security.marketCap / 100 : 0;
  let liveChange = 0;
  let liveChangePercent = 0;
  let liveVolume = 0;

  if (liveSnapshot) {
    liveVolume = liveSnapshot.volume || 0;
    const rawVar = liveSnapshot.variation.replace(/[^\d.,-]/g, "").replace(",", ".");
    liveChangePercent = parseFloat(rawVar) || 0;
    if (liveSnapshot.variation.includes("-") && liveChangePercent > 0) {
      liveChangePercent = -liveChangePercent;
    }
    if (liveSnapshot.prevClose > 0) {
      liveChange = liveSnapshot.price - liveSnapshot.prevClose;
      if (Math.abs(liveChange) > livePrice * 0.5) {
        liveChange = (livePrice * liveChangePercent) / 100;
      }
    } else {
      liveChange = (livePrice * liveChangePercent) / 100;
    }
  } else if (lastCandle) {
    liveVolume = lastCandle.volume || 0;
    if (prevCandle) {
      liveChange = lastCandle.close - prevCandle.close;
      liveChangePercent = prevCandle.close !== 0 ? (liveChange / prevCandle.close) * 100 : 0;
    } else {
      liveChange = lastCandle.close - lastCandle.open;
      liveChangePercent = lastCandle.open !== 0 ? (liveChange / lastCandle.open) * 100 : 0;
    }
  } else {
    liveChangePercent = security.priceChangeD1;
    liveChange = (livePrice * liveChangePercent) / 100;
  }

  const convertedLivePrice = livePrice * effectiveRate;
  const convertedLiveChange = liveChange * effectiveRate;
  const isMarketPositive = convertedLiveChange >= 0;
  const displaySymbolName = uiState.isAnonyme ? uiState.selectedPseudo : selectedTicker?.ticker || chartConfig.symbol;
  const isLastPricePositive = convertedLiveChange >= 0;
  const comparisonSeries = useMemo(
    () =>
      (uiState.comparisonSymbols || [])
        .map((symbol) => ({ symbol, data: marketDataCache[symbol] || [] }))
        .filter((entry) => entry.data.length > 0),
    [uiState.comparisonSymbols, marketDataCache]
  );

  const lastPriceTimeLabel = useMemo(
    () => formatPriceAxisTimeLabel(lastCandle?.time),
    [lastCandle?.time],
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
  } = useDrawingManager({
    chartInstanceRef: chartInstanceRef,
    drawingCanvasRef: drawingCanvasRef,
    chartData: displayChartData,
  });

  // --- OBJECT TREE & DATA WINDOW HOOK ---
  const {
    isOpen: isObjectTreeOpen,
    activeTab: objectTreeTab,
    togglePanel: toggleObjectTree,
    setActiveTab: setObjectTreeTab,
    dataWindow,
  } = useObjectTreePanel({
    chartInstanceRef: chartInstanceRef as React.RefObject<echarts.ECharts | null>,
    chartData: displayChartData,
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
    drawingToolbarRef,
  });

  const {
    handleColorChange,
    handleFillChange,
    handleLineStyleChange,
    handleTextColorChange
  } = useToolbarHandlers({
    drawings,
    selectedDrawingId,
    updateDrawing,
    setActiveToolbarPopup,
  });

  const setIsDrawingSettingsModalOpen = useCallback((val: boolean) =>
    dispatch(setModalOpen({ modal: "drawingSettings", isOpen: val })), [dispatch]);

  const setIsAlertModalOpen = useCallback((val: boolean) =>
    dispatch(setModalOpen({ modal: "alerts", isOpen: val })), [dispatch]);

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
    chartData: displayChartData,
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
  }, [uiState.isZenMode]);

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
    uiState,
    displaySymbol: displaySymbolName,
    lastZoomRangeRef,
    cursorPriceBadgeRef,
    cursorPriceTextRef,
    cursorPriceActionRef,
    lastPriceBadgeRef,
    lastPriceLineRef,
    lastPriceAxisValue: convertedLivePrice,
    isMainChartVisible,
    comparisonSeries,
  });

  const closePriceAxisActionMenu = useCallback(() => {
    setPriceAxisActionMenu((prev) => (prev.isOpen ? { ...prev, isOpen: false } : prev));
  }, []);

  const computePriceAxisMenuPosition = useCallback((buttonRect: DOMRect, containerRect: DOMRect) => {
    const maxAvailableWidth = Math.max(PRICE_AXIS_MENU_MIN_WIDTH, containerRect.width - (PRICE_AXIS_MENU_MIN_MARGIN * 2));
    const width = Math.max(PRICE_AXIS_MENU_MIN_WIDTH, Math.min(PRICE_AXIS_MENU_TARGET_WIDTH, maxAvailableWidth));

    const preferredLeft = buttonRect.left - containerRect.left - width - 10;
    const clampedLeft = Math.max(
      PRICE_AXIS_MENU_MIN_MARGIN,
      Math.min(preferredLeft, containerRect.width - width - PRICE_AXIS_MENU_MIN_MARGIN),
    );

    const preferredTop = buttonRect.top - containerRect.top - 10;
    const estimatedHeight = 256;
    const clampedTop = Math.max(
      PRICE_AXIS_MENU_MIN_MARGIN,
      Math.min(preferredTop, containerRect.height - estimatedHeight - PRICE_AXIS_MENU_MIN_MARGIN),
    );

    return { left: clampedLeft, top: clampedTop, width };
  }, []);

  const handleAxisPriceActionButtonClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const button = event.currentTarget;
    const containerRect = fullscreenChartContainerRef.current?.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();

    const priceValue = Number(button.dataset.price ?? "0");
    const priceLabel = button.dataset.priceLabel ?? formatPriceAxisLabel(priceValue);

    if (!containerRect || !Number.isFinite(priceValue)) return;

    const nextPos = computePriceAxisMenuPosition(buttonRect, containerRect);

    setPriceAxisActionMenu((prev) => ({
      isOpen: !(prev.isOpen && prev.priceLabel === priceLabel),
      priceValue,
      priceLabel,
      top: nextPos.top,
      left: nextPos.left,
      width: nextPos.width,
    }));
  }, [computePriceAxisMenuPosition]);

  const openPrefilledBrokerFlow = useCallback((intent: BrokerOrderIntent) => {
    const preferredBroker = BROKER_CATALOG.find((broker) => broker.id === "paper") ?? BROKER_CATALOG[0] ?? null;
    setBrokerOrderIntent(intent);
    setSelectedBroker(preferredBroker);
    setBrokerConnectionState("idle");
    setIsBrokerModalOpen(true);
  }, []);

  const handlePriceAxisAction = useCallback((actionId: PriceAxisActionId) => {
    const priceLabel = priceAxisActionMenu.priceLabel;
    const priceValue = priceAxisActionMenu.priceValue;

    if (!priceAxisActionMenu.isOpen || !Number.isFinite(priceValue)) return;

    if (actionId === "alert") {
      dispatch(setModalOpen({ modal: "alerts", isOpen: true }));
      addNotification({
        title: "Alerte préparée",
        message: `${displaySymbolName} au niveau ${priceLabel}`,
        type: "info",
        iconType: "faBell",
      });
      closePriceAxisActionMenu();
      return;
    }

    if (actionId === "horizontal-line") {
      const latestPoint = displayChartData[displayChartData.length - 1];
      if (latestPoint) {
        const newDrawing: Drawing = {
          id: createUiId(),
          type: "horizontal_line",
          points: [{ time: latestPoint.time, value: priceValue }],
          style: {
            color: "#2962ff",
            lineWidth: 2,
            lineStyle: "solid",
            fillColor: "#2962ff",
            fillOpacity: 0.08,
          },
        };
        addDrawing(newDrawing);
        setSelectedDrawingId(newDrawing.id);
      }
      addNotification({
        title: "Niveau tracé",
        message: `Ligne horizontale ajoutée à ${priceLabel}`,
        type: "success",
        iconType: "faCheck",
      });
      closePriceAxisActionMenu();
      return;
    }

    const side = actionId === "sell-limit" ? "sell" : "buy";
    const orderType = actionId === "sell-limit" ? "limit" : actionId === "buy-stop" ? "stop" : "market";

    openPrefilledBrokerFlow({
      symbol: displaySymbolName,
      side,
      orderType,
      triggerPrice: priceValue,
      triggerLabel: priceLabel,
    });

    addNotification({
      title: "Ticket prérempli",
      message: `${side.toUpperCase()} ${displaySymbolName} @ ${priceLabel} ${orderType}`,
      type: "info",
      iconType: "faChartLine",
    });

    closePriceAxisActionMenu();
  }, [
    addDrawing,
    addNotification,
    closePriceAxisActionMenu,
    dispatch,
    displayChartData,
    displaySymbolName,
    openPrefilledBrokerFlow,
    priceAxisActionMenu,
    setSelectedDrawingId,
  ]);

  // Click outside for currency selector
  useEffect(() => {
    if (!isCurrencyOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (currencyBtnRef.current && !currencyBtnRef.current.contains(target) && !target.closest('.gp-currency-dropdown-portal')) {
        setIsCurrencyOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [isCurrencyOpen]);

  useEffect(() => {
    if (!priceAxisActionMenu.isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest(".gp-price-axis-action-menu") || target?.closest(".gp-price-axis-cursor-action")) {
        return;
      }
      closePriceAxisActionMenu();
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [closePriceAxisActionMenu, priceAxisActionMenu.isOpen]);

  useEffect(() => {
    if (!priceAxisActionMenu.isOpen) return;
    const updateMenuPosition = () => {
      const button = cursorPriceActionRef.current;
      const container = fullscreenChartContainerRef.current;
      if (!button || !container) return;
      const nextPos = computePriceAxisMenuPosition(button.getBoundingClientRect(), container.getBoundingClientRect());
      setPriceAxisActionMenu((prev) => (prev.isOpen ? { ...prev, ...nextPos } : prev));
    };
    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    const container = fullscreenChartContainerRef.current;
    const resizeObserver = container ? new ResizeObserver(updateMenuPosition) : null;
    if (container && resizeObserver) {
      resizeObserver.observe(container);
    }
    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      resizeObserver?.disconnect();
    };
  }, [computePriceAxisMenuPosition, priceAxisActionMenu.isOpen, uiState.isZenMode]);

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
    mode: uiState.cursorMode,
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

  // ============================================================================
  // [TENOR 2026 SRE] REACT 18 CONCURRENT DECOUPLING
  // ============================================================================
  // We defer the heavy data arrays passed to the UI components (Sidebar, etc.).
  // This allows React to yield the main thread to the ECharts Canvas renderer,
  // guaranteeing 60 FPS on the chart even if the Sidebar drops a frame.
  const deferredChartData = useDeferredValue(displayChartData);
  const deferredLivePrice = useDeferredValue(convertedLivePrice);
  const deferredLiveChange = useDeferredValue(convertedLiveChange);
  const deferredLiveChangePercent = useDeferredValue(liveChangePercent);
  const deferredLiveVolume = useDeferredValue(liveVolume);
  const deferredLiveSnapshot = useDeferredValue(liveSnapshot);

  // Memoize the overlay content to prevent inline JSX from breaking the Sidebar's React.memo
  const memoizedOverlayContent = useMemo(() => {
    if (!isObjectTreeOpen) return undefined;
    return (
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
        symbolDisplay={`${displaySecurity.ticker} · BRVM, 1D`}
        isMainChartVisible={isMainChartVisible}
        setIsMainChartVisible={setIsMainChartVisible}
      />
    );
  }, [
    isObjectTreeOpen, objectTreeTab, setObjectTreeTab, drawings, selectedDrawingId,
    setSelectedDrawingId, updateDrawing, deleteDrawing, handleClone, handleVisualOrder,
    reorderDrawing, dataWindow, displaySecurity.ticker, isMainChartVisible, setIsMainChartVisible
  ]);

  return (
    <div ref={mainContainerRef} className={clsx("technical-analysis-root", uiState.isZenMode && "is-zen-mode")}>
      <div className={"gp-global-wrapper"}>
        <div className={clsx("page-content-wrapper", "mt-1")}>

          <MemoizedChartToolbar
            userInitials={userInitials}
            displaySymbol={displaySymbolName}
            openTickerSelector={openTickerSelector}
            stopReplay={stopReplay}
          />
          {uiState.comparisonSymbols.map((symbol) => (
            <ComparisonDataWarmup key={symbol} symbol={symbol} mode={dataMode} />
          ))}
          {uiState.comparisonSymbols.length > 0 && (
            <div className="d-flex align-items-center gap-2 px-3 py-1" style={{ background: "rgba(11,24,39,0.55)" }}>
              <span style={{ color: "#9aa4b2", fontSize: "12px" }}>Compare %</span>
              {uiState.comparisonSymbols.map((symbol) => (
                <button
                  key={symbol}
                  className="btn btn-sm btn-outline-light"
                  onClick={() => dispatch(removeComparisonSymbol(symbol))}
                  title={`Retirer ${symbol}`}
                >
                  {symbol} ×
                </button>
              ))}
              <button
                className="btn btn-sm btn-outline-warning"
                onClick={() => dispatch(clearComparisonSymbols())}
                title="Effacer toutes les comparaisons"
              >
                Clear
              </button>
            </div>
          )}

          <div className={clsx("gp-main-layout-container", "gsap-target-main-container")}>

            <div
              ref={sidebarBackdropRef}
              className={"gp-sidebar-backdrop"}
              onClick={handleSidebarBackdropClick}
            />

            <div className={"gp-chart-main-section"}>
              <VerticalDrawingToolbar
                activeTool={activeTool}
                setActiveTool={setActiveTool}
                mainContainerRef={mainContainerRef as React.RefObject<HTMLDivElement>}
                verticalToolbarRef={verticalToolbarRef}
                handleClearAllDrawings={handleClearAllDrawings}
              />

              <div ref={chartViewWrapperRef} className={"gp-chart-view-wrapper"}>
                <div ref={fullscreenChartContainerRef} className={clsx("gp-chart-container", uiState.isZenMode && "zen-mode")} style={{ position: "relative" }}>

                  {uiState.replay.isActive && (
                    <div className={clsx("replay-badge", showReplayFullText ? "is-full" : "is-collapsed")} onClick={() => setShowReplayFullText((prev) => !prev)}>
                      <span className={"replay-dot"} />
                      {showReplayFullText && <div className={"replay-text-wrapper"}><span>Replay</span></div>}
                    </div>
                  )}

                  <div className={"gp-chart-layers-stack"} ref={layersStackRef} style={{ position: "relative", flexGrow: 1, minHeight: 0, overflow: "hidden" }}>
                    <div id="gp-stock-chart" className={clsx("technical-analysis-chart", `cursor-mode-${uiState.cursorMode.split("-")[0]}`)} ref={stockChartRef} style={{ width: "100%", height: "100%", touchAction: "none" }}></div>

                    <canvas ref={cursorCanvasRef} className={"gp-cursor-canvas"} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 10 }} />

                    <canvas
                      ref={drawingCanvasRef}
                      className={"gp-cursor-canvas"}
                      style={{
                        position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
                        pointerEvents: (activeTool || drawings.length > 0) ? "auto" : "none",
                        zIndex: 50,
                        cursor: activeTool ? "crosshair" : "default",
                        clipPath: gridRect ? `polygon(0% ${gridRect.y}px, 100% ${gridRect.y}px, 100% ${gridRect.y + gridRect.height}px, 0% ${gridRect.y + gridRect.height}px)` : 'none',
                        touchAction: "none",
                      }}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerCancel={handlePointerUp}
                      onLostPointerCapture={handlePointerUp}
                      onDoubleClick={handleDoubleClick}
                      onContextMenu={(e) => e.preventDefault()}
                    />

                    <MemoizedTradeHUD convertedLivePrice={convertedLivePrice} setIsBrokerModalOpen={setIsBrokerModalOpen} />

                    <MemoizedCurrencySelector
                      selectedCurrency={selectedCurrency}
                      setSelectedCurrency={setSelectedCurrency}
                      isCurrencyOpen={isCurrencyOpen}
                      setIsCurrencyOpen={setIsCurrencyOpen}
                      currencyQuery={currencyQuery}
                      setCurrencyQuery={setCurrencyQuery}
                      currencyBtnRef={currencyBtnRef}
                      currencyPos={currencyPos}
                      setCurrencyPos={setCurrencyPos}
                    />

                    <MemoizedBrokerModal
                      isBrokerModalOpen={isBrokerModalOpen}
                      setIsBrokerModalOpen={setIsBrokerModalOpen}
                      selectedBroker={selectedBroker}
                      setSelectedBroker={setSelectedBroker}
                      brokerConnectionState={brokerConnectionState}
                      setBrokerConnectionState={setBrokerConnectionState}
                      orderIntent={brokerOrderIntent}
                      setOrderIntent={setBrokerOrderIntent}
                    />

                    <PriceAxisOverlay
                      displaySymbolName={displaySymbolName}
                      convertedLivePrice={convertedLivePrice}
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

                  <MemoizedFooter
                    chartFooterRef={chartFooterRef}
                    selectedTimeRange={uiState.selectedTimeRange}
                    handleTimeRangeSelect={handleTimeRangeSelect}
                    setIsDatePickerModalOpen={handleOpenDatePicker}

                  />
                </div>
              </div>

              {/* [TENOR 2026 SRE] DEFERRED SIDEBAR RENDERING */}
              <MemoizedSidebar
                sidebarRef={sidebarRef}
                security={displaySecurity}
                chartData={deferredChartData}
                livePrice={deferredLivePrice}
                isMarketPositive={isMarketPositive}
                liveChange={deferredLiveChange}
                liveChangePercent={deferredLiveChangePercent}
                lastUpdate={deferredLiveSnapshot?.lastUpdate}
                liveVolume={deferredLiveVolume}
                liveMarketCap={deferredLiveSnapshot?.marketCap}
                liveReturnYTD={deferredLiveSnapshot?.returnYTD}
                livePeRatio={deferredLiveSnapshot?.peRatio}
                currentVolume={currentVolume ?? 0}
                avgVolume={avgVolume ?? 0}
                benefitsChartRef={benefitsChartRef}
                dividendsChartRef={dividendsChartRef}
                isLoading={globalIsLoading}
                dataMode={dataMode}
                isObjectTreeOpen={isObjectTreeOpen}
                onToggleObjectTree={toggleObjectTree}
                overlayContent={memoizedOverlayContent}
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
      <TechnicalAnalysisInner />
      <TickerSelectorModal />
    </TickerSelectorProvider>
  );
};

export default TechnicalAnalysis;
// --- EOF ---
