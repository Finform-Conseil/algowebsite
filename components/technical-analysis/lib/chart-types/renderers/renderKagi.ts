import type { KagiSegment } from "../domain/types";
import { PRICE_CUSTOM_SERIES_BINDING } from "./helpers";
import type { ChartTypeRenderer, CustomRenderApi, CustomRenderParams } from "./types";

export const renderKagi: ChartTypeRenderer = ({ id, name, result, palette, visible }) => {
  if (result.kind !== "custom") return [];
  const segments = result.items as KagiSegment[];

  return [{
    id,
    name,
    type: "custom",
    ...PRICE_CUSTOM_SERIES_BINDING,
    data: segments.map((_, index) => [index]),
    renderItem: (params: CustomRenderParams, api: CustomRenderApi) => {
      const segment = segments[params.dataIndex];
      if (!segment) return undefined;

      const from = api.coord([params.dataIndex, segment.fromPrice]);
      const to = api.coord([params.dataIndex + 1, segment.toPrice]);
      const color = segment.direction === "down" ? palette.downColor : palette.upColor;

      return {
        type: "line",
        shape: { x1: from[0], y1: from[1], x2: to[0], y2: to[1] },
        style: {
          stroke: color,
          lineWidth: segment.thickness === "yang" ? 3 : 1.4,
          opacity: visible ? 1 : 0,
        },
      };
    },
  }];
};
