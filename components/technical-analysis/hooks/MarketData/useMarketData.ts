// components/technical-analysis/hooks/MarketData/useMarketData.ts
// ============================================================================
// HUB DE DONNÉES MARCHÉ — SOURCE UNIQUE : API `Algo DataBase API v1`
// ----------------------------------------------------------------------------
// [MIGRATION 2026] Ce hub ne requête PLUS aucune route locale :
//   - SUPPRIMÉ : /api/market-data/brvm-live, /brvm-live-capitalisation
//   - SUPPRIMÉ : /api/proxy/9/...daily.csv (GitHub CSV OHLCV)
//   - SUPPRIMÉ : /api/proxy/9/...indicator.csv (GitHub CSV indicateurs)
//   - SUPPRIMÉ : mode "mock" (conformité AGENTS REAL API - NO SIMULATION.md)
//
// TOUTE la donnée provient de la couche core/ (Clean/Hexagonal) :
//   getActionByTicker({ ticker, marketTicker, isin? }) -> ActionEntity { instrument, latest_price_metric }
//   getAllCours({ instrument }) -> série OHLCV (CoursEntity[])
//
// STRATÉGIE DIAGNOSTIC : les champs `null` renvoyés par l'API restent `null`.
// Aucun calcul local de secours ne masque un indicateur défaillant backend.
//
// Le CONTRAT DE SORTIE du hook est INCHANGÉ (ReturnType consommé via Context) :
//   { chartData, setChartData, isLoading, startReplay, stopReplay,
//     showReplayFullText, setShowReplayFullText, liveSnapshot,
//     currentVolume, avgVolume }
//
// Conformité : Docs/ARCHITECTURE_DATA_FLOW.md, Docs/migration/*.
// ============================================================================

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { ChartDataPoint } from "../../lib/Indicators/TechnicalIndicators";
import {
  setReplayActive,
  setReplayPaused,
  setReplayTotalCandles,
  setReplayCurrentIndex,
  setModalOpen,
  updateMarketData,
  updateMarketSnapshot,
} from "../../store/technicalAnalysisSlice";
import {
  selectUiState,
  selectChartConfig,
  selectMarketData,
  selectMarketSnapshots,
} from "../../store/selectors";
import type { LiveSnapshot } from "../../config/market/marketSnapshotTypes";
import type { ActionEntity } from "@/core/domain/entities/action.entity";
import type { CoursEntity, PriceIndicatorEntity, TechnicalIndicatorEntity, ValuationRatioEntity } from "@/core/domain/entities/cours.entity";
import { useGlobalNotification } from "@/components/design-system/layouts/HeaderHome/context/GlobalNotificationContext";
import type { BRVMSecurity } from "@/core/data/brvm-securities";
import { useActionRepository } from "@/core/infra/repositories/action.repository.impl";
import { useCoursRepository } from "@/core/infra/repositories/cours.repository.impl";
import { useIndiceRepository } from "@/core/infra/repositories/indice.repository.impl";
import {
  coursSeriesToChartData,
  getCanonicalChartTimeKey,
  priceMetricToLiveSnapshot,
} from "@/lib/utils/marketDataTransform";
import {
  readPersistedMarketData,
  writePersistedMarketData,
} from "./marketDataPersistence";
import { readPersistedActionIdentity } from "@/core/infra/repositories/action-identity.persistence";
import {
  createMarketDataCacheKey,
  normalizeMarketDataScope,
} from "../../config/market/marketDataCacheKey";
import {
  createTimeframeMarketDataCacheKey,
  getTimeframeSeconds,
  normalizeChartTimeframe,
  type ChartTimeframe,
  type TimeframeDataSourceKind,
} from "../../config/market/timeframeCatalog";
import { loadTimeframeSeries } from "../../config/market/timeframeSeriesPolicy";
import {
  createComparisonRequestSetKey,
  parseComparisonRequestSetKey,
  type ComparisonMarketRequest,
} from "../../config/market/comparisonRequestIdentity";
import {
  indiceCoursToLineChartData,
  resolveIndexTimeframeSeries,
} from "../../config/market/indexSeriesAdapter";

export type { ComparisonMarketRequest } from "../../config/market/comparisonRequestIdentity";

// [MIGRATION] `mode` conservé dans la signature pour compat appelants, mais
// la source est TOUJOURS l'API. Il n'existe plus de génération locale.
type DataMode = "mock" | "real";
export type ComparisonLoadStatus = "idle" | "loading" | "loaded" | "empty" | "failed";
export type ComparisonLoadState = Record<string, ComparisonLoadStatus>;
export type ComparisonCurrencyState = Record<string, string>;
export type ComparisonSeriesState = Record<string, ChartDataPoint[]>;
export type ComparisonDataSourceState = Record<string, TimeframeDataSourceKind>;
export interface ComparisonManagerState {
  loadState: ComparisonLoadState;
  currencyByKey: ComparisonCurrencyState;
  seriesByKey: ComparisonSeriesState;
  dataSourceByKey: ComparisonDataSourceState;
  requestMoreHistory: (request: ComparisonMarketRequest, direction?: "left" | "right") => void;
}
type ComparisonFetchResult = {
  series: ChartDataPoint[];
  currency: string;
  source: TimeframeDataSourceKind;
  timeframe: ChartTimeframe;
};
const COMPARISON_NO_DATA_GRACE_MS = 1500;
const MAX_INDEX_HISTORY_PAGES = 64;

// Nombre de bougies historiques par page API (contrat backend: 100 items par page).
const OHLCV_PAGE_SIZE = 100;

type MarketDataLoadOptions = { silent?: boolean; historyPage?: number; deferApply?: boolean };

// The RTK transport has a 35s budget and the proxy a 30s upstream budget.
// Keep one workflow guard above those layers so a lost promise can never leave
// the chart in an indeterminate skeleton state forever.
const MARKET_REQUEST_TIMEOUT_MS = 45_000;
const withRequestTimeout = <T>(request: Promise<T>, label: string): Promise<T> => new Promise((resolve, reject) => {
  let settled = false;
  const timer = setTimeout(() => {
    if (settled) return;
    settled = true;
    reject(new Error(`${label} timed out after ${MARKET_REQUEST_TIMEOUT_MS}ms`));
  }, MARKET_REQUEST_TIMEOUT_MS);

  request.then(
    (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    },
    (error: unknown) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(error);
    },
  );
});

const mergeChartHistory = (current: ChartDataPoint[], incoming: ChartDataPoint[]): ChartDataPoint[] => {
  if (current.length === 0) return incoming;
  if (incoming.length === 0) return current;

  // Fast path 1: incoming points are strictly older than current points (pagination scroll left)
  const firstCurrentTime = Date.parse(String(current[0].time));
  const lastIncomingTime = Date.parse(String(incoming[incoming.length - 1].time));

  if (Number.isFinite(firstCurrentTime) && Number.isFinite(lastIncomingTime) && lastIncomingTime < firstCurrentTime) {
    return [...incoming, ...current];
  }

  // Fast path 2: incoming points are strictly newer than current points
  const lastCurrentTime = Date.parse(String(current[current.length - 1].time));
  const firstIncomingTime = Date.parse(String(incoming[0].time));

  if (Number.isFinite(lastCurrentTime) && Number.isFinite(firstIncomingTime) && firstIncomingTime > lastCurrentTime) {
    return [...current, ...incoming];
  }

  // Deduplicate by logical instant, never by the raw ISO spelling. This prevents
  // equivalent timestamps (`Z`, `+0000`, normalized offsets) from surviving a
  // cache/page merge as two OHLC bars at the same logical position.
  const timeMap = new Map<string, { point: ChartDataPoint; ts: number }>();
  const indexPoint = (point: ChartDataPoint) => {
    const rawTime = String(point.time ?? "").trim();
    const key = getCanonicalChartTimeKey(rawTime);
    if (!key) return;
    const ts = Date.parse(rawTime);
    timeMap.set(key, { point, ts: Number.isFinite(ts) ? ts : 0 });
  };
  current.forEach(indexPoint);
  incoming.forEach(indexPoint);

  return Array.from(timeMap.values())
    .sort((left, right) => left.ts - right.ts)
    .map((item) => item.point);
};

