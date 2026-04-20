/**
 * [TENOR 2026] Centralized constants for Technical Analysis Drawing Tools
 * This file eliminates redundancy (DRY) across TechnicalAnalysis.tsx and useDrawingManager.ts
 */

export const TOOL_CATEGORIES = {
    LINES_MEASURES: "Lines & Measures",
    CHANNELS: "Channels",
    FIBONACCI: "Fibonacci",
    PITCHFORKS: "Pitchforks",
    CHART_PATTERNS: "Chart Patterns",
    ELLIOTT_WAVES: "Elliott Waves",
    CYCLES: "Cycles",
    FORECASTING: "Forecasting",
    VOLUME_BASED: "Volume-Based",
    CURSOR: "Cursor",
} as const;

/**
 * Tools that behave primarily as trend lines (segments/rays)
 */
export const LINE_TOOLS = [
    "line",
    "ray",
    "trend_angle",
    "arrow",
    "x_line",
] as const;

/**
 * Tools for measuring distances (Date, Price, Box)
 */
export const MEASURE_TOOLS = [
    "date_range",
    "price_range",
    "date_price_range",
    "sector",
    "anchored_volume_profile",
] as const;

/**
 * All variants of Pitchfork tools
 */
export const PITCHFORK_TOOLS = [
    "pitchfork",
    "schiff_pitchfork",
    "modified_schiff_pitchfork",
    "inside_pitchfork",
] as const;

/**
 * Tools that consist of multiple connected points (N points)
 */
export const MULTI_POINT_TOOLS = [
    "polyline",
    "path",
    "curve",
    "projection",
    "position_forecast",
    "bar_pattern",
    "ghost_feed",
    "sector",
] as const;


/**
 * Position measurement tools (Long/Short)
 */
export const POSITION_TOOLS = [
    "long_position",
    "short_position",
] as const;

/**
 * Master list of tools considered under the "Fibonacci" logic umbrella
 * Used for active state determination and exclusion from "Trend" tools
 */
export const FIB_TOOLS_LIST = [
    "fib_retracement",
    "trend_based_fib_extension",
    "fib_channel",
    "fib_time_zone",
    "fib_speed_resistance_fan",
    "trend_based_fib_time",
    "fib_circles",
    "fib_speed_resistance_arcs",
    "fib_spiral",
    "fib_wedge",
    "pitchfan",
    "gann_box",
    "gann_square_fixed",
    "gann_square",
    "gann_fan",
] as const;

export const GANN_TOOLS = [
    "gann_box",
    "gann_square",
    "gann_square_fixed",
    "gann_fan",
] as const;


/**
 * Categories that are considered "Trend" tools for the sidebar button activation
 */
export const TREND_TOOL_CATEGORIES = [
    TOOL_CATEGORIES.LINES_MEASURES,
    TOOL_CATEGORIES.CHANNELS,
    TOOL_CATEGORIES.PITCHFORKS,
] as const;

/**
 * Tools that belong to the "Channels" category
 */
export const CHANNEL_TOOLS = [
    "parallel_channel",
    "regression_trend",
    "disjoint_channel",
    "flat_top_bottom",
] as const;

/**
 * Elliott Wave tools
 */
export const ELLIOTT_WAVE_TOOLS = [
    "elliott_impulse_wave",
    "elliott_correction_wave",
    "elliott_triangle_wave",
    "elliott_double_combo_wave",
    "elliott_triple_combo_wave",
] as const;

/**
 * Cycle tools
 */
export const CYCLES_TOOLS = [
    "cyclic_lines",
    "time_cycles",
    "sine_line",
] as const;

/**
 * Fibonacci tools that support the "One Color" global override
 */
export const FIB_TOOLS_ONE_COLOR = [
    "fib_circles",
    "fib_speed_resistance_arcs",
    "fib_spiral",
    "fib_wedge",
    "gann_fan",
    "pitchfan",
] as const;

export const FIB_TOOLS_SET = new Set<string>(FIB_TOOLS_LIST);

/**
 * Pure Fibonacci tools (not including pitchforks) for fibProps checks
 */
export const FIB_PURE_TOOLS = [
    "fib_retracement",
    "trend_based_fib_extension",
    "fib_channel",
    "fib_time_zone",
    "fib_speed_resistance_fan",
    "trend_based_fib_time",
    "fib_circles",
    "fib_speed_resistance_arcs",
    "fib_spiral",
    "fib_wedge",
    "pitchfan",
] as const;

/**
 * Tools that show the "Inputs" tab in the settings modal
 */
export const TOOLS_WITH_INPUTS_TAB = [
    ...CHANNEL_TOOLS,
    ...POSITION_TOOLS,
    "gann_square",
    ...CYCLES_TOOLS,
    "ghost_feed",
] as const;

/**
 * Tools that show the "Style" tab in the settings modal
 * (basically all non-Fibonacci, non-Position simple tools + channels)
 */
export const TOOLS_WITH_GENERIC_STYLE_TAB = [
    ...CHANNEL_TOOLS,
    ...LINE_TOOLS,
    "horizontal_line",
    "vertical_line",
    "horizontal_ray",
    ...MULTI_POINT_TOOLS,
    "arrow_marker",
    ...MEASURE_TOOLS,
    ...CYCLES_TOOLS,
    "anchored_vwap",
    "anchored_volume_profile",
] as const;

/**
 * Default ratios for Fib Wedge
 */
export const DEFAULT_FIB_WEDGE_LEVELS = [
    { value: 0, color: "#787b86", enabled: true, lineOpacity: 1, fillOpacity: 0.1, lineStyle: "solid", lineWidth: 1 },
    { value: 0.236, color: "#f44336", enabled: true, lineOpacity: 1, fillOpacity: 0.1, lineStyle: "solid", lineWidth: 1 },
    { value: 0.382, color: "#ff9800", enabled: true, lineOpacity: 1, fillOpacity: 0.1, lineStyle: "solid", lineWidth: 1 },
    { value: 0.5, color: "#4caf50", enabled: true, lineOpacity: 1, fillOpacity: 0.1, lineStyle: "solid", lineWidth: 1 },
    { value: 0.618, color: "#009688", enabled: true, lineOpacity: 1, fillOpacity: 0.1, lineStyle: "solid", lineWidth: 1 },
    { value: 0.786, color: "#2196f3", enabled: true, lineOpacity: 1, fillOpacity: 0.1, lineStyle: "solid", lineWidth: 1 },
    { value: 1, color: "#787b86", enabled: true, lineOpacity: 1, fillOpacity: 0.1, lineStyle: "solid", lineWidth: 1 },
];

export interface ToolbarButtonDefinition {
    icon: string;
    iconLocked?: string;
    title: string;
    action: string;
}

export interface ToolbarConfig {
    version: string;
    description: string;
    drawings: Record<string, {
        toolbar: string[];
        description?: string;
    }>;
    button_definitions: Record<string, ToolbarButtonDefinition>;
}
