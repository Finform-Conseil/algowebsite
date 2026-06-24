import { DRAWING_TOOL_SPECS } from "../../../config/drawing/drawingToolSpecs";
import { FIB_TOOLS_SET, TOOL_CATEGORIES, TREND_TOOL_CATEGORIES } from "../../../config/drawing/drawingConstants";
import type { AllToolType } from "../../../config/drawing/drawingToolTypes";

export type ToolCategoryMemory = {
  trend: AllToolType | null;
  fib: AllToolType | null;
  chartPatterns: AllToolType | null;
  forecasting: AllToolType | null;
  brush: AllToolType | null;
};

export const createEmptyToolCategoryMemory = (): ToolCategoryMemory => ({
  trend: null,
  fib: null,
  chartPatterns: null,
  forecasting: null,
  brush: null,
});

export const getToolMemoryBucket = (toolId: AllToolType | null): keyof ToolCategoryMemory | null => {
  if (!toolId) return null;

  const tool = DRAWING_TOOL_SPECS.find((item) => item.id === toolId);
  if (!tool) return null;

  if (FIB_TOOLS_SET.has(toolId)) return "fib";
  if ((TREND_TOOL_CATEGORIES as readonly string[]).includes(tool.category)) return "trend";
  if (
    tool.category === TOOL_CATEGORIES.CHART_PATTERNS ||
    tool.category === TOOL_CATEGORIES.ELLIOTT_WAVES ||
    tool.category === TOOL_CATEGORIES.CYCLES
  ) {
    return "chartPatterns";
  }
  if (tool.category === TOOL_CATEGORIES.FORECASTING || tool.category === TOOL_CATEGORIES.VOLUME_BASED || tool.category === TOOL_CATEGORIES.MEASURERS) {
    return "forecasting";
  }
  if (tool.category === TOOL_CATEGORIES.BRUSH_DRAWING) {
    return "brush";
  }

  return null;
};

export const getActiveToolCategory = (activeTool: AllToolType | null): string => {
  if (!activeTool) return "";
  return DRAWING_TOOL_SPECS.find((tool) => tool.id === activeTool)?.category || "";
};

export const isTrendToolActiveForCategory = (
  activeTool: AllToolType | null,
  activeToolCategory: string,
): boolean => {
  if (!activeTool) return false;
  if (FIB_TOOLS_SET.has(activeTool)) return false;
  return (TREND_TOOL_CATEGORIES as readonly string[]).includes(activeToolCategory);
};

export const isFibToolActiveForTool = (activeTool: AllToolType | null): boolean => {
  return activeTool ? FIB_TOOLS_SET.has(activeTool) : false;
};

export const isChartPatternsToolActiveForCategory = (activeToolCategory: string): boolean => {
  return (
    activeToolCategory === TOOL_CATEGORIES.CHART_PATTERNS ||
    activeToolCategory === TOOL_CATEGORIES.ELLIOTT_WAVES ||
    activeToolCategory === TOOL_CATEGORIES.CYCLES
  );
};

export const isForecastingToolActiveForTool = (activeTool: AllToolType | null): boolean => {
  if (!activeTool) return false;
  return DRAWING_TOOL_SPECS.some(
    (tool) =>
      tool.id === activeTool &&
      (tool.category === TOOL_CATEGORIES.FORECASTING || tool.category === TOOL_CATEGORIES.VOLUME_BASED || tool.category === TOOL_CATEGORIES.MEASURERS),
  );
};

export const isBrushToolActiveForTool = (activeTool: AllToolType | null): boolean => {
  if (!activeTool) return false;
  return DRAWING_TOOL_SPECS.some(
    (tool) => tool.id === activeTool && tool.category === TOOL_CATEGORIES.BRUSH_DRAWING,
  );
};
