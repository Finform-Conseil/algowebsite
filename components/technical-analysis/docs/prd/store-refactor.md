# PRD - Technical Analysis Store Refactor

Status: Implemented
Date: 2026-06-03
Owner: Technical Analysis frontend
Scope: `components/technical-analysis/store`

## 1. Header

PRD required? yes
Reason: the store refactor touches shared Redux data flow, many UI consumers, and
the global application store.
Architecture risk: high
Rollback tier: full

## 2. Problem Statement

The Technical Analysis store folder currently presents itself as a subsystem,
but it contains one 1,489-line Redux Toolkit slice:
`components/technical-analysis/store/technicalAnalysisSlice.ts`.

That file is functional and validated, but it mixes too many responsibilities:
chart configuration, indicator toggles, indicator periods, templates,
Bollinger settings, chart appearance, UI flags, modals, replay state, drawing
locks, comparison symbols, multi-chart layout synchronization, alerts, orders,
market data, market snapshots, action exports, and selectors.

The main affected areas are the global Redux store, the Technical Analysis page,
toolbars, modals, market-data hooks, drawing hooks, object tree panel, sidebar,
and provider layer. A direct refactor without a PRD would create high regression
risk because changing this slice can alter visible chart behavior, modal
orchestration, market-data cache behavior, and cross-chart synchronization.

If this work is not done, every new indicator, template, modal, market-data
behavior, or multi-chart rule will keep adding manual assignments to one god
file. The next refactor will be forced to separate real architecture from
comments that claim SRE-grade behavior but only describe local TypeScript
workarounds.

## 3. Current Inventory

| File or Area | Current Role | Issue | Target Direction |
| --- | --- | --- | --- |
| `store/technicalAnalysisSlice.ts` | Public Redux slice, reducer export, action exports, selectors, initial state, all reducer logic | 1,489-line god file; too many responsibilities; stale path comment; manual assignments and templates hide behavior risk | Keep as public Redux slice entrypoint, then extract internal state defaults, case reducers, selectors, validators, and policies |
| `core/infrastructure/store/index.ts` | Registers `technicalAnalysis` reducer and ignores massive market-data paths in RTK dev checks | Global coupling means reducer export path is runtime critical | Keep reducer import stable unless a later approved phase migrates it atomically |
| `config/state/technicalAnalysisStateTypes.ts` | Defines `TechnicalAnalysisState`, `Alert`, `Order`, market data maps | Alert/order contracts are local optimistic shapes, not production execution contracts | Keep type ownership in config/state; add store-side validation before accepting user-created records |
| `config/state/uiStateTypes.ts` | Defines UI state, modals, comparison state, replay, multi-chart layout, drawing locks | UI state aggregates many domains under one broad interface | Preserve type contract; extract store reducer policies by responsibility |
| `config/indicators/advancedIndicatorsTypes.ts` | Defines large `AdvancedIndicatorsState` and `IndicatorPeriods` | Flat boolean map and `[key: string]: number` permit silent drift | Add canonical defaults and period validation helpers before splitting contracts |
| `applyPrimaryLayoutSymbol` | Applies symbol changes to multi-chart layout and sector comparison symbols | Sector detection depends on localized name and sentinel symbol behavior | Move to a layout reducer helper with tests and explicit preset policy |
| `setChartConfig` and `setTimeframe` | Update chart symbol/timeframe | Timeframe sync behavior diverges between the two reducers | Define one canonical chart-config update path and reuse it |
| `applyTemplate` | Applies day, swing, scalping, and long templates | Duplicates large `AdvancedIndicatorsState` objects per template | Move template specs to data-driven definitions and compose defaults with overrides |
| `setIndicatorPeriods` | Writes indicator period changes | Writes arbitrary keys and unvalidated numeric values | Add typed key allowlist and finite/range validation |
| `setModalOpen` | Enforces a single open modal at a time | Real behavior is valid but implicit; nested-modal support is intentionally absent | Move modal policy into an explicit UI reducer helper and document single-modal invariant |
| `addAlert` and `addOrder` | Push records into local arrays | No duplicate ID guard, symbol normalization, finite value validation, or production persistence | Treat as local optimistic state and add defensive validation |
| `updateMarketData` and `updateMarketSnapshot` | Store market data maps by symbol | Named like a cache but has no TTL, eviction, size limit, or symbol normalization | Rename policy in code/docs and add bounded cache semantics only if approved |
| Selectors at slice bottom | Export direct selectors for consumers | Selectors are simple but scattered in same file as reducers | Move selectors to `store/selectors.ts` while preserving public import behavior through the root slice entrypoint until all consumers migrate |

Current active external consumers of `technicalAnalysisSlice.ts`:

```text
core/infrastructure/store/index.ts
components/technical-analysis/TechnicalAnalysis.tsx
components/technical-analysis/context/TechnicalAnalysisProviders.tsx
components/technical-analysis/hooks/MarketData/useMarketData.ts
components/technical-analysis/hooks/useAlertMonitor.ts
components/technical-analysis/hooks/useDrawingManager.ts
components/technical-analysis/hooks/useModalOrchestrator.ts
components/technical-analysis/hooks/useTechnicalAnalysisActions.ts
components/technical-analysis/components/toolbar/ChartToolbar.tsx
components/technical-analysis/components/toolbar/LayoutSetupControl.tsx
components/technical-analysis/components/toolbar/VerticalDrawingToolbar.tsx
components/technical-analysis/components/sidebar/TechnicalAnalysisSidebar.tsx
components/technical-analysis/components/header/ChartHeader.tsx
components/technical-analysis/components/panels/object-tree/ObjectTreePanel.tsx
components/technical-analysis/components/modals/alerts/AlertsModal.tsx
components/technical-analysis/components/modals/broker/BrokerModal.tsx
components/technical-analysis/components/modals/compare/CompareSeriesSettingsModal.tsx
components/technical-analysis/components/modals/date-picker/DatePickerModal.tsx
components/technical-analysis/components/modals/indicators/IndicatorsModal.tsx
components/technical-analysis/components/modals/orchestration/ModalOrchestrator.tsx
components/technical-analysis/components/modals/search-symbol/SearchSymbolModal.tsx
components/technical-analysis/components/modals/settings/GlobalSettingsModal.tsx
```

