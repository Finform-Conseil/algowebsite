import React from "react";
import clsx from "clsx";

interface FundamentalsPanelProps {
  auditTrail?: React.ReactNode;
  chartRef: React.RefObject<HTMLDivElement | null>;
  isAvailable: boolean;
  isLoading: boolean;
  onMoreInfo: () => void;
  unavailableState: React.ReactNode;
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
    <div className="is-loading-skeleton gp-sidebar-skeleton-line" style={{ width: "34%", height: "16px" }} />
    <div className="gp-sidebar-skeleton-chart">
      {[0, 1, 2, 3].map((index) => (
        <span key={index} className="gp-sidebar-skeleton-grid-line" />
      ))}
      {[2013, 2014, 2015].map((year, index) => (
        <span
          key={year}
          className="is-loading-skeleton gp-sidebar-skeleton-line gp-sidebar-skeleton-chart-dot"
          style={{ left: `${18 + index * 28}%`, bottom: `${20 + index * 16}%` }}
        />
      ))}
    </div>
  </div>
);

export const FundamentalsPanel = React.memo(({
  auditTrail,
  chartRef,
  isAvailable,
  isLoading,
  onMoreInfo,
  unavailableState,
}: FundamentalsPanelProps) => (
  <div className={clsx("gp-sidebar-section", "gp-benefits-section-v2")} style={{ minHeight: "150px" }}>
    <div className="gp-sidebar-header">
      <span className="gp-sidebar-title">Fondamentaux (FY)</span>
    </div>
    {isLoading ? (
      <FundamentalsSkeleton />
    ) : !isAvailable ? (
      unavailableState
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
));

FundamentalsPanel.displayName = "FundamentalsPanel";
