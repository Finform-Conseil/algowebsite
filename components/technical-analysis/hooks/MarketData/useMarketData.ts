import { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ChartDataPoint, generateInitialData as GENERATE_INITIAL_DATA } from "../../lib/Indicators/TechnicalIndicators";
import { selectUiState, selectChartConfig, setReplayActive, setReplayPaused, setModalOpen, updateMarketData, updateMarketSnapshot, selectMarketData, selectMarketSnapshots } from "../../store/technicalAnalysisSlice";
import { LiveSnapshot } from "../../config/TechnicalAnalysisTypes";
import { useGlobalNotification } from "@/components/design-system/layouts/HeaderHome/context/GlobalNotificationContext";

type DataMode = "mock" | "real";
type ErrorWithStatus = Error & { status?: number };

// --- CSV PARSER HELPER ---
const parseBRVMCSV = (csvText: string): ChartDataPoint[] => {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  // [TENOR 2026] Delimiter Autodetect: BRVM data often uses ';' in French locales.
  const firstLine = lines[0];
  const delimiter = firstLine.includes(';') ? ';' : ',';

  const headers = firstLine.split(delimiter).map(h => h.trim().toLowerCase());
  const dateIdx = headers.findIndex(h => h.includes('date') || h.includes('time'));
  const openIdx = headers.findIndex(h => h.includes('open') || h.includes('ouv'));
  const highIdx = headers.findIndex(h => h.includes('high') || h.includes('haut'));
  const lowIdx = headers.findIndex(h => h.includes('low') || h.includes('bas'));
  const closeIdx = headers.findIndex(h => h.includes('close') || h.includes('clot') || h.includes('cours'));
  const volIdx = headers.findIndex(h => h.includes('volume') || h.includes('vol'));

  const data: ChartDataPoint[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delimiter);
    if (cols.length < 5) continue;

    const cleanNum = (val: string) => {
      if (!val) return 0;
      // [TENOR 2026] Handle French decimal comma AND potential thousands separators (quotes, spaces)
      const sanitized = val.replace(/['"\s]/g, '').replace(',', '.');
      return parseFloat(sanitized) || 0;
    };

    data.push({
      time: dateIdx !== -1 && cols[dateIdx] ? cols[dateIdx].trim() : new Date().toISOString(),
      open: cleanNum(cols[openIdx]),
      high: cleanNum(cols[highIdx]),
      low: cleanNum(cols[lowIdx]),
      close: cleanNum(cols[closeIdx]),
      volume: volIdx !== -1 ? Math.round(cleanNum(cols[volIdx])) : 0,
    });
  }

  // Filter out any invalid points (NaN or zero prices that would break axis scaling)
  const filtered = data.filter(d => d.open > 0 && d.close > 0);

  return filtered.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
};

const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(field);
      field = '';
    } else {
      field += ch;
    }
  }
  result.push(field);
  return result;
};

