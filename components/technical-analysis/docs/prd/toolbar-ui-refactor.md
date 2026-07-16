# PRD - Technical Analysis Toolbar UI Refactor

Status: Implemented
Date: 2026-06-01
Owner: Technical Analysis frontend
Scope: `components/technical-analysis/components/toolbar`

## 1. Problem Statement

The `toolbar` folder is operational, but it has become a mixed UI subsystem
rather than a clean toolbar boundary. It contains the main chart toolbar,
drawing-tool selection, floating drawing controls, object-layer shortcuts,
quick drawing settings, multi-chart layout controls, and time-axis controls.

This creates six concrete risks:

1. Small toolbar changes can affect chart type switching, drawing selection,
   drawing style mutation, layer deletion, or time-axis interactions.
2. `ToolbarButton.tsx` and `VerticalDrawingToolbar.tsx` are large enough that
   bug fixes require reading hundreds of unrelated lines.
3. Some visible controls expose incomplete contracts, especially capture,
   publish, and profile actions.
4. Drawing icon ownership is split between toolbar-local maps and shared icon
   modules, which increases drift and render work.
5. Popup shell styles are duplicated across many branches, increasing visual
   inconsistency and regression risk.
6. Global event listeners and menu state are distributed across components
   without one explicit ownership model.

The refactor must make toolbar responsibilities explicit, preserve current
visual behavior, and harden user-facing contracts before deeper structural
splits.

## 2. Current Inventory

| File or Area | Current Role | Issue | Target Direction |
| --- | --- | --- | --- |
| `ChartToolbar.tsx` | Main horizontal toolbar, chart type menu, data mode, pseudo dropdown, save/load/settings/actions | Mixes chart controls, profile behavior, publish/capture buttons, repeated class tokens, and local icon rendering | Keep as shell initially; extract chart-type icons/constants and action contracts |
| `VerticalDrawingToolbar.tsx` | Left drawing toolbar, category menus, cursor menu, drawing tool memory, global drawing controls | 1200+ line component with menu ownership, icon catalog, counts, search, and drawing selection in one file | Split into catalog, menu hooks, icon catalog, and shell |
| `ToolbarButton.tsx` | Floating toolbar button and every selected-drawing popup | 1100+ line component with style editing, layer mini-tree, templates, more menu, quick options, and direct drawing mutation | Split into floating-toolbar shell, popup shell, style controls, layer menu, and quick settings |
| `QuickOptionsPopup.tsx` | Drawing quick settings for Gann/Fib/volume tools | Generic name hides drawing-family-specific behavior and direct nested mutations | Move under floating drawing settings with typed update helpers |
| `LayoutSetupControl.tsx` | Multi-chart layout popover and localStorage persistence | Mostly cohesive, but store coupling and UI are still in one component | Keep stable; later extract storage validation if needed |
| `TimeAxisControls/TimeAxisControls.tsx` | Time-axis hover controls and hold-to-repeat actions | Good WeakMap registry use, but global mousemove and magic hover geometry need explicit constants | Keep stable; extract geometry constants and throttle only if measured |
| `TimeAxisControls/TimeAxisControls.module.css` | Removed orphan CSS module | Styles are owned by the global Technical Analysis stylesheet | No orphaned CSS module remains |
| `chart-toolbar/*` | Chart toolbar helper folder created during extraction | Repeats the parent `toolbar` name and creates a redundant `toolbar/toolbar` ownership concept | Move to canonical `chart/*` and delete the legacy folder |
| `drawing-toolbar/*` | Drawing toolbar helper folder created during extraction | Repeats the parent `toolbar` name and mixes shell naming with drawing-domain helpers | Move to canonical `drawing/*` and delete the legacy folder |
| `floating-drawing-toolbar/*` | Selected-drawing floating toolbar shell and popup helpers | Over-specific folder name duplicates both `toolbar` and drawing context, making the path harder to scan | Move to canonical `floating/*` and delete the legacy folder |

Current size signal:

