// ForecastingPositionForecastRenderer.ts — EXACT TV PARITY
// [TENOR 2026] SCAR-107/108/109 FULLY RESOLVED — TORVALDS /FIX Applied

import { HitTestResult, DrawingHelpers } from "../../interfaces/IDrawingStrategy";
import { Drawing, DrawingPoint } from "../../../../config/TechnicalAnalysisTypes";
import { distanceBetweenPoints } from "../../../math/geometry";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EChartsInstance = any;
type ForecastOutcome = "success" | "failure" | "pending";
type ForecastDrawing = Drawing & { outcome?: ForecastOutcome };
type AxisWithData = { data?: Array<string | number> };
type CandleDatum = [number, number, number, number] | number;
const TOP_RADIUS: [number, number, number, number] = [4, 4, 0, 0];
const BOTTOM_RADIUS: [number, number, number, number] = [0, 0, 4, 4];

const C_SUCCESS   = "#089981"; // TV Green
const C_FAILURE   = "#F23645"; // TV Red

const R_VISUAL   = 5;
const R_HITZONE  = 12;

// Minimum pixel distance between P1/P2 before we shift label placement to avoid overlap
const MIN_LABEL_DIST = 120;

// ─── CRISP HELPER ─────────────────────────────────────────────────────────────
const crisp = (v: number): number => Math.round(v) + 0.5;

function getCurveControlPoint(
    p1: { x: number; y: number },
    p2: { x: number; y: number }
): { x: number; y: number } {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const cpX = (p1.x + p2.x) / 2;
    const trendBend = dy * 0.2;
    const bowMagnitude = Math.min(90, Math.max(18, Math.abs(dx) * 0.16));
    const bowDirection = dy <= 0 ? -1 : 1;
    const cpY = p1.y + trendBend + bowDirection * bowMagnitude;
    return { x: cpX, y: cpY };
}

// ─── [FIX-T1] SCAR-107: AUTHORITATIVE TIME RESOLVER ─────────────────────────
/**
 * Converts a DrawingPoint time (string ISO or numeric ECharts category index)
 * to a real Unix timestamp in milliseconds.
 *
 * Priority:
 *   1. If `time` is a string → parse directly.
 *   2. If `time` is a number >= 1e10 → already a ms timestamp.
 *   3. If `time` is a small number (category index) → look up in chart xAxis.data.
 *   4. Fallback → NaN (caller must handle).
 */
function resolveTimeToMs(time: string | number, chart: EChartsInstance): number {
    if (typeof time === "string") {
        return new Date(time).getTime();
    }
    // Already a Unix timestamp in ms (> year 2001)
    if (time >= 1_000_000_000_000) {
        return time;
    }
    // Numeric index → resolve via chart axis data
    if (chart) {
        try {
            const option    = chart.getOption();
            const xAxis     = (option.xAxis as AxisWithData[])?.[0];
            const axisData  = xAxis?.data as (string | number)[] | undefined;
            if (axisData && axisData.length > 0) {
                const idx = Math.round(time);
                if (idx >= 0 && idx < axisData.length) {
                    return new Date(axisData[idx]).getTime();
                }
                // Future projection: extrapolate gap
                if (idx >= axisData.length) {
                    const last  = axisData.length - 1;
                    const tLast = new Date(axisData[last]).getTime();
                    const tPrev = axisData.length > 1
                        ? new Date(axisData[last - 1]).getTime()
                        : tLast - 86_400_000;
                    const gap   = tLast - tPrev;
                    return tLast + (idx - last) * gap;
                }
            }
        } catch { /* ignore */ }
    }
    // Last-resort: treat as seconds
    return time * 1000;
}

// ─── [FIX-T2] SCAR-108: PERSISTENT OUTCOME WITH HISTORICAL SCAN ──────────────
/**
 * Evaluates the outcome of a forecast and PERSISTS it onto `drawing.outcome`.
 * Once SUCCESS or FAILURE is locked, it never reverts.
 *
 * If the target date is still in the future  → "pending".
 * If target date passed, we scan OHLC history between P1 and P2:
 *   • Bullish (P2 > P0): success if any candle high >= target price.
 *   • Bearish (P2 < P0): success if any candle low  <= target price.
 * Fallback: compare current price against target.
 */
