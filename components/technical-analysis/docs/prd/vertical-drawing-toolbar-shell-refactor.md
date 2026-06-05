# PRD - Vertical Drawing Toolbar Shell Refactor

Status: Implemented
Date: 2026-06-03
Owner: Technical Analysis frontend
Scope: `components/technical-analysis/components/toolbar/VerticalDrawingToolbar.tsx` and `components/technical-analysis/components/toolbar/drawing/*`

## 1. Problem Statement

`VerticalDrawingToolbar.tsx` remains a large shell that mixes Redux actions, cursor mode UI, split-button behavior, dropdown rendering, category rows, tool rows, disabled action contracts, and footer controls.

The folder-level architecture is now canonical, but the shell still forces maintainers to read unrelated JSX branches before changing one drawing menu. This creates regression risk for cursor behavior, drawing tool selection, dropdown close behavior, and visible toolbar contracts.

This needs a PRD because the fix is structural, touches working UI, and can easily create a half-refactor if new files are added without clear ownership. If the work is not done, the next toolbar change will keep adding handlers and JSX to the same shell.

## 2. Current Inventory

| File or Area | Current Role | Issue | Target Direction |
| --- | --- | --- | --- |
| `VerticalDrawingToolbar.tsx` | Public vertical toolbar shell used by `TechnicalAnalysis.tsx` | Owns shell state plus all cursor/menu/footer rendering | Keep as public shell, reduce it to orchestration and composition |
| `drawing/drawingToolbarMenuState.ts` | Menu state owner for trend, fib, chart pattern, and forecasting menus | Good canonical owner; should not be duplicated | Keep as state hook |
| `drawing/drawingToolFilters.ts` | Search and category filtering | Good canonical owner; dropdown components should call it | Keep as data helper |
| `drawing/drawingToolCounts.ts` | Category counts | Good canonical owner; category rows should consume it | Keep as data helper |
| `drawing/toolIconCatalog.tsx` | Toolbar-specific icon rendering | Good canonical owner; row components should consume it | Keep as icon helper |
| Cursor mode JSX inside shell | Cursor trigger, portal, and cursor options | Dedicated UI branch mixed into shell | Extract to `drawing/CursorModeSelector.tsx` |
| Drawing dropdown JSX inside shell | Four repeated `ToolPortal` bodies | Repeated row/header/back rendering and inline arrays | Extract to `drawing/DrawingToolDropdown.tsx` |
| Footer action JSX inside shell | Lock, visibility, clear, disabled contract buttons | Footer contracts mixed with menu architecture | Extract to `drawing/DrawingToolbarFooter.tsx` |

## 3. Local Rollback Snapshot

Full rollback is required because this refactor changes existing rendering composition and import paths.

Snapshot:

```text
_Rollback/vertical-drawing-toolbar-shell-refactor-20260603-091000/
  MANIFEST.md
  files/<copied files with parent paths preserved>
```

Files copied before edits:

- `components/technical-analysis/docs/prd/vertical-drawing-toolbar-shell-refactor.md` because implementation notes may be updated.
- `components/technical-analysis/components/toolbar/VerticalDrawingToolbar.tsx` because it is the public shell being reduced.
- `components/technical-analysis/components/toolbar/drawing/drawingToolbarMenuState.ts` because menu state is an active dependency.
- `components/technical-analysis/components/toolbar/drawing/drawingToolFilters.ts` because extracted dropdowns depend on these helpers.
- `components/technical-analysis/components/toolbar/drawing/drawingToolCounts.ts` because extracted category rows depend on these counts.
- `components/technical-analysis/components/toolbar/drawing/toolIconCatalog.tsx` because extracted rows depend on toolbar icons.
- `components/technical-analysis/components/toolbar/drawing/drawingToolbarTheme.ts` because extracted components use the same styles.

Method:

- `mkdir -p _Rollback/<snapshot>/files`
- `cp --parents <files> _Rollback/<snapshot>/files`
- Record SHA-256 hashes in `MANIFEST.md`.

Baseline validation:

