import { IDrawingStrategy, HitTestResult, DrawingHelpers } from "../interfaces/IDrawingStrategy";
import type { DrawingPoint } from "../../../config/drawing/drawingPrimitiveTypes";
import type { Drawing } from "../../../config/drawing/drawingModelTypes";
import type { ChartDataPoint } from "../../Indicators/TechnicalIndicators";
import type { EChartsInstance } from "../../types/echarts";
import { TEXT_NOTE_TOOL_VARIANT_SET } from "../../../config/drawing/drawingConstants";
import type { TableDrawingProps } from "../../../config/drawing/drawingTableTypes";
import { createDefaultTableProps } from "../../../config/drawing/drawingTableTypes";

const HANDLE_HIT_THRESHOLD = 8;
const TEXT_PADDING = 8;
const CHIP_HEIGHT = 22;
const CHIP_RADIUS = 5;
const BADGE_SIZE = 16;
const PIN_BODY_OFFSET_Y = 18;
const PIN_HALF_WIDTH = 12;

const TABLE_CELL_TEXT_PADDING = 6;
const TABLE_BORDER = 1;
const TABLE_CORNER_HANDLE_SIZE = 6;
const TABLE_COL_RESIZE_THRESHOLD = 4;

interface TableLayout {
  boxX: number; boxY: number;
  totalWidth: number; totalHeight: number;
  colPositions: number[];
  rowPositions: number[];
}

function computeTableLayout(
  x: number, y: number,
  tableProps: TableDrawingProps,
  alignH: string,
  alignV: string
): TableLayout {
  const { columns, columnWidths, rows, rowHeights } = tableProps;
  const colPositions: number[] = [];
  const rowPositions: number[] = [];

  let xPos = 0;
  for (let c = 0; c < columns; c++) {
    colPositions.push(xPos);
    xPos += columnWidths[c] + TABLE_BORDER;
  }
  const totalWidth = xPos + TABLE_BORDER;

  let yPos = 0;
  for (let r = 0; r < rows; r++) {
    rowPositions.push(yPos);
    yPos += rowHeights[r] + TABLE_BORDER;
  }
  const totalHeight = yPos + TABLE_BORDER;

  let boxX: number, boxY: number;
  switch (alignH) {
    case "left": boxX = x; break;
    case "right": boxX = x - totalWidth; break;
    default: boxX = x - totalWidth / 2;
  }
  switch (alignV) {
    case "top": boxY = y; break;
    case "bottom": boxY = y - totalHeight; break;
    default: boxY = y - totalHeight / 2;
  }

  return { boxX, boxY, totalWidth, totalHeight, colPositions, rowPositions };
}

function ellipsizeText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 0 && ctx.measureText(truncated + "\u2026").width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + "\u2026";
}

