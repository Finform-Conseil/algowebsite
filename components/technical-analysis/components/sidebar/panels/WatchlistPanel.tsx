import React from "react";
import clsx from "clsx";
import { BrvmLogoMark } from "@/components/design-system/commons/BrvmLogoMark/BrvmLogoMark";
import type { DisplaySecurity } from "../../../config/market/marketSnapshotTypes";
import type { BRVMIndexData } from "../data/sidebarFetchers";

export interface WatchlistSettings {
  showChange: boolean;
  showChangePercent: boolean;
  showLast: boolean;
  showLogo: boolean;
  showName: boolean;
  showSymbol: boolean;
  showVolume: boolean;
}

interface WatchlistPanelProps {
  auditTrail?: React.ReactNode;
  displayTimeZoneLabel: string;
  indicesData: Record<string, BRVMIndexData> | null;
  indicesError: string | null;
  isIndicesLoading: boolean;
  isIndicesOpen: boolean;
  isLoading: boolean;
  isMarketPositive: boolean;
  isSettingsOpen: boolean;
  liveChange: number;
  liveChangePercent: number;
  livePrice: number;
  liveVolume?: number;
  onAddSymbol: () => void;
  onAdvancedView: () => void;
  onSettingChange: (key: keyof WatchlistSettings, value: boolean) => void;
  onToggleIndices: () => void;
  onToggleSettings: () => void;
  security: DisplaySecurity;
  settings: WatchlistSettings;
  sidebarLastUpdateLabel: string;
  sidebarMarketStatus: { isOpen: boolean; title: string };
}

const SIDEBAR_BRAND_LOGO_SIZE = 32;
const SIDEBAR_BRAND_LOGO_SCALE = 1.72;
const SIDEBAR_BRAND_LOGO_SCALE_BY_TICKER: Record<string, number> = {
  ORAC: 1.24,
};

const SIDEBAR_BRAND_LOGO_SHAPE_BY_TICKER: Record<string, "circle" | "rounded"> = {
  ORAC: "rounded",
};

const getSidebarBrandLogoTickerKey = (ticker: string): string => ticker.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

const getSidebarBrandLogoScale = (ticker: string): number => {
  const tickerKey = getSidebarBrandLogoTickerKey(ticker);
  return SIDEBAR_BRAND_LOGO_SCALE_BY_TICKER[tickerKey] ?? SIDEBAR_BRAND_LOGO_SCALE;
};

const getSidebarBrandLogoShape = (ticker: string): "circle" | "rounded" => {
  const tickerKey = getSidebarBrandLogoTickerKey(ticker);
  return SIDEBAR_BRAND_LOGO_SHAPE_BY_TICKER[tickerKey] ?? "circle";
};

const SIDEBAR_BRAND_LOGO_STYLE: React.CSSProperties = {
  width: SIDEBAR_BRAND_LOGO_SIZE,
  height: SIDEBAR_BRAND_LOGO_SIZE,
  flexBasis: SIDEBAR_BRAND_LOGO_SIZE,
};

const SIDEBAR_BRAND_LOGO_FRAME_STYLE_BY_TICKER: Record<string, React.CSSProperties> = {
  ORAC: {
    borderRadius: "8px",
    overflow: "visible",
    background: "rgba(255, 122, 0, 0.14)",
    border: "1px solid rgba(255, 159, 4, 0.42)",
    boxShadow: "0 0 0 1px rgba(255, 159, 4, 0.12), 0 4px 12px rgba(255, 122, 0, 0.24)",
  },
};

const getSidebarBrandLogoStyle = (ticker: string): React.CSSProperties => {
  const tickerKey = getSidebarBrandLogoTickerKey(ticker);
  return {
    ...SIDEBAR_BRAND_LOGO_STYLE,
    ...(SIDEBAR_BRAND_LOGO_FRAME_STYLE_BY_TICKER[tickerKey] ?? null),
  };
};

const INDEX_ROWS = [
  { key: "BRVMC", label: "BRVM Composite", icon: "C", iconClass: "icon-c" },
  { key: "BRVM30", label: "BRVM 30", icon: "30", iconClass: "icon-30" },
  { key: "BRVMPR", label: "BRVM Prestige", icon: "P", iconClass: "icon-p" },
];

const SkeletonLine = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <div className={clsx("is-loading-skeleton", "gp-sidebar-skeleton-line", className)} style={style} />
);