const normalizeTicker = (ticker: string | null | undefined): string => (ticker || "").trim().toUpperCase();

const isActionForTicker = (action: ActionEntity | null | undefined, ticker: string): boolean => (
  Boolean(action) && normalizeTicker(action?.ticker) === normalizeTicker(ticker)
);

const isActionForMarket = (action: ActionEntity | null | undefined, ticker: string, marketTicker: string): boolean => {
  const normalizedMarket = normalizeMarketDataScope(marketTicker);
  return Boolean(normalizedMarket)
    && isActionForTicker(action, ticker)
    && normalizeMarketDataScope(action?.bourse?.ticker) === normalizedMarket;
};

const areComparisonLoadStatesEqual = (left: ComparisonLoadState, right: ComparisonLoadState): boolean => {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) return false;
  return leftKeys.every((key) => left[key] === right[key]);
};

export const useMarketData = (mode: DataMode = "real", forcedSymbol?: string, forcedIsin?: string, forcedMarket?: string) => {
  const dispatch = useDispatch();
  const uiState = useSelector(selectUiState);
  const chartConfig = useSelector(selectChartConfig);
  const marketDataCache = useSelector(selectMarketData);
  const liveSnapshotsCache = useSelector(selectMarketSnapshots);
  const { addNotification } = useGlobalNotification();

  // ── Couche core/ : repositories API (aucun fetch local) ───────────────────
  const {
    getActionByTicker,
    currentActionByTickerData,
    isLoadingActionByTicker,
    isFetchingActionByTicker,
  } = useActionRepository();
  const { getAllCours, getCoursHistory } = useCoursRepository();

  const symbol = (forcedSymbol || chartConfig.symbol || "").trim().toUpperCase();
  const marketScope = normalizeTicker(forcedMarket) || "UNKNOWN";
  const requestedTimeframe = normalizeChartTimeframe(chartConfig.timeframe) ?? "1D";
  const requestedTimeframeSeconds = getTimeframeSeconds(requestedTimeframe) ?? 86400;
  const isDailyTimeframe = requestedTimeframe === "1D";

  // --- STATE ---
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [resolvedActionByTicker, setResolvedActionByTicker] = useState<ActionEntity | null>(null);
  const [showReplayFullText, setShowReplayFullText] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadStatus, setLoadStatus] = useState<ComparisonLoadStatus>(symbol ? "loading" : "idle");

  // --- STABLE REFS (préservation de la mécanique SRE existante) ---
  const replayOriginalData = useRef<ChartDataPoint[]>([]);
  const replayIndex = useRef(0);
  const replayTimer = useRef<NodeJS.Timeout | null>(null);
  const collapseTimer = useRef<NodeJS.Timeout | null>(null);
  const addNotificationRef = useRef(addNotification);
  const dispatchRef = useRef(dispatch);
  const marketDataCacheRef = useRef(marketDataCache);
  const symbolRef = useRef(symbol);
  const chartDataRef = useRef(chartData);
  const timeframeRef = useRef<ChartTimeframe>(requestedTimeframe);

  // [SRE] Concurrency & Throttling Guards
  const currentFetchIdRef = useRef(0);
  const lastDispatchedSnapshotStrRef = useRef<string>("");
  const getActionByTickerRef = useRef(getActionByTicker);
  const getAllCoursRef = useRef(getAllCours);
  const historyLimitRef = useRef(OHLCV_PAGE_SIZE);
  const historyCurrentPageRef = useRef(1);
  const historyLoadInFlightRef = useRef(false);
  const historyExhaustedRef = useRef(false);
  const historyTotalPagesRef = useRef<number | null>(null);
  const resolvedActionRef = useRef<ActionEntity | null>(null);
  const chartDataSymbolRef = useRef("");
  const resolvedDataSymbolRef = useRef("");
  const marketScopeRef = useRef(marketScope);
  const historyScopeKeyRef = useRef("");
  const pendingHistorySeriesRef = useRef<ChartDataPoint[] | null>(null);
  const pendingHistoryDirtyRef = useRef(false);
  const requestMoreHistoryRef = useRef<(direction: "left" | "right") => void>(() => undefined);

  // [SRE] Component Lifecycle Guard
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => { addNotificationRef.current = addNotification; }, [addNotification]);
  useEffect(() => {
    chartDataRef.current = chartDataSymbolRef.current === symbol ? chartData : [];
  }, [chartData, symbol]);
  useEffect(() => { dispatchRef.current = dispatch; }, [dispatch]);
  useEffect(() => { marketDataCacheRef.current = marketDataCache; }, [marketDataCache]);
  useEffect(() => { symbolRef.current = symbol; }, [symbol]);
  useEffect(() => { timeframeRef.current = requestedTimeframe; }, [requestedTimeframe]);
  useEffect(() => { getActionByTickerRef.current = getActionByTicker; }, [getActionByTicker]);
  useEffect(() => { getAllCoursRef.current = getAllCours; }, [getAllCours]);
  useEffect(() => { resolvedActionRef.current = resolvedActionByTicker; }, [resolvedActionByTicker]);

  const applyWindowFirstData = useCallback((_ticker: string, fullData: ChartDataPoint[]) => {
    // ECharts gère 10k+ bougies nativement via dataZoom.
    chartDataSymbolRef.current = normalizeTicker(_ticker);
    chartDataRef.current = fullData;
    setChartData(fullData);
  }, []);

  const commitChartSeries = useCallback((tickerForCommit: string, series: ChartDataPoint[]) => {
    if (!isMounted.current || series.length === 0) return;
    const upperTicker = normalizeTicker(tickerForCommit);
    applyWindowFirstData(upperTicker, series);
    dispatchRef.current(updateMarketData({
      market: marketScope,
      symbol: upperTicker,
      data: series,
      timeframe: requestedTimeframe,
      sourceKind: "equity",
    }));
    if (requestedTimeframe === "1D") {
      void writePersistedMarketData(marketScope, upperTicker, series);
    }
  }, [applyWindowFirstData, marketScope, requestedTimeframe]);

  useEffect(() => {
    if (mode !== "real" || !symbol || !isMounted.current) return;
    const cacheKey = createTimeframeMarketDataCacheKey(marketScope, symbol, requestedTimeframe, "equity");
    const cachedSeries = marketDataCache[cacheKey];
    if (!Array.isArray(cachedSeries) || cachedSeries.length === 0) return;
    if (chartDataSymbolRef.current !== symbol || chartDataRef.current !== cachedSeries) {
      applyWindowFirstData(symbol, cachedSeries);
    }
    resolvedDataSymbolRef.current = symbol;
    setLoadStatus("loaded");
    setIsLoading(false);
  }, [applyWindowFirstData, marketDataCache, marketScope, mode, requestedTimeframe, symbol]);

  const effectiveActionByTickerData = isActionForMarket(currentActionByTickerData, symbol, marketScope)
    ? currentActionByTickerData
    : isActionForMarket(resolvedActionByTicker, symbol, marketScope)
      ? resolvedActionByTicker
      : null;

  // The sidebar has a separate readiness contract from the OHLCV chart. A
  // cached series may be renderable while the API action (quote, ratios and
  // market statistics) is still being resolved.
  const isLiveDataLoading = mode === "real"
    && !effectiveActionByTickerData
    && (symbol.length === 0 || isLoading || isLoadingActionByTicker || isFetchingActionByTicker || resolvedDataSymbolRef.current !== symbol);

  // In real mode a live snapshot is derived from the action response accepted
  // by this hook. The Redux snapshot remains available for legacy consumers and
  // mock mode, but it must not resurrect a quote from a previous intent.
  const liveSnapshot = useMemo(() => {
    if (mode !== "real") return liveSnapshotsCache[symbol] || null;
    const metric = effectiveActionByTickerData?.latest_price_metric;
    return metric ? priceMetricToLiveSnapshot(metric, symbol) : null;
  }, [effectiveActionByTickerData, liveSnapshotsCache, mode, symbol]);

  // ── SNAPSHOT LIVE : dérivé de latest_price_metric (API), champs null visibles ─
  // Réagit à l'arrivée de la donnée ticker (RTK Query -> currentActionByTickerData).
  useEffect(() => {
    if (mode !== "real") return;
    const action = effectiveActionByTickerData;
    if (!action) return;

    const upperTicker = (action.ticker || symbol).toUpperCase();
    const metric = action.latest_price_metric;
    if (!metric) return; // Métrique absente = défaillance visible (pas de fabrication).

    const snapshot: LiveSnapshot = priceMetricToLiveSnapshot(metric, upperTicker);

    // [SRE] Redux Dispatch Throttling.
    const snapSig = `${snapshot.price}_${snapshot.volume}_${snapshot.variation}`;
    if (lastDispatchedSnapshotStrRef.current !== snapSig) {
      dispatchRef.current(updateMarketSnapshot({ symbol: upperTicker, snapshot }));
      lastDispatchedSnapshotStrRef.current = snapSig;
    }
  }, [effectiveActionByTickerData, mode, symbol]);

  // ── CHARGEMENT OHLCV : action(ticker) -> instrument -> cours(instrument) ────
  const loadMarketData = useCallback(async (ticker: string, historyPoints = OHLCV_PAGE_SIZE, options: MarketDataLoadOptions = {}) => {
    const isSilentRefresh = options.silent === true;
    const deferApply = options.deferApply === true;
    const historyPage = Number.isInteger(options.historyPage) && (options.historyPage ?? 0) > 0 ? options.historyPage as number : null;
    const previousSymbol = symbolRef.current;
    symbolRef.current = ticker;
    if (!isSilentRefresh) setResolvedActionByTicker(null);
    const boundedHistoryPoints = historyPage === null
      ? Math.max(OHLCV_PAGE_SIZE, Math.min(historyPoints, 10000))
      : Math.max(OHLCV_PAGE_SIZE, historyPoints);
    const shouldResetHistoryPagination =
      previousSymbol !== ticker ||
      (!isSilentRefresh && (historyPage === null || historyPage === 1));
    if (shouldResetHistoryPagination) {
      historyLimitRef.current = OHLCV_PAGE_SIZE;
      historyCurrentPageRef.current = 1;
      historyTotalPagesRef.current = null;
      if (previousSymbol !== ticker) historyExhaustedRef.current = false;
    }

    // [SRE] Fail-Fast si hors-ligne.
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      console.warn(`[MarketData] Offline. Aborting fetch for ${ticker}.`);
      return;
    }

    // [SRE] Race Condition Guard (Fetch ID).
    // Silent SWR refreshes belong to the current market+ticker generation and
    // must never supersede the blocking bootstrap request. Otherwise the
    // bootstrap `finally` cannot close its loader and the UI can remain stuck.
    if (!isSilentRefresh) currentFetchIdRef.current += 1;
    const thisFetchId = currentFetchIdRef.current;

    if (!isSilentRefresh) {
      setLoadStatus("loading");
      setIsLoading(true);
    }
    const upperTicker = ticker.toUpperCase();
    const cachedSeries = chartDataSymbolRef.current === upperTicker ? chartDataRef.current : [];
    if (!deferApply && (historyPage === null || previousSymbol !== ticker)) {
      pendingHistorySeriesRef.current = null;
      pendingHistoryDirtyRef.current = false;
    }
    const baseSeries = pendingHistorySeriesRef.current ?? cachedSeries;

    if (cachedSeries.length > 0 && !deferApply) {
      applyWindowFirstData(upperTicker, cachedSeries);
    }

    try {
      // 1) Resolve metadata and price history independently whenever a persisted
      // ticker -> instrument identity is available. This removes the avoidable
      // startup waterfall `actions -> cours` on revisits while still revalidating
      // the richer ActionEntity in the background for live metrics/metadata.
      const cachedAction = isSilentRefresh && isActionForMarket(resolvedActionRef.current, upperTicker, marketScope)
        ? resolvedActionRef.current
        : null;
      const persistedIdentity = cachedAction
        ? null
        : readPersistedActionIdentity(marketScope, upperTicker, forcedIsin);
      const actionResolutionPromise: Promise<ActionEntity> = cachedAction
        ? Promise.resolve(cachedAction)
        : withRequestTimeout(
            getActionByTickerRef.current({ ticker: upperTicker, isin: forcedIsin, marketTicker: marketScope }),
            "Action resolution",
          );
      const validatedActionPromise = actionResolutionPromise.then((action) => {
        if (!isActionForMarket(action, upperTicker, marketScope)) {
          throw new Error(`API action ticker mismatch for ${upperTicker}.`);
        }
        if (isMounted.current && currentFetchIdRef.current === thisFetchId) {
          resolvedActionRef.current = action;
          setResolvedActionByTicker(action);
        }
        return action;
      });

      let instrumentId = typeof cachedAction?.instrument === "string" && cachedAction.instrument.trim()
        ? cachedAction.instrument.trim()
        : persistedIdentity?.instrumentId ?? "";

      if (!instrumentId) {
        const action = await validatedActionPromise;
        if (!isMounted.current || currentFetchIdRef.current !== thisFetchId) return;
        instrumentId = typeof action.instrument === "string" ? action.instrument.trim() : "";
      } else if (!cachedAction) {
        void validatedActionPromise.catch((error: unknown) => {
          console.warn(`[MarketData] Metadata revalidation failed for ${upperTicker}:`, error);
        });
      }

      if (!instrumentId) {
        throw new Error(`Action ${upperTicker} has no instrument identifier.`);
      }

      // 2) API-first SWR: history extension requests only the missing page.
      // A stale persisted identity is self-healing: if the cours request rejects,
      // wait for fresh action metadata and retry once only when the instrument id changed.
      const fetchCoursPayload = async (targetInstrumentId: string): Promise<{
        paginatedData: CoursEntity[];
        reportedTotalPages: number | null;
        resolvedSeries: ChartDataPoint[] | null;
        dataSource: TimeframeDataSourceKind;
      }> => {
        if (requestedTimeframe !== "1D") {
          const resolution = await withRequestTimeout(
            loadTimeframeSeries(requestedTimeframe, async (apiSeconds) => {
              const historyBudget = apiSeconds === 86400
                ? Math.min(10000, Math.max(1000, boundedHistoryPoints * 10))
                : Math.min(10000, Math.max(500, boundedHistoryPoints));
              const entities = await getCoursHistory(
                { instrument: targetInstrumentId, timeframe: apiSeconds },
                historyBudget,
              );
              return coursSeriesToChartData(entities);
            }),
            "Timeframe history",
          );
          return {
            paginatedData: [],
            reportedTotalPages: null,
            resolvedSeries: resolution.series,
            dataSource: resolution.source,
          };
        }

        let paginatedData: CoursEntity[] = [];
        let reportedTotalPages: number | null = null;
        if (historyPage !== null) {
          const response = await withRequestTimeout(
            getAllCoursRef.current({ instrument: targetInstrumentId, timeframe: requestedTimeframeSeconds, page: historyPage, page_size: OHLCV_PAGE_SIZE }),
            "History page",
          );
          paginatedData = response?.data ?? [];
          const totalPages = Number(response?.total_pages);
          reportedTotalPages = Number.isFinite(totalPages) && totalPages > 0 ? Math.floor(totalPages) : null;
        } else if (cachedSeries.length > 0) {
          paginatedData = await withRequestTimeout(
            getCoursHistory({ instrument: targetInstrumentId, timeframe: requestedTimeframeSeconds }, boundedHistoryPoints),
            "History",
          );
        } else {
          const response = await withRequestTimeout(
            getAllCoursRef.current({ instrument: targetInstrumentId, timeframe: requestedTimeframeSeconds, page: 1, page_size: boundedHistoryPoints }),
            "Initial history",
          );
          paginatedData = response?.data ?? [];
          const totalPages = Number(response?.total_pages);
          reportedTotalPages = Number.isFinite(totalPages) && totalPages > 0 ? Math.floor(totalPages) : null;
        }
        return {
          paginatedData,
          reportedTotalPages,
          resolvedSeries: null,
          dataSource: paginatedData.length > 0 ? "native" : "unavailable",
        };
      };

      let coursPayload;
      try {
        coursPayload = await fetchCoursPayload(instrumentId);
      } catch (initialCoursError) {
        if (!cachedAction && persistedIdentity) {
          const freshAction = await validatedActionPromise;
          const freshInstrumentId = typeof freshAction.instrument === "string" ? freshAction.instrument.trim() : "";
          if (freshInstrumentId && freshInstrumentId !== instrumentId) {
            instrumentId = freshInstrumentId;
            coursPayload = await fetchCoursPayload(instrumentId);
          } else {
            throw initialCoursError;
          }
        } else {
          throw initialCoursError;
        }
      }
      const { paginatedData, reportedTotalPages, resolvedSeries } = coursPayload;

      if (reportedTotalPages !== null) historyTotalPagesRef.current = reportedTotalPages;

      // [SRE] Race Condition Guard.
      if (!isMounted.current || currentFetchIdRef.current !== thisFetchId) return;

      const incomingSeries = resolvedSeries ?? coursSeriesToChartData(paginatedData);
      const knownTotalPages = reportedTotalPages ?? historyTotalPagesRef.current;
      if (requestedTimeframe !== "1D") {
        const previousCount = baseSeries.length;
        historyExhaustedRef.current = boundedHistoryPoints >= 10_000
          || (boundedHistoryPoints > OHLCV_PAGE_SIZE && incomingSeries.length <= previousCount);
      } else if (historyPage !== null && (incomingSeries.length === 0 || (knownTotalPages !== null && historyPage >= knownTotalPages))) {
        historyExhaustedRef.current = true;
      }
      // Daily history is page-mergeable. Non-daily data is resolved as one
      // coherent native/aggregated series and must never be merged with a stale
      // daily viewport from the same ticker.
      const series = requestedTimeframe === "1D" && baseSeries.length > 0
        ? mergeChartHistory(baseSeries, incomingSeries)
        : incomingSeries;

      if (series.length > 0) {
        if (historyPage !== null && incomingSeries.length > 0) {
          historyLimitRef.current = Math.max(historyLimitRef.current, boundedHistoryPoints);
        } else if (historyPage === null) {
          historyLimitRef.current = requestedTimeframe === "1D"
            ? boundedHistoryPoints
            : Math.max(boundedHistoryPoints, incomingSeries.length);
        }
        if (deferApply) {
          pendingHistorySeriesRef.current = series;
          pendingHistoryDirtyRef.current = true;
        } else {
          commitChartSeries(upperTicker, series);
        }
        if (!isSilentRefresh) setLoadStatus("loaded");
      } else if (!isSilentRefresh) {
        setLoadStatus("empty");
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.warn(`[MarketData] API fetch failed for ${upperTicker}:`, err?.message ?? err);
      if (!isSilentRefresh && chartDataRef.current.length === 0 && isMounted.current && currentFetchIdRef.current === thisFetchId) {
        setLoadStatus("failed");
      }
      if (chartDataRef.current.length === 0 && isMounted.current && currentFetchIdRef.current === thisFetchId) {
        addNotificationRef.current({
          title: "Échec du flux de données",
          message: `Difficulté passagère sur ${upperTicker}. L'API n'a pas répondu.`,
          type: "warning",
          iconType: "faWifi",
        });
      }
    } finally {
      if (!isSilentRefresh && isMounted.current && currentFetchIdRef.current === thisFetchId) {
        resolvedDataSymbolRef.current = upperTicker;
        setIsLoading(false);
      }
    }
  }, [applyWindowFirstData, commitChartSeries, forcedIsin, getCoursHistory, marketScope, requestedTimeframe, requestedTimeframeSeconds]);

  const loadMarketDataPage = useCallback(async (ticker: string, page: number) => {
    symbolRef.current = ticker;
    const upperTicker = ticker.toUpperCase();

    if (requestedTimeframe !== "1D") {
      historyExhaustedRef.current = true;
      return;
    }
    if (typeof navigator !== "undefined" && !navigator.onLine) return;

    const isActivePageRequest = () =>
      isMounted.current &&
      normalizeTicker(symbolRef.current) === upperTicker &&
      marketScopeRef.current === marketScope;

    try {
      const cachedAction = isActionForMarket(resolvedActionRef.current, upperTicker, marketScope)
        ? resolvedActionRef.current
        : null;
      const persistedIdentity = cachedAction
        ? null
        : readPersistedActionIdentity(marketScope, upperTicker, forcedIsin);
      const actionResolutionPromise: Promise<ActionEntity> = cachedAction
        ? Promise.resolve(cachedAction)
        : withRequestTimeout(
            getActionByTickerRef.current({ ticker: upperTicker, isin: forcedIsin, marketTicker: marketScope }),
            "Action resolution",
          );
      const validatedActionPromise = actionResolutionPromise.then((action) => {
        if (!isActionForMarket(action, upperTicker, marketScope)) {
          throw new Error(`API action ticker mismatch for ${upperTicker}.`);
        }
        if (isActivePageRequest()) {
          resolvedActionRef.current = action;
          setResolvedActionByTicker(action);
        }
        return action;
      });

      let instrumentId = typeof cachedAction?.instrument === "string" && cachedAction.instrument.trim()
        ? cachedAction.instrument.trim()
        : persistedIdentity?.instrumentId ?? "";
      if (!instrumentId) {
        const action = await validatedActionPromise;
        if (!isActivePageRequest()) return;
        instrumentId = typeof action.instrument === "string" ? action.instrument.trim() : "";
      } else if (!cachedAction) {
        void validatedActionPromise.catch((error: unknown) => {
          console.warn(`[MarketData] History metadata revalidation failed for ${upperTicker}:`, error);
        });
      }
      if (!instrumentId) {
        throw new Error(`Action ${upperTicker} has no instrument identifier.`);
      }

      const knownTotalPagesBeforeRequest = historyTotalPagesRef.current;
      if (knownTotalPagesBeforeRequest !== null && page > knownTotalPagesBeforeRequest) {
        historyExhaustedRef.current = true;
        return;
      }

      const response = await withRequestTimeout(
        getAllCoursRef.current({
          instrument: instrumentId,
          timeframe: requestedTimeframeSeconds,
          page,
          page_size: OHLCV_PAGE_SIZE,
        }),
        `History page ${page}`,
      );
      if (!isActivePageRequest()) return;

      const reportedTotalPages = Number(response?.total_pages);
      if (Number.isFinite(reportedTotalPages) && reportedTotalPages > 0) {
        historyTotalPagesRef.current = Math.floor(reportedTotalPages);
      }

      const incomingSeries = coursSeriesToChartData(response?.data ?? []);
      const knownTotalPages = historyTotalPagesRef.current;
      if (incomingSeries.length === 0 || (knownTotalPages !== null && page >= knownTotalPages)) {
        historyExhaustedRef.current = true;
      }

      const baseSeries = chartDataSymbolRef.current === upperTicker ? chartDataRef.current : [];
      const series = baseSeries.length > 0
        ? mergeChartHistory(baseSeries, incomingSeries)
        : incomingSeries;

      if (series.length > 0) {
        historyCurrentPageRef.current = page;
        historyLimitRef.current = page * OHLCV_PAGE_SIZE;
        commitChartSeries(upperTicker, series);
      }
    } catch (error: unknown) {
      console.warn(`[MarketData] History page fetch failed for ${upperTicker}:`, error);
    }
  }, [commitChartSeries, forcedIsin, marketScope, requestedTimeframe, requestedTimeframeSeconds]);

  const requestMoreHistory = useCallback((direction: "left" | "right" = "left") => {
    if (direction !== "left" || historyLoadInFlightRef.current || historyExhaustedRef.current || !isMounted.current) return;
    const historyTicker = symbolRef.current;
    const historyMarketScope = marketScopeRef.current;
    if (!historyTicker) return;

    const isActiveHistoryRequest = () =>
      isMounted.current &&
      symbolRef.current === historyTicker &&
      marketScopeRef.current === historyMarketScope;

    historyLoadInFlightRef.current = true;

    if (timeframeRef.current !== "1D") {
      const nextLimit = Math.min(
        10_000,
        Math.max(historyLimitRef.current + 500, chartDataRef.current.length + 500),
      );
      void loadMarketData(historyTicker, nextLimit, { silent: true })
        .finally(() => {
          if (isActiveHistoryRequest()) historyLoadInFlightRef.current = false;
        });
      return;
    }

    const nextPage = historyCurrentPageRef.current + 1;
    const totalPages = historyTotalPagesRef.current;

    if (totalPages !== null && nextPage > totalPages) {
      historyExhaustedRef.current = true;
      historyLoadInFlightRef.current = false;
      return;
    }

    // One logical history-boundary crossing owns exactly one page request.
    // `historyLoadInFlightRef` keeps the series single-flight until that page has
    // been merged and committed, preventing bursty multi-page prepends and the
    // resulting ECharts coordinate churn under rapid pan/zoom gestures.
    void loadMarketDataPage(historyTicker, nextPage)
      .finally(() => {
        if (isActiveHistoryRequest()) {
          historyLoadInFlightRef.current = false;
        }
      });
  }, [loadMarketData, loadMarketDataPage]);

  requestMoreHistoryRef.current = requestMoreHistory;

  // ============================================================================
  // [SRE] NETWORK LIFECYCLE SHIELD — Page Visibility + navigator.onLine.
  // Polling piloté API (pas de scraping). Pause en onglet caché / hors-ligne.
  // ============================================================================
  useEffect(() => {
    if (uiState.replay.isActive) return;
    if (mode !== "real") {
      resolvedDataSymbolRef.current = symbol;
      setLoadStatus(symbol ? "loaded" : "idle");
      setIsLoading(false);
      return;
    }
    if (!symbol) {
      currentFetchIdRef.current += 1;
      symbolRef.current = "";
      historyScopeKeyRef.current = "";
      chartDataSymbolRef.current = "";
      resolvedDataSymbolRef.current = "";
      setChartData([]);
      setResolvedActionByTicker(null);
      setLoadStatus("idle");
      setIsLoading(false);
      return;
    }

    // Pagination belongs to the exact market+ticker scope, never to the hook
    // instance globally. Previously a title exhausted on the left could leave
    // historyExhausted/currentPage behind when the user selected another title
    // on the same exchange, causing the new chart to stop forever at page 1.
    const nextHistoryScopeKey = `${marketScope}:${symbol}:${requestedTimeframe}`;
    const historyScopeChanged = historyScopeKeyRef.current !== nextHistoryScopeKey;
    if (historyScopeChanged) {
      historyScopeKeyRef.current = nextHistoryScopeKey;
      marketScopeRef.current = marketScope;
      timeframeRef.current = requestedTimeframe;
      currentFetchIdRef.current += 1;
      historyLimitRef.current = OHLCV_PAGE_SIZE;
      historyCurrentPageRef.current = 1;
      historyExhaustedRef.current = false;
      historyTotalPagesRef.current = null;
      historyLoadInFlightRef.current = false;
      pendingHistorySeriesRef.current = null;
      pendingHistoryDirtyRef.current = false;
      const cachedScopeSeries = isDailyTimeframe
        ? marketDataCacheRef.current[createMarketDataCacheKey(marketScope, symbol)] ?? []
        : [];
      const hasCachedScopeSeries = cachedScopeSeries.length > 0;
      chartDataSymbolRef.current = hasCachedScopeSeries ? symbol : "";
      resolvedDataSymbolRef.current = hasCachedScopeSeries ? symbol : "";
      chartDataRef.current = hasCachedScopeSeries ? cachedScopeSeries : [];
      setChartData(cachedScopeSeries);
      setLoadStatus(hasCachedScopeSeries ? "loaded" : "loading");
      setIsLoading(!hasCachedScopeSeries);
      setResolvedActionByTicker(null);
      resolvedActionRef.current = null;
    } else if (marketScopeRef.current !== marketScope) {
      // Defensive coherence for a market change that preserves the same key
      // representation through an upstream normalization edge case.
      marketScopeRef.current = marketScope;
    }

    symbolRef.current = symbol;
    const POLLING_INTERVAL = 5 * 60 * 1000;
    let isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
    let pollingTimer: NodeJS.Timeout | null = null;

    const startPolling = () => {
      if (pollingTimer) clearInterval(pollingTimer);
      pollingTimer = setInterval(() => {
        if (typeof document !== "undefined" && document.hidden) return;
        if (!isOnline) return;
        void loadMarketData(symbolRef.current, OHLCV_PAGE_SIZE, { silent: true, historyPage: 1 });
      }, POLLING_INTERVAL);
    };

    const stopPolling = () => {
      if (pollingTimer) { clearInterval(pollingTimer); pollingTimer = null; }
    };

    const handleVisibilityChange = () => {
      if (typeof document === "undefined") return;
      if (document.hidden) { stopPolling(); }
      else if (isOnline) {
        void loadMarketData(symbolRef.current, OHLCV_PAGE_SIZE, { silent: true, historyPage: 1 });
        startPolling();
      }
    };

    const handleOnline = () => {
      isOnline = true;
      if (typeof document !== "undefined" && !document.hidden) {
        void loadMarketData(symbolRef.current, OHLCV_PAGE_SIZE, { silent: true, historyPage: 1 });
        startPolling();
      }
    };

    const handleOffline = () => {
      isOnline = false;
      stopPolling();
      addNotificationRef.current({
        title: "Connexion perdue",
        message: "Le flux de données est en pause.",
        type: "warning",
        iconType: "faWifi",
      });
    };

    // Bootstrap: show Redux/IndexedDB API cache first, then revalidate in the background.
    const bootstrap = async () => {
      let cachedSeries: ChartDataPoint[] = isDailyTimeframe
        ? marketDataCacheRef.current[createMarketDataCacheKey(marketScope, symbol)] ?? []
        : [];
      if (isDailyTimeframe && cachedSeries.length === 0) {
        cachedSeries = await readPersistedMarketData(marketScope, symbol);
      }
      if (!isMounted.current || symbolRef.current !== symbol) return;
      if (cachedSeries.length > 0) {
        applyWindowFirstData(symbol, cachedSeries);
        dispatchRef.current(updateMarketData({ market: marketScope, symbol, data: cachedSeries }));
        resolvedDataSymbolRef.current = symbol;
        // Cached candles are already renderable. Close the blocking bootstrap
        // loader before the silent API revalidation so stale-while-revalidate
        // never leaves the chart dimmed indefinitely when that request fails.
        setLoadStatus("loaded");
        setIsLoading(false);
        // Persisted history is stored as a contiguous page prefix (page 1..N).
        // Restore the pagination cursor from the cached bar count so a reload or
        // symbol revisit continues with the next unseen historical page instead
        // of re-requesting pages 2..4 forever.
        const cachedPageCount = Math.max(1, Math.ceil(cachedSeries.length / OHLCV_PAGE_SIZE));
        historyCurrentPageRef.current = cachedPageCount;
        historyLimitRef.current = cachedSeries.length;
        await loadMarketData(symbol, OHLCV_PAGE_SIZE, { silent: true, historyPage: 1 });
      } else {
        chartDataSymbolRef.current = "";
        setChartData([]);
        await loadMarketData(symbol);
      }
    };
    void bootstrap();

    if (typeof window !== "undefined") {
      window.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }
    if (typeof document !== "undefined" && !document.hidden && isOnline) {
      startPolling();
    }

    return () => {
      currentFetchIdRef.current += 1;
      stopPolling();
      if (typeof window !== "undefined") {
        window.removeEventListener("visibilitychange", handleVisibilityChange);
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDailyTimeframe, marketScope, mode, requestedTimeframe, symbol, uiState.replay.isActive]);

  // ── BAR REPLAY ──────────────────────────────────────────────────────────
  // TradingView's contract is intentionally mirrored here: selecting a start
  // point hides every future bar, replay starts PAUSED, Forward reveals exactly
  // one bar, Play advances at the configured speed, and Exit restores the
  // untouched source series. The original dataset never gets mutated.
  const applyReplayIndex = useCallback((nextIndex: number) => {
    const source = replayOriginalData.current;
    if (source.length === 0) return;
    const boundedIndex = Math.min(Math.max(0, nextIndex), source.length - 1);
    replayIndex.current = boundedIndex;
    const visible = source.slice(0, boundedIndex + 1);
    chartDataRef.current = visible;
    setChartData(visible);
    dispatch(setReplayCurrentIndex(boundedIndex));
  }, [dispatch]);

  const startReplay = useCallback((requestedStartTime?: string | null) => {
    const source = chartDataRef.current.length > 0 ? [...chartDataRef.current] : [...chartData];
    if (source.length < 2) {
      addNotificationRef.current({
        title: "Replay indisponible",
        message: "Au moins deux bougies sont nécessaires pour démarrer le Bar Replay.",
        type: "info",
        iconType: "faInfoCircle",
      });
      return;
    }

    replayOriginalData.current = source;
    let startIndex = Math.max(0, source.length - Math.min(100, Math.max(2, Math.floor(source.length / 2))));
    const requestedTimestamp = requestedStartTime ? Date.parse(requestedStartTime) : Number.NaN;
    if (Number.isFinite(requestedTimestamp)) {
      const matchingIndex = source.findIndex((point) => {
        const timestamp = Date.parse(String(point.time ?? ""));
        return Number.isFinite(timestamp) && timestamp >= requestedTimestamp;
      });
      if (matchingIndex >= 0) startIndex = matchingIndex;
    }
    startIndex = Math.min(Math.max(0, startIndex), source.length - 2);

    dispatch(setReplayTotalCandles(source.length));
    dispatch(setReplayActive(true));
    dispatch(setReplayPaused(true));
    dispatch(setModalOpen({ modal: "replay", isOpen: false }));
    applyReplayIndex(startIndex);
    setShowReplayFullText(true);
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    collapseTimer.current = setTimeout(() => setShowReplayFullText(false), 3000);
  }, [applyReplayIndex, chartData, dispatch]);

  const stopReplay = useCallback(() => {
    if (replayTimer.current) clearInterval(replayTimer.current);
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    const source = replayOriginalData.current;
    if (source.length > 0) {
      chartDataRef.current = source;
      setChartData(source);
    }
    replayOriginalData.current = [];
    replayIndex.current = 0;
    dispatch(setReplayActive(false));
    dispatch(setReplayPaused(false));
    setShowReplayFullText(false);
  }, [dispatch]);

  const toggleReplayPause = useCallback(() => {
    if (!uiState.replay.isActive) return;
    const atEnd = replayOriginalData.current.length > 0
      && replayIndex.current >= replayOriginalData.current.length - 1;
    if (atEnd) return;
    dispatch(setReplayPaused(!uiState.replay.isPaused));
  }, [dispatch, uiState.replay.isActive, uiState.replay.isPaused]);

  const stepReplay = useCallback((direction: 1 | -1 = 1) => {
    if (!uiState.replay.isActive || replayOriginalData.current.length === 0) return;
    dispatch(setReplayPaused(true));
    applyReplayIndex(replayIndex.current + direction);
  }, [applyReplayIndex, dispatch, uiState.replay.isActive]);

  const jumpReplayToRealtime = useCallback(() => {
    if (!uiState.replay.isActive || replayOriginalData.current.length === 0) return;
    dispatch(setReplayPaused(true));
    applyReplayIndex(replayOriginalData.current.length - 1);
  }, [applyReplayIndex, dispatch, uiState.replay.isActive]);

  useEffect(() => {
    if (!uiState.replay.isActive || uiState.replay.isPaused) {
      if (replayTimer.current) clearInterval(replayTimer.current);
      replayTimer.current = null;
      return;
    }
    replayTimer.current = setInterval(() => {
      const lastIndex = replayOriginalData.current.length - 1;
      if (replayIndex.current >= lastIndex) {
        dispatch(setReplayPaused(true));
        return;
      }
      applyReplayIndex(replayIndex.current + 1);
    }, uiState.replay.speed);
    return () => {
      if (replayTimer.current) clearInterval(replayTimer.current);
      replayTimer.current = null;
    };
  }, [applyReplayIndex, dispatch, uiState.replay.isActive, uiState.replay.isPaused, uiState.replay.speed]);

  const lastCandle = chartData.length > 0 ? chartData[chartData.length - 1] : null;
  const apiPriceMetric = effectiveActionByTickerData?.latest_price_metric;
  const currentVolume = mode === "real"
    ? apiPriceMetric?.volume ?? null
    : apiPriceMetric?.volume ?? liveSnapshotsCache[symbol]?.volume ?? lastCandle?.volume ?? 0;
  const avgVolume = mode === "real"
    ? apiPriceMetric?.vol_avg_20d ?? null
    : (() => {
      if (chartData.length === 0) return 0;
      const last30 = chartData.slice(-30);
      const sum = last30.reduce((acc, curr) => acc + (curr.volume || 0), 0);
      return sum / last30.length;
    })();

  const visibleChartData = chartDataSymbolRef.current === symbol ? chartData : [];
  const hasRenderableData = visibleChartData.length > 0;

  return {
    chartData: visibleChartData,
    setChartData,
    // A blocking loader is valid only before the first renderable series.
    // Once candles are visible, stale-while-revalidate (including a slow/503
    // metadata request) must never dim or hide the chart again.
    isLoading: !hasRenderableData && (
      isLoading || (mode === "real" && symbol.length > 0 && resolvedDataSymbolRef.current !== symbol)
    ),
    loadStatus,
    startReplay,
    stopReplay,
    toggleReplayPause,
    stepReplay,
    jumpReplayToRealtime,
    showReplayFullText,
    setShowReplayFullText,
    liveSnapshot,
    isLiveDataLoading,
    currentVolume,
    avgVolume,
    requestMoreHistory,
    currentActionByTickerData: effectiveActionByTickerData,
    apiPriceMetric: (effectiveActionByTickerData?.latest_price_metric ?? null) as PriceIndicatorEntity | null,
    apiTechnicalIndicator: (effectiveActionByTickerData?.latest_technical_indicator ?? null) as TechnicalIndicatorEntity | null,
    apiValuationRatio: (effectiveActionByTickerData?.latest_valuation_ratio ?? null) as ValuationRatioEntity | null,
  };
};

// ============================================================================
// Hook 1: useLiveMetrics — inchangé (calculs de présentation PnL, O(1)).
// ============================================================================
export const useLiveMetrics = (
  chartData: ChartDataPoint[],
  liveSnapshot: LiveSnapshot | null,
  security: BRVMSecurity,
  effectiveRate: number
) => {
  return useMemo(() => {
    const lastCandle = chartData.length > 0 ? chartData[chartData.length - 1] : null;

    const livePrice = liveSnapshot?.price ?? lastCandle?.close ?? Number.NaN;
    let liveChange = Number.NaN;
    let liveChangePercent = Number.NaN;
    let liveVolume = Number.NaN;

    if (liveSnapshot) {
      const variationNum = Number((liveSnapshot as LiveSnapshot & { variationNum?: unknown }).variationNum);
      if (Number.isFinite(variationNum)) {
        liveChangePercent = liveSnapshot.variation.includes("-") && variationNum > 0 ? -variationNum : variationNum;
      } else {
        const parsedVariation = Number(liveSnapshot.variation.replace("%", "").replace(",", ".").trim());
        if (Number.isFinite(parsedVariation)) liveChangePercent = parsedVariation;
      }
      liveVolume = liveSnapshot.volume ?? Number.NaN;
    } else if (lastCandle) {
      liveVolume = lastCandle.volume ?? Number.NaN;
    }

    const convertedLivePrice = livePrice * effectiveRate;
    const convertedBidPrice = liveSnapshot?.bid != null ? liveSnapshot.bid * effectiveRate : null;
    const convertedAskPrice = liveSnapshot?.ask != null ? liveSnapshot.ask * effectiveRate : null;
    const convertedLastCandleClose = (lastCandle ? lastCandle.close : livePrice) * effectiveRate;
    const convertedLiveChange = liveChange * effectiveRate;
    const isMarketPositive = Number.isFinite(convertedLiveChange) && convertedLiveChange >= 0;
    const isLastPricePositive = lastCandle ? lastCandle.close >= lastCandle.open : convertedLiveChange >= 0;

    return {
      livePrice,
      liveChange,
      liveChangePercent,
      liveVolume,
      convertedLivePrice,
      convertedBidPrice,
      convertedAskPrice,
      convertedLastCandleClose,
      convertedLiveChange,
      isMarketPositive,
      isLastPricePositive,
      lastCandleTime: lastCandle?.time,
    };
  }, [chartData, liveSnapshot, effectiveRate]);
};

// ============================================================================
// Hook 2: useComparisonManager — migré API (fetch OHLCV par instrument/ticker).
// ============================================================================
export const useComparisonManager = (
  comparisonRequests: readonly ComparisonMarketRequest[],
  dataMode: "mock" | "real",
) => {
  const dispatch = useDispatch();
  const marketDataCache = useSelector(selectMarketData);
  const { getActionByTicker } = useActionRepository();
  const { getCoursHistory } = useCoursRepository();
  const { getIndicesCoursByIndice } = useIndiceRepository();
  const inflightFetches = useRef<Map<string, Promise<ComparisonFetchResult>>>(new Map());
  const historyFetches = useRef<Map<string, Promise<void>>>(new Map());
  const historyBudgetByKeyRef = useRef<Map<string, number>>(new Map());
  const historyExhaustedKeysRef = useRef<Set<string>>(new Set());
  const comparisonGraceTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const marketDataCacheRef = useRef(marketDataCache);
  const getActionByTickerRef = useRef(getActionByTicker);
  const getCoursHistoryRef = useRef(getCoursHistory);
  const getIndicesCoursByIndiceRef = useRef(getIndicesCoursByIndice);
  const [loadState, setLoadState] = useState<ComparisonLoadState>({});
  const [currencyByKey, setCurrencyByKey] = useState<ComparisonCurrencyState>({});
  const [dataSourceByKey, setDataSourceByKey] = useState<ComparisonDataSourceState>({});
  const currencyByKeyRef = useRef(currencyByKey);
  const requestSetKey = useMemo(
    () => createComparisonRequestSetKey(comparisonRequests),
    [comparisonRequests],
  );
  const safeRequests = useMemo(
    () => parseComparisonRequestSetKey(requestSetKey),
    [requestSetKey],
  );
  const seriesByKey = useMemo<ComparisonSeriesState>(() => {
    const next: ComparisonSeriesState = {};
    for (const request of safeRequests) {
      const key = createTimeframeMarketDataCacheKey(
        request.market,
        request.symbol,
        request.timeframe,
        request.sourceKind,
        request.sourceId,
      );
      const series = marketDataCache[key];
      if (series) next[key] = series;
    }
    return next;
  }, [marketDataCache, safeRequests]);

  useEffect(() => { marketDataCacheRef.current = marketDataCache; }, [marketDataCache]);
  useEffect(() => { getActionByTickerRef.current = getActionByTicker; }, [getActionByTicker]);
  useEffect(() => { getCoursHistoryRef.current = getCoursHistory; }, [getCoursHistory]);
  useEffect(() => { getIndicesCoursByIndiceRef.current = getIndicesCoursByIndice; }, [getIndicesCoursByIndice]);
  useEffect(() => { currencyByKeyRef.current = currencyByKey; }, [currencyByKey]);

  useEffect(() => {
    setLoadState((current) => {
      const next: ComparisonLoadState = {};
      safeRequests.forEach(({ market, symbol, timeframe = "1D", sourceKind = "equity", sourceId = "" }) => {
        const normalizedTimeframe = normalizeChartTimeframe(timeframe) ?? "1D";
        const requestKey = createTimeframeMarketDataCacheKey(
          market,
          symbol,
          normalizedTimeframe,
          sourceKind,
          sourceId,
        );
        const hasSeries = (marketDataCache[requestKey]?.length ?? 0) > 0;
        next[requestKey] = hasSeries ? "loaded" : current[requestKey] ?? "idle";
      });
      return areComparisonLoadStatesEqual(current, next) ? current : next;
    });
  }, [marketDataCache, safeRequests]);

  useEffect(() => {
    if (safeRequests.length === 0) return;
    let isActive = true;
    const requestKeys = new Set(
      safeRequests.map(({ market, symbol, timeframe = "1D", sourceKind = "equity", sourceId = "" }) =>
        createTimeframeMarketDataCacheKey(market, symbol, timeframe, sourceKind, sourceId)),
    );

    const clearGraceTimer = (requestKey: string) => {
      const timer = comparisonGraceTimersRef.current.get(requestKey);
      if (!timer) return;
      clearTimeout(timer);
      comparisonGraceTimersRef.current.delete(requestKey);
    };
    const clearGraceTimers = () => {
      comparisonGraceTimersRef.current.forEach((timer) => clearTimeout(timer));
      comparisonGraceTimersRef.current.clear();
    };
    const setRequestStatus = (requestKey: string, status: ComparisonLoadStatus) => {
      if (!isActive || !requestKeys.has(requestKey)) return;
      clearGraceTimer(requestKey);
      setLoadState((current) => (
        current[requestKey] === status ? current : { ...current, [requestKey]: status }
      ));
    };
    const settleRequestStatus = (
      requestKey: string,
      status: ComparisonLoadStatus,
      startedAt: number,
    ) => {
      if (!isActive) return;
      const remainingGraceMs = Math.max(0, COMPARISON_NO_DATA_GRACE_MS - (Date.now() - startedAt));
      if (remainingGraceMs === 0 || status === "loaded") {
        setRequestStatus(requestKey, status);
        return;
      }
      clearGraceTimer(requestKey);
      const timer = setTimeout(() => {
        comparisonGraceTimersRef.current.delete(requestKey);
        setRequestStatus(requestKey, status);
      }, remainingGraceMs);
      comparisonGraceTimersRef.current.set(requestKey, timer);
    };

    safeRequests.forEach(({ market, symbol, timeframe = "1D", sourceKind = "equity", sourceId = "" }) => {
      const normalizedTimeframe = normalizeChartTimeframe(timeframe) ?? "1D";
      const requestKey = createTimeframeMarketDataCacheKey(
        market,
        symbol,
        normalizedTimeframe,
        sourceKind,
        sourceId,
      );
      const cachedSeries = marketDataCacheRef.current[requestKey] ?? [];
      const hasCachedSeries = cachedSeries.length > 0;
      const hasKnownCurrency = Boolean(currencyByKeyRef.current[requestKey]);

      if (hasCachedSeries) {
        setRequestStatus(requestKey, "loaded");
        if (sourceKind === "index" || hasKnownCurrency) return;
      } else {
        setRequestStatus(requestKey, "loading");
      }

      const startedAt = Date.now();
      const existingRequest = inflightFetches.current.get(requestKey);

      const loadIndex = async (): Promise<ComparisonFetchResult> => {
        if (!sourceId) {
          throw new Error(`Index ${symbol} on ${market} has no index identifier.`);
        }
        if (normalizedTimeframe !== "1D" && normalizedTimeframe !== "1W" && normalizedTimeframe !== "1M") {
          return { series: [], currency: "", source: "unavailable", timeframe: normalizedTimeframe };
        }

        const pageSize = 500;
        const firstPage = await getIndicesCoursByIndiceRef.current(sourceId, { page: 1, page_size: pageSize });
        const entities = [...(firstPage.data ?? [])];
        const totalPages = Math.min(
          Math.max(1, Number(firstPage.total_pages) || 1),
          MAX_INDEX_HISTORY_PAGES,
        );
        const effectivePageSize = Math.max(1, Number(firstPage.page_size) || pageSize);
        for (let page = 2; page <= totalPages; page += 1) {
          const nextPage = await getIndicesCoursByIndiceRef.current(sourceId, {
            page,
            page_size: effectivePageSize,
          });
          if (Array.isArray(nextPage.data) && nextPage.data.length > 0) {
            entities.push(...nextPage.data);
          }
        }

        const dailySeries = indiceCoursToLineChartData(entities);
        const resolution = resolveIndexTimeframeSeries(normalizedTimeframe, dailySeries);
        if (!resolution) {
          return { series: [], currency: "", source: "unavailable", timeframe: normalizedTimeframe };
        }
        return {
          series: resolution.series,
          currency: "",
          source: resolution.source,
          timeframe: resolution.timeframe,
        };
      };

      const loadEquity = (): Promise<ComparisonFetchResult> => getActionByTickerRef.current({ ticker: symbol, marketTicker: market })
        .then(async (action): Promise<ComparisonFetchResult> => {
          const currency = typeof action.bourse?.currency?.symbol === "string"
            ? action.bourse.currency.symbol.trim().toUpperCase()
            : "";
          const latestCachedSeries = marketDataCacheRef.current[requestKey] ?? [];
          if (latestCachedSeries.length > 0) {
            return { series: latestCachedSeries, currency, source: "native", timeframe: normalizedTimeframe };
          }

          const instrumentId = typeof action.instrument === "string" ? action.instrument.trim() : "";
          if (!instrumentId) {
            throw new Error(`Action ${symbol} on ${market} has no instrument identifier.`);
          }

          const resolution = await loadTimeframeSeries(normalizedTimeframe, async (apiSeconds) => {
            const historyBudget = apiSeconds === 86400 && normalizedTimeframe !== "1D" ? 1000 : 500;
            const entities = await getCoursHistoryRef.current(
              { instrument: instrumentId, timeframe: apiSeconds },
              historyBudget,
            );
            return coursSeriesToChartData(entities);
          });
          if (resolution.series.length > 0) {
            dispatch(updateMarketData({
              market,
              symbol,
              data: resolution.series,
              timeframe: normalizedTimeframe,
              sourceKind,
              sourceId,
            }));
          }
          return {
            series: resolution.series,
            currency,
            source: resolution.source,
            timeframe: resolution.timeframe,
          };
        });

      const request: Promise<ComparisonFetchResult> = existingRequest
        ?? (sourceKind === "index" ? loadIndex() : loadEquity());

      if (!existingRequest) {
        inflightFetches.current.set(requestKey, request);
        const clearRequest = () => {
          if (inflightFetches.current.get(requestKey) === request) {
            inflightFetches.current.delete(requestKey);
          }
        };
        void request.then(clearRequest, clearRequest);
      }

      void request
        .then(({ series, currency, source }) => {
          if (!isActive || !requestKeys.has(requestKey)) return;
          if (currency) {
            setCurrencyByKey((current) => (
              current[requestKey] === currency ? current : { ...current, [requestKey]: currency }
            ));
          }
          if (series.length > 0) {
            dispatch(updateMarketData({
              market,
              symbol,
              data: series,
              timeframe: normalizedTimeframe,
              sourceKind,
              sourceId,
            }));
          }
          setDataSourceByKey((current) => (
            current[requestKey] === source ? current : { ...current, [requestKey]: source }
          ));
          settleRequestStatus(requestKey, series.length > 0 ? "loaded" : "empty", startedAt);
        })
        .catch((error: unknown) => {
          if (!isActive || !requestKeys.has(requestKey)) return;
          if (hasCachedSeries) {
            console.warn("[ComparisonManager] Metadata unavailable for cached market data", {
              market,
              symbol,
              timeframe: normalizedTimeframe,
              sourceKind,
              sourceId,
              error,
            });
            setRequestStatus(requestKey, "loaded");
            return;
          }
          console.warn("[ComparisonManager] Unable to load market comparison", {
            market,
            symbol,
            timeframe: normalizedTimeframe,
            sourceKind,
            sourceId,
            error,
          });
          settleRequestStatus(requestKey, "failed", startedAt);
        });
    });

    return () => {
      isActive = false;
      clearGraceTimers();
    };
    // `dataMode` is intentionally retained for source compatibility with existing callers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeRequests, dataMode, dispatch]);

  const requestMoreHistory = useCallback((request: ComparisonMarketRequest, direction: "left" | "right" = "left") => {
    if (direction !== "left" || request.sourceKind === "index") return;
    const symbol = String(request.symbol ?? "").trim().toUpperCase();
    const market = normalizeMarketDataScope(request.market);
    const timeframe = normalizeChartTimeframe(request.timeframe ?? "1D") ?? "1D";
    if (!symbol || !market) return;
    const requestKey = createTimeframeMarketDataCacheKey(market, symbol, timeframe, "equity", "");
    if (historyFetches.current.has(requestKey) || historyExhaustedKeysRef.current.has(requestKey)) return;

    const currentSeries = marketDataCacheRef.current[requestKey] ?? [];
    const currentBudget = historyBudgetByKeyRef.current.get(requestKey) ?? Math.max(500, currentSeries.length);
    const nextBudget = Math.min(10_000, Math.max(currentBudget + 500, currentSeries.length + 500));
    if (nextBudget <= currentBudget) {
      historyExhaustedKeysRef.current.add(requestKey);
      return;
    }

    const historyRequest = getActionByTickerRef.current({ ticker: symbol, marketTicker: market })
      .then(async (action) => {
        const instrumentId = typeof action.instrument === "string" ? action.instrument.trim() : "";
        if (!instrumentId) throw new Error(`Action ${symbol} on ${market} has no instrument identifier.`);
        const resolution = await loadTimeframeSeries(timeframe, async (apiSeconds) => {
          const sourceBudget = apiSeconds === 86400 && timeframe !== "1D"
            ? Math.min(10_000, Math.max(1_000, nextBudget * 10))
            : nextBudget;
          const entities = await getCoursHistoryRef.current(
            { instrument: instrumentId, timeframe: apiSeconds },
            sourceBudget,
          );
          return coursSeriesToChartData(entities);
        });
        const latestSeries = marketDataCacheRef.current[requestKey] ?? [];
        historyBudgetByKeyRef.current.set(requestKey, nextBudget);
        if (resolution.series.length <= latestSeries.length) {
          historyExhaustedKeysRef.current.add(requestKey);
          return;
        }
        dispatch(updateMarketData({
          market,
          symbol,
          data: resolution.series,
          timeframe,
          sourceKind: "equity",
        }));
        setDataSourceByKey((current) => (
          current[requestKey] === resolution.source ? current : { ...current, [requestKey]: resolution.source }
        ));
      })
      .catch((error: unknown) => {
        console.warn("[ComparisonManager] Unable to extend comparison history", { market, symbol, timeframe, error });
      })
      .finally(() => {
        historyFetches.current.delete(requestKey);
      });

    historyFetches.current.set(requestKey, historyRequest);
  }, [dispatch]);

  return { loadState, currencyByKey, seriesByKey, dataSourceByKey, requestMoreHistory } satisfies ComparisonManagerState;
};
// --- EOF ---
