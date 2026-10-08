export const VELA_VISUAL_CONTRACT = Object.freeze({
  background: "#151619",
  text: "#b2b5be",
  grid: "#20222c",
  border: "#2a2b30",
  bullish: "#089981",
  bearish: "#f23645",
  crosshair: "#9aa0ad",
  crosshairOpacity: 0.4,
  crosshairLabelBackground: "#595959",
  fontSize: 11,
  priceAxisWidthPx: 64,
  timeAxisHeightPx: 22,
  defaultBarSpacingPx: 8,
  defaultRightOffsetBars: 6,
} as const);

export const FINFORM_SKIN_CONTRACT = Object.freeze({
  solidBackground: "#102a43",
  gradientTop: "#102a43",
  gradientBottom: "#0b1f33",
  gridLine: "#334155",
} as const);

export const resolveFinformSkinBackground = (
  value: string | null | undefined,
  fallback: string,
): string => {
  const normalized = value?.trim().toLowerCase();
  if (!normalized || normalized === VELA_VISUAL_CONTRACT.background.toLowerCase()) {
    return fallback;
  }
  return value as string;
};

export const resolveFinformSkinGridLine = (
  value: string | null | undefined,
  fallback: string = FINFORM_SKIN_CONTRACT.gridLine,
): string => {
  const normalized = value?.trim().toLowerCase();
  if (!normalized || normalized === VELA_VISUAL_CONTRACT.grid.toLowerCase()) {
    return fallback;
  }
  return value as string;
};

export const LEGACY_ECHARTS_VISUAL_DEFAULTS = Object.freeze({
  background: ["transparent", "#102a43", "#0b1f33"],
  text: ["#cbd5e1", "#a0aec0"],
  grid: ["#334155"],
  border: ["#334155"],
  bullish: ["#00da3c"],
  bearish: ["#ec0000"],
  crosshair: ["#94a3b8"],
} as const);

export const resolveVelaParityToken = (
  value: string | null | undefined,
  legacyValues: readonly string[],
  velaValue: string,
): string => {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return velaValue;
  return legacyValues.some((legacy) => legacy.toLowerCase() === normalized)
    ? velaValue
    : value as string;
};
