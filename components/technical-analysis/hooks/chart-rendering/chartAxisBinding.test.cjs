const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const sourcePath = path.resolve(__dirname, "chartAxisBinding.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;

const loadedModule = { exports: {} };
new Function("module", "exports", "require", compiled)(loadedModule, loadedModule.exports, require);
const { bindSeriesToStableCartesianAxisIds } = loadedModule.exports;

test("stable axis binding clears stale indexes and binds by component id", () => {
  const xAxes = [
    { id: "main-xaxis" },
    { id: "volume-xaxis" },
    { id: "osc-xaxis-0" },
  ];
  const yAxes = [
    { id: "price-yaxis" },
    { id: "volume-yaxis" },
    { id: "osc-yaxis-0" },
  ];

  assert.deepEqual(
    bindSeriesToStableCartesianAxisIds(
      { id: "macd-line", xAxisIndex: 2, yAxisIndex: 2 },
      xAxes,
      yAxes,
    ),
    {
      id: "macd-line",
      xAxisIndex: null,
      yAxisIndex: null,
      xAxisId: "osc-xaxis-0",
      yAxisId: "osc-yaxis-0",
    },
  );
});
