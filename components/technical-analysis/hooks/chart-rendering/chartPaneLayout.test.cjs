const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const sourcePath = path.resolve(__dirname, "chartPaneLayout.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;

const loadedModule = { exports: {} };
new Function("module", "exports", "require", compiled)(loadedModule, loadedModule.exports, require);

const { anchorLastPaneToFixedTimeAxis, buildPriceVolumePaneLayout } = loadedModule.exports;

test("single pane uses a fixed time-axis bottom lane instead of percentage whitespace", () => {
  const grids = [{ top: "8%", height: "87%", left: 0, right: 84 }];

  assert.deepEqual(anchorLastPaneToFixedTimeAxis(grids, 28), [
    { top: "8%", height: "auto", left: 0, right: 84, bottom: 28 },
  ]);
});

test("only the final pane is bottom-anchored and preceding panes remain untouched", () => {
  const first = { top: "8%", height: "67%" };
  const last = { top: "75%", height: "20%" };
  const result = anchorLastPaneToFixedTimeAxis([first, last], 28);

  assert.equal(result[0], first);
  assert.deepEqual(result[1], { top: "75%", height: "auto", bottom: 28 });
  assert.deepEqual(first, { top: "8%", height: "67%" });
  assert.deepEqual(last, { top: "75%", height: "20%" });
});

test("invalid or negative axis heights fail safe without creating negative layout space", () => {
  assert.equal(anchorLastPaneToFixedTimeAxis([], 28).length, 0);
  assert.deepEqual(anchorLastPaneToFixedTimeAxis([{ top: "8%" }], Number.NaN), [
    { top: "8%", bottom: 0, height: "auto" },
  ]);
  assert.deepEqual(anchorLastPaneToFixedTimeAxis([{ top: "8%" }], -12), [
    { top: "8%", bottom: 0, height: "auto" },
  ]);
});

test("price + volume peers share the canonical 8/67/20 geometry and put time below volume", () => {
  assert.deepEqual(buildPriceVolumePaneLayout({
    left: 12,
    right: 58,
    showVolume: true,
    timeAxisHeightPx: 28,
  }), {
    grids: [
      { left: 12, right: 58, top: "8%", height: "67%", containLabel: false },
      { left: 12, right: 58, top: "75%", height: "auto", containLabel: false, bottom: 28 },
    ],
    visibleTimeAxisIndex: 1,
  });
});

test("a price-only peer owns the same fixed time-axis lane", () => {
  assert.deepEqual(buildPriceVolumePaneLayout({
    left: 12,
    right: 58,
    showVolume: false,
    timeAxisHeightPx: 28,
  }), {
    grids: [
      { left: 12, right: 58, top: "8%", height: "auto", containLabel: false, bottom: 28 },
    ],
    visibleTimeAxisIndex: 0,
  });
});
