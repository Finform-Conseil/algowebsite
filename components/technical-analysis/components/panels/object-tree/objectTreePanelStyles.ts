import type { CSSProperties } from "react";

export const TV = {
  bg: "var(--gp-bg-toolbar, #0d2136)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  shadow: "0 4px 24px rgba(0,0,0,0.4)",
  radius: "8px",
  tabActiveBg: "rgba(255, 255, 255, 0.04)",
  tabText: "#d1d4dc",
  tabMuted: "#787b86",
  tabActiveColor: "#d1d4dc",
  labelColor: "#b2b5be",
  valueColor: "#d1d4dc",
  bullColor: "#26a69a",
  bearColor: "#ef5350",
  rowHoverBg: "rgba(255, 255, 255, 0.04)",
  divider: "1px solid rgba(255, 255, 255, 0.06)",
  iconBtn: "#787b86",
  iconBtnHover: "#d1d4dc",
  trashHover: "#f23645",
} as const;

export const iconBtnStyle: CSSProperties = {
  border: "none",
  background: "transparent",
  padding: "2px 4px",
  cursor: "pointer",
  color: TV.iconBtn,
  fontSize: 12,
  display: "inline-flex",
  alignItems: "center",
  flexShrink: 0,
  transition: "color 0.1s",
};

export const toolbarIconBtnStyle: CSSProperties = {
  border: "none",
  background: "transparent",
  padding: "4px 8px",
  cursor: "pointer",
  color: TV.iconBtn,
  fontSize: 15,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.15s",
  borderRadius: "4px",
};

export const menuItemStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  width: "100%",
  padding: "8px 12px",
  background: "transparent",
  border: "none",
  color: "#d1d4dc",
  fontSize: "12px",
  textAlign: "left",
  cursor: "pointer",
  transition: "background 0.1s",
  borderRadius: 4,
};
