"use client";

import React, {
  useLayoutEffect,
  useEffect,
  useMemo,
  useCallback,
  useState,
  useDeferredValue,
} from "react";
import dynamic from "next/dynamic";
import {
  useDispatch,
  useSelector,
  shallowEqual } from "react-redux";
import clsx from "clsx";

// Contexts & UI (Imports Absolus pour garantir la résolution)
import { useTickerSelector } from "@/components/design-system/commons/TickerSelectorModal";
import { BRVM_SECURITIES } from "@/core/data/brvm-securities";


// Redux
import {
  removeComparisonSymbol,
  clearComparisonSymbols,
  setActiveLayoutChart,
  setEditChartTarget,
  setTimeRange,
  setModalOpen,
  setPrefilledAlert,
  setSymbol,
  updateLayoutChart,
  setPineChartOverlay,
  clearPineChartOverlay,
} from "@/components/technical-analysis/store/technicalAnalysisSlice";
import {
  selectChartConfig,
  selectAdvancedIndicators,
  selectIndicatorPeriods,
  selectChartAppearance,
  selectDataMode,
  selectModals,
  selectMarketData,
  selectMarketSnapshots,
  selectBollingerSettings,
  selectPineChartOverlay,
} from "@/components/technical-analysis/store/selectors";
import type { RootState } from "@/core/infrastructure/store";
import type { EChartsInstance } from "@/components/technical-analysis/lib/types/echarts";

import toolbarConfig from "@/components/technical-analysis/toolbar-config-antigravity.json";
import { resolveDrawingToolbarType } from "@/components/technical-analysis/lib/drawingToolbarResolution";
import {
  getCompareSeriesColor,
  normalizeCompareSymbol,
  resolveCompareSeriesSettings,
} from "@/components/technical-analysis/config/compare-series/compareSeries";
import { normalizeMovingAverageTrendSignals } from "@/components/technical-analysis/config/indicators/movingAverageSeries";
import { normalizePriceVsSmaMetrics } from "@/components/technical-analysis/config/indicators/priceVsSmaMetrics";
import { normalizePriceVsEmaMetrics } from "@/components/technical-analysis/config/indicators/priceVsEmaMetrics";
import { revealHiddenObjectIds, type IndicatorObjectId } from "@/components/technical-analysis/config/object-tree/indicatorObjectVisibility";
import type { Drawing } from "./config/drawing/drawingModelTypes";
import type { ToolbarConfig } from "./config/drawing/drawingToolbarTypes";
import type { DisplaySecurity } from "./config/market/marketSnapshotTypes";
import type { PineChartOverlayPayload } from "./components/sidebar/panels/pineEditor/pineTypes";

// Extracted Components
import { ChartToolbar } from "@/components/technical-analysis/components/toolbar/ChartToolbar";
import { TechnicalAnalysisFooter } from "@/components/technical-analysis/components/footer/TechnicalAnalysisFooter";
import { MemoizedCurrencySelector } from "@/components/technical-analysis/components/market/CurrencySelector";
import type { BrokerModalProps } from "@/components/technical-analysis/components/modals/broker/BrokerModal";
import type { ModalOrchestratorProps } from "@/components/technical-analysis/components/modals/orchestration/ModalOrchestrator";
import type { ObjectTreePanelProps } from "@/components/technical-analysis/components/panels/object-tree/ObjectTreePanel";
import type { CompareSeriesSettingsModalProps } from "@/components/technical-analysis/components/modals/compare/CompareSeriesSettingsModal";
import { TimeAxisControls } from "@/components/technical-analysis/components/toolbar/time-axis/TimeAxisControls";
import TechnicalAnalysisSidebar, { type TechnicalAnalysisSidebarProps } from "@/components/technical-analysis/components/sidebar/TechnicalAnalysisSidebar";
import { ToolbarButton } from "@/components/technical-analysis/components/toolbar/floating/ToolbarButton";
import { InlineTextEditor } from "@/components/technical-analysis/components/toolbar/floating/InlineTextEditor";
import { VerticalDrawingToolbar } from "@/components/technical-analysis/components/toolbar/VerticalDrawingToolbar";
import { MultiChartLayoutGrid } from "@/components/technical-analysis/components/layout/MultiChartLayoutGrid";

// Hooks & Libs
import { useDrawingManager } from "@/components/technical-analysis/hooks/useDrawingManager";
import { useLiveMetrics, useComparisonManager } from "@/components/technical-analysis/hooks/MarketData/useMarketData";
import { useTechnicalAnalysisActions } from "@/components/technical-analysis/hooks/useTechnicalAnalysisActions";
import { useToolbarHandlers } from "@/components/technical-analysis/hooks/useToolbarHandlers";
import { useFloatingToolbar } from "@/components/technical-analysis/hooks/useFloatingToolbar";
import { useObjectTreePanel } from "@/components/technical-analysis/hooks/useObjectTreePanel";
import { PriceAxisOverlay, type PriceAxisActionId } from "@/components/technical-analysis/components/overlays/PriceAxisOverlay";
import { ChartRenderEngine } from "@/components/technical-analysis/components/chart/ChartRenderEngine";
import { useGlobalNotification } from "@/components/design-system/layouts/HeaderHome/context/GlobalNotificationContext";
import { usePriceAxisMenu, formatPriceAxisLabel } from "@/components/technical-analysis/hooks/usePriceAxisMenu";
import {
  TechnicalAnalysisProviderTree,
  useBrokerContext,
  useChartRefsContext,
  useChartStateContext,
  useCurrencyContext,
  useDrawingContext,
  useMarketDataContext,
} from "./context/TechnicalAnalysisProviders";
import { getBrvmPriceAxisCountdown } from "./utils/brvmMarketSession";

