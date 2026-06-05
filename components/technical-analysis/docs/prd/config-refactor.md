# PRD - Technical Analysis Config Refactor

Status: Implemented
Date: 2026-06-02
Owner: Technical Analysis frontend
Scope: `components/technical-analysis/config`

## 1. Problem Statement

The Technical Analysis `config` folder is now a mixed contract layer rather than
a focused configuration boundary. It contains global domain types, drawing
runtime contracts, UI state, persistence payloads, indicator specs, React icon
registries, BRVM-specific layout policies, and normalization helpers in the same
folder.

This creates six concrete risks:

1. A change to `TechnicalAnalysisTypes.ts` can affect drawing renderers,
   strategy implementations, ECharts rendering, modal forms, object-tree state,
   store persistence, multi-chart layout, and market-data hooks at the same
   time.
2. Some files are named as configuration but carry domain logic or UI runtime
   behavior, which makes ownership unclear.
3. `DrawingToolsConfig.tsx` couples drawing tool metadata to React icons, so the
   drawing catalog cannot be safely reused by workers, pure helpers, or domain
   tests.
4. Tool-family constants are string lists that can drift from `AllToolType`,
   `DRAWING_TOOLS_CONFIG`, drawing strategies, and renderer support.
5. Indicator visibility IDs are manually mapped, so renderer object IDs can
   diverge from the object tree without a compile-time signal.
6. Future feature work on indicators, drawing tools, multi-chart layouts, or
   saved analyses will continue to increase blast radius unless the contracts
   are split by domain.

This needs a PRD because the folder is a shared contract surface. A direct
cleanup would create high regression risk: even a type-only move can break
imports across renderers, hooks, modals, store code, and workers.

If this work is not done, the project will keep paying a hidden cost: every
Technical Analysis feature will require rereading broad config files, and small
changes will keep touching unrelated runtime paths.

## 2. Current Inventory

| File or Area | Current Role | Issue | Target Direction |
| --- | --- | --- | --- |
| `TechnicalAnalysisTypes.ts` | Global type bucket for drawings, market snapshots, chart state, alerts, advanced indicators, toolbar config, ECharts option aliases, multi-chart state, persistence, UI state, broker orders, object-tree data window | 1217-line shared contract with unrelated domains and very high blast radius | Split into domain type modules; keep a temporary compatibility barrel during migration |
| `TechnicalAnalysisConstants.ts` | Drawing tool categories, tool family lists, tab eligibility lists, fib wedge defaults, toolbar config interfaces | String-list ownership can drift from tool unions, config arrays, strategies, and renderer support | Convert to typed domain constants derived from or checked against canonical drawing tool specs |
| `DrawingToolsConfig.tsx` | Drawing tool catalog with labels, categories, and JSX icons | React dependency inside config prevents pure reuse and mixes data with presentation | Split pure tool specs from React icon binding; keep UI-only icon registry near toolbar/common icons |
| `movingAverageSeries.ts` | SMA/EMA specs, IDs, colors, normalize helpers, trend signal specs | Mostly cohesive; color and selectable-period policy live with normalization | Keep as indicator config, but move under indicator domain and test normalization behavior |
| `advancedMovingAverageSeries.ts` | Advanced MA specs and activation helpers | Family-to-state mapping is repeated through nested ternaries and branch chains | Introduce one canonical family metadata map for state keys, series IDs, and toggles |
| `priceVsSmaMetrics.ts` | Price-vs-SMA metric specs, defaults, normalization, source-period resolver | Cohesive and safe | Move under indicator metrics domain with tests |
| `priceVsEmaMetrics.ts` | Price-vs-EMA metric specs, defaults, normalization, source-period resolver | Cohesive and safe | Move under indicator metrics domain with tests |
| `candlestickPatternPresentation.ts` | Candlestick marker/label presentation registry and summary builder | Large but cohesive presentation contract | Move under indicator presentation domain; keep ECharts-specific presentation explicit |
| `indicatorObjectVisibility.ts` | Advanced indicator to object-tree/rendered-object ID mapping | Manual IDs can drift from renderer output and indicator specs | Move under object-tree or indicator visibility domain; add coverage for every mapped indicator |
| `multiChartLayout.ts` | Multi-chart layouts, presets, layout reconciliation, BRVM sector/monitor symbol selection | Layout config imports `BRVM_SECURITIES`, so it also owns market policy | Split pure layout definitions from BRVM symbol-selection policy |
| `compareSeries.ts` | Compare-series palette, ID normalization, settings defaults, visibility normalization, timeframe visibility | Cohesive and defensive | Keep as compare-series domain module; add tests and preserve public API |
| `anonymousPseudos.ts` | Small pseudo list | Trivial, UI-adjacent | Move to UI config or keep as isolated tiny module |

Current size signal:

```text
TechnicalAnalysisTypes.ts                1217 lines
candlestickPatternPresentation.ts         386 lines
multiChartLayout.ts                       352 lines
advancedMovingAverageSeries.ts            311 lines
movingAverageSeries.ts                    242 lines
TechnicalAnalysisConstants.ts             231 lines
compareSeries.ts                          157 lines
DrawingToolsConfig.tsx                    149 lines
indicatorObjectVisibility.ts              114 lines
priceVsSmaMetrics.ts                       78 lines
priceVsEmaMetrics.ts                       69 lines
anonymousPseudos.ts                        10 lines
```

