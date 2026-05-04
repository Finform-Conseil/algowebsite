// src/.../FixedRangeVolumeProfileRenderer.ts
// [TENOR 2026] FRVP HDR GOLD STANDARD V9 — HDR CONSECRATION.
// SCAR-188-190 COMPLETE. Final resolution for Grid Clipping and Pure-Y Axis.
// Engineering Excellence: Sub-pixel rendering, Optimized WeakMap Cache, 
// and Strict Grid Enforcement.

import { Drawing, DrawingHelpers, DrawingPoint } from "../../../../config/TechnicalAnalysisTypes";
import { distanceBetweenPoints } from "../../../math/geometry";
import { ChartDataPoint } from "../../../Indicators/TechnicalIndicators";
import type { EChartsInstance, EChartsWithModel } from "../../../types/echarts";

interface VolumeBin {
    price: number;
    upVolume: number;
    downVolume: number;
    totalVolume: number;
}

interface VolumeProfileData {
    bins: VolumeBin[];
    pocPrice: number;
    vahPrice: number;
    valPrice: number;
    maxVolume: number;
    totalVolume: number;
    vahIdx: number;
    valIdx: number;
    rangeHigh: number;
    rangeLow: number;
}

// [HDR PERFORMANCE] Stable memoization cache for heavy Temporal ranges
const profileCache = new Map<string, VolumeProfileData>();
// Secondary map for instant hit-testing based on the last computed state for an ID
const latestProfileMap = new Map<string, VolumeProfileData>();

// Limit cache size to prevent memory leaks in long sessions
const MAX_CACHE_ENTRIES = 50;
const addToCache = (drawingId: string, cacheKey: string, data: VolumeProfileData) => {
    if (profileCache.size >= MAX_CACHE_ENTRIES) {
        const firstKey = profileCache.keys().next().value;
        if (firstKey) profileCache.delete(firstKey);
    }
    profileCache.set(cacheKey, data);
    latestProfileMap.set(drawingId, data);
};



const formatVolume = (vol: number): string => {
    if (vol >= 1_000_000_000) return (vol / 1_000_000_000).toFixed(2) + "B";
    if (vol >= 1_000_000) return (vol / 1_000_000).toFixed(2) + "M";
    if (vol >= 1_000) return (vol / 1_000).toFixed(1) + "K";
    return vol.toFixed(0);
};

const resolveBarIndex = (chartData: ChartDataPoint[], anchorTime: string | number): number => {
    const directIdx = chartData.findIndex(bar => bar.time === anchorTime);
    if (directIdx !== -1) return directIdx;
    const anchorTs = typeof anchorTime === "number" ? anchorTime : new Date(String(anchorTime)).getTime();
    if (Number.isNaN(anchorTs)) return -1;
    let minDiff = Infinity;
    let nearest = -1;
    for (let i = 0; i < chartData.length; i++) {
        const barTs = new Date(chartData[i].time).getTime();
        const diff = Math.abs(barTs - anchorTs);
        if (diff < minDiff) { minDiff = diff; nearest = i; }
    }
    return nearest;
};

const getPriceAxisInfo = (chart: EChartsInstance): { yAxisIdx: number; gridIdx: number } => {
    try {
        const option = chart.getOption();
        const seriesList = (option?.series as { type: string; yAxisIndex?: number; gridIndex?: number }[]) || [];
        const candlestick = seriesList.find(s => s.type === "candlestick");
        return {
            yAxisIdx: candlestick?.yAxisIndex ?? 0,
            gridIdx: candlestick?.gridIndex ?? 0
        };
    } catch {
        return { yAxisIdx: 0, gridIdx: 0 };
    }
};

const getGridRect = (chart: EChartsInstance, gridIdx: number) => {
    try {
        const model = (chart as EChartsWithModel).getModel?.();
        if (!model) return null;
        const grid = model.getComponent("grid", gridIdx);
        return grid?.coordinateSystem?.getRect() ?? null;
    } catch {
        return null;
    }
};

