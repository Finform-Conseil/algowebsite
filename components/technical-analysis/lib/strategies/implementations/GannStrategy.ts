// src/core/presentation/components/pages/Widget/TechnicalAnalysis/lib/strategies/implementations/GannStrategy.ts

import { IDrawingStrategy, HitTestResult, DrawingHelpers } from "../interfaces/IDrawingStrategy";
import { Drawing, DrawingPoint } from "../../../config/TechnicalAnalysisTypes";
import { distToSegment, distanceBetweenPoints, diagonal, isPointInRect, logValue, linearValue, extendToRay } from "../../math/geometry";
import { ChartDataPoint } from "../../Indicators/TechnicalIndicators";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EChartsInstance = any;

export class GannStrategy implements IDrawingStrategy {
    supportedTools = [
        "gann_box",
        "gann_square",
        "gann_square_fixed",
        "gann_fan"
    ];

    render(
        pts: { x: number; y: number }[],
        dataPoints: DrawingPoint[],
        drawing: Drawing,
        chart: EChartsInstance,
        isSelected: boolean,
        h: DrawingHelpers,
        _chartData: ChartDataPoint[]
    ): void {
        const { type } = drawing;

        switch (type) {
            case "gann_box":
                this.renderGannBox(pts, dataPoints, drawing, chart, isSelected, h);
                break;
            case "gann_square":
                this.renderGannSquare(drawing, dataPoints, chart, isSelected, h);
                break;
            case "gann_square_fixed":
                this.renderGannSquareFixed(drawing, dataPoints, chart, isSelected, h);
                break;
            case "gann_fan":
                this.renderGannFan(drawing, dataPoints, chart, isSelected, h);
                break;
        }
    }

