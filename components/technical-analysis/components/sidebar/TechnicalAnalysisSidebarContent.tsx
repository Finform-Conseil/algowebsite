import React from "react";
import ReactDOM from "react-dom";
import dynamic from "next/dynamic";
import { useSelector } from "react-redux";
import type { RootState } from "@/core/infra/store";
import { BRVM_DISPLAY_TIME_ZONE_LABEL } from "../../utils/brvmMarketSession";
import { openBrvmBondsPage, openBrvmEquityPage } from "./actions/sidebarExternalLinks";
import { hasApiVolatilityTermStructure } from "./charts/sidebarVolatilityChartOptions";
import { selectMarketSnapshots } from "../../store/selectors";
import { SidebarAuditTrail, SidebarUnavailableState } from "./components/SidebarFeedback";
import type { AuditTrailItem } from "./data/sidebarDataTypes";
import type { DisplaySecurity, LiveSnapshot } from "../../config/market/marketSnapshotTypes";
import type { TechnicalAnalysisSidebarController } from "./hooks/useTechnicalAnalysisSidebarController";
import { SidebarRail, type SidebarRailEntryId } from "./SidebarRail";
import { SidebarRailSkeleton } from "./SidebarRailSkeleton";
import { ProductsMenuPopover, DEFAULT_PINNED, type ProductsMenuEntryId } from "./panels/ProductsMenuPopover";
import { useTechnicalAnalysisPortalTarget } from "@/components/technical-analysis/components/common/portal/useTechnicalAnalysisPortalTarget";
import { BrvmRailPanel } from "./panels/BrvmRailPanel";
import { CalendarRailPanel } from "./panels/CalendarRailPanel";
import { ChatsRailPanel } from "./panels/ChatsRailPanel";
import { CommunityRailPanel } from "./panels/CommunityRailPanel";
import { AlertsRailPanel } from "./panels/AlertsRailPanel";
import { AlertsRailRuntime } from "./panels/alertsRail/AlertsRailRuntime";
import type { AlertsRailContext, AlertsRailContextByTicker } from "./panels/alertsRailModel";
import { buildIndicatorAlertValuesFromSeries } from "./panels/alertsRail/alertsRailIndicatorMetrics";
import { BondsPanel } from "./panels/BondsPanel";
import { DividendsPanel } from "./panels/DividendsPanel";
import { FundamentalsPanel } from "./panels/FundamentalsPanel";
import { IncomeStatementPanel } from "./panels/IncomeStatementPanel";
import { ModelHeuristicPanel } from "./panels/ModelHeuristicPanel";
import { PerformancePanel } from "./panels/PerformancePanel";
import { PineEditorPanel } from "./panels/PineEditorPanel";
import { ProfilePanel } from "./panels/ProfilePanel";
import { NotificationsRailPanel } from "./panels/NotificationsRailPanel";
import { SeasonalityPanel } from "./panels/SeasonalityPanel";
import { ScreenersPanel } from "./panels/ScreenersPanel";
import { SidebarNewsPanel } from "./panels/SidebarNewsPanel";
import { SidebarStatsPanel } from "./panels/SidebarStatsPanel";
import { TechnicalsPanel } from "./panels/TechnicalsPanel";
import { VolatilityPanels } from "./panels/VolatilityPanels";
import { WatchlistPanel } from "./panels/WatchlistPanel";
import {
  SIDEBAR_DESTINATION_TARGETS,
  TECHNICAL_ANALYSIS_SIDEBAR_NAVIGATE,
  type TechnicalAnalysisSidebarDestination,
} from "./sidebarNavigation";

const DividendHistoryModal = dynamic(
  () => import("./modals/DividendHistoryModal").then((module) => module.DividendHistoryModal),
  { ssr: false, loading: () => null },
);

const auditTrail = (items: AuditTrailItem[]) => <SidebarAuditTrail items={items} />;
const unavailable = (message: string) => <SidebarUnavailableState message={message} />;

const asAuditTone = (tone: string | undefined): AuditTrailItem["tone"] => (
  tone === "success" || tone === "warning" || tone === "neutral" ? tone : undefined
);

