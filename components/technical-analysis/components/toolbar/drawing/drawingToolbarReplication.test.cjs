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
const drawingSettingsModal = read("components/technical-analysis/components/modals/drawings/DrawingSettingsModal.tsx");
const baseModal = read("components/technical-analysis/components/common/primitives/BaseModal.tsx");
const textNoteStrategy = read("components/technical-analysis/lib/strategies/implementations/TextNoteStrategy.ts");
const floatingToolbarButton = read("components/technical-analysis/components/toolbar/floating/ToolbarButton.tsx");
const cursorRenderer = read("components/technical-analysis/hooks/useCursorRenderer.ts");
const toolbarHandlers = read("components/technical-analysis/hooks/useToolbarHandlers.ts");
const drawingColorSemantics = read("components/technical-analysis/config/drawing/drawingColorSemantics.ts");
const drawingModelTypes = read("components/technical-analysis/config/drawing/drawingModelTypes.ts");
const colorPopup = read("components/technical-analysis/components/toolbar/floating/ColorPopup.tsx");
const inlineTextEditor = read("components/technical-analysis/components/toolbar/floating/InlineTextEditor.tsx");

test("drawing color semantics link only text-centric annotations and preserve structural color independence", () => {
  assert.match(drawingColorSemantics, /PRIMARY_COLOR_DRIVES_TEXT_TOOLS = \[[\s\S]*?"text_note"[\s\S]*?"note"[\s\S]*?"callout"[\s\S]*?"comment"[\s\S]*?"price_label"/);
  for (const structuralTool of ["pin", "table", "price_note", "long_position", "short_position"]) {
    assert.doesNotMatch(drawingColorSemantics, new RegExp(`PRIMARY_COLOR_DRIVES_TEXT_TOOLS = \\[([\\s\\S]*?)"${structuralTool}"`));
  }
  assert.match(drawingModelTypes, /textColorMode\?: "linked" \| "custom"/);
  assert.match(toolbarHandlers, /if \(primaryColorDrivesText\(current\.type\)\) \{[\s\S]*?updates\.textColor = newColor;[\s\S]*?updates\.textColorMode = "linked";/);
  assert.match(toolbarHandlers, /primaryColorDrivesText\(current\.type\)[\s\S]*?textColorMode: "custom" as const/);
  assert.match(textNoteStrategy, /resolveDrawingTextColor\(\{[\s\S]*?toolType: drawing\.type,[\s\S]*?textColorMode: drawing\.textColorMode/);
  assert.match(floatingToolbarButton, /const effectiveTextColor = resolveDrawingTextColor\(\{[\s\S]*?toolType: drType,[\s\S]*?textColorMode: dr\.textColorMode/);
  assert.match(floatingToolbarButton, /backgroundColor: effectiveTextColor/);
  assert.match(colorPopup, /color=\{resolveDrawingTextColor\(\{[\s\S]*?textColorMode: drawing\.textColorMode/);
  assert.match(inlineTextEditor, /color: resolveDrawingTextColor\(\{[\s\S]*?textColorMode: drawing\.textColorMode/);
});

test("both + Info cursor modes share the same candle data-window renderer", () => {
  assert.match(cursorRenderer, /const cursorModeShowsDataWindow = \(mode: CursorMode\) =>[\s\S]*?mode === "arrow-tooltip" \|\| mode === "cross-tooltip"/);
  assert.match(cursorRenderer, /if \(cursorModeShowsDataWindow\(currentMode\)\) \{[\s\S]*?drawProTooltip\(ctx, x, y, clientX, clientY, w, h, chart, currentChartData\)/);
  assert.doesNotMatch(cursorRenderer, /if \(currentMode === ['"]arrow-tooltip['"]\) \{[\s\S]*?drawProTooltip\(ctx, x, y, clientX, clientY, w, h, chart, currentChartData\)/);
});

test("plain Text has no forced underline and its Fill control renders a real background", () => {
  assert.doesNotMatch(textNoteStrategy, /const underlineY = boxY \+ ch \+ 2/);
  assert.doesNotMatch(textNoteStrategy, /ctx\.lineTo\(boxX \+ cw - TEXT_PADDING, underlineY\)/);
  assert.match(textNoteStrategy, /if \(sf\.fillEnabled\) \{[\s\S]*?backgroundColor = sf\.fillColor \|\| "#2962FF"[\s\S]*?drawRoundedRect\(ctx, boxX, boxY, cw, ch, CHIP_RADIUS\);[\s\S]*?ctx\.fill\(\)/);
  assert.match(floatingToolbarButton, /drType === "text_note"[\s\S]*?drawingStyle\.fillEnabled === true[\s\S]*?: drawingStyle\.fillEnabled !== false/);
});

test("drawing settings modals are chart-bounded with compact scrollable bodies", () => {
  assert.match(drawingSettingsModal, /className="gp-drawing-settings-modal"/);
  assert.match(drawingSettingsModal, /overlayClassName="gp-chart-bounded-modal-overlay"/);
  assert.doesNotMatch(baseModal, /minHeight: "300px"/);
  assert.match(styles, /\.gp-drawing-settings-modal \{[\s\S]*?max-height: calc\([\s\S]*?--gp-chart-modal-top[\s\S]*?--gp-chart-modal-bottom/);
  assert.match(styles, /\.gp-drawing-settings-modal \{[\s\S]*?\.gp-modal-body \{[\s\S]*?min-height: 0 !important;[\s\S]*?max-height: none !important;[\s\S]*?overflow-y: auto;/);
});

test("drawing settings modal keeps the selected tab stable while live-editing drawing properties", () => {
  assert.match(drawingSettingsModal, /\}, \[dr\.id, dr\.type, isOpen\]\);/);
  assert.doesNotMatch(drawingSettingsModal, /\}, \[dr, isOpen\]\);/);
  assert.match(drawingSettingsModal, /<SettingsTextArea[\s\S]*?label="Contenu"[\s\S]*?value=\{dr\.text \|\| ""\}[\s\S]*?onChange=\{\(val\) => updateDrawing\(dr\.id, \{ text: val \}\)\}/);
});

test("vertical drawing toolbar density and short-height responsiveness are TradingView-like", () => {
  assert.match(styles, /\.gp-toolbar-scroll-container \{[\s\S]*?flex: 0 1 auto;[\s\S]*?gap: 2px;/);
  assert.match(styles, /\.gp-toolbar-footer \{[\s\S]*?gap: 2px;[\s\S]*?padding-top: 2px;/);
  assert.match(styles, /\.gp-vertical-toolbar \.gp-toolbar-divider \{[\s\S]*?height: 1px;[\s\S]*?margin: 4px 0;/);
  assert.match(styles, /> i\.bi \{[\s\S]*?width: var\(--gp-icon-size-md\);[\s\S]*?height: var\(--gp-icon-size-md\);/);
  assert.match(styles, /\.gp-toolbar-scroll-container \{[\s\S]*?overflow-x: hidden;[\s\S]*?overflow-y: auto;[\s\S]*?overscroll-behavior-y: contain;/);
  assert.doesNotMatch(styles, /@media \(max-height: 760px\)[\s\S]*?gp-toolbar-scroll-container/);
  assert.doesNotMatch(styles, /filter: drop-shadow\(0 0 4px rgba\(41,98,255,.8\)\)/);
});

test("vertical drawing toolbar skeleton is one uninterrupted column matching visible controls", () => {
  const overlayStart = toolbar.indexOf("const DRAWING_TOOLBAR_VISIBLE_ITEM_COUNT");
  const overlayEnd = toolbar.indexOf("export const VerticalDrawingToolbar");
  const overlay = toolbar.slice(overlayStart, overlayEnd);

  assert.match(overlay, /DRAWING_TOOLBAR_VISIBLE_ITEM_COUNT = 14/);
  assert.match(overlay, /Array\.from\(\{ length: DRAWING_TOOLBAR_VISIBLE_ITEM_COUNT \}/);
  assert.doesNotMatch(overlay, /footer-/);
  assert.doesNotMatch(overlay, /borderTop:/);
  assert.doesNotMatch(overlay, /flex:\s*1/);
  assert.match(overlay, /zIndex:\s*50/);
  assert.match(toolbar, /data-loading=\{isInitialLoading \? "true" : "false"\}/);
  assert.match(styles, /\.gp-vertical-toolbar\[data-loading="true"\] \.gp-toolbar-split-trigger \{[\s\S]*?visibility: hidden !important;[\s\S]*?opacity: 0 !important;/);
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

test("all sidebar split carets use the exact same filled caret component", () => {
  assert.match(toolbar, /className="gp-toolbar-split-trigger"/);
  assert.match(toolbar, /className="bi bi-caret-down-fill"/);
  assert.match(footer, /className="gp-toolbar-split-trigger gp-toolbar-split-trigger--footer"/);
  assert.match(footer, /className="bi bi-caret-down-fill"/);
  assert.match(toolbar, /fontSize: "0\.5rem"/);
  assert.match(footer, /fontSize: "0\.5rem"/);
  assert.doesNotMatch(footer, />▾<\/span>/);
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
  assert.match(manager, /newDrawing\.fontSize = pendingTextIconSymbol \? 24/);
});

test("textual annotations enter inline editing immediately when placement completes", () => {
  assert.match(manager, /IMMEDIATE_INLINE_TEXT_ENTRY_TOOL_SET\.has\(newDrawing\.type\) && pendingTextIconSymbol === null/);
  assert.match(manager, /newDrawing\.showText = shouldStartInlineTextEditing \? false/);
  assert.match(manager, /shouldStartInlineTextEditing\s*\? ""/);
  assert.match(manager, /if \(shouldStartInlineTextEditing\) \{\s*startEditingDrawing\(newDrawing\)/);
  assert.match(manager, /IMMEDIATE_INLINE_TEXT_ENTRY_TOOL_SET\.has\(finalDrawing\.type\)/);
  assert.match(manager, /startEditingDrawing\(finalDrawing\)/);
  assert.match(manager, /INLINE_TEXT_EDITOR_SECOND_POINT_TOOL_SET\.has\(d\.type\)/);
  assert.match(technicalAnalysis, /IMMEDIATE_INLINE_TEXT_ENTRY_TOOL_SET\.has\(editingDrawing\.type\) \? "Add text" : undefined/);
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
  assert.match(technicalAnalysis, /onPointerDownCapture=\{isEChartsPrimaryRenderer \? handleZoomInPointerDown : undefined\}/);
  assert.match(technicalAnalysis, /onPointerMoveCapture=\{isEChartsPrimaryRenderer \? handleZoomInPointerMove : undefined\}/);
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

test("topbar Undo/Redo expose the global chart history with TradingView-style availability", () => {
  assert.match(technicalAnalysis, /useChartHistory\(/);
  assert.match(technicalAnalysis, /restoreChartHistorySnapshot/);
  assert.match(technicalAnalysis, /drawings,/);
  assert.match(technicalAnalysis, /comparisonSymbols/);
  assert.match(technicalAnalysis, /advancedIndicators/);
  assert.match(technicalAnalysis, /e\.key\.toLowerCase\(\)/);
  assert.match(technicalAnalysis, /key === "z"/);
  assert.match(technicalAnalysis, /key === "y"/);
  assert.doesNotMatch(manager, /e\.key\.toLowerCase\(\) === 'z'/);
  assert.doesNotMatch(manager, /e\.key\.toLowerCase\(\) === 'y'/);
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
  assert.ok((menuState.match(/closeAllDropdowns\(\);/g) || []).length >= 5);
  assert.match(toolbar, /useDrawingToolbarMenuState\(mainContainerRef, closeAuxMenus\)/);
  assert.match(toolbar, /setExclusiveAuxMenu\("cursor"\)/);
  assert.match(toolbar, /iconPickerOpen=\{openAuxMenu === "icons"\}/);
  assert.match(toolbar, /onOpenMenuChange=\{\(menu\) => setExclusiveAuxMenu\(menu\)\}/);
  assert.match(toolbar, /const isDrawingToolActive = isTrendToolActive \|\| isBrushToolActive/);
  assert.match(toolbar, /bucket === "trend" \|\| bucket === "brush"/);
  assert.doesNotMatch(toolbar, /BrushToolDropdown|brushDropdownRef|handleBrushButtonClick/);
  assert.match(footer, /iconPickerOpen: boolean/);
  assert.match(footer, /openMenu: DrawingToolbarFooterMenu \| null/);
});