## 2.1 Local Rollback Snapshot

Phase 1 snapshot:

- Snapshot path: `_Rollback/config-refactor-phase1-20260602-050827/`
- Manifest: `_Rollback/config-refactor-phase1-20260602-050827/MANIFEST.md`
- Files copied before edits:
  - `components/technical-analysis/config/TechnicalAnalysisTypes.ts`
  - `components/technical-analysis/docs/prd/config-refactor.md`
- Parent paths were preserved with `cp --parents`.
- Baseline validation before edits:
  - `npm run test:technical-analysis-config` -> PASS, 6/6 tests.
  - `./node_modules/.bin/tsc --noEmit --pretty false` -> PASS.
  - `git diff --check -- components/technical-analysis/config/TechnicalAnalysisTypes.ts components/technical-analysis/docs/prd/config-refactor.md` -> PASS.
- Rollback use: compare current files against the snapshot, patch back the smallest broken section first, restore a full file only if needed, and remove new domain modules only after confirming no newer human or parallel-agent edits touched them.

Phase 2 snapshot:

- Snapshot path: `_Rollback/config-refactor-phase2-20260602-053634/`
- Manifest: `_Rollback/config-refactor-phase2-20260602-053634/MANIFEST.md`
- Files copied before edits:
  - `components/technical-analysis/config/movingAverageSeries.ts`
  - `components/technical-analysis/config/advancedMovingAverageSeries.ts`
  - `components/technical-analysis/config/priceVsSmaMetrics.ts`
  - `components/technical-analysis/config/priceVsEmaMetrics.ts`
  - `components/technical-analysis/config/candlestickPatternPresentation.ts`
  - `components/technical-analysis/config/indicators/index.ts`
  - `components/technical-analysis/docs/prd/config-refactor.md`
- Parent paths were preserved with `cp --parents`.
- Baseline validation before edits:
  - `npm run test:technical-analysis-config` -> PASS, 6/6 tests.
  - `./node_modules/.bin/tsc --noEmit --pretty false` -> PASS.
  - `git diff --check -- components/technical-analysis/config/movingAverageSeries.ts components/technical-analysis/config/advancedMovingAverageSeries.ts components/technical-analysis/config/priceVsSmaMetrics.ts components/technical-analysis/config/priceVsEmaMetrics.ts components/technical-analysis/docs/prd/config-refactor.md` -> PASS.
- Rollback use: restore the root files and `config/indicators/index.ts` from the snapshot, then remove indicator-domain canonical copies only after confirming no newer human or parallel-agent edits touched them.


Phase 3-7 snapshot:

- Snapshot path: `_Rollback/config-refactor-phase3-7-20260602-122600/`
- Manifest: `_Rollback/config-refactor-phase3-7-20260602-122600/MANIFEST.md`
- Files copied before edits:
  - `components/technical-analysis/config/indicators/advancedMovingAverageSeries.ts`
  - `components/technical-analysis/config/TechnicalAnalysisConstants.ts`
  - `components/technical-analysis/config/DrawingToolsConfig.tsx`
  - `components/technical-analysis/config/multiChartLayout.ts`
  - `components/technical-analysis/config/layout/multiChartLayoutTypes.ts`
  - `components/technical-analysis/config/index.ts`
  - `components/technical-analysis/docs/prd/config-refactor.md`
  - `components/technical-analysis/components/toolbar/drawing-toolbar/drawingToolFilters.ts`
  - `components/technical-analysis/components/toolbar/drawing-toolbar/drawingToolCounts.ts`
  - `components/technical-analysis/components/toolbar/drawing-toolbar/drawingToolMemory.ts`
  - `components/technical-analysis/components/toolbar/drawing-toolbar/toolIconCatalog.tsx`
  - `components/technical-analysis/components/toolbar/VerticalDrawingToolbar.tsx`
  - `components/technical-analysis/components/toolbar/LayoutSetupControl.tsx`
  - `components/technical-analysis/components/layout/MultiChartLayoutGrid.tsx`
  - `components/technical-analysis/store/technicalAnalysisSlice.ts`
  - `components/technical-analysis/config/__tests__/config-baseline.test.cjs`
- Parent paths were preserved with `cp --parents`.
- Baseline validation before edits:
  - `node --test components/technical-analysis/config/__tests__/config-baseline.test.cjs` -> PASS, 6/6 tests.
  - `./node_modules/.bin/tsc --noEmit --pretty false` -> PASS.
  - `npx eslint components/technical-analysis/config --ext .ts,.tsx` -> PASS.
- Rollback use: restore the copied files from this snapshot first, then remove only the new canonical files created in phases 3-7 after confirming no newer human or parallel-agent edits touched them.

## 3. Goals

1. Make every config file belong to one explicit domain: drawing, indicators,
   chart layout, compare series, UI state, persistence, market data, or object
   tree.
