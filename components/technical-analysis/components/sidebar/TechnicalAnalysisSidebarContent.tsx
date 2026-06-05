import React from "react";
import dynamic from "next/dynamic";
import clsx from "clsx";
import { BRVM_DISPLAY_TIME_ZONE_LABEL } from "../../utils/brvmMarketSession";
import { openBrvmBondsPage, openBrvmEquityPage } from "./actions/sidebarExternalLinks";
import { SidebarAuditTrail, SidebarUnavailableState } from "./components/SidebarFeedback";
import type { AuditTrailItem } from "./data/sidebarDataTypes";
import type { TechnicalAnalysisSidebarController } from "./hooks/useTechnicalAnalysisSidebarController";
import { BondsPanel } from "./panels/BondsPanel";
import { DividendsPanel } from "./panels/DividendsPanel";
import { FundamentalsPanel } from "./panels/FundamentalsPanel";
import { IncomeStatementPanel } from "./panels/IncomeStatementPanel";
import { ModelHeuristicPanel } from "./panels/ModelHeuristicPanel";
import { PerformancePanel } from "./panels/PerformancePanel";
import { ProfilePanel } from "./panels/ProfilePanel";
import { SeasonalityPanel } from "./panels/SeasonalityPanel";
import { SidebarNewsPanel } from "./panels/SidebarNewsPanel";
import { SidebarStatsPanel } from "./panels/SidebarStatsPanel";
import { TechnicalsPanel } from "./panels/TechnicalsPanel";
import { VolatilityPanels } from "./panels/VolatilityPanels";
import { WatchlistPanel } from "./panels/WatchlistPanel";

const DividendHistoryModal = dynamic(
  () => import("./modals/DividendHistoryModal").then((module) => module.DividendHistoryModal),
  { ssr: false, loading: () => null },
);

const auditTrail = (items: AuditTrailItem[], showSource = false) => (
  <SidebarAuditTrail items={items} showSource={showSource} />
);

const unavailable = (message: string) => <SidebarUnavailableState message={message} />;

const asAuditTone = (tone: string | undefined): AuditTrailItem["tone"] => (
  tone === "success" || tone === "warning" || tone === "neutral" ? tone : undefined
);