const parseIndicatorCSV = (csvText: string): Partial<LiveSnapshot> | null => {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return null;

  const headers = lines[0].split(',').map(h => h.trim());
  const values = parseCSVLine(lines[1]);

  const getVal = (key: string) => {
    const idx = headers.findIndex(h => h.toLowerCase() === key.toLowerCase());
    return idx !== -1 ? (values[idx] || "").trim() : "";
  };

  const cleanNum = (val: string, currentPrice?: number) => {
    const cleaned = val.replace(/['"\s]/g, '').replace(',', '.');
    let num = parseFloat(cleaned) || 0;
    if (currentPrice && currentPrice > 0 && num > currentPrice * 10) {
      num /= 100;
    }
    return num;
  };

  const price = cleanNum(getVal("Cours_Actuel"));
  const prevClose = cleanNum(getVal("Cloture_Veille"), price);
  const volume = cleanNum(getVal("Volume_Titres") || getVal("Volume"));
  let variationStr = getVal("Variation_Cours") || getVal("Variation (%)");

  const isZeroVar = !variationStr || variationStr === "0,00" || variationStr === "0,00%" || variationStr === "0.00%";
  if (isZeroVar && price > 0 && prevClose > 0 && Math.abs(price - prevClose) > 0.01) {
    const calcVar = ((price - prevClose) / prevClose) * 100;
    variationStr = `${calcVar >= 0 ? '+' : ''}${calcVar.toFixed(2)}%`;
  }

  return {
    price: price,
    variation: variationStr,
    prevClose: prevClose,
    open: cleanNum(getVal("Ouverture"), price),
    high: cleanNum(getVal("Plus_Haut"), price),
    low: cleanNum(getVal("Plus_Bas"), price),
    volume: volume,
    lastUpdate: new Date().toISOString()
  };
};

export const useMarketData = (mode: DataMode = "mock", forcedSymbol?: string) => {
  const dispatch = useDispatch();
  const uiState = useSelector(selectUiState);
  const chartConfig = useSelector(selectChartConfig);
  const liveDataCache = useSelector(selectMarketData);
  const liveSnapshotsCache = useSelector(selectMarketSnapshots);
  const { addNotification } = useGlobalNotification();

  const symbol = forcedSymbol || chartConfig.symbol || "BOAB";

  // --- STATE ---
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [showReplayFullText, setShowReplayFullText] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // --- STABLE REFS ---
  const replayOriginalData = useRef<ChartDataPoint[]>([]);
  const replayIndex = useRef(0);
  const replayTimer = useRef<NodeJS.Timeout | null>(null);
  const collapseTimer = useRef<NodeJS.Timeout | null>(null);
  const pollingTimer = useRef<NodeJS.Timeout | null>(null);
  const addNotificationRef = useRef(addNotification);
  const dispatchRef = useRef(dispatch);
  const symbolRef = useRef(symbol);
  const chartDataRef = useRef(chartData);
  const mockSeedCache = useRef<Record<string, ChartDataPoint[]>>({});

  // [TENOR 2026 SRE] Concurrency & Throttling Guards
  const currentFetchIdRef = useRef(0);
  const lastDispatchedSnapshotStrRef = useRef<string>("");

  // [TENOR 2026 SRE] Component Lifecycle Guard
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    addNotificationRef.current = addNotification;
  }, [addNotification]);

  useEffect(() => {
    chartDataRef.current = chartData;
  }, [chartData]);

  useEffect(() => {
    dispatchRef.current = dispatch;
  }, [dispatch]);

  useEffect(() => {
    symbolRef.current = symbol;
  }, [symbol]);

  const applyWindowFirstData = useCallback((ticker: string, fullData: ChartDataPoint[]) => {
    // ECharts handles 10k+ candles natively via dataZoom.
    setChartData(fullData);
  }, []);

  const patienceTimer = useRef<NodeJS.Timeout | null>(null);
  const retryCount = useRef(0);

  const fetchRealDataRef = useRef(async (ticker: string, isInitialLoad = false) => {
    symbolRef.current = ticker;
    
    // [TENOR 2026 SRE] Strict Race Condition Guard (Fetch ID)
    currentFetchIdRef.current += 1;
    const thisFetchId = currentFetchIdRef.current;

    if (isInitialLoad) {
      setIsLoading(true);
      retryCount.current = 0;
      if (patienceTimer.current) clearTimeout(patienceTimer.current);
      patienceTimer.current = setTimeout(() => {
        patienceTimer.current = null;
      }, 60000);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
      const upperTicker = ticker.toUpperCase();
      const dailyUrl = `/api/proxy/9/Fredysessie/brvm-data-public/main/data/${upperTicker}/${upperTicker}.daily.csv`;
      const githubIndicatorUrl = `/api/proxy/9/Fredysessie/brvm-data-public/main/data/${upperTicker}/${upperTicker}.indicator.csv`;
      const liveScraperUrl = `/api/market-data/brvm-live?ticker=${upperTicker}`;
      const capScraperUrl = `/api/market-data/brvm-live-capitalisation?ticker=${upperTicker}`;

      const dailyRes = await fetch(dailyUrl, { cache: "no-store", signal: controller.signal });
      if (timeoutId) clearTimeout(timeoutId);

      // [TENOR 2026 SRE] Strict Race Condition Guard
      if (!isMounted.current || currentFetchIdRef.current !== thisFetchId) return;

      if (!dailyRes.ok) {
        const error: ErrorWithStatus = new Error(`HTTP ${dailyRes.status} for daily data`);
        error.status = dailyRes.status;
        throw error;
      }

      const parsedDaily = parseBRVMCSV(await dailyRes.text());

      // [TENOR 2026 SRE] Strict Race Condition Guard
      if (!isMounted.current || currentFetchIdRef.current !== thisFetchId) return;

      if (parsedDaily.length > 0) {
        applyWindowFirstData(upperTicker, parsedDaily);
        // [TENOR 2026 SRE] Only dispatch to Redux on initial load to cache the heavy historical data.
        // Prevents GC Stuttering and CPU choke on every 5s tick.
        if (isInitialLoad) {
          dispatchRef.current(updateMarketData({ symbol: upperTicker, data: parsedDaily }));
        }
      }

      setIsLoading(false);
      if (patienceTimer.current) {
        clearTimeout(patienceTimer.current);
        patienceTimer.current = null;
      }

      if (parsedDaily.length > 1) {
        const last = parsedDaily[parsedDaily.length - 1];
        const prev = parsedDaily[parsedDaily.length - 2];
        const diff = last.close - prev.close;
        const pct = prev.close !== 0 ? (diff / prev.close) * 100 : 0;

        // [TENOR 2026 SRE] Redux Dispatch Throttling
        const snapSig = `${last.close}_${0}_${pct.toFixed(2)}`;
        if (lastDispatchedSnapshotStrRef.current !== snapSig) {
          dispatchRef.current(updateMarketSnapshot({
            symbol: upperTicker,
            snapshot: {
              symbol: upperTicker,
              price: last.close,
              variation: `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`,
              prevClose: prev.close,
              open: last.open,
              high: last.high,
              low: last.low,
              lastUpdate: new Date().toISOString()
            }
          }));
          lastDispatchedSnapshotStrRef.current = snapSig;
        }
      }

      const bgController = new AbortController();
      const bgTimeout = setTimeout(() => bgController.abort(), 90000);

      (async () => {
        try {
          const [liveRes, capRes] = await Promise.all([
            fetch(liveScraperUrl, { cache: "no-store", signal: bgController.signal }).catch(() => null),
            fetch(capScraperUrl, { cache: "no-store", signal: bgController.signal }).catch(() => null),
          ]);
          clearTimeout(bgTimeout);

          // [TENOR 2026 SRE] Strict Race Condition Guard
          if (!isMounted.current || currentFetchIdRef.current !== thisFetchId) return;

          let liveSnapshot: LiveSnapshot | null = null;

          if (liveRes && liveRes.ok) {
            const liveData = await liveRes.json();
            if (liveData && !liveData.error) {
              const fallbackPrice = parsedDaily.length > 0 ? parsedDaily[parsedDaily.length - 1].close : 0;
              liveSnapshot = {
                symbol: upperTicker,
                price: (liveData.price > 0) ? liveData.price : fallbackPrice,
                variation: liveData.variation || "0.00%",
                prevClose: liveData.prevClose || 0,
                open: liveData.open || 0,
                high: liveData.high || 0,
                low: liveData.low || 0,
                volume: liveData.volume || 0,
                lastUpdate: new Date().toISOString()
              };

              if (liveData.price === 0 && liveSnapshot.price > 0 && liveSnapshot.prevClose > 0) {
                const calcVar = ((liveSnapshot.price - liveSnapshot.prevClose) / liveSnapshot.prevClose) * 100;
                liveSnapshot.variation = `${calcVar >= 0 ? '+' : ''}${calcVar.toFixed(2)}%`;
              }
            }
          }

          if (capRes && capRes.ok) {
            const capData = await capRes.json();
            if (capData && !capData.error && liveSnapshot) {
              liveSnapshot.marketCap = capData.globalMarketCap;
              liveSnapshot.sharesCount = capData.sharesCount;
            }
          }

          if (!liveSnapshot) {
            const indicatorRes = await fetch(githubIndicatorUrl, { cache: "no-store" }).catch(() => null);
            if (indicatorRes && indicatorRes.ok) {
              const snapshotData = parseIndicatorCSV(await indicatorRes.text());
              if (snapshotData) {
                liveSnapshot = {
                  symbol: upperTicker,
                  price: snapshotData.price || 0,
                  variation: snapshotData.variation || "0.00%",
                  prevClose: snapshotData.prevClose || 0,
                  open: snapshotData.open || 0,
                  high: snapshotData.high || 0,
                  low: snapshotData.low || 0,
                  volume: snapshotData.volume || 0,
                  lastUpdate: new Date().toISOString()
                };
              }
            }
          }

          if (liveSnapshot) {
            // [TENOR 2026 SRE] Redux Dispatch Throttling
            const snapSig = `${liveSnapshot.price}_${liveSnapshot.volume}_${liveSnapshot.variation}`;
            if (lastDispatchedSnapshotStrRef.current !== snapSig) {
              dispatchRef.current(updateMarketSnapshot({ symbol: upperTicker, snapshot: liveSnapshot }));
              lastDispatchedSnapshotStrRef.current = snapSig;
            }
          }

        } catch (bgErr) {
          clearTimeout(bgTimeout);
          console.warn(`[MarketData] Phase 2 background enrichment failed for ${upperTicker}:`, bgErr);
        }
      })();

    } catch (error: unknown) {
      if (timeoutId) clearTimeout(timeoutId);
      const err = error as ErrorWithStatus;
      const isAbort = err.name === "AbortError";
      const status = err.status;
      const is404 = status === 404;

      if (patienceTimer.current && !is404) {
        retryCount.current++;
        if (retryCount.current < 3) {
          setTimeout(() => {
            if (isMounted.current && currentFetchIdRef.current === thisFetchId) {
              fetchRealDataRef.current(ticker, false);
            }
          }, 2000);
          return;
        }
      }

      if (chartDataRef.current.length === 0 && isMounted.current && currentFetchIdRef.current === thisFetchId) {
        addNotificationRef.current({
          title: isAbort ? "Délai de Connexion Dépassé" : "Échec du Flux BRVM",
          message: isAbort ? "Impossible de joindre la source actuellement. Vérifiez votre connexion." : `Difficulté passagère sur ${ticker}. Algoway réessaiera bientôt.`,
          type: "warning",
          iconType: "faWifi",
        });
      }
      if (isMounted.current && currentFetchIdRef.current === thisFetchId) {
        setIsLoading(false);
      }
    }
  });

  useEffect(() => {
    if (uiState.replay.isActive) return;

    if (pollingTimer.current) {
      clearInterval(pollingTimer.current);
      pollingTimer.current = null;
    }

    symbolRef.current = symbol;

    if (mode === "real") {
      const cachedLive = liveDataCache[symbol];
      if (cachedLive && cachedLive.length > 0) {
        applyWindowFirstData(symbol, cachedLive);
        setIsLoading(false);
        fetchRealDataRef.current(symbol, false);
      } else {
        setChartData([]);
        fetchRealDataRef.current(symbol, true);
      }

      const POLLING_INTERVAL = 5 * 60 * 1000;
      const lastFetch = localStorage.getItem(`brvm_last_fetch_${symbol}`);
      const now = Date.now();
      let initialDelay = POLLING_INTERVAL;

      if (lastFetch) {
        const elapsed = now - parseInt(lastFetch, 10);
        if (elapsed < POLLING_INTERVAL) {
          initialDelay = POLLING_INTERVAL - elapsed;
        } else {
          initialDelay = 0;
        }
      }

      const startRegularPolling = () => {
        const interval = setInterval(() => {
          // [TENOR 2026 SRE] FinOps: Do not poll if the tab is hidden
          if (document.hidden) return;
          fetchRealDataRef.current(symbolRef.current, false);
        }, POLLING_INTERVAL);
        pollingTimer.current = interval;
      };

      pollingTimer.current = setTimeout(() => {
        if (!isMounted.current) return;
        fetchRealDataRef.current(symbolRef.current, false);
        startRegularPolling();
      }, initialDelay);

    } else {
      setIsLoading(false);
      const existingSeed = mockSeedCache.current[symbol];
      const initialData = (existingSeed && existingSeed.length > 0) ? existingSeed : GENERATE_INITIAL_DATA(200);
      
      if (!existingSeed || existingSeed.length === 0) {
        mockSeedCache.current[symbol] = initialData;
      }
      setChartData(initialData);

      pollingTimer.current = setInterval(() => {
        if (document.hidden) return;
        setChartData((prevData) => {
          if (prevData.length === 0) return GENERATE_INITIAL_DATA(200);
          const lastCandle = prevData[prevData.length - 1];
          const lastTime = new Date(lastCandle.time).getTime();
          const isNewCandle = Math.random() > 0.8;
          let newData: ChartDataPoint[];

          if (isNewCandle) {
            const open = lastCandle.close;
            const close = open + (Math.random() - 0.5) * 0.2;
            const high = Math.max(open, close) + Math.random() * 0.05;
            const low = Math.min(open, close) - Math.random() * 0.05;
            newData = [...prevData, {
              time: new Date(lastTime + 60 * 60 * 1000).toISOString(),
              open: parseFloat(open.toFixed(2)),
              high: parseFloat(high.toFixed(2)),
              low: parseFloat(low.toFixed(2)),
              close: parseFloat(close.toFixed(2)),
              volume: Math.floor(Math.random() * 5000),
            }];
          } else {
            const close = lastCandle.close + (Math.random() - 0.5) * 0.1;
            newData = [...prevData.slice(0, -1), {
              ...lastCandle,
              close: parseFloat(close.toFixed(2)),
              high: parseFloat(Math.max(lastCandle.high, close).toFixed(2)),
              low: parseFloat(Math.min(lastCandle.low, close).toFixed(2)),
              volume: lastCandle.volume + Math.floor(Math.random() * 100),
            }];
          }
          const result = newData.length > 10000 ? newData.slice(-10000) : newData;
          mockSeedCache.current[symbolRef.current] = result;
          return result;
        });
      }, 1000);
    }

    return () => {
      if (pollingTimer.current) {
        clearInterval(pollingTimer.current);
        pollingTimer.current = null;
      }
    };
  }, [mode, symbol, applyWindowFirstData, uiState.replay.isActive, liveDataCache]);

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
      setChartData(prev => {
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
  const currentVolume = (mode === "real" && liveSnapshotsCache[symbol]?.volume) ? liveSnapshotsCache[symbol].volume : (lastCandle ? lastCandle.volume : 0);
  const avgVolume = (() => {
    if (chartData.length === 0) return 0;
    const last30 = chartData.slice(-30);
    const sum = last30.reduce((acc, curr) => acc + (curr.volume || 0), 0);
    return sum / last30.length;
  })();

  return {
    chartData,
    setChartData,
    isLoading,
    startReplay,
    stopReplay,
    showReplayFullText,
    setShowReplayFullText,
    liveSnapshot: mode === "real" ? (liveSnapshotsCache[symbol] || null) : null,
    currentVolume,
    avgVolume
  };
};
// --- EOF ---
