import { DRAWING_TOOL_SPECS } from "../../../config/drawing/drawingToolSpecs";
import { GANN_TOOLS, TOOL_CATEGORIES, TREND_TOOL_CATEGORIES } from "../../../config/drawing/drawingConstants";

type DrawingToolConfig = (typeof DRAWING_TOOL_SPECS)[number];

export type TrendDropdownView = "categories" | "drawing_tools" | "channels" | "pitchforks";
export type FibDropdownView = "categories" | "fibonacci" | "gann";
export type ChartPatternsDropdownView = "categories" | "patterns" | "elliott" | "cycles";
export type ForecastingDropdownView = "categories" | "forecasting" | "volume" | "measurers";
export type BrushDropdownView = "categories" | "brushes" | "arrows" | "formes";
export type AnnotationDropdownView = "categories" | "text_notes" | "content";

const includesToolQuery = (tool: DrawingToolConfig, query: string): boolean => {
  if (!query.trim()) return true;
  const normalizedQuery = query.toLowerCase();
  return (
    (tool.label?.toLowerCase() || "").includes(normalizedQuery) ||
    tool.id.toLowerCase().includes(normalizedQuery)
  );
};

export const filterTrendTools = (query: string): DrawingToolConfig[] => {
  return DRAWING_TOOL_SPECS.filter(
    (tool) =>
      (TREND_TOOL_CATEGORIES as readonly string[]).includes(tool.category) &&
      includesToolQuery(tool, query),
  );
};

export const getTrendDropdownTools = (view: TrendDropdownView): DrawingToolConfig[] => {
  return DRAWING_TOOL_SPECS.filter((tool) => {
    if (view === "drawing_tools") return tool.category === TOOL_CATEGORIES.LINES_MEASURES;
    if (view === "channels") return tool.category === TOOL_CATEGORIES.CHANNELS;
    if (view === "pitchforks") return tool.category === TOOL_CATEGORIES.PITCHFORKS;
    return false;
  });
};

export const getFibDropdownTools = (view: FibDropdownView): DrawingToolConfig[] => {
  return DRAWING_TOOL_SPECS.filter((tool) => {
    const isGannTool = (GANN_TOOLS as readonly string[]).includes(tool.id);
    if (view === "fibonacci") return tool.category === TOOL_CATEGORIES.FIBONACCI && !isGannTool;
    if (view === "gann") return isGannTool;
    return false;
  });
};

export const filterChartPatternTools = (
  view: ChartPatternsDropdownView,
  query: string,
): DrawingToolConfig[] => {
  return DRAWING_TOOL_SPECS.filter((tool) => {
    if (!includesToolQuery(tool, query)) return false;
    if (view === "patterns") return tool.category === TOOL_CATEGORIES.CHART_PATTERNS;
    if (view === "elliott") return tool.category === TOOL_CATEGORIES.ELLIOTT_WAVES;
    if (view === "cycles") return tool.category === TOOL_CATEGORIES.CYCLES;
    return false;
  });
};

export const filterBrushTools = (
  view: BrushDropdownView,
  query: string,
): DrawingToolConfig[] => {
  return DRAWING_TOOL_SPECS.filter((tool) => {
    if (!includesToolQuery(tool, query)) return false;
    if (view === "brushes") return tool.id === "brush" || tool.id === "highlighter";
    if (view === "arrows") return tool.id === "arrow_mark_up" || tool.id === "arrow_mark_down";
    if (view === "formes") return tool.category === TOOL_CATEGORIES.SHAPES;
    return false;
  });
};

export const filterAnnotationTools = (
  view: AnnotationDropdownView,
  query: string,
): DrawingToolConfig[] => {
  const TEXT_NOTE_IDS = new Set<string>([
    "text_note", "note", "price_note", "pin", "table", "callout",
    "comment", "price_label", "signpost", "flag_mark",
  ]);
  const CONTENT_IDS = new Set<string>(["image_note", "post", "idea"]);
  return DRAWING_TOOL_SPECS.filter((tool) => {
    if (!includesToolQuery(tool, query)) return false;
    if (view === "text_notes") return TEXT_NOTE_IDS.has(tool.id);
    if (view === "content") return CONTENT_IDS.has(tool.id);
    return false;
  });
};

export const filterForecastingTools = (
  view: ForecastingDropdownView,
  query: string,
): DrawingToolConfig[] => {
  return DRAWING_TOOL_SPECS.filter((tool) => {
    if (!includesToolQuery(tool, query)) return false;
    if (view === "forecasting") return tool.category === TOOL_CATEGORIES.FORECASTING;
    if (view === "volume") return tool.category === TOOL_CATEGORIES.VOLUME_BASED;
    if (view === "measurers") return tool.category === TOOL_CATEGORIES.MEASURERS;
    return false;
  });
};