2. Reduce `TechnicalAnalysisTypes.ts` from a global type bucket to a temporary
   compatibility barrel with typed domain modules behind it.
3. Preserve all existing runtime behavior during migration.
4. Keep imports stable until each phase is validated, then migrate consumers to
   canonical paths.
5. Separate pure data contracts from React presentation code.
6. Make drawing tool families compile-time checked against the canonical tool
   union and catalog.
7. Make indicator object visibility mappings testable and auditable.
8. Keep worker-safe modules free of React, DOM, localStorage, and UI-only
   dependencies.
9. Add focused tests for normalization and registry behavior before deeper
   structural changes.
10. Leave a clear rollback path for every phase.

## 4. Non-Goals

1. No visual redesign of the Technical Analysis module.
2. No change to indicator calculations.
3. No change to drawing geometry, hit testing, or renderer output.
4. No change to saved-analysis payload semantics beyond type relocation.
5. No dependency addition.
6. No migration to a global application-wide design system.
7. No removal of compatibility barrels until all internal consumers are migrated
   and validation is green.
8. No rewrite of Redux state shape unless a later approved PRD explicitly covers
   persistence migration.
9. No Graphify or SCRIBE workflow changes.

## 5. Target Structure

The target structure keeps product contracts near the Technical Analysis module
while making ownership explicit.

```text
components/technical-analysis/config/
  index.ts
  compare-series/
    index.ts
    compareSeries.ts
  drawing/
    index.ts
    drawingTypes.ts
    drawingConstants.ts
    drawingToolSpecs.ts
    drawingToolIconRegistry.tsx
    fibDefaults.ts
  indicators/
    index.ts
    advancedIndicatorsTypes.ts
    movingAverageSeries.ts
    advancedMovingAverageSeries.ts
    priceVsSmaMetrics.ts
    priceVsEmaMetrics.ts
    candlestickPatternPresentation.ts
  layout/
    index.ts
    multiChartLayoutTypes.ts
    multiChartLayouts.ts
    brvmLayoutSymbols.ts
  market/
    index.ts
    marketSnapshotTypes.ts
  object-tree/
    index.ts
    indicatorObjectVisibility.ts
    objectTreeTypes.ts
  persistence/
    index.ts
    savedAnalysisTypes.ts
  state/
    index.ts
    chartStateTypes.ts
    uiStateTypes.ts
    technicalAnalysisStateTypes.ts
  ui/
    index.ts
    anonymousPseudos.ts
```

Compatibility boundaries after implementation:

```text
None at `components/technical-analysis/config` root.
```

The config root contains only domain folders and tests. No root barrel or
file-specific compatibility adapter remains. Canonical consumers import from
explicit domain paths.

## 6. Ownership Boundaries

### Drawing Domain

Owns drawing tool unions, drawing model types, drawing style types, drawing
helper contracts, tool family constants, and pure tool specs.

Rules:

- Drawing tool IDs must be typed as `NonNullable<AllToolType>`.
- Tool category arrays must use `satisfies readonly NonNullable<AllToolType>[]`
  or stricter domain-specific unions.
- React icons do not live in pure drawing specs.
- Strategy and renderer imports should eventually read from `config/drawing`.

### Indicator Domain

Owns indicator state types, indicator presentation specs, moving-average specs,
metric specs, and normalization helpers.

Rules:

- Spec arrays must be canonical: UI cards, source-average resolvers, worker data
  keys, and object-tree entries must derive from or validate against the same
  IDs.
- Adding an indicator requires updating tests for defaults, normalization, and
  object visibility when applicable.

### Layout Domain

Owns pure multi-chart layout definitions and layout-state contracts.

Rules:

- Pure layout definitions cannot import BRVM security data.
- BRVM peer/sector selection belongs in `layout/brvmLayoutSymbols.ts`.
- Dense-layout sync degradation must remain explicit and tested.

### State And Persistence Domains

Own chart state, UI state, saved-analysis payloads, alerts, orders, and global
Technical Analysis state.

Rules:

- Runtime state shape remains backward compatible unless a later migration PRD
  explicitly approves a persistence version bump.
- Saved-analysis types stay compatible with existing optional legacy fields.

### Object Tree Domain

Owns object-tree tabs, data-window values, and indicator-to-object-ID mapping.

Rules:

- Every child object ID mapping must correspond to a known rendered object ID or
  a documented compatibility alias.
- Visibility reveal helpers must remain referentially stable when no change is
  needed.

## 7. Adapter Rule

Temporary adapters are required because current consumers import from root config
files across the module.

Allowed adapters:

No root adapters or root aggregate barrels are allowed after the final
implementation. The previous adapters and `config/index.ts` were removed once
internal consumers were migrated to canonical domain paths.

Adapter constraints:

- New code must import from explicit domain modules.
- Reintroducing a root adapter requires a rollback snapshot, an explicit removal
  date, and a failing compatibility case that cannot be solved by direct import
  migration.

## 8. Functional Requirements

### FR-001 - Domain Type Split

