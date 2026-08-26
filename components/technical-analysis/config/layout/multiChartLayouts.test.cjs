const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const ts = require("typescript");

const sourcePath = path.join(__dirname, "multiChartLayouts.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
  fileName: sourcePath,
}).outputText;

const runtimeModule = new Module(sourcePath, module);
runtimeModule.filename = sourcePath;
runtimeModule.paths = module.paths;
runtimeModule._compile(transpiled, sourcePath);

const { createLayoutCells } = runtimeModule.exports;

test("empty multi-chart slots are market-agnostic until a symbol is selected", () => {
  const cells = createLayoutCells("four_grid", "ORANGE_CI", [], [], undefined, undefined, "BRVM");

  assert.equal(cells[0].symbol, "ORANGE_CI");
  assert.equal(cells[0].exchange, "BRVM");
  for (const cell of cells.slice(1)) {
    assert.equal(cell.symbol, "");
    assert.equal(cell.exchange, "");
  }
});

test("legacy empty slots do not retain a leaked BRVM exchange", () => {
  const previous = [
    { chartId: "chart_1", symbol: "ORANGE_CI", exchange: "BRVM", interval: "1D", indicators: [], isActive: true },
    { chartId: "chart_2", symbol: "", exchange: "BRVM", interval: "1D", indicators: [], isActive: false },
  ];

  const cells = createLayoutCells("two_horizontal", "ORANGE_CI", [], previous, undefined, undefined, "BRVM");
  assert.equal(cells[1].symbol, "");
  assert.equal(cells[1].exchange, "");
});

test("a real secondary binding keeps its own exchange", () => {
  const previous = [
    { chartId: "chart_1", symbol: "ORANGE_CI", exchange: "BRVM", interval: "1D", indicators: [], isActive: true },
    { chartId: "chart_2", symbol: "BCP", exchange: "CSE", interval: "1D", indicators: [], isActive: false },
  ];

  const cells = createLayoutCells("two_horizontal", "ORANGE_CI", [], previous, undefined, undefined, "BRVM");
  assert.equal(cells[1].symbol, "BCP");
  assert.equal(cells[1].exchange, "CSE");
});
