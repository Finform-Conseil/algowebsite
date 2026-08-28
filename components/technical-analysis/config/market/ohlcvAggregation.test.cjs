/* eslint-env node */
require("../../store/__tests__/testTypeScriptLoader.cjs");

const test = require("node:test");
const assert = require("node:assert/strict");

const { aggregateOhlcv, normalizeOhlcvSeries } = require("./ohlcvAggregation.ts");

const point = (time, open, high, low, close, volume, tradesCount = null) => ({
  time,
  open,
  high,
  low,
  close,
  volume,
  tradesCount,
});

test("weekly aggregation uses Monday UTC and canonical OHLCV semantics", () => {
  const daily = [
    point("2026-08-03T00:00:00.000Z", 10, 13, 9, 12, 100, 2),
    point("2026-08-04T00:00:00.000Z", 12, 15, 11, 14, 200, 3),
    point("2026-08-07T00:00:00.000Z", 14, 16, 8, 9, 50, 4),
    point("2026-08-10T00:00:00.000Z", 20, 22, 19, 21, 80, 1),
  ];

  const weekly = aggregateOhlcv(daily, "1W");
  assert.deepEqual(weekly, [
    point("2026-08-03T00:00:00.000Z", 10, 16, 8, 9, 350, 9),
    point("2026-08-10T00:00:00.000Z", 20, 22, 19, 21, 80, 1),
  ]);
});

test("monthly aggregation crosses month boundaries without inventing missing sessions", () => {
  const daily = [
    point("2026-07-30T00:00:00.000Z", 100, 105, 99, 104, 10),
    point("2026-07-31T00:00:00.000Z", 104, 110, 103, 108, 20),
    point("2026-08-03T00:00:00.000Z", 200, 205, 195, 201, 30),
    point("2026-08-28T00:00:00.000Z", 201, 220, 180, 210, 40),
  ];

  assert.deepEqual(aggregateOhlcv(daily, "1M"), [
    point("2026-07-01T00:00:00.000Z", 100, 110, 99, 108, 30, null),
    point("2026-08-01T00:00:00.000Z", 200, 220, 180, 210, 70, null),
  ]);
});

test("normalization sorts ascending, rejects invalid points and de-duplicates equal timestamps deterministically", () => {
  const input = [
    point("2026-08-04T00:00:00.000Z", 12, 14, 11, 13, 5),
    point("invalid", 1, 2, 0, 1, 1),
    point("2026-08-03T00:00:00.000Z", 10, 12, 9, 11, 3),
    point("2026-08-04T00:00:00.000Z", 20, 21, 19, 20, 7),
    point("2026-08-05T00:00:00.000Z", Number.NaN, 2, 1, 1, 1),
  ];

  assert.deepEqual(normalizeOhlcvSeries(input), [
    point("2026-08-03T00:00:00.000Z", 10, 12, 9, 11, 3),
    point("2026-08-04T00:00:00.000Z", 20, 21, 19, 20, 7),
  ]);
});

test("unsupported aggregation target fails closed", () => {
  assert.throws(() => aggregateOhlcv([point("2026-08-03T00:00:00.000Z", 1, 2, 0, 1, 1)], "4H"), /Unsupported OHLCV aggregation target/);
});
