# PRD - Technical Analysis Modals UI Refactor

Status: Implemented - Phase 1/2 canonical imports migrated, root adapters removed
Date: 2026-06-01
Owner: Technical Analysis frontend
Scope: `components/technical-analysis/components/modals`

## 1. Problem Statement

The `modals` folder currently works, but it no longer represents a clean modal
boundary. It contains dialog shells, orchestration, indicator catalog logic,
drawing settings logic, object-tree side panel behavior, alert authoring,
symbol search, global settings, broker simulation, and chart data replacement
flows.

This creates five concrete risks:

1. A small modal change can affect chart rendering, indicator visibility,
   object-tree state, or broker/order behavior.
2. Large files hide business rules that should be owned by typed registries,
   hooks, or feature-specific modules.
3. Performance-sensitive UI such as `IndicatorsModal` and `ObjectTreePanel`
   depends on duplicated knowledge about indicators and chart objects.
4. Several modals expose UI contracts that look complete while some fields are
   inert, live-applied, or only partially persisted.
5. Future feature work will keep increasing blast radius unless the folder is
   split by responsibility.

The refactor must turn `modals` into a predictable modal orchestration layer and
move feature subsystems into explicit domains without changing user-facing
behavior in the first migration phases.

## 2. Current Inventory

| File | Current Role | Main Issue | Target Direction |
| --- | --- | --- | --- |
| `ModalOrchestrator.tsx` | Central modal composition and Redux bridge | Knows about dynamic loading, chart data replacement, replay, saved analyses, scroll memory, and many modal-specific props | Move to `modals/orchestration` and keep only orchestration-level wiring |
| `indicatorsModalLoader.ts` | Lazy loader for `IndicatorsModal` | Good pattern, currently colocated at root | Move to `modals/orchestration` or `modals/indicators` with stable adapter |
| `IndicatorsModal.tsx` | Indicator catalog, activation UI, metrics, search, scroll memory, object reveal triggers | 3000+ line subsystem; duplicates indicator knowledge with renderers and object tree | Split into indicator shell, catalog data, cards, selectors, hooks, and scroll helpers |
| `DrawingSettingsModal.tsx` | Drawing tool settings editor for many drawing families | 3200+ line branching component; contains repeated update patterns and render-time state sync | Split into drawing settings feature modules by tool family |
| `ObjectTreePanel.tsx` | Object tree side panel and indicator/drawing visibility manager | 2100+ lines; not a modal; duplicates indicator/object knowledge | Move to `components/panels/object-tree` with adapters during migration |
| `BrokerModal.tsx` | Broker connection and order ticket simulation | Direct portal, simulated broker catalog, weak numeric validation, TP/SL not persisted | Move to `trading/broker` or `modals/broker` and clearly isolate paper-trading behavior |
| `SearchSymbolModal.tsx` | Symbol search and compare/replace UI | Smart Redux component with legacy props that are mostly ignored | Move to `modals/search-symbol` and prune props through compatibility adapters |
| `AlertsModal.tsx` | Alert creation modal | Render-time state sync, partially uncontrolled notification options, weak numeric validation | Move to `modals/alerts`, add draft state and validation |
| `AlertDetailsModal.tsx` | Alert detail editor | Several UI controls are inert or fixed; menu position props are unused | Move to `modals/alerts`, make fields stateful or remove false affordances |
| `GlobalSettingsModal.tsx` | Chart/global settings | Apply-live behavior conflicts with a confirm-style footer | Move to `modals/settings`, make live-apply explicit or add draft/commit |
| `CompareSeriesSettingsModal.tsx` | Compare series settings | Good draft/commit model, helper already extracted | Use as reference pattern for other settings modals |
| `CompareSeriesSettingsModal.helpers.ts` | Compare modal helpers | Good separation, root location is noisy | Move with compare settings feature |
| `DatePickerModal.tsx` | Date range picker | Moderate size, modal-specific | Move to `modals/date-picker` |
| `LoadAnalysisModal.tsx` | Saved analysis loader | Moderate size, modal-specific | Move to `modals/analysis` |
| `IndicatorTemplatesModal.tsx` | Indicator template picker | Small modal, belongs with indicators | Move to `modals/indicators/templates` |
| `PublishOptionsModal.tsx` | Publish options | Small modal, currently root-level noise | Move to `modals/publish` |
| `ReplayModal.tsx` | Replay settings | Small modal, currently root-level noise | Move to `modals/replay` |
| `MoreOptionsModal.tsx` | More actions menu/modal | Small modal, currently root-level noise | Move to `modals/more-options` |

