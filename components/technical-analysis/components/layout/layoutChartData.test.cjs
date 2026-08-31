/* eslint-env node */
require("../../store/__tests__/testTypeScriptLoader.cjs");

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  convertLayoutSeriesByRate,
  convertLayoutSeriesCurrency,
  createLayoutOhlcState,
  getLayoutPriceChangeColor,
  resolveLayoutDisplayRate,
} = require("./layoutChartData.ts");

const point = (time, open, high, low, close, volume = 1) => ({
  time,
  open,
  high,
  low,
  close,
  volume,
});

test("layout OHLC daily change uses previous close, never current candle open", () => {
  const previous = point("2026-04-08T00:00:00.000Z", 14_900, 15_050, 14_850, 15_000);
  const latest = point("2026-04-09T00:00:00.000Z", 15_100, 15_100, 15_100, 15_100);

  const state = createLayoutOhlcState(latest, previous);

  assert.equal(state.change, "+100,00");
  assert.equal(state.changePercent, "+0.67%");
});

test("layout OHLC does not invent +0.00% when previous close is unavailable", () => {
  const latest = point("2026-04-09T00:00:00.000Z", 15_100, 15_100, 15_100, 15_100);

  const state = createLayoutOhlcState(latest);

  assert.equal(state.change, "--");
  assert.equal(state.changePercent, "--");
});

test("layout change color follows previous close rather than candle direction", () => {
  const previous = point("2026-04-08T00:00:00.000Z", 100, 100, 100, 100);
  const latest = point("2026-04-09T00:00:00.000Z", 120, 125, 105, 110);

  assert.equal(getLayoutPriceChangeColor(latest, previous, "UP", "DOWN"), "UP");
});

test("peer currency conversion uses the same USD pivot convention as the platform", () => {
  const series = [point("2026-04-09T00:00:00.000Z", 200, 210, 190, 203, 12_345)];
  const rates = { USD: 1, MAD: 10 };

  assert.equal(resolveLayoutDisplayRate("MAD", "USD", rates), 0.1);
  const converted = convertLayoutSeriesCurrency(series, "MAD", "USD", rates);
  assert.deepEqual(converted[0], {
    ...series[0],
    open: 20,
    high: 21,
    low: 19,
    close: 20.3,
  });
  assert.equal(converted[0].volume, 12_345);
});

test("peer currency conversion never invents missing API metadata or rates", () => {
  const series = [point("2026-04-09T00:00:00.000Z", 200, 210, 190, 203)];

  assert.equal(convertLayoutSeriesCurrency(series, "", "USD", { USD: 1, MAD: 10 }), series);
  assert.equal(convertLayoutSeriesCurrency(series, "MAD", "USD", { USD: 1 }), series);
  assert.equal(convertLayoutSeriesCurrency(series, "MAD", "MAD", { MAD: 10 }), series);
});

test("active-cell peers can reuse the canonical effective rate without duplicate metadata fetches", () => {
  const series = [point("2026-04-09T00:00:00.000Z", 7500, 7600, 7400, 7540, 3193)];
  const converted = convertLayoutSeriesByRate(series, 13.34 / 7540);

  assert.ok(Math.abs(converted[0].close - 13.34) < 1e-10);
  assert.equal(converted[0].volume, 3193);
  assert.equal(convertLayoutSeriesByRate(series, 1), series);
  assert.equal(convertLayoutSeriesByRate(series, Number.NaN), series);
});
