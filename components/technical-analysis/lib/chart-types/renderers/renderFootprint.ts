import type { FootprintCandle } from "../domain/types";
import type { ChartTypeRenderer, CustomRenderApi, CustomRenderParams } from "./types";
import { getCategoryBandWidth, makeRectShape, makeTextShape } from "./helpers";

export const renderFootprint: ChartTypeRenderer = ({ id, name, result, palette, visible }) => {
  if (result.kind !== "footprint") return [];
  const candles = result.candles;

  return [{
    id,
    name,
    type: "custom",
    data: candles.map((_, index) => [index]),
    renderItem: (params: CustomRenderParams, api: CustomRenderApi) => {
      const candle = candles[params.dataIndex];
      if (!candle) return undefined;

      const band = getCategoryBandWidth(api);
      const width = Math.max(12, band * 0.9);
      const children: Array<Record<string, unknown>> = candle.levels.flatMap((level) => {
        const top = api.coord([params.dataIndex, level.priceHigh]);
        const bottom = api.coord([params.dataIndex, level.priceLow]);
        const y = Math.min(top[1], bottom[1]);
        const height = Math.max(3, Math.abs(bottom[1] - top[1]));
        const total = Math.max(1, level.totalVolume);
        const sellWidth = width * 0.5 * (level.sellVolume / total);
        const buyWidth = width * 0.5 * (level.buyVolume / total);
        const x = top[0] - width / 2;

        return [
          makeRectShape(x + width * 0.5 - sellWidth, y, sellWidth, height, palette.downColor, "transparent", visible ? 0.55 : 0),
          makeRectShape(x + width * 0.5, y, buyWidth, height, palette.upColor, "transparent", visible ? 0.55 : 0),
          ...(height > 12 && band > 18 ? [
            makeTextShape(x + width * 0.25, y + height / 2, Math.round(level.sellVolume).toString(), palette.textColor, 9),
            makeTextShape(x + width * 0.75, y + height / 2, Math.round(level.buyVolume).toString(), palette.textColor, 9),
          ] : []),
        ];
      });

      const poc = candle.levels.find((level) => level.isPoc);
      if (poc) {
        const y = api.coord([params.dataIndex, (poc.priceLow + poc.priceHigh) / 2])[1];
        children.push({
          type: "line",
          shape: { x1: api.coord([params.dataIndex, candle.close])[0] - width / 2, y1: y, x2: api.coord([params.dataIndex, candle.close])[0] + width / 2, y2: y },
          style: { stroke: "#f59e0b", lineWidth: 1.2, opacity: visible ? 1 : 0 },
        });
      }

      return { type: "group", children };
    },
  }];
};
