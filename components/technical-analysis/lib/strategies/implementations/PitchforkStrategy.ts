// src/core/presentation/components/pages/Widget/TechnicalAnalysis/lib/strategies/implementations/PitchforkStrategy.ts

import { IDrawingStrategy, HitTestResult, DrawingHelpers } from "../interfaces/IDrawingStrategy";
import { Drawing, DrawingPoint } from "../../../config/TechnicalAnalysisTypes";
import { PITCHFORK_TOOLS } from "../../../config/TechnicalAnalysisConstants";
import { distToSegment, distanceBetweenPoints, diagonal, calculatePitchforkOrigin } from "../../math/geometry";
import { ChartDataPoint } from "../../Indicators/TechnicalIndicators";
import type { EChartsInstance } from "../../types/echarts";

export class PitchforkStrategy implements IDrawingStrategy {
    supportedTools = [...PITCHFORK_TOOLS];

    render(
        pts: { x: number; y: number }[],
        dataPoints: DrawingPoint[],
        drawing: Drawing,
        _chart: EChartsInstance,
        isSelected: boolean,
        h: DrawingHelpers,
        _chartData: ChartDataPoint[]
    ): void {
        const isCreating = dataPoints.length < 3;
        const { pitchforkProps } = drawing;

        // === CONSTRUCTION LINES ===
        if (isCreating) {
            if (dataPoints.length === 1 && pts.length === 2) {
                this.drawDashLine(pts[0], pts[1], h);
            } else if (dataPoints.length === 2 && pts.length === 3) {
                this.drawDashLine(pts[0], pts[1], h);
                this.drawDashLine(pts[1], pts[2], h);
            }
        }

        if (!pitchforkProps) {
            // Fallback preview
            const [p1] = pts;
            this.drawPoint(p1, 1, h);
            if (pts.length >= 2) this.drawPoint(pts[1], isCreating ? 0.6 : 1, h);
            return;
        }

        const [p1, p2] = pts;
        const p3 = pts.length >= 3 ? pts[2] : null;

        // Define Midpoint of P2-P3 for median axis
        const pMid = p3 ? { x: (p2.x + p3.x) / 2, y: (p2.y + p3.y) / 2 } : p2;
        const medianLvl = pitchforkProps.levels.find(l => l.value === 0);
        const medianWidth = medianLvl?.lineWidth || 1.5;

        // --- VARIANT CALCULATIONS (Origin shift) ---
        let pMidOrig = p1;
        let style = pitchforkProps.style;

        // Auto-detect style from tool type if not explicitly set in props
        if (drawing.type === "schiff_pitchfork") style = "schiff";
        if (drawing.type === "modified_schiff_pitchfork") style = "modified_schiff";
        if (drawing.type === "inside_pitchfork") style = "inside";

        if (style === "schiff" || style === "modified_schiff" || style === "inside") {
            pMidOrig = calculatePitchforkOrigin(p1, p2, style as "schiff" | "modified_schiff" | "inside", pMid);

            // LAYER 0: Special Trend Line for Variants (P1 -> P2)
            h.ctx.save();
            h.ctx.strokeStyle = "#f23645";
            h.ctx.lineWidth = medianWidth;
            h.ctx.globalAlpha = 0.6;
            h.drawSegment(p1, p2);
            h.ctx.restore();
        }

        // 1. LAYER 1: Handle (Connection from Origin to Midpoint)
        h.ctx.save();
        h.ctx.lineWidth = medianWidth;
        h.ctx.globalAlpha = 0.8;
        h.drawSegment(pMidOrig, pMid);
        h.ctx.restore();

        // If we have P3 (real or preview), draw the fork
        if (p3) {
            const medianVector = { x: pMid.x - pMidOrig.x, y: pMid.y - pMidOrig.y };
            const medianLen = diagonal(0, 0, medianVector.x, medianVector.y);

            if (medianLen > 0) {
                const medianDir = { x: medianVector.x / medianLen, y: medianVector.y / medianLen };
                const lateralVector = { x: p2.x - pMid.x, y: p2.y - pMid.y };
                const getTineStartPoint = (level: number) => ({ x: pMid.x + level * lateralVector.x, y: pMid.y + level * lateralVector.y });

                // 2. LAYER 2: Background Fill
                if (pitchforkProps.fillBackground) {
                    const sortedActiveLevels = pitchforkProps.levels.filter(l => l.enabled).sort((a, b) => a.value - b.value);
                    for (let i = 0; i < sortedActiveLevels.length - 1; i++) {
                        const l1 = sortedActiveLevels[i];
                        const l2 = sortedActiveLevels[i + 1];
                        const s1 = getTineStartPoint(l1.value);
                        const s2 = getTineStartPoint(l2.value);
                        const e1 = { x: s1.x + medianDir.x * 10000, y: s1.y + medianDir.y * 10000 };
                        const e2 = { x: s2.x + medianDir.x * 10000, y: s2.y + medianDir.y * 10000 };

                        h.ctx.save();
                        const midValue = (l1.value + l2.value) / 2;
                        const isAboveMedian = midValue > 0;
                        const blueColor = "rgba(33, 150, 243, 1)";
                        const greenColor = "rgba(76, 175, 80, 1)";
                        h.ctx.fillStyle = isAboveMedian ? greenColor : blueColor;
                        h.ctx.globalAlpha = drawing.style.fillOpacity ?? 0.15;
                        h.ctx.beginPath();
                        h.ctx.moveTo(s1.x, s1.y);
                        h.ctx.lineTo(e1.x, e1.y);
                        h.ctx.lineTo(e2.x, e2.y);
                        h.ctx.lineTo(s2.x, s2.y);
                        h.ctx.closePath();
                        h.ctx.fill();
                        h.ctx.restore();
                    }

                    // LAYER 2.5: Base line connecting P2-P3
                    h.ctx.save();
                    h.ctx.strokeStyle = "#5b2c6f";
                    h.ctx.lineWidth = medianWidth;
                    h.ctx.globalAlpha = 1;
                    h.drawSegment(p2, p3);
                    h.ctx.restore();
                }

                // 3. LAYER 3: Tines (Lines)
                pitchforkProps.levels.forEach(l => {
                    if (!l.enabled) return;
                    const start = getTineStartPoint(l.value);
                    let end = { x: start.x + medianDir.x * 10000, y: start.y + medianDir.y * 10000 };
                    if (!pitchforkProps.extendLines) {
                        end = { x: start.x + medianDir.x * medianLen, y: start.y + medianDir.y * medianLen };
                    }

                    h.ctx.save();
                    h.ctx.strokeStyle = l.color;
                    h.ctx.lineWidth = l.lineWidth;
                    h.ctx.globalAlpha = l.lineOpacity || 0.8;

                    if (l.value === 0) {
                        h.ctx.strokeStyle = "#f23645"; // Median force red
                        h.ctx.lineWidth = 1.5;
                        h.ctx.globalAlpha = 1;
                    }

                    h.applyLineDash(l.lineStyle, h.ctx.lineWidth);

                    h.ctx.beginPath();
                    h.ctx.moveTo(start.x, start.y);
                    h.ctx.lineTo(end.x, end.y);
                    h.ctx.stroke();
                    h.ctx.restore();
                });

                if (drawing.showText && drawing.text) {
                    h.drawTextOnLine(pMidOrig, pMid, drawing);
                }
            }
        }

        if (isSelected) {
            this.drawPoint(p1, 1, h);
            this.drawPoint(p2, 1, h);
            if (p3) this.drawPoint(p3, 1, h);
        }
    }