Current size signal:

```text
DrawingSettingsModal.tsx       3284 lines
IndicatorsModal.tsx            3056 lines
ObjectTreePanel.tsx            2132 lines
BrokerModal.tsx                 556 lines
SearchSymbolModal.tsx           408 lines
ModalOrchestrator.tsx           346 lines
Total folder size             11415 lines
```

## 3. Goals

1. Make `modals` mean modal orchestration and modal shells, not every UI
   subsystem connected to a modal.
2. Preserve behavior during the first migration phase, then migrate internal call sites to canonical imports.
3. Reduce the three largest files into feature-owned modules with explicit
   boundaries.
4. Centralize indicator/object registry knowledge so indicator activation,
   object-tree visibility, and renderer identity do not drift.
5. Remove render-time state synchronization from modal components.
6. Make alert, global settings, and broker UI contracts honest and validated.
7. Preserve all current user-facing behavior on `/equity/technical-analysis`
   during structural migration.
8. Keep scroll and interaction performance stable for heavy modals and panels.

## 4. Non-Goals

1. No visual redesign of Technical Analysis modals.
2. No change to chart rendering algorithms.
3. No change to indicator formulas.
4. No removal of legacy import paths until internal consumers are migrated and validation is green.
5. No replacement of Redux state architecture in this PRD.
6. No real broker integration in this refactor.
7. No new dependency unless the project already contains it or a measurable
   defect cannot be solved locally.
8. No cleanup of unrelated chart, toolbar, sidebar, or renderer files except
   adapter imports required by the migration.

## 5. Target Structure

The long-term target keeps feature-owned paths; the implemented Phase 1/2 subset now uses canonical feature paths without root-level same-name adapters:

```text
components/technical-analysis/components/modals/
  orchestration/
    ModalOrchestrator.tsx
    indicatorsModalLoader.ts
    scrollMemory.ts
  indicators/
    IndicatorsModal.tsx
    IndicatorsModalShell.tsx
    catalog/
      backendIndicatorGroups.ts
      bottomPanelIndicators.ts
      compositeIndicatorSpecs.ts
      indicatorSearch.ts
      indicatorTypes.ts
    cards/
      AdvancedMovingAverageCard.tsx
      CompositeIndicatorCard.tsx
      IndicatorCard.tsx
      MACard.tsx
      MetricIndicatorCard.tsx
      TrendSignalCard.tsx
    hooks/
      useIndicatorActivation.ts
      useIndicatorCatalog.ts
      useIndicatorMetrics.ts
      useIndicatorSearch.ts
      useIndicatorsScrollMemory.ts
    templates/
      IndicatorTemplatesModal.tsx
  drawings/
    DrawingSettingsModal.tsx
    sections/
      CoordinatesSection.tsx
      StyleSection.tsx
      TextSection.tsx
      VisibilitySection.tsx
    families/
      anchoredVwap.tsx
      barPattern.tsx
      fibonacci.tsx
      forecast.tsx
      gann.tsx
      geometry.tsx
      position.tsx
      regression.tsx
    hooks/
      useDrawingSettingsDraft.ts
      useOpenDrawingSettingsReset.ts
    utils/
      updateDrawingProps.ts
  alerts/
    AlertsModal.tsx
    AlertDetailsModal.tsx
    alertDraft.ts
    alertValidation.ts
  settings/
    GlobalSettingsModal.tsx
  compare/
    CompareSeriesSettingsModal.tsx
    compareSeriesSettings.helpers.ts
  broker/
    BrokerModal.tsx
    brokerDraft.ts
    brokerValidation.ts
  search-symbol/
    SearchSymbolModal.tsx
    symbolSearch.ts
  analysis/
    LoadAnalysisModal.tsx
  date-picker/
    DatePickerModal.tsx
  more-options/
    MoreOptionsModal.tsx
  publish/
    PublishOptionsModal.tsx
  replay/
    ReplayModal.tsx
  shared/
    useModalDraft.ts
    useOpenReset.ts
    useStableModalCallback.ts
```