- `./node_modules/.bin/tsc --noEmit`
- `rg "components/technical-analysis/components/toolbar/drawing/.*VerticalDrawingToolbar|export \\* from" components/technical-analysis/components/toolbar`

Rollback use:

- Compare current files against snapshot before restoring.
- Restore only files modified by this implementation.
- Never overwrite newer human or parallel-agent edits blindly.

## 4. Goals

1. Keep `VerticalDrawingToolbar.tsx` as the only public shell import path.
2. Move cursor mode rendering into one canonical component.
3. Move repeated drawing dropdown rendering into one canonical component.
4. Move footer action rendering into one canonical component.
5. Preserve drawing selection, cursor selection, dropdown close behavior, disabled contracts, and active-state rendering.
6. Avoid root re-export files, compatibility adapters, and duplicate source-of-truth paths.

## 5. Non-Goals

1. No visual redesign.
2. No new drawing tools.
3. No geometry, hit-test, renderer, or store rewrite.
4. No migration of `TechnicalAnalysis.tsx` away from the public shell import.
5. No `index.ts` barrel.
6. No temporary adapter.
7. No cleanup outside the toolbar drawing boundary unless required by validation.

## 6. Target Structure

```text
components/technical-analysis/components/toolbar/
  VerticalDrawingToolbar.tsx
  drawing/
    CursorModeSelector.tsx
    DrawingToolDropdown.tsx
    DrawingToolbarFooter.tsx
    drawingToolCounts.ts
    drawingToolFilters.ts
    drawingToolMemory.ts
    drawingToolbarMenuState.ts
    drawingToolbarTheme.ts
    toolIconCatalog.tsx
```

Canonical ownership:

- `VerticalDrawingToolbar.tsx` owns public shell composition and high-level event wiring.
- `drawing/CursorModeSelector.tsx` owns cursor trigger, cursor icon rendering, and cursor portal options.
- `drawing/DrawingToolDropdown.tsx` owns reusable `ToolPortal` menu bodies for trend, Fibonacci/Gann, chart patterns, and forecasting/volume tools.
- `drawing/DrawingToolbarFooter.tsx` owns footer and isolated non-menu toolbar action buttons.
- Existing `drawing/*` data helpers remain sources of truth for counts, filters, memory, theme, and icons.

Old files or paths deleted:

- None. This phase extracts new internal components from one public shell and does not move public paths.

Temporary paths:

- None. No adapter is allowed because there is no old internal path to preserve.

## 6.1 Architecture Decision Gate

Architecture Gate:

Current dependency inventory:

| Legacy path | Current role | Imported by | Consumer count | Public API? | Decision |
| --- | --- | --- | ---: | --- | --- |
| `toolbar/VerticalDrawingToolbar.tsx` | Public shell | `TechnicalAnalysis.tsx` | 1 | Yes | Keep; reduce shell only |
| Inline cursor JSX in shell | Cursor mode selector | Shell only | 1 | No | Extract to `drawing/CursorModeSelector.tsx` |
| Inline dropdown JSX in shell | Four drawing menus | Shell only | 1 | No | Extract to `drawing/DrawingToolDropdown.tsx` |
| Inline footer JSX in shell | Footer and non-menu actions | Shell only | 1 | No | Extract to `drawing/DrawingToolbarFooter.tsx` |

Responsibility test:

- The current shell is too broad because it mixes cursor UI, menu bodies, footer controls, and orchestration.
- The responsibilities justify subcomponents because each has separate inputs, event contracts, and validation points.
- Five well-named files are clearer than keeping all JSX in one shell; a deeper domain tree is not justified for this phase.

Chosen strategy:

- Keep the public root shell, extract real internal components under `drawing/`, update imports, and keep no duplicate paths.

Rejected strategies:

- Move `VerticalDrawingToolbar.tsx` into `drawing/` and leave a root re-export because that creates the zombie adapter pattern forbidden by the PRD workflow.
- Create `drawing/index.ts` because it would add a barrel without a public folder boundary.
- Split every menu into separate folders because the repeated rendering can be owned by one typed dropdown component.
- Leave the shell untouched because the previous folder refactor did not solve the shell complexity.

