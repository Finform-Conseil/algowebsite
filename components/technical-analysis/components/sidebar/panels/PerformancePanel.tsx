import React from "react";

export interface PerformancePanelRow {
  label: string;
  value: number | null;
}

interface PerformancePanelProps {
  auditTrail?: React.ReactNode;
  rows: PerformancePanelRow[];
}

const formatPerformanceValue = (value: number | null) => {
  if (value === null) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
};

const getPerformanceTone = (value: number | null) => ((value ?? 0) >= 0 ? "positive" : "negative");

export const PerformancePanel = React.memo(({ auditTrail, rows }: PerformancePanelProps) => (
  <div className="gp-sidebar-section" style={{ borderTop: "1px solid rgba(42, 46, 57, 0.5)", marginTop: "8px", paddingTop: "12px" }}>
    <div className="gp-sidebar-header" style={{ marginBottom: "12px" }}>
      <span className="gp-sidebar-title" style={{ fontSize: "14px", fontWeight: 700, color: "#d1d4dc" }}>Performance</span>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
      {rows.map((row) => {
        const tone = getPerformanceTone(row.value);
        const isPositive = tone === "positive";
        return (
          <div
            key={row.label}
            className="d-flex flex-column align-items-center py-2"
            style={{ backgroundColor: isPositive ? "rgba(8, 153, 129, 0.08)" : "rgba(242, 54, 69, 0.08)", borderRadius: "4px" }}
          >
            <span style={{ fontSize: "10px", color: "#787b86" }}>{row.label}</span>
            <span style={{ fontSize: "11px", color: isPositive ? "#089981" : "#f23645", fontWeight: 700 }}>
              {formatPerformanceValue(row.value)}
            </span>
          </div>
        );
      })}
    </div>
    {auditTrail}
  </div>
));

PerformancePanel.displayName = "PerformancePanel";
