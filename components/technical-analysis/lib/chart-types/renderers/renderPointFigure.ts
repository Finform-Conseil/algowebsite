import type { PointFigureColumn } from "../domain/types";
import type { ChartTypeRenderer, CustomRenderApi, CustomRenderParams } from "./types";
import { PRICE_CUSTOM_SERIES_BINDING, makeTextShape } from "./helpers";

export const renderPointFigure: ChartTypeRenderer = ({ id, name, result, palette, visible }) => {
  if (result.kind !== "custom") return [];
  const columns = result.items as PointFigureColumn[];

  return [{
    id,
    name,
    type: "custom",
    ...PRICE_CUSTOM_SERIES_BINDING,
    data: columns.map((_, index) => [index]),
    renderItem: (params: CustomRenderParams, api: CustomRenderApi) => {
      const column = columns[params.dataIndex];
      if (!column) return undefined;

      const color = column.kind === "x" ? palette.upColor : palette.downColor;
      return {
        type: "group",
        children: column.boxes.map((box) => {
          const point = api.coord([params.dataIndex, box]);
          return {
            ...makeTextShape(point[0], point[1], column.kind === "x" ? "X" : "O", color, 11),
            style: {
              x: point[0],
              y: point[1],
              text: column.kind === "x" ? "X" : "O",
              fill: color,
              fontSize: 11,
              fontWeight: 700,
              opacity: visible ? 1 : 0,
              textAlign: "center",
              textVerticalAlign: "middle",
            },
          };
        }),
      };
    },
  }];
};
