import type { SourceMapEntry, VolumeProfile, VolumeProfileRow } from "../domain/types";
import type { ChartTypeRenderer, CustomRenderApi, CustomRenderParams } from "./types";
import { buildLatestPriceMarkLine, getCategoryBandWidth, makeLineShape, makeRectShape } from "./helpers";

interface RenderableProfile {
  anchorIndex: number;
  startIndex: number;
  endIndex: number;
  viewportAnchored: boolean;
  profile: VolumeProfile;
  rows: VolumeProfileRow[];
  maxVolume: number;
}

const MAX_RENDERED_PROFILES = 360;
const MAX_TOTAL_RECTS = 5200;
const MIN_ROWS_PER_PROFILE = 6;
const MAX_PROFILE_PIXEL_WIDTH = 300;
const MIN_PROFILE_PIXEL_WIDTH = 56;

const clampNumber = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const getSourceStartIndex = (sourceMap: SourceMapEntry): number =>
  sourceMap.sourceStartIndex;

const getSourceEndIndex = (sourceMap: SourceMapEntry): number =>
  sourceMap.sourceEndIndex;

const buildSampledProfileIndexes = (profileCount: number): number[] => {
  if (profileCount <= MAX_RENDERED_PROFILES) {
    return Array.from({ length: profileCount }, (_unused, index) => index);
  }

  const step = Math.ceil(profileCount / MAX_RENDERED_PROFILES);
  const indexes: number[] = [];
  for (let index = 0; index < profileCount; index += step) indexes.push(index);

  const lastIndex = profileCount - 1;
  if (indexes[indexes.length - 1] !== lastIndex) indexes.push(lastIndex);

  return indexes;
};

const compactRows = (rows: VolumeProfileRow[], maxRows: number): VolumeProfileRow[] => {
  if (rows.length <= maxRows) return rows;

  const step = Math.ceil(rows.length / maxRows);
  const compacted: VolumeProfileRow[] = [];

  rows.forEach((row, index) => {
    if (row.isPoc || index % step === 0) compacted.push(row);
  });

  return compacted;
};

const resolveRenderableIndexes = (
  profile: VolumeProfile,
  dateLabelCount: number,
  useAggregateFallback: boolean,
): { anchorIndex: number; startIndex: number; endIndex: number } => {
  if (useAggregateFallback) {
    const sourceEndIndex = getSourceEndIndex(profile.sourceMap);
    const endIndex = Math.max(0, dateLabelCount - 1);
    return { anchorIndex: Math.min(sourceEndIndex, endIndex), startIndex: 0, endIndex };
  }

  const startIndex = getSourceStartIndex(profile.sourceMap);
  const endIndex = getSourceEndIndex(profile.sourceMap);
  return { anchorIndex: endIndex, startIndex, endIndex };
};

const buildRenderableProfiles = (
  profiles: VolumeProfile[],
  dateLabelCount: number,
  useAggregateFallback: boolean,
): RenderableProfile[] => {
  const sampledIndexes = buildSampledProfileIndexes(profiles.length);
  const maxRowsPerProfile = Math.max(
    MIN_ROWS_PER_PROFILE,
    Math.floor(MAX_TOTAL_RECTS / Math.max(1, sampledIndexes.length)),
  );

  return sampledIndexes.flatMap((index) => {
    const profile = profiles[index];
    if (!profile) return [];

    const rows = compactRows(profile.rows, maxRowsPerProfile);
    const maxVolume = Math.max(...rows.map((row) => row.totalVolume), 1);
    const indexes = resolveRenderableIndexes(profile, dateLabelCount, useAggregateFallback);
    return [{ ...indexes, viewportAnchored: useAggregateFallback, profile, rows, maxVolume }];
  });
};

const resolveCoordSysRect = (params: CustomRenderParams) => {
  const { coordSys } = params;
  if (!coordSys) return null;

  const { x, y, width, height } = coordSys;
  if (![x, y, width, height].every((value) => Number.isFinite(value))) return null;

  return {
    x: Number(x),
    y: Number(y),
    width: Number(width),
    height: Number(height),
  };
};

const getSafeBandWidth = (api: CustomRenderApi): number => {
  try {
    const width = getCategoryBandWidth(api);
    return Number.isFinite(width) && width > 0 ? width : 10;
  } catch {
    return 10;
  }
};

const getSafeCoordX = (
  index: number,
  price: number,
  api: CustomRenderApi,
  fallback: number,
): number => {
  const coord = api.coord([index, price]);
  return Array.isArray(coord) && Number.isFinite(coord[0]) ? coord[0] : fallback;
};

