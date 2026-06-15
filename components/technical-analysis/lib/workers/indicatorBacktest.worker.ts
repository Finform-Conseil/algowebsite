import { buildIndicatorBacktestDashboard } from "../../config/indicators/indicatorBacktestDashboard";
import {
  deserializeIndicatorBacktestWorkerData,
  type IndicatorBacktestWorkerBatchDashboard,
  type IndicatorBacktestWorkerBatchItem,
  type IndicatorBacktestWorkerRequest,
  type IndicatorBacktestWorkerResponse,
} from "../../config/indicators/indicatorBacktestWorkerProtocol";

self.onmessage = (event: MessageEvent<IndicatorBacktestWorkerRequest>) => {
  const messageId = Number.isSafeInteger(event.data?.messageId) ? event.data.messageId : 0;

  try {
    if (event.data.kind === "batch") {
      postBacktestWorkerMessage({
        dashboards: buildBatchDashboards(event.data.items, event.data.options),
        messageId,
        success: true,
      });
      return;
    }

    const dashboard = buildSingleDashboard(event.data.buffer, event.data.length, event.data.options);
    postBacktestWorkerMessage({ dashboard, messageId, success: true });
  } catch (error) {
    postBacktestWorkerMessage({
      error: error instanceof Error ? error.message : "Unknown indicator backtest worker error.",
      messageId,
      success: false,
    });
  }
};

const buildBatchDashboards = (
  items: readonly IndicatorBacktestWorkerBatchItem[],
  options: IndicatorBacktestWorkerRequest["options"],
): IndicatorBacktestWorkerBatchDashboard[] => {
  if (!Array.isArray(items) || items.length === 0) throw new Error("Invalid backtest worker batch items.");
  return items.map((item) => ({
    dashboard: buildSingleDashboard(item.buffer, item.length, options),
    symbol: normalizeWorkerSymbol(item.symbol),
  }));
};

const buildSingleDashboard = (
  buffer: ArrayBuffer,
  length: number,
  options: IndicatorBacktestWorkerRequest["options"],
) => {
  const data = deserializeIndicatorBacktestWorkerData(buffer, length);
  return buildIndicatorBacktestDashboard(data, {
    indicatorPeriods: options.indicatorPeriods,
  });
};

const normalizeWorkerSymbol = (symbol: string): string => {
  const normalized = symbol.trim().toUpperCase();
  return normalized.length > 0 ? normalized : "UNKNOWN";
};

const postBacktestWorkerMessage = (message: IndicatorBacktestWorkerResponse): void => {
  self.postMessage(message);
};
