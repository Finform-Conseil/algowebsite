const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const ta = read("components/technical-analysis/TechnicalAnalysis.tsx");
const marketData = read("components/technical-analysis/hooks/MarketData/useMarketData.ts");
const toolbar = read("components/technical-analysis/components/toolbar/ChartToolbar.tsx");
const replayControls = read("components/technical-analysis/components/chart/ReplayControls.tsx");
const actions = read("components/technical-analysis/hooks/useTechnicalAnalysisActions.ts");
const persistence = read("components/technical-analysis/hooks/drawing/drawingPersistence.ts");
const snapshot = read("components/technical-analysis/lib/chart/chartSnapshot.ts");
const sidebar = read("components/technical-analysis/components/sidebar/TechnicalAnalysisSidebarContent.tsx");
const styles = read("styles/pages/_technical-analysis-final.scss");

test("Bar Replay follows select-start, paused start, exact forward, realtime and exit contracts", () => {
  assert.match(toolbar, /!isMultiChartMode[\s\S]*?onClick=\{onReplayRequest\}/);
  assert.match(ta, /data-replay-selecting=\{isReplaySelectingStart \? "true" : "false"\}/);
  assert.match(ta, /resolvePixelPointerIndex\([\s\S]*?activeDisplayChartData/);
  assert.match(ta, /marketData\.startReplay\(String\(activeDisplayChartData\[index\]\.time\)\)/);
  assert.match(marketData, /replayOriginalData\.current = source/);
  assert.match(marketData, /dispatch\(setReplayPaused\(true\)\)/);
  assert.match(marketData, /const stepReplay[\s\S]*?applyReplayIndex\(replayIndex\.current \+ direction\)/);
  assert.match(marketData, /const jumpReplayToRealtime[\s\S]*?applyReplayIndex\(replayOriginalData\.current\.length - 1\)/);
  assert.match(marketData, /const stopReplay[\s\S]*?setChartData\(source\)/);
  assert.match(replayControls, /aria-label="Avancer d'une bougie"/);
  assert.match(replayControls, /onJumpToRealtime/);
  assert.match(replayControls, /onExit/);
});

test("IndexedDB save is durable, versioned and restores the full chart workspace without false success", () => {
  assert.match(persistence, /export const idbSetStrict/);
  assert.match(persistence, /tx\.oncomplete = \(\) => resolve\(\)/);
  assert.match(persistence, /tx\.onabort = \(\) => reject/);
  assert.match(actions, /version: 2/);
  for (const key of [
    "indicatorPeriods",
    "bollingerSettings",
    "chartAppearance",
    "multiChartLayout",
    "comparisonSymbols",
    "comparisonSettings",
    "activeMarket",
    "timeRange",
  ]) assert.match(actions, new RegExp(`${key}`));
  assert.match(actions, /await idbSetStrict\("savedAnalyses", next\)/);
  assert.match(actions, /const persisted = await idbGetStrict<SavedAnalysis\[]>\("savedAnalyses"\)/);
  assert.match(actions, /IndexedDB durability verification failed/);
  assert.match(actions, /volumeVisible: config\.indicators\.volumeVisible \?\? true/);
  assert.match(actions, /dispatch\(setTimeRange\(config\.timeRange\)\)/);
  assert.doesNotMatch(actions, /setTimeframe\(config\.timeRange\)/);
});

test("Zen mode is an internal full-viewport focus mode and does not depend on browser fullscreen API", () => {
  assert.match(ta, /event\.shiftKey[\s\S]*?event\.key\.toLowerCase\(\) === "f"/);
  assert.match(ta, /event\.key === "Escape"[\s\S]*?dispatch\(setZenMode\(false\)\)/);
  assert.doesNotMatch(ta, /requestFullscreen\(|exitFullscreen\(/);
  assert.match(styles, /\.technical-analysis-root\.is-zen-mode \{[\s\S]*?position: fixed !important;[\s\S]*?inset: 0 !important;/);
  assert.match(styles, /\.gp-horizontal-toolbar,[\s\S]*?\.gp-sidebar-shell,[\s\S]*?\.gp-chart-footer[\s\S]*?display: none !important;/);
  assert.match(ta, /Mode Zen · Échap ou Shift\+F pour afficher les panneaux/);
});

test("Snapshot menu exports the real chart canvas layers and exposes TradingView-like local actions", () => {
  assert.match(toolbar, /Télécharger l'image/);
  assert.match(toolbar, /Copier l'image/);
  assert.match(toolbar, /Ouvrir dans un nouvel onglet/);
  assert.match(toolbar, /Ctrl\+Alt\+S/);
  assert.match(toolbar, /Ctrl\+Shift\+S/);
  assert.match(snapshot, /container\.querySelectorAll\("canvas"\)/);
  assert.match(snapshot, /context\.drawImage\(canvas/);
  assert.match(snapshot, /navigator\.clipboard\?\.write/);
  assert.match(snapshot, /URL\.createObjectURL\(blob\)/);
  assert.match(ta, /dispatch\(setCapturing\(true\)\)/);
  assert.match(ta, /captureCurrentChart\(\)/);
});

test("More Options reopens a collapsed sidebar before routing to its destination", () => {
  assert.match(sidebar, /root\?\.classList\.remove\("sidebar-closed"\)/);
  assert.match(sidebar, /sidebar\?\.classList\.remove\("sidebar-closed"\)/);
  assert.match(sidebar, /handleRailSelect\(destination === "calendar" \? "calendar" : "watchlist"\)/);
  assert.match(sidebar, /scrollIntoView\(\{ behavior: "smooth", block: "start" \}\)/);
});