Validation baseline before this PRD:

- `npx eslint components/technical-analysis/store/technicalAnalysisSlice.ts`
  passed.
- `./node_modules/.bin/tsc --noEmit` passed.

## 3.1 Local Rollback Snapshot

Before any implementation phase, create a targeted snapshot:

```text
_Rollback/store-refactor-<YYYYMMDD-HHMMSS>/
  MANIFEST.md
  components/technical-analysis/store/technicalAnalysisSlice.ts
  components/technical-analysis/config/state/technicalAnalysisStateTypes.ts
  components/technical-analysis/config/state/uiStateTypes.ts
  components/technical-analysis/config/indicators/advancedIndicatorsTypes.ts
  core/infrastructure/store/index.ts
```

Add phase-specific consumers to the same snapshot before editing them. Preserve
parent paths with `cp --parents`.

Files in the safety baseline:

| Original path | Reason |
| --- | --- |
| `components/technical-analysis/store/technicalAnalysisSlice.ts` | Main refactor target and reducer/action/selector source |
| `components/technical-analysis/config/state/technicalAnalysisStateTypes.ts` | Shared state, alert, order, and market-data contracts |
| `components/technical-analysis/config/state/uiStateTypes.ts` | UI, modal, replay, and multi-chart contracts consumed by store reducers |
| `components/technical-analysis/config/indicators/advancedIndicatorsTypes.ts` | Indicator defaults, period map, and template state contracts |
| `core/infrastructure/store/index.ts` | Global reducer registration and RTK middleware ignored paths |
| Any touched consumer from the inventory list | Import migration and behavior validation surface |

Required baseline validation before the first edit:

- `git status --short -- components/technical-analysis/store components/technical-analysis/config/state components/technical-analysis/config/indicators core/infrastructure/store/index.ts`
- `npx eslint components/technical-analysis/store components/technical-analysis/config/state components/technical-analysis/config/indicators core/infrastructure/store/index.ts --ext .ts,.tsx`
- `./node_modules/.bin/tsc --noEmit --pretty false`
- `rg "store/technicalAnalysisSlice" components core app shared --glob "*.ts" --glob "*.tsx"`

Rollback use:

- Compare current files against the matching `_Rollback` snapshot.
- Restore only files modified by the active implementation phase.
- Never overwrite newer human or parallel-agent changes blindly.
- Rerun the same validation commands that established the baseline.

### 3.2 Implementation Note - Phase 0 Rollback Snapshot

Date: 2026-06-03

Phase 0 was completed before any runtime refactor. The local rollback snapshot is:

```text
_Rollback/store-refactor-20260603-110152/
  MANIFEST.md
```

Snapshot scope:

- `components/technical-analysis/store/technicalAnalysisSlice.ts`
- `components/technical-analysis/config/state/technicalAnalysisStateTypes.ts`
- `components/technical-analysis/config/state/uiStateTypes.ts`
- `components/technical-analysis/config/indicators/advancedIndicatorsTypes.ts`
- `core/infrastructure/store/index.ts`
- `components/technical-analysis/docs/prd/store-refactor.md`

Baseline caveat:

- The worktree was not clean before Phase 0: `technicalAnalysisSlice.ts` was already modified, and the `config/indicators` and `config/state` folders were already untracked in Git.
- These files were not reverted. The snapshot preserves the real local baseline.

Validation:

- `npx eslint components/technical-analysis/store components/technical-analysis/config/state components/technical-analysis/config/indicators core/infrastructure/store/index.ts --ext .ts,.tsx` - passed.
- `./node_modules/.bin/tsc --noEmit --pretty false` - passed.
- `rg "store/technicalAnalysisSlice" components core app shared --glob "*.ts" --glob "*.tsx"` - passed; active import inventory captured.
- SHA-256 hashes and restore rules are recorded in the snapshot manifest.

### 3.3 Implementation Note - Phase 1 Initial State Extraction

Date: 2026-06-03

Phase 1 extracted the Technical Analysis default Redux state before any reducer split.

Completed changes:

- `components/technical-analysis/store/initialState.ts` now owns the complete `TechnicalAnalysisState` default object.
- `technicalAnalysisSlice.ts` imports `initialState` and remains the real public Redux slice entrypoint with `createSlice`, action exports, selectors, and default reducer export.
- Stale path and overstated SRE/HDR comments were removed or rewritten as factual implementation comments.
- `components/technical-analysis/store/__tests__/initialState.test.cjs` validates that the slice uses the extracted state and that defaults remain stable.

Rollback snapshot:

```text
_Rollback/store-refactor-phase1-20260603-111244/
  MANIFEST.md
```

Validation:

- `node --test components/technical-analysis/store/__tests__/initialState.test.cjs` - passed, 6/6 tests.
- `npx eslint components/technical-analysis/store components/technical-analysis/config/state components/technical-analysis/config/indicators core/infrastructure/store/index.ts --ext .ts,.tsx,.cjs` - passed.
- `./node_modules/.bin/tsc --noEmit --pretty false` - passed.
- `git diff --check` on touched store, PRD, and rollback manifest paths - passed.
- `rg "FICHIER|SRE|HDR|Cache initialized|Snapshots cache" components/technical-analysis/store` - passed with no active matches.

### 3.4 Implementation Note - Phase 2 Data-Driven Templates

Date: 2026-06-03

Phase 2 replaced duplicated indicator template objects with canonical data-driven
template specs and moved period validation into an explicit store policy.

Completed changes:

- `store/templates/indicatorTemplates.ts` now owns the four canonical template
  specs: `day`, `swing`, `scalping`, and `long`.
- `store/policies/templatePolicy.ts` composes template outputs from the extracted
  initial advanced-indicator defaults, applies only the active indicator list, and
  clones moving-average arrays per application.
- `store/policies/indicatorPeriodPolicy.ts` adds the finite integer allowlist for
  `sma1`, `sma2`, `sma3`, and `rsiPeriod`.
- `technicalAnalysisSlice.ts` still owns the Redux Toolkit public entrypoint, but
  delegates `applyTemplate` and `setIndicatorPeriods` to the Phase 2 policies.
