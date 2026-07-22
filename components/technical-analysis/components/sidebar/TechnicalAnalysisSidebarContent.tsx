import React from "react";
import ReactDOM from "react-dom";
import dynamic from "next/dynamic";
import { useSelector } from "react-redux";
import { BRVM_SECURITIES } from "@/core/data/brvm-securities";
import type { RootState } from "@/core/infrastructure/store";
import { BRVM_DISPLAY_TIME_ZONE_LABEL } from "../../utils/brvmMarketSession";
import { openBrvmBondsPage, openBrvmEquityPage } from "./actions/sidebarExternalLinks";
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

const formatVolumeRatio = (currentVolume: number, avgVolume: number) => {
  if (!Number.isFinite(currentVolume) || !Number.isFinite(avgVolume) || avgVolume <= 0) return "N/D";
  return `${formatNumber(currentVolume / avgVolume, 1)}x moyenne`;
};

const toFiniteNumberOrNull = (value: number | null | undefined) => (
  value !== null && value !== undefined && Number.isFinite(value) ? value : null
);

const resolveVolumeRatio = (currentVolume: number, avgVolume: number) => {
  if (!Number.isFinite(currentVolume) || !Number.isFinite(avgVolume) || avgVolume <= 0) return null;
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

const buildAlertContextsByTicker = (current: AlertsRailContext, snapshots: Record<string, LiveSnapshot>): AlertsRailContextByTicker => {
  const contexts: AlertsRailContextByTicker = { [current.ticker]: current };
  Object.values(snapshots).forEach((snapshot) => {
    const context = buildSnapshotAlertContext(snapshot);
    if (context) contexts[context.ticker] = context;
  });
  contexts[current.ticker] = current;
  return contexts;
};

const buildSnapshotAlertContext = (snapshot: LiveSnapshot): AlertsRailContext | null => {
  const ticker = snapshot.symbol.trim().toUpperCase();
  const price = toFiniteNumberOrNull(snapshot.price);
  if (!ticker || price === null) return null;
  const security = BRVM_SECURITIES.find((entry) => entry.ticker === ticker);
  const currency = security?.currency || "XOF";
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
    marketLabel: (security?.exchange || "BRVM") + " · " + (security?.country || "UEMOA"),
    name: security?.name || ticker,
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
    isSettingsOpen,
    marketClock,
    metrics,
    props,
    refs,
    watchlistSettings,
  } = controller;
  const { chartData, dataMode, isLoading, liveChange, liveChangePercent, livePrice, liveVolume, security } = props;
  const portalTarget = useTechnicalAnalysisPortalTarget();
  const [pendingAlertEditId, setPendingAlertEditId] = React.useState<string | null>(null);
  const [isProductsMenuOpen, setIsProductsMenuOpen] = React.useState(false);
  const [pinnedItems, setPinnedItems] = React.useState<ProductsMenuEntryId[]>(DEFAULT_PINNED);
  const [popoverStyle, setPopoverStyle] = React.useState<React.CSSProperties>({});
  const toolbarRef = React.useRef<HTMLDivElement>(null);
  const marketSnapshots = useSelector((state: RootState) => selectMarketSnapshots(state));
  const currency = security.currency || "XOF";
  const activeEntry: SidebarRailEntryId = props.isObjectTreeOpen ? "object-tree" : activeSidebarEntry;
  const latestDividend = feeds.validFundamentals?.dividends[feeds.validFundamentals.dividends.length - 1] ?? null;
  const marketLabel = (security.exchange || "BRVM") + " · " + (security.country || "UEMOA");
  const profileDescription = normalizeProfileDescription(feeds.validFundamentals?.description) ?? buildProfileDescriptionFallback(security);

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
      sidebarLastUpdateLabel={marketClock.sidebarLastUpdateLabel}
      sidebarMarketStatus={marketClock.sidebarMarketStatus}
    />
  );
  const isNewsPanelLoading = Boolean(isLoading) || feeds.isNewsLoading;
  const newsPanel = <SidebarNewsPanel activeNews={feeds.activeNews} isLoading={isNewsPanelLoading} newsKey={feeds.currentNewsIdx} onHoverChange={actions.setIsNewsHovered} />;
  const statsPanel = <SidebarStatsPanel auditTrail={auditTrail([...combinedAudit, { label: "Formule", value: "YTD, P/E, Vol, Avg30, Cap, PNB/FY" }, { label: "Devise", value: metrics.auditCurrency }])} avgVolume={props.avgVolume} currentVolume={props.currentVolume} isLoading={isFundamentalsPanelLoading} marketCap={displayMarketCap} peRatio={displayPeRatio} returnYTD={displayReturnYTD} revenueT12M={metrics.displayRevenueT12M} />;
  const fundamentalsPanel = <FundamentalsPanel chartRef={props.benefitsChartRef} isLoading={isFundamentalsPanelLoading} isAvailable={metrics.hasVerifiedEarnings} auditTrail={auditTrail([...fundamentalsAudit, { label: "Formule", value: "Benefice net lu BRVM, trie par exercice" }, { label: "Devise", value: "M FCFA" }])} onMoreInfo={() => openBrvmEquityPage(security.ticker)} />;
  const dividendsPanel = <DividendsPanel chartRef={props.dividendsChartRef} isLoading={isFundamentalsPanelLoading} isAvailable={metrics.hasVerifiedDividends} auditTrail={auditTrail([...fundamentalsAudit, { label: "Formule", value: "Yield=Div/Last; Payout=Div/EPS" }, { label: "Devise", value: metrics.auditCurrency }])} onMoreInfo={() => actions.setIsDividendModalOpen(true)} />;
  const incomePanel = <IncomeStatementPanel chartRef={refs.incomeChartRef} isLoading={isFundamentalsPanelLoading} isAvailable={chartConfig.canRenderIncomeStatement} viewMode={incomeViewMode} onModeChange={actions.setIncomeViewMode} auditTrail={auditTrail([...fundamentalsAudit, { label: "Formule", value: "Marge nette = Resultat net / Revenu" }, { label: "Devise", value: "M FCFA" }])} onMoreFinancials={() => openBrvmEquityPage(security.ticker)} />;
  const performancePanel = <PerformancePanel rows={metrics.performanceRows} auditTrail={auditTrail([{ label: "Source", value: metrics.marketDataSource, tone: asAuditTone(metrics.auditTone) }, { label: "Date", value: metrics.marketAuditDate }, { label: "Formule", value: "(Close actuel - Close ancre) / Close ancre" }, { label: "Devise", value: "% depuis clotures " + metrics.auditCurrency }])} />;
  const seasonalityPanel = <SeasonalityPanel auditTrail={auditTrail([{ label: "Source", value: metrics.marketDataSource, tone: asAuditTone(metrics.auditTone) }, { label: "Date", value: metrics.marketAuditDate }, { label: "Formule", value: "(Close mois - Close debut annee) / Close debut annee" }, { label: "Devise", value: "% depuis clotures " + metrics.auditCurrency }])} chartRef={refs.seasonalChartRef} isAvailable={metrics.seasonalYears.length > 0} isLoading={Boolean(isLoading)} onMoreSeasonals={() => openBrvmEquityPage(security.ticker)} unavailableState={unavailable("Saisonnalite indisponible: aucune annee exploitable dans les clotures verifiees.")} years={metrics.seasonalYears} />;
  const technicalsPanel = <TechnicalsPanel auditTrail={auditTrail([{ label: "Source", value: metrics.marketDataSource, tone: asAuditTone(metrics.auditTone) }, { label: "Date", value: metrics.marketAuditDate }, { label: "Formule", value: "RSI14 Wilder + SMA20/SMA50; score 40/30/30" }, { label: "Devise", value: "Prix " + metrics.auditCurrency }])} isAvailable={Boolean(metrics.technicalData)} technicalData={metrics.technicalData} isLoading={Boolean(isLoading)} onMoreTechnicals={() => openBrvmEquityPage(security.ticker)} unavailableState={unavailable("Donnees techniques insuffisantes: RSI14 et SMA50 exigent au moins 50 clotures verifiees.")} />;
  const modelPanel = <ModelHeuristicPanel auditTrail={auditTrail([{ label: "Source", value: `${metrics.marketDataSource} + ${metrics.fundamentalsSource}`, tone: asAuditTone(metrics.combinedAuditTone) }, { label: "Date", value: `Prix ${metrics.marketAuditDate} / FY ${metrics.fundamentalsAuditYear}` }, { label: "Formule", value: `Score=Tech/P-E/Yield selon donnees disponibles; Target=${metrics.analystData?.targetFormula ?? "N/A"}` }, { label: "Devise", value: metrics.auditCurrency }])} isLoading={isFundamentalsPanelLoading} modelData={metrics.analystData} onSeeSource={() => openBrvmEquityPage(security.ticker)} unavailableState={unavailable("Modele indisponible: RSI/SMA50 et P/E catalogue ou verifie sont requis pour afficher un score tracable.")} />;
  const bondsPanel = <BondsPanel auditTrail={auditTrail([{ label: "Source", value: "/api/market-data/brvm-bonds", tone: asAuditTone(metrics.auditTone) }, { label: "Date", value: metrics.marketAuditDate }, { label: "Formule", value: "Top 3 obligations triees par YTM decroissant" }, { label: "Devise", value: "% annualise" }])} bonds={feeds.topBonds} isLoading={feeds.bondsLoading} onMoreBonds={openBrvmBondsPage} unavailableState={<div style={{ fontSize: "11px", color: "#64748b", textAlign: "center", padding: "12px 0" }}>Donnees obligataires indisponibles</div>} />;
  const volatilityPanels = <VolatilityPanels curveAuditTrail={auditTrail([{ label: "Source", value: metrics.marketDataSource, tone: asAuditTone(metrics.auditTone) }, { label: "Date", value: metrics.marketAuditDate }, { label: "Formule", value: "Kernel gaussien sur rendements log2 28j" }, { label: "Devise", value: "% annualise" }])} curveUnavailableState={unavailable("Courbe de volatilite indisponible: au moins 28 clotures verifiees sont necessaires.")} isCurveReady={chartData.length >= 28} isLoading={Boolean(isLoading)} isTermReady={chartData.length >= 5} onSource={() => openBrvmEquityPage(security.ticker)} termAuditTrail={auditTrail([{ label: "Source", value: metrics.marketDataSource, tone: asAuditTone(metrics.auditTone) }, { label: "Date", value: metrics.marketAuditDate }, { label: "Formule", value: "HV=stdev(log returns) x sqrt(252)" }, { label: "Devise", value: "% annualise" }])} termUnavailableState={unavailable("Volatilite historique indisponible: au moins 5 clotures verifiees sont necessaires.")} volatilityChartRef={refs.volatilityChartRef} volatilityCurveChartRef={refs.volatilityCurveChartRef} />;
  const profilePanel = <ProfilePanel auditTrail={auditTrail([...fundamentalsAudit, { label: "Formule", value: "Profil BRVM normalise; ISIN/FIGI catalogue" }, { label: "Devise", value: "N/A" }])} clipboardStatus={clipboardStatus} description={profileDescription} employees={feeds.validFundamentals?.employees} figi={security.figi} getClipboardLabel={getClipboardLabel} isDescriptionExpanded={isDescriptionExpanded} isLoading={isFundamentalsPanelLoading} isin={security.isin} onCopyIdentifier={(key, value) => void actions.copyIdentifier(key, value)} onToggleDescription={actions.toggleDescription} website={feeds.validFundamentals?.website} />;
  const screenersPanel = <ScreenersPanel activeCurrency={currency} activeTicker={security.ticker} auditDate={metrics.marketAuditDate} bondsLoading={feeds.bondsLoading} livePrice={livePrice} liveVolume={liveVolume} marketSnapshots={marketSnapshots} marketSource={metrics.marketDataSource} onOpenBondsPage={openBrvmBondsPage} onOpenEquityPage={() => openBrvmEquityPage(security.ticker)} onOpenTickerSelector={() => props.openTickerSelector?.()} securities={BRVM_SECURITIES} topBonds={feeds.topBonds} />;
  const calendarPanel = (
    <CalendarRailPanel
      auditDate={metrics.marketAuditDate}
      bonds={feeds.topBonds}
      corporateEvents={[]}
      displayTimeZoneLabel={BRVM_DISPLAY_TIME_ZONE_LABEL}
      dividends={feeds.validFundamentals?.dividends ?? []}
      ipos={[]}
      isBondLoading={feeds.bondsLoading}
      isFundamentalsLoading={isFundamentalsPanelLoading}
      marketStatusLabel={marketClock.sidebarMarketStatus.isOpen ? "Marche ouvert" : "Marche ferme"}
      onOpenBondsPage={openBrvmBondsPage}
      onOpenDividends={() => actions.setIsDividendModalOpen(true)}
      sessionUpdateLabel={marketClock.sidebarLastUpdateLabel}
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
      sessionLabel={marketClock.sidebarMarketStatus.isOpen ? "Market open" : "Market closed"}
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
    sessionLabel: marketClock.sidebarMarketStatus.isOpen ? "Marche ouvert" : "Marche ferme",
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
    marketClock.sidebarMarketStatus.isOpen,
    props.avgVolume,
    props.currentVolume,
    marketLabel,
    security.name,
    security.ticker,
  ]);
  const alertContextsByTicker = React.useMemo(() => buildAlertContextsByTicker(alertsContext, marketSnapshots), [alertsContext, marketSnapshots]);
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
      {activeEntry !== "alerts" && <AlertsRailRuntime context={alertsContext} contextsByTicker={alertContextsByTicker} onEditAlert={openAlertsForEdit} />}
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
          {activeEntry === "help" && <BrvmRailPanel title="Aide BRVM" subtitle="Reperes de lecture pour l'analyse technique" rows={[{ label: "Devise", value: currency }, { label: "Temps", value: BRVM_DISPLAY_TIME_ZONE_LABEL }, { label: "Data window", value: "OHLCV et indicateurs au curseur" }, { label: "Sources", value: "Badges d'audit sous chaque panneau" }]} tags={["OHLCV", "XOF", "BRVM", "Audit"]} />}
          {activeEntry === "fundamentals" && fundamentalsPanel}
          {activeEntry === "bonds" && bondsPanel}
          {activeEntry === "seasonality" && seasonalityPanel}
          {activeEntry === "volatility" && volatilityPanels}
          {activeEntry === "income" && incomePanel}
          {activeEntry === "model" && modelPanel}
          {activeEntry === "performance" && performancePanel}
        </div>
      </div>

      {isDividendModalOpen && <DividendHistoryModal isOpen={isDividendModalOpen} onClose={() => actions.setIsDividendModalOpen(false)} ticker={security.ticker} dividends={feeds.validFundamentals?.dividends} />}

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
