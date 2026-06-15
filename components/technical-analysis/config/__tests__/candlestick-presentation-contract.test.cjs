/* eslint-env node */
const assert = require("node:assert/strict");
const test = require("node:test");

require("../../store/__tests__/testTypeScriptLoader.cjs");

const presentation = require("../indicators/candlestickPatternPresentation.ts");

const entries = Object.entries(presentation.CANDLESTICK_PATTERN_PRESENTATIONS);
const weakIndecisionPatterns = new Set([
  "spinningTop",
  "doji",
  "longLeggedDoji",
  "rickshawMan",
  "dragonflyDoji",
  "gravestoneDoji",
]);

const assertUnique = (values, label) => {
  const seen = new Set();
  const duplicates = values.filter((value) => {
    if (seen.has(value)) return true;
    seen.add(value);
    return false;
  });
  assert.deepEqual([...new Set(duplicates)].sort(), [], label + " must not contain duplicates");
};

test("candlestick presentation priority covers every configured pattern exactly once", () => {
  const configuredKeys = entries.map(([key]) => key).sort();
  const priorityKeys = [...presentation.CANDLESTICK_PATTERN_PRIORITY].sort();

  assert.deepEqual(priorityKeys, configuredKeys);
  assertUnique(presentation.CANDLESTICK_PATTERN_PRIORITY, "candlestick priority keys");
  assert.ok(
    presentation.CANDLESTICK_PATTERN_PRIORITY.indexOf("abandonedBabyBull")
      < presentation.CANDLESTICK_PATTERN_PRIORITY.indexOf("doji"),
    "rare reversal patterns must outrank generic doji noise",
  );
  assert.ok(
    presentation.CANDLESTICK_PATTERN_PRIORITY.indexOf("morningStar")
      < presentation.CANDLESTICK_PATTERN_PRIORITY.indexOf("spinningTop"),
    "confirmed multi-candle reversals must outrank weak indecision markers",
  );
});

test("candlestick presentations keep labels compact and bounded", () => {
  entries.forEach(([key, item]) => {
    assert.equal(typeof item.markerId, "string", key + " markerId");
    assert.equal(typeof item.legendName, "string", key + " legendName");
    assert.ok(item.maxMarkers > 0 && item.maxMarkers <= 72, key + " maxMarkers bound");
    assert.ok(item.minBarGap >= 1, key + " minBarGap bound");
    assert.ok(item.z >= 20 && item.z <= 60, key + " z-index stays inside candle overlay band");
    if (item.showChartLabel) {
      const label = item.chartLabel || item.shortLabel || item.legendName;
      assert.ok(label.length <= 22, key + " chart label must stay compact");
    }
  });
});

test("weak high-frequency candlestick patterns are aggressively density-capped", () => {
  entries
    .filter(([key]) => weakIndecisionPatterns.has(key))
    .forEach(([key, item]) => {
      assert.ok(item.maxMarkers <= 24, key + " must not flood the price chart");
      assert.ok(item.minBarGap >= 2, key + " must keep spacing between weak markers");
      assert.ok(item.symbolSize <= 6 || Array.isArray(item.symbolSize), key + " symbol must remain small");
    });
});
