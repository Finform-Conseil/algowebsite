const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const test = require("node:test");
const assert = require("node:assert/strict");
const ts = require("typescript");

const root = process.cwd();
const sourcePath = path.join(root, "components/technical-analysis/engine-v2/benchmark/benchmarkScenario.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
  fileName: sourcePath,
}).outputText;

const loadedModule = new Module(sourcePath, module);
loadedModule.filename = sourcePath;
loadedModule.paths = Module._nodeModulePaths(path.dirname(sourcePath));
loadedModule._compile(compiled, sourcePath);

const {
  DEFAULT_BENCHMARK_SCENARIO,
  parseBenchmarkScenario,
  benchmarkScenarioSearchParams,
} = loadedModule.exports;

test("benchmark defaults are deliberately light and deterministic", () => {
  assert.deepEqual(parseBenchmarkScenario({}), {
    engine: "legacy-echarts",
    chartCount: 1,
    loadSize: 1_000,
  });
  assert.deepEqual(DEFAULT_BENCHMARK_SCENARIO, {
    engine: "legacy-echarts",
    chartCount: 1,
    loadSize: 1_000,
  });
});

test("benchmark scenario accepts each supported engine and heavy explicit tiers", () => {
  assert.deepEqual(parseBenchmarkScenario({ engine: "vela-canvas2d", charts: "2", bars: "10000" }), {
    engine: "vela-canvas2d",
    chartCount: 2,
    loadSize: 10_000,
  });
  assert.deepEqual(parseBenchmarkScenario({ engine: "vela-webgl2", charts: "4", bars: "100000" }), {
    engine: "vela-webgl2",
    chartCount: 4,
    loadSize: 100_000,
  });
});

test("invalid or ambiguous benchmark inputs fail closed to the safe defaults", () => {
  assert.deepEqual(parseBenchmarkScenario({ engine: "unknown", charts: "3", bars: "999999" }), {
    engine: "legacy-echarts",
    chartCount: 1,
    loadSize: 1_000,
  });
  assert.deepEqual(parseBenchmarkScenario({ engine: [], charts: [], bars: [] }), {
    engine: "legacy-echarts",
    chartCount: 1,
    loadSize: 1_000,
  });
});

test("repeated query values are deterministic and serializer emits canonical keys", () => {
  assert.deepEqual(parseBenchmarkScenario({
    engine: ["vela-canvas2d", "legacy-echarts"],
    charts: ["2", "4"],
    bars: ["50000", "1000"],
  }), {
    engine: "vela-canvas2d",
    chartCount: 2,
    loadSize: 50_000,
  });
  assert.equal(
    benchmarkScenarioSearchParams({ engine: "vela-webgl2", chartCount: 4, loadSize: 100_000 }).toString(),
    "engine=vela-webgl2&charts=4&bars=100000",
  );
});
