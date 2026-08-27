const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const ts = require("typescript");

const sourcePath = path.join(__dirname, "chartAsyncPresentation.ts");
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

const { resolvePrimaryChartAsyncPresentation } = runtimeModule.exports;

const resolve = (overrides = {}) => resolvePrimaryChartAsyncPresentation({
  hasExplicitSymbol: true,
  hasDisplayData: false,
  isInitialBootstrapLoading: false,
  loadStatus: "loading",
  ...overrides,
});

test("hard reload bootstrap shows the chart loader before symbol hydration", () => {
  assert.deepEqual(resolve({
    hasExplicitSymbol: false,
    isInitialBootstrapLoading: true,
    loadStatus: "idle",
  }), {
    showLoader: true,
    showError: false,
    showEmpty: false,
  });
});

test("explicit pending market data shows the chart loader", () => {
  assert.equal(resolve({ loadStatus: "loading" }).showLoader, true);
  assert.equal(resolve({ loadStatus: "idle" }).showLoader, true);
});

test("renderable candles suppress every async overlay", () => {
  assert.deepEqual(resolve({
    hasDisplayData: true,
    isInitialBootstrapLoading: true,
    loadStatus: "loading",
  }), {
    showLoader: false,
    showError: false,
    showEmpty: false,
  });
});

test("terminal empty and failed states never become infinite loaders", () => {
  assert.deepEqual(resolve({ loadStatus: "empty" }), {
    showLoader: false,
    showError: false,
    showEmpty: true,
  });
  assert.deepEqual(resolve({ loadStatus: "failed" }), {
    showLoader: false,
    showError: true,
    showEmpty: false,
  });
});

test("no symbol and no bootstrap does not invent an overlay", () => {
  assert.deepEqual(resolve({
    hasExplicitSymbol: false,
    isInitialBootstrapLoading: false,
    loadStatus: "idle",
  }), {
    showLoader: false,
    showError: false,
    showEmpty: false,
  });
});
