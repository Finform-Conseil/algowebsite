import type { CSSProperties } from "react";

export const ACTIVE_BLUE = "#2962ff";
export const ACTIVE_BG = "rgba(41, 98, 255, 0.1)";
export const ACCENT_GOLD = "#ff9f04";

export const getActiveOptionStyle = (isActive: boolean): CSSProperties => ({
  color: isActive ? ACTIVE_BLUE : "inherit",
  backgroundColor: isActive ? ACTIVE_BG : "transparent",
});
