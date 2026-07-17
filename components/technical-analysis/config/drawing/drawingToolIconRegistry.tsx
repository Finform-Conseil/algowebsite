import React from "react";

import type { AllToolType } from "./drawingToolTypes";
import type { DrawingToolId } from "./drawingToolSpecs";
import {
    FibChannelIcon,
    FibCirclesIcon,
    FibExtensionIcon,
    FibRetracementIcon,
    FibSpeedArcsIcon,
    FibSpeedFanIcon,
    FibSpiralIcon,
    FibTimeIcon,
    FibTimeZoneIcon,
    FibWedgeIcon,
    GannBoxIcon,
    GannFanIcon,
    GannSquareFixedIcon,
    GannSquareIcon,
    InsidePitchforkIcon,
    ModifiedSchiffPitchforkIcon,
    PitchfanIcon,
    PitchforkIcon,
    SchiffPitchforkIcon,
} from "../../components/common/icons/drawing/fibonacci";
import {
    AnchoredVolumeProfileIcon,
    AnchoredVWAPIcon,
    FixedRangeVolumeProfileIcon,
    ForecastingBarPatternIcon,
    ForecastingForecastIcon,
    ForecastingGhostFeedIcon,
    ForecastingLongIcon,
    ForecastingSectorIcon,
    ForecastingShortIcon,
} from "../../components/common/icons/drawing/forecasting";
import {
    ABCDPatternIcon,
    CyclicLinesIcon,
    CypherPatternIcon,
    ElliottCorrectionIcon,
    ElliottDoubleComboIcon,
    ElliottImpulseIcon,
    ElliottTriangleIcon,
    ElliottTripleComboIcon,
    HeadAndShouldersIcon,
    SineLineIcon,
    ThreeDrivesPatternIcon,
    TimeCyclesIcon,
    TrianglePatternIcon,
    XABCDPatternIcon,
} from "../../components/common/icons/drawing/patterns";
import {
    ArcIcon,
    ArrowIcon,
    ArrowMarkerIcon,
    BrushIcon,
    CalloutIcon,
    CircleIcon,
    CommentIcon,
    CrosshairIcon,
    CurveIcon,
    DoubleCurveIcon,
    DatePriceRangeIcon,
    DateRangeIcon,
    DisjointChannelIcon,
    EllipseIcon,
    ExtendedLineIcon,
    FlagMarkIcon,
    FlatTopBottomIcon,
    HighlighterIcon,
    HorizontalLineIcon,
    HorizontalRayIcon,
    IdeaIcon,
    ImageNoteIcon,
    LineIcon,
    NoteIcon,
    ParallelChannelIcon,
    PathIcon,
    PinIcon,
    PolylineIcon,
    PostIcon,
    PriceLabelIcon,
    PriceNoteIcon,
    PriceRangeIcon,
    ProjectionIcon,
    RayIcon,
    RegressionTrendIcon,
    SignpostIcon,
    TableIcon,
    TextNoteIcon,
    TrendAngleIcon,
    TriangleIcon,
    VerticalLineIcon,
} from "../../components/common/icons/drawing/trend";

const ArrowMarkUpIcon: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 28 28"
    width="16"
    height="16"
    style={style}
  >
    <path
      fill="currentColor"
      fillRule="nonzero"
      d="M11 16v6h6v-6h4.865l-7.865-9.438-7.865 9.438h4.865zm7 7h-8v-6h-6l10-12 10 12h-6v6z"
    />
  </svg>
);

const ArrowMarkDownIcon: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 28 28"
    width="16"
    height="16"
    style={style}
  >
    <path
      fill="currentColor"
      fillRule="nonzero"
      d="M17 12v-6h-6v6h-4.865l7.865 9.438 7.865-9.438h-4.865zm-7-7h8v6h6l-10 12-10-12h6v-6z"
    />
  </svg>
);

const RectangleIcon: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 28 28"
    width="16"
    height="16"
    style={style}
  >
    <rect x="4" y="6" width="20" height="16" rx="1" fill="none" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const RotatedRectangleIcon: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 28 28"
    width="28"
    height="28"
    style={style}
  >
    <g fill="currentColor" fillRule="nonzero">
      <path d="M14.743 3.55l-4.208 4.208.707.707 4.208-4.208zM7.71 10.583l-4.187 4.187.707.707 4.187-4.187zM3.536 18.244l6.171 6.171.707-.707-6.171-6.171zM13.232 24.475l4.22-4.22-.707-.707-4.22 4.22zM20.214 17.494l4.217-4.217-.707-.707-4.217 4.217zM24.423 9.716l-6.218-6.218-.707.707 6.218 6.218z" />
      <path d="M2.5 18c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM9.5 11c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM16.5 4c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM11.5 27c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM18.5 20c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM25.5 13c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z" />
    </g>
  </svg>
);