```text
VerticalDrawingToolbar.tsx       ~1248 lines
ToolbarButton.tsx                ~1165 lines
ChartToolbar.tsx                  ~510 lines
TimeAxisControls.tsx              ~195 lines
LayoutSetupControl.tsx            ~189 lines
QuickOptionsPopup.tsx             ~136 lines
Total toolbar size              ~3443 lines
```

## 2.1 Local Rollback Snapshot

The architecture correction uses full rollback because it changes import paths
and deletes legacy folders.

Snapshot:

```text
_Rollback/toolbar-architecture-prd-correction-20260602-170106/
  MANIFEST.md
  files/<copied files with parent paths preserved>
```

Files copied before edits:

- `AGENT-MEMOIRE_PROJECT_STATUS.scribe` because causal memory may be updated at
  completion.
- `components/technical-analysis/docs/prd/toolbar-ui-refactor.md` because this
  PRD is corrected before code movement resumes.
- `components/technical-analysis/TechnicalAnalysis.tsx` because it imports the
  floating toolbar and dynamic time-axis component.
- `components/technical-analysis/components/toolbar/ChartToolbar.tsx` because it
  imports chart helper paths.
- `components/technical-analysis/components/toolbar/VerticalDrawingToolbar.tsx`
  because it imports drawing helper paths.
- `components/technical-analysis/components/toolbar/LayoutSetupControl.tsx`
  because it is a root toolbar entrypoint that must remain stable.
- `components/technical-analysis/components/toolbar/TimeAxisControls/` because
  it is moved to the canonical `time-axis` domain.
- `components/technical-analysis/components/toolbar/chart-toolbar/` because it
  is deleted after migration.
- `components/technical-analysis/components/toolbar/drawing-toolbar/` because it
  is deleted after migration.
- `components/technical-analysis/components/toolbar/floating-drawing-toolbar/`
  because it is deleted after migration.

Method:

- `cp -R --parents ... _Rollback/toolbar-architecture-prd-correction-20260602-170106/files`
- SHA-256 hashes are recorded in
  `_Rollback/toolbar-architecture-prd-correction-20260602-170106/MANIFEST.md`.

Baseline validation:

- `npm run build`: passed before this correction in the prior toolbar validation
  cycle.
- `./node_modules/.bin/tsc --noEmit --pretty false`: passed before this
  correction in the prior toolbar validation cycle.
- `npx eslint` on the toolbar and related technical-analysis files: passed
  before this correction in the prior toolbar validation cycle.
- `git diff --check`: passed before this correction in the prior toolbar
  validation cycle.
- Browser smoke on `/equity/technical-analysis`: passed before this correction
  in the prior toolbar validation cycle.

Rollback use:

- Compare current files against the snapshot before restoring.
- Restore only files changed by this architecture correction.
- Never overwrite newer human or parallel-agent edits blindly.

## 3. Goals

1. Make toolbar shell components small enough to reason about without reading
   unrelated drawing or modal logic.
2. Preserve the existing Technical Analysis visual behavior on
   `/equity/technical-analysis`.
3. Remove visible inert controls or wire them to real behavior.
4. Centralize chart-type icon rendering.
5. Centralize drawing menu and icon ownership.
6. Centralize floating-toolbar popup shell styling.
7. Keep dropdown, pointer, keyboard, and hover behavior stable.
8. Ensure the refactor remains safe under reloads, HMR, and large drawing sets.

## 4. Non-Goals

1. No visual redesign of the Technical Analysis toolbar.
2. No change to chart rendering algorithms or candle rendering.
3. No change to drawing geometry, hit testing, or renderer behavior.
4. No rewrite of Redux state architecture.
5. No new dependency.
6. No real screenshot export implementation unless a chart capture contract is
   explicitly added and validated.
7. No permanent compatibility adapters with duplicate file names.
8. No broad cleanup outside `components/technical-analysis/components/toolbar`
   except required state or modal wiring for toolbar contracts.

## 5. Target Structure

The canonical toolbar tree keeps only real toolbar shell entrypoints at the
root. Internal helpers are owned by domain folders named for their domain, not
for the already implied parent `toolbar`.

