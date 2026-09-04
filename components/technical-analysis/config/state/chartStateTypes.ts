import type { ChartType } from "../../lib/chart-types";

export interface ChartState {
  symbol: string;
  timeframe: string;
  chartType: ChartType;
  indicators: {
    sma: boolean;
    ema: boolean;
    /** Study attachment. false means Volume is removed from the chart. */
    volume: boolean;
    /** Study-level visibility. false means hidden while attachment/settings remain intact. */
    volumeVisible: boolean;
    activeSma: number[];
    activeEma: number[];
    activeWma: number[];
    activeDema: number[];
    activeTema: number[];
    activeHma: number[];
    activeZlema: number[];
    activeAlma: number[];
    activeSmma: number[];
    activeKama: number[];
    activeVwma: number[];
  };
}

export type VolumeColorMode = "candle-body" | "session-change";
export type ChartGridLineStyle = "solid" | "dashed" | "dotted";
export type ChartBackgroundMode = "solid" | "gradient";
export type ChartWatermarkMode = "replay" | "symbol" | "none";
export type PriceScaleMode = "regular" | "percent" | "indexed-to-100" | "logarithmic";
export type PriceScalePosition = "left" | "right";

export interface ChartAppearance {
  showGrid: boolean;
  verticalGridLines: boolean;
  horizontalGridLines: boolean;
  verticalGridLineStyle: ChartGridLineStyle;
  horizontalGridLineStyle: ChartGridLineStyle;
  /** Legacy common color kept for backward-compatible persisted snapshots. */
  gridLineColor: string;
  verticalGridLineColor: string;
  horizontalGridLineColor: string;
  verticalGridLineOpacity: number;
  horizontalGridLineOpacity: number;
  crosshairColor: string;
  watermarkMode: ChartWatermarkMode;
  watermarkColor: string;
  scaleTextColor: string;
  scaleTextSize: number;
  scaleLineColor: string;
  /** Price-scale runtime mode. Optional for backward-compatible persisted layouts. */
  priceScaleMode?: PriceScaleMode;
  /** Main price-scale side. TradingView defaults to the right. */
  priceScalePosition?: PriceScalePosition;
  /** Mirrors the main price coordinates vertically without mutating source data. */
  priceScaleInverted?: boolean;
  /** Master visibility of numeric labels on the main price scale. */
  showPriceScaleLabels?: boolean;
  /** Master visibility of horizontal price-scale grid lines. */
  showPriceScaleLines?: boolean;
  /** Visibility of the contextual + button beside the cursor price badge. */
  showPriceScalePlusButton?: boolean;
  marginTopPercent: number;
  marginBottomPercent: number;
  rightOffsetBars: number;
  upColor: string;
  downColor: string;
  backgroundMode: ChartBackgroundMode;
  backgroundColor: string;
  backgroundGradientTopColor: string;
  backgroundGradientBottomColor: string;
  showVolume: boolean;
  volumeColorMode: VolumeColorMode;
  statusLine: {
    showChange: boolean;
    showChangePercent: boolean;
    showLast: boolean;
    showLogo: boolean;
    showName: boolean;
    showSymbol: boolean;
    showVolume: boolean;
  };
}
