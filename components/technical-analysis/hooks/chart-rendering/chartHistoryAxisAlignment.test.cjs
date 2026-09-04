const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const sourcePath = path.resolve(__dirname, "chartHistoryAxisAlignment.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;

const loadedModule = { exports: {} };
new Function("module", "exports", "require", compiled)(loadedModule, loadedModule.exports, require);
const { alignCustomRenderItemWithHistoryAxis, resolveRenderedTimeAxisWindow } = loadedModule.exports;

test("custom renderer shifts dataZoom x values and visual numeric coordinates", () => {
  const series = {
    id: "main-series",
    type: "custom",
    data: [[0, 26.5], [1, 26.7]],
    renderItem: (_params, api) => ({
      sourceX: api.value(0),
      numeric: api.coord([api.value(0), 26.7]),
      keyed: api.coord(["2026-04-09", 26.7]),
    }),
  };
  const aligned = alignCustomRenderItemWithHistoryAxis(series, 80);
  const coordCalls = [];
  const result = aligned.renderItem({}, {
    value: (dimension) => aligned.data[1][dimension],
    coord: (data) => {
      coordCalls.push(data);
      return data;
    },
  });

  assert.deepEqual(aligned.data, [[80, 26.5], [81, 26.7]]);
  assert.equal(result.sourceX, 1);
  assert.deepEqual(result.numeric, [81, 26.7]);
  assert.deepEqual(result.keyed, ["2026-04-09", 26.7]);
  assert.deepEqual(coordCalls, [[81, 26.7], ["2026-04-09", 26.7]]);
});

test("custom renderer preserves array-position dataIndex semantics after x shifting", () => {
  const data = [[0], [1], [2]];
  const series = {
    id: "main-series",
    type: "custom",
    data,
    renderItem: (params, api) => ({
      sourceIndex: params.dataIndex,
      sourceX: api.value(0),
      point: api.coord([params.dataIndex, 10]),
    }),
  };
  const aligned = alignCustomRenderItemWithHistoryAxis(series, 80);
  const result = aligned.renderItem(
    { dataIndex: 1 },
    { value: (dimension) => aligned.data[1][dimension], coord: (point) => point },
  );

  assert.deepEqual(aligned.data, [[80], [81], [82]]);
  assert.equal(result.sourceIndex, 1);
  assert.equal(result.sourceX, 1);
  assert.deepEqual(result.point, [81, 10]);
});

test("non-custom series are returned unchanged", () => {
  const series = { id: "main-series", type: "candlestick", data: [[1, 2, 0, 3]] };
  assert.strictEqual(alignCustomRenderItemWithHistoryAxis(series, 80), series);
});

test("transformed viewport maps sparse and duplicate render dates back to source dates", () => {
  const history = Array.from({ length: 80 }, (_, index) => `__history__${index + 1}`);
  const future = Array.from({ length: 80 }, (_, index) => `__future__${index + 1}`);
  const axisCategories = [...history, "t2", "t4", "t4 #2", ...future];

  assert.deepEqual(resolveRenderedTimeAxisWindow({
    axisCategories,
    sourceTimes: ["t0", "t1", "t2", "t3", "t4"],
    sourceStartIdx: 1,
    sourceEndIdx: 4,
    historyGapBars: 80,
  }), { startValue: 80, endValue: 82 });
});

test("transformed viewport preserves history and future space around compact output", () => {
  const history = Array.from({ length: 80 }, (_, index) => `__history__${index + 1}`);
  const future = Array.from({ length: 80 }, (_, index) => `__future__${index + 1}`);
  const axisCategories = [...history, "t2", "t4", ...future];

  assert.deepEqual(resolveRenderedTimeAxisWindow({
    axisCategories,
    sourceTimes: ["t0", "t1", "t2", "t3", "t4"],
    sourceStartIdx: -2,
    sourceEndIdx: 6,
    historyGapBars: 80,
  }), { startValue: 78, endValue: 83 });
});
