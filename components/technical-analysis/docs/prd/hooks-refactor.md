# PRD - Technical Analysis Hooks Refactor

Status: Implemented - Deep-Analysis closed with documented facade debt
Date: 2026-06-02
Owner: Technical Analysis frontend
Scope: `components/technical-analysis/hooks`

## 2. Problem Statement

The Technical Analysis hooks folder works, but several hooks now carry too many
responsibilities for safe incremental maintenance. Rendering, market-data
fetching, viewport control, drawing interactions, cursor overlays, persistence,
and action orchestration live in large hook files with mixed pure logic and
imperative browser effects.

This creates five concrete risks:

1. A small renderer or indicator change can affect ECharts options, axis badges,
   comparison labels, RAF scheduling, and visual-ready reporting.
2. Drawing fixes require navigating hit testing, default props, IndexedDB,
   history, keyboard shortcuts, drag behavior, and pointer capture in one file.
3. Network lifecycle behavior is inconsistent across market-data hooks,
   especially delayed realtime enrichment and retry cleanup.
4. Pure viewport and series calculations are hard to test because they are kept
   close to React effects and ECharts mutation scheduling.
5. Future refactors can silently break working behavior unless each phase starts
   from a local rollback snapshot and validates the same user flows.

This PRD exists because a direct refactor would have high regression risk. The
work must be phased, reversible, and validated against the current working
behavior.

## 3. Current Inventory

| File or Area | Current Role | Issue | Target Direction |
| --- | --- | --- | --- |
| `useEChartsRenderer.ts` | ECharts module registration, chart option builder, comparison rendering, badge DOM updates, resize handling, visual-ready reporting | 4,642-line god file; `buildEChartsOption` starts at line 608 and absorbs indicator visibility, panels, series, graphics, axes, labels, and overlays | Keep public hook stable; extract pure option-builder helpers and badge utilities in phases |
| `useDrawingManager.ts` | Drawing state, creation, hit testing, spatial grid, drag/resize, history, IndexedDB style templates, keyboard shortcuts | 2,001-line mixed state machine with very long pointer handlers and placeholder cloud save/restore callbacks | Keep public hook stable; extract defaults, persistence, history, and interaction helpers before pointer-handler split |
| `useChartViewport.ts` | Viewport window math, zoom/pan, y-axis auto range, offscreen price markers, listener registration | 1,202 lines mixing pure math, ECharts mutations, WeakMap registry, DOM listeners, and requestAnimationFrame scheduling | Extract pure viewport math first, then isolate DOM listener wiring |
| `useCursorRenderer.ts` | Cursor canvas, tooltip DOM, crosshair elements, pointer events, particle rendering, chart pixel conversion | 1,048 lines mixing DOM creation, coordinate conversion, draw loop, and mode-specific behavior | Extract DOM builders and coordinate helpers after overlay renderer pilot |
| `useMarketData.ts` | Daily data cache, CSV parsing, Redux dispatch, polling, mock data, replay, realtime enrichment, retry/backoff | 891 lines mixing parsing, network, cache, UI notifications, timers, and replay behavior | Harden lifecycle first; extract parsers/fetchers without changing return contract |
| `useOverlayRenderer.ts` | Drawing overlay rendering subscribed to master render loop | Smaller, focused renderer surface | Use as pilot for coordinate-helper extraction and render-loop contract validation |
| `useMasterRenderLoop.ts` | Shared RAF loop and subscriber degradation tracking | Central performance coordinator already used by overlays | Preserve as canonical RAF owner; do not add competing loops |
| `useMultiChartSync.ts` and helpers | Multi-chart sync, zoom/crosshair propagation, listener attach scheduling | RAF/listener behavior tied to viewport and chart data | Keep stable until viewport extraction is validated |
| `MarketData/useCurrencyConverter.ts` | Currency API conversion with AbortController | Already has useful lifecycle pattern | Keep as reference pattern; avoid unnecessary churn |
| Smaller hooks | Alert monitor, modal orchestration, toolbar handlers, floating menu/toolbar, price-axis menu, object tree, broker/currency state | Lower line count, but many consume contracts from renderer, drawing, viewport, and market data hooks | Touch only when a public contract change requires it |

Current size signal:

```text
useEChartsRenderer.ts                  4642 lines
useDrawingManager.ts                   2001 lines
useChartViewport.ts                    1202 lines
useCursorRenderer.ts                   1048 lines
MarketData/useMarketData.ts             891 lines
useToolbarHandlers.ts                   544 lines
useOverlayRenderer.ts                   512 lines
All hook TypeScript files             13494 lines
```

### Worktree Baseline Caveat