Split `TechnicalAnalysisTypes.ts` into domain-owned type modules while preserving
existing exports through a temporary compatibility barrel.

Acceptance:

- `TechnicalAnalysisTypes.ts` re-exports from domain modules after extraction.
- No runtime behavior changes.
- Existing consumers compile without import changes in the first extraction
  phase.
- `./node_modules/.bin/tsc --noEmit --pretty false` passes.

### FR-002 - Drawing Tool Spec Purity

Separate drawing tool metadata from React icon elements.

Acceptance:

- A pure `drawingToolSpecs.ts` exports IDs, labels, categories, and ordering
  without importing React.
- A UI-only `drawingToolIconRegistry.tsx` binds tool IDs to icon components.
- Worker-safe modules do not import `.tsx` drawing config.
- Toolbar consumers still render the same icons and labels.

### FR-003 - Typed Tool Family Constants

Make drawing tool family lists compile-time checked against the canonical tool
union.

Acceptance:

- Tool arrays use `satisfies` against the correct tool ID union.
- Invalid tool IDs fail TypeScript.
- `FIB_TOOLS_SET`, trend categories, generic style tab tools, and input tab
  tools preserve current behavior.

### FR-004 - Advanced Moving Average Mapping

Replace repeated family-to-state branching with one metadata map.

Acceptance:

- `isAdvancedMovingAverageActive` and `toggleAdvancedMovingAverage` derive state
  keys from the same map.
- Adding a family requires updating one canonical map and the spec list.
- Current specs produce the same series IDs and data keys.
- Unit tests cover active, inactive, add, remove, and unknown-ID behavior.

### FR-005 - Indicator Metrics Domain

Move price-vs-SMA, price-vs-EMA, and moving-average trend specs under the
indicator domain.

Acceptance:

- Default states and normalize functions preserve current behavior.
- Source-average period resolvers return the same periods for active metrics.
- Object-tree and ECharts renderer consumers compile after import migration.

### FR-006 - Candlestick Presentation Domain

Move candlestick presentation specs under the indicator presentation domain.

Acceptance:

- `CANDLESTICK_PATTERN_PRESENTATIONS` remains `satisfies
  Record<CandlestickPatternKey, CandlestickPatternPresentation>`.
- `buildCandlestickPatternSignalSummary` output remains unchanged for single,
  multiple, overflow, and empty inputs.

### FR-007 - Object Visibility Contract

Make indicator object visibility mapping auditable.

Acceptance:

- `indicatorObjectVisibility.ts` moves under `config/object-tree`.
- Tests cover aliases such as `cci`/`cci20`, `williamsR`/`williamsR14`, and
  pivot families.
- `revealHiddenObjectIds` preserves reference equality when no object is
  revealed.

### FR-008 - Multi-Chart Layout Policy Split

Separate pure layout definitions from BRVM market selection policy.

Acceptance:

- Pure layout definitions do not import `BRVM_SECURITIES`.
- BRVM sector and market-monitor symbol selection live in a market-policy file.
- `createPresetLayout` returns the same symbols for current presets.
- Dense-layout sync behavior remains unchanged.

### FR-009 - Compare Series Stability

Keep compare-series settings as a cohesive domain module with test coverage.

Acceptance:

- Symbol normalization, ID generation, color cycling, visibility normalization,
  timeframe parsing, and visibility checks are covered by tests.
- Existing compare modals, ECharts renderer, object tree, and store imports
  compile after migration.

### FR-010 - No Runtime Behavior Drift

All phases must preserve user-facing behavior unless explicitly stated.

Acceptance:

- Existing chart route loads.
- Drawing toolbar opens and renders all current tools.
- Indicators modal opens and toggles SMA, EMA, advanced MA, candlestick, and
  price-vs-average metrics.
- Multi-chart layout presets still create the same chart counts and symbols.
- Saved-analysis load flow still accepts previous optional fields.

## 9. Non-Functional Requirements

### Performance

- The refactor must not increase render work for toolbar, object tree, or
  ECharts renderer.
- Pure specs should be module-level constants, not rebuilt in components.
- Derived maps may be precomputed once at module load.
- No normalization helper may introduce O(n²) behavior over indicator or tool
  lists unless the input size is statically bounded and documented.

### Reliability

- Type-only moves must not change runtime imports.
- Compatibility barrels must exist until all imports are migrated.
- Each phase must have a rollback path.

### Testability

- Pure config modules must be testable without React, DOM, browser storage, or
  worker instantiation.
- UI icon binding may be smoke-tested through toolbar rendering.

### Maintainability

- Each file should target one ownership boundary.
- New config modules should stay below 300 lines unless they are pure tables with
  explicit domain ownership.
- Repeated branch logic should be replaced with typed maps when a domain has
  stable identifiers.

### Security

- No secrets, remote URLs, or executable user input belong in config modules.
- Saved-analysis compatibility must not widen accepted payloads beyond existing
  typed fields.
- Future persistence parsing should keep defensive normalization at boundaries.

### Accessibility

- This PRD does not redesign UI, but toolbar and modal smoke tests must confirm
  that extracted icon/spec registries do not remove labels, titles, or keyboard
  affordances already present.