```text
components/technical-analysis/components/toolbar/
  ChartToolbar.tsx
  VerticalDrawingToolbar.tsx
  LayoutSetupControl.tsx
  chart/
    chartTypeIcons.tsx
    toolbarClassNames.ts
  drawing/
    drawingToolCounts.ts
    drawingToolFilters.ts
    drawingToolMemory.ts
    drawingToolbarMenuState.ts
    drawingToolbarTheme.ts
    toolIconCatalog.tsx
  floating/
    ToolbarButton.tsx
    ToolbarButtonPopups.tsx
    popupStyle.ts
    TemplatePopup.tsx
    LayersPopup.tsx
    ColorPopup.tsx
    LineStylePopup.tsx
    MorePopup.tsx
    QuickOptionsPopup.tsx
    drawingUpdateHelpers.ts
  time-axis/
    TimeAxisControls.tsx
    timeAxisControls.constants.ts
```

Canonical ownership:

- `ChartToolbar.tsx` owns the root horizontal toolbar shell.
- `VerticalDrawingToolbar.tsx` owns the root vertical drawing toolbar shell.
- `LayoutSetupControl.tsx` owns the root layout popover entrypoint.
- `chart/*` owns chart-toolbar helpers only.
- `drawing/*` owns drawing-menu helpers, drawing-tool catalog helpers, and
  drawing-toolbar theme constants.
- `floating/*` owns the selected-drawing floating toolbar shell, popup
  coordinator, popup bodies, popup style helper, and nested drawing mutation
  helpers.
- `time-axis/*` owns time-axis hover controls and their constants.

Old paths deleted by this PRD:

- `components/technical-analysis/components/toolbar/chart-toolbar/`
- `components/technical-analysis/components/toolbar/drawing-toolbar/`
- `components/technical-analysis/components/toolbar/floating-drawing-toolbar/`
- `components/technical-analysis/components/toolbar/TimeAxisControls/`

No temporary adapter is allowed for these internal paths because import search
shows no broad public consumer that needs the old folder names preserved.

## 5.1 Architecture Decision Gate

Architecture Gate:

Current dependency inventory:

| Legacy path | Current role | Imported by | Consumer count | Public API? | Decision |
| --- | --- | --- | ---: | --- | --- |
| `toolbar/chart-toolbar/*` | Chart icon renderer and class-name constants | `ChartToolbar.tsx` | 1 | No | Move to `toolbar/chart/*`, update imports, delete old folder |
| `toolbar/drawing-toolbar/*` | Drawing counts, filters, memory, menu state, theme, and icon catalog | `VerticalDrawingToolbar.tsx` | 1 | No | Move to `toolbar/drawing/*`, update imports, delete old folder |
| `toolbar/floating-drawing-toolbar/*` | Selected-drawing floating toolbar and popups | `TechnicalAnalysis.tsx`, internal floating helpers | 1 external shell consumer | No for folder path | Move to `toolbar/floating/*`, update all imports, delete old folder |
| `toolbar/TimeAxisControls/*` | Time-axis dynamic component and constants | `TechnicalAnalysis.tsx` | 1 | No for folder path | Move to `toolbar/time-axis/*`, update type and dynamic imports, delete old folder |
| `toolbar/ChartToolbar.tsx` | Horizontal toolbar shell | `TechnicalAnalysis.tsx` | 1 | Yes, subsystem shell | Keep at root; no adapter |
| `toolbar/VerticalDrawingToolbar.tsx` | Vertical drawing toolbar shell | `TechnicalAnalysis.tsx` | 1 | Yes, subsystem shell | Keep at root; no adapter |
| `toolbar/LayoutSetupControl.tsx` | Layout control entrypoint used by chart toolbar | `ChartToolbar.tsx` | 1 | Yes, toolbar shell child | Keep at root; no adapter |

Responsibility test:

- The current folder is broad enough to justify subfolders because it owns the
  horizontal toolbar, vertical drawing toolbar, floating selected-drawing
  toolbar, layout control, and time-axis control.
- The extracted responsibilities are large and named concretely; each target
  folder has more than one concrete file except root shell entrypoints.
- Five well-named flat files would not be clearer because the active subsystem
  already has more than twenty toolbar files with distinct chart, drawing,
  floating, and time-axis responsibilities.

