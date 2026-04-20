// src/core/presentation/components/pages/Widget/TechnicalAnalysis/lib/strategies/renderers/ChartPatterns/TrianglePatternRenderer.ts
import { Drawing, DrawingPoint } from "../../../../config/TechnicalAnalysisTypes";
import { DrawingHelpers } from "../../interfaces/IDrawingStrategy";
import { fixedRoundRect, renderCustomText } from "./support/BaseRendererUtils";

export function renderTrianglePattern(
    pixelPoints: { x: number; y: number }[],
    dataPoints: DrawingPoint[],
    drawing: Drawing,
    isSelected: boolean,
    helpers: DrawingHelpers
): void {
    const { ctx, applyStyle } = helpers;
    const { style, xabcdProps } = drawing;
    const n = pixelPoints.length;
    if (n < 2) return;

    const safeP = (p: { x: number; y: number }) => ({ x: p.x, y: p.y });
    const A = safeP(pixelPoints[0]);
    const B = n > 1 ? safeP(pixelPoints[1]) : A;
    const C = n > 2 ? safeP(pixelPoints[2]) : B;
    const D = n > 3 ? safeP(pixelPoints[3]) : C;

    if (Math.abs(A.x - C.x) < 0.1) C.x += 0.1;
    if (Math.abs(B.x - D.x) < 0.1) D.x += 0.1;

    const m1 = (C.y - A.y) / (C.x - A.x);
    const b1 = A.y - m1 * A.x;
    const y1 = (x: number) => m1 * x + b1;
    const m2 = (D.y - B.y) / (D.x - B.x);
    const b2 = B.y - m2 * B.x;
    const y2 = (x: number) => m2 * x + b2;

    let apexX = 0, apexY = 0;
    const isParallel = Math.abs(m1 - m2) < 0.0001;
    if (!isParallel) {
        apexX = (b2 - b1) / (m1 - m2);
        apexY = y1(apexX);
    }

    const minX = Math.min(A.x, B.x, C.x, D.x);
    const maxX = Math.max(A.x, B.x, C.x, D.x);

    if (n === 4) {
        const polygons: { x: number; y: number }[][] = [];
        const dashed: { x1: number; y1: number; x2: number; y2: number }[] = [];

        if (!isParallel && Math.abs(apexX) < 100000) {
            if (apexX < minX) {
                polygons.push([{ x: apexX, y: apexY }, { x: maxX, y: y1(maxX) }, { x: maxX, y: y2(maxX) }]);
                dashed.push({ x1: apexX, y1: apexY, x2: maxX, y2: y1(maxX) }, { x1: apexX, y1: apexY, x2: maxX, y2: y2(maxX) }, { x1: maxX, y1: y1(maxX), x2: maxX, y2: y2(maxX) });
            } else if (apexX > maxX) {
                polygons.push([{ x: apexX, y: apexY }, { x: minX, y: y1(minX) }, { x: minX, y: y2(minX) }]);
                dashed.push({ x1: apexX, y1: apexY, x2: minX, y2: y1(minX) }, { x1: apexX, y1: apexY, x2: minX, y2: y2(minX) }, { x1: minX, y1: y1(minX), x2: minX, y2: y2(minX) });
            } else {
                polygons.push([{ x: apexX, y: apexY }, { x: minX, y: y1(minX) }, { x: minX, y: y2(minX) }]);
                polygons.push([{ x: apexX, y: apexY }, { x: maxX, y: y1(maxX) }, { x: maxX, y: y2(maxX) }]);
                dashed.push({ x1: minX, y1: y1(minX), x2: maxX, y2: y1(maxX) }, { x1: minX, y1: y2(minX), x2: maxX, y2: y2(maxX) }, { x1: minX, y1: y1(minX), x2: minX, y2: y2(minX) }, { x1: maxX, y1: y1(maxX), x2: maxX, y2: y2(maxX) });
            }
        } else {
            polygons.push([{ x: minX, y: y1(minX) }, { x: minX, y: y2(minX) }, { x: maxX, y: y2(maxX) }, { x: maxX, y: y1(maxX) }]);
            dashed.push({ x1: minX, y1: y1(minX), x2: maxX, y2: y1(maxX) }, { x1: minX, y1: y2(minX), x2: maxX, y2: y2(maxX) }, { x1: minX, y1: y1(minX), x2: minX, y2: y2(minX) }, { x1: maxX, y1: y1(maxX), x2: maxX, y2: y2(maxX) });
        }

        if (style.fillEnabled !== false && xabcdProps?.fillBackground !== false) {
            ctx.save();
            ctx.fillStyle = drawing.style.fillColor || "#7E57C2";
            ctx.globalAlpha = xabcdProps?.fillOpacity ?? drawing.style.fillOpacity ?? 0.1;
            ctx.beginPath();
            polygons.forEach((poly) => {
                ctx.moveTo(poly[0].x, poly[0].y);
                for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
                ctx.closePath();
            });
            ctx.fill("nonzero");
            ctx.restore();
        }

        ctx.save();
        ctx.strokeStyle = style.color || "#7E57C2";
        ctx.lineWidth = 1;
        ctx.globalAlpha = 1.0;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        dashed.forEach((line) => { ctx.moveTo(line.x1, line.y1); ctx.lineTo(line.x2, line.y2); });
        ctx.stroke();
        ctx.restore();
    }

    applyStyle(style, false);
    ctx.setLineDash([]);
    ctx.beginPath();
    for (let i = 0; i < n - 1; i++) {
        ctx.moveTo(pixelPoints[i].x, pixelPoints[i].y);
        ctx.lineTo(pixelPoints[i + 1].x, pixelPoints[i + 1].y);
    }
    ctx.stroke();

    ctx.save();
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = style.color || "#7E57C2";
    ctx.lineWidth = 2;
    pixelPoints.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    });
    ctx.restore();

    if (xabcdProps?.showLabels !== false) {
        ctx.save();
        ctx.font = "10px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const lbls = ["A", "B", "C", "D"];
        const isAHigh = n >= 2 && dataPoints[0].value > dataPoints[1].value;
        lbls.forEach((label, i) => {
            if (i < n) {
                const isHigh = isAHigh ? (i % 2 === 0) : (i % 2 !== 0);
                const lx = pixelPoints[i].x;
                const ly = pixelPoints[i].y + (isHigh ? -14 : 14);
                const textWidth = ctx.measureText(label).width;
                const w = textWidth + 8;
                ctx.fillStyle = drawing.style.color || "#7E57C2";
                ctx.beginPath();
                fixedRoundRect(ctx, lx - w / 2, ly - 7, w, 14, 3);
                ctx.fill();
                ctx.fillStyle = "#FFFFFF";
                ctx.fillText(label, lx, ly);
            }
        });
        ctx.restore();
    }

    if (drawing.showText && drawing.text) renderCustomText(pixelPoints, drawing, helpers);
}
