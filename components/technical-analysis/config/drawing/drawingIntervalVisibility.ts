import type { Drawing, IntervalKind } from "./drawingModelTypes";

export const DRAWING_INTERVAL_KINDS: readonly IntervalKind[] = [
  "1m",
  "5m",
  "15m",
  "30m",
  "1H",
  "4H",
  "1D",
  "1W",
  "1M",
];

const DRAWING_INTERVAL_KIND_SET = new Set<string>(DRAWING_INTERVAL_KINDS);

export const normalizeDrawingIntervalKind = (
  timeframe: string | null | undefined,
): IntervalKind | null => {
  const normalized = String(timeframe ?? "").trim();
  return DRAWING_INTERVAL_KIND_SET.has(normalized)
    ? (normalized as IntervalKind)
    : null;
};

export const isDrawingVisibleAtInterval = (
  drawing: Drawing,
  timeframe: string | null | undefined,
): boolean => {
  if (drawing.hidden) return false;

  const visibility = drawing.intervalVisibility;
  if (!visibility?.enabled) return true;

  const interval = normalizeDrawingIntervalKind(timeframe);
  if (!interval) return true;

  return visibility.perKind?.[interval] ?? true;
};
