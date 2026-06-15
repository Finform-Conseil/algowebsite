import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import type { ChartDataPoint } from "../../../lib/Indicators/TechnicalIndicators";
import type { IndicatorPeriods } from "../../../config/indicators/advancedIndicatorsTypes";
import { fetchDailyCsvData } from "../../../hooks/MarketData/marketData.fetchers";
import { resolveBRVMDatasetTicker } from "../../../hooks/MarketData/marketData.parsers";
import {
  createIndicatorBacktestCacheDescriptor,
  normalizeBacktestSymbol,
  normalizeIndicatorBacktestBatchInputs,
  resolveIndicatorBacktestWorkerTimeoutMs,
  type IndicatorBacktestBatchInput,
  type IndicatorBacktestCacheDescriptor,
} from "../../../config/indicators/indicatorBacktestBatchCache";
import {
  mergeIndicatorBacktestSupplementalInputs,
  selectMissingIndicatorBacktestSupplementalSymbols,
} from "../../../config/indicators/indicatorBacktestSupplementalData";
import {
  buildIndicatorBacktestDashboard,
  type IndicatorBacktestDashboard,
} from "../../../config/indicators/indicatorBacktestDashboard";
import {
  serializeIndicatorBacktestWorkerBatchPayload,
  type IndicatorBacktestWorkerResponse,
} from "../../../config/indicators/indicatorBacktestWorkerProtocol";
import { createIndicatorBacktestWorker } from "../../../lib/workers/createIndicatorBacktestWorker";

export type IndicatorBacktestDashboardSource = "none" | "worker" | "fallback" | "cache";
export type IndicatorBacktestDashboardLoadState = "idle" | "loading" | "ready";

export interface IndicatorBacktestTickerDashboard {
  dashboard: IndicatorBacktestDashboard;
  source: Exclude<IndicatorBacktestDashboardSource, "none">;
  symbol: string;
}

export interface IndicatorBacktestDashboardState {
  dashboard: IndicatorBacktestDashboard | null;
  dashboards: IndicatorBacktestTickerDashboard[];
  error: string | null;
  loadState: IndicatorBacktestDashboardLoadState;
  source: IndicatorBacktestDashboardSource;
}

const BACKTEST_DASHBOARD_CACHE_MAX_ENTRIES = 24;

interface IndicatorBacktestDashboardCacheEntry {
  dashboard: IndicatorBacktestDashboard;
  lastUsedAt: number;
  symbol: string;
}

const backtestDashboardCache = new Map<string, IndicatorBacktestDashboardCacheEntry>();

