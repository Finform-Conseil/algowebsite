// src/core/presentation/components/pages/Widget/TechnicalAnalysis/lib/strategies/renderers/Forecasting/ForecastingAnchoredVWAPRenderer.ts
import { Drawing, DrawingHelpers, DrawingPoint } from "../../../../config/TechnicalAnalysisTypes";
import { distanceBetweenPoints } from "../../../math/geometry";
import { ChartDataPoint } from "../../../Indicators/TechnicalIndicators";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EChartsInstance = any;

type AnchoredVWAPSource = NonNullable<Drawing["anchoredVWAPProps"]>["source"];

interface AnchoredVWAPPoint {
    time: string | number;
    x: number;
    y: number;
    vwap: number;
    sd: number;
}

interface AnchoredVWAPCacheEntry {
    mainLine: { x: number; y: number }[];
}

const ANCHORED_VWAP_HIT_TOLERANCE_PX = 5;
const anchoredVWAPCache = new WeakMap<Drawing, AnchoredVWAPCacheEntry>();

const clamp = (value: number, min: number, max: number): number =>
    Math.min(max, Math.max(min, value));

const getAnchoredVWAPSourcePrice = (
    bar: ChartDataPoint,
    source: AnchoredVWAPSource,
): number => {
    switch (source) {
        case "open":
            return bar.open;
        case "high":
            return bar.high;
        case "low":
            return bar.low;
        case "close":
            return bar.close;
        case "hl2":
            return (bar.high + bar.low) / 2;
        case "hlc3":
            return (bar.high + bar.low + bar.close) / 3;
        case "ohlc4":
            return (bar.open + bar.high + bar.low + bar.close) / 4;
        case "hlcc4":
            return (bar.high + bar.low + bar.close + bar.close) / 4;
        default:
            return bar.close;
    }
};

const resolveAnchorIndex = (
    chartData: ChartDataPoint[],
    anchorTime: string | number,
): number => {
    const directIndex = chartData.findIndex((bar) => bar.time === anchorTime);
    if (directIndex !== -1) {
        return directIndex;
    }

    const anchorTimestamp =
        typeof anchorTime === "number" ? anchorTime : new Date(anchorTime).getTime();
    if (Number.isNaN(anchorTimestamp)) {
        return -1;
    }

    return chartData.findIndex(
        (bar) => new Date(bar.time).getTime() >= anchorTimestamp,
    );
};

const distanceToSegment = (
    px: number,
    py: number,
    ax: number,
    ay: number,
    bx: number,
    by: number,
): number => {
    const dx = bx - ax;
    const dy = by - ay;

    if (dx === 0 && dy === 0) {
        return Math.hypot(px - ax, py - ay);
    }

    const t = clamp(
        ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy),
        0,
        1,
    );
    const projX = ax + t * dx;
    const projY = ay + t * dy;
    return Math.hypot(px - projX, py - projY);
};

const buildAnchoredVWAPSeries = (
    drawing: Drawing,
    chart: EChartsInstance,
    chartData: ChartDataPoint[],
): AnchoredVWAPPoint[] => {
    const props = drawing.anchoredVWAPProps;
    const anchor = drawing.points[0];

    if (!props || !anchor || !chartData.length) {
        return [];
    }

    const anchorIdx = resolveAnchorIndex(chartData, anchor.time);
    if (anchorIdx === -1) {
        return [];
    }

    // [TENOR 2026] DEFINITIVE FIX: Use { xAxisIndex: 0, yAxisIndex: 0 } to directly target
    // the price axes. This is immune to series ordering, unlike { seriesIndex: N }.
    const PRICE_COORD = { xAxisIndex: 0, yAxisIndex: 0 };

    const points: AnchoredVWAPPoint[] = [];
    let sumPV = 0;
    let sumV = 0;
    let sumDevSqV = 0;

    for (let i = anchorIdx; i < chartData.length; i += 1) {
        const bar = chartData[i];
        const price = getAnchoredVWAPSourcePrice(bar, props.source);
        const volume = bar.volume || 0;

        sumPV += price * volume;
        sumV += volume;

        if (sumV === 0) {
            continue;
        }

        const currentVWAP = sumPV / sumV;
        if (props.calculateStDev) {
            sumDevSqV += Math.pow(price - currentVWAP, 2) * volume;
        }
        const currentSD = props.calculateStDev ? Math.sqrt(sumDevSqV / sumV) : 0;

        const pixelPos = chart.convertToPixel(
            PRICE_COORD,
            [bar.time, currentVWAP],
        );
        if (!pixelPos) {
            continue;
        }

        points.push({
            time: bar.time,
            x: pixelPos[0],
            y: pixelPos[1],
            vwap: currentVWAP,
            sd: currentSD,
        });
    }

    return points;
};

/**
 * [TENOR 2026] Anchored VWAP Renderer (Volume-Based)
 * Implements High-Fidelity cumulative math for VWAP and Standard Deviation Bands.
 * Anchored to a specific candle (P0).
 */
