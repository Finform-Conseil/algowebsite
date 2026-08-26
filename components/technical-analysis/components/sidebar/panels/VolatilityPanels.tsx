import React from "react";

const INFO_NOTICE_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "6px",
  margin: "0 0 10px",
  padding: "7px 8px",
  border: "1px solid rgba(96, 165, 250, 0.22)",
  borderRadius: "6px",
  backgroundColor: "rgba(96, 165, 250, 0.06)",
  color: "#94a3b8",
  fontSize: "10px",
  lineHeight: 1.35,
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
  notice,
  title,
  unavailableState,
}: {
  auditTrail: React.ReactNode;
  chartRef: React.RefObject<HTMLDivElement | null>;
  isLoading: boolean;
  isReady: boolean;
  notice?: React.ReactNode;
  title: string;
  unavailableState: React.ReactNode;
}) => (
  <div className="gp-sidebar-section" style={{ borderTop: "1px solid rgba(42, 46, 57, 0.5)", marginTop: "8px", paddingTop: "12px", borderBottom: "none" }}>
    <div className="gp-sidebar-header" style={{ marginBottom: "10px" }}>
      <span className="gp-sidebar-title" style={{ fontSize: "14px", fontWeight: 700, color: "#d1d4dc" }}>{title}</span>
    </div>
    {!isLoading && notice ? (
      <div role="status" style={INFO_NOTICE_STYLE}>
        <span aria-hidden="true" style={{ color: "#60a5fa", fontSize: "12px", lineHeight: 1 }}>ⓘ</span>
        <span>{notice}</span>
      </div>
    ) : null}
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
  curveNotice,
  curveUnavailableState,
  isCurveReady,
  isLoading,
  isTermReady,
  termAuditTrail,
  termUnavailableState,
  volatilityChartRef,
  volatilityCurveChartRef,
}: {
  curveAuditTrail: React.ReactNode;
  curveNotice?: React.ReactNode;
  curveUnavailableState: React.ReactNode;
  isCurveReady: boolean;
  isLoading: boolean;
  isTermReady: boolean;
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
      auditTrail={curveAuditTrail}
      chartRef={volatilityCurveChartRef}
      isLoading={isLoading}
      isReady={isCurveReady}
      notice={curveNotice}
      title="Historical volatility curve (28 days)"
      unavailableState={curveUnavailableState}
    />
  </>
));

VolatilityPanels.displayName = "VolatilityPanels";