export const TechnicalAnalysisSidebarContent = ({ controller }: { controller: TechnicalAnalysisSidebarController }) => {
  const {
    actions,
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
  const marketAudit = [
    { label: "Source", value: metrics.marketDataSource, tone: asAuditTone(metrics.auditTone) },
    { label: "Date", value: metrics.marketAuditDate },
    { label: "Formule", value: "Last, Δ, Δ% depuis OHLCV/live" },
    { label: "Devise", value: metrics.auditCurrency },
  ] satisfies AuditTrailItem[];
  const fundamentalsAudit = [
    { label: "Source", value: metrics.fundamentalsSource, tone: asAuditTone(metrics.fundamentalsAuditTone) },
    { label: "Date", value: "FY " + metrics.fundamentalsAuditYear },
  ] satisfies AuditTrailItem[];

  return (
    <>
      <div className="gp-sidebar-main-content" style={{ position: "relative" }}>
        {props.overlayContent && (
          <div id="gp-object-tree-overlay" style={{ position: "absolute", inset: 0, zIndex: 100, overflow: "hidden", display: "flex", flexDirection: "column", background: "var(--gp-bg-toolbar, #0d2136)" }}>
            {props.overlayContent}
          </div>
        )}
        <div className="gp-sidebar-content">
          <WatchlistPanel
            auditTrail={auditTrail(marketAudit, true)}
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

          <SidebarNewsPanel
            activeNews={feeds.activeNews}
            isLoading={Boolean(isLoading)}
            newsKey={feeds.currentNewsIdx}
            onHoverChange={actions.setIsNewsHovered}
            unavailableState={unavailable("Actualités BRVM indisponibles: aucune news vérifiée reçue via /api/market-data/brvm-news.")}
          />

          <SidebarStatsPanel
            auditTrail={auditTrail([
              { label: "Source", value: metrics.marketDataSource + " + " + metrics.fundamentalsSource, tone: asAuditTone(metrics.combinedAuditTone) },
              { label: "Date", value: "Prix " + metrics.marketAuditDate + " / FY " + metrics.fundamentalsAuditYear },
              { label: "Formule", value: "YTD, P/E, Vol, Avg30, Cap, PNB/FY" },
              { label: "Devise", value: metrics.auditCurrency },
            ])}
            avgVolume={props.avgVolume}
            currentVolume={props.currentVolume}
            isLoading={isFundamentalsPanelLoading}
            marketCap={displayMarketCap}
            peRatio={displayPeRatio}
            returnYTD={displayReturnYTD}
            revenueT12M={metrics.displayRevenueT12M}
          />

          <FundamentalsPanel chartRef={props.benefitsChartRef} isLoading={isFundamentalsPanelLoading} isAvailable={metrics.hasVerifiedEarnings} unavailableState={unavailable("Bénéfices non vérifiés pour ce titre via les sources BRVM disponibles.")} auditTrail={auditTrail([...fundamentalsAudit, { label: "Formule", value: "Bénéfice net lu BRVM, trié par exercice" }, { label: "Devise", value: "M FCFA" }])} onMoreInfo={() => openBrvmEquityPage(security.ticker)} />
          <DividendsPanel chartRef={props.dividendsChartRef} isLoading={isFundamentalsPanelLoading} isAvailable={metrics.hasVerifiedDividends} unavailableState={unavailable("Dividendes non vérifiés pour ce titre via les sources BRVM disponibles.")} auditTrail={auditTrail([...fundamentalsAudit, { label: "Formule", value: "Yield=Div/Last; Payout=Div/EPS" }, { label: "Devise", value: metrics.auditCurrency }])} onMoreInfo={() => actions.setIsDividendModalOpen(true)} />
          <IncomeStatementPanel chartRef={refs.incomeChartRef} isLoading={isFundamentalsPanelLoading} isAvailable={chartConfig.canRenderIncomeStatement} viewMode={incomeViewMode} onModeChange={actions.setIncomeViewMode} unavailableState={unavailable(incomeViewMode === "quarterly" && dataMode === "real" ? "Données trimestrielles non vérifiées: aucune estimation locale n'est affichée en mode réel." : "Compte de résultat non vérifié pour ce titre via les sources BRVM disponibles.")} auditTrail={auditTrail([...fundamentalsAudit, { label: "Formule", value: "Marge nette = Résultat net / Revenu" }, { label: "Devise", value: "M FCFA" }])} onMoreFinancials={() => openBrvmEquityPage(security.ticker)} />
          <PerformancePanel rows={metrics.performanceRows} auditTrail={auditTrail([{ label: "Source", value: metrics.marketDataSource, tone: asAuditTone(metrics.auditTone) }, { label: "Date", value: metrics.marketAuditDate }, { label: "Formule", value: "(Close actuel - Close ancre) / Close ancre" }, { label: "Devise", value: "% depuis clôtures " + metrics.auditCurrency }])} />
          <SeasonalityPanel auditTrail={auditTrail([{ label: "Source", value: metrics.marketDataSource, tone: asAuditTone(metrics.auditTone) }, { label: "Date", value: metrics.marketAuditDate }, { label: "Formule", value: "(Close mois - Close début année) / Close début année" }, { label: "Devise", value: "% depuis clôtures " + metrics.auditCurrency }])} chartRef={refs.seasonalChartRef} isAvailable={metrics.seasonalYears.length > 0} isLoading={Boolean(isLoading)} onMoreSeasonals={() => openBrvmEquityPage(security.ticker)} unavailableState={unavailable("Saisonnalité indisponible: aucune année exploitable dans les clôtures vérifiées.")} years={metrics.seasonalYears} />
          <TechnicalsPanel auditTrail={auditTrail([{ label: "Source", value: metrics.marketDataSource, tone: asAuditTone(metrics.auditTone) }, { label: "Date", value: metrics.marketAuditDate }, { label: "Formule", value: "RSI14 Wilder + SMA20/SMA50; score 40/30/30" }, { label: "Devise", value: "Prix " + metrics.auditCurrency }])} chartRef={refs.technicalsChartRef} isAvailable={Boolean(metrics.technicalData)} isLoading={Boolean(isLoading)} onMoreTechnicals={() => openBrvmEquityPage(security.ticker)} unavailableState={unavailable("Données techniques insuffisantes: RSI14 et SMA50 exigent au moins 50 clôtures vérifiées.")} />
          <ModelHeuristicPanel auditTrail={auditTrail([{ label: "Source", value: `${metrics.marketDataSource} + ${metrics.fundamentalsSource}`, tone: asAuditTone(metrics.combinedAuditTone) }, { label: "Date", value: `Prix ${metrics.marketAuditDate} / FY ${metrics.fundamentalsAuditYear}` }, { label: "Formule", value: `Score=Tech 30% + P/E 30% + Yield 40%; Target=${metrics.analystData?.targetFormula ?? "N/A"}` }, { label: "Devise", value: metrics.auditCurrency }])} chartRef={refs.analystRatingChartRef} isLoading={Boolean(isLoading || feeds.isFundamentalsLoading)} modelData={metrics.analystData} onSeeSource={() => openBrvmEquityPage(security.ticker)} unavailableState={unavailable("Modèle indisponible: RSI/SMA50, P/E et dividendes vérifiés sont requis pour afficher un score traçable.")} />
          <BondsPanel auditTrail={auditTrail([{ label: "Source", value: "/api/market-data/brvm-bonds", tone: asAuditTone(metrics.auditTone) }, { label: "Date", value: metrics.marketAuditDate }, { label: "Formule", value: "Top 3 obligations triées par YTM décroissant" }, { label: "Devise", value: "% annualisé" }])} bonds={feeds.topBonds} isLoading={feeds.bondsLoading} onMoreBonds={openBrvmBondsPage} unavailableState={<div style={{ fontSize: "11px", color: "#64748b", textAlign: "center", padding: "12px 0" }}>Données obligataires indisponibles</div>} />
          <VolatilityPanels curveAuditTrail={auditTrail([{ label: "Source", value: metrics.marketDataSource, tone: asAuditTone(metrics.auditTone) }, { label: "Date", value: metrics.marketAuditDate }, { label: "Formule", value: "Kernel gaussien sur rendements log² 28j" }, { label: "Devise", value: "% annualisé" }])} curveUnavailableState={unavailable("Courbe de volatilité indisponible: au moins 28 clôtures vérifiées sont nécessaires.")} isCurveReady={chartData.length >= 28} isLoading={Boolean(isLoading)} isTermReady={chartData.length >= 5} onSource={() => openBrvmEquityPage(security.ticker)} termAuditTrail={auditTrail([{ label: "Source", value: metrics.marketDataSource, tone: asAuditTone(metrics.auditTone) }, { label: "Date", value: metrics.marketAuditDate }, { label: "Formule", value: "HV=stdev(log returns) x sqrt(252)" }, { label: "Devise", value: "% annualisé" }])} termUnavailableState={unavailable("Volatilité historique indisponible: au moins 5 clôtures vérifiées sont nécessaires.")} volatilityChartRef={refs.volatilityChartRef} volatilityCurveChartRef={refs.volatilityCurveChartRef} />
          <ProfilePanel auditTrail={auditTrail([...fundamentalsAudit, { label: "Formule", value: "Profil BRVM normalisé; ISIN/FIGI catalogue" }, { label: "Devise", value: "N/A" }])} clipboardStatus={clipboardStatus} description={feeds.validFundamentals?.description} employees={feeds.validFundamentals?.employees} figi={security.figi} getClipboardLabel={getClipboardLabel} isDescriptionExpanded={isDescriptionExpanded} isLoading={isFundamentalsPanelLoading} isin={security.isin} onCopyIdentifier={(key, value) => void actions.copyIdentifier(key, value)} onToggleDescription={actions.toggleDescription} website={feeds.validFundamentals?.website} />
        </div>
      </div>

      {isDividendModalOpen && <DividendHistoryModal isOpen={isDividendModalOpen} onClose={() => actions.setIsDividendModalOpen(false)} ticker={security.ticker} dividends={feeds.validFundamentals?.dividends} />}

      <div className="gp-sidebar-toolbar">
        <div className={clsx("gp-toolbar-scroll-container", "p-1")}>
          <button className={clsx("gp-toolbar-btn", "hover-lift", !props.isObjectTreeOpen && "active", !props.isObjectTreeOpen && "btn-primary-outline", !props.isObjectTreeOpen && "border")} title="Liste de surveillance" onClick={() => props.isObjectTreeOpen && props.onToggleObjectTree?.()}>
            <i className="bi bi-list" style={{ color: !props.isObjectTreeOpen ? "#2962ff" : "inherit" }} />
          </button>
          <button className={clsx("gp-toolbar-btn", "hover-lift", props.isObjectTreeOpen && "active", props.isObjectTreeOpen && "btn-primary-outline", props.isObjectTreeOpen && "border")} title="Object tree and data window" onClick={() => !props.isObjectTreeOpen && props.onToggleObjectTree?.()}>
            <i className="bi bi-stack" style={{ color: props.isObjectTreeOpen ? "#2962ff" : "inherit" }} />
          </button>
        </div>
      </div>
    </>
  );
};