`ObjectTreePanel` has left `modals` because it is a panel, not a dialog:

```text
components/technical-analysis/components/panels/object-tree/
  ObjectTreePanel.tsx
  buildObjectTreeItems.ts
  objectTreeActions.ts
  objectTreeGroups.ts
  objectTreeTypes.ts
  useObjectTreeItemActions.ts
```

Compatibility adapters were allowed only during migration and have been removed after internal call sites moved to canonical imports. Canonical replacements live under:

```text
components/technical-analysis/components/modals/orchestration/
components/technical-analysis/components/modals/indicators/
components/technical-analysis/components/modals/drawings/
components/technical-analysis/components/modals/alerts/
components/technical-analysis/components/modals/settings/
components/technical-analysis/components/modals/compare/
components/technical-analysis/components/modals/broker/
components/technical-analysis/components/modals/search-symbol/
components/technical-analysis/components/modals/analysis/
components/technical-analysis/components/modals/date-picker/
components/technical-analysis/components/modals/more-options/
components/technical-analysis/components/modals/publish/
components/technical-analysis/components/modals/replay/
components/technical-analysis/components/panels/object-tree/
```

New code must import from the canonical feature folder directly. Do not recreate root-level same-name adapters under `modals/`.

## 6. Functional Requirements

### FR-001 - Compatibility First

Existing internal imports from `components/technical-analysis/components/modals/*`
must be migrated to canonical feature folders after the initial migration.

Acceptance:

- New canonical import paths are available for all feature modules.
- No root-level same-name adapter remains after the migration is validated.
- `./node_modules/.bin/tsc --noEmit` passes after every phase.

### FR-002 - Orchestration Boundary

`ModalOrchestrator` must only orchestrate modal mounting, closing, lazy loading,
and cross-modal data flow.

Acceptance:

- Indicator scroll-memory helpers move out of the component body.
- Dynamic loader ownership is explicit.
- Chart data replacement helpers are extracted or clearly isolated.
- Modal-specific business rules are not added directly to the orchestrator.

### FR-003 - Indicator Registry Single Source

Indicator identity, display metadata, object-tree IDs, activation handlers, and
renderer-visible keys must come from a shared typed registry or typed registry
facade.

Acceptance:

- Adding a new indicator does not require duplicating labels and IDs manually in
  both `IndicatorsModal` and `ObjectTreePanel`.
- SMA/EMA/advanced moving average identity remains stable.
- Composite indicator groups keep the current user-facing behavior.
- `VAC-INDICATOR-COUNT-001` is respected: no backend indicator output is lost
  during regrouping.

### FR-004 - Indicators Modal Split

`IndicatorsModal` must become a shell that composes catalog hooks, cards,
search, scroll-memory, and activation handlers.

Acceptance:

- Leaf cards stay memoized where they are currently performance-sensitive.
- Optimistic local activation remains in place for immediate feedback.
- Redux/ECharts-heavy updates continue to yield to the event loop where needed.
- Search and filtering are memoized and do not rebuild the full catalog on every
  unrelated Redux render.
- Scroll restoration remains stable and does not reintroduce
  `content-visibility:auto`.

