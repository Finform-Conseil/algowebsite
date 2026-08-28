/* eslint-env node */
require("../../store/__tests__/testTypeScriptLoader.cjs");

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  CHART_TIMEFRAMES,
  TIMEFRAME_DEFINITIONS,
  createTimeframeMarketDataCacheKey,
  getTimeframeSeconds,
  normalizeChartTimeframe,
  resolveTimeframeDataStrategy,
} = require("./timeframeCatalog.ts");

test("timeframe catalog matches the API contract exactly", () => {
  assert.deepEqual(CHART_TIMEFRAMES, ["1m", "5m", "15m", "30m", "1H", "4H", "1D", "1W", "1M"]);
  assert.deepEqual(
    CHART_TIMEFRAMES.map((timeframe) => TIMEFRAME_DEFINITIONS[timeframe].seconds),
    [60, 300, 900, 1800, 3600, 14400, 86400, 604800, 2592000],
  );
});

test("timeframe normalization is strict but accepts canonical casing variants", () => {
  assert.equal(normalizeChartTimeframe("1m"), "1m");
  assert.equal(normalizeChartTimeframe("1H"), "1H");
  assert.equal(normalizeChartTimeframe("1h"), "1H");
  assert.equal(normalizeChartTimeframe("4h"), "4H");
  assert.equal(normalizeChartTimeframe("1d"), "1D");
  assert.equal(normalizeChartTimeframe("1w"), "1W");
  assert.equal(normalizeChartTimeframe("1M"), "1M");
  assert.equal(normalizeChartTimeframe("1month"), null);
  assert.equal(normalizeChartTimeframe(""), null);
  assert.equal(normalizeChartTimeframe(undefined), null);
});

test("native data always wins and only weekly/monthly allow a daily aggregation fallback", () => {
  assert.deepEqual(resolveTimeframeDataStrategy("1D", 42), { kind: "native", timeframe: "1D", apiTimeframe: 86400 });
  assert.deepEqual(resolveTimeframeDataStrategy("1W", 10), { kind: "native", timeframe: "1W", apiTimeframe: 604800 });
  assert.deepEqual(resolveTimeframeDataStrategy("1W", 0), { kind: "aggregate", timeframe: "1W", sourceTimeframe: "1D", sourceApiTimeframe: 86400 });
  assert.deepEqual(resolveTimeframeDataStrategy("1M", 0), { kind: "aggregate", timeframe: "1M", sourceTimeframe: "1D", sourceApiTimeframe: 86400 });
  assert.deepEqual(resolveTimeframeDataStrategy("5m", 0), { kind: "unavailable", timeframe: "5m", apiTimeframe: 300 });
});

test("invalid timeframe never silently falls back to daily", () => {
  assert.equal(getTimeframeSeconds("garbage"), null);
  assert.equal(resolveTimeframeDataStrategy("garbage", 0), null);
});

test("market data cache keeps legacy daily keys and scopes every non-daily timeframe", () => {
  assert.equal(createTimeframeMarketDataCacheKey("brvm", "orange_ci"), "BRVM::ORANGE_CI");
  assert.equal(createTimeframeMarketDataCacheKey("brvm", "orange_ci", "1D"), "BRVM::ORANGE_CI");
  assert.equal(createTimeframeMarketDataCacheKey("brvm", "orange_ci", "1W"), "BRVM::ORANGE_CI::1W");
  assert.equal(createTimeframeMarketDataCacheKey("cse", "boa", "1h"), "CSE::BOA::1H");
});