export const useIndicatorBacktestDashboard = ({
  comparisonData = [],
  data,
  enabled,
  indicatorPeriods,
  symbol,
}: {
  comparisonData?: readonly IndicatorBacktestBatchInput[];
  data: readonly ChartDataPoint[];
  enabled: boolean;
  indicatorPeriods: IndicatorPeriods;
  symbol: string;
}): IndicatorBacktestDashboardState => {
  const [state, setState] = useState<IndicatorBacktestDashboardState>({
    dashboard: null,
    dashboards: [],
    error: null,
    loadState: "idle",
    source: "none",
  });
  const workerRef = useRef<Worker | null>(null);
  const messageIdRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);
  const [supplementalSeriesBySymbol, setSupplementalSeriesBySymbol] = useState<Record<string, readonly ChartDataPoint[]>>({});
  const enrichedComparisonData = useMemo(
    () => mergeIndicatorBacktestSupplementalInputs(comparisonData, supplementalSeriesBySymbol),
    [comparisonData, supplementalSeriesBySymbol],
  );

  useEffect(() => () => {
    clearPendingTimeout(timeoutRef);
    workerRef.current?.terminate();
    workerRef.current = null;
  }, []);

  useEffect(() => {
    clearPendingTimeout(timeoutRef);

    if (!enabled) {
      messageIdRef.current += 1;
      setState({ dashboard: null, dashboards: [], error: null, loadState: "idle", source: "none" });
      return;
    }

    const inputs = normalizeIndicatorBacktestBatchInputs({ data, symbol }, enrichedComparisonData);
    const descriptors = inputs.map((input) => createIndicatorBacktestCacheDescriptor(input, indicatorPeriods));
    const cachedRows: IndicatorBacktestTickerDashboard[] = [];
    const missingDescriptors: IndicatorBacktestCacheDescriptor[] = [];

    descriptors.forEach((descriptor) => {
      const cachedRow = readCachedDashboard(descriptor);
      if (cachedRow) cachedRows.push(cachedRow);
      else missingDescriptors.push(descriptor);
    });

    if (missingDescriptors.length === 0) {
      const dashboards = mergeDashboardRows(descriptors, cachedRows, []);
      setState({
        dashboard: dashboards[0]?.dashboard ?? null,
        dashboards,
        error: null,
        loadState: "ready",
        source: resolveStateSource(dashboards),
      });
      return;
    }

    const messageId = messageIdRef.current + 1;
    messageIdRef.current = messageId;
    setState((previous) => {
      const dashboards = mergeDashboardRows(descriptors, cachedRows, []);
      return {
        dashboard: dashboards[0]?.dashboard ?? previous.dashboard,
        dashboards: dashboards.length > 0 ? dashboards : previous.dashboards,
        error: null,
        loadState: "loading",
        source: dashboards.length > 0 ? resolveStateSource(dashboards) : previous.source,
      };
    });

    const runFallback = (error: string | null) => {
      if (messageIdRef.current !== messageId) return;
      const fallbackRows = buildFallbackRows(missingDescriptors, indicatorPeriods);
      const dashboards = mergeDashboardRows(descriptors, cachedRows, fallbackRows);
      setState({
        dashboard: dashboards[0]?.dashboard ?? null,
        dashboards,
        error,
        loadState: "ready",
        source: resolveStateSource(dashboards),
      });
    };

    const worker = getOrCreateWorker(workerRef);
    if (!worker) {
      runFallback("Worker backtesting indisponible.");
      return;
    }

    try {
      const payload = serializeIndicatorBacktestWorkerBatchPayload(missingDescriptors, messageId, { indicatorPeriods });
      worker.onmessage = (event: MessageEvent<IndicatorBacktestWorkerResponse>) => {
        if (event.data.messageId !== messageId || messageIdRef.current !== messageId) return;
        clearPendingTimeout(timeoutRef);
        if (!event.data.success) {
          runFallback(event.data.error);
          return;
        }

        const workerRows = extractWorkerRows(event.data, missingDescriptors[0]?.symbol ?? normalizeBacktestSymbol(symbol));
        workerRows.forEach((row) => writeCachedDashboard(descriptors, row));
        setStateWithRows(descriptors, cachedRows, workerRows, null);
      };
      worker.onerror = () => {
        resetWorker(workerRef);
        runFallback("Erreur runtime du worker backtesting.");
      };
      timeoutRef.current = window.setTimeout(() => {
        resetWorker(workerRef);
        runFallback("Timeout du worker backtesting.");
      }, resolveIndicatorBacktestWorkerTimeoutMs(missingDescriptors));
      worker.postMessage(payload.request, payload.transferables);
    } catch (error) {
      runFallback(error instanceof Error ? error.message : "Erreur de preparation du worker backtesting.");
    }

    const setStateWithRows = (
      allDescriptors: readonly IndicatorBacktestCacheDescriptor[],
      baseRows: readonly IndicatorBacktestTickerDashboard[],
      nextRows: readonly IndicatorBacktestTickerDashboard[],
      error: string | null,
    ) => {
      const dashboards = mergeDashboardRows(allDescriptors, baseRows, nextRows);
      setState({
        dashboard: dashboards[0]?.dashboard ?? null,
        dashboards,
        error,
        loadState: "ready",
        source: resolveStateSource(dashboards),
      });
    };

    return () => clearPendingTimeout(timeoutRef);
  }, [data, enabled, enrichedComparisonData, indicatorPeriods, symbol]);

  useEffect(() => {
    if (!enabled) return;
    const missingSymbols = selectMissingIndicatorBacktestSupplementalSymbols(
      symbol,
      comparisonData,
      supplementalSeriesBySymbol,
    );
    if (missingSymbols.length === 0) return;

    let cancelled = false;
    void Promise.allSettled(missingSymbols.map(fetchSupplementalSeries)).then((results) => {
      if (cancelled) return;
      const loaded = results.flatMap((result) => (result.status === "fulfilled" && result.value.data.length > 0 ? [result.value] : []));
      if (loaded.length === 0) return;
      setSupplementalSeriesBySymbol((current) => mergeSupplementalSeries(current, loaded));
    });

    return () => {
      cancelled = true;
    };
  }, [comparisonData, enabled, supplementalSeriesBySymbol, symbol]);

  return state;
};

const fetchSupplementalSeries = async (symbol: string): Promise<IndicatorBacktestBatchInput> => ({
  data: await fetchDailyCsvData(resolveBRVMDatasetTicker(symbol)),
  symbol: normalizeBacktestSymbol(symbol),
});

