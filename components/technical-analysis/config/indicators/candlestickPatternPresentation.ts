export type CandlestickPatternKey =
  | "doji"
  | "longLeggedDoji"
  | "rickshawMan"
  | "dragonflyDoji"
  | "gravestoneDoji"
  | "tristar"
  | "hammer"
  | "hangingMan"
  | "takuri"
  | "invertedHammer"
  | "shootingStar"
  | "marubozuBull"
  | "marubozuBear"
  | "spinningTop";

type CandlestickMarkerPosition = "above" | "below" | "center";
type CandlestickMarkerSymbol = "circle" | "rect" | "roundRect" | "triangle" | "diamond" | `path://${string}`;
type CandlestickLabelPosition = "top" | "bottom" | "inside";
type CandlestickLabelPadding = number | [number, number] | [number, number, number, number];
type CandlestickLabelFontWeight = number | "normal" | "bold" | "bolder" | "lighter";

export type CandlestickPatternPresentation = {
  markerId: string;
  legendName: string;
  shortLabel?: string;
  chartLabel?: string;
  color: string;
  opacity?: number;
  borderColor: string;
  labelBackgroundColor: string;
  labelTextColor: string;
  labelBorderColor?: string;
  labelBorderWidth?: number;
  labelBorderRadius?: number;
  labelPadding?: CandlestickLabelPadding;
  labelFontSize?: number;
  labelFontWeight?: CandlestickLabelFontWeight;
  labelLineHeight?: number;
  labelDistance?: number;
  verticalBandColor?: string;
  verticalBandWidthRatio?: number;
  verticalBandZ?: number;
  showChartLabel: boolean;
  position: CandlestickMarkerPosition;
  symbol: CandlestickMarkerSymbol;
  symbolSize: number | [number, number];
  symbolOffset: [number, number];
  symbolRotate: number;
  labelPosition: CandlestickLabelPosition;
  maxMarkers: number;
  minBarGap: number;
  z: number;
};

export type CandlestickPatternSignalSummary = {
  legendName: string;
  shortLabel?: string;
  count: number;
};

export const CANDLESTICK_PATTERN_PRIORITY: readonly CandlestickPatternKey[] = [
  "tristar",
  "takuri",
  "hammer",
  "hangingMan",
  "invertedHammer",
  "shootingStar",
  "marubozuBull",
  "marubozuBear",
  "spinningTop",
  "dragonflyDoji",
  "gravestoneDoji",
  "rickshawMan",
  "longLeggedDoji",
  "doji",
];

const brightText = "#020617";
const lightText = "#f8fafc";

const aboveOffset: [number, number] = [0, -10];
const belowOffset: [number, number] = [0, 10];
const centerOffset: [number, number] = [0, 0];

