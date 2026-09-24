const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../../../../..");
const source = fs.readFileSync(path.join(root, "components/technical-analysis/lib/chart-types/renderers/renderCandles.ts"), "utf8");
const transform = fs.readFileSync(path.join(root, "lib/utils/marketDataTransform.ts"), "utf8");

test("default candle body occupancy matches the measured TradingView-like geometry", () => {
  assert.match(source, /const CANDLE_BODY_WIDTH = "48%";/);
  assert.match(source, /const MIN_CANDLE_BODY_WIDTH = 1;/);
  assert.match(source, /const MAX_CANDLE_BODY_WIDTH = 14;/);
});

test("candlestick wick is a one-pixel native stroke", () => {
  assert.match(source, /type: "candlestick"/);
  assert.match(source, /borderWidth: 1/);
  assert.match(source, /value: \[bar\.open, bar\.close, bar\.low, bar\.high\]/);
});

test("renderer never fabricates market wicks when the API has no high or low", () => {
  assert.match(transform, /high: finiteOr\(cours\.high, fallbackHigh\)/);
  assert.match(transform, /low: finiteOr\(cours\.low, fallbackLow\)/);
  assert.match(transform, /const fallbackLow = open > 0 && close > 0 \? Math\.min\(open, close\)/);
  assert.match(transform, /const fallbackHigh = Math\.max\(open, close\)/);
});