const calculateVolumeProfileHDR = (
    chartData: ChartDataPoint[],
    startIndex: number,
    endIndex: number,
    numRows: number = 24,
    valueAreaPercent: number = 70
): VolumeProfileData | null => {
    if (startIndex > endIndex) [startIndex, endIndex] = [endIndex, startIndex];
    const rangeData = chartData.slice(Math.max(0, startIndex), Math.min(chartData.length, endIndex + 1));
    if (rangeData.length === 0) return null;

    let minPrice = Infinity, maxPrice = -Infinity, totalVolume = 0;
    rangeData.forEach(bar => {
        if (bar.low < minPrice) minPrice = bar.low;
        if (bar.high > maxPrice) maxPrice = bar.high;
        totalVolume += (bar.volume || 0);
    });

    if (minPrice === Infinity || maxPrice === -Infinity || totalVolume === 0) return null;

    const rowSize = (maxPrice - minPrice) / numRows;
    if (rowSize === 0) return null;

    const bins: VolumeBin[] = Array.from({ length: numRows }, (_, i) => ({
        price: minPrice + i * rowSize + rowSize / 2,
        upVolume: 0,
        downVolume: 0,
        totalVolume: 0
    }));

    rangeData.forEach(bar => {
        const isUp = bar.close > bar.open; 
        const vol = bar.volume || 0;
        const lowIdx = Math.floor((bar.low - minPrice) / rowSize);
        const highIdx = Math.floor((bar.high - minPrice) / rowSize);

        if (lowIdx === highIdx) {
            const idx = Math.max(0, Math.min(numRows - 1, lowIdx));
            if (isUp) bins[idx].upVolume += vol; else bins[idx].downVolume += vol;
            bins[idx].totalVolume += vol;
        } else {
            const span = highIdx - lowIdx + 1;
            const volPerBin = vol / span;
            for (let i = lowIdx; i <= highIdx; i++) {
                const idx = Math.max(0, Math.min(numRows - 1, i));
                if (isUp) bins[idx].upVolume += volPerBin; else bins[idx].downVolume += volPerBin;
                bins[idx].totalVolume += volPerBin;
            }
        }
    });

    let maxBinVol = 0, pocIdx = 0;
    bins.forEach((bin, i) => {
        if (bin.totalVolume > maxBinVol) {
            maxBinVol = bin.totalVolume;
            pocIdx = i;
        }
    });

    if (maxBinVol === 0) return null;

    const targetArea = totalVolume * (valueAreaPercent / 100);
    let currentArea = maxBinVol;
    let upIdx = pocIdx;
    let downIdx = pocIdx;

    while (currentArea < targetArea && (upIdx < numRows - 1 || downIdx > 0)) {
        const upNext = upIdx < numRows - 1 ? bins[upIdx + 1].totalVolume : 0;
        const downNext = downIdx > 0 ? bins[downIdx - 1].totalVolume : 0;
        if (upNext >= downNext && upIdx < numRows - 1) { upIdx++; currentArea += upNext; }
        else if (downIdx > 0) { downIdx--; currentArea += downNext; }
        else break;
    }

    return {
        bins,
        pocPrice: bins[pocIdx].price,
        maxVolume: maxBinVol,
        totalVolume,
        vahPrice: bins[upIdx].price + rowSize / 2,
        valPrice: bins[downIdx].price - rowSize / 2,
        vahIdx: upIdx,
        valIdx: downIdx,
        rangeHigh: maxPrice,
        rangeLow: minPrice
    };
};

/**
 * [TENOR 2026] FRVP HDR MASTERPIECE RENDERER (V9)
 */
