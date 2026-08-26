import type { EChartsType } from "echarts/core";
import type { ChartDataPoint } from "../Indicators/TechnicalIndicators";

const FUTURE_AXIS_CATEGORY_PREFIX = "__future__";
const HISTORY_AXIS_CATEGORY_PREFIX = "__history__";

export type AxisPointerInfo = {
  value?: string | number;
  axisDim?: string;
  axisIndex?: number;
};

export type AxisPointerPayload = {
  dataIndex?: number;
  axesInfo?: AxisPointerInfo[];
};

export type ZrMouseMovePayload = {
  offsetX?: number;
  offsetY?: number;
  event?: {
    offsetX?: number;
    offsetY?: number;
  };
};

export type AxisCategories = readonly unknown[];

export const isAxisPointerPayload = (value: unknown): value is AxisPointerPayload =>
  typeof value === "object" && value !== null;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const resolveZrMousePoint = (payload: ZrMouseMovePayload): [number, number] | null => {
  const offsetX = isFiniteNumber(payload.offsetX) ? payload.offsetX : payload.event?.offsetX;
  const offsetY = isFiniteNumber(payload.offsetY) ? payload.offsetY : payload.event?.offsetY;
  return isFiniteNumber(offsetX) && isFiniteNumber(offsetY) ? [offsetX, offsetY] : null;
};

const resolveAxisPointerValue = (axesInfo: AxisPointerInfo[] | undefined): string | number | undefined => {
  if (!axesInfo?.length) return undefined;

  const xAxis = axesInfo.find((axis) => axis.axisDim === "x" && axis.value !== undefined)
    ?? axesInfo.find((axis) => axis.axisDim === undefined && axis.axisIndex === 0 && axis.value !== undefined)
    ?? axesInfo.find((axis) => axis.value !== undefined);

  return xAxis?.value;
};

const isSyntheticAxisCategory = (value: unknown): boolean =>
  typeof value === "string"
  && (value.startsWith(HISTORY_AXIS_CATEGORY_PREFIX) || value.startsWith(FUTURE_AXIS_CATEGORY_PREFIX));

const resolveAxisCategory = (
  value: string | number,
  axisCategories: AxisCategories,
): unknown => {
  if (axisCategories.length === 0 || !Number.isInteger(value)) return value;
  const axisIndex = value as number;
  return axisIndex >= 0 && axisIndex < axisCategories.length ? axisCategories[axisIndex] : value;
};

const resolveDataIndexFromValue = (
  value: unknown,
  data: ChartDataPoint[],
  allowDirectIndex: boolean,
): number | null => {
  if (value === undefined || value === null || isSyntheticAxisCategory(value)) return null;

  if (allowDirectIndex && Number.isInteger(value)) {
    const directIndex = value as number;
    if (directIndex >= 0 && directIndex < data.length) return directIndex;
  }

  const rawTime = String(value);
  const exactIndex = data.findIndex((candle) => String(candle.time) === rawTime);
  if (exactIndex !== -1) return exactIndex;

  const numericValue = typeof value === "number" ? value : Number(value);
  const rawTimestamp = Number.isFinite(numericValue)
    ? numericValue
    : new Date(rawTime).getTime();
  if (!Number.isFinite(rawTimestamp)) return null;

  const timestampIndex = data.findIndex(
    (candle) => new Date(candle.time).getTime() === rawTimestamp,
  );
  return timestampIndex === -1 ? null : timestampIndex;
};

/** Read the real category axis once per chart render/binding, not on every mousemove. */
export const readPrimaryXAxisCategories = (chart: EChartsType): AxisCategories => {
  const option = chart.getOption() as { xAxis?: unknown } | null | undefined;
  if (!option || typeof option !== "object") return [];

  const primaryAxis = Array.isArray(option.xAxis) ? option.xAxis[0] : option.xAxis;
  if (!primaryAxis || typeof primaryAxis !== "object") return [];
  const categories = (primaryAxis as { data?: unknown }).data;
  return Array.isArray(categories) ? categories : [];
};

/**
 * Resolve an ECharts axis-pointer payload to the source OHLC candle index.
 * When the chart has padded history/future categories, numeric ECharts indexes
 * are first translated through the real x-axis category before touching OHLC data.
 */
export const resolveAxisPointerIndex = (
  params: AxisPointerPayload,
  data: ChartDataPoint[],
  axisCategories: AxisCategories = [],
): number | null => {
  if (Number.isInteger(params.dataIndex)) {
    const dataIndex = params.dataIndex as number;
    const axisValue = resolveAxisCategory(dataIndex, axisCategories);
    const resolved = resolveDataIndexFromValue(axisValue, data, axisCategories.length === 0);
    if (resolved !== null) return resolved;
  }

  const rawValue = resolveAxisPointerValue(params.axesInfo);
  if (rawValue === undefined) return null;

  const axisValue = resolveAxisCategory(rawValue, axisCategories);
  return resolveDataIndexFromValue(axisValue, data, axisCategories.length === 0);
};

/**
 * ZRender mousemove is the authoritative fallback when ECharts does not emit
 * updateAxisPointer (for example when tooltip/axisPointer is disabled).
 */
export const resolvePixelPointerIndex = (
  chart: EChartsType,
  payload: ZrMouseMovePayload,
  data: ChartDataPoint[],
  axisCategories: AxisCategories = [],
): number | null => {
  if (data.length === 0) return null;

  const point = resolveZrMousePoint(payload);
  if (!point || !chart.containPixel({ gridIndex: 0 }, point)) return null;

  const pointInData = chart.convertFromPixel({ xAxisIndex: 0, yAxisIndex: 0 }, point);
  const rawAxisValue = Array.isArray(pointInData) ? pointInData[0] : pointInData;
  if (typeof rawAxisValue !== "string" && !isFiniteNumber(rawAxisValue)) return null;

  const normalizedAxisValue = isFiniteNumber(rawAxisValue) ? Math.round(rawAxisValue) : rawAxisValue;
  return resolveAxisPointerIndex(
    { axesInfo: [{ axisDim: "x", axisIndex: 0, value: normalizedAxisValue }] },
    data,
    axisCategories,
  );
};
