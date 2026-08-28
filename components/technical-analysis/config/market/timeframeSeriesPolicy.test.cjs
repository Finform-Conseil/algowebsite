/* eslint-env node */
require("../../store/__tests__/testTypeScriptLoader.cjs");

const test = require("node:test");
const assert = require("node:assert/strict");
const { loadTimeframeSeries } = require("./timeframeSeriesPolicy.ts");

const bar = (time, open, high, low, close, volume) => ({ time, open, high, low, close, volume });
const daily = [
  bar("2026-08-03T00:00:00.000Z", 10, 12, 9, 11, 100),
  bar("2026-08-04T00:00:00.000Z", 11, 13, 10, 12, 120),
  bar("2026-08-10T00:00:00.000Z", 12, 14, 11, 13, 140),
];

test("native timeframe wins without loading daily fallback", async () => {
  const calls = [];
  const result = await loadTimeframeSeries("1W", async (seconds) => {
    calls.push(seconds);
    return seconds === 604800 ? [bar("2026-08-03T00:00:00.000Z", 10, 13, 9, 12, 220)] : daily;
  });
  assert.equal(result.source, "native");
  assert.deepEqual(calls, [604800]);
});

test("weekly empty native series falls back to deterministic daily aggregation", async () => {
  const calls = [];
  const result = await loadTimeframeSeries("1W", async (seconds) => {
    calls.push(seconds);
    return seconds === 604800 ? [] : daily;
  });
  assert.equal(result.source, "aggregate");
  assert.deepEqual(calls, [604800, 86400]);
  assert.equal(result.series.length, 2);
  assert.deepEqual(result.series[0], {
    time: "2026-08-03T00:00:00.000Z",
    open: 10,
    high: 13,
    low: 9,
    close: 12,
    volume: 220,
    tradesCount: null,
  });
});

test("monthly native failure degrades to daily aggregation", async () => {
  const result = await loadTimeframeSeries("1M", async (seconds) => {
    if (seconds === 2592000) throw new Error("native unavailable");
    return daily;
  });
  assert.equal(result.source, "aggregate");
  assert.equal(result.series.length, 1);
  assert.match(String(result.nativeError), /native unavailable/);
});

test("intraday empty native series remains unavailable and never aggregates daily", async () => {
  const calls = [];
  const result = await loadTimeframeSeries("1H", async (seconds) => {
    calls.push(seconds);
    return [];
  });
  assert.equal(result.source, "unavailable");
  assert.deepEqual(calls, [3600]);
});

test("intraday native transport errors stay visible", async () => {
  await assert.rejects(
    () => loadTimeframeSeries("5m", async () => { throw new Error("network down"); }),
    /network down/,
  );
});

test("invalid timeframe fails closed", async () => {
  await assert.rejects(() => loadTimeframeSeries("2H", async () => daily), /Unsupported chart timeframe/);
});
