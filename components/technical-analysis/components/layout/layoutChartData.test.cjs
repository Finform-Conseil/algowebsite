/* eslint-env node */
require("../../store/__tests__/testTypeScriptLoader.cjs");

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createLayoutOhlcState,
  getLayoutPriceChangeColor,
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
