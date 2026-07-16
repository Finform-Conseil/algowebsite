import type { ChartTransformInput, ChartTransformResult, KagiSegment } from "../domain/types";
import { makeSourceMap } from "../domain/types";
import { resolvePriceBasedSize, syntheticPriceWarning, type PriceBasedSizeSettings } from "./priceBasedUtils";

export interface KagiSettings extends PriceBasedSizeSettings {}

type KagiDirection = "up" | "down";

export const transformKagi = (
  input: ChartTransformInput,
  settings: KagiSettings = {},
): ChartTransformResult => {
  if (input.bars.length === 0) {
    return { kind: "custom", synthetic: true, warnings: [syntheticPriceWarning("Kagi")], items: [] };
  }

  const lineSize = resolvePriceBasedSize(input, settings);
  const segments: KagiSegment[] = [];
  let direction: KagiDirection | null = null;
  let pivotTime = input.bars[0].time;
  let pivotPrice = input.bars[0].close;
  let extremePrice = pivotPrice;
  let shoulderHigh = pivotPrice;
  let waistLow = pivotPrice;
  let thickness: "yin" | "yang" = "yin";

  input.bars.slice(1).forEach((bar) => {
    const price = bar.close;
    if (direction === null) {
      direction = price >= pivotPrice ? "up" : "down";
      extremePrice = price;
      pushVertical(segments, pivotTime, bar.time, pivotPrice, price, direction, thickness, bar.sourceIndex);
      pivotTime = bar.time;
      return;
    }

    if (direction === "up") {
      if (price > extremePrice) {
        extremePrice = price;
        if (price > shoulderHigh) thickness = "yang";
        replaceOrPushVertical(segments, pivotTime, bar.time, pivotPrice, price, "up", thickness, bar.sourceIndex);
      } else if (price <= extremePrice - lineSize) {
        shoulderHigh = Math.max(shoulderHigh, extremePrice);
        pushHorizontal(segments, pivotTime, bar.time, extremePrice, thickness, bar.sourceIndex);
        pivotTime = bar.time;
        pivotPrice = extremePrice;
        extremePrice = price;
        direction = "down";
        pushVertical(segments, pivotTime, bar.time, pivotPrice, price, "down", thickness, bar.sourceIndex);
      }
    } else if (price < extremePrice) {
      extremePrice = price;
      if (price < waistLow) thickness = "yin";
      replaceOrPushVertical(segments, pivotTime, bar.time, pivotPrice, price, "down", thickness, bar.sourceIndex);
    } else if (price >= extremePrice + lineSize) {
      waistLow = Math.min(waistLow, extremePrice);
      pushHorizontal(segments, pivotTime, bar.time, extremePrice, thickness, bar.sourceIndex);
      pivotTime = bar.time;
      pivotPrice = extremePrice;
      extremePrice = price;
      direction = "up";
      pushVertical(segments, pivotTime, bar.time, pivotPrice, price, "up", thickness, bar.sourceIndex);
    }
  });

  return { kind: "custom", synthetic: true, warnings: [syntheticPriceWarning("Kagi")], items: segments };
};

const pushVertical = (
  segments: KagiSegment[],
  fromTime: number,
  toTime: number,
  fromPrice: number,
  toPrice: number,
  direction: "up" | "down",
  thickness: "yin" | "yang",
  sourceIndex: number,
) => {
  segments.push({ fromTime, toTime, fromPrice, toPrice, direction, thickness, sourceMap: makeSourceMap([sourceIndex]) });
};

const replaceOrPushVertical = (
  segments: KagiSegment[],
  fromTime: number,
  toTime: number,
  fromPrice: number,
  toPrice: number,
  direction: "up" | "down",
  thickness: "yin" | "yang",
  sourceIndex: number,
) => {
  const last = segments[segments.length - 1];
  if (last?.direction === direction && last.fromTime === fromTime) {
    last.toTime = toTime;
    last.toPrice = toPrice;
    last.thickness = thickness;
    last.sourceMap = makeSourceMap([...last.sourceMap.sourceIndices, sourceIndex]);
    return;
  }
  pushVertical(segments, fromTime, toTime, fromPrice, toPrice, direction, thickness, sourceIndex);
};

const pushHorizontal = (
  segments: KagiSegment[],
  fromTime: number,
  toTime: number,
  price: number,
  thickness: "yin" | "yang",
  sourceIndex: number,
) => {
  segments.push({
    fromTime,
    toTime,
    fromPrice: price,
    toPrice: price,
    direction: "horizontal",
    thickness,
    sourceMap: makeSourceMap([sourceIndex]),
  });
};