The working baseline is the current local worktree, not a clean Git checkout.
Several hook files were already modified before this PRD was created, so future
implementation must preserve and compare against the local snapshot described
below.

### 3.1 Local Rollback Snapshot

Rollback snapshot created before writing this PRD:

```text
_Rollback/hooks-refactor-plan-20260602-051946/
  MANIFEST.md
  components/technical-analysis/hooks/**
```

Files copied:

- All TypeScript files under `components/technical-analysis/hooks`.
- `components/technical-analysis/hooks/MarketData/MarketDataArchitecture.md`.

Why this scope:

- The PRD covers the hooks subsystem as the refactor boundary.
- High-risk files were already dirty in the worktree.
- Future phases may touch consumers indirectly, but the local rollback barrier
  must first preserve the hook state that currently works.

Baseline commands already run for this PRD:

- `git status --short -- components/technical-analysis/hooks`
- `wc -l components/technical-analysis/hooks/*.ts components/technical-analysis/hooks/MarketData/*.ts`
- `graphify query "Technical Analysis hooks refactor PRD buildEChartsOption useDrawingManager useChartViewport useMarketData" --budget 1200`

Future implementation phases must create a smaller phase-specific snapshot when
they touch a subset of files. The snapshot above is the umbrella baseline for
this PRD; it is not permission to restore the whole hooks folder blindly.

### 3.2 Implementation Note - Overlay/Toolbar TSC Completion

Date: 2026-06-02

This pass closes the incomplete overlay/toolbar finalization that left
`hooks/overlays` empty and the drawing toolbar/config claim failing global
TypeScript validation.

Completed changes:

- `hooks/overlays/overlayCoordinates.ts` now owns shared overlay coordinate
  helpers, chart-usability guards, safe `convertToPixel`, pointer remapping,
  clamping, and overlay scale calculation.
- `hooks/overlays/cursorDom.ts` now owns reusable cursor DOM primitives:
  data-window rows, crosshair element creation, style application, hiding, and
  date-label positioning.
- `useCursorRenderer.ts` and `useOverlayRenderer.ts` import those overlay
  helpers directly instead of keeping root-local duplicates.
- `vertical_line` is now represented consistently in the drawing tool spec and
  icon registry, so toolbar filtering and drawing config share one source of
  truth.
- The Gann/Fibonacci dropdown filter now treats `GANN_TOOLS` as the Gann claim
  source instead of depending on category drift.

Rollback snapshot:

```text
_Rollback/hooks-overlay-toolbar-tsc-20260602-134800/
  MANIFEST.md
```

Validation for this pass:

- `./node_modules/.bin/tsc --noEmit --pretty false` - passed globally.
- `npx eslint` on touched hooks, overlay helpers, toolbar, and drawing config -
  passed.
- `git diff --check` on touched files - passed.

### 3.3 Implementation Note - Hooks Ownership Architecture Gate

Date: 2026-06-02

This pass applies the PRD README v1.4 architecture philosophy to the hooks
folder: root hook files stay as public entrypoints, while internal helpers move
to responsibility folders and root helper zombies are removed.

Completed changes:

- `useMultiChartSync.helpers.ts` was removed from the active hooks root.
- Multi-chart sync internals now live under `hooks/sync/` as types, lookup/range
  logic, and ECharts dispatch helpers.
- Drawing defaults, zod validation, tool-click registries, coordinate guards,
  chart pixel conversion, price-series lookup, and spatial indexing now live
  under `hooks/drawing/`.
- `useDrawingManager.ts` and `useMultiChartSync.ts` remain root public hook
  entrypoints with stable public contracts.

Rollback snapshot:

```text
_Rollback/hooks-architecture-gate-20260602-170114/
  MANIFEST.md
```

Validation for this pass:

- `./node_modules/.bin/tsc --noEmit --pretty false` - passed globally.
- `npx eslint` on touched hook and helper files - passed.
- `git diff --check` on touched PRD, hook, helper, and manifest files - passed.


## 4. Goals

1. Preserve all current Technical Analysis behavior while reducing hook
   complexity in controlled phases.
2. Harden network lifecycle behavior before structural movement.
3. Keep public hook names and return contracts stable unless this PRD explicitly
   changes them.
4. Extract pure calculations into testable helpers before moving React effects.
5. Keep one canonical RAF owner through `useMasterRenderLoop`.
6. Make drawing defaults and persistence explicit, typed, and isolated.
7. Split `buildEChartsOption` into coherent option-builder units without visual
   regression.
8. Make placeholder cloud save/restore behavior honest.
9. Require `_Rollback` snapshots and baseline validation before every risky
   implementation phase.

## 5. Non-Goals

