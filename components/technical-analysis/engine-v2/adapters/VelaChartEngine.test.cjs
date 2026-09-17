const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const test = require("node:test");
const assert = require("node:assert/strict");
const ts = require("typescript");

const root = process.cwd();
const originalTsLoader = require.extensions[".ts"];
require.extensions[".ts"] = (mod, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: filename,
  }).outputText;
  mod._compile(compiled, filename);
};

const sourcePath = path.join(root, "components/technical-analysis/engine-v2/adapters/VelaChartEngine.ts");
delete require.cache[sourcePath];
const { VelaChartEngine, VELA_INTERACTION_CAPABILITIES } = require(sourcePath);

const makeHarness = () => {
  const calls = [];
  let viewportHandler = null;
  let visibleRange = { from: 1_000, to: 2_000 };
  const renderer = {
    supports(feature) {
      calls.push(["renderer.supports", feature]);
      return feature === "currentPriceLine";
    },
    set(feature, value) {
      calls.push(["renderer.set", feature, value]);
      return renderer;
    },
  };
  const chart = {
    renderer,
    async ready() { calls.push(["ready"]); },
    async setMarket(next) { calls.push(["setMarket", next]); },
    resize() { calls.push(["resize"]); },
    destroy() { calls.push(["destroy"]); },
    panBy(fraction) { calls.push(["panBy", fraction]); return chart; },
    getVisibleRange() { calls.push(["getVisibleRange"]); return visibleRange; },
    setVisibleRange(range) { calls.push(["setVisibleRange", range]); visibleRange = range; return chart; },
    setVisibleRangePreset(preset) { calls.push(["setVisibleRangePreset", preset]); return chart; },
    on(event, handler) {
      calls.push(["on", event]);
      if (event === "viewport:changed") viewportHandler = handler;
      return () => { calls.push(["unsubscribe", event]); viewportHandler = null; };
    },
  };
  const createChart = async (container, options) => {
    calls.push(["create", container, options]);
    return chart;
  };
  return {
    calls,
    chart,
    createChart,
    emitViewport(range) { viewportHandler?.(range); },
  };
};

const bars = [{
  time: "2026-01-01T00:00:00.000Z",
  open: 10,
  high: 12,
  low: 9,
  close: 11,
  volume: 100,
}];

test("interaction capabilities describe only supported public/native seams", () => {
  assert.deepEqual(VELA_INTERACTION_CAPABILITIES, {
    dragPan: true,
    wheelZoom: true,
    crosshair: true,
    resize: true,
    nativePriceAutoscale: true,
    programmaticPriceAutoscale: false,
    currentPriceLine: true,
    programmaticPan: true,
    visibleRange: true,
    fitAll: true,
  });
  assert.equal(Object.isFrozen(VELA_INTERACTION_CAPABILITIES), true);
});

test("mount enables Vela native navigation/autoscale and wires viewport events", async () => {
  const harness = makeHarness();
  const engine = new VelaChartEngine(harness.createChart);
  const received = [];
  const unsubscribe = engine.onViewportChange((range) => received.push(range));
  const container = {};

  await engine.mount(container, bars, { symbol: "BENCH", timeframe: "1D", backend: "canvas2d" });

  const createCall = harness.calls.find(([name]) => name === "create");
  assert.ok(createCall);
  assert.equal(createCall[1], container);
  assert.deepEqual(createCall[2].animations, { zoom: true, pan: true, scroll: true, autoscale: true, liveBar: false });
  assert.equal(createCall[2].currentPriceLine, true);
  assert.equal(createCall[2].drawings, false);
  assert.ok(harness.calls.some(([name, event]) => name === "on" && event === "viewport:changed"));

  harness.emitViewport({ from: 3_000, to: 4_000 });
  assert.deepEqual(received, [{ from: 3_000, to: 4_000 }]);
  unsubscribe();
});

test("public interaction controls delegate without exposing renderer internals", async () => {
  const harness = makeHarness();
  const engine = new VelaChartEngine(harness.createChart);
  await engine.mount({}, bars, { symbol: "BENCH", timeframe: "1D", backend: "webgl2" });

  assert.deepEqual(engine.getVisibleRange(), { from: 1_000, to: 2_000 });
  engine.setVisibleRange({ from: 5_000, to: 7_000 });
  engine.panBy(-0.25);
  engine.fitAll();
  engine.setCurrentPriceLineVisible(false);
  engine.resize();

  assert.ok(harness.calls.some(([name, range]) => name === "setVisibleRange" && range.from === 5_000 && range.to === 7_000));
  assert.ok(harness.calls.some(([name, fraction]) => name === "panBy" && fraction === -0.25));
  assert.ok(harness.calls.some(([name, preset]) => name === "setVisibleRangePreset" && preset === "ALL"));
  assert.ok(harness.calls.some(([name, feature, value]) => name === "renderer.set" && feature === "currentPriceLine" && value === false));
  assert.ok(harness.calls.some(([name]) => name === "resize"));
});

test("invalid interaction commands fail closed", async () => {
  const harness = makeHarness();
  const engine = new VelaChartEngine(harness.createChart);
  await engine.mount({}, bars, { symbol: "BENCH", timeframe: "1D", backend: "canvas2d" });

  assert.throws(() => engine.panBy(Number.NaN), /finite/);
  assert.throws(() => engine.setVisibleRange({ from: 7_000, to: 5_000 }), /visible range/);
  assert.throws(() => engine.setVisibleRange({ from: Number.NaN, to: 5_000 }), /visible range/);
});

test.after(() => {
  if (originalTsLoader) require.extensions[".ts"] = originalTsLoader;
  else delete require.extensions[".ts"];
});
