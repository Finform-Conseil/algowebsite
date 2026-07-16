# PRD - Technical Analysis Chart Render Engine Contracts

Status: Implemented
Date: 2026-06-04
Owner: Technical Analysis frontend
Scope: `components/technical-analysis/components/chart`

PRD required? yes
Reason: The chart folder is a small runtime facade over ECharts, overlay, and cursor hooks; changing it without a written contract can regress a working chart.
Architecture risk: low
Rollback tier: full

## 2. Problem Statement

The `components/chart` folder currently contains one component:
`ChartRenderEngine.tsx`. It works, but its runtime contract is implicit:

- the component must always call the ECharts renderer hook before overlay and
  cursor hooks;
- the `chart`, `overlay`, and `cursor` prop groups are defined inline inside the
  component instead of being a canonical folder contract;
- `TechnicalAnalysis.tsx` builds a large inline prop object and has no named
  contract type documenting which refs, data, and interaction scope are required;
- the chart folder looks like a trivial leaf even though it is the runtime
  bridge between the main chart DOM, the ECharts instance, drawing overlays, and
  cursor overlays.

This needs a PRD because the page rendering is already validated visually and
functionally. The safe improvement is contract realism, not a broad renderer
refactor.

If this work is not done, future changes can treat `ChartRenderEngine` as a
simple wrapper and accidentally reorder hooks, loosen required refs, or hide the
comparison-series dependency that feeds `buildEChartsOption`.

## 3. Current Inventory

| File or Area | Current Role | Issue | Target Direction |
| --- | --- | --- | --- |
| `components/chart/ChartRenderEngine.tsx` | Calls `useEChartsRenderer`, `useOverlayRenderer`, and `useCursorRenderer` and returns `null` | Runtime bridge is real, but prop types are local and the hook-order contract is not named | Keep the component as the only runtime facade; move contracts into a sibling type module |
| `TechnicalAnalysis.tsx` chart callsite | Creates `chart`, `overlay`, and `cursor` prop groups inline | The callsite is correct but hard to audit because the target contract is only implied by the component props | Keep the callsite behavior stable; optionally import the named contract type only if needed |
| `hooks/useEChartsRenderer.ts` | Owns ECharts lifecycle, mutation queue, option builder, viewport handoff, and visual-ready reporting | God node. Must not be moved as part of this folder pass | Preserve public hook contract and hook call order |
| `hooks/useOverlayRenderer.ts` | Owns drawing overlay rendering and toolbar/tooltip synchronization | Depends on chart refs, canvas refs, grid rect, chart data, and interaction scope | Preserve inputs exactly |
| `hooks/useCursorRenderer.ts` | Owns cursor canvas, crosshair DOM, data-window tooltip, and particle modes | Depends on canvas/container refs, chart ref, chart data, mode, and interaction scope | Preserve inputs exactly |
| `hooks/chart-rendering/*` | Pure helpers already extracted from the ECharts renderer | Adjacent rendering helpers, not part of this component-folder pass | Do not move or duplicate |

### 3.1 Local Rollback Snapshot

Rollback snapshot to create before implementation:

```text
_Rollback/chart-render-contracts-20260604-151810/
  MANIFEST.md
  components/technical-analysis/components/chart/ChartRenderEngine.tsx
  components/technical-analysis/docs/prd/chart-render-engine-contracts.md
  AGENT-MEMOIRE_PROJECT_STATUS.scribe
```

Files in the safety baseline:

| Original path | Reason |
| --- | --- |
| `components/technical-analysis/components/chart/ChartRenderEngine.tsx` | Primary runtime facade for chart, overlay, and cursor hooks |
| `components/technical-analysis/docs/prd/chart-render-engine-contracts.md` | PRD state must be restorable if the implementation has to be corrected |
| `AGENT-MEMOIRE_PROJECT_STATUS.scribe` | Causal memory surface if the final SCRIBE update needs correction |

Snapshot method:

- `mkdir -p _Rollback/chart-render-contracts-20260604-151810`
- `cp --parents <files> _Rollback/chart-render-contracts-20260604-151810/`
- `MANIFEST.md` records hashes, baseline validation, and restore rule.

Baseline validation before edits:

- `npx eslint components/technical-analysis/components/chart/ChartRenderEngine.tsx components/technical-analysis/TechnicalAnalysis.tsx`
- `./node_modules/.bin/tsc --noEmit --pretty false`
- real-browser TA validation already performed before this PRD: Chrome viewport
  `1920x961`, document/body scroll height equal to client height, chart and
  sidebar containers bounded by the TA root.

Restore rule:

- Compare current files against the snapshot before restoring.
- Restore only files touched by this implementation.
- Never overwrite newer human or parallel-agent changes blindly.

## 4. Goals

1. Make the chart render engine contract explicit and reusable.
2. Preserve the exact runtime hook order: ECharts, overlay, cursor.
3. Preserve the visible Technical Analysis rendering already validated in Chrome.
4. Avoid moving `useEChartsRenderer`, `useOverlayRenderer`, or `useCursorRenderer`.
5. Keep the folder small and honest; add only a contract file if it reduces real ambiguity.

## 5. Non-Goals

