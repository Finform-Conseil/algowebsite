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

const {
  resolveStableVolumeAxisMax,
  resolveVisibleVolumeOverlayAxisMax,
  VELA_VOLUME_OVERLAY_HEIGHT_FRAC,
  VELA_VOLUME_FILL_ALPHA,
  VELA_VOLUME_BAR_WIDTH_RATIO,
} = loadedModule.exports;

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

test("Vela native Volume geometry constants stay exact", () => {
  assert.equal(VELA_VOLUME_OVERLAY_HEIGHT_FRAC, 0.20);
  assert.equal(VELA_VOLUME_FILL_ALPHA, 0.5);
  assert.equal(VELA_VOLUME_BAR_WIDTH_RATIO, 0.7);
});

test("visible volume normalization makes the tallest visible bar occupy 20% of price pane", () => {
  const bars = [
    { volume: 10 },
    { volume: 20 },
    { volume: 300 },
    { volume: 40 },
    { volume: 50 },
  ];
  assert.equal(resolveVisibleVolumeOverlayAxisMax(bars, 0, 1), 100);
  assert.equal(resolveVisibleVolumeOverlayAxisMax(bars, 2, 4), 1500);
  assert.equal(resolveVisibleVolumeOverlayAxisMax(bars, 3.2, 4.8), 250);
});
