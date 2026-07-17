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
  _boxOffset?: number;
  groupId?: string;
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
  flagMarkProps?: DrawingFlagMarkProps;
  imageNoteProps?: DrawingImageNoteProps;
}

export interface DrawingImageNoteProps {
  /** Stable reference to the binary asset stored in the dedicated IndexedDB asset store. */
  assetId: string;
  /** MIME type of the stored blob (image/jpeg | image/png | image/webp). */
  mimeType: string;
  /** Natural pixel dimensions of the source image. */
  naturalWidth: number;
  naturalHeight: number;
  /** Rendered CSS pixel dimensions (preserve natural ratio, never upscaled). */
  cssWidth: number;
  cssHeight: number;
  /** 0 = opaque, 100 = fully transparent. Mirrors TradingView Transparency control. */
  transparency: number;
  /** Original file name, useful for replacement / diagnostics. Optional. */
  originalFileName?: string;
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
  barIndex: number;
  barTime?: string | number;
  verticalPositionPct: number;
}

export interface DrawingFlagMarkProps {
  flagColor: string;
}