export const renderFixedRangeVolumeProfile = (
    pts: { x: number; y: number }[],
    dataPoints: DrawingPoint[],
    drawing: Drawing,
    chart: EChartsInstance,
    isSelected: boolean,
    h: DrawingHelpers,
    chartData: ChartDataPoint[]
): void => {
    if (!chart || !chartData || chartData.length === 0) return;

    const { ctx } = h;
    const { yAxisIdx, gridIdx } = getPriceAxisInfo(chart);
    const gridRect = getGridRect(chart, gridIdx);

    const props = drawing.anchoredVolumeProfileProps || {
        layout: "Number of Rows", rowSize: 24, volume: "Up/Down", valueAreaVolume: 70,
        upColor: "rgba(0, 188, 212, 0.4)", downColor: "rgba(233, 30, 99, 0.4)",
        vaUpColor: "rgba(0, 188, 212, 0.8)", vaDownColor: "rgba(233, 30, 99, 0.8)",
        pocColor: "#000000", width: 40, placement: "Left", showLabels: true
    };

    // --- 1ST CLICK PREVIEW ---
    if (pts.length === 1) {
        ctx.save();
        ctx.setLineDash([5, 5]); ctx.strokeStyle = "rgba(0, 188, 212, 0.8)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(pts[0].x, 0); ctx.lineTo(pts[0].x, ctx.canvas.height); ctx.stroke();
        ctx.beginPath(); ctx.arc(pts[0].x, pts[0].y, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff"; ctx.fill();
        ctx.strokeStyle = "#00bcd4"; ctx.setLineDash([]); ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
        return;
    }

    if (pts.length < 2 || !dataPoints[0] || !dataPoints[1]) return;

    const startIdx = resolveBarIndex(chartData, dataPoints[0].time);
    const endIdx = resolveBarIndex(chartData, dataPoints[1].time);
    if (startIdx === -1 || endIdx === -1) return;

    // --- HDR PURE-Y CONVERSION ---
    const toY = (price: number): number => {
        const py = chart.convertToPixel({ yAxisIndex: yAxisIdx }, price);
        return typeof py === "number" ? Math.round(py) : 0;
    };

    const numRows = props.layout === "Number of Rows" ? props.rowSize : 24;
    
    // [HDR STABILITY KEY] Composite fingerprint: ID + Temporal Range + Config
    const cacheKey = `${drawing.id}_${Math.min(startIdx, endIdx)}_${Math.max(startIdx, endIdx)}_${numRows}_${props.valueAreaVolume}`;
    let profile: VolumeProfileData | null | undefined = profileCache.get(cacheKey);

    if (!profile || drawing.isCreating) {
        profile = calculateVolumeProfileHDR(chartData, startIdx, endIdx, numRows, props.valueAreaVolume);
        if (profile) addToCache(drawing.id, cacheKey, profile);
    }
    if (!profile) return;



    const minX = Math.min(pts[0].x, pts[1].x);
    const maxX = Math.max(pts[0].x, pts[1].x);
    const spanWidth = Math.abs(pts[1].x - pts[0].x);
    const maxWidth = spanWidth * (props.width / 100);
    const anchorX = props.placement === "Left" ? minX : maxX;
    const growthDir = props.placement === "Left" ? 1 : -1;

    const pT0 = toY(profile.bins[0].price);
    const pT1 = toY(profile.bins[1].price);
    const rowH = Math.abs(pT0 - pT1);
    // [HDR STABILIZATION] Optimized row height for high-volume ranges
    const binH = Math.min(120, Math.max(1, rowH - 0.5));

    ctx.save();
    
    // [HDR CLIPPING] Ensuring drawing is strictly confined to the price pane
    if (gridRect) {
        ctx.beginPath();
        ctx.rect(gridRect.x, gridRect.y, gridRect.width, gridRect.height);
        ctx.clip();
    }

    // [SKY-BOX] Background selection area
    const rangeYHigh = toY(profile.rangeHigh);
    const rangeYLow = toY(profile.rangeLow);
    ctx.fillStyle = "rgba(30, 144, 255, 0.06)";
    ctx.fillRect(minX, Math.min(rangeYHigh, rangeYLow), spanWidth, Math.abs(rangeYHigh - rangeYLow));

    // [HISTOGRAM RENDERING]
    profile.bins.forEach((bin, i) => {
        const binY = toY(bin.price);
        // [HDR ELASTICITY] Pure floating point calculation for perfectly fluid stretch
        const upW = (bin.upVolume / profile!.maxVolume) * maxWidth;
        const downW = (bin.downVolume / profile!.maxVolume) * maxWidth;
        const isInVA = i <= profile!.vahIdx && i >= profile!.valIdx;

        // Up Volume
        ctx.fillStyle = isInVA ? props.vaUpColor : props.upColor;
        ctx.fillRect(anchorX, binY - binH / 2, growthDir * upW, binH);
        
        // Down Volume
        ctx.fillStyle = isInVA ? props.vaDownColor : props.downColor;
        ctx.fillRect(anchorX + growthDir * upW, binY - binH / 2, growthDir * downW, binH);

        // Volume Labels
        if (props.showLabels && maxWidth > 70 && rowH > 12) {
            ctx.font = "bold 9px Inter, Roboto, sans-serif";
            ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
            ctx.textAlign = props.placement === "Left" ? "left" : "right";
            const labelX = anchorX + growthDir * (upW + downW + 8);
            ctx.fillText(formatVolume(bin.totalVolume), labelX, binY + 3);
        }
    });

    // [VAH / VAL MARKS]
    const renderLimit = (price: number, label: string) => {
        const y = toY(price);
        ctx.setLineDash([3, 3]); ctx.strokeStyle = "rgba(120, 123, 134, 0.5)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(minX, y); ctx.lineTo(maxX, y); ctx.stroke();
        ctx.setLineDash([]); ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.font = "9px Inter, Arial"; ctx.textAlign = props.placement === "Left" ? "left" : "right";
        const tx = props.placement === "Left" ? maxX + 5 : minX - 5;
        ctx.fillText(label, tx, y + 3);
    };
    renderLimit(profile.vahPrice, "VAH");
    renderLimit(profile.valPrice, "VAL");

    // [OBSIDIAN POC] Definitive Point of Control.
    const pocY = toY(profile.pocPrice);
    ctx.setLineDash([]); ctx.strokeStyle = props.pocColor || "#000000"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(minX, pocY); ctx.lineTo(maxX, pocY); ctx.stroke();

    ctx.restore();

    // [VERTICAL RAILS] 
    ctx.save();
    if (gridRect) {
        ctx.beginPath(); ctx.rect(gridRect.x, gridRect.y, gridRect.width, gridRect.height); ctx.clip();
    }
    ctx.setLineDash([5, 5]); ctx.strokeStyle = "rgba(120, 123, 134, 0.4)"; ctx.lineWidth = 1;
    ctx.beginPath(); 
    ctx.moveTo(pts[0].x, 0); ctx.lineTo(pts[0].x, ctx.canvas.height);
    ctx.moveTo(pts[1].x, 0); ctx.lineTo(pts[1].x, ctx.canvas.height);
    ctx.stroke();
    ctx.restore();

    // [HANDLES] Sapphire interaction handles
    if (isSelected || drawing.isCreating) {
        const drawHandle = (p: { x: number; y: number }) => {
            ctx.shadowBlur = 4; ctx.shadowColor = "rgba(0,0,0,0.3)";
            ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
            ctx.fillStyle = "#ffffff"; ctx.fill();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = "#2196f3"; ctx.lineWidth = 2.5; ctx.stroke();
        };
        drawHandle(pts[0]); drawHandle(pts[1]);
    }
};

export const hitTestFixedRangeVolumeProfile = (
    mx: number,
    my: number,
    pts: { x: number; y: number }[],
    drawing: Drawing,
    chart: EChartsInstance,
    _threshold: number
): { isHit: boolean; hitType: "point" | "shape" | null; pointIndex?: number } => {
    if (pts.length < 2) return { isHit: false, hitType: null };

    // 1. PRIORITÉ ABSOLUE : Saisie des Points A et B (Handles)
    const handleRadius = 18;
    for (let i = 0; i < pts.length; i++) {
        if (distanceBetweenPoints(mx, my, pts[i].x, pts[i].y) < handleRadius) {
            return { isHit: true, hitType: "point", pointIndex: i };
        }
    }

    // 2. COLLISION DE FORME (Histogramme)
    // On utilise latestProfileMap (défini au sommet du module) pour retrouver l'état calculé.
    const activeProfile = latestProfileMap.get(drawing.id);
    if (activeProfile) {
        const { yAxisIdx } = getPriceAxisInfo(chart);
        const mapToY = (price: number): number => {
            const py = chart.convertToPixel({ yAxisIndex: yAxisIdx }, price);
            return typeof py === "number" ? Math.round(py) : 0;
        };

        const yH = mapToY(activeProfile.rangeHigh);
        const yL = mapToY(activeProfile.rangeLow);
        const t = Math.min(yH, yL);
        const b = Math.max(yH, yL);
        
        const l = Math.min(pts[0].x, pts[1].x);
        const r = Math.max(pts[0].x, pts[1].x);

        // Marge de tolérance de 5px
        if (mx >= l - 5 && mx <= r + 5 && my >= t - 5 && my <= b + 5) {
            return { isHit: true, hitType: "shape" };
        }
    }

    return { isHit: false, hitType: null };
};
