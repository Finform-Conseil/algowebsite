const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const read = (path) => fs.readFileSync(path, "utf8");

const marketDataHook = read("components/technical-analysis/hooks/MarketData/useMarketData.ts");
const peerChart = read("components/technical-analysis/components/layout/FullPeerChart.tsx");
const grid = read("components/technical-analysis/components/layout/MultiChartLayoutGrid.tsx");
const reducer = read("components/technical-analysis/store/reducers/marketDataReducers.ts");
const repository = read("core/infra/repositories/cours.repository.impl.ts");
const modalOrchestrator = read("components/technical-analysis/components/modals/orchestration/ModalOrchestrator.tsx");
const tickerSelectorContext = read("components/design-system/commons/TickerSelectorModal/context/TickerSelectorContext.tsx");
const marketDataPersistence = read("components/technical-analysis/hooks/MarketData/marketDataPersistence.ts");

test("all timeframe series are owned by the canonical Redux market-data cache", () => {
  assert.match(reducer, /createTimeframeMarketDataCacheKey/);
  assert.doesNotMatch(marketDataHook, /useState<ComparisonSeriesState>/);
  assert.match(marketDataHook, /dispatch\(updateMarketData\(\{[\s\S]*?timeframe: normalizedTimeframe,[\s\S]*?sourceKind,[\s\S]*?sourceId,/);
});

test("peer charts no longer truncate history to 500 candles", () => {
  assert.doesNotMatch(peerChart, /PEER_MAX_CANDLES/);
  assert.doesNotMatch(peerChart, /slice\(valid\.length - 500\)/);
});

test("multi-chart history boundary requests reach the market-data layer", () => {
  assert.match(peerChart, /onHistoryBoundaryRequest/);
  assert.match(peerChart, /useEChartsRenderer\(\{[\s\S]*?onHistoryBoundaryRequest,/);
  assert.match(grid, /onHistoryBoundaryRequest=\{\(direction\) => onHistoryBoundaryRequest\?\.\(cell, direction\)\}/);
  assert.match(marketDataHook, /requestMoreHistory: \(request: ComparisonMarketRequest/);
});

test("non-daily active charts extend history instead of declaring exhaustion after bootstrap", () => {
  assert.match(marketDataHook, /if \(timeframeRef\.current !== "1D"\)[\s\S]*?loadMarketData\(historyTicker, nextLimit, \{ silent: true \}\)/);
  assert.doesNotMatch(marketDataHook, /if \(requestedTimeframe !== "1D"\) \{\s*historyExhaustedRef\.current = true;\s*\}/);
});

test("daily history extension is single-page and single-flight per boundary crossing", () => {
  assert.match(marketDataHook, /const loadMarketDataPage = useCallback\(async \(ticker: string, page: number\)/);
  assert.match(marketDataHook, /getAllCoursRef\.current\(\{[\s\S]*?timeframe: requestedTimeframeSeconds,[\s\S]*?page,[\s\S]*?page_size: OHLCV_PAGE_SIZE/);
  assert.match(marketDataHook, /historyLoadInFlightRef\.current = true;[\s\S]*?loadMarketDataPage\(historyTicker, nextPage\)/);
  assert.doesNotMatch(marketDataHook, /loadMarketDataBatch/);
  assert.doesNotMatch(marketDataHook, /Promise\.all\(pagePromises\)/);
});

test("date-range bounds come from the complete API history rather than only the first 100 candles", () => {
  assert.match(marketDataHook, /publishAvailableHistoryBounds/);
  assert.match(marketDataHook, /page: totalPages,[\s\S]*?page_size: OHLCV_PAGE_SIZE/);
  assert.match(marketDataHook, /historyDateBounds/);
  assert.match(marketDataHook, /ensureHistoryThroughDate/);
  assert.match(marketDataHook, /getCoursHistory\([\s\S]*?10_000/);
});

test("date-range bounds fail closed when the selected security identity changes", () => {
  assert.match(marketDataHook, /historyDateBoundsScopeKey = `\$\{marketScope\}:\$\{symbol\}:\$\{normalizeTicker\(forcedIsin\)\}`/);
  assert.match(marketDataHook, /scopedHistoryDateBounds\?\.scopeKey === historyDateBoundsScopeKey[\s\S]*?scopedHistoryDateBounds\.bounds[\s\S]*?: null/);
  assert.match(marketDataHook, /setScopedHistoryDateBounds\(\{ scopeKey: boundsScopeKey, bounds: pageBounds \}\)/);
  assert.match(marketDataHook, /setScopedHistoryDateBounds\(null\)/);
});

test("symbol replacement never injects synthetic candles into the API date-range pipeline", () => {
  assert.match(modalOrchestrator, /const replaceChartSymbol = useCallback/);
  assert.doesNotMatch(modalOrchestrator, /generateInitialData/);
  assert.doesNotMatch(modalOrchestrator, /import\("\.\.\/\.\.\/\.\.\/lib\/Indicators\/TechnicalIndicators"\)/);
});

test("authoritative null bounds never fall back to stale chart data", () => {
  assert.match(modalOrchestrator, /dateRangeBounds === undefined[\s\S]*?\? loadedDateRangeBounds[\s\S]*?: dateRangeBounds/);
  assert.doesNotMatch(modalOrchestrator, /dateRangeBounds \?\? loadedDateRangeBounds/);
});

test("history lifecycle scope includes market ticker ISIN and timeframe", () => {
  assert.match(marketDataHook, /nextHistoryScopeKey = `\$\{marketScope\}:\$\{symbol\}:\$\{normalizeTicker\(forcedIsin\)\}:\$\{requestedTimeframe\}`/);
});

test("cold start exposes a primary ticker before IndexedDB hydration completes", () => {
  assert.match(
    tickerSelectorContext,
    /useState<string>\(\s*normalizedInitialTicker \?\? DEFAULT_PRIMARY_TICKER,?\s*\)/,
  );
  assert.match(tickerSelectorContext, /await readPersistedTickerSymbol\(\)/);
  assert.match(tickerSelectorContext, /setPreferredTicker\(savedTickerSymbol \?\? DEFAULT_PRIMARY_TICKER\)/);
});

test("market bootstrap acceptance is scoped to user intent instead of React generation", () => {
  assert.match(marketDataHook, /const requestScopeKey = `\$\{marketScope\}:\$\{normalizeTicker\(ticker\)\}:\$\{normalizeTicker\(forcedIsin\)\}:\$\{requestedTimeframe\}`/);
  assert.match(marketDataHook, /historyScopeKeyRef\.current === requestScopeKey/);
  assert.match(marketDataHook, /timeframeRef\.current === requestedTimeframe/);
  assert.doesNotMatch(marketDataHook, /currentFetchIdRef\.current !== thisFetchId/);
  assert.doesNotMatch(marketDataHook, /currentFetchIdRef\.current === thisFetchId/);
});

test("cold-start API begins before optional IndexedDB hydration and late cache cannot overwrite canonical data", () => {
  const apiStart = marketDataHook.indexOf("const apiBootstrapPromise = loadMarketData(symbol)");
  const persistedAwait = marketDataHook.indexOf("const persistedSeries = await readPersistedMarketData(marketScope, symbol)");
  assert.ok(apiStart >= 0, "cold-start API bootstrap must be started explicitly");
  assert.ok(persistedAwait > apiStart, "IndexedDB hydration must never serialize the authoritative API request");
  assert.match(marketDataHook, /if \(chartDataSymbolRef\.current === symbol && chartDataRef\.current\.length > 0\) return false;/);
});

test("IndexedDB latency failure opens a bounded cache circuit instead of causing a retry storm", () => {
  assert.match(marketDataPersistence, /STORAGE_FAILURE_COOLDOWN_MS = 30_000/);
  assert.match(marketDataPersistence, /isStorageTemporarilyUnavailable\(\)/);
  assert.match(marketDataPersistence, /tripStorageCircuit\(error\)/);
  assert.match(marketDataPersistence, /databaseConnection\?\.close\(\)/);
});

test("cours repository delegates duplicate suppression to the bounded shared transport cache", () => {
  assert.match(repository, /SharedRequestCache/);
  assert.match(repository, /coursRequestCache\.getOrCreate/);
  assert.match(repository, /maxSettledEntries: 256/);
  assert.match(repository, /COURS_HISTORY_PAGE_TTL_MS/);
});
