import React from "react";
import SentimentGauge, { toSentimentGaugeParts } from "@/components/technical/SentimentGauge";
import type { SidebarTechnicalData } from "../TechnicalAnalysisSidebar.types";

interface TechnicalsPanelProps {
  auditTrail?: React.ReactNode;
  isAvailable: boolean;
  isLoading: boolean;
  onMoreTechnicals: () => void;
  technicalData: SidebarTechnicalData | null;
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

const TechnicalsSkeleton = () => (
  <div key="loading" className="p-2">
    <div className="is-loading-skeleton" style={{ width: "100%", height: "160px", borderRadius: "8px" }} />
  </div>
);

export const TechnicalsPanel = React.memo(({
  auditTrail,
  isAvailable,
  isLoading,
  onMoreTechnicals,
  technicalData,
  unavailableState,
}: TechnicalsPanelProps) => {
  const gaugeParts = technicalData ? toSentimentGaugeParts(technicalData.score) : null;

  return (
    <div className="gp-sidebar-section" style={{ borderTop: "1px solid rgba(42, 46, 57, 0.5)", marginTop: "8px", paddingTop: "12px" }}>
      <div className="gp-sidebar-header" style={{ marginBottom: "0px" }}>
        <span className="gp-sidebar-title" style={{ fontSize: "14px", fontWeight: 700, color: "#d1d4dc" }}>Technicals</span>
      </div>
      {isLoading ? (
        <TechnicalsSkeleton />
      ) : !isAvailable || !gaugeParts ? (
        unavailableState
      ) : (
        <div key="ready">
          <SentimentGauge {...gaugeParts} />
          {auditTrail}
          <div className="d-flex justify-content-center mt-2">
            <button className="hover-lift" style={ACTION_BUTTON_STYLE} onClick={onMoreTechnicals}>
              More technicals
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

TechnicalsPanel.displayName = "TechnicalsPanel";
