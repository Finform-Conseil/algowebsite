// [IMAGE NOTE] Asset loader + decode cache.
// Bridges the IndexedDB asset store (Blob) to a decoded HTMLImageElement used
// by the canvas renderer. Keeps the decoded image in memory only; the source of
// truth for the binary is the asset store (never inline Base64 in state).
import { loadDrawingAsset } from "../../hooks/drawing/drawingPersistence";

type RedrawFn = () => void;

const imageCache = new Map<string, HTMLImageElement>();
const pendingLoads = new Map<string, Promise<HTMLImageElement | null>>();
let redrawRequest: RedrawFn | null = null;

/** Wired by useDrawingManager's RAF owner so async loads can request a redraw. */
export const setImageNoteRedrawHandler = (fn: RedrawFn | null): void => {
  redrawRequest = fn;
};

const requestRedraw = (): void => {
  if (redrawRequest) redrawRequest();
};

/**
 * Returns a decoded image for the given assetId, or null if not yet available.
 * Kicks off an async load (cached) and requests a redraw when ready.
 */
export const getImageNoteImage = (assetId: string): HTMLImageElement | null => {
  const cached = imageCache.get(assetId);
  if (cached && cached.complete && cached.naturalWidth > 0) return cached;

  if (!pendingLoads.has(assetId)) {
    const promise = (async () => {
      try {
        const blob = await loadDrawingAsset(assetId);
        if (!blob) return null;
        const url = URL.createObjectURL(blob);
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("decode failed"));
          img.src = url;
        });
        imageCache.set(assetId, img);
        requestRedraw();
        return img;
      } catch {
        return null;
      } finally {
        pendingLoads.delete(assetId);
      }
    })();
    pendingLoads.set(assetId, promise);
  }
  return null;
};

/** Synchronously seed a decoded image (used after upload before persistence round-trip). */
export const seedImageNoteImage = (assetId: string, img: HTMLImageElement): void => {
  imageCache.set(assetId, img);
};

export const clearImageNoteImage = (assetId: string | undefined | null): void => {
  if (!assetId) return;
  const img = imageCache.get(assetId);
  if (img) {
    const src = img.src;
    if (src.startsWith("blob:")) URL.revokeObjectURL(src);
  }
  imageCache.delete(assetId);
};
