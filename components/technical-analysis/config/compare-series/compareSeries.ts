export const COMPARE_SERIES_PALETTE = ["#00C853", "#2962FF", "#E91E63", "#FF9800", "#7C4DFF"] as const;

export const normalizeCompareSymbol = (symbol: string): string => symbol.trim().toUpperCase();

const COMPARE_INSTRUMENT_SEPARATOR = "::";

export interface CompareInstrumentRef {
  market: string;
  symbol: string;
}

export const normalizeCompareMarket = (market: string): string => market.trim().toUpperCase();

export const createCompareInstrumentKey = (market: string, symbol: string): string => {
  const normalizedMarket = normalizeCompareMarket(market);
  const normalizedSymbol = normalizeCompareSymbol(symbol);
  if (!normalizedMarket || !normalizedSymbol) return "";
  return `${normalizedMarket}${COMPARE_INSTRUMENT_SEPARATOR}${normalizedSymbol}`;
};

export const parseCompareInstrumentKey = (
  value: string,
  fallbackMarket = "",
): CompareInstrumentRef | null => {
  const normalized = normalizeCompareSymbol(value);
  if (!normalized) return null;
  const separatorIndex = normalized.indexOf(COMPARE_INSTRUMENT_SEPARATOR);
  if (separatorIndex < 0) {
    const market = normalizeCompareMarket(fallbackMarket);
    return market ? { market, symbol: normalized } : null;
  }
  const market = normalizeCompareMarket(normalized.slice(0, separatorIndex));
  const symbol = normalizeCompareSymbol(normalized.slice(separatorIndex + COMPARE_INSTRUMENT_SEPARATOR.length));
  return market && symbol ? { market, symbol } : null;
};

export const getCompareInstrumentLabel = (value: string, fallbackMarket = ""): string => {
  const instrument = parseCompareInstrumentKey(value, fallbackMarket);
  if (!instrument) return normalizeCompareSymbol(value);
  return `${instrument.symbol} · ${instrument.market}`;
};

export const getCompareSeriesId = (comparisonKey: string): string => {
  const normalized = normalizeCompareSymbol(comparisonKey);
  return `compare-${normalized.replace(/[^A-Z0-9_-]+/g, "-")}`;
};

export const getCompareSeriesColor = (index: number): string => {
  const paletteIndex = ((index % COMPARE_SERIES_PALETTE.length) + COMPARE_SERIES_PALETTE.length) % COMPARE_SERIES_PALETTE.length;
  return COMPARE_SERIES_PALETTE[paletteIndex];
};

export type CompareSeriesPriceSource = "open" | "high" | "low" | "close";
export type CompareSeriesLineStyle = "solid" | "dashed" | "dotted";
export type CompareSeriesStyle = "line";
export type CompareSeriesOverrideMinTick = "default" | "auto";

export type CompareSeriesVisibilityKey =
  | "ticks"
  | "seconds"
  | "minutes"
  | "hours"
  | "days"
  | "weeks"
  | "months"
  | "ranges";

export type CompareSeriesVisibilityRange = {
  enabled: boolean;
  min: number;
  max: number;
};

export type CompareSeriesVisibility = Record<CompareSeriesVisibilityKey, CompareSeriesVisibilityRange>;

export interface CompareSeriesSettings {
  style: CompareSeriesStyle;
  priceSource: CompareSeriesPriceSource;
  color: string;
  lineStyle: CompareSeriesLineStyle;
  lineWidth: number;
  showPriceLine: boolean;
  overrideMinTick: CompareSeriesOverrideMinTick;
  visibility: CompareSeriesVisibility;
}

export type CompareSeriesSettingsMap = Record<string, CompareSeriesSettings>;

const VALID_PRICE_SOURCES = new Set<CompareSeriesPriceSource>(["open", "high", "low", "close"]);
const VALID_LINE_STYLES = new Set<CompareSeriesLineStyle>(["solid", "dashed", "dotted"]);
const VALID_OVERRIDE_MIN_TICKS = new Set<CompareSeriesOverrideMinTick>(["default", "auto"]);

export const DEFAULT_COMPARE_VISIBILITY: CompareSeriesVisibility = {
  ticks: { enabled: true, min: 1, max: 59 },
  seconds: { enabled: true, min: 1, max: 59 },
  minutes: { enabled: true, min: 1, max: 59 },
  hours: { enabled: true, min: 1, max: 24 },
  days: { enabled: true, min: 1, max: 366 },
  weeks: { enabled: true, min: 1, max: 52 },
  months: { enabled: true, min: 1, max: 12 },
  ranges: { enabled: true, min: 1, max: 1 },
};

