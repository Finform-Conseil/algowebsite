import type { ChartTransformInput, ChartTransformResult, PointFigureColumn } from "../domain/types";
import { makeSourceMap } from "../domain/types";
import {
  MAX_SYNTHETIC_POINT_FIGURE_BOXES,
  makePerformanceBudgetWarning,
  resolvePriceBasedSize,
  syntheticPriceWarning,
  type PriceBasedSizeSettings,
} from "./priceBasedUtils";

export interface PointFigureSettings extends PriceBasedSizeSettings {
  reversalAmount?: number;
  oneStepBackBuilding?: boolean;
}

export const transformPointFigure = (
  input: ChartTransformInput,
  settings: PointFigureSettings = {},
): ChartTransformResult => {
  const warnings = [syntheticPriceWarning("Point & Figure")];

  if (input.bars.length === 0) {
    return { kind: "custom", synthetic: true, warnings, items: [] };
  }

  const boxSize = resolvePriceBasedSize(input, settings);
  const reversalAmount = Math.max(1, Math.floor(settings.reversalAmount ?? 3));
  const columns: PointFigureColumn[] = [];
  let current = makeColumn("x", [input.bars[0].close], input.bars[0].sourceIndex);
  let boxCount = current.boxes.length;
  let capped = false;
  columns.push(current);

  for (const bar of input.bars.slice(1)) {
    const price = bar.close;
    const remainingBoxes = MAX_SYNTHETIC_POINT_FIGURE_BOXES - boxCount;
    if (remainingBoxes <= 0) {
      capped = true;
      break;
    }

    if (current.kind === "x") {
      const high = Math.max(...current.boxes);
      if (price >= high + boxSize) {
        boxCount += addBoxes(current, high + boxSize, price, boxSize, 1, bar.sourceIndex, remainingBoxes);
      } else if (price <= high - boxSize * reversalAmount) {
        current = makeColumn("o", [], bar.sourceIndex);
        boxCount += addBoxes(current, high - boxSize, price, boxSize, -1, bar.sourceIndex, remainingBoxes);
        columns.push(current);
      }
    } else {
      const low = Math.min(...current.boxes);
      if (price <= low - boxSize) {
        boxCount += addBoxes(current, low - boxSize, price, boxSize, -1, bar.sourceIndex, remainingBoxes);
      } else if (price >= low + boxSize * reversalAmount) {
        current = makeColumn("x", [], bar.sourceIndex);
        boxCount += addBoxes(current, low + boxSize, price, boxSize, 1, bar.sourceIndex, remainingBoxes);
        columns.push(current);
      }
    }

    if (boxCount >= MAX_SYNTHETIC_POINT_FIGURE_BOXES) {
      capped = true;
      break;
    }
  }

  return {
    kind: "custom",
    synthetic: true,
    warnings: capped ? [...warnings, makePerformanceBudgetWarning("Point & Figure", MAX_SYNTHETIC_POINT_FIGURE_BOXES)] : warnings,
    items: columns,
  };
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
  maxBoxes: number,
): number => {
  let added = 0;

  if (direction > 0) {
    for (let box = start; box <= price && added < maxBoxes; box += boxSize) {
      column.boxes.push(box);
      added += 1;
    }
  } else {
    for (let box = start; box >= price && added < maxBoxes; box -= boxSize) {
      column.boxes.push(box);
      added += 1;
    }
  }

  if (added > 0) {
    column.sourceMap = makeSourceMap([...column.sourceMap.sourceIndices, sourceIndex]);
  }

  return added;
};
