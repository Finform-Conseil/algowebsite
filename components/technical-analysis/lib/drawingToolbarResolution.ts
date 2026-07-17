import { TEXT_NOTE_TOOL_VARIANT_SET } from "../config/drawing/drawingConstants";

/**
 * Resolves which toolbar configuration key a selected drawing type maps to.
 *
 * Signpost gets its OWN configuration (it must NOT fall through to the generic
 * text_note toolbar). Resolution order:
 *   1. pin        -> pin
 *   2. table      -> table
 *   3. signpost   -> signpost   (explicit, before the text_note variant fallback)
 *   4. text-note variant family (text_note/note/callout/comment/price_label/signpost) -> text_note
 *   5. note       -> text_note
 *   6. any type with its own config entry -> itself
 *   7. otherwise  -> undefined (no toolbar)
 */
export function resolveDrawingToolbarType(
  type: string | undefined,
  hasToolbarConfig: (t: string) => boolean,
): string | undefined {
  if (!type) return undefined;
  if (type === "pin") return "pin";
  if (type === "table") return "table";
  if (type === "signpost") return "signpost";
  if (type === "image_note") return "image_note";
  if (TEXT_NOTE_TOOL_VARIANT_SET.has(type)) return "text_note";
  if (type === "note") return "text_note";
  if (hasToolbarConfig(type)) return type;
  return undefined;
}
