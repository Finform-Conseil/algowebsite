const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const sourcePath = path.resolve(__dirname, "chartCommitPolicy.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;

const loadedModule = { exports: {} };
new Function("module", "exports", "require", compiled)(loadedModule, loadedModule.exports, require);

const {
  resolveChartCommitMode,
  resolveChartStructureSignature,
} = loadedModule.exports;

const baseOption = {
  xAxis: [{ id: "price-xaxis", type: "category", data: ["a", "b"] }],
  yAxis: [{ id: "price-yaxis", type: "value" }, { id: "volume-yaxis", type: "value" }],
  grid: [{ id: "price-grid" }, { id: "volume-grid" }],
  dataZoom: [{ id: "time-zoom", type: "inside", xAxisIndex: [0] }],
  series: [
    { id: "main-series", type: "candlestick", xAxisIndex: 0, yAxisIndex: 0, data: [1, 2] },
    { id: "volume", type: "bar", xAxisIndex: 0, yAxisIndex: 1, data: [3, 4] },
  ],
};

test("history prepend keeps stable commit mode when only payload data changes", () => {
  const previousSignature = resolveChartStructureSignature(baseOption);
  const currentSignature = resolveChartStructureSignature({
    ...baseOption,
    xAxis: [{ ...baseOption.xAxis[0], data: ["old", "a", "b"] }],
    series: baseOption.series.map((series) => ({ ...series, data: [0, ...series.data] })),
  });

  assert.equal(previousSignature, currentSignature);
  assert.equal(resolveChartCommitMode({
    isHistoryPrepend: true,
    previousSignature,
    currentSignature,
  }), "history-prepend-stable");
});

test("indicator or pane topology change forces structural commit", () => {
  const previousSignature = resolveChartStructureSignature(baseOption);
  const currentSignature = resolveChartStructureSignature({
    ...baseOption,
    series: [...baseOption.series, { id: "rsi", type: "line", xAxisIndex: 1, yAxisIndex: 2 }],
    xAxis: [...baseOption.xAxis, { id: "rsi-xaxis", type: "category" }],
    yAxis: [...baseOption.yAxis, { id: "rsi-yaxis", type: "value" }],
    grid: [...baseOption.grid, { id: "rsi-grid" }],
  });

  assert.notEqual(previousSignature, currentSignature);
  assert.equal(resolveChartCommitMode({
    isHistoryPrepend: true,
    previousSignature,
    currentSignature,
  }), "structural");
});

test("ordinary data refresh never uses the prepend-only stable mode", () => {
  const signature = resolveChartStructureSignature(baseOption);
  assert.equal(resolveChartCommitMode({
    isHistoryPrepend: false,
    previousSignature: signature,
    currentSignature: signature,
  }), "structural");
});

test("first render is structural even when flagged as history prepend", () => {
  const signature = resolveChartStructureSignature(baseOption);
  assert.equal(resolveChartCommitMode({
    isHistoryPrepend: true,
    previousSignature: null,
    currentSignature: signature,
  }), "structural");
});
