import React from "react";

interface ModelHeuristicData {
  pctChange: number;
  priceTarget: number;
}

interface ModelHeuristicPanelProps {
  auditTrail?: React.ReactNode;
  chartRef: React.RefObject<HTMLDivElement | null>;
  isLoading: boolean;
  modelData: ModelHeuristicData | null;
  onSeeSource: () => void;
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

const ModelHeuristicSkeleton = () => (
  <div key="loading" style={{ height: "160px", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div className="is-loading-skeleton" style={{ width: "80%", height: "120px", borderRadius: "8px" }} />
  </div>
);

export const ModelHeuristicPanel = React.memo(({
  auditTrail,
  chartRef,
  isLoading,
  modelData,
  onSeeSource,
  unavailableState,
}: ModelHeuristicPanelProps) => (
  <div className="gp-sidebar-section" style={{ borderTop: "1px solid rgba(42, 46, 57, 0.5)", marginTop: "8px", paddingTop: "12px" }}>
    <div className="gp-sidebar-header" style={{ marginBottom: "0px" }}>
      <span className="gp-sidebar-title" style={{ fontSize: "14px", fontWeight: 700, color: "#d1d4dc" }}>Model heuristic</span>
    </div>
    {isLoading ? (
      <ModelHeuristicSkeleton />
    ) : modelData ? (
      <div key="ready">
        <div ref={chartRef as React.RefObject<HTMLDivElement>} style={{ width: "100%", height: "160px" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 4px 4px", borderTop: "1px solid rgba(42,46,57,0.5)", marginTop: "4px" }}>
          <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 500 }}>1 year model target</span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#d1d4dc" }}>
              {modelData.priceTarget > 0 ? modelData.priceTarget.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) : "N/A"}
            </span>
            {modelData.priceTarget > 0 && (
              <span style={{ fontSize: "11px", fontWeight: 600, color: modelData.pctChange >= 0 ? "#22ab94" : "#f23645" }}>
                ({modelData.pctChange >= 0 ? "+" : ""}{modelData.pctChange.toFixed(2)}%)
              </span>
            )}
          </div>
        </div>
        {auditTrail}
        <div className="d-flex justify-content-center mt-2">
          <button className="hover-lift" style={ACTION_BUTTON_STYLE} onClick={onSeeSource}>
            See source
          </button>
        </div>
      </div>
    ) : (
      unavailableState
    )}
  </div>
));

ModelHeuristicPanel.displayName = "ModelHeuristicPanel";
