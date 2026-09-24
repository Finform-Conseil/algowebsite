const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../../../..");
const source = fs.readFileSync(path.join(root, "components/technical-analysis/hooks/MarketData/useMarketData.ts"), "utf8");

test("dense market monitor bounds comparison concurrency", () => {
  assert.match(source, /const COMPARISON_MAX_CONCURRENT_REQUESTS = 4;/);
  assert.match(source, /createAsyncRequestScheduler\(COMPARISON_MAX_CONCURRENT_REQUESTS\)/);
  assert.match(source, /comparisonFetchScheduler\(\(\) => withComparisonRetry/);
});

test("dense 4x4 first paint fetches only one equity page per symbol", () => {
  assert.match(source, /const DENSE_LAYOUT_INITIAL_EQUITY_POINTS = 100;/);
  assert.match(source, /isDenseComparisonSet && normalizedTimeframe === "1D"/);
  assert.match(source, /\? DENSE_LAYOUT_INITIAL_EQUITY_POINTS/);
});

test("dense requests get retry and a timeout above transport budgets", () => {
  assert.match(source, /const DENSE_LAYOUT_COMPARISON_REQUEST_TIMEOUT_MS = 40_000;/);
  assert.match(source, /const COMPARISON_MAX_ATTEMPTS = 2;/);
  assert.match(source, /isRetryableComparisonError/);
  assert.match(source, /withRequestTimeout\(task\(\), .*timeoutMs\)/);
});

test("a background refresh failure never destroys usable cached candles", () => {
  assert.match(source, /if \(hasUsableSeries \|\| \(marketDataCacheRef\.current\[requestKey\]\?\.length \?\? 0\) > 0\)/);
  assert.match(source, /Background refresh unavailable; keeping cached market data/);
  assert.match(source, /setRequestStatus\(requestKey, "loaded"\)/);
});

test("persisted comparison candles hydrate before terminal failure", () => {
  assert.match(source, /readPersistedMarketData\(market, persistenceTicker\)/);
  assert.match(source, /hasUsableSeries = true/);
  assert.match(source, /setRequestStatus\(requestKey, "loaded"\)/);
});