1. No visual redesign of the Technical Analysis chart.
2. No change to chart indicator formulas.
3. No change to drawing geometry or hit-test behavior unless a defect is proven.
4. No Redux architecture rewrite.
5. No new dependency.
6. No server API change.
7. No moving root public hook entrypoints just to create folders.
8. No broad cleanup outside `components/technical-analysis/hooks` unless a
   validation failure proves it is required.

## 6. Target Structure

Root hook files remain public hook entrypoints. They should become smaller
shells only after helper extraction proves behavior is stable.

```text
components/technical-analysis/hooks/
  MarketData/
    MarketDataArchitecture.md
    marketData.parsers.ts
    marketData.fetchers.ts
    realtimeEnrichment.ts
    useCurrencyConverter.ts
    useMarketData.ts
  chart-rendering/
    chartOptionVisibility.ts
    comparisonSeries.ts
    indicatorPanels.ts
    bandSeries.ts
    axisBadges.ts
    echartOptionSections.ts
  drawing/
    drawingDefaults.ts
    drawingPersistence.ts
    drawingHistory.ts
    drawingCoordinates.ts
    drawingSpatialIndex.ts
    drawingInteraction.ts
  viewport/
    viewportMath.ts
    viewportPriceRange.ts
    viewportGraphics.ts
  overlays/
    overlayCoordinates.ts
    cursorDom.ts
    cursorCanvas.ts
  sync/
    multiChartSyncTypes.ts
    multiChartSyncLookup.ts
    multiChartSyncDispatch.ts
  useEChartsRenderer.ts
  useDrawingManager.ts
  useChartViewport.ts
  useCursorRenderer.ts
  useOverlayRenderer.ts
  useMasterRenderLoop.ts
```

## 6.1 Architecture Decision Gate - Hooks Ownership Correction

Date: 2026-06-02

PRD gate:

```text
PRD required? yes
Reason: the correction moves helper ownership boundaries and import paths in a working hooks subsystem.
Architecture risk: high
Rollback tier: full
```

Decision:

- Root hook files remain public hook entrypoints only.
- Internal helper logic must live in a responsibility folder.
- Same-name root helper adapters are not allowed.
- A root helper file may remain only when it is itself a public hook entrypoint; `useMultiChartSync.helpers.ts` does not qualify.

Current ownership inventory:

| File or Area | Public Entry Point? | Current Issue | Canonical Target | Deletion Proof |
| --- | --- | --- | --- | --- |
| `hooks/useMultiChartSync.helpers.ts` | No | Root helper competes with the domain-folder architecture and keeps sync internals beside public hooks | `hooks/sync/multiChartSyncTypes.ts`, `hooks/sync/multiChartSyncLookup.ts`, `hooks/sync/multiChartSyncDispatch.ts` | Delete the root helper and run `rg "useMultiChartSync.helpers" components/technical-analysis` |
| `hooks/useMultiChartSync.ts` | Yes | Imports a root helper path that should not remain canonical | Keep as root public hook shell; import from `hooks/sync/*` | TypeScript compile proves public hook contract remains available |
| `hooks/useDrawingManager.ts` | Yes | Public hook also owns drawing defaults, zod validation, chart coordinate guards, price-series lookup, and spatial indexing | Keep as root public hook shell; move pure helpers to `hooks/drawing/*` | Root file no longer declares those helper clusters |
| `hooks/drawing/drawingPersistence.ts` | No | Already canonical drawing persistence helper | Keep under `hooks/drawing/` | No adapter needed |
| `hooks/overlays/*`, `hooks/viewport/*`, `hooks/chart-rendering/*`, `hooks/MarketData/*` | No | Existing responsibility folders from earlier phases | Preserve as canonical helper folders | Import searches must not create duplicate root helper paths |

Rejected strategies:

- Moving public hooks into domain folders now: rejected because the PRD explicitly preserves root hook entrypoints and public import contracts.
- Keeping `useMultiChartSync.helpers.ts` as a compatibility adapter: rejected because it would create a zombie root helper with the same canonical role as `hooks/sync/*`.
- Creating a `hooks/sync/index.ts` barrel for this pass: rejected because a barrel would obscure the exact helper ownership while the migration is being validated.

Phase-specific rollback snapshot:

```text
_Rollback/hooks-architecture-gate-20260602-170114/
  MANIFEST.md
  components/technical-analysis/docs/prd/hooks-refactor.md
  components/technical-analysis/hooks/useDrawingManager.ts
  components/technical-analysis/hooks/useMultiChartSync.ts
  components/technical-analysis/hooks/useMultiChartSync.helpers.ts
  components/technical-analysis/hooks/drawing/drawingPersistence.ts
```

Completion proof for this gate:

- `components/technical-analysis/hooks/useMultiChartSync.helpers.ts` no longer exists.
- `useMultiChartSync.ts` imports sync helpers from `hooks/sync/*`.
- `useDrawingManager.ts` imports drawing defaults, coordinate helpers, and spatial indexing from `hooks/drawing/*`.
- `rg "useMultiChartSync.helpers" components/technical-analysis` has no active source-code hit outside rollback or PRD history.


## Adapter Rule

Compatibility adapters are not needed for the first phases because existing root
hook files remain the public entrypoints.

If a later phase moves a public hook entrypoint, the PRD implementation notes
must specify:

- Which old import path is protected.
- Which canonical path replaces it.
- Which phase removes the adapter.
- Which import search proves removal is safe.

Permanent same-name adapters are not allowed. Prefer root hook shells that keep
real behavior and import distinct helper modules.

## Requirements

### Functional Requirements

### FR-001 - Rollback Before Refactor

Every implementation phase that changes existing hook behavior must create or
reuse a targeted `_Rollback` snapshot before editing.

Acceptance:

- The phase notes list copied files and manifest path.
- The manifest includes hashes and baseline validation.
- Rollback restores only the implementation delta, never the whole repo.

### FR-002 - Network Lifecycle Is Hardened First

Market-data network work must not leave delayed fetches, polling intervals, or
retry timers alive after unmount or symbol/timeframe changes.

Acceptance:

- `useMarketData` delayed realtime enrichment can be cancelled from effect
  cleanup.
- Retry timers are not allowed to update state after unmount.
- Existing mock, replay, and real-data behavior remains unchanged.

### FR-003 - Public Hook Contracts Stay Stable

Consumers of existing hooks must not be forced to change during helper
extraction phases.

Acceptance:

- Existing hook exports remain available.
- Existing returned fields and callback names remain stable.
- TypeScript catches any intentional contract change.

### FR-004 - Viewport Math Is Extracted Before DOM Wiring

Pure viewport calculations must move before listener registration or ECharts
mutation logic is changed.

Acceptance:

- `clampViewportWindow`, `computeDirectionalZoomViewport`,
  `computeHorizontalPanViewport`, and auto-price-range logic remain behaviorally
  equivalent.
- Unit-level validation covers boundary cases: empty data, min visible bars,
  cursor-focused zoom, and y-axis auto scale.

### FR-005 - ECharts Option Builder Is Split By Responsibility

`buildEChartsOption` must be decomposed into pure section builders without
changing visual output.

Acceptance:

- Main price/candle series, volume, comparison series, indicator panels,
  graphics, axes, dataZoom, and hidden-object visibility remain intact.
- The extracted helpers do not mutate input arrays.
- No indicator panel disappears when toggles are unchanged.

### FR-006 - Drawing Manager State Machine Remains Stable

Drawing creation, selection, drag, history, defaults, and persistence must
continue to behave as before.

Acceptance:

- Undo/redo history still records completed drawing changes.
- Dragging points and shapes still updates the same drawing fields.
- IndexedDB style defaults and named templates still validate with the same
  schemas.
- Pointer capture and keyboard cleanup remain intact.

### FR-007 - Overlay And Cursor Rendering Keep One RAF Model

Overlay and cursor work must not reintroduce competing animation loops.

Acceptance:

- `useOverlayRenderer` continues to use `useMasterRenderLoop`.
- New cursor helper extraction does not add an unmanaged permanent RAF loop.
- Canvas and DOM crosshair cleanup runs on unmount.

### FR-008 - Cloud Drawing Contract Is Honest

The drawing manager must not expose enabled cloud save/restore behavior that
only logs a warning.

Acceptance:

- Cloud save/restore is either implemented, disabled at the UI boundary, or
  removed through a compatibility-safe contract update.
- No user-facing control appears to complete cloud persistence unless it really
  does.

### Non-Functional Requirements

### NFR-001 - No Visual Regression

The chart, overlays, cursor, drawing canvas, and tool interactions must look and
behave the same after each phase unless the phase explicitly changes behavior.

### NFR-002 - Performance

- Do not add additional global RAF loops.
- Keep option building O(series + indicators + comparison data).
- Do not clone large chart arrays more than the current implementation requires.
- Preserve the existing 10,000 candle cap behavior where present.

### NFR-003 - Reliability

- All intervals, timeouts, event listeners, observers, and AbortControllers must
  be cleaned up.
- State updates after unmount are defects.
- Async work must be scoped to the current symbol/timeframe/fetch generation.

### NFR-004 - Testability

- Pure helpers must be exported from helper modules when useful for tests.
- Helpers must accept explicit inputs rather than reading refs or globals.
- Browser-specific code stays in hooks or DOM helper modules.