### Backward Compatibility

- Existing imports work until their phase explicitly migrates them.
- Saved-analysis optional legacy fields remain accepted.
- Redux state shape remains stable unless a separate PRD approves a versioned
  migration.

## 10. Migration Plan

### Phase 0 - Baseline And Guardrails

Objective:

Establish the current behavior and prevent accidental runtime changes.

Actions:

1. Capture current imports from root config files.
2. Run typecheck.
3. Add focused tests for existing pure helpers before moving them.
4. Record baseline searches for old import paths.

Files or areas affected:

- `components/technical-analysis/config`
- `components/technical-analysis/components/toolbar`
- `components/technical-analysis/components/modals/indicators`
- `components/technical-analysis/components/panels/object-tree`
- `components/technical-analysis/hooks/useEChartsRenderer.ts`
- `components/technical-analysis/store/technicalAnalysisSlice.ts`

Exit criteria:

- Typecheck passes.
- Test files exist for compare series, moving-average normalization, advanced MA
  toggles, price-vs-average metrics, object visibility, and multi-chart layout.
- No code movement has happened yet.

Rollback:

- Remove only the newly added tests and restore baseline.

### Phase 1 - Extract Domain Types Behind Compatibility Barrel

Objective:

Split `TechnicalAnalysisTypes.ts` without changing consumer imports.

Actions:

1. Create domain type modules under `config/drawing`, `config/indicators`,
   `config/layout`, `config/market`, `config/object-tree`, `config/persistence`,
   and `config/state`.
2. Move type definitions into the domain modules.
3. Convert `TechnicalAnalysisTypes.ts` into a re-export barrel.
4. Keep import paths unchanged for consumers.

Files or areas affected:

- `TechnicalAnalysisTypes.ts`
- New domain type modules under `config/*`

Exit criteria:

- `TechnicalAnalysisTypes.ts` contains only imports/re-exports and minimal
  compatibility type aliases.
- Typecheck passes.
- No runtime diff in generated bundle paths from type-only movement.

Rollback:

- Restore the original `TechnicalAnalysisTypes.ts` and remove the new type
  modules.

### Phase 2 - Move Cohesive Pure Indicator Config

Objective:

Move already cohesive indicator configs into an indicator domain.

Actions:

1. Move SMA/EMA config, advanced MA config, price-vs-average metrics, and
   candlestick presentation into `config/indicators`.
2. Keep root adapters or barrels for old paths.
3. Add or update tests around existing behavior.

Files or areas affected:

- `movingAverageSeries.ts`
- `advancedMovingAverageSeries.ts`
- `priceVsSmaMetrics.ts`
- `priceVsEmaMetrics.ts`
- `candlestickPatternPresentation.ts`
- `useEChartsRenderer.ts`
- `IndicatorsModal.tsx`
- `ObjectTreePanel.tsx`
- `indicators.worker.ts`

Exit criteria:

- Current consumers compile through adapters.
- Tests prove normalization and resolver behavior.
- ECharts renderer and worker imports remain valid.

Rollback:

- Restore root files and remove indicator-domain copies.

### Phase 3 - Harden Advanced Moving Average State Mapping

Objective:

Reduce branch duplication and make advanced MA family additions safe.

Actions:

1. Introduce a canonical map from `AdvancedMovingAverageFamily` to activation
   state key.
2. Rebuild `buildAdvancedMovingAverageSeriesDefinitions`,
   `isAdvancedMovingAverageActive`, and `toggleAdvancedMovingAverage` around the
   map.
3. Test all current families and representative periods.

Files or areas affected:

- `config/indicators/advancedMovingAverageSeries.ts`
- `IndicatorsModal.tsx`
- `useEChartsRenderer.ts`
- `indicators.worker.ts`

Exit criteria:

- No nested ternary family routing remains.
- Adding an unsupported family fails compile-time coverage.
- Current active-period arrays preserve behavior.

Rollback:

- Restore the previous advanced MA helper implementation.

### Phase 4 - Split Drawing Tool Specs From React Icons

Objective:

Make drawing tool metadata pure and icon binding UI-only.

Actions:

1. Create `config/drawing/drawingToolSpecs.ts` with pure tool IDs, labels,
   categories, and ordering.
2. Create `config/drawing/drawingToolIconRegistry.tsx` for React icon binding.
3. Convert `DrawingToolsConfig.tsx` into a compatibility adapter.
4. Type family constants against the pure specs.
5. Migrate toolbar helpers to canonical imports.

Files or areas affected:

- `DrawingToolsConfig.tsx`
- `TechnicalAnalysisConstants.ts`
- `drawing-toolbar/*`
- `VerticalDrawingToolbar.tsx`
- `ToolbarButton.tsx`
- Drawing strategy implementations

Exit criteria:

- Pure drawing config has no React import.
- Toolbar still renders all icons and labels.
- Tool counts and filters return the same categories.
- Typecheck catches invalid tool IDs.

Rollback:

- Restore `DrawingToolsConfig.tsx` as the single source and revert toolbar import
  migration.