Chosen strategy:

- Move to domain folders, migrate all imports, then delete legacy folders.

Rejected strategies:

- Keep the previous `chart-toolbar`, `drawing-toolbar`, and
  `floating-drawing-toolbar` folders because they duplicate the parent
  `toolbar` responsibility and produce stuttered paths.
- Flatten every helper back into `toolbar/` because the folder already exceeds
  the scan budget for a single flat UI directory.
- Keep temporary compatibility adapters because no active public consumer needs
  the old helper-folder paths.

Canonical source of truth:

- `toolbar/chart/*` owns chart helper modules.
- `toolbar/drawing/*` owns vertical drawing toolbar helper modules.
- `toolbar/floating/*` owns selected-drawing floating toolbar modules.
- `toolbar/time-axis/*` owns time-axis toolbar modules.

Legacy removal proof:

- `rg "chart-toolbar|drawing-toolbar|floating-drawing-toolbar|TimeAxisControls/" components/technical-analysis --glob '!**/docs/prd/**'` must return no active code matches.
- `rg --files components/technical-analysis/components/toolbar` must show
  `chart/`, `drawing/`, `floating/`, and `time-axis/`, with no legacy folders.
- The final tree must not contain root re-export adapters for the moved helper
  folders.

## 6. Functional Requirements

### FR-001 - Toolbar Contracts Are Honest

Visible toolbar actions must either execute a real behavior, open a real modal,
or be explicitly disabled with a truthful title.

Acceptance:

- Publish opens a real publish options modal or is removed.
- Capture is not an enabled no-op.
- Profile/user action is not a console-only mock.
- No `console.log` mock remains in the toolbar.

### FR-002 - Chart Type Menu Behavior Is Preserved

The chart type selector must keep the same options, groups, labels, badges, and
selected-state behavior.

Acceptance:

- `setChartType` is still called with the selected chart type.
- The active chart type icon still renders.
- Existing chart-type badges remain visible only for supported chart types.

### FR-003 - Drawing Menus Close Correctly

Every floating drawing menu must close through the same outside-click rules.

Acceptance:

- Cursor, trend, Fibonacci, chart patterns, and forecasting menus all close on
  outside mouse down.
- Clicking inside the portal does not close the active menu prematurely.

### FR-004 - Floating Drawing Popups Keep Their Behavior

Floating drawing toolbar popups must preserve all current drawing mutations.

Acceptance:

- Color, fill, TP/SL fill, line style, template, layers, more, and quick option
  popups still render under the same active conditions.
- Existing callbacks continue to receive the same payloads.

### FR-005 - Multi-Chart Layout Control Stays Stable

The multi-chart layout control must keep its localStorage behavior and existing
layout dispatches.

Acceptance:

- Hydration still ignores invalid JSON by removing the stored key.
- Layout changes still dispatch `setMultiChartLayout`.

### FR-006 - Time Axis Controls Stay Stable

Time-axis controls must keep their WeakMap-based chart viewport contract and
hold-to-repeat behavior.

Acceptance:

- Zoom, pan, and reset still call the registered controls.
- Pointer hold cleanup clears the interval on pointer up and unmount.

## 7. Non-Functional Requirements

### Performance

- Avoid recreating large static icon maps inside render paths.
- Avoid adding global listeners beyond the existing menu and time-axis needs.
- Keep chart-type menu rendering O(number of chart types).
- Keep drawing tool filtering O(number of drawing tools), with no nested scan
  inside row rendering unless the list is small and measured.

### Accessibility

- Interactive non-button surfaces must have keyboard support or become native
  buttons.
- Buttons that open menus must expose `aria-haspopup` and `aria-expanded`.
- Disabled or unavailable actions must not look like enabled no-ops.

### Reliability

- All event listeners must be cleaned up.
- All modal keys added to Redux state must be reflected in the TypeScript
  `UiState` contract and initial state.
- Menu close behavior must include every menu registered in the component.

### Maintainability

- No same-name duplicate adapters at the root and subfolder level.
- Internal helpers must live under `chart/`, `drawing/`, `floating/`, or
  `time-axis/` only.
