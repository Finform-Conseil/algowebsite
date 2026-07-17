import type { Drawing } from "../../config/drawing/drawingModelTypes";

/**
 * [IMAGE NOTE] Normalize restored drawings: ensure image_note drawings carry
 * valid imageNoteProps. Mirrors the no-op-for-other-types guard used by
 * normalizeFlagMark / normalizeSignpost.
 */
export const normalizeImageNote = (drawing: Drawing): Drawing => {
  if (drawing.type !== "image_note") return drawing;
  if (!drawing.imageNoteProps) return drawing;
  const p = drawing.imageNoteProps;
  return {
    ...drawing,
    imageNoteProps: {
      assetId: p.assetId,
      mimeType: p.mimeType,
      naturalWidth: p.naturalWidth,
      naturalHeight: p.naturalHeight,
      cssWidth: p.cssWidth,
      cssHeight: p.cssHeight,
      transparency: typeof p.transparency === "number" ? p.transparency : 0,
      originalFileName: p.originalFileName,
    },
  };
};
