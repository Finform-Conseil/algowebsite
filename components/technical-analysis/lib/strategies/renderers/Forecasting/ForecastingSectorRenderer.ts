// renderers/Forecasting/ForecastingSectorRenderer.ts
// [TENOR 2026 HDR] Sector — Forecasting Renderer
// TradingView Parity: Arc de cercle délimitant un secteur angulaire de prévision (depuis un point pivot)
// SCAR-FIX: Trilateral hit-test (handles + boundary lines + arc + fill). ANGLE_EPSILON anti-float-rejection.
// SCAR-134 FIX: Robust Modulo Arithmetic for Canvas 2D arc() parity.

import { HitTestResult, DrawingHelpers } from "../../interfaces/IDrawingStrategy";
import { Drawing, DrawingPoint } from "../../../../config/TechnicalAnalysisTypes";
import { distanceBetweenPoints } from "../../../math/geometry";
import { distancePointToSegment } from "./ForecastingUtils";
import type { ECharts } from "echarts";

type EChartsInstance = ECharts;

const C_HANDLE = "#2962ff";

/**
 * [HDR 2026] Angular epsilon: adds a small tolerance (≈1.5°) to angular comparisons.
 * Prevents floating-point precision issues from rejecting clicks exactly on the arc edge.
 */
const ANGLE_EPSILON = 0.026; // radians ≈ 1.5°
const HANDLE_RADIUS = 15; // [HDR-SRE] Rayon de détection des points de contrôle

/**
 * [TENOR 2026 FIX] SCAR-134: Mathématiquement isomorphique avec ctx.arc(..., false)
 * Calcule si un angle de souris se trouve dans le secteur balayé de startAngle à endAngle
 * dans le sens des aiguilles d'une montre (clockwise).
 */
