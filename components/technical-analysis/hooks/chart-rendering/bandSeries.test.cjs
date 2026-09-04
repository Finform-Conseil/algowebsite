const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

require.extensions[".ts"] = function compileTypeScript(module, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  module._compile(transpiled.outputText, filename);
};

const { buildBandFillData, renderBandPolygon } = require(path.join(__dirname, "bandSeries.ts"));

test("band fill data connects adjacent upper/lower samples", () => {
  assert.deepEqual(
    buildBandFillData([10, 12, 14], [4, 5, 6]),
    [
      [1, 12, 5, 10, 4],
      [2, 14, 6, 12, 5],
    ],
  );
});

test("band polygon uses literal ECharts style without deprecated api.style", () => {
  const values = [2, 14, 6, 12, 5];
  const api = {
    value: (dimension) => values[dimension],
    coord: ([x, y]) => [Number(x) * 10, Number(y) * 2],
  };

  assert.deepEqual(renderBandPolygon(api, "rgba(33, 150, 243, 0.1)"), {
    type: "polygon",
    shape: {
      points: [
        [10, 24],
        [20, 28],
        [20, 12],
        [10, 10],
      ],
    },
    style: { fill: "rgba(33, 150, 243, 0.1)" },
  });
});

test("band polygon fails closed when a coordinate value is not finite", () => {
  const api = {
    value: (dimension) => (dimension === 1 ? Number.NaN : 1),
    coord: ([x, y]) => [Number(x), Number(y)],
  };

  assert.equal(renderBandPolygon(api, "#fff"), undefined);
});

test("custom renderers do not call the removed ECharts api.style helper", () => {
  const rendererSource = fs.readFileSync(
    path.join(__dirname, "../useEChartsRenderer.ts"),
    "utf8",
  );
  assert.doesNotMatch(rendererSource, /api\.style\s*\(/);
});
