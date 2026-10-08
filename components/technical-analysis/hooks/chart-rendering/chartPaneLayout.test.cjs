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

const {
  anchorLastPaneToFixedTimeAxis,
  buildPriceVolumePaneLayout,
  resolveVelaPaneWeightLayout,
  VELA_PRICE_PANE_HEIGHT_WEIGHT,
  VELA_STUDY_PANE_HEIGHT_WEIGHT,
} = loadedModule.exports;

test("Vela pane weights allocate price 3 and every study 1", () => {
  assert.equal(VELA_PRICE_PANE_HEIGHT_WEIGHT, 3);
  assert.equal(VELA_STUDY_PANE_HEIGHT_WEIGHT, 1);
  assert.deepEqual(resolveVelaPaneWeightLayout(100, 0), {
    mainPaneHeightPercent: 100,
    studyPaneHeightPercent: 0,
  });
  assert.deepEqual(resolveVelaPaneWeightLayout(100, 1), {
    mainPaneHeightPercent: 75,
    studyPaneHeightPercent: 25,
  });
  assert.deepEqual(resolveVelaPaneWeightLayout(100, 2), {
    mainPaneHeightPercent: 60,
    studyPaneHeightPercent: 20,
  });
  const three = resolveVelaPaneWeightLayout(100, 3);
  assert.equal(three.mainPaneHeightPercent, 50);
  assert.ok(Math.abs(three.studyPaneHeightPercent - (100 / 6)) < 1e-12);
});

test("Vela pane weights respect configured top/bottom budgets", () => {
  assert.deepEqual(resolveVelaPaneWeightLayout(90, 1), {
    mainPaneHeightPercent: 67.5,
    studyPaneHeightPercent: 22.5,
  });
  assert.deepEqual(resolveVelaPaneWeightLayout(Number.NaN, 2), {
    mainPaneHeightPercent: 0,
    studyPaneHeightPercent: 0,
  });
});

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

test("Vela-parity volume overlays the price pane and does not create a second grid", () => {
  assert.deepEqual(buildPriceVolumePaneLayout({
    left: 12,
    right: 58,
    showVolume: true,
    timeAxisHeightPx: 28,
  }), {
    grids: [
      { left: 12, right: 58, top: "0%", containLabel: false, bottom: 28, height: "auto" },
    ],
    visibleTimeAxisIndex: 0,
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
      { left: 12, right: 58, top: "0%", height: "auto", containLabel: false, bottom: 28 },
    ],
    visibleTimeAxisIndex: 0,
  });
});
