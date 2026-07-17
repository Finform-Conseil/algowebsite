/* eslint-env node */
/*
 * REAL integration test for the Flag mark selection pipeline.
 *
 * This test imports the ACTUAL production modules:
 *   - SpatialHashGrid        (components/technical-analysis/hooks/drawing/drawingSpatialIndex.ts)
 *   - FlagMarkStrategy       (components/technical-analysis/lib/strategies/implementations/FlagMarkStrategy.ts)
 *   - safeConvertToPixel     (components/technical-analysis/hooks/drawing/drawingCoordinates.ts)
 *
 * It compiles the TS sources in-memory with @swc (no ts-node/tsx needed) so the
 * genuine production hit-test and spatial-index code is executed against a
 * controllable fake ECharts instance — not reimplemented logic.
 */
const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");

// --- Minimal in-memory TS loader (TypeScript compiler API) ----------------
const ts = require("typescript");
const ROOT = path.resolve(__dirname, "..", "..", "..", "..", "..");

const TS_CACHE = new Map();

function compileTs(absPath) {
  if (TS_CACHE.has(absPath)) return TS_CACHE.get(absPath);
  const src = fs.readFileSync(absPath, "utf8");
  const { outputText } = ts.transpileModule(src, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      allowJs: true,
    },
  });
  TS_CACHE.set(absPath, outputText);
  return outputText;
}

function makeRequire(fromFile) {
  const requireImpl = (request) => {
    if (request === "echarts/core" || request === "react" || request === "react-dom") {
      return {};
    }
    const isTsPath = request.startsWith("/") || request.startsWith(".");
    if (isTsPath) {
      let resolved = request.startsWith(".") ? path.resolve(path.dirname(fromFile), request) : request;
      if (!resolved.endsWith(".ts") && !resolved.endsWith(".js")) resolved += ".ts";
      const code = compileTs(resolved);
      const module = { exports: {} };
      const localRequire = makeRequire(resolved);
      const fn = new Function("require", "module", "exports", "__dirname", "console", code);
      fn(localRequire, module, module.exports, path.dirname(resolved), console);
      return module.exports;
    }
    return require(request);
  };
  return requireImpl;
}

// --- Fake ECharts instance -------------------------------------------------
// convertToPixel maps the flag's anchor [time, value] -> [anchorX, anchorY] in
// the SAME CSS-pixel space used by handlePointerDown (e.clientX - rect.left).
function makeFakeChart(anchorX, anchorY, anchorTime, anchorValue) {
  return {
    isDisposed: () => false,
    getDom: () => ({ isConnected: true, style: {} }),
    getWidth: () => 1118,
    getHeight: () => 558,
    convertToPixel: (_opts, point) => {
      const [t, v] = point;
      if (t === anchorTime && v === anchorValue) return [anchorX, anchorY];
      return [anchorX, anchorY];
    },
    convertFromPixel: (_opts, px) => [anchorTime, px[1]],
  };
}

// --- Load real production modules -----------------------------------------
const drawingCoordsPath = path.join(
  ROOT,
  "components/technical-analysis/hooks/drawing/drawingCoordinates.ts"
);
const spatialIndexPath = path.join(
  ROOT,
  "components/technical-analysis/hooks/drawing/drawingSpatialIndex.ts"
);
const strategyPath = path.join(
  ROOT,
  "components/technical-analysis/lib/strategies/implementations/FlagMarkStrategy.ts"
);

const drawingCoordinates = makeRequire(drawingCoordsPath)(drawingCoordsPath);
const { SpatialHashGrid } = makeRequire(spatialIndexPath)(spatialIndexPath);
const { FlagMarkStrategy } = makeRequire(strategyPath)(strategyPath);

const FLAG_TOTAL_WIDTH = 19;
const MAST_LENGTH = 20;
const FLAG_DEFAULT_COLOR = "#2962FF";

function makeFlagMark(id, time, value, flagColor = FLAG_DEFAULT_COLOR) {
  return {
    id,
    type: "flag_mark",
    points: [{ time, value }],
    style: { color: "#787b86", lineWidth: 1 },
    flagMarkProps: { flagColor },
    hidden: false,
    locked: false,
  };
}

test("REAL FlagMarkStrategy.hitTest returns isHit inside the flag body", () => {
  const anchorX = 100;
  const anchorY = 200;
  const chart = makeFakeChart(anchorX, anchorY, "2024-01-01", 1500);
  const strategy = new FlagMarkStrategy();
  const drawing = makeFlagMark("f1", "2024-01-01", 1500);

  // Click center of the flag body.
  const cx = anchorX + FLAG_TOTAL_WIDTH / 2;
  const cy = anchorY - MAST_LENGTH / 2;
  const res = strategy.hitTest(cx, cy, drawing, chart, 0);
  assert.equal(res.isHit, true, "center of flag body must hit");
  assert.equal(res.hitType, "shape");
});

