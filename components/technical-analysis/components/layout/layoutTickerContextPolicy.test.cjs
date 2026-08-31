const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const sourcePath = path.resolve(__dirname, "layoutTickerContextPolicy.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const loadedModule = { exports: {} };
new Function("module", "exports", "require", compiled)(loadedModule, loadedModule.exports, require);

const { resolveTickerContextSyncMode, isMultiChartTickerContextIsolated } = loadedModule.exports;

test("multi-chart symbol bindings are isolated from the workspace ticker context", () => {
  assert.equal(resolveTickerContextSyncMode(true, 2), "multi-chart-isolated");
  assert.equal(resolveTickerContextSyncMode(true, 16), "multi-chart-isolated");
  assert.equal(isMultiChartTickerContextIsolated(true, 2), true);
});

test("single-chart mode preserves the legacy mirrored ticker context", () => {
  assert.equal(resolveTickerContextSyncMode(false, 2), "single-chart-mirrored");
  assert.equal(resolveTickerContextSyncMode(true, 1), "single-chart-mirrored");
  assert.equal(resolveTickerContextSyncMode(true, Number.NaN), "single-chart-mirrored");
});
