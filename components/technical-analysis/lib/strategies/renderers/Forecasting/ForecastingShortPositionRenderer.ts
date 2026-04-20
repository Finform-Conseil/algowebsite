/**
 * @file ForecastingShortPositionRenderer.ts
 * @description Renderer Canvas 2D haute fidélité (HDR) pour l'outil "Short Position".
 * 
 * @parity TradingView Parity Features:
 * 1. Auto-Clamped Labels: Les labels restent visibles à l'écran même si l'outil déborde.
 * 2. Sub-pixel Rendering: Utilisation de `Math.round(x) + 0.5` pour des lignes 1px nettes.
 * 3. Textes Exacts: Formatage identique ("Target: ... Amount: ...").
 * 4. Drag Resilience: Support des offsets tpOffset/slOffset.
 */

import { HitTestResult, DrawingHelpers } from "../../interfaces/IDrawingStrategy";
import { Drawing, DrawingPoint } from "../../../../config/TechnicalAnalysisTypes";
import { distanceBetweenPoints, isPointInRect } from "../../../math/geometry";
import { renderCustomText } from "../ChartPatterns/support/BaseRendererUtils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EChartsInstance = any;

// --- CONSTANTES DE STYLE (TRADINGVIEW EXACT MATCH) ---
const C_PROFIT_FILL_LIVE  = "rgba(8, 153, 129, 0.50)"; // Vert foncé
const C_PROFIT_BAR        = "#089981";

const C_LOSS_BAR          = "#f23645";

const C_SEP               = "#787b86"; 
const C_DIAGONAL          = "rgba(120, 123, 134, 0.90)"; 
const C_HANDLE            = "#2962ff"; 
const C_PILL              = "rgba(242, 54, 69, 0.85)"; 
const C_PILL_PROFIT       = "rgba(8, 153, 129, 0.85)"; 
const C_TARGET_LABEL_BG   = "#d8df6a";
const C_STOP_LABEL_BG     = "#f23645";
const C_TARGET_LABEL_TXT  = "#121212";
const C_STOP_LABEL_TXT    = "#ffffff";

const LABEL_H    = 22;
const SQ         = 8; 
const CR         = 5; 
const DEFAULT_W  = 200;

// --- UTILITAIRES DE RENDU HDR ---

const crisp = (val: number): number => Math.round(val) + 0.5;

function drawLabelBar(
  ctx: CanvasRenderingContext2D,
  xLeft: number, yTop: number, width: number,
  pct: number, absolutePrice: number,
  pnl: number, qty: number, bgColor: string,
  textColor: string = "#ffffff"
): void {
  const safeWidth = Math.max(120, Math.min(width, 260));
  const cx = crisp(xLeft + (width - safeWidth) / 2);
  const cy = crisp(yTop);
  
  ctx.fillStyle = bgColor;
  ctx.fillRect(cx, cy, safeWidth, LABEL_H);
  
  const priceAbs = Math.abs(absolutePrice);
  const priceStr = priceAbs >= 1000
    ? Math.round(priceAbs).toLocaleString("en-US")
    : priceAbs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pnlAbs = Math.abs(pnl);
  const pnlStr = pnlAbs >= 1000
    ? Math.round(pnlAbs).toLocaleString("en-US")
    : pnlAbs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const qtyStr = qty >= 100 ? Math.round(qty).toLocaleString("en-US") : qty.toFixed(3);
  const label = `${priceStr} (${Math.abs(pct).toFixed(3)}%) ${pnlStr} ${qtyStr}`;

  ctx.save();
  ctx.beginPath();
  ctx.rect(cx + 4, cy, safeWidth - 8, LABEL_H);
  ctx.clip(); 
  ctx.font = "11px Inter, -apple-system, sans-serif";
  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, cx + safeWidth / 2, cy + LABEL_H / 2);
  ctx.restore();
}