    hitTest(mx: number, my: number, drawing: Drawing, chartInstance: unknown, threshold: number): HitTestResult {
        const chart = chartInstance as { convertToPixel: (opts: unknown, pt: unknown) => number[] | null };

        // [SNIPER V5.0] Fidelity Fix: Do NOT filter points, preserve indices for handles
        const points = drawing.points.map(p => {
            const pixel = chart.convertToPixel({ seriesIndex: 0 }, [p.time, p.value]);
            return pixel ? { x: pixel[0], y: pixel[1] } : null;
        });

        if (points.length < 1) return { isHit: false, hitType: null };

        // 1. Handle detection (Priority)
        for (let i = 0; i < points.length; i++) {
            const p = points[i];
            if (p && distanceBetweenPoints(mx, my, p.x, p.y) < 15) { // Increased hit area for handles
                return { isHit: true, hitType: 'point', pointIndex: i };
            }
        }

        let isHit = false;
        const { type } = drawing;
        const [p1, p2] = points;

        // Essential requirement: we need at least p1 to be visible for origin-based tools
        if (!p1) return { isHit: false, hitType: null };

        if (type === "gann_box" && p2 && drawing.gannBoxProps) {
            const props = drawing.gannBoxProps;
            const xMin = Math.min(p1.x, p2.x), xMax = Math.max(p1.x, p2.x);
            const yMin = Math.min(p1.y, p2.y), yMax = Math.max(p1.y, p2.y);

            // 1. Frame Check
            if (distToSegment(mx, my, xMin, yMin, xMax, yMin) < threshold ||
                distToSegment(mx, my, xMin, yMax, xMax, yMax) < threshold ||
                distToSegment(mx, my, xMin, yMin, xMin, yMax) < threshold ||
                distToSegment(mx, my, xMax, yMin, xMax, yMax) < threshold) isHit = true;

            // 2. Internal Levels & Angles
            if (!isHit) {
                const priceLevels = props.priceLevels || [];
                const timeLevels = props.timeLevels || [];

                for (const level of priceLevels.filter(l => l.enabled)) {
                    const ly = p1.y + (p2.y - p1.y) * level.value;
                    if (Math.abs(my - ly) < threshold && mx >= xMin && mx <= xMax) { isHit = true; break; }
                }
                if (!isHit) {
                    for (const level of timeLevels.filter(l => l.enabled)) {
                        const lx = p1.x + (p2.x - p1.x) * level.value;
                        if (Math.abs(mx - lx) < threshold && my >= yMin && my <= yMax) { isHit = true; break; }
                    }
                }

                // Gann Box Specific Angles
                if (!isHit && props.showAngles) {
                    const corners = [{ x: xMin, y: yMin }, { x: xMax, y: yMax }, { x: xMin, y: yMax }, { x: xMax, y: yMin }];
                    for (const corner of corners) {
                        for (const pl of priceLevels.filter(p => p.enabled)) {
                            const targetY = p1.y + (p2.y - p1.y) * pl.value;
                            if (distToSegment(mx, my, corner.x, corner.y, corner.x === xMin ? xMax : xMin, targetY) < threshold) { isHit = true; break; }
                        }
                        if (isHit) break;
                    }
                }
            }

            // 3. Background Check
            if (!isHit && (props.priceBackground?.enabled || props.timeBackground?.enabled)) {
                if (isPointInRect(mx, my, xMin, xMax, yMin, yMax)) isHit = true;
            }
        } else if (type === "gann_square" && p2 && drawing.gannSquareProps) {
            const props = drawing.gannSquareProps;
            const xMin = Math.min(p1.x, p2.x), xMax = Math.max(p1.x, p2.x);
            const yMin = Math.min(p1.y, p2.y), yMax = Math.max(p1.y, p2.y);

            // 1. Frame Check
            if (distToSegment(mx, my, xMin, yMin, xMax, yMin) < threshold ||
                distToSegment(mx, my, xMin, yMax, xMax, yMax) < threshold ||
                distToSegment(mx, my, xMin, yMin, xMin, yMax) < threshold ||
                distToSegment(mx, my, xMax, yMin, xMax, yMax) < threshold) isHit = true;

            // 2. Internal Levels & Angles & Fans/Arcs
            if (!isHit) {
                const levels = props.levels || [];
                for (const level of levels.filter(l => l.enabled)) {
                    const lx = p1.x + (p2.x - p1.x) * level.value;
                    const ly = p1.y + (p2.y - p1.y) * level.value;
                    if (Math.abs(mx - lx) < threshold && my >= yMin && my <= yMax) { isHit = true; break; }
                    if (Math.abs(my - ly) < threshold && mx >= xMin && mx <= xMax) { isHit = true; break; }
                }

                // Arcs catchability
                if (!isHit && props.showArcs && props.arcs) {
                    const diag = diagonal(p1.x, p1.y, p2.x, p2.y);
                    const distToP1 = distanceBetweenPoints(mx, my, p1.x, p1.y);
                    for (const arc of props.arcs.filter(a => a.enabled)) {
                        if (Math.abs(distToP1 - diag * parseFloat(arc.ratio)) < threshold) { isHit = true; break; }
                    }
                }
                // Fans catchability
                if (!isHit && props.showFans && props.fans) {
                    for (const fan of props.fans.filter(f => f.enabled)) {
                        const parts = fan.ratio.split("x").map(Number);
                        if (parts.length === 2) {
                            const endX = p1.x + (p2.x - p1.x) * (parts[1] / parts[0]) * 1.5;
                            const endY = p1.y + (p2.y - p1.y) * 1.5;
                            if (distToSegment(mx, my, p1.x, p1.y, endX, endY) < threshold) { isHit = true; break; }
                            const endX2 = p1.x + (p2.x - p1.x) * 1.5;
                            const endY2 = p1.y + (p2.y - p1.y) * (parts[0] / parts[1]) * 1.5;
                            if (distToSegment(mx, my, p1.x, p1.y, endX2, endY2) < threshold) { isHit = true; break; }
                        }
                    }
                }
            }

            // 3. Background Check
            if (!isHit && props.fillBackground && isPointInRect(mx, my, xMin, xMax, yMin, yMax)) isHit = true;
        } else if (type === "gann_square_fixed" && p2 && drawing.gannSquareFixedProps) {
            const props = drawing.gannSquareFixedProps;
            const xMin = Math.min(p1.x, p2.x); const xMax = Math.max(p1.x, p2.x);
            const yMin = Math.min(p1.y, p2.y); const yMax = Math.max(p1.y, p2.y);

            if (distToSegment(mx, my, xMin, yMin, xMax, yMin) < threshold ||
                distToSegment(mx, my, xMin, yMax, xMax, yMax) < threshold ||
                distToSegment(mx, my, xMin, yMin, xMin, yMax) < threshold ||
                distToSegment(mx, my, xMax, yMin, xMax, yMax) < threshold) isHit = true;

            if (!isHit) {
                const anchor = props.reverse ? p2 : p1;
                const corner = props.reverse ? p1 : p2;
                for (const level of props.levels.filter(l => l.enabled)) {
                    const ratio = Number(level.label) || 0;
                    const hY = anchor.y + (corner.y - anchor.y) * ratio;
                    const vX = anchor.x + (corner.x - anchor.x) * ratio;
                    if (Math.abs(my - hY) < threshold && mx >= xMin && mx <= xMax) { isHit = true; break; }
                    if (Math.abs(mx - vX) < threshold && my >= yMin && my <= yMax) { isHit = true; break; }
                }

                if (!isHit && props.fans.some(f => f.enabled)) {
                    if (distToSegment(mx, my, p1.x, p1.y, p2.x, p2.y) < threshold || distToSegment(mx, my, p1.x, p2.y, p2.x, p1.y) < threshold) isHit = true;
                }
            }

            if (!isHit && props.background.enabled && isPointInRect(mx, my, xMin, xMax, yMin, yMax)) isHit = true;
        } else if (type === "gann_fan" && p2 && drawing.gannFanProps) {
            const props = drawing.gannFanProps;
            if (distanceBetweenPoints(mx, my, p1.x, p1.y) < 15) {
                isHit = true;
            } else {
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const dir = props.reverse ? -1 : 1;
                const lines = props.lines
                    .filter(l => l.enabled && l.denominator !== 0)
                    .map(l => {
                        const ratio = dir * (l.numerator / l.denominator);
                        const target = { x: p1.x + dx, y: p1.y + dy * ratio };
                        return { end: extendToRay(p1, target, 5000) };
                    });

                for (const ray of lines) {
                    if (distToSegment(mx, my, p1.x, p1.y, ray.end.x, ray.end.y) < threshold) {
                        isHit = true;
                        break;
                    }
                }
            }
        }

        return { isHit, hitType: isHit ? 'shape' : null };
    }

