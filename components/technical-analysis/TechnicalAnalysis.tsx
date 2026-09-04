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

// Contexts & UI (Imports Absolus pour garantir la rÃ©solution)
import {
  actionToSelectedTicker,
  useTickerSelector,
} from "@/components/design-system/commons/TickerSelectorModal";
import { TechnicalAnalysisPortalProvider } from "@/components/technical-analysis/components/common/portal/TechnicalAnalysisPortalProvider";

// Redux
import {
  removeComparisonSymbol,
  clearComparisonSymbols,
  clearAllIndicators,
  setChartConfig,
  setChartAppearance,
  setActiveLayoutChart,
  commitLayoutChartAppearance,
  setTimeRange,
  setModalOpen,
  setPrefilledAlert,
  setSymbol,
  setZenMode,
  setReplaySpeed,
  setCapturing,
  updateLayoutChart,
  setPineChartOverlay,
  clearPineChartOverlay,
} from "@/components/technical-analysis/store/technicalAnalysisSlice";
import {
  selectChartConfig,
  selectAdvancedIndicators,
  selectIndicatorPeriods,
  selectChartAppearance,
  selectActiveMarket,
  selectDataMode,
  selectModals,
  selectMarketData,
  selectBollingerSettings,
  selectPineChartOverlay,
} from "@/components/technical-analysis/store/selectors";
import type { RootState } from "@/core/infra/store";
import type { EChartsInstance } from "@/components/technical-analysis/lib/types/echarts";