const mergeSupplementalSeries = (
  current: Record<string, readonly ChartDataPoint[]>,
  loaded: readonly IndicatorBacktestBatchInput[],
): Record<string, readonly ChartDataPoint[]> => {
  let changed = false;
  const next = { ...current };
  loaded.forEach((entry) => {
    const symbol = normalizeBacktestSymbol(entry.symbol);
    if (entry.data.length === 0 || next[symbol] === entry.data) return;
    next[symbol] = entry.data;
    changed = true;
  });
  return changed ? next : current;
};

const readCachedDashboard = (
  descriptor: IndicatorBacktestCacheDescriptor,
): IndicatorBacktestTickerDashboard | null => {
  const cached = backtestDashboardCache.get(descriptor.cacheKey);
  if (!cached) return null;
  cached.lastUsedAt = Date.now();
  return { dashboard: cached.dashboard, source: "cache", symbol: cached.symbol };
};

const writeCachedDashboard = (
  descriptors: readonly IndicatorBacktestCacheDescriptor[],
  row: IndicatorBacktestTickerDashboard,
): void => {
  const descriptor = descriptors.find((candidate) => candidate.symbol === row.symbol);
  if (!descriptor) return;
  backtestDashboardCache.set(descriptor.cacheKey, {
    dashboard: row.dashboard,
    lastUsedAt: Date.now(),
    symbol: row.symbol,
  });
  trimDashboardCache();
};

const trimDashboardCache = (): void => {
  if (backtestDashboardCache.size <= BACKTEST_DASHBOARD_CACHE_MAX_ENTRIES) return;
  const staleKeys = [...backtestDashboardCache.entries()]
    .sort((left, right) => left[1].lastUsedAt - right[1].lastUsedAt)
    .slice(0, backtestDashboardCache.size - BACKTEST_DASHBOARD_CACHE_MAX_ENTRIES)
    .map(([key]) => key);
  staleKeys.forEach((key) => backtestDashboardCache.delete(key));
};

const buildFallbackRows = (
  descriptors: readonly IndicatorBacktestCacheDescriptor[],
  indicatorPeriods: IndicatorPeriods,
): IndicatorBacktestTickerDashboard[] => descriptors.map((descriptor) => {
  const row = {
    dashboard: buildIndicatorBacktestDashboard(descriptor.data, { indicatorPeriods }),
    source: "fallback" as const,
    symbol: descriptor.symbol,
  };
  writeCachedDashboard(descriptors, row);
  return row;
});

const extractWorkerRows = (
  response: Extract<IndicatorBacktestWorkerResponse, { success: true }>,
  fallbackSymbol: string,
): IndicatorBacktestTickerDashboard[] => {
  if ("dashboards" in response) {
    return response.dashboards.map((row) => ({
      dashboard: row.dashboard,
      source: "worker",
      symbol: normalizeBacktestSymbol(row.symbol),
    }));
  }
  return [{ dashboard: response.dashboard, source: "worker", symbol: normalizeBacktestSymbol(fallbackSymbol) }];
};

const mergeDashboardRows = (
  descriptors: readonly IndicatorBacktestCacheDescriptor[],
  firstRows: readonly IndicatorBacktestTickerDashboard[],
  secondRows: readonly IndicatorBacktestTickerDashboard[],
): IndicatorBacktestTickerDashboard[] => {
  const rowsBySymbol = new Map<string, IndicatorBacktestTickerDashboard>();
  firstRows.forEach((row) => rowsBySymbol.set(row.symbol, row));
  secondRows.forEach((row) => rowsBySymbol.set(row.symbol, row));
  return descriptors.flatMap((descriptor) => {
    const row = rowsBySymbol.get(descriptor.symbol);
    return row ? [row] : [];
  });
};

const resolveStateSource = (dashboards: readonly IndicatorBacktestTickerDashboard[]): IndicatorBacktestDashboardSource => {
  if (dashboards.some((row) => row.source === "fallback")) return "fallback";
  if (dashboards.some((row) => row.source === "worker")) return "worker";
  if (dashboards.some((row) => row.source === "cache")) return "cache";
  return "none";
};

const getOrCreateWorker = (workerRef: MutableRefObject<Worker | null>): Worker | null => {
  if (typeof window === "undefined" || typeof Worker === "undefined") return null;
  if (workerRef.current) return workerRef.current;

  try {
    workerRef.current = createIndicatorBacktestWorker();
    return workerRef.current;
  } catch {
    workerRef.current = null;
    return null;
  }
};

const resetWorker = (workerRef: MutableRefObject<Worker | null>): void => {
  workerRef.current?.terminate();
  workerRef.current = null;
};

const clearPendingTimeout = (timeoutRef: MutableRefObject<number | null>): void => {
  if (timeoutRef.current === null || typeof window === "undefined") return;
  window.clearTimeout(timeoutRef.current);
  timeoutRef.current = null;
};