    // --- RENDERERS ---

    private renderGannBox(pts: { x: number; y: number }[], dataPoints: DrawingPoint[], drawing: Drawing, chart: EChartsInstance, isSelected: boolean, h: DrawingHelpers) {
        if (pts.length < 1 || !drawing.gannBoxProps) return;
        const { gannBoxProps } = drawing;
        const p1 = pts[0]; const p2 = pts[1] || p1;
        const v1 = dataPoints[0]; const v2 = dataPoints[1] || v1;
        const left = Math.min(p1.x, p2.x); const right = Math.max(p1.x, p2.x);
        const top = Math.min(p1.y, p2.y); const bottom = Math.max(p1.y, p2.y);
        const width = right - left; const height = bottom - top;

        const yAxis = (chart.getOption().yAxis as Array<{ type?: string }> | undefined)?.[0];
        const isLog = yAxis?.type === "log";
        const isReversed = gannBoxProps.reverse;
        const parseTimeValue = (t: string | number): number => {
            if (typeof t === "number" && Number.isFinite(t)) return t;
            const numeric = Number(t);
            if (Number.isFinite(numeric)) return numeric;
            const parsed = Date.parse(String(t));
            return Number.isFinite(parsed) ? parsed : NaN;
        };

        const getPriceValue = (ratio: number) => {
            const start = Number(v1.value); const end = Number(v2.value);
            const r = isReversed ? 1 - ratio : ratio;
            return isLog ? logValue(start, end, r) : linearValue(start, end, r);
        };
        const priceToY = (ratio: number) => {
            const val = getPriceValue(ratio);
            const py = chart.convertToPixel({ seriesIndex: 0 }, [v1.time, val]);
            return py ? py[1] : p1.y;
        };
        const timeToX = (ratio: number) => {
            // Keep time levels geometrically stable inside the user-defined box,
            // regardless of whether x-axis values are numeric timestamps or date strings.
            const r = isReversed ? 1 - ratio : ratio;
            return p1.x + (p2.x - p1.x) * r;
        };

        const sortedPriceLevels = [...gannBoxProps.priceLevels].filter(l => l.enabled).sort((a, b) => a.value - b.value);
        const sortedTimeLevels = [...gannBoxProps.timeLevels].filter(l => l.enabled).sort((a, b) => a.value - b.value);
        const priceYMap = new Map<number, number>();
        sortedPriceLevels.forEach(l => priceYMap.set(l.value, priceToY(l.value)));
        const timeXMap = new Map<number, number>();
        sortedTimeLevels.forEach(l => timeXMap.set(l.value, timeToX(l.value)));

        const getLevelColor = (levelColor: string) => gannBoxProps.useOneColor && gannBoxProps.oneColor ? gannBoxProps.oneColor : levelColor;

        // Backgrounds (Mosaic Grid) - Optimized for TV Parity
        if ((gannBoxProps.priceBackground?.enabled || gannBoxProps.timeBackground?.enabled) && width > 0 && height > 0) {
            h.ctx.save();
            for (let i = 0; i < sortedTimeLevels.length - 1; i++) {
                for (let j = 0; j < sortedPriceLevels.length - 1; j++) {
                    const tx1 = timeXMap.get(sortedTimeLevels[i].value)!;
                    const tx2 = timeXMap.get(sortedTimeLevels[i + 1].value)!;
                    const py1 = priceYMap.get(sortedPriceLevels[j].value)!;
                    const py2 = priceYMap.get(sortedPriceLevels[j + 1].value)!;

                    const pColor = getLevelColor(sortedPriceLevels[j + 1].color);
                    const tColor = getLevelColor(sortedTimeLevels[i + 1].color);

                    // Standard HDR 2026 Grid Filling
                    h.ctx.fillStyle = pColor;
                    h.ctx.globalAlpha = (gannBoxProps.priceBackground?.fillOpacity ?? 0.15) * 0.5;
                    h.ctx.fillRect(Math.min(tx1, tx2), Math.min(py1, py2), Math.abs(tx2 - tx1), Math.abs(py2 - py1));

                    if (gannBoxProps.timeBackground?.enabled) {
                        h.ctx.fillStyle = tColor;
                        h.ctx.globalAlpha = (gannBoxProps.timeBackground?.fillOpacity ?? 0.15) * 0.5;
                        h.ctx.fillRect(Math.min(tx1, tx2), Math.min(py1, py2), Math.abs(tx2 - tx1), Math.abs(py2 - py1));
                    }
                }
            }
            h.ctx.restore();
        }

        // Grid Lines (Thick & Precise)
        h.ctx.save();
        [...sortedPriceLevels, ...sortedTimeLevels].forEach(level => {
            const isHorizontal = (sortedPriceLevels as { value: number }[]).includes(level as { value: number });
            const pos = isHorizontal ? priceYMap.get(level.value)! : timeXMap.get(level.value)!;
            
            h.ctx.strokeStyle = getLevelColor(level.color);
            h.ctx.lineWidth = 1.5; // Thicker lines for TV fidelity
            h.ctx.globalAlpha = level.lineOpacity || 1;
            h.ctx.setLineDash(level.lineStyle === "dashed" ? [5, 5] : level.lineStyle === "dotted" ? [2, 2] : []);

            if (isHorizontal) {
                h.drawSegment({ x: left, y: pos }, { x: right, y: pos });
            } else {
                h.drawSegment({ x: pos, y: top }, { x: pos, y: bottom });
            }
        });
        h.ctx.restore();

        // Level Labels (Strictly Centered on segments for TV parity)
        if (gannBoxProps.showLabels.left || gannBoxProps.showLabels.right || gannBoxProps.showLabels.top || gannBoxProps.showLabels.bottom) {
            h.ctx.save();
            h.ctx.font = "11px Inter";
            h.ctx.textBaseline = "middle";

            sortedPriceLevels.forEach(level => {
                const y = priceYMap.get(level.value)!;
                const color = getLevelColor(level.color);
                h.ctx.fillStyle = color;
                if (gannBoxProps.showLabels.left) {
                    h.ctx.textAlign = "right";
                    h.ctx.fillText(level.value.toString(), left - 5, y);
                }
                if (gannBoxProps.showLabels.right) {
                    h.ctx.textAlign = "left";
                    h.ctx.fillText(level.value.toString(), right + 5, y);
                }
            });

            sortedTimeLevels.forEach(level => {
                const x = timeXMap.get(level.value)!;
                const color = getLevelColor(level.color);
                h.ctx.fillStyle = color;
                if (gannBoxProps.showLabels.top) {
                    h.ctx.textAlign = "center";
                    h.ctx.fillText(level.value.toString(), x, top - 10);
                }
                if (gannBoxProps.showLabels.bottom) {
                    h.ctx.textAlign = "center";
                    h.ctx.fillText(level.value.toString(), x, bottom + 15);
                }
            });
            h.ctx.restore();
        }

        // Angles (Simplified for Fidelity)
        if (gannBoxProps.showAngles && width > 0 && height > 0) {
            h.ctx.save();
            h.ctx.strokeStyle = isSelected ? "#999" : (gannBoxProps.oneColor || "#787b86");
            h.ctx.lineWidth = 1; h.ctx.globalAlpha = 0.25;
            h.ctx.setLineDash([]);

            // Main Diagonals Only (TL->BR, BL->TR) as per TV standard for Gann Box
            h.drawSegment({ x: left, y: top }, { x: right, y: bottom });
            h.drawSegment({ x: left, y: bottom }, { x: right, y: top });

            // Secondary Fan-like angles removed from central web to avoid saturation
            // [HDR 2026] Fidelity Note: Gann Box ≠ Gann Fan.
            h.ctx.restore();
        }

        if (drawing.showText && drawing.text) {
            h.drawTextOnLine({ x: left, y: (top + bottom) / 2 }, { x: right, y: (top + bottom) / 2 }, drawing);
        }

        // Time/Price Stats Labels (Fixed NaN & Formatting)
        if (gannBoxProps.showLabels.left || gannBoxProps.showLabels.right || gannBoxProps.showLabels.top || gannBoxProps.showLabels.bottom) {
            const startTime = parseTimeValue(v1.time);
            const endTime = parseTimeValue(v2.time);
            if (!isNaN(startTime) && !isNaN(endTime)) {
                h.ctx.save();
                const sColor = gannBoxProps.oneColor || drawing.style.color || "#2196f3";
                h.ctx.fillStyle = sColor;
                h.ctx.globalAlpha = 0.8;
                h.ctx.font = "bold 10px Inter";
                const barsLabel = `Time: ${Math.abs(endTime - startTime)}`;
                const priceLabel = `Price: ${Math.abs(Number(v2.value) - Number(v1.value)).toFixed(2)}`;
                h.ctx.fillText(`${barsLabel}, ${priceLabel}`, left + 5, top + height - 10);
                h.ctx.restore();
            }
        }

        if (isSelected) {
            h.drawHandle(p1); h.drawHandle(p2);
        }
    }

