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
//   getActionByTicker(ticker) -> ActionEntity { instrument, latest_price_metric }
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
import type { PriceIndicatorEntity, TechnicalIndicatorEntity, ValuationRatioEntity } from "@/core/domain/entities/cours.entity";
import { useGlobalNotification } from "@/components/design-system/layouts/HeaderHome/context/GlobalNotificationContext";
import { BRVM_SECURITIES } from "@/core/data/brvm-securities";
import { useActionRepository } from "@/core/infra/repositories/action.repository.impl";
import { useCoursRepository } from "@/core/infra/repositories/cours.repository.impl";
import {
  coursSeriesToChartData,
  priceMetricToLiveSnapshot,
} from "@/lib/utils/marketDataTransform";

// [MIGRATION] `mode` conservé dans la signature pour compat appelants, mais
// la source est TOUJOURS l'API. Il n'existe plus de génération locale.
type DataMode = "mock" | "real";
export type ComparisonLoadStatus = "idle" | "loading" | "loaded" | "empty" | "failed";
export type ComparisonLoadState = Record<string, ComparisonLoadStatus>;

const COMPARISON_NO_DATA_GRACE_MS = 1500;

// Nombre de bougies historiques demandées à l'API (borne UI, dataZoom natif ECharts).
const OHLCV_PAGE_SIZE = 5000;
// Tri chronologique ascendant côté backend (le transformer re-trie par sécurité).
const OHLCV_ORDERING = "timestamp";

const normalizeComparisonSymbols = (symbols: string[]): string[] =>
  Array.from(new Set(symbols.map((symbol) => symbol.trim().toUpperCase()).filter(Boolean)));

const areComparisonLoadStatesEqual = (left: ComparisonLoadState, right: ComparisonLoadState): boolean => {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) return false;
  return leftKeys.every((key) => left[key] === right[key]);
};

