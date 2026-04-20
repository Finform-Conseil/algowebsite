import { HitTestResult, DrawingHelpers } from "../../interfaces/IDrawingStrategy";
import { Drawing, DrawingPoint } from "../../../../config/TechnicalAnalysisTypes";
import { EChartsInstance, getGridRect } from "./support/FibonacciUtils";

import { distToSegment } from "../../../math/geometry";

type Point = { x: number; y: number };

function getRenderRect(chart: EChartsInstance, h: DrawingHelpers) {
    const gridRect = getGridRect(chart);
    if (!gridRect) {
        return {
            xMin: 0,
            yMin: 0,
            xMax: h.logicalWidth,
            yMax: h.logicalHeight,
        };
    }
    return {
        xMin: gridRect.x,
        yMin: gridRect.y,
        xMax: gridRect.x + gridRect.width,
        yMax: gridRect.y + gridRect.height,
    };
}

function rayRectIntersection(origin: Point, direction: Point, rect: { xMin: number; yMin: number; xMax: number; yMax: number }, forward: boolean): Point | null {
    const EPS = 1e-6;
    const candidates: number[] = [];
    const dx = direction.x;
    const dy = direction.y;

    if (Math.abs(dx) > EPS) {
        const txMin = (rect.xMin - origin.x) / dx;
        const txMax = (rect.xMax - origin.x) / dx;
        const yAtMin = origin.y + txMin * dy;
        const yAtMax = origin.y + txMax * dy;
        if (yAtMin >= rect.yMin - EPS && yAtMin <= rect.yMax + EPS) candidates.push(txMin);
        if (yAtMax >= rect.yMin - EPS && yAtMax <= rect.yMax + EPS) candidates.push(txMax);
    }

    if (Math.abs(dy) > EPS) {
        const tyMin = (rect.yMin - origin.y) / dy;
        const tyMax = (rect.yMax - origin.y) / dy;
        const xAtMin = origin.x + tyMin * dx;
        const xAtMax = origin.x + tyMax * dx;
        if (xAtMin >= rect.xMin - EPS && xAtMin <= rect.xMax + EPS) candidates.push(tyMin);
        if (xAtMax >= rect.xMin - EPS && xAtMax <= rect.xMax + EPS) candidates.push(tyMax);
    }

    const valid = candidates.filter(t => forward ? t > EPS : t < -EPS);
    if (valid.length === 0) return null;

    const t = forward ? Math.min(...valid) : Math.max(...valid);
    return { x: origin.x + t * dx, y: origin.y + t * dy };
}

function resolveRaySegment(origin: Point, target: Point, rect: { xMin: number; yMin: number; xMax: number; yMax: number }, extendLines: "none" | "left" | "right" | "both"): { start: Point; end: Point } {
    const direction = { x: target.x - origin.x, y: target.y - origin.y };
    const forwardIntersection = rayRectIntersection(origin, direction, rect, true);
    const backwardIntersection = rayRectIntersection(origin, direction, rect, false);

    const start = (extendLines === "left" || extendLines === "both") && backwardIntersection
        ? backwardIntersection
        : origin;
    const end = (extendLines === "right" || extendLines === "both") && forwardIntersection
        ? forwardIntersection
        : target;

    return { start, end };
}