### NFR-005 - Backward Compatibility

- Root hook exports remain stable through the refactor.
- If a public return contract changes, the phase must migrate all consumers and
  document the change.

## Migration Plan

### Phase 0 - Baseline And Guardrails

Objective:

Create a reversible working baseline and verify the current system before code
changes.

Actions:

0. Use `_Rollback/hooks-refactor-plan-20260602-051946/` as the umbrella snapshot.
1. Before any code phase, create a smaller phase-specific `_Rollback` snapshot
   for the files actually touched.
2. Run baseline validation before the first code edit.
3. Record failing baseline checks as pre-existing, not as refactor failures.

Files or areas affected:

- `_Rollback/hooks-refactor-plan-20260602-051946/`
- `components/technical-analysis/docs/prd/hooks-refactor.md`

Local rollback snapshot requirements:

- Already created for the full hooks subsystem.
- Future phases must add targeted snapshots, not overwrite this one.

Exit criteria:

- PRD is approved.
- Baseline commands are selected and recorded.

Rollback strategy:

- Delete only this PRD if the plan is rejected.
- Do not restore hook files unless a later implementation phase modifies them.

### Phase 1 - Network Lifecycle Hardening

Objective:

Fix cancellation and cleanup risks before moving code.

Actions:

0. Create `_Rollback/hooks-network-lifecycle-<timestamp>/`.
1. Verify that market-data realtime enrichment and retry cleanup are cancellable.
2. Store and clear `useMarketData` realtime enrichment cancellation from the
   owning effect cleanup.
3. Track retry timers so they cannot fire after unmount or stale fetch IDs.
4. Keep parsing, Redux dispatch, replay, and mock generation unchanged.

Files or areas affected:

- `components/technical-analysis/hooks/MarketData/useMarketData.ts`
- `components/technical-analysis/hooks/MarketData/useCurrencyConverter.ts` as
  reference only unless validation requires a change.

Local rollback snapshot requirements:

- Snapshot exactly the files edited in this phase.

Exit criteria:

- Typecheck passes.
- Lint passes for touched files.
- Mock and real data mode still load.
- Switching symbol/timeframe does not leave stale updates.

Rollback strategy:

- Patch back only lifecycle additions that fail validation.
- Restore full files from phase snapshot only if patch rollback is unsafe.

### Phase 2 - Viewport Pure Helper Extraction

Objective:

Move viewport calculations out of the React hook before touching DOM listeners.

Actions:

0. Create `_Rollback/hooks-viewport-pure-<timestamp>/`.
1. Extract clamp, span, zoom, pan, wheel normalization, and auto-price-range
   helpers.
2. Keep `useChartViewport` as the public hook entrypoint.
3. Add focused tests or static validation for helper edge cases where the
   project test harness allows it.

Files or areas affected:

- `components/technical-analysis/hooks/useChartViewport.ts`
- `components/technical-analysis/hooks/viewport/*`

Local rollback snapshot requirements:

- Snapshot `useChartViewport.ts` and any new helper files if a second pass edits
  them.

Exit criteria:

- Existing viewport interactions work: zoom, pan, reset, auto y-axis.
- No listener registration behavior changes in this phase.

Rollback strategy:

- Move helper logic back into `useChartViewport.ts` only for the failing helper.

### Phase 3 - Market Data Parser And Fetcher Extraction

Objective:

Separate parsing/fetching from hook state without changing data semantics.

Actions:

0. Create `_Rollback/hooks-market-data-extract-<timestamp>/`.
1. Extract CSV parsers and daily fetch/cache helpers.
2. Extract realtime enrichment into a cancellable helper.
3. Keep `useMarketData`, `useLiveMetrics`, and `useComparisonManager` exports.
4. Update `MarketDataArchitecture.md` only if the actual architecture changes.

Files or areas affected:

- `components/technical-analysis/hooks/MarketData/useMarketData.ts`
- `components/technical-analysis/hooks/MarketData/marketData.parsers.ts`
- `components/technical-analysis/hooks/MarketData/marketData.fetchers.ts`
- `components/technical-analysis/hooks/MarketData/realtimeEnrichment.ts`
- `components/technical-analysis/hooks/MarketData/MarketDataArchitecture.md`

Local rollback snapshot requirements:

- Snapshot source and generated helper files before editing a second time.

Exit criteria:

- Historical daily data still displays.
- Live snapshot dispatch still uses the same symbol and snapshot fields.
- Comparison manager statuses remain stable.

Rollback strategy:

- Re-inline extracted helper only if its boundary changes behavior.

### Phase 4 - Overlay And Cursor Helper Extraction

Objective:

