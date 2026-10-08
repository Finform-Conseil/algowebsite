const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const root = process.cwd();
const selector = fs.readFileSync(
  path.join(root, "components/technical-analysis/components/toolbar/drawing/CursorModeSelector.tsx"),
  "utf8",
);
const styles = fs.readFileSync(path.join(root, "styles/pages/_technical-analysis-final.scss"), "utf8");
const shell = fs.readFileSync(path.join(root, "components/technical-analysis/components/toolbar/floating/FloatingToolbarShell.tsx"), "utf8");
const technicalAnalysis = fs.readFileSync(path.join(root, "components/technical-analysis/TechnicalAnalysis.tsx"), "utf8");
const toolbarButton = fs.readFileSync(path.join(root, "components/technical-analysis/components/toolbar/floating/ToolbarButton.tsx"), "utf8");

test("cursor favorites mirror the observed TradingView favorite toggle contract", () => {
  assert.match(selector, /data-qa-id="preset-menu-favorite-button"/);
  assert.match(selector, /"Add to favorites"/);
  assert.match(selector, /"Remove from favorites"/);
  assert.match(selector, /CURSOR_FAVORITES_STORAGE_KEY/);
  assert.match(selector, /current\.includes\(mode\)[\s\S]*?current\.filter[\s\S]*?\.\.\.current, mode/);
  assert.match(selector, /favoriteModes = React\.useMemo/);
  assert.match(selector, /aria-selected=\{isSelected\}/);
});

test("floating cursor favorites toolbar keeps TradingView behavior with FINFORM visual language", () => {
  assert.match(selector, /FAVORITES_HANDLE_WIDTH = FLOATING_TOOLBAR_DRAG_SLOT_WIDTH_PX/);
  assert.match(selector, /FAVORITES_ITEM_WIDTH = FLOATING_TOOLBAR_BUTTON_SIZE_PX/);
  assert.match(selector, /FAVORITES_TOOLBAR_HEIGHT = FLOATING_TOOLBAR_HEIGHT_PX/);
  assert.match(selector, /data-cursor-favorites-toolbar="true"/);
  assert.match(selector, /data-cursor-favorites-drag="true"/);
  assert.match(selector, /setPointerCapture\(event\.pointerId\)/);
  assert.match(selector, /releasePointerCapture\(event\.pointerId\)/);
  assert.match(selector, /CURSOR_FAVORITES_POSITION_STORAGE_KEY/);
  assert.match(selector, /aria-pressed=\{isSelected\}/);

  assert.match(shell, /export const FloatingToolbarShell/);
  assert.match(shell, /export const FloatingToolbarDragHandle/);
  assert.match(selector, /<FloatingToolbarShell[\s\S]*?gp-cursor-favorites-toolbar/);
  assert.match(technicalAnalysis, /<FloatingToolbarShell[\s\S]*?gp-drawing-quick-toolbar-box/);
  assert.match(toolbarButton, /<FloatingToolbarDragHandle/);
  assert.match(styles, /\.gp-floating-toolbar-shell \{[\s\S]*?min-height: 42px;[\s\S]*?padding: 4px 6px;[\s\S]*?background: var\(--gp-bg-popover\);[\s\S]*?border: 1px solid var\(--gp-border-color-light\);[\s\S]*?border-radius: var\(--gp-radius-sm\)/);
  assert.match(styles, /\.gp-cursor-favorites-item \{[\s\S]*?width: 32px;[\s\S]*?height: 32px/);
  assert.match(styles, /\.gp-cursor-favorites-item \{[\s\S]*?&:focus-visible \{[\s\S]*?outline: none;[\s\S]*?box-shadow: inset 0 0 0 1px rgba\(41, 98, 255, \.45\);/);
  assert.match(styles, /\.gp-cursor-favorites-item \{[\s\S]*?&\.active \{[\s\S]*?color: var\(--gp-accent-blue\);[\s\S]*?background: rgba\(41, 98, 255, \.12\);[\s\S]*?box-shadow: none;/);
  assert.doesNotMatch(styles, /\.gp-cursor-favorites-item \{[\s\S]*?outline: 2px solid #2962ff/);
  assert.doesNotMatch(styles, /\.gp-cursor-favorites-item \{[\s\S]*?box-shadow: inset 0 -2px 0 #2962ff/);
});

test("favorites toolbar is chart-relative, normalized, and cannot escape into FINFORM chrome", () => {
  assert.match(selector, /\.gp-chart-layers-stack/);
  assert.match(selector, /xRatio/);
  assert.match(selector, /yRatio/);
  assert.match(selector, /positionFromPlacement/);
  assert.match(selector, /placementFromPosition/);
  assert.match(selector, /chartRect\.left \+ FAVORITES_CHART_MARGIN/);
  assert.match(selector, /chartRect\.right - width - FAVORITES_CHART_MARGIN/);
  assert.match(selector, /chartRect\.top \+ FAVORITES_CHART_MARGIN/);
  assert.match(selector, /chartRect\.bottom - FAVORITES_TOOLBAR_HEIGHT - FAVORITES_CHART_MARGIN/);
  assert.doesNotMatch(selector, /window\.innerWidth - width/);
  assert.doesNotMatch(selector, /window\.innerHeight - FAVORITES_TOOLBAR_HEIGHT/);
});

test("favorites remain UI preferences while mode selection uses the existing canonical handler", () => {
  assert.match(selector, /onSelectMode\(mode\)/);
  assert.doesNotMatch(selector, /dispatch\(/);
  assert.doesNotMatch(selector, /setCursorMode\(/);
  assert.match(selector, /window\.localStorage\.setItem\(CURSOR_FAVORITES_STORAGE_KEY/);
});
