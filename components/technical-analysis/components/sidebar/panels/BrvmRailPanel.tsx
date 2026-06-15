import React from "react";
import clsx from "clsx";

export interface BrvmRailRow {
  label: string;
  value: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
}

export interface BrvmRailAction {
  label: string;
  onClick: () => void;
}

interface BrvmRailPanelProps {
  actions?: BrvmRailAction[];
  auditTrail?: React.ReactNode;
  children?: React.ReactNode;
  rows?: BrvmRailRow[];
  subtitle?: string;
  tags?: string[];
  title: string;
}

const toneClassName = (tone: BrvmRailRow["tone"]) => {
  if (tone === "success") return "text-success";
  if (tone === "warning") return "text-warning";
  if (tone === "danger") return "text-danger";
  return "";
};

export const BrvmRailPanel = React.memo(({
  actions = [],
  auditTrail,
  children,
  rows = [],
  subtitle,
  tags = [],
  title,
}: BrvmRailPanelProps) => (
  <div className="gp-sidebar-section gp-brvm-rail-panel">
    <div className="gp-sidebar-header gp-brvm-rail-panel-header">
      <div>
        <span className="gp-sidebar-title">{title}</span>
        {subtitle && <div className="gp-brvm-rail-subtitle">{subtitle}</div>}
      </div>
    </div>

    {tags.length > 0 && (
      <div className="gp-brvm-rail-tags" aria-label={`${title} tags`}>
        {tags.map((tag) => <span key={tag}>{tag}</span>)}
      </div>
    )}

    {rows.length > 0 && (
      <div className="gp-brvm-rail-table">
        {rows.map((row) => (
          <div key={row.label} className="row g-0">
            <span className="col stat-label">{row.label}</span>
            <span className={clsx("col-auto", "stat-value", toneClassName(row.tone))}>{row.value}</span>
          </div>
        ))}
      </div>
    )}

    {children}

    {actions.length > 0 && (
      <div className="gp-brvm-rail-actions">
        {actions.map((action) => (
          <button key={action.label} type="button" className="hover-lift" onClick={action.onClick}>
            {action.label}
          </button>
        ))}
      </div>
    )}

    {auditTrail}
  </div>
));

BrvmRailPanel.displayName = "BrvmRailPanel";