const resolveProfileGeometry = (
  api: CustomRenderApi,
  renderableProfile: RenderableProfile,
  coordSys: ReturnType<typeof resolveCoordSysRect>,
): { xBase: number; xEnd: number; width: number } => {
  const { anchorIndex, startIndex, endIndex, profile } = renderableProfile;
  if (renderableProfile.viewportAnchored && coordSys) {
    const xEnd = coordSys.x + coordSys.width - 2;
    const width = clampNumber(coordSys.width * 0.22, 140, MAX_PROFILE_PIXEL_WIDTH);
    return { xBase: xEnd - width, xEnd, width };
  }

  const bandWidth = getSafeBandWidth(api);
  const sessionBarCount = Math.max(1, endIndex - startIndex + 1);
  const spanWidth = sessionBarCount * bandWidth;
  const width = clampNumber(spanWidth * 0.34, MIN_PROFILE_PIXEL_WIDTH, MAX_PROFILE_PIXEL_WIDTH);
  const defaultAnchorX = coordSys ? coordSys.x + coordSys.width - 2 : 100;
  const anchorX = getSafeCoordX(anchorIndex, profile.pocPrice, api, defaultAnchorX);

  return { xBase: anchorX - width, xEnd: anchorX, width };
};

const clipRowToCoordSys = (
  y: number,
  height: number,
  coordSys: ReturnType<typeof resolveCoordSysRect>,
): { y: number; height: number } | null => {
  if (!coordSys) return { y, height };

  const minY = coordSys.y;
  const maxY = coordSys.y + coordSys.height;
  const clippedTop = clampNumber(y, minY, maxY);
  const clippedBottom = clampNumber(y + height, minY, maxY);

  return clippedBottom > clippedTop ? { y: clippedTop, height: clippedBottom - clippedTop } : null;
};

export const renderSVP: ChartTypeRenderer = ({ id, name, result, palette, latestPrice, visible, dateLabels }) => {
  if (result.kind !== "profile") return [];

  const useAggregateFallback = result.approximate && result.profiles.length === 1;
  const renderableProfiles = buildRenderableProfiles(result.profiles, dateLabels.length, useAggregateFallback);
  const profileByAnchorIndex = new Map(
    renderableProfiles.map((profile) => [profile.anchorIndex, profile]),
  );

  return [{
    id,
    name,
    type: "candlestick",
    data: result.bars.map((bar) => {
      const color = bar.close >= bar.open ? palette.upColor : palette.downColor;
      return {
        value: [bar.open, bar.close, bar.low, bar.high],
        itemStyle: { color, color0: color, borderColor: color, borderColor0: color, opacity: visible ? 1 : 0 },
      };
    }),
    markLine: buildLatestPriceMarkLine(latestPrice, palette.liveColor),
    z: 8,
  }, {
    id: `${id}-session-volume-profile`,
    name: "Session Volume Profile",
    type: "custom",
    clip: true,
    silent: true,
    z: 12,
    data: renderableProfiles.map((profile) => [profile.anchorIndex]),
    encode: { x: 0 },
    renderItem: (params: CustomRenderParams, api: CustomRenderApi) => {
      const anchorIndex = Number(api.value(0));
      const renderableProfile = profileByAnchorIndex.get(anchorIndex);
      if (!renderableProfile) return undefined;

      const { profile, rows, maxVolume } = renderableProfile;
      const coordSys = resolveCoordSysRect(params);
      const { xBase, xEnd, width: maxProfileWidth } = resolveProfileGeometry(api, renderableProfile, coordSys);
      const children: Array<Record<string, unknown>> = rows.flatMap((row) => {
        const top = api.coord([anchorIndex, row.priceHigh]);
        const bottom = api.coord([anchorIndex, row.priceLow]);
        if (!Array.isArray(top) || !Array.isArray(bottom) || !Number.isFinite(top[1]) || !Number.isFinite(bottom[1])) {
          return [];
        }

        const width = maxProfileWidth * (row.totalVolume / maxVolume);
        const fill = row.isPoc ? "#f59e0b" : row.delta >= 0 ? palette.upColor : palette.downColor;
        const y = Math.min(top[1], bottom[1]);
        const height = Math.max(1, Math.abs(bottom[1] - top[1]));
        const clipped = clipRowToCoordSys(y, height, coordSys);
        if (!clipped) return [];

        return [makeRectShape(xEnd - width, clipped.y, width, clipped.height, fill, "transparent", visible ? 0.58 : 0)];
      });

      if (visible) {
        const pocCoord = api.coord([anchorIndex, profile.pocPrice]);
        if (Array.isArray(pocCoord) && Number.isFinite(pocCoord[1])) {
          const pocY = pocCoord[1];
          if (!coordSys || (pocY >= coordSys.y && pocY <= coordSys.y + coordSys.height)) {
            children.push(makeLineShape(xBase, pocY, xEnd, pocY, "#f59e0b", 1.1));
          }
        }
      }

      return { type: "group", children };
    },
  }];
};

export const getVolumeProfileCategories = (profiles: VolumeProfile[], fallback: string[]): string[] =>
  profiles.length > 0 ? profiles.map((profile) => new Date(profile.sessionEnd).toISOString()) : fallback;
