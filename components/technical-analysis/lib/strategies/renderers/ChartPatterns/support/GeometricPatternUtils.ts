// src/core/presentation/components/pages/Widget/TechnicalAnalysis/lib/strategies/renderers/ChartPatterns/support/GeometricPatternUtils.ts
import { Drawing, DrawingPoint } from "../../../../../config/TechnicalAnalysisTypes";
import { isPointInPolygon, isPointInTriangle } from "../../../../math/geometry";
import { DrawingHelpers, HitTestResult } from "../../../interfaces/IDrawingStrategy";
import { fixedRoundRect, isPointNearSegment } from "./BaseRendererUtils";

/**
 * [TENOR 2026 HDR] Hit-Test Géométrique Universel
 * Gère la détection de clic pour tous les Chart Patterns (XABCD, Cypher, Triangles, etc.).
 * Intègre les primitives mathématiques (Winding Number, Barycentre) pour une précision absolue sur les zones pleines.
 * [FIX] SCAR-157 : Fallback du centre de gravité pour les polygones complexes dégénérés.
 */
export function hitTestGeometric(
    mx: number,
    my: number,
    pixelPoints: { x: number; y: number }[],
    drawing: Drawing,
    threshold: number
): HitTestResult {
    // 1. Check points (Handles) - Priorité maximale
    for (let i = 0; i < pixelPoints.length; i++) {
        const dx = mx - pixelPoints[i].x;
        const dy = my - pixelPoints[i].y;
        if (Math.sqrt(dx * dx + dy * dy) < threshold) {
            return { isHit: true, hitType: "point", pointIndex: i };
        }
    }

    // 2. Check segments (Borders)
    for (let i = 0; i < pixelPoints.length - 1; i++) {
        if (isPointNearSegment(mx, my, pixelPoints[i], pixelPoints[i + 1], threshold)) {
            return { isHit: true, hitType: "shape" };
        }
    }

    // 3. Check Fill (Interior) - SCAR-157 RESOLVED
    const fillEnabled = drawing.style.fillEnabled !== false;
    if (fillEnabled) {
        const { type } = drawing;
        
        if (type === "xabcd_pattern" || type === "cypher_pattern") {
            // Ces patterns sont visuellement rendus comme deux triangles se rejoignant au point B (index 2)
            if (pixelPoints.length >= 3 && isPointInTriangle(mx, my, pixelPoints[0], pixelPoints[1], pixelPoints[2])) {
                return { isHit: true, hitType: "shape" };
            }
            if (pixelPoints.length >= 5 && isPointInTriangle(mx, my, pixelPoints[2], pixelPoints[3], pixelPoints[4])) {
                return { isHit: true, hitType: "shape" };
            }
        } else if (type === "three_drives_pattern") {
            // Rendu comme trois triangles distincts
            if (pixelPoints.length >= 3 && isPointInTriangle(mx, my, pixelPoints[0], pixelPoints[1], pixelPoints[2])) return { isHit: true, hitType: "shape" };
            if (pixelPoints.length >= 5 && isPointInTriangle(mx, my, pixelPoints[2], pixelPoints[3], pixelPoints[4])) return { isHit: true, hitType: "shape" };
            if (pixelPoints.length >= 7 && isPointInTriangle(mx, my, pixelPoints[4], pixelPoints[5], pixelPoints[6])) return { isHit: true, hitType: "shape" };
        } else if (type === "triangle_pattern" || type === "head_and_shoulders") {
            // Pour head_and_shoulders et triangle_pattern, une approximation par bounding box + Winding Number
            // est parfois trop stricte si les points se croisent de manière inattendue (Bowties complexes).
            if (pixelPoints.length >= 3) {
                if (isPointInPolygon(mx, my, pixelPoints)) {
                    return { isHit: true, hitType: "shape" };
                }
                // Fallback généreux pour les patterns complexes : si on est très proche du centre de gravité
                const cx = pixelPoints.reduce((sum, p) => sum + p.x, 0) / pixelPoints.length;
                const cy = pixelPoints.reduce((sum, p) => sum + p.y, 0) / pixelPoints.length;
                if (Math.hypot(mx - cx, my - cy) < threshold * 3) {
                    return { isHit: true, hitType: "shape" };
                }
            }
        }
    }

    return { isHit: false, hitType: null };
}

