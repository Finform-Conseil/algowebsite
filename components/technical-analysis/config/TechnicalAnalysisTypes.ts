// [TENOR 2026] Imports for caching
import { ChartDataPoint } from "../lib/Indicators/TechnicalIndicators";
import { BRVMSecurity } from "@/core/data/brvm-securities";

// ============================================================================
// CORE DRAWING TYPES
// ============================================================================
export type DisplaySecurity = Omit<BRVMSecurity, "currency"> & { currency: string };
export type DrawingToolType =
  | "line"
  | "horizontal_line"
  | "vertical_line"
  | "arrow"
  | "trend_angle"
  | "ray"
  | "x_line"
  | "horizontal_ray"
  | "polyline"
  | "path"
  | "curve"
  | "crosshair"
  | "arrow_marker"
  | "projection"
  | "date_range"
  | "price_range"
  | "date_price_range"
  | "long_position"
  | "short_position"
  | "parallel_channel"
  | "regression_trend"
  | "flat_top_bottom"
  | "disjoint_channel"
  | "pitchfork"
  | "schiff_pitchfork"
  | "modified_schiff_pitchfork"
  | "inside_pitchfork"
  | null;

export type ChartPatternToolType =
  | "xabcd_pattern"
  | "cypher_pattern"
  | "abcd_pattern"
  | "triangle_pattern"
  | "three_drives_pattern"
  | "head_and_shoulders"
  | null;

export type ElliottWaveToolType =
  | "elliott_impulse_wave"
  | "elliott_triangle_wave"
  | "elliott_triple_combo_wave"
  | "elliott_correction_wave"
  | "elliott_double_combo_wave"
  | null;

export type CyclesToolType =
  | "cyclic_lines"
  | "time_cycles"
  | "sine_line"
  | null;

export type BarPatternMode =
  | "HL Bars"
  | "OC Bars"
  | "Line - Open"
  | "Line - High"
  | "Line - Low"
  | "Line - Close"
  | "Line - HL/2";

export type FibonacciToolType =
  | "fib_retracement"
  | "trend_based_fib_extension"
  | "fib_channel"
  | "fib_time_zone"
  | "fib_speed_resistance_fan"
  | "trend_based_fib_time"
  | "fib_circles"
  | "fib_spiral"
  | "fib_speed_resistance_arcs"
  | "fib_wedge"
  | "pitchfan"
  | "gann_box"
  | "gann_square_fixed"
  | "gann_square"
  | "gann_fan"
  | null;

export type ForecastingToolType =
  | "long_position"
  | "short_position"
  | "position_forecast"
  | "bar_pattern"
  | "ghost_feed"
  | "anchored_vwap"
  | "sector"
  | "anchored_volume_profile"
  | null;

export type AllToolType =
  | DrawingToolType
  | FibonacciToolType
  | ChartPatternToolType
  | ElliottWaveToolType
  | CyclesToolType
  | ForecastingToolType;

export interface DrawingPoint {
  time: string | number;
  value: number;
}

export interface DrawingStyle {
  color: string;
  lineWidth: number;
  lineStyle: "solid" | "dashed" | "dotted";
  lineOpacity?: number;
  fillColor?: string;
  fillOpacity?: number;
  fillEnabled?: boolean;
  borderColor?: string;
  borderEnabled?: boolean;
}

export interface BarPatternProps {
  color: string;
  mode: BarPatternMode;
  mirrored: boolean;
  flipped: boolean;
  opacity?: number;
  initialPriceDiff?: number;
  avgHL?: number;
  variance?: number;
  logMode?: boolean;
  seed?: number;
  mintick?: number;
  data?: { o: number; c: number; l: number; h: number; relT: number; idx: number }[];
  // [TENOR 2026 HDR] High Fidelity Style Props
  bullColor?: string;
  bearColor?: string;
  showBorders?: boolean;
  bullBorderColor?: string;
  bearBorderColor?: string;
  showWicks?: boolean;
  wickColor?: string;
}