    private renderGannSquareFixed(drawing: Drawing, dataPoints: DrawingPoint[], chart: EChartsInstance, isSelected: boolean, h: DrawingHelpers) {
        const pts = dataPoints;
        if (pts.length < 1 || !drawing.gannSquareFixedProps) return;
        const props = drawing.gannSquareFixedProps;

        const toPixel = (pt: DrawingPoint) => {
            const p = chart.convertToPixel({ seriesIndex: 0 }, [pt.time, pt.value]);
            return p ? { x: p[0], y: p[1] } : null;
        };
        const p1 = toPixel(pts[0]);
        const p2 = toPixel(pts[1] || pts[0]);
        if (!p1 || !p2) return;

        const valAnchor = props.reverse ? p2 : p1;
        const valCorner = props.reverse ? p1 : p2;
        const cx = valAnchor.x; const cy = valAnchor.y;
        const px = valCorner.x; const py = valCorner.y;
        const W = px - cx; const H = py - cy;
        if (Math.abs(W) < 1 && Math.abs(H) < 1) return;

        const levels = props.levels || [];
        const ratios = levels.map(l => Number(l.label) || 0).sort((a, b) => a - b);
        const radii = ratios.map(r => Math.sqrt((r * W) ** 2 + (r * H) ** 2));

        h.ctx.save();
        h.ctx.beginPath();
        h.ctx.rect(Math.min(cx, px), Math.min(cy, py), Math.abs(W), Math.abs(H));
        h.ctx.clip();

        // Mosaic
        if (props.background.enabled) {
            const mosaicOpacity = 0.08;
            for (let k = 0; k < ratios.length; k++) {
                const rInner = radii[k];
                // The last zone extends indefinitely to cover the remaining box corners before clipping
                const rOuter = k === ratios.length - 1 ? Math.sqrt(W * W + H * H) * 2 : radii[k + 1];
                const bandColor = levels[k + 1]?.color || levels[k]?.color || props.background.color;
                if (rInner === rOuter) continue;

                h.ctx.beginPath();
                h.ctx.arc(cx, cy, rOuter, 0, 2 * Math.PI);
                h.ctx.arc(cx, cy, rInner, 0, 2 * Math.PI, true); // Reverse vector to punch donut hole
                h.ctx.closePath();
                h.ctx.fillStyle = bandColor;
                h.ctx.globalAlpha = mosaicOpacity;
                h.ctx.fill();
            }
        }

        // Arcs
        if (props.arcs.some(a => a.enabled)) {
            props.arcs.filter(a => a.enabled).forEach(arc => {
                h.ctx.save();
                h.ctx.strokeStyle = arc.color;
                h.ctx.lineWidth = arc.lineWidth;
                h.ctx.globalAlpha = arc.lineOpacity ?? 1;
                h.applyLineDash(arc.lineStyle, arc.lineWidth);
                ratios.forEach((r, idx) => {
                    if (r === 0) return;
                    h.ctx.beginPath();
                    h.ctx.arc(cx, cy, radii[idx], 0, 2 * Math.PI);
                    h.ctx.stroke();
                });
                h.ctx.restore();
            });
        }

        // Fans
        if (props.fans.some(f => f.enabled)) {
            props.fans.filter(f => f.enabled).forEach(fan => {
                h.ctx.save();
                h.ctx.strokeStyle = fan.color;
                h.ctx.lineWidth = fan.lineWidth;
                h.ctx.globalAlpha = (fan.lineOpacity ?? 1) * 0.4;
                h.applyLineDash(fan.lineStyle, fan.lineWidth);
                ratios.forEach(r => {
                    if (r === 0) return;
                    h.ctx.beginPath(); h.ctx.moveTo(cx, cy); h.ctx.lineTo(cx + r * W, py); h.ctx.stroke();
                    if (r !== 1) {
                        h.ctx.beginPath(); h.ctx.moveTo(cx, cy); h.ctx.lineTo(px, cy + r * H); h.ctx.stroke();
                    }
                });
                h.ctx.restore();
            });
        }

        // Grid
        levels.filter(l => l.enabled).forEach(level => {
            const ratio = Number(level.label) || 0;
            const gx = cx + ratio * W;
            const gy = cy + ratio * H;
            h.ctx.save();
            h.ctx.strokeStyle = level.color;
            h.ctx.lineWidth = level.lineWidth ?? 1;
            h.ctx.globalAlpha = level.lineOpacity ?? 1;
            h.applyLineDash(level.lineStyle, level.lineWidth ?? 1);
            h.drawSegment({ x: cx, y: gy }, { x: px, y: gy });
            h.drawSegment({ x: gx, y: cy }, { x: gx, y: py });
            h.ctx.restore();
        });

        // Diagonals
        h.ctx.save();
        h.ctx.strokeStyle = drawing.style.color;
        h.ctx.lineWidth = 1; h.ctx.globalAlpha = 0.4;
        h.drawSegment({ x: cx, y: cy }, { x: px, y: py });
        h.drawSegment({ x: cx, y: py }, { x: px, y: cy });
        h.ctx.restore();

        h.ctx.restore(); // Release Clip

        // Frame
        h.ctx.save();
        h.ctx.strokeStyle = drawing.style.color;
        h.ctx.lineWidth = drawing.style.lineWidth;
        h.ctx.globalAlpha = drawing.style.lineOpacity ?? 1;
        h.applyLineDash(drawing.style.lineStyle, drawing.style.lineWidth);
        h.ctx.strokeRect(Math.min(cx, px), Math.min(cy, py), Math.abs(W), Math.abs(H));
        h.ctx.restore();

        if (drawing.showText && drawing.text) {
            h.drawTextOnLine({ x: cx, y: (cy + py) / 2 }, { x: px, y: (cy + py) / 2 }, drawing);
        }

        // Time/Price Stats Labels removed for fidelity (not in DrawingRendererOld)
        /*
        if (props.showLabels) {
            h.ctx.save();
            const sColor = (props as any).oneColor || drawing.style.color || "#2196f3";
            h.ctx.fillStyle = (props as any).useOneColor ? sColor : sColor;
            h.ctx.globalAlpha = 1;
            h.ctx.font = "10px Inter";
            const barsLabel = `Time: ${Math.abs(Number(pts[1].time) - Number(pts[0].time))}`;
            const priceLabel = `Price: ${Math.abs(pts[1].value - pts[0].value).toFixed(2)}`;
            h.ctx.fillText(`${barsLabel}, ${priceLabel}`, Math.min(cx, px) + 5, Math.min(cy, py) + Math.abs(H) - 5);
            h.ctx.restore();
        }
        */

        if (isSelected) {
            h.drawHandle(p1); h.drawHandle(p2);
        }
    }

