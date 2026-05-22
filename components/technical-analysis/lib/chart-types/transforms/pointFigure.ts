import type { ChartTransformInput, ChartTransformResult, PointFigureColumn } from "../domain/types";
import { makeSourceMap } from "../domain/types";
import { resolvePriceBasedSize, syntheticPriceWarning, type PriceBasedSizeSettings } from "./priceBasedUtils";

export interface PointFigureSettings extends PriceBasedSizeSettings {
  reversalAmount?: number;
  oneStepBackBuilding?: boolean;
}

export const transformPointFigure = (
  input: ChartTransformInput,
  settings: PointFigureSettings = {},
): ChartTransformResult => {
  if (input.bars.length === 0) {
    return { kind: "custom", synthetic: true, warnings: [syntheticPriceWarning("Point & Figure")], items: [] };
  }

  const boxSize = resolvePriceBasedSize(input, settings);
  const reversalAmount = Math.max(1, Math.floor(settings.reversalAmount ?? 3));
  const columns: PointFigureColumn[] = [];
  let current = makeColumn("x", [input.bars[0].close], input.bars[0].sourceIndex);
  columns.push(current);

  input.bars.slice(1).forEach((bar) => {
    const price = bar.close;

    if (current.kind === "x") {
      const high = Math.max(...current.boxes);
      if (price >= high + boxSize) {
        addBoxes(current, high + boxSize, price, boxSize, 1, bar.sourceIndex);
      } else if (price <= high - boxSize * reversalAmount) {
        current = makeColumn("o", [], bar.sourceIndex);
        addBoxes(current, high - boxSize, price, boxSize, -1, bar.sourceIndex);
        columns.push(current);
      }
    } else {
      const low = Math.min(...current.boxes);
      if (price <= low - boxSize) {
        addBoxes(current, low - boxSize, price, boxSize, -1, bar.sourceIndex);
      } else if (price >= low + boxSize * reversalAmount) {
        current = makeColumn("x", [], bar.sourceIndex);
        addBoxes(current, low + boxSize, price, boxSize, 1, bar.sourceIndex);
        columns.push(current);
      }
    }
  });

  return { kind: "custom", synthetic: true, warnings: [syntheticPriceWarning("Point & Figure")], items: columns };
};

const makeColumn = (kind: "x" | "o", boxes: number[], sourceIndex: number): PointFigureColumn => ({
  kind,
  boxes,
  sourceMap: makeSourceMap([sourceIndex]),
});

const addBoxes = (
  column: PointFigureColumn,
  start: number,
  price: number,
  boxSize: number,
  direction: 1 | -1,
  sourceIndex: number,
) => {
  if (direction > 0) {
    for (let box = start; box <= price; box += boxSize) column.boxes.push(box);
  } else {
    for (let box = start; box >= price; box -= boxSize) column.boxes.push(box);
  }
  column.sourceMap = makeSourceMap([...column.sourceMap.sourceIndices, sourceIndex]);
};