export const CANDLESTICK_PATTERN_PRESENTATIONS = {
  tristar: {
    markerId: "tristar-zone",
    legendName: "Tristar",
    shortLabel: "TRI",
    color: "#8b5cf6",
    borderColor: "#c4b5fd",
    labelBackgroundColor: "#8b5cf6",
    labelTextColor: lightText,
    showChartLabel: true,
    position: "center",
    symbol: "roundRect",
    symbolSize: [18, 10],
    symbolOffset: centerOffset,
    symbolRotate: 0,
    labelPosition: "inside",
    maxMarkers: 18,
    minBarGap: 2,
    z: 34,
  },
  takuri: {
    markerId: "takuri-marker",
    legendName: "Takuri",
    shortLabel: "TK",
    color: "#14b8a6",
    borderColor: "#99f6e4",
    labelBackgroundColor: "#14b8a6",
    labelTextColor: brightText,
    showChartLabel: true,
    position: "below",
    symbol: "circle",
    symbolSize: 4,
    symbolOffset: belowOffset,
    symbolRotate: 0,
    labelPosition: "bottom",
    maxMarkers: 36,
    minBarGap: 1,
    z: 35,
  },
  hammer: {
    markerId: "hammer-marker",
    legendName: "Hammer",
    shortLabel: "H",
    color: "#22c55e",
    borderColor: "#bbf7d0",
    labelBackgroundColor: "#22c55e",
    labelTextColor: brightText,
    showChartLabel: true,
    position: "below",
    symbol: "circle",
    symbolSize: 4,
    symbolOffset: belowOffset,
    symbolRotate: 0,
    labelPosition: "bottom",
    maxMarkers: 36,
    minBarGap: 1,
    z: 35,
  },
  hangingMan: {
    markerId: "hanging-man-marker",
    legendName: "Hanging Man",
    shortLabel: "HM",
    color: "#f97316",
    borderColor: "#fed7aa",
    labelBackgroundColor: "#f97316",
    labelTextColor: brightText,
    showChartLabel: true,
    position: "above",
    symbol: "circle",
    symbolSize: 4,
    symbolOffset: aboveOffset,
    symbolRotate: 0,
    labelPosition: "top",
    maxMarkers: 36,
    minBarGap: 1,
    z: 35,
  },
  invertedHammer: {
    markerId: "inverted-hammer-marker",
    legendName: "Inverted Hammer",
    shortLabel: "IH",
    color: "#38bdf8",
    borderColor: "#bae6fd",
    labelBackgroundColor: "#38bdf8",
    labelTextColor: brightText,
    showChartLabel: true,
    position: "below",
    symbol: "circle",
    symbolSize: 4,
    symbolOffset: belowOffset,
    symbolRotate: 0,
    labelPosition: "bottom",
    maxMarkers: 36,
    minBarGap: 1,
    z: 35,
  },
  shootingStar: {
    markerId: "shooting-star-marker",
    legendName: "Shooting Star",
    shortLabel: "SS",
    color: "#f43f5e",
    borderColor: "#fecdd3",
    labelBackgroundColor: "#f43f5e",
    labelTextColor: lightText,
    showChartLabel: true,
    position: "above",
    symbol: "circle",
    symbolSize: 4,
    symbolOffset: aboveOffset,
    symbolRotate: 0,
    labelPosition: "top",
    maxMarkers: 36,
    minBarGap: 1,
    z: 35,
  },
  marubozuBull: {
    markerId: "marubozu-bull-outline",
    legendName: "Marubozu haussier",
    shortLabel: "MB+",
    color: "#16a34a",
    borderColor: "#bbf7d0",
    labelBackgroundColor: "#16a34a",
    labelTextColor: lightText,
    showChartLabel: true,
    position: "center",
    symbol: "rect",
    symbolSize: [14, 8],
    symbolOffset: centerOffset,
    symbolRotate: 0,
    labelPosition: "inside",
    maxMarkers: 36,
    minBarGap: 1,
    z: 34,
  },
  marubozuBear: {
    markerId: "marubozu-bear-outline",
    legendName: "Marubozu baissier",
    shortLabel: "MB-",
    color: "#dc2626",
    borderColor: "#fecaca",
    labelBackgroundColor: "#dc2626",
    labelTextColor: lightText,
    showChartLabel: true,
    position: "center",
    symbol: "rect",
    symbolSize: [14, 8],
    symbolOffset: centerOffset,
    symbolRotate: 0,
    labelPosition: "inside",
    maxMarkers: 36,
    minBarGap: 1,
    z: 34,
  },
  spinningTop: {
    markerId: "spinning-top-marker",
    legendName: "Spinning Top",
    shortLabel: "ST",
    chartLabel: "ST",
    color: "#facc15",
    opacity: 0.92,
    borderColor: "#facc15",
    labelBackgroundColor: "transparent",
    labelTextColor: "#818cf8",
    labelBorderColor: "transparent",
    labelBorderWidth: 0,
    labelBorderRadius: 0,
    labelPadding: 0,
    labelFontSize: 10,
    labelFontWeight: 500,
    labelLineHeight: 11,
    labelDistance: 2,
    verticalBandColor: "rgba(148, 163, 184, 0.10)",
    verticalBandWidthRatio: 0.62,
    verticalBandZ: 1,
    showChartLabel: true,
    position: "above",
    symbol: "path://M-5 -1.25 L-1.25 -1.25 L-1.25 -5 L1.25 -5 L1.25 -1.25 L5 -1.25 L5 1.25 L1.25 1.25 L1.25 5 L-1.25 5 L-1.25 1.25 L-5 1.25 Z",
    symbolSize: 5,
    symbolOffset: [0, -2],
    symbolRotate: 0,
    labelPosition: "top",
    maxMarkers: 72,
    minBarGap: 2,
    z: 36,
  },
  dragonflyDoji: {
    markerId: "dragonfly-doji-marker",
    legendName: "Dragonfly Doji",
    shortLabel: "DF",
    color: "#22c55e",
    borderColor: "#bbf7d0",
    labelBackgroundColor: "#22c55e",
    labelTextColor: brightText,
    showChartLabel: true,
    position: "below",
    symbol: "circle",
    symbolSize: 4,
    symbolOffset: belowOffset,
    symbolRotate: 0,
    labelPosition: "bottom",
    maxMarkers: 36,
    minBarGap: 1,
    z: 35,
  },
  gravestoneDoji: {
    markerId: "gravestone-doji-marker",
    legendName: "Gravestone Doji",
    shortLabel: "GS",
    color: "#f43f5e",
    borderColor: "#fecdd3",
    labelBackgroundColor: "#f43f5e",
    labelTextColor: lightText,
    showChartLabel: true,
    position: "above",
    symbol: "circle",
    symbolSize: 4,
    symbolOffset: aboveOffset,
    symbolRotate: 0,
    labelPosition: "top",
    maxMarkers: 36,
    minBarGap: 1,
    z: 35,
  },
  rickshawMan: {
    markerId: "rickshaw-man-marker",
    legendName: "Rickshaw Man",
    shortLabel: "R",
    color: "#c084fc",
    borderColor: "#e9d5ff",
    labelBackgroundColor: "#c084fc",
    labelTextColor: brightText,
    showChartLabel: true,
    position: "center",
    symbol: "diamond",
    symbolSize: 6,
    symbolOffset: centerOffset,
    symbolRotate: 0,
    labelPosition: "top",
    maxMarkers: 36,
    minBarGap: 1,
    z: 34,
  },
  longLeggedDoji: {
    markerId: "long-legged-doji-marker",
    legendName: "Long-legged Doji",
    shortLabel: "LL",
    color: "#fbbf24",
    borderColor: "#fde68a",
    labelBackgroundColor: "#fbbf24",
    labelTextColor: brightText,
    showChartLabel: true,
    position: "center",
    symbol: "diamond",
    symbolSize: 6,
    symbolOffset: centerOffset,
    symbolRotate: 0,
    labelPosition: "top",
    maxMarkers: 36,
    minBarGap: 1,
    z: 34,
  },
  doji: {
    markerId: "doji-marker",
    legendName: "Doji",
    color: "#cbd5e1",
    borderColor: "#e2e8f0",
    labelBackgroundColor: "#cbd5e1",
    labelTextColor: brightText,
    showChartLabel: true,
    position: "center",
    symbol: "circle",
    symbolSize: 5,
    symbolOffset: centerOffset,
    symbolRotate: 0,
    labelPosition: "inside",
    maxMarkers: 36,
    minBarGap: 1,
    z: 33,
  },
} satisfies Record<CandlestickPatternKey, CandlestickPatternPresentation>;

export const getCandlestickPatternPresentation = (
  pattern: CandlestickPatternKey,
): CandlestickPatternPresentation => CANDLESTICK_PATTERN_PRESENTATIONS[pattern];

export const buildCandlestickPatternSignalSummary = (
  items: readonly CandlestickPatternSignalSummary[],
  maxItems = 3,
): string | null => {
  const visibleItems = items.filter((item) => item.count > 0);
  if (visibleItems.length === 0) return null;

  const labels = visibleItems.slice(0, maxItems).map((item) => {
    const signalLabel = item.count > 1 ? `${item.count} signaux` : "1 signal";
    const prefix = item.shortLabel ? `${item.shortLabel} ` : "";
    return `${prefix}${item.legendName}: ${signalLabel}`;
  });
  const overflowCount = visibleItems.length - labels.length;

  return `Patterns chandeliers: ${labels.join(" · ")}${overflowCount > 0 ? ` · +${overflowCount}` : ""}`;
};
