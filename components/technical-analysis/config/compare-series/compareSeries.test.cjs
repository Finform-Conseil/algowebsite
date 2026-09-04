/* eslint-env node */
const assert = require("node:assert/strict");
const test = require("node:test");

require("../../store/__tests__/testTypeScriptLoader.cjs");

const {
  createCompareInstrumentKey,
  getCompareInstrumentLabel,
  getCompareSeriesId,
  parseCompareInstrumentKey,
} = require("./compareSeries.ts");

test("comparison identity preserves exchange and symbol independently", () => {
  assert.equal(createCompareInstrumentKey("ngx", "airtel_africa"), "NGX::AIRTEL_AFRICA");
  assert.equal(createCompareInstrumentKey("brvm", "airtel_africa"), "BRVM::AIRTEL_AFRICA");
  assert.notEqual(
    createCompareInstrumentKey("NGX", "AIRTEL_AFRICA"),
    createCompareInstrumentKey("BRVM", "AIRTEL_AFRICA"),
  );
});

test("comparison identity parses canonical keys and legacy tickers with an explicit fallback market", () => {
  assert.deepEqual(parseCompareInstrumentKey("NGX::AIRTEL_AFRICA"), {
    market: "NGX",
    symbol: "AIRTEL_AFRICA",
  });
  assert.deepEqual(parseCompareInstrumentKey("SNTS", "BRVM"), {
    market: "BRVM",
    symbol: "SNTS",
  });
  assert.equal(parseCompareInstrumentKey("SNTS"), null);
});

test("comparison labels and ECharts ids retain market disambiguation", () => {
  assert.equal(getCompareInstrumentLabel("NGX::AIRTEL_AFRICA"), "AIRTEL_AFRICA · NGX");
  assert.equal(getCompareSeriesId("NGX::AIRTEL_AFRICA"), "compare-NGX-AIRTEL_AFRICA");
  assert.notEqual(
    getCompareSeriesId("NGX::AIRTEL_AFRICA"),
    getCompareSeriesId("BRVM::AIRTEL_AFRICA"),
  );
});
