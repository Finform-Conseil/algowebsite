import type { TpoProfile } from "../domain/types";
import type { ChartTypeRenderer, CustomRenderApi, CustomRenderParams } from "./types";
import { makeTextShape } from "./helpers";

export const renderTPO: ChartTypeRenderer = ({ id, name, result, palette, visible }) => {
  if (result.kind !== "tpo") return [];
  const profiles = result.profiles;

  return [{
    id,
    name,
    type: "custom",
    data: profiles.map((_, index) => [index]),
    renderItem: (params: CustomRenderParams, api: CustomRenderApi) => {
      const profile = profiles[params.dataIndex];
      if (!profile) return undefined;

      const children = profile.rows.map((row) => {
        const y = api.coord([params.dataIndex, (row.priceLow + row.priceHigh) / 2])[1];
        const x = api.coord([params.dataIndex, row.priceLow])[0];
        const text = row.letters.slice(0, 12).join("");
        const color = row.isPoc ? "#f59e0b" : row.isValueArea ? palette.upColor : palette.textColor;
        const shape = makeTextShape(x, y, text, color, 9);
        return { ...shape, style: { ...shape.style, opacity: visible ? 1 : 0, textAlign: "left" } };
      });

      return { type: "group", children };
    },
  }];
};

export const getTpoCategories = (profiles: TpoProfile[], fallback: string[]): string[] =>
  profiles.length > 0 ? profiles.map((profile) => new Date(profile.sessionEnd).toISOString()) : fallback;