    hitTest(mx: number, my: number, drawing: Drawing, chartInstance: unknown, threshold: number): HitTestResult {
        const chart = chartInstance as { convertToPixel: (opts: unknown, pt: unknown) => number[] | null };
        const pixelPoints = drawing.points.map(p => {
            const px = chart.convertToPixel({ seriesIndex: 0 }, [p.time, p.value]);
            return px ? { x: px[0], y: px[1] } : null;
        }).filter((p): p is { x: number; y: number } => p !== null);

        if (pixelPoints.length < 3 || !drawing.pitchforkProps) return { isHit: false, hitType: null };

        // 1. Handle detection (Priority)
        for (let i = 0; i < pixelPoints.length; i++) {
            if (distanceBetweenPoints(mx, my, pixelPoints[i].x, pixelPoints[i].y) < 12) {
                return { isHit: true, hitType: 'point', pointIndex: i };
            }
        }

        const [pp1, pp2, pp3] = pixelPoints;
        const { pitchforkProps } = drawing;
        let style = pitchforkProps.style;
        if (drawing.type === "schiff_pitchfork") style = "schiff";
        if (drawing.type === "modified_schiff_pitchfork") style = "modified_schiff";
        if (drawing.type === "inside_pitchfork") style = "inside";

        const pMid = { x: (pp2.x + pp3.x) / 2, y: (pp2.y + pp3.y) / 2 };
        let pOrig = pp1;

        if (style === "schiff" || style === "modified_schiff" || style === "inside") {
            pOrig = calculatePitchforkOrigin(pp1, pp2, style as "schiff" | "modified_schiff" | "inside", pMid);
        }

        const dx = pMid.x - pOrig.x; const dy = pMid.y - pOrig.y;
        const len = diagonal(0, 0, dx, dy);
        let isHit = false;

        if (len > 0) {
            const dir = { x: dx / len, y: dy / len };
            const lateral = { x: pp2.x - pMid.x, y: pp2.y - pMid.y };

            // 2. Lines & Segments
            // Origin to Midpoint (Handle line)
            if (distToSegment(mx, my, pOrig.x, pOrig.y, pMid.x, pMid.y) < threshold) isHit = true;

            // Base line P2-P3
            if (!isHit && distToSegment(mx, my, pp2.x, pp2.y, pp3.x, pp3.y) < threshold) isHit = true;

            // Trend lines for variants
            if (!isHit && (style === "schiff" || style === "modified_schiff" || style === "inside")) {
                if (distToSegment(mx, my, pp1.x, pp1.y, pp2.x, pp2.y) < threshold) isHit = true;
            }

            // Tines
            if (!isHit) {
                const enabledLevels = pitchforkProps.levels.filter(l => l.enabled);
                for (const l of enabledLevels) {
                    const s = { x: pMid.x + l.value * lateral.x, y: pMid.y + l.value * lateral.y };
                    const e = { x: s.x + dir.x * 10000, y: s.y + dir.y * 10000 };
                    if (distToSegment(mx, my, s.x, s.y, e.x, e.y, false, true) < threshold) { isHit = true; break; }
                }

                // 3. Background Fill (Polygon check)
                if (!isHit && pitchforkProps.fillBackground && enabledLevels.length >= 2) {
                    const sorted = [...enabledLevels].sort((a, b) => a.value - b.value);
                    for (let i = 0; i < sorted.length - 1; i++) {
                        const l1 = sorted[i]; const l2 = sorted[i + 1];
                        const s1 = { x: pMid.x + l1.value * lateral.x, y: pMid.y + l1.value * lateral.y };
                        const s2 = { x: pMid.x + l2.value * lateral.x, y: pMid.y + l2.value * lateral.y };
                        const e1 = { x: s1.x + dir.x * 10000, y: s1.y + dir.y * 10000 };
                        const e2 = { x: s2.x + dir.x * 10000, y: s2.y + dir.y * 10000 };

                        // Polygon hit test
                        const poly = [s1, e1, e2, s2];
                        let inside = false;
                        for (let j = 0, k = poly.length - 1; j < poly.length; k = j++) {
                            if (((poly[j].y > my) !== (poly[k].y > my)) && (mx < (poly[k].x - poly[j].x) * (my - poly[j].y) / (poly[k].y - poly[j].y) + poly[j].x)) inside = !inside;
                        }
                        if (inside) { isHit = true; break; }
                    }
                }
            }
        }

        return { isHit, hitType: isHit ? 'shape' : null };
    }

    // --- PRIVATE HELPERS ---
    private drawPoint(p: { x: number; y: number }, opacity: number = 1, h: DrawingHelpers) {
        h.ctx.save();
        h.ctx.globalAlpha = opacity;
        h.ctx.beginPath();
        h.ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        h.ctx.fillStyle = "#2962FF";
        h.ctx.fill();
        h.ctx.strokeStyle = "#FFFFFF";
        h.ctx.lineWidth = 2;
        h.ctx.stroke();
        h.ctx.restore();
    }

    private drawDashLine(from: { x: number; y: number }, to: { x: number; y: number }, h: DrawingHelpers) {
        h.ctx.save();
        h.ctx.strokeStyle = "#E040FB";
        h.ctx.lineWidth = 1;
        h.ctx.globalAlpha = 0.9;
        h.applyLineDash("dashed", 1);
        h.ctx.beginPath();
        h.ctx.moveTo(from.x, from.y);
        h.ctx.lineTo(to.x, to.y);
        h.ctx.stroke();
        h.ctx.restore();
    }
}