### FR-005 - Drawing Settings Split

`DrawingSettingsModal` must be split by settings sections and drawing families.

Acceptance:

- Render-time state setters are removed.
- Open/reset logic moves to an effect or a small hook.
- Repeated nested `updateDrawing` patterns are centralized in helper functions.
- Each drawing family owns only its relevant controls.
- Existing drawing setting behavior remains unchanged.
- The Visibility tab is either implemented honestly or hidden for tools where
  it has no behavior.

### FR-006 - Object Tree Relocation

`ObjectTreePanel` must move out of `modals` and become a panel-owned subsystem.

Acceptance:

- No root object-tree adapter remains after import migration.
- Build logic, item action logic, and group state are separated.
- Global show/hide/lock/unlock behavior remains unchanged.
- Large drawing sets do not become slower due to unbatched updates.
- Indicator/object registry knowledge is shared with indicator modules.

### FR-007 - Alerts Contract Correctness

Alert modals must only render controls that are stateful, validated, and
persisted.

Acceptance:

- No `value=""` plus no-op `onChange` remains on user-editable fields.
- Notification toggles are either persisted or removed from the editable UI.
- Alert value parsing rejects empty, `NaN`, and non-finite values.
- Open/reset behavior uses effect-driven draft state, not setState during
  render.
- `AlertDetailsModal` unused menu-position props are removed or implemented
  through a compatibility-safe path.

### FR-008 - Global Settings Contract Correctness

`GlobalSettingsModal` must make its commit model explicit.

Acceptance:

- If settings apply live, the footer communicates close/done behavior rather
  than delayed confirmation.
- If settings require confirmation, edits live in a draft until the user
  confirms.
- Reset behavior clearly defines whether it resets chart appearance only or all
  settings shown in the modal.

### FR-009 - Broker Modal Safety Boundary

`BrokerModal` must remain clearly isolated as paper/simulated trading unless a
separate real-broker PRD exists.

Acceptance:

- Numeric fields validate finite positive values where required.
- Market orders cannot silently submit price `0` unless explicitly modeled.
- Take-profit and stop-loss inputs are either persisted in the order model or
  removed from the ticket.
- IDs are generated through a deterministic local helper or existing project ID
  strategy, not scattered inline `Date.now() + Math.random()` expressions.
- Copy and state naming make simulation/paper behavior unambiguous.

### FR-010 - Search Symbol Prop Honesty

`SearchSymbolModal` must not expose props that are ignored by the implementation
unless they exist only in a documented adapter.

Acceptance:

- Legacy props are kept only at adapter boundaries.
- Canonical component props describe the actual compare/replace behavior.
- Keyboard close and animated close remain unchanged.
- Search normalization remains equivalent.

### FR-011 - Shared Modal Hooks

Common modal lifecycle patterns must move to small shared hooks.

Acceptance:

- `useOpenReset` handles reset-on-open without render-time setters.
- `useModalDraft` supports draft/commit/cancel flows where needed.
- `useStableModalCallback` or local `useCallback` patterns prevent unstable
  handlers in heavy modal lists.
- Shared hooks do not import feature-specific data.

## 7. Non-Functional Requirements

### NFR-001 - No Visual Regression

The refactor must preserve the current Technical Analysis UI.

Required smoke flows:

- Open `/equity/technical-analysis`.
- Open and close every modal managed by `ModalOrchestrator`.
- Open `IndicatorsModal`, scroll the full catalog, search, and toggle multiple
  indicators.
- Open `DrawingSettingsModal` for several drawing families and edit numeric,
  text, color, style, and coordinate controls.
- Open object tree, toggle visibility/lock, remove one drawing, and remove one
  indicator item.
- Open symbol search and add/remove/replace a comparison symbol.
- Open alert creation and alert details flows.
- Open broker modal and submit one valid simulated ticket.

### NFR-002 - Performance

