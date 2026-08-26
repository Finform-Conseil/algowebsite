/* eslint-env node */
require("../../store/__tests__/testTypeScriptLoader.cjs");

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  clientPointToLocalPixel,
  safeConvertFromPixelToChartPoint,
} = require("./drawingCoordinates.ts");

const DAY_MS = 86_400_000;
const isoDay = (day) => new Date(Date.UTC(2026, 7, day)).toISOString();

const createCategoryChart = ({ rawIndex, value = 42, axisData }) => ({
  convertFromPixel() {
    return [rawIndex, value];
  },
  getOption() {
    return {
      series: [{ xAxisIndex: 0 }],
      xAxis: [{ type: "category", data: axisData }],
    };
  },
});

test("clientPointToLocalPixel uses the ECharts DOM-local coordinate space", () => {
  assert.deepEqual(
    clientPointToLocalPixel(
      { clientX: 310, clientY: 245 },
      { left: 110, top: 45, width: 800, height: 600 },
    ),
    { x: 200, y: 200 },
  );
});

test("category conversion preserves a real axis date instead of leaking the ECharts category index", () => {
  const axisData = ["__history__0", "__history__1", isoDay(20), isoDay(21), "__future__0"];
  const chart = createCategoryChart({ rawIndex: 2, axisData });

  assert.deepEqual(
    safeConvertFromPixelToChartPoint(chart, [100, 200], 0),
    [isoDay(20), 42],
  );
});

test("category conversion extrapolates through synthetic history categories", () => {
  const axisData = ["__history__0", "__history__1", isoDay(20), isoDay(21), "__future__0"];
  const chart = createCategoryChart({ rawIndex: 0, axisData });

  assert.deepEqual(
    safeConvertFromPixelToChartPoint(chart, [100, 200], 0),
    [isoDay(18), 42],
  );
});

test("category conversion extrapolates through synthetic future categories", () => {
  const axisData = ["__history__0", isoDay(20), isoDay(21), "__future__0", "__future__1"];
  const chart = createCategoryChart({ rawIndex: 4, axisData });

  assert.deepEqual(
    safeConvertFromPixelToChartPoint(chart, [100, 200], 0),
    [isoDay(23), 42],
  );
});

test("synthetic-axis extrapolation keeps the observed temporal step", () => {
  const axisData = ["__history__0", isoDay(20), isoDay(22), "__future__0"];
  const chart = createCategoryChart({ rawIndex: 3, axisData });
  const result = safeConvertFromPixelToChartPoint(chart, [100, 200], 0);

  assert.equal(result?.[0], new Date(Date.parse(isoDay(22)) + (2 * DAY_MS)).toISOString());
  assert.equal(result?.[1], 42);
});
