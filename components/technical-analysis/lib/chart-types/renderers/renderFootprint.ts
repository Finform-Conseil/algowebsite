import type { FootprintCandle, FootprintLevel } from "../domain/types";
import type { ChartTypeRenderer, CustomRenderApi, CustomRenderParams } from "./types";
import { PRICE_CUSTOM_SERIES_BINDING, getCategoryBandWidth, makeRectShape, makeTextShape } from "./helpers";

interface RenderableFootprintCandle {
  categoryIndex: number;
  candle: FootprintCandle;
  levels: FootprintLevel[];
}

const MAX_RENDERED_FOOTPRINT_CANDLES = 260;
const MAX_TOTAL_FOOTPRINT_LEVELS = 4_800;
const MIN_LEVELS_PER_CANDLE = 4;

const buildSampledIndexes = (count: number, maxCount: number): number[] => {
  if (count <= maxCount) return Array.from({ length: count }, (_unused, index) => index);

  const step = Math.ceil(count / maxCount);
  const indexes: number[] = [];
  for (let index = 0; index < count; index += step) indexes.push(index);

  const lastIndex = count - 1;
  if (indexes[indexes.length - 1] !== lastIndex) indexes.push(lastIndex);
  return indexes;
};

const compactLevels = (levels: FootprintLevel[], maxLevels: number): FootprintLevel[] => {
  if (levels.length <= maxLevels) return levels;

  const selectedIndexes = new Set<number>();
  const pocIndex = levels.findIndex((level) => level.isPoc);
  if (pocIndex >= 0) selectedIndexes.add(pocIndex);

  const step = Math.max(1, Math.ceil(levels.length / Math.max(1, maxLevels - selectedIndexes.size)));
  for (let index = 0; index < levels.length && selectedIndexes.size < maxLevels; index += step) {
    selectedIndexes.add(index);
  }

  return Array.from(selectedIndexes)
    .sort((left, right) => left - right)
    .map((index) => levels[index])
    .filter((level): level is FootprintLevel => level !== undefined);
};

const buildRenderableCandles = (candles: FootprintCandle[]): RenderableFootprintCandle[] => {
  const sampledIndexes = buildSampledIndexes(candles.length, MAX_RENDERED_FOOTPRINT_CANDLES);
  const maxLevelsPerCandle = Math.max(
    MIN_LEVELS_PER_CANDLE,
    Math.floor(MAX_TOTAL_FOOTPRINT_LEVELS / Math.max(1, sampledIndexes.length)),
  );

  return sampledIndexes.flatMap((categoryIndex) => {
    const candle = candles[categoryIndex];
    if (!candle) return [];
    return [{ categoryIndex, candle, levels: compactLevels(candle.levels, maxLevelsPerCandle) }];
  });
};

const getRenderableCategoryIndex = (api: CustomRenderApi, fallback: number): number => {
  const value = Number(api.value(0));
  return Number.isFinite(value) ? value : fallback;
};

export const renderFootprint: ChartTypeRenderer = ({ id, name, result, palette, visible }) => {
  if (result.kind !== "footprint") return [];
  const renderableCandles = visible ? buildRenderableCandles(result.candles) : [];
  const candleByCategoryIndex = new Map(renderableCandles.map((item) => [item.categoryIndex, item]));

  return [{
    id,
    name,
    type: "custom",
    ...PRICE_CUSTOM_SERIES_BINDING,
    silent: true,
    data: renderableCandles.map((item) => [item.categoryIndex]),
    renderItem: (params: CustomRenderParams, api: CustomRenderApi) => {
      const categoryIndex = getRenderableCategoryIndex(api, params.dataIndex);
      const renderable = candleByCategoryIndex.get(categoryIndex);
      if (!renderable) return undefined;

      const { candle, levels } = renderable;
      const band = getCategoryBandWidth(api);
      const width = Math.max(12, band * 0.9);
      const children: Array<Record<string, unknown>> = levels.flatMap((level) => {
        const top = api.coord([categoryIndex, level.priceHigh]);
        const bottom = api.coord([categoryIndex, level.priceLow]);
        if (!Array.isArray(top) || !Array.isArray(bottom) || !Number.isFinite(top[0]) || !Number.isFinite(top[1]) || !Number.isFinite(bottom[1])) {
          return [];
        }

        const y = Math.min(top[1], bottom[1]);
        const height = Math.max(3, Math.abs(bottom[1] - top[1]));
        const total = Math.max(1, level.totalVolume);
        const sellWidth = width * 0.5 * (level.sellVolume / total);
        const buyWidth = width * 0.5 * (level.buyVolume / total);
        const x = top[0] - width / 2;

        return [
          makeRectShape(x + width * 0.5 - sellWidth, y, sellWidth, height, palette.downColor, "transparent", 0.55),
          makeRectShape(x + width * 0.5, y, buyWidth, height, palette.upColor, "transparent", 0.55),
          ...(height > 12 && band > 18 ? [
            makeTextShape(x + width * 0.25, y + height / 2, Math.round(level.sellVolume).toString(), palette.textColor, 9),
            makeTextShape(x + width * 0.75, y + height / 2, Math.round(level.buyVolume).toString(), palette.textColor, 9),
          ] : []),
        ];
      });

      const poc = candle.levels.find((level) => level.isPoc);
      if (poc) {
        const y = api.coord([categoryIndex, (poc.priceLow + poc.priceHigh) / 2])[1];
        const x = api.coord([categoryIndex, candle.close])[0];
        if (Number.isFinite(x) && Number.isFinite(y)) {
          children.push({
            type: "line",
            shape: { x1: x - width / 2, y1: y, x2: x + width / 2, y2: y },
            style: { stroke: "#f59e0b", lineWidth: 1.2, opacity: 1 },
          });
        }
      }

      return { type: "group", children };
    },
  }];
};
