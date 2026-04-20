/**
 * [TENOR 2026] Utilities for HDR Forecasting Rendering.
 * Extracted for P27 compliance and cross-renderer reuse.
 */

export interface RawBar {
    o: number;
    h: number;
    l: number;
    c: number;
}

export interface ProfileStats {
    bullRatio: number;
    averageRange: number;
    bodyShare: number;
    upperWickShare: number;
    lowerWickShare: number;
}

/**
 * Deterministic pseudo-random generator to ensure flickering-free stochastics.
 */
export function pseudoRandom(seed: number): number {
    const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453123;
    return x - Math.floor(x);
}

/**
 * Safely converts unknown values to finite numbers.
 */
export function asFiniteNumber(value: unknown): number | undefined {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return undefined;
}

/**
 * Clamps a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

/**
 * Injects opacity into any color string (hex/rgba).
 */
export function colorWithOpacity(color: string, opacity: number): string {
    const safeOpacity = clamp(opacity, 0, 1);
    const rgbaMatch = color.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i);
    
    if (rgbaMatch) {
        const r = Number(rgbaMatch[1]);
        const g = Number(rgbaMatch[2]);
        const b = Number(rgbaMatch[3]);
        const a = rgbaMatch[4] !== undefined ? Number(rgbaMatch[4]) : 1;
        return `rgba(${r}, ${g}, ${b}, ${clamp(a * safeOpacity, 0, 1)})`;
    }

    const hex = color.replace("#", "").trim();
    if (/^[0-9a-f]{3}$/i.test(hex)) {
        const r = parseInt(hex[0] + hex[0], 16);
        const g = parseInt(hex[1] + hex[1], 16);
        const b = parseInt(hex[2] + hex[2], 16);
        return `rgba(${r}, ${g}, ${b}, ${safeOpacity})`;
    }
    if (/^[0-9a-f]{6}$/i.test(hex)) {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${safeOpacity})`;
    }
    return color;
}

/**
 * Estimates minimum tick size from historical data.
 */
export function estimateTickSize(data: RawBar[], fallbackPrice: number): number {
    const safeFallback = Math.max(Math.abs(fallbackPrice) * 0.0001, 0.00000001);
    if (data.length === 0) return safeFallback;

    let minDiff = Number.POSITIVE_INFINITY;
    for (let i = 0; i < data.length; i += 1) {
        const bar = data[i];
        const diffs = [
            Math.abs(bar.h - bar.l),
            Math.abs(bar.c - bar.o),
            i > 0 ? Math.abs(bar.c - data[i - 1].c) : Number.NaN,
            i > 0 ? Math.abs(bar.o - data[i - 1].c) : Number.NaN,
        ];
        for (const diff of diffs) {
            if (Number.isFinite(diff) && diff > 0 && diff < minDiff) minDiff = diff;
        }
    }
    return Number.isFinite(minDiff) ? minDiff : safeFallback;
}

/**
 * Snaps a price to the nearest tick.
 */
export function snapToTick(price: number, tick: number): number {
    if (!Number.isFinite(price) || !Number.isFinite(tick) || tick <= 0) return price;
    return Math.round(price / tick) * tick;
}

/**
 * Ensures price is positive for log calculations.
 */
export function safePositive(price: number, tick: number): number {
    return Math.max(price, tick, 0.00000001);
}

/**
 * Interpolates price linearly or logarithmically.
 */
export function interpolatePrice(startPrice: number, endPrice: number, t: number, logMode: boolean, tick: number): number {
    if (!logMode) return startPrice + t * (endPrice - startPrice);
    const p1 = safePositive(startPrice, tick);
    const p2 = safePositive(endPrice, tick);
    return Math.exp(Math.log(p1) + t * (Math.log(p2) - Math.log(p1)));
}

/**
 * Analyzes historical OHLC data to extract behavioral statistics for stochastics.
 */
export function analyzeProfile(bars: RawBar[], tick: number): ProfileStats {
    if (bars.length === 0) {
        return {
            bullRatio: 0.5,
            averageRange: Math.max(100 * tick, tick),
            bodyShare: 0.58,
            upperWickShare: 0.21,
            lowerWickShare: 0.21,
        };
    }

    const lookback = bars.slice(Math.max(0, bars.length - 128));
    let bullCount = 0, rangeSum = 0, bodyShareSum = 0, upperShareSum = 0, lowerShareSum = 0;

    for (const bar of lookback) {
        const range = Math.max(bar.h - bar.l, tick);
        const body = Math.abs(bar.c - bar.o);
        const upper = Math.max(bar.h - Math.max(bar.o, bar.c), 0);
        const lower = Math.max(Math.min(bar.o, bar.c) - bar.l, 0);

        if (bar.c >= bar.o) bullCount += 1;
        rangeSum += range;
        bodyShareSum += clamp(body / range, 0, 1);
        upperShareSum += clamp(upper / range, 0, 1);
        lowerShareSum += clamp(lower / range, 0, 1);
    }

    const count = lookback.length;
    let bodyShare = bodyShareSum / count, upperWickShare = upperShareSum / count, lowerWickShare = lowerShareSum / count;
    const shareSum = bodyShare + upperWickShare + lowerWickShare;
    
    if (shareSum > 0) {
        bodyShare /= shareSum;
        upperWickShare /= shareSum;
        lowerWickShare /= shareSum;
    }

    return {
        bullRatio: clamp(bullCount / count, 0.05, 0.95),
        averageRange: Math.max(rangeSum / count, tick),
        bodyShare: clamp(bodyShare || 0.58, 0.15, 0.80),
        upperWickShare: clamp(upperWickShare || 0.21, 0.05, 0.45),
        lowerWickShare: clamp(lowerWickShare || 0.21, 0.05, 0.45),
    };
}

/**
 * Calculates distance from point to line segment.
 */
export function distancePointToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
    const abx = bx - ax, aby = by - ay, apx = px - ax, apy = py - ay;
    const ab2 = abx * abx + aby * aby;
    if (ab2 === 0) return Math.hypot(px - ax, py - ay);
    const t = clamp((apx * abx + apy * aby) / ab2, 0, 1);
    return Math.hypot(px - (ax + abx * t), py - (ay + aby * t));
}