export function renderFibSpeedResistanceFan(
    pts: { x: number; y: number }[],
    dataPoints: DrawingPoint[],
    drawing: Drawing,
    chart: EChartsInstance,
    isSelected: boolean,
    h: DrawingHelpers
) {
    if (pts.length < 2 || !drawing.fibProps?.fanProps) return;
    const { fanProps } = drawing.fibProps;
    const origin = fanProps.reverse ? pts[1] : pts[0];
    const anchor = fanProps.reverse ? pts[0] : pts[1];
    const dx = anchor.x - origin.x;
    const dy = anchor.y - origin.y;
    if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) return;

    const renderRect = getRenderRect(chart, h);
    const extendLines = fanProps.extendLines || "none";

    // 1. FULL FIBONACCI GRID (Orthogonal grid anchored on fan geometry)
    if (fanProps.gridEnabled) {
        h.ctx.save();
        h.applyStyle({ ...drawing.style, lineStyle: fanProps.gridStyle || "solid", lineWidth: 1, color: "#2962ff" }, false);
        h.ctx.globalAlpha = 0.25;

        const gridLevels = Array.from(new Set([
            ...fanProps.priceLevels.map(l => l.value),
            ...fanProps.timeLevels.map(l => l.value)
        ])).sort((a, b) => a - b);

        gridLevels.forEach(val => {
            const vx = origin.x + dx * val;
            const vy = origin.y + dy * val;

            // Vertical line
            h.ctx.beginPath(); h.ctx.moveTo(vx, -10000); h.ctx.lineTo(vx, 10000); h.ctx.stroke();
            // Horizontal line
            h.ctx.beginPath(); h.ctx.moveTo(-10000, vy); h.ctx.lineTo(10000, vy); h.ctx.stroke();
        });
        h.ctx.restore();
    }

    // 2. RAYS + ORDERING
    const activeRays = [
        ...fanProps.priceLevels.filter(l => l.enabled).map(l => ({
            ...l,
            type: "price" as const,
            target: { x: origin.x + dx, y: origin.y + dy * l.value },
        })),
        ...fanProps.timeLevels.filter(l => l.enabled).map(l => ({
            ...l,
            type: "time" as const,
            target: { x: origin.x + dx * l.value, y: origin.y + dy },
        })),
    ].map(r => ({
        ...r,
        angle: Math.atan2(r.target.y - origin.y, r.target.x - origin.x),
        segment: resolveRaySegment(origin, r.target, renderRect, extendLines),
    }));

    // Sort rays by angle to ensure continuous wedges
    const sortedRays = activeRays.sort((a, b) => a.angle - b.angle);

    if (fanProps.fillBackground && sortedRays.length > 1) {
        h.ctx.save();
        // [TENOR 2026] Normalized HDR fill opacity
        h.ctx.globalAlpha = (fanProps.fillOpacity ?? 0.15);
        
        for (let i = 0; i < sortedRays.length - 1; i++) {
            const r1 = sortedRays[i];
            const r2 = sortedRays[i + 1];
            
            // Standard TradingView pattern: fill wedge with level color or override
            const fillColor = fanProps.useOneColor ? (fanProps.oneColor || drawing.style.color) : r2.color;
            h.ctx.fillStyle = fillColor;

            h.ctx.beginPath();
            h.ctx.moveTo(origin.x, origin.y);
            h.ctx.lineTo(r1.segment.end.x, r1.segment.end.y);
            h.ctx.lineTo(r2.segment.end.x, r2.segment.end.y);
            h.ctx.closePath();
            h.ctx.fill();
        }
        h.ctx.restore();
    }

    // 3. RAYS RENDERING
    sortedRays.forEach((r) => {
        h.ctx.save();
        h.ctx.strokeStyle = r.color;
        h.ctx.globalAlpha = r.lineOpacity ?? 1;
        h.applyStyle({ ...drawing.style, color: r.color }, false);
        h.ctx.beginPath();
        h.ctx.moveTo(r.segment.start.x, r.segment.start.y);
        h.ctx.lineTo(r.segment.end.x, r.segment.end.y);
        h.ctx.stroke();
        h.ctx.restore();

        // LABELS
        const showLabel = r.type === 'price'
            ? (dx > 0 ? fanProps.showPriceLabels.right : fanProps.showPriceLabels.left)
            : (dy > 0 ? fanProps.showTimeLabels.bottom : fanProps.showTimeLabels.top);

        if (showLabel) {
            h.ctx.save();
            const fontSize = drawing.fontSize || 10;
            h.ctx.font = `${drawing.textBold ? "bold " : ""}${drawing.textItalic ? "italic " : ""}${fontSize}px Inter, sans-serif`;
            h.ctx.fillStyle = fanProps.useOneColor ? (fanProps.oneColor || drawing.style.color) : r.color;
            h.ctx.textAlign = r.type === 'price' ? (dx > 0 ? "left" : "right") : "center";
            h.ctx.textBaseline = r.type === 'price' ? "middle" : (dy > 0 ? "top" : "bottom");

            const labelMargin = 5;
            const labelText = parseFloat(r.value.toFixed(3)).toString();
            const labelX = r.type === 'price' ? anchor.x + (dx > 0 ? labelMargin : -labelMargin) : (origin.x + dx * r.value);
            const labelY = r.type === 'price' ? (origin.y + dy * r.value) : anchor.y + (dy > 0 ? labelMargin : -labelMargin);

            h.ctx.fillText(labelText, labelX, labelY);
            h.ctx.restore();
        }
    });

    if (isSelected) { h.drawHandle(origin); h.drawHandle(anchor); }
}

export function hitTestFibSpeedResistanceFan(
    mx: number,
    my: number,
    points: { x: number; y: number }[],
    drawing: Drawing,
    threshold: number
): HitTestResult {
    if (points.length < 2 || !drawing.fibProps?.fanProps) return { isHit: false, hitType: null };
    const { fanProps } = drawing.fibProps;
    const origin = fanProps.reverse ? points[1] : points[0];
    const anchor = fanProps.reverse ? points[0] : points[1];
    const dx = anchor.x - origin.x;
    const dy = anchor.y - origin.y;
    
    // Check Rays (same geometry as renderer)
    const extendLines = fanProps.extendLines || "none";
    const extendLeft = extendLines === "left" || extendLines === "both";
    const extendRight = extendLines === "right" || extendLines === "both";
    const activeRays = [
        ...fanProps.priceLevels.filter(l => l.enabled).map(l => ({ ...l, target: { x: origin.x + dx, y: origin.y + dy * l.value } })),
        ...fanProps.timeLevels.filter(l => l.enabled).map(l => ({ ...l, target: { x: origin.x + dx * l.value, y: origin.y + dy } }))
    ];

    for (const l of activeRays) {
        if (distToSegment(mx, my, origin.x, origin.y, l.target.x, l.target.y, extendLeft, extendRight) < threshold) {
            return { isHit: true, hitType: 'shape' }; 
        }
    }

    // Check Grid lines
    if (fanProps.gridEnabled) {
        const gridLevels = Array.from(new Set([
            ...fanProps.priceLevels.map(l => l.value),
            ...fanProps.timeLevels.map(l => l.value)
        ]));
        for (const val of gridLevels) {
            const vx = origin.x + dx * val;
            const vy = origin.y + dy * val;
            if (Math.abs(mx - vx) < threshold || Math.abs(my - vy) < threshold) {
                return { isHit: true, hitType: 'shape' };
            }
        }
    }

    return { isHit: false, hitType: null };
}