function isAngleInSector(mouseAngle: number, startAngle: number, endAngle: number): boolean {
  // Fonction modulo positive stricte
  const mod = (n: number, m: number) => ((n % m) + m) % m;
  const TWO_PI = 2 * Math.PI;

  const sweep = mod(endAngle - startAngle, TWO_PI);
  const mouseDelta = mod(mouseAngle - startAngle, TWO_PI);

  if (sweep <= Math.PI) {
    // Clockwise rendering path (<= 180)
    return mouseDelta <= sweep + ANGLE_EPSILON || mouseDelta >= TWO_PI - ANGLE_EPSILON;
  } else {
    // Counter-clockwise rendering path (Shortest arc is on the other side)
    // In this case, we draw from endAngle to startAngle clockwise? No, ctx.arc(start, end, true)
    // means it draws from start to end COUNTER-clockwise.
    // If sweep > PI, the "interior" of the arc is actually the major part if drawn clockwise.
    // Since we now use anticlockwise=true in the renderer when sweep > PI,
    // the arc exists WHERE mouseDelta >= sweep - EPSILON OR mouseDelta <= EPSILON.
    return mouseDelta >= sweep - ANGLE_EPSILON || mouseDelta <= ANGLE_EPSILON;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RENDERER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * [TENOR 2026] Sector — High Fidelity Renderer
 * TradingView Parity: 3-click tool (Center → Start/Radius → End angle).
 * [HDR 4.5] "Shortest Arc" Logic: Automatically caps sweep at 180° by choosing optimal direction.
 */
export function renderForecastingSector(
  pts: { x: number; y: number }[],
  _dataPoints: DrawingPoint[],
  drawing: Drawing,
  _chart: EChartsInstance,
  isSelected: boolean,
  h: DrawingHelpers
): void {
  if (pts.length < 1) return;

  const color = drawing.style?.color ?? "#2962ff";
  const fillColor = drawing.style?.fillColor ?? color;
  const fillAlpha = drawing.style?.fillOpacity ?? 0.2;
  const fillEnabled = drawing.style?.fillEnabled !== false;
  const lineWidth = drawing.style?.lineWidth ?? 2;
  const lineStyle = drawing.style?.lineStyle ?? "solid";

  // P0 = center pivot
  const p0 = pts[0];

  // ── Phase 0: Only center dot defined ──────────────────────────────────────
  if (pts.length === 1) {
    h.drawHandle(p0, C_HANDLE, 4);
    return;
  }

  // P1 = Radius anchor (defines both radius length and start angle)
  const p1 = pts[1];
  const radius = Math.hypot(p1.x - p0.x, p1.y - p0.y);
  const startAngle = Math.atan2(p1.y - p0.y, p1.x - p0.x);

  // ── Phase 1: Only 2 points — dashed radius preview ───────────────────────
  if (pts.length === 2) {
    h.ctx.save();
    h.ctx.strokeStyle = color;
    h.ctx.lineWidth = 1;
    h.ctx.setLineDash([5, 5]);
    h.drawSegment(p0, p1);
    h.ctx.restore();

    h.drawHandle(p0, C_HANDLE, 4);
    h.drawHandle(p1, C_HANDLE, 4);
    return;
  }

  // P2 = End angle (mouse preview or finalised third point)
  const p2 = pts[2] || p1;
  const endAngle = Math.atan2(p2.y - p0.y, p2.x - p0.x);

  // [HDR 4.5] Dynamic Direction: Choose shortest path to enforce 180° cap.
  const mod = (n: number, m: number) => ((n % m) + m) % m;
  const sweep = mod(endAngle - startAngle, 2 * Math.PI);
  const anticlockwise = sweep > Math.PI;

  // Snapped handle positions on the arc circumference
  const p1Actual: { x: number; y: number } = {
    x: p0.x + radius * Math.cos(startAngle),
    y: p0.y + radius * Math.sin(startAngle),
  };

  const p2Actual: { x: number; y: number } = {
    x: p0.x + radius * Math.cos(endAngle),
    y: p0.y + radius * Math.sin(endAngle),
  };

  h.ctx.save();

  // ── Fill sector ───────────────────────────────────────────────────────────
  if (fillEnabled) {
    h.ctx.beginPath();
    h.ctx.moveTo(p0.x, p0.y);
    h.ctx.arc(p0.x, p0.y, radius, startAngle, endAngle, anticlockwise);
    h.ctx.closePath();
    h.ctx.fillStyle = fillColor;
    h.ctx.globalAlpha = fillAlpha;
    h.ctx.fill();
  }

  // ── Stroke sector border (two radii + arc) ────────────────────────────────
  h.ctx.globalAlpha = 1;
  h.ctx.strokeStyle = color;
  h.ctx.lineWidth = lineWidth;
  h.applyLineDash(lineStyle, lineWidth);
  
  h.ctx.beginPath();
  h.ctx.moveTo(p0.x, p0.y);
  h.ctx.lineTo(p1Actual.x, p1Actual.y);
  h.ctx.arc(p0.x, p0.y, radius, startAngle, endAngle, anticlockwise);
  h.ctx.lineTo(p0.x, p0.y);
  h.ctx.stroke();

  h.ctx.restore();

  // ── Text rendering ────────────────────────────────────────────────────────
  if (drawing.showText !== false && drawing.text) {
    h.drawTextOnLine(p0, p1Actual, drawing);
  }

  // ── Control handles (displayed when selected) ─────────────────────────────
  if (isSelected) {
    h.drawHandle(p0, C_HANDLE, 5); // center
    h.drawHandle(p1Actual, C_HANDLE, 5); // start angle on arc
    h.drawHandle(p2Actual, C_HANDLE, 5); // end angle on arc
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HIT-TEST — TRILATERAL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * [HDR 2026] Production-grade Trilateral Hit-Test for the Sector tool.
 *
 * Detection priority:
 * 1. Handles — center, start, end — generous 15px touch zone.
 * 2. Radial lines — center→p1, center→p2 — 10px tolerance.
 * 3. Arc edge — ring (radius ± BORDER_THRESHOLD) within the angular span.
 * 4. Fill area — interior disk segment within the angular span.
 *
 * This guarantees the tool is reliably selectable from any rendered pixel,
 * on both desktop (precise mouse) and mobile (imprecise touch / long-press).
 */
export function hitTestForecastingSector(
  mx: number,
  my: number,
  pixelPoints: { x: number; y: number }[],
  _drawing: Drawing,
  _chart: EChartsInstance,
  threshold: number = 8 // [SRE-FIX] Default safe baseline for hit-testing
): HitTestResult {
  if (pixelPoints.length < 2) return { isHit: false, hitType: null };

  // Tolerances — caller's threshold is a lower bound (never less than safe defaults)
  // [SRE-RECOVERY] Seuil de détection accru pour une sélection sans friction
  const BORDER_THRESHOLD = Math.max(threshold, 15);

  const p0 = pixelPoints[0];
  const p1 = pixelPoints[1];
  const p2 = pixelPoints[2] || p1;

  // Geometry — identique au renderer, source unique de vérité
  const radius = Math.hypot(p1.x - p0.x, p1.y - p0.y);
  const startAngle = Math.atan2(p1.y - p0.y, p1.x - p0.x);
  const endAngle = Math.atan2(p2.y - p0.y, p2.x - p0.x);

  // Positions exactes des handles aux extrémités de l'arc
  const p1Actual: { x: number; y: number } = {
    x: p0.x + radius * Math.cos(startAngle),
    y: p0.y + radius * Math.sin(startAngle),
  };

  const p2Actual: { x: number; y: number } = {
    x: p0.x + radius * Math.cos(endAngle),
    y: p0.y + radius * Math.sin(endAngle),
  };

  // ── 1. TEST DES HANDLES (Priorité maximale) ─────────────────────────────
  // Note: Déjà partiellement couvert par le manager, mais conservé ici pour
  // la précision des handles de circonférence.
  if (distanceBetweenPoints(mx, my, p0.x, p0.y) < HANDLE_RADIUS) {
    return { isHit: true, hitType: "point", pointIndex: 0 };
  }
  if (distanceBetweenPoints(mx, my, p1Actual.x, p1Actual.y) < HANDLE_RADIUS) {
    return { isHit: true, hitType: "point", pointIndex: 1 };
  }
  if (distanceBetweenPoints(mx, my, p2Actual.x, p2Actual.y) < HANDLE_RADIUS) {
    return { isHit: true, hitType: "point", pointIndex: 2 };
  }

  // ── 2. RAYONS RADIAUX (Bordures du secteur) ──────────────────────────────
  if (distancePointToSegment(mx, my, p0.x, p0.y, p1Actual.x, p1Actual.y) < BORDER_THRESHOLD) {
    return { isHit: true, hitType: "shape" };
  }
  if (distancePointToSegment(mx, my, p0.x, p0.y, p2Actual.x, p2Actual.y) < BORDER_THRESHOLD) {
    return { isHit: true, hitType: "shape" };
  }

  // ── 3. ARC & REMPLISSAGE (Span angulaire) ────────────────────────────────
  // [HDR] Le "mouseAngle" est calculé en coordonnées Canvas (Clockwise).
  const distToCenter = distanceBetweenPoints(mx, my, p0.x, p0.y);
  const mouseAngle = Math.atan2(my - p0.y, mx - p0.x);

  if (isAngleInSector(mouseAngle, startAngle, endAngle)) {
    // Détection de l'arc (périphérie)
    if (distToCenter >= radius - BORDER_THRESHOLD && distToCenter <= radius + BORDER_THRESHOLD) {
      return { isHit: true, hitType: "shape" };
    }
    // Détection de l'intérieur (Remplissage)
    // [SRE] On accepte tout ce qui est plus petit que le rayon - tolérance
    if (distToCenter < radius) {
      return { isHit: true, hitType: "shape" };
    }
  }

  return { isHit: false, hitType: null };
}
