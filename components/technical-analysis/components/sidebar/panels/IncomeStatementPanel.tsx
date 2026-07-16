import React from "react";

type IncomeViewMode = "annual" | "quarterly";

interface IncomeStatementPanelProps {
  auditTrail?: React.ReactNode;
  chartRef: React.RefObject<HTMLDivElement | null>;
  isAvailable: boolean;
  isLoading: boolean;
  onModeChange: (mode: IncomeViewMode) => void;
  onMoreFinancials: () => void;
  viewMode: IncomeViewMode;
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

const modeButtonStyle = (isActive: boolean): React.CSSProperties => ({
  fontSize: "10px",
  padding: "3px 8px",
  borderRadius: "3px",
  border: "none",
  backgroundColor: isActive ? "#2962ff" : "transparent",
  color: isActive ? "#fff" : "#787b86",
});

const IncomeStatementSkeleton = () => (
  <div key="loading" className="p-2">
    <div className="is-loading-skeleton" style={{ width: "100%", height: "140px", borderRadius: "8px" }} />
  </div>
);

export const IncomeStatementPanel = React.memo(({
  auditTrail,
  chartRef,
  isAvailable,
  isLoading,
  onModeChange,
  onMoreFinancials,
  viewMode,
}: IncomeStatementPanelProps) => {
  if (!isLoading && !isAvailable) return null;

  return (
  <div className="gp-sidebar-section" style={{ borderTop: "1px solid rgba(42, 46, 57, 0.5)", marginTop: "8px", paddingTop: "12px" }}>
    <div className="gp-sidebar-header" style={{ marginBottom: "8px" }}>
      <div className="d-flex justify-content-between align-items-center w-100">
        <span className="gp-sidebar-title" style={{ fontSize: "14px", fontWeight: 700, color: "#d1d4dc" }}>Income statement</span>
        <div className="d-flex bg-[#1e222d] border border-[#363a45] p-[2px] rounded">
          <button type="button" onClick={() => onModeChange("annual")} style={modeButtonStyle(viewMode === "annual")}>Annual</button>
          <button type="button" onClick={() => onModeChange("quarterly")} style={modeButtonStyle(viewMode === "quarterly")}>Quarterly</button>
        </div>
      </div>
    </div>
    {isLoading ? (
      <IncomeStatementSkeleton />
    ) : (
      <div key="ready">
        <div ref={chartRef as React.RefObject<HTMLDivElement>} style={{ width: "100%", height: "140px" }} />
        <div className="d-flex justify-content-center gap-4 mt-2" style={{ fontSize: "11px", color: "#787b86" }}>
          <div className="d-flex align-items-center gap-1.5">
            <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#2962ff" }} />
            <span>Revenue</span>
          </div>
          <div className="d-flex align-items-center gap-1.5">
            <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#ff9800" }} />
            <span>Net margin %</span>
          </div>
        </div>
        {auditTrail}
      </div>
    )}
    {!isLoading && isAvailable && (
      <div className="d-flex justify-content-center mt-3">
        <button className="hover-lift" style={ACTION_BUTTON_STYLE} onClick={onMoreFinancials}>
          More financials
        </button>
      </div>
    )}
  </div>
  );
});

IncomeStatementPanel.displayName = "IncomeStatementPanel";
