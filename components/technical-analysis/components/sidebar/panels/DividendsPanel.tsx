import React from "react";

interface DividendsPanelProps {
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

const DividendsSkeleton = () => (
  <div key="loading" className="p-2">
    <div className="is-loading-skeleton" style={{ width: "100%", height: "150px", borderRadius: "8px" }} />
  </div>
);

export const DividendsPanel = React.memo(({
  auditTrail,
  chartRef,
  isAvailable,
  isLoading,
  onMoreInfo,
}: DividendsPanelProps) => {
  if (!isLoading && !isAvailable) return null;

  return (
  <div className="gp-sidebar-section" style={{ borderBottom: "none" }}>
    <div className="gp-sidebar-header">
      <span className="gp-sidebar-title">Dividends</span>
    </div>
    {isLoading ? (
      <DividendsSkeleton />
    ) : (
      <div key="ready">
        <div ref={chartRef as React.RefObject<HTMLDivElement>} style={{ width: "100%", height: "150px" }} />
        <div className="d-flex justify-content-center gap-3 mt-2" style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
          <div className="d-flex align-items-center gap-1">
            <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#64748b" }} />
            <span>Earnings retained</span>
          </div>
          <div className="d-flex align-items-center gap-1">
            <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#10b981" }} />
            <span>Payout ratio</span>
          </div>
        </div>
        {auditTrail}
      </div>
    )}
    {!isLoading && isAvailable && (
      <div className="d-flex justify-content-center mt-3">
        <button
          type="button"
          className="hover-lift"
          style={ACTION_BUTTON_STYLE}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onMoreInfo();
          }}
        >
          More info
        </button>
      </div>
    )}
  </div>
  );
});

DividendsPanel.displayName = "DividendsPanel";