export interface Drawing {
  id: string;
  type: NonNullable<AllToolType>;
  points: DrawingPoint[];
  style: DrawingStyle;
  tpOffset?: number;
  slOffset?: number;
  positionProps?: {
    accountSize: number;
    riskPercent: number;
    riskAmount?: number;
    lotSize?: number;
    leverage?: number;
    entryPrice: number;
    tpPrice: number;
    tpTicks?: number;
    slPrice: number;
    slTicks?: number;
    riskDisplayMode?: "percent" | "amount";
    qtyPrecision?: number;
    qty?: number;
    pointValue?: number;
    ratio?: number;
    rewardAmount?: number;
    tpColor?: string;
    tpOpacity?: number;
    slColor?: string;
    slOpacity?: number;
    lineColor?: string;
    lineOpacity?: number;
    width?: number;
  };
  locked?: boolean;
  hidden?: boolean;
  isDragging?: boolean;
  isCreating?: boolean;
  _boxOffset?: number; // [TENOR 2026] UI offset for multi-tool reconciliation
  groupId?: string; // [TENOR 2026] Folder/Group support for Object Tree

  text?: string;
  showText?: boolean;
  textColor?: string;
  fontSize?: number;
  textBold?: boolean;
  textItalic?: boolean;
  textOrientation?: "horizontal" | "vertical" | "aligned";
  textAlignmentHorizontal?: "left" | "center" | "right";
  textAlignmentVertical?: "top" | "middle" | "bottom";
  arrowOrientation?: "top" | "bottom" | "left" | "right";
  extendLeft?: boolean;
  extendRight?: boolean;
  showMiddleLine?: boolean;
  regressionProps?: {
    useUpperDev: boolean;
    upperDev: number;
    useLowerDev: boolean;
    lowerDev: number;
    source: "open" | "high" | "low" | "close" | "hl2" | "hlc3" | "ohlc4" | "hlcc4";
    showBaseLine: boolean;
    baseColor: string;
    baseLineWidth: number;
    baseLineStyle: "solid" | "dashed" | "dotted";
    showUpLine: boolean;
    upColor: string;
    upLineWidth: number;
    upLineStyle: "solid" | "dashed" | "dotted";
    showDownLine: boolean;
    downColor: string;
    downLineWidth: number;
    downLineStyle: "solid" | "dashed" | "dotted";
    fillBackground: boolean;
    upFillColor: string;
    downFillColor: string;
    extendLines: boolean;
    showPearsonsR: boolean;
  };
  pitchforkProps?: {
    style: "original" | "schiff" | "modified_schiff" | "inside";
    extendLines: boolean;
    fillBackground: boolean;
    fillOpacity?: number;
    levels: {
      value: number;
      color: string;
      enabled: boolean;
      lineOpacity: number;
      fillOpacity: number;
      lineStyle: "solid" | "dashed" | "dotted";
      lineWidth: number;
      fillColor?: string;
    }[];
    useOneColor?: boolean;
    oneColor?: string;
  };
  fibProps?: {
    reverse: boolean;
    fillBackground: boolean;
    fillOpacity?: number;
    levels: {
      value: number;
      color: string;
      enabled: boolean;
      lineOpacity: number;
      fillOpacity: number;
      lineStyle: "solid" | "dashed" | "dotted";
      lineWidth: number;
    }[];
    showPrices: boolean;
    showLevels: boolean;
    labelsPosition: "left" | "right";
    oneColor?: string;
    useOneColor?: boolean;
    extendLines?: "none" | "left" | "right" | "both";
    trendLine?: {
      enabled: boolean;
      color: string;
      lineStyle: "solid" | "dashed" | "dotted";
      lineWidth: number;
      lineOpacity?: number;
    };
    fanProps?: {
      reverse: boolean;
      fillBackground: boolean;
      fillOpacity?: number;
      extendLines?: "none" | "left" | "right" | "both";
      priceLevels: {
        value: number;
        color: string;
        enabled: boolean;
        lineOpacity?: number;
      }[];
      timeLevels: {
        value: number;
        color: string;
        enabled: boolean;
        lineOpacity?: number;
      }[];
      showPriceLabels: { left: boolean; right: boolean };
      showTimeLabels: { top: boolean; bottom: boolean };
      useOneColor?: boolean;
      oneColor?: string;
      gridEnabled?: boolean;
      gridStyle?: "solid" | "dashed" | "dotted";
    };
  };
  trendBasedFibTimeProps?: {
    levels: {
      value: number;
      color: string;
      enabled: boolean;
      lineOpacity: number;
      lineStyle: "solid" | "dashed" | "dotted";
      lineWidth: number;
    }[];
    trendLine: {
      enabled: boolean;
      color: string;
      lineStyle: "solid" | "dashed" | "dotted";
      lineWidth: number;
      lineOpacity?: number;
    };
    extensionLine: {
      enabled: boolean;
      color: string;
      lineStyle: "solid" | "dashed" | "dotted";
      lineWidth: number;
      lineOpacity?: number;
    };
    labelsPosition: "top" | "bottom" | "middle";
    labelsHorizontalPosition: "left" | "center" | "right";
    fillBackground: boolean;
    fillOpacity: number;
    showPrices: boolean;
    showLevels: boolean;
    useOneColor?: boolean;
    oneColor?: string;
  };
  fibCirclesProps?: {
    levels: {
      value: number;
      color: string;
      enabled: boolean;
      lineOpacity: number;
      fillOpacity: number;
      lineStyle: "solid" | "dashed" | "dotted";
      lineWidth: number;
    }[];
    trendLine: {
      enabled: boolean;
      color: string;
      lineStyle: "solid" | "dashed" | "dotted";
      lineWidth: number;
      lineOpacity?: number;
    };
    useOneColor?: boolean;
    oneColor?: string;
    background: {
      enabled: boolean;
      fillOpacity: number;
    };
    showLabels: boolean;
  };
  fibSpiralProps?: {
    reverse: boolean;
    useOneColor?: boolean;
    oneColor?: string;
    levels: {
      value: number;
      color: string;
      enabled: boolean;
      lineOpacity: number;
      lineStyle: "solid" | "dashed" | "dotted";
      lineWidth: number;
    }[];
    trendLine: {
      enabled: boolean;
      color: string;
      lineStyle: "solid" | "dashed" | "dotted";
      lineWidth: number;
      lineOpacity?: number;
    };
    background?: {
      enabled: boolean;
      fillOpacity: number;
    };
    showLabels: boolean;
    counterclockwise: boolean;
  };
  fibSpeedResistanceArcsProps?: {
    levels: {
      value: number;
      color: string;
      enabled: boolean;
      lineOpacity: number;
      lineStyle: "solid" | "dashed" | "dotted";
      lineWidth: number;
    }[];
    trendLine: {
      enabled: boolean;
      color: string;
      lineStyle: "solid" | "dashed" | "dotted";
      lineWidth: number;
      lineOpacity?: number;
    };
    background: {
      enabled: boolean;
      fillOpacity: number;
    };
    fullCircles: boolean;
    showLabels: boolean;
  };
  fibWedgeProps?: {
    levels: {
      value: number;
      color: string;
      enabled: boolean;
      lineOpacity: number;
      fillOpacity: number;
      lineStyle: "solid" | "dashed" | "dotted";
      lineWidth: number;
    }[];
    trendLine: {
      enabled: boolean;
      color: string;
      lineStyle: "solid" | "dashed" | "dotted";
      lineWidth: number;
      lineOpacity?: number;
    };
    background: {
      enabled: boolean;
      fillOpacity: number;
    };
    useOneColor?: boolean;
    oneColor?: string;
    showLabels: boolean;
  };
  pitchfanProps?: {
    levels: {
      t: number;
      color: string;
      lineWidth: number;
      lineStyle: "solid" | "dashed" | "dotted";
      lineOpacity: number;
      enabled: boolean;
    }[];
    fillBackground: boolean;
    fillOpacity: number;
    useOneColor?: boolean;
    oneColor?: string;
    showTrendLine?: boolean;
    trendLine?: {
      enabled: boolean;
      color: string;
      lineStyle: "solid" | "dashed" | "dotted";
      lineWidth: number;
    };
  };
  gannBoxProps?: {
    reverse: boolean;
    useOneColor?: boolean;
    oneColor?: string;
    showAngles?: boolean;
    showLabels: { left: boolean; right: boolean; top: boolean; bottom: boolean };
    priceLevels: {
      value: number;
      color: string;
      enabled: boolean;
      lineOpacity: number;
      lineStyle: "solid" | "dashed" | "dotted";
      lineWidth: number;
    }[];
    timeLevels: {
      value: number;
      color: string;
      enabled: boolean;
      lineOpacity: number;
      lineStyle: "solid" | "dashed" | "dotted";
      lineWidth: number;
    }[];
    priceBackground?: { enabled: boolean; fillOpacity: number };
    timeBackground?: { enabled: boolean; fillOpacity: number };
  };
  gannSquareFixedProps?: {
    reverse: boolean;
    levels: {
      id: number;
      label: string;
      color: string;
      lineWidth: number;
      lineStyle: "solid" | "dashed" | "dotted";
      lineOpacity: number;
      enabled: boolean;
    }[];
    fans: {
      ratio: string;
      label: string;
      color: string;
      lineWidth: number;
      lineStyle: "solid" | "dashed" | "dotted";
      lineOpacity: number;
      enabled: boolean;
    }[];
    arcs: {
      ratio: string;
      label: string;
      color: string;
      lineWidth: number;
      lineStyle: "solid" | "dashed" | "dotted";
      lineOpacity: number;
      enabled: boolean;
    }[];
    background: { enabled: boolean; color: string; opacity: number };
    showFans: boolean;
    showGrid: boolean;
    showArcs: boolean;
    showLabels: boolean;
    priceBarRatio: number;
    lockRatio: boolean;
  };
  gannSquareProps?: {
    color: string;
    showAngles: boolean;
    showFans: boolean;
    showArcs: boolean;
    showGrid: boolean;
    showLabels: boolean;
    fillBackground: boolean;
    fillOpacity: number;
    mosaicFill: boolean;
    useOneColor: boolean;
    oneColor: string;
    reverse: boolean;
    priceBarRatio: number;
    fans: {
      ratio: string;
      label: string;
      color: string;
      enabled: boolean;
      lineOpacity?: number;
      lineWidth?: number;
      lineStyle?: "solid" | "dashed" | "dotted";
    }[];
    arcs: {
      ratio: string;
      label: string;
      color: string;
      enabled: boolean;
      lineOpacity?: number;
      lineWidth?: number;
      lineStyle?: "solid" | "dashed" | "dotted";
    }[];
    levels: {
      value: number;
      label: string;
      color: string;
      enabled: boolean;
      lineOpacity?: number;
      lineWidth?: number;
      lineStyle?: "solid" | "dashed" | "dotted";
    }[];
  };
  gannFanProps?: {
    reverse: boolean;
    showLabels: boolean;
    fillBackground: boolean;
    lines: {
      ratio: string;
      numerator: number;
      denominator: number;
      color: string;
      enabled: boolean;
      lineOpacity: number;
      lineWidth: number;
      lineStyle: "solid" | "dashed" | "dotted";
      fillColor: string;
      fillOpacity: number;
    }[];
  };
  xabcdProps?: {
    showLabels: boolean;
    showRatios: boolean;
    fillBackground: boolean;
    fillOpacity: number;
  };
  cyclesProps?: {
    fillBackground: boolean;
    fillOpacity: number;
    levels: {
      id: number;
      color: string;
      enabled: boolean;
      opacity: number;
    }[];
    showLabels: boolean;
  };
  forecastProps?: {
    showSourceText?: boolean;
    sourceTextColor?: string;
    sourceBackgroundColor?: string;
    sourceBorderColor?: string;
    showTargetText?: boolean;
    targetTextColor?: string;
    targetBackgroundColor?: string;
    targetBorderColor?: string;
    showSuccessText?: boolean;
    successTextColor?: string;
    successBackgroundColor?: string;
    showFailureText?: boolean;
    failureTextColor?: string;
    failureBackgroundColor?: string;
  };
  anchoredVWAPProps?: {
    source: "open" | "high" | "low" | "close" | "hl2" | "hlc3" | "ohlc4" | "hlcc4";
    calculateStDev: boolean;
    fillBackground: boolean;
    transparency: number;
    levels: {
      multiplier: number;
      color: string;
      enabled: boolean;
      lineOpacity: number;
      fillOpacity: number;
      lineStyle: "solid" | "dashed" | "dotted";
      lineWidth: number;
    }[];
  };
  anchoredVolumeProfileProps?: {
    layout: "Number of Rows" | "Ticks Per Row";
    rowSize: number;
    volume: "Up/Down" | "Total" | "Delta";
    valueAreaVolume: number;
    upColor: string;
    downColor: string;
    vaUpColor: string;
    vaDownColor: string;
    pocColor: string;
    width: number;
    placement: "Left" | "Right";
    showLabels: boolean;
    extendLeft?: boolean;
    extendRight?: boolean;
    showPOC?: boolean;
    showValueArea?: boolean;
  };
  barPatternProps?: BarPatternProps;
}