- Root toolbar files remain real shell components, not re-export adapters.

### Backward Compatibility

- Existing imports of root shell components `ChartToolbar`,
  `VerticalDrawingToolbar`, and `LayoutSetupControl` remain valid.
- `ToolbarButton` and `TimeAxisControls` move to canonical internal folders, and
  their only active consumers migrate in the same phase.
- Visual classes remain stable unless explicitly migrated with CSS validation.

## 8. Migration Plan

### Phase 1 - Contract Hardening

Objective:

Remove known no-op and menu-close defects before structural movement.

Actions:

1. Wire publish to a real modal state and orchestrator render path.
2. Make capture explicitly unavailable unless a real capture callback exists.
3. Replace the profile mock with a real dropdown interaction.
4. Fix the forecasting dropdown outside-click close path.
5. Remove duplicate class tokens that have no semantic value.
6. Normalize accessible titles and labels where the fix is isolated.

Files or areas affected:

- `ChartToolbar.tsx`
- `VerticalDrawingToolbar.tsx`
- `technicalAnalysisSlice.ts`
- `TechnicalAnalysisTypes.ts`
- `ModalOrchestrator.tsx`

Exit criteria:

- TypeScript passes.
- ESLint passes on touched files.
- `rg "console.log|onClick=\{\(\) => \{\}\}" components/technical-analysis/components/toolbar` has no toolbar contract match.

Rollback:

- Revert Phase 1 files and rerun the same validation commands.

### Phase 2 - Chart Toolbar Extraction

Objective:

Keep `ChartToolbar.tsx` as the shell and extract static data/render helpers.

Actions:

1. Move shared anonymous pseudo constants into `config/anonymousPseudos.ts`.
2. Move chart type icon rendering into `chart/chartTypeIcons.tsx`.
3. Move repeated class tokens into `chart/toolbarClassNames.ts`.
4. Keep JSX output equivalent.

Files or areas affected:

- `ChartToolbar.tsx`
- `chart/*`

Exit criteria:

- TypeScript passes.
- Chart type menu still opens and switches chart types.
- No same-name `ChartToolbar.tsx` adapter is created in the subfolder.

Rollback:

- Inline the helper imports back into `ChartToolbar.tsx`.

### Phase 3 - Vertical Drawing Toolbar Extraction

Objective:

Separate drawing menu state, counts, filters, and icon catalog from the shell.

Actions:

1. Extract drawing count computation.
2. Extract search/filter helpers.
3. Move toolbar-specific icon catalog outside render.
4. Collapse the four dropdown toggle paths into one menu-state owner.

Implementation status:

- Completed: drawing count computation lives in `drawing/drawingToolCounts.ts`.
- Completed: drawing menu filters live in `drawing/drawingToolFilters.ts`.
- Completed: drawing tool memory/category detection lives in `drawing/drawingToolMemory.ts`.
- Completed: active drawing toolbar theme constants live in `drawing/drawingToolbarTheme.ts`.
- Completed: toolbar-specific icon catalog and icon render helpers live in `drawing/toolIconCatalog.tsx`.
- Completed: the four drawing dropdown toggle paths are owned by `drawing/drawingToolbarMenuState.ts`.

Files or areas affected:

- `VerticalDrawingToolbar.tsx`
- `drawing/*`

Exit criteria:

- Cursor, trend, Fibonacci, chart patterns, and forecasting menus keep current
  behavior.
- No icon map is rebuilt inside the component render path.
- No root duplicate `VerticalDrawingToolbar.tsx` adapter is introduced.

Rollback:

- Restore the previous inline helper blocks.

### Phase 4 - Floating Drawing Toolbar Extraction

Objective:

Turn `ToolbarButton.tsx` into a shell that delegates popup bodies and style
helpers.

Actions:

1. Extract shared popup style helper.
2. Extract template, layers, color, fill, line, more, and quick option popups.
3. Move nested drawing update operations into named helpers.
4. Keep all callbacks and payloads stable.

Implementation status:

- Completed: shared popup shell styling lives in `floating/popupStyle.ts`.
- Completed: popup bodies live under `floating/*Popup.tsx`.
- Completed: nested drawing updates live in `floating/drawingUpdateHelpers.ts`.
- Completed: `ToolbarButton.tsx` is a floating-toolbar shell below 500 lines.

