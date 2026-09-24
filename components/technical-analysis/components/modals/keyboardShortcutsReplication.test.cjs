const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../../../..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const technicalAnalysis = read("components/technical-analysis/TechnicalAnalysis.tsx");
const toolbar = read("components/technical-analysis/components/toolbar/ChartToolbar.tsx");
const modal = read("components/technical-analysis/components/modals/KeyboardShortcutsModal.tsx");
const shortcuts = read("components/technical-analysis/config/technicalAnalysisShortcuts.ts");

test("profile menu opens the real keyboard-shortcuts surface", () => {
  assert.ok(toolbar.includes("onOpenKeyboardShortcuts()"));
  assert.ok(toolbar.includes("Ctrl + /"));
  assert.ok(technicalAnalysis.includes("<KeyboardShortcutsModal"));
  assert.ok(technicalAnalysis.includes("onOpenKeyboardShortcuts={openKeyboardShortcuts}"));
});

test("Ctrl+Slash is captured before bare slash and closes competing Redux modals", () => {
  assert.ok(technicalAnalysis.includes('event.code === "Slash"'));
  assert.ok(technicalAnalysis.includes('document.addEventListener("keydown", handleWorkspaceShortcut, true)'));
  assert.ok(technicalAnalysis.includes("dispatch(closeAllModals())"));
  const helpIndex = technicalAnalysis.indexOf("isKeyboardHelpShortcut");
  const bareSlashIndex = technicalAnalysis.indexOf('noModifiers && event.key === "/"');
  assert.ok(helpIndex >= 0 && bareSlashIndex > helpIndex);
});

test("every displayed shortcut belongs to the functional FINFORM registry", () => {
  for (const expected of [
    'id: "help"', 'id: "symbol-search"', 'id: "indicators"', 'id: "data-window"',
    'id: "analysis-history"', 'id: "pan-left"', 'id: "pan-right"', 'id: "zoom-in"',
    'id: "zoom-out"', 'id: "reset-view"', 'id: "undo"', 'id: "redo"',
    'id: "fullscreen"', 'id: "snapshot-download"', 'id: "snapshot-copy"',
    'id: "trendline"', 'id: "horizontal-line"', 'id: "horizontal-ray"',
    'id: "vertical-line"', 'id: "crossline"', 'id: "fib-retracement"',
    'id: "rectangle"', 'id: "text-note"', 'id: "measure"', 'id: "remove-drawing"',
    'id: "hide-drawings"', 'id: "buy-stop"', 'id: "sell-limit"',
    'id: "generic-order"', 'id: "add-alert"'
  ]) {
    assert.ok(shortcuts.includes(expected), "missing shortcut registry entry " + expected);
  }
  assert.ok(modal.includes("TECHNICAL_ANALYSIS_SHORTCUTS.filter"));
  assert.ok(modal.includes("data-shortcut-id={shortcut.id}"));
});

test("TradingView-style search and accordion remain interactive and reset cleanly", () => {
  assert.ok(modal.includes('type="search"'));
  assert.ok(modal.includes("aria-expanded={isExpanded}"));
  assert.ok(modal.includes("toggleCategory(category.id)"));
  assert.ok(modal.includes('setQuery("")'));
  assert.ok(modal.includes('setExpanded(new Set(["chart"]))'));
});
