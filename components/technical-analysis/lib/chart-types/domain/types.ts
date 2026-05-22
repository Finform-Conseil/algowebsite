export const CHART_TYPE_VALUES = [
  "bars",
  "candles",
  "hollow_candles",
  "volume_candles",
  "line",
  "line_with_markers",
  "step_line",
  "area",
  "hlc_area",
  "baseline",
  "columns",
  "high_low",
  "volume_footprint",
  "time_price_opportunity",
  "session_volume_profile",
  "heikin_ashi",
  "renko",
  "line_break",
  "kagi",
  "point_and_figure",
  "range",
] as const;

export type ChartType = typeof CHART_TYPE_VALUES[number];
export type LegacyChartType = "candlestick";
export type AnyChartType = ChartType | LegacyChartType;

export type PriceSource = "open" | "high" | "low" | "close" | "hl2" | "hlc3" | "ohlc4";
export type ChartRequirement = "ohlc" | "volume" | "intrabar" | "ticks";
export type ChartWarningSeverity = "info" | "warning" | "error";

export interface RawBar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number | null;
}

export type IntrabarBar = RawBar;

export interface TradeTick {
  time: number;
  price: number;
  volume: number;
  side?: "buy" | "sell" | "unknown";
}

export interface SymbolMeta {
  symbol: string;
  exchange: "BRVM" | "NGX" | "GSE" | "NSE" | "JSE" | "CSE" | string;
  tickSize: number;
  pricePrecision: number;
  timezone: string;
  session?: {
    open: string;
    close: string;
    days: number[];
  };
}

export interface SourceMapEntry {
  sourceStartIndex: number;
  sourceEndIndex: number;
  sourceIndices: number[];
}

export interface ChartWarning {
  code: string;
  severity: ChartWarningSeverity;
  message: string;
}

export interface NormalizedRawBar extends RawBar {
  sourceIndex: number;
}

export interface OhlcBar extends RawBar {
  sourceMap: SourceMapEntry;
  synthetic: boolean;
}

export interface LinePoint {
  time: number;
  value: number;
  sourceMap: SourceMapEntry;
}

export interface ColumnsPoint extends LinePoint {
  direction: 1 | -1;
}

export interface HighLowItem {
  time: number;
  high: number;
  low: number;
  sourceMap: SourceMapEntry;
}

export interface VolumeCandle extends OhlcBar {
  volumeWidthRatio: number;
}

export interface VolumeProfileRow {
  priceLow: number;
  priceHigh: number;
  upVolume: number;
  downVolume: number;
  totalVolume: number;
  delta: number;
  isPoc: boolean;
  isValueArea: boolean;
}

export interface VolumeProfile {
  sessionStart: number;
  sessionEnd: number;
  rows: VolumeProfileRow[];
  pocPrice: number;
  vah: number;
  val: number;
  profileHigh: number;
  profileLow: number;
  totalVolume: number;
  sourceMap: SourceMapEntry;
}

export interface FootprintLevel {
  priceLow: number;
  priceHigh: number;
  buyVolume: number;
  sellVolume: number;
  totalVolume: number;
  delta: number;
  isPoc: boolean;
  isValueArea: boolean;
  buyImbalance: boolean;
  sellImbalance: boolean;
}

export interface FootprintCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  levels: FootprintLevel[];
  delta: number;
  deltaPct: number;
  sourceMap: SourceMapEntry;
}

export interface TpoRow {
  priceLow: number;
  priceHigh: number;
  letters: string[];
  blockCount: number;
  isPoc: boolean;
  isValueArea: boolean;
}

export interface TpoProfile {
  sessionStart: number;
  sessionEnd: number;
  rows: TpoRow[];
  pocPrice: number;
  vah: number;
  val: number;
  sourceMap: SourceMapEntry;
}

export interface KagiSegment {
  fromTime: number;
  toTime: number;
  fromPrice: number;
  toPrice: number;
  direction: "up" | "down" | "horizontal";
  thickness: "yin" | "yang";
  sourceMap: SourceMapEntry;
}

export interface PointFigureColumn {
  kind: "x" | "o";
  boxes: number[];
  sourceMap: SourceMapEntry;
}

export interface ChartTransformBase {
  synthetic: boolean;
  warnings: ChartWarning[];
}

export type ChartTransformResult =
  | (ChartTransformBase & { kind: "ohlc"; bars: OhlcBar[] })
  | (ChartTransformBase & { kind: "line"; points: LinePoint[] })
  | (ChartTransformBase & { kind: "columns"; points: ColumnsPoint[] })
  | (ChartTransformBase & { kind: "high_low"; items: HighLowItem[] })
  | (ChartTransformBase & { kind: "volume_candles"; bars: VolumeCandle[] })
  | (ChartTransformBase & { kind: "custom"; items: unknown[] })
  | (ChartTransformBase & { kind: "profile"; profiles: VolumeProfile[]; bars: OhlcBar[]; approximate: boolean })
  | (ChartTransformBase & { kind: "footprint"; candles: FootprintCandle[]; approximate: boolean })
  | (ChartTransformBase & { kind: "tpo"; profiles: TpoProfile[]; approximate: boolean });

export interface ChartTransformInput {
  bars: NormalizedRawBar[];
  intrabars?: IntrabarBar[];
  ticks?: TradeTick[];
  symbolMeta?: Partial<SymbolMeta>;
  priceSource?: PriceSource;
  visibleStartIndex?: number;
  visibleEndIndex?: number;
}

export const isChartType = (value: unknown): value is ChartType =>
  typeof value === "string" && (CHART_TYPE_VALUES as readonly string[]).includes(value);

export const normalizeChartType = (value: unknown): ChartType => {
  if (value === "candlestick") return "candles";
  return isChartType(value) ? value : "candles";
};

export const makeSourceMap = (sourceIndices: number[]): SourceMapEntry => {
  if (sourceIndices.length === 0) {
    return { sourceStartIndex: -1, sourceEndIndex: -1, sourceIndices: [] };
  }

  return {
    sourceStartIndex: Math.min(...sourceIndices),
    sourceEndIndex: Math.max(...sourceIndices),
    sourceIndices,
  };
};