function drawSqHandle(ctx: CanvasRenderingContext2D, px: number, py: number): void {
  const cx = crisp(px);
  const cy = crisp(py);
  ctx.save();
  ctx.setLineDash([]);
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = C_HANDLE;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.rect(cx - SQ / 2, cy - SQ / 2, SQ, SQ);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawCircleHandle(ctx: CanvasRenderingContext2D, px: number, py: number): void {
  const cx = crisp(px);
  const cy = crisp(py);
  ctx.save();
  ctx.setLineDash([]);
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = C_HANDLE;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, CR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawRRPill(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  rr: number, currentPnL: number, qty: number,
  isProfit: boolean, textColor: string = "#ffffff"
): void {
  const qtyStr = qty.toFixed(3);
  const pnlAbs = Math.abs(currentPnL);
  const pnlStr = pnlAbs >= 1000
    ? Math.round(pnlAbs).toLocaleString("en-US")
    : pnlAbs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const rrStr = Math.abs(rr).toFixed(3);
  const line1 = `${pnlStr} ↗ ${qtyStr}`;
  const line2 = `${rrStr}`;

  ctx.font = "11px Inter, -apple-system, sans-serif";
  const w1 = ctx.measureText(line1).width;
  const w2 = ctx.measureText(line2).width;
  const boxW = Math.max(88, Math.min(180, Math.max(w1 + 22, w2 + 22)));
  const boxH = 36;
  const bx = crisp(cx - boxW / 2);
  const by = crisp(cy - boxH / 2);

  ctx.save();
  ctx.fillStyle = isProfit ? C_PILL_PROFIT : C_PILL;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(bx, by, boxW, boxH, 4);
  } else {
    ctx.rect(bx, by, boxW, boxH);
  }
  ctx.fill();

  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(line1, cx, by + 5);
  ctx.fillText(line2, cx, by + 21);
  ctx.restore();
}

type SeriesPoint = [string | number, number] | [number, number, number, number];

function getLatestCloseData(chart: EChartsInstance): { x: number; y: number, price: number } | null {
  const opt = chart.getOption();
  const seriesOpt = opt?.series;
  const xAxisOpt = opt?.xAxis;
  if (!seriesOpt?.[0]?.data?.length) return null;
  const allData = seriesOpt[0].data as SeriesPoint[];
  const isCandle = seriesOpt[0].type === "candlestick";
  const last = allData[allData.length - 1];
  if (!Array.isArray(last)) return null;
  let closePrice: number;
  let time: string | number;
  const xAxisData = (Array.isArray(xAxisOpt) ? xAxisOpt[0]?.data : xAxisOpt?.data) ?? [];
  if (isCandle) {
    closePrice = Number(last[1]);
    time = xAxisData[xAxisData.length - 1];
  } else {
    time = last[0];
    closePrice = Number(last[1]);
  }
  const pix = chart.convertToPixel({ seriesIndex: 0 }, [time, closePrice]);
  return pix ? { x: pix[0], y: pix[1], price: closePrice } : null;
}

function getMainGridRect(chart: EChartsInstance): { x: number; y: number; width: number; height: number } | null {
  try {
    const model = chart.getModel();
    const grid = model.getComponent("grid");
    return grid ? grid.coordinateSystem.getRect() : null;
  } catch {
    return null;
  }
}

export function renderForecastingShortPosition(
  pts: { x: number; y: number }[],
  dataPoints: DrawingPoint[],
  drawing: Drawing,
  chart: EChartsInstance,
  isSelected: boolean,
  h: DrawingHelpers
): void {
  if (drawing.points.length === 0) return;
  if (pts.length < 1 || dataPoints.length < 1) return;

  const entry = pts[0];
  const entryTime = dataPoints[0].time;
  const entryPrice = dataPoints[0].value;

  // --- RÉSOLUTION DU BUG DE DRAG (Offsets) ---
  const tpOffset = drawing.tpOffset;
  const slOffset = drawing.slOffset;

  const tpPrice = dataPoints[1]?.value ?? (tpOffset !== undefined ? entryPrice - tpOffset : (drawing.positionProps?.tpPrice ?? (entryPrice * 0.70)));
  const slPrice = dataPoints[2]?.value ?? (slOffset !== undefined ? entryPrice + slOffset : (drawing.positionProps?.slPrice ?? (entryPrice * 1.30)));

  const valueToY = (v: number): number | undefined => 
    chart.convertToPixel({ seriesIndex: 0 }, [entryTime, v])?.[1];

  const tpY = valueToY(tpPrice);
  const slY = valueToY(slPrice);
  const entryY = valueToY(entryPrice);

  if (tpY === undefined || slY === undefined || entryY === undefined) return;

  const width = drawing.positionProps?.width ?? DEFAULT_W;
  const xLeft = entry.x;
  const xRight = xLeft + width;
  const gridRect = getMainGridRect(chart);

  // En Short, tpY > entryY > slY (TP est en dessous).
  const profitTop = Math.min(tpY, entryY);
  const profitBottom = Math.max(tpY, entryY);
  const profitHeight = profitBottom - profitTop;

  const lossTop = Math.min(slY, entryY);
  const lossBottom = Math.max(slY, entryY);
  const lossHeight = lossBottom - lossTop;

  const accountSize = drawing.positionProps?.accountSize ?? 10000;
  const riskPercent = drawing.positionProps?.riskPercent ?? 1;
  const riskAmount = drawing.positionProps?.riskAmount ?? 100;
  const riskDisplayMode = drawing.positionProps?.riskDisplayMode ?? "percent";
  const pointValue = drawing.positionProps?.pointValue ?? 1;
  const lotSize = drawing.positionProps?.lotSize ?? 1;
  const leverage = drawing.positionProps?.leverage ?? 0;
  const qtyPrecision = drawing.positionProps?.qtyPrecision ?? 2;

  const actualRiskAmt = riskDisplayMode === "percent" ? (accountSize * (riskPercent / 100)) : riskAmount;
  const contractPointValue = pointValue * lotSize;
  const riskPerUnit = Math.abs(entryPrice - slPrice);
  const qtyRisk = riskPerUnit > 0 ? actualRiskAmt / (riskPerUnit * contractPointValue) : 0;
  const qtyLvg = leverage > 0 && entryPrice > 0
    ? (accountSize * leverage) / (entryPrice * contractPointValue)
    : Number.POSITIVE_INFINITY;
  const configuredQty = drawing.positionProps?.qty;
  const computedQty = Math.min(qtyRisk, qtyLvg);
  const qtyBase = (typeof configuredQty === "number" && configuredQty > 0) ? configuredQty : computedQty;
  const qty = parseFloat(Math.max(0, qtyBase).toFixed(qtyPrecision));

  const tpDiff = entryPrice - tpPrice;
  const tpPct = (tpDiff / entryPrice) * 100;
  const slDiff = slPrice - entryPrice;
  const slPct = (slDiff / entryPrice) * 100;
  const tpPnL = (entryPrice - tpPrice) * qty * contractPointValue;
  const slPnL = (entryPrice - slPrice) * qty * contractPointValue;

  const rr = slDiff !== 0 ? Math.abs(tpDiff) / Math.abs(slDiff) : 0;

  h.ctx.save();
  try {
    if (gridRect) {
      h.ctx.save();
      h.ctx.beginPath();
      h.ctx.rect(gridRect.x, gridRect.y, gridRect.width, gridRect.height);
      h.ctx.clip();
    }

    // 1. FILLS
    const tpFillColor = drawing.positionProps?.tpColor || C_PROFIT_BAR;
    const slFillColor = drawing.positionProps?.slColor || C_LOSS_BAR;
    const tpOpacity = drawing.positionProps?.tpOpacity ?? 0.22;
    const slOpacity = drawing.positionProps?.slOpacity ?? 0.22;

    h.ctx.save();
    h.ctx.globalAlpha = tpOpacity;
    h.ctx.fillStyle = tpFillColor; // TP (Vert pour Short)
    h.ctx.fillRect(xLeft, profitTop, width, Math.max(0, profitHeight - LABEL_H));
    h.ctx.restore();

    h.ctx.save();
    h.ctx.globalAlpha = slOpacity;
    h.ctx.fillStyle = slFillColor; // SL (Rouge pour Short)
    h.ctx.fillRect(xLeft, lossTop + LABEL_H, width, Math.max(0, lossHeight - LABEL_H));
    h.ctx.restore();

    // 2. FILL LIVE (P&L Latent)
    const latestData = getLatestCloseData(chart);
    let currentPnL = 0;
    if (latestData) {
      const currentPriceY = latestData.y;
      const currentPrice = latestData.price;
      currentPnL = (entryPrice - currentPrice) * qty * contractPointValue;
      if (currentPriceY > entryY) {
        const subTop = Math.max(entryY, profitTop);
        const subBottom = Math.min(currentPriceY, profitBottom - LABEL_H);
        const subH = subBottom - subTop;
        if (subH > 0) {
          h.ctx.fillStyle = C_PROFIT_FILL_LIVE;
          h.ctx.fillRect(xLeft, subTop, width, subH);
        }
      }
    }

    // 3. BORDURES
    const borderColor = drawing.positionProps?.lineColor || drawing.style.color || C_PROFIT_BAR;
    const borderOpacity = drawing.positionProps?.lineOpacity ?? drawing.style.lineOpacity ?? 1;

    h.ctx.save();
    h.ctx.setLineDash([]);
    h.ctx.lineWidth = 1;
    h.ctx.globalAlpha = borderOpacity;
    h.ctx.strokeStyle = borderColor;
    h.ctx.strokeRect(crisp(xLeft), crisp(profitTop), width, profitHeight);
    h.ctx.strokeRect(crisp(xLeft), crisp(lossTop), width, lossHeight);
    h.ctx.restore();

    // 4. LIGNE D'ENTRÉE
    h.ctx.beginPath();
    h.ctx.setLineDash([5, 4]);
    h.ctx.strokeStyle = C_SEP;
    h.ctx.lineWidth = 1.5;
    h.ctx.moveTo(xLeft, crisp(entryY));
    h.ctx.lineTo(xRight, crisp(entryY));
    h.ctx.stroke();

    // 5. DIAGONALE ASYMÉTRIQUE (Zone Profit)
    h.ctx.setLineDash([]);
    h.ctx.save();
    h.ctx.beginPath();
    h.ctx.setLineDash([4, 4]);
    h.ctx.strokeStyle = C_DIAGONAL;
    h.ctx.lineWidth = 1;
    h.ctx.moveTo(crisp(xLeft), crisp(entryY));
    h.ctx.lineTo(crisp(xRight), crisp(tpY));   
    h.ctx.stroke();
    h.ctx.restore();

    // 6. LABELS AUTO-CLAMPED
    const chartTop = gridRect ? gridRect.y : 0;
    const chartBottom = gridRect ? (gridRect.y + gridRect.height) : chart.getHeight();

    // Clamp SL Label (HAUT pour Short): Reste à l'écran, ne descend pas sous l'entrée
    let slLabelY = lossTop;
    if (slLabelY < chartTop) slLabelY = chartTop;
    if (slLabelY > lossBottom - LABEL_H) slLabelY = lossBottom - LABEL_H;

    // Clamp TP Label (BAS pour Short): Reste à l'écran, ne monte pas au-dessus de l'entrée
    let tpLabelY = profitBottom - LABEL_H;
    if (tpLabelY > chartBottom - LABEL_H) tpLabelY = chartBottom - LABEL_H;
    if (tpLabelY < profitTop) tpLabelY = profitTop;

    // Clamp Entry Pill
    let entryPillY = entryY;
    if (entryPillY < chartTop + 18) entryPillY = chartTop + 18;
    if (entryPillY > chartBottom - 18) entryPillY = chartBottom - 18;

    drawLabelBar(h.ctx, xLeft, slLabelY, width, -slPct, slPrice, slPnL, qty, C_STOP_LABEL_BG, C_STOP_LABEL_TXT);
    drawLabelBar(h.ctx, xLeft, tpLabelY, width, tpPct, tpPrice, tpPnL, qty, C_TARGET_LABEL_BG, C_TARGET_LABEL_TXT);
    const rrPillPnL = latestData ? currentPnL : slPnL;
    drawRRPill(h.ctx, xLeft + width / 2, entryPillY, rr, rrPillPnL, qty, rrPillPnL >= 0, "#ffffff");

    // 7. HANDLES
    if (isSelected) {
      drawSqHandle(h.ctx, xLeft, tpY);
      drawSqHandle(h.ctx, xRight, tpY);
      drawSqHandle(h.ctx, xLeft, slY);
      drawSqHandle(h.ctx, xRight, slY);
      drawSqHandle(h.ctx, xRight, entryY);
      drawSqHandle(h.ctx, xLeft + width / 2, tpY);
      drawCircleHandle(h.ctx, xLeft, entryY);
    }

    // --- RENDU DU TEXTE PERSONNALISÉ (HDR) ---
    if (drawing.showText && drawing.text) {
      const pPoints = [
        { x: xLeft, y: Math.min(tpY, slY) },
        { x: xRight, y: Math.max(tpY, slY) }
      ];
      renderCustomText(pPoints, drawing, h);
    }
    if (gridRect) {
      h.ctx.restore();
    }
  } finally {
    h.ctx.restore();
  }
}

export function hitTestForecastingShortPosition(
  mx: number, my: number, pts: { x: number; y: number }[],
  drawing: Drawing, chart: EChartsInstance, threshold: number
): HitTestResult {
  if (pts.length < 1) return { isHit: false, hitType: null };
  const entry = pts[0];
  const entT = drawing.points[0].time;
  const entP = drawing.points[0].value;
  
  const tpOffset = drawing.tpOffset;
  const slOffset = drawing.slOffset;

  const tpP = drawing.points[1]?.value ?? (tpOffset !== undefined ? entP - tpOffset : (drawing.positionProps?.tpPrice ?? (entP * 0.70)));
  const slP = drawing.points[2]?.value ?? (slOffset !== undefined ? entP + slOffset : (drawing.positionProps?.slPrice ?? (entP * 1.30)));
  
  const entryY = chart.convertToPixel({ seriesIndex: 0 }, [entT, entP])?.[1];
  const tpY = chart.convertToPixel({ seriesIndex: 0 }, [entT, tpP])?.[1];
  const slY = chart.convertToPixel({ seriesIndex: 0 }, [entT, slP])?.[1];
  if (entryY === undefined || tpY === undefined || slY === undefined) {
    return { isHit: false, hitType: null };
  }
  const w = drawing.positionProps?.width ?? DEFAULT_W;
  const xL = entry.x;
  const xR = xL + w;
  const ht = SQ + 5;

  if (distanceBetweenPoints(mx, my, xL, entryY) < CR + 8) return { isHit: true, hitType: "shape" };
  if (distanceBetweenPoints(mx, my, xR, entryY) < ht) return { isHit: true, hitType: "width_resize" };
  if (distanceBetweenPoints(mx, my, xL, tpY) < ht) return { isHit: true, hitType: "zone_tp" };
  if (distanceBetweenPoints(mx, my, xR, tpY) < ht) return { isHit: true, hitType: "zone_tp" };
  if (distanceBetweenPoints(mx, my, xL, slY) < ht) return { isHit: true, hitType: "zone_sl" };
  if (distanceBetweenPoints(mx, my, xR, slY) < ht) return { isHit: true, hitType: "zone_sl" };
  if (distanceBetweenPoints(mx, my, xL + w / 2, tpY) < ht) return { isHit: true, hitType: "zone_tp" };

  if (isPointInRect(mx, my, xL, xR, Math.min(tpY, entryY), Math.max(tpY, entryY))) {
    return { isHit: true, hitType: "shape" };
  } 
  if (isPointInRect(mx, my, xL, xR, Math.min(slY, entryY), Math.max(slY, entryY))) {
    return { isHit: true, hitType: "shape" };
  }
  if (mx >= xL && mx <= xR && Math.abs(my - entryY) < threshold + 4) {
    return { isHit: true, hitType: "shape" };
  }
  return { isHit: false, hitType: null };
}