// ============================================================================
// [TENOR 2026 SRE] STRICT MEMOIZATION SHIELD
// ============================================================================
const MemoizedChartToolbar = React.memo(ChartToolbar);
const MemoizedFooter = React.memo(TechnicalAnalysisFooter);

// ============================================================================
// DYNAMIC IMPORTS & STATIC COMPONENTS
// ============================================================================

const MemoizedBrokerModal = dynamic<BrokerModalProps>(
  () => import("@/components/technical-analysis/components/modals/broker/BrokerModal").then((m) => m.MemoizedBrokerModal),
  { ssr: false, loading: () => null }
);

const TickerSelectorModal = dynamic(
  () => import("@/components/design-system/commons/TickerSelectorModal").then((m) => m.TickerSelectorModal),
  { ssr: false, loading: () => null }
);

const MemoizedSidebar = React.memo(TechnicalAnalysisSidebar);

const LazyModalOrchestrator = dynamic<ModalOrchestratorProps>(
  () => import("@/components/technical-analysis/components/modals/orchestration/ModalOrchestrator").then((m) => m.ModalOrchestrator),
  { ssr: false, loading: () => null }
);

const LazyObjectTreePanel = dynamic<ObjectTreePanelProps>(
  () => import("@/components/technical-analysis/components/panels/object-tree/ObjectTreePanel").then((m) => m.ObjectTreePanel),
  { ssr: false, loading: () => null }
);

const LazyCompareSeriesSettingsModal = dynamic<CompareSeriesSettingsModalProps>(
  () => import("@/components/technical-analysis/components/modals/compare/CompareSeriesSettingsModal").then((m) => m.CompareSeriesSettingsModal),
  { ssr: false, loading: () => null }
);

const MemoizedModalOrchestrator = React.memo(LazyModalOrchestrator);


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
  isCurrencyRateUnavailable: boolean;
  setIsBrokerModalOpen: (val: boolean) => void;
}

const MemoizedTradeHUD = React.memo(({ convertedLivePrice, isCurrencyRateUnavailable, setIsBrokerModalOpen }: TradeHUDProps) => {
  const spread = convertedLivePrice > 1000 ? 1 : 0.01;
  const priceLabel = isCurrencyRateUnavailable
    ? "Rate unavailable"
    : convertedLivePrice.toLocaleString("fr-FR", { minimumFractionDigits: 2 });
  const buyLabel = isCurrencyRateUnavailable
    ? "Rate unavailable"
    : (convertedLivePrice + spread).toLocaleString("fr-FR", { minimumFractionDigits: 2 });
  const handleBrokerClick = () => {
    if (!isCurrencyRateUnavailable) setIsBrokerModalOpen(true);
  };

  return (
    <div className="gp-trade-btn-container">
      <div className={clsx("gp-trade-btn sell", isCurrencyRateUnavailable && "disabled")} onClick={handleBrokerClick} aria-disabled={isCurrencyRateUnavailable}>
        <span className="price">{priceLabel}</span>
        <span className="label">SELL</span>
      </div>
      <div className="gp-trade-spread">{isCurrencyRateUnavailable ? "--" : spread}</div>
      <div className={clsx("gp-trade-btn buy", isCurrencyRateUnavailable && "disabled")} onClick={handleBrokerClick} aria-disabled={isCurrencyRateUnavailable}>
        <span className="price">{buyLabel}</span>
        <span className="label">BUY</span>
      </div>
    </div>
  );
});
MemoizedTradeHUD.displayName = "MemoizedTradeHUD";

const isDailyOrHigherTimeframe = (timeframe?: string | null): boolean => {
  const value = timeframe?.trim();
  if (!value) return true;

  const unit = value.slice(-1);
  if (unit === "m" || unit === "s" || unit === "h" || unit === "H") return false;
  return unit === "D" || unit === "d" || unit === "W" || unit === "w" || unit === "M" || unit === "Y" || unit === "y";
};

const getPriceAxisClockIntervalMs = (): number => 1_000;

const getLayoutViewportHeight = (): number => {
  const height = document.documentElement?.clientHeight || window.innerHeight;

  return Number.isFinite(height) && height > 0 ? height : window.innerHeight;
};

const formatPriceAxisTimeLabel = (
  value?: string | number | null,
  options: { timeframe?: string | null } = {}
): string => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  if (isDailyOrHigherTimeframe(options.timeframe)) {
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" });
  }

  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
};