The refactor must not add render work to chart hot paths or heavy modal scroll.

Acceptance:

- No state setter is called during render.
- No full indicator catalog rebuild occurs for unrelated Redux updates.
- No per-card decorative animation is added to large scrollable lists.
- No document/window event listener leaks after modal close.
- Heavy toggle flows preserve immediate visual feedback before Redux/ECharts
  work finishes.
- `VAC-MODAL-SCROLL-001` and `VAC-UI-PERF-001` remain satisfied.

### NFR-003 - SSR and Hydration Safety

Client-only modal behavior must remain safe under Next.js.

Acceptance:

- Components touching `document`, `window`, `ResizeObserver`, or `sessionStorage`
  guard browser-only usage.
- Dynamic imports keep browser-only heavyweight code out of server evaluation.
- No hydration mismatch is introduced by random IDs or render-time dates.
- Lazy modal fallbacks keep stable dimensions where users can see them.

### NFR-004 - Accessibility Baseline

The refactor must not lower modal accessibility.

Acceptance:

- Dialogs keep `role="dialog"` and `aria-modal="true"` through `BaseModal`.
- Icon-only buttons have accessible labels.
- Escape behavior remains predictable.
- Form controls have labels or accessible names.
- Inert controls are removed or made functional.
- Links with `href="#"` are replaced with real buttons or real destinations.

### NFR-005 - Maintainability

No canonical component file introduced by this refactor should become another
large monolith.

Acceptance:

- New feature files should target roughly 300 lines or less.
- New hooks should have one clear responsibility.
- Repeated update logic is extracted before the third repetition.
- Feature modules expose typed contracts rather than raw object mutation spread
  everywhere.

## 8. Migration Plan

### Phase 0 - Baseline Audit

Actions:

1. Record current file list, line counts, and root imports.
2. Run TypeScript and targeted ESLint before structural changes.
3. Capture smoke behavior for all modals and the object tree.
4. Confirm SCRIBE constraints for indicator scroll, performance, and count
   preservation.

Exit criteria:

- Baseline validation commands are known.
- All root-level call sites are mapped.
- High-risk modal flows are listed before implementation starts.

### Phase 1 - Contract Fixes Without Moving Files

Actions:

1. Remove render-time state setters from `DrawingSettingsModal`.
2. Remove render-time state setters from `AlertsModal`.
3. Fix inert or no-op editable controls in `AlertDetailsModal`.
4. Add finite-value validation to alert and broker numeric inputs.
5. Make global settings apply-live versus draft/commit behavior explicit.

Exit criteria:

- No directory moves yet.
- Existing imports are untouched.
- TypeScript and targeted ESLint pass.
- Manual smoke confirms no visual behavior regression.

### Phase 2 - Introduce Canonical Folders and Adapters

Actions:

1. Create `modals/orchestration`.
2. Create `modals/indicators`, `modals/drawings`, `modals/alerts`,
   `modals/settings`, `modals/compare`, `modals/broker`, and smaller modal
   feature folders.
3. Move small and medium modals first.
4. Keep every old root file as a re-export adapter.

Exit criteria:

- Root imports still compile.
- New canonical paths exist.
- No behavior change is mixed into this move beyond adapter-safe imports.

### Phase 3 - Indicators Modal Extraction

Actions:

1. Extract static catalog data.
2. Extract indicator search/filter logic.
3. Extract indicator activation hooks.
4. Extract metric calculation and selector glue.
5. Extract memoized card components.
6. Extract scroll-memory behavior.
7. Keep `IndicatorsModal` as a thin shell.

Exit criteria:

- Immediate toggle feedback still works.
- Scroll remains smooth and stable.
- Indicator count and group behavior are preserved.
- No root `IndicatorsModal.tsx` adapter remains; consumers use the canonical indicator module.

### Phase 4 - Object Tree Relocation and Registry Bridge

Actions:

1. Move `ObjectTreePanel` implementation to `components/panels/object-tree`.
2. Extract object tree item builders and actions.
3. Introduce a shared indicator/object registry facade.
4. Use that facade from both indicators and object tree code.
5. Remove the old root object-tree adapter after imports migrate.

Exit criteria:

- Object tree behavior remains unchanged.
- Indicator labels and object IDs do not drift from `IndicatorsModal`.
- Show/hide/lock/unlock flows remain stable with many drawings.

### Phase 5 - Drawing Settings Extraction

Actions:

1. Extract shared section components.
2. Extract drawing family renderers.
3. Extract update helpers for nested drawing props.
4. Replace giant conditional JSX with a typed family registry.
5. Make Visibility tab behavior honest.

Exit criteria:

- All existing drawing types still open their settings.
- Edited values persist exactly as before.
- `DrawingSettingsModal` becomes a shell plus family registry.
- No drawing tool loses controls during extraction.

### Phase 6 - Broker and Alerts Hardening

Actions:

1. Isolate broker simulation state and validation helpers.
2. Make paper-trading behavior explicit in state and copy.
3. Persist or remove take-profit and stop-loss fields.
4. Make alert details fully controlled.
5. Normalize alert validation and notification options.

Exit criteria:

- Simulated order submission rejects invalid values.
- Alert details no longer contain no-op editable fields.
- Broker modal cannot be mistaken in code for a real-broker integration layer.

### Phase 7 - Adapter Cleanup

Actions:

1. Migrate internal imports to canonical paths.
2. Remove root adapters only after all call sites are migrated.
3. Re-run full validation.
4. Update documentation and SCRIBE with causal decisions.

Exit criteria:

- No stale root modal import remains unless intentionally public.
- No adapter is removed before import migration is proven.
- The final diff is split into reviewable commits when the user asks for commit.

## 9. Validation Commands

Minimum validation before delivery of each implementation phase:

```bash
./node_modules/.bin/tsc --noEmit
npx eslint components/technical-analysis/components/modals components/technical-analysis/components/common components/technical-analysis/components/panels components/technical-analysis/hooks components/technical-analysis/context components/technical-analysis/TechnicalAnalysis.tsx
git diff --check -- components/technical-analysis
curl -I http://localhost:3000/equity/technical-analysis
```

Recommended browser smoke validation:

```text
1. Load /equity/technical-analysis.
2. Open Indicators modal, scroll from top to bottom, search, toggle one normal indicator, one composite indicator, one SMA/EMA, and one advanced moving average.
3. Open Drawing Settings for at least: trend line, text, Fibonacci, Gann, position, bar pattern, anchored VWAP, and regression trend.
4. Open Object Tree, hide/show, lock/unlock, delete a drawing, delete one compare series, and remove an indicator item.
5. Open Alerts modal and Alert Details modal; verify values, condition menu, notification options, and close behavior.
6. Open Global Settings; verify whether edits are live or draft according to the implemented contract.
7. Open Search Symbol modal; search by ticker and name, add compare symbol, replace main symbol if supported.
8. Open Broker modal; submit invalid values and one valid paper-trading ticket.
9. Reload /equity/technical-analysis and verify no first-load layout jump was introduced.
10. Inspect console for product errors, hydration warnings, and ECharts mutation warnings.
```

Optional performance validation for heavy flows:

```text
1. Rapidly scroll Indicators modal for 5 seconds.
2. Toggle 10 indicators in sequence.
3. Rapidly open/close Drawing Settings on different drawing types.
4. Toggle Object Tree global show/hide with many drawings present.
5. Confirm no visible frame stalls, waves, or delayed check states.
```

## 10. Rollback Strategy

The refactor must be reversible phase by phase.

Rollback rules:

- Phase 1 contract fixes can be reverted file-by-file.
- Phase 2 moves must keep root adapters so rollback is mostly import-level.
- Phase 3 indicator extraction must keep the original behavior covered by smoke
  tests before deleting any local data structures.