Use the smaller overlay renderer as the pilot before cursor renderer split.

Actions:

0. Create `_Rollback/hooks-overlay-cursor-<timestamp>/`.
1. Extract shared overlay coordinate conversion helpers.
2. Extract cursor DOM creation/update helpers.
3. Keep cleanup and event listener behavior unchanged.
4. Confirm no unmanaged RAF loop is added.

Files or areas affected:

- `components/technical-analysis/hooks/useOverlayRenderer.ts`
- `components/technical-analysis/hooks/useCursorRenderer.ts`
- `components/technical-analysis/hooks/overlays/*`
- `components/technical-analysis/hooks/useMasterRenderLoop.ts` only if required.

Local rollback snapshot requirements:

- Snapshot overlay, cursor, and master render loop files if touched.

Exit criteria:

- Cursor modes still render.
- Crosshair and tooltip hide on leave/unmount.
- Drawing overlay still renders with master loop subscription.

Rollback strategy:

- Restore helper extraction for only the failing renderer.

### Phase 5 - ECharts Option Builder Decomposition

Objective:

Split the chart option builder by option responsibility while preserving visual
output.

Actions:

0. Create `_Rollback/hooks-echarts-option-<timestamp>/`.
1. Extract object visibility and indicator panel predicates.
2. Extract comparison-series helpers.
3. Extract band/filled-series helpers.
4. Extract dataZoom, axis, grid, and graphic builders.
5. Keep `applyChartOption`, `useChartBadges`, and chart lifecycle behavior
   stable.

Files or areas affected:

- `components/technical-analysis/hooks/useEChartsRenderer.ts`
- `components/technical-analysis/hooks/chart-rendering/*`

Local rollback snapshot requirements:

- Snapshot `useEChartsRenderer.ts` before each subphase.

Exit criteria:

- Existing chart types, overlays, indicators, comparison labels, and badges
  render the same.
- `buildEChartsOption` shrinks without losing option fields.
- Typecheck and browser smoke pass.

Rollback strategy:

- Revert the specific extracted section, not the whole renderer, unless the
  option shape becomes untraceable.

### Phase 6 - Drawing Manager Decomposition

Objective:

Split drawing manager by stable subdomains without changing drawing behavior.

Actions:

0. Create `_Rollback/hooks-drawing-manager-<timestamp>/`.
1. Extract drawing defaults and tool max-click registry.
2. Extract IndexedDB persistence and zod validation helpers.
3. Extract history operations.
4. Extract coordinate conversion helpers.
5. Extract drawing creation defaults before pointer-handler decomposition.
6. Split pointer down/move/up only after defaults and history are validated.

Files or areas affected:

- `components/technical-analysis/hooks/useDrawingManager.ts`
- `components/technical-analysis/hooks/drawing/*`

Local rollback snapshot requirements:

- Snapshot `useDrawingManager.ts` before every subphase.

Exit criteria:

- Existing tools can be created, selected, dragged, deleted, undone, and redone.
- Named templates and style defaults persist.
- Pointer capture and keyboard deletion still work.

Rollback strategy:

- Re-inline the failing drawing helper.
- Never restore the full file if new human edits appeared after the snapshot.

### Phase 7 - Hook Contract Cleanup

Objective:

Make incomplete hook contracts honest and remove any temporary extraction debt.

Actions:

0. Create `_Rollback/hooks-contract-cleanup-<timestamp>/`.
1. Resolve `saveDrawingToCloud` and `restoreDrawingsFromCloud` as implemented,
   disabled, or compatibility-safe removed.
2. Remove temporary adapters if any were introduced.
3. Search for stale placeholder warnings and dead imports.

Files or areas affected:

- `components/technical-analysis/hooks/useDrawingManager.ts`
- Hook consumers only if a public contract is intentionally changed.

Local rollback snapshot requirements:

- Snapshot drawing manager and any consumer changed.

Exit criteria:

- No enabled cloud persistence path is a warning-only no-op.
- Import search is clean.
- Typecheck and smoke flows pass.

Rollback strategy:

- Restore old contract only if consumers cannot be migrated safely in the phase.

## Validation Plan

Static validation:

- `./node_modules/.bin/tsc --noEmit`
- `npx eslint components/technical-analysis/hooks`
- `rg "Cloud Save not implemented|Cloud Restore not implemented" components/technical-analysis`
- `rg "requestAnimationFrame" components/technical-analysis/hooks`
- `rg "setInterval|setTimeout|addEventListener" components/technical-analysis/hooks`

Runtime smoke:

