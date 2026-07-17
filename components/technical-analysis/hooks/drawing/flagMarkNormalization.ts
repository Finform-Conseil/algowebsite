import type { Drawing } from "../../config/drawing/drawingModelTypes";

const DEFAULT_FLAG_COLOR = "#2962FF";

export const normalizeFlagMark = (drawing: Drawing): Drawing => {
  if (drawing.type !== "flag_mark") return drawing;

  if (
    drawing.flagMarkProps &&
    typeof drawing.flagMarkProps.flagColor === "string" &&
    drawing.flagMarkProps.flagColor.length > 0
  ) {
    return drawing;
  }

  return {
    ...drawing,
    flagMarkProps: {
      flagColor: DEFAULT_FLAG_COLOR,
    },
  };
};
