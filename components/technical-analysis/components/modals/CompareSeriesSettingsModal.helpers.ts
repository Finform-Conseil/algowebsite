import type {
  CompareSeriesLineStyle,
  CompareSeriesOverrideMinTick,
  CompareSeriesPriceSource,
  CompareSeriesVisibilityKey,
  CompareSeriesVisibilityRange,
} from "../../config/compareSeries";

export type CompareSettingsTab = "inputs" | "style" | "visibility";

export const COMPARE_SETTINGS_TABS: Array<{ id: CompareSettingsTab; label: string }> = [
  { id: "inputs", label: "Inputs" },
  { id: "style", label: "Style" },
  { id: "visibility", label: "Visibility" },
];

export const PRICE_SOURCE_OPTIONS: Array<{ value: CompareSeriesPriceSource; label: string }> = [
  { value: "close", label: "Close" },
  { value: "open", label: "Open" },
  { value: "high", label: "High" },
  { value: "low", label: "Low" },
];

export const LINE_STYLE_OPTIONS: Array<{ value: CompareSeriesLineStyle; label: string }> = [
  { value: "solid", label: "Solid" },
  { value: "dashed", label: "Dashed" },
  { value: "dotted", label: "Dotted" },
];

export const OVERRIDE_TICK_OPTIONS: Array<{ value: CompareSeriesOverrideMinTick; label: string }> = [
  { value: "default", label: "Default" },
  { value: "auto", label: "Auto" },
];

export const VISIBILITY_ROWS: Array<{ key: CompareSeriesVisibilityKey; label: string }> = [
  { key: "ticks", label: "Ticks" },
  { key: "seconds", label: "Seconds" },
  { key: "minutes", label: "Minutes" },
  { key: "hours", label: "Hours" },
  { key: "days", label: "Days" },
  { key: "weeks", label: "Weeks" },
  { key: "months", label: "Months" },
  { key: "ranges", label: "Ranges" },
];

export const clampInteger = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, Math.round(Number.isFinite(value) ? value : min)));

export const normalizeRangePatch = (
  current: CompareSeriesVisibilityRange,
  patch: Partial<CompareSeriesVisibilityRange>,
): CompareSeriesVisibilityRange => {
  const next = { ...current, ...patch };
  const min = clampInteger(next.min, 1, 999);
  const max = clampInteger(next.max, 1, 999);

  return {
    enabled: next.enabled,
    min: Math.min(min, max),
    max: Math.max(min, max),
  };
};