test("REAL FlagMarkStrategy.hitTest returns isHit on the anchor (base of mast)", () => {
  const anchorX = 100;
  const anchorY = 200;
  const chart = makeFakeChart(anchorX, anchorY, "2024-01-01", 1500);
  const strategy = new FlagMarkStrategy();
  const drawing = makeFlagMark("f1", "2024-01-01", 1500);

  const res = strategy.hitTest(anchorX, anchorY, drawing, chart, 0);
  assert.equal(res.isHit, true, "anchor (base of mast) must hit");
});

test("REAL SpatialHashGrid contains the flag mark after build (Case A)", () => {
  const anchorX = 100;
  const anchorY = 200;
  const chart = makeFakeChart(anchorX, anchorY, "2024-01-01", 1500);
  const grid = new SpatialHashGrid();
  const drawing = makeFlagMark("f1", "2024-01-01", 1500);
  grid.build([drawing], chart);

  // Query at the flag body center.
  const cx = anchorX + FLAG_TOTAL_WIDTH / 2;
  const cy = anchorY - MAST_LENGTH / 2;
  const candidates = grid.query(cx, cy);
  const ids = candidates.map((c) => c.id);
  assert.ok(ids.includes("f1"), `flag mark must be a spatial candidate, got: ${JSON.stringify(ids)}`);
});

test("REAL SpatialHashGrid + FlagMarkStrategy end-to-end selection (Case A + B)", () => {
  const anchorX = 100;
  const anchorY = 200;
  const chart = makeFakeChart(anchorX, anchorY, "2024-01-01", 1500);
  const grid = new SpatialHashGrid();
  const drawing = makeFlagMark("f1", "2024-01-01", 1500);
  grid.build([drawing], chart);

  const strategy = new FlagMarkStrategy();
  const cx = anchorX + FLAG_TOTAL_WIDTH / 2;
  const cy = anchorY - MAST_LENGTH / 2;

  // This is exactly what DrawingRenderer.hitTest does: query then strategy.hitTest.
  const candidates = grid.query(cx, cy);
  assert.ok(candidates.length > 0, "candidate found in spatial grid");
  let selected = null;
  for (const d of candidates) {
    const r = strategy.hitTest(cx, cy, d, chart, 15);
    if (r.isHit) {
      selected = d.id;
      break;
    }
  }
  assert.equal(selected, "f1", "flag mark should be selected via real pipeline");
});

test("REAL SpatialHashGrid excludes flag mark far outside the query point", () => {
  const anchorX = 100;
  const anchorY = 200;
  const chart = makeFakeChart(anchorX, anchorY, "2024-01-01", 1500);
  const grid = new SpatialHashGrid();
  const drawing = makeFlagMark("f1", "2024-01-01", 1500);
  grid.build([drawing], chart);

  // Click 500px away — no candidate.
  const candidates = grid.query(anchorX + 500, anchorY);
  const ids = candidates.map((c) => c.id);
  assert.ok(!ids.includes("f1"), "flag mark must NOT be a candidate far away");
});

test("REAL hitTest after flagColor mutation still hits (style does not break selection)", () => {
  const anchorX = 100;
  const anchorY = 200;
  const chart = makeFakeChart(anchorX, anchorY, "2024-01-01", 1500);
  const strategy = new FlagMarkStrategy();

  // Simulate the updateDrawing merge used by FlagColorPopup.
  const original = makeFlagMark("f1", "2024-01-01", 1500);
  const merged = { ...original, flagMarkProps: { ...original.flagMarkProps, flagColor: "#FF0000" } };

  const cx = anchorX + FLAG_TOTAL_WIDTH / 2;
  const cy = anchorY - MAST_LENGTH / 2;
  const before = strategy.hitTest(cx, cy, original, chart, 0);
  const after = strategy.hitTest(cx, cy, merged, chart, 0);
  assert.equal(before.isHit, true);
  assert.equal(after.isHit, true, "hit-test must survive a flagColor mutation (points preserved)");
});

test("REAL safeConvertToPixel returns the anchor pixel used by both grid and hitTest", () => {
  const anchorX = 100;
  const anchorY = 200;
  const chart = makeFakeChart(anchorX, anchorY, "2024-01-01", 1500);
  const pix = drawingCoordinates.safeConvertToPixel(chart, ["2024-01-01", 1500]);
  assert.deepEqual(pix, [anchorX, anchorY], "anchor pixel must match spatial grid + hitTest space");
});
