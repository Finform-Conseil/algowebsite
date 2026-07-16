import type { DrawingStyle } from "../../../config/drawing/drawingPrimitiveTypes";
import type { Drawing } from "../../../config/drawing/drawingModelTypes";

export const mergeDrawingProps = <Key extends keyof Drawing & string>(
  drawing: Drawing,
  key: Key,
  patch: Partial<Extract<NonNullable<Drawing[Key]>, object>>,
): Partial<Drawing> => ({
  [key]: {
    ...((drawing[key] || {}) as object),
    ...patch,
  },
} as Partial<Drawing>);

export const buildFillBackgroundUpdates = (
  drawing: Drawing,
  drawingStyle: DrawingStyle,
  fillEnabled: boolean,
): Partial<Drawing> => {
  const updates: Partial<Drawing> = {
    style: {
      ...drawingStyle,
      fillEnabled,
    },
  };

  if (drawing.cyclesProps) {
    updates.cyclesProps = { ...drawing.cyclesProps, fillBackground: fillEnabled };
  }
  if (drawing.fibProps) {
    updates.fibProps = { ...drawing.fibProps, fillBackground: fillEnabled };
  }
  if (drawing.regressionProps) {
    updates.regressionProps = { ...drawing.regressionProps, fillBackground: fillEnabled };
  }
  if (drawing.pitchforkProps) {
    updates.pitchforkProps = { ...drawing.pitchforkProps, fillBackground: fillEnabled };
  }
  if (drawing.pitchfanProps) {
    updates.pitchfanProps = { ...drawing.pitchfanProps, fillBackground: fillEnabled };
  }
  if (drawing.gannSquareProps) {
    updates.gannSquareProps = { ...drawing.gannSquareProps, fillBackground: fillEnabled };
  }
  if (drawing.gannFanProps) {
    updates.gannFanProps = { ...drawing.gannFanProps, fillBackground: fillEnabled };
  }

  return updates;
};
