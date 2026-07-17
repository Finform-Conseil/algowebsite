import { getSafeGridRect } from "../viewport/viewportGraphics";

import type { EChartsInstance } from "../../lib/types/echarts";
export type ChartLike = { getDom?: () => HTMLElement | null } | null;

export interface PixelRect {
  x: number;
  y: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
}

export class SignpostProjectionNotReadyError extends Error {
  constructor(msg?: string) {
    super(msg ?? "Signpost projection not ready");
    this.name = "SignpostProjectionNotReadyError";
  }
}

export function getPricePaneRectFromECharts(chart: ChartLike): PixelRect | null {
  try {
    const m = (chart as any).getModel?.();
    if (!m) return null;
    const g = m.getComponent?.("grid", 0);
    if (!g) return null;
    const cs = g.coordinateSystem;
    if (!cs) return null;
    const r = cs.getRect();
    if (!r) return null;
    if (!Number.isFinite(r.width) || r.width <= 0 || !Number.isFinite(r.height) || r.height <= 0) return null;
    return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.x + r.width, bottom: r.y + r.height };
  } catch { return null; }
}

export function getPrimaryPricePaneRect(chart: ChartLike, container: HTMLElement | null): PixelRect | null {
  const e = getPricePaneRectFromECharts(chart);
  if (e) return e;
  const d = getSafeGridRect(chart as any, container);
  if (Number.isFinite(d.width) && d.width > 0 && Number.isFinite(d.height) && d.height > 0) {
    return { x: d.x, y: d.y, width: d.width, height: d.height, right: d.x + d.width, bottom: d.y + d.height };
  }
  return null;
}

export function getActiveGridRects(chart: ChartLike): PixelRect[] {
  const rects: PixelRect[] = [];
  try {
    const m = (chart as any).getModel?.();
    if (!m) return rects;
    for (let i = 0; i < 10; i++) {
      const g = m.getComponent?.("grid", i);
      if (!g) break;
      const cs = g.coordinateSystem;
      if (!cs) continue;
      const r = cs.getRect();
      if (!r) continue;
      const rect = { x: r.x, y: r.y, width: r.width, height: r.height, right: r.x + r.width, bottom: r.y + r.height };
      if (Number.isFinite(rect.width) && rect.width > 0 && Number.isFinite(rect.height) && rect.height > 0) rects.push(rect);
    }
  } catch {}
  return rects;
}

