import type { ChartDataPoint } from "../../../../lib/Indicators/TechnicalIndicators";
import type {
  PineChartOverlayPayload,
  PineChartOverlayPoint,
  PineChartOverlaySeries,
  PineChartOverlaySignal,
  PineCompileResult,
} from "./pineTypes";

const MAX_OVERLAY_POINTS = 2_500;
const SERIES_COLORS = ["#8b5cf6", "#22c55e", "#f59e0b", "#06b6d4", "#ef4444", "#a855f7", "#14b8a6", "#eab308"];
const SIGNAL_COLORS = ["#f97316", "#38bdf8", "#f43f5e", "#84cc16", "#c084fc", "#fb7185", "#2dd4bf", "#facc15"];

type NumericSeriesMap = Record<string, Array<number | null>>;
type BooleanSeriesMap = Record<string, boolean[]>;

interface PineChartOverlayBuildInput {
  chartData: ChartDataPoint[];
  compileResult: PineCompileResult;
  generatedAt?: string;
  source: string;
}

export const buildPineChartOverlayPayload = ({
  chartData,
  compileResult,
  generatedAt = new Date().toISOString(),
  source,
}: PineChartOverlayBuildInput): PineChartOverlayPayload => {
  const safeData = selectRenderableChartData(chartData);
  const unsupportedExpressions = new Set<string>();
  const numericSeries = buildNumericSeriesMap(safeData, source, unsupportedExpressions);
  const booleanSeries = buildBooleanSeriesMap(safeData, source, numericSeries, unsupportedExpressions);

  const series = compileResult.plots
    .map((plot, index): PineChartOverlaySeries | null => {
      const values = resolveNumericExpression(plot.expression, numericSeries, unsupportedExpressions);
      const points = valuesToOverlayPoints(safeData, values);
      if (points.length === 0) return null;
      return {
        color: SERIES_COLORS[index % SERIES_COLORS.length],
        expression: plot.expression,
        points,
        title: sanitizeOverlayLabel(plot.title, `Plot ${index + 1}`),
      };
    })
    .filter((entry): entry is PineChartOverlaySeries => entry !== null);

  const signals = compileResult.signals
    .map((signal, index): PineChartOverlaySignal | null => {
      const values = resolveBooleanExpression(signal.expression, booleanSeries, numericSeries, unsupportedExpressions);
      const points = valuesToSignalPoints(safeData, values);
      if (points.length === 0) return null;
      return {
        color: SIGNAL_COLORS[index % SIGNAL_COLORS.length],
        marker: sanitizeMarker(signal.marker),
        points,
        title: sanitizeOverlayLabel(signal.title, `Signal ${index + 1}`),
      };
    })
    .filter((entry): entry is PineChartOverlaySignal => entry !== null);

  return {
    checksum: compileResult.checksum,
    generatedAt,
    kind: compileResult.kind,
    series,
    signals,
    title: sanitizeOverlayLabel(compileResult.title, "Pine overlay"),
    unsupportedExpressions: Array.from(unsupportedExpressions).slice(0, 12),
  };
};

const selectRenderableChartData = (chartData: ChartDataPoint[]): ChartDataPoint[] => {
  if (!Array.isArray(chartData) || chartData.length === 0) return [];
  return chartData
    .filter((point) => typeof point?.time === "string" && point.time.length > 0)
    .slice(-MAX_OVERLAY_POINTS);
};

const buildNumericSeriesMap = (
  chartData: ChartDataPoint[],
  source: string,
  unsupportedExpressions: Set<string>,
): NumericSeriesMap => {
  const base: NumericSeriesMap = {
    close: chartData.map((point) => asFiniteNumber(point.close)),
    high: chartData.map((point) => asFiniteNumber(point.high)),
    low: chartData.map((point) => asFiniteNumber(point.low)),
    open: chartData.map((point) => asFiniteNumber(point.open)),
    volume: chartData.map((point) => asFiniteNumber(point.volume)),
  };

  for (const assignment of extractAssignments(source)) {
    const values = evaluateNumericExpression(assignment.expression, base, unsupportedExpressions);
    if (values) base[assignment.name] = values;
  }

  return base;
};

const buildBooleanSeriesMap = (
  chartData: ChartDataPoint[],
  source: string,
  numericSeries: NumericSeriesMap,
  unsupportedExpressions: Set<string>,
): BooleanSeriesMap => {
  const result: BooleanSeriesMap = {};
  for (const assignment of extractAssignments(source)) {
    const values = evaluateBooleanExpression(assignment.expression, numericSeries, unsupportedExpressions, chartData.length, result);
    if (values) result[assignment.name] = values;
  }
  return result;
};

const extractAssignments = (source: string): Array<{ name: string; expression: string }> => (
  source
    .split("\n")
    .map((line) => line.trim())
    .map((line) => line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)$/))
    .filter((match): match is RegExpMatchArray => match !== null)
    .map((match) => ({ name: match[1], expression: match[2].trim() }))
);

const resolveNumericExpression = (
  expression: string,
  numericSeries: NumericSeriesMap,
  unsupportedExpressions: Set<string>,
): Array<number | null> => (
  evaluateNumericExpression(expression, numericSeries, unsupportedExpressions)
  ?? markUnsupportedNumeric(expression, unsupportedExpressions, getSeriesLength(numericSeries))
);

