export interface CustomSeriesViewportCoordSystem {
  x?: number;
  width?: number;
}

export interface CustomSeriesViewportParams {
  coordSys?: CustomSeriesViewportCoordSystem;
}

export interface CustomSeriesViewportApi {
  value?: (dimension: number) => unknown;
  coord?: (data: unknown[]) => unknown;
  size?: (dataSize: unknown[]) => unknown;
}

const toFiniteNumber = (value: unknown): number | null => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

/**
 * Cheap, transform-safe culling for ECharts custom series.
 *
 * `params.dataIndex` is only the array position inside the rendered series. It is
 * not a market-bar index for sampled or synthetic charts (TPO, Footprint, Kagi,
 * Point & Figure, ...). Culling on that value therefore removes valid visible
 * shapes whenever a transform emits fewer points than its OHLC source.
 *
 * The encoded x value, projected by ECharts through the live coordinate system,
 * is the authoritative visibility signal. It remains correct for sampled,
 * synthetic and one-to-one custom series and follows the current dataZoom.
 */
export const isCustomSeriesPointOutsideViewport = (
  params: CustomSeriesViewportParams,
  api: CustomSeriesViewportApi,
  barsMargin = 12,
): boolean => {
  const coordSysX = toFiniteNumber(params.coordSys?.x);
  const coordSysWidth = toFiniteNumber(params.coordSys?.width);
  const xValue = typeof api.value === "function" ? toFiniteNumber(api.value(0)) : null;

  if (
    coordSysX === null
    || coordSysWidth === null
    || coordSysWidth <= 0
    || xValue === null
    || typeof api.coord !== "function"
  ) {
    return false;
  }

  const point = api.coord([xValue, 0]);
  const x = Array.isArray(point) ? toFiniteNumber(point[0]) : null;
  if (x === null) return false;

  let bandWidth = 0;
  if (typeof api.size === "function") {
    const size = api.size([1, 0]);
    if (Array.isArray(size)) {
      const candidate = toFiniteNumber(size[0]);
      if (candidate !== null) bandWidth = Math.abs(candidate);
    }
  }

  const safeBarsMargin = Number.isFinite(barsMargin) ? Math.max(0, barsMargin) : 0;
  const marginPx = Math.max(24, bandWidth * safeBarsMargin);
  const left = coordSysX - marginPx;
  const right = coordSysX + coordSysWidth + marginPx;
  return x < left || x > right;
};