- Phase 4 object-tree relocation must keep the old root adapter until all
  imports are migrated.
- Phase 5 drawing extraction must preserve one family at a time; do not move all
  drawing families in one unreviewable diff.
- Phase 6 broker/alert hardening must be behavior-compatible unless the current
  behavior is provably invalid input acceptance.

No destructive cleanup is allowed in the same phase as a large move unless
TypeScript, ESLint, diff-check, and browser smoke validation prove parity.

## 11. Risks

| Risk | Severity | Mitigation |
| --- | --- | --- |
| Indicator count changes during catalog extraction | High | Use a registry test or count assertion; respect `VAC-INDICATOR-COUNT-001` |
| Scroll performance regresses in `IndicatorsModal` | High | Preserve containment strategy; avoid `content-visibility:auto`; smoke rapid scroll |
| Object tree loses parity with indicator activation | High | Centralize indicator/object mapping before deleting duplicate lists |
| Drawing settings lose controls for a rare drawing type | High | Extract by family with before/after smoke per family |
| Modal imports break due to moved files | High | Keep root adapters until all call sites migrate |
| Broker simulation looks like real trading code | High | Rename and isolate paper-trading concepts; validate all numeric inputs |
| Alert UI keeps false affordances | Medium | Make fields controlled and persisted, or remove them |
| `ModalOrchestrator` accumulates more feature logic | Medium | Enforce orchestration boundary and move feature handlers out |
| Lazy-loading fallback changes first-load stability | Medium | Keep stable skeleton dimensions and smoke reload behavior |
| Inline style cleanup accidentally changes layout | Medium | Defer visual cleanup until after structural parity is proven |

## 12. Open Questions

1. Should the indicator/object registry live under `lib/indicators`, under
   `components/modals/indicators`, or under a shared `features/indicators`
   boundary?
2. Should `BrokerModal` stay visible as paper trading, or should it be hidden
   behind a feature flag until a real-broker security model exists?
3. Should `GlobalSettingsModal` apply changes live by design, or should it use
   draft/commit like `CompareSeriesSettingsModal`?
4. Should `ObjectTreePanel` become part of a broader `panels` architecture with
   sidebar hydration rules?
5. Should drawing settings use a typed registry per drawing type so new drawing
   tools cannot be added without settings coverage?

## 13. Definition of Done

The refactor is done when:

- `modals/orchestration` owns modal composition and lazy loading.
- `IndicatorsModal` is split into shell, catalog, cards, hooks, selectors, and
  scroll-memory modules.
- `DrawingSettingsModal` is split into shared sections and drawing family
  modules.
- `ObjectTreePanel` no longer lives as an implementation inside `modals`.
- Alert modals have no inert editable fields or fixed notification toggles.
- Broker modal validates numeric inputs and is clearly simulation-only.
- Render-time state setters are removed from modal components.
- Indicator/object identity is centralized enough that labels and IDs cannot
  drift between `IndicatorsModal` and `ObjectTreePanel`.
- Existing user flows on `/equity/technical-analysis` are visually unchanged.
- TypeScript, ESLint, diff-check, HTTP smoke, and browser smoke validation pass.

## 14. Implementation Guardrails

1. Do not use `git add .`.
2. Do not commit or push `.agent/`, `.agent/workflow/scribe/`, `graphify-out/`,
   or `scribe-out/`.
3. Do not mix this refactor with chart-rendering behavior changes.
4. Do not remove compatibility adapters until every call site is migrated.
5. Do not reintroduce `content-visibility:auto` on dynamic modal lists without
   fixed heights and measured proof.
6. Do not add decorative per-item animations to large modal catalogs.
7. Do not add real broker behavior in this refactor.
8. Keep each implementation phase reviewable and independently reversible.
9. Update SCRIBE only with causal decisions and lessons, not structural facts
   that Graphify already tracks.