const evaluateNumericExpression = (
  expression: string,
  numericSeries: NumericSeriesMap,
  unsupportedExpressions: Set<string>,
): Array<number | null> | null => {
  const cleaned = normalizeExpression(expression);
  if (numericSeries[cleaned]) return numericSeries[cleaned];

  const literal = Number(cleaned);
  if (Number.isFinite(literal)) {
    const length = getSeriesLength(numericSeries);
    return Array.from({ length }, () => literal);
  }

  const smaMatch = cleaned.match(/^ta\.sma\(([^,]+),\s*(\d{1,3})\)$/);
  if (smaMatch) {
    const sourceValues = resolveNumericExpression(smaMatch[1], numericSeries, unsupportedExpressions);
    const period = Number(smaMatch[2]);
    if (!Number.isInteger(period) || period < 1 || period > 250) {
      return markUnsupportedNumeric(expression, unsupportedExpressions, getSeriesLength(numericSeries));
    }
    return calculateSimpleMovingAverage(sourceValues, period);
  }

  return null;
};

const resolveBooleanExpression = (
  expression: string,
  booleanSeries: BooleanSeriesMap,
  numericSeries: NumericSeriesMap,
  unsupportedExpressions: Set<string>,
): boolean[] => (
  evaluateBooleanExpression(expression, numericSeries, unsupportedExpressions, getSeriesLength(numericSeries), booleanSeries)
  ?? markUnsupportedBoolean(expression, unsupportedExpressions, getSeriesLength(numericSeries))
);

const evaluateBooleanExpression = (
  expression: string,
  numericSeries: NumericSeriesMap,
  unsupportedExpressions: Set<string>,
  fallbackLength: number,
  booleanSeries: BooleanSeriesMap = {},
): boolean[] | null => {
  const cleaned = normalizeExpression(expression);
  if (booleanSeries[cleaned]) return booleanSeries[cleaned];

  const comparison = cleaned.match(/^(.+?)\s*(>=|<=|>|<|==|!=)\s*(.+)$/);
  if (!comparison) return null;

  const left = resolveNumericExpression(comparison[1], numericSeries, unsupportedExpressions);
  const right = resolveNumericExpression(comparison[3], numericSeries, unsupportedExpressions);
  const length = Math.min(left.length, right.length, fallbackLength);
  return Array.from({ length }, (_, index) => compareNumbers(left[index], right[index], comparison[2]));
};

const compareNumbers = (left: number | null, right: number | null, operator: string): boolean => {
  if (left === null || right === null) return false;
  if (operator === ">") return left > right;
  if (operator === "<") return left < right;
  if (operator === ">=") return left >= right;
  if (operator === "<=") return left <= right;
  if (operator === "==") return left === right;
  return left !== right;
};

const calculateSimpleMovingAverage = (values: Array<number | null>, period: number): Array<number | null> => {
  const output: Array<number | null> = Array.from({ length: values.length }, () => null);
  const window: number[] = [];
  let sum = 0;

  values.forEach((value, index) => {
    if (value !== null) {
      window.push(value);
      sum += value;
    }
    if (window.length > period) {
      const removed = window.shift();
      if (removed !== undefined) sum -= removed;
    }
    if (window.length === period) output[index] = sum / period;
  });

  return output;
};

const valuesToOverlayPoints = (chartData: ChartDataPoint[], values: Array<number | null>): PineChartOverlayPoint[] => (
  values
    .map((value, index) => value === null ? null : { time: chartData[index]?.time, value })
    .filter((point): point is PineChartOverlayPoint => typeof point?.time === "string" && Number.isFinite(point.value))
);

const valuesToSignalPoints = (chartData: ChartDataPoint[], values: boolean[]): PineChartOverlayPoint[] => (
  values
    .map((active, index) => {
      const close = asFiniteNumber(chartData[index]?.close);
      return active && close !== null ? { time: chartData[index]?.time, value: close } : null;
    })
    .filter((point): point is PineChartOverlayPoint => typeof point?.time === "string" && Number.isFinite(point.value))
);

const markUnsupportedNumeric = (expression: string, unsupportedExpressions: Set<string>, length: number): Array<number | null> => {
  unsupportedExpressions.add(normalizeExpression(expression));
  return Array.from({ length }, () => null);
};

const markUnsupportedBoolean = (expression: string, unsupportedExpressions: Set<string>, length: number): boolean[] => {
  unsupportedExpressions.add(normalizeExpression(expression));
  return Array.from({ length }, () => false);
};

const normalizeExpression = (expression: string): string => expression.trim().replace(/\s+/g, " ");
const getSeriesLength = (seriesMap: NumericSeriesMap): number => seriesMap.close?.length ?? 0;
const asFiniteNumber = (value: unknown): number | null => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const sanitizeOverlayLabel = (value: string, fallback: string): string => {
  const clean = value.replace(/[<>]/g, "").trim();
  return clean.length > 0 ? clean.slice(0, 80) : fallback;
};

const sanitizeMarker = (value: string): string => {
  const clean = value.replace(/[<>]/g, "").trim();
  return clean.length > 0 ? clean.slice(0, 4) : "•";
};
