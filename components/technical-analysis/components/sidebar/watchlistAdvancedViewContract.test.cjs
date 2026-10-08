const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const root = process.cwd();
const sidebar = fs.readFileSync(
  path.join(root, "components/technical-analysis/components/sidebar/TechnicalAnalysisSidebarContent.tsx"),
  "utf8",
);
const panel = fs.readFileSync(
  path.join(root, "components/technical-analysis/components/sidebar/panels/WatchlistPanel.tsx"),
  "utf8",
);
const modal = fs.readFileSync(
  path.join(root, "components/technical-analysis/components/sidebar/modals/WatchlistAdvancedModal.tsx"),
  "utf8",
);

test("Watchlist advanced button no longer opens the ticker selector", () => {
  assert.match(sidebar, /onAdvancedView=\{\(\) => setIsWatchlistAdvancedOpen\(true\)\}/);
  assert.doesNotMatch(sidebar, /onAdvancedView=\{\(\) => props\.openTickerSelector/);
  assert.match(panel, /aria-label="Vue avancée de la liste de surveillance"/);
});

test("Watchlist advanced modal stays contextual to watched market data", () => {
  assert.match(modal, /title="Vue avancée de la liste de surveillance"/);
  assert.match(modal, /Instrument surveillé/);
  assert.match(modal, /Indices BRVM/);
  assert.match(modal, /livePrice/);
  assert.match(modal, /liveChangePercent/);
  assert.match(modal, /liveVolume/);
  assert.match(modal, /indicesData/);
});