const WatchlistSkeleton = () => (
  <div className="gp-sidebar-skeleton-card">
    <div className="gp-sidebar-skeleton-brand">
      <SkeletonLine className="gp-sidebar-skeleton-logo" />
      <div className="gp-sidebar-skeleton-meta">
        <SkeletonLine style={{ width: "64%", height: "12px" }} />
        <SkeletonLine style={{ width: "42%", height: "8px" }} />
      </div>
    </div>
    <div className="gp-sidebar-skeleton-price-row">
      <SkeletonLine style={{ width: "42%", height: "26px" }} />
      <SkeletonLine style={{ width: "34%", height: "14px" }} />
    </div>
    <SkeletonLine style={{ width: "56%", height: "8px" }} />
    <div className="gp-sidebar-skeleton-market-row">
      <SkeletonLine className="gp-sidebar-skeleton-dot" />
      <SkeletonLine style={{ width: "34%", height: "10px" }} />
      <SkeletonLine style={{ width: "30%", height: "10px" }} />
    </div>
    <div className="gp-sidebar-skeleton-details-row">
      <SkeletonLine style={{ width: "37%", height: "10px" }} />
      <SkeletonLine style={{ width: "38%", height: "10px" }} />
    </div>
    <div className="gp-sidebar-skeleton-audit-row">
      <SkeletonLine style={{ width: "36%", height: "16px" }} />
      <SkeletonLine style={{ width: "28%", height: "16px" }} />
    </div>
  </div>
);

const SettingsItem = ({ checked, label, onChange }: { checked: boolean; label: string; onChange: (value: boolean) => void }) => (
  <label className="dropdown-item">
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    <span>{label}</span>
  </label>
);

const IndicesPanel = ({ data, error, isLoading, isOpen }: { data: Record<string, BRVMIndexData> | null; error: string | null; isLoading: boolean; isOpen: boolean }) => (
  <div className={clsx("gp-indices-panel", isOpen && "gp-indices-panel-open")}>
    <div className="gp-indices-table">
      <div className="gp-indices-table-header">
        <span className="col-name">Name</span>
        <span className="col-last">Last</span>
        <span className="col-chg-pct">Chg%</span>
      </div>
      <div className="gp-indices-table-section-title">
        <i className="bi bi-chevron-down me-1" style={{ fontSize: "0.8em" }} /> INDICES
      </div>
      {isLoading ? (
        <div className="d-flex flex-column gap-2 p-2">
          {[1, 2, 3].map((item) => <div key={item} className="is-loading-skeleton" style={{ height: "24px", borderRadius: "4px" }} />)}
        </div>
      ) : error ? (
        <div className="text-warning text-center py-2 px-1" style={{ fontSize: "10px" }}><i className="bi bi-exclamation-triangle-fill me-1" /> Données non vérifiées ({error})</div>
      ) : !data || Object.keys(data).length === 0 ? (
        <div className="text-warning text-center py-2 px-1" style={{ fontSize: "10px" }}><i className="bi bi-exclamation-triangle-fill me-1" /> Données non vérifiées (indisponibles)</div>
      ) : (
        INDEX_ROWS.map((indexRow) => {
          const indexData = data[indexRow.key];
          if (!indexData) return null;
          const isPositive = !indexData.variation.startsWith("-");
          return (
            <div key={indexRow.key} className="gp-indices-row">
              <div className="gp-indices-cell-name">
                <span className={clsx("gp-indices-icon", indexRow.iconClass)}>{indexRow.icon}</span>
                <span className="gp-indices-ticker" title={indexData.name || indexRow.label}>{indexRow.label}</span>
              </div>
              <span className="gp-indices-cell-last">{indexData.price.toFixed(2).replace(".", ",")}</span>
              <span className={clsx("gp-indices-cell-chg-pct", isPositive ? "text-success" : "text-danger")}>{indexData.variation}</span>
            </div>
          );
        })
      )}
    </div>
  </div>
);

