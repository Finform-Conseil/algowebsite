const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const ROOT = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), "utf8");

const hook = read("components/technical-analysis/hooks/useChartHistory.ts");
const reducer = read("components/technical-analysis/store/reducers/chartHistoryReducers.ts");
const slice = read("components/technical-analysis/store/technicalAnalysisSlice.ts");
const technicalAnalysis = read("components/technical-analysis/TechnicalAnalysis.tsx");
const toolbar = read("components/technical-analysis/components/toolbar/ChartToolbar.tsx");
const shortcuts = read("components/technical-analysis/config/technicalAnalysisShortcuts.ts");

test("global history captures chart-visible state beyond drawings", () => {
  for (const token of [
    "chartConfig",
    "advancedIndicators",
    "indicatorPeriods",
    "bollingerSettings",
    "chartAppearance",
    "pineChartOverlay",
    "comparisonSymbols",
    "comparisonSettings",
    "movingAverageTrendSignals",
    "priceVsSmaMetrics",
    "priceVsEmaMetrics",
    "selectedTimeRange",
  ]) {
    assert.match(reducer, new RegExp(token));
  }
  assert.match(technicalAnalysis, /drawings,/);
  assert.match(technicalAnalysis, /drawingTools:/);
  assert.match(technicalAnalysis, /keepDrawing/);
  assert.match(technicalAnalysis, /magnetMode/);
  assert.match(technicalAnalysis, /snapToIndicators/);
  assert.match(technicalAnalysis, /positionsOrdersHidden/);
  assert.match(technicalAnalysis, /restoreChartHistorySnapshot/);
});

test("structural multi-chart mutations are undoable without viewport churn", () => {
  const layout = read("components/technical-analysis/config/layout/chartHistoryLayout.ts");
  assert.match(reducer, /restoreChartHistoryLayout/);
  assert.match(technicalAnalysis, /snapshotChartHistoryLayout/);
  assert.match(technicalAnalysis, /layout: chartHistoryLayoutSnapshot/);
  assert.match(layout, /viewport: _viewport/);
  assert.match(layout, /viewportById\.get\(cell\.chartId\)/);
  assert.match(layout, /completeMultiChartLayout/);
});

test("history controller truncates redo branches and restores atomically", () => {
  assert.match(hook, /slice\(0, historyIndexRef\.current \+ 1\)/);
  assert.match(hook, /restoreTargetFingerprintRef/);
  assert.match(hook, /flushInteraction\(\)/);
  assert.match(hook, /commitDelayMs/);
  assert.match(hook, /beginInteraction/);
  assert.match(hook, /commitInteraction/);
  assert.match(hook, /flushPendingCommit/);
  assert.match(
    hook,
    /const beginInteraction[\s\S]*flushPendingCommit\(\);[\s\S]*ensureBaseline\(\);/,
  );
  assert.match(hook, /addEventListener\("pointerdown"/);
  assert.match(hook, /historyRef\.current\[historyIndexRef\.current\] = \{/);
  assert.match(hook, /committedAt: current\?\.committedAt/);
  assert.match(hook, /label: current\?\.label/);
  assert.match(hook, /interactionActiveRef\.current \|\| pendingCommitRef\.current !== null/);
  assert.match(hook, /!shouldCommit\) return/);
  assert.match(reducer, /chartAppearancePreview = null/);
});

test("indicator and playbook mutations commit when their new Redux state is observed", () => {
  assert.match(hook, /trackedMutationSignal/);
  assert.match(hook, /previousSignal === trackedMutationSignal/);
  assert.match(hook, /commitEntry\(latestEntryRef\.current\)/);
  assert.match(technicalAnalysis, /chartHistoryTrackedIndicatorMutationSignal/);
  for (const token of [
    "chartConfig.indicators",
    "advancedIndicators",
    "indicatorPeriods",
    "bollingerSettings",
  ]) {
    assert.ok(technicalAnalysis.includes(token), `missing tracked indicator state: ${token}`);
  }
  const trackedSignalBlock = technicalAnalysis.match(
    /const chartHistoryTrackedIndicatorMutationSignal[\s\S]*?\]\);/,
  )?.[0] ?? "";
  assert.doesNotMatch(
    trackedSignalBlock,
    /movingAverageTrendSignals|priceVsSmaMetrics|priceVsEmaMetrics/,
  );
  assert.match(
    technicalAnalysis,
    /trackedMutationSignal: chartHistoryTrackedIndicatorMutationSignal/,
  );
});

test("topbar and keyboard shortcuts use the global chart history", () => {
  assert.match(technicalAnalysis, /useChartHistory\(/);
  assert.match(technicalAnalysis, /canUndo=\{canUndo\}/);
  assert.match(technicalAnalysis, /canRedo=\{canRedo\}/);
  assert.match(technicalAnalysis, /onUndo=\{undo\}/);
  assert.match(technicalAnalysis, /onRedo=\{redo\}/);
  assert.match(technicalAnalysis, /key === "z"/);
  assert.match(technicalAnalysis, /key === "y"/);
  assert.match(toolbar, /disabled=\{!canUndo\}/);
  assert.match(toolbar, /disabled=\{!canRedo\}/);
  assert.match(shortcuts, /Undo chart change/);
  assert.match(shortcuts, /Redo chart change/);
});

test("slice exports the atomic history restore reducer", () => {
  assert.match(slice, /chartHistoryReducers/);
  assert.match(slice, /restoreChartHistorySnapshot/);
});