function drawTableGrid(
  ctx: CanvasRenderingContext2D,
  layout: TableLayout,
  tableProps: TableDrawingProps,
  textColor: string,
  isSelected: boolean,
  lineColor?: string,
  fillColor?: string,
  fillOpacity?: number,
  fillEnabled?: boolean,
) {
  const { boxX, boxY, totalWidth, totalHeight, colPositions, rowPositions } = layout;
  const { rows, columns, columnWidths, rowHeights, cells, headerRow, headerColumn,
          borderColor, headerBgColor, headerTextColor, altRowColor } = tableProps;
  const bc = lineColor || borderColor || "#d1d4dc";

  ctx.save();

  const fillRgba = fillEnabled && fillColor && fillOpacity !== undefined
    ? `rgba(${parseInt(fillColor.slice(1,3),16)}, ${parseInt(fillColor.slice(3,5),16)}, ${parseInt(fillColor.slice(5,7),16)}, ${fillOpacity})`
    : null;
  ctx.fillStyle = fillRgba || "rgba(19, 23, 34, 0.95)";
  ctx.fillRect(boxX, boxY, totalWidth, totalHeight);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      const cell = cells[r]?.[c];
      const cellX = boxX + colPositions[c] + TABLE_BORDER;
      const cellY = boxY + rowPositions[r] + TABLE_BORDER;
      const cellW = columnWidths[c];
      const cellH = rowHeights[r];
      const isHeader = (headerRow && r === 0) || (headerColumn && c === 0);
      const isAlt = !isHeader && altRowColor && r % 2 === 0;

      if (cell?.bgColor) {
        ctx.fillStyle = cell.bgColor;
      } else if (isHeader && headerBgColor) {
        ctx.fillStyle = headerBgColor;
      } else if (isAlt) {
        ctx.fillStyle = altRowColor;
      } else if (fillRgba) {
        ctx.fillStyle = fillRgba;
      } else {
        ctx.fillStyle = "transparent";
      }
      ctx.fillRect(cellX, cellY, cellW, cellH);
    }
  }

  ctx.strokeStyle = bc;
  ctx.lineWidth = TABLE_BORDER;

  ctx.strokeRect(boxX, boxY, totalWidth, totalHeight);

  for (let c = 1; c < columns; c++) {
    const lx = boxX + colPositions[c];
    ctx.beginPath();
    ctx.moveTo(lx, boxY);
    ctx.lineTo(lx, boxY + totalHeight);
    ctx.stroke();
  }

  for (let r = 1; r < rows; r++) {
    const ly = boxY + rowPositions[r];
    ctx.beginPath();
    ctx.moveTo(boxX, ly);
    ctx.lineTo(boxX + totalWidth, ly);
    ctx.stroke();
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      const cell = cells[r]?.[c];
      const cellText = cell?.text || "";
      if (!cellText) continue;

      const cellX = boxX + colPositions[c] + TABLE_BORDER;
      const cellY = boxY + rowPositions[r] + TABLE_BORDER;
      const cellW = columnWidths[c];
      const cellH = rowHeights[r];
      const isHeader = (headerRow && r === 0) || (headerColumn && c === 0);

      const cellTextColor = cell?.textColor || (isHeader && headerTextColor ? headerTextColor : textColor) || "#d1d4dc";
      ctx.fillStyle = cellTextColor;
      ctx.font = `normal ${isHeader ? 12 : 11}px Inter, sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";

      const maxTextWidth = cellW - TABLE_CELL_TEXT_PADDING * 2;
      const displayText = maxTextWidth > 0 ? ellipsizeText(ctx, cellText, maxTextWidth) : "";
      ctx.fillText(displayText, cellX + TABLE_CELL_TEXT_PADDING, cellY + cellH / 2);
    }
  }

  ctx.restore();

  if (isSelected) {
    ctx.save();
    ctx.strokeStyle = "rgba(41, 98, 255, 0.85)";
    ctx.lineWidth = 1.5;

    ctx.strokeRect(boxX - 2, boxY - 2, totalWidth + 4, totalHeight + 4);

    const hs = TABLE_CORNER_HANDLE_SIZE;
    const corners = [
      { cx: boxX, cy: boxY },
      { cx: boxX + totalWidth, cy: boxY },
      { cx: boxX, cy: boxY + totalHeight },
      { cx: boxX + totalWidth, cy: boxY + totalHeight },
    ];

    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#2962FF";
    ctx.lineWidth = 1.5;
    for (const corner of corners) {
      ctx.fillRect(corner.cx - hs / 2, corner.cy - hs / 2, hs, hs);
      ctx.strokeRect(corner.cx - hs / 2, corner.cy - hs / 2, hs, hs);
    }

    ctx.restore();
  }
}

function getTableHitInfo(
  mx: number, my: number,
  layout: TableLayout,
  tableProps: TableDrawingProps
): { isHit: boolean; cellRow?: number; cellCol?: number; colResizeIndex?: number; resizeEdge?: string } | null {
  const { boxX, boxY, totalWidth, totalHeight, colPositions, rowPositions } = layout;
  const { rows, columns } = tableProps;

  const hs = TABLE_CORNER_HANDLE_SIZE + 4;
  const corners = [
    { x: boxX, y: boxY, edge: "topLeft" },
    { x: boxX + totalWidth, y: boxY, edge: "topRight" },
    { x: boxX, y: boxY + totalHeight, edge: "bottomLeft" },
    { x: boxX + totalWidth, y: boxY + totalHeight, edge: "bottomRight" },
  ];
  for (const c of corners) {
    if (Math.abs(mx - c.x) <= hs && Math.abs(my - c.y) <= hs) {
      return { isHit: true, resizeEdge: c.edge };
    }
  }

  if (mx < boxX || mx > boxX + totalWidth || my < boxY || my > boxY + totalHeight) {
    return null;
  }

  for (let c = 1; c < columns; c++) {
    const borderX = boxX + colPositions[c];
    if (Math.abs(mx - borderX) <= TABLE_COL_RESIZE_THRESHOLD) {
      return { isHit: true, colResizeIndex: c - 1 };
    }
  }

  for (let r = 0; r < rows; r++) {
    const cellY = boxY + rowPositions[r] + TABLE_BORDER;
    const cellH = (tableProps.rowHeights)[r];
    if (my < cellY || my >= cellY + cellH + TABLE_BORDER) continue;

    for (let c = 0; c < columns; c++) {
      const cellX = boxX + colPositions[c] + TABLE_BORDER;
      const cellW = (tableProps.columnWidths)[c];
      if (mx >= cellX && mx < cellX + cellW) {
        return { isHit: true, cellRow: r, cellCol: c };
      }
    }
  }

  return { isHit: true };
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function computeTextWidth(ctx: CanvasRenderingContext2D, text: string, fontSize: number, bold: boolean, italic: boolean): number {
  const weight = bold ? "bold " : "";
  const style = italic ? "italic " : "";
  ctx.font = `${style}${weight}${fontSize}px Inter, sans-serif`;
  return ctx.measureText(text).width;
}

function getTextBounds(
  px: number, py: number,
  text: string,
  fontSize: number,
  bold: boolean,
  italic: boolean,
  alignH: string,
  alignV: string,
  ctx: CanvasRenderingContext2D
): { left: number; top: number; right: number; bottom: number } {
  const weight = bold ? "bold " : "";
  const style = italic ? "italic " : "";
  ctx.font = `${style}${weight}${fontSize}px Inter, sans-serif`;
  const textWidth = ctx.measureText(text).width;
  const textHeight = fontSize;

  let left: number, top: number;
  switch (alignH) {
    case "left":
      left = px;
      break;
    case "right":
      left = px - textWidth;
      break;
    default:
      left = px - textWidth / 2;
  }
  switch (alignV) {
    case "top":
      top = py;
      break;
    case "bottom":
      top = py - textHeight;
      break;
    default:
      top = py - textHeight / 2;
  }

  return {
    left: left - TEXT_PADDING,
    top: top - TEXT_PADDING,
    right: left + textWidth + TEXT_PADDING,
    bottom: top + textHeight + TEXT_PADDING,
  };
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawChip(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, fill: string, stroke: string, shadow = false) {
  ctx.save();
  if (shadow) {
    ctx.shadowColor = "rgba(0, 0, 0, 0.18)";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 1;
  }
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1;
  drawRoundedRect(ctx, x, y, width, height, CHIP_RADIUS);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawCalloutTail(ctx: CanvasRenderingContext2D, x: number, y: number, height: number) {
  ctx.save();
  ctx.fillStyle = "rgba(13, 33, 54, 0.96)";
  ctx.strokeStyle = "rgba(41, 98, 255, 0.45)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 16, y + height);
  ctx.lineTo(x + 24, y + height + 8);
  ctx.lineTo(x + 30, y + height);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawMapPin(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  bodyColor: string,
  strokeColor: string,
): void {
  ctx.save();
  ctx.translate(x - 14, y - PIN_BODY_OFFSET_Y);

  const teardrop = new Path2D();
  teardrop.moveTo(14, 3);
  teardrop.bezierCurveTo(10.7, 3, 8, 5.7, 8, 9);
  teardrop.bezierCurveTo(8, 13.5, 14, 20, 14, 20);
  teardrop.bezierCurveTo(14, 20, 20, 13.5, 20, 9);
  teardrop.bezierCurveTo(20, 5.7, 17.3, 3, 14, 3);
  teardrop.closePath();

  ctx.fillStyle = bodyColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.5;
  ctx.fill(teardrop);
  ctx.stroke(teardrop);

  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(14, 8, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(14, 8, 2.5, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function getPinBodyBounds(x: number, y: number): { left: number; top: number; right: number; bottom: number } {
  return {
    left: x - PIN_HALF_WIDTH,
    top: y - PIN_BODY_OFFSET_Y,
    right: x + PIN_HALF_WIDTH,
    bottom: y,
  };
}

export class TextNoteStrategy implements IDrawingStrategy {
  supportedTools = ["text_note", "pin", "table"];

  render(
    pts: { x: number; y: number }[],
    _dataPoints: DrawingPoint[],
    drawing: Drawing,
    _chart: EChartsInstance,
    isSelected: boolean,
    h: DrawingHelpers,
    _chartData: ChartDataPoint[]
  ): void {
    if (pts.length < 1) return;

    const { x, y } = pts[0];
    const ctx = h.ctx;

    const displayText = drawing.text && drawing.showText ? drawing.text : "Text";
    const textColor = drawing.textColor || drawing.style.color || "#2962FF";
    const fontSize = drawing.fontSize || 14;
    const weight = drawing.textBold ? "bold " : "";
    const style = drawing.textItalic ? "italic " : "";
    const alignH = drawing.textAlignmentHorizontal || "center";
    const alignV = drawing.textAlignmentVertical || "middle";
    const variant = TEXT_NOTE_TOOL_VARIANT_SET.has(drawing.type) ? drawing.type : "text_note";

    ctx.save();

    const sf = drawing.style;
    const useFill = sf.fillEnabled && sf.fillColor;
    const fc = sf.fillColor || "#2962FF";
    const fo = sf.fillOpacity ?? 0.14;

    function styleFill(defaultColor: string, defaultOpacity: number, strokeOpacityBoost = 0.4): [string, string] {
      const fill = useFill ? hexToRgba(fc, fo) : hexToRgba(defaultColor, defaultOpacity);
      const stroke = useFill ? hexToRgba(fc, Math.min(fo + strokeOpacityBoost, 1)) : hexToRgba(defaultColor, defaultOpacity + strokeOpacityBoost);
      return [fill, stroke];
    }

    if (variant === "table") {
      const tableProps = drawing.tableProps || createDefaultTableProps();
      const layout = computeTableLayout(x, y, tableProps, alignH, alignV);
      drawTableGrid(ctx, layout, tableProps, textColor, isSelected, sf.color, sf.fillColor, sf.fillOpacity, sf.fillEnabled);
    } else if (variant === "note" || variant === "callout" || variant === "pin") {
      const textWidth = computeTextWidth(ctx, displayText, fontSize, !!drawing.textBold, !!drawing.textItalic);
      const chipDimensions = variant !== "pin" ? (() => {
        const cw = Math.max(textWidth + TEXT_PADDING * 2, 54);
        const ch = Math.max(CHIP_HEIGHT, fontSize + 12);
        const bx = alignH === "left" ? x : alignH === "right" ? x - cw : x - cw / 2;
        const by = alignV === "top" ? y : alignV === "bottom" ? y - ch : y - ch / 2;
        return { chipWidth: cw, chipHeight: ch, boxX: bx, boxY: by };
      })() : null;
      const chipWidth = chipDimensions?.chipWidth ?? 0;
      const chipHeight = chipDimensions?.chipHeight ?? 0;
      const boxX = chipDimensions?.boxX ?? 0;
      const boxY = chipDimensions?.boxY ?? 0;

      if (variant === "note") {
        const [fill, stroke] = styleFill("#2962FF", 0.14, 0.4);
        drawChip(ctx, boxX, boxY, chipWidth, chipHeight, fill, stroke, true);
      } else if (variant === "callout") {
        const [fill, stroke] = styleFill("#0d2136", 0.96, 0);
        drawChip(ctx, boxX, boxY, chipWidth, chipHeight, fill, stroke, true);
        drawCalloutTail(ctx, boxX, boxY, chipHeight);
      } else if (variant === "pin") {
        const bodyColor = sf.color || "#2962FF";
        const strokeColor = sf.color || "#2962FF";
        drawMapPin(ctx, x, y, bodyColor, strokeColor);
      }

      if (isSelected) {
        if (variant === "pin") {
          const pinTop = y - PIN_BODY_OFFSET_Y;
          const pinLeft = x - PIN_HALF_WIDTH;
          const pinRight = x + PIN_HALF_WIDTH;
          const pinBottom = y;
          let selTop = pinTop;
          let selLeft = pinLeft;
          let selRight = pinRight;
          let selBottom = pinBottom;
          const hasText = !!(drawing.text && drawing.showText);
          if (hasText) {
            const tw = computeTextWidth(ctx, drawing.text as string, fontSize, !!drawing.textBold, !!drawing.textItalic);
            const textAbove = pinTop - 6;
            const textHeight = fontSize;
            selTop = Math.min(selTop, textAbove - textHeight);
            selLeft = Math.min(selLeft, x - tw / 2 - TEXT_PADDING);
            selRight = Math.max(selRight, x + tw / 2 + TEXT_PADDING);
          }
          ctx.save();
          ctx.strokeStyle = "rgba(41, 98, 255, 0.85)";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([]);
          drawRoundedRect(ctx, selLeft - 3, selTop - 3, selRight - selLeft + 6, selBottom - selTop + 6, 4);
          ctx.stroke();
          ctx.restore();
        } else if (variant === "note" || variant === "callout") {
          const selectionHeight = variant === "callout" ? chipHeight + 10 : chipHeight;
          const selectionY = variant === "callout" ? boxY - 2 : boxY;
          ctx.save();
          ctx.strokeStyle = "rgba(41, 98, 255, 0.85)";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([]);
          drawRoundedRect(ctx, boxX - 2, selectionY - 2, chipWidth + 4, selectionHeight + 4, CHIP_RADIUS + 2);
          ctx.stroke();
          ctx.restore();
        }
      }

      if (variant === "pin") {
        if (drawing.text && drawing.showText) {
          ctx.font = `${style}${weight}${fontSize}px Inter, sans-serif`;
          ctx.fillStyle = textColor;
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          const textY = y - PIN_BODY_OFFSET_Y - 6;
          ctx.fillText(drawing.text, x, textY);
        }
      } else {
        ctx.font = `${style}${weight}${fontSize}px Inter, sans-serif`;
        ctx.fillStyle = textColor;
        ctx.textBaseline = alignV as CanvasTextBaseline;
        ctx.textAlign = alignH as CanvasTextAlign;
        ctx.fillText(displayText, x, y);
      }
    } else {
      const textWidth = computeTextWidth(ctx, displayText, fontSize, !!drawing.textBold, !!drawing.textItalic);
      const cw = Math.max(textWidth + TEXT_PADDING * 2, 54);
      const ch = Math.max(CHIP_HEIGHT, fontSize + 12);
      const boxX = alignH === "left" ? x : alignH === "right" ? x - cw : x - cw / 2;
      const boxY = alignV === "top" ? y : alignV === "bottom" ? y - ch : y - ch / 2;

      const underlineY = boxY + ch + 2;
      ctx.strokeStyle = textColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(boxX + TEXT_PADDING, underlineY);
      ctx.lineTo(boxX + cw - TEXT_PADDING, underlineY);
      ctx.stroke();

      if (isSelected) {
        const bounds = getTextBounds(x, y, displayText, fontSize, !!drawing.textBold, !!drawing.textItalic, alignH, alignV, ctx);
        ctx.strokeStyle = drawing.style.color;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top);
        ctx.setLineDash([]);
      }

      ctx.font = `${style}${weight}${fontSize}px Inter, sans-serif`;
      ctx.fillStyle = textColor;
      ctx.textBaseline = alignV as CanvasTextBaseline;
      ctx.textAlign = alignH as CanvasTextAlign;
      ctx.fillText(displayText, x, y);
    }

    ctx.restore();
  }

  hitTest(
    mx: number, my: number,
    drawing: Drawing,
    chartInstance: EChartsInstance,
    threshold: number
  ): HitTestResult {
    const points = drawing.points
      .map((p) => {
        const pixel = chartInstance.convertToPixel({ seriesIndex: 0 }, [p.time, p.value]);
        return pixel ? { x: pixel[0], y: pixel[1] } : null;
      })
      .filter((p): p is { x: number; y: number } => p !== null);

    if (points.length < 1) return { isHit: false, hitType: null };

    const { x, y } = points[0];

    if (Math.hypot(mx - x, my - y) < HANDLE_HIT_THRESHOLD) {
      return { isHit: true, hitType: "point", pointIndex: 0 };
    }

    const variant = TEXT_NOTE_TOOL_VARIANT_SET.has(drawing.type) ? drawing.type : "text_note";

    if (variant === "table") {
      const tableProps = drawing.tableProps || createDefaultTableProps();
      const alignH = drawing.textAlignmentHorizontal || "center";
      const alignV = drawing.textAlignmentVertical || "middle";
      const layout = computeTableLayout(x, y, tableProps, alignH, alignV);
      const hitInfo = getTableHitInfo(mx, my, layout, tableProps);
      if (!hitInfo) return { isHit: false, hitType: null };
      return {
        isHit: true,
        hitType: hitInfo.colResizeIndex !== undefined ? "width_resize" : hitInfo.resizeEdge ? "shape" : "shape",
        cellRow: hitInfo.cellRow,
        cellCol: hitInfo.cellCol,
        colResizeIndex: hitInfo.colResizeIndex,
        resizeEdge: hitInfo.resizeEdge as HitTestResult["resizeEdge"],
      };
    }

    const displayText = drawing.text && drawing.showText ? drawing.text : "Text";
    const fontSize = drawing.fontSize || 14;
    const bold = !!drawing.textBold;
    const italic = !!drawing.textItalic;

    if (variant === "pin") {
      const bodyBounds = getPinBodyBounds(x, y);
      if (mx >= bodyBounds.left && mx <= bodyBounds.right && my >= bodyBounds.top && my <= bodyBounds.bottom) {
        return { isHit: true, hitType: "shape" };
      }
      if (drawing.text && drawing.showText) {
        const canvas = document.createElement("canvas");
        const tempCtx = canvas.getContext("2d");
        if (tempCtx) {
          const weight = bold ? "bold " : "";
          const style = italic ? "italic " : "";
          tempCtx.font = `${style}${weight}${fontSize}px Inter, sans-serif`;
          const tw = tempCtx.measureText(drawing.text).width;
          const textY = y - PIN_BODY_OFFSET_Y - 6;
          const textTop = textY - fontSize;
          const textBottom = textY + 2;
          const textLeft = x - tw / 2 - TEXT_PADDING;
          const textRight = x + tw / 2 + TEXT_PADDING;
          if (mx >= textLeft && mx <= textRight && my >= textTop && my <= textBottom) {
            return { isHit: true, hitType: "shape" };
          }
        }
      }
      return { isHit: false, hitType: null };
    }

    const canvas = document.createElement("canvas");
    const tempCtx = canvas.getContext("2d");
    if (!tempCtx) return { isHit: false, hitType: null };

    const alignH = drawing.textAlignmentHorizontal || "center";
    const alignV = drawing.textAlignmentVertical || "middle";
    const bounds = getTextBounds(x, y, displayText, fontSize, bold, italic, alignH, alignV, tempCtx);

    if (mx >= bounds.left && mx <= bounds.right && my >= bounds.top && my <= bounds.bottom) {
      return { isHit: true, hitType: "shape" };
    }

    return { isHit: false, hitType: null };
  }
}
