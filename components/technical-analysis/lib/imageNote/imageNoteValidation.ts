// [IMAGE NOTE] Shared business logic for validating and sizing images.
// Used by the insertion modal, drag/drop, paste, and settings replacement.
import type { DrawingImageNoteProps } from "../../config/drawing/drawingModelTypes";

export const IMAGE_MAX_BYTES = 2_000_000;
export const IMAGE_MAX_DIMENSION = 2000;
export const IMAGE_MIN_DIMENSION = 16;
export const IMAGE_ACCEPTED_MIME = ["image/jpeg", "image/png", "image/webp"] as const;

export interface ImageValidationError {
  code:
    | "EMPTY"
    | "BAD_MIME"
    | "TOO_LARGE"
    | "TOO_WIDE"
    | "TOO_TALL"
    | "ZERO_DIM"
    | "LOAD_FAILED";
  message: string;
}

export interface ValidatedImage {
  file: File;
  mimeType: string;
  naturalWidth: number;
  naturalHeight: number;
  originalFileName?: string;
}

/**
 * Validate a File for the Image tool. Returns the natural dimensions on success
 * (requires decoding the image to read dimensions). Never throws.
 */
export const validateImageFile = async (
  file: File | null | undefined,
): Promise<{ ok: true; value: ValidatedImage } | { ok: false; error: ImageValidationError }> => {
  if (!file) {
    return { ok: false, error: { code: "EMPTY", message: "Aucun fichier sélectionné." } };
  }

  const lowered = file.name ? file.name.toLowerCase() : "";
  const isAcceptedMime = (IMAGE_ACCEPTED_MIME as readonly string[]).includes(file.type);
  const isJpegByName = /\.jpe?g$/i.test(lowered);
  const isAccepted = isAcceptedMime || (isJpegByName && file.type === "");

  if (!isAccepted) {
    return {
      ok: false,
      error: {
        code: "BAD_MIME",
        message: "Format non supporté. Utilisez JPG, PNG ou WEBP.",
      },
    };
  }

  if (file.size > IMAGE_MAX_BYTES) {
    return {
      ok: false,
      error: {
        code: "TOO_LARGE",
        message: "Fichier trop volumineux. Limite : 2 Mo.",
      },
    };
  }

  const dims = await readImageDimensions(file).catch(() => null);
  if (!dims) {
    return {
      ok: false,
      error: { code: "LOAD_FAILED", message: "Impossible de lire l'image." },
    };
  }
  if (dims.width < 1 || dims.height < 1) {
    return {
      ok: false,
      error: { code: "ZERO_DIM", message: "Image avec des dimensions nulles." },
    };
  }
  if (dims.width > IMAGE_MAX_DIMENSION) {
    return {
      ok: false,
      error: {
        code: "TOO_WIDE",
        message: `Largeur maximale : ${IMAGE_MAX_DIMENSION} px.`,
      },
    };
  }
  if (dims.height > IMAGE_MAX_DIMENSION) {
    return {
      ok: false,
      error: {
        code: "TOO_TALL",
        message: `Hauteur maximale : ${IMAGE_MAX_DIMENSION} px.`,
      },
    };
  }

  return {
    ok: true,
    value: {
      file,
      mimeType: isAcceptedMime ? file.type : "image/jpeg",
      naturalWidth: dims.width,
      naturalHeight: dims.height,
      originalFileName: file.name || undefined,
    },
  };
};

const readImageDimensions = (
  file: File,
): Promise<{ width: number; height: number }> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const result = { width: img.naturalWidth, height: img.naturalHeight };
      URL.revokeObjectURL(url);
      resolve(result);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("decode failed"));
    };
    img.src = url;
  });

/**
 * Compute initial rendered size from natural dimensions and available grid space.
 * maxWidth = gridWidth / 4, maxHeight = gridHeight / 4.
 * scale = min(1, maxWidth/naturalWidth, maxHeight/naturalHeight).
 * Preserves natural ratio, never upscales, deterministic for a given viewport.
 */
export const computeImageCssSize = (
  naturalWidth: number,
  naturalHeight: number,
  gridWidth: number,
  gridHeight: number,
): { cssWidth: number; cssHeight: number } => {
  const maxWidth = gridWidth / 4;
  const maxHeight = gridHeight / 4;
  const scale = Math.min(
    1,
    naturalWidth > 0 ? maxWidth / naturalWidth : 1,
    naturalHeight > 0 ? maxHeight / naturalHeight : 1,
  );
  return {
    cssWidth: Math.max(IMAGE_MIN_DIMENSION, Math.round(naturalWidth * scale)),
    cssHeight: Math.max(IMAGE_MIN_DIMENSION, Math.round(naturalHeight * scale)),
  };
};

export const DEFAULT_IMAGE_TRANSPARENCY = 0;

export const buildImageNoteProps = (
  assetId: string,
  validated: ValidatedImage,
  cssWidth: number,
  cssHeight: number,
  transparency: number = DEFAULT_IMAGE_TRANSPARENCY,
): DrawingImageNoteProps => ({
  assetId,
  mimeType: validated.mimeType,
  naturalWidth: validated.naturalWidth,
  naturalHeight: validated.naturalHeight,
  cssWidth,
  cssHeight,
  transparency,
  originalFileName: validated.originalFileName,
});