/**
 * [TENOR 2026 HDR] Dessine une ligne diagonale pointillée avec une étiquette affichant le ratio de Fibonacci.
 * [FIX] SCAR-ZERO-DIV : Protection absolue contre la division par zéro et la propagation de NaN.
 */
export function drawDiagonalWithRatio(
    pStart: { x: number; y: number },
    pEnd: { x: number; y: number },
    d0: DrawingPoint,
    d1: DrawingPoint,
    d2: DrawingPoint,
    type: string,
    helpers: DrawingHelpers
) {
    const { ctx } = helpers;
    ctx.beginPath();
    ctx.moveTo(pStart.x, pStart.y);
    ctx.lineTo(pEnd.x, pEnd.y);
    ctx.stroke();

    let ratioValue = 0;
    try {
        let denom = 1;
        if (["XB", "AC", "BD", "XD", "XC", "ABCD_AC", "ABCD_BD"].includes(type)) {
            denom = Math.abs(d0.value - d1.value);
            ratioValue = denom === 0 ? 0 : Math.abs(d2.value - d1.value) / denom;
        } else if (type === "AC_CYPHER") {
            denom = Math.abs(d1.value - d0.value);
            ratioValue = denom === 0 ? 0 : Math.abs(d2.value - d0.value) / denom;
        } else if (type === "BD_CYPHER" || type === "XD_CYPHER") {
            denom = Math.abs(d0.value - d1.value);
            ratioValue = denom === 0 ? 0 : Math.abs(d2.value - d1.value) / denom;
        } else if (type === "THREE_DRIVES") {
            denom = Math.abs(d1.value - d0.value);
            ratioValue = denom === 0 ? 0 : Math.abs(d2.value - d1.value) / denom;
        } else {
            denom = Math.abs(d1.value - d0.value);
            ratioValue = denom === 0 ? 0 : Math.abs(d2.value - d1.value) / denom;
        }
    } catch {
        ratioValue = 0;
    }

    // Protection finale contre NaN et Infinity
    if (isNaN(ratioValue) || !isFinite(ratioValue)) return;

    const label = (type === "THREE_DRIVES") ? ratioValue.toFixed(2) : ratioValue.toFixed(3);
    const midX = (pStart.x + pEnd.x) / 2;
    const midY = (pStart.y + pEnd.y) / 2;

    ctx.save();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.font = "bold 10px Inter, sans-serif";
    const textWidth = ctx.measureText(label).width;
    const boxW = textWidth + 16;
    const boxH = 18;

    ctx.fillStyle = ctx.strokeStyle as string;
    ctx.beginPath();
    fixedRoundRect(ctx, midX - boxW / 2, midY - boxH / 2, boxW, boxH, 4);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, midX, midY);
    ctx.restore();
}

/**
 * Dessine les étiquettes des points (X, A, B, C, D) dans des boîtes arrondies.
 * Alterne intelligemment la position (au-dessus/en-dessous) en fonction de la direction du zigzag.
 */
export function drawPointLabelsBoxed(
    pixelPoints: { x: number; y: number }[],
    dataPoints: DrawingPoint[],
    labels: string[],
    color: string,
    offset: number,
    helpers: DrawingHelpers
) {
    const { ctx } = helpers;
    const n = pixelPoints.length;
    if (n < 2) return;
    const isAHigh = dataPoints[1].value > dataPoints[0].value;

    ctx.font = "bold 11px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const boxW = 18;
    const boxH = 18;

    pixelPoints.forEach((p, i) => {
        const label = labels[i];
        if (!label) return;

        const lx = p.x;
        let ly = p.y;

        if (i === 0) ly += (isAHigh ? 1 : -1) * offset;
        else if (i % 2 === 1) ly += (isAHigh ? -1 : 1) * offset;
        else if (i % 2 === 0) ly += (isAHigh ? 1 : -1) * offset;

        ctx.save();
        ctx.fillStyle = color;
        ctx.beginPath();
        fixedRoundRect(ctx, lx - boxW / 2, ly - boxH / 2, boxW, boxH, 4);
        ctx.fill();

        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(label, lx, ly);
        ctx.restore();
    });
}
// --- EOF ---