const formatNumber = (value: number | null | undefined, digits = 2) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return "N/D";
  return value.toLocaleString("fr-FR", { maximumFractionDigits: digits, minimumFractionDigits: digits });
};

const formatPercent = (value: number | null | undefined) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return "N/D";
  return `${value > 0 ? "+" : ""}${formatNumber(value)}%`;
};

const formatCurrency = (value: number | null | undefined, currency: string) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return "N/D";
  return `${formatNumber(value)} ${currency}`;
};

const formatVolumeRatio = (currentVolume: number | null, avgVolume: number | null) => {
  if (currentVolume === null || avgVolume === null || !Number.isFinite(currentVolume) || !Number.isFinite(avgVolume) || avgVolume <= 0) return "N/D";
  return `${formatNumber(currentVolume / avgVolume, 1)}x moyenne`;
};

const toFiniteNumberOrNull = (value: number | null | undefined) => (
  value !== null && value !== undefined && Number.isFinite(value) ? value : null
);

const resolveVolumeRatio = (currentVolume: number | null, avgVolume: number | null) => {
  if (currentVolume === null || avgVolume === null || !Number.isFinite(currentVolume) || !Number.isFinite(avgVolume) || avgVolume <= 0) return null;
  return currentVolume / avgVolume;
};

const normalizeProfileDescription = (description: string | null | undefined) => {
  const text = description?.trim() || "";
  if (!text) return null;
  if (/^(description\s+)?(de\s+l["'’]entreprise\s+)?non disponible\.?$/i.test(text)) return null;
  return text;
};

const buildProfileDescriptionFallback = (security: DisplaySecurity) => {
  const name = security.name || security.ticker;
  const ticker = security.ticker ? " (" + security.ticker + ")" : "";
  const exchange = security.exchange || "BRVM";
  const sector = security.sector && security.sector !== "Other" ? " du secteur " + security.sector : "";
  const country = security.country ? " au " + security.country : " dans la zone UEMOA";
  const currency = security.currency || "XOF";
  return name + ticker + " est une valeur " + exchange + sector + ", suivie" + country + " et cotee en " + currency + ". Les fondamentaux verifies restent indisponibles pour ce titre; cette description utilise uniquement le catalogue local.";
};

const buildAlertContextsByTicker = (current: AlertsRailContext, snapshots: Record<string, LiveSnapshot>, security: DisplaySecurity): AlertsRailContextByTicker => {
  const contexts: AlertsRailContextByTicker = { [current.ticker]: current };
  Object.values(snapshots).forEach((snapshot) => {
    const context = buildSnapshotAlertContext(snapshot, security);
    if (context) contexts[context.ticker] = context;
  });
  contexts[current.ticker] = current;
  return contexts;
};

const buildSnapshotAlertContext = (snapshot: LiveSnapshot, currentSecurity: DisplaySecurity): AlertsRailContext | null => {
  const ticker = snapshot.symbol.trim().toUpperCase();
  const price = toFiniteNumberOrNull(snapshot.price);
  if (!ticker || price === null) return null;
  const isCurrentSecurity = currentSecurity.ticker.toUpperCase() === ticker;
  const currency = isCurrentSecurity ? (currentSecurity.currency || "N/D") : "N/D";
  const changePercent = readSnapshotChangePercent(snapshot);
  const volume = toFiniteNumberOrNull(snapshot.volume);
  return {
    changeLabel: formatPercent(changePercent),
    changePercent,
    changeTone: (changePercent ?? 0) > 0 ? "success" : (changePercent ?? 0) < 0 ? "danger" : "neutral",
    currentPrice: price,
    defaultThreshold: price.toLocaleString("fr-FR", { maximumFractionDigits: 0 }),
    dividendLabel: "Dividende non charge",
    hasDividend: false,
    hasNews: false,
    marketLabel: isCurrentSecurity
      ? [currentSecurity.exchange, currentSecurity.country].filter(Boolean).join(" · ") || "N/D"
      : "N/D",
    name: isCurrentSecurity ? currentSecurity.name : ticker,
    newsLabel: "Flux non charge",
    priceLabel: formatCurrency(price, currency),
    sessionLabel: snapshot.sourceLabel || snapshot.source || "Snapshot marche",
    ticker,
    volumeLabel: volume === null ? "N/D" : volume.toLocaleString("fr-FR"),
    volumeRatio: null,
  };
};

const readSnapshotChangePercent = (snapshot: LiveSnapshot): number | null => {
  const injected = (snapshot as LiveSnapshot & { variationNum?: unknown }).variationNum;
  if (typeof injected === "number" && Number.isFinite(injected)) return injected;
  const parsed = Number(snapshot.variation.replace(/[^\d,.-]/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
};

export const TechnicalAnalysisSidebarContent = ({ controller }: { controller: TechnicalAnalysisSidebarController }) => {
  const {
    activeSidebarEntry,
    actions,
    alertDraftRequest,
    chartConfig,
    clipboardStatus,
    displayMarketCap,
    displayPeRatio,
    displayReturnYTD,
    feeds,
    getClipboardLabel,
    incomeViewMode,
    isDescriptionExpanded,
    isDividendModalOpen,
    isFundamentalsPanelLoading,
    isSecondaryWorkReady,
    isSettingsOpen,
    marketClock,
    metrics,
    props,
    refs,
    watchlistSettings,
  } = controller;
  const { apiTechnicalIndicator, chartData, dataMode, isLoading, liveChange, liveChangePercent, livePrice, liveVolume, security } = props;
  const portalTarget = useTechnicalAnalysisPortalTarget();
  const [pendingAlertEditId, setPendingAlertEditId] = React.useState<string | null>(null);
  const [isProductsMenuOpen, setIsProductsMenuOpen] = React.useState(false);
  const [pinnedItems, setPinnedItems] = React.useState<ProductsMenuEntryId[]>(DEFAULT_PINNED);
  const [popoverStyle, setPopoverStyle] = React.useState<React.CSSProperties>({});
  const toolbarRef = React.useRef<HTMLDivElement>(null);
  const marketSnapshots = useSelector((state: RootState) => selectMarketSnapshots(state));
  const currency = security.currency || "N/D";
  const marketStatusLabel = marketClock.sidebarMarketStatus.label === "N/D"
    ? "Statut de séance indisponible pour cette bourse."
    : (marketClock.sidebarMarketStatus.isOpen ? "Market open" : "Market closed");
  const sidebarLastUpdateLabel = dataMode === "real" && !props.lastUpdate
    ? "N/D"
    : marketClock.sidebarLastUpdateLabel;
  const activeEntry: SidebarRailEntryId = props.isObjectTreeOpen ? "object-tree" : activeSidebarEntry;
  const latestDividend = chartConfig.validFundamentals?.dividends[chartConfig.validFundamentals.dividends.length - 1] ?? null;
  const marketLabel = [security.exchange, security.country].filter(Boolean).join(" · ") || "N/D";
  const profileDescription = normalizeProfileDescription(feeds.validFundamentals?.description)
    ?? (dataMode === "real" ? "Description indisponible via l’API." : buildProfileDescriptionFallback(security));

  const fundamentalsAudit = [
    { label: "Source", value: metrics.fundamentalsSource, tone: asAuditTone(metrics.fundamentalsAuditTone) },
    { label: "Date", value: "FY " + metrics.fundamentalsAuditYear },
  ] satisfies AuditTrailItem[];
  const combinedAudit = [
    { label: "Source", value: metrics.marketDataSource + " + " + metrics.fundamentalsSource, tone: asAuditTone(metrics.combinedAuditTone) },
    { label: "Date", value: "Prix " + metrics.marketAuditDate + " / FY " + metrics.fundamentalsAuditYear },
  ] satisfies AuditTrailItem[];

  const handleRailSelect = (entryId: SidebarRailEntryId) => {
    actions.setActiveSidebarEntry(entryId);
    if (entryId === "object-tree") {
      if (!props.isObjectTreeOpen) props.onToggleObjectTree?.();
      return;
    }
    if (props.isObjectTreeOpen) props.onToggleObjectTree?.();
  };

  React.useEffect(() => {
    const handleSidebarNavigation = (event: Event) => {
      const destination = (event as CustomEvent<{ destination?: TechnicalAnalysisSidebarDestination }>).detail?.destination;
      if (!destination || !(destination in SIDEBAR_DESTINATION_TARGETS)) return;

      handleRailSelect(destination === "calendar" ? "calendar" : "watchlist");
      const targetId = SIDEBAR_DESTINATION_TARGETS[destination];
      if (!targetId) return;
      window.requestAnimationFrame(() => {
        document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    };
    window.addEventListener(TECHNICAL_ANALYSIS_SIDEBAR_NAVIGATE, handleSidebarNavigation);
    return () => window.removeEventListener(TECHNICAL_ANALYSIS_SIDEBAR_NAVIGATE, handleSidebarNavigation);
  });

  const handleProductsClick = React.useCallback(() => {
    setIsProductsMenuOpen((prev) => {
      if (!prev && toolbarRef.current) {
        const rect = toolbarRef.current.getBoundingClientRect();
        setPopoverStyle({
          position: "fixed",
          right: `${window.innerWidth - rect.left + 4}px`,
          top: `${rect.top + rect.height / 2}px`,
          transform: "translateY(-50%)",
        });
      }
      return !prev;
    });
  }, []);

  const handleTogglePin = React.useCallback((entryId: ProductsMenuEntryId) => {
    setPinnedItems((prev) =>
      prev.includes(entryId)
        ? prev.filter((id) => id !== entryId)
        : [...prev, entryId],
    );
  }, []);

  const handleProductsMenuClose = React.useCallback(() => {
    setIsProductsMenuOpen(false);
  }, []);

  const openAlertsForEdit = (alertId: string) => {
    setPendingAlertEditId(alertId);
    actions.setActiveSidebarEntry("alerts");
    if (props.isObjectTreeOpen) props.onToggleObjectTree?.();
  };

  const watchlistPanel = (
    <WatchlistPanel
      displayTimeZoneLabel={BRVM_DISPLAY_TIME_ZONE_LABEL}
      indicesData={feeds.indicesData}
      indicesError={feeds.indicesError}
      isIndicesLoading={feeds.isIndicesLoading}
      isIndicesOpen={feeds.isIndicesOpen}
      isLoading={Boolean(isLoading)}
      isMarketPositive={props.isMarketPositive}
      isSettingsOpen={isSettingsOpen}
      liveChange={liveChange}
      liveChangePercent={liveChangePercent}
      livePrice={livePrice}
      liveVolume={liveVolume}
      onAddSymbol={actions.openSearch}
      onAdvancedView={() => props.openTickerSelector?.()}
      onSettingChange={actions.setWatchlistSetting}
      onToggleIndices={actions.toggleIndices}
      onToggleSettings={actions.toggleSettings}
      security={security}
      settings={watchlistSettings}
      sidebarLastUpdateLabel={sidebarLastUpdateLabel}
      marketStatusLabel={marketStatusLabel}
    />
  );
  const isNewsPanelLoading = Boolean(isLoading) || feeds.isNewsLoading;
  const newsPanel = <div id="gp-sidebar-news"><SidebarNewsPanel activeNews={feeds.activeNews} isLoading={isNewsPanelLoading} newsKey={feeds.currentNewsIdx} onHoverChange={actions.setIsNewsHovered} /></div>;
  const statsPanel = <SidebarStatsPanel auditTrail={auditTrail([...combinedAudit, { label: "Formule", value: "YTD, P/E, Vol, Avg20, Cap, PNB/FY" }, { label: "Devise", value: metrics.auditCurrency }])} avgVolume={props.avgVolume} currentVolume={props.currentVolume} isLoading={isFundamentalsPanelLoading} marketCap={displayMarketCap} currency={currency} peRatio={displayPeRatio} returnYTD={displayReturnYTD} revenueT12M={metrics.displayRevenueT12M} />;
  const fundamentalsPanel = <div id="gp-sidebar-fundamentals"><FundamentalsPanel chartRef={props.benefitsChartRef} isLoading={isFundamentalsPanelLoading} isAvailable={metrics.hasVerifiedEarnings} auditTrail={auditTrail([...fundamentalsAudit, { label: "Formule", value: "Benefice net lu BRVM, trie par exercice" }, { label: "Devise", value: "M " + currency }])} onMoreInfo={() => openBrvmEquityPage(security.ticker)} /></div>;
  const dividendsPanel = <DividendsPanel chartRef={props.dividendsChartRef} isLoading={isFundamentalsPanelLoading} isAvailable={metrics.hasVerifiedDividends} auditTrail={auditTrail([...fundamentalsAudit, { label: "Source", value: "Ratios natifs API; absence => N/D" }, { label: "Devise", value: metrics.auditCurrency }])} onMoreInfo={() => actions.setIsDividendModalOpen(true)} />;
  const incomePanel = <IncomeStatementPanel chartRef={refs.incomeChartRef} isLoading={isFundamentalsPanelLoading} isAvailable={chartConfig.canRenderIncomeStatement} viewMode={incomeViewMode} onModeChange={actions.setIncomeViewMode} auditTrail={auditTrail([...fundamentalsAudit, { label: "Formule", value: "Marge nette = Resultat net / Revenu" }, { label: "Devise", value: "M " + currency }])} onMoreFinancials={() => openBrvmEquityPage(security.ticker)} />;
  const performancePanel = <PerformancePanel rows={metrics.performanceRows} auditTrail={auditTrail([{ label: "Source", value: metrics.marketDataSource, tone: asAuditTone(metrics.auditTone) }, { label: "Date", value: metrics.marketAuditDate }, { label: "Devise", value: "%" }])} />;
  const seasonalityPanel = <SeasonalityPanel auditTrail={auditTrail([{ label: "Source", value: dataMode === "real" ? "Saisonnalité native API" : metrics.marketDataSource + " · OHLCV mock", tone: asAuditTone(metrics.auditTone) }, { label: "Date", value: metrics.marketAuditDate }, { label: "Formule", value: dataMode === "real" ? "Aucun calcul local; absence API => indisponible" : "(Close mois - Close debut annee) / Close debut annee" }, { label: "Devise", value: "%" }])} chartRef={refs.seasonalChartRef} isAvailable={metrics.seasonalYears.length > 0} isLoading={Boolean(isLoading)} onMoreSeasonals={() => openBrvmEquityPage(security.ticker)} unavailableState={unavailable(dataMode === "real" ? "Saisonnalité native indisponible via l’API." : "Saisonnalite indisponible: aucune cloture exploitable.")} years={metrics.seasonalYears} />;
  const technicalsPanel = <TechnicalsPanel auditTrail={auditTrail([{ label: "Source", value: dataMode === "real" ? "Recommandation native API" : metrics.marketDataSource, tone: asAuditTone(metrics.auditTone) }, { label: "Date", value: metrics.marketAuditDate }, { label: "Formule", value: dataMode === "real" ? "Aucun score local; absence API => indisponible" : "RSI14 Wilder + SMA20/SMA50; score 40/30/30" }, { label: "Devise", value: "Prix " + metrics.auditCurrency }])} isAvailable={Boolean(metrics.technicalData)} technicalData={metrics.technicalData} isLoading={Boolean(isLoading)} onMoreTechnicals={() => openBrvmEquityPage(security.ticker)} unavailableState={unavailable(dataMode === "real" ? "Recommandation technique native indisponible via l’API." : "Donnees techniques insuffisantes: RSI14 et SMA50 exigent au moins 50 clotures verifiees.")} />;
  const hasApiTechnicalInputs = [apiTechnicalIndicator?.rsi_14, apiTechnicalIndicator?.sma_20, apiTechnicalIndicator?.sma_50].every((value) => typeof value === "number" && Number.isFinite(value));
  const modelUnavailableMessage = dataMode === "real"
    ? "Recommandation et objectif natifs indisponibles via l’API pour ce titre."
    : "Recommandation indisponible : données de démonstration insuffisantes.";
  const modelPanel = <ModelHeuristicPanel auditTrail={auditTrail([{ label: "Source", value: `${metrics.marketDataSource} + ${metrics.fundamentalsSource}`, tone: asAuditTone(metrics.combinedAuditTone) }, { label: "Date", value: `Prix ${metrics.marketAuditDate} / FY ${metrics.fundamentalsAuditYear}` }, { label: "Champs", value: dataMode === "real" ? "Score et objectif natifs API; absence => indisponible" : "Calcul mock; Target=" + (metrics.analystData?.targetFormula ?? "N/A") }, { label: "Devise", value: metrics.auditCurrency }])} isLoading={isFundamentalsPanelLoading || !isSecondaryWorkReady} modelData={metrics.analystData} onSeeSource={() => openBrvmEquityPage(security.ticker)} unavailableState={unavailable(modelUnavailableMessage)} />;
  const bondsPanel = <BondsPanel auditTrail={auditTrail([{ label: "Source", value: "API /fixed-income/bond-securities/", tone: asAuditTone(metrics.auditTone) }, { label: "Date", value: metrics.marketAuditDate }, { label: "Devise", value: "% annualise" }])} bonds={feeds.topBonds} isLoading={feeds.bondsLoading} onMoreBonds={openBrvmBondsPage} unavailableState={<div style={{ fontSize: "11px", color: "#64748b", textAlign: "center", padding: "12px 0" }}>Donnees obligataires indisponibles</div>} />;
  const isVolatilityTermReady = hasApiVolatilityTermStructure(apiTechnicalIndicator);
  const volatilityPanels = <VolatilityPanels curveAuditTrail={auditTrail([{ label: "Source", value: "Courbe native API", tone: asAuditTone(metrics.auditTone) }, { label: "Date", value: metrics.marketAuditDate }, { label: "Formule", value: "Aucun calcul local; absence API => indisponible" }, { label: "Devise", value: "% annualisé" }])} curveNotice={undefined} curveUnavailableState={unavailable("Courbe native indisponible via l’API.")} isCurveReady={false} isLoading={Boolean(isLoading)} isTermReady={isVolatilityTermReady} termAuditTrail={auditTrail([{ label: "Source", value: "Indicateurs de volatilité API", tone: asAuditTone(metrics.auditTone) }, { label: "Date", value: metrics.marketAuditDate }, { label: "Champs", value: "hv_10, hv_20, hv_30, hv_60, hv_90, hv_252" }, { label: "Devise", value: "% annualisé" }])} termUnavailableState={unavailable("Structure de volatilite indisponible via l’API.")} volatilityChartRef={refs.volatilityChartRef} volatilityCurveChartRef={refs.volatilityCurveChartRef} />;
  const profilePanel = <div id="gp-sidebar-profile"><ProfilePanel auditTrail={auditTrail([...fundamentalsAudit, { label: "Formule", value: dataMode === "real" ? "Identifiants lus depuis l’API; absence => N/D" : "Profil BRVM normalise; identifiants catalogue mock" }, { label: "Devise", value: "N/A" }])} clipboardStatus={clipboardStatus} description={profileDescription} employees={feeds.validFundamentals?.employees} figi={security.figi} getClipboardLabel={getClipboardLabel} isDescriptionExpanded={isDescriptionExpanded} isLoading={isFundamentalsPanelLoading} isin={security.isin} onCopyIdentifier={(key, value) => void actions.copyIdentifier(key, value)} onToggleDescription={actions.toggleDescription} website={feeds.validFundamentals?.website} /></div>;
  const screenersPanel = <ScreenersPanel activeCurrency={currency} activeTicker={security.ticker} auditDate={metrics.marketAuditDate} bondsLoading={feeds.bondsLoading} livePrice={livePrice} liveVolume={liveVolume} marketSnapshots={marketSnapshots} onOpenBondsPage={openBrvmBondsPage} onOpenEquityPage={() => openBrvmEquityPage(security.ticker)} onOpenTickerSelector={() => props.openTickerSelector?.()} topBonds={feeds.topBonds} />;
  const calendarPanel = (
    <CalendarRailPanel
      auditDate={metrics.marketAuditDate}
      bonds={feeds.topBonds}
      corporateEvents={[]}
      displayTimeZoneLabel={BRVM_DISPLAY_TIME_ZONE_LABEL}
      currency={currency}
      dividends={chartConfig.validFundamentals?.dividends ?? []}
      ipos={[]}
      isBondLoading={feeds.bondsLoading}
      isFundamentalsLoading={isFundamentalsPanelLoading}
      marketStatusLabel={marketStatusLabel}
      onOpenBondsPage={openBrvmBondsPage}
      onOpenDividends={() => actions.setIsDividendModalOpen(true)}
      sessionUpdateLabel={sidebarLastUpdateLabel}
      ticker={security.ticker}
      upcomingIPOs={[]}
    />
  );
  const communityPanel = (
    <CommunityRailPanel
      marketLabel={marketLabel}
      sector={security.sector || "Secteur N/D"}
      ticker={security.ticker}
    />
  );
  const notificationsPanel = (
    <NotificationsRailPanel
      marketLabel={marketLabel}
      ticker={security.ticker}
    />
  );
  const pinePanel = (
    <PineEditorPanel
      auditTrail={auditTrail([
        { label: "Source", value: metrics.marketDataSource, tone: asAuditTone(metrics.auditTone) },
        { label: "Date", value: metrics.marketAuditDate },
        { label: "Runtime", value: "IndexedDB local; no TradingView publish" },
      ])}
      chartData={chartData}
      marketDate={metrics.marketAuditDate}
      marketSource={metrics.marketDataSource}
      onAttachToChart={props.onPineOverlayAttach}
      onClearOverlay={props.onPineOverlayClear}
      runtimeTone={asAuditTone(metrics.auditTone) ?? "neutral"}
      sessionLabel={marketStatusLabel}
      ticker={security.ticker}
    />
  );
  const alertIndicatorValues = React.useMemo(() => buildIndicatorAlertValuesFromSeries(chartData, {
    livePrice,
    source: "sidebar-technicals",
    timeframe: dataMode === "real" ? "1D" : "mock",
  }), [chartData, dataMode, livePrice]);
  const alertsContext = React.useMemo<AlertsRailContext>(() => ({
    changeLabel: formatPercent(liveChangePercent),
    changePercent: toFiniteNumberOrNull(liveChangePercent),
    changeTone: liveChangePercent > 0 ? "success" : liveChangePercent < 0 ? "danger" : "neutral",
    currentPrice: toFiniteNumberOrNull(livePrice),
    defaultThreshold: Number.isFinite(livePrice) ? livePrice.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) : "",
    dividendLabel: latestDividend ? "Dividende " + latestDividend.year + ": " + formatCurrency(latestDividend.value, currency) : "Aucun dividende verifie",
    hasDividend: Boolean(latestDividend),
    hasNews: Boolean(feeds.activeNews),
    marketLabel,
    name: security.name,
    newsLabel: feeds.activeNews ? "News: " + feeds.activeNews.date : "Flux calme",
    priceLabel: formatCurrency(livePrice, currency),
    sessionLabel: marketStatusLabel,
    ticker: security.ticker,
    volumeLabel: formatVolumeRatio(props.currentVolume, props.avgVolume),
    volumeRatio: resolveVolumeRatio(props.currentVolume, props.avgVolume),
    indicatorValuesByKey: alertIndicatorValues,
  }), [
    alertIndicatorValues,
    currency,
    feeds.activeNews,
    latestDividend,
    liveChangePercent,
    livePrice,
    marketStatusLabel,
    props.avgVolume,
    props.currentVolume,
    marketLabel,
    security.name,
    security.ticker,
  ]);
  const alertContextsByTicker = React.useMemo(() => buildAlertContextsByTicker(alertsContext, marketSnapshots, security), [alertsContext, marketSnapshots, security]);
  const alertPanel = (
    <AlertsRailPanel
      context={alertsContext}
      contextsByTicker={alertContextsByTicker}
      initialDraftRequest={alertDraftRequest}
      initialEditAlertId={pendingAlertEditId}
      onInitialEditHandled={() => setPendingAlertEditId(null)}
    />
  );

  return (
    <>
      {isSecondaryWorkReady && activeEntry !== "alerts" && <AlertsRailRuntime context={alertsContext} contextsByTicker={alertContextsByTicker} onEditAlert={openAlertsForEdit} />}
      <div className="gp-sidebar-main-content" style={{ position: "relative" }}>
        {props.overlayContent && activeEntry === "object-tree" && (
          <div id="gp-object-tree-overlay" style={{ position: "absolute", inset: 0, zIndex: 100, overflow: "hidden", display: "flex", flexDirection: "column", background: "var(--gp-bg-toolbar, #0d2136)" }}>
            {props.overlayContent}
          </div>
        )}
        <div className="gp-sidebar-content" data-active-sidebar-entry={activeEntry}>
          {activeEntry === "watchlist" && <>{watchlistPanel}{newsPanel}{statsPanel}{fundamentalsPanel}{dividendsPanel}{incomePanel}{performancePanel}{seasonalityPanel}{technicalsPanel}{modelPanel}{bondsPanel}{volatilityPanels}{profilePanel}</>}
          {activeEntry === "alerts" && alertPanel}
          {activeEntry === "object-tree" && !props.overlayContent && <BrvmRailPanel title="Objets et data window" subtitle="Le panneau Object Tree se charge dans le slot overlay" rows={[{ label: "Etat", value: "Overlay indisponible", tone: "warning" }]} />}
          {activeEntry === "chats" && <ChatsRailPanel marketLabel={marketLabel} sector={security.sector || "Secteur N/D"} ticker={security.ticker} />}
          {activeEntry === "screeners" && screenersPanel}
          {activeEntry === "strategies" && pinePanel}
          {activeEntry === "calendar" && calendarPanel}
          {activeEntry === "ideas" && communityPanel}
          {activeEntry === "notifications" && notificationsPanel}
          {activeEntry === "help" && <BrvmRailPanel title="Aide BRVM" subtitle="Reperes de lecture pour l'analyse technique" rows={[{ label: "Devise", value: currency }, { label: "Temps", value: BRVM_DISPLAY_TIME_ZONE_LABEL }, { label: "Data window", value: "OHLCV et indicateurs au curseur" }, { label: "Sources", value: "Badges d'audit sous chaque panneau" }]} tags={["OHLCV", currency, "BRVM", "Audit"]} />}
          {activeEntry === "fundamentals" && fundamentalsPanel}
          {activeEntry === "bonds" && bondsPanel}
          {activeEntry === "seasonality" && seasonalityPanel}
          {activeEntry === "volatility" && volatilityPanels}
          {activeEntry === "income" && incomePanel}
          {activeEntry === "model" && modelPanel}
          {activeEntry === "performance" && performancePanel}
        </div>
      </div>

      {isDividendModalOpen && <DividendHistoryModal isOpen={isDividendModalOpen} onClose={() => actions.setIsDividendModalOpen(false)} ticker={security.ticker} currency={currency} dividends={chartConfig.validFundamentals?.dividends} />}

      <div className="gp-sidebar-toolbar" ref={toolbarRef}>
        {isLoading ? (
          <SidebarRailSkeleton />
        ) : (
          <SidebarRail activeEntry={activeEntry} isProductsMenuOpen={isProductsMenuOpen} onSelect={handleRailSelect} onProductsClick={handleProductsClick} pinnedItems={pinnedItems} />
        )}
      </div>
      {isProductsMenuOpen && portalTarget && ReactDOM.createPortal(
        <ProductsMenuPopover isOpen={isProductsMenuOpen} pinnedItems={pinnedItems} onSelect={handleRailSelect} onTogglePin={handleTogglePin} onClose={handleProductsMenuClose} positionStyle={popoverStyle} />,
        portalTarget,
      )}
    </>
  );
};