import toolbarConfig from "@/components/technical-analysis/toolbar-config-antigravity.json";
import { resolveDrawingToolbarType } from "@/components/technical-analysis/lib/drawingToolbarResolution";
import {
  getCompareInstrumentLabel,
  getCompareSeriesColor,
  normalizeCompareSymbol,
  parseCompareInstrumentKey,
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
import type { BrokerModalProps } from "@/components/technical-analysis/components/modals/broker/BrokerModal";
import type { ModalOrchestratorProps } from "@/components/technical-analysis/components/modals/orchestration/ModalOrchestrator";
import {
  createVolumeConfigurationTarget,
  type IndicatorConfigurationTarget,
} from "@/components/technical-analysis/config/indicators/indicatorConfigurationTarget";
import { IndicatorConfigurationModal } from "@/components/technical-analysis/components/modals/indicators/IndicatorConfigurationModal";
import type { ObjectTreePanelProps } from "@/components/technical-analysis/components/panels/object-tree/ObjectTreePanel";
import type { CompareSeriesSettingsModalProps } from "@/components/technical-analysis/components/modals/compare/CompareSeriesSettingsModal";
import { TimeAxisControls } from "@/components/technical-analysis/components/toolbar/time-axis/TimeAxisControls";
import TechnicalAnalysisSidebar, { type TechnicalAnalysisSidebarProps } from "@/components/technical-analysis/components/sidebar/TechnicalAnalysisSidebar";
import { ToolbarButton } from "@/components/technical-analysis/components/toolbar/floating/ToolbarButton";
import { InlineTextEditor } from "@/components/technical-analysis/components/toolbar/floating/InlineTextEditor";
import { VerticalDrawingToolbar } from "@/components/technical-analysis/components/toolbar/VerticalDrawingToolbar";
import { MultiChartLayoutGrid, type MultiChartContextMenuRequest } from "@/components/technical-analysis/components/layout/MultiChartLayoutGrid";
import {
  convertLayoutSeriesByRate,
  convertLayoutSeriesCurrency,
} from "@/components/technical-analysis/components/layout/layoutChartData";
import { resolveLayoutTickerMarket } from "@/components/technical-analysis/components/layout/layoutTickerSelection";
import { isMultiChartTickerContextIsolated } from "@/components/technical-analysis/components/layout/layoutTickerContextPolicy";

// Hooks & Libs
import { useDrawingManager } from "@/components/technical-analysis/hooks/useDrawingManager";
import {
  useLiveMetrics,
  useComparisonManager,
  type ComparisonMarketRequest,
} from "@/components/technical-analysis/hooks/MarketData/useMarketData";
import { useTechnicalAnalysisActions } from "@/components/technical-analysis/hooks/useTechnicalAnalysisActions";
import { useToolbarHandlers } from "@/components/technical-analysis/hooks/useToolbarHandlers";
import { useFloatingToolbar } from "@/components/technical-analysis/hooks/useFloatingToolbar";
import { useObjectTreePanel } from "@/components/technical-analysis/hooks/useObjectTreePanel";
import { TimeAxisRegistry, type ChartViewportChange } from "@/components/technical-analysis/hooks/useChartViewport";
import { PriceAxisOverlay, type PriceAxisActionId } from "@/components/technical-analysis/components/overlays/PriceAxisOverlay";
import {
  ChartContextMenu,
  resolveChartContextPriceAtClientPoint,
  type ChartContextMenuActionId,
  type ChartContextMenuModel,
} from "@/components/technical-analysis/components/chart/ChartContextMenu";
import {
  PriceScaleContextMenu,
  isPriceScaleContextPoint,
  resetPriceScaleAutoBounds,
  type PriceScaleContextMenuActionId,
  type PriceScaleContextMenuModel,
} from "@/components/technical-analysis/components/chart/PriceScaleContextMenu";
import { countActiveIndicatorStudies } from "@/components/technical-analysis/store/policies/indicatorVisibilityPolicy";
import { resolveVolumeStudyLifecycle } from "@/components/technical-analysis/store/policies/volumeStudyLifecycle";
import { VolumeStudyLegend } from "@/components/technical-analysis/components/chart/VolumeStudyLegend";
import { ReplayControls } from "@/components/technical-analysis/components/chart/ReplayControls";
import { ChartRenderEngine, type ChartRenderEngineProps } from "@/components/technical-analysis/components/chart/ChartRenderEngine";
import { ChartInteractionEngine } from "@/components/technical-analysis/components/chart/ChartInteractionEngine";
import { resolvePrimaryChartAsyncPresentation } from "@/components/technical-analysis/components/chart/chartAsyncPresentation";
import { useGlobalNotification } from "@/components/design-system/layouts/HeaderHome/context/GlobalNotificationContext";
import { useCurrency } from "@/hooks/useCurrency";
import { usePriceAxisMenu, formatPriceAxisLabel } from "@/components/technical-analysis/hooks/usePriceAxisMenu";
import {
  TechnicalAnalysisProviderTree,
  useBrokerContext,
  useChartRefsContext,
  useChartStateContext,
  useDrawingContext,
  useMarketDataContext,
} from "./context/TechnicalAnalysisProviders";
import { getBrvmPriceAxisCountdown } from "./utils/brvmMarketSession";
import { getMarketLogoUrl } from "@/core/data/market-logo-registry";
import {
  createMarketDataCacheKey,
  normalizeMarketDataScope,
} from "@/components/technical-analysis/config/market/marketDataCacheKey";
import { createTimeframeMarketDataCacheKey, normalizeChartTimeframe } from "@/components/technical-analysis/config/market/timeframeCatalog";
import { filterChartDataByDateRange } from "@/components/technical-analysis/config/market/dateRangeSeries";
import { readPrimaryXAxisCategories, resolvePixelPointerIndex } from "@/components/technical-analysis/lib/chart/pointerCandleIndex";
import {
  buildSnapshotFilename,
  captureChartSnapshot,
  copySnapshotBlob,
  downloadSnapshotBlob,
  openSnapshotBlob,
} from "@/components/technical-analysis/lib/chart/chartSnapshot";

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


const MemoizedPremiumLoader = React.memo(({ isVisible }: { isVisible: boolean }) => (
  <div
    className={clsx("gp-chart-loading-overlay", !isVisible && "is-hidden")}
    aria-hidden={!isVisible}
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(10, 21, 31, 0.16)",
      backdropFilter: "none",
      zIndex: 100,
      pointerEvents: isVisible ? "auto" : "none",
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

const MemoizedChartEmptyState = React.memo(() => (
  <div
    className="gp-chart-empty-state"
    role="status"
    aria-live="polite"
    style={{
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      zIndex: 5,
      maxWidth: "min(90%, 360px)",
      padding: "12px 18px",
      border: "1px solid rgba(106, 151, 196, 0.45)",
      borderRadius: "8px",
      backgroundColor: "rgba(10, 31, 55, 0.92)",
      color: "#b8c9dc",
      textAlign: "center",
      fontSize: "13px",
      lineHeight: 1.45,
    }}
  >
    {"Aucune donn\u00e9e historique disponible pour ce titre."}
  </div>
));
MemoizedChartEmptyState.displayName = "MemoizedChartEmptyState";

const MemoizedChartErrorState = React.memo(() => (
  <div
    className="gp-chart-empty-state gp-chart-error-state"
    role="alert"
    style={{
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      zIndex: 5,
      maxWidth: "min(90%, 390px)",
      padding: "12px 18px",
      border: "1px solid rgba(239, 68, 68, 0.55)",
      borderRadius: "8px",
      backgroundColor: "rgba(44, 18, 27, 0.94)",
      color: "#fecaca",
      textAlign: "center",
      fontSize: "13px",
      lineHeight: 1.45,
    }}
  >
    {"Impossible de charger les données historiques pour ce titre. Réessayez la sélection."}
  </div>
));
MemoizedChartErrorState.displayName = "MemoizedChartErrorState";

interface ChartEmptyIdentityProps {
  symbol: string;
  exchange: string;
  logoUrl?: string | null;
}

const MemoizedChartEmptyIdentity = React.memo(({ symbol, exchange, logoUrl }: ChartEmptyIdentityProps) => (
  <div
    className={clsx("gp-chart-empty-identity", logoUrl && "has-logo")}
    aria-label={`Titre sélectionné ${symbol} ${exchange}`}
  >
    {logoUrl && (
      <img
        className="gp-chart-empty-identity__logo"
        src={logoUrl}
        alt=""
        aria-hidden="true"
        draggable={false}
      />
    )}
    <span className="gp-chart-empty-identity__symbol">{symbol}</span>
    <span className="gp-chart-empty-identity__exchange">· {exchange}</span>
  </div>
));
MemoizedChartEmptyIdentity.displayName = "MemoizedChartEmptyIdentity";

interface TradeHUDProps {
  convertedLivePrice: number;
  convertedBidPrice: number | null;
  convertedAskPrice: number | null;
  hasHistoricalData: boolean;
  isCurrencyRateUnavailable: boolean;
  onOpenBrokerModal: (isOrderSubmissionBlocked: boolean) => void;
}

const MemoizedTradeHUD = React.memo(({ convertedLivePrice, convertedBidPrice, convertedAskPrice, hasHistoricalData, isCurrencyRateUnavailable, onOpenBrokerModal }: TradeHUDProps) => {
  const hasLiveQuote = !isCurrencyRateUnavailable
    && Number.isFinite(convertedBidPrice)
    && Number.isFinite(convertedAskPrice)
    && (convertedAskPrice as number) >= (convertedBidPrice as number);
  const hasLastPrice = !isCurrencyRateUnavailable
    && Number.isFinite(convertedLivePrice)
    && convertedLivePrice > 0;
  const isInteractionUnavailable = !hasHistoricalData || isCurrencyRateUnavailable || !hasLastPrice;
  const isOrderSubmissionBlocked = !hasLiveQuote;
  const formatPrice = (value: number): string => Number.isFinite(value) ? value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";
  const unavailablePriceLabel = "N/D";
  const fallbackPriceLabel = hasLastPrice ? formatPrice(convertedLivePrice) : unavailablePriceLabel;
  const sellLabel = hasLiveQuote ? formatPrice(convertedBidPrice as number) : fallbackPriceLabel;
  const buyLabel = hasLiveQuote ? formatPrice(convertedAskPrice as number) : fallbackPriceLabel;
  const spreadLabel = hasLiveQuote
    ? formatPrice((convertedAskPrice as number) - (convertedBidPrice as number))
    : unavailablePriceLabel;
  const quoteAvailabilityLabel = hasLiveQuote
    ? "Cours bid/ask en direct"
    : hasLastPrice
      ? "Dernier cours affiché. Cotation bid/ask indisponible."
      : "Cours indisponible.";
  const handleBrokerClick = () => {
    if (!isInteractionUnavailable) onOpenBrokerModal(isOrderSubmissionBlocked);
  };

  return (
    <div className="gp-trade-btn-container">
      <button type="button" className={clsx("gp-trade-btn sell", isInteractionUnavailable && "disabled")} onClick={handleBrokerClick} disabled={isInteractionUnavailable} aria-disabled={isInteractionUnavailable} aria-label={`SELL ${sellLabel}. ${quoteAvailabilityLabel}`} title={quoteAvailabilityLabel}>
        <span className="price">{sellLabel}</span>
        <span className="label">SELL</span>
      </button>
      <div className="gp-trade-spread" aria-label={hasLiveQuote ? "Bid/ask spread" : quoteAvailabilityLabel} title={hasLiveQuote ? "Bid/ask spread" : quoteAvailabilityLabel}>{spreadLabel}</div>
      <button type="button" className={clsx("gp-trade-btn buy", isInteractionUnavailable && "disabled")} onClick={handleBrokerClick} disabled={isInteractionUnavailable} aria-disabled={isInteractionUnavailable} aria-label={`BUY ${buyLabel}. ${quoteAvailabilityLabel}`} title={quoteAvailabilityLabel}>
        <span className="price">{buyLabel}</span>
        <span className="label">BUY</span>
      </button>
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
  if (!value) return "â";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "â";

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

const hasRenderableMarketPrice = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const selectActiveLayoutChartBinding = (state: RootState) => {
  const layout = state.technicalAnalysis.ui.multiChartLayout;
  const activeCell = layout.charts.find((cell) => cell.chartId === layout.activeChartId);
  return {
    symbol: String(activeCell?.symbol ?? "").trim().toUpperCase(),
    market: normalizeMarketDataScope(activeCell?.exchange || state.technicalAnalysis.ui.activeMarket.ticker),
    requiresExplicitSymbol: layout.isEnabled && layout.charts.length > 1,
  };
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
  const activeBinding = useSelector(selectActiveLayoutChartBinding, shallowEqual);
  const primarySymbol = selectedTicker?.ticker || chartState.security.ticker;
  const primaryMarketScope = normalizeMarketDataScope(chartState.security.exchange || activeBinding.market);
  const activeSymbol = activeBinding.symbol || chartConfig.symbol || primarySymbol;
  const hasSelectedTarget = !activeBinding.requiresExplicitSymbol || Boolean(activeBinding.symbol);
  const isPrimaryActive = hasSelectedTarget && (
    String(activeSymbol ?? "").trim().toUpperCase() === String(primarySymbol ?? "").trim().toUpperCase()
    && activeBinding.market === primaryMarketScope
  );
  const activeChartData = useMemo(() => {
    if (!hasSelectedTarget) return [];
    if (isPrimaryActive) return marketData.chartData;
    return allMarketData[createMarketDataCacheKey(activeBinding.market, activeSymbol)] ?? [];
  }, [activeBinding.market, activeSymbol, allMarketData, hasSelectedTarget, isPrimaryActive, marketData.chartData]);
  const activeLiveSnapshot = isPrimaryActive ? marketData.liveSnapshot : null;

  const { convertedLivePrice, convertedBidPrice, convertedAskPrice } = useLiveMetrics(
    activeChartData,
    activeLiveSnapshot,
    chartState.security,
    chartState.effectiveRate
  );

  return (
    <MemoizedTradeHUD
      convertedLivePrice={convertedLivePrice}
      convertedBidPrice={convertedBidPrice}
      convertedAskPrice={convertedAskPrice}
      hasHistoricalData={activeChartData.length > 0}
      isCurrencyRateUnavailable={chartState.isCurrencyRateUnavailable}
      onOpenBrokerModal={brokerState.openBrokerSelection}
    />
  );
});
ConnectedTradeHUD.displayName = "ConnectedTradeHUD";

const ConnectedSidebar = React.memo(({ isObjectTreeOpen, onPineOverlayAttach, onPineOverlayClear, onToggleObjectTree, overlayContent, openTickerSelector }: { isObjectTreeOpen: boolean; onPineOverlayAttach?: (overlay: PineChartOverlayPayload | null) => void; onPineOverlayClear?: () => void; onToggleObjectTree?: () => void; overlayContent?: React.ReactNode; openTickerSelector?: () => void }) => {
  const marketData = useMarketDataContext();
  const chartState = useChartStateContext();
  const refs = useChartRefsContext();
  const dataMode = useSelector(selectDataMode);

  const liveSnapshot = marketData.liveSnapshot;
  const { convertedLiveChange, liveChangePercent, isMarketPositive } = useLiveMetrics(
    marketData.chartData,
    liveSnapshot,
    chartState.security,
    chartState.effectiveRate
  );

  // The current API quote is authoritative for the sidebar. Historical chart data
  // may end before the latest quote and must not replace it.
  const apiLivePrice = marketData.apiPriceMetric?.price;
  const convertedApiLivePrice = typeof apiLivePrice === "number" && Number.isFinite(apiLivePrice) && apiLivePrice > 0
    ? apiLivePrice * chartState.effectiveRate
    : null;
  // A historical candle is valid for chart continuity, never as a current
  // sidebar quote. When the API has no positive price, render N/D.
  const sidebarLivePrice = convertedApiLivePrice ?? Number.NaN;

  const displaySecurity = useMemo<DisplaySecurity>(
    () => ({
      ...chartState.security,
      currency: chartState.currencyDisplayLabel,
    }),
    [chartState.security, chartState.currencyDisplayLabel]
  );

  const deferredChartData = useDeferredValue(chartState.displayChartData);
  const isInitialSidebarLoading = dataMode === "real"
    ? marketData.isLiveDataLoading
    : (chartState.globalIsLoading || marketData.isLoading) && marketData.chartData.length === 0;

  return (
    <MemoizedSidebar
      sidebarRef={refs.sidebarRef}
      baseCurrency={chartState.baseCurrency}
      security={displaySecurity}
      chartData={deferredChartData}
      livePrice={sidebarLivePrice}
      isMarketPositive={isMarketPositive}
      liveChange={convertedLiveChange}
      liveChangePercent={liveChangePercent}
      lastUpdate={liveSnapshot?.lastUpdate}
      marketSourceLabel={liveSnapshot?.sourceLabel}
      marketSourceStatus={liveSnapshot?.sourceStatus}
      liveVolume={marketData.apiPriceMetric?.volume ?? marketData.currentVolume ?? undefined}
      liveMarketCap={liveSnapshot?.marketCap}
      liveReturnYTD={liveSnapshot?.returnYTD}
      livePeRatio={liveSnapshot?.peRatio}
      apiPriceMetric={marketData.apiPriceMetric}
      apiTechnicalIndicator={marketData.apiTechnicalIndicator}
      apiValuationRatio={marketData.apiValuationRatio}
      currentVolume={marketData.currentVolume}
      avgVolume={marketData.avgVolume}
      benefitsChartRef={refs.benefitsChartRef}
      dividendsChartRef={refs.dividendsChartRef}
      isLoading={isInitialSidebarLoading}
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

  // The active layout binding is the single source of truth for the price axis.
  // The primary context is consulted only when that binding explicitly points to it.
  const chartConfig = useSelector(selectChartConfig, shallowEqual);
  const chartAppearance = useSelector(selectChartAppearance, shallowEqual);
  const allMarketData = useSelector(selectMarketData, shallowEqual);
  const { selectedTicker } = useTickerSelector();
  const activeBinding = useSelector(selectActiveLayoutChartBinding, shallowEqual);
  const primarySymbol = selectedTicker?.ticker || chartState.security.ticker;
  const primaryMarketScope = normalizeMarketDataScope(chartState.security.exchange || activeBinding.market);
  const activeSymbol = activeBinding.symbol || chartConfig.symbol || primarySymbol;
  const hasSelectedTarget = !activeBinding.requiresExplicitSymbol || Boolean(activeBinding.symbol);
  const isPrimaryActive = hasSelectedTarget && (
    String(activeSymbol ?? "").trim().toUpperCase() === String(primarySymbol ?? "").trim().toUpperCase()
    && activeBinding.market === primaryMarketScope
  );
  const activeChartData = useMemo(() => {
    if (!hasSelectedTarget) return [];
    if (isPrimaryActive) return marketData.chartData;
    return allMarketData[createMarketDataCacheKey(activeBinding.market, activeSymbol)] ?? [];
  }, [activeBinding.market, activeSymbol, allMarketData, hasSelectedTarget, isPrimaryActive, marketData.chartData]);
  const activeLiveSnapshot = isPrimaryActive ? marketData.liveSnapshot : null;

  const { convertedLastCandleClose, isLastPricePositive, lastCandleTime } = useLiveMetrics(
    activeChartData,
    activeLiveSnapshot,
    chartState.security,   // currency/rate info â all BRVM stocks use XOF, safe to share
    chartState.effectiveRate
  );

  // [TENOR 2026 SRE FIX] SCAR-PRICE-AXIS-MENU-COORD:
  // usePriceAxisMenu's container ref MUST be the same positioned ancestor as the
  // gp-price-axis-overlay (position:absolute; inset:0 â fills gp-chart-layers-stack).
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

  const shouldRenderLastPriceOverlay =
    !chartState.globalIsLoading
    && activeChartData.length > 0
    && hasRenderableMarketPrice(activeChartData[activeChartData.length - 1]?.close)
    && hasRenderableMarketPrice(convertedLastCandleClose);

  useEffect(() => {
    if (!shouldRenderLastPriceOverlay) closePriceAxisActionMenu();
  }, [closePriceAxisActionMenu, shouldRenderLastPriceOverlay]);

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
        ? "horloge marchÃ© en initialisation"
        : priceAxisCountdown ? `${priceAxisCountdown.accessibilityLabel} ${lastPriceTimeLabel}` : `bougie ${lastPriceTimeLabel}`,
    ];
    if (updateLabel) parts.push(`derniÃ¨re donnÃ©e reÃ§ue ${updateLabel}`);
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
          title: "Alerte prÃ©parÃ©e",
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
          title: "Niveau tracÃ©",
          message: `Ligne horizontale ajoutÃ©e Ã  ${priceLabel}`,
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
        title: "Ticket prÃ©rempli",
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

  if (!shouldRenderLastPriceOverlay) return null;

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
      priceScalePosition={chartAppearance.priceScalePosition === "left" ? "left" : "right"}
      showPlusButton={chartAppearance.showPriceScalePlusButton !== false}
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
  const brokerState = useBrokerContext();
  const isInitialSidebarLoading = (chartState.globalIsLoading || marketData.isLoading)
    && marketData.chartData.length === 0;


  const {
    openModal: openTickerSelector,
    openLayoutMarketModal: openLayoutTickerSelectorForMarket,
    openLayoutMarketDirectory,
    selectedTicker: primaryTicker,
    preferredTicker,
    setSelectedTicker,
  } = useTickerSelector();
  const { addNotification } = useGlobalNotification();
  const { displayCurrency, rates } = useCurrency();
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
  const activeLayoutState = useSelector((state: RootState) => state.technicalAnalysis.ui.multiChartLayout, shallowEqual);
  const isTickerContextIsolated = isMultiChartTickerContextIsolated(
    activeLayoutState.isEnabled,
    activeLayoutState.charts.length,
  );

  const handleRequestLayoutMarketSelection = useCallback((chartId: string) => {
    openLayoutMarketDirectory(chartId);
    dispatch(setModalOpen({ modal: "marketSelector", isOpen: true }));
  }, [dispatch, openLayoutMarketDirectory]);

  const prevReduxSymbol = React.useRef<string>("");
  const prevContextSymbol = React.useRef<string>("");

  useEffect(() => {
    const contextSymbol = primaryTicker?.ticker || "";

    // In multi-chart mode every cell owns its symbol binding. The workspace
    // TickerSelector context may hydrate asynchronously or carry an unrelated
    // single-chart preference; it must never overwrite, clear, or bootstrap a
    // cell merely because focus changed. Track both values so returning to
    // single-chart mode starts from a balanced observation point.
    if (isTickerContextIsolated) {
      prevReduxSymbol.current = reduxSymbol;
      prevContextSymbol.current = contextSymbol;
      return;
    }

    // Single-chart mode preserves the historical bidirectional sync contract.
    if (!prevReduxSymbol.current && !prevContextSymbol.current) {
      prevReduxSymbol.current = reduxSymbol;
      prevContextSymbol.current = contextSymbol;
      if (contextSymbol && contextSymbol !== reduxSymbol) {
        dispatch(setSymbol(contextSymbol));
      }
      return;
    }

    const reduxChanged = reduxSymbol !== prevReduxSymbol.current;
    const contextChanged = contextSymbol !== prevContextSymbol.current;

    if (reduxChanged && reduxSymbol) {
      prevReduxSymbol.current = reduxSymbol;
      if (reduxSymbol !== contextSymbol) {
        prevContextSymbol.current = contextSymbol;
        setSelectedTicker(null);
      }
    } else if (contextChanged && contextSymbol) {
      prevContextSymbol.current = contextSymbol;
      if (contextSymbol !== reduxSymbol) {
        prevReduxSymbol.current = contextSymbol;
        if (activeChartId) {
          dispatch(updateLayoutChart({
            chartId: activeChartId,
            symbol: contextSymbol,
            exchange: primaryTicker?.exchange,
          }));
        } else {
          dispatch(setSymbol(contextSymbol));
        }
      }
    }

    if (reduxSymbol === contextSymbol) {
      prevReduxSymbol.current = reduxSymbol;
      prevContextSymbol.current = contextSymbol;
    }
  }, [reduxSymbol, primaryTicker, activeChartId, dispatch, isTickerContextIsolated, setSelectedTicker]);

  useEffect(() => {
    const requestedTicker = (reduxSymbol || preferredTicker || "").trim().toUpperCase();
    const action = marketData.currentActionByTickerData;
    const actionTicker = String(action?.ticker ?? "").trim().toUpperCase();

    if (!requestedTicker || !action || actionTicker !== requestedTicker) return;

    const resolvedTicker = actionToSelectedTicker(action);
    if (!resolvedTicker || resolvedTicker.ticker === primaryTicker?.ticker) return;

    setSelectedTicker(resolvedTicker);
  }, [
    marketData.currentActionByTickerData,
    preferredTicker,
    primaryTicker?.ticker,
    reduxSymbol,
    setSelectedTicker,
  ]);

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
  const activeIndicatorCount = useMemo(() => countActiveIndicatorStudies({
    chartIndicators: chartConfig.indicators,
    advancedIndicators,
    movingAverageTrendSignals,
    priceVsSmaMetrics,
    priceVsEmaMetrics,
  }), [advancedIndicators, chartConfig.indicators, movingAverageTrendSignals, priceVsEmaMetrics, priceVsSmaMetrics]);
  const volumeStudyLifecycle = useMemo(() => resolveVolumeStudyLifecycle({
    indicators: chartConfig.indicators,
    appearance: chartAppearance,
  }), [chartAppearance, chartConfig.indicators]);
  const multiChartLayout = useSelector((state: RootState) => state.technicalAnalysis.ui.multiChartLayout, shallowEqual);
  const comparisonMarketData = useSelector(selectMarketData, shallowEqual);
  const selectedTimeRange = useSelector((state: RootState) => state.technicalAnalysis.ui.selectedTimeRange);
  const replayState = useSelector((state: RootState) => state.technicalAnalysis.ui.replay, shallowEqual);
  const chartAppearancePreview = useSelector((state: RootState) => state.technicalAnalysis.ui.chartAppearancePreview, shallowEqual);
  const effectivePrimaryChartAppearance = chartAppearancePreview?.chartId === null
    ? chartAppearancePreview.appearance
    : chartAppearance;
  const dataMode = useSelector(selectDataMode);
  const activeMarket = useSelector(selectActiveMarket);
  const modals = useSelector(selectModals, shallowEqual);
  // [TENOR 2026 â Option F] Live snapshot for the currently active chart symbol.
  // Used by useObjectTreePanel to resolve provenance label in Financial Proof Mode.
  const chartUiLiveSnapshot = marketData.liveSnapshot;
  const shouldMountModalOrchestrator = Object.values(modals).some(Boolean);

  const [showReplayFullText, setShowReplayFullText] = useState(false);
  const [isReplaySelectingStart, setIsReplaySelectingStart] = useState(false);
  const [compareSettingsSymbol, setCompareSettingsSymbol] = useState<string | null>(null);
  const [indicatorConfigurationTarget, setIndicatorConfigurationTarget] = useState<IndicatorConfigurationTarget | null>(null);
  const [chartContextMenu, setChartContextMenu] = useState<ChartContextMenuModel | null>(null);
  const [priceScaleContextMenu, setPriceScaleContextMenu] = useState<PriceScaleContextMenuModel | null>(null);
  const chartContextTargetRef = React.useRef<EChartsInstance | null>(null);
  const priceScaleContextTargetRef = React.useRef<EChartsInstance | null>(null);

  const { handleTimeframeChange, handleSaveAnalysis, handleOpenLoadModal } = useTechnicalAnalysisActions(marketData.setChartData);

  useEffect(() => {
    if (!isZenMode) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isZenMode]);

  useEffect(() => {
    const handleFocusShortcut = (event: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isEditing = activeElement instanceof HTMLElement && (
        activeElement.tagName === "INPUT"
        || activeElement.tagName === "TEXTAREA"
        || activeElement.tagName === "SELECT"
        || activeElement.isContentEditable
      );
      if (isEditing) return;

      if (event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey && event.key.toLowerCase() === "f") {
        event.preventDefault();
        dispatch(setZenMode(!isZenMode));
        return;
      }

      if (event.key === "Escape") {
        if (isReplaySelectingStart) {
          event.preventDefault();
          setIsReplaySelectingStart(false);
        }
        if (isZenMode) {
          event.preventDefault();
          dispatch(setZenMode(false));
        }
      }
    };

    window.addEventListener("keydown", handleFocusShortcut);
    return () => window.removeEventListener("keydown", handleFocusShortcut);
  }, [dispatch, isReplaySelectingStart, isZenMode]);

  // ============================================================================
  // [TENOR 2026] KEYBOARD SHORTCUTS ENGINE
  // ============================================================================
  const liveSnapshotForShortcuts = marketData.liveSnapshot;
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
          title: "Alerte prÃ©parÃ©e",
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
            title: "Ticket prÃ©rempli",
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
            title: "Ticket prÃ©rempli",
            message: `ACHAT ${chartState.displaySymbolName} @ ${priceLabel} stop`,
            type: "info",
            iconType: "faChartLine",
          });
        }
      }

      // Shift + T: Generic Order (French: Ajouter un ordre gÃ©nÃ©rique)
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
            title: "Ticket prÃ©rempli",
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
            title: "Niveau tracÃ©",
            message: `Ligne horizontale ajoutÃ©e Ã  ${priceLabel}`,
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
    // [TENOR 2026 â Option F] Financial Proof: expose live snapshot availability so the
    // hook can resolve the provenance label ("BRVM Live" vs "BRVM CSV") for the Data Window.
    hasLiveSnapshot: chartUiLiveSnapshot !== null,
  });

  const closeChartContextMenu = useCallback(() => {
    setChartContextMenu(null);
    chartContextTargetRef.current = null;
  }, []);

  const closePriceScaleContextMenu = useCallback(() => {
    setPriceScaleContextMenu(null);
    priceScaleContextTargetRef.current = null;
  }, []);

  const handleTechnicalAnalysisContextMenuCapture = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    // TradingView parity: the browser context menu must never leak through the
    // charting workspace. Only an explicit chart/price-scale surface may own it.
    event.preventDefault();

    const target = event.target;
    const isChartSurface = target instanceof Element
      && target.closest('[data-chart-context-menu-surface="true"]') !== null;

    if (isChartSurface) return;

    event.stopPropagation();
    closeChartContextMenu();
    closePriceScaleContextMenu();
  }, [closeChartContextMenu, closePriceScaleContextMenu]);

  const openPriceScaleContextMenu = useCallback((
    event: React.MouseEvent<HTMLDivElement>,
    chart: EChartsInstance | null,
    chartId: string | null,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    closeChartContextMenu();
    priceScaleContextTargetRef.current = chart;
    setPriceScaleContextMenu({
      anchorX: event.clientX,
      anchorY: event.clientY,
      chartId,
    });
  }, [closeChartContextMenu]);

  const openChartContextMenu = useCallback((
    event: React.MouseEvent<HTMLDivElement>,
    chart: EChartsInstance | null,
    symbol: string,
    chartId: string | null,
    indicatorCount: number,
    referencePriceValue: number | null,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    closePriceScaleContextMenu();
    const priceValue = resolveChartContextPriceAtClientPoint(chart, event.clientX, event.clientY);
    chartContextTargetRef.current = chart;
    setChartContextMenu({
      anchorX: event.clientX,
      anchorY: event.clientY,
      chartId,
      symbol: symbol.trim() || chartState.displaySymbolName,
      priceValue,
      priceLabel: priceValue === null ? null : formatPriceAxisLabel(priceValue),
      referencePriceValue: typeof referencePriceValue === "number" && Number.isFinite(referencePriceValue)
        ? referencePriceValue
        : null,
      indicatorCount,
    });
  }, [chartState.displaySymbolName, closePriceScaleContextMenu]);

  const handlePrimaryChartContextMenu = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const chart = refs.chartInstanceRef.current;
    const priceScalePosition = chartAppearance.priceScalePosition === "left" ? "left" : "right";
    if (isPriceScaleContextPoint(chart, event.clientX, event.clientY, priceScalePosition)) {
      openPriceScaleContextMenu(event, chart, null);
      return;
    }
    openChartContextMenu(
      event,
      chart,
      chartState.displaySymbolName,
      null,
      activeIndicatorCount,
      convertedLastCandleClose,
    );
  }, [activeIndicatorCount, chartAppearance.priceScalePosition, chartState.displaySymbolName, convertedLastCandleClose, openChartContextMenu, openPriceScaleContextMenu, refs.chartInstanceRef]);

  const handleMultiChartContextMenu = useCallback((request: MultiChartContextMenuRequest) => {
    const priceScalePosition = chartAppearance.priceScalePosition === "left" ? "left" : "right";
    if (isPriceScaleContextPoint(request.chart, request.event.clientX, request.event.clientY, priceScalePosition)) {
      dispatch(setActiveLayoutChart(request.cell.chartId));
      openPriceScaleContextMenu(request.event, request.chart, request.cell.chartId);
      return;
    }
    const targetIndicatorCount = request.indicatorState
      ? countActiveIndicatorStudies({
          chartIndicators: request.indicatorState.chart,
          advancedIndicators: request.indicatorState.advanced,
          movingAverageTrendSignals: request.indicatorState.ui.movingAverageTrendSignals,
          priceVsSmaMetrics: request.indicatorState.ui.priceVsSmaMetrics,
          priceVsEmaMetrics: request.indicatorState.ui.priceVsEmaMetrics,
        })
      : new Set(request.cell.indicators ?? []).size;
    openChartContextMenu(
      request.event,
      request.chart,
      request.cell.symbol,
      request.cell.chartId,
      targetIndicatorCount,
      request.referencePriceValue,
    );
  }, [chartAppearance.priceScalePosition, dispatch, openChartContextMenu, openPriceScaleContextMenu]);

  const openObjectTreeTab = useCallback((tab: "object_tree" | "data_window") => {
    setObjectTreeTab(tab);
    if (!isObjectTreeOpen) toggleObjectTree();
  }, [isObjectTreeOpen, setObjectTreeTab, toggleObjectTree]);

  const handleToggleVolumeStudyVisibility = useCallback(() => {
    dispatch(setChartConfig({
      indicators: {
        ...chartConfig.indicators,
        volumeVisible: chartConfig.indicators.volumeVisible === false,
      },
    }));
  }, [chartConfig.indicators, dispatch]);

  const handleConfigureVolumeStudy = useCallback(() => {
    setIndicatorConfigurationTarget(createVolumeConfigurationTarget());
  }, []);

  const handleRemoveVolumeStudy = useCallback(() => {
    dispatch(setChartConfig({
      indicators: {
        ...chartConfig.indicators,
        volume: false,
      },
    }));
  }, [chartConfig.indicators, dispatch]);

  const handleOpenVolumeObjectTree = useCallback(() => {
    openObjectTreeTab("object_tree");
  }, [openObjectTreeTab]);

  const handleChartContextMenuAction = useCallback((actionId: ChartContextMenuActionId) => {
    const menu = chartContextMenu;
    if (!menu) return;
    const chart = chartContextTargetRef.current;
    const priceValue = menu.priceValue;
    const priceLabel = menu.priceLabel;

    if (actionId === "reset-view") {
      if (chart) TimeAxisRegistry.get(chart)?.reset();
      closeChartContextMenu();
      return;
    }

    if (actionId === "copy-price") {
      closeChartContextMenu();
      if (priceLabel === null) return;
      void navigator.clipboard.writeText(priceLabel).then(() => {
        addNotification({ title: "Prix copié", message: priceLabel, type: "success", iconType: "faCheck" });
      }).catch(() => {
        addNotification({ title: "Copie impossible", message: "Le presse-papiers du navigateur est indisponible.", type: "warning", iconType: "faBell" });
      });
      return;
    }

    if (actionId === "table-view") {
      // Deliberately fail closed: TradingView's Table view is a complete OHLC +
      // study-output table, not our Data Window. The menu item is disabled, and a
      // programmatic invocation must never masquerade one feature as the other.
      closeChartContextMenu();
      addNotification({
        title: "Vue tableau indisponible",
        message: "La vue tableau complète n’est pas encore disponible dans cette version.",
        type: "info",
        iconType: "faBell",
      });
      return;
    }
    if (actionId === "object-tree") {
      openObjectTreeTab("object_tree");
      closeChartContextMenu();
      return;
    }
    if (actionId === "chart-template") {
      dispatch(setModalOpen({ modal: "templates", isOpen: true }));
      closeChartContextMenu();
      return;
    }
    if (actionId === "settings") {
      dispatch(setModalOpen({ modal: "settings", isOpen: true }));
      closeChartContextMenu();
      return;
    }
    if (actionId === "remove-indicators") {
      dispatch(clearAllIndicators());
      closeChartContextMenu();
      addNotification({
        title: "Indicateurs retirés",
        message: `${menu.indicatorCount} indicateur${menu.indicatorCount > 1 ? "s" : ""} retiré${menu.indicatorCount > 1 ? "s" : ""} du graphique.`,
        type: "success",
        iconType: "faCheck",
      });
      return;
    }

    if (actionId === "paste" || actionId === "lock-time-cursor" || priceValue === null || priceLabel === null) {
      return;
    }

    if (actionId === "alert") {
      const latestClose = menu.referencePriceValue ?? convertedLastCandleClose;
      const defaultCondition = Number.isFinite(latestClose) && priceValue >= latestClose ? "GREATER_THAN" : "LESS_THAN";
      dispatch(setPrefilledAlert({ price: priceValue, condition: defaultCondition }));
      dispatch(setModalOpen({ modal: "alerts", isOpen: true }));
      closeChartContextMenu();
      return;
    }

    if (!brokerState) return;
    const contextualOrder = actionId === "sell-limit"
      ? { side: "sell" as const, orderType: "limit" as const }
      : actionId === "buy-stop"
        ? { side: "buy" as const, orderType: "stop" as const }
        : actionId === "buy-limit"
          ? { side: "buy" as const, orderType: "limit" as const }
          : actionId === "sell-stop"
            ? { side: "sell" as const, orderType: "stop" as const }
            : actionId === "order"
              ? { side: "buy" as const, orderType: "limit" as const }
              : null;
    if (!contextualOrder) return;
    brokerState.openPrefilledBrokerFlow({
      symbol: menu.symbol,
      side: contextualOrder.side,
      orderType: contextualOrder.orderType,
      triggerPrice: priceValue,
      triggerLabel: priceLabel,
    });
    closeChartContextMenu();
  }, [
    addNotification,
    brokerState,
    chartContextMenu,
    closeChartContextMenu,
    convertedLastCandleClose,
    dispatch,
    openObjectTreeTab,
  ]);

  const handlePriceScaleContextMenuAction = useCallback((actionId: PriceScaleContextMenuActionId) => {
    const chart = priceScaleContextTargetRef.current;
    const targetChartId = priceScaleContextMenu?.chartId ?? null;
    const applyAppearancePatch = (patch: Partial<typeof chartAppearance>) => {
      if (targetChartId) {
        dispatch(commitLayoutChartAppearance({
          chartId: targetChartId,
          appearance: { ...chartAppearance, ...patch },
        }));
        return;
      }
      dispatch(setChartAppearance(patch));
    };

    if (actionId === "reset-price-scale" || actionId === "auto-scale") {
      resetPriceScaleAutoBounds(chart);
      closePriceScaleContextMenu();
      return;
    }

    if (actionId === "lock-price-bar-ratio" || actionId === "scale-price-chart-only") {
      return;
    }

    if (actionId === "more-settings") {
      dispatch(setModalOpen({ modal: "settings", isOpen: true }));
      closePriceScaleContextMenu();
      return;
    }

    if (actionId === "invert-scale") {
      applyAppearancePatch({ priceScaleInverted: chartAppearance.priceScaleInverted !== true });
    } else if (actionId === "mode-regular") {
      applyAppearancePatch({ priceScaleMode: "regular" });
    } else if (actionId === "mode-percent") {
      applyAppearancePatch({ priceScaleMode: "percent" });
    } else if (actionId === "mode-indexed-to-100") {
      applyAppearancePatch({ priceScaleMode: "indexed-to-100" });
    } else if (actionId === "mode-logarithmic") {
      applyAppearancePatch({ priceScaleMode: "logarithmic" });
    } else if (actionId === "move-scale") {
      applyAppearancePatch({ priceScalePosition: chartAppearance.priceScalePosition === "left" ? "right" : "left" });
    } else if (actionId === "labels") {
      applyAppearancePatch({ showPriceScaleLabels: chartAppearance.showPriceScaleLabels === false });
    } else if (actionId === "lines") {
      applyAppearancePatch({ showPriceScaleLines: chartAppearance.showPriceScaleLines === false });
    } else if (actionId === "plus-button") {
      applyAppearancePatch({ showPriceScalePlusButton: chartAppearance.showPriceScalePlusButton === false });
    }

    closePriceScaleContextMenu();
  }, [
    chartAppearance,
    closePriceScaleContextMenu,
    dispatch,
    priceScaleContextMenu?.chartId,
  ]);

  const selectedDrawing = drawings.find((d: Drawing) => d.id === selectedDrawingId) ?? null;
  const hasToolbarConfig = (type: string | undefined): type is string =>
    !!type && ((toolbarConfig as ToolbarConfig).drawings as Record<string, unknown>)[type] !== undefined;

  const selectedDrawingToolbarType = resolveDrawingToolbarType(
    selectedDrawing?.type,
    hasToolbarConfig,
  );
  const editingDrawing = drawings.find((d: Drawing) => d.id === editingDrawingId);

  const comparisonRequests = useMemo<ComparisonMarketRequest[]>(() => {
    const activeMarketScope = normalizeMarketDataScope(activeMarket.ticker);
    const requestActiveCell = multiChartLayout.charts.find(
      (cell) => cell.chartId === multiChartLayout.activeChartId,
    );
    const requestIsMultiChartMode = multiChartLayout.isEnabled && multiChartLayout.charts.length > 1;
    const primarySymbol = String(
      (requestIsMultiChartMode ? requestActiveCell?.symbol : "")
        || primaryTicker?.ticker
        || chartState.security.ticker
        || preferredTicker
        || "",
    ).trim().toUpperCase();
    const primaryMarketScope = normalizeMarketDataScope(
      (requestIsMultiChartMode ? requestActiveCell?.exchange : "")
        || primaryTicker?.exchange
        || chartState.security.exchange
        || activeMarket.ticker,
    );
    const uniqueRequests = new Map<string, ComparisonMarketRequest>();
    const candidates: ComparisonMarketRequest[] = [
      ...(comparisonSymbols ?? []).flatMap((comparisonKey) => {
        const instrument = parseCompareInstrumentKey(comparisonKey, activeMarketScope);
        return instrument ? [{ symbol: instrument.symbol, market: instrument.market, timeframe: "1D" }] : [];
      }),
      ...multiChartLayout.charts.map((chart) => {
        const sourceKind = "sourceKind" in chart && chart.sourceKind === "index" ? "index" as const : "equity" as const;
        const sourceId = "sourceId" in chart ? String(chart.sourceId ?? "").trim() : "";
        return {
          symbol: chart.symbol,
          market: normalizeMarketDataScope(chart.exchange) || activeMarketScope,
          timeframe: chart.interval,
          sourceKind,
          sourceId,
        };
      }),
    ];
    const activeTimeframe = normalizeChartTimeframe(
      requestIsMultiChartMode ? requestActiveCell?.interval : chartConfig.timeframe,
    ) ?? "1D";

    for (const candidate of candidates) {
      const symbol = String(candidate.symbol ?? "").trim().toUpperCase();
      const market = normalizeMarketDataScope(candidate.market);
      const timeframe = normalizeChartTimeframe(candidate.timeframe ?? "1D");
      const sourceKind = candidate.sourceKind === "index" ? "index" as const : "equity" as const;
      const sourceId = String(candidate.sourceId ?? "").trim();
      if (!symbol || !market || !timeframe) continue;
      if (sourceKind === "index" && !sourceId) continue;
      if (
        sourceKind === "equity"
        && symbol === primarySymbol
        && market === primaryMarketScope
        && timeframe === activeTimeframe
      ) continue;
      const requestKey = createTimeframeMarketDataCacheKey(market, symbol, timeframe, sourceKind, sourceId);
      uniqueRequests.set(requestKey, { symbol, market, timeframe, sourceKind, sourceId });
    }

    return Array.from(uniqueRequests.values());
  }, [
    activeMarket.ticker,
    chartState.security.exchange,
    chartState.security.ticker,
    chartConfig.timeframe,
    comparisonSymbols,
    multiChartLayout.activeChartId,
    multiChartLayout.charts,
    multiChartLayout.isEnabled,
    preferredTicker,
    primaryTicker?.exchange,
    primaryTicker?.ticker,
  ]);

  const {
    loadState: comparisonLoadState,
    currencyByKey: comparisonCurrencyByKey,
    seriesByKey: comparisonSeriesByKey,
    requestMoreHistory: requestMoreComparisonHistory,
  } = useComparisonManager(comparisonRequests, dataMode);

  // The shared render map is keyed by market+symbol+timeframe. Redux remains the
  // canonical 1D cache; non-daily series live in the comparison manager. The
  // active canonical chart is injected under its exact cell key so focus changes
  // never collapse 1D/1W/1M into the same dataset.
  const activeSeriesCell = multiChartLayout.charts.find(
    (cell) => cell.chartId === multiChartLayout.activeChartId,
  );
  const activeLayoutTimeframe = normalizeChartTimeframe(activeSeriesCell?.interval ?? chartConfig.timeframe) ?? "1D";
  const activeSeriesSourceKind = activeSeriesCell && "sourceKind" in activeSeriesCell && activeSeriesCell.sourceKind === "index"
    ? "index" as const
    : "equity" as const;
  const activeSeriesSourceId = activeSeriesCell && "sourceId" in activeSeriesCell
    ? String(activeSeriesCell.sourceId ?? "").trim()
    : "";
  const activeLayoutCacheKey = createTimeframeMarketDataCacheKey(
    activeSeriesCell?.exchange || chartState.security.exchange || activeMarket.ticker,
    activeSeriesCell?.symbol || chartState.security.ticker,
    activeLayoutTimeframe,
    activeSeriesSourceKind,
    activeSeriesSourceId,
  );
  const mergedMarketData = useMemo(() => {
    const merged = { ...comparisonMarketData, ...comparisonSeriesByKey };
    if (activeSeriesSourceKind === "equity" && activeLayoutCacheKey && marketData.chartData.length > 0) {
      merged[activeLayoutCacheKey] = marketData.chartData;
    }
    return merged;
  }, [
    activeLayoutCacheKey,
    activeSeriesSourceKind,
    comparisonMarketData,
    comparisonSeriesByKey,
    marketData.chartData,
  ]);
  // Peer charts receive raw native-market OHLCV from the shared cache. Convert
  // each peer independently from its API-provided quote currency to the global
  // display currency, exactly like the canonical active chart. Missing currency
  // metadata or exchange rates fail closed to native data; no market currency is
  // inferred from the exchange ticker.
  const displayMarketData = useMemo(() => {
    const converted: typeof mergedMarketData = {};
    for (const [cacheKey, series] of Object.entries(mergedMarketData)) {
      if (activeSeriesSourceKind === "equity" && cacheKey === activeLayoutCacheKey) {
        // The active symbol is intentionally excluded from ComparisonManager to
        // avoid duplicate network work. Reuse the canonical chart's effective
        // rate for every peer sharing that same cache key, otherwise inactive
        // duplicates fall back to raw native-market prices while the active
        // chart is already displayed in the global currency.
        converted[cacheKey] = convertLayoutSeriesByRate(series, chartState.effectiveRate);
        continue;
      }

      converted[cacheKey] = convertLayoutSeriesCurrency(
        series,
        comparisonCurrencyByKey[cacheKey],
        displayCurrency,
        rates,
      );
    }
    return converted;
  }, [
    activeLayoutCacheKey,
    activeSeriesSourceKind,
    chartState.effectiveRate,
    comparisonCurrencyByKey,
    displayCurrency,
    mergedMarketData,
    rates,
  ]);
  const mergedLoadState = useMemo(() => {
    // The active equity cell is intentionally excluded from ComparisonManager to
    // avoid a duplicate OHLCV request. Its terminal status must therefore come
    // from the canonical MarketDataProvider; otherwise an empty/failed active
    // timeframe falls back to `idle` and FullPeerChart keeps its loader forever.
    if (activeSeriesSourceKind !== "equity" || !activeLayoutCacheKey) {
      return comparisonLoadState;
    }
    return {
      ...comparisonLoadState,
      [activeLayoutCacheKey]: marketData.loadStatus,
    };
  }, [
    activeLayoutCacheKey,
    activeSeriesSourceKind,
    comparisonLoadState,
    marketData.loadStatus,
  ]);

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
      activeMarket,
      comparisonSymbols,
      comparisonSettings,
      movingAverageTrendSignals: normalizeMovingAverageTrendSignals(movingAverageTrendSignals),
      priceVsSmaMetrics: normalizedPriceVsSmaMetrics,
      priceVsEmaMetrics: normalizedPriceVsEmaMetrics,
      multiChartLayout,
      chartAppearancePreview,
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
      activeMarket,
      comparisonSymbols,
      comparisonSettings,
      movingAverageTrendSignals,
      normalizedPriceVsSmaMetrics,
      normalizedPriceVsEmaMetrics,
      multiChartLayout,
      chartAppearancePreview,
      replayState,
    ]
  );

  const comparisonSeries = useMemo(
    () =>
      (comparisonSymbols || [])
        .map((comparisonKey, index) => {
          const instrument = parseCompareInstrumentKey(comparisonKey, activeMarket.ticker);
          if (!instrument) return null;
          return {
            comparisonKey,
            symbol: instrument.symbol,
            market: instrument.market,
            label: getCompareInstrumentLabel(comparisonKey, activeMarket.ticker),
            data: comparisonMarketData[createMarketDataCacheKey(instrument.market, instrument.symbol)] ?? [],
            settings: resolveCompareSeriesSettings(comparisonKey, index, comparisonSettings),
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry?.symbol.length && entry.data.length)),
    [activeMarket.ticker, comparisonMarketData, comparisonSettings, comparisonSymbols]
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
    (chartId: string) => {
      // A layout cell owns its exchange+ticker binding. Activating it must not
      // clear or replace the workspace-level ticker preference.
      dispatch(setActiveLayoutChart(chartId));
    },
    [dispatch]
  );

  // A ticker edit targets a layout cell without changing the active chart. The
  // target chart id and its exchange travel together through the selector flow,
  // so editing CSE can never inherit the workspace's BRVM market by accident.
  const handleRequestLayoutTickerSelection = useCallback((chartId: string, exchange: string) => {
    const market = resolveLayoutTickerMarket(exchange);
    if (!market) return;
    openLayoutTickerSelectorForMarket(chartId, market);
  }, [openLayoutTickerSelectorForMarket]);

  // [TENOR 2026 SRE FIX] SCAR-MULTICHART-DATA-DRIFT:
  // Dynamically compute the active chart's filtered & converted series (activeDisplayChartData).
  // Ensures the active multi-chart cell actually displays the candles & Y-axis of the selected stock
  // (e.g. ETIT @ 30.00) instead of falling back to BOAC's data (~8,600).
  const activeLayoutCell = multiChartLayout.charts.find((cell) => (
    cell.chartId === multiChartLayout.activeChartId
  ));
  const isMultiChartMode = multiChartLayout.isEnabled && multiChartLayout.charts.length > 1;
  const handleActiveChartViewportChange = useCallback((viewport: ChartViewportChange) => {
    if (!multiChartLayout.isEnabled) return;
    const activeCell = multiChartLayout.charts.find(
      (cell) => cell.chartId === multiChartLayout.activeChartId,
    );
    if (!activeCell) return;

    const currentViewport = "viewport" in activeCell
      ? activeCell.viewport as ChartViewportChange | undefined
      : undefined;
    if (
      currentViewport?.startTime === viewport.startTime
      && currentViewport.endTime === viewport.endTime
      && currentViewport.yScale === viewport.yScale
      && currentViewport.isYManual === viewport.isYManual
    ) return;

    dispatch(updateLayoutChart({
      chartId: activeCell.chartId,
      viewport: { ...viewport },
    }));
  }, [
    dispatch,
    multiChartLayout.activeChartId,
    multiChartLayout.charts,
    multiChartLayout.isEnabled,
  ]);
  useEffect(() => {
    if (!isMultiChartMode || !brokerState?.isBrokerModalOpen) return;
    brokerState.setIsBrokerModalOpen(false);
  }, [brokerState?.isBrokerModalOpen, brokerState?.setIsBrokerModalOpen, isMultiChartMode]);
  const activeLayoutSymbol = String(activeLayoutCell?.symbol ?? "").trim().toUpperCase();
  const activeSymbol = String(activeLayoutSymbol || chartConfig.symbol || chartState.security.ticker || "").trim().toUpperCase();
  const hasExplicitActiveLayoutSymbol = Boolean(activeSymbol);
  const activeCellSourceKind = activeLayoutCell && "sourceKind" in activeLayoutCell && activeLayoutCell.sourceKind === "index"
    ? "index" as const
    : "equity" as const;
  const activeCellSourceId = activeLayoutCell && "sourceId" in activeLayoutCell
    ? String(activeLayoutCell.sourceId ?? "").trim()
    : "";
  const activeChartMarketScope = normalizeMarketDataScope(
    activeLayoutCell?.exchange || activeMarket.ticker,
  );
  const primaryMarketScope = normalizeMarketDataScope(
    chartState.security.exchange || activeMarket.ticker,
  );
  const primaryChartSymbol = String(primaryTicker?.ticker ?? chartState.security.ticker ?? "").trim().toUpperCase();
  const isPrimaryActive = activeCellSourceKind === "equity" && hasExplicitActiveLayoutSymbol && (
    String(activeSymbol ?? "").trim().toUpperCase()
      === primaryChartSymbol
    && activeChartMarketScope === primaryMarketScope
  );
  const activeChartCacheKey = createTimeframeMarketDataCacheKey(
    activeChartMarketScope,
    activeSymbol,
    activeLayoutCell?.interval ?? chartConfig.timeframe,
    activeCellSourceKind,
    activeCellSourceId,
  );
  const activeChartSymbol = hasExplicitActiveLayoutSymbol
    ? activeSymbol || chartState.displaySymbolName
    : "Choisir un titre";
  const activeChartLogoUrl = hasExplicitActiveLayoutSymbol
    ? (isPrimaryActive ? chartState.security.logoUrl : undefined)
      ?? getMarketLogoUrl(activeChartMarketScope, activeChartSymbol, isPrimaryActive ? chartState.security.name : undefined)

    : undefined;
  const chartCursorInteractionScopeKey = [
    chartInteractionScopeKey,
    activeChartSymbol,
    activeChartMarketScope,
    chartConfig.timeframe,
    chartState.effectiveRate,
  ].join(":");

  const handleShootingStarAlertRequest = useCallback(
    ({ price, condition, label }: { price: number; condition: "GREATER_THAN" | "LESS_THAN"; label: string }) => {
      if (!Number.isFinite(price) || price <= 0) return;
      const priceLabel = price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const symbolLabel = activeSymbol || chartState.displaySymbolName;
      dispatch(setPrefilledAlert({ price, condition }));
      dispatch(setModalOpen({ modal: "alerts", isOpen: true }));
      addNotification({
        title: "Alerte Shooting Star prÃ©parÃ©e",
        message: `${label} Â· cassure ${symbolLabel} sous ${priceLabel}`,
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
        title: "Alerte Marubozu prÃ©parÃ©e",
        message: `${label} Â· ${symbolLabel} au niveau ${priceLabel}`,
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
        title: "Alerte pattern chandelier prÃ©parÃ©e",
        message: `${label} Â· ${symbolLabel} ${conditionLabel} ${priceLabel}`,
        type: "info",
        iconType: "faBell",
      });
    },
    [activeSymbol, addNotification, chartState.displaySymbolName, dispatch],
  );

  const activeRawChartData = useMemo(() => {
    if (!hasExplicitActiveLayoutSymbol) return [];
    if (isPrimaryActive) return marketData.chartData;
    const cachedActiveSeries = mergedMarketData[activeChartCacheKey];
    if (cachedActiveSeries?.length) return cachedActiveSeries;
    return activeCellSourceKind === "index" ? [] : marketData.chartData;
  }, [
    activeCellSourceKind,
    activeChartCacheKey,
    hasExplicitActiveLayoutSymbol,
    isPrimaryActive,
    marketData.chartData,
    mergedMarketData,
  ]);

  const activeFilteredChartData = useMemo(
    () => filterChartDataByDateRange(activeRawChartData, selectedTimeRange),
    [activeRawChartData, selectedTimeRange],
  );

  const activeDisplayChartData = useMemo(() => {
    const rate = activeCellSourceKind === "index" ? 1 : chartState.effectiveRate;
    return convertLayoutSeriesByRate(activeFilteredChartData, rate);
  }, [activeCellSourceKind, activeFilteredChartData, chartState.effectiveRate]);

  useEffect(() => {
    if (isMultiChartMode || replayState.isActive) {
      setIsReplaySelectingStart(false);
    }
  }, [isMultiChartMode, replayState.isActive]);

  const handleReplayToolbarRequest = useCallback(() => {
    if (isMultiChartMode) return;
    if (replayState.isActive) {
      setIsReplaySelectingStart(false);
      marketData.stopReplay();
      return;
    }
    if (activeDisplayChartData.length < 2) {
      addNotification({
        title: "Replay indisponible",
        message: "Chargez au moins deux bougies avant de démarrer le Bar Replay.",
        type: "info",
        iconType: "faInfoCircle",
      });
      return;
    }
    dispatch(setModalOpen({ modal: "replay", isOpen: false }));
    setIsReplaySelectingStart((current) => !current);
  }, [
    activeDisplayChartData.length,
    addNotification,
    dispatch,
    isMultiChartMode,
    marketData,
    replayState.isActive,
  ]);

  const handleReplayStartSelectionClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!isReplaySelectingStart || replayState.isActive || isMultiChartMode) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest("button, a, input, select, textarea, [role='button'], [role='menu'], [role='dialog']")) return;

    const chart = refs.chartInstanceRef.current;
    const chartElement = refs.stockChartRef.current;
    if (!chart || !chartElement) return;
    const rect = chartElement.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    const axisCategories = readPrimaryXAxisCategories(chart);
    const index = resolvePixelPointerIndex(chart, { offsetX, offsetY }, activeDisplayChartData, axisCategories);

    if (index === null || !activeDisplayChartData[index]) {
      addNotification({
        title: "Sélection Bar Replay",
        message: "Cliquez sur une bougie à l'intérieur de la zone de prix.",
        type: "info",
        iconType: "faInfoCircle",
      });
      return;
    }

    marketData.startReplay(String(activeDisplayChartData[index].time));
    setIsReplaySelectingStart(false);
  }, [
    activeDisplayChartData,
    addNotification,
    isMultiChartMode,
    isReplaySelectingStart,
    marketData,
    refs.chartInstanceRef,
    refs.stockChartRef,
    replayState.isActive,
  ]);

  const captureCurrentChart = useCallback(async () => {
    const container = refs.fullscreenChartContainerRef.current;
    if (!container) throw new Error("Chart capture surface is unavailable");
    return captureChartSnapshot(container);
  }, [refs.fullscreenChartContainerRef]);

  const handleSnapshotDownload = useCallback(async () => {
    dispatch(setCapturing(true));
    try {
      const blob = await captureCurrentChart();
      downloadSnapshotBlob(blob, buildSnapshotFilename(activeChartSymbol || chartState.displaySymbolName));
      addNotification({
        title: "Capture téléchargée",
        message: "L'image PNG du graphique a été générée localement.",
        type: "success",
        iconType: "faCheck",
      });
    } catch (error) {
      console.error("[TA Snapshot] Download failed", error);
      addNotification({
        title: "Capture impossible",
        message: "Le graphique n'a pas pu être exporté en image.",
        type: "error",
        iconType: "faTimesCircle",
      });
    } finally {
      dispatch(setCapturing(false));
    }
  }, [activeChartSymbol, addNotification, captureCurrentChart, chartState.displaySymbolName, dispatch]);

  const handleSnapshotCopy = useCallback(async () => {
    dispatch(setCapturing(true));
    try {
      const blob = await captureCurrentChart();
      await copySnapshotBlob(blob);
      addNotification({
        title: "Image copiée",
        message: "La capture du graphique est dans le presse-papiers.",
        type: "success",
        iconType: "faCheck",
      });
    } catch (error) {
      console.error("[TA Snapshot] Clipboard copy failed", error);
      addNotification({
        title: "Copie impossible",
        message: "Ce navigateur n'autorise pas la copie d'image dans le presse-papiers.",
        type: "error",
        iconType: "faTimesCircle",
      });
    } finally {
      dispatch(setCapturing(false));
    }
  }, [addNotification, captureCurrentChart, dispatch]);

  const handleSnapshotOpen = useCallback(() => {
    const targetWindow = window.open("about:blank", "_blank");
    if (targetWindow) targetWindow.opener = null;
    dispatch(setCapturing(true));
    void captureCurrentChart()
      .then((blob) => {
        openSnapshotBlob(blob, targetWindow);
        addNotification({
          title: "Capture ouverte",
          message: "L'image du graphique a été ouverte dans un nouvel onglet.",
          type: "success",
          iconType: "faCheck",
        });
      })
      .catch((error) => {
        targetWindow?.close();
        console.error("[TA Snapshot] Open failed", error);
        addNotification({
          title: "Ouverture impossible",
          message: "Le navigateur a bloqué l'onglet ou la capture a échoué.",
          type: "error",
          iconType: "faTimesCircle",
        });
      })
      .finally(() => dispatch(setCapturing(false)));
  }, [addNotification, captureCurrentChart, dispatch]);

  useEffect(() => {
    const handleSnapshotShortcut = (event: KeyboardEvent) => {
      const activeElement = document.activeElement;
      if (activeElement instanceof HTMLElement && (
        activeElement.tagName === "INPUT"
        || activeElement.tagName === "TEXTAREA"
        || activeElement.tagName === "SELECT"
        || activeElement.isContentEditable
      )) return;

      const isS = event.key.toLowerCase() === "s";
      if (isS && event.ctrlKey && event.altKey && !event.shiftKey && !event.metaKey) {
        event.preventDefault();
        void handleSnapshotDownload();
      } else if (isS && event.ctrlKey && event.shiftKey && !event.altKey && !event.metaKey) {
        event.preventDefault();
        void handleSnapshotCopy();
      }
    };
    window.addEventListener("keydown", handleSnapshotShortcut);
    return () => window.removeEventListener("keydown", handleSnapshotShortcut);
  }, [handleSnapshotCopy, handleSnapshotDownload]);

  const activeSecondaryLoadStatus = isMultiChartMode && !isPrimaryActive && activeLayoutSymbol
    ? (mergedLoadState[activeChartCacheKey] ?? "idle")
    : null;
  const activeLoadStatus = isMultiChartMode && !isPrimaryActive
    ? (activeSecondaryLoadStatus ?? "idle")
    : marketData.loadStatus;
  const hasActiveDisplayData = activeDisplayChartData.length > 0;
  const {
    showLoader: shouldShowPrimaryChartLoader,
    showError: shouldShowPrimaryChartErrorState,
    showEmpty: shouldShowPrimaryChartEmptyState,
  } = resolvePrimaryChartAsyncPresentation({
    hasExplicitSymbol: hasExplicitActiveLayoutSymbol,
    hasDisplayData: hasActiveDisplayData,
    isInitialBootstrapLoading: isInitialSidebarLoading,
    loadStatus: activeLoadStatus,
  });

  // [TENOR 2026 SRE FIX] SCAR-MULTICHART-BADGE-STALE-DATA:
  // When a secondary chart is active (e.g. SGBC), chartState.displayChartData still has BOAB's data.
  // Use comparisonMarketData[chartConfig.symbol] (pre-loaded when the cell was secondary) so that
  // updateLastPriceAxisBadge calls convertToPixel() with the CORRECT active price â not BOAB's.
  // The axis badge and rendered series must share the same display-currency value.
  // This keeps convertToPixel() aligned with the values visible in the chart.
  const lightweightLastPrice = activeDisplayChartData.length > 0
    ? activeDisplayChartData[activeDisplayChartData.length - 1].close
    : Number.NaN;
  const shouldRenderLastPriceAxis =
    !shouldShowPrimaryChartLoader && hasRenderableMarketPrice(lightweightLastPrice);

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

  const activeOverlayRendererProps: ChartRenderEngineProps["overlay"] = {
    selectedDrawingId,
    drawings,
    chartInstanceRef: refs.chartInstanceRef,
    drawingCanvasRef: refs.drawingCanvasRef,
    drawingToolbarRef: refs.drawingToolbarRef,
    gridRect,
    toolbarOffsetRef,
    chartData: activeDisplayChartData,
    interactionScopeKey: chartInteractionScopeKey,
    isChartLoading: shouldShowPrimaryChartLoader,
  };
  const activeCursorRendererProps: ChartRenderEngineProps["cursor"] = {
    canvasRef: refs.cursorCanvasRef,
    containerRef: refs.layersStackRef,
    eventSourceRef: refs.drawingCanvasRef,
    mode: cursorMode,
    suspendForDrawing: Boolean(activeTool),
    chartRef: refs.chartInstanceRef as React.RefObject<EChartsInstance>,
    chartData: activeDisplayChartData,
    interactionScopeKey: chartCursorInteractionScopeKey,
    crosshairColor: chartAppearance.crosshairColor,
    isChartLoading: shouldShowPrimaryChartLoader,
    cursorPriceBadgeRef: refs.cursorPriceBadgeRef,
    cursorPriceTextRef: refs.cursorPriceTextRef,
    cursorPriceActionRef: refs.cursorPriceActionRef,
    lastPriceBadgeRef: refs.lastPriceBadgeRef,
    lastPriceLineRef: refs.lastPriceLineRef,
    lastPriceAxisValue: shouldRenderLastPriceAxis ? lightweightLastPrice : undefined,
  };

  return (
    <TechnicalAnalysisPortalProvider>
    <div
      ref={refs.mainContainerRef}
      className={clsx("technical-analysis-root", "technical-analysis-bootstrap-scope", isZenMode && "is-zen-mode")}
      onContextMenuCapture={handleTechnicalAnalysisContextMenuCapture}
    >
      {isZenMode && (
        <div className="gp-zen-mode-hint" role="status">
          <i className="bi bi-arrows-fullscreen" aria-hidden="true" />
          <span>Mode Zen · Échap ou Shift+F pour afficher les panneaux</span>
        </div>
      )}
      <div className={"gp-global-wrapper"}>
        <div className={clsx("page-content-wrapper", "mt-1")}>
          <MemoizedChartToolbar
            userInitials={chartState.userInitials}
            displaySymbol={chartState.displaySymbolName}
            openTickerSelector={openTickerSelector}
            isReplaySelectingStart={isReplaySelectingStart}
            onReplayRequest={handleReplayToolbarRequest}
            onTimeframeChange={handleTimeframeChange}
            onSaveAnalysis={handleSaveAnalysis}
            onOpenLoadModal={handleOpenLoadModal}
            onSnapshotDownload={handleSnapshotDownload}
            onSnapshotCopy={handleSnapshotCopy}
            onSnapshotOpen={handleSnapshotOpen}
          />

          {comparisonSymbols.length > 0 && (
            <div className="gp-compare-strip">
              <span className="gp-compare-strip__label">Compare %</span>
              {comparisonSymbols.map((comparisonKey, index) => {
                const compareSettings = resolveCompareSeriesSettings(comparisonKey, index, comparisonSettings);
                const compareColor = compareSettings.color;
                const compareLabel = getCompareInstrumentLabel(comparisonKey, activeMarket.ticker);
                return (
                  <div
                    key={comparisonKey}
                    className="gp-compare-strip__chip"
                    style={{ "--compare-color": compareColor } as React.CSSProperties}
                  >
                    <button
                      type="button"
                      className="gp-compare-strip__open"
                      onClick={() => openCompareSettings(comparisonKey)}
                      title={`Modifier ${compareLabel}`}
                    >
                      <span className="gp-compare-strip__swatch" aria-hidden="true" />
                      <span className="gp-compare-strip__symbol">{compareLabel}</span>
                    </button>
                    <button
                      type="button"
                      className="gp-compare-strip__remove"
                      aria-label={`Retirer ${compareLabel}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        dispatch(removeComparisonSymbol(comparisonKey));
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
                isInitialLoading={isInitialSidebarLoading}
              />

              <div ref={refs.chartViewWrapperRef} className={"gp-chart-view-wrapper"}>
                <div
                  ref={refs.fullscreenChartContainerRef}
                  className={clsx("gp-chart-container", isZenMode && "zen-mode")}
                  data-chart-context-menu-surface="true"
                  data-replay-selecting={isReplaySelectingStart ? "true" : "false"}
                  onClickCapture={!isMultiChartMode ? handleReplayStartSelectionClick : undefined}
                  onContextMenuCapture={!isMultiChartMode ? handlePrimaryChartContextMenu : undefined}
                  style={{ position: "relative" }}
                >
                  {isReplaySelectingStart && !replayState.isActive && (
                    <div className="gp-replay-selection-banner" role="status">
                      <i className="bi bi-crosshair" aria-hidden="true" />
                      <span>Sélectionnez la bougie de départ · Échap pour annuler</span>
                    </div>
                  )}

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

                  {!isMultiChartMode && replayState.isActive && (
                    <ReplayControls
                      isPaused={replayState.isPaused}
                      speed={replayState.speed}
                      currentIndex={replayState.currentIndex}
                      totalCandles={replayState.totalCandles}
                      currentTime={String(activeDisplayChartData[activeDisplayChartData.length - 1]?.time ?? "")}
                      onTogglePause={marketData.toggleReplayPause}
                      onStepForward={() => marketData.stepReplay(1)}
                      onSpeedChange={(speedMs) => dispatch(setReplaySpeed(speedMs))}
                      onJumpToRealtime={marketData.jumpReplayToRealtime}
                      onExit={marketData.stopReplay}
                    />
                  )}

                  <MultiChartLayoutGrid
                    layout={multiChartLayout}
                    marketData={displayMarketData}
                    dataLoadState={mergedLoadState}
                    dataMode={dataMode}
                    activeChartInstanceRef={refs.chartInstanceRef}
                    chartAppearance={chartAppearance}
                    uiState={uiStateProxy}
                    hiddenObjectIds={hiddenObjectIds}
                    onActivateChart={handleActivateLayoutChart}
                    onChartContextMenu={handleMultiChartContextMenu}
                    onRequestMarketSelection={handleRequestLayoutMarketSelection}
                    onRequestTickerSelection={handleRequestLayoutTickerSelection}
                    onHistoryBoundaryRequest={(cell, direction) => {
                      if (cell.chartId === multiChartLayout.activeChartId) {
                        marketData.requestMoreHistory(direction);
                        return;
                      }
                      const sourceKind = "sourceKind" in cell && cell.sourceKind === "index" ? "index" as const : "equity" as const;
                      const sourceId = "sourceId" in cell ? String(cell.sourceId ?? "").trim() : "";
                      requestMoreComparisonHistory({
                        symbol: cell.symbol,
                        market: cell.exchange,
                        timeframe: cell.interval,
                        sourceKind,
                        sourceId,
                      }, direction);
                    }}
                  >
                    <div
                      data-interaction-scope={chartInteractionScopeKey}
                      className={clsx("gp-chart-layers-stack", shouldShowPrimaryChartLoader && "is-chart-loading")}
                      ref={refs.layersStackRef}
                      style={{
                        position: isMultiChartMode ? "absolute" : "relative",
                        inset: isMultiChartMode ? 0 : undefined,
                        flexGrow: isMultiChartMode ? undefined : 1,
                        minHeight: 0,
                        overflow: "hidden",
                        zIndex: isMultiChartMode ? 2 : undefined,
                        background: isMultiChartMode ? "transparent" : undefined,
                        pointerEvents: isMultiChartMode ? "none" : undefined,
                      }}
                    >
                      {!isMultiChartMode && <div className="gp-chart-world-map" aria-hidden="true" />}
                      {!isMultiChartMode && shouldShowPrimaryChartEmptyState && (
                        <MemoizedChartEmptyIdentity
                          symbol={activeChartSymbol || chartState.security.ticker || "Titre sélectionné"}
                          exchange={activeChartMarketScope || chartState.security.exchange || "Marché"}
                          logoUrl={activeChartLogoUrl}
                        />
                      )}
                      {!shouldShowPrimaryChartEmptyState && !isMultiChartMode && activeChartLogoUrl && (
                        <img
                          className="gp-chart-symbol-logo"
                          src={activeChartLogoUrl}
                          alt={`${activeChartSymbol} logo`}
                          draggable={false}
                        />
                      )}
                      {!isMultiChartMode && (
                        <div
                          id="gp-stock-chart"
                          className={clsx("technical-analysis-chart", `cursor-mode-${cursorMode.split("-")[0]}`)}
                          ref={refs.stockChartRef}
                          style={{ width: "100%", height: "100%", touchAction: "none", position: "relative", zIndex: 1 }}
                        />
                      )}

                      {isMultiChartMode ? (
                        <ChartInteractionEngine
                          overlay={activeOverlayRendererProps}
                          cursor={activeCursorRendererProps}
                        />
                      ) : (
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
                          chartAppearance: effectivePrimaryChartAppearance,
                          uiState: uiStateProxy,
                          displaySymbol: activeChartSymbol,
                          displayLogoUrl: activeChartLogoUrl,
                          marketLabel: activeChartMarketScope || chartState.security.exchange || "BRVM",
                          hideChartTitle: isMultiChartMode,
                          lastZoomRangeRef: refs.lastZoomRangeRef,
                          lastPriceAxisValue: shouldRenderLastPriceAxis ? lightweightLastPrice : undefined,
                          isMainChartVisible: chartState.isMainChartVisible,
                          isChartLoading: shouldShowPrimaryChartLoader,
                          hasLiveStitchedCandle: isPrimaryActive && chartState.hasLiveStitchedCandle,
                          comparisonSeries,
                          onCompareSeriesSettingsRequest: openCompareSettings,
                          onIndicatorConfigurationRequest: setIndicatorConfigurationTarget,
                          onMarubozuAlertRequest: handleMarubozuAlertRequest,
                          onShootingStarAlertRequest: handleShootingStarAlertRequest,
                          onCandlestickPatternAlertRequest: handleCandlestickPatternAlertRequest,
                          hiddenObjectIds,
                          pineOverlay: pineChartOverlay,
                          onHistoryBoundaryRequest: marketData.requestMoreHistory,
                           onViewportChange: handleActiveChartViewportChange,
                        }}
                        overlay={activeOverlayRendererProps}
                        cursor={activeCursorRendererProps}
                      />
                      )}

                      <VolumeStudyLegend
                        chartInstanceRef={refs.chartInstanceRef as React.RefObject<EChartsInstance | null>}
                        attached={volumeStudyLifecycle.attached}
                        visible={volumeStudyLifecycle.studyVisible}
                        outputEnabled={volumeStudyLifecycle.outputEnabled}
                        symbol={activeChartSymbol || chartState.displaySymbolName}
                        onToggleVisibility={handleToggleVolumeStudyVisibility}
                        onConfigure={handleConfigureVolumeStudy}
                        onRemove={handleRemoveVolumeStudy}
                        onOpenObjectTree={handleOpenVolumeObjectTree}
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

                    {!isMultiChartMode && hasExplicitActiveLayoutSymbol && hasActiveDisplayData && <ConnectedTradeHUD />}

                    {!isMultiChartMode && brokerState?.isBrokerModalOpen && (
                      <MemoizedBrokerModal
                        isBrokerModalOpen={brokerState.isBrokerModalOpen}
                        setIsBrokerModalOpen={brokerState.setIsBrokerModalOpen}
                        selectedBroker={brokerState.selectedBroker}
                        setSelectedBroker={brokerState.setSelectedBroker}
                        brokerConnectionState={brokerState.brokerConnectionState}
                        setBrokerConnectionState={brokerState.setBrokerConnectionState}
                        orderIntent={brokerState.brokerOrderIntent}
                        setOrderIntent={brokerState.setBrokerOrderIntent}
                        isOrderSubmissionBlocked={brokerState.isOrderSubmissionBlocked}
                        setIsOrderSubmissionBlocked={brokerState.setIsOrderSubmissionBlocked}
                      />
                    )}

                    <ConnectedPriceAxisOverlay />

                    {!isMultiChartMode && <TimeAxisControls chartInstanceRef={refs.chartInstanceRef} />}

                    {!isMultiChartMode && <MemoizedPremiumLoader isVisible={shouldShowPrimaryChartLoader} />}
                    {!isMultiChartMode && shouldShowPrimaryChartEmptyState && <MemoizedChartEmptyState />}
                    {!isMultiChartMode && shouldShowPrimaryChartErrorState && <MemoizedChartErrorState />}

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
                  isHistoricalDataUnavailable={shouldShowPrimaryChartEmptyState}
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
                        symbolDisplay={`${chartState.displaySymbolName} Â· ${chartState.security.exchange || activeMarket.ticker}, 1D`}
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

      <ChartContextMenu
        state={chartContextMenu}
        canTrade={Boolean(brokerState)}
        onAction={handleChartContextMenuAction}
        onClose={closeChartContextMenu}
      />
      <PriceScaleContextMenu
        state={priceScaleContextMenu}
        mode={chartAppearance.priceScaleMode ?? "regular"}
        position={chartAppearance.priceScalePosition === "left" ? "left" : "right"}
        inverted={chartAppearance.priceScaleInverted === true}
        labelsVisible={chartAppearance.showPriceScaleLabels !== false}
        linesVisible={chartAppearance.showPriceScaleLines !== false}
        plusButtonVisible={chartAppearance.showPriceScalePlusButton !== false}
        onAction={handlePriceScaleContextMenuAction}
        onClose={closePriceScaleContextMenu}
      />

      {shouldMountModalOrchestrator && (
        <MemoizedModalOrchestrator
          dr={selectedDrawing ?? undefined}
          updateDrawing={updateDrawing}
          replaceImageNoteAsset={replaceImageNoteAsset}
          createImageNoteDrawing={createImageNoteDrawing}
          startReplay={marketData.startReplay}
          setChartData={marketData.setChartData}
          onRevealObjectIds={revealIndicatorObjectIds}
          onConfigureIndicator={setIndicatorConfigurationTarget}
        />
      )}
      <IndicatorConfigurationModal
        isOpen={indicatorConfigurationTarget !== null}
        target={indicatorConfigurationTarget}
        onClose={() => setIndicatorConfigurationTarget(null)}
      />
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
    </TechnicalAnalysisPortalProvider>
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