Canonical source of truth:

- `VerticalDrawingToolbar.tsx` owns shell orchestration.
- `drawing/CursorModeSelector.tsx` owns cursor UI.
- `drawing/DrawingToolDropdown.tsx` owns menu UI.
- `drawing/DrawingToolbarFooter.tsx` owns footer UI.

Legacy removal proof:

- `rg "export \\* from|export \\{.*VerticalDrawingToolbar" components/technical-analysis/components/toolbar` must not show a root adapter.
- `rg --files components/technical-analysis/components/toolbar/drawing` must show direct component files, not a new barrel-only folder.

## 7. Functional Requirements

### FR-001 - Cursor Mode Behavior Is Preserved

The cursor selector must keep the same modes, labels, active icon behavior, and dispatch payloads.

Acceptance:

- Selecting a cursor dispatches `setCursorMode(mode)`.
- Selecting a cursor clears `activeTool`.
- The cursor dropdown closes after selection and on outside click.

### FR-002 - Drawing Tool Selection Is Preserved

Every menu row must still select the same drawing tool and close the same dropdown.

Acceptance:

- Trend, Fibonacci/Gann, chart pattern, and forecasting/volume tools call the same `handleSelectDrawingTool`.
- Search result rows still clear the trend search query where the existing behavior does so.
- Active tool styling is still applied.

### FR-003 - Split-Button Behavior Is Preserved

Clicking the split area opens a dropdown; clicking the main area reactivates the remembered tool when present.

Acceptance:

- No change to `lastSelectedToolByCategory` semantics.
- No change to `reactivateRememberedTool` reset behavior.

### FR-004 - Footer Contracts Stay Honest

Footer actions must remain wired or explicitly disabled.

Acceptance:

- `Date & Prix`, line drawing mode, lock, visibility, and clear drawings remain executable.
- Text, icon, zoom, and magnet remain disabled with truthful titles.

## 8. Non-Functional Requirements

### Maintainability

- `VerticalDrawingToolbar.tsx` must drop materially in line count.
- New component files must stay below 300 lines each.
- No new file can be a re-export-only adapter.

### Accessibility

- Existing button titles and disabled states must be preserved.
- Extracted components must not remove native button semantics.

### Reliability

- Existing document `mousedown` close behavior must remain centralized in the shell unless replaced by an equivalent shared owner.
- No additional global listener may be introduced for the same dropdown close responsibility.

## 9. Migration Plan

### Phase 1 - PRD and Rollback

Objective:

Define the target architecture and create a rollback barrier before code changes.

Actions:

1. Write this PRD.
2. Create `_Rollback/vertical-drawing-toolbar-shell-refactor-20260603-091000/`.
3. Record hashes and baseline validation.

Exit criteria:

- PRD includes architecture gate and no-adapter decision.
- Baseline `tsc` passes.

Rollback:

- No code change occurs before the snapshot.

### Phase 2 - Extract Real Components

Objective:

Move JSX responsibilities into owned internal components without changing behavior.

Actions:

1. Add `drawing/CursorModeSelector.tsx`.
2. Add `drawing/DrawingToolDropdown.tsx`.
3. Add `drawing/DrawingToolbarFooter.tsx`.
4. Replace inline JSX branches in `VerticalDrawingToolbar.tsx` with those components.
5. Keep `VerticalDrawingToolbar.tsx` as the only public shell path.

Exit criteria:

- TypeScript passes.
- No root adapter or new barrel is created.
- `VerticalDrawingToolbar.tsx` line count decreases materially.

Rollback:

- Restore the shell and helper files from the snapshot, then remove newly added component files.

### Phase 3 - Architecture Validation

Objective:

Prove the result is not a half-refactor.

Actions:

1. Run TypeScript validation.
2. Search for zombie adapters and unintended barrels.
3. Update Graphify.
4. Update this PRD status and implementation notes.

Exit criteria:

