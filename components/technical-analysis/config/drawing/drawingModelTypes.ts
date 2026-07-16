import type { AllToolType } from "./drawingToolTypes";
import type { BarPatternProps, DrawingPoint, DrawingStyle } from "./drawingPrimitiveTypes";

import type { DrawingAnchoredVWAPProps, DrawingAnchoredVolumeProfileProps, DrawingForecastProps } from "./drawingForecastTypes";
import type { DrawingFibCirclesProps, DrawingFibProps, DrawingFibSpeedResistanceArcsProps, DrawingFibSpiralProps, DrawingFibWedgeProps, DrawingPitchfanProps, DrawingTrendBasedFibTimeProps } from "./drawingFibonacciTypes";
import type { DrawingGannBoxProps, DrawingGannFanProps, DrawingGannSquareFixedProps, DrawingGannSquareProps } from "./drawingGannTypes";
import type { DrawingCyclesProps, DrawingXabcdProps } from "./drawingPatternTypes";
import type { DrawingPitchforkProps } from "./drawingPitchforkTypes";
import type { DrawingPositionProps, DrawingRegressionProps } from "./drawingPositionTypes";
import type { TableDrawingProps } from "./drawingTableTypes";
export interface Drawing {
  id: string;
  type: NonNullable<AllToolType>;
  points: DrawingPoint[];
  style: DrawingStyle;
  tpOffset?: number;
  slOffset?: number;
  positionProps?: DrawingPositionProps;
  locked?: boolean;
  hidden?: boolean;
  anchored?: boolean;
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
  regressionProps?: DrawingRegressionProps;
  pitchforkProps?: DrawingPitchforkProps;
  fibProps?: DrawingFibProps;
  trendBasedFibTimeProps?: DrawingTrendBasedFibTimeProps;
  fibCirclesProps?: DrawingFibCirclesProps;
  fibSpiralProps?: DrawingFibSpiralProps;
  fibSpeedResistanceArcsProps?: DrawingFibSpeedResistanceArcsProps;
  fibWedgeProps?: DrawingFibWedgeProps;
  pitchfanProps?: DrawingPitchfanProps;
  gannBoxProps?: DrawingGannBoxProps;
  gannSquareFixedProps?: DrawingGannSquareFixedProps;
  gannSquareProps?: DrawingGannSquareProps;
  gannFanProps?: DrawingGannFanProps;
  xabcdProps?: DrawingXabcdProps;
  cyclesProps?: DrawingCyclesProps;
  forecastProps?: DrawingForecastProps;
  anchoredVWAPProps?: DrawingAnchoredVWAPProps;
  anchoredVolumeProfileProps?: DrawingAnchoredVolumeProfileProps;
  barPatternProps?: BarPatternProps;
  tableProps?: TableDrawingProps;
  signpostProps?: DrawingSignpostProps;
  emojiPin?: DrawingEmojiPinProps;
  intervalVisibility?: DrawingIntervalVisibilityProps;
}

export type IntervalKind = "1m" | "5m" | "15m" | "1H" | "4H" | "1D" | "1W" | "1M";

export interface DrawingIntervalRange {
  from?: string | number;
  to?: string | number;
}

export interface DrawingIntervalVisibilityProps {
  enabled: boolean;
  perKind: Partial<Record<IntervalKind, boolean>>;
  ranges?: Partial<Record<IntervalKind, DrawingIntervalRange>>;
}

export interface DrawingEmojiPinProps {
  enabled: boolean;
  emoji: string;
  color: string;
  opacity: number;
}

export interface DrawingSignpostProps {
  /** Best-effort candle index at creation (kept for legacy/compat). */
  barIndex: number;
  /** Stable candle time/barTime — the real anchor used for rehydration. */
  barTime?: string | number;
  verticalPositionPct: number;
}
