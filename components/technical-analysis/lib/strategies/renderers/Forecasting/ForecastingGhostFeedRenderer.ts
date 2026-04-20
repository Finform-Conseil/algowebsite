/**
 * [TENOR 2026] Forecasting Ghost Feed Renderer
 * High-Fidelity (HDR) Stochastic Engine with O(1) Canvas Batching.
 * Strictly compliant with VAC-150 (Price Stability) and PAT-146 (Performance).
 */

import { Drawing, DrawingHelpers, BarPatternProps, HitTestResult } from "../../../../config/TechnicalAnalysisTypes";
import {
    asFiniteNumber,
    pseudoRandom,
    colorWithOpacity,
    estimateTickSize,
    snapToTick,
    interpolatePrice,
    analyzeProfile,
    distancePointToSegment,
    RawBar
} from "./ForecastingUtils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EChartsInstance = any;

type PixelPoint = { x: number; y: number };

type LogicalDrawingPoint = {
    index?: number;
    logicalIndex?: number;
    barIndex?: number;
    bar?: number;
    x?: number;
    time?: number;
    value?: number;
};

type CandleGeometry = {
    x: number;
    wickTop: number;
    wickBottom: number;
    bodyLeft: number;
    bodyTop: number;
    bodyWidth: number;
    bodyHeight: number;
    bullish: boolean;
};

type RenderCache = {
    path: PixelPoint[];
    candles: CandleGeometry[];
};

const WICK_COLOR = "#787b86";
const TREND_COLOR = "#787b86";
const ANCHOR_STROKE = "#2962ff";
const ANCHOR_FILL = "#ffffff";
const ANCHOR_R = 5;

const DEFAULT_REF_PRICE = 100;
const MIN_BODY_PX = 2;
const MAX_CANDLES_PER_SEGMENT = 800;

const renderCache = new WeakMap<object, RenderCache>();

// --- RESOLVERS ---

function convertDataPointToPixel(chart: EChartsInstance, logicalX: number, price: number): PixelPoint | undefined {
    const finder = { seriesIndex: 0 };
    try {
        const res = chart?.convertToPixel?.(finder, [logicalX, price]) || 
                    chart?.convertToPixel?.("grid", [logicalX, price]);
        if (Array.isArray(res) && res.length >= 2) return { x: Number(res[0]), y: Number(res[1]) };
    } catch { /* Fallback */ }
    return undefined;
}

function convertPixelToDataPoint(chart: EChartsInstance, point: PixelPoint): { x: number; y: number } | undefined {
    try {
        const res = chart?.convertFromPixel?.({ seriesIndex: 0 }, [point.x, point.y]) ||
                    chart?.convertFromPixel?.("grid", [point.x, point.y]);
        if (Array.isArray(res) && res.length >= 2) return { x: Number(res[0]), y: Number(res[1]) };
    } catch { /* Fallback */ }
    return undefined;
}

function resolveAnchorPrice(drawing: Drawing, pointIndex: number, pixelPoint: PixelPoint, chart: EChartsInstance, fallback: number): number {
    const val = asFiniteNumber(drawing.points[pointIndex]?.value);
    if (val !== undefined) return val;
    return convertPixelToDataPoint(chart, pixelPoint)?.y ?? fallback;
}

function resolveAnchorIndex(drawing: Drawing, pointIndex: number, pixelPoint: PixelPoint, chart: EChartsInstance): number | undefined {
    const p = drawing.points[pointIndex] as LogicalDrawingPoint;
    const candidates = [p?.logicalIndex, p?.index, p?.barIndex, p?.bar, p?.x, p?.time];
    for (const c of candidates) {
        const n = asFiniteNumber(c);
        if (n !== undefined) return Math.round(n);
    }
    const fromPixel = convertPixelToDataPoint(chart, pixelPoint)?.x;
    return fromPixel !== undefined ? Math.round(fromPixel) : undefined;
}

// --- GEOMETRY BUILDERS ---

