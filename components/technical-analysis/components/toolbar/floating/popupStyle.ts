import type { CSSProperties, SyntheticEvent } from "react";

interface FloatingPopupStyleOptions {
  left: string;
  width: string;
  top?: string;
  bottom?: string;
  background?: string;
  border?: string;
  borderRadius?: string;
  boxShadow?: string;
  color?: string;
  display?: CSSProperties["display"];
  flexDirection?: CSSProperties["flexDirection"];
  fontSize?: string;
  gap?: string;
  overflow?: CSSProperties["overflow"];
  padding?: string;
}

export const stopFloatingPopupMouseDown = (event: SyntheticEvent<HTMLElement>) => {
  event.stopPropagation();
};

export const buildFloatingPopupStyle = ({
  left,
  width,
  top = "var(--popup-top, 36px)",
  bottom = "var(--popup-bottom, auto)",
  background = "var(--gp-bg-toolbar, #0d2136)",
  border = "1px solid var(--gp-border-color-light, #2d455c)",
  borderRadius = "6px",
  boxShadow = "0 4px 12px rgba(0, 0, 0, 0.5)",
  color,
  display,
  flexDirection,
  fontSize,
  gap,
  overflow,
  padding,
}: FloatingPopupStyleOptions): CSSProperties => ({
  position: "absolute",
  top,
  bottom,
  left,
  background,
  border,
  borderRadius,
  zIndex: 1100,
  width,
  boxShadow,
  transform: "var(--popup-transform, none)",
  ...(color ? { color } : {}),
  ...(display ? { display } : {}),
  ...(flexDirection ? { flexDirection } : {}),
  ...(fontSize ? { fontSize } : {}),
  ...(gap ? { gap } : {}),
  ...(overflow ? { overflow } : {}),
  ...(padding ? { padding } : {}),
});