Files or areas affected:

- `ToolbarButton.tsx`
- `QuickOptionsPopup.tsx`
- `floating/*`

Exit criteria:

- Selected drawing toolbar still supports every current button.
- Existing drawing style mutations produce the same shape.
- `ToolbarButton.tsx` drops below 500 lines in the final phase.

Rollback:

- Restore inline popup bodies and remove extracted modules.

### Phase 5 - Time Axis and Layout Polish

Objective:

Clean small isolated debt after the risky toolbar splits are stable.

Actions:

1. Extract time-axis hover constants.
2. Remove the orphan `TimeAxisControls.module.css` after proving it is unused.
3. Keep `LayoutSetupControl.tsx` mostly intact unless validation reveals storage
   or a11y defects.

Files or areas affected:

- `time-axis/TimeAxisControls.tsx`
- `time-axis/TimeAxisControls.module.css` (removed before this correction)
- `LayoutSetupControl.tsx`

Exit criteria:

- Time-axis controls still appear and repeat on pointer hold.
- No orphaned CSS module remains without an explicit reason.

Rollback:

- Restore the previous component file and CSS module.


### Phase 6 - Canonical Toolbar Folder Correction

Objective:

Correct the extraction architecture after the PRD workflow review by removing
stuttered legacy helper folders and migrating every active import to the
canonical domain tree.

Actions:

0. Create `_Rollback/toolbar-architecture-prd-correction-20260602-170106/` and
   record hashes in `MANIFEST.md`.
1. Move `chart-toolbar/` to `chart/`.
2. Move `drawing-toolbar/` to `drawing/`.
3. Move `floating-drawing-toolbar/` to `floating/`.
4. Move `TimeAxisControls/` to `time-axis/`.
5. Update `ChartToolbar.tsx`, `VerticalDrawingToolbar.tsx`, and
   `TechnicalAnalysis.tsx` imports.
6. Prove the legacy folders have no active code matches.

Files or areas affected:

- `TechnicalAnalysis.tsx`
- `ChartToolbar.tsx`
- `VerticalDrawingToolbar.tsx`
- `chart/*`
- `drawing/*`
- `floating/*`
- `time-axis/*`

Exit criteria:

- TypeScript passes.
- ESLint passes on the toolbar and `TechnicalAnalysis.tsx`.
- `npm run build` passes.
- `rg "chart-toolbar|drawing-toolbar|floating-drawing-toolbar|TimeAxisControls/" components/technical-analysis --glob '!**/docs/prd/**'` returns no active code matches.
- `rg --files components/technical-analysis/components/toolbar` shows no legacy
  helper folders.

Rollback:

- Restore only the files changed by Phase 6 from
  `_Rollback/toolbar-architecture-prd-correction-20260602-170106/`, then rerun
  the same validation commands.

## 9. Validation Plan

Static validation:

- `./node_modules/.bin/tsc --noEmit`
- `npx eslint components/technical-analysis/components/toolbar components/technical-analysis/components/modals/orchestration/ModalOrchestrator.tsx components/technical-analysis/store/technicalAnalysisSlice.ts components/technical-analysis/config/TechnicalAnalysisTypes.ts`
- `git diff --check`
- `rg "console.log|onClick=\{\(\) => \{\}\}" components/technical-analysis/components/toolbar`

Runtime smoke:

- `curl -I http://localhost:3000/equity/technical-analysis` returns 200 when
  the dev server is running.
- Browser smoke verifies that `/equity/technical-analysis` renders a non-empty
  chart area.
- Open chart type menu and select one non-default type.
- Open and close every drawing category menu.
- Open publish options from the toolbar.

Architecture validation:

- `rg "chart-toolbar|drawing-toolbar|floating-drawing-toolbar|TimeAxisControls/" components/technical-analysis --glob '!**/docs/prd/**'` returns no active code matches.
- `rg --files components/technical-analysis/components/toolbar` contains no
  legacy helper folders.
- No same-name duplicate adapter is introduced.