- `store/__tests__/indicatorPolicies.test.cjs` adds template parity and period
  validation coverage without expanding the initial-state baseline test.
- `store/__tests__/testTypeScriptLoader.cjs` centralizes the CJS TypeScript test
  loader shared by store tests.

Rollback snapshot:

```text
_Rollback/store-refactor-phase2-20260603-113137/
  MANIFEST.md
```

Validation:

- `node --test components/technical-analysis/store/__tests__/initialState.test.cjs components/technical-analysis/store/__tests__/indicatorPolicies.test.cjs` - passed, 11/11 tests.
- `npx eslint components/technical-analysis/store components/technical-analysis/config/state components/technical-analysis/config/indicators core/infrastructure/store/index.ts --ext .ts,.tsx,.cjs` - passed.
- `./node_modules/.bin/tsc --noEmit --pretty false` - passed.
- `rg "case \"day\"|case \"swing\"|case \"scalping\"|case \"long\"" components/technical-analysis/store/technicalAnalysisSlice.ts` - no matches.
- `rg "export \* from" components/technical-analysis/store` - no matches.

### 3.5 Implementation Note - Phase 3 Chart And Modal Policies

Date: 2026-06-03

Phase 3 extracted chart config timing/symbol transitions and modal single-open
behavior into explicit store policies.

Completed changes:

- `store/policies/chartConfigPolicy.ts` now owns chart symbol normalization,
  primary layout symbol propagation, sector-comparison peer recalculation, and
  timeframe-to-layout interval propagation.
- `setSymbol`, `setTimeframe`, and `setChartConfig` now reuse the same chart
  policy path for symbol and timeframe transitions.
- `store/policies/modalPolicy.ts` now owns the single-open modal invariant and
  close-all behavior.
- `store/__tests__/chartModalPolicies.test.cjs` proves timeframe sync parity,
  synced interval propagation, sector preset symbol parity, and modal invariants
  through public Redux actions.
- `technicalAnalysisSlice.ts` remains the real Redux Toolkit entrypoint; no root
  re-export adapter was introduced.

Rollback snapshot:

```text
_Rollback/store-refactor-phase3-20260603-105810/
  MANIFEST.md
```

Validation:

- `node --test components/technical-analysis/store/__tests__/initialState.test.cjs components/technical-analysis/store/__tests__/indicatorPolicies.test.cjs components/technical-analysis/store/__tests__/chartModalPolicies.test.cjs` - passed, 16/16 tests.
- `npx eslint components/technical-analysis/store components/technical-analysis/config/state components/technical-analysis/config/indicators core/infrastructure/store/index.ts --ext .ts,.tsx,.cjs` - passed.
- `./node_modules/.bin/tsc --noEmit --pretty false` - passed.
- `git diff --check` - passed.
- `rg "applyPrimaryLayoutSymbol|resolveSectorCompareSymbols|Object\.keys\(state\.ui\.modals\)" components/technical-analysis/store/technicalAnalysisSlice.ts` - no matches.
- `rg "export \* from" components/technical-analysis/store` - no matches.

### 3.6 Implementation Note - Phase 4 Domain Reducer Helpers

Date: 2026-06-03

Phase 4 extracted Redux case reducers into internal domain helper modules without
changing public Redux action names, action type strings, selector exports, or the
global reducer registration path.

Completed changes:

- `technicalAnalysisSlice.ts` remains the real Redux Toolkit entrypoint and still
  owns `createSlice`, root action exports, transitional selectors, and the
  default reducer export.
- Domain reducer helpers now own the case reducer implementations under
  `store/reducers/`: chart config, indicators, UI, multi-chart layout, replay,
  alert/order, and market-data state. The indicator patch reducer derives its
  accepted keys from canonical defaults instead of carrying another manual
  assignment list.
- No root compatibility barrel or `export * from` adapter was introduced.
- `store/__tests__/actionTypes.test.cjs` locks the exact public action names and
  `technicalAnalysis/<action>` type strings so helper extraction cannot silently
  change consumer contracts.

Rollback snapshot:

```text
_Rollback/store-refactor-phase4-20260603-111249/
  MANIFEST.md
```

Validation:

- `node --test components/technical-analysis/store/__tests__/initialState.test.cjs components/technical-analysis/store/__tests__/indicatorPolicies.test.cjs components/technical-analysis/store/__tests__/chartModalPolicies.test.cjs components/technical-analysis/store/__tests__/actionTypes.test.cjs` - passed, 17/17 tests.
- `npx eslint components/technical-analysis/store components/technical-analysis/config/state components/technical-analysis/config/indicators core/infrastructure/store/index.ts --ext .ts,.tsx,.cjs` - passed.
- `./node_modules/.bin/tsc --noEmit --pretty false` - passed.
- `git diff --check` - passed.
- `rg "export \* from" components/technical-analysis/store` - no matches.
- `rg "PayloadAction|forcePrimaryLayoutChartActive|ChartDataPoint|normalizeChartType|createPresetLayout|MULTI_CHART|setAdvancedIndicators:|setMultiChartLayout:" components/technical-analysis/store/technicalAnalysisSlice.ts` - no matches.

### 3.7 Implementation Note - Phase 5 Selector Ownership

Date: 2026-06-03

Phase 5 moved Technical Analysis selectors to their canonical owner and migrated
active selector consumers without leaving a root re-export adapter.

Completed changes:

- `store/selectors.ts` now owns all Technical Analysis selector functions.
- `technicalAnalysisSlice.ts` now owns only the Redux Toolkit slice, public action
  exports, and default reducer export.
- Active selector consumers now import selectors from `store/selectors.ts`; action
  imports continue to use `store/technicalAnalysisSlice.ts`.
- No temporary `export * from "./selectors"` bridge remains in the root slice.
- `store/__tests__/selectors.test.cjs` validates selector branch ownership and
  the legacy `selectDataMode` fallback.

Rollback snapshot:

```text
_Rollback/store-refactor-phase5-20260603-114401/
  MANIFEST.md
```

Validation:

- `node --test components/technical-analysis/store/__tests__/initialState.test.cjs components/technical-analysis/store/__tests__/indicatorPolicies.test.cjs components/technical-analysis/store/__tests__/chartModalPolicies.test.cjs components/technical-analysis/store/__tests__/actionTypes.test.cjs components/technical-analysis/store/__tests__/selectors.test.cjs` - passed, 19/19 tests.
- `npx eslint` on store and migrated selector consumers - passed.
- `./node_modules/.bin/tsc --noEmit --pretty false` - passed.
- `npm run build` - passed.
- `git diff --check` - passed.
- Selector imports from `technicalAnalysisSlice.ts` - no matches.
- Selector exports or selector re-exports from `technicalAnalysisSlice.ts` - no matches.

### 3.8 Implementation Note - Phase 6 Defensive Guards

Date: 2026-06-03

Phase 6 added defensive reducer guards for local alert/order, replay, and
market-data state without changing Redux action names, action type strings,
state paths, broker behavior, or persistence semantics.

Completed changes:

- `store/policies/alertOrderPolicy.ts` now normalizes alert/order IDs and
  symbols, rejects duplicate records at reducer insertion time, and rejects
  non-finite or non-positive alert values, order prices, quantities, and
  bracket levels.
- `store/policies/marketDataPolicy.ts` now normalizes market-data and
  market-snapshot symbols while preserving the existing `marketData` and
  `marketSnapshots` state paths used by RTK middleware ignored paths.
- `store/policies/replayPolicy.ts` now rejects non-finite replay speeds and
  bounds playback delay to a positive local UI range.
- `store/reducers/alertOrderReducers.ts`, `marketDataReducers.ts`, and
  `replayReducers.ts` now delegate validation to pure policies and ignore
  invalid payloads instead of writing impossible local state.
- `store/templates/indicatorTemplates.ts` now models template moving-average
  arrays as readonly specs, fixing the TypeScript readonly tuple error reported
  by the IDE while preserving reducer cloning into mutable runtime arrays.
- Market-data comments now describe Redux storage rather than pretending TTL,
  eviction, or production cache semantics exist.
- `store/__tests__/defensiveGuards.test.cjs` validates valid modal-shaped
  payloads, duplicate rejection, finite numeric guards, replay speed bounds,
  and normalized market-data keys.

Rollback snapshot:

```text
_Rollback/store-refactor-phase6-20260603-132752/
  MANIFEST.md
```

Validation:

- `node --test components/technical-analysis/store/__tests__/initialState.test.cjs components/technical-analysis/store/__tests__/indicatorPolicies.test.cjs components/technical-analysis/store/__tests__/chartModalPolicies.test.cjs components/technical-analysis/store/__tests__/actionTypes.test.cjs components/technical-analysis/store/__tests__/selectors.test.cjs components/technical-analysis/store/__tests__/defensiveGuards.test.cjs` - passed, 26/26 tests.
- `npx eslint components/technical-analysis/store components/technical-analysis/hooks/MarketData/useMarketData.ts core/infrastructure/store/index.ts --ext .ts,.tsx,.cjs` - passed.
- `./node_modules/.bin/tsc --noEmit --pretty false` - passed.
- `npm run build` - passed.
- `git diff --check` - passed.
- Store export-star and selector-zombie searches - passed with no active matches.

### 3.9 Implementation Note - Phase 7 Final Architecture Proof

Date: 2026-06-03

Phase 7 completed the final architecture proof for the Technical Analysis store
refactor and the browser smoke for the Technical Analysis route.

Completed proof:

- `technicalAnalysisSlice.ts` remains the real Redux Toolkit slice owner with
  `createSlice`, public action exports, and the default reducer export. It is
  not a compatibility shell.
- The final store tree has one canonical state owner, selector owner, reducer
  helper layer, policy layer, and template spec layer.
- No root `export * from` adapter exists under `components/technical-analysis/store`.
- Selector consumers import from `store/selectors.ts`; `technicalAnalysisSlice.ts`
  remains the action/reducer boundary only.
- Store files remain below the local file budget after the split; the public
  slice is now a small assembly file rather than the previous mixed-responsibility
  god file.
- Browser smoke used Chrome headless plus Chrome DevTools Protocol against
  `http://localhost:3000/equity/technical-analysis`. It verified visible root,
  chart, horizontal toolbar, right toolbar, vertical drawing toolbar, chart
  canvas/SVG rendering, data-mode toggle, chart-type dropdown, layout setup
  popover, drawing-tool dropdown, and the search, options, indicators,
  templates, alerts, replay, and settings modals.
- The smoke exposed a real hydration mismatch on `.technical-analysis-root`: the
  component computed a client-only `--gp-shell-available-height` inline style
  during the initial client render while SSR emitted no matching style. The
  fix removes that initial inline style and leaves post-mount shell-height
  synchronization to the existing layout effect and route bootstrap CSS variable.

Validation:

- `/home/jack-josias/.nvm/versions/node/v20.20.0/bin/node --test components/technical-analysis/store/__tests__/initialState.test.cjs components/technical-analysis/store/__tests__/indicatorPolicies.test.cjs components/technical-analysis/store/__tests__/chartModalPolicies.test.cjs components/technical-analysis/store/__tests__/actionTypes.test.cjs components/technical-analysis/store/__tests__/selectors.test.cjs components/technical-analysis/store/__tests__/defensiveGuards.test.cjs` - passed, 26/26 tests.
- `npx eslint core/data/brvm-securities.ts components/technical-analysis/TechnicalAnalysis.tsx components/technical-analysis/store components/technical-analysis/hooks/MarketData/useMarketData.ts core/infrastructure/store/index.ts --ext .ts,.tsx,.cjs` - passed.
- `./node_modules/.bin/tsc --noEmit --pretty false` - passed.
- `npm run build` - passed; `/equity/technical-analysis` prerendered successfully.
- `git diff --check` - passed.
- Fresh Technical Analysis browser logs after the Phase 7 marker showed no
  hydration mismatch, no `ReferenceError`, and no browser error from the store
  refactor. Remaining entries were React DevTools info and existing scraper/cache
  warnings.

## 4. Goals

1. Keep current Technical Analysis behavior stable while reducing store
   complexity in controlled phases.
2. Keep `technicalAnalysisSlice.ts` as the public Redux entrypoint until a later
   phase proves a full import migration is safe.
