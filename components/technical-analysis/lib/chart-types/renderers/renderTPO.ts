import type { TpoProfile, TpoRow } from "../domain/types";
import type { ChartTypeRenderer, CustomRenderApi, CustomRenderParams } from "./types";
import { PRICE_CUSTOM_SERIES_BINDING, makeTextShape } from "./helpers";

interface RenderableTpoProfile {
  categoryIndex: number;
  profile: TpoProfile;
  rows: TpoRow[];
}

const MAX_RENDERED_TPO_PROFILES = 260;
const MAX_TOTAL_TPO_ROWS = 5_200;
const MIN_TPO_ROWS_PER_PROFILE = 4;

const buildSampledIndexes = (count: number, maxCount: number): number[] => {
  if (count <= maxCount) return Array.from({ length: count }, (_unused, index) => index);

  const step = Math.ceil(count / maxCount);
  const indexes: number[] = [];
  for (let index = 0; index < count; index += step) indexes.push(index);

  const lastIndex = count - 1;
  if (indexes[indexes.length - 1] !== lastIndex) indexes.push(lastIndex);
  return indexes;
};

const compactRows = (rows: TpoRow[], maxRows: number): TpoRow[] => {
  if (rows.length <= maxRows) return rows;

  const selectedIndexes = new Set<number>();
  const pocIndex = rows.findIndex((row) => row.isPoc);
  if (pocIndex >= 0) selectedIndexes.add(pocIndex);

  const step = Math.max(1, Math.ceil(rows.length / Math.max(1, maxRows - selectedIndexes.size)));
  for (let index = 0; index < rows.length && selectedIndexes.size < maxRows; index += step) {
    selectedIndexes.add(index);
  }

  return Array.from(selectedIndexes)
    .sort((left, right) => left - right)
    .map((index) => rows[index])
    .filter((row): row is TpoRow => row !== undefined);
};

const buildRenderableProfiles = (profiles: TpoProfile[]): RenderableTpoProfile[] => {
  const sampledIndexes = buildSampledIndexes(profiles.length, MAX_RENDERED_TPO_PROFILES);
  const maxRowsPerProfile = Math.max(
    MIN_TPO_ROWS_PER_PROFILE,
    Math.floor(MAX_TOTAL_TPO_ROWS / Math.max(1, sampledIndexes.length)),
  );

  return sampledIndexes.flatMap((categoryIndex) => {
    const profile = profiles[categoryIndex];
    if (!profile) return [];
    return [{ categoryIndex, profile, rows: compactRows(profile.rows, maxRowsPerProfile) }];
  });
};

const getRenderableCategoryIndex = (api: CustomRenderApi, fallback: number): number => {
  const value = Number(api.value(0));
  return Number.isFinite(value) ? value : fallback;
};

export const renderTPO: ChartTypeRenderer = ({ id, name, result, palette, visible }) => {
  if (result.kind !== "tpo") return [];
  const renderableProfiles = visible ? buildRenderableProfiles(result.profiles) : [];
  const profileByCategoryIndex = new Map(renderableProfiles.map((item) => [item.categoryIndex, item]));

  return [{
    id,
    name,
    type: "custom",
    ...PRICE_CUSTOM_SERIES_BINDING,
    silent: true,
    data: renderableProfiles.map((item) => [item.categoryIndex]),
    renderItem: (params: CustomRenderParams, api: CustomRenderApi) => {
      const categoryIndex = getRenderableCategoryIndex(api, params.dataIndex);
      const renderable = profileByCategoryIndex.get(categoryIndex);
      if (!renderable) return undefined;

      const children = renderable.rows.flatMap((row) => {
        const y = api.coord([categoryIndex, (row.priceLow + row.priceHigh) / 2])[1];
        const x = api.coord([categoryIndex, row.priceLow])[0];
        if (!Number.isFinite(x) || !Number.isFinite(y)) return [];

        const text = row.letters.slice(0, 12).join("");
        const color = row.isPoc ? "#f59e0b" : row.isValueArea ? palette.upColor : palette.textColor;
        const shape = makeTextShape(x, y, text, color, 9);
        return [{ ...shape, style: { ...shape.style, opacity: 1, textAlign: "left" } }];
      });

      return { type: "group", children };
    },
  }];
};

export const getTpoCategories = (profiles: TpoProfile[], fallback: string[]): string[] =>
  profiles.length > 0 ? profiles.map((profile) => new Date(profile.sessionEnd).toISOString()) : fallback;