// ============================================================================
// HIT-TEST & RENDERING HELPERS
// ============================================================================
export interface HitTestResult {
  isHit: boolean;
  hitType: "point" | "shape" | "zone_tp" | "zone_sl" | "width_resize" | null;
  pointIndex?: number;
}

export interface DrawingHelpers {
  drawSegment(p1: { x: number; y: number }, p2: { x: number; y: number }): void;
  drawHandle(p: { x: number; y: number }, color?: string, radius?: number, shape?: 'circle' | 'square'): void;
  drawTextOnLine(p1: { x: number; y: number }, p2: { x: number; y: number }, drawing: Drawing): void;
  applyStyle(style: DrawingStyle, isPreview: boolean): void;
  applyLineDash(lineStyle: "solid" | "dashed" | "dotted", lineWidth: number): void;
  ctx: CanvasRenderingContext2D;
  logicalWidth: number;
  logicalHeight: number;
}

// ============================================================================
// CHART CORE TYPES
// ============================================================================

// ============================================================================
// MARKET SNAPSHOT TYPES
// ============================================================================
export interface LiveSnapshot {
  symbol: string;
  price: number;
  variation: string; // e.g., "+0,19%"
  prevClose: number;
  open: number;
  high: number;
  low: number;
  volume?: number; // [TENOR 2026] Added volume support
  marketCap?: number; // [TENOR 2026] Live Capitalisation (Globale)
  sharesCount?: number; // [TENOR 2026] Nombre de titres réel
  peRatio?: number; // [TENOR 2026] Ratio dynamique
  returnYTD?: number; // [TENOR 2026] Performance annuelle réelle
  lastUpdate: string;
}