### Phase 5 - Split Multi-Chart Layout From BRVM Market Policy

Objective:

Separate UI layout definitions from BRVM symbol selection.

Actions:

1. Move pure layout definitions and state helpers into `config/layout`.
2. Move sector and market-monitor symbol selection into
   `config/layout/brvmLayoutSymbols.ts`.
3. Keep public layout helpers stable during migration.
4. Test current preset outputs.

Files or areas affected:

- `multiChartLayout.ts`
- `LayoutSetupControl.tsx`
- `MultiChartLayoutGrid.tsx`
- `technicalAnalysisSlice.ts`

Exit criteria:

- Pure layout module does not import `BRVM_SECURITIES`.
- Presets produce current symbols and intervals.
- Dense layout sync rules remain unchanged.

Rollback:

- Restore single `multiChartLayout.ts` file.

### Phase 6 - Migrate Consumers To Canonical Imports

Objective:

Remove dependence on root compatibility files.

Actions:

1. Migrate consumers domain by domain.
2. Use import searches after each group.
3. Keep high-blast-radius files for last: `TechnicalAnalysis.tsx`,
   `technicalAnalysisSlice.ts`, `useEChartsRenderer.ts`, and drawing strategies.

Files or areas affected:

- All consumers importing root config files.

Exit criteria:

- Searches for old root imports return no internal consumers, except any
  deliberately permanent `config/index.ts` barrel.
- Typecheck passes.
- Runtime smoke passes.

Rollback:

- Repoint migrated imports to compatibility barrels.

### Phase 7 - Remove Temporary Adapters

Objective:

Finish the architecture and prevent drift back to root buckets.

Actions:

1. Delete temporary root adapters that are no longer public boundaries.
2. Keep only explicit permanent barrels.
3. Update PRD status and implementation notes.
4. Run Graphify update after code changes.

Files or areas affected:

- `TechnicalAnalysisTypes.ts`
- `TechnicalAnalysisConstants.ts`
- `DrawingToolsConfig.tsx`
- Domain `index.ts` files

Exit criteria:

- No accidental old import paths remain.
- Typecheck and focused tests pass.
- Graphify report reflects new domain structure.

Rollback:

- Restore adapters and old imports from the last green commit.

## 11. Validation Plan

Static validation:

```bash
./node_modules/.bin/tsc --noEmit --pretty false
git diff --check -- components/technical-analysis/config components/technical-analysis/docs/prd/config-refactor.md
rg "from [\"'].*config/TechnicalAnalysisTypes" components/technical-analysis
rg "from [\"'].*config/TechnicalAnalysisConstants" components/technical-analysis
rg "from [\"'].*config/DrawingToolsConfig" components/technical-analysis
```

Focused tests to add before implementation:

```text
compareSeries:
- normalize symbol trims and uppercases
- compare ID generation is stable
- color cycling handles positive and negative indices
- visibility normalization clamps min/max and preserves enabled state
- timeframe parser distinguishes lowercase minutes from months

movingAverageSeries:
- periods normalize to unique sorted positive integers
- slot colors override standard/fallback colors
- selectable SMA/EMA definitions preserve expected IDs and labels
- trend signal source average periods respect active flags

advancedMovingAverageSeries:
- every spec maps to the correct state key
- build definitions only emits active family/period pairs
- toggle add/remove is idempotent
- unknown IDs throw current error

priceVsAverageMetrics:
- default state is all false
- normalization accepts only true active flags
- source-period resolver returns active periods only

indicatorObjectVisibility:
- child IDs include parent ID
- alias pairs reveal both historical IDs
- no-change reveal returns the original object reference

multiChartLayout:
- layout definitions preserve chart counts
- dense layouts disable symbol/crosshair sync on reconcile
- sector and market monitor presets preserve current fallback symbols
```

Runtime smoke:

```text
- Open Technical Analysis page.
- Open drawing toolbar and verify all categories render.
- Select one line tool, one Fibonacci tool, one Gann tool, one chart pattern,
  one forecasting tool, and one volume-based tool.
- Open Indicators modal and toggle SMA, EMA, one advanced MA, one price-vs-SMA
  metric, one price-vs-EMA metric, and one candlestick pattern.
- Open Object Tree and verify revealed indicators/drawings remain controllable.
- Apply a multi-chart preset and verify chart count, active chart, symbols, and
  sync flags.
- Save and load an analysis containing indicators, drawings, compare series, and
  multi-chart layout.
```

Build validation:

```bash
npm run build
```

Run production build when the implementation phase touches bundling, root import
paths, or `.tsx` icon registries.

Graph validation:

```bash
graphify update .
```

Run after code movement so `graphify-out/GRAPH_REPORT.md` reflects the new
domain ownership.

## 12. Risk Register

