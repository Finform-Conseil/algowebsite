import type { Drawing } from "../../../config/drawing/drawingModelTypes";

export type DrawingBulkAction = "hide-all" | "show-all" | "lock-all" | "unlock-all";

export type DrawingBulkActionResolution =
  | { type: "blocked"; message: string }
  | { type: "patch-all"; patch: Partial<Pick<Drawing, "hidden" | "locked">> };

const EMPTY_DRAWING_MESSAGES: Record<DrawingBulkAction, string> = {
  "hide-all": "Aucun dessin a masquer.",
  "show-all": "Aucun dessin a afficher.",
  "lock-all": "Aucun dessin a verrouiller.",
  "unlock-all": "Aucun dessin a deverrouiller.",
};

const DRAWING_BULK_PATCHES: Record<DrawingBulkAction, Partial<Pick<Drawing, "hidden" | "locked">>> = {
  "hide-all": { hidden: true },
  "show-all": { hidden: false },
  "lock-all": { locked: true },
  "unlock-all": { locked: false },
};

export const resolveDrawingBulkAction = (
  action: DrawingBulkAction,
  drawingCount: number,
): DrawingBulkActionResolution => {
  if (drawingCount === 0) return { type: "blocked", message: EMPTY_DRAWING_MESSAGES[action] };
  return { type: "patch-all", patch: DRAWING_BULK_PATCHES[action] };
};