export interface ChartState {
  symbol: string;
  timeframe: string;
  chartType: "candlestick" | "line";
  indicators: {
    sma: boolean;
    ema: boolean;
    volume: boolean;
    activeSma: number[];
    activeEma: number[];
  };
}

export interface Alert {
  id: string;
  symbol: string;
  condition: "GREATER_THAN" | "LESS_THAN";
  value: number;
  active: boolean;
}

export interface AdvancedIndicatorsState {
  rsi: boolean;
  macd: boolean;
  bollinger: boolean;
  stochastic: boolean;
  atr: boolean;
  cci: boolean;
  // [TENOR 2026 FEAT] New indicators
  williamsR: boolean;
  roc: boolean;
  obv: boolean;
}

// ============================================================================
// TOOLBAR & CONFIG TYPES
// ============================================================================
export interface ToolbarButtonDefinition {
  icon: string;
  iconLocked?: string;
  title: string;
  action: string;
}

export interface ToolbarDrawingConfig {
  toolbar: string[];
  description?: string;
}

export interface ToolbarConfig {
  version: string;
  description: string;
  drawings: Record<string, ToolbarDrawingConfig>;
  button_definitions: Record<string, ToolbarButtonDefinition>;
}

export type GridOption = {
  left?: string | number;
  right?: string | number;
  top?: string | number;
  height?: string | number;
  bottom?: string | number;
  containLabel?: boolean;
};

