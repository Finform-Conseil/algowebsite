/* eslint-env node */
require("../../components/technical-analysis/store/__tests__/testTypeScriptLoader.cjs");

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  coursEntityToChartDataPoint,
  coursSeriesToChartData,
  getCanonicalChartTimeKey,
} = require("./marketDataTransform.ts");

const cours = (timestamp, open, close, overrides = {}) => ({
  timestamp,
  open,
  close,
  high: null,
  low: null,
  volume: 10,
  number_of_trades: null,
  ...overrides,
});

test("cours mapper derives a single fallback wick range from open/close when API high/low are null", () => {
  assert.deepEqual(coursEntityToChartDataPoint(cours("2026-04-09T00:00:00+0000", 2810, 2800)), {
    time: "2026-04-09T00:00:00+0000",
    open: 2810,
    high: 2810,
    low: 2800,
    close: 2800,
    volume: 10,
    tradesCount: null,
    trades_count: null,
  });
});

test("canonical chart time key collapses equivalent ISO spellings to one logical instant", () => {
  assert.equal(
    getCanonicalChartTimeKey("2026-04-08T00:00:00Z"),
    getCanonicalChartTimeKey("2026-04-08T00:00:00+0000"),
  );
});

test("cours series is chronological and renders at most one candle per logical instant", () => {
  const firstSpelling = "2026-04-08T00:00:00Z";
  const winningSpelling = "2026-04-08T00:00:00+0000";
  const result = coursSeriesToChartData([
    cours("2026-04-09T00:00:00+0000", 2810, 2800),
    cours(firstSpelling, 2790, 2780),
    cours(winningSpelling, 2800, 2800, { volume: 99 }),
    cours("2026-04-07T00:00:00+0000", 2685, 2810),
  ]);

  assert.deepEqual(result.map((point) => point.time), [
    "2026-04-07T00:00:00+0000",
    winningSpelling,
    "2026-04-09T00:00:00+0000",
  ]);
  assert.equal(result.filter((point) => getCanonicalChartTimeKey(point.time) === getCanonicalChartTimeKey(firstSpelling)).length, 1);
  assert.equal(result.find((point) => point.time === winningSpelling).volume, 99);
});
