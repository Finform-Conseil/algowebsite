import { PineTS } from "pinets";

import type { ChartDataPoint } from "../../../../lib/Indicators/TechnicalIndicators";
import type {
  PineChartOverlayPayload,
  PineChartOverlayPoint,
  PineChartOverlaySeries,
  PineChartOverlaySignal,
  PineCompileResult,
  PineDiagnostic,
} from "./pineTypes";

const SERIES_COLORS = ["#2962ff", "#22c55e", "#f59e0b", "#06b6d4", "#ef4444", "#a855f7", "#14b8a6", "#eab308"];
const SIGNAL_COLORS = ["#f97316", "#38bdf8", "#f43f5e", "#84cc16", "#c084fc", "#fb7185", "#2dd4bf", "#facc15"];
const RESERVED_PLOT_PREFIX = "__";
const MAX_RUNTIME_BARS = 10_000;

type PineTSPlotDatum = {
  options?: Record<string, unknown>;
  time?: number;
  title?: string;
  value?: unknown;
};

type PineTSPlot = {
  data?: PineTSPlotDatum[];
  options?: Record<string, unknown>;
  title?: string;
};

type PineTSContext = {
  plots?: Record<string, PineTSPlot>;
  warnings?: unknown[];
};

export interface PineRuntimeExecution {
  diagnostics: PineDiagnostic[];
  engine: "PineTS";
  overlay: PineChartOverlayPayload;
  requiresSeparatePane: boolean;
}

export const executePineScriptWithPineTS = async ({
  chartData,
  compileResult,
  generatedAt = new Date().toISOString(),
  source,
}: {
  chartData: ChartDataPoint[];
  compileResult: PineCompileResult;
  generatedAt?: string;
  source: string;
}): Promise<PineRuntimeExecution> => {
  const candles = toPineTSCandles(chartData);
  if (candles.length === 0) {
    throw new Error("PineTS requires at least one valid OHLCV candle.");
  }

  const runtime = new PineTS(candles);
  const context = await runtime.run(source) as PineTSContext;
  const plotEntries = Object.entries(context.plots ?? {}).filter(([key]) => !key.startsWith(RESERVED_PLOT_PREFIX));
  const closeByTime = new Map(candles.map((bar) => [bar.openTime, bar.close]));
  const requiresSeparatePane = !declaresOverlayOnPriceChart(source);
  const diagnostics = normalizeRuntimeWarnings(context.warnings);

  const series: PineChartOverlaySeries[] = [];
  const signals: PineChartOverlaySignal[] = [];

  plotEntries.forEach(([key, plot], index) => {
    const data = Array.isArray(plot.data) ? plot.data : [];
    const firstRenderable = data.find((entry) => entry && entry.value !== null && entry.value !== undefined);
    if (!firstRenderable) return;

    const style = readString(firstRenderable.options?.style) ?? readString(plot.options?.style);
    const isSignal = style === "char" || typeof firstRenderable.value === "boolean";
    const color = resolvePlotColor(data, isSignal ? SIGNAL_COLORS[index % SIGNAL_COLORS.length] : SERIES_COLORS[index % SERIES_COLORS.length]);

    if (isSignal) {
      const marker = readString(firstRenderable.options?.char)
        ?? readString(plot.options?.char)
        ?? readString(firstRenderable.options?.text)
        ?? "•";
      const points = data.flatMap((entry): PineChartOverlayPoint[] => {
        if (entry?.value !== true || !Number.isFinite(entry.time)) return [];
        const close = closeByTime.get(Number(entry.time));
        return Number.isFinite(close) ? [{ time: new Date(Number(entry.time)).toISOString(), value: Number(close) }] : [];
      });
      if (points.length > 0 && !requiresSeparatePane) {
        signals.push({
          color,
          marker: marker.slice(0, 12),
          points,
          title: sanitizeLabel(plot.title ?? key, `Signal ${index + 1}`),
        });
      }
      return;
    }

    const points = data.flatMap((entry): PineChartOverlayPoint[] => {
      const value = Number(entry?.value);
      const time = Number(entry?.time);
      return Number.isFinite(value) && Number.isFinite(time)
        ? [{ time: new Date(time).toISOString(), value }]
        : [];
    });
    if (points.length > 0 && !requiresSeparatePane) {
      series.push({
        color,
        expression: key,
        points,
        title: sanitizeLabel(plot.title ?? key, `Plot ${index + 1}`),
      });
    }
  });

  if (requiresSeparatePane) {
    diagnostics.push({
      code: "PINE_SEPARATE_PANE_REQUIRED",
      line: 1,
      message: "PineTS executed this script successfully, but overlay=false requires a dedicated Pine pane that is not yet attached to the AfriMarket renderer.",
      severity: "warning",
    });
  }

  return {
    diagnostics,
    engine: "PineTS",
    overlay: {
      checksum: compileResult.checksum,
      generatedAt,
      kind: compileResult.kind,
      series,
      signals,
      title: sanitizeLabel(compileResult.title, "Pine overlay"),
      unsupportedExpressions: requiresSeparatePane ? ["overlay=false"] : [],
    },
    requiresSeparatePane,
  };
};

const toPineTSCandles = (chartData: ChartDataPoint[]) => chartData
  .slice(-MAX_RUNTIME_BARS)
  .flatMap((point) => {
    const openTime = Date.parse(point.time);
    const open = finite(point.open);
    const high = finite(point.high);
    const low = finite(point.low);
    const close = finite(point.close);
    const volume = finite(point.volume) ?? 0;
    if (![openTime, open, high, low, close].every(Number.isFinite)) return [];
    return [{
      openTime,
      closeTime: openTime,
      open: Number(open),
      high: Number(high),
      low: Number(low),
      close: Number(close),
      volume,
    }];
  });

const declaresOverlayOnPriceChart = (source: string): boolean => {
  const declaration = source.match(/\b(?:indicator|strategy)\s*\(([\s\S]*?)\)/)?.[1] ?? "";
  const explicit = declaration.match(/\boverlay\s*=\s*(true|false)\b/i)?.[1];
  return explicit?.toLowerCase() === "true";
};

const normalizeRuntimeWarnings = (warnings: unknown): PineDiagnostic[] => (
  Array.isArray(warnings)
    ? warnings.slice(0, 20).map((warning, index) => ({
        code: "PINETS_WARNING_" + String(index + 1).padStart(2, "0"),
        line: 1,
        message: typeof warning === "string" ? warning : safeMessage(warning),
        severity: "warning" as const,
      }))
    : []
);

const resolvePlotColor = (data: PineTSPlotDatum[], fallback: string): string => {
  for (const entry of data) {
    const color = readString(entry?.options?.color);
    if (color) return color;
  }
  return fallback;
};

const finite = (value: unknown): number | null => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const readString = (value: unknown): string | null => typeof value === "string" && value.trim() ? value.trim() : null;
const safeMessage = (value: unknown): string => {
  if (value instanceof Error) return value.message;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};
const sanitizeLabel = (value: string | undefined, fallback: string): string => {
  const cleaned = (value ?? "").replace(/[<>]/g, "").trim().slice(0, 90);
  return cleaned || fallback;
};