- `./node_modules/.bin/tsc --noEmit` passes.
- `rg "export \\* from|export \\{.*VerticalDrawingToolbar" components/technical-analysis/components/toolbar` shows no root adapter.
- `graphify update .` passes.

Rollback:

- Use the snapshot if validation fails due to this refactor and a targeted patch is not sufficient.

## 10. Validation Plan

- `./node_modules/.bin/tsc --noEmit`
- `rg "export \\* from|export \\{.*VerticalDrawingToolbar" components/technical-analysis/components/toolbar`
- `rg "components/technical-analysis/components/toolbar/drawing/index" components/technical-analysis`
- `wc -l components/technical-analysis/components/toolbar/VerticalDrawingToolbar.tsx components/technical-analysis/components/toolbar/drawing/CursorModeSelector.tsx components/technical-analysis/components/toolbar/drawing/DrawingToolDropdown.tsx components/technical-analysis/components/toolbar/drawing/DrawingToolbarFooter.tsx`
- `graphify update .`

## 11. Risk Register

| Risk | Probability | Impact | Mitigation |
| --- | --- | --- | --- |
| Dropdown close behavior changes | Medium | High | Keep the existing shell-level outside-click effect |
| Tool selection payload changes | Low | High | Pass the existing `handleSelectDrawingTool` callback into extracted components |
| Cursor mode payload changes | Low | Medium | Keep `CursorModeType` typed props and existing dispatch in shell |
| Half-refactor creates adapters | Low | High | No moved public path and no `index.ts` barrel |
| Parallel dirty worktree changes conflict | Medium | Medium | Re-read files before delivery and use targeted diffs |

## 12. Rollback

Rollback snapshot:

- `_Rollback/vertical-drawing-toolbar-shell-refactor-20260603-091000/`

Rollback rules:

- Restore only files changed by this PRD phase.
- Remove newly added `drawing/CursorModeSelector.tsx`, `drawing/DrawingToolDropdown.tsx`, and `drawing/DrawingToolbarFooter.tsx` if the refactor is abandoned.
- Do not restore over newer human or parallel-agent edits without comparing diffs.
- Rerun `./node_modules/.bin/tsc --noEmit` after rollback.

## 13. Completion Criteria

- All required PRD sections are present.
- `VerticalDrawingToolbar.tsx` remains the only public vertical toolbar shell path.
- New internal components are real implementation files, not adapters.
- No `index.ts` or root re-export file is added.
- `VerticalDrawingToolbar.tsx` line count is materially reduced.
- TypeScript passes.
- Graphify is updated.


## 14. Implementation Notes

Implemented on 2026-06-03.

Structural result:

- VerticalDrawingToolbar.tsx remains the only public vertical toolbar shell path.
- drawing/CursorModeSelector.tsx owns cursor trigger and cursor portal rendering.
- drawing/DrawingToolDropdown.tsx owns trend, Fibonacci/Gann, chart-pattern, and forecasting/volume dropdown bodies.
- drawing/DrawingToolbarFooter.tsx owns utility actions and footer rendering without moving the footer into the scroll container.
- No root adapter, no index.ts barrel, and no compatibility path were added.

Validation results:

- npx eslint on the four touched toolbar files: passed.
- ./node_modules/.bin/tsc --noEmit: passed.
- wc -l: VerticalDrawingToolbar.tsx 460, CursorModeSelector.tsx 170, DrawingToolDropdown.tsx 293, DrawingToolbarFooter.tsx 106.
- Browser smoke on /equity/technical-analysis: passed for cursor menu, trend tools, Fibonacci/Gann tools, chart patterns, forecasting/volume tools, disabled utility contracts, Date & Prix, lock, and visibility controls.
- Smoke-found realism fix: the footer trend-line shortcut no longer claims "Mode dessin: ligne de tendance" when another drawing tool is active; it now exposes an action label and aria-pressed only when the trend line is truly active.
- Browser console warnings/errors: none.
- Network: route and market-data API calls returned 200; persistent Turbopack worker requests stayed pending as expected in local dev.
