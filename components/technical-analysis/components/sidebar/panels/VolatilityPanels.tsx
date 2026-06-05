import React from "react";

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

const VolatilitySkeleton = ({ paddingClass }: { paddingClass: string }) => (
  <div key="loading" className={paddingClass}>
    <div className="is-loading-skeleton" style={{ width: "100%", height: "180px", borderRadius: "8px" }} />
  </div>
);

const VolatilitySection = ({
  auditTrail,
  chartRef,
  isLoading,
  isReady,
  title,
  unavailableState,
}: {
  auditTrail: React.ReactNode;
  chartRef: React.RefObject<HTMLDivElement | null>;
  isLoading: boolean;
  isReady: boolean;
  title: string;
  unavailableState: React.ReactNode;
}) => (
  <div className="gp-sidebar-section" style={{ borderTop: "1px solid rgba(42, 46, 57, 0.5)", marginTop: "8px", paddingTop: "12px", borderBottom: "none" }}>
    <div className="gp-sidebar-header" style={{ marginBottom: "10px" }}>
      <span className="gp-sidebar-title" style={{ fontSize: "14px", fontWeight: 700, color: "#d1d4dc" }}>{title}</span>
    </div>
    {isLoading ? (
      <VolatilitySkeleton paddingClass="p-0" />
    ) : !isReady ? (
      unavailableState
    ) : (
      <div key="ready">
        <div ref={chartRef as React.RefObject<HTMLDivElement>} style={{ width: "100%", height: "180px" }} />
        {auditTrail}
      </div>
    )}
  </div>
);

export const VolatilityPanels = React.memo(({
  curveAuditTrail,
  curveUnavailableState,
  isCurveReady,
  isLoading,
  isTermReady,
  onSource,
  termAuditTrail,
  termUnavailableState,
  volatilityChartRef,
  volatilityCurveChartRef,
}: {
  curveAuditTrail: React.ReactNode;
  curveUnavailableState: React.ReactNode;
  isCurveReady: boolean;
  isLoading: boolean;
  isTermReady: boolean;
  onSource: () => void;
  termAuditTrail: React.ReactNode;
  termUnavailableState: React.ReactNode;
  volatilityChartRef: React.RefObject<HTMLDivElement | null>;
  volatilityCurveChartRef: React.RefObject<HTMLDivElement | null>;
}) => (
  <>
    <VolatilitySection
      auditTrail={termAuditTrail}
      chartRef={volatilityChartRef}
      isLoading={isLoading}
      isReady={isTermReady}
      title="Historical volatility term structure"
      unavailableState={termUnavailableState}
    />
    <VolatilitySection
      auditTrail={
        <>
          {curveAuditTrail}
          <div className="d-flex justify-content-center mt-0 pt-0">
            <button className="hover-lift" style={ACTION_BUTTON_STYLE} onClick={onSource}>
              Source BRVM
            </button>
          </div>
        </>
      }
      chartRef={volatilityCurveChartRef}
      isLoading={isLoading}
      isReady={isCurveReady}
      title="Historical volatility curve (28 days)"
      unavailableState={curveUnavailableState}
    />
  </>
));

VolatilityPanels.displayName = "VolatilityPanels";
