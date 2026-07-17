import { z } from "zod";
import type { Drawing } from "../../config/drawing/drawingModelTypes";
import type { DrawingStyle } from "../../config/drawing/drawingPrimitiveTypes";
import type { AllToolType } from "../../config/drawing/drawingToolTypes";
import { TEXT_NOTE_TOOL_VARIANTS } from "../../config/drawing/drawingConstants";
import type { Alert, Order } from "../../config/state/technicalAnalysisStateTypes";

export const EMPTY_ALERTS: Alert[] = [];
export const EMPTY_ORDERS: Order[] = [];

export const createDefaultAnchoredVolumeProfileProps = (): NonNullable<
  Drawing["anchoredVolumeProfileProps"]
> => ({
  layout: "Number of Rows",
  rowSize: 24,
  volume: "Up/Down",
  valueAreaVolume: 70,
  upColor: "rgba(146, 226, 236, 0.5)",
  downColor: "rgba(245, 159, 188, 0.5)",
  vaUpColor: "rgba(135, 215, 225, 0.7)",
  vaDownColor: "rgba(239, 153, 182, 0.7)",
  pocColor: "#000000",
  width: 34,
  placement: "Right",
  showLabels: false,
  showPOC: true,
  showValueArea: true,
});

const DrawingStyleSchema = z.object({
  color: z.string().optional(),
  lineWidth: z.number().optional(),
  lineStyle: z.enum(["solid", "dashed", "dotted"]).optional(),
  lineOpacity: z.number().optional(),
  fillColor: z.string().optional(),
  fillOpacity: z.number().optional(),
  fillEnabled: z.boolean().optional(),
  borderColor: z.string().optional(),
  borderEnabled: z.boolean().optional(),
});

const NamedTemplateItemSchema = z.object({
  name: z.string(),
  style: DrawingStyleSchema,
});

export const validateToolDefaults = (data: unknown): Record<string, DrawingStyle> => {
  if (typeof data !== "object" || data === null) return {};
  const result: Record<string, DrawingStyle> = {};
  Object.entries(data).forEach(([key, value]) => {
    const parsed = DrawingStyleSchema.safeParse(value);
    if (parsed.success) {
      result[key] = parsed.data as DrawingStyle;
    }
  });
  return result;
};

export const validateNamedTemplates = (
  data: unknown
): Record<string, { name: string; style: DrawingStyle }[]> => {
  if (typeof data !== "object" || data === null) return {};
  const result: Record<string, { name: string; style: DrawingStyle }[]> = {};

  Object.entries(data).forEach(([key, value]) => {
    if (!Array.isArray(value)) return;
    const validItems: { name: string; style: DrawingStyle }[] = [];
    value.forEach((item) => {
      const parsed = NamedTemplateItemSchema.safeParse(item);
      if (parsed.success) {
        validItems.push(parsed.data as { name: string; style: DrawingStyle });
      }
    });
    if (validItems.length > 0) {
      result[key] = validItems;
    }
  });

  return result;
};

export const SINGLE_CLICK_TOOLS: AllToolType[] = [
  "horizontal_line",
  "vertical_line",
  "crosshair",
  "arrow_marker",
  "arrow_mark_up",
  "arrow_mark_down",
  "horizontal_ray",
  "long_position",
  "short_position",
  "anchored_vwap",
  "anchored_volume_profile",
  "brush",
  "highlighter",
  "flag_mark",
  ...TEXT_NOTE_TOOL_VARIANTS.filter(t => t !== "callout"),
];

export const TWO_CLICK_TOOLS: AllToolType[] = [
  "note",
  "price_note",
  "callout",
  "rectangle",
  "circle",
  "ellipse",
  "line",
  "arrow",
  "trend_angle",
  "ray",
  "x_line",
  "date_range",
  "price_range",
  "date_price_range",
  "regression_trend",
  "fixed_range_volume_profile",
  "fib_retracement",
  "fib_time_zone",
  "fib_speed_resistance_fan",
  "fib_circles",
  "fib_spiral",
  "gann_box",
  "gann_square",
  "gann_square_fixed",
  "gann_fan",
  "cyclic_lines",
  "time_cycles",
  "sine_line",
  "position_forecast",
  "bar_pattern",
  "fib_speed_resistance_arcs",
];

export const MULTI_CLICK_TOOLS: AllToolType[] = [
  "rotated_rectangle",
  "triangle",
  "arc",
  "curve",
  "double_curve",
  "polyline",
  "path",
  "xabcd_pattern",
  "cypher_pattern",
  "abcd_pattern",
  "triangle_pattern",
  "three_drives_pattern",
  "head_and_shoulders",
  "elliott_impulse_wave",
  "elliott_triangle_wave",
  "elliott_triple_combo_wave",
  "elliott_correction_wave",
  "elliott_double_combo_wave",
  "projection",
  "curve",
  "parallel_channel",
  "flat_top_bottom",
  "disjoint_channel",
  "pitchfork",
  "schiff_pitchfork",
  "modified_schiff_pitchfork",
  "inside_pitchfork",
  "pitchfan",
  "trend_based_fib_extension",
  "fib_channel",
  "trend_based_fib_time",
  "fib_wedge",
  "ghost_feed",
  "sector",
];

export const TOOL_MAX_CLICKS_REGISTRY: Record<string, number> = {
  rotated_rectangle: 3,
  triangle: 3,
  arc: 3,
  curve: 3,
  double_curve: 5,
  sector: 3,
  xabcd_pattern: 5,
  cypher_pattern: 5,
  abcd_pattern: 4,
  triangle_pattern: 4,
  three_drives_pattern: 7,
  head_and_shoulders: 7,
  elliott_impulse_wave: 6,
  elliott_triangle_wave: 5,
  elliott_triple_combo_wave: 5,
  elliott_correction_wave: 3,
  elliott_double_combo_wave: 3,
  trend_based_fib_extension: 3,
  fib_channel: 3,
  trend_based_fib_time: 3,
  fib_wedge: 3,
  pitchfork: 3,
  schiff_pitchfork: 3,
  modified_schiff_pitchfork: 3,
  inside_pitchfork: 3,
  pitchfan: 3,
  disjoint_channel: 3,
  parallel_channel: 3,
  flat_top_bottom: 3,
  projection: 3,
};
