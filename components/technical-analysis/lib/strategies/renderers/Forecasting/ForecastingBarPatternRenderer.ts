import { Drawing, DrawingHelpers, BarPatternMode } from "../../../../config/TechnicalAnalysisTypes";
import { distanceBetweenPoints } from "../../../math/geometry";
import { distancePointToSegment } from "./ForecastingUtils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EChartsInstance = any;

/**
 * [TENOR 2026] Renders the Bar Pattern forecasting tool with EXACT TradingView parity.
 * Implements 2D Affine Transformation for free vertical/horizontal dragging.
 * SCAR-133 FIX: Uses pure `fillRect()` for OHLC bars.
 * SCAR-134 FIX: Removes horizontal ticks entirely to match TV's clean vertical-only look.
 * SCAR-135 FIX: Handles are white inside, blue outside.
 */
export const renderForecastingBarPattern = (
  pts: { x: number; y: number }[],
  drawing: Drawing,
  chart: EChartsInstance,
  isSelected: boolean,
  h: DrawingHelpers
): void => {
  if (pts.length < 1 || !chart) return;

  const { ctx } = h;
  const props = drawing.barPatternProps || {
    color: drawing.style.color || "#ff9800",
    mode: "HL Bars" as BarPatternMode,
    mirrored: false,
    flipped: false,
    opacity: 1,
  };

  // ==========================================================================
  // PHASE 1 : CREATION (SELECTION BRACKET) - Parity with TradingView
  // ==========================================================================
  if (drawing.isCreating || !props.data || props.data.length === 0) {
    const p1 = pts[0];
    const p2 = pts.length > 1 ? pts[1] : p1;

    if (Math.abs(p2.x - p1.x) > 1 || Math.abs(p2.y - p1.y) > 1) {
      ctx.save();
      const crispX1 = Math.round(p1.x) + 0.5;
      const crispX2 = Math.round(p2.x) + 0.5;
      const crispY1 = Math.round(p1.y) + 0.5;
      const crispY2 = Math.round(p2.y) + 0.5;

      // Vertical borders (Subtle gray)
      ctx.strokeStyle = "rgba(120, 123, 134, 0.5)";
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      ctx.beginPath();
      // Left vertical line
      ctx.moveTo(crispX1, 0);
      ctx.lineTo(crispX1, h.logicalHeight);
      // Right vertical line
      ctx.moveTo(crispX2, 0);
      ctx.lineTo(crispX2, h.logicalHeight);
      ctx.stroke();

      // Diagonal connector (Gray, following price)
      ctx.strokeStyle = props.color || drawing.style.color || "#ff9800";
      ctx.globalAlpha = props.opacity ?? 1;
      ctx.beginPath();
      ctx.moveTo(crispX1, crispY1);
      ctx.lineTo(crispX2, crispY2);
      ctx.stroke();
      ctx.restore();
    }

    // Show both handles during setup/fallback so the tool is always visible and draggable.
    h.drawHandle(p1, "#ffffff", 5);
    if (pts.length > 1) {
      h.drawHandle(p2, "#ffffff", 5);
    }
    return;
  }

  // ==========================================================================
  // PHASE 2 : RENDERED PATTERN (GHOST BARS)
  // ==========================================================================
  const color = props.color || "#ff9800";
  const opacity = props.opacity ?? 1;
  const lineWidth = Math.max(1, Math.round(drawing.style.lineWidth || 2));

  ctx.save();
  ctx.globalAlpha = opacity;

  const data = [...props.data];
  if (props.mirrored) data.reverse();

  const P1 = pts[0];
  const P2 = pts[1] || P1;
  const N = data.length;

  // --- HORIZONTAL PROJECTION (Pixel Space) ---
  const totalWidth = P2.x - P1.x;

  // --- VERTICAL PROJECTION (Price Space Translation) ---
  const option = chart.getOption();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const candlestickIdx = option.series?.findIndex((s: any) => s.type === "candlestick");
  const targetSeriesIdx = candlestickIdx !== -1 ? candlestickIdx : 0;

  const originalBasePrice = props.data[0].o;
  // The pattern's vertical position is anchored simply by P1.y.
  // We ignore P2.y for vertical scaling to prevent explosive distortion.
  const currentBasePrice = chart.convertFromPixel({ seriesIndex: targetSeriesIdx }, [0, P1.y])?.[1] ?? originalBasePrice;
  const priceShift = currentBasePrice - originalBasePrice;

  if (props.mode.startsWith("Line")) {
    // ========================================================================
    // LINE RENDERER (Uses stroke() for connected paths)
    // ========================================================================
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    
    const crispOffset = lineWidth % 2 === 0 ? 0 : 0.5;

    data.forEach((bar, i) => {
      let { o, c, l, h: h_price } = bar;
      
      o += priceShift; c += priceShift; l += priceShift; h_price += priceShift;
      
      if (props.flipped) {
        o = currentBasePrice - (o - currentBasePrice);
        c = currentBasePrice - (c - currentBasePrice);
        l = currentBasePrice - (l - currentBasePrice);
        h_price = currentBasePrice - (h_price - currentBasePrice);
      }

      // [TENOR 2026] SAFETY CLAMPING (Price Space)
      // Prevent bars from going beyond rational chart limits.
      const clampPrice = (p: number) => Math.max(-1000000, Math.min(1000000, p));
      o = clampPrice(o); c = clampPrice(c); l = clampPrice(l); h_price = clampPrice(h_price);

      const xPos = P1.x + (N > 1 ? (i / (N - 1)) * totalWidth : 0);
      const crispX = Math.round(xPos) + crispOffset;

      const pxL = chart.convertToPixel({ seriesIndex: targetSeriesIdx }, [0, l])?.[1];
      const pxH = chart.convertToPixel({ seriesIndex: targetSeriesIdx }, [0, h_price])?.[1];
      const pxO = chart.convertToPixel({ seriesIndex: targetSeriesIdx }, [0, o])?.[1];
      const pxC = chart.convertToPixel({ seriesIndex: targetSeriesIdx }, [0, c])?.[1];

      if (pxL === undefined || pxH === undefined || pxO === undefined || pxC === undefined) return;

      // [TENOR 2026] COORDINATE CLAMPING (Pixel Space)
      // Ensure Canvas doesn't choke on extreme pixel values.
      const clampPix = (p: number) => Math.max(-10000, Math.min(20000, p));
      const safeL = clampPix(pxL); const safeH = clampPix(pxH);
      const safeO = clampPix(pxO); const safeC = clampPix(pxC);

      let valY = safeC;
      if (props.mode === "Line - Open") valY = safeO;
      else if (props.mode === "Line - High") valY = safeH;
      else if (props.mode === "Line - Low") valY = safeL;
      else if (props.mode === "Line - HL/2") valY = (safeH + safeL) / 2;

      const crispY = Math.round(valY) + crispOffset;

      if (i === 0) ctx.moveTo(crispX, crispY);
      else ctx.lineTo(crispX, crispY);
    });
    ctx.stroke();

  } else {
    // ========================================================================
    // BAR RENDERER (Optimized Single Path Fill)
    // ===================================[TENOR 2026 HDR v20] ================
    ctx.fillStyle = color;
    const halfW = Math.floor(lineWidth / 2);

    // [TENOR 2026] PERFORMANCE: DOWNSAMPLING
    const DOWNSAMPLE_THRESHOLD = 500;
    const step = N > DOWNSAMPLE_THRESHOLD ? Math.ceil(N / DOWNSAMPLE_THRESHOLD) : 1;

    ctx.beginPath(); // Using path-based rendering for better batching
    for (let i = 0; i < N; i += step) {
      const bar = data[i];
      let { o, c, l, h: h_price } = bar;
      
      o += priceShift; c += priceShift; l += priceShift; h_price += priceShift;
      
      if (props.flipped) {
        o = currentBasePrice - (o - currentBasePrice);
        c = currentBasePrice - (c - currentBasePrice);
        l = currentBasePrice - (l - currentBasePrice);
        h_price = currentBasePrice - (h_price - currentBasePrice);
      }

      // SAFETY CLAMP
      const clampPrice = (p: number) => Math.max(-1000000, Math.min(1000000, p));
      o = clampPrice(o); c = clampPrice(c); l = clampPrice(l); h_price = clampPrice(h_price);

      const xPos = P1.x + (N > 1 ? (i / (N - 1)) * totalWidth : 0);
      const xCenter = Math.round(xPos);
      const leftEdge = xCenter - halfW;

      const pxL = chart.convertToPixel({ seriesIndex: targetSeriesIdx }, [0, l])?.[1];
      const pxH = chart.convertToPixel({ seriesIndex: targetSeriesIdx }, [0, h_price])?.[1];
      const pxO = chart.convertToPixel({ seriesIndex: targetSeriesIdx }, [0, o])?.[1];
      const pxC = chart.convertToPixel({ seriesIndex: targetSeriesIdx }, [0, c])?.[1];

      if (pxL === undefined || pxH === undefined || pxO === undefined || pxC === undefined) continue;

      const clampPix = (p: number) => Math.max(-10000, Math.min(20000, p));
      const safeL = clampPix(pxL); const safeH = clampPix(pxH);
      const safeO = clampPix(pxO); const safeC = clampPix(pxC);

      const yHigh = Math.round(Math.min(safeH, safeL));
      const yLow = Math.round(Math.max(safeH, safeL));
      const yOpen = Math.round(safeO);
      const yClose = Math.round(safeC);

      if (props.mode === "HL Bars") {
        ctx.rect(leftEdge, yHigh, lineWidth, Math.max(1, yLow - yHigh));
      } else if (props.mode === "OC Bars") {
        const yTop = Math.min(yOpen, yClose);
        const yBot = Math.max(yOpen, yClose);
        ctx.rect(leftEdge, yTop, lineWidth, Math.max(1, yBot - yTop));
      }
    }
    ctx.fill();
  }

  ctx.restore();

  if (isSelected) {
    pts.forEach((p) => {
      // White inside, Blue border (TradingView exact match)
      h.drawHandle(p, "#ffffff", 5);
    });
  }
};