export const renderForecastingAnchoredVWAP = (
    pts: { x: number; y: number }[],
    dataPoints: DrawingPoint[],
    drawing: Drawing,
    chart: EChartsInstance,
    isSelected: boolean,
    h: DrawingHelpers,
    chartData: ChartDataPoint[]
): void => {
    if (pts.length < 1 || !chart || !chartData || chartData.length === 0) return;

    const { ctx } = h;
    const props = drawing.anchoredVWAPProps;
    if (!props) return;
    const vwapPoints = buildAnchoredVWAPSeries(drawing, chart, chartData);
    if (vwapPoints.length < 1) return;
    anchoredVWAPCache.set(drawing, {
        mainLine: vwapPoints.map((point) => ({ x: point.x, y: point.y })),
    });

    // [TENOR 2026] DEFINITIVE FIX: Always target price axis directly.
    const PRICE_COORD = { xAxisIndex: 0, yAxisIndex: 0 };
    const baseFillOpacity = clamp(1 - props.transparency / 100, 0, 1);

    // 3. Render Background Fills (Z-Order: Bottom)
    if (props.fillBackground && props.calculateStDev) {
        ctx.save();
        props.levels.forEach((level) => {
            if (!level.enabled || level.fillOpacity <= 0) return;
            
            const upperPoints: { x: number; y: number }[] = [];
            const lowerPoints: { x: number; y: number }[] = [];

            vwapPoints.forEach(p => {
                const upPrice = p.vwap + (p.sd * level.multiplier);
                const downPrice = p.vwap - (p.sd * level.multiplier);
                
                const upPix = chart.convertToPixel(PRICE_COORD, [p.time, upPrice])?.[1];
                const downPix = chart.convertToPixel(PRICE_COORD, [p.time, downPrice])?.[1];
                
                if (upPix !== undefined) upperPoints.push({ x: p.x, y: upPix });
                if (downPix !== undefined) lowerPoints.push({ x: p.x, y: downPix });
            });

            if (upperPoints.length > 1) {
                ctx.beginPath();
                ctx.moveTo(upperPoints[0].x, upperPoints[0].y);
                upperPoints.forEach(p => ctx.lineTo(p.x, p.y));
                for (let i = lowerPoints.length - 1; i >= 0; i--) {
                    ctx.lineTo(lowerPoints[i].x, lowerPoints[i].y);
                }
                ctx.closePath();
                ctx.fillStyle = level.color;
                ctx.globalAlpha = Math.max(level.fillOpacity, baseFillOpacity);
                ctx.fill();
            }
        });
        ctx.restore();
    }

    // 4. Render Bands (Upper/Lower)
    if (props.calculateStDev) {
        ctx.save();
        props.levels.forEach(level => {
            if (!level.enabled) return;

            h.applyLineDash(level.lineStyle, level.lineWidth);
            ctx.strokeStyle = level.color;
            ctx.globalAlpha = level.lineOpacity;

            // Upper
            ctx.beginPath();
            vwapPoints.forEach((p, i) => {
                const price = p.vwap + (p.sd * level.multiplier);
                const py = chart.convertToPixel(PRICE_COORD, [p.time, price])?.[1];
                if (py !== undefined) {
                    if (i === 0) ctx.moveTo(p.x, py);
                    else ctx.lineTo(p.x, py);
                }
            });
            ctx.stroke();

            // Lower
            ctx.beginPath();
            vwapPoints.forEach((p, i) => {
                const price = p.vwap - (p.sd * level.multiplier);
                const py = chart.convertToPixel(PRICE_COORD, [p.time, price])?.[1];
                if (py !== undefined) {
                    if (i === 0) ctx.moveTo(p.x, py);
                    else ctx.lineTo(p.x, py);
                }
            });
            ctx.stroke();
        });
        ctx.restore();
    }

    // 5. Render Main VWAP Line (Z-Order: Top)
    ctx.save();
    h.applyStyle(drawing.style, false);
    ctx.beginPath();
    vwapPoints.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();
    ctx.restore();

    // 6. Anchor Handle (P0)
    if (isSelected || drawing.isCreating) {
        h.drawHandle(pts[0], "#ffffff", 5);
    }
};

/**
 * Hit testing for Anchored VWAP.
 * Checks main line and handles.
 */
export const hitTestForecastingAnchoredVWAP = (
    mx: number,
    my: number,
    pts: { x: number; y: number }[],
    _drawing: Drawing,
    _chart: EChartsInstance,
    _threshold: number
): { isHit: boolean; hitType: "point" | "shape" | null; pointIndex?: number } => {
    // 1. Check Handle (P0)
    if (pts.length > 0 && distanceBetweenPoints(mx, my, pts[0].x, pts[0].y) < 15) {
        return { isHit: true, hitType: "point", pointIndex: 0 };
    }

    // 2. Check main polyline only. Bands/fills stay non-clickable to avoid accidental selection.
    const cacheEntry = anchoredVWAPCache.get(_drawing);
    const cachedPoints = cacheEntry?.mainLine ?? [];

    for (let i = 1; i < cachedPoints.length; i += 1) {
        const prev = cachedPoints[i - 1];
        const current = cachedPoints[i];
        if (
            distanceToSegment(
                mx,
                my,
                prev.x,
                prev.y,
                current.x,
                current.y,
            ) <= ANCHORED_VWAP_HIT_TOLERANCE_PX
        ) {
            // [TENOR 2026] ANCHORED VWAP: Clicking the line is treated as clicking the anchor (P0).
            // This is intentional TradingView behavior: dragging the line relocates the anchor.
            // We return hitType:"point" so the manager will do Price-Snapping (not shape-move).
            return { isHit: true, hitType: "point", pointIndex: 0 };
        }
    }

    return { isHit: false, hitType: null };
};
