import type { ChartDataPoint } from "../../lib/Indicators/TechnicalIndicators";
import type { IndicatorPeriods } from "./advancedIndicatorsTypes";
import type { IndicatorBacktestDashboard } from "./indicatorBacktestDashboard";

export interface IndicatorBacktestWorkerOptions {
  indicatorPeriods: IndicatorPeriods;
}

export interface IndicatorBacktestWorkerSingleRequest {
  buffer: ArrayBuffer;
  kind?: "single";
  length: number;
  messageId: number;
  options: IndicatorBacktestWorkerOptions;
}

export interface IndicatorBacktestWorkerBatchItem {
  buffer: ArrayBuffer;
  length: number;
  symbol: string;
}

export interface IndicatorBacktestWorkerBatchRequest {
  items: IndicatorBacktestWorkerBatchItem[];
  kind: "batch";
  messageId: number;
  options: IndicatorBacktestWorkerOptions;
}

export type IndicatorBacktestWorkerRequest =
  | IndicatorBacktestWorkerSingleRequest
  | IndicatorBacktestWorkerBatchRequest;

export interface IndicatorBacktestWorkerBatchDashboard {
  dashboard: IndicatorBacktestDashboard;
  symbol: string;
}

export type IndicatorBacktestWorkerResponse =
  | {
    dashboard: IndicatorBacktestDashboard;
    messageId: number;
    success: true;
  }
  | {
    dashboards: IndicatorBacktestWorkerBatchDashboard[];
    messageId: number;
    success: true;
  }
  | {
    error: string;
    messageId: number;
    success: false;
  };

export interface IndicatorBacktestWorkerPayload {
  request: IndicatorBacktestWorkerRequest;
  transferables: ArrayBuffer[];
}

export interface IndicatorBacktestWorkerBatchInput {
  data: readonly ChartDataPoint[];
  symbol: string;
}

const FIELDS_PER_CANDLE = 7;

export const serializeIndicatorBacktestWorkerPayload = (
  data: readonly ChartDataPoint[],
  messageId: number,
  options: IndicatorBacktestWorkerOptions,
): IndicatorBacktestWorkerPayload => {
  assertValidMessageId(messageId);
  const item = serializeBacktestWorkerItem({ data, symbol: "PRIMARY" });

  return {
    request: {
      buffer: item.buffer,
      length: data.length,
      messageId,
      options: {
        indicatorPeriods: options.indicatorPeriods,
      },
    },
    transferables: [item.buffer],
  };
};

export const serializeIndicatorBacktestWorkerBatchPayload = (
  inputs: readonly IndicatorBacktestWorkerBatchInput[],
  messageId: number,
  options: IndicatorBacktestWorkerOptions,
): IndicatorBacktestWorkerPayload => {
  assertValidMessageId(messageId);
  if (inputs.length === 0) throw new Error("Backtest worker batch requires at least one item.");

  const items = inputs.map(serializeBacktestWorkerItem);

  return {
    request: {
      items,
      kind: "batch",
      messageId,
      options: {
        indicatorPeriods: options.indicatorPeriods,
      },
    },
    transferables: items.map((item) => item.buffer),
  };
};

export const deserializeIndicatorBacktestWorkerData = (
  buffer: ArrayBuffer,
  length: number,
): ChartDataPoint[] => {
  if (!(buffer instanceof ArrayBuffer)) throw new Error("Invalid backtest worker buffer.");
  if (!Number.isSafeInteger(length) || length < 0) throw new Error("Invalid backtest worker length.");

  const flatData = new Float64Array(buffer);
  if (flatData.length < length * FIELDS_PER_CANDLE) {
    throw new Error("Backtest worker buffer is shorter than declared length.");
  }

  const data: ChartDataPoint[] = new Array(length);
  for (let index = 0; index < length; index += 1) {
    const offset = index * FIELDS_PER_CANDLE;
    data[index] = {
      close: flatData[offset + 4],
      high: flatData[offset + 2],
      low: flatData[offset + 3],
      open: flatData[offset + 1],
      time: restoreTime(flatData[offset], index),
      tradesCount: restoreNullableNumber(flatData[offset + 6]),
      volume: flatData[offset + 5],
    };
  }

  return data;
};

const serializeBacktestWorkerItem = (
  input: IndicatorBacktestWorkerBatchInput,
): IndicatorBacktestWorkerBatchItem => {
  const buffer = new ArrayBuffer(input.data.length * FIELDS_PER_CANDLE * Float64Array.BYTES_PER_ELEMENT);
  const flatData = new Float64Array(buffer);

  input.data.forEach((point, index) => {
    const offset = index * FIELDS_PER_CANDLE;
    flatData[offset] = normalizeTime(point.time, index);
    flatData[offset + 1] = normalizeNumber(point.open);
    flatData[offset + 2] = normalizeNumber(point.high);
    flatData[offset + 3] = normalizeNumber(point.low);
    flatData[offset + 4] = normalizeNumber(point.close);
    flatData[offset + 5] = normalizeNumber(point.volume);
    flatData[offset + 6] = normalizeNumber(point.tradesCount ?? point.trades_count ?? NaN);
  });

  return {
    buffer,
    length: input.data.length,
    symbol: normalizeWorkerSymbol(input.symbol),
  };
};

const assertValidMessageId = (messageId: number): void => {
  if (!Number.isSafeInteger(messageId) || messageId <= 0) {
    throw new Error("Invalid backtest worker message id.");
  }
};

const normalizeTime = (value: string, index: number): number => {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : index;
};

const normalizeNumber = (value: number): number => (
  typeof value === "number" && Number.isFinite(value) ? value : NaN
);

const normalizeWorkerSymbol = (symbol: string): string => {
  const normalized = symbol.trim().toUpperCase();
  return normalized.length > 0 ? normalized : "UNKNOWN";
};

const restoreTime = (value: number, index: number): string => (
  Number.isFinite(value) && value > 10_000 ? new Date(value).toISOString() : String(index)
);

const restoreNullableNumber = (value: number): number | null => (
  Number.isFinite(value) ? value : null
);