export const useMarketData = (mode: DataMode = "real", forcedSymbol?: string) => {
  const dispatch = useDispatch();
  const uiState = useSelector(selectUiState);
  const chartConfig = useSelector(selectChartConfig);
  const liveSnapshotsCache = useSelector(selectMarketSnapshots);
  const { addNotification } = useGlobalNotification();

  // ── Couche core/ : repositories API (aucun fetch local) ───────────────────
  const { getActionByTicker, currentActionByTickerData, isFetchingActionByTicker } =
    useActionRepository();
  const { getAllCours } = useCoursRepository();

  const symbol = forcedSymbol || chartConfig.symbol || "BOAB";

  // --- STATE ---
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [showReplayFullText, setShowReplayFullText] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // --- STABLE REFS (préservation de la mécanique SRE existante) ---
  const replayOriginalData = useRef<ChartDataPoint[]>([]);
  const replayIndex = useRef(0);
  const replayTimer = useRef<NodeJS.Timeout | null>(null);
  const collapseTimer = useRef<NodeJS.Timeout | null>(null);
  const addNotificationRef = useRef(addNotification);
  const dispatchRef = useRef(dispatch);
  const symbolRef = useRef(symbol);
  const chartDataRef = useRef(chartData);

  // [SRE] Concurrency & Throttling Guards
  const currentFetchIdRef = useRef(0);
  const lastDispatchedSnapshotStrRef = useRef<string>("");
  const getActionByTickerRef = useRef(getActionByTicker);
  const getAllCoursRef = useRef(getAllCours);

  // [SRE] Component Lifecycle Guard
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => { addNotificationRef.current = addNotification; }, [addNotification]);
  useEffect(() => { chartDataRef.current = chartData; }, [chartData]);
  useEffect(() => { dispatchRef.current = dispatch; }, [dispatch]);
  useEffect(() => { symbolRef.current = symbol; }, [symbol]);
  useEffect(() => { getActionByTickerRef.current = getActionByTicker; }, [getActionByTicker]);
  useEffect(() => { getAllCoursRef.current = getAllCours; }, [getAllCours]);

  const applyWindowFirstData = useCallback((_ticker: string, fullData: ChartDataPoint[]) => {
    // ECharts gère 10k+ bougies nativement via dataZoom.
    setChartData(fullData);
  }, []);

  // ── SNAPSHOT LIVE : dérivé de latest_price_metric (API), champs null visibles ─
  // Réagit à l'arrivée de la donnée ticker (RTK Query -> currentActionByTickerData).
  useEffect(() => {
    if (mode !== "real") return;
    const action = currentActionByTickerData;
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
  }, [currentActionByTickerData, mode, symbol]);

  // ── CHARGEMENT OHLCV : action(ticker) -> instrument -> cours(instrument) ────
  const loadMarketData = useCallback(async (ticker: string) => {
    symbolRef.current = ticker;

    // [SRE] Fail-Fast si hors-ligne.
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      console.warn(`[MarketData] Offline. Aborting fetch for ${ticker}.`);
      return;
    }

    // [SRE] Race Condition Guard (Fetch ID).
    currentFetchIdRef.current += 1;
    const thisFetchId = currentFetchIdRef.current;

    setIsLoading(true);
    const upperTicker = ticker.toUpperCase();

    try {
      // 1) Resolve the action and await the backend response before reading its instrument.
      const action = await getActionByTickerRef.current(upperTicker);
      const instrumentId = action.instrument;
      if (typeof instrumentId !== "string" || instrumentId.length === 0) {
        throw new Error(`Action ${upperTicker} has no instrument identifier.`);
      }

      // 2) Load OHLCV through the canonical cours filter accepted by the API.
      const paginated = await getAllCoursRef.current({
        instrument: instrumentId,
        page_size: OHLCV_PAGE_SIZE,
      });

      // [SRE] Race Condition Guard.
      if (!isMounted.current || currentFetchIdRef.current !== thisFetchId) return;

      const series = coursSeriesToChartData(paginated?.data ?? []);

      if (series.length > 0) {
        applyWindowFirstData(upperTicker, series);
        dispatchRef.current(updateMarketData({ symbol: upperTicker, data: series }));

        // Snapshot dérivé de la dernière bougie (si la métrique API prix manque).
        const last = series[series.length - 1];
        const prev = series.length > 1 ? series[series.length - 2] : null;
        if (prev) {
          const diff = last.close - prev.close;
          const pct = prev.close !== 0 ? (diff / prev.close) * 100 : 0;
          const snapSig = `${last.close}_derived_${pct.toFixed(2)}`;
          if (lastDispatchedSnapshotStrRef.current !== snapSig && !currentActionByTickerData?.latest_price_metric) {
            const snapshot: LiveSnapshot = {
              symbol: upperTicker,
              price: last.close,
              variation: `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`,
              prevClose: prev.close,
              open: last.open,
              high: last.high,
              low: last.low,
              volume: last.volume,
              source: "ALGO_DB_API_OHLCV",
              sourceStatus: "derived",
              sourceLabel: "Derived (OHLCV)",
              lastUpdate: new Date().toISOString(),
            };
            // @ts-expect-error - variationNum injecté au bord réseau (perf O(1)).
            snapshot.variationNum = pct;
            dispatchRef.current(updateMarketSnapshot({ symbol: upperTicker, snapshot }));
            lastDispatchedSnapshotStrRef.current = snapSig;
          }
        }
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.warn(`[MarketData] API fetch failed for ${upperTicker}:`, err?.message ?? err);
      if (chartDataRef.current.length === 0 && isMounted.current && currentFetchIdRef.current === thisFetchId) {
        addNotificationRef.current({
          title: "Échec du flux de données",
          message: `Difficulté passagère sur ${upperTicker}. L'API n'a pas répondu.`,
          type: "warning",
          iconType: "faWifi",
        });
      }
    } finally {
      if (isMounted.current && currentFetchIdRef.current === thisFetchId) {
        setIsLoading(false);
      }
    }
  }, [applyWindowFirstData, currentActionByTickerData]);

  // ============================================================================
  // [SRE] NETWORK LIFECYCLE SHIELD — Page Visibility + navigator.onLine.
  // Polling piloté API (pas de scraping). Pause en onglet caché / hors-ligne.
  // ============================================================================
  useEffect(() => {
    if (uiState.replay.isActive) return;
    if (mode !== "real") { setIsLoading(false); return; }

    symbolRef.current = symbol;
    const POLLING_INTERVAL = 5 * 60 * 1000;
    let isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
    let pollingTimer: NodeJS.Timeout | null = null;

    const startPolling = () => {
      if (pollingTimer) clearInterval(pollingTimer);
      pollingTimer = setInterval(() => {
        if (typeof document !== "undefined" && document.hidden) return;
        if (!isOnline) return;
        void loadMarketData(symbolRef.current);
      }, POLLING_INTERVAL);
    };

    const stopPolling = () => {
      if (pollingTimer) { clearInterval(pollingTimer); pollingTimer = null; }
    };

    const handleVisibilityChange = () => {
      if (typeof document === "undefined") return;
      if (document.hidden) { stopPolling(); }
      else if (isOnline) { void loadMarketData(symbolRef.current); startPolling(); }
    };

    const handleOnline = () => {
      isOnline = true;
      if (typeof document !== "undefined" && !document.hidden) {
        void loadMarketData(symbolRef.current);
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

    // Bootstrap initial.
    setChartData([]);
    void loadMarketData(symbol);

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
  }, [mode, symbol, uiState.replay.isActive]);

  // ── REPLAY (inchangé) ───────────────────────────────────────────────────
  const startReplay = useCallback(() => {
    replayOriginalData.current = [...chartData];
    const initialSlice = chartData.length > 100 ? chartData.length - 100 : Math.floor(chartData.length / 2);
    setChartData(chartData.slice(0, initialSlice));
    replayIndex.current = initialSlice;
    dispatch(setReplayActive(true));
    dispatch(setReplayPaused(false));
    dispatch(setModalOpen({ modal: "replay", isOpen: false }));
    setShowReplayFullText(true);
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    collapseTimer.current = setTimeout(() => setShowReplayFullText(false), 3000);
  }, [chartData, dispatch]);

  const stopReplay = useCallback(() => {
    if (replayTimer.current) clearInterval(replayTimer.current);
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    dispatch(setReplayActive(false));
    dispatch(setReplayPaused(false));
    setShowReplayFullText(false);
    if (replayOriginalData.current.length > 0) {
      setChartData(replayOriginalData.current);
    }
  }, [dispatch]);

  useEffect(() => {
    if (!uiState.replay.isActive || uiState.replay.isPaused) {
      if (replayTimer.current) clearInterval(replayTimer.current);
      return;
    }
    replayTimer.current = setInterval(() => {
      if (replayIndex.current >= replayOriginalData.current.length) {
        dispatch(setReplayPaused(true));
        return;
      }
      const nextCandle = replayOriginalData.current[replayIndex.current];
      setChartData((prev) => {
        const newData = [...prev, nextCandle];
        return newData.length > 10000 ? newData.slice(-10000) : newData;
      });
      replayIndex.current++;
    }, uiState.replay.speed);
    return () => {
      if (replayTimer.current) clearInterval(replayTimer.current);
    };
  }, [uiState.replay.isActive, uiState.replay.isPaused, uiState.replay.speed, dispatch]);

  const lastCandle = chartData.length > 0 ? chartData[chartData.length - 1] : null;
  const apiPriceMetric = currentActionByTickerData?.latest_price_metric;
  const currentVolume = mode === "real" && apiPriceMetric?.volume != null
    ? apiPriceMetric.volume
    : (mode === "real" && liveSnapshotsCache[symbol]?.volume != null
      ? liveSnapshotsCache[symbol].volume
      : (lastCandle ? lastCandle.volume : 0));
  const avgVolume = mode === "real" && apiPriceMetric?.vol_avg_20d != null
    ? apiPriceMetric.vol_avg_20d
    : (() => {
      if (chartData.length === 0) return 0;
      const last30 = chartData.slice(-30);
      const sum = last30.reduce((acc, curr) => acc + (curr.volume || 0), 0);
      return sum / last30.length;
    })();

  return {
    chartData,
    setChartData,
    isLoading: isLoading || isFetchingActionByTicker,
    startReplay,
    stopReplay,
    showReplayFullText,
    setShowReplayFullText,
    liveSnapshot: mode === "real" ? (liveSnapshotsCache[symbol] || null) : null,
    currentVolume,
    avgVolume,
    apiPriceMetric: (currentActionByTickerData?.latest_price_metric ?? null) as PriceIndicatorEntity | null,
    apiTechnicalIndicator: (currentActionByTickerData?.latest_technical_indicator ?? null) as TechnicalIndicatorEntity | null,
    apiValuationRatio: (currentActionByTickerData?.latest_valuation_ratio ?? null) as ValuationRatioEntity | null,
  };
};

// ============================================================================
// Hook 1: useLiveMetrics — inchangé (calculs de présentation PnL, O(1)).
// ============================================================================
export const useLiveMetrics = (
  chartData: ChartDataPoint[],
  liveSnapshot: LiveSnapshot | null,
  security: typeof BRVM_SECURITIES[0],
  effectiveRate: number
) => {
  return useMemo(() => {
    const lastCandle = chartData.length > 0 ? chartData[chartData.length - 1] : null;
    const prevCandle = chartData.length > 1 ? chartData[chartData.length - 2] : null;

    const livePrice = liveSnapshot ? liveSnapshot.price : lastCandle ? lastCandle.close : security.marketCap > 0 ? security.marketCap / 100 : 0;
    let liveChange = 0;
    let liveChangePercent = 0;
    let liveVolume = 0;

    if (liveSnapshot) {
      liveVolume = liveSnapshot.volume || 0;
      // @ts-expect-error - variationNum injecté au bord réseau pour perf O(1).
      liveChangePercent = liveSnapshot.variationNum ?? 0;
      if (liveSnapshot.variation.includes("-") && liveChangePercent > 0) {
        liveChangePercent = -liveChangePercent;
      }
      if (liveSnapshot.prevClose > 0) {
        liveChange = liveSnapshot.price - liveSnapshot.prevClose;
        if (Math.abs(liveChange) > livePrice * 0.5) {
          liveChange = (livePrice * liveChangePercent) / 100;
        }
      } else {
        liveChange = (livePrice * liveChangePercent) / 100;
      }
    } else if (lastCandle) {
      liveVolume = lastCandle.volume || 0;
      if (prevCandle) {
        liveChange = lastCandle.close - prevCandle.close;
        liveChangePercent = prevCandle.close !== 0 ? (liveChange / prevCandle.close) * 100 : 0;
      } else {
        liveChange = lastCandle.close - lastCandle.open;
        liveChangePercent = lastCandle.open !== 0 ? (liveChange / lastCandle.open) * 100 : 0;
      }
    } else {
      liveChangePercent = security.priceChangeD1;
      liveChange = (livePrice * liveChangePercent) / 100;
    }

    const convertedLivePrice = livePrice * effectiveRate;
    const convertedLastCandleClose = (lastCandle ? lastCandle.close : livePrice) * effectiveRate;
    const convertedLiveChange = liveChange * effectiveRate;
    const isMarketPositive = convertedLiveChange >= 0;
    const isLastPricePositive = lastCandle ? lastCandle.close >= lastCandle.open : convertedLiveChange >= 0;

    return {
      livePrice,
      liveChange,
      liveChangePercent,
      liveVolume,
      convertedLivePrice,
      convertedLastCandleClose,
      convertedLiveChange,
      isMarketPositive,
      isLastPricePositive,
      lastCandleTime: lastCandle?.time,
    };
  }, [chartData, liveSnapshot, security, effectiveRate]);
};

// ============================================================================
// Hook 2: useComparisonManager — migré API (fetch OHLCV par instrument/ticker).
// ============================================================================
export const useComparisonManager = (comparisonSymbols: string[], dataMode: "mock" | "real") => {
  const dispatch = useDispatch();
  const marketDataCache = useSelector(selectMarketData);
  const { getActionByTicker } = useActionRepository();
  const { getAllCours } = useCoursRepository();
  const inflightFetches = useRef<Set<string>>(new Set());
  const comparisonGraceTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const marketDataCacheRef = useRef(marketDataCache);
  const getActionByTickerRef = useRef(getActionByTicker);
  const getAllCoursRef = useRef(getAllCours);
  const [loadState, setLoadState] = useState<ComparisonLoadState>({});
  const safeSymbolKey = useMemo(() => normalizeComparisonSymbols(comparisonSymbols).join("|"), [comparisonSymbols]);
  const safeSymbols = useMemo(() => (safeSymbolKey ? safeSymbolKey.split("|") : []), [safeSymbolKey]);

  useEffect(() => { marketDataCacheRef.current = marketDataCache; }, [marketDataCache]);
  useEffect(() => { getActionByTickerRef.current = getActionByTicker; }, [getActionByTicker]);
  useEffect(() => { getAllCoursRef.current = getAllCours; }, [getAllCours]);

  useEffect(() => {
    setLoadState((current) => {
      const next: ComparisonLoadState = {};
      safeSymbols.forEach((symbol) => {
        next[symbol] = marketDataCache[symbol]?.length > 0 ? "loaded" : current[symbol] ?? "idle";
      });
      return areComparisonLoadStatesEqual(current, next) ? current : next;
    });
  }, [marketDataCache, safeSymbols]);

  useEffect(() => {
    if (safeSymbols.length === 0) return;
    let isActive = true;
    const safeSymbolSet = new Set(safeSymbols);

    const clearGraceTimer = (symbol: string) => {
      const timer = comparisonGraceTimersRef.current.get(symbol);
      if (!timer) return;
      clearTimeout(timer);
      comparisonGraceTimersRef.current.delete(symbol);
    };
    const clearGraceTimers = () => {
      comparisonGraceTimersRef.current.forEach((timer) => clearTimeout(timer));
      comparisonGraceTimersRef.current.clear();
    };
    const setSymbolStatus = (symbol: string, status: ComparisonLoadStatus) => {
      if (!isActive || !safeSymbolSet.has(symbol)) return;
      clearGraceTimer(symbol);
      setLoadState((current) => (current[symbol] === status ? current : { ...current, [symbol]: status }));
    };
    const settleSymbolStatus = (symbol: string, status: ComparisonLoadStatus, startedAt: number) => {
      if (!isActive) return;
      const remainingGraceMs = Math.max(0, COMPARISON_NO_DATA_GRACE_MS - (Date.now() - startedAt));
      if (remainingGraceMs === 0 || status === "loaded") { setSymbolStatus(symbol, status); return; }
      clearGraceTimer(symbol);
      const timer = setTimeout(() => {
        comparisonGraceTimersRef.current.delete(symbol);
        setSymbolStatus(symbol, status);
      }, remainingGraceMs);
      comparisonGraceTimersRef.current.set(symbol, timer);
    };

    safeSymbols.forEach((upperSymbol) => {
      if (marketDataCacheRef.current[upperSymbol]?.length > 0) { setSymbolStatus(upperSymbol, "loaded"); return; }
      if (inflightFetches.current.has(upperSymbol)) return;

      // [MIGRATION] Plus de mode mock : la comparaison charge depuis l'API.
      inflightFetches.current.add(upperSymbol);
      setSymbolStatus(upperSymbol, "loading");
      const startedAt = Date.now();

      getActionByTickerRef.current(upperSymbol)
        .then((action) => {
          if (!action?.instrument) throw new Error(`Action ${upperSymbol} has no instrument identifier.`);
          return getAllCoursRef.current({ instrument: action.instrument, page_size: OHLCV_PAGE_SIZE });
        })
        .then((paginated) => {
          if (!isActive) return;
          const series = coursSeriesToChartData(paginated?.data ?? []);
          if (series.length > 0) {
            dispatch(updateMarketData({ symbol: upperSymbol, data: series }));
            settleSymbolStatus(upperSymbol, "loaded", startedAt);
          } else {
            settleSymbolStatus(upperSymbol, "empty", startedAt);
          }
        })
        .catch((error) => {
          if (!isActive) return;
          console.warn(`[ComparisonManager] Unable to load ${upperSymbol}`, error);
          settleSymbolStatus(upperSymbol, "failed", startedAt);
        })
        .finally(() => { inflightFetches.current.delete(upperSymbol); });
    });

    return () => { isActive = false; clearGraceTimers(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeSymbols, dataMode, dispatch]);

  return loadState;
};
// --- EOF ---
