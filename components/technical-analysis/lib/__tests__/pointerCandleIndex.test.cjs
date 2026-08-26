/* eslint-env node */
require("../../store/__tests__/testTypeScriptLoader.cjs");

const test = require("node:test");
const assert = require("node:assert/strict");
const { readPrimaryXAxisCategories } = require("../chart/pointerCandleIndex.ts");

test("readPrimaryXAxisCategories tolerates an ECharts instance whose option is not initialized yet", () => {
  const chart = { getOption: () => undefined };
  assert.deepEqual(readPrimaryXAxisCategories(chart), []);
});

test("readPrimaryXAxisCategories accepts ECharts axis arrays and objects", () => {
  assert.deepEqual(readPrimaryXAxisCategories({ getOption: () => ({ xAxis: [{ data: ["a", "b"] }] }) }), ["a", "b"]);
  assert.deepEqual(readPrimaryXAxisCategories({ getOption: () => ({ xAxis: { data: ["c"] } }) }), ["c"]);
});