export const DRAWING_TOOL_ICON_REGISTRY: Partial<Record<DrawingToolId, React.ReactNode>> = {
  line: <LineIcon />,
  horizontal_line: <HorizontalLineIcon />,
  vertical_line: <VerticalLineIcon />,
  arrow: <ArrowIcon />,
  trend_angle: <TrendAngleIcon />,
  ray: <RayIcon />,
  x_line: <ExtendedLineIcon />,
  horizontal_ray: <HorizontalRayIcon />,
  polyline: <PolylineIcon />,
  path: <PathIcon />,
  circle: <CircleIcon />,
  ellipse: <EllipseIcon />,
  curve: <CurveIcon />,
  crosshair: <CrosshairIcon />,
  arrow_marker: <ArrowMarkerIcon />,
  arrow_mark_up: <ArrowMarkUpIcon />,
  arrow_mark_down: <ArrowMarkDownIcon />,
  projection: <ProjectionIcon />,
  date_range: <DateRangeIcon />,
  price_range: <PriceRangeIcon />,
  date_price_range: <DatePriceRangeIcon />,
  parallel_channel: <ParallelChannelIcon />,
  regression_trend: <RegressionTrendIcon />,
  disjoint_channel: <DisjointChannelIcon />,
  flat_top_bottom: <FlatTopBottomIcon />,
  fib_retracement: <FibRetracementIcon />,
  trend_based_fib_extension: <FibExtensionIcon />,
  fib_channel: <FibChannelIcon />,
  fib_time_zone: <FibTimeZoneIcon />,
  fib_speed_resistance_fan: <FibSpeedFanIcon />,
  trend_based_fib_time: <FibTimeIcon />,
  fib_circles: <FibCirclesIcon />,
  fib_spiral: <FibSpiralIcon />,
  fib_speed_resistance_arcs: <FibSpeedArcsIcon />,
  fib_wedge: <FibWedgeIcon />,
  pitchfan: <PitchfanIcon />,
  gann_box: <GannBoxIcon />,
  gann_square_fixed: <GannSquareFixedIcon />,
  gann_square: <GannSquareIcon />,
  gann_fan: <GannFanIcon />,
  pitchfork: <PitchforkIcon />,
  schiff_pitchfork: <SchiffPitchforkIcon />,
  modified_schiff_pitchfork: <ModifiedSchiffPitchforkIcon />,
  inside_pitchfork: <InsidePitchforkIcon />,
  xabcd_pattern: <XABCDPatternIcon />,
  cypher_pattern: <CypherPatternIcon />,
  head_and_shoulders: <HeadAndShouldersIcon />,
  abcd_pattern: <ABCDPatternIcon />,
  triangle_pattern: <TrianglePatternIcon />,
  three_drives_pattern: <ThreeDrivesPatternIcon />,
  elliott_impulse_wave: <ElliottImpulseIcon />,
  elliott_correction_wave: <ElliottCorrectionIcon />,
  elliott_triangle_wave: <ElliottTriangleIcon />,
  elliott_double_combo_wave: <ElliottDoubleComboIcon />,
  elliott_triple_combo_wave: <ElliottTripleComboIcon />,
  cyclic_lines: <CyclicLinesIcon />,
  time_cycles: <TimeCyclesIcon />,
  sine_line: <SineLineIcon />,
  long_position: <ForecastingLongIcon />,
  short_position: <ForecastingShortIcon />,
  position_forecast: <ForecastingForecastIcon />,
  bar_pattern: <ForecastingBarPatternIcon />,
  ghost_feed: <ForecastingGhostFeedIcon />,
  sector: <ForecastingSectorIcon />,
  anchored_vwap: <AnchoredVWAPIcon />,
  anchored_volume_profile: <AnchoredVolumeProfileIcon />,
  fixed_range_volume_profile: <FixedRangeVolumeProfileIcon />,
  brush: <BrushIcon />,
  highlighter: <HighlighterIcon />,
  rectangle: <RectangleIcon />,
  rotated_rectangle: <RotatedRectangleIcon />,
  triangle: <TriangleIcon />,
  arc: <ArcIcon />,
  double_curve: <DoubleCurveIcon />,
  text_note: <TextNoteIcon />,
  note: <NoteIcon />,
  price_note: <PriceNoteIcon />,
  pin: <PinIcon />,
  table: <TableIcon />,
  callout: <CalloutIcon />,
  comment: <CommentIcon />,
  price_label: <PriceLabelIcon />,
  signpost: <SignpostIcon />,
  flag_mark: <FlagMarkIcon />,
  image_note: <ImageNoteIcon />,
  post: <PostIcon />,
  idea: <IdeaIcon />,
};

export const getDrawingToolIcon = (toolId: AllToolType | null): React.ReactNode | null => {
  if (!toolId) return null;
  return DRAWING_TOOL_ICON_REGISTRY[toolId as DrawingToolId] ?? null;
};