3. Extract state defaults, reducer helpers, template definitions, selectors, and
   validation logic into canonical internal files without creating zombie
   adapters.
4. Remove misleading comments and stale path claims.
5. Make indicator templates data-driven so new indicators have one default
   source of truth.
6. Make chart symbol and timeframe updates reuse one policy across reducers.
7. Make modal single-open behavior explicit and testable.
8. Make alert, order, replay, and market-data updates honest about local state
   limits and add defensive guards where behavior is currently too permissive.
9. Require rollback snapshots and validation after every risky phase.

## 5. Non-Goals

1. No visual redesign of the Technical Analysis UI.
2. No Redux store replacement or migration away from Redux Toolkit.
3. No public behavior change for chart display, indicator rendering, modals, or
   multi-chart layout unless this PRD explicitly names it.
4. No server API, database, broker execution, or persistence migration.
5. No new dependency.
6. No full import migration away from `store/technicalAnalysisSlice.ts` until the
   root entrypoint is proven safe to change.
7. No compatibility re-export files that preserve old paths without active
   consumers, owner, expiry phase, and deletion proof.
8. No broad cleanup outside the store, config contracts, and directly affected
   consumers.

## 6. Target Structure

`technicalAnalysisSlice.ts` remains the public Redux entrypoint because the
global store and many internal consumers import it directly. It must remain a
real implementation file that owns `createSlice`, action exports, default
reducer export, and the public transition contract during this PRD.

```text
components/technical-analysis/store/
  technicalAnalysisSlice.ts
  initialState.ts
  selectors.ts
  reducers/
    alertOrderReducers.ts
    chartConfigReducers.ts
    indicatorReducers.ts
    marketDataReducers.ts
    modalReducers.ts
    multiChartReducers.ts
    replayReducers.ts
    uiReducers.ts
  policies/
    alertOrderPolicy.ts
    chartConfigPolicy.ts
    indicatorPeriodPolicy.ts
    marketDataPolicy.ts
    modalPolicy.ts
    replayPolicy.ts
    templatePolicy.ts
  templates/
    indicatorTemplates.ts
```

Canonical ownership:

- `technicalAnalysisSlice.ts` owns Redux Toolkit `createSlice`, root action
  exports, and default reducer export.
- `initialState.ts` owns the complete `TechnicalAnalysisState` default object.
- `selectors.ts` owns selector functions.
- `reducers/*Reducers.ts` own reducer case functions grouped by state domain.
- `policies/*Policy.ts` own reusable behavior rules that must be shared across
  reducers, such as timeframe propagation and period validation.
- `templates/indicatorTemplates.ts` owns indicator template specs and default
  composition.

Old files or paths to delete:

- No same-name root adapter may be created.
- If selectors migrate to `selectors.ts`, the root slice may re-export them only
  while active consumers still import selectors from `technicalAnalysisSlice.ts`.
  That re-export is active adapter debt with owner `Technical Analysis frontend`,
  expiry `Phase 5`, and removal proof by import search.

Why this structure is necessary:

- The current folder is not too small; it is one 1,489-line mixed responsibility
  file with more than twenty external consumers.
- A full domain split that moves the public slice path immediately would create
  high import churn and regression risk.
- A purely flat folder would still leave reducers, policies, templates, and
  selectors competing in one directory.
- Keeping the root slice as a real public entrypoint avoids the zombie-file
  failure mode while allowing internal responsibilities to become testable.

## 6.1 Architecture Decision Gate

Architecture Gate:

Current dependency inventory:

| Legacy path | Current role | Imported by | Consumer count | Public API? | Decision |
| --- | --- | --- | ---: | --- | --- |
| `components/technical-analysis/store/technicalAnalysisSlice.ts` | Redux slice, default reducer, actions, selectors | Global store, page, hooks, toolbar, modals, sidebar, panels, provider | 22 external files | Yes, internal public module boundary | Keep as real entrypoint during this PRD; do not turn into a zombie adapter |
| `components/technical-analysis/store/selectors.ts` | Not present | None | 0 | No | Create as canonical selector owner in Phase 4 |
| `components/technical-analysis/store/reducers/*` | Not present | None | 0 | No | Create internal reducer helper modules only after rollback snapshot |
| `components/technical-analysis/store/policies/*` | Not present | None | 0 | No | Create internal behavior policy modules for shared reducer rules |
| `components/technical-analysis/store/templates/*` | Not present | None | 0 | No | Create canonical template definition module |

Responsibility test:

- The current folder is too broad because one file mixes state defaults, domain
  policies, reducers, selectors, and public exports.
- The responsibilities are large enough to justify subfolders because reducers,
  policies, templates, and selectors each have multiple concrete future files.
- Five flat files would be clearer than the current god file but would still
  blur reducer logic and reusable policy logic. A shallow domain tree is
  justified.

Chosen strategy:

- Keep `technicalAnalysisSlice.ts` as the public Redux entrypoint.
- Move internal responsibilities into domain files.
- Preserve behavior during extraction.
- Migrate selector consumers to `store/selectors.ts` in a later phase.
- Remove any temporary selector re-export debt once import search proves no
  active consumer needs the old selector path.

Rejected strategies:

- Full immediate move of the slice path is rejected because the slice has 22
  active external consumers and is registered by the global store.
- Keeping everything flat is rejected because the file already proves the
  responsibilities are too diverse for one directory without subfolder
  ownership.
- Creating domain files plus permanent root re-export shells is rejected because
  it would recreate the zombie architecture failure this PRD exists to avoid.
- Refactoring alert/order behavior into a production broker system is rejected
  because it changes business behavior and belongs to a separate PRD.

Canonical source of truth:

- `store/technicalAnalysisSlice.ts` owns the Redux slice entrypoint.
- `store/initialState.ts` owns default state.
- `store/templates/indicatorTemplates.ts` owns indicator template specs.
- `store/policies/indicatorPeriodPolicy.ts` owns period key and value rules.
- `store/policies/chartConfigPolicy.ts` owns symbol/timeframe normalization and
  propagation rules.
- `store/policies/modalPolicy.ts` owns single-modal behavior.
- `store/policies/marketDataPolicy.ts` owns symbol normalization and any cache
  size/retention rules that are explicitly approved.
