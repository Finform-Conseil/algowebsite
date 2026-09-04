const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const sourcePath = path.resolve(__dirname, "syntheticVolumeProjection.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const loadedModule = { exports: {} };
new Function("module", "exports", "require", compiled)(loadedModule, loadedModule.exports, require);
const { projectSyntheticVolumeToRenderedAxis } = loadedModule.exports;

const bars = [
  { sourceIndex: 0, time: 0, open: 10, high: 11, low: 9, close: 10.5, volume: 10 },
  { sourceIndex: 1, time: 1, open: 10.5, high: 12, low: 10, close: 11.5, volume: 20 },
  { sourceIndex: 2, time: 2, open: 11.5, high: 13, low: 11, close: 12.5, volume: 30 },
  { sourceIndex: 3, time: 3, open: 12.5, high: 14, low: 12, close: 13.5, volume: 40 },
];

const sourceMap = (indices) => ({
  sourceStartIndex: Math.min(...indices),
  sourceEndIndex: Math.max(...indices),
  sourceIndices: indices,
});

test("synthetic volume projection conserves source volume and splits duplicate endpoints", () => {
  const result = projectSyntheticVolumeToRenderedAxis({
    sourceMaps: [sourceMap([1]), sourceMap([1]), sourceMap([2])],
    renderDates: ["r1", "r1 #2", "r2"],
    sourceBars: bars,
  });

  assert.deepEqual(result.map((point) => point.time), ["r1", "r1 #2", "r2"]);
  assert.deepEqual(result.map((point) => point.volume), [15, 15, 70]);
  assert.equal(result.reduce((sum, point) => sum + point.volume, 0), 100);
});

test("final synthetic bucket retains trailing source volume after the last price event", () => {
  const result = projectSyntheticVolumeToRenderedAxis({
    sourceMaps: [sourceMap([0]), sourceMap([1])],
    renderDates: ["r0", "r1"],
    sourceBars: bars,
  });

  assert.deepEqual(result.map((point) => point.volume), [10, 90]);
  assert.equal(result[1].close, 13.5);
  assert.equal(result.reduce((sum, point) => sum + point.volume, 0), 100);
});
