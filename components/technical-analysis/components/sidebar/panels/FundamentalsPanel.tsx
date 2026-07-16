import React from "react";
import clsx from "clsx";

interface FundamentalsPanelProps {
  auditTrail?: React.ReactNode;
  chartRef: React.RefObject<HTMLDivElement | null>;
  isAvailable: boolean;
  isLoading: boolean;
  onMoreInfo: () => void;
}

const ACTION_BUTTON_STYLE: React.CSSProperties = {
  backgroundColor: "rgba(255, 255, 255, 0.05)",
  color: "#f1f5f9",
  border: "1px solid #363a45",
  borderRadius: "50px",
  padding: "4px 32px",
  fontSize: "11px",
  fontWeight: "600",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.2s ease",
};

const FundamentalsSkeleton = () => (
  <div className="gp-sidebar-fundamentals-skeleton" aria-hidden="true">
    <div className="gp-sidebar-fundamentals-skeleton-head">
      <div className="is-loading-skeleton gp-sidebar-skeleton-line gp-sidebar-fundamentals-skeleton-title" />
      <div className="is-loading-skeleton gp-sidebar-skeleton-line gp-sidebar-fundamentals-skeleton-value" />
    </div>
    <div className="gp-sidebar-fundamentals-skeleton-chart">
      <span className="gp-sidebar-fundamentals-skeleton-grid-line" />
      <span className="gp-sidebar-fundamentals-skeleton-grid-line" />
      <span className="gp-sidebar-fundamentals-skeleton-grid-line" />
      <span className="gp-sidebar-fundamentals-skeleton-grid-line" />
      <span className="gp-sidebar-fundamentals-skeleton-x-tick" style={{ left: "16%" }} />
      <span className="gp-sidebar-fundamentals-skeleton-x-tick" style={{ left: "48%" }} />
      <span className="gp-sidebar-fundamentals-skeleton-x-tick" style={{ left: "80%" }} />
      <span className="is-loading-skeleton gp-sidebar-fundamentals-skeleton-point gp-sidebar-fundamentals-skeleton-point-actual" style={{ left: "16%", bottom: "29%" }} />
      <span className="is-loading-skeleton gp-sidebar-fundamentals-skeleton-point gp-sidebar-fundamentals-skeleton-point-actual" style={{ left: "48%", bottom: "41%" }} />
      <span className="is-loading-skeleton gp-sidebar-fundamentals-skeleton-point gp-sidebar-fundamentals-skeleton-point-actual" style={{ left: "80%", bottom: "53%" }} />
      <span className="gp-sidebar-fundamentals-skeleton-point gp-sidebar-fundamentals-skeleton-point-estimate" style={{ left: "48%", bottom: "45%" }} />
      <span className="gp-sidebar-fundamentals-skeleton-point gp-sidebar-fundamentals-skeleton-point-estimate" style={{ left: "80%", bottom: "61%" }} />
    </div>
    <div className="gp-sidebar-fundamentals-skeleton-legend">
      <span><i className="gp-sidebar-fundamentals-skeleton-legend-dot" /><span className="is-loading-skeleton gp-sidebar-skeleton-line" /></span>
      <span><i className="gp-sidebar-fundamentals-skeleton-legend-ring" /><span className="is-loading-skeleton gp-sidebar-skeleton-line" /></span>
    </div>
  </div>
);

export const FundamentalsPanel = React.memo(({
  auditTrail,
  chartRef,
  isAvailable,
  isLoading,
  onMoreInfo,
}: FundamentalsPanelProps) => {
  if (!isLoading && !isAvailable) return null;

  return (
  <div className={clsx("gp-sidebar-section", "gp-benefits-section-v2")} style={{ minHeight: "150px" }}>
    <div className="gp-sidebar-header">
      <span className="gp-sidebar-title">Fondamentaux (FY)</span>
    </div>
    {isLoading ? (
      <FundamentalsSkeleton />
    ) : (
      <div key="ready">
        <div ref={chartRef as React.RefObject<HTMLDivElement>} style={{ width: "100%", height: "120px" }} />
        <div className="d-flex justify-content-center gap-3 mt-1" style={{ fontSize: "0.75rem", color: "#787b86" }}>
          <div className="d-flex align-items-center gap-1">
            <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#22ab94" }} />
            <span>Actual</span>
          </div>
          <div className="d-flex align-items-center gap-1">
            <span style={{ width: 8, height: 8, borderRadius: "50%", border: "1.5px solid #787b86" }} />
            <span>Estimate</span>
          </div>
        </div>
        {auditTrail}
      </div>
    )}
    {!isLoading && isAvailable && (
      <div className="d-flex justify-content-center mt-3">
        <button className="hover-lift" style={ACTION_BUTTON_STYLE} onClick={onMoreInfo}>
          More info
        </button>
      </div>
    )}
  </div>
  );
});

FundamentalsPanel.displayName = "FundamentalsPanel";