- `store/selectors.ts` owns selectors after Phase 4.

Legacy removal proof:

- `rg "selectChartConfig|selectUiState|selectMarketData" components/technical-analysis --glob "*.ts" --glob "*.tsx"` must show consumers importing selectors from `store/selectors.ts` after Phase 5.
- `rg "from .*store/technicalAnalysisSlice" components/technical-analysis --glob "*.ts" --glob "*.tsx"` may still return action and reducer consumers only while the root slice remains the public action boundary.
- `rg "export \\* from" components/technical-analysis/store` must return no zombie same-name adapters.
- The final tree must not contain root files that only re-export domain files.

## 7. Functional Requirements

### FR-001 - Public Slice Entry Stability

`technicalAnalysisSlice.ts` must continue to export the default reducer and all
existing action creators until consumers are deliberately migrated.

Acceptance:

- `core/infrastructure/store/index.ts` still registers a valid reducer.
- Existing imports compile after each phase.
- No action creator is removed without import search proving no active consumer.

### FR-002 - Initial State Extraction

The initial `TechnicalAnalysisState` object must move to `store/initialState.ts`
without changing default values.

Acceptance:

- `chartConfig`, `advancedIndicators`, `indicatorPeriods`, `bollingerSettings`,
  `chartAppearance`, `ui`, `alerts`, `orders`, `marketData`, and
  `marketSnapshots` defaults remain equivalent.
- A baseline comparison or targeted test proves default state parity.
- Misleading comments such as stale file path and overstated SRE claims are
  removed or rewritten.

### FR-003 - Data-Driven Indicator Templates

Indicator templates must be represented as compact specs applied over canonical
defaults instead of duplicated full boolean maps.

Acceptance:

- Day, swing, scalping, and long templates produce the same state as before.
- Adding a new indicator requires updating the default map once and only adding
  template overrides when behavior intentionally differs.
- `applyTemplate` no longer contains repeated full `AdvancedIndicatorsState`
  objects.

### FR-004 - Indicator Period Validation

Period updates must accept only known keys or explicitly allowed dynamic keys,
and values must be finite numbers within documented ranges.

Acceptance:

- Known period keys still update correctly.
- Unknown keys are ignored or rejected according to the approved policy.
- `NaN`, `Infinity`, negative values, and zero where invalid do not enter state.
- TypeScript validation remains green.

### FR-005 - Chart Config Policy Consistency

Symbol and timeframe updates must share one policy across `setSymbol`,
`setTimeframe`, and `setChartConfig`.

Acceptance:

- Updating timeframe through `setChartConfig` and `setTimeframe` has equivalent
  multi-chart synchronization behavior.
- Symbol normalization is consistent across chart config and market-data policy.
- Sector comparison symbol recalculation is explicit and not hidden behind a
  localized layout-name check.

### FR-006 - Modal Policy Extraction

Single-open modal behavior must move to a named policy/helper and remain stable.

Acceptance:

- Opening one modal closes all other modal flags.
- Closing a modal does not reopen or mutate unrelated modal state.
- The reducer and tests make the no-nested-modal invariant explicit.

### FR-007 - Alert And Order Defensive Guards

Alert and order reducers must stay local state reducers but reject obviously
invalid records.

Acceptance:

- Duplicate IDs do not create duplicate active records.
- Symbols are normalized consistently.
- Non-finite alert values, order prices, and quantities are rejected.
- Existing modals continue to add valid alerts/orders.

### FR-008 - Market Data Honesty

Market data maps must be documented and implemented as local Redux storage
unless a bounded cache policy is explicitly added.

Acceptance:

- Comments no longer imply TTL, eviction, or production cache semantics unless
  those behaviors exist.
- Symbol keys are normalized consistently.
- RTK middleware ignored paths remain accurate if paths stay unchanged.
- Any new cache limit has explicit acceptance tests.

### FR-009 - Selector Ownership

Selectors must move to `store/selectors.ts` after reducer extraction stabilizes.

Acceptance:

- Selector functions retain current behavior.
- Consumers migrate to `store/selectors.ts` in Phase 5.
- Any temporary selector re-export from `technicalAnalysisSlice.ts` is removed
  when import search proves it is safe.

## 8. Non-Functional Requirements

### NFR-001 - Regression Safety

Every phase must preserve existing chart, modal, layout, and market-data
behavior unless a requirement explicitly changes it.

### NFR-002 - Maintainability

No reducer helper should exceed the local complexity budget without being split
by responsibility. New modules must be named by behavior, not by generic
architecture labels.

### NFR-003 - Performance

Market-data updates must not re-enable Redux Toolkit development serializable or
immutability checks for massive chart data paths unless a measured alternative
exists.

### NFR-004 - Testability

Policy helpers for templates, periods, chart config propagation, modal behavior,
alerts/orders, and market data must be pure enough to unit test without React,
ECharts, browser APIs, or live market data.

### NFR-005 - Backward Compatibility

Public action imports must remain stable until an explicit consumer migration
phase changes them. Temporary adapters are allowed only when this PRD names the
owner, consumer, expiry phase, and removal proof.

## 9. Migration Plan

### Phase 0 - Rollback And Baseline

Objective:

Establish a local rollback barrier and prove the current store baseline is
green before edits.

Actions:

0. Create `_Rollback/store-refactor-<YYYYMMDD-HHMMSS>/`.
1. Copy baseline files with parent paths preserved.
2. Record SHA-256 hashes and baseline validation in `MANIFEST.md`.
3. Run baseline validation commands from Section 3.1.

Files or areas affected:

- `_Rollback/store-refactor-<YYYYMMDD-HHMMSS>/MANIFEST.md`
- No product source files yet.

Exit criteria:

- Snapshot exists.
- Manifest contains hashes and validation results.
- Baseline commands pass or pre-existing failures are documented before edits.

Rollback:

- No rollback needed for product files because no source edit happens in this
  phase.

### Phase 1 - Initial State And Comments

Objective:

Move default state to a canonical file and make comments honest without changing
runtime behavior.

Actions:

1. Create `store/initialState.ts`.
2. Move the complete `initialState` object.
3. Import it into `technicalAnalysisSlice.ts`.
4. Remove stale path comments and rewrite overstated SRE comments as factual
   implementation notes or delete them.
5. Add a default-state parity test if the existing test harness can support it
   without new dependencies.

Files or areas affected:

- `components/technical-analysis/store/technicalAnalysisSlice.ts`
- `components/technical-analysis/store/initialState.ts`
- Optional targeted store test file if a local test harness is already present.

Exit criteria:

- `tsc` and targeted eslint pass.
- Default state values are unchanged.
- No new root adapter exists.

Rollback:

- Restore `technicalAnalysisSlice.ts` from the phase snapshot and remove
  `store/initialState.ts` if validation fails.

### Phase 2 - Template And Indicator Period Policies

Objective:

Replace duplicated template objects and unsafe period writes with reusable
policies.

Actions:

1. Create `store/templates/indicatorTemplates.ts`.
2. Create `store/policies/templatePolicy.ts`.
3. Create `store/policies/indicatorPeriodPolicy.ts`.
4. Refactor `applyTemplate` to apply template specs over canonical defaults.
5. Refactor `setIndicatorPeriods` to use period validation.
6. Add parity tests for all four templates and validation tests for invalid
   period values.

Files or areas affected:

- `store/technicalAnalysisSlice.ts`
- `store/templates/indicatorTemplates.ts`
- `store/policies/templatePolicy.ts`
- `store/policies/indicatorPeriodPolicy.ts`
- `config/indicators/advancedIndicatorsTypes.ts` only if type narrowing is
  required.

Exit criteria:

- Existing template behavior is preserved.
- Invalid period values cannot enter state through reducer actions.
- `tsc`, eslint, and store tests pass.

Rollback:

- Restore touched files from the phase snapshot.
- Remove new policy/template files if the phase is abandoned.

### Phase 3 - Chart, Modal, And Multi-Chart Policies

Objective:

Make shared state-transition rules explicit and remove reducer divergence.

Actions:

1. Create `store/policies/chartConfigPolicy.ts`.
2. Create `store/policies/modalPolicy.ts`.
3. Move `applyPrimaryLayoutSymbol` and timeframe propagation logic into the
   chart config policy.
4. Refactor `setSymbol`, `setTimeframe`, and `setChartConfig` to reuse the same
   update policy.
5. Move single-open modal behavior into `modalPolicy`.
6. Keep multi-chart reducer behavior unchanged while extracting helper functions
   only where reuse is required.

Files or areas affected:

- `store/technicalAnalysisSlice.ts`
- `store/policies/chartConfigPolicy.ts`
- `store/policies/modalPolicy.ts`
- Potentially `config/layout/*` only if tests need public layout helpers.

Exit criteria:

- `setTimeframe` and `setChartConfig({ timeframe })` produce equivalent layout
  interval synchronization.
- Opening a modal still closes every other modal.
- Dense layout and sector comparison behavior are unchanged unless a specific
  defect is proven and documented.

Rollback:

- Restore touched files from the phase snapshot and remove new policy files if
  validation fails.

### Phase 4 - Reducer Helper Extraction

Objective:

Split reducer case logic by domain while keeping the root slice as the public
entrypoint.

Actions:

1. Create `store/reducers/chartConfigReducers.ts`.
2. Create `store/reducers/indicatorReducers.ts`.
3. Create `store/reducers/uiReducers.ts`.
4. Create `store/reducers/multiChartReducers.ts`.
5. Create `store/reducers/alertOrderReducers.ts`.
6. Create `store/reducers/marketDataReducers.ts`.
7. Create `store/reducers/replayReducers.ts`.
8. Wire case reducers into `createSlice` without changing action names.

Files or areas affected:

- `store/technicalAnalysisSlice.ts`
- `store/reducers/*Reducers.ts`
- Existing policy files from earlier phases.

Exit criteria:

- `technicalAnalysisSlice.ts` still owns `createSlice`.
- Action type strings remain unchanged.
- No reducer helper imports React, ECharts, or UI components.
- `tsc`, eslint, and reducer/policy tests pass.

Rollback:

- Restore `technicalAnalysisSlice.ts` and remove new reducer helper files for
  the failed phase.

### Phase 5 - Selector Ownership And Consumer Migration

Objective:

Move selectors to their canonical owner and remove temporary selector debt.

Actions:

1. Create `store/selectors.ts`.
2. Move selector functions from the root slice to `selectors.ts`.
3. Temporarily re-export selectors from `technicalAnalysisSlice.ts` only if
   active consumers still need the old path during migration.
4. Migrate consumers to import selectors from `store/selectors.ts`.
5. Remove selector re-exports from `technicalAnalysisSlice.ts`.

Files or areas affected:

- `store/technicalAnalysisSlice.ts`
- `store/selectors.ts`
- All selector consumers listed in Section 3.

Exit criteria:

- `rg "select[A-Za-z0-9]*.*from .*store/technicalAnalysisSlice" components/technical-analysis --glob "*.ts" --glob "*.tsx"` returns no active selector imports.
- `technicalAnalysisSlice.ts` does not re-export selectors only for compatibility.
- Action imports from `technicalAnalysisSlice.ts` remain valid unless migrated in
  a separate approved phase.

Rollback:

- Restore migrated consumers and root selector exports from the phase snapshot.
- Remove `store/selectors.ts` only if the migration is fully abandoned.

### Phase 6 - Defensive Guards For Alerts, Orders, Replay, And Market Data

Objective:

Make permissive local state updates realistic without changing them into a
production broker or persistence system.

Actions:

1. Create `store/policies/alertOrderPolicy.ts`.
2. Create `store/policies/marketDataPolicy.ts`.
3. Guard duplicate alert/order IDs, non-finite values, invalid quantities, and
   symbol casing.
4. Guard replay speed with a finite positive range.
5. Normalize market-data keys.
6. Rewrite comments so market data is described as Redux storage unless bounded
   cache semantics are implemented.

Files or areas affected:

- `store/reducers/alertOrderReducers.ts`
- `store/reducers/marketDataReducers.ts`
- `store/reducers/replayReducers.ts`
- `store/policies/alertOrderPolicy.ts`
- `store/policies/marketDataPolicy.ts`
- `core/infrastructure/store/index.ts` only if market-data state paths change.