- Open `/equity/technical-analysis`.
- Confirm mock data chart loads.
- Confirm real BRVM data mode loads or fails gracefully without stale state.
- Switch symbol and supported visible time ranges.
- Toggle core indicators and advanced indicators.
- Switch chart types.
- Enable comparison symbols and confirm end labels remain stable.
- Draw, select, drag, resize, delete, undo, and redo at least one drawing.
- Test cursor modes and crosshair tooltip behavior.
- Test multi-chart sync after viewport changes.

Regression validation:

- The same flows above must pass after each phase.
- Any baseline failure found before refactor must be recorded as pre-existing.

Build validation:

- `npm run build` when the phase touches bundling, exports, or shared chart
  rendering.

Browser validation:

- Capture before/after screenshots for the chart viewport when touching
  renderer, viewport, cursor, overlay, or drawing code.

## Risk Register

| Risk | Probability | Impact | Mitigation |
| --- | --- | --- | --- |
| `buildEChartsOption` loses an option field during extraction | High | High | Extract by section, compare option shape, run browser smoke and indicator toggles |
| Drawing pointer behavior regresses after handler split | High | High | Extract defaults/history before pointer logic; test every pointer operation |
| Async market-data request updates stale state | Medium | High | Harden lifecycle before structural movement |
| Refactor overwrites pre-existing local worktree changes | Medium | High | Use `_Rollback` snapshots and diff before restore |
| New helper folders create circular imports | Medium | Medium | Keep helpers pure and imported by root hooks only at first |
| Extra RAF loops hurt chart performance | Medium | High | Preserve `useMasterRenderLoop` as canonical loop owner |
| Public hook return contracts drift silently | Medium | High | Keep root exports stable and rely on TypeScript plus consumer smoke |

## Rollback

Rollback must use the smallest safe reversal:

1. Stop the current phase.
2. Identify whether the failure existed before the phase.
3. Diff the touched file against the matching phase `_Rollback` snapshot.
4. Patch back the broken helper or function.
5. Restore a full file only when patch rollback is unsafe.
6. Re-run the same validation that failed.

Umbrella snapshot:

```text
_Rollback/hooks-refactor-plan-20260602-051946/
```

Phase snapshots must be created before each implementation phase. The umbrella
snapshot preserves the current hooks baseline, but it must not be used for blind
folder-wide restore.

Data migration:

- None expected.

Compatibility paths:

- Root hook entrypoints remain stable by default.
- Temporary adapters require explicit implementation notes and a removal phase.

## Completion Criteria

This PRD is complete when:

- All phases that are approved have phase-specific rollback manifests.
- Network lifecycle defects are hardened before structural movement.
- Root hook public contracts remain stable or all consumers are migrated.
- `useEChartsRenderer.ts`, `useDrawingManager.ts`, `useChartViewport.ts`, and
  `useCursorRenderer.ts` are reduced through extracted helpers without visual
  regression.
- Placeholder cloud drawing behavior is resolved honestly.
- Static validation and runtime smoke pass after each phase.
- Temporary adapters, if any, are removed.
- Implementation notes record any rollback decision.

## Applying This PRD

1. Read this full PRD.
2. Read the phase-specific files through Graphify before opening many raw files.
3. Create a phase-specific `_Rollback` snapshot before the first code edit.
4. Run and record baseline validation.
5. Implement only one phase at a time.
6. Validate after the phase.
7. If a regression appears, use the phase snapshot before attempting a second
   refactor path.
8. Do not commit or push unless explicitly instructed.

## Implementation Notes

### 2026-06-02 - Phase 1 Network Lifecycle

Status: Implemented

Rollback snapshot:

```text
_Rollback/hooks-network-lifecycle-20260602-052822/
```

Changes:

- `useMarketData` realtime enrichment now has tracked cancellation, background
  request aborting, timeout cleanup, and stale fetch invalidation during effect
  cleanup.
- `useMarketData` retry backoff timer is now stored and cleared before new
  fetches and during cleanup.
- `useComparisonManager` comparison grace timers are now tracked and cleared,
  and stale comparison fetch completions no longer dispatch after effect cleanup.

Validation:

- `git diff --check -- components/technical-analysis/hooks/MarketData/useMarketData.ts components/technical-analysis/docs/prd/hooks-refactor.md _Rollback/hooks-network-lifecycle-20260602-052822/MANIFEST.md`
- `npx eslint components/technical-analysis/hooks/MarketData/useMarketData.ts`
- `./node_modules/.bin/tsc --noEmit`




### 2026-06-02 - Finalization Pass

Status: Implemented with rollback caveat for `useEChartsRenderer.ts`

Rollback snapshot:

```text
_Rollback/hooks-finalize-20260602-125900/
```

Changes:

