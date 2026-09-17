export type FloatingMenuPlacement = "top" | "bottom";

export interface FloatingMenuPositionInput {
  anchorRect: Pick<DOMRect, "top" | "right" | "bottom" | "left">;
  menuWidth: number;
  menuHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  gap?: number;
  viewportPadding?: number;
}

export interface FloatingMenuPosition {
  top: number;
  left: number;
  maxHeight: number;
  placement: FloatingMenuPlacement;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), Math.max(min, max));

/** Resolve a viewport-safe floating-menu position. */
export const computeFloatingMenuPosition = ({
  anchorRect,
  menuWidth,
  menuHeight,
  viewportWidth,
  viewportHeight,
  gap = 5,
  viewportPadding = 8,
}: FloatingMenuPositionInput): FloatingMenuPosition => {
  const safeMenuWidth = Math.max(0, Math.min(menuWidth, viewportWidth - viewportPadding * 2));
  const safeMenuHeight = Math.max(0, menuHeight);
  const spaceBelow = Math.max(0, viewportHeight - viewportPadding - anchorRect.bottom - gap);
  const spaceAbove = Math.max(0, anchorRect.top - viewportPadding - gap);
  const left = clamp(anchorRect.left, viewportPadding, viewportWidth - viewportPadding - safeMenuWidth);

  if (safeMenuHeight <= spaceBelow) {
    return { top: anchorRect.bottom + gap, left, maxHeight: safeMenuHeight, placement: "bottom" };
  }

  if (safeMenuHeight <= spaceAbove) {
    return { top: anchorRect.top - gap - safeMenuHeight, left, maxHeight: safeMenuHeight, placement: "top" };
  }

  const placement: FloatingMenuPlacement = spaceBelow >= spaceAbove ? "bottom" : "top";
  const maxHeight = placement === "bottom" ? spaceBelow : spaceAbove;
  const top = placement === "bottom"
    ? anchorRect.bottom + gap
    : anchorRect.top - gap - maxHeight;

  return { top, left, maxHeight, placement };
};
