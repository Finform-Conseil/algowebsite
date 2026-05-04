/**
 * @file ForecastingLongPositionRenderer.ts
 * @description Renderer Canvas 2D haute fidélité (HDR) pour l'outil "Long Position".
 * 
 * @parity TradingView Parity Features:
 * 1. Auto-Clamped Labels: Les labels restent visibles à l'écran même si l'outil déborde.
 * 2. Sub-pixel Rendering: Utilisation de `Math.round(x) + 0.5` pour des lignes 1px nettes.
 * 3. Textes Exacts: Formatage identique aux captures TV ("Target: ... Amount: ...").
 * 4. P&L Latent: Zone vert foncé dynamique basée sur le prix actuel.
 * 
 * @architecture_note 🚨 FIX POUR LE BUG DE DRAG ("Décalé, inégale") 🚨
 * Si votre outil se déforme lorsque vous le déplacez verticalement, c'est parce que votre
 * `DrawingManager` déplace uniquement le point d'entrée (`points[0]`), laissant les prix
 * absolus `tpPrice` et `slPrice` fixes.
 * 
 * POUR FIXER CELA, votre DrawingManager DOIT faire l'une de ces deux choses :
 * Option A : Fournir `tpOffset` et `slOffset` dans `positionProps` (différence de prix par rapport à l'entrée).
 * Option B : Utiliser 3 points dans `drawing.points` (0: Entry, 1: TP, 2: SL) pour que le manager les translate tous.
 * 
 * Ce renderer supporte ces deux options dynamiquement pour garantir un corps rigide au drag.
 */

import { HitTestResult, DrawingHelpers } from "../../interfaces/IDrawingStrategy";
import { Drawing, DrawingPoint } from "../../../../config/TechnicalAnalysisTypes";
import { distanceBetweenPoints, isPointInRect } from "../../../math/geometry";
import { renderCustomText } from "../ChartPatterns/support/BaseRendererUtils";
import type { EChartsInstance, EChartsWithModel } from "../../../types/echarts";

type SeriesOptionLite = {
  type?: string;
  data?: SeriesPoint[];
};

type XAxisOptionLite = {
  data?: Array<string | number>;
};

// --- CONSTANTES DE STYLE (TRADINGVIEW EXACT MATCH) ---
const C_PROFIT_FILL_LIVE  = "rgba(8, 153, 129, 0.50)"; // Zone vert foncé (P&L latent)
const C_PROFIT_BORDER     = "#089981";
const C_PROFIT_BAR        = "#089981";

const C_LOSS_BAR          = "#f23645";

const C_SEP               = "#787b86"; // Ligne d'entrée pointillée
const C_DIAGONAL          = "rgba(120, 123, 134, 0.90)"; // Diagonale grise
const C_HANDLE            = "#2962ff"; // Bleu TradingView pour les ancres
const C_PILL              = "rgba(242, 54, 69, 0.92)"; // Fond du label central si en perte
const C_PILL_PROFIT       = "rgba(8, 153, 129, 0.85)"; // Fond du label central si en profit
const C_TARGET_LABEL_BG   = "#d8df6a";
const C_STOP_LABEL_BG     = "#f23645";
const C_TARGET_LABEL_TXT  = "#121212";
const C_STOP_LABEL_TXT    = "#ffffff";

const LABEL_H    = 22;
const SQ         = 8; // Taille des ancres carrées
const CR         = 5; // Rayon des ancres circulaires
const DEFAULT_W  = 200;

// --- UTILITAIRES DE RENDU HDR ---

/**
 * Aligne les coordonnées sur la grille des pixels pour éviter l'anti-aliasing flou du Canvas.
 */
const crisp = (val: number): number => Math.round(val) + 0.5;

/**
 * Dessine la barre de label (Target ou Stop) avec auto-clamping
 */
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
  
  // Compact TV-like: "7,602 (9.982%) 7,602 1250"
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
  ctx.clip(); // Empêche le texte de baver hors de la boîte
  ctx.font = "11px Inter, -apple-system, sans-serif";
  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, cx + safeWidth / 2, cy + LABEL_H / 2);
  ctx.restore();
}

/**
 * Dessine une ancre carrée de redimensionnement
 */
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

/**
 * Dessine une ancre circulaire (point d'origine)
 */
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

/**
 * Dessine le label central (Risk/Reward Pill) avec auto-clamping
 */