- Extracted IndexedDB persistence into `hooks/drawing/drawingPersistence.ts`. `useModalOrchestrator` and `useTechnicalAnalysisActions` now consume the storage boundary directly instead of importing storage helpers from `useDrawingManager`.
- Replaced drawing cloud warning-only callbacks with an explicit disabled cloud persistence status and disabled callback result. Existing callback names remain available.
- Extracted market-data parsing, daily CSV fetching, and realtime enrichment scheduling into dedicated `MarketData/*` helpers.
- Extracted viewport math, auto price range, safe grid geometry, and offscreen price-level graphics into dedicated `viewport/*` helpers while preserving `useChartViewport` exports as compatibility facade.
- Hardened `useCursorRenderer` chart-event binding so it detaches from stale ECharts instances and rebinds on `interactionScopeKey` changes.
- Extracted pure comparison-series and band-fill helpers from `useEChartsRenderer` into `chart-rendering/comparisonSeries.ts` and `chart-rendering/bandSeries.ts`.

Rollback caveat:

- The targeted snapshot copied all edited root hooks except `useEChartsRenderer.ts`; that file remains protected by the umbrella snapshot `_Rollback/hooks-refactor-plan-20260602-051946/`. If the ECharts extraction must be reversed, rollback by patching the imported helper boundaries only. Do not restore the full ECharts file blindly because the worktree contains newer local edits.

Validation:

- `git diff --check -- <touched hooks and PRD files>`: passed.
- `npx eslint <touched hooks and helper files>`: passed.
- `./node_modules/.bin/tsc --noEmit --pretty false`: failed only on unrelated toolbar/config files already outside this hooks claim: `components/technical-analysis/components/toolbar/VerticalDrawingToolbar.tsx`, `components/technical-analysis/components/toolbar/drawing-toolbar/drawingToolFilters.ts`, `components/technical-analysis/config/drawing/drawingToolIconRegistry.tsx`. No touched hook/helper file appeared in TypeScript errors.

Remaining production-hardening note:

- The large hooks are materially smaller and their pure boundaries are now testable, but `useEChartsRenderer` and `useDrawingManager` are still large root facades. Further decomposition should continue from these helper boundaries, not by moving public hook entrypoints.

### 2026-06-05 - Deep-Analysis Closure Gate

Status: Implemented.

Closure decision:

- The hooks folder has completed its dedicated Deep-Analysis pass.
- Root `use*.ts` files remain the public hook entrypoints by design.
- Internal helpers are owned by responsibility folders: `MarketData/`,
  `chart-rendering/`, `drawing/`, `viewport/`, `overlays/`, and `sync/`.
- The closure does not claim that the large public facades disappeared.
  `useEChartsRenderer.ts` and `useDrawingManager.ts` remain explicit follow-up
  decomposition surfaces, but their next work must continue from existing helper
  boundaries instead of moving public hook entrypoints.
- No runtime hook file was changed during this closure pass.

Static validation:

- `npx eslint components/technical-analysis/hooks`: PASS.
- `npx eslint components/technical-analysis/hooks components/technical-analysis/components/chart`: PASS.
- `./node_modules/.bin/tsc --noEmit --pretty false`: PASS on the reread current worktree.
- `git diff --check -- components/technical-analysis/hooks components/technical-analysis/components/chart components/technical-analysis/docs/prd/hooks-refactor.md`: PASS.
- `rg "Cloud Save not implemented|Cloud Restore not implemented" components/technical-analysis --glob "!docs/prd/hooks-refactor.md" --glob "!style_backup/**"`: no active code hit.
- `rg "useMultiChartSync.helpers" components/technical-analysis --glob "!docs/prd/hooks-refactor.md"`: no active code hit outside this PRD history.

Runtime validation:

- Chrome DevTools MCP workflow was used against
  `http://localhost:3000/equity/technical-analysis`.
- Page snapshot confirmed the Technical Analysis shell, toolbar, chart controls,
  footer, sidebar, and market data panels render.
- Time-range interaction: clicked `5J`; the active pressed state moved to `5J`.
- Indicator interaction: clicked `Indicateurs`; the indicators dialog became
  visible and loaded its dynamic chunks.
- Escape interaction: closed the indicators dialog; visible dialog count returned
  to `0`.
- Canvas proof: 4 canvases present; primary ECharts canvas and sidebar chart
  canvas were non-blank.
- Console proof: no runtime error logged during the smoke. DevTools reported one
  accessibility issue for a form field without `id` or `name`; it is not a hooks
  runtime regression and should be handled by a later UI accessibility pass.

Next untreated component folder:

- `components/technical-analysis/components/panels` should follow after the
  already-open overlays claim is completed, because panels only has indirect
  coverage from modals/config and no dedicated Deep-Analysis PRD.