    private renderGannSquare(drawing: Drawing, dataPoints: DrawingPoint[], chart: EChartsInstance, isSelected: boolean, h: DrawingHelpers) {
        const pts = dataPoints;
        if (pts.length < 2 || !drawing.gannSquareProps) return;
        const props = drawing.gannSquareProps;

        // Pixel conversion
        const toPixel = (pt: DrawingPoint) => {
            const p = chart.convertToPixel({ seriesIndex: 0 }, [pt.time, pt.value]);
            return p ? { x: p[0], y: p[1] } : null;
        };
        let p1 = toPixel(pts[0]);
        let p2 = toPixel(pts[1]);
        if (!p1 || !p2) return;

        if (props.reverse) { const temp = p1; p1 = p2; p2 = temp; }

        const left = Math.min(p1.x, p2.x); const top = Math.min(p1.y, p2.y);
        const W = Math.abs(p2.x - p1.x); const H = Math.abs(p2.y - p1.y);

        h.ctx.save();

        // Mosaic
        if (props.fillBackground) {
            if (props.mosaicFill && props.levels) {
                const midX = left + W / 2; const midY = top + H / 2;
                const opacity = props.fillOpacity || 0.1;
                const findColor = (val: number) => {
                    const lvl = props.levels?.find(l => Math.abs(l.value - val) < 0.01);
                    return lvl ? lvl.color : (props.color || "#2196f3");
                };
                // TL
                h.ctx.fillStyle = props.useOneColor && props.oneColor ? props.oneColor : findColor(0.25);
                h.ctx.globalAlpha = opacity * 0.4; h.ctx.fillRect(left, top, W / 2, H / 2);
                // TR
                h.ctx.fillStyle = props.useOneColor && props.oneColor ? props.oneColor : findColor(0.382);
                h.ctx.globalAlpha = opacity * 0.4; h.ctx.fillRect(midX, top, W / 2, H / 2);
                // BL
                h.ctx.fillStyle = props.useOneColor && props.oneColor ? props.oneColor : findColor(0.5);
                h.ctx.globalAlpha = opacity * 0.4; h.ctx.fillRect(left, midY, W / 2, H / 2);
                // BR
                h.ctx.fillStyle = props.useOneColor && props.oneColor ? props.oneColor : findColor(0.75);
                h.ctx.globalAlpha = opacity * 0.4; h.ctx.fillRect(midX, midY, W / 2, H / 2);
            } else {
                h.ctx.beginPath(); h.ctx.rect(left, top, W, H);
                h.ctx.fillStyle = props.useOneColor ? props.oneColor : (props.color || "#2196f3");
                h.ctx.globalAlpha = props.fillOpacity || 0.1;
                h.ctx.fill();
            }
        }

        // Grid
        if (props.showGrid && props.levels) {
            props.levels.filter(l => l.enabled).forEach(lvl => {
                const color = props.useOneColor ? props.oneColor : lvl.color;
                h.ctx.strokeStyle = color; h.ctx.globalAlpha = lvl.lineOpacity || 0.5; h.ctx.lineWidth = lvl.lineWidth || 1;
                if (lvl.lineStyle === "dashed") h.ctx.setLineDash([5, 5]);
                else if (lvl.lineStyle === "dotted") h.ctx.setLineDash([2, 2]);
                else h.ctx.setLineDash([]);

                const xPos = p1!.x + (p2!.x - p1!.x) * lvl.value;
                const yPos = p1!.y + (p2!.y - p1!.y) * lvl.value;
                h.drawSegment({ x: xPos, y: top }, { x: xPos, y: top + H });
                h.drawSegment({ x: left, y: yPos }, { x: left + W, y: yPos });
            });
        }

        // Border
        h.ctx.beginPath(); h.ctx.rect(left, top, W, H);
        h.ctx.strokeStyle = props.useOneColor ? props.oneColor : (props.color || "#2962ff");
        h.ctx.lineWidth = drawing.style.lineWidth || 2;
        h.ctx.globalAlpha = drawing.style.lineOpacity || 1;
        h.applyLineDash(drawing.style.lineStyle || "solid", drawing.style.lineWidth || 2);
        h.ctx.stroke(); h.ctx.setLineDash([]);

        // Angles
        if (props.showAngles) {
            h.ctx.save();
            h.ctx.beginPath();
            h.drawSegment({ x: left, y: top }, { x: left + W, y: top + H });
            h.drawSegment({ x: left, y: top + H }, { x: left + W, y: top });
            h.ctx.strokeStyle = props.useOneColor ? props.oneColor : (props.color || "#2962ff");
            h.ctx.lineWidth = drawing.style.lineWidth || 1;
            h.ctx.globalAlpha = (drawing.style.lineOpacity || 1) * 0.5;
            h.ctx.stroke();
            h.ctx.restore();
        }

        // Fans
        if (props.showFans && props.fans) {
            h.ctx.save(); h.ctx.beginPath(); h.ctx.rect(left, top, W, H); h.ctx.clip();
            props.fans.filter(f => f.enabled).forEach(fan => {
                const color = props.useOneColor ? props.oneColor : fan.color;
                h.ctx.strokeStyle = color;
                h.ctx.globalAlpha = fan.lineOpacity || 0.5;
                h.applyLineDash(fan.lineStyle || "solid", fan.lineWidth || 1);

                const parts = fan.ratio.split("x").map(Number);
                if (parts.length === 2) {
                    const rX = parts[0]; const rY = parts[1];
                    h.ctx.beginPath();
                    h.ctx.moveTo(p1!.x, p1!.y);
                    h.ctx.lineTo(p1!.x + (p2!.x - p1!.x) * (rY / rX) * 10, p1!.y + (p2!.y - p1!.y) * 10);
                    h.ctx.moveTo(p1!.x, p1!.y);
                    h.ctx.lineTo(p1!.x + (p2!.x - p1!.x) * 10, p1!.y + (p2!.y - p1!.y) * (rX / rY) * 10);
                    h.ctx.stroke();
                }
            });
            h.ctx.restore();
        }

        // Arcs
        if (props.showArcs && props.arcs) {
            h.ctx.save(); h.ctx.beginPath(); h.ctx.rect(left, top, W, H); h.ctx.clip();
            props.arcs.filter(a => a.enabled).forEach(arc => {
                const color = props.useOneColor ? props.oneColor : arc.color;
                h.ctx.strokeStyle = color;
                h.ctx.globalAlpha = arc.lineOpacity || 0.5;
                h.applyLineDash(arc.lineStyle || "solid", arc.lineWidth || 1);

                const ratio = parseFloat(arc.ratio);
                const diag = Math.sqrt(W * W + H * H);
                const radius = diag * ratio;

                h.ctx.beginPath(); h.ctx.arc(p1!.x, p1!.y, radius, 0, Math.PI * 2); h.ctx.stroke();
                // Double arc for fidelity (matches legacy renderer)
                h.ctx.beginPath(); h.ctx.arc(p1!.x, p1!.y, radius + 3, 0, Math.PI * 2); h.ctx.stroke();
            });
            h.ctx.restore();
        }

        // Time/Price Stats Labels
        // Time/Price Stats Labels
        if (props.showLabels) {
            h.ctx.save();
            const sColor = props.oneColor || props.color || drawing.style.color || "#2196f3";
            h.ctx.fillStyle = props.useOneColor ? sColor : (props.color || drawing.style.color || "#2196f3");
            h.ctx.globalAlpha = 1;
            h.ctx.font = "10px Inter";
            const barsLabel = `Time: ${Math.abs(Number(pts[1].time) - Number(pts[0].time))}`;
            const priceLabel = `Price: ${Math.abs(pts[1].value - pts[0].value).toFixed(2)}`;
            h.ctx.fillText(`${barsLabel}, ${priceLabel}`, left + 5, top + H - 5);
            h.ctx.restore();
        }

        if (isSelected) {
            h.drawHandle(p1!); h.drawHandle(p2!);
        }

        if (drawing.showText && drawing.text) {
            h.drawTextOnLine({ x: left, y: top + H / 2 }, { x: left + W, y: top + H / 2 }, drawing);
        }
        h.ctx.restore();
    }

