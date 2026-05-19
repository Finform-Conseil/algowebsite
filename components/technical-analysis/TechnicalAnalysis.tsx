"use client";

import React, {
  useLayoutEffect,
  useEffect,
  useMemo,
  useCallback,
  useState,
  useDeferredValue,
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

// Contexts & UI (Imports Absolus pour garantir la résolution)
import { useTickerSelector } from "@/components/design-system/commons/TickerSelectorModal";


// Redux
import {
  selectChartConfig,
  selectAdvancedIndicators,
  selectIndicatorPeriods,
  selectChartAppearance,
  selectDataMode,
  selectMarketData,
  selectMarketSnapshots,
  removeComparisonSymbol,
  clearComparisonSymbols,
  setActiveLayoutChart,
  setTimeRange,
  setModalOpen,
  setPrefilledAlert,
  selectBollingerSettings,
} from "@/components/technical-analysis/store/technicalAnalysisSlice";
import type { RootState } from "@/core/infrastructure/store";

import toolbarConfig from "@/components/technical-analysis/toolbar-config-antigravity.json";
import { getCompareSeriesColor } from "@/components/technical-analysis/config/compareSeries";
import { Drawing, ToolbarConfig, DisplaySecurity } from "@/components/technical-analysis/config/TechnicalAnalysisTypes";

// Extracted Components
import { ChartToolbar } from "@/components/technical-analysis/components/toolbar/ChartToolbar";
import TechnicalAnalysisSidebar from "@/components/technical-analysis/components/sidebar/TechnicalAnalysisSidebar";
import { TechnicalAnalysisFooter } from "@/components/technical-analysis/components/footer/TechnicalAnalysisFooter";
import { MemoizedCurrencySelector } from "@/components/technical-analysis/components/common/CurrencySelector";
import { BrokerModalProps } from "@/components/technical-analysis/components/modals/BrokerModal";
import { ModalOrchestrator } from "@/components/technical-analysis/components/modals/ModalOrchestrator";
import { ToolbarButton } from "@/components/technical-analysis/components/toolbar/ToolbarButton";
import { VerticalDrawingToolbar } from "@/components/technical-analysis/components/toolbar/VerticalDrawingToolbar";
import { MultiChartLayoutGrid } from "@/components/technical-analysis/components/layout/MultiChartLayoutGrid";

// Hooks & Libs
import { useDrawingManager } from "@/components/technical-analysis/hooks/useDrawingManager";
import { useOverlayRenderer } from "@/components/technical-analysis/hooks/useOverlayRenderer";
import { useLiveMetrics, useComparisonManager } from "@/components/technical-analysis/hooks/MarketData/useMarketData";
import { useEChartsRenderer } from "@/components/technical-analysis/hooks/useEChartsRenderer";
import { useTechnicalAnalysisActions } from "@/components/technical-analysis/hooks/useTechnicalAnalysisActions";
import { useToolbarHandlers } from "@/components/technical-analysis/hooks/useToolbarHandlers";
import { useCursorRenderer } from "@/components/technical-analysis/hooks/useCursorRenderer";
import { useAlertMonitor } from "@/components/technical-analysis/hooks/useAlertMonitor";
import { useFloatingToolbar } from "@/components/technical-analysis/hooks/useFloatingToolbar";
import { useObjectTreePanel } from "@/components/technical-analysis/hooks/useObjectTreePanel";
import { TimeAxisControls } from "@/components/technical-analysis/components/toolbar/TimeAxisControls/TimeAxisControls";
import { PriceAxisOverlay, type PriceAxisActionId } from "@/components/technical-analysis/components/overlays/PriceAxisOverlay";
import { ObjectTreePanel } from "@/components/technical-analysis/components/modals/ObjectTreePanel";
import { useGlobalNotification } from "@/components/design-system/layouts/HeaderHome/context/GlobalNotificationContext";
import { usePriceAxisMenu, formatPriceAxisLabel } from "@/components/technical-analysis/hooks/usePriceAxisMenu";
import { BrokerContext, ChartRefsContext, ChartStateContext, CurrencyContext, DrawingContext, MarketDataContext, TechnicalAnalysisProviderTree } from "./context/TechnicalAnalysisProviders";

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

// ============================================================================
// [TENOR 2026 SRE] STRICT MEMOIZATION SHIELD
// ============================================================================
const MemoizedChartToolbar = React.memo(ChartToolbar);
const MemoizedSidebar = React.memo(TechnicalAnalysisSidebar);
const MemoizedFooter = React.memo(TechnicalAnalysisFooter);
const MemoizedModalOrchestrator = React.memo(ModalOrchestrator);

// ============================================================================
// DYNAMIC IMPORTS & STATIC COMPONENTS
// ============================================================================

const MemoizedBrokerModal = dynamic<BrokerModalProps>(
  () => import("@/components/technical-analysis/components/modals/BrokerModal").then((m) => m.MemoizedBrokerModal),
  { ssr: false, loading: () => null }
);

const TickerSelectorModal = dynamic(
  () => import("@/components/design-system/commons/TickerSelectorModal").then((m) => m.TickerSelectorModal),
  { ssr: false, loading: () => null }
);

const MemoizedPremiumLoader = React.memo(() => (
  <div
    className={"gp-chart-loading-overlay"}
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(10, 21, 31, 0.4)",
      backdropFilter: "blur(4px)",
      zIndex: 100,
    }}
  >
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
// [TENOR 2026 SRE] CONNECTED LEAF COMPONENTS (Zero-Lag Render Bypassing)
// ============================================================================

const ConnectedTradeHUD = React.memo(() => {
  const marketData = useContext(MarketDataContext)!;
  const chartState = useContext(ChartStateContext)!;
  const brokerState = useContext(BrokerContext)!;

  const chartConfig = useSelector(selectChartConfig, shallowEqual);
  const allMarketData = useSelector(selectMarketData, shallowEqual);
  const { selectedTicker } = useTickerSelector();

  const activeSymbol = chartConfig.symbol;
  const isPrimaryActive = !activeSymbol || activeSymbol === selectedTicker?.ticker;

  const activeChartData = useMemo(() => {
    if (isPrimaryActive) return marketData.chartData;
    const cached = allMarketData[activeSymbol];
    return (cached && cached.length > 0) ? cached : marketData.chartData;
  }, [isPrimaryActive, allMarketData, activeSymbol, marketData.chartData]);

  const activeLiveSnapshot = useSelector(
    (state: RootState) => selectMarketSnapshots(state)[activeSymbol] ?? null
  );

  const { convertedLivePrice } = useLiveMetrics(
    activeChartData,
    activeLiveSnapshot,
    chartState.security,
    chartState.effectiveRate
  );

  return <MemoizedTradeHUD convertedLivePrice={convertedLivePrice} setIsBrokerModalOpen={brokerState.setIsBrokerModalOpen} />;
});
ConnectedTradeHUD.displayName = "ConnectedTradeHUD";

const ConnectedSidebar = React.memo(({ isObjectTreeOpen, onToggleObjectTree, overlayContent, openTickerSelector }: any) => {
  const marketData = useContext(MarketDataContext)!;
  const chartState = useContext(ChartStateContext)!;
  const refs = useContext(ChartRefsContext)!;
  const currencyState = useContext(CurrencyContext)!;

  const dataMode = useSelector(selectDataMode);

  const liveSnapshot = useSelector((state: RootState) => selectMarketSnapshots(state)[chartState.security.ticker]);
  const { convertedLivePrice, convertedLiveChange, liveChangePercent, isMarketPositive } = useLiveMetrics(
    marketData.chartData,
    liveSnapshot,
    chartState.security,
    chartState.effectiveRate
  );

  const displaySecurity = useMemo<DisplaySecurity>(
    () => ({
      ...chartState.security,
      currency: currencyState?.selectedCurrency || "XOF",
    }),
    [chartState.security, currencyState?.selectedCurrency]
  );

  const deferredChartData = useDeferredValue(marketData.chartData);

  return (
    <MemoizedSidebar
      sidebarRef={refs.sidebarRef}
      security={displaySecurity}
      chartData={deferredChartData}
      livePrice={convertedLivePrice}
      isMarketPositive={isMarketPositive}
      liveChange={convertedLiveChange}
      liveChangePercent={liveChangePercent}
      lastUpdate={liveSnapshot?.lastUpdate}
      liveVolume={liveSnapshot?.volume || marketData.currentVolume}
      liveMarketCap={liveSnapshot?.marketCap}
      liveReturnYTD={liveSnapshot?.returnYTD}
      livePeRatio={liveSnapshot?.peRatio}
      currentVolume={marketData.currentVolume ?? 0}
      avgVolume={marketData.avgVolume ?? 0}
      benefitsChartRef={refs.benefitsChartRef}
      dividendsChartRef={refs.dividendsChartRef}
      isLoading={chartState.globalIsLoading || marketData.isLoading}
      dataMode={dataMode}
      overlayContent={overlayContent}
      isObjectTreeOpen={isObjectTreeOpen}
      onToggleObjectTree={onToggleObjectTree}
      openTickerSelector={openTickerSelector}
    />
  );
});
ConnectedSidebar.displayName = "ConnectedSidebar";

const ConnectedPriceAxisOverlay = React.memo(() => {
  const marketData = useContext(MarketDataContext)!;
  const chartState = useContext(ChartStateContext)!;
  const refs = useContext(ChartRefsContext)!;
  const drawingManager = useContext(DrawingContext)!;
  const brokerState = useContext(BrokerContext);

  const dispatch = useDispatch();
  const { addNotification } = useGlobalNotification();

  // [TENOR 2026 SRE FIX] SCAR-MULTICHART-BADGE-STALE-DATA:
  // chartState.security.ticker = the primary selectedTicker (e.g. "BOAB", set via search modal).
  // In multi-chart mode, chartConfig.symbol = the TRULY active chart symbol (e.g. "SGBC").
  // We must use chartConfig.symbol to pick the correct market data & live snapshot so the
  // green last-price badge shows the ACTIVE chart's price, not BOAB's price.
  const chartConfig = useSelector(selectChartConfig, shallowEqual);
  const allMarketData = useSelector(selectMarketData, shallowEqual);
  const { selectedTicker } = useTickerSelector();

  const activeSymbol = chartConfig.symbol;
  const isPrimaryActive = !activeSymbol || activeSymbol === selectedTicker?.ticker;

  // Active chart's historical data:
  // - Primary chart: use chartState.displayChartData (freshest, includes live ticks from polling)
  // - Secondary chart: use allMarketData[activeSymbol] (loaded by useComparisonManager when secondary)
  const activeChartData = useMemo(() => {
    if (isPrimaryActive) return marketData.chartData;
    const cached = allMarketData[activeSymbol];
    return (cached && cached.length > 0) ? cached : marketData.chartData;
  }, [isPrimaryActive, allMarketData, activeSymbol, marketData.chartData]);

  // Active chart's live snapshot from the Redux market-snapshot cache.
  const activeLiveSnapshot = useSelector(
    (state: RootState) => selectMarketSnapshots(state)[activeSymbol] ?? null
  );

  const { convertedLastCandleClose, isLastPricePositive, lastCandleTime } = useLiveMetrics(
    activeChartData,
    activeLiveSnapshot,
    chartState.security,   // currency/rate info — all BRVM stocks use XOF, safe to share
    chartState.effectiveRate
  );

  // [TENOR 2026 SRE FIX] SCAR-PRICE-AXIS-MENU-COORD:
  // usePriceAxisMenu's container ref MUST be the same positioned ancestor as the
  // gp-price-axis-overlay (position:absolute; inset:0 → fills gp-chart-layers-stack).
  // Using fullscreenChartContainerRef (gp-chart-container) was wrong in multi-chart
  // mode because gp-chart-layers-stack is offset by the cell position + 27px header.
  // Fix: use layersStackRef so both the calculation and the CSS top/left share the
  // same coordinate origin.
  const { priceAxisActionMenu, closePriceAxisActionMenu, handleAxisPriceActionButtonClick } = usePriceAxisMenu(
    refs.layersStackRef as React.RefObject<HTMLDivElement>,
    refs.cursorPriceActionRef
  );


  const lastPriceTimeLabel = useMemo(() => formatPriceAxisTimeLabel(lastCandleTime), [lastCandleTime]);

  const handlePriceAxisAction = useCallback(
    (actionId: PriceAxisActionId) => {
      const priceLabel = priceAxisActionMenu.priceLabel;
      const priceValue = priceAxisActionMenu.priceValue;

      if (!priceAxisActionMenu.isOpen || !Number.isFinite(priceValue)) return;

      if (actionId === "alert") {
        const latestClose = convertedLastCandleClose;
        const defaultCondition = priceValue >= latestClose ? "GREATER_THAN" : "LESS_THAN";
        dispatch(setPrefilledAlert({ price: priceValue, condition: defaultCondition }));
        dispatch(setModalOpen({ modal: "alerts", isOpen: true }));
        addNotification({
          title: "Alerte préparée",
          message: `${chartState.displaySymbolName} au niveau ${priceLabel}`,
          type: "info",
          iconType: "faBell",
        });
        closePriceAxisActionMenu();
        return;
      }

      if (actionId === "horizontal-line") {
        const latestPoint = marketData.chartData[marketData.chartData.length - 1];
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
          drawingManager.addDrawing(newDrawing);
          drawingManager.setSelectedDrawingId(newDrawing.id);
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

      if (brokerState) {
        brokerState.openPrefilledBrokerFlow({
          symbol: chartState.displaySymbolName,
          side,
          orderType,
          triggerPrice: priceValue,
          triggerLabel: priceLabel,
        });
      }

      addNotification({
        title: "Ticket prérempli",
        message: `${side.toUpperCase()} ${chartState.displaySymbolName} @ ${priceLabel} ${orderType}`,
        type: "info",
        iconType: "faChartLine",
      });

      closePriceAxisActionMenu();
    },
    [
      drawingManager,
      addNotification,
      closePriceAxisActionMenu,
      dispatch,
      marketData.chartData,
      chartState.displaySymbolName,
      convertedLastCandleClose,
      brokerState,
      priceAxisActionMenu,
    ]
  );

  return (
    <PriceAxisOverlay
      displaySymbolName={chartState.displaySymbolName}
      convertedLivePrice={convertedLastCandleClose}
      lastPriceTimeLabel={lastPriceTimeLabel}
      isLastPricePositive={isLastPricePositive}
      cursorPriceBadgeRef={refs.cursorPriceBadgeRef}
      cursorPriceTextRef={refs.cursorPriceTextRef}
      cursorPriceActionRef={refs.cursorPriceActionRef}
      lastPriceBadgeRef={refs.lastPriceBadgeRef}
      lastPriceLineRef={refs.lastPriceLineRef}
      priceAxisActionMenu={priceAxisActionMenu}
      formatPriceAxisLabel={formatPriceAxisLabel}
      handleAxisPriceActionButtonClick={handleAxisPriceActionButtonClick}
      handlePriceAxisAction={handlePriceAxisAction}
    />
  );
});
ConnectedPriceAxisOverlay.displayName = "ConnectedPriceAxisOverlay";

// ============================================================================
// [TENOR 2026 SRE] CHART UI (Layout Shell & Render Orchestration)
// ============================================================================

const ChartUI: React.FC = () => {
  const dispatch = useDispatch();
  
  const refs = useContext(ChartRefsContext)!;
  const marketData = useContext(MarketDataContext)!;
  const chartState = useContext(ChartStateContext)!;
  const drawingManager = useContext(DrawingContext)!;
  const currencyState = useContext(CurrencyContext)!;
  const brokerState = useContext(BrokerContext);

  const { openModal: openTickerSelector, selectedTicker: primaryTicker } = useTickerSelector();
  const { addNotification } = useGlobalNotification();

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
  } = drawingManager;

  const chartConfig = useSelector(selectChartConfig, shallowEqual);
  const advancedIndicators = useSelector(selectAdvancedIndicators, shallowEqual);
  const indicatorPeriods = useSelector(selectIndicatorPeriods, shallowEqual);
  const chartAppearance = useSelector(selectChartAppearance, shallowEqual);
  const bollingerSettings = useSelector(selectBollingerSettings, shallowEqual);
  const isZenMode = useSelector((state: RootState) => state.technicalAnalysis.ui.isZenMode);
  const cursorMode = useSelector((state: RootState) => state.technicalAnalysis.ui.cursorMode);
  const comparisonSymbols = useSelector((state: RootState) => state.technicalAnalysis.ui.comparisonSymbols, shallowEqual);
  const multiChartLayout = useSelector((state: RootState) => state.technicalAnalysis.ui.multiChartLayout, shallowEqual);
  const comparisonMarketData = useSelector(selectMarketData, shallowEqual);
  const selectedTimeRange = useSelector((state: RootState) => state.technicalAnalysis.ui.selectedTimeRange);
  const replayState = useSelector((state: RootState) => state.technicalAnalysis.ui.replay, shallowEqual);
  const dataMode = useSelector(selectDataMode);

  const [showReplayFullText, setShowReplayFullText] = useState(false);

  const { handleSaveAnalysis, handleOpenLoadModal } = useTechnicalAnalysisActions(marketData.setChartData);

  // ============================================================================
  // [TENOR 2026] KEYBOARD SHORTCUTS ENGINE
  // ============================================================================
  const liveSnapshotForShortcuts = useSelector((state: RootState) => selectMarketSnapshots(state)[chartState.security.ticker]);
  const { convertedLastCandleClose } = useLiveMetrics(
    marketData.chartData,
    liveSnapshotForShortcuts,
    chartState.security,
    chartState.effectiveRate
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if inside input/textarea fields
      const activeEl = document.activeElement;
      if (
        activeEl instanceof HTMLElement &&
        (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA" || activeEl.isContentEditable)
      ) {
        return;
      }

      // Check hover price from ECharts overlay ref if available, fallback to last close
      let priceValue = convertedLastCandleClose;
      const hoverBtn = refs.cursorPriceActionRef.current;
      if (hoverBtn && hoverBtn.dataset.price) {
        const val = parseFloat(hoverBtn.dataset.price);
        if (Number.isFinite(val) && val > 0) {
          priceValue = val;
        }
      }

      const priceLabel = priceValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      // Alt + A: Add alert
      if (e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        const latestClose = convertedLastCandleClose;
        const defaultCondition = priceValue >= latestClose ? "GREATER_THAN" : "LESS_THAN";
        dispatch(setPrefilledAlert({ price: priceValue, condition: defaultCondition }));
        dispatch(setModalOpen({ modal: "alerts", isOpen: true }));
        addNotification({
          title: "Alerte préparée",
          message: `${chartState.displaySymbolName} au niveau ${priceLabel}`,
          type: "info",
          iconType: "faBell",
        });
      }

      // Alt + Shift + S: Sell Limit Order
      if (e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (brokerState) {
          brokerState.openPrefilledBrokerFlow({
            symbol: chartState.displaySymbolName,
            side: "sell",
            orderType: "limit",
            triggerPrice: priceValue,
            triggerLabel: priceLabel,
          });
          addNotification({
            title: "Ticket prérempli",
            message: `VENTE ${chartState.displaySymbolName} @ ${priceLabel} limit`,
            type: "info",
            iconType: "faChartLine",
          });
        }
      }

      // Alt + Shift + B: Buy Stop Order (French: Placer un ordre d'achat stop)
      if (e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey && e.key.toLowerCase() === "b") {
        e.preventDefault();
        if (brokerState) {
          brokerState.openPrefilledBrokerFlow({
            symbol: chartState.displaySymbolName,
            side: "buy",
            orderType: "stop",
            triggerPrice: priceValue,
            triggerLabel: priceLabel,
          });
          addNotification({
            title: "Ticket prérempli",
            message: `ACHAT ${chartState.displaySymbolName} @ ${priceLabel} stop`,
            type: "info",
            iconType: "faChartLine",
          });
        }
      }

      // Shift + T: Generic Order (French: Ajouter un ordre générique)
      if (!e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey && e.key.toLowerCase() === "t") {
        e.preventDefault();
        if (brokerState) {
          brokerState.openPrefilledBrokerFlow({
            symbol: chartState.displaySymbolName,
            side: "buy",
            orderType: "limit",
            triggerPrice: priceValue,
            triggerLabel: priceLabel,
          });
          addNotification({
            title: "Ticket prérempli",
            message: `ACHAT ${chartState.displaySymbolName} @ ${priceLabel} limit`,
            type: "info",
            iconType: "faChartLine",
          });
        }
      }

      // Alt + H: Draw horizontal line
      if (e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey && e.key.toLowerCase() === "h") {
        e.preventDefault();
        const latestPoint = marketData.chartData[marketData.chartData.length - 1];
        if (latestPoint) {
          const newDrawing: Drawing = {
            id: createUiId(),
            type: "horizontal_line",
            points: [{ time: latestPoint.time, value: priceValue }],
            style: {
              color: "#3b82f6", // horizontal line with blue styling
              lineWidth: 2,
              lineStyle: "solid",
              fillColor: "#3b82f6",
              fillOpacity: 0.08,
            },
          };
          drawingManager.addDrawing(newDrawing);
          drawingManager.setSelectedDrawingId(newDrawing.id);
          addNotification({
            title: "Niveau tracé",
            message: `Ligne horizontale ajoutée à ${priceLabel}`,
            type: "success",
            iconType: "faCheck",
          });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    convertedLastCandleClose,
    refs.cursorPriceActionRef,
    chartState.displaySymbolName,
    brokerState,
    dispatch,
    addNotification,
    drawingManager,
    marketData.chartData,
  ]);

  const handleTimeRangeSelect = useCallback(
    (range: string) => {
      dispatch(setTimeRange(range));
    },
    [dispatch]
  );

  const {
    isOpen: isObjectTreeOpen,
    activeTab: objectTreeTab,
    togglePanel: toggleObjectTree,
    setActiveTab: setObjectTreeTab,
    dataWindow,
  } = useObjectTreePanel({
    chartInstanceRef: refs.chartInstanceRef as React.RefObject<echarts.ECharts | null>,
    chartData: chartState.displayChartData,
  });

  const selectedDrawing = drawings.find((d: Drawing) => d.id === selectedDrawingId);

  useAlertMonitor({ chartData: chartState.displayChartData, addNotification });
  const layoutSymbols = useMemo(
    () =>
      multiChartLayout.charts
        .map((chart) => chart.symbol)
        .filter((symbol) => symbol && symbol !== chartConfig.symbol),
    [chartConfig.symbol, multiChartLayout.charts]
  );

  const dataRequestSymbols = useMemo(
    () => Array.from(new Set([...comparisonSymbols, ...layoutSymbols])),
    [comparisonSymbols, layoutSymbols]
  );

  const comparisonLoadState = useComparisonManager(dataRequestSymbols, dataMode);

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
    reorderDrawing,
    addDrawing,
    setSelectedDrawingId,
    deleteDrawing,
    addNotification,
    drawingToolbarRef: refs.drawingToolbarRef,
  });

  const { handleColorChange, handleFillChange, handleLineStyleChange, handleTextColorChange } = useToolbarHandlers({
    drawings,
    selectedDrawingId,
    updateDrawing,
    setActiveToolbarPopup,
  });

  // Proxy UI state to avoid re-renders on modal toggles
  const uiStateProxy = useMemo(
    () => ({
      isZenMode,
      isAnonyme: false,
      selectedPseudo: "",
      cursorMode,
      selectedTimeRange,
      isPublishing: false,
      isCapturing: false,
      dataMode,
      comparisonSymbols,
      multiChartLayout,
      searchMode: "replace" as const,
      modals: {} as any,
      replay: replayState,
      isLockedAll: false,
      areDrawingsHidden: false,
    }),
    [isZenMode, cursorMode, selectedTimeRange, dataMode, comparisonSymbols, multiChartLayout, replayState]
  );

  const comparisonSeries = useMemo(
    () =>
      (comparisonSymbols || [])
        .map((symbol) => ({ symbol, data: comparisonMarketData[symbol] ?? [] }))
        .filter((entry) => entry.symbol.length > 0 && entry.data.length > 0),
    [comparisonMarketData, comparisonSymbols]
  );

  const chartInteractionScopeKey = `${multiChartLayout.layoutId}:${multiChartLayout.activeChartId}`;

  const [hiddenObjectIds, setHiddenObjectIds] = useState<Record<string, boolean>>({});

  const handleActivateLayoutChart = useCallback(
    (chartId: string) => dispatch(setActiveLayoutChart(chartId)),
    [dispatch]
  );

  // [TENOR 2026 SRE FIX] SCAR-MULTICHART-DATA-DRIFT:
  // Dynamically compute the active chart's filtered & converted series (activeDisplayChartData).
  // Ensures the active multi-chart cell actually displays the candles & Y-axis of the selected stock
  // (e.g. ETIT @ 30.00) instead of falling back to BOAC's data (~8,600).
  const activeSymbol = chartConfig.symbol;
  const isPrimaryActive = !activeSymbol || activeSymbol === primaryTicker?.ticker;

  const activeRawChartData = useMemo(() => {
    if (isPrimaryActive) return marketData.chartData;
    const cached = comparisonMarketData[activeSymbol];
    return (cached && cached.length > 0) ? cached : marketData.chartData;
  }, [isPrimaryActive, comparisonMarketData, activeSymbol, marketData.chartData]);

  const activeFilteredChartData = useMemo(() => {
    const rawData = activeRawChartData;
    if (rawData.length === 0) return rawData;
    const range = selectedTimeRange;
    if (range === "Tout" || !range) return rawData;

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

    if (!cutoffDate) return rawData;

    const cutoff = cutoffDate.getTime();
    const filtered = rawData.filter((point) => new Date(point.time).getTime() >= cutoff);
    return filtered.length > 0 ? filtered : rawData.slice(-1);
  }, [activeRawChartData, selectedTimeRange]);

  const activeDisplayChartData = useMemo(() => {
    const sourceData = activeFilteredChartData;
    const rate = chartState.effectiveRate;
    if (rate === 1) return sourceData;

    return sourceData.map((p) => ({
      ...p,
      open: p.open * rate,
      high: p.high * rate,
      low: p.low * rate,
      close: p.close * rate,
    }));
  }, [activeFilteredChartData, chartState.effectiveRate]);

  // [TENOR 2026 SRE FIX] SCAR-MULTICHART-BADGE-STALE-DATA:
  // When a secondary chart is active (e.g. SGBC), chartState.displayChartData still has BOAB's data.
  // Use comparisonMarketData[chartConfig.symbol] (pre-loaded when the cell was secondary) so that
  // updateLastPriceAxisBadge calls convertToPixel() with the CORRECT active price — not BOAB's.
  const lastCandle = useMemo(() => {
    const isPrimaryActiveVal = !chartConfig.symbol || chartConfig.symbol === primaryTicker?.ticker;
    if (isPrimaryActiveVal) {
      const d = chartState.displayChartData;
      return d.length > 0 ? d[d.length - 1] : null;
    }
    const activeData = comparisonMarketData[chartConfig.symbol];
    if (activeData && activeData.length > 0) return activeData[activeData.length - 1];
    // Final fallback: primary chart data (layout with only 1 symbol, etc.)
    const d = chartState.displayChartData;
    return d.length > 0 ? d[d.length - 1] : null;
  }, [comparisonMarketData, chartConfig.symbol, chartState.displayChartData, primaryTicker?.ticker]);
  const lightweightLastPrice = lastCandle ? lastCandle.close : 0;

  // [TENOR 2026 FIX] Centralized Render Hooks
  useEChartsRenderer({
    stockChartRef: refs.stockChartRef,
    // [TENOR 2026 SRE FIX] SCAR-MULTICHART-EVENT-SCOPE: pass stable layers-stack ref
    layersStackRef: refs.layersStackRef as React.RefObject<HTMLDivElement | null>,
    chartInstanceRef: refs.chartInstanceRef,
    chartData: activeDisplayChartData,
    chartConfig,
    advancedIndicators,
    indicatorPeriods,
    bollingerSettings,
    chartAppearance,
    uiState: uiStateProxy,
    displaySymbol: activeSymbol || chartState.displaySymbolName,
    lastZoomRangeRef: refs.lastZoomRangeRef,
    cursorPriceBadgeRef: refs.cursorPriceBadgeRef,
    cursorPriceTextRef: refs.cursorPriceTextRef,
    cursorPriceActionRef: refs.cursorPriceActionRef,
    lastPriceBadgeRef: refs.lastPriceBadgeRef,
    lastPriceLineRef: refs.lastPriceLineRef,
    lastPriceAxisValue: lightweightLastPrice,
    isMainChartVisible: chartState.isMainChartVisible,
    comparisonSeries,
    hiddenObjectIds,
  });

  useOverlayRenderer({
    selectedDrawingId,
    drawings,
    chartInstanceRef: refs.chartInstanceRef,
    drawingCanvasRef: refs.drawingCanvasRef,
    drawingToolbarRef: refs.drawingToolbarRef,
    drawingTooltipRef: refs.drawingTooltipRef,
    gridRect,
    toolbarOffsetRef,
    chartData: activeDisplayChartData,
    interactionScopeKey: chartInteractionScopeKey,
  });

  useCursorRenderer({
    canvasRef: refs.cursorCanvasRef,
    containerRef: refs.layersStackRef,
    mode: cursorMode,
    chartRef: refs.chartInstanceRef as React.RefObject<echarts.ECharts>,
    chartData: activeDisplayChartData,
    interactionScopeKey: chartInteractionScopeKey,
  });

  const setIsDrawingSettingsModalOpen = useCallback(
    (val: boolean) => dispatch(setModalOpen({ modal: "drawingSettings", isOpen: val })),
    [dispatch]
  );

  const setIsAlertModalOpen = useCallback(
    (val: boolean) => dispatch(setModalOpen({ modal: "alerts", isOpen: val })),
    [dispatch]
  );

  const handleOpenDatePicker = useCallback(
    (isOpen: boolean) => dispatch(setModalOpen({ modal: "datePicker", isOpen })),
    [dispatch]
  );

  useLayoutEffect(() => {
    if (!refs.mainContainerRef.current) return;
    animate(refs.mainContainerRef.current, { opacity: [0.95, 1] }, { duration: 0.15, ease: "easeOut" });
  }, [refs.mainContainerRef]);

  useLayoutEffect(() => {
    const sidebar = refs.sidebarRef.current;
    if (isObjectTreeOpen && sidebar && sidebar.classList.contains("sidebar-closed")) {
      sidebar.style.visibility = "visible";
      animate(sidebar, { opacity: 1, x: "0%" }, { duration: 0.2, ease: "easeOut" });
      sidebar.classList.remove("sidebar-closed");
    }
  }, [isObjectTreeOpen, refs.sidebarRef]);

  const updateSidebarState = useCallback(() => {
    const sidebarToggle = refs.sidebarToggleRef.current;
    const sidebar = refs.sidebarRef.current;
    const chartFooter = refs.chartFooterRef.current;
    const verticalToolbar = refs.verticalToolbarRef.current;

    if (!sidebarToggle || !sidebar) return;

    const isClosed = sidebar.classList.contains("sidebar-closed");
    sidebarToggle.classList.toggle("flipped", isClosed);

    const isSmall = window.matchMedia("(max-width: 575.98px)").matches;
    const isMedium = window.matchMedia("(max-width: 820px)").matches;

    if (chartFooter && verticalToolbar) {
      verticalToolbar.style.display = "flex";
      if (refs.chartViewWrapperRef.current) refs.chartViewWrapperRef.current.style.display = "flex";

      if (isSmall) chartFooter.style.display = "none";
      else if (isMedium) chartFooter.style.display = isClosed ? "flex" : "none";
      else chartFooter.style.display = "flex";
    }
  }, [refs]);

  const handleSidebarBackdropClick = useCallback(() => {
    const sidebar = refs.sidebarRef.current;
    if (sidebar) {
      animate(
        sidebar,
        { opacity: 0, x: "100%" },
        {
          duration: 0.2,
          ease: "easeIn",
          onComplete: () => {
            sidebar.style.visibility = "hidden";
          },
        }
      );
      sidebar.classList.add("sidebar-closed");
      updateSidebarState();
    }
  }, [updateSidebarState, refs.sidebarRef]);

  useLayoutEffect(() => {
    const sidebarToggle = refs.sidebarToggleRef.current;
    const sidebar = refs.sidebarRef.current;
    if (!sidebarToggle || !sidebar) return;

    const initialSetup = () => updateSidebarState();
    const handleToggleClick = () => {
      const root = refs.mainContainerRef.current;
      const sidebar = refs.sidebarRef.current;
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
  }, [updateSidebarState, refs]);

  return (
    <div ref={refs.mainContainerRef} className={clsx("technical-analysis-root", isZenMode && "is-zen-mode")}>
      <div className={"gp-global-wrapper"}>
        <div className={clsx("page-content-wrapper", "mt-1")}>
          <MemoizedChartToolbar
            userInitials={chartState.userInitials}
            displaySymbol={chartState.displaySymbolName}
            openTickerSelector={openTickerSelector}
            stopReplay={marketData.stopReplay}
          />

          {comparisonSymbols.length > 0 && (
            <div className="d-flex align-items-center gap-2 px-3 py-1" style={{ background: "rgba(11,24,39,0.55)" }}>
              <span style={{ color: "#9aa4b2", fontSize: "12px" }}>Compare %</span>
              {comparisonSymbols.map((symbol, index) => {
                const compareColor = getCompareSeriesColor(index);
                return (
                <button
                  key={symbol}
                  className="btn btn-sm"
                  onClick={() => dispatch(removeComparisonSymbol(symbol))}
                  title={`Retirer ${symbol}`}
                  style={{
                    alignItems: "center",
                    background: `${compareColor}1f`,
                    border: `1px solid ${compareColor}`,
                    borderRadius: "6px",
                    color: "#ffffff",
                    display: "inline-flex",
                    fontWeight: 700,
                    gap: "6px",
                    minHeight: "32px",
                    padding: "4px 12px",
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      background: compareColor,
                      borderRadius: "3px",
                      display: "inline-block",
                      height: "10px",
                      width: "10px",
                    }}
                  />
                  {symbol} ×
                </button>
                );
              })}
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
            <div ref={refs.sidebarBackdropRef} className={"gp-sidebar-backdrop"} onClick={handleSidebarBackdropClick} />

            <div className={"gp-chart-main-section"}>
              <VerticalDrawingToolbar
                activeTool={activeTool}
                setActiveTool={setActiveTool}
                mainContainerRef={refs.mainContainerRef as React.RefObject<HTMLDivElement>}
                verticalToolbarRef={refs.verticalToolbarRef}
                handleClearAllDrawings={handleClearAllDrawings}
              />

              <div ref={refs.chartViewWrapperRef} className={"gp-chart-view-wrapper"}>
                <div
                  ref={refs.fullscreenChartContainerRef}
                  className={clsx("gp-chart-container", isZenMode && "zen-mode")}
                  style={{ position: "relative" }}
                >
                  {replayState.isActive && (
                    <div
                      className={clsx("replay-badge", showReplayFullText ? "is-full" : "is-collapsed")}
                      onClick={() => setShowReplayFullText((prev) => !prev)}
                    >
                      <span className={"replay-dot"} />
                      {showReplayFullText && (
                        <div className={"replay-text-wrapper"}>
                          <span>Replay</span>
                        </div>
                      )}
                    </div>
                  )}

                  <MultiChartLayoutGrid
                    layout={multiChartLayout}
                    marketData={comparisonMarketData}
                    dataLoadState={comparisonLoadState}
                    dataMode={dataMode}
                    activeChartInstanceRef={refs.chartInstanceRef}
                    activeChartData={chartState.displayChartData}
                    activeSymbol={chartConfig.symbol}
                    activeInterval={chartConfig.timeframe}
                    onActivateChart={handleActivateLayoutChart}
                  >
                    <div
                      key={chartInteractionScopeKey}
                      className={"gp-chart-layers-stack"}
                      ref={refs.layersStackRef}
                      style={{ position: "relative", flexGrow: 1, minHeight: 0, overflow: "hidden" }}
                    >
                      <div
                        id="gp-stock-chart"
                        className={clsx("technical-analysis-chart", `cursor-mode-${cursorMode.split("-")[0]}`)}
                        ref={refs.stockChartRef}
                        style={{ width: "100%", height: "100%", touchAction: "none" }}
                      ></div>

                      <canvas
                        ref={refs.cursorCanvasRef}
                        className={"gp-cursor-canvas"}
                        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 10 }}
                      />

                      <canvas
                        ref={refs.drawingCanvasRef}
                        className={"gp-cursor-canvas gp-drawing-canvas"}
                        data-drawing-interaction={activeTool ? "tool" : cursorMode === "eraser" ? "eraser" : drawings.length > 0 ? "selection" : "inactive"}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          pointerEvents: activeTool || drawings.length > 0 ? "auto" : "none",
                          zIndex: 50,
                          cursor: activeTool ? "crosshair" : "default",
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

                    <ConnectedTradeHUD />

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

                    <ConnectedPriceAxisOverlay />

                    <TimeAxisControls chartInstanceRef={refs.chartInstanceRef} />

                    {chartState.globalIsLoading && <MemoizedPremiumLoader />}

                    <div
                      className="gp-drawing-overlay-shield"
                      style={{
                        position: "absolute",
                        top: gridRect ? gridRect.y : 30,
                        left: gridRect ? gridRect.x : 15,
                        width: gridRect ? gridRect.width : 800,
                        height: gridRect ? gridRect.height : 600,
                        pointerEvents: "none",
                        overflow: "hidden",
                        clipPath: "inset(0)",
                        zIndex: 60,
                      }}
                    >
                      <div
                        ref={refs.drawingToolbarRef}
                        className="gp-drawing-quick-toolbar-box"
                        onPointerDown={handleToolbarDragStart}
                        style={{
                          display: "none",
                          position: "absolute",
                          transform: "translate(-50%, -100%)",
                          backgroundColor: "rgba(16, 42, 67, 0.95)",
                          backdropFilter: "blur(10px)",
                          borderRadius: "6px",
                          padding: "6px 8px",
                          zIndex: 1000,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: "4px",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                          pointerEvents: "auto",
                          cursor: "default",
                          touchAction: "none",
                        }}
                      >
                        {selectedDrawing?.type &&
                          (toolbarConfig as unknown as ToolbarConfig).drawings[selectedDrawing.type]?.toolbar.map(
                            (btnId: string) => (
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
                                setActiveDrawingSettingsTab={() => {}}
                                setIsAlertModalOpen={setIsAlertModalOpen}
                                setActiveAlertTab={() => {}}
                                handleLockToggle={handleLockToggle}
                                handleClone={handleClone}
                                handleVisualOrder={handleVisualOrder}
                                toolbarConfig={toolbarConfig as unknown as ToolbarConfig}
                              />
                            )
                          )}
                      </div>

                      <div
                        ref={refs.drawingTooltipRef}
                        style={{
                          position: "absolute",
                          display: "none",
                          zIndex: 101,
                          backgroundColor: "rgba(15, 23, 42, 0.9)",
                          backdropFilter: "blur(4px)",
                          padding: "4px 6px",
                          borderRadius: "4px",
                          color: "#e2e8f0",
                          fontSize: "10px",
                          fontWeight: 500,
                          fontFamily: "Inter, sans-serif",
                          whiteSpace: "pre-line",
                          pointerEvents: "none",
                          border: "1px solid rgba(255,255,255,0.1)",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                          lineHeight: "1.2",
                        }}
                      />
                    </div>
                    </div>
                  </MultiChartLayoutGrid>
                </div>

                <MemoizedFooter
                  chartFooterRef={refs.chartFooterRef}
                  selectedTimeRange={selectedTimeRange}
                  handleTimeRangeSelect={handleTimeRangeSelect}
                  setIsDatePickerModalOpen={handleOpenDatePicker}
                />
              </div>
            </div>

            <div style={{ position: "relative", display: "flex", flexShrink: 0 }}>
              <ConnectedSidebar
                isObjectTreeOpen={isObjectTreeOpen}
                onToggleObjectTree={toggleObjectTree}
                openTickerSelector={openTickerSelector}
                overlayContent={
                  isObjectTreeOpen ? (
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
                      dataWindow={dataWindow}
                      symbolDisplay={`${chartState.displaySymbolName} · BRVM, 1D`}
                      isMainChartVisible={chartState.isMainChartVisible}
                      setIsMainChartVisible={chartState.setIsMainChartVisible}
                      chartConfig={chartConfig}
                      chartAppearance={chartAppearance}
                      advancedIndicators={advancedIndicators}
                      activeTool={activeTool}
                      hiddenObjectIds={hiddenObjectIds}
                      setHiddenObjectIds={setHiddenObjectIds}
                    />
                  ) : null
                }
              />
            </div>
          </div>
        </div>

        <button
          ref={refs.sidebarToggleRef}
          id="gp-sidebar-toggle"
          className={"gp-sidebar-toggle-btn"}
          title="Basculer la barre latérale"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 6 l6 6 l-6 6" />
          </svg>
        </button>
      </div>

      <MemoizedModalOrchestrator
        dr={selectedDrawing}
        updateDrawing={updateDrawing}
        startReplay={marketData.startReplay}
        setChartData={marketData.setChartData}
      />
    </div>
  );
};

// ============================================================================
// ROOT COMPONENT
// ============================================================================

const TechnicalAnalysis: React.FC = () => {
  return (
    <TechnicalAnalysisProviderTree>
      <ChartUI />
    </TechnicalAnalysisProviderTree>
  );
};

export default TechnicalAnalysis;

// --- EOF ---