Exit criteria:

- Valid alert/order flows from existing modals still work.
- Invalid values are rejected in reducer/policy tests.
- RTK ignored paths still match the final market-data state shape.
- No production broker or persistence claim is added.

Rollback:

- Restore touched reducers/policies and any affected consumer files from the
  phase snapshot.

### Phase 7 - Final Architecture Proof

Objective:

Prove the store has one canonical shape and no zombie files.

Actions:

1. Run the full validation plan.
2. Run import searches for old selector paths and re-export shells.
3. Inspect the final `store/` tree.
4. Update this PRD status to `Implemented` only if all completion criteria pass.

Files or areas affected:

- `components/technical-analysis/docs/prd/store-refactor.md`

Exit criteria:

- No root file exists only to re-export a domain file.
- Any remaining public entrypoint has a real implementation role.
- All validation commands pass.
- Browser smoke covers Technical Analysis modals, toolbar, layout, and data
  loading.

Rollback:

- If final proof fails, keep status as `Approved` or `Implemented with active
  adapter debt`; do not claim completion.

## 10. Validation Plan

Static validation:

- `npx eslint components/technical-analysis/store components/technical-analysis/config/state components/technical-analysis/config/indicators core/infrastructure/store/index.ts --ext .ts,.tsx`
- `./node_modules/.bin/tsc --noEmit --pretty false`
- `git diff --check`

Architecture validation:

- `rg "from .*store/technicalAnalysisSlice" components/technical-analysis --glob "*.ts" --glob "*.tsx"`
- `rg "select[A-Za-z0-9]*.*from .*store/technicalAnalysisSlice" components/technical-analysis --glob "*.ts" --glob "*.tsx"`
- `rg "export \\* from" components/technical-analysis/store`
- `rg "Cache initialized|SRE FIX|src/core/presentation/components/pages/Widget" components/technical-analysis/store`

Regression validation:

- Dispatch `setSymbol` and verify primary layout symbol propagation.
- Dispatch `setTimeframe` and `setChartConfig({ timeframe })` and verify equal
  interval propagation.
- Dispatch `applyTemplate` for `day`, `swing`, `scalping`, and `long` and verify
  parity with pre-refactor output.
- Dispatch `setModalOpen` twice and verify only the latest modal is open.
- Dispatch valid and invalid alert/order payloads and verify defensive behavior.
- Dispatch market-data updates and verify normalized keys and state path
  compatibility.

Runtime smoke:

- Open `/equity/technical-analysis`.
- Open and close search, indicators, templates, alerts, replay, settings,
  publish, drawing settings, and date picker modals.
- Switch symbol through search and verify chart/header state stays coherent.
- Switch timeframe from toolbar and from any config path that uses
  `setChartConfig`.
- Apply each indicator template and verify the chart remains renderable.
- Enable multi-chart layouts, switch active chart, and verify primary chart
  contamination does not return.
- Load market data and verify no empty chart regression.

Build validation:

- `npm run build` when the final phase changes import paths or bundling behavior.

## 11. Risk Register

| Risk | Probability | Impact | Mitigation |
| --- | --- | --- | --- |
| Action type names change accidentally | Medium | High | Keep `createSlice` name and reducer keys stable; test action exports after each phase |
| Selector migration breaks consumers | Medium | High | Migrate selectors in a dedicated phase with import search and rollback snapshot |
| Template parity drifts | High | High | Add parity tests before replacing duplicated template maps |
| Multi-chart synchronization regresses | Medium | High | Centralize chart config policy and test `setTimeframe` versus `setChartConfig` |
| Market-data cache paths change and RTK dev checks freeze UI | Medium | High | Keep `marketData` and `marketSnapshots` state paths stable unless middleware config is updated in same phase |
| Alert/order validation rejects existing valid modal payloads | Medium | Medium | Validate against existing modal-created records before enforcing guards |
| Root slice becomes a zombie adapter | Low | High | Keep `technicalAnalysisSlice.ts` as real `createSlice` owner; ban same-name root re-export shells |
| Refactor hides a pre-existing README/docs mismatch | Medium | Low | Treat README modernization as separate docs work; do not use it as store completion proof |

## 12. Rollback

Rollback is full because the store controls shared data flow.

Each implementation phase must have its own `_Rollback/store-refactor-*`
snapshot or a clearly named sub-snapshot in the same task snapshot. The snapshot
must preserve parent paths and include a manifest with SHA-256 hashes, baseline
commands, and validation results.

Rollback rules:

1. Stop the active phase as soon as a regression appears.
2. Identify whether the failure is pre-existing or introduced by the current
   phase.
3. Diff current files against the matching `_Rollback` snapshot.
4. Revert the smallest safe unit: line patch, function patch, then file restore
   only if necessary.
5. Restore only files modified by the active implementation phase.
6. Never use `git reset --hard` or blindly restore over newer human or
   parallel-agent edits.
7. Rerun the baseline validation and the failing regression check.
8. Update this PRD implementation notes with the rollback decision.

No data migration is involved in this PRD. If a future phase introduces
persistence or server-side state, it requires a separate PRD.

## 13. Completion Criteria

This PRD is complete when:

- All required sections remain present.
- The rollback strategy is explicit and used before implementation.
- `technicalAnalysisSlice.ts` is still a real public Redux entrypoint or all
  imports have been migrated in an approved phase.
- Initial state, templates, policies, reducer helpers, and selectors each have
  one canonical owner.
- No same-name root file exists only to re-export a domain file.
- Any temporary adapter has owner, consumer, expiry phase, and removal proof.
- `applyTemplate` no longer duplicates full indicator state objects.
- `setTimeframe` and `setChartConfig({ timeframe })` use one propagation policy.
- `setIndicatorPeriods` cannot write invalid period values.
- Modal single-open behavior is explicit.
- Alert/order reducers include defensive validation while remaining local state
  reducers.
- Market-data comments match actual behavior.
- Static validation, architecture validation, regression validation, and runtime
  smoke pass.
- Import search proves selector migration and zombie-file removal.
- The PRD status is not changed to `Implemented` until every completion
  criterion is proven.