1. No visual redesign.
2. No ECharts option-builder refactor.
3. No changes to indicator formulas, comparison rendering, viewport math, or drawing geometry.
4. No file moves outside `components/technical-analysis/components/chart`.
5. No new dependency.
6. No compatibility barrel or adapter.

## 6. Target Structure

```text
components/technical-analysis/components/chart/
  ChartRenderEngine.tsx
  chartRenderContracts.ts
```

`ChartRenderEngine.tsx` remains the runtime facade. `chartRenderContracts.ts`
owns only TypeScript contracts and small immutable constants. It must not import
React runtime APIs or call hooks.

Old files or paths to delete: none.

Temporary adapters: none.

## 6.1 Architecture Decision Gate

Architecture Gate:

| Candidate | Decision | Reason |
| --- | --- | --- |
| Move render hooks into `components/chart` | Reject | Hooks are established public hook entrypoints under `hooks/`; moving them would create broad import churn and high regression risk |
| Keep all contracts inline in `ChartRenderEngine.tsx` | Reject | The folder boundary stays misleading and future changes can miss the required hook-order contract |
| Add `chartRenderContracts.ts` | Accept | A type-only contract module makes the runtime facade auditable without changing behavior |
| Add a barrel `index.ts` | Reject | There is one active runtime component; a barrel would add indirection without deletion value |

Canonical source of truth:

- `ChartRenderEngine.tsx` owns hook execution.
- `chartRenderContracts.ts` owns prop contracts and hook-order naming.
- `TechnicalAnalysis.tsx` remains the single active caller.

Legacy removal proof:

- No old path is deleted in this pass.
- No duplicate contract type remains in `ChartRenderEngine.tsx` after extraction.

## 7. Requirements

### FR-001 - Named Render Contracts

The chart, overlay, cursor, and engine props must be exported from a dedicated
contract file.

Acceptance:

- `ChartRenderEngine.tsx` imports its prop type from `chartRenderContracts.ts`.
- Inline local interface definitions for the prop groups are removed from
  `ChartRenderEngine.tsx`.

### FR-002 - Hook Order Preservation

The runtime component must preserve hook execution order.

Acceptance:

- `useEChartsRenderer(chart)` remains first.
- `useOverlayRenderer(overlay)` remains second.
- `useCursorRenderer(cursor)` remains third.
- No conditional hook call is introduced.

### FR-003 - Comparison Series Contract

The comparison-series input passed to ECharts must remain explicit.

Acceptance:

- The contract names `comparisonSeries` as part of the chart render input.
- Its data shape remains `{ symbol, data, settings }`.

### FR-004 - No Runtime Behavior Change

The implementation must be type/contract-only unless validation proves a runtime
bug that this PRD must address.

Acceptance:

- No CSS change.
- No ECharts option-builder change.
- No hook dependency-array change.

## 8. Non-Functional Requirements

Reliability:

- Future edits should be able to audit render inputs without opening multiple
  hook files first.

Performance:

- No additional render loop, observer, timer, or memoization layer.

Maintainability:

- Types must use existing local domain types; no duplicate structural aliases
  for `Drawing`, `ChartDataPoint`, `CompareSeriesSettings`, or `EChartsInstance`.

## 9. Implementation Phases

### Phase 1 - Rollback And Baseline

Create the snapshot defined in section 3.1 and run baseline validation.

### Phase 2 - Contract Extraction

Add `chartRenderContracts.ts` and move the chart, overlay, cursor, and engine
prop contracts out of `ChartRenderEngine.tsx`.

### Phase 3 - Validation

Run focused eslint, global TypeScript, `git diff --check`, and a route/runtime
health check. Re-run browser validation only if a runtime file beyond the
contract facade changes.

## 10. Implementation Result

Implemented on 2026-06-04:

- `chartRenderContracts.ts` now owns the render engine contracts and hook-order
  naming.
- `ChartRenderEngine.tsx` imports `ChartRenderEngineProps` and keeps the same
  hook order: ECharts, overlay, cursor.
- No CSS, ECharts option-builder, hook dependency-array, indicator formula,
  comparison rendering, viewport math, or drawing geometry changed.

Validation:

- `npx eslint components/technical-analysis/components/chart/ChartRenderEngine.tsx components/technical-analysis/components/chart/chartRenderContracts.ts components/technical-analysis/TechnicalAnalysis.tsx` - passed.
- `./node_modules/.bin/tsc --noEmit --pretty false` - passed.
- `git diff --check -- components/technical-analysis/components/chart/ChartRenderEngine.tsx components/technical-analysis/components/chart/chartRenderContracts.ts components/technical-analysis/docs/prd/chart-render-engine-contracts.md` - passed.
- `curl -I http://localhost:3000/equity/technical-analysis` - HTTP 200.
- Pre-pass real Chrome validation: viewport `1920x961`, document/body have no
  page-level vertical overflow, TA root is viewport-bounded, and sidebar content
  scrolls internally.

## 11. Completion Criteria

- `ChartRenderEngine.tsx` remains a small hook-order facade.
- `chartRenderContracts.ts` owns the named contracts.
- Focused eslint passes.
- Global TypeScript passes.
- `git diff --check` passes.
- Route `/equity/technical-analysis` returns HTTP 200.
- SCRIBE records only the causal lesson: chart folder realism means contract
  explicitness, not moving stable render hooks.
