import type { EChartsType } from "echarts/core";
import type { Drawing } from "../../config/drawing/drawingModelTypes";
import { isChartUsable, safeConvertToPixel } from "./drawingCoordinates";

const CELL_SIZE = 150;
const MAX_CELLS_PER_SHAPE = 100;

const INFINITE_DRAWING_TYPES = new Set<string>([
  "ray",
  "x_line",
  "horizontal_line",
  "vertical_line",
  "horizontal_ray",
  "pitchfork",
  "schiff_pitchfork",
  "modified_schiff_pitchfork",
  "inside_pitchfork",
  "pitchfan",
  "gann_fan",
  "regression_trend",
]);

interface IndexedDrawing {
  drawing: Drawing;
  zIndex: number;
}

export class SpatialHashGrid {
  private cells: Map<string, IndexedDrawing[]>;
  private infiniteDrawings: IndexedDrawing[];

  constructor() {
    this.cells = new Map();
    this.infiniteDrawings = [];
  }

  public build(drawings: Drawing[], chart: EChartsType): void {
    this.cells.clear();
    this.infiniteDrawings = [];
    if (!isChartUsable(chart)) return;

    drawings.forEach((drawing, zIndex) => {
      if (drawing.hidden) return;

      if (INFINITE_DRAWING_TYPES.has(drawing.type)) {
        this.infiniteDrawings.push({ drawing, zIndex });
        return;
      }

      const bounds = this.resolveDrawingBounds(drawing, chart);
      if (!bounds) return;

      const padded = {
        minX: bounds.minX - 25,
        minY: bounds.minY - 25,
        maxX: bounds.maxX + 25,
        maxY: bounds.maxY + 25,
      };

      const startCol = Math.floor(padded.minX / CELL_SIZE);
      const endCol = Math.floor(padded.maxX / CELL_SIZE);
      const startRow = Math.floor(padded.minY / CELL_SIZE);
      const endRow = Math.floor(padded.maxY / CELL_SIZE);
      const cellsCount = (endCol - startCol + 1) * (endRow - startRow + 1);

      if (cellsCount > MAX_CELLS_PER_SHAPE) {
        this.infiniteDrawings.push({ drawing, zIndex });
        return;
      }

      this.indexDrawing(drawing, zIndex, startCol, endCol, startRow, endRow);
    });
  }

  public query(x: number, y: number): Drawing[] {
    const col = Math.floor(x / CELL_SIZE);
    const row = Math.floor(y / CELL_SIZE);
    const cellDrawings = this.cells.get(`${col},${row}`) || [];
    const combined = [...this.infiniteDrawings, ...cellDrawings];
    const uniqueMap = new Map<string, IndexedDrawing>();

    combined.forEach((item) => {
      uniqueMap.set(item.drawing.id, item);
    });

    return Array.from(uniqueMap.values())
      .sort((a, b) => b.zIndex - a.zIndex)
      .map((item) => item.drawing);
  }

  private resolveDrawingBounds(
    drawing: Drawing,
    chart: EChartsType
  ): { minX: number; minY: number; maxX: number; maxY: number } | null {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let hasValidPoints = false;

    drawing.points.forEach((point) => {
      const pix = safeConvertToPixel(chart, [point.time, point.value]);
      if (!pix) return;
      minX = Math.min(minX, pix[0]);
      maxX = Math.max(maxX, pix[0]);
      minY = Math.min(minY, pix[1]);
      maxY = Math.max(maxY, pix[1]);
      hasValidPoints = true;
    });

    return hasValidPoints ? { minX, minY, maxX, maxY } : null;
  }

  private indexDrawing(
    drawing: Drawing,
    zIndex: number,
    startCol: number,
    endCol: number,
    startRow: number,
    endRow: number
  ): void {
    for (let col = startCol; col <= endCol; col += 1) {
      for (let row = startRow; row <= endRow; row += 1) {
        const key = `${col},${row}`;
        const cell = this.cells.get(key) || [];
        cell.push({ drawing, zIndex });
        this.cells.set(key, cell);
      }
    }
  }
}
