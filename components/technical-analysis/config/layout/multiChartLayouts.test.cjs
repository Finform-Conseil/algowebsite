const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const ts = require("typescript");

const moduleCache = new Map();
const loadTs = (filename) => {
  const sourcePath = path.resolve(filename);
  if (moduleCache.has(sourcePath)) return moduleCache.get(sourcePath).exports;
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
  runtimeModule.paths = Module._nodeModulePaths(path.dirname(sourcePath));
  moduleCache.set(sourcePath, runtimeModule);
  const originalRequire = runtimeModule.require.bind(runtimeModule);
  runtimeModule.require = (request) => {
    if (request.startsWith("./") || request.startsWith("../")) {
      const target = path.resolve(path.dirname(sourcePath), request.endsWith(".ts") ? request : `${request}.ts`);
      if (fs.existsSync(target)) return loadTs(target);
    }
    return originalRequire(request);
  };
  runtimeModule._compile(transpiled, sourcePath);
  return runtimeModule.exports;
};

const { createLayoutCells, hasCollapsedLayoutSymbols, reconcileMultiChartLayout } = loadTs(path.join(__dirname, "multiChartLayouts.ts"));

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

test("changing layout preserves every existing market binding and the active cell", () => {
  const current = {
    layoutId: "two_horizontal",
    name: "2 graphiques horizontaux",
    isEnabled: true,
    sync: { symbol: false, interval: false, crosshair: false, time: false, dateRange: false },
    charts: [
      { chartId: "chart_1", symbol: "ORANGE_CI", exchange: "BRVM", interval: "1D", indicators: ["volume"], isActive: false },
      { chartId: "chart_2", symbol: "BOA", exchange: "CSE", interval: "1D", indicators: ["volume"], isActive: true },
    ],
    activeChartId: "chart_2",
  };

  const next = reconcileMultiChartLayout(current, "four_grid", "BOA", [], "CSE");

  assert.deepEqual(
    next.charts.map(({ symbol, exchange }) => ({ symbol, exchange })),
    [
      { symbol: "ORANGE_CI", exchange: "BRVM" },
      { symbol: "BOA", exchange: "CSE" },
      { symbol: "", exchange: "" },
      { symbol: "", exchange: "" },
    ],
  );
  assert.equal(next.activeChartId, "chart_2");
  assert.equal(next.charts[1].isActive, true);
});

test("same-count geometry changes preserve the primary market binding too", () => {
  const current = {
    layoutId: "two_horizontal",
    name: "2 graphiques horizontaux",
    isEnabled: true,
    sync: { symbol: false, interval: false, crosshair: false, time: false, dateRange: false },
    charts: [
      { chartId: "chart_1", symbol: "ORANGE_CI", exchange: "BRVM", interval: "1D", indicators: [], isActive: true },
      { chartId: "chart_2", symbol: "BOA", exchange: "CSE", interval: "1D", indicators: [], isActive: false },
    ],
    activeChartId: "chart_1",
  };

  const next = reconcileMultiChartLayout(current, "two_vertical", "BOA", [], "CSE");
  assert.equal(next.charts[0].symbol, "ORANGE_CI");
  assert.equal(next.charts[0].exchange, "BRVM");
  assert.equal(next.charts[1].symbol, "BOA");
  assert.equal(next.charts[1].exchange, "CSE");
});

test("a dense layout with one bound primary and empty peers is sparse, not collapsed", () => {
  const charts = createLayoutCells("eight_grid", "ATW", [], [], undefined, undefined, "CSE");
  const layout = {
    layoutId: "eight_grid",
    name: "8 graphiques 4x2",
    isEnabled: true,
    sync: { symbol: false, interval: false, crosshair: false, time: false, dateRange: false },
    charts,
    activeChartId: "chart_1",
  };

  assert.equal(hasCollapsedLayoutSymbols(layout), false);
});

test("a dense layout with duplicated bound symbols is collapsed and repairs in one reconciliation", () => {
  const charts = createLayoutCells("eight_grid", "ATW", [], [], undefined, undefined, "CSE");
  charts[1] = { ...charts[1], symbol: "ATW", exchange: "CSE" };
  const layout = {
    layoutId: "eight_grid",
    name: "8 graphiques 4x2",
    isEnabled: true,
    sync: { symbol: false, interval: false, crosshair: false, time: false, dateRange: false },
    charts,
    activeChartId: "chart_1",
  };

  assert.equal(hasCollapsedLayoutSymbols(layout), true);
  const repaired = reconcileMultiChartLayout(layout, "eight_grid", "ATW", [], "CSE");
  assert.equal(hasCollapsedLayoutSymbols(repaired), false);
  assert.equal(repaired.charts[0].symbol, "ATW");
  assert.equal(repaired.charts[1].symbol, "");
});