Regression validation:

- Existing imports of root toolbar shell components remain valid.
- Drawing selection, drawing menu memory, and selected drawing toolbar actions
  remain available.
- Time-axis controls remain dynamically loadable from the canonical path.

Build validation:

- `npm run build` should pass when this refactor reaches Phase 4 or touches
  modal state contracts.

## 10. Risk Register

| Risk | Probability | Impact | Mitigation |
| --- | --- | --- | --- |
| Adding publish modal state misses a modal key | Medium | TypeScript or runtime close-all failure | Update `UiState`, initial state, and orchestrator together |
| Moving chart type icon rendering changes visual alignment | Low | Toolbar visual regression | Preserve SVG dimensions and Bootstrap icon classes |
| Outside-click fix closes menus when clicking inside portals | Medium | Dropdown UX regression | Keep `.gp-cursor-dropdown-portal` exemption |
| Popup style extraction changes position or size | Medium | Floating toolbar regression | Extract style object with identical defaults and per-popup overrides |
| Drawing icon catalog extraction changes active color behavior | Medium | Active tool visual regression | Preserve `cloneIconWithActiveState` and active color contract |
| Time-axis listener changes affect hover visibility | Medium | Controls appear/disappear incorrectly | Phase this separately and smoke-test with chart hover |

## 11. Rollback

Rollback must be phase-scoped:

1. Phase 1 can be reverted by restoring toolbar contract files and modal state
   files.
2. Phase 2 can be reverted by inlining chart toolbar helpers.
3. Phase 3 can be reverted by restoring the previous vertical toolbar helper
   blocks.
4. Phase 4 can be reverted by restoring popup bodies inside `ToolbarButton.tsx`.
5. Phase 5 can be reverted by restoring the previous time-axis file and CSS
   module.
6. Phase 6 can be reverted from `_Rollback/toolbar-architecture-prd-correction-20260602-170106/` after comparing current files against the snapshot.

No generated directories, SCRIBE outputs, or Graphify outputs are part of the
product rollback.

## 12. Completion Criteria

The PRD is complete only when:

1. All toolbar visible actions have honest contracts.
2. No toolbar component contains a console-only mock action.
3. No same-name duplicate adapter exists for toolbar components.
4. `ToolbarButton.tsx` and `VerticalDrawingToolbar.tsx` no longer own unrelated
   sub-systems inline.
5. Static validation is green.
6. Browser smoke on `/equity/technical-analysis` is green.
7. The architecture validation proves the legacy helper folders are absent from active code.
8. The implementation history explains the reason for structural choices
   without storing structural facts in SCRIBE.




## 13. Implementation Records

### Prior Phase 1-5 Record

Implemented on 2026-06-02 before the architecture correction.

Validation recorded then:

- npx eslint on the toolbar, modal orchestrator, technical-analysis slice, and TechnicalAnalysisTypes passed.
- ./node_modules/.bin/tsc --noEmit --pretty false passed.
- npm run build passed.
- git diff --check on the touched toolbar, config, TechnicalAnalysis, and PRD files passed.
- rg "console.log|onClick empty handler" on components/technical-analysis/components/toolbar returned no matches.
- curl -I http://localhost:3000/equity/technical-analysis returned 200 OK.
- Browser smoke on /equity/technical-analysis confirmed the toolbar shell, disabled capture contract, publish button, vertical drawing toolbar, time-axis controls, chart-type menu mount, and drawing dropdown open/close behavior. Console stayed clean for toolbar interactions; later symbol-selector interaction surfaced unrelated missing logo assets.

### Phase 6 Record

Implemented on 2026-06-02 after PRD workflow correction.

Validation recorded then:

- Legacy path search for chart-toolbar, drawing-toolbar, floating-drawing-toolbar, and TimeAxisControls slash returned no active code matches outside PRD docs.
- Toolbar file listing showed canonical chart, drawing, floating, and time-axis folders with no legacy helper folders.
- Targeted ESLint passed on toolbar and TechnicalAnalysis.tsx.
- TypeScript passed with noEmit and pretty false.
- Production build passed with npm run build.
- Local curl route smoke returned 200 OK.
