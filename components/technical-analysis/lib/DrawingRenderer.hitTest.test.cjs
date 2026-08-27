const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const ts = require("typescript");

const sourcePath = path.join(__dirname, "DrawingRenderer.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
  fileName: sourcePath,
}).outputText;

let activeStrategy = null;
const runtimeModule = new Module(sourcePath, module);
runtimeModule.filename = sourcePath;
runtimeModule.paths = module.paths;
runtimeModule.require = (request) => {
  if (request === "./strategies/DrawingStrategyRegistry") {
    return {
      drawingStrategyRegistry: {
        getStrategy: () => activeStrategy,
      },
    };
  }
  if (request === "./utils/sanitize") {
    return { sanitizeCanvasText: (value) => String(value ?? "") };
  }
  return module.require(request);
};
runtimeModule._compile(transpiled, sourcePath);

const { DrawingRenderer } = runtimeModule.exports;

const renderer = new DrawingRenderer({});
const drawing = {
  id: "layout-race-line",
  type: "line",
  hidden: false,
  points: [{ time: "2026-08-27", value: 100 }],
};

const makeChart = (convertToPixel, overrides = {}) => ({
  isDisposed: () => false,
  getDom: () => ({ isConnected: true }),
  getWidth: () => 900,
  getHeight: () => 600,
  convertToPixel,
  ...overrides,
});

test("hitTest keeps normal strategy results on a healthy chart", () => {
  activeStrategy = {
    hitTest: () => ({ isHit: true, hitType: "shape" }),
  };
  const chart = makeChart(() => [120, 240]);

  assert.deepEqual(renderer.hitTest(120, 240, drawing, chart, 15), {
    isHit: true,
    hitType: "shape",
  });
});

test("hitTest skips strategies when the chart instance is already being disposed", () => {
  let strategyCalls = 0;
  activeStrategy = {
    hitTest: () => {
      strategyCalls += 1;
      return { isHit: true, hitType: "shape" };
    },
  };
  const chart = makeChart(() => [120, 240], { isDisposed: () => true });

  assert.deepEqual(renderer.hitTest(120, 240, drawing, chart, 15), {
    isHit: false,
    hitType: null,
  });
  assert.equal(strategyCalls, 0);
});

test("hitTest absorbs only the transient ECharts coordinate-system teardown race", () => {
  let projectionCalls = 0;
  const chart = makeChart(() => {
    projectionCalls += 1;
    throw new TypeError("Cannot read properties of undefined (reading 'queryComponents')");
  });
  activeStrategy = {
    hitTest: (_mx, _my, _drawing, strategyChart) => {
      strategyChart.convertToPixel({ seriesIndex: 0 }, ["2026-08-27", 100]);
      return { isHit: true, hitType: "shape" };
    },
  };

  assert.deepEqual(renderer.hitTest(120, 240, drawing, chart, 15), {
    isHit: false,
    hitType: null,
  });
  assert.equal(projectionCalls, 2);
});

test("hitTest rethrows genuine strategy failures while chart projection remains healthy", () => {
  const chart = makeChart(() => [120, 240]);
  activeStrategy = {
    hitTest: () => {
      throw new Error("strategy invariant violated");
    },
  };

  assert.throws(
    () => renderer.hitTest(120, 240, drawing, chart, 15),
    /strategy invariant violated/,
  );
});