export const hitTestForecastingBarPattern = (
  mx: number,
  my: number,
  pts: { x: number; y: number }[],
  drawing: Drawing,
  chart: EChartsInstance,
  threshold: number
): { isHit: boolean; hitType: "point" | "shape" | null; pointIndex?: number } => {
  // 1. Check Handles
  for (let i = 0; i < pts.length; i++) {
    if (distanceBetweenPoints(mx, my, pts[i].x, pts[i].y) < 12) {
      return { isHit: true, hitType: "point", pointIndex: i };
    }
  }

  // 2. Check Bounding Box / Shape (Accurate projection box)
  if (pts.length >= 2 && (!drawing.barPatternProps?.data || drawing.barPatternProps.data.length === 0)) {
    const P1 = pts[0];
    const P2 = pts[1];
    const segDist = distancePointToSegment(mx, my, P1.x, P1.y, P2.x, P2.y);
    if (segDist <= threshold + 4) {
      return { isHit: true, hitType: "shape" };
    }
    const minX = Math.min(P1.x, P2.x) - threshold;
    const maxX = Math.max(P1.x, P2.x) + threshold;
    const minY = Math.min(P1.y, P2.y) - threshold;
    const maxY = Math.max(P1.y, P2.y) + threshold;
    if (mx >= minX && mx <= maxX && my >= minY && my <= maxY) {
      return { isHit: true, hitType: "shape" };
    }
  }

  // 3. Check Bounding Box / Shape (Accurate projection box)
  if (pts.length >= 2 && drawing.barPatternProps?.data && drawing.barPatternProps.data.length > 0) {
    const P1 = pts[0];
    const P2 = pts[1];

    let min_l = Infinity;
    let max_h = -Infinity;

    drawing.barPatternProps.data.forEach((bar) => {
      if (bar.l < min_l) min_l = bar.l;
      if (bar.h > max_h) max_h = bar.h;
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const option = chart.getOption() as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const candlestickIdx = option.series?.findIndex((s: any) => s.type === "candlestick");
    const targetSeriesIdx = candlestickIdx !== -1 ? candlestickIdx : 0;

    const originalBasePrice = drawing.barPatternProps.data[0].o;
    const currentBasePrice = chart.convertFromPixel({ seriesIndex: targetSeriesIdx }, [0, P1.y])?.[1] ?? originalBasePrice;
    const priceShift = currentBasePrice - originalBasePrice;

    min_l += priceShift;
    max_h += priceShift;

    if (drawing.barPatternProps.flipped) {
      const new_min = currentBasePrice - (max_h - currentBasePrice);
      const new_max = currentBasePrice - (min_l - currentBasePrice);
      min_l = new_min;
      max_h = new_max;
    }

    const py1 = chart.convertToPixel({ seriesIndex: targetSeriesIdx }, [0, min_l])?.[1];
    const py2 = chart.convertToPixel({ seriesIndex: targetSeriesIdx }, [0, max_h])?.[1];

    if (py1 !== undefined && py2 !== undefined) {
      const minX = Math.min(P1.x, P2.x) - threshold;
      const maxX = Math.max(P1.x, P2.x) + threshold;
      const minY = Math.min(py1, py2) - threshold;
      const maxY = Math.max(py1, py2) + threshold;

      if (mx >= minX && mx <= maxX && my >= minY && my <= maxY) {
        return { isHit: true, hitType: "shape" };
      }
    }
  }

  return { isHit: false, hitType: null };
};
// --- EOF ---
