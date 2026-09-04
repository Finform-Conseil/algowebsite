import type { MultiChartLayoutState } from "./multiChartLayoutTypes";
import { DEFAULT_MULTI_CHART_SYNC, MULTI_CHART_LAYOUTS } from "./multiChartLayouts";
import {
  completeMultiChartLayout,
  type CompleteMultiChartLayoutState,
} from "./multiChartCellState";

export const MULTI_CHART_PERSISTENCE_VERSION = 3 as const;
export const MULTI_CHART_STORAGE_KEY_V2 = "technical-analysis.multiChartLayout.v2";
export const MULTI_CHART_STORAGE_KEY_V3 = "technical-analysis.multiChartLayout.v3";

const VALID_LAYOUT_IDS = new Set(MULTI_CHART_LAYOUTS.map((layout) => layout.id));

const isObject = (value: unknown): value is object =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const hasValidLayoutShape = (value: unknown): value is MultiChartLayoutState => {
  if (!isObject(value)) return false;
  const candidate = value as Partial<MultiChartLayoutState>;
  if (typeof candidate.layoutId !== "string" || !VALID_LAYOUT_IDS.has(candidate.layoutId as MultiChartLayoutState["layoutId"])) return false;
  if (!Array.isArray(candidate.charts)) return false;
  if (!isObject(candidate.sync)) return false;
  return true;
};

export const migratePersistedMultiChartLayout = (
  value: unknown,
  options: { resetSyncToDefault?: boolean } = {},
): CompleteMultiChartLayoutState | null => {
  if (!hasValidLayoutShape(value)) return null;
  const definition = MULTI_CHART_LAYOUTS.find((layout) => layout.id === value.layoutId);
  if (!definition || value.charts.length !== definition.chartCount) return null;
  const completed = completeMultiChartLayout(value);
  return options.resetSyncToDefault
    ? { ...completed, sync: { ...DEFAULT_MULTI_CHART_SYNC } }
    : completed;
};

export const serializeMultiChartLayout = (
  layout: MultiChartLayoutState | CompleteMultiChartLayoutState,
): CompleteMultiChartLayoutState => completeMultiChartLayout(layout);
