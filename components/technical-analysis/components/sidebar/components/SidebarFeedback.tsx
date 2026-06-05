import React from "react";
import type { AuditTrailItem } from "../data/sidebarDataTypes";

export const SidebarUnavailableState = ({ message }: { message: string }) => (
  <div
    className="d-flex align-items-center justify-content-center text-center px-3 py-4"
    style={{ minHeight: "120px", color: "#94a3b8", fontSize: "11px", lineHeight: 1.45 }}
  >
    <span>
      <i className="bi bi-shield-exclamation me-1" style={{ color: "#f59e0b" }} />
      {message}
    </span>
  </div>
);

export const SidebarAuditTrail = React.memo(({
  items,
  showSource = false,
}: {
  items: AuditTrailItem[];
  showSource?: boolean;
}) => (
  <div
    className="d-flex flex-wrap align-items-center"
    style={{
      gap: "4px",
      width: "100%",
      justifyContent: "center",
      marginTop: "8px",
      marginBottom: "10px",
      paddingTop: "7px",
      borderTop: "1px solid rgba(42, 46, 57, 0.45)",
    }}
  >
    {items.filter((item) => showSource || item.label !== "Source").map((item) => {
      const color = item.tone === "warning" ? "#f59e0b" : item.tone === "success" ? "#22ab94" : "#94a3b8";
      return (
        <span
          key={`${item.label}-${item.value}`}
          title={`${item.label}: ${item.value}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "3px",
            maxWidth: "100%",
            padding: "2px 6px",
            borderRadius: "4px",
            background: "rgba(15, 23, 42, 0.55)",
            border: "1px solid rgba(148, 163, 184, 0.18)",
            color,
            fontSize: "9.5px",
            lineHeight: 1.25,
            fontWeight: 600,
          }}
        >
          <span style={{ color: "#94a3b8", textTransform: "uppercase" }}>{item.label}</span>
          <span>{item.value}</span>
        </span>
      );
    })}
  </div>
));

SidebarAuditTrail.displayName = "SidebarAuditTrail";
