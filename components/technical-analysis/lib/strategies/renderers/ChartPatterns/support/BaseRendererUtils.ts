import { DrawingHelpers } from "../../../interfaces/IDrawingStrategy";

// ─── PRIMITIVE CANVAS HELPERS ────────────────────────────────────────────────
// Shared by all renderer modules to avoid duplication.

export function drawHollowHandle(
    p: { x: number; y: number },
    color: string,
    helpers: DrawingHelpers
): void {
    const { ctx } = helpers;
    ctx.save();
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
}

export function fixedRoundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
): void {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

export function isPointNearSegment(
    mx: number,
    my: number,
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    threshold: number
): boolean {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const lengthSq = dx * dx + dy * dy;
    if (lengthSq === 0) {
        return Math.sqrt(Math.pow(mx - p1.x, 2) + Math.pow(my - p1.y, 2)) < threshold;
    }
    let t = ((mx - p1.x) * dx + (my - p1.y) * dy) / lengthSq;
    t = Math.max(0, Math.min(1, t));
    const projX = p1.x + t * dx;
    const projY = p1.y + t * dy;
    return Math.sqrt(Math.pow(mx - projX, 2) + Math.pow(my - projY, 2)) < threshold;
}

export function isPointNearLineInfinite(
    mx: number,
    my: number,
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    threshold: number
): boolean {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const lengthSq = dx * dx + dy * dy;
    if (lengthSq === 0) return false;
    const dist = Math.abs(dy * mx - dx * my + p2.x * p1.y - p2.y * p1.x) / Math.sqrt(lengthSq);
    return dist < threshold;
}

export function renderCustomText(
    pixelPoints: { x: number; y: number }[],
    drawing: { text?: string; fontSize?: number; textBold?: boolean; textItalic?: boolean; textColor?: string; textAlignmentHorizontal?: CanvasTextAlign; textAlignmentVertical?: CanvasTextBaseline },
    helpers: DrawingHelpers
): void {
    const { ctx } = helpers;
    ctx.save();
    const fontSize = drawing.fontSize || 13;
    ctx.font = `${drawing.textBold ? "bold " : ""}${drawing.textItalic ? "italic " : ""}${fontSize}px Inter, sans-serif`;
    ctx.fillStyle = drawing.textColor || "#ffffff";
    ctx.textAlign = drawing.textAlignmentHorizontal || "center";
    ctx.textBaseline = drawing.textAlignmentVertical || "bottom";

    const minX = Math.min(...pixelPoints.map((p) => p.x));
    const maxX = Math.max(...pixelPoints.map((p) => p.x));
    const minY = Math.min(...pixelPoints.map((p) => p.y));

    let textX = (minX + maxX) / 2;
    if (drawing.textAlignmentHorizontal === "left") textX = minX;
    else if (drawing.textAlignmentHorizontal === "right") textX = maxX;

    const textY = minY - 15;
    ctx.fillText(drawing.text || "", textX, textY);
    ctx.restore();
}
