import { HitTestResult, DrawingHelpers } from "../../interfaces/IDrawingStrategy";
import { Drawing, DrawingPoint } from "../../../../config/TechnicalAnalysisTypes";
import { EChartsInstance } from "../../../types/echarts";

/**
 * [TENOR 2026 HDR] Fib Speed Resistance Arcs Renderer
 * TradingView Parity: 2-Click Tool (P1 = Anchor, P2 = Target).
 * Arcs are drawn as ellipses based on the bounding box of P1 and P2.
 */
export function renderFibSpeedResistanceArcs(
  pts: { x: number; y: number }[],
  _dataPoints: DrawingPoint[],
  drawing: Drawing,
  _chart: EChartsInstance,
  isSelected: boolean,
  h: DrawingHelpers
) {
  if (pts.length < 1 || !drawing.fibSpeedResistanceArcsProps) return;

  const { levels, trendLine, background, showLabels, fullCircles } = drawing.fibSpeedResistanceArcsProps;

  const p1 = pts[0];
  const p2 = pts[1] || p1;

  // 1. Construction Line (Trend Line P1 -> P2)
  if (trendLine.enabled && pts.length >= 2) {
    h.ctx.save();
    h.ctx.strokeStyle = trendLine.color;
    h.ctx.lineWidth = trendLine.lineWidth;
    h.ctx.globalAlpha = trendLine.lineOpacity ?? 1;
    h.applyLineDash(trendLine.lineStyle as "solid" | "dashed" | "dotted", trendLine.lineWidth);
    h.drawSegment(p1, p2);
    h.ctx.restore();
  }

  // If only 1 point is placed (creating mode), just draw the handle and return
  if (pts.length < 2) {
    if (isSelected || drawing.isCreating) h.drawHandle(p1);
    return;
  }

  // 2. Calculate Base Radii from Bounding Box
  const rx_base = Math.abs(p2.x - p1.x);
  const ry_base = Math.abs(p2.y - p1.y);

  // Determine drawing angles based on P2 position relative to P1
  const isRight = p2.x >= p1.x;
  
  // TradingView Parity: If fullCircles is false, draw half-ellipses facing P2
  const startAngle = fullCircles ? 0 : (isRight ? -Math.PI / 2 : Math.PI / 2);
  const endAngle = fullCircles ? 2 * Math.PI : (isRight ? Math.PI / 2 : 3 * Math.PI / 2);

  // Sort levels descending so larger arcs are drawn first (proper Z-index for fills)
  const activeLevels = [...levels].filter(l => l.enabled).sort((a, b) => b.value - a.value);

  activeLevels.forEach((l, idx) => {
    const rx = rx_base * l.value;
    const ry = ry_base * l.value;

    // Prevent rendering microscopic arcs
    if (rx < 0.5 || ry < 0.5) return;

    // 3. FILL (Donut / Ring)
    if (background.enabled) {
      const nextVal = idx === activeLevels.length - 1 ? 0 : activeLevels[idx + 1].value;
      const nextRx = rx_base * nextVal;
      const nextRy = ry_base * nextVal;

      h.ctx.save();
      h.ctx.beginPath();
      // Outer ellipse (Clockwise)
      h.ctx.ellipse(p1.x, p1.y, rx, ry, 0, startAngle, endAngle, false);
      
      // Inner ellipse (Counter-Clockwise to punch a hole)
      if (nextRx > 0.5 && nextRy > 0.5) {
        h.ctx.ellipse(p1.x, p1.y, nextRx, nextRy, 0, endAngle, startAngle, true);
      } else {
        h.ctx.lineTo(p1.x, p1.y);
      }
      
      h.ctx.closePath();
      h.ctx.fillStyle = l.color;
      h.ctx.globalAlpha = (background.fillOpacity ?? 0.15);
      h.ctx.fill();
      h.ctx.restore();
    }

    // 4. STROKE (Arc Line)
    h.ctx.save();
    h.ctx.beginPath();
    h.ctx.ellipse(p1.x, p1.y, rx, ry, 0, startAngle, endAngle);
    h.ctx.strokeStyle = l.color;
    h.ctx.lineWidth = l.lineWidth;
    h.ctx.globalAlpha = l.lineOpacity ?? 1;
    h.applyLineDash(l.lineStyle, l.lineWidth);
    h.ctx.stroke();

    // 5. LABELS
    if (showLabels) {
      h.ctx.save();
      h.ctx.font = "11px Inter, sans-serif";
      h.ctx.fillStyle = l.color;
      h.ctx.textAlign = isRight ? "left" : "right";
      h.ctx.textBaseline = "middle";
      // Position label at the horizontal intersection of the arc
      h.ctx.fillText(` ${l.value} `, p1.x + (isRight ? rx : -rx), p1.y);
      h.ctx.restore();
    }
    
    h.ctx.restore();
  });

  // 6. HANDLES
  if (isSelected) {
    h.drawHandle(p1);
    h.drawHandle(p2);
  }
}

/**
 * [TENOR 2026 HDR] Hit-Test for Fib Speed Resistance Arcs
 * Uses normalized Euclidean distance (Ellipse Equation) for mathematically perfect selection.
 */
export function hitTestFibSpeedResistanceArcs(
  mx: number,
  my: number,
  points: { x: number; y: number }[],
  drawing: Drawing,
  threshold: number
): HitTestResult {
  if (points.length < 2 || !drawing.fibSpeedResistanceArcsProps) {
    return { isHit: false, hitType: null };
  }

  const p1 = points[0];
  const p2 = points[1];

  // 1. Check Handles (Priority)
  const handleRadius = 12;
  if (Math.hypot(mx - p1.x, my - p1.y) < handleRadius) return { isHit: true, hitType: 'point', pointIndex: 0 };
  if (Math.hypot(mx - p2.x, my - p2.y) < handleRadius) return { isHit: true, hitType: 'point', pointIndex: 1 };

  // 2. Calculate Base Radii
  // [SRE FIX] Prevent division by zero if P1 and P2 overlap
  const rxBase = Math.max(0.1, Math.abs(p2.x - p1.x));
  const ryBase = Math.max(0.1, Math.abs(p2.y - p1.y));

  // 3. Normalize Mouse Coordinates to Ellipse Space
  const dx = (mx - p1.x) / rxBase;
  const dy = (my - p1.y) / ryBase;
  const distNormalized = Math.sqrt(dx * dx + dy * dy);

  const activeLevels = drawing.fibSpeedResistanceArcsProps.levels.filter(l => l.enabled);

  // 4. Check Arc Lines
  for (const l of activeLevels) {
    // The threshold must be normalized relative to the ellipse size
    const normalizedThreshold = threshold / Math.max(rxBase, ryBase);
    if (Math.abs(distNormalized - l.value) < normalizedThreshold) {
      return { isHit: true, hitType: 'shape' };
    }
  }

  // 5. Check Background Fill
  if (drawing.fibSpeedResistanceArcsProps.background.enabled && activeLevels.length > 0) {
    const maxVal = Math.max(...activeLevels.map(l => l.value));
    if (distNormalized <= maxVal) {
      // If not full circles, ensure we only hit the drawn half
      if (!drawing.fibSpeedResistanceArcsProps.fullCircles) {
        const isRight = p2.x >= p1.x;
        const mouseIsRight = mx >= p1.x;
        if (isRight === mouseIsRight) {
          return { isHit: true, hitType: 'shape' };
        }
      } else {
        return { isHit: true, hitType: 'shape' };
      }
    }
  }

  return { isHit: false, hitType: null };
}
// --- EOF ---