    private renderGannFan(drawing: Drawing, dataPoints: DrawingPoint[], chart: EChartsInstance, isSelected: boolean, h: DrawingHelpers) {
        if (dataPoints.length < 2 || !drawing.gannFanProps) return;
        const props = drawing.gannFanProps;

        const toPixel = (pt: DrawingPoint) => {
            const p = chart.convertToPixel({ seriesIndex: 0 }, [pt.time, pt.value]);
            return p ? { x: p[0], y: p[1] } : null;
        };
        const p1 = toPixel(dataPoints[0]);
        const p2 = toPixel(dataPoints[1]);
        if (!p1 || !p2) return;
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) return;

        const dir = props.reverse ? -1 : 1;
        const rays = [...props.lines]
            .filter(l => l.enabled && l.denominator !== 0)
            .map(line => {
                const ratio = dir * (line.numerator / line.denominator);
                const target = { x: p1.x + dx, y: p1.y + dy * ratio };
                const endPx = extendToRay(p1, target, 5000);
                const angle = Math.atan2(endPx.y - p1.y, endPx.x - p1.x);
                return { lineDef: line, endPx, angle };
            })
            .sort((a, b) => a.angle - b.angle);

        if (props.fillBackground && rays.length > 1) {
            for (let i = 0; i < rays.length - 1; i++) {
                const rA = rays[i]; const rB = rays[i + 1];
                h.ctx.save();
                h.ctx.beginPath();
                h.ctx.moveTo(p1.x, p1.y); h.ctx.lineTo(rA.endPx.x, rA.endPx.y); h.ctx.lineTo(rB.endPx.x, rB.endPx.y);
                h.ctx.closePath();
                h.ctx.fillStyle = rA.lineDef.fillColor || rA.lineDef.color;
                h.ctx.globalAlpha = rA.lineDef.fillOpacity ?? 0.07;
                h.ctx.fill();
                h.ctx.restore();
            }
        }

