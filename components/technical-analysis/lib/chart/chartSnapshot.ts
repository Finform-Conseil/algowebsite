const DEFAULT_SNAPSHOT_BACKGROUND = "#102a43";
const SNAPSHOT_MIME_TYPE = "image/png";

const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob> => new Promise((resolve, reject) => {
  canvas.toBlob((blob) => {
    if (blob) resolve(blob);
    else reject(new Error("Canvas snapshot encoding returned an empty blob"));
  }, SNAPSHOT_MIME_TYPE);
});

const isRenderableCanvas = (canvas: HTMLCanvasElement): boolean => {
  const rect = canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return false;
  const style = window.getComputedStyle(canvas);
  return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity || 1) > 0;
};

/**
 * Clean-room TradingView-like chart snapshot.
 * We compose every visible canvas layer (ECharts, cursor and drawings) in DOM
 * order instead of taking a browser screenshot. This keeps the feature local,
 * deterministic and independent from browser-extension/OS permissions.
 */
export const captureChartSnapshot = async (container: HTMLElement): Promise<Blob> => {
  const rect = container.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) {
    throw new Error("Chart surface is not renderable");
  }

  const pixelRatio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const output = document.createElement("canvas");
  output.width = Math.max(1, Math.round(rect.width * pixelRatio));
  output.height = Math.max(1, Math.round(rect.height * pixelRatio));

  const context = output.getContext("2d", { alpha: false });
  if (!context) throw new Error("2D canvas is unavailable");
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  const computedBackground = window.getComputedStyle(container).backgroundColor;
  context.fillStyle = computedBackground && computedBackground !== "rgba(0, 0, 0, 0)"
    ? computedBackground
    : DEFAULT_SNAPSHOT_BACKGROUND;
  context.fillRect(0, 0, rect.width, rect.height);

  const canvases = Array.from(container.querySelectorAll("canvas")).filter(isRenderableCanvas);
  if (canvases.length === 0) throw new Error("No chart canvas is available to capture");

  for (const canvas of canvases) {
    const layerRect = canvas.getBoundingClientRect();
    const x = layerRect.left - rect.left;
    const y = layerRect.top - rect.top;
    try {
      context.drawImage(canvas, x, y, layerRect.width, layerRect.height);
    } catch (error) {
      console.warn("[TA Snapshot] A canvas layer could not be composed", error);
    }
  }

  return canvasToBlob(output);
};

export const buildSnapshotFilename = (symbol: string): string => {
  const safeSymbol = symbol.trim().toUpperCase().replace(/[^A-Z0-9._-]+/g, "-") || "CHART";
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${safeSymbol}-${timestamp}.png`;
};

export const downloadSnapshotBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  }
};

export const copySnapshotBlob = async (blob: Blob): Promise<void> => {
  if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
    throw new Error("Image clipboard is not supported by this browser");
  }
  await navigator.clipboard.write([new ClipboardItem({ [SNAPSHOT_MIME_TYPE]: blob })]);
};

export const openSnapshotBlob = (blob: Blob, targetWindow: Window | null): void => {
  if (!targetWindow) throw new Error("The browser blocked the snapshot tab");
  const url = URL.createObjectURL(blob);
  targetWindow.location.href = url;
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
};