const formatPriceAxisFreshnessLabel = (value?: string | number | null): string | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const createUiId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `price-axis-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

// ============================================================================
// [TENOR 2026 SRE] CONNECTED LEAF COMPONENTS (Zero-Lag Render Bypassing)
// ============================================================================

const ConnectedTradeHUD = React.memo(() => {
  const marketData = useMarketDataContext();
  const chartState = useChartStateContext();
  const brokerState = useBrokerContext();

  const chartConfig = useSelector(selectChartConfig, shallowEqual);
  const allMarketData = useSelector(selectMarketData, shallowEqual);
  const { selectedTicker } = useTickerSelector();

  const activeSymbol = chartConfig.symbol;
  const isPrimaryActive = !activeSymbol || activeSymbol === selectedTicker?.ticker;

  const activeChartData = useMemo(() => {
    if (isPrimaryActive) return chartState.displayChartData;
    const cached = allMarketData[activeSymbol];
    return (cached && cached.length > 0) ? cached : marketData.chartData;
  }, [isPrimaryActive, allMarketData, activeSymbol, chartState.displayChartData, marketData.chartData]);

  const activeLiveSnapshot = useSelector(
    (state: RootState) => selectMarketSnapshots(state)[activeSymbol] ?? null
  );

  const { convertedLivePrice } = useLiveMetrics(
    activeChartData,
    activeLiveSnapshot,
    chartState.security,
    chartState.effectiveRate
  );

  return (
    <MemoizedTradeHUD
      convertedLivePrice={convertedLivePrice}
      isCurrencyRateUnavailable={chartState.isCurrencyRateUnavailable}
      setIsBrokerModalOpen={brokerState.setIsBrokerModalOpen}
    />
  );
});
ConnectedTradeHUD.displayName = "ConnectedTradeHUD";

const ConnectedSidebar = React.memo(({ isObjectTreeOpen, onPineOverlayAttach, onPineOverlayClear, onToggleObjectTree, overlayContent, openTickerSelector }: { isObjectTreeOpen: boolean; onPineOverlayAttach?: (overlay: PineChartOverlayPayload | null) => void; onPineOverlayClear?: () => void; onToggleObjectTree?: () => void; overlayContent?: React.ReactNode; openTickerSelector?: () => void }) => {
  const marketData = useMarketDataContext();
  const chartState = useChartStateContext();
  const refs = useChartRefsContext();
  const dataMode = useSelector(selectDataMode);

  const liveSnapshot = useSelector((state: RootState) => selectMarketSnapshots(state)[chartState.security.ticker]);
  const { convertedLivePrice, convertedLiveChange, liveChangePercent, isMarketPositive } = useLiveMetrics(
    chartState.displayChartData,
    liveSnapshot,
    chartState.security,
    chartState.effectiveRate
  );

  const displaySecurity = useMemo<DisplaySecurity>(
    () => ({
      ...chartState.security,
      currency: chartState.currencyDisplayLabel,
    }),
    [chartState.security, chartState.currencyDisplayLabel]
  );

  const deferredChartData = useDeferredValue(chartState.displayChartData);

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
      marketSourceLabel={liveSnapshot?.sourceLabel}
      marketSourceStatus={liveSnapshot?.sourceStatus}
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
      onPineOverlayAttach={onPineOverlayAttach}
      onPineOverlayClear={onPineOverlayClear}
    />
  );
});
ConnectedSidebar.displayName = "ConnectedSidebar";

const ConnectedPriceAxisOverlay = React.memo(() => {
  const marketData = useMarketDataContext();
  const chartState = useChartStateContext();
  const refs = useChartRefsContext();
  const drawingManager = useDrawingContext();
  const brokerState = useBrokerContext();

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
    if (isPrimaryActive) return chartState.displayChartData;
    const cached = allMarketData[activeSymbol];
    return (cached && cached.length > 0) ? cached : marketData.chartData;
  }, [isPrimaryActive, allMarketData, activeSymbol, chartState.displayChartData, marketData.chartData]);

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

  const [priceAxisClockNow, setPriceAxisClockNow] = useState<number | null>(null);

  useEffect(() => {
    const syncClock = () => setPriceAxisClockNow(Date.now());
    const intervalId = window.setInterval(syncClock, getPriceAxisClockIntervalMs());
    document.addEventListener("visibilitychange", syncClock);
    syncClock();

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", syncClock);
    };
  }, []);

  const lastPriceTimeSource = lastCandleTime ?? activeLiveSnapshot?.lastUpdate;
  const priceAxisCountdown = useMemo(
    () => priceAxisClockNow === null ? null : getBrvmPriceAxisCountdown(chartConfig.timeframe, priceAxisClockNow),
    [chartConfig.timeframe, priceAxisClockNow]
  );
  const lastPriceTimeLabel = useMemo(
    () => priceAxisClockNow === null ? "--:--:--" : priceAxisCountdown?.label ?? formatPriceAxisTimeLabel(lastPriceTimeSource, {
      timeframe: chartConfig.timeframe,
    }),
    [chartConfig.timeframe, lastPriceTimeSource, priceAxisClockNow, priceAxisCountdown?.label]
  );
  const lastPriceDisplayLabel = chartState.isCurrencyRateUnavailable
    ? "Rate unavailable"
    : formatPriceAxisLabel(convertedLastCandleClose);

  const lastPriceAccessibleLabel = useMemo(() => {
    const updateLabel = formatPriceAxisFreshnessLabel(activeLiveSnapshot?.lastUpdate);
    const parts = [
      `${chartState.displaySymbolName}`,
      `dernier prix ${lastPriceDisplayLabel}`,
      priceAxisClockNow === null
        ? "horloge marché en initialisation"
        : priceAxisCountdown ? `${priceAxisCountdown.accessibilityLabel} ${lastPriceTimeLabel}` : `bougie ${lastPriceTimeLabel}`,
    ];
    if (updateLabel) parts.push(`dernière donnée reçue ${updateLabel}`);
    return parts.join(", ");
  }, [
    activeLiveSnapshot?.lastUpdate,
    chartState.displaySymbolName,
    lastPriceDisplayLabel,
    lastPriceTimeLabel,
    priceAxisClockNow,
    priceAxisCountdown,
  ]);

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
      lastPriceDisplayLabel={lastPriceDisplayLabel}
      lastPriceTimeLabel={lastPriceTimeLabel}
      lastPriceAccessibleLabel={lastPriceAccessibleLabel}
      isLastPricePositive={isLastPricePositive}
      cursorPriceBadgeRef={refs.cursorPriceBadgeRef}
      cursorPriceTextRef={refs.cursorPriceTextRef}
      cursorPriceActionRef={refs.cursorPriceActionRef}
      lastPriceBadgeRef={refs.lastPriceBadgeRef}
      lastPriceLineRef={refs.lastPriceLineRef}
      priceAxisActionMenu={priceAxisActionMenu}
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

  const refs = useChartRefsContext();
  const marketData = useMarketDataContext();
  const chartState = useChartStateContext();
  const drawingManager = useDrawingContext();
  const currencyState = useCurrencyContext();
  const brokerState = useBrokerContext();

  const { openModal: openTickerSelector, selectedTicker: primaryTicker, setSelectedTicker } = useTickerSelector();
  const { addNotification } = useGlobalNotification();
  const pineChartOverlay = useSelector(selectPineChartOverlay);
  const dispatchPineOverlay = useCallback((overlay: PineChartOverlayPayload | null) => {
    dispatch(setPineChartOverlay(overlay));
  }, [dispatch]);
  const clearPineOverlay = useCallback(() => {
    dispatch(clearPineChartOverlay());
  }, [dispatch]);

  // ============================================================================
  // [TENOR 2026] BIDIRECTIONAL TICKER & REDUX SYNC ENGINE (LOOP-FREE SHIELD)
  // ============================================================================
  const reduxSymbol = useSelector((state: RootState) => state.technicalAnalysis.chartConfig.symbol);
  const activeChartId = useSelector((state: RootState) => state.technicalAnalysis.ui.multiChartLayout.activeChartId);

  const prevReduxSymbol = React.useRef<string>("");
  const prevContextSymbol = React.useRef<string>("");

  useEffect(() => {
    const contextSymbol = primaryTicker?.ticker || "";

    // On mount, initialize the refs to avoid initial synchronization noise
    if (!prevReduxSymbol.current && !prevContextSymbol.current) {
      prevReduxSymbol.current = reduxSymbol;
      prevContextSymbol.current = contextSymbol;
      return;
    }

    const reduxChanged = reduxSymbol !== prevReduxSymbol.current;
    const contextChanged = contextSymbol !== prevContextSymbol.current;

    if (reduxChanged && reduxSymbol) {
      // Redux is the initiator (e.g. user clicked a secondary chart cell or preset)
      prevReduxSymbol.current = reduxSymbol;
      if (reduxSymbol !== contextSymbol) {
        prevContextSymbol.current = reduxSymbol; // speculative sync to prevent feedback loop
        const targetSec = BRVM_SECURITIES.find((s) => s.ticker === reduxSymbol);
        if (targetSec) {
          setSelectedTicker(targetSec);
        }
      }
    } else if (contextChanged && contextSymbol) {
      // Context is the initiator (e.g. user searched a ticker in the search modal)
      prevContextSymbol.current = contextSymbol;
      if (contextSymbol !== reduxSymbol) {
        prevReduxSymbol.current = contextSymbol; // speculative sync to prevent feedback loop
        if (activeChartId) {
          dispatch(updateLayoutChart({ chartId: activeChartId, symbol: contextSymbol }));
        } else {
          dispatch(setSymbol(contextSymbol));
        }
      }
    }

    // Always balance refs when they are fully synced
    if (reduxSymbol === contextSymbol) {
      prevReduxSymbol.current = reduxSymbol;
      prevContextSymbol.current = contextSymbol;
    }
  }, [reduxSymbol, primaryTicker, activeChartId, dispatch, setSelectedTicker]);

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
    createImageNoteDrawing,
    replaceImageNoteAsset,
    gridRect,
    saveAsDefault,
    resetStyle,
    namedTemplates,
    saveNamedTemplate,
    applyNamedTemplate,
    deleteNamedTemplate,
    editingDrawingId,
    editingDrawingPosition,
    editingTableCell,
    stopEditingDrawing,
    setEditingDrawingId,
    setEditingDrawingPosition,
    setEditingTableCell,
  } = drawingManager;

  const chartConfig = useSelector(selectChartConfig, shallowEqual);
  const advancedIndicators = useSelector(selectAdvancedIndicators, shallowEqual);
  const indicatorPeriods = useSelector(selectIndicatorPeriods, shallowEqual);
  const chartAppearance = useSelector(selectChartAppearance, shallowEqual);
  const bollingerSettings = useSelector(selectBollingerSettings, shallowEqual);
  const isZenMode = useSelector((state: RootState) => state.technicalAnalysis.ui.isZenMode);
  const cursorMode = useSelector((state: RootState) => state.technicalAnalysis.ui.cursorMode);
  const comparisonSymbols = useSelector((state: RootState) => state.technicalAnalysis.ui.comparisonSymbols, shallowEqual);
  const comparisonSettings = useSelector((state: RootState) => state.technicalAnalysis.ui.comparisonSettings, shallowEqual);
  const movingAverageTrendSignals = useSelector(
    (state: RootState) => state.technicalAnalysis.ui.movingAverageTrendSignals,
    shallowEqual,
  );
  const priceVsSmaMetrics = useSelector(
    (state: RootState) => state.technicalAnalysis.ui.priceVsSmaMetrics,
    shallowEqual,
  );
  const normalizedPriceVsSmaMetrics = useMemo(
    () => normalizePriceVsSmaMetrics(priceVsSmaMetrics),
    [priceVsSmaMetrics],
  );
  const priceVsEmaMetrics = useSelector(
    (state: RootState) => state.technicalAnalysis.ui.priceVsEmaMetrics,
    shallowEqual,
  );
  const normalizedPriceVsEmaMetrics = useMemo(
    () => normalizePriceVsEmaMetrics(priceVsEmaMetrics),
    [priceVsEmaMetrics],
  );
  const multiChartLayout = useSelector((state: RootState) => state.technicalAnalysis.ui.multiChartLayout, shallowEqual);
  const comparisonMarketData = useSelector(selectMarketData, shallowEqual);
  const selectedTimeRange = useSelector((state: RootState) => state.technicalAnalysis.ui.selectedTimeRange);
  const replayState = useSelector((state: RootState) => state.technicalAnalysis.ui.replay, shallowEqual);
  const dataMode = useSelector(selectDataMode);
  const modals = useSelector(selectModals, shallowEqual);
  // [TENOR 2026 — Option F] Live snapshot for the currently active chart symbol.
  // Used by useObjectTreePanel to resolve provenance label in Financial Proof Mode.
  const chartUiLiveSnapshot = useSelector(
    (state: RootState) => selectMarketSnapshots(state)[chartConfig.symbol] ?? null,
  );
  const shouldMountModalOrchestrator = Object.values(modals).some(Boolean);

  const [showReplayFullText, setShowReplayFullText] = useState(false);
  const [compareSettingsSymbol, setCompareSettingsSymbol] = useState<string | null>(null);

  const { handleTimeframeChange, handleSaveAnalysis, handleOpenLoadModal } = useTechnicalAnalysisActions(marketData.setChartData);

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
    chartInstanceRef: refs.chartInstanceRef as React.RefObject<EChartsInstance | null>,
    chartData: chartState.displayChartData,
    // [TENOR 2026 — Option F] Financial Proof: expose live snapshot availability so the
    // hook can resolve the provenance label ("BRVM Live" vs "BRVM CSV") for the Data Window.
    hasLiveSnapshot: chartUiLiveSnapshot !== null,
  });

  const selectedDrawing = drawings.find((d: Drawing) => d.id === selectedDrawingId) ?? null;
  const hasToolbarConfig = (type: string | undefined): type is string =>
    !!type && ((toolbarConfig as ToolbarConfig).drawings as Record<string, unknown>)[type] !== undefined;

  const selectedDrawingToolbarType = resolveDrawingToolbarType(
    selectedDrawing?.type,
    hasToolbarConfig,
  );
  const editingDrawing = drawings.find((d: Drawing) => d.id === editingDrawingId);

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

  const mergedMarketData = useMemo(() => {
    return {
      ...comparisonMarketData,
      [chartConfig.symbol]: chartState.displayChartData,
    };
  }, [comparisonMarketData, chartConfig.symbol, chartState.displayChartData]);

  const mergedLoadState = useMemo(() => {
    return {
      ...comparisonLoadState,
      [chartConfig.symbol]: "loaded" as const,
    };
  }, [comparisonLoadState, chartConfig.symbol]);

  const {
    activeToolbarPopup,
    setActiveToolbarPopup,
    isSavingAs,
    setIsSavingAs,
    newTemplateName,
    setNewTemplateName,
    toolbarOffsetRef,
    wasDraggingRef,
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
      comparisonSettings,
      movingAverageTrendSignals: normalizeMovingAverageTrendSignals(movingAverageTrendSignals),
      priceVsSmaMetrics: normalizedPriceVsSmaMetrics,
      priceVsEmaMetrics: normalizedPriceVsEmaMetrics,
      multiChartLayout,
      searchMode: "replace" as const,
      modals: {} as any,
      replay: replayState,
      isLockedAll: false,
      areDrawingsHidden: false,
    }),
    [
      isZenMode,
      cursorMode,
      selectedTimeRange,
      dataMode,
      comparisonSymbols,
      comparisonSettings,
      movingAverageTrendSignals,
      normalizedPriceVsSmaMetrics,
      normalizedPriceVsEmaMetrics,
      multiChartLayout,
      replayState,
    ]
  );

  const comparisonSeries = useMemo(
    () =>
      (comparisonSymbols || [])
        .map((symbol, index) => ({
          symbol,
          data: comparisonMarketData[symbol] ?? [],
          settings: resolveCompareSeriesSettings(symbol, index, comparisonSettings),
        }))
        .filter((entry) => entry.symbol.length > 0 && entry.data.length > 0),
    [comparisonMarketData, comparisonSettings, comparisonSymbols]
  );

  const chartInteractionScopeKey = `${multiChartLayout.layoutId}:${multiChartLayout.activeChartId}`;

  const [hiddenObjectIds, setHiddenObjectIds] = useState<Record<string, boolean>>({});

  const revealIndicatorObjectIds = useCallback((objectIds: readonly IndicatorObjectId[]) => {
    setHiddenObjectIds((currentHiddenObjectIds) => revealHiddenObjectIds(currentHiddenObjectIds, objectIds));
  }, []);

  const openCompareSettings = useCallback((symbol: string) => {
    const normalized = normalizeCompareSymbol(symbol);
    if (normalized) setCompareSettingsSymbol(normalized);
  }, []);

  const closeCompareSettings = useCallback(() => {
    setCompareSettingsSymbol(null);
  }, []);

  useEffect(() => {
    if (compareSettingsSymbol && !comparisonSymbols.includes(compareSettingsSymbol)) {
      setCompareSettingsSymbol(null);
    }
  }, [compareSettingsSymbol, comparisonSymbols]);

  const compareSettingsIndex = compareSettingsSymbol ? comparisonSymbols.indexOf(compareSettingsSymbol) : -1;
  const compareSettingsFallbackColor = getCompareSeriesColor(compareSettingsIndex >= 0 ? compareSettingsIndex : 0);
  const selectedCompareSettings = compareSettingsSymbol
    ? resolveCompareSeriesSettings(
        compareSettingsSymbol,
        compareSettingsIndex >= 0 ? compareSettingsIndex : 0,
        comparisonSettings,
      )
    : undefined;

  const handleActivateLayoutChart = useCallback(
    (chartId: string) => dispatch(setActiveLayoutChart(chartId)),
    [dispatch]
  );

  // [SCAR-MULTICHART-HEADER-CONTAMINATION FIX]
  // Utilisé UNIQUEMENT quand l'utilisateur clique le HEADER d'un chart secondaire pour changer son ticker.
  // Contrairement à handleActivateLayoutChart (setActiveLayoutChart qui écrit chartConfig.symbol),
  // handleEditLayoutChart utilise setEditChartTarget qui UNIQUEMENT route activeChartId —
  // sans écraser chartConfig.symbol, donc le moteur de sync bidirectionnel ne propage pas
  // le symbole du chart secondaire vers le TickerSelectorContext (plus de contamination BOABF→BOAB).
  const handleEditLayoutChart = useCallback(
    (chartId: string) => dispatch(setEditChartTarget(chartId)),
    [dispatch]
  );

  // [TENOR 2026 SRE FIX] SCAR-MULTICHART-DATA-DRIFT:
  // Dynamically compute the active chart's filtered & converted series (activeDisplayChartData).
  // Ensures the active multi-chart cell actually displays the candles & Y-axis of the selected stock
  // (e.g. ETIT @ 30.00) instead of falling back to BOAC's data (~8,600).
  const activeSymbol = chartConfig.symbol;
  const isPrimaryActive = !activeSymbol || activeSymbol === primaryTicker?.ticker;

  const handleShootingStarAlertRequest = useCallback(
    ({ price, condition, label }: { price: number; condition: "GREATER_THAN" | "LESS_THAN"; label: string }) => {
      if (!Number.isFinite(price) || price <= 0) return;
      const priceLabel = price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const symbolLabel = activeSymbol || chartState.displaySymbolName;
      dispatch(setPrefilledAlert({ price, condition }));
      dispatch(setModalOpen({ modal: "alerts", isOpen: true }));
      addNotification({
        title: "Alerte Shooting Star préparée",
        message: `${label} · cassure ${symbolLabel} sous ${priceLabel}`,
        type: "info",
        iconType: "faBell",
      });
    },
    [activeSymbol, addNotification, chartState.displaySymbolName, dispatch],
  );

  const handleMarubozuAlertRequest = useCallback(
    ({ price, condition, label }: { price: number; condition: "GREATER_THAN" | "LESS_THAN"; label: string }) => {
      if (!Number.isFinite(price) || price <= 0) return;
      const priceLabel = price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const symbolLabel = activeSymbol || chartState.displaySymbolName;
      dispatch(setPrefilledAlert({ price, condition }));
      dispatch(setModalOpen({ modal: "alerts", isOpen: true }));
      addNotification({
        title: "Alerte Marubozu préparée",
        message: `${label} · ${symbolLabel} au niveau ${priceLabel}`,
        type: "info",
        iconType: "faBell",
      });
    },
    [activeSymbol, addNotification, chartState.displaySymbolName, dispatch],
  );

  const handleCandlestickPatternAlertRequest = useCallback(
    ({ price, condition, label }: { price: number; condition: "GREATER_THAN" | "LESS_THAN"; label: string }) => {
      if (!Number.isFinite(price) || price <= 0) return;
      const priceLabel = price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const symbolLabel = activeSymbol || chartState.displaySymbolName;
      const conditionLabel = condition === "GREATER_THAN" ? "au-dessus" : "sous";
      dispatch(setPrefilledAlert({ price, condition }));
      dispatch(setModalOpen({ modal: "alerts", isOpen: true }));
      addNotification({
        title: "Alerte pattern chandelier préparée",
        message: `${label} · ${symbolLabel} ${conditionLabel} ${priceLabel}`,
        type: "info",
        iconType: "faBell",
      });
    },
    [activeSymbol, addNotification, chartState.displaySymbolName, dispatch],
  );

  const activeRawChartData = useMemo(() => {
    if (isPrimaryActive) return chartState.displayChartData;
    const cached = comparisonMarketData[activeSymbol];
    return (cached && cached.length > 0) ? cached : marketData.chartData;
  }, [isPrimaryActive, comparisonMarketData, activeSymbol, chartState.displayChartData, marketData.chartData]);

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
    if (isPrimaryActive || rate === 1) return sourceData;

    return sourceData.map((p) => ({
      ...p,
      open: p.open * rate,
      high: p.high * rate,
      low: p.low * rate,
      close: p.close * rate,
    }));
  }, [activeFilteredChartData, chartState.effectiveRate, isPrimaryActive]);

  const shouldShowPrimaryChartLoader = chartState.globalIsLoading || activeDisplayChartData.length === 0;

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
    const root = refs.mainContainerRef.current;
    if (!root) return;

    if (typeof root.animate === "function") {
      root.animate([{ opacity: 0.95 }, { opacity: 1 }], { duration: 150, easing: "ease-out" });
    } else {
      root.style.opacity = "1";
    }
  }, [refs.mainContainerRef]);

  useLayoutEffect(() => {
    const root = refs.mainContainerRef.current;
    const chartFrame = refs.chartViewWrapperRef.current;
    if (!root || !chartFrame) return;

    let rafId = 0;
    const syncModalBounds = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const rect = chartFrame.getBoundingClientRect();
        root.style.setProperty("--gp-chart-modal-top", `${Math.max(0, rect.top)}px`);
        root.style.setProperty("--gp-chart-modal-bottom", `${Math.max(0, getLayoutViewportHeight() - rect.bottom)}px`);
      });
    };

    syncModalBounds();
    const resizeObserver = new ResizeObserver(syncModalBounds);
    resizeObserver.observe(root);
    resizeObserver.observe(chartFrame);
    window.addEventListener("resize", syncModalBounds);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", syncModalBounds);
      root.style.removeProperty("--gp-chart-modal-top");
      root.style.removeProperty("--gp-chart-modal-bottom");
    };
  }, [
    refs.mainContainerRef,
    refs.chartViewWrapperRef,
    comparisonSymbols.length,
    isObjectTreeOpen,
    isZenMode,
    multiChartLayout.layoutId,
  ]);

  useLayoutEffect(() => {
    const sidebar = refs.sidebarRef.current;
    if (isObjectTreeOpen && sidebar && sidebar.classList.contains("sidebar-closed")) {
      sidebar.style.visibility = "visible";
      sidebar.classList.remove("sidebar-closed");
      if (typeof sidebar.animate === "function") {
        sidebar.animate(
          [{ opacity: 0, transform: "translateX(100%)" }, { opacity: 1, transform: "translateX(0)" }],
          { duration: 200, easing: "ease-out" }
        );
      }
      sidebar.style.opacity = "1";
      sidebar.style.transform = "translateX(0)";
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
      const hideSidebar = () => {
        sidebar.style.visibility = "hidden";
        sidebar.style.opacity = "";
        sidebar.style.transform = "";
      };

      if (typeof sidebar.animate === "function") {
        const animation = sidebar.animate(
          [{ opacity: 1, transform: "translateX(0)" }, { opacity: 0, transform: "translateX(100%)" }],
          { duration: 200, easing: "ease-in" }
        );
        animation.onfinish = hideSidebar;
      } else {
        hideSidebar();
      }

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

  const drawingInteractionMode = activeTool ? "tool" : cursorMode === "eraser" ? "eraser" : cursorMode === "magic" ? "magic" : drawings.length > 0 ? "selection" : "inactive";
  const isCustomCursorMode = cursorMode === "dot" || cursorMode === "demonstration" || cursorMode === "magic" || cursorMode === "eraser";
  const shouldEnableDrawingCanvasPointerEvents = Boolean(activeTool || cursorMode === "eraser" || (drawings.length > 0 && cursorMode !== "magic"));
  const drawingCanvasCursor = activeTool ? "crosshair" : isCustomCursorMode ? "none" : cursorMode.startsWith("cross") ? "crosshair" : "default";

  return (
    <div
      ref={refs.mainContainerRef}
      className={clsx("technical-analysis-root", isZenMode && "is-zen-mode")}
    >
      <div className={"gp-global-wrapper"}>
        <div className={clsx("page-content-wrapper", "mt-1")}>
          <MemoizedChartToolbar
            userInitials={chartState.userInitials}
            displaySymbol={chartState.displaySymbolName}
            openTickerSelector={openTickerSelector}
            stopReplay={marketData.stopReplay}
            onTimeframeChange={handleTimeframeChange}
            onSaveAnalysis={handleSaveAnalysis}
            onOpenLoadModal={handleOpenLoadModal}
          />

          {comparisonSymbols.length > 0 && (
            <div className="gp-compare-strip">
              <span className="gp-compare-strip__label">Compare %</span>
              {comparisonSymbols.map((symbol, index) => {
                const compareSettings = resolveCompareSeriesSettings(symbol, index, comparisonSettings);
                const compareColor = compareSettings.color;
                return (
                  <div
                    key={symbol}
                    className="gp-compare-strip__chip"
                    style={{ "--compare-color": compareColor } as React.CSSProperties}
                  >
                    <button
                      type="button"
                      className="gp-compare-strip__open"
                      onClick={() => openCompareSettings(symbol)}
                      title={`Modifier ${symbol}`}
                    >
                      <span className="gp-compare-strip__swatch" aria-hidden="true" />
                      <span className="gp-compare-strip__symbol">{symbol}</span>
                    </button>
                    <button
                      type="button"
                      className="gp-compare-strip__remove"
                      aria-label={`Retirer ${symbol}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        dispatch(removeComparisonSymbol(symbol));
                      }}
                    >
                      <i className="bi bi-x" aria-hidden="true" />
                    </button>
                  </div>
                );
              })}
              <button
                type="button"
                className="gp-compare-strip__clear"
                onClick={() => dispatch(clearComparisonSymbols())}
                title="Effacer toutes les comparaisons"
                aria-label="Effacer toutes les comparaisons"
              >
                <i className="bi bi-trash3" aria-hidden="true" />
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
                isLoading={chartState.globalIsLoading || marketData.isLoading}
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
                    marketData={mergedMarketData}
                    dataLoadState={mergedLoadState}
                    dataMode={dataMode}
                    activeChartInstanceRef={refs.chartInstanceRef}
                    activeChartData={chartState.displayChartData}
                    activeSymbol={chartConfig.symbol}
                    activeInterval={chartConfig.timeframe}
                    chartAppearance={chartAppearance}
                    onActivateChart={handleActivateLayoutChart}
                    onEditChart={handleEditLayoutChart}
                    openTickerSelector={openTickerSelector}
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

                      <ChartRenderEngine
                        chart={{
                          stockChartRef: refs.stockChartRef,
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
                          hasLiveStitchedCandle: isPrimaryActive && chartState.hasLiveStitchedCandle,
                          comparisonSeries,
                          onCompareSeriesSettingsRequest: openCompareSettings,
                          onMarubozuAlertRequest: handleMarubozuAlertRequest,
                          onShootingStarAlertRequest: handleShootingStarAlertRequest,
                          onCandlestickPatternAlertRequest: handleCandlestickPatternAlertRequest,
                          hiddenObjectIds,
                          pineOverlay: pineChartOverlay,
                        }}
                        overlay={{
                          selectedDrawingId,
                          drawings,
                          chartInstanceRef: refs.chartInstanceRef,
                          drawingCanvasRef: refs.drawingCanvasRef,
                          drawingToolbarRef: refs.drawingToolbarRef,
                          gridRect,
                          toolbarOffsetRef,
                          chartData: activeDisplayChartData,
                          interactionScopeKey: chartInteractionScopeKey,
                        }}
                        cursor={{
                          canvasRef: refs.cursorCanvasRef,
                          containerRef: refs.layersStackRef,
                          eventSourceRef: refs.drawingCanvasRef,
                          mode: cursorMode,
                          suspendForDrawing: Boolean(activeTool),
                          chartRef: refs.chartInstanceRef as React.RefObject<EChartsInstance>,
                          chartData: activeDisplayChartData,
                          interactionScopeKey: chartInteractionScopeKey,
                        }}
                      />

                      <canvas
                        ref={refs.cursorCanvasRef}
                        className={"gp-cursor-canvas"}
                        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 80 }}
                      />

                      <canvas
                        ref={refs.drawingCanvasRef}
                        className={"gp-cursor-canvas gp-drawing-canvas"}
                        data-drawing-interaction={drawingInteractionMode}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          pointerEvents: shouldEnableDrawingCanvasPointerEvents ? "auto" : "none",
                          zIndex: 50,
                          cursor: drawingCanvasCursor,
                          touchAction: "none",
                        }}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
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

                    {brokerState?.isBrokerModalOpen && (
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

                    {shouldShowPrimaryChartLoader && <MemoizedPremiumLoader />}

                    <div
                      className="gp-drawing-overlay-shield"
                      style={{
                        position: "absolute",
                        top: gridRect ? gridRect.y : 30,
                        left: gridRect ? gridRect.x : 15,
                        width: gridRect ? gridRect.width : 800,
                        height: gridRect ? gridRect.height : 600,
                        pointerEvents: "none",
                        overflow: "visible",
                        clipPath: "none",
                        zIndex: 60,
                      }}
                    >
                      <div
                        ref={refs.drawingToolbarRef}
                        className="gp-drawing-quick-toolbar-box"
                        onPointerDown={handleToolbarDragStart}
                        onClickCapture={(e) => {
                          if (wasDraggingRef.current) {
                            e.stopPropagation();
                            e.preventDefault();
                            wasDraggingRef.current = false;
                          }
                        }}
                        style={{
                          display: "none",
                          position: "absolute",
                          transform: "translate(-50%, -100%)",
                          backgroundColor: "#1e222d",
                          backdropFilter: "blur(10px)",
                          borderRadius: "6px",
                          padding: "4px 6px",
                          zIndex: 1000,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: "2px",
                          border: "1px solid #2a2e39",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                          pointerEvents: "auto",
                          cursor: "grab",
                          touchAction: "none",
                        }}
                      >
                        {selectedDrawingToolbarType &&
                          (toolbarConfig as ToolbarConfig).drawings[selectedDrawingToolbarType]?.toolbar.map(
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
                                setIsAlertModalOpen={setIsAlertModalOpen}
                                handleLockToggle={handleLockToggle}
                                handleClone={handleClone}
                                handleVisualOrder={handleVisualOrder}
                                toolbarConfig={toolbarConfig as ToolbarConfig}
                              />
                            )
                          )}
                      </div>

                      {editingDrawing && editingDrawingPosition && (
                        <InlineTextEditor
                          position={editingDrawingPosition}
                          drawing={editingDrawing}
                          initialValue={
                            editingTableCell && editingDrawing.tableProps
                              ? editingDrawing.tableProps.cells[editingTableCell.row]?.[editingTableCell.col]?.text || ""
                              : undefined
                          }
                          placeholder={editingDrawing.type === "signpost" ? "Add text" : undefined}
                          onSave={(text) => stopEditingDrawing(text)}
                          onCancel={() => { setEditingDrawingId(null); setEditingDrawingPosition(null); setEditingTableCell(null); }}
                        />
                      )}


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

            <div className="gp-sidebar-shell">
              <ConnectedSidebar
                  isObjectTreeOpen={isObjectTreeOpen}
                  onPineOverlayAttach={dispatchPineOverlay}
                  onPineOverlayClear={clearPineOverlay}
                  onToggleObjectTree={toggleObjectTree}
                  openTickerSelector={openTickerSelector}
                  overlayContent={
                    isObjectTreeOpen ? (
                      <LazyObjectTreePanel
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

      {shouldMountModalOrchestrator && (
        <MemoizedModalOrchestrator
          dr={selectedDrawing ?? undefined}
          updateDrawing={updateDrawing}
          replaceImageNoteAsset={replaceImageNoteAsset}
          createImageNoteDrawing={createImageNoteDrawing}
          startReplay={marketData.startReplay}
          setChartData={marketData.setChartData}
          onRevealObjectIds={revealIndicatorObjectIds}
        />
      )}
      {compareSettingsSymbol && (
        <LazyCompareSeriesSettingsModal
          isOpen={Boolean(compareSettingsSymbol)}
          symbol={compareSettingsSymbol}
          primarySymbol={chartConfig.symbol || chartState.displaySymbolName}
          fallbackColor={compareSettingsFallbackColor}
          settings={selectedCompareSettings}
          onClose={closeCompareSettings}
        />
      )}
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