function drawRRPill(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  rr: number, currentPnL: number, qty: number,
  isProfit: boolean, textColor: string = "#ffffff"
): void {
  const qtyStr = qty >= 1 ? qty.toFixed(3) : qty.toFixed(3);
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

/**
 * Récupère les données de la dernière bougie pour le P&L latent
 */
type SeriesPoint = [string | number, number] | [number, number, number, number];

function getLatestCloseData(chart: EChartsInstance): { x: number; y: number, price: number } | null {
  const opt = chart.getOption();
  const seriesOpt = Array.isArray(opt.series) ? (opt.series as SeriesOptionLite[]) : [];
  const xAxisOpt = Array.isArray(opt.xAxis) ? (opt.xAxis as XAxisOptionLite[]) : opt.xAxis ? [opt.xAxis as XAxisOptionLite] : [];

  if (!seriesOpt[0]?.data?.length) return null;

  const allData = seriesOpt[0].data;
  const isCandle = seriesOpt[0].type === "candlestick";
  const last = allData[allData.length - 1];

  if (!Array.isArray(last)) return null;

  let closePrice: number;
  let time: string | number;

  const xAxisData = xAxisOpt[0]?.data ?? [];

  if (isCandle) {
    closePrice = Number(last[1]);
    time = xAxisData[xAxisData.length - 1];
  } else {
    // [TENOR 2026] For non-candle, it's usually [time, value] or [index, value]
    time = last[0];
    closePrice = Number(last[1]);
  }

  const pix = chart.convertToPixel({ seriesIndex: 0 }, [time, closePrice]);
  return pix ? { x: pix[0], y: pix[1], price: closePrice } : null;
}

function getMainGridRect(chart: EChartsInstance): { x: number; y: number; width: number; height: number } | null {
  try {
    const model = (chart as EChartsWithModel).getModel?.();
    if (!model) return null;
    const grid = model.getComponent("grid");
    return grid?.coordinateSystem?.getRect() ?? null;
  } catch {
    return null;
  }
}

/**
 * FONCTION PRINCIPALE DE RENDU
 */
export function renderForecastingLongPosition(
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

  // --- RÉSOLUTION DU BUG DE DRAG ---
  // On priorise les offsets ou les points additionnels pour garantir un corps rigide au drag.
  const tpOffset = drawing.tpOffset;
  const slOffset = drawing.slOffset;

  const tpPrice = dataPoints[1]?.value ?? (tpOffset !== undefined ? entryPrice + tpOffset : (drawing.positionProps?.tpPrice ?? (entryPrice * 1.30)));
  const slPrice = dataPoints[2]?.value ?? (slOffset !== undefined ? entryPrice - slOffset : (drawing.positionProps?.slPrice ?? (entryPrice * 0.70)));

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

  // En Canvas, Y=0 est en haut. Pour un Long, tpY < entryY < slY.
  const profitTop = Math.min(tpY, entryY);
  const profitBottom = Math.max(tpY, entryY);
  const profitHeight = profitBottom - profitTop;

  const lossTop = Math.min(slY, entryY);
  const lossBottom = Math.max(slY, entryY);
  const lossHeight = lossBottom - lossTop;

  // --- CALCULS FINANCIERS ---
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

  const tpDiff = tpPrice - entryPrice;
  const tpPct = (tpDiff / entryPrice) * 100;
  const tpPnL = tpDiff * qty * contractPointValue;

  const slDiff = entryPrice - slPrice;
  const slPct = (slDiff / entryPrice) * 100;
  const slPnL = (slPrice - entryPrice) * qty * contractPointValue;

  // Protection division par zéro
  const rr = slDiff !== 0 ? Math.abs(tpDiff) / Math.abs(slDiff) : 0;
  h.ctx.save();
  try {
    // Draw only inside the main price grid (avoid leaking into volume pane).
    if (gridRect) {
      h.ctx.save();
      h.ctx.beginPath();
      h.ctx.rect(gridRect.x, gridRect.y, gridRect.width, gridRect.height);
      h.ctx.clip();
    }

    // 1. FILLS (Fonds translucides)
    const tpFillColor = drawing.positionProps?.tpColor || C_PROFIT_BAR;
    const slFillColor = drawing.positionProps?.slColor || C_LOSS_BAR;
    const tpOpacity = drawing.positionProps?.tpOpacity ?? 0.22;
    const slOpacity = drawing.positionProps?.slOpacity ?? 0.22;

    h.ctx.fillStyle = tpFillColor.startsWith("rgba") ? tpFillColor : `${tpFillColor}${Math.round(tpOpacity * 255).toString(16).padStart(2, "0")}`;
    // Fallback to simple rgba if hex+alpha is tricky in this env, but hex8 is standard.
    // Actually, let's use a safer approach for colors.
    h.ctx.save();
    h.ctx.globalAlpha = tpOpacity;
    h.ctx.fillStyle = tpFillColor;
    h.ctx.fillRect(xLeft, profitTop + LABEL_H, width, Math.max(0, profitHeight - LABEL_H));
    h.ctx.restore();

    h.ctx.save();
    h.ctx.globalAlpha = slOpacity;
    h.ctx.fillStyle = slFillColor;
    h.ctx.fillRect(xLeft, lossTop, width, Math.max(0, lossHeight - LABEL_H));
    h.ctx.restore();

    // 2. FILL LIVE (P&L Latent - Vert foncé)
    const latestData = getLatestCloseData(chart);
    let currentPnL = 0;
    if (latestData) {
      const currentPriceY = latestData.y;
      const currentPrice = latestData.price;
      currentPnL = (currentPrice - entryPrice) * qty * contractPointValue;
      
      // Si le prix actuel est au-dessus de l'entrée (Y plus petit)
      if (currentPriceY < entryY) {
        // On clamp le haut de la zone live au TP maximum
        const subTop = Math.max(currentPriceY, profitTop + LABEL_H);
        const subBottom = Math.min(entryY, profitBottom);
        const subH = subBottom - subTop;
        if (subH > 0) {
          h.ctx.fillStyle = C_PROFIT_FILL_LIVE;
          h.ctx.fillRect(xLeft, subTop, width, subH);
        }
      }
    }

    // 3. BORDURES
    const borderColor = drawing.positionProps?.lineColor || drawing.style.color || C_PROFIT_BORDER;
    const borderOpacity = drawing.positionProps?.lineOpacity ?? drawing.style.lineOpacity ?? 1;

    h.ctx.save();
    h.ctx.setLineDash([]);
    h.ctx.lineWidth = 1; // 1px net
    h.ctx.globalAlpha = borderOpacity;
    h.ctx.strokeStyle = borderColor;
    h.ctx.strokeRect(crisp(xLeft), crisp(profitTop), width, profitHeight);
    h.ctx.strokeRect(crisp(xLeft), crisp(lossTop), width, lossHeight);
    h.ctx.restore();

    // 4. LIGNE D'ENTRÉE (Pointillée centrale)
    h.ctx.beginPath();
    h.ctx.setLineDash([5, 4]);
    h.ctx.strokeStyle = C_SEP;
    h.ctx.lineWidth = 1.5;
    h.ctx.moveTo(xLeft, crisp(entryY));
    h.ctx.lineTo(xRight, crisp(entryY));
    h.ctx.stroke();

    // 5. DIAGONALE ASYMÉTRIQUE (Uniquement dans la zone Profit pour un Long)
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

    // 6. LABELS AUTO-CLAMPED (Flottants)
    const chartTop = gridRect ? gridRect.y : 0;
    const chartBottom = gridRect ? (gridRect.y + gridRect.height) : chart.getHeight();

    // Clamp TP Label: Reste à l'écran en haut, mais ne descend pas sous l'entrée
    let tpLabelY = profitTop;
    if (tpLabelY < chartTop) tpLabelY = chartTop;
    if (tpLabelY > profitBottom - LABEL_H) tpLabelY = profitBottom - LABEL_H;

    // Clamp SL Label: Reste à l'écran en bas, mais ne monte pas au-dessus de l'entrée
    let slLabelY = lossBottom - LABEL_H;
    if (slLabelY > chartBottom - LABEL_H) slLabelY = chartBottom - LABEL_H;
    if (slLabelY < lossTop) slLabelY = lossTop;

    // Clamp Entry Pill: Reste à l'écran
    let entryPillY = entryY;
    if (entryPillY < chartTop + 18) entryPillY = chartTop + 18;
    if (entryPillY > chartBottom - 18) entryPillY = chartBottom - 18;

    drawLabelBar(h.ctx, xLeft, tpLabelY, width, tpPct, tpPrice, tpPnL, qty, C_TARGET_LABEL_BG, C_TARGET_LABEL_TXT);
    drawLabelBar(h.ctx, xLeft, slLabelY, width, -slPct, slPrice, slPnL, qty, C_STOP_LABEL_BG, C_STOP_LABEL_TXT);
    const rrPillPnL = latestData ? currentPnL : slPnL;
    drawRRPill(h.ctx, xLeft + width / 2, entryPillY, rr, rrPillPnL, qty, rrPillPnL >= 0, "#ffffff");

    // 7. HANDLES (Ancres de redimensionnement)
    if (isSelected) {
      drawSqHandle(h.ctx, xLeft, tpY);
      drawSqHandle(h.ctx, xRight, tpY);
      drawSqHandle(h.ctx, xLeft, slY);
      drawSqHandle(h.ctx, xRight, slY);
      drawSqHandle(h.ctx, xRight, entryY);
      drawSqHandle(h.ctx, xLeft + width / 2, slY);
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
    // Garantie absolue de restauration du contexte Canvas
    h.ctx.restore();
  }
}

/**
 * FONCTION DE DÉTECTION DE CLIC (HIT TEST)
 */
export function hitTestForecastingLongPosition(
  mx: number, my: number, pts: { x: number; y: number }[],
  drawing: Drawing,
  chart: EChartsInstance,
  threshold: number
): HitTestResult {
  if (pts.length < 1) return { isHit: false, hitType: null };
  const entry = pts[0];
  const entT = drawing.points[0].time;
  const entP = drawing.points[0].value;

  // Résolution identique au renderer pour garantir la cohérence de la hitbox
  const tpOffset = drawing.tpOffset;
  const slOffset = drawing.slOffset;

  const tpP = drawing.points[1]?.value ?? (tpOffset !== undefined ? entP + tpOffset : (drawing.positionProps?.tpPrice ?? (entP * 1.30)));
  const slP = drawing.points[2]?.value ?? (slOffset !== undefined ? entP - slOffset : (drawing.positionProps?.slPrice ?? (entP * 0.70)));

  const entryY = chart.convertToPixel({ seriesIndex: 0 }, [entT, entP])?.[1];
  const tpY = chart.convertToPixel({ seriesIndex: 0 }, [entT, tpP])?.[1];
  const slY = chart.convertToPixel({ seriesIndex: 0 }, [entT, slP])?.[1];

  if (entryY === undefined || tpY === undefined || slY === undefined) {
    return { isHit: false, hitType: null };
  }

  const w = drawing.positionProps?.width ?? DEFAULT_W;
  const xL = entry.x;
  const xR = xL + w;
  const ht = SQ + 5; // Hitbox tolerance for handles

  // Test des ancres (Priorité haute)
  if (distanceBetweenPoints(mx, my, xL, entryY) < CR + 8) return { isHit: true, hitType: "shape" };
  if (distanceBetweenPoints(mx, my, xR, entryY) < ht) return { isHit: true, hitType: "width_resize" };
  if (distanceBetweenPoints(mx, my, xL, tpY) < ht) return { isHit: true, hitType: "zone_tp" };
  if (distanceBetweenPoints(mx, my, xR, tpY) < ht) return { isHit: true, hitType: "zone_tp" };
  if (distanceBetweenPoints(mx, my, xL, slY) < ht) return { isHit: true, hitType: "zone_sl" };
  if (distanceBetweenPoints(mx, my, xR, slY) < ht) return { isHit: true, hitType: "zone_sl" };
  if (distanceBetweenPoints(mx, my, xL + w / 2, slY) < ht) return { isHit: true, hitType: "zone_sl" };

  // Test des zones de remplissage (Priorité basse)
  if (isPointInRect(mx, my, xL, xR, Math.min(tpY, entryY), Math.max(tpY, entryY))) {
    return { isHit: true, hitType: "shape" };
  }
  if (isPointInRect(mx, my, xL, xR, Math.min(slY, entryY), Math.max(slY, entryY))) {
    return { isHit: true, hitType: "shape" };
  }

  // Test de la ligne d'entrée
  if (mx >= xL && mx <= xR && Math.abs(my - entryY) < threshold + 4) {
    return { isHit: true, hitType: "shape" };
  }

  return { isHit: false, hitType: null };
}
