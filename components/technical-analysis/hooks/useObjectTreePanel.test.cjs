/* eslint-env node */
const assert = require("node:assert/strict");
const test = require("node:test");

require("../store/__tests__/testTypeScriptLoader.cjs");

const { resolveAxisPointerIndex, resolvePixelPointerIndex } = require("./useObjectTreePanel.ts");

const chartData = [
  { time: "2026-08-20T00:00:00.000Z", open: 10, high: 12, low: 9, close: 11 },
  { time: "2026-08-21T00:00:00.000Z", open: 11, high: 13, low: 10, close: 12 },
];

test("data window resolves a temporal axis category to its candle index", () => {
  assert.equal(
    resolveAxisPointerIndex(
      { axesInfo: [{ value: "2026-08-21T00:00:00.000Z" }] },
      chartData,
    ),
    1,
  );
});

test("data window resolves numeric timestamps without treating them as indexes", () => {
  assert.equal(
    resolveAxisPointerIndex(
      { axesInfo: [{ value: new Date("2026-08-20T00:00:00.000Z").getTime() }] },
      chartData,
    ),
    0,
  );
});

test("pointer resolution prefers the x axis when ECharts reports multiple axes", () => {
  assert.equal(
    resolveAxisPointerIndex(
      {
        axesInfo: [
          { axisDim: "y", axisIndex: 0, value: 9999 },
          { axisDim: "x", axisIndex: 0, value: "2026-08-21T00:00:00.000Z" },
        ],
      },
      chartData,
    ),
    1,
  );
});

test("pixel fallback resolves the temporal category returned by ECharts", () => {
  const chart = {
    containPixel: () => true,
    convertFromPixel: () => ["2026-08-21T00:00:00.000Z", 12],
  };

  assert.equal(
    resolvePixelPointerIndex(chart, { offsetX: 120, offsetY: 80 }, chartData),
    1,
  );
});

test("padded history axis dataIndex maps to the real candle instead of the padded slot", () => {
  const axisCategories = [
    "__history__1",
    "__history__2",
    chartData[0].time,
    chartData[1].time,
    "__future__1",
  ];

  assert.equal(resolveAxisPointerIndex({ dataIndex: 3 }, chartData, axisCategories), 1);
  assert.equal(resolveAxisPointerIndex({ dataIndex: 1 }, chartData, axisCategories), null);
});

test("pixel fallback translates the extended x-axis index through real categories", () => {
  const axisCategories = [
    "__history__1",
    "__history__2",
    chartData[0].time,
    chartData[1].time,
    "__future__1",
  ];
  const chart = {
    containPixel: () => true,
    convertFromPixel: () => [3.08, 12],
  };

  assert.equal(
    resolvePixelPointerIndex(chart, { offsetX: 120, offsetY: 80 }, chartData, axisCategories),
    1,
  );
});

test("pixel fallback ignores synthetic future space instead of freezing on a stale candle", () => {
  const axisCategories = [
    "__history__1",
    chartData[0].time,
    chartData[1].time,
    "__future__1",
  ];
  const chart = {
    containPixel: () => true,
    convertFromPixel: () => [3, 12],
  };

  assert.equal(
    resolvePixelPointerIndex(chart, { offsetX: 120, offsetY: 80 }, chartData, axisCategories),
    null,
  );
});