function evaluateOutcome(
    drawing: Drawing,
    dp0: DrawingPoint,
    dp1: DrawingPoint,
    chart: EChartsInstance
): ForecastOutcome {
    const persistentDrawing = drawing as ForecastDrawing;
    // [IMPORTANT] Once locked, never change — prevents live bascules
    if (persistentDrawing.outcome === "success" || persistentDrawing.outcome === "failure") {
        return persistentDrawing.outcome;
    }

    const t1ms = resolveTimeToMs(dp1.time, chart);
    const now  = Date.now();

    if (isNaN(t1ms) || now < t1ms) {
        return "pending";
    }

    const isBullish = dp1.value > dp0.value;
    const target    = dp1.value;
    let result: "success" | "failure" = "failure";

    // Scan historical OHLC candles for a touch of the target
    if (chart) {
        try {
            const option    = chart.getOption();
            const series    = option.series?.[0];
            const axisData  = (option.xAxis as AxisWithData[])?.[0]?.data;
            const t0ms      = resolveTimeToMs(dp0.time, chart);

            if (series?.data && axisData) {
                const candleData = series.data as CandleDatum[];
                for (let i = 0; i < candleData.length; i++) {
                    const bar    = candleData[i];
                    const barMs  = new Date(axisData[i] ?? 0).getTime();
                    if (isNaN(barMs) || barMs < t0ms || barMs > t1ms) continue;

                    // OHLC: [open, close, low, high] — ECharts Candlestick format
                    const high: number = Array.isArray(bar) ? bar[3] : bar;
                    const low:  number = Array.isArray(bar) ? bar[2] : bar;

                    if (isBullish && high >= target) {
                        result = "success";
                        break;
                    }
                    if (!isBullish && low <= target) {
                        result = "success";
                        break;
                    }
                }
            }
        } catch { /* ignore — use current price fallback */ }
    }

    // Fallback: compare latest available price
    if (result !== "success" && chart) {
        try {
            const option      = chart.getOption();
            const series      = option.series?.[0];
            const lastBar     = series?.data?.[series.data.length - 1];
            const currentPrice: number = Array.isArray(lastBar) ? lastBar[1] : lastBar;
            if (typeof currentPrice === "number") {
                result = isBullish
                    ? (currentPrice >= target    ? "success" : "failure")
                    : (currentPrice <= target   ? "success" : "failure");
            }
        } catch { /* ignore */ }
    }

    // Persist — freeze result on drawing object to prevent future recalculations
    persistentDrawing.outcome = result;
    return result;
}