        rays.forEach(ray => {
            h.ctx.save();
            h.ctx.beginPath(); h.ctx.moveTo(p1.x, p1.y); h.ctx.lineTo(ray.endPx.x, ray.endPx.y);
            h.ctx.strokeStyle = ray.lineDef.color;
            h.ctx.lineWidth = ray.lineDef.lineWidth;
            h.ctx.globalAlpha = ray.lineDef.lineOpacity ?? 1;
            h.applyLineDash(ray.lineDef.lineStyle, ray.lineDef.lineWidth);
            h.ctx.stroke();

            if (props.showLabels) {
                const rayDx = ray.endPx.x - p1.x; const rayDy = ray.endPx.y - p1.y;
                const dist = 70;
                const angle = Math.atan2(rayDy, rayDx);
                h.ctx.save();
                h.ctx.translate(p1.x + Math.cos(angle) * dist, p1.y + Math.sin(angle) * dist);
                let textAngle = angle;
                if (textAngle > Math.PI / 2 || textAngle < -Math.PI / 2) textAngle += Math.PI;
                h.ctx.rotate(textAngle);
                h.ctx.font = "10px Inter"; h.ctx.fillStyle = ray.lineDef.color;
                h.ctx.textAlign = "center"; h.ctx.textBaseline = "bottom";
                h.ctx.fillText(ray.lineDef.ratio, 0, -2);
                h.ctx.restore();
            }
            h.ctx.restore();
        });

        if (drawing.showText && drawing.text) {
            // Render text along the vector defined by P1 and P2 (the user's manual anchors)
            // Using medianRay.endPx would place the text off-screen due to infinite projection ratio
            h.drawTextOnLine(p1, p2, drawing);
        }

        if (isSelected) {
            h.drawHandle(p1); h.drawHandle(p2);
        }
    }
}