export function getTimeAxisTop(chart: ChartLike): number | null {
  const rects = getActiveGridRects(chart);
  if (rects.length === 0) return null;
  return Math.max(...rects.map((r) => r.bottom));
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function pointerYToVerticalPositionPct(pointerY: number, pricePaneRect: PixelRect): number {
  if (!Number.isFinite(pointerY) || !Number.isFinite(pricePaneRect.y) || !Number.isFinite(pricePaneRect.height) || pricePaneRect.height <= 0) {
    throw new SignpostProjectionNotReadyError();
  }
  const bottom = pricePaneRect.y + pricePaneRect.height;
  return clamp(((bottom - pointerY) / pricePaneRect.height) * 100, 0, 100);
}

export function verticalPositionPctToAnchorY(verticalPositionPct: number, pricePaneRect: PixelRect): number {
  if (!Number.isFinite(verticalPositionPct)) throw new SignpostProjectionNotReadyError();
  const pct = clamp(verticalPositionPct, 0, 100);
  const bottom = pricePaneRect.y + pricePaneRect.height;
  return bottom - (pct / 100) * pricePaneRect.height;
}

export type SignpostHitPart = "vertical-handle" | "label" | "emoji-pin" | "stem" | "time-axis-label";

// --- Visual constants (measured neutral compact field + blue square handle) ---
export const LABEL_PADDING_H = 10;
export const LABEL_PADDING_V = 6;
export const LABEL_MIN_HEIGHT = 26;
export const LABEL_MIN_WIDTH_PLACEHOLDER = 72; // "Add text"
export const LABEL_RADIUS = 4;
export const LABEL_FILL = "#ffffff";
export const LABEL_BORDER = "#d1d4dc";
export const LABEL_TEXT = "#131722";
export const LABEL_PLACEHOLDER_TEXT = "#787b86";
export const HANDLE_SIZE = 10;
export const EMOJI_SIZE = 20;
export const EMOJI_GAP = 6;

export interface SignpostLayoutInput {
  /** Horizontal pixel X of the anchored bar (stable anchor). */
  anchorX: number;
  /** Vertical pixel Y of the label centre (derived from verticalPositionPct). */
  labelY: number;
  /**
   * Pixel Y on the candle where the stem must terminate (the candle HIGH when the
   * label is above the candle, the LOW when it is below). Computed by the caller
   * from the real chart candle data — never the price-pane bottom or the time axis.
   */
  candleEndpointY: number;
  /** Text lines (empty array when there is no text). */
  lines: string[];
  /** Show the neutral "Add text" placeholder when there is no text. */
  displayPlaceholder: boolean;
  fontSize: number;
  lineHeight: number;
  emojiPin?: { enabled: boolean; emoji: string; color: string; opacity: number };
  selected: boolean;
  /** Price-pane rect used to clip the stem so it can never paint into Volume. */
  pricePaneRect?: PixelRect | null;
  timeLabel?: string;
  measureText: (font: string, text: string) => number;
  font: string;
}

export interface SignpostLayout {
  labelRect: PixelRect;
  /** Blue square handle rect (drawn via the shared square primitive). */
  handleRect: PixelRect;
  handleSide: "top" | "bottom";
  /** Stem strictly between the label border and the candle endpoint. */
  stem: { x: number; y1: number; y2: number };
  stemDrawn: boolean;
  emojiPinRect: PixelRect | null;
  timeAxisLabelRect: PixelRect | null;
}

/**
 * Clamp a stem's endpoints into a price pane. This is the extra safety net that
 * guarantees the stem can never reach the Volume pane (or any other grid) even if
 * the caller passes an out-of-bounds candle endpoint.
 */
export const clampStemToPricePane = (
  stem: { x: number; y1: number; y2: number },
  pane: PixelRect | null | undefined,
): { x: number; y1: number; y2: number } => {
  if (!pane) return stem;
  const top = pane.y;
  const bottom = pane.bottom;
  return {
    x: stem.x,
    y1: Math.max(top, Math.min(bottom, stem.y1)),
    y2: Math.max(top, Math.min(bottom, stem.y2)),
  };
};

export const computeSignpostLayout = (input: SignpostLayoutInput): SignpostLayout => {
  const {
    anchorX,
    labelY,
    candleEndpointY,
    lines,
    displayPlaceholder,
    fontSize,
    lineHeight,
    emojiPin,
    selected,
    pricePaneRect,
    timeLabel,
    measureText,
    font,
  } = input;

  const safeLines = (lines ?? []).filter(Boolean);
  const textContent = safeLines.join(" ");
  const textWidth = textContent ? measureText(font, textContent) : 0;
  const placeholderWidth = displayPlaceholder ? measureText(font, "Add text") : 0;
  const effectiveWidth = Math.max(textWidth, placeholderWidth);
  const labelW = Math.max(effectiveWidth + LABEL_PADDING_H * 2, LABEL_MIN_WIDTH_PLACEHOLDER);
  const lineCount = Math.max(safeLines.length, displayPlaceholder ? 1 : 0, 1);
  const labelH = Math.max(lineCount * lineHeight + LABEL_PADDING_V * 2, LABEL_MIN_HEIGHT);
  const labelRect: PixelRect = {
    x: anchorX - labelW / 2,
    y: labelY - labelH / 2,
    width: labelW,
    height: labelH,
    right: anchorX + labelW / 2,
    bottom: labelY + labelH / 2,
  };

  // The label sits ABOVE the candle when its centre is higher (smaller y) than the
  // candle endpoint. In that case the stem descends and the square handle sits above.
  // The stem is only drawn when a real candle endpoint exists (req. #5): when the
  // resolved endpoint equals the label centre (sentinel for "candle unavailable"),
  // the stem collapses to zero length and is not hit-tested.
  const stemDrawn =
    Number.isFinite(candleEndpointY) && candleEndpointY !== labelY;

  const labelAboveCandle = candleEndpointY >= labelY;

  let stem: { x: number; y1: number; y2: number };
  let handleSide: "top" | "bottom";
  if (stemDrawn) {
    if (labelAboveCandle) {
      stem = { x: anchorX, y1: labelRect.bottom, y2: candleEndpointY };
      handleSide = "top";
    } else {
      stem = { x: anchorX, y1: candleEndpointY, y2: labelRect.y };
      handleSide = "bottom";
    }
  } else {
    const cy = Number.isFinite(candleEndpointY) ? candleEndpointY : labelY;
    stem = { x: anchorX, y1: cy, y2: cy };
    handleSide = "top";
  }
  stem = clampStemToPricePane(stem, pricePaneRect);

  const hs = HANDLE_SIZE;
  const handleX = anchorX - hs / 2;
  const handleY = handleSide === "top" ? labelRect.y - hs / 2 : labelRect.y + labelRect.height - hs / 2;
  const handleRect: PixelRect = {
    x: handleX,
    y: handleY,
    width: hs,
    height: hs,
    right: handleX + hs,
    bottom: handleY + hs,
  };

  let emojiPinRect: PixelRect | null = null;
  if (emojiPin?.enabled) {
    const s = EMOJI_SIZE;
    emojiPinRect = {
      x: anchorX - s / 2,
      y: labelRect.y - s - EMOJI_GAP,
      width: s,
      height: s,
      right: anchorX + s / 2,
      bottom: labelRect.y - EMOJI_GAP,
    };
  }

  let timeAxisLabelRect: PixelRect | null = null;
  if (selected && timeLabel) {
    const tw = measureText(font, timeLabel);
    const lw = tw + LABEL_PADDING_H * 2;
    const lh = lineHeight + LABEL_PADDING_V * 2;
    timeAxisLabelRect = {
      x: anchorX - lw / 2,
      y: candleEndpointY + 2,
      width: lw,
      height: lh,
      right: anchorX + lw / 2,
      bottom: candleEndpointY + 2 + lh,
    };
  }

  return { labelRect, handleRect, handleSide, stem, stemDrawn, emojiPinRect, timeAxisLabelRect };
};

export const getChartDom = (chart: ChartLike): HTMLElement | null => {
  try {
    const dom = (chart as unknown as { getDom?: () => HTMLElement | null }).getDom?.();
    return dom ?? null;
  } catch {
    return null;
  }
};
