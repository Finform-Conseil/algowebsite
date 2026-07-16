import type { Drawing } from "../../config/drawing/drawingModelTypes";

const clampPct = (v: number): number => {
  if (!Number.isFinite(v)) return 50;
  return Math.max(0, Math.min(100, v));
};

export interface NormalizeSignpostOptions {
  /** Resolve a drawing point time to a chart bar index. */
  resolveBarIndex?: (time: string | number) => number;
  /** Vertical-position default when the legacy value is absent (never overwrites an existing value). */
  defaultVerticalPositionPct?: number;
}

/**
 * Normalize a Signpost drawing:
 *  - legacy (no signpostProps, but type === "signpost") -> seed barIndex + verticalPositionPct
 *  - existing value is NEVER silently overwritten by the default (no-50 rule)
 *  - verticalPositionPct is always clamped to 0..100
 *  - idempotent: returns the same reference when nothing changes
 */
export const normalizeSignpost = (
  drawing: Drawing,
  opts: NormalizeSignpostOptions = {},
): Drawing => {
  if (drawing.type !== "signpost") return drawing;

  const defaultPct = opts.defaultVerticalPositionPct ?? 50;
  const point = drawing.points[0];
  const time = point?.time;

  // Preserve the previously stored barIndex (never overwrite a valid index with
  // a derived value). Only fall back to the resolver for brand-new/legacy seeds.
  const resolvedBarIndex =
    drawing.signpostProps?.barIndex ??
    (opts.resolveBarIndex && time !== undefined ? opts.resolveBarIndex(time) : 0);

  // The stable anchor is the candle TIME, not the array index. Persisting the
  // index alone breaks after reload when the dataset length changes.
  const barTime = time;

  const existing = drawing.signpostProps;
  const nextPct = clampPct(existing?.verticalPositionPct ?? defaultPct);

  if (
    existing &&
    existing.barIndex === resolvedBarIndex &&
    existing.barTime === barTime &&
    existing.verticalPositionPct === nextPct
  ) {
    return drawing;
  }

  return {
    ...drawing,
    signpostProps: {
      barIndex: resolvedBarIndex,
      barTime,
      verticalPositionPct: nextPct,
    },
  };
};
