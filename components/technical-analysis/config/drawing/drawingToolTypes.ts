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
  | "brush"
  | "highlighter"
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
  | "fixed_range_volume_profile"
  | null;

export type AllToolType =
  | DrawingToolType
  | FibonacciToolType
  | ChartPatternToolType
  | ElliottWaveToolType
  | CyclesToolType
  | ForecastingToolType;