| Risk | Probability | Impact | Mitigation |
| --- | --- | --- | --- |
| Type-only movement accidentally creates runtime imports | Medium | High | Use `import type`, keep `tsc --noEmit`, inspect generated import behavior when modules move |
| Root compatibility barrels become permanent accidental architecture | High | Medium | Give every adapter a removal phase and enforce import searches |
| Drawing tool IDs drift between specs, constants, strategies, and icons | Medium | High | Make pure specs canonical and type family lists with `satisfies` |
| Object-tree IDs drift from renderer output | Medium | High | Add tests for visibility mappings and document compatibility aliases |
| Multi-chart BRVM policy move changes preset symbols | Medium | Medium | Snapshot current preset outputs before moving policy |
| Advanced MA map misses one family | Medium | Medium | Derive state keys from an exhaustive typed map |
| Saved-analysis compatibility breaks older payloads | Low | High | Keep optional legacy fields and avoid state-shape migration in this PRD |
| Refactor grows into renderer or indicator calculation changes | Medium | High | Enforce non-goals and phase boundaries |

## 13. Rollback

Rollback is phase-scoped.

General rollback rules:

1. Revert only the current phase, not the entire Technical Analysis module.
2. Restore compatibility barrels before reverting consumer imports.
3. Re-run the same validation commands used for the failed phase.
4. Do not delete tests that caught a real regression; keep them and fix the
   implementation.

Phase rollback map:

| Phase | Rollback Strategy |
| --- | --- |
| Phase 0 | Remove newly added tests only if they are incorrect; otherwise keep them |
| Phase 1 | Restore original `TechnicalAnalysisTypes.ts` and remove domain type modules |
| Phase 2 | Restore root indicator config files and adapters |
| Phase 3 | Restore previous advanced MA helper implementation |
| Phase 4 | Restore `DrawingToolsConfig.tsx` as single source and revert toolbar imports |
| Phase 5 | Restore single `multiChartLayout.ts` implementation |
| Phase 6 | Repoint migrated consumers to root compatibility files |
| Phase 7 | Restore adapters from last green state |

Rollback is safe only when typecheck and the phase-specific tests pass.

## 14. Completion Criteria

The PRD implementation is complete when:

1. `TechnicalAnalysisTypes.ts` no longer contains unrelated domain definitions.
2. Drawing tool specs are pure data, and React icon binding is isolated.
3. Tool family constants are compile-time checked against canonical tool IDs.
4. Advanced MA family/state routing is centralized and tested.
5. BRVM symbol-selection policy is separate from pure layout definitions.
6. Indicator object visibility mappings are tested.
7. Old root imports are removed or explicitly documented as permanent barrels.
8. Typecheck passes.
9. Focused tests pass.
10. Runtime smoke confirms drawing toolbar, indicators modal, object tree,
    multi-chart layouts, saved-analysis flow, and ECharts rendering still work.
11. `graphify update .` has been run after code movement.
12. This PRD status is updated to `Implemented` with implementation notes.

## 15. Implementation Notes

Current baseline analysis was performed on 2026-06-02.

Observed facts:

- `TechnicalAnalysisTypes.ts` is the highest-risk shared contract in the folder.
- `DrawingToolsConfig.tsx` is UI config, not pure config, because it imports
  React and icon components.
- `multiChartLayout.ts` mixes layout definitions with BRVM market policy.
- `compareSeries.ts`, `priceVsSmaMetrics.ts`, and `priceVsEmaMetrics.ts` are
  already cohesive and should be moved conservatively rather than rewritten.
- `advancedMovingAverageSeries.ts` is functionally cohesive but should replace
  repeated family branches with a typed metadata map.
- `tsc --noEmit --pretty false` passed before this PRD was created.
- Phase 0 baseline guardrails were added on 2026-06-02: `components/technical-analysis/config/__tests__/config-baseline.test.cjs` snapshots pure config behavior for compare series, moving averages, advanced moving averages, price-vs-average metrics, indicator object visibility, and multi-chart layout.
- Phase 0 validation commands passed on 2026-06-02: `npm run test:technical-analysis-config`, `node --check components/technical-analysis/config/__tests__/config-baseline.test.cjs`, `tsc --noEmit --pretty false`, and `npm run test:candlestick-patterns`.
- Phase 1 type extraction was completed on 2026-06-02 with `TechnicalAnalysisTypes.ts` converted to a compatibility barrel and domain type modules created under `config/drawing`, `config/indicators`, `config/layout`, `config/market`, `config/object-tree`, `config/persistence`, and `config/state`.
- Phase 1 did not migrate consumers; existing imports from `config/TechnicalAnalysisTypes` remain the compatibility boundary.
- Phase 1 rollback snapshot lives at `_Rollback/config-refactor-phase1-20260602-050827/` with hashes and baseline validation in `MANIFEST.md`.
- Phase 1 validation commands passed on 2026-06-02: `npm run test:technical-analysis-config`, `node --check components/technical-analysis/config/__tests__/config-baseline.test.cjs`, and `./node_modules/.bin/tsc --noEmit --pretty false`.
- Phase 2 indicator config move was completed on 2026-06-02: moving-average config, advanced moving-average config, price-vs-SMA metrics, price-vs-EMA metrics, and candlestick presentation now live under `config/indicators`.
- Phase 2 kept root compatibility adapters for all old import paths; current consumers still compile through the adapters.
- Phase 2 rollback snapshot lives at `_Rollback/config-refactor-phase2-20260602-053634/` with hashes and baseline validation in `MANIFEST.md`.
- Phase 2 validation commands passed on 2026-06-02: `npm run test:technical-analysis-config`, `node --check components/technical-analysis/config/__tests__/config-baseline.test.cjs`, `./node_modules/.bin/tsc --noEmit --pretty false`, and `npm run test:candlestick-patterns`.
- Phase 2 updated `scripts/test-candlestick-patterns.cjs` to load the canonical candlestick presentation module because the VM-based harness does not install the TypeScript require hook needed by root re-export adapters.