export type XAxisOption = Record<string, unknown>;
export type YAxisOption = Record<string, unknown>;
export type SeriesOption = Record<string, unknown>;

// ============================================================================
// PERSISTENCE TYPES
// ============================================================================
export interface SavedAnalysisIndicators {
  sma: boolean;
  ema: boolean;
  volume: boolean;
  activeSma?: number[];
  activeEma?: number[];
}

export interface SavedAnalysisAdvancedIndicators {
  rsi: boolean;
  macd: boolean;
  bollinger: boolean;
  stochastic: boolean;
  atr: boolean;
  cci: boolean;
  williamsR?: boolean;
  roc?: boolean;
  obv?: boolean;
}

export interface SavedAnalysis {
  id: string;
  name: string;
  config: {
    symbol: string;
    timeframe: string;
    chartType: string;
    indicators: SavedAnalysisIndicators;
    advancedIndicators: SavedAnalysisAdvancedIndicators;
    timeRange?: string;
    savedAt: string;
  };
}

// ============================================================================
// GLOBAL CONFIG TYPES
// ============================================================================
// [TENOR 2026] Added "eraser" to resolve TS2367 in VerticalDrawingToolbar
export type CursorModeType =
  | "cross"
  | "dot"
  | "arrow"
  | "demonstration"
  | "magic"
  | "eraser"
  | "arrow-tooltip"
  | "cross-tooltip";

