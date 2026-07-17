import { IDrawingStrategy, HitTestResult, DrawingHelpers } from "../interfaces/IDrawingStrategy";
import type { DrawingPoint } from "../../../config/drawing/drawingPrimitiveTypes";
import type { Drawing } from "../../../config/drawing/drawingModelTypes";
import type { ChartDataPoint } from "../../Indicators/TechnicalIndicators";
import type { EChartsInstance } from "../../types/echarts";
import { distanceBetweenPoints } from "../../math/geometry";
import {
  computeSignpostLayout,
  clampStemToPricePane,
  getChartDom,
  getPrimaryPricePaneRect,
  verticalPositionPctToAnchorY,
  LABEL_FILL,
  LABEL_BORDER,
  LABEL_RADIUS,
  LABEL_TEXT,
  LABEL_PLACEHOLDER_TEXT,
  HANDLE_SIZE,
  EMOJI_SIZE,
  EMOJI_GAP,
  type PixelRect,
} from "../../../hooks/drawing/drawingSignpostProjection";

const ACCENT = "#2962FF";

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  if (h.length < 6) return `rgba(41, 98, 255, ${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function measureTextFor(ctx: CanvasRenderingContext2D, font: string, text: string): number {
  ctx.font = font;
  return ctx.measureText(text).width;
}

function toPixelY(chart: EChartsInstance, time: string | number, value: number): number {
  try {
    const p = (chart as any).convertToPixel({ seriesIndex: 0 }, [time, value]);
    return Array.isArray(p) && Number.isFinite(p[1]) ? p[1] : NaN;
  } catch {
    return NaN;
  }
}

// Times may be stored as number or string ("2024-01-05" vs 1704432000000). Compare
// canonically so a numeric/string mismatch never breaks the candle lookup.
function sameTime(a: string | number | undefined, b: string | number | undefined): boolean {
  if (a === undefined || b === undefined) return false;
  return String(a) === String(b);
}

/**
 * Resolve the candle pixel Y the stem must anchor to: the candle HIGH when the
 * label is above the candle, the LOW when it is below. The candle is found by its
 * STABLE TIME (barTime), never by array index — so it survives dataset-length
 * changes after reload. Uses the passed chart data first, then falls back to the
 * live ECharts option so hit-testing reproduces the exact same geometry.
 *
 * Returns `labelY` (degenerate stem) when the candle is temporarily unavailable,
 * which keeps the label/handle fully selectable (no stem drawn).
 */
export function resolveCandleEndpointY(
  chart: EChartsInstance,
  chartData: ChartDataPoint[] | undefined,
  barTime: string | number | undefined,
  labelY: number,
): number {
  if (barTime === undefined) return labelY;
  let high: number | undefined;
  let low: number | undefined;

  const cd = (chartData as any)?.find?.((c: any) => sameTime(c.time, barTime));
  if (cd) {
    high = cd.high;
    low = cd.low;
  }

  if ((high === undefined || low === undefined) && chart) {
    try {
      const opt = (chart as any).getOption?.();
      const series = Array.isArray(opt?.series) ? opt.series[0] : null;
      const raw = (series as any)?.data;
      if (Array.isArray(raw)) {
        const c = raw.find((r: any) =>
          Array.isArray(r) ? sameTime(r[0], barTime) : sameTime((r as any)?.time, barTime),
        );
        if (c) {
          high = c[2];
          low = c[3];
        }
      }
    } catch {
      /* ignore */
    }
  }

  if (high === undefined || low === undefined) return labelY;
  const yHigh = toPixelY(chart, barTime, high);
  const yLow = toPixelY(chart, barTime, low);
  if (!Number.isFinite(yHigh) || !Number.isFinite(yLow)) return labelY;
  const mid = (yHigh + yLow) / 2;
  return labelY <= mid ? yHigh : yLow;
}

// Render/hitTest parity: the exact same chart data + last layout are reused so
// hit-testing reproduces the rehydrated projection bit-for-bit (req. #3), and the
// label stays selectable even when the time anchor is momentarily unavailable
// (req. #4). Caches are keyed PER CHART INSTANCE so a symbol change or a second
// chart can never contaminate another chart's geometry.
const lastChartDataByChart = new Map<EChartsInstance, ChartDataPoint[] | undefined>();
const lastLayoutByChartAndDrawing = new Map<
  EChartsInstance,
  Map<string, ReturnType<typeof computeSignpostLayout>>
>();

export function buildLayout(args: {
  pts: { x: number; y: number }[];
  chart: EChartsInstance;
  chartData: ChartDataPoint[] | undefined;
  drawing: Drawing;
  isSelected: boolean;
  measure: (font: string, text: string) => number;
  ctx: CanvasRenderingContext2D;
}): { layout: ReturnType<typeof computeSignpostLayout>; anchorX: number; labelY: number; pricePaneRect: PixelRect | null } | null {
  const { pts, chart, chartData, drawing, isSelected, measure, ctx } = args;
  if (pts.length < 1) return null;

  const sp = drawing.signpostProps;
  const verticalPositionPct = sp?.verticalPositionPct ?? 50;
  // Prefer the persisted point time; fall back to the stored barTime so we never
  // lose an already-persisted anchor if points[0].time is absent.
  const barTime = drawing.points?.[0]?.time ?? sp?.barTime;
  const displayText = drawing.text && drawing.showText && drawing.text.trim() ? drawing.text : "";
  const fontSize = drawing.fontSize || 13;
  const textBold = !!drawing.textBold;
  const textItalic = !!drawing.textItalic;
  const font = `${textItalic ? "italic " : ""}${textBold ? "bold " : ""}${fontSize}px Inter, sans-serif`;

  const ax = pts[0].x;
  const container = getChartDom(chart);
  const pricePaneRect = getPrimaryPricePaneRect(chart, container);
  let labelY = pts[0].y;
  if (pricePaneRect) {
    try {
      labelY = verticalPositionPctToAnchorY(verticalPositionPct, pricePaneRect);
    } catch {
      labelY = pts[0].y;
    }
  }

  const candleEndpointY = resolveCandleEndpointY(chart, chartData, barTime, labelY);

  const layout = computeSignpostLayout({
    anchorX: ax,
    labelY,
    candleEndpointY,
    lines: displayText ? displayText.split("\n") : [],
    displayPlaceholder: !displayText,
    fontSize,
    lineHeight: fontSize + 4,
    emojiPin: drawing.emojiPin,
    selected: isSelected,
    pricePaneRect,
    measureText: measure,
    font,
  });

  return { layout, anchorX: ax, labelY, pricePaneRect };
}

export class SignpostStrategy implements IDrawingStrategy {
  supportedTools = ["signpost"];

  render(
    pts: { x: number; y: number }[],
    _dataPoints: DrawingPoint[],
    drawing: Drawing,
    chart: EChartsInstance,
    isSelected: boolean,
    h: DrawingHelpers,
    _chartData: ChartDataPoint[],
  ): void {
    const built = buildLayout({
      pts,
      chart,
      chartData: _chartData,
      drawing,
      isSelected,
      measure: (font, t) => measureTextFor(h.ctx, font, t),
      ctx: h.ctx,
    });
    if (!built) return;
    const { layout, pricePaneRect } = built;
    // Parity cache for hit-testing (req. #3) + selectable-when-unavailable (req. #4).
    lastChartDataByChart.set(chart, _chartData);
    let perChart = lastLayoutByChartAndDrawing.get(chart);
    if (!perChart) {
      perChart = new Map();
      lastLayoutByChartAndDrawing.set(chart, perChart);
    }
    perChart.set(drawing.id, layout);

    const ctx = h.ctx;
    const sf = drawing.style;
    const markerColor = sf.color || ACCENT;
    const displayText = drawing.text && drawing.showText && drawing.text.trim() ? drawing.text : "";

    ctx.save();

    // Clip strictly to the price pane: the stem can never paint into Volume.
    if (pricePaneRect) {
      ctx.beginPath();
      ctx.rect(pricePaneRect.x, pricePaneRect.y, pricePaneRect.width, pricePaneRect.height);
      ctx.clip();
    }

    // Stem: label border -> candle endpoint (already clamped to pane inside layout).
    // Only drawn with a valid candle endpoint (req. #5); otherwise the label/handle
    // remain but no stem is painted.
    if (layout.stemDrawn) {
      ctx.strokeStyle = markerColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(layout.stem.x, layout.stem.y1);
      ctx.lineTo(layout.stem.x, layout.stem.y2);
      ctx.stroke();
    }

    // Emoji pin (optional): connector + coloured pin head + emoji glyph.
    if (drawing.emojiPin?.enabled && layout.emojiPinRect) {
      const cx = layout.emojiPinRect.x + layout.emojiPinRect.width / 2;
      const cy = layout.emojiPinRect.y + layout.emojiPinRect.height / 2;
      const pinColor = drawing.emojiPin.color || ACCENT;
      ctx.strokeStyle = pinColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, layout.emojiPinRect.bottom);
      ctx.lineTo(cx, layout.labelRect.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, EMOJI_SIZE / 2 * 0.82, 0, Math.PI * 2);
      ctx.fillStyle = pinColor;
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = `${Math.round(EMOJI_SIZE * 0.8)}px Inter, "Segoe UI Emoji", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(drawing.emojiPin.emoji || "📍", cx, cy + 0.5);
    }

    // Neutral compact field (always drawn, even when empty -> shows "Add text").
    const { labelRect } = layout;
    const r = Math.min(LABEL_RADIUS, labelRect.width / 2, labelRect.height / 2);
    ctx.beginPath();
    ctx.moveTo(labelRect.x + r, labelRect.y);
    ctx.arcTo(labelRect.x + labelRect.width, labelRect.y, labelRect.x + labelRect.width, labelRect.y + labelRect.height, r);
    ctx.arcTo(labelRect.x + labelRect.width, labelRect.y + labelRect.height, labelRect.x, labelRect.y + labelRect.height, r);
    ctx.arcTo(labelRect.x, labelRect.y + labelRect.height, labelRect.x, labelRect.y, r);
    ctx.arcTo(labelRect.x, labelRect.y, labelRect.x + labelRect.width, labelRect.y, r);
    ctx.closePath();
    ctx.fillStyle = LABEL_FILL;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = LABEL_BORDER;
    ctx.stroke();

    ctx.font = `${drawing.textItalic ? "italic " : ""}${drawing.textBold ? "bold " : ""}${drawing.fontSize || 13}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (displayText) {
      ctx.fillStyle = drawing.textColor || LABEL_TEXT;
      ctx.fillText(displayText, labelRect.x + labelRect.width / 2, labelRect.y + labelRect.height / 2);
    } else {
      ctx.fillStyle = LABEL_PLACEHOLDER_TEXT;
      ctx.fillText("Add text", labelRect.x + labelRect.width / 2, labelRect.y + labelRect.height / 2);
    }

    // Blue square handle — shared primitive (part of the signpost structure).
    const hc = { x: layout.handleRect.x + layout.handleRect.width / 2, y: layout.handleRect.y + layout.handleRect.height / 2 };
    h.drawHandle(hc, markerColor, HANDLE_SIZE / 2, "square");

    ctx.restore();
  }

  hitTest(
    mx: number,
    my: number,
    drawing: Drawing,
    chartInstance: EChartsInstance,
    _threshold: number,
  ): HitTestResult {
    const canvas = document.createElement("canvas");
    const tempCtx = canvas.getContext("2d");
    if (!tempCtx) return { isHit: false, hitType: null };

    const pts = drawing.points
      .map((p) => {
        const pixel = (chartInstance as any).convertToPixel?.({ seriesIndex: 0 }, [p.time, p.value]);
        return pixel ? { x: pixel[0], y: pixel[1] } : null;
      })
      .filter((p): p is { x: number; y: number } => p !== null);

    if (pts.length < 1) {
      // Time anchor momentarily unavailable: fall back to the last rendered layout
      // so the label stays selectable (req. #4).
      const cached = lastLayoutByChartAndDrawing.get(chartInstance)?.get(drawing.id);
      if (!cached) return { isHit: false, hitType: null };
      return hitTestLayout(cached, mx, my);
    }

    const built = buildLayout({
      pts,
      chart: chartInstance,
      chartData: lastChartDataByChart.get(chartInstance),
      drawing,
      isSelected: false,
      measure: (font, t) => measureTextFor(tempCtx, font, t),
      ctx: tempCtx,
    });
    if (!built) {
      const cached = lastLayoutByChartAndDrawing.get(chartInstance)?.get(drawing.id);
      if (!cached) return { isHit: false, hitType: null };
      return hitTestLayout(cached, mx, my);
    }
    const { layout } = built;
    return hitTestLayout(layout, mx, my);
  }
}

export function hitTestLayout(
  layout: ReturnType<typeof computeSignpostLayout>,
  mx: number,
  my: number,
): HitTestResult {
  const HIT = 6;

  // Emoji pin
  if (layout.emojiPinRect) {
    const er = layout.emojiPinRect;
    if (mx >= er.x - HIT && mx <= er.right + HIT && my >= er.y - HIT && my <= er.bottom + HIT) {
      return { isHit: true, hitType: "shape", part: "emoji-pin" };
    }
  }

  // Handle (blue square)
  const hr = layout.handleRect;
  if (mx >= hr.x - HIT && mx <= hr.right + HIT && my >= hr.y - HIT && my <= hr.bottom + HIT) {
    return { isHit: true, hitType: "shape", part: "vertical-handle" };
  }

  // Label field
  const lr = layout.labelRect;
  if (mx >= lr.x && mx <= lr.right && my >= lr.y && my <= lr.bottom) {
    return { isHit: true, hitType: "shape", part: "label" };
  }

  // Stem
  if (layout.stemDrawn) {
    const s = clampStemToPricePane(layout.stem, null);
    const yMin = Math.min(s.y1, s.y2);
    const yMax = Math.max(s.y1, s.y2);
    if (Math.abs(mx - s.x) <= HIT && my >= yMin - HIT && my <= yMax + HIT) {
      return { isHit: true, hitType: "shape", part: "stem" };
    }
  }

  return { isHit: false, hitType: null };
}
