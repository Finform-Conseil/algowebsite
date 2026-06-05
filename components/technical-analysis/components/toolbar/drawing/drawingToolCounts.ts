import { DRAWING_TOOL_SPECS } from "../../../config/drawing/drawingToolSpecs";
import { FIB_TOOLS_SET, TOOL_CATEGORIES } from "../../../config/drawing/drawingConstants";

export type DrawingToolCounts = {
  lines: number;
  channels: number;
  pitchforks: number;
  fibonacci: number;
  fibPure: number;
  gann: number;
  patterns: number;
  elliott: number;
  cycles: number;
  forecasting: number;
  volume: number;
};

export const getDrawingToolCounts = (): DrawingToolCounts => ({
  lines: DRAWING_TOOL_SPECS.filter((tool) => tool.category === TOOL_CATEGORIES.LINES_MEASURES).length,
  channels: DRAWING_TOOL_SPECS.filter((tool) => tool.category === TOOL_CATEGORIES.CHANNELS).length,
  pitchforks: DRAWING_TOOL_SPECS.filter((tool) => tool.category === TOOL_CATEGORIES.PITCHFORKS).length,
  fibonacci: DRAWING_TOOL_SPECS.filter((tool) =>
    (tool.category === TOOL_CATEGORIES.FIBONACCI || tool.category === TOOL_CATEGORIES.PITCHFORKS) &&
    !tool.id.includes("gann") &&
    !FIB_TOOLS_SET.has(tool.id),
  ).length,
  fibPure: DRAWING_TOOL_SPECS.filter((tool) => tool.category === TOOL_CATEGORIES.FIBONACCI && !tool.id.includes("gann")).length,
  gann: DRAWING_TOOL_SPECS.filter((tool) => tool.id.includes("gann")).length,
  patterns: DRAWING_TOOL_SPECS.filter((tool) => tool.category === TOOL_CATEGORIES.CHART_PATTERNS).length,
  elliott: DRAWING_TOOL_SPECS.filter((tool) => tool.category === TOOL_CATEGORIES.ELLIOTT_WAVES).length,
  cycles: DRAWING_TOOL_SPECS.filter((tool) => tool.category === TOOL_CATEGORIES.CYCLES).length,
  forecasting: DRAWING_TOOL_SPECS.filter((tool) => tool.category === TOOL_CATEGORIES.FORECASTING).length,
  volume: DRAWING_TOOL_SPECS.filter((tool) => tool.category === TOOL_CATEGORIES.VOLUME_BASED).length,
});