export interface IndicatorPeriods {
  sma1: number;
  sma2: number;
  sma3: number;
  rsiPeriod: number;
  [key: string]: number;
}

export interface ChartAppearance {
  showGrid: boolean;
  upColor: string;
  downColor: string;
  backgroundColor: string;
  showVolume: boolean;
}

export interface UiState {
  isZenMode: boolean;
  isAnonyme: boolean;
  selectedPseudo: string;
  cursorMode: CursorModeType;
  selectedTimeRange: string;
  isPublishing: boolean;
  isCapturing: boolean;
  dataMode: "mock" | "real";
  // [TENOR 2026] Officially typed modals:
  modals: {
    search: boolean;
    indicators: boolean;
    replay: boolean;
    templates: boolean;
    settings: boolean;
    options: boolean;
    datePicker: boolean;
    loadAnalysis: boolean;
    alerts: boolean;
    drawingSettings: boolean;
  };
  replay: {
    isActive: boolean;
    isPaused: boolean;
    speed: number;
  };
  isLockedAll: boolean;
  areDrawingsHidden: boolean;
}

export interface TechnicalAnalysisState {
  chartConfig: ChartState;
  advancedIndicators: AdvancedIndicatorsState;
  indicatorPeriods: IndicatorPeriods;
  chartAppearance: ChartAppearance;
  ui: UiState;
  alerts: Alert[];
  marketData: Record<string, ChartDataPoint[]>; // [TENOR 2026] Root level cache
  marketSnapshots: Record<string, LiveSnapshot>; // [TENOR 2026] Live technical data (from indicator.csv)
}

// ============================================================================
// [TENOR 2026 FEAT] OBJECT TREE & DATA WINDOW TYPES
// ============================================================================

export type ObjectTreePanelTab = "object_tree" | "data_window";

/** Valeurs OHLCV + Change affichées dans le Data Window au survol du curseur */
export interface DataWindowCandleValues {
  date: string;       // ex: "Mon 18 Jan '26"
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change: number;     // close - open
  isUp: boolean;      // close >= open
}

// --- EOF ---