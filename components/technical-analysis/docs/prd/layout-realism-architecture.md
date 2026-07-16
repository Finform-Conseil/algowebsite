# PRD - Technical Analysis Layout Realism And Architecture

Status: Implemented
Date: 2026-06-04
Owner: Technical Analysis frontend
Scope: `components/technical-analysis/components/layout`

PRD required? yes
Reason: The layout folder owns multi-chart rendering, ECharts peer instances, responsive sizing, and user interaction routing.
Architecture risk: high
Rollback tier: full

## 2. Problem Statement

The `layout` folder is already the visible multi-chart boundary for Technical
Analysis, but its contracts are still too raw in three places:

- financial data filtering, OHLC formatting, date formatting, and series stats
  are duplicated across layout components;
- invalid or malformed market values can still leak into UI text as `NaN` or
  into date formatting as a runtime exception;
- `FullPeerChart.tsx` and `MiniChartCanvas.tsx` exceed the cognitive budget
  because pure data helpers, ECharts option builders, lifecycle effects, and UI
  components live in the same files.

Affected users are traders using multi-chart layouts 2/3/4/6/8/9/12/16 and
maintainers working on ECharts synchronization, dense previews, and responsive
height behavior.

This needs a PRD because the folder touches working visual behavior and past
SCRIBE scars show that multi-chart layout regressions can kill zoom, pan,
crosshair, drawing, and viewport height. A direct cleanup without rollback and
architecture gate would risk reintroducing those failures.

If this work is not done, future layout changes will keep copying brittle
financial helpers and can accidentally display false data, crash on bad dates,
or create duplicate source-of-truth paths.

## 3. Current Inventory

| File or Area | Current Role | Issue | Target Direction |
| --- | --- | --- | --- |
| `MultiChartLayoutGrid.tsx` | Orchestrates active chart, peer cells, dynamic loading, active OHLC header, and sync peers | Duplicates OHLC state, price/volume formatting, and renderable data filtering | Keep as the canonical grid shell; consume shared layout data helpers |
| `FullPeerChart.tsx` | Renders full OHLCV peer charts for layouts up to six cells | Mixes data filtering, OHLC formatting, doji overlay helpers, ECharts option construction, resize, wheel viewport, and UI | Keep public component stable; extract shared data/format contracts first |
| `MiniChartCanvas.tsx` | Renders lightweight and OHLCV mini charts plus active/secondary cell UI | Owns stats/date/filter helpers also needed by the grid and full peer chart | Keep component exports stable; move shared stats/filter/format helpers to a local helper |
| `styles/pages/_technical-analysis-final.scss` | Owns grid, cell, peer chart, loading and empty-state layout styles | Current flex/min-height chain is correct and must not be replaced by JS height calculations | Preserve existing parent-legislator CSS contract |
| `TechnicalAnalysis.tsx` consumer | Mounts `MultiChartLayoutGrid` around the primary chart layers | High blast radius if props or visible layout behavior change | Do not change the public `MultiChartLayoutGrid` prop contract in this phase |

### 3.1 Local Rollback Snapshot

Rollback snapshot required before implementation:

```text
_Rollback/layout-deep-analysis-20260604-153510/
  MANIFEST.md
  components/technical-analysis/components/layout/MultiChartLayoutGrid.tsx
  components/technical-analysis/components/layout/FullPeerChart.tsx
  components/technical-analysis/components/layout/MiniChartCanvas.tsx
  components/technical-analysis/docs/prd/layout-realism-architecture.md
  AGENT-MEMOIRE_PROJECT_STATUS.scribe
```

Files in the safety baseline:

| Original path | Reason |
| --- | --- |
| `components/technical-analysis/components/layout/MultiChartLayoutGrid.tsx` | Primary multi-chart grid shell and active chart routing |
| `components/technical-analysis/components/layout/FullPeerChart.tsx` | Full peer ECharts lifecycle and wheel viewport behavior |
| `components/technical-analysis/components/layout/MiniChartCanvas.tsx` | Mini chart ECharts lifecycle and dense preview behavior |
| `components/technical-analysis/docs/prd/layout-realism-architecture.md` | Process contract for this phase |
| `AGENT-MEMOIRE_PROJECT_STATUS.scribe` | Causal memory surface if this task records a new pattern |

Snapshot method:

- `mkdir -p _Rollback/layout-deep-analysis-20260604-153510`
- `cp --parents <files> _Rollback/layout-deep-analysis-20260604-153510/`
- `MANIFEST.md` stores SHA-256 hashes, baseline validation, and restore rules.

Baseline validation before code edits:

- `npx eslint components/technical-analysis/components/layout/MultiChartLayoutGrid.tsx components/technical-analysis/components/layout/FullPeerChart.tsx components/technical-analysis/components/layout/MiniChartCanvas.tsx`
- `./node_modules/.bin/tsc --noEmit --pretty false`

Restore rule:

- Compare current files against this snapshot before restoring.
- Restore only the implementation delta introduced by this PRD.
- Never overwrite newer human or parallel-agent changes blindly.

## 4. Goals

1. Keep the current multi-chart visual behavior and public component contracts.
2. Centralize renderable OHLCV filtering, price formatting, volume formatting,
   date formatting, and series stats for the layout folder.
3. Prevent malformed financial values from rendering as `NaN` or crashing date
   formatting.
4. Preserve the CSS parent-legislator height chain; no JS viewport height
   calculation is allowed.
5. Keep dense layouts lightweight and moderate layouts OHLCV-capable according
   to existing SCRIBE patterns.

## 5. Non-Goals

- No visual redesign.
- No new layout topology.
- No file moves outside `components/technical-analysis/components/layout`.
- No change to Redux multi-chart state, market-data fetchers, sync policy, or
  toolbar controls.
- No `next/dynamic` removal in this phase unless validation proves it causes a
  concrete runtime issue.
- No public prop change for `MultiChartLayoutGrid`, `FullPeerChart`, or
  `MiniChartCanvas` exports.

## 6. Target Structure

The target structure stays flat and adds one local helper file:

```text
components/technical-analysis/components/layout/
  layoutChartData.ts
  MultiChartLayoutGrid.tsx
  FullPeerChart.tsx
  MiniChartCanvas.tsx
```

`layoutChartData.ts` owns shared data and formatting contracts for layout-only
rendering:

- empty OHLC state creation;
- safe OHLC state derivation from a chart point;
- renderable OHLCV filtering;
- compact price, volume, and date formatting;
- shared series stats for active and secondary previews;
- bull/bear color selection for layout header text.

This structure is necessary because the folder has three files with repeated
pure helpers. Creating subfolders would add architecture without reducing real
blast radius. Keeping helpers flat preserves local ownership and avoids zombie
adapters.

Old files or paths to delete: none.

Temporary adapters: none.

## 6.1 Architecture Decision Gate

Architecture Gate:

Current dependency inventory:

| Legacy path | Current role | Imported by | Consumer count | Public API? | Decision |
| --- | --- | --- | ---: | --- | --- |
| `components/technical-analysis/components/layout/MultiChartLayoutGrid.tsx` | Grid shell and active/secondary routing | `TechnicalAnalysis.tsx` | 1 | Internal product component | Keep canonical path and prop contract |
| `components/technical-analysis/components/layout/FullPeerChart.tsx` | Full peer OHLCV chart | `MultiChartLayoutGrid.tsx` | 1 | Internal layout component | Keep canonical path and export props for dynamic loading |
| `components/technical-analysis/components/layout/MiniChartCanvas.tsx` | Mini chart canvas and active/secondary cell components | `MultiChartLayoutGrid.tsx`, self-composed previews | 1 external + internal self-use | Internal layout component | Keep canonical path and export props for dynamic loading |
| New `layoutChartData.ts` | Shared layout data helper | layout components only | 3 planned | Internal helper | Add flat helper; no barrel |

Responsibility test:

- Is the current folder too broad because it mixes different responsibilities?
  No. The folder owns one surface: multi-chart layout rendering.
- Are the responsibilities large enough to justify subfolders? No. Three
  runtime components plus one helper do not justify a domain tree.
- Would five well-named files in one folder be clearer than a domain tree? Yes.
  Flat files are clearer here.

Chosen strategy:

- Keep flat and add one local helper for shared financial layout data contracts.

Rejected strategies:

- Move to domain folders, because it would create premature architecture and no
  deletion value.
- Keep duplicated helpers in each component, because it lets bad data handling
  drift between active, peer, and mini chart surfaces.
- Create a folder `index.ts` barrel, because there is no public folder API and
  no consumer needing a compatibility boundary.
- Remove `next/dynamic` immediately, because Next docs allow `ssr: false` in
  Client Components and the concrete issue in this phase is data contract drift,
  not proven lazy-loading failure.

Canonical source of truth:

- `components/technical-analysis/components/layout/layoutChartData.ts` owns
  shared layout financial data formatting/filtering.
- `MultiChartLayoutGrid.tsx` owns grid orchestration.
- `FullPeerChart.tsx` owns full peer ECharts rendering.
- `MiniChartCanvas.tsx` owns mini ECharts rendering and cell presentation.

Legacy removal proof:

- `rg "const formatPrice|const formatVolume|const getMiniChartSeries|const initialOhlc|export const getSeriesStats" components/technical-analysis/components/layout -n` must not show duplicated active helper definitions outside `layoutChartData.ts`.
- `rg "export \\* from" components/technical-analysis/components/layout -n` must return no matches.

## 7. Requirements

### FR-001 - Shared Layout Data Helper

The layout folder must use a single helper for renderable OHLCV filtering,
series stats, and compact formatting.

Acceptance:

- `layoutChartData.ts` exports the shared helpers.
- The three layout components import those helpers instead of duplicating local
  formatter/filter/stat implementations.

### FR-002 - Safe Financial Presentation

Layout UI must not render `NaN`, `Invalid Date`, or throw when a market point has
malformed numeric or time values.

Acceptance:

- Unsafe numeric or date values produce `"--"` or `"No date"` depending on the
  UI contract.
- OHLC state derivation is centralized and uses finite guards.

### FR-003 - Preserve Multi-Chart Behavior

The refactor must not change visible topology, loading/empty states, dense
preview behavior, or public component props.

Acceptance:

- `MultiChartLayoutGrid` props stay unchanged.
- Moderate layouts continue to use full peer OHLCV charts.
- Dense layouts continue to use active preview and lightweight secondary cells.

### FR-004 - Preserve Height Contract

The layout folder must not introduce runtime viewport height calculations or
child max-height clamps to fix visual layout.

Acceptance:

- No new use of `innerHeight`, `visualViewport`, `outerHeight`, `screen.height`,
  or `100vh` calculations in layout components.
- Existing SCSS flex/min-height chain remains the owner of sizing.

## 8. Non-Functional Requirements

Performance:

- Keep 8/9/12/16 layouts lightweight.
- Avoid adding new ResizeObserver or RAF loops.

Reliability:

- ECharts calls must continue to guard disposed instances.
- Cleanup must remain idempotent.

Maintainability:

- Keep one source for layout financial formatting/filtering.
- Do not introduce barrels or duplicate import paths.

Backward compatibility:

- Preserve existing imports from `TechnicalAnalysis.tsx`.
- Preserve named component exports used by `next/dynamic`.

Testability:

- Validation must include TypeScript, ESLint, duplicate-helper search, route
  smoke, and nonblank visual smoke.

## 9. Migration Plan

### Phase 0 - PRD And Rollback Barrier

Objective:

Create the PRD, snapshot the local baseline, and run baseline validation.

Actions:

1. Create `_Rollback/layout-deep-analysis-20260604-153510/`.
2. Copy targeted files with parent paths preserved.
3. Write `MANIFEST.md` with SHA-256 hashes and validation results.
4. Run baseline ESLint and TypeScript.

Exit criteria:

- Snapshot exists.
- PRD defines target structure and architecture gate.

Rollback:

- Remove only this PRD if the user cancels before implementation starts.

### Phase 1 - Shared Layout Data Contracts

Objective:

Extract duplicated pure data helpers into `layoutChartData.ts`.

Actions:

1. Add `layoutChartData.ts`.
2. Move shared OHLC state, series filtering, stats, and formatting helpers.
3. Replace local duplicates in `MultiChartLayoutGrid.tsx`,
   `FullPeerChart.tsx`, and `MiniChartCanvas.tsx`.
4. Keep component props and JSX structure unchanged.

Exit criteria:

- No duplicate helper definitions remain.
- TypeScript and ESLint pass on touched files.

Rollback:

- Patch back helper usage from the snapshot; restore full files only if targeted
  patch-back is insufficient.

### Phase 2 - Runtime Smoke

Objective:

Prove the page still loads and the chart surfaces render.

Actions:

1. Run route `curl -I` smoke.
2. Generate a headless Chromium screenshot for `/equity/technical-analysis`.
3. Validate screenshot is nonblank.

Exit criteria:

- HTTP route returns `200`.
- Screenshot dimensions are valid and sampled pixels are nonblank.

Rollback:

- If route or render smoke fails because of this PRD, use the snapshot to patch
  back the smallest broken section.

## 10. Validation Plan

Validation:

- `npx eslint components/technical-analysis/components/layout/MultiChartLayoutGrid.tsx components/technical-analysis/components/layout/FullPeerChart.tsx components/technical-analysis/components/layout/MiniChartCanvas.tsx components/technical-analysis/components/layout/layoutChartData.ts`
- `./node_modules/.bin/tsc --noEmit --pretty false`
- `rg "const formatPrice|const formatVolume|const getMiniChartSeries|const initialOhlc|export const getSeriesStats" components/technical-analysis/components/layout -n`
- `rg "export \\* from" components/technical-analysis/components/layout -n`
- `curl -I http://localhost:3000/equity/technical-analysis`
- Chromium headless screenshot is nonblank.

## 11. Risk Register

| Risk | Probability | Impact | Mitigation |
| --- | --- | --- | --- |
| Helper extraction changes display text | Medium | Medium | Preserve existing format style and only make invalid values safer |
| Dynamic component props break due exported type drift | Low | High | Preserve named prop interfaces and run TypeScript |
| Layout height regresses | Low | High | Do not touch SCSS height ownership or add viewport calculations |
| Dense layouts become heavier | Low | High | Keep rendering mode decisions unchanged |
| Worktree dirty baseline hides unrelated failures | Medium | Medium | Snapshot current local files and validate only touched surfaces plus global TypeScript |

## 12. Rollback

Rollback uses:

```text
_Rollback/layout-deep-analysis-20260604-153510/
```

Rollback execution:

1. Stop implementation.
2. Compare current target files against snapshot.
3. Patch back the smallest broken section.
4. Restore full files only if the regression is broad and no newer human change
   exists in the same file.
5. Rerun the same validation commands listed in this PRD.

No data migration is involved.

## 13. Completion Criteria

- PRD status is updated to `Implemented`.
- `_Rollback` snapshot and manifest exist.
- `layoutChartData.ts` is the only source for shared layout format/filter/stat
  helpers.
- No layout barrel or zombie adapter is introduced.
- TypeScript and targeted ESLint pass.
- Duplicate-helper search proves local duplicates are removed.
- Route smoke returns `200`.
- Visual smoke screenshot is nonblank.


## 14. Implementation Notes

Date: 2026-06-04

Implemented changes:

- Added `layoutChartData.ts` as the flat local source of truth for layout-only
  OHLC state, renderable OHLCV filtering, compact price/volume/date formatting,
  series stats, and bull/bear header colors.
- `MultiChartLayoutGrid.tsx` now consumes shared OHLC state helpers and the same
  renderable-series filter used by peer and mini chart sync.
- `MiniChartCanvas.tsx` now consumes shared stats/date/price helpers and no
  longer owns exported local stats helpers.
- `FullPeerChart.tsx` now consumes shared OHLC state, price/date formatting, and
  renderable-series filtering while preserving its existing viewport, resize,
  wheel, and ECharts lifecycle behavior.

Validation results:

- `npx eslint components/technical-analysis/components/layout/MultiChartLayoutGrid.tsx components/technical-analysis/components/layout/FullPeerChart.tsx components/technical-analysis/components/layout/MiniChartCanvas.tsx components/technical-analysis/components/layout/layoutChartData.ts` - PASS.
- `./node_modules/.bin/tsc --noEmit --pretty false` - PASS.
- `rg "const formatPrice|const formatVolume|const getMiniChartSeries|const initialOhlc|export const getSeriesStats" components/technical-analysis/components/layout -n` - PASS, no duplicate helper definitions.
- `rg "export \\* from" components/technical-analysis/components/layout -n` - PASS, no barrel.
- `rg "innerHeight|visualViewport|outerHeight|screen\.height|100vh|max-height" components/technical-analysis/components/layout -n` - PASS, no runtime height calculation.
- `git diff --check` on PRD, rollback manifest, and touched layout files - PASS.
- `curl -I http://localhost:3000/equity/technical-analysis` - PASS, HTTP 200.
- Chromium headless screenshot smoke - PASS, `1920x961`, nonblank sampled pixels.

Completion verdict:

- Phase 0, Phase 1, and Phase 2 are complete.
- No public component prop changed.
- No folder split, barrel, or zombie adapter was introduced.
- The existing CSS parent-legislator height contract was preserved.