export const WatchlistPanel = React.memo(({
  auditTrail,
  displayTimeZoneLabel,
  indicesData,
  indicesError,
  isIndicesLoading,
  isIndicesOpen,
  isLoading,
  isMarketPositive,
  isSettingsOpen,
  liveChange,
  liveChangePercent,
  livePrice,
  liveVolume,
  onAddSymbol,
  onAdvancedView,
  onSettingChange,
  onToggleIndices,
  onToggleSettings,
  security,
  settings,
  sidebarLastUpdateLabel,
  sidebarMarketStatus,
}: WatchlistPanelProps) => (
  <div className="gp-sidebar-section">
    <div className={clsx("gp-sidebar-header", "head", "pt-1 py-1")}>
      <span className="gp-sidebar-title" style={{ cursor: "pointer", userSelect: "none" }} onClick={onToggleIndices}>
        {" "}Liste de surveillance{" "}
        <i className={clsx("bi", isIndicesOpen ? "bi-chevron-up" : "bi-chevron-down")} style={{ fontSize: "0.6em", verticalAlign: "middle", display: "inline-block", transition: "transform 0.2s ease" }} />
      </span>
      <div className="gp-sidebar-actions" style={{ position: "relative" }}>
        <button className={clsx("btn", "hover-lift")} title="Add symbol" onClick={onAddSymbol}><i className="bi bi-plus" /></button>
        <button className={clsx("btn", "hover-lift")} title="Advanced view" onClick={onAdvancedView}><i className="bi bi-pie-chart" /></button>
        <button className={clsx("btn", "hover-lift")} title="Settings" onClick={onToggleSettings}><i className="bi bi-three-dots" /></button>
        {isSettingsOpen && (
          <div className="gp-watchlist-settings-dropdown">
            <div className="dropdown-section">
              <div className="dropdown-section-title">Customize Columns</div>
              <SettingsItem checked={settings.showLast} label="Last" onChange={(value) => onSettingChange("showLast", value)} />
              <SettingsItem checked={settings.showChange} label="Change" onChange={(value) => onSettingChange("showChange", value)} />
              <SettingsItem checked={settings.showChangePercent} label="Change %" onChange={(value) => onSettingChange("showChangePercent", value)} />
              <SettingsItem checked={settings.showVolume} label="Volume" onChange={(value) => onSettingChange("showVolume", value)} />
            </div>
            <div className="dropdown-divider" />
            <div className="dropdown-section">
              <div className="dropdown-section-title">Symbol Display</div>
              <SettingsItem checked={settings.showLogo} label="Logo" onChange={(value) => onSettingChange("showLogo", value)} />
              <SettingsItem checked={settings.showSymbol} label="Symbol" onChange={(value) => onSettingChange("showSymbol", value)} />
              <SettingsItem checked={settings.showName} label="Name" onChange={(value) => onSettingChange("showName", value)} />
            </div>
          </div>
        )}
      </div>
    </div>
    <IndicesPanel data={indicesData} error={indicesError} isLoading={isIndicesLoading} isOpen={isIndicesOpen} />
    <div className="gp-watchlist-item-v3">
      {isLoading ? (
        <WatchlistSkeleton />
      ) : (
        <>
          <div className="gp-brand-header-v3">
            {settings.showLogo && (
              <div className="gp-logo-v3" style={getSidebarBrandLogoStyle(security.ticker)}>
                <BrvmLogoMark ticker={security.ticker} name={security.name} logoUrl={security.logoUrl} sector={security.sector} status={security.status} size={SIDEBAR_BRAND_LOGO_SIZE} scale={getSidebarBrandLogoScale(security.ticker)} shape={getSidebarBrandLogoShape(security.ticker)} imageSizes="96px" quality={100} unoptimized />
              </div>
            )}
            <div className="gp-ticker-meta-v3">
              {settings.showSymbol && <div className="gp-ticker-row-v3"><span className="gp-ticker-symbol-v3">{security.ticker}</span></div>}
              <div className="gp-company-info-v3">
                {settings.showName && <div className="gp-company-name-v3">{security.name}</div>}
                <span className="gp-exchange-badge-v3"> • BRVM</span>
              </div>
            </div>
          </div>
          <div className="gp-price-block-v3">
            <div className="gp-main-price-container">
              <div className="gp-price-row-primary">
                {settings.showLast && <><span className="gp-main-price-v3">{livePrice.toFixed(2).replace(".", ",")}</span><span className="gp-currency-label-v3">{security.currency || "XOF"}</span></>}
                {(settings.showChange || settings.showChangePercent) && (
                  <div className="gp-price-change-row-v3" style={{ color: isMarketPositive ? "#22ab94" : "#f23645" }}>
                    {settings.showChange && <span>{isMarketPositive ? "+" : ""}{liveChange.toFixed(2).replace(".", ",")}</span>}
                    {settings.showChangePercent && <span>({isMarketPositive ? "+" : ""}{liveChangePercent.toFixed(2)}%)</span>}
                  </div>
                )}
              </div>
              <div className="price-timestamp-v3">Last update at {sidebarLastUpdateLabel} {displayTimeZoneLabel}</div>
            </div>
          </div>
          <div className={clsx("gp-market-status-v3", !sidebarMarketStatus.isOpen && "closed")} title={sidebarMarketStatus.title}>
            <div className="d-flex align-items-center gap-2">
              <div className="status-indicator-dot" />
              <span className="status-text">{sidebarMarketStatus.isOpen ? "Market open" : "Market closed"}</span>
              {settings.showVolume && <><span className="status-separator">•</span><span className="status-volume">Volume: {liveVolume?.toLocaleString("fr-FR") || "0"}</span></>}
            </div>
          </div>
          <div className="gp-security-details-v3">
            <div className="detail-item"><b>Sector:</b> {security.sector}</div>
            <span className="detail-separator">•</span>
            <div className="detail-item"><b>Country:</b> {security.country}</div>
          </div>
          {auditTrail}
        </>
      )}
    </div>
  </div>
));

WatchlistPanel.displayName = "WatchlistPanel";
