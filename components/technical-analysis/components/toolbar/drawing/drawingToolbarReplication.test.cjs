const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

const footer = read("components/technical-analysis/components/toolbar/drawing/DrawingToolbarFooter.tsx");
const toolbar = read("components/technical-analysis/components/toolbar/VerticalDrawingToolbar.tsx");
const manager = read("components/technical-analysis/hooks/useDrawingManager.ts");
const technicalAnalysis = read("components/technical-analysis/TechnicalAnalysis.tsx");
const chartToolbar = read("components/technical-analysis/components/toolbar/ChartToolbar.tsx");
const toolMemory = read("components/technical-analysis/components/toolbar/drawing/drawingToolMemory.ts");
const menuState = read("components/technical-analysis/components/toolbar/drawing/drawingToolbarMenuState.ts");
const iconPicker = read("components/technical-analysis/components/toolbar/drawing/DrawingIconPicker.tsx");
const iconPickerData = read("components/technical-analysis/components/toolbar/drawing/drawingIconPickerData.ts");
const styles = read("styles/pages/_technical-analysis-final.scss");

test("vertical drawing toolbar density and short-height responsiveness are TradingView-like", () => {
  assert.match(styles, /\.gp-toolbar-scroll-container \{[\s\S]*?flex: 0 1 auto;[\s\S]*?gap: 2px;/);
  assert.match(styles, /\.gp-toolbar-footer \{[\s\S]*?gap: 2px;[\s\S]*?padding-top: 2px;/);
  assert.match(styles, /\.gp-vertical-toolbar \.gp-toolbar-divider \{[\s\S]*?height: 1px;[\s\S]*?margin: 4px 0;/);
  assert.match(styles, /> i\.bi \{[\s\S]*?width: var\(--gp-icon-size-md\);[\s\S]*?height: var\(--gp-icon-size-md\);/);
  assert.match(styles, /@media \(max-height: 760px\) and \(min-width: 769px\)/);
  assert.match(styles, /overflow-y: auto;[\s\S]*?overscroll-behavior: contain;/);
  assert.doesNotMatch(styles, /filter: drop-shadow\(0 0 4px rgba\(41,98,255,.8\)\)/);
});

test("vertical drawing toolbar skeleton is one uninterrupted column matching visible controls", () => {
  const overlayStart = toolbar.indexOf("const DRAWING_TOOLBAR_VISIBLE_ITEM_COUNT");
  const overlayEnd = toolbar.indexOf("export const VerticalDrawingToolbar");
  const overlay = toolbar.slice(overlayStart, overlayEnd);

  assert.match(overlay, /DRAWING_TOOLBAR_VISIBLE_ITEM_COUNT = 15/);
  assert.match(overlay, /Array\.from\(\{ length: DRAWING_TOOLBAR_VISIBLE_ITEM_COUNT \}/);
  assert.doesNotMatch(overlay, /footer-/);
  assert.doesNotMatch(overlay, /borderTop:/);
  assert.doesNotMatch(overlay, /flex:\s*1/);
});

test("TradingView lower drawing toolbar labels and split menus are present without placeholders", () => {
  for (const text of [
    "Icons",
    "Measure",
    "Zoom in",
    "Weak magnet",
    "Strong magnet",
    "Snap to indicators",
    "Keep drawing",
    "Lock drawings",
    "Lock indicators",
    "Lock all",
    "Hide drawings",
    "Hide indicators",
    "Hide positions and orders",
    "Hide all",
    "Always remove locked drawings",
  ]) {
    assert.ok(footer.includes(text), "missing toolbar contract: " + text);
  }

  assert.doesNotMatch(footer, /indisponible pour cette version/i);
  assert.doesNotMatch(footer, /Zoom indisponible/i);
  assert.doesNotMatch(footer, /Aimant indisponible/i);
  assert.match(footer, /type HideScope = "drawings" \| "indicators" \| "positions-orders" \| "all"/);
  assert.match(footer, /data-hide-scope=\{hideScope\}/);
  assert.match(footer, /Show all drawings/);
  assert.match(footer, /Show all indicators/);
  assert.match(footer, /Show all positions and orders/);
  assert.match(footer, /selectHideScope\("drawings", onVisibilityToggle, areDrawingsHidden\)/);
  assert.match(footer, /width=\{176\} offsetX=\{8\}/);
  assert.match(footer, /REMOVE_LOCKED_STORAGE_KEY/);
  assert.match(footer, /window\.localStorage\.getItem\(REMOVE_LOCKED_STORAGE_KEY\)/);
  assert.match(footer, /window\.localStorage\.setItem\(REMOVE_LOCKED_STORAGE_KEY/);
  assert.match(footer, /role="menuitemcheckbox"/);
  assert.match(footer, /aria-checked=\{checked\}/);
  assert.match(footer, /width=\{277\} offsetX=\{8\}/);
  assert.match(footer, /"Remove " \+ indicatorCount \+ " indicators"/);
  assert.match(footer, /"Remove " \+ drawingCount \+ " drawings & " \+ indicatorCount \+ " indicators"/);
  assert.match(technicalAnalysis, /indicatorCount=\{activeIndicatorCount\}/);
});

test("keep drawing replicates TradingView persistence, immediate state and re-arming semantics", () => {
  assert.match(manager, /KEEP_DRAWING_STORAGE_KEY/);
  assert.match(manager, /keepDrawingRef\.current = enabled/);
  assert.match(manager, /setKeepDrawingState\(enabled\)/);
  assert.match(manager, /window\.localStorage\.setItem\(KEEP_DRAWING_STORAGE_KEY/);
  assert.match(manager, /window\.localStorage\.getItem\(KEEP_DRAWING_STORAGE_KEY\)/);
  assert.match(manager, /if \(!keepDrawingRef\.current\)/);
  assert.match(footer, /data-name="drawginmode"/);
  assert.match(footer, /viewBox="0 0 28 28"/);
  assert.match(footer, /M17\.27 4\.56a2\.5 2\.5/);
  assert.doesNotMatch(footer, /bi bi-pencil/);
  assert.match(manager, /pendingIconSymbolRef\.current/);
  assert.match(manager, /setActiveTool\("text_note"\)/);
  assert.match(manager, /fontSize = newDrawing\.type === "text_note" && pendingIconSymbolRef\.current \? 24/);
});

test("magnet replicates TradingView weak/strong state, persistence and OHLC/indicator snapping", () => {
  assert.match(manager, /magnetModeRef/);
  assert.match(manager, /type MagnetMode = "off" \| "weak" \| "strong"/);
  assert.match(manager, /lastActiveMagnetModeRef/);
  assert.match(manager, /toggleMagnetMode/);
  assert.match(manager, /MAGNET_PREFERENCES_STORAGE_KEY/);
  assert.match(manager, /window\.localStorage\.setItem/);
  assert.match(manager, /\[bar\.open, bar\.high, bar\.low, bar\.close\]/);
  assert.match(manager, /snapToIndicatorsRef\.current/);
  assert.match(manager, /chart\.getOption\(\)/);
  assert.match(manager, /pushFiniteIndicatorValues/);
  assert.match(manager, /WEAK_MAGNET_THRESHOLD_PX/);
  assert.match(manager, /Math\.hypot/);
  assert.match(footer, /data-name="magnet-mode"/);
  assert.doesNotMatch(footer, /data-name="magnet-options"/);
  assert.match(footer, /<SplitCaret active=\{openMenu === "magnet"\}/);
  assert.match(footer, /event\.clientX >= rect\.right - 12/);
  assert.match(footer, /event\.clientY >= rect\.bottom - 12/);
  assert.match(footer, /minWidth: 240/);
  assert.match(footer, /borderRadius: 4/);
  assert.match(footer, /boxShadow: "0 4px 12px rgba\(0,0,0,\.5\)"/);
  assert.match(footer, /disabled=\{magnetMode === "off"\}/);
  assert.match(toolbar, /onMagnetToggle/);
  assert.match(technicalAnalysis, /onMagnetToggle=\{toggleMagnetMode\}/);
});

test("lock replicates TradingView scope memory while drawing mutations remain real", () => {
  assert.match(manager, /setAllDrawingsLocked/);
  assert.match(manager, /current\.map\(\(drawing\) => \(\{ \.\.\.drawing, locked \}\)\)/);
  assert.match(manager, /if \(locked\) setSelectedDrawingId\(null\)/);
  assert.match(footer, /type LockScope = "drawings" \| "indicators" \| "all"/);
  assert.match(footer, /const \[lockScope, setLockScope\] = useState<LockScope>\("all"\)/);
  assert.match(footer, /data-name="lock-drawings-and-indicators"/);
  assert.match(footer, /data-lock-scope=\{lockScope\}/);
  assert.match(footer, /Unlock drawings/);
  assert.match(footer, /Unlock indicators/);
  assert.match(footer, /Unlock drawings and indicators/);
  assert.match(footer, /LOCK_ICON_PATHS\[lockScope\]\[lockScopeActive \? "locked" : "unlocked"\]/);
  assert.match(footer, /selectLockScope\("drawings", onDrawingsLockToggle\)/);
  assert.match(footer, /selectLockScope\("indicators", onIndicatorsLockToggle\)/);
  assert.match(footer, /selectLockScope\("all", onGlobalLockToggle\)/);
  assert.match(footer, /toggleCurrentLockScope/);
  assert.match(footer, /closeMenu\(\)/);
  assert.match(footer, /menuRef\.current\?\.getBoundingClientRect\(\)\.height \?\? 104/);
  assert.match(footer, /window\.innerHeight - menuHeight - 8/);
  assert.match(footer, /offsetX = 15/);
  assert.match(footer, /width=\{144\} offsetX=\{8\}/);
  assert.match(footer, /openMenu === "lock"\) && "active"/);
  assert.match(footer, /title=\{openMenu === "lock" \? undefined : lockScopeLabel\}/);
  assert.match(footer, /event\.currentTarget\.removeAttribute\("title"\)/);
  assert.doesNotMatch(footer, /window\.innerHeight - 320/);
  assert.doesNotMatch(footer, /bi-unlock2/);
  assert.match(toolbar, /onSetAllDrawingsLocked\(nextLocked\)/);
  assert.match(toolbar, /onSetAllDrawingsHidden\(nextHidden\)/);
  assert.match(manager, /setAllDrawingsHidden/);
  assert.match(manager, /removeAllDrawings/);
  assert.match(manager, /current\.filter\(\(drawing\) => drawing\.locked\)/);
});

test("Zoom In is a TradingView-style armed chart tool and drawing-count contracts remain wired", () => {
  assert.match(technicalAnalysis, /zoomInModeActive/);
  assert.match(technicalAnalysis, /controls\.zoomInAt\(/);
  assert.match(technicalAnalysis, /controls\.zoomToSelection\(\{/);
  assert.match(technicalAnalysis, /gp-zoom-selection-rect/);
  assert.match(technicalAnalysis, /if \(!existingSelection\)/);
  assert.match(technicalAnalysis, /zoomSelectionGestureRef\.current = \{/);
  assert.match(technicalAnalysis, /onPointerDownCapture=\{!isMultiChartMode \? handleZoomInPointerDown/);
  assert.match(technicalAnalysis, /onPointerMoveCapture=\{!isMultiChartMode \? handleZoomInPointerMove/);
  assert.doesNotMatch(technicalAnalysis, /onPointerUpCapture=\{!isMultiChartMode \? handleZoomInPointerUp/);
  assert.match(technicalAnalysis, /data-zoom-in-active=\{zoomInModeActive \? "true" : "false"\}/);
  assert.match(technicalAnalysis, /event\.key === "Escape"/);
  assert.match(footer, /aria-pressed=\{zoomInActive\}/);
  assert.match(footer, /data-name="zoom-in"/);
  assert.match(footer, /zoomInActive && "active"/);
  assert.match(footer, /data-name="zoom-out"/);
  assert.match(footer, /zoomOutVisible &&/);
  assert.match(technicalAnalysis, /interactiveZoomDepth/);
  assert.match(technicalAnalysis, /controls\.undoInteractiveZoom\(\)/);
  assert.match(technicalAnalysis, /drawingCount=\{drawings\.length\}/);
  assert.match(technicalAnalysis, /onRemoveAllIndicators=\{\(\) => dispatch\(clearAllIndicators\(\)\)\}/);
});

test("dedicated Measure control does not also activate the forecasting group", () => {
  assert.doesNotMatch(toolMemory, /VOLUME_BASED \|\| tool\.category === TOOL_CATEGORIES\.MEASURERS/);
  assert.doesNotMatch(toolMemory, /VOLUME_BASED \|\|\s*tool\.category === TOOL_CATEGORIES\.MEASURERS/);
  assert.match(toolMemory, /tool\.category === TOOL_CATEGORIES\.FORECASTING \|\| tool\.category === TOOL_CATEGORIES\.VOLUME_BASED/);
});

test("Measure is a TradingView-style transient utility with Shift hotkey and live stats", () => {
  assert.match(footer, /data-tooltip-hotkey="Shift \+ Click on the chart"/);
  assert.match(footer, /data-name="measure"/);
  assert.match(footer, /rotate\(-45 14 14\)/);
  assert.match(footer, /data-measure-tooltip="true"/);
  assert.match(manager, /measureModeActive/);
  assert.match(manager, /transientMeasureRef/);
  assert.match(manager, /buildQuickMeasureLabel/);
  assert.match(manager, /finalDrawing\.type === "date_price_range"/);
  assert.match(manager, /const isShiftMeasureGesture =\s*e\.shiftKey/);
  assert.match(manager, /let currentActiveTool = activeToolRef\.current/);
  assert.match(manager, /quickMeasureDragRef\.current = true/);
  assert.match(manager, /points: \[coords, coords\]/);
  assert.match(manager, /quickMeasureDragRef\.current\s*&&\s*measureModeRef\.current/);
  assert.match(manager, /transientMeasureRef\.current = null/);
  assert.doesNotMatch(manager, /activeToolRef\.current = "date_price_range"/);
  assert.doesNotMatch(manager, /event\.key !== "Shift"/);
  assert.match(manager, /MULTI_CLICK_TOOLS\.includes\(currentDrawingRef\.current\.type\)/);
  assert.match(manager, /Vol \$\{formatQuickMeasureNumber\(volume\)\}/);
  assert.match(toolbar, /measureActive=\{measureModeActive\}/);
  assert.match(toolbar, /onMeasureToggle=\{onMeasureModeToggle\}/);
  assert.match(technicalAnalysis, /onMeasureModeToggle=\{toggleMeasureMode\}/);
  assert.match(technicalAnalysis, /onMeasureModeCancel=\{cancelMeasureMode\}/);
});

test("topbar Undo/Redo expose the real drawing history with TradingView-style availability", () => {
  assert.match(manager, /historyAvailability/);
  assert.match(manager, /canUndo: historyAvailability\.canUndo/);
  assert.match(manager, /canRedo: historyAvailability\.canRedo/);
  assert.match(manager, /historyStepRef\.current > 0/);
  assert.match(manager, /historyStepRef\.current < historyRef\.current\.length - 1/);
  assert.match(manager, /queueMicrotask/);
  assert.match(manager, /e\.shiftKey[\s\S]*redo\(\)/);
  assert.match(manager, /e\.key\.toLowerCase\(\) === 'y'/);
  assert.match(chartToolbar, /data-name="undo"/);
  assert.match(chartToolbar, /data-name="redo"/);
  assert.match(chartToolbar, /disabled=\{!canUndo\}/);
  assert.match(chartToolbar, /disabled=\{!canRedo\}/);
  assert.match(chartToolbar, /onClick=\{onUndo\}/);
  assert.match(chartToolbar, /onClick=\{onRedo\}/);
  assert.match(technicalAnalysis, /canUndo=\{canUndo\}/);
  assert.match(technicalAnalysis, /canRedo=\{canRedo\}/);
  assert.match(technicalAnalysis, /onUndo=\{undo\}/);
  assert.match(technicalAnalysis, /onRedo=\{redo\}/);
  assert.match(styles, /\.gp-history-controls/);
  assert.match(styles, /\.gp-history-btn/);
});

test("left drawing-toolbar dropdowns share one exclusive-open contract", () => {
  assert.match(menuState, /onBeforeMenuOpen\?\.\(\);\s*closeAllDropdowns\(\);/);
  assert.ok((menuState.match(/closeAllDropdowns\(\);/g) || []).length >= 6);
  assert.match(toolbar, /useDrawingToolbarMenuState\(mainContainerRef, closeAuxMenus\)/);
  assert.match(toolbar, /setExclusiveAuxMenu\("cursor"\)/);
  assert.match(toolbar, /iconPickerOpen=\{openAuxMenu === "icons"\}/);
  assert.match(toolbar, /onOpenMenuChange=\{\(menu\) => setExclusiveAuxMenu\(menu\)\}/);
  assert.match(footer, /iconPickerOpen: boolean/);
  assert.match(footer, /openMenu: DrawingToolbarFooterMenu \| null/);
});