export const createDefaultCompareSeriesSettings = (color: string): CompareSeriesSettings => ({
  style: "line",
  priceSource: "close",
  color,
  lineStyle: "solid",
  lineWidth: 2,
  showPriceLine: false,
  overrideMinTick: "default",
  visibility: Object.fromEntries(
    Object.entries(DEFAULT_COMPARE_VISIBILITY).map(([key, value]) => [key, { ...value }])
  ) as CompareSeriesVisibility,
});

const normalizeVisibilityRange = (
  value: Partial<CompareSeriesVisibilityRange> | undefined,
  fallback: CompareSeriesVisibilityRange,
): CompareSeriesVisibilityRange => {
  const min = Number.isFinite(value?.min) ? Number(value?.min) : fallback.min;
  const max = Number.isFinite(value?.max) ? Number(value?.max) : fallback.max;

  return {
    enabled: typeof value?.enabled === "boolean" ? value.enabled : fallback.enabled,
    min: Math.min(min, max),
    max: Math.max(min, max),
  };
};

export const normalizeCompareSeriesSettings = (
  settings: Partial<CompareSeriesSettings> | undefined,
  fallbackColor: string,
): CompareSeriesSettings => {
  const defaults = createDefaultCompareSeriesSettings(fallbackColor);
  const priceSource = settings?.priceSource as CompareSeriesPriceSource | undefined;
  const lineStyle = settings?.lineStyle as CompareSeriesLineStyle | undefined;
  const overrideMinTick = settings?.overrideMinTick as CompareSeriesOverrideMinTick | undefined;
  const lineWidth = Number(settings?.lineWidth);
  const visibility = Object.fromEntries(
    (Object.keys(DEFAULT_COMPARE_VISIBILITY) as CompareSeriesVisibilityKey[]).map((key) => [
      key,
      normalizeVisibilityRange(settings?.visibility?.[key], defaults.visibility[key]),
    ])
  ) as CompareSeriesVisibility;

  return {
    style: "line",
    priceSource: priceSource && VALID_PRICE_SOURCES.has(priceSource) ? priceSource : defaults.priceSource,
    color: typeof settings?.color === "string" && settings.color.trim() ? settings.color : defaults.color,
    lineStyle: lineStyle && VALID_LINE_STYLES.has(lineStyle) ? lineStyle : defaults.lineStyle,
    lineWidth: Number.isFinite(lineWidth)
      ? Math.min(6, Math.max(1, Math.round(lineWidth)))
      : defaults.lineWidth,
    showPriceLine: typeof settings?.showPriceLine === "boolean" ? settings.showPriceLine : defaults.showPriceLine,
    overrideMinTick: overrideMinTick && VALID_OVERRIDE_MIN_TICKS.has(overrideMinTick)
      ? overrideMinTick
      : defaults.overrideMinTick,
    visibility,
  };
};

export const resolveCompareSeriesSettings = (
  symbol: string,
  index: number,
  settingsMap: CompareSeriesSettingsMap = {}
): CompareSeriesSettings => {
  const normalized = normalizeCompareSymbol(symbol);
  return normalizeCompareSeriesSettings(settingsMap[normalized], getCompareSeriesColor(index));
};

export const getCompareVisibilityKeyForTimeframe = (
  timeframe: string | undefined,
): { key: CompareSeriesVisibilityKey; value: number } => {
  const normalized = (timeframe || "1D").trim();
  const [, rawValue = "1", rawUnit = "D"] = normalized.match(/^(\d+)?\s*([a-zA-Z]+)$/) ?? [];
  const value = Math.max(1, Number.parseInt(rawValue, 10) || 1);
  const unit = rawUnit.toUpperCase();

  if (unit === "S" || unit === "SEC" || unit === "SECOND" || unit === "SECONDS") return { key: "seconds", value };
  if (unit === "M" && normalized.endsWith("m")) return { key: "minutes", value };
  if (unit === "MIN" || unit === "MINS" || unit === "MINUTE" || unit === "MINUTES") return { key: "minutes", value };
  if (unit === "H" || unit === "HR" || unit === "HOUR" || unit === "HOURS") return { key: "hours", value };
  if (unit === "D" || unit === "DAY" || unit === "DAYS") return { key: "days", value };
  if (unit === "W" || unit === "WEEK" || unit === "WEEKS") return { key: "weeks", value };
  if (unit === "M" || unit === "MO" || unit === "MONTH" || unit === "MONTHS") return { key: "months", value };

  return { key: "days", value: 1 };
};

export const isCompareSeriesVisibleForTimeframe = (
  settings: CompareSeriesSettings,
  timeframe: string | undefined,
): boolean => {
  const { key, value } = getCompareVisibilityKeyForTimeframe(timeframe);
  const range = settings.visibility[key];
  return Boolean(range?.enabled && value >= range.min && value <= range.max);
};