// ─── LABEL RENDERERS ──────────────────────────────────────────────────────────
function drawSourceLabel(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    price: number, date: string,
    placement: 'top' | 'bottom',
    lineColor: string,
    forecastProps?: Drawing["forecastProps"]
): void {
    const showText = forecastProps?.showSourceText !== false;
    if (!showText) return;

    const bgColor = forecastProps?.sourceBackgroundColor || "#673ab7";
    const textColor = forecastProps?.sourceTextColor || "#ffffff";
    const borderColor = forecastProps?.sourceBorderColor || bgColor;

    ctx.save();
    ctx.font = "bold 11px -apple-system, sans-serif";
    const priceStr = Math.round(price).toLocaleString();
    const w = Math.max(
        ctx.measureText(priceStr).width,
        ctx.measureText(date).width
    ) + 16;
    const h = 34;
    const offset = 12;

    // [FIX-T3] Sub-pixel crisp connector
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(crisp(x), crisp(y));
    ctx.lineTo(crisp(x), crisp(placement === 'top' ? y - offset : y + offset));
    ctx.stroke();

    const bx = x - w / 2;
    const by = placement === 'top' ? y - offset - h : y + offset;

    ctx.fillStyle = bgColor;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(bx, by, w, h, 4);
    else ctx.rect(bx, by, w, h);
    ctx.fill();

    if (borderColor !== bgColor) {
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 11px -apple-system, sans-serif";
    ctx.fillText(priceStr, bx + w / 2, by + 11);
    ctx.font = "10px -apple-system, sans-serif";
    ctx.fillText(date, bx + w / 2, by + 24);
    ctx.restore();
}

function drawResultLabel(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    priceDelta: number, pctDelta: number, calDays: number,
    targetPrice: number, targetDate: string,
    outcome: "success" | "failure" | "pending",
    placement: 'top' | 'bottom',
    lineColor: string,
    forecastProps?: Drawing["forecastProps"]
): void {
    const showText = outcome === "pending" 
        ? (forecastProps?.showTargetText !== false)
        : outcome === "success" 
            ? (forecastProps?.showSuccessText !== false)
            : (forecastProps?.showFailureText !== false);
    
    if (!showText) return;

    const badgeColor = outcome === "success" ? (forecastProps?.successBackgroundColor || C_SUCCESS) 
                   : outcome === "failure" ? (forecastProps?.failureBackgroundColor || C_FAILURE) 
                   : (forecastProps?.targetBackgroundColor || "#673ab7");

    const badgeTextColor = outcome === "success" ? (forecastProps?.successTextColor || "#ffffff")
                         : outcome === "failure" ? (forecastProps?.failureTextColor || "#ffffff")
                         : (forecastProps?.targetTextColor || "#ffffff");

    const infoBgColor = forecastProps?.targetBackgroundColor || "#673ab7";
    const infoTextColor = forecastProps?.targetTextColor || "#ffffff";
    const borderColor = outcome === "pending" ? (forecastProps?.targetBorderColor || infoBgColor) : badgeColor;

    ctx.save();
    const badgeText  = outcome === "success" ? "✓ SUCCESS" : outcome === "failure" ? "✗ FAILURE" : "⏳ PENDING";

    const sign     = priceDelta >= 0 ? "+" : "";
    const infoLine1 = `${sign}${Math.round(priceDelta).toLocaleString()} (${sign}${pctDelta.toFixed(2)}%) in ${calDays}d`;
    const infoLine2 = `${Math.round(targetPrice).toLocaleString()}  🕐 ${targetDate}`;

    ctx.font = "bold 11px -apple-system, sans-serif";
    const boxW = Math.max(
        ctx.measureText(infoLine1).width,
        ctx.measureText(infoLine2).width,
        ctx.measureText(badgeText).width
    ) + 20;

    const infoH   = 34;
    const badgeH  = 20;
    const totalH  = infoH + badgeH;
    const offset  = 12;

    // [FIX-T3] Sub-pixel crisp connector
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(crisp(x), crisp(y));
    ctx.lineTo(crisp(x), crisp(placement === 'top' ? y - offset : y + offset));
    ctx.stroke();

    const bx = x - boxW / 2;
    const by = placement === 'top' ? y - offset - totalH : y + offset;

    if (placement === 'top') {
        // Badge (Top)
        ctx.fillStyle = badgeColor;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(bx, by, boxW, badgeH, TOP_RADIUS);
        else ctx.rect(bx, by, boxW, badgeH);
        ctx.fill();

        // Info (Bottom)
        ctx.fillStyle = infoBgColor;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(bx, by + badgeH, boxW, infoH, BOTTOM_RADIUS);
        else ctx.rect(bx, by + badgeH, boxW, infoH);
        ctx.fill();

        if (borderColor !== infoBgColor) {
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        ctx.fillStyle = badgeTextColor;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "bold 10px -apple-system, sans-serif";
        ctx.fillText(badgeText, bx + boxW / 2, by + badgeH / 2);

        ctx.fillStyle = infoTextColor;
        ctx.textAlign = "left";
        ctx.font = "bold 11px -apple-system, sans-serif";
        ctx.fillText(infoLine1, bx + 10, by + badgeH + 11);
        ctx.font = "10px -apple-system, sans-serif";
        ctx.fillText(infoLine2, bx + 10, by + badgeH + 24);
    } else {
        // Info (Top)
        ctx.fillStyle = infoBgColor;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(bx, by, boxW, infoH, TOP_RADIUS);
        else ctx.rect(bx, by, boxW, infoH);
        ctx.fill();

        // Badge (Bottom)
        ctx.fillStyle = badgeColor;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(bx, by + infoH, boxW, badgeH, BOTTOM_RADIUS);
        else ctx.rect(bx, by + infoH, boxW, badgeH);
        ctx.fill();

        if (borderColor !== infoBgColor) {
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        ctx.fillStyle = infoTextColor;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.font = "bold 11px -apple-system, sans-serif";
        ctx.fillText(infoLine1, bx + 10, by + 11);
        ctx.font = "10px -apple-system, sans-serif";
        ctx.fillText(infoLine2, bx + 10, by + 24);

        ctx.fillStyle = badgeTextColor;
        ctx.textAlign = "center";
        ctx.font = "bold 10px -apple-system, sans-serif";
        ctx.fillText(badgeText, bx + boxW / 2, by + infoH + badgeH / 2);
    }
    ctx.restore();
}

// ─── RENDERER ─────────────────────────────────────────────────────────────────
export function renderForecastingPositionForecast(
    pts: { x: number; y: number }[],
    dataPoints: DrawingPoint[],
    drawing: Drawing,
    chart: EChartsInstance,
    isSelected: boolean,
    h: DrawingHelpers
): void {
    if (pts.length < 1) return;

    const ctx       = h.ctx;
    const lineColor = drawing.style?.color    ?? "#673ab7";
    const lineWidth = drawing.style?.lineWidth ?? 2;
    const forecastProps = drawing.forecastProps;

    if (pts.length === 1) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(pts[0].x, pts[0].y, R_VISUAL, 0, Math.PI * 2);
        ctx.fillStyle = lineColor;
        ctx.fill();
        ctx.restore();
        return;
    }

    const P1 = pts[0];
    const P2 = pts[1];

    const cp = getCurveControlPoint(P1, P2);

    // Curve
    ctx.save();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth   = lineWidth;
    ctx.globalAlpha = drawing.style?.lineOpacity ?? 1;
    
    // [FIX-STYLE] Regression: Support dashed/dotted line styles
    const lineStyle = drawing.style?.lineStyle || "solid";
    if (lineStyle === "dashed") {
        ctx.setLineDash([lineWidth * 3, lineWidth * 3]);
    } else if (lineStyle === "dotted") {
        ctx.setLineDash([lineWidth, lineWidth * 2]);
    } else {
        ctx.setLineDash([]);
    }

    ctx.beginPath();
    ctx.moveTo(P1.x, P1.y);
    ctx.quadraticCurveTo(cp.x, cp.y, P2.x, P2.y);
    ctx.stroke();
    ctx.restore();

    // P1 — hollow circle
    const bgColor = chart?.getDom()?.style?.backgroundColor || "#131722";
    ctx.save();
    ctx.beginPath();
    ctx.arc(P1.x, P1.y, R_VISUAL, 0, Math.PI * 2);
    ctx.fillStyle = bgColor;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = lineColor;
    ctx.stroke();
    ctx.restore();

    // P2 — filled dot
    ctx.save();
    ctx.beginPath();
    ctx.arc(P2.x, P2.y, R_VISUAL, 0, Math.PI * 2);
    ctx.fillStyle = lineColor;
    ctx.fill();
    ctx.restore();

    // [FIX-T1] Resolve real timestamps for labels
    const isBullish = P2.y < P1.y;

    // [FIX-MIN-DIST] Anti-overlap: if P1 and P2 are too close vertically,
    // both labels go below/above depending on the opposite side
    const pixelDist = Math.abs(P2.y - P1.y);
    let p1Placement: 'top' | 'bottom';
    let p2Placement: 'top' | 'bottom';

    if (pixelDist < MIN_LABEL_DIST) {
        // Force them apart: P1 below, P2 above (or vice-versa based on which is higher)
        p1Placement = P1.y <= P2.y ? 'top' : 'bottom';
        p2Placement = P2.y < P1.y  ? 'top' : 'bottom';
    } else {
        p1Placement = isBullish ? 'bottom' : 'top';
        p2Placement = isBullish ? 'top'    : 'bottom';
    }

    if (dataPoints.length >= 1) {
        const dp = dataPoints[0];
        const t0ms = resolveTimeToMs(dp.time, chart);
        const t0str = isNaN(t0ms) ? "-" : new Date(t0ms).toISOString().slice(0, 10);
        drawSourceLabel(ctx, P1.x, P1.y, dp.value, t0str, p1Placement, lineColor, forecastProps);
    }

    if (dataPoints.length >= 2) {
        const dp0 = dataPoints[0];
        const dp1 = dataPoints[1];

        const priceDelta = dp1.value - dp0.value;
        const pctDelta   = (priceDelta / dp0.value) * 100;

        const t0ms      = resolveTimeToMs(dp0.time, chart);
        const t1ms      = resolveTimeToMs(dp1.time, chart);
        const calDays   = Math.max(1, Math.round(Math.abs(t1ms - t0ms) / 86_400_000));
        const targetDate = isNaN(t1ms) ? "-" : new Date(t1ms).toISOString().slice(0, 10);

        const outcome = evaluateOutcome(drawing, dp0, dp1, chart);

        drawResultLabel(
            ctx, P2.x, P2.y,
            priceDelta, pctDelta, calDays,
            dp1.value, targetDate,
            outcome, p2Placement, lineColor,
            forecastProps
        );
    }

    // [FIX-TEXT] Render custom text at the peak of the curve
    if (drawing.showText && drawing.text) {
        ctx.save();
        const t = 0.5;
        const mt = 1 - t;
        const tx = mt * mt * P1.x + 2 * mt * t * cp.x + t * t * P2.x;
        const ty = mt * mt * P1.y + 2 * mt * t * cp.y + t * t * P2.y;

        const fSize = drawing.fontSize || 12;
        ctx.font = `${fSize}px -apple-system, sans-serif`;
        ctx.fillStyle = drawing.textColor || "#ffffff";
        ctx.textAlign = (drawing.textAlignmentHorizontal as CanvasTextAlign) || "center";
        ctx.textBaseline = "bottom";
        
        const lines = drawing.text.split('\n');
        const lineHeight = fSize * 1.2;
        const offset = 8;
        
        lines.forEach((line, i) => {
            ctx.fillText(line, tx, ty - offset - (lines.length - 1 - i) * lineHeight);
        });
        ctx.restore();
    }

    if (isSelected) {
        h.drawHandle(P1, lineColor, R_VISUAL);
        h.drawHandle(P2, lineColor, R_VISUAL);
    }
}

// ─── HIT TEST ─────────────────────────────────────────────────────────────────
export function hitTestForecastingPositionForecast(
    mx: number,
    my: number,
    pts: { x: number; y: number }[],
    _drawing: Drawing,
    _chart: EChartsInstance,
    threshold: number
): HitTestResult {
    if (pts.length < 2) return { isHit: false, hitType: null };

    const P1 = pts[0];
    const P2 = pts[1];

    const handleZone = Math.max(threshold, R_HITZONE);

    if (distanceBetweenPoints(mx, my, P1.x, P1.y) <= handleZone) {
        return { isHit: true, hitType: "point", pointIndex: 0 };
    }
    if (distanceBetweenPoints(mx, my, P2.x, P2.y) <= handleZone) {
        return { isHit: true, hitType: "point", pointIndex: 1 };
    }

    const cp = getCurveControlPoint(P1, P2);
    const curveThreshold = Math.max(threshold, 6);

    for (let i = 0; i <= 120; i++) {
        const t  = i / 120;
        const mt = 1 - t;
        const bx = mt*mt*P1.x + 2*mt*t*cp.x + t*t*P2.x;
        const by = mt*mt*P1.y + 2*mt*t*cp.y + t*t*P2.y;
        if ((bx - mx) ** 2 + (by - my) ** 2 <= curveThreshold ** 2) {
            return { isHit: true, hitType: "shape" };
        }
    }

    return { isHit: false, hitType: null };
}
