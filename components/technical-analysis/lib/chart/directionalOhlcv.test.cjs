const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const sourcePath = path.resolve(__dirname, "directionalOhlcv.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;

const loadedModule = { exports: {} };
new Function("module", "exports", "require", compiled)(loadedModule, loadedModule.exports, require);

const { resolveStableVolumeAxisMax } = loadedModule.exports;

test("volume scale uses deterministic headroom for ordinary data", () => {
  const volumes = [[0, 100, 1], [1, 200, 1], [2, 300, -1]];
  assert.equal(resolveStableVolumeAxisMax(volumes), 300 * 1.11);
});

test("a single extreme volume spike cannot flatten the whole visible pane", () => {
  const volumes = [
    [0, 100, 1],
    [1, 110, 1],
    [2, 120, -1],
    [3, 130, 1],
    [4, 1000000, -1],
  ];
  // Median is 120, therefore the global axis is capped at 5x median + 11% headroom.
  assert.equal(resolveStableVolumeAxisMax(volumes), 120 * 5 * 1.11);
});

test("empty, zero and invalid volumes fail safe", () => {
  assert.equal(resolveStableVolumeAxisMax([]), 100);
  assert.equal(resolveStableVolumeAxisMax([[0, 0, 1], [1, Number.NaN, -1]]), 100);
});
