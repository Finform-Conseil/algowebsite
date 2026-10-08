export type DrawingTextColorMode = "linked" | "custom";

/**
 * Tools whose primary color is the visible foreground color of the annotation.
 *
 * Legacy drawings (no textColorMode) are treated as linked. Structural tools
 * such as pin, table and price_note are intentionally excluded because their
 * primary color controls a body/border/line while text remains independent.
 */
export const PRIMARY_COLOR_DRIVES_TEXT_TOOLS = [
  "text_note",
  "note",
  "callout",
  "comment",
  "price_label",
] as const;

export const PRIMARY_COLOR_DRIVES_TEXT_TOOL_SET = new Set<string>(
  PRIMARY_COLOR_DRIVES_TEXT_TOOLS,
);

export const primaryColorDrivesText = (toolType: string): boolean =>
  PRIMARY_COLOR_DRIVES_TEXT_TOOL_SET.has(toolType);

export const resolveDrawingTextColor = ({
  toolType,
  primaryColor,
  textColor,
  textColorMode,
  fallback = "#2962FF",
}: {
  toolType: string;
  primaryColor?: string;
  textColor?: string;
  textColorMode?: DrawingTextColorMode;
  fallback?: string;
}): string => {
  if (primaryColorDrivesText(toolType) && textColorMode !== "custom") {
    return primaryColor || textColor || fallback;
  }

  return textColor || primaryColor || fallback;
};