function buildPriceDrivenGeometry(chart: EChartsInstance, logicalIndex: number | undefined, xPixel: number, open: number, high: number, low: number, close: number, halfWidth: number): CandleGeometry | undefined {
    if (logicalIndex === undefined) return undefined;
    const pO = convertDataPointToPixel(chart, logicalIndex, open);
    const pH = convertDataPointToPixel(chart, logicalIndex, high);
    const pL = convertDataPointToPixel(chart, logicalIndex, low);
    const pC = convertDataPointToPixel(chart, logicalIndex, close);
    if (!pO || !pH || !pL || !pC) return undefined;

    return {
        x: Math.round(xPixel) + 0.5,
        wickTop: Math.round(Math.min(pH.y, pL.y)),
        wickBottom: Math.round(Math.max(pH.y, pL.y)),
        bodyLeft: Math.round(xPixel - halfWidth),
        bodyTop: Math.round(Math.min(pO.y, pC.y)),
        bodyWidth: Math.max(2, Math.round(halfWidth * 2)),
        bodyHeight: Math.max(MIN_BODY_PX, Math.round(Math.abs(pC.y - pO.y))),
        bullish: close >= open,
    };
}

// --- CORE RENDER ---

export function renderForecastingGhostFeed(pts: PixelPoint[], drawing: Drawing, chart: EChartsInstance, isSelected: boolean, h: DrawingHelpers): void {
    if (!chart || !h?.ctx || pts.length === 0) return;
    const ctx = h.ctx;
    const props = (drawing.barPatternProps || {}) as BarPatternProps;
    const data = (props.data as unknown as RawBar[]) || [];
    
    const refPrice = asFiniteNumber(drawing.points[0]?.value) ?? convertPixelToDataPoint(chart, pts[0])?.y ?? DEFAULT_REF_PRICE;
    const tickSize = estimateTickSize(data, refPrice);
    const stats = analyzeProfile(data, tickSize);
    const pxPerBar = Math.abs((convertDataPointToPixel(chart, 1, refPrice)?.x ?? 0) - (convertDataPointToPixel(chart, 0, refPrice)?.x ?? 0)) || 10;
    const halfWidth = Math.max(1, Math.floor(pxPerBar * 0.4));
    const isCreating = Boolean(drawing.isCreating);

    if (pts.length < 2) {
        if (isSelected || isCreating) {
            ctx.beginPath(); ctx.arc(pts[0].x, pts[0].y, ANCHOR_R, 0, Math.PI * 2);
            ctx.fillStyle = ANCHOR_FILL; ctx.strokeStyle = ANCHOR_STROKE; ctx.fill(); ctx.stroke();
        }
        return;
    }

    const candleGeometries: CandleGeometry[] = [];
    let previousClose: number | null = null;

    for (let seg = 0; seg < pts.length - 1; seg++) {
        const p1 = pts[seg], p2 = pts[seg+1];
        const pr1 = resolveAnchorPrice(drawing, seg, p1, chart, refPrice);
        const pr2 = resolveAnchorPrice(drawing, seg+1, p2, chart, pr1);
        const idx1 = resolveAnchorIndex(drawing, seg, p1, chart);
        const idx2 = resolveAnchorIndex(drawing, seg+1, p2, chart);
        const bars = (idx1 !== undefined && idx2 !== undefined) ? Math.max(1, Math.abs(idx2 - idx1)) : Math.max(1, Math.round(Math.abs(p2.x - p1.x) / pxPerBar));
        const stride = Math.max(1, Math.ceil(bars / MAX_CANDLES_PER_SEGMENT));

        for (let l = 0; l <= bars; l += stride) {
            if (l === 0 && seg > 0) continue;
            const t = l / bars;
            const idx = idx1 !== undefined ? idx1 + l * (idx2! >= idx1 ? 1 : -1) : undefined;
            const x = idx !== undefined ? convertDataPointToPixel(chart, idx, pr1)?.x ?? p1.x + t*(p2.x-p1.x) : p1.x + t*(p2.x-p1.x);
            const guide = interpolatePrice(pr1, pr2, t, props.logMode ?? true, tickSize);
            
            const seed = (seg+1)*1000003 + (idx ?? l)*8191 + 17;
            const target = snapToTick(guide + (pseudoRandom(seed+1)-0.5)*(props.variance ?? 100)*tickSize*0.35, tickSize);
            const open: number = previousClose ?? snapToTick(target - (pr2>=pr1?1:-1)*(props.variance ?? 100)*tickSize*0.18, tickSize);
            let bullish = pseudoRandom(seed+2) < (stats.bullRatio + (pr2>=pr1?0.18:-0.18));
            if (props.flipped) bullish = !bullish;
            
            let close = snapToTick(open + (target - open)*0.6 + (bullish?1:-1)*(props.variance ?? 100)*tickSize*0.5, tickSize);
            if (close === open) close += bullish ? tickSize : -tickSize;
            
            const range = Math.max((props.avgHL??100)*tickSize, stats.averageRange) * (0.85 + pseudoRandom(seed+4)*0.3);
            const high = snapToTick(Math.max(open, close) + range * stats.upperWickShare, tickSize);
            const low = snapToTick(Math.min(open, close) - range * stats.lowerWickShare, tickSize);
            previousClose = close;

            const geom = buildPriceDrivenGeometry(chart, idx, x, open, high, low, close, halfWidth);
            if (geom) candleGeometries.push(geom);
        }
    }

    // --- BATCH RENDERING (PAT-146) ---
    ctx.save();
    const op = props.opacity ?? 1;

    // 1. Trend Line (Matches drawing.style.color for color sync as requested by user)
    const trendColor = drawing.style.color || TREND_COLOR;
    ctx.strokeStyle = colorWithOpacity(trendColor, op * 0.6);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();

    // 2. Wicks
    if (props.showWicks !== false) {
        ctx.strokeStyle = colorWithOpacity(props.wickColor || WICK_COLOR, op);
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (const g of candleGeometries) {
            ctx.moveTo(g.x, g.wickTop);
            ctx.lineTo(g.x, g.wickBottom);
        }
        ctx.stroke();
    }

    // 3. Bodies & Borders
    const drawPool = (fillColor: string, borderColor: string, pool: CandleGeometry[]) => {
        // Fill
        ctx.fillStyle = colorWithOpacity(fillColor, op);
        for (const g of pool) {
            ctx.fillRect(g.bodyLeft, g.bodyTop, g.bodyWidth, g.bodyHeight);
        }

        // Borders
        if (props.showBorders !== false) {
            ctx.strokeStyle = colorWithOpacity(borderColor, op);
            ctx.lineWidth = 1;
            for (const g of pool) {
                ctx.strokeRect(g.bodyLeft, g.bodyTop, g.bodyWidth, g.bodyHeight);
            }
        }
    };

    const bullFill = props.bullColor || "#26a69a";
    const bullBorder = props.bullBorderColor || bullFill;
    const bearFill = props.bearColor || "#ef5350";
    const bearBorder = props.bearBorderColor || bearFill;

    drawPool(bullFill, bullBorder, candleGeometries.filter(g => g.bullish));
    drawPool(bearFill, bearBorder, candleGeometries.filter(g => !g.bullish));
    
    if (isSelected || isCreating) pts.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, ANCHOR_R, 0, Math.PI * 2);
        ctx.fillStyle = ANCHOR_FILL; ctx.strokeStyle = ANCHOR_STROKE; ctx.fill(); ctx.stroke();
    });
    ctx.restore();
    renderCache.set(drawing as object, { path: pts, candles: candleGeometries });
}

export function hitTestForecastingGhostFeed(mx: number, my: number, pts: PixelPoint[], drawing: Drawing, _c: EChartsInstance, threshold: number): HitTestResult {
    const th = Math.max(4, threshold);
    for (let i = 0; i < pts.length; i++) if (Math.hypot(mx - pts[i].x, my - pts[i].y) <= ANCHOR_R + 5) return { isHit: true, hitType: "point", pointIndex: i } as const;
    const cached = renderCache.get(drawing as object);
    if (cached) {
        for (const g of cached.candles) {
            if (mx >= g.bodyLeft - th && mx <= g.bodyLeft + g.bodyWidth + th && my >= g.bodyTop - th && my <= g.bodyTop + g.bodyHeight + th) return { isHit: true, hitType: "shape" } as const;
            if (Math.abs(mx - g.x) <= th && my >= g.wickTop - th && my <= g.wickBottom + th) return { isHit: true, hitType: "shape" } as const;
        }
        for (let i = 0; i < cached.path.length - 1; i++) if (distancePointToSegment(mx, my, cached.path[i].x, cached.path[i].y, cached.path[i+1].x, cached.path[i+1].y) <= th) return { isHit: true, hitType: "shape" } as const;
    }
    return { isHit: false, hitType: null };
}
