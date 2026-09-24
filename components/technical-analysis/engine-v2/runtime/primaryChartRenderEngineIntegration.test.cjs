const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../../../..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

const runtime = read("components/technical-analysis/engine-v2/runtime/usePrimaryChartRenderEngine.ts");
const technicalAnalysis = read("components/technical-analysis/TechnicalAnalysis.tsx");
const footer = read("components/technical-analysis/components/footer/TechnicalAnalysisFooter.tsx");
const velaAdapter = read("components/technical-analysis/engine-v2/react/VelaChartAdapter.tsx");
const velaEngine = read("components/technical-analysis/engine-v2/adapters/VelaChartEngine.ts");

test("primary renderer preference is persistent and fail-safe", () => {
  assert.match(runtime, /ta:primary-chart-render-engine:v1/);
  assert.match(runtime, /\["echarts", "vela"\]/);
  assert.match(runtime, /value === "vela" \? "vela" : "echarts"/);
  assert.match(runtime, /window\.localStorage\.setItem/);
});

test("the real Technical Analysis surface mounts exactly one primary renderer", () => {
  assert.match(technicalAnalysis, /isEChartsPrimaryRenderer && \(/);
  assert.match(technicalAnalysis, /isVelaPrimaryRenderer && !shouldShowPrimaryChartEmptyState/);
  assert.match(technicalAnalysis, /data-engine-adapter="legacy-echarts"/);
  assert.match(technicalAnalysis, /<VelaChartAdapter/);
  assert.match(technicalAnalysis, /\) : isEChartsPrimaryRenderer \? \(/);
  assert.match(technicalAnalysis, /\) : null}/);
});

test("ECharts-only interaction layers never intercept Vela", () => {
  assert.match(technicalAnalysis, /const usesEChartsInteractionLayer = isMultiChartMode \|\| isEChartsPrimaryRenderer/);
  assert.match(technicalAnalysis, /usesEChartsInteractionLayer && \(\s*<>\s*<canvas/s);
  assert.match(technicalAnalysis, /usesEChartsInteractionLayer && <ConnectedPriceAxisOverlay/);
  assert.match(technicalAnalysis, /display: isVelaPrimaryRenderer \? "none" : undefined/);
});

test("footer exposes an explicit ECharts/Vela switch and multi-chart stays ECharts", () => {
  assert.match(footer, /Moteur de rendu du graphique/);
  assert.match(footer, /\["echarts", "vela"\]/);
  assert.match(technicalAnalysis, /renderEngine=\{isMultiChartMode \? "echarts" : primaryChartRenderEngine\}/);
  assert.match(technicalAnalysis, /renderEngineSwitchDisabled=\{isMultiChartMode\}/);
});

test("Vela is a real native interactive renderer with lifecycle-safe updates", () => {
  assert.match(velaAdapter, /engineRef = useRef<VelaChartEngine \| null>/);
  assert.match(velaAdapter, /engine\.setBars\(bars\)/);
  assert.match(velaAdapter, /data-vela-status=\{status\}/);
  assert.match(velaEngine, /priceStyle: "candles"/);
  assert.match(velaEngine, /drawings: true/);
  assert.match(velaEngine, /currentPriceLine: true/);
});
