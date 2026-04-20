import { HitTestResult, DrawingHelpers } from "../../interfaces/IDrawingStrategy";
import { Drawing, DrawingPoint } from "../../../../config/TechnicalAnalysisTypes";
import { calculateLinearRegression } from "../../../math/geometry";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EChartsInstance = any;

export function renderRegressionTrend(
    pts: { x: number; y: number }[],
    dataPoints: DrawingPoint[],
    drawing: Drawing,
    chart: EChartsInstance,
    isSelected: boolean,
    h: DrawingHelpers
) {
    if (pts.length < 1 || !drawing.regressionProps) return;
    const props = drawing.regressionProps;

    const option = chart.getOption();
    const seriesList = (option.series as Array<{ type?: string; data?: (number | null)[][] }>) || [];
    let priceSeriesIndex = seriesList.findIndex((s) => s.type === "candlestick");
    if (priceSeriesIndex === -1) priceSeriesIndex = 0;
    const series = seriesList[priceSeriesIndex];
    if (!series) return;
    const chartData = series.data;
    if (!chartData || chartData.length === 0) return;
    const xAxisList = (option.xAxis as Array<{ data?: string[] }>) || [];
    const xAxisDates = xAxisList[0]?.data || [];
    if (xAxisDates.length === 0) return;

    if (!dataPoints[0]) return;

    // [TENOR 2026 FIX] SCAR-196: dataPoints[0].time is an ISO string, NOT a numeric index.
    // Number("2026-01-01T...") = NaN → Math.round(NaN) = NaN → slice empty → nothing renders.
    // Resolution strategy: look up the time string in xAxisDates first (O(n) but only 2 lookups).
    // Fallback to Number() only for already-numeric times (future-compat).
    const resolveTimeToIndex = (time: string | number): number => {
        if (typeof time === "string") {
            const found = xAxisDates.indexOf(time);
            // If exact match not found, try prefix match (truncated timestamps)
            if (found !== -1) return found;
            const prefix = time.slice(0, 10); // "YYYY-MM-DD"
            const idx = xAxisDates.findIndex(d => d.startsWith(prefix));
            return idx !== -1 ? idx : 0;
        }
        return Math.round(Number(time));
    };

    const p1_idx = resolveTimeToIndex(dataPoints[0].time);
    const p2_idx = dataPoints[1] ? resolveTimeToIndex(dataPoints[1].time) : p1_idx;
    const idx_min = Math.max(0, Math.min(p1_idx, p2_idx));
    const idx_max = Math.min(chartData.length - 1, Math.max(p1_idx, p2_idx));

    const xValues: number[] = [];
    const yValues: number[] = [];
    const sourceIdxMap: Record<string, number> = { open: 0, close: 1, low: 2, high: 3 };

    for (let idx = idx_min; idx <= idx_max; idx++) {
        const d = chartData[idx];
        if (!d) continue;
        let val = 0;
        const s = props.source;
        if (s === "open" || s === "high" || s === "low" || s === "close") {
            val = Number(d[sourceIdxMap[s]]);
        } else {
            const o = Number(d[0]), c = Number(d[1]), l = Number(d[2]), hi = Number(d[3]);
            if (s === "hl2") val = (hi + l) / 2;
            else if (s === "hlc3") val = (hi + l + c) / 3;
            else if (s === "ohlc4") val = (o + hi + l + c) / 4;
            else if (s === "hlcc4") val = (hi + l + c + c) / 4;
        }
        if (!isNaN(val) && isFinite(val)) {
            xValues.push(idx);
            yValues.push(val);
        }
    }


    if (xValues.length < 2) return;
    const ols = calculateLinearRegression(xValues, yValues);

    const startIdx = xValues[0];
    const endIdx = xValues[xValues.length - 1];
    const getPrice = (idx: number, stdDevMult: number) => (ols.slope * idx + ols.intercept) + (stdDevMult * ols.stdDev);

    const toPixel = (t: string, v: number) => {
        const p = chart.convertToPixel({ seriesIndex: 0 }, [t, v]);
        return p ? { x: p[0], y: p[1] } : null;
    };

    const pStartMid = toPixel(xAxisDates[startIdx], getPrice(startIdx, 0));
    const pEndMid = toPixel(xAxisDates[endIdx], getPrice(endIdx, 0));
    const pStartUp = toPixel(xAxisDates[startIdx], getPrice(startIdx, props.upperDev));
    const pEndUp = toPixel(xAxisDates[endIdx], getPrice(endIdx, props.upperDev));
    const pStartDown = toPixel(xAxisDates[startIdx], getPrice(startIdx, props.lowerDev));
    const pEndDown = toPixel(xAxisDates[endIdx], getPrice(endIdx, props.lowerDev));

    if (!pStartMid || !pEndMid || !pStartUp || !pEndUp || !pStartDown || !pEndDown) return;

    if (props.fillBackground && props.showUpLine) {
        h.ctx.save();
        h.ctx.fillStyle = props.upFillColor || "#2196F3";
        h.ctx.globalAlpha = drawing.style.fillOpacity ?? 0.15;
        h.ctx.beginPath();
        h.ctx.moveTo(pStartMid.x, pStartMid.y); h.ctx.lineTo(pEndMid.x, pEndMid.y);
        h.ctx.lineTo(pEndUp.x, pEndUp.y); h.ctx.lineTo(pStartUp.x, pStartUp.y);
        h.ctx.closePath(); h.ctx.fill(); h.ctx.restore();
    }
    if (props.fillBackground && props.showDownLine) {
        h.ctx.save();
        h.ctx.fillStyle = props.downFillColor || "#FFF3E0";
        h.ctx.globalAlpha = drawing.style.fillOpacity ?? 0.15;
        h.ctx.beginPath();
        h.ctx.moveTo(pStartMid.x, pStartMid.y); h.ctx.lineTo(pEndMid.x, pEndMid.y);
        h.ctx.lineTo(pEndDown.x, pEndDown.y); h.ctx.lineTo(pStartDown.x, pStartDown.y);
        h.ctx.closePath(); h.ctx.fill(); h.ctx.restore();
    }

    h.ctx.save();
    const extendLR = (pa: { x: number; y: number }, pb: { x: number; y: number }) => {
        if (!props.extendLines) return { start: pa, end: pb };
        const dx = pb.x - pa.x, dy = pb.y - pa.y;
        return { start: { x: pa.x - dx * 100, y: pa.y - dy * 100 }, end: { x: pb.x + dx * 100, y: pb.y + dy * 100 } };
    };

    if (props.showBaseLine) {
        h.ctx.save();
        h.ctx.strokeStyle = props.baseColor;
        h.ctx.globalAlpha = drawing.style.lineOpacity || 1;
        h.applyLineDash(props.baseLineStyle, props.baseLineWidth);
        const ext = extendLR(pStartMid, pEndMid);
        h.drawSegment(ext.start, ext.end);
        h.ctx.restore();
    }
    if (props.showUpLine) {
        h.ctx.save();
        h.ctx.strokeStyle = props.upColor;
        h.ctx.globalAlpha = drawing.style.lineOpacity || 1;
        h.applyLineDash(props.upLineStyle, props.upLineWidth);
        const ext = extendLR(pStartUp, pEndUp);
        h.drawSegment(ext.start, ext.end);
        h.ctx.restore();
    }
    if (props.showDownLine) {
        h.ctx.save();
        h.ctx.strokeStyle = props.downColor;
        h.ctx.globalAlpha = drawing.style.lineOpacity || 1;
        h.applyLineDash(props.downLineStyle, props.downLineWidth);
        const ext = extendLR(pStartDown, pEndDown);
        h.drawSegment(ext.start, ext.end);
        h.ctx.restore();
    }
    h.ctx.restore();

    if (drawing.showText && drawing.text) h.drawTextOnLine(pStartMid, pEndMid, drawing);

    if (props.showPearsonsR) {
        h.ctx.save();
        const fs = drawing.textItalic ? "italic " : "";
        const fw = drawing.textBold ? "bold " : "";
        const fz = drawing.fontSize || 11;
        h.ctx.fillStyle = drawing.textColor || "#94a3b8";
        h.ctx.font = `${fs}${fw}${fz}px Inter, sans-serif`;
        h.ctx.fillText(ols.r.toFixed(10), pStartDown.x, pStartDown.y + 15);
        h.ctx.restore();
    }

    if (isSelected) {
        h.drawHandle(pStartMid, "#fff", 4);
        h.drawHandle(pEndMid, "#fff", 4);
    }
}

export function hitTestRegressionTrend(
    mx: number,
    my: number,
    points: { x: number; y: number }[],
    drawing: Drawing,
    threshold: number
): HitTestResult {
    if (points.length < 2) return { isHit: false, hitType: null };
    let isHit = false;
    const p1 = points[0]; const p2 = points[1];
    let xMin = Math.min(p1.x, p2.x); let xMax = Math.max(p1.x, p2.x);
    if (drawing.regressionProps?.extendLines) { xMin = -10000; xMax = 20000; }
    if (mx >= xMin - threshold && mx <= xMax + threshold) {
        isHit = true;
    }
    return { isHit, hitType: isHit ? 'shape' : null };
}
