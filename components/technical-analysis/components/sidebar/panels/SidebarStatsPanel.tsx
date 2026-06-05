import React from "react";
import clsx from "clsx";

interface SidebarStatsPanelProps {
  isLoading: boolean;
  returnYTD: number | null | undefined;
  peRatio: number | null | undefined;
  currentVolume: number;
  avgVolume: number;
  revenueT12M: string;
  marketCap: number | null | undefined;
  auditTrail?: React.ReactNode;
}

const formatDecimal = (value: number | null | undefined) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return "N/D";
  return value.toFixed(2).replace(".", ",");
};

const formatPercent = (value: number | null | undefined) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return "N/D";
  return `${value > 0 ? "+" : ""}${formatDecimal(value)}%`;
};

const formatVolume = (value: number) => {
  if (!Number.isFinite(value)) return "N/D";
  if (value >= 1000) return `${(value / 1000).toFixed(2).replace(".", ",")} K`;
  return Math.round(value).toString();
};

const formatMarketCap = (value: number | null | undefined) => {
  if (value === null || value === undefined || !Number.isFinite(value) || value <= 0) return "N/D";
  if (value >= 1000) {
    return `${(value / 1000).toLocaleString("fr-FR", { minimumFractionDigits: 2 }).replace(/\s/g, ".")} B FCFA`;
  }

  return `${value.toLocaleString("fr-FR", { minimumFractionDigits: 2 }).replace(/\s/g, ".")} M FCFA`;
};

const SidebarStatsSkeleton = () => {
  const labels = ["Rendement YTD", "P/E Ratio", "Volume", "Revenu/PNB (FY)", "Volume moyen (30)", "Capitalisation boursière"];
  return (
    <div className="d-flex flex-column gap-1 p-0">
      {labels.map((label) => (
        <div key={label} className={clsx("row", "g-0")}>
          <span className={clsx("col", "stat-label")}>{label}</span>
          <span className={clsx("col-auto", "stat-value")} style={{ minWidth: "72px" }}>
            <div className="is-loading-skeleton gp-sidebar-skeleton-line" style={{ width: "100%", height: "12px" }} />
          </span>
        </div>
      ))}
    </div>
  );
};

export const SidebarStatsPanel = React.memo(({
  isLoading,
  returnYTD,
  peRatio,
  currentVolume,
  avgVolume,
  revenueT12M,
  marketCap,
  auditTrail,
}: SidebarStatsPanelProps) => {
  const returnClassName = returnYTD && returnYTD > 0 ? "text-success" : returnYTD && returnYTD < 0 ? "text-danger" : "";

  return (
    <div className="gp-sidebar-section">
      <div className="gp-sidebar-header">
        <span className="gp-sidebar-title">Statistiques clés</span>
      </div>
      <div className="gp-stats-table-v2">
        {isLoading ? (
          <SidebarStatsSkeleton />
        ) : (
          <>
            <div className={clsx("row", "g-0")}>
              <span className={clsx("col", "stat-label")}>Rendement YTD</span>
              <span className={clsx("col-auto", "stat-value")}>
                <span className={returnClassName}>{formatPercent(returnYTD)}</span>
              </span>
            </div>
            <div className={clsx("row", "g-0")}>
              <span className={clsx("col", "stat-label")}>P/E Ratio</span>
              <span className={clsx("col-auto", "stat-value")}>{formatDecimal(peRatio)}</span>
            </div>
            <div className={clsx("row", "g-0")}>
              <span className={clsx("col", "stat-label")}>Volume</span>
              <span className={clsx("col-auto", "stat-value")}>{formatVolume(currentVolume)}</span>
            </div>
            <div className={clsx("row", "g-0")}>
              <span className={clsx("col", "stat-label")}>Revenu/PNB (FY)</span>
              <span className={clsx("col-auto", "stat-value")}>{revenueT12M}</span>
            </div>
            <div className={clsx("row", "g-0")}>
              <span className={clsx("col", "stat-label")}>Volume moyen (30)</span>
              <span className={clsx("col-auto", "stat-value")}>{formatVolume(avgVolume)}</span>
            </div>
            <div className={clsx("row", "g-0")}>
              <span className={clsx("col", "stat-label")}>Capitalisation boursière</span>
              <span className={clsx("col-auto", "stat-value")}>{formatMarketCap(marketCap)}</span>
            </div>
          </>
        )}
      </div>
      {!isLoading && auditTrail}
    </div>
  );
});

SidebarStatsPanel.displayName = "SidebarStatsPanel";
