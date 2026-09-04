const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const read = (path) => fs.readFileSync(path, "utf8");

const marketDataHook = read("components/technical-analysis/hooks/MarketData/useMarketData.ts");
const peerChart = read("components/technical-analysis/components/layout/FullPeerChart.tsx");
const grid = read("components/technical-analysis/components/layout/MultiChartLayoutGrid.tsx");
const reducer = read("components/technical-analysis/store/reducers/marketDataReducers.ts");
const repository = read("core/infra/repositories/cours.repository.impl.ts");

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

test("cours repository delegates duplicate suppression to the bounded shared transport cache", () => {
  assert.match(repository, /SharedRequestCache/);
  assert.match(repository, /coursRequestCache\.getOrCreate/);
  assert.match(repository, /maxSettledEntries: 256/);
  assert.match(repository, /COURS_HISTORY_PAGE_TTL_MS/);
});
