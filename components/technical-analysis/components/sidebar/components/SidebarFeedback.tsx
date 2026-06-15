import React from "react";
import type { AuditTrailItem } from "../data/sidebarDataTypes";

const HIDDEN_AUDIT_LABELS = new Set(["Source", "Date"]);

export const SidebarUnavailableState = ({ message }: { message: string }) => (
  <div className="gp-sidebar-unavailable-state" role="status">
    <span className="gp-sidebar-unavailable-state__icon" aria-hidden="true">
      <i className="bi bi-shield-exclamation" />
    </span>
    <span className="gp-sidebar-unavailable-state__copy">{message}</span>
  </div>
);

export const SidebarAuditTrail = React.memo(({ items }: { items: AuditTrailItem[] }) => {
  const visibleItems = items.reduce<AuditTrailItem[]>((visible, item) => {
    if (HIDDEN_AUDIT_LABELS.has(item.label)) return visible;
    if (visible.some((visibleItem) => visibleItem.label === item.label)) return visible;
    visible.push(item);
    return visible;
  }, []);
  if (visibleItems.length === 0) return null;

  return (
    <div
      className="gp-sidebar-audit-trail d-flex flex-wrap align-items-center"
      style={{
        gap: "2px",
        width: "100%",
        justifyContent: "center",
        marginTop: "3px",
        marginBottom: "0",
        paddingTop: "3px",
        borderTop: "1px solid rgba(42, 46, 57, 0.45)",
      }}
    >
      {visibleItems.map((item) => {
        const color = item.tone === "warning" ? "#f59e0b" : item.tone === "success" ? "#22ab94" : "#94a3b8";
        return (
          <span
            key={item.label + "-" + item.value}
            title={item.label + ": " + item.value}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "2px",
              maxWidth: "100%",
              padding: "1px 4px",
              borderRadius: "4px",
              background: "rgba(15, 23, 42, 0.55)",
              border: "1px solid rgba(148, 163, 184, 0.18)",
              color,
              fontSize: "8px",
              lineHeight: 1.15,
              fontWeight: 600,
            }}
          >
            <span style={{ color: "#94a3b8", textTransform: "uppercase" }}>{item.label}</span>
            <span>{item.value}</span>
          </span>
        );
      })}
    </div>
  );
});

SidebarAuditTrail.displayName = "SidebarAuditTrail";
