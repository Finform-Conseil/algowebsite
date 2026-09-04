export type HistoryAxisCustomRenderApi = {
  coord: (data: unknown[]) => number[];
  value?: (dimension: number) => unknown;
  [key: string]: unknown;
};

export type HistoryAxisCustomRenderItem = (
  params: unknown,
  api: HistoryAxisCustomRenderApi,
) => unknown;

export type HistoryAxisSeriesOption = Record<string, unknown>;

const isFiniteCategoryIndex = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

/**
 * Keeps custom chart renderers on the real market-data categories when the
 * canonical viewport prepends synthetic history slots.
 *
 * ECharts applies dataZoom filtering before `renderItem()` runs. Therefore a
 * custom series whose encoded x values remain in source-space (0..N) is removed
 * from the visible window once the canonical chart prepends history categories.
 *
 * We shift the x dimension used by ECharts for filtering, then adapt the render
 * API back to source-space: `api.value(0)` stays unshifted for renderer lookups,
 * while numeric `api.coord()` calls receive the visual history offset. Array
 * position / `params.dataIndex` is never changed, preserving transformed-source
 * lookups used by Kagi, Footprint, TPO, Point & Figure and custom overlays.
 */
export const alignCustomRenderItemWithHistoryAxis = (
  series: HistoryAxisSeriesOption,
  historyAxisOffset: number,
): HistoryAxisSeriesOption => {
  if (series.type !== "custom" || typeof series.renderItem !== "function") return series;

  const safeOffset = Number.isFinite(historyAxisOffset)
    ? Math.max(0, Math.round(historyAxisOffset))
    : 0;
  if (safeOffset === 0) return series;

  const shiftDataItem = (item: unknown): unknown => {
    if (Array.isArray(item) && item.length > 0 && isFiniteCategoryIndex(item[0])) {
      return [item[0] + safeOffset, ...item.slice(1)];
    }
    if (item && typeof item === "object" && "value" in item) {
      const value = (item as { value?: unknown }).value;
      if (Array.isArray(value) && value.length > 0 && isFiniteCategoryIndex(value[0])) {
        return { ...item, value: [value[0] + safeOffset, ...value.slice(1)] };
      }
    }
    return item;
  };

  const renderItem = series.renderItem as HistoryAxisCustomRenderItem;
  const shiftedData = Array.isArray(series.data)
    ? (series.data as unknown[]).map(shiftDataItem)
    : series.data;

  return {
    ...series,
    data: shiftedData,
    renderItem: (params: unknown, api: HistoryAxisCustomRenderApi) => {
      const baseCoord = api.coord.bind(api);
      const baseValue = typeof api.value === "function" ? api.value.bind(api) : null;
      const alignedApi = Object.create(api) as HistoryAxisCustomRenderApi;
      alignedApi.coord = (data: unknown[]) => {
        if (!Array.isArray(data) || data.length === 0 || !isFiniteCategoryIndex(data[0])) {
          return baseCoord(data);
        }
        return baseCoord([data[0] + safeOffset, ...data.slice(1)]);
      };
      if (baseValue) {
        alignedApi.value = (dimension: number) => {
          const value = baseValue(dimension);
          return dimension === 0 && isFiniteCategoryIndex(value) ? value - safeOffset : value;
        };
      }
      return renderItem(params, alignedApi);
    },
  };
};

export interface RenderedTimeAxisWindowInput {
  axisCategories: unknown[];
  sourceTimes: Array<string | number>;
  sourceStartIdx: number;
  sourceEndIdx: number;
  historyGapBars: number;
}

export interface RenderedTimeAxisWindow {
  startValue: number;
  endValue: number;
}

const stripSyntheticRenderSuffix = (value: string): string =>
  value.replace(/ #\d+$/, "");

/**
 * Projects a viewport expressed in source-bar indexes onto the transformed
 * category axis. Synthetic/heavy chart types can emit fewer or more points than
 * their OHLC source; retaining raw source indexes as ECharts category indexes
 * makes those transformed series appear empty even though they rendered valid
 * data. Source dates are the stable bridge between both coordinate spaces.
 */
export const resolveRenderedTimeAxisWindow = ({
  axisCategories,
  sourceTimes,
  sourceStartIdx,
  sourceEndIdx,
  historyGapBars,
}: RenderedTimeAxisWindowInput): RenderedTimeAxisWindow => {
  const safeHistoryGap = Number.isFinite(historyGapBars)
    ? Math.max(0, Math.round(historyGapBars))
    : 0;
  const sourceLastIndex = sourceTimes.length - 1;
  if (axisCategories.length === 0 || sourceLastIndex < 0) {
    return { startValue: 0, endValue: 0 };
  }

  const sourceIndexByTime = new Map<string, number>();
  sourceTimes.forEach((time, index) => sourceIndexByTime.set(String(time), index));

  const renderedPoints = axisCategories.flatMap((category, axisIndex) => {
    if (typeof category !== "string" && typeof category !== "number") return [];
    const raw = String(category);
    const directIndex = sourceIndexByTime.get(raw);
    const sourceIndex = directIndex ?? sourceIndexByTime.get(stripSyntheticRenderSuffix(raw));
    return sourceIndex === undefined ? [] : [{ axisIndex, sourceIndex }];
  });

  if (renderedPoints.length === 0) {
    const startValue = Math.max(0, Math.min(axisCategories.length - 1, safeHistoryGap + Math.round(sourceStartIdx)));
    const endValue = Math.max(startValue, Math.min(axisCategories.length - 1, safeHistoryGap + Math.round(sourceEndIdx)));
    return { startValue, endValue };
  }

  const firstRendered = renderedPoints[0];
  const lastRendered = renderedPoints[renderedPoints.length - 1];

  const resolveStart = (sourceIndex: number): number => {
    if (sourceIndex < 0) {
      return Math.max(0, Math.min(firstRendered.axisIndex, safeHistoryGap + Math.round(sourceIndex)));
    }
    if (sourceIndex > sourceLastIndex) {
      return Math.min(
        axisCategories.length - 1,
        lastRendered.axisIndex + Math.round(sourceIndex - sourceLastIndex),
      );
    }
    return (renderedPoints.find((point) => point.sourceIndex >= sourceIndex) ?? lastRendered).axisIndex;
  };

  const resolveEnd = (sourceIndex: number): number => {
    if (sourceIndex < 0) {
      return Math.max(0, Math.min(firstRendered.axisIndex, safeHistoryGap + Math.round(sourceIndex)));
    }
    if (sourceIndex > sourceLastIndex) {
      return Math.min(
        axisCategories.length - 1,
        lastRendered.axisIndex + Math.round(sourceIndex - sourceLastIndex),
      );
    }
    for (let index = renderedPoints.length - 1; index >= 0; index -= 1) {
      if (renderedPoints[index].sourceIndex <= sourceIndex) return renderedPoints[index].axisIndex;
    }
    return firstRendered.axisIndex;
  };

  let startValue = resolveStart(sourceStartIdx);
  let endValue = resolveEnd(sourceEndIdx);
  if (endValue < startValue) {
    const centerSourceIndex = (sourceStartIdx + sourceEndIdx) / 2;
    const nearest = renderedPoints.reduce((best, point) => (
      Math.abs(point.sourceIndex - centerSourceIndex) < Math.abs(best.sourceIndex - centerSourceIndex)
        ? point
        : best
    ));
    startValue = nearest.axisIndex;
    endValue = nearest.axisIndex;
  }

  return { startValue, endValue };
};