- Phase 3 was completed on 2026-06-02: `ADVANCED_MOVING_AVERAGE_STATE_KEYS` is now the single typed map from advanced moving-average family to activation state key, and active/toggle helpers derive from it.
- Phase 4 was completed on 2026-06-02: `drawingToolSpecs.ts` owns pure IDs, labels, categories, and ordering; `drawingToolIconRegistry.tsx` owns React icon binding; `drawingConstants.ts` and `fibDefaults.ts` own drawing constants; toolbar helpers import canonical pure modules.
- Phase 5 was completed on 2026-06-02: `multiChartLayouts.ts` owns pure layout definitions and helpers without importing `BRVM_SECURITIES`; `brvmLayoutSymbols.ts` owns BRVM sector/monitor symbol selection and BRVM fallback symbols.
- Phase 6 was completed on 2026-06-02 for runtime config imports: internal consumers were migrated off root runtime adapters for drawing constants, drawing config, multi-chart layout, and indicator config paths. `TechnicalAnalysisTypes.ts` remains a permanent public type barrel because type-only import migration has a larger blast radius and no runtime logic remains there.
- Phase 7 was superseded on 2026-06-02 by a no-zombie cleanup: root compatibility adapters were deleted after all internal consumers migrated to canonical domain modules.
- Phase 3-7 rollback snapshot lives at `_Rollback/config-refactor-phase3-7-20260602-122600/` with file hashes in `MANIFEST.md`.
- Follow-up domain organization correction was completed on 2026-06-02 after review: compare-series logic now lives under `config/compare-series`, indicator visibility logic under `config/object-tree`, and anonymous pseudo UI constants under `config/ui`; internal consumers were migrated to canonical paths and root files are one-line adapters only.
- Domain organization rollback snapshot lives at `_Rollback/config-refactor-domain-organization-20260602-142405/` with the touched files copied before edits.
- Domain organization validation passed on 2026-06-02: `node --test components/technical-analysis/config/__tests__/config-baseline.test.cjs` (8/8), `./node_modules/.bin/tsc --noEmit --pretty false`, and targeted `npx eslint`.
- No-zombie final cleanup completed on 2026-06-02 after architectural review: all file-specific root adapters and `config/index.ts` were deleted, imports from `TechnicalAnalysisTypes.ts` were migrated to domain type modules, and the 647-line `drawingTypes.ts` bucket was split into tool, primitive, position, pitchfork, Fibonacci, Gann, pattern, forecasting, model, interaction, and toolbar type modules.
- No-zombie rollback snapshot lives at `_Rollback/config-no-zombies-20260602-152351/` with all touched pre-edit files copied before the migration.
- Final validation commands passed on 2026-06-02: `node --test components/technical-analysis/config/__tests__/config-baseline.test.cjs` (8/8), `npm run test:candlestick-patterns`, `./node_modules/.bin/tsc --noEmit --pretty false`, targeted `npx eslint`, and `npm run build`.
- Runtime smoke passed on 2026-06-02 against `http://127.0.0.1:3010/equity/technical-analysis`: page mounted, drawing toolbar menu opened with expected categories/counts, layout setup opened with BRVM presets, and Chrome console reported no warnings or errors.
- Graphify update passed on 2026-06-02 after code movement: `graphify update .` rebuilt 2114 nodes, 2817 edges, and 389 communities.
- Config strict no-index sweep completed on 2026-06-05: zero-consumer domain `index.ts` files under `config/ui`, `config/persistence`, `config/indicators`, `config/market`, `config/drawing`, and `config/state` were deleted; `config/layout/index.ts` consumers were migrated to `multiChartLayouts.ts` or `brvmLayoutSymbols.ts`; `config/compare-series/index.ts` consumers were migrated to `compareSeries.ts`. No `index.ts` remains under `components/technical-analysis/config`.

Post-implementation guardrail:

1. New runtime config consumers should import from the canonical domain modules
   under `config/drawing`, `config/indicators`, `config/layout`,
   `config/object-tree`, `config/persistence`, or `config/state`.
2. Do not reintroduce root barrels or file-specific root adapters such as
   `index.ts`, `TechnicalAnalysisTypes.ts`, `DrawingToolsConfig.tsx`, or
   `movingAverageSeries.ts`. Put ownership in domain folders and migrate imports.
3. If a future change removes a compatibility boundary, create a new rollback
   snapshot first and rerun the same focused config baseline, TypeScript,
   ESLint, build, smoke, and Graphify validations.
