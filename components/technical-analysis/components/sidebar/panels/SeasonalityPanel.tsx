import React from "react";
interface SeasonalityPanelProps {
  auditTrail?: React.ReactNode;
  chartRef: React.RefObject<HTMLDivElement | null>;
  isAvailable: boolean;
  isLoading: boolean;
  onMoreSeasonals: () => void;
  unavailableState: React.ReactNode;
  years: number[];
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

const SEASONAL_COLORS = ["#2962ff", "#089981", "#f57c00"];

const SeasonalitySkeleton = () => (
  <div key="loading" className="p-2">
    <div className="is-loading-skeleton" style={{ width: "100%", height: "160px", borderRadius: "8px" }} />
  </div>
);

export const SeasonalityPanel = React.memo(({
  auditTrail,
  chartRef,
  isAvailable,
  isLoading,
  onMoreSeasonals,
  unavailableState,
  years,
}: SeasonalityPanelProps) => (
  <div className="gp-sidebar-section" style={{ borderTop: "1px solid rgba(42, 46, 57, 0.5)", marginTop: "8px", paddingTop: "12px" }}>
    <div className="gp-sidebar-header" style={{ marginBottom: "12px" }}>
      <span className="gp-sidebar-title" style={{ fontSize: "14px", fontWeight: 700, color: "#d1d4dc" }}>Seasonals</span>
    </div>
    {isLoading ? (
      <SeasonalitySkeleton />
    ) : !isAvailable ? (
      unavailableState
    ) : (
      <div key="ready">
        <div ref={chartRef as React.RefObject<HTMLDivElement>} style={{ width: "100%", height: "160px" }} />
        <div className="d-flex justify-content-center gap-3 mt-2" style={{ fontSize: "11px", color: "#787b86" }}>
          {years.map((year, index) => (
            <div key={year} className="d-flex align-items-center gap-1.5">
              <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: SEASONAL_COLORS[index] ?? "#94a3b8" }} />
              <span>{year}</span>
            </div>
          ))}
        </div>
        {auditTrail}
      </div>
    )}
    {!isLoading && (
      <div className="d-flex justify-content-center mt-3">
        <button className="hover-lift" style={ACTION_BUTTON_STYLE} onClick={onMoreSeasonals}>
          More seasonals
        </button>
      </div>
    )}
  </div>
));

SeasonalityPanel.displayName = "SeasonalityPanel";
