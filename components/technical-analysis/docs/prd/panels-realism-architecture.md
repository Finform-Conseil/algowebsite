# PRD - Technical Analysis Panels Realism And Architecture

Status: Implemented - Phase 7 sidebar/Object Tree browser validation complete
Date: 2026-06-05
Owner: Technical Analysis frontend
Scope: `components/technical-analysis/components/panels`

PRD required? yes
Reason: The panels folder currently exposes a single visible panel, but that panel is a high-blast-radius object manager and Data Window surface.
Architecture risk: high for runtime edits
Rollback tier: full

## 2. Problem Statement

`components/technical-analysis/components/panels` has only indirect coverage from the modals/config PRDs. Before Phase 2, the direct implementation was `object-tree/ObjectTreePanel.tsx`, a 2135-line smart panel mixing UI layout, drawing controls, indicator and overlay visibility, comparison-symbol removal, Redux selectors/dispatches, Data Window rendering, and inline confirmation/error workflows.

The folder therefore looks small structurally but carries a large behavioral surface. Treating it as a simple sidebar panel would risk breaking drawing selection, object visibility, comparison series, advanced indicator toggles, Data Window 60 FPS DOM anchors, and the lazy sidebar integration in `TechnicalAnalysis.tsx`.

## 3. Current Inventory

| File or Area | Current Role | Issue | Target Direction |
| --- | --- | --- | --- |
| `components/panels/object-tree/ObjectTreePanel.tsx` | Public Object Tree shell; composes extracted rows, Data Window view, global drawing actions, and resolver outputs | Reduced to 596 lines after Phase 3; still owns panel orchestration and global commands | Keep public entrypoint stable; continue extraction only through real leaf owners, never shims |
| `hooks/useObjectTreePanel.ts` | Owns open state, active tab, ECharts `updateAxisPointer` listener, O(1) Data Window DOM mutation, comparison slots | High-frequency DOM mutation depends on static IDs in the panel markup | Keep hook public contract stable; document and test DOM anchor IDs before any markup split |
| `config/object-tree/objectTreeTypes.ts` | Shared panel tab and Data Window value types | Small stable type surface | Keep as canonical type boundary |
| `config/object-tree/indicatorObjectVisibility.ts` | Maps advanced indicator IDs to child object IDs for visibility reconciliation | Large semantic mapping tied to renderer object IDs | Treat as config contract; validate selector/id drift before changing indicator row behavior |
| `TechnicalAnalysis.tsx` | Lazy-loads `ObjectTreePanel`, wires drawings, hidden object IDs, active tab, Data Window, chart config, appearance, advanced indicators, and active tool | Direct shell integration; changing props can break sidebar overlay composition | Preserve import path and `ObjectTreePanelProps` until an adapter phase proves migration |

### 3.1 Local Rollback Snapshot

Rollback snapshot created for Phase 2:

```text
_Rollback/panels-object-tree-phase2-20260605-103415/
  MANIFEST.md
  components/technical-analysis/components/panels/object-tree/ObjectTreePanel.tsx
  components/technical-analysis/components/panels/object-tree/objectTreeItems.ts
  components/technical-analysis/components/panels/object-tree/objectTreeActions.ts
  components/technical-analysis/hooks/useObjectTreePanel.ts
  components/technical-analysis/config/object-tree/indicatorObjectVisibility.ts
  components/technical-analysis/config/object-tree/objectTreeTypes.ts
  components/technical-analysis/docs/prd/panels-realism-architecture.md
```

The snapshot preserves parent paths and SHA-256 hashes. `components/technical-analysis/config/object-tree/index.ts` is explicitly absent in the manifest because the zero-consumer barrel had already been removed and must not be restored as a zombie shell. If rollback is needed, restore only the affected implementation delta, never newer human or parallel-agent edits.

## 4. Goals

- Give `panels` a dedicated Deep-Analysis owner.
- Preserve the current Object Tree and Data Window user workflows.
- Identify safe extraction boundaries before touching the 2135-line panel.
- Keep `ObjectTreePanelProps` stable during the first implementation phase.
- Protect Data Window static DOM anchors: `dw-date`, `dw-open`, `dw-high`, `dw-low`, `dw-close`, `dw-volume`, `dw-change`, and `dw-comp-*`.
- Prevent indicator/object visibility drift between the panel, Redux state, object-tree config, and renderer object IDs.

## 5. Non-Goals

- Do not refactor `TechnicalAnalysis.tsx` shell ownership in Phase 1.
- Do not change ECharts cursor or axis-pointer event semantics.
- Do not remove direct DOM mutation from `useObjectTreePanel` without a measured replacement.
- Do not redesign the sidebar or object-tree visual style.
- Do not change broker, alert, order, or drawing model semantics.

## 6. Architecture Decision Gate

Decision: keep `components/panels/object-tree/ObjectTreePanel.tsx` as the public panel entrypoint during the first pass.

Reason: `TechnicalAnalysis.tsx` lazy-loads the named `ObjectTreePanel` export and passes a broad prop contract. Moving the entrypoint before extracting internal seams would create avoidable shell churn.

Current dependency inventory:

| Legacy or candidate path | Current role | Imported by | Consumer count | Public API? | Decision |
| --- | --- | --- | ---: | --- | --- |
| `components/panels/object-tree/ObjectTreePanel.tsx` | Public Object Tree panel entrypoint and prop contract | `TechnicalAnalysis.tsx` | 1 | Yes, internal app boundary | Keep as the only public runtime entrypoint during Phase 2 |
| `hooks/useObjectTreePanel.ts` | Panel state and Data Window axis-pointer hook | `TechnicalAnalysis.tsx` | 1 | Yes, internal hook boundary | Keep stable; no hook move in this PRD |
| `config/object-tree/objectTreeTypes.ts` | Object Tree tab and Data Window value types | `ObjectTreePanel.tsx`, `useObjectTreePanel.ts` | 2 | No | Canonical leaf import |
| `config/object-tree/indicatorObjectVisibility.ts` | Indicator object ID mapping and reveal helper | `TechnicalAnalysis.tsx`, `IndicatorsModal.tsx`, `ModalOrchestrator.tsx`, `indicatorsModalLoader.ts`, config baseline test | 5 | No | Canonical leaf import; do not move in panels PRD |
| `config/object-tree/index.ts` | Removed zero-consumer barrel | none | 0 | No | Deleted in Phase 2; leaf imports remain canonical |
| `components/modals/ObjectTreePanel.tsx` | Old modal-era path | none | 0 | No | Must remain deleted; never recreate as a shim |
| `components/panels/ObjectTreePanel.tsx` | Potential root panel shim | none | 0 | No | Forbidden unless all imports migrate and old path is deleted in the same phase |
| `config/objectTreeTypes.ts` / `config/indicatorObjectVisibility.ts` | Legacy root config paths | none | 0 | No | Must remain absent |

Responsibility test:

- The `panels` folder is not too broad today; `object-tree` is the only visible panel domain.
- The problem is inside `ObjectTreePanel.tsx`, not a need for a second public panel path.
- Five well-named internal files under `object-tree/` are acceptable; two public entrypoints are not.

Chosen strategy:

- Keep the public entrypoint stable.
- Extract internal pure helpers/components under `components/panels/object-tree/`.
- Migrate imports directly to canonical files when a helper is extracted.
- Delete unused internal barrels or shims immediately when import search proves no consumer.

Legacy removal proof:

- `rg "components/modals/ObjectTreePanel|components/panels/ObjectTreePanel" components/technical-analysis --glob !components/technical-analysis/docs/prd/**` must return no active code matches.
- `rg "config/objectTreeTypes|config/indicatorObjectVisibility|config/object-tree" components/technical-analysis --glob !components/technical-analysis/docs/prd/**` must prove there are no legacy root imports and no zero-consumer barrel imports before declaring the barrel canonical or safe.
- `rg "export \\* from|export type \\* from" components/technical-analysis/components/panels components/technical-analysis/config/object-tree` must show only intentional public barrels with consumers, or none.

Rejected alternatives:

| Alternative | Rejection Reason |
| --- | --- |
| Move panel state into Redux immediately | Would increase global state surface before the panel contracts are isolated |
| Replace Data Window DOM mutation with React state immediately | Risks reintroducing the known 60 FPS Data Window bottleneck |
| Split files by visual sections first | Visual splits alone do not isolate indicator/removal semantics or static DOM anchor contracts |
| Fold panels back into sidebar/common UI | Hides chart-domain behavior behind generic layout naming |
| Domain split plus root re-export shell | Creates two architectures and repeats the zombie-file failure mode |
| Promote `config/object-tree/index.ts` by convenience | Encourages mixed leaf/barrel imports unless every consumer migrates in one atomic change |

## 7. Implementation Phases

### Phase 1 - Contract Audit

- Confirm every public prop from `ObjectTreePanelProps` and its owner in `TechnicalAnalysis.tsx`.
- Confirm Data Window DOM anchor IDs used by `useObjectTreePanel.ts`.
- Confirm every object ID family handled by `handleObjectItemRemove`.
- Confirm `indicatorObjectVisibility.ts` maps renderer object IDs that still exist.
- Confirm Object Tree tab and Data Window tab keyboard/click behavior.

### Phase 2 - Pure Boundary Extraction

- Extract object-item derivation from `ObjectTreePanel.tsx` into a pure helper with focused tests.
- Extract indicator label metadata only if it reduces duplication and keeps config ownership clear.
- Extract row components only after the data/action boundaries are stable.
- Preserve the named `ObjectTreePanel` export and `ObjectTreePanelProps`.

### Phase 3 - Runtime Hardening

- Smoke `/equity/technical-analysis`.
- Open Object Tree from the sidebar.
- Switch Object Tree and Data Window tabs.
- Hover/move over the chart enough to update Data Window values.
- Toggle main-series visibility and one removable overlay/indicator only if the current state makes it safe.
- Check console for runtime errors and ensure canvases remain non-blank.

## 8. Validation Plan

- `npx eslint components/technical-analysis/components/panels/object-tree/ObjectTreePanel.tsx components/technical-analysis/hooks/useObjectTreePanel.ts components/technical-analysis/config/object-tree`
- `./node_modules/.bin/tsc --noEmit --pretty false`
- `git diff --check -- components/technical-analysis/components/panels components/technical-analysis/hooks/useObjectTreePanel.ts components/technical-analysis/config/object-tree components/technical-analysis/docs/prd/panels-realism-architecture.md`
- DOM anchor drift check: `rg "dw-date|dw-open|dw-high|dw-low|dw-close|dw-volume|dw-change|dw-comp-" components/technical-analysis/components/panels components/technical-analysis/hooks/useObjectTreePanel.ts`
- Object-tree integration drift check: `rg "ObjectTreePanel|useObjectTreePanel|ObjectTreePanelProps" components/technical-analysis`

## 9. Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Data Window performance regression | Medium | High | Preserve DOM anchors and measure before replacing direct DOM mutation |
| Indicator removal drift | High | High | Audit ID families before extracting removal handlers |
| Comparison symbol row drift | Medium | Medium | Keep Redux comparison selectors visible until adapter boundary exists |
| Drawing command regression | Medium | High | Preserve drawing callbacks and selected drawing semantics |
| Accessibility regressions in tabs/menus | Medium | Medium | Validate `role=tablist`, `role=tab`, row controls, and inline confirmation controls |

## 10. Completion Criteria

- Panels has a completed contract audit.
- Extraction plan names exact helper/component seams before runtime code moves.
- `ObjectTreePanelProps` remains backward-compatible unless a later PRD explicitly approves an adapter.
- Data Window DOM anchors are either preserved or migrated with `useObjectTreePanel` in the same atomic change.
- Runtime smoke proves Object Tree and Data Window still work.

## 11. Start Gate Evidence

Status: Started on 2026-06-05.

Evidence captured before any panels runtime refactor:

- Graphify explain: `ObjectTreePanel.tsx` is a degree-9 node containing `buildObjectTreeItems`, drawing label/format helpers, grouped drawing controls, global object commands, and Data Window rendering.
- Size proof: `ObjectTreePanel.tsx` is 2135 lines, so panels requires staged extraction instead of a single closure pass.
- Static validation: `npx eslint components/technical-analysis/components/overlays/PriceAxisOverlay.tsx components/technical-analysis/hooks/usePriceAxisMenu.ts components/technical-analysis/hooks/useChartViewport.ts components/technical-analysis/hooks/priceAxisInteractiveTargets.ts components/technical-analysis/components/panels/object-tree/ObjectTreePanel.tsx components/technical-analysis/hooks/useObjectTreePanel.ts components/technical-analysis/config/object-tree` passed.
- Static validation: `./node_modules/.bin/tsc --noEmit --pretty false` passed.
- Static validation: `git diff --check -- components/technical-analysis/components/overlays/PriceAxisOverlay.tsx components/technical-analysis/hooks/usePriceAxisMenu.ts components/technical-analysis/hooks/useChartViewport.ts components/technical-analysis/hooks/priceAxisInteractiveTargets.ts components/technical-analysis/components/panels components/technical-analysis/hooks/useObjectTreePanel.ts components/technical-analysis/config/object-tree components/technical-analysis/docs/prd/overlays-realism-architecture.md components/technical-analysis/docs/prd/panels-realism-architecture.md` passed.
- DOM anchor drift check: static IDs in `ObjectTreePanel.tsx` match the `document.getElementById` anchors in `useObjectTreePanel.ts`.
- Chrome DevTools MCP smoke: opened Object Tree from the sidebar, selected Data Window, confirmed the panel label `Object tree and data window`, confirmed `Data window` selected, and confirmed the empty Data Window prompt renders before hover data arrives.
- Console proof: no runtime error was logged during the smoke; only existing warnings unrelated to panels were present.

Next required action:

- Execute Phase 2 Pure Boundary Extraction, starting with the object-item builder and object-action resolver. No file move is allowed before the Phase 2 gate in section 12.7 is satisfied.

## 12. Phase 1 - Contract Audit

Status: Completed on 2026-06-05.

### 12.1 Canonical entrypoint decision

Decision: `components/technical-analysis/components/panels/object-tree/ObjectTreePanel.tsx` is the only canonical runtime entrypoint for the Object Tree panel.

Evidence:

- `TechnicalAnalysis.tsx` imports `ObjectTreePanelProps` from the panels path.
- `TechnicalAnalysis.tsx` lazy-loads `ObjectTreePanel` from the panels path.
- `TechnicalAnalysis.tsx` renders the lazy panel through `ConnectedSidebar` `overlayContent`.
- `components/technical-analysis/components/modals/ObjectTreePanel.tsx` is deleted in the current worktree and absent on disk.
- No active TypeScript import targets `components/modals/ObjectTreePanel`.

Rule for Phase 2:

- Do not recreate `components/modals/ObjectTreePanel.tsx` as a re-export shim.
- Do not add a root `components/panels/ObjectTreePanel.tsx` shim.
- If a new public entrypoint is needed, migrate every import in the same atomic change and delete the old entrypoint.

### 12.2 Import audit

| Surface | Current importer | Current import target | Consumer count | Public API? | Verdict |
| --- | --- | --- | ---: | --- | --- |
| Panel props | `TechnicalAnalysis.tsx` | `components/panels/object-tree/ObjectTreePanel` | 1 | Yes, internal app boundary | Canonical |
| Lazy panel runtime | `TechnicalAnalysis.tsx` | `components/panels/object-tree/ObjectTreePanel` | 1 | Yes, internal app boundary | Canonical |
| Panel state hook | `TechnicalAnalysis.tsx` | `hooks/useObjectTreePanel` | 1 | Yes, internal hook boundary | Canonical hook root; keep stable |
| Object-tree tab/data types | `ObjectTreePanel.tsx`, `useObjectTreePanel.ts` | `config/object-tree/objectTreeTypes` | 2 | No | Canonical leaf import |
| Indicator object visibility config | `TechnicalAnalysis.tsx`, modal orchestration, indicators modal, config baseline test | `config/object-tree/indicatorObjectVisibility` | 5 | No | Canonical leaf import |
| Object-tree barrel | none | `config/object-tree/index.ts` | 0 | No | Zombie-risk; do not use without full import migration |
| Old modal panel path | none | `components/modals/ObjectTreePanel.tsx` | 0 | No | Deleted; must stay deleted |

### 12.3 Public prop contract

`ObjectTreePanelProps` currently owns these categories:

- Panel visibility and tabs: `isOpen`, `activeTab`, `setActiveTab`.
- Drawing commands: `drawings`, `selectedDrawingId`, `setSelectedDrawingId`, `updateDrawing`, `deleteDrawing`, `handleClone`, `handleVisualOrder`.
- Data Window: `dataWindow`.
- Symbol and main chart visibility: `symbolDisplay`, `isMainChartVisible`, `setIsMainChartVisible`.
- Chart state: `chartConfig`, `chartAppearance`, `advancedIndicators`, `activeTool`.
- Object visibility registry: `hiddenObjectIds`, `setHiddenObjectIds`.

Phase 2 must preserve this prop contract unless it introduces an adapter and migrates the caller in the same change.

### 12.4 Data Window DOM anchor contract

`useObjectTreePanel.ts` mutates these DOM anchors directly:

- `dw-date`
- `dw-open`
- `dw-high`
- `dw-low`
- `dw-close`
- `dw-volume`
- `dw-change`
- `dw-comp-row-${index}` for indexes `0..4`
- `dw-comp-symbol-${index}` for indexes `0..4`
- `dw-comp-val-${index}` for indexes `0..4`

`ObjectTreePanel.tsx` renders the matching anchors inside `DataWindowTab`.

Phase 2 cannot split `DataWindowTab` without keeping these IDs in the rendered subtree or migrating `useObjectTreePanel.ts` in the same atomic change.

### 12.5 Object removal contract

`handleObjectItemRemove` currently owns these object ID families:

- `compare-*` -> `removeComparisonSymbol`.
- `sma-*`, `ema-*`, `wma-*`, `dema-*`, `tema-*`, `hma-*`, `zlema-*`, `alma-*`, `smma-*`, `kama-*`, `vwma-*` -> chart indicator active-period patches.
- keys present in `advancedIndicators` -> `setAdvancedIndicators({ [id]: false })`.
- `volume` is not removable; it must be hidden with the eye action.

Phase 2 should extract this as a pure command resolver before moving row components. Visual row extraction first is rejected because it would leave behavior coupled inside the panel.

### 12.6 Barrel and zombie-path verdict

- `config/object-tree/index.ts` was a zero-consumer domain barrel and has been deleted in Phase 2.
- Object-tree imports remain canonical leaf imports. Do not recreate a barrel unless every consumer is migrated in the same atomic change.
- The old modal panel path is deleted and must not be restored as `export * from ...`.
- `components/panels/ObjectTreePanel.tsx` is forbidden as a convenience shell; if it appears, it must have a named external consumer and an expiry phase, otherwise it is a zombie.
- Phase 2 cannot be marked implemented while both leaf imports and a zero-consumer barrel coexist in the active tree.

### 12.7 Phase 2 gate

Phase 2 may proceed only with this order:

1. Extract a pure object-item builder from `ObjectTreePanel.tsx` and update imports directly.
2. Extract an object-action resolver for removal/visibility semantics.
3. Extract `DataWindowTab` only after preserving or migrating the DOM anchor contract.
4. Extract row components last, after data and action boundaries are stable.

No Phase 2 change may introduce an old-path re-export, a root compatibility shim, or mixed canonical import styles.


## 13. Phase 2 - Pure Boundary Extraction

Status: Completed on 2026-06-05.

### 13.1 Implemented boundaries

- `objectTreeItems.ts` now owns pure Object Tree item derivation for base series, comparison rows, volume, moving-average rows, advanced indicator rows, and active-tool rows.
- `objectTreeActions.ts` now owns pure Object Tree visibility and removal command resolution.
- `objectTreeItemTypes.ts` owns the shared `ObjectTreeItem` type.
- `objectTreeDrawingLabels.ts` owns drawing and active-tool labels.
- `objectTreeAdvancedLabels.ts` owns top-level advanced indicator labels.
- `objectTreeAdvancedChildItems.ts` owns child object rows derived from advanced indicators.
- `ObjectTreePanel.tsx` keeps the public named export and `ObjectTreePanelProps`, then applies resolver results through existing Redux/actions/callbacks.
- Data Window markup and static DOM anchors remain in `ObjectTreePanel.tsx`; no anchor contract was moved in this phase.

### 13.2 Zombie-shim prevention

- No `components/modals/ObjectTreePanel.tsx` file was recreated.
- No root `components/panels/ObjectTreePanel.tsx` compatibility shell was added.
- `config/object-tree/index.ts` was deleted because it had zero consumers and only re-exported leaf modules.
- Active object-tree imports continue to target canonical leaf files: `objectTreeTypes.ts` and `indicatorObjectVisibility.ts`.

### 13.3 Validation evidence

- `npx eslint components/technical-analysis/components/panels/object-tree/ObjectTreePanel.tsx components/technical-analysis/components/panels/object-tree/objectTreeItems.ts components/technical-analysis/components/panels/object-tree/objectTreeActions.ts components/technical-analysis/components/panels/object-tree/objectTreeItemTypes.ts components/technical-analysis/components/panels/object-tree/objectTreeDrawingLabels.ts components/technical-analysis/components/panels/object-tree/objectTreeAdvancedLabels.ts components/technical-analysis/components/panels/object-tree/objectTreeAdvancedChildItems.ts components/technical-analysis/hooks/useObjectTreePanel.ts` passed.
- `./node_modules/.bin/tsc --noEmit --pretty false` passed.
- `git diff --check -- components/technical-analysis/components/panels/object-tree components/technical-analysis/config/object-tree components/technical-analysis/hooks/useObjectTreePanel.ts components/technical-analysis/docs/prd/panels-realism-architecture.md _Rollback/panels-object-tree-phase2-20260605-103415/MANIFEST.md` passed after the final PRD update.
- Anti-shim search over active technical-analysis code found no old Object Tree panel path, no root panel shim, and no `config/object-tree/index` import.
- Anti-barrel search over `components/technical-analysis/components/panels/object-tree` and `components/technical-analysis/config/object-tree` found no `export *` or `export type *`.
- Chrome DevTools MCP smoke passed on `/equity/technical-analysis`: Object Tree rendered, Data Window selected, synthetic canvas mousemove populated OHLCV values, `dw-*` anchors mounted, and console errors were empty. Screenshot: `/tmp/ta-panels-phase2-data-window.png`.

Next required action:

- Execute Phase 3 follow-up only for deeper interaction cases: compare-row removal, advanced-indicator removal, and drawing-row menu extraction after the Phase 2 boundary is reviewed.

## 14. Phase 3 - Row/Data Window Extraction And Deep Interaction

Status: Completed on 2026-06-05.

### 14.1 Rollback

Full rollback snapshot:

```text
_Rollback/panels-object-tree-phase3-20260605-110440/
  MANIFEST.md
  components/technical-analysis/components/panels/object-tree/*
  components/technical-analysis/hooks/useObjectTreePanel.ts
  components/technical-analysis/config/object-tree/*
  components/technical-analysis/docs/prd/panels-realism-architecture.md
```

### 14.2 Implemented boundaries

- `objectTreeRows.tsx` now owns drawing rows, object item rows, and the small icon button used by the panel toolbar.
- `DataWindowTab.tsx` now owns Data Window rendering while preserving the `dw-*` and `dw-comp-*` static DOM anchor contract consumed by `useObjectTreePanel.ts`.
- `objectTreePanelStyles.ts` now owns the local TradingView-style color/style constants used by the panel pieces.
- `ObjectTreePanel.tsx` remains the only public runtime entrypoint and still owns the named `ObjectTreePanel` export and prop contract.
- `indicatorObjectVisibility.ts` now resolves an advanced child object ID back to its parent indicator ID.
- `objectTreeActions.ts` now removes advanced child rows by disabling their parent indicator, so rows such as `tsi-signal` resolve to `tsi: false`.

### 14.3 Zombie-shim prevention

- No `components/modals/ObjectTreePanel.tsx` file was recreated.
- No root `components/panels/ObjectTreePanel.tsx` compatibility shell was added.
- No `config/object-tree/index.ts` barrel was added.
- Active imports continue to target canonical leaf files directly; there is no `export *` shim in the Phase 3 surface.

### 14.4 Validation evidence

- `npx eslint components/technical-analysis/components/panels/object-tree/ObjectTreePanel.tsx components/technical-analysis/components/panels/object-tree/objectTreeRows.tsx components/technical-analysis/components/panels/object-tree/DataWindowTab.tsx components/technical-analysis/components/panels/object-tree/objectTreePanelStyles.ts components/technical-analysis/components/panels/object-tree/objectTreeItems.ts components/technical-analysis/components/panels/object-tree/objectTreeActions.ts components/technical-analysis/components/panels/object-tree/__tests__/objectTreeActions.test.cjs components/technical-analysis/config/object-tree/indicatorObjectVisibility.ts components/technical-analysis/hooks/useObjectTreePanel.ts` passed.
- `./node_modules/.bin/tsc --noEmit --pretty false` passed.
- `npm run test:technical-analysis-config` passed.
- `node --test components/technical-analysis/components/panels/object-tree/__tests__/objectTreeActions.test.cjs` passed.
- `git diff --check -- components/technical-analysis/components/panels/object-tree components/technical-analysis/config/object-tree components/technical-analysis/hooks/useObjectTreePanel.ts components/technical-analysis/docs/prd/panels-realism-architecture.md _Rollback/panels-object-tree-phase3-20260605-110440/MANIFEST.md` passed.
- Anti-zombie search found no old Object Tree panel import path and no root panel shim.
- Anti-barrel search over `components/technical-analysis/components/panels/object-tree` and `components/technical-analysis/config/object-tree` found no `export *` or `export type *`.
- Chrome DevTools MCP validated Object Tree mount and compare-row behavior until the DevTools transport closed after a reload.
- Playwright global fallback with system Chromium validated Object Tree mount, Data Window anchors after canvas hover, SNTS compare-row addition, and SNTS removal from the Object Tree without runtime errors.
- Phase 3 revalidation on 2026-06-05: Chrome DevTools MCP `list_pages` returned `Transport closed`, so the local CDP/Playwright fallback validated Object Tree mount, Volume row hide/show controls, selected-object removal guard messaging, Data Window tab switch, and non-empty `dw-date`, `dw-open`, `dw-high`, `dw-low`, `dw-close`, `dw-change`, `dw-volume` anchors. Screenshot: `/tmp/ta-panels-phase3-smoke.png`.

### 14.5 Validation limits

- Resolved in Phase 4: the previous `IndicatorsModal` UI proof used an ambiguous catalog-card selector instead of the composite parent button for TSI.
- Advanced removal behavior is still covered by the extracted pure resolver test: `macd-line` maps to `macd: false`, `tsi-signal` maps to `tsi: false`, and `compare-SNTS` maps to `remove-comparison`.

Next required action:

- Continue only with drawing-row menu/global panel action extraction. Create a full rollback snapshot before any runtime/import/render edit.

## 15. Phase 4 - IndicatorsModal Activation Decision

Status: Completed on 2026-06-05.

### 15.1 Decision

The correct Phase 4 choice was to stabilize the `IndicatorsModal` activation proof, not to start the out-of-scope `lib/chart-types` index audit.

No product code change was required. The `IndicatorsModal` -> advanced indicator state -> Object Tree child row path works when browser automation targets the TSI composite parent button.

### 15.2 Evidence

- Graphify targeted the activation path through `IndicatorsModal`, object-tree item derivation, advanced child rows, and indicator object visibility mapping.
- Chrome DevTools MCP was attempted first and returned `Transport closed`; the local Chromium/Playwright CDP fallback was used.
- The unreliable Phase 3 proof clicked `.gp-indicator-catalog-card`, which is not the TSI composite activation control.
- The correct TSI control is `.gp-composite-indicator-parent` with `aria-pressed="false"` before activation and `wiredId: "tsi"`.
- Clicking the correct control mounted the Object Tree advanced rows `TSI` and `TSI Signal` without runtime errors.
- Removing the `TSI Signal` row resolved through the advanced child-to-parent mapping and removed the TSI rows from Object Tree.
- Screenshot evidence: `/tmp/ta-panels-phase4-indicators-activation.png`.

### 15.3 Rule For Future Browser Proofs

Do not validate composite indicator activation through generic catalog-card text search. Composite indicators must be activated through their `.gp-composite-indicator-parent` button, and the proof must assert the expected Object Tree child row after the modal closes.

### 15.4 Next Branch

Proceed to drawing-row menus/global panel action extraction only after a new full rollback snapshot covers the affected object-tree files and the PRD records the exact extraction seam. Do not create root panel shims, Object Tree re-export shells, or mixed canonical imports.

## 16. Phase 5 - Drawing Menus And Global Panel Actions Extraction

Status: Completed on 2026-06-05.

### 16.1 Rollback

Full rollback snapshot:

```text
_Rollback/panels-object-tree-phase5-actions-20260605-132500/
  MANIFEST.md
  components/technical-analysis/components/panels/object-tree/*
  components/technical-analysis/hooks/useObjectTreePanel.ts
  components/technical-analysis/config/object-tree/*
  components/technical-analysis/docs/prd/panels-realism-architecture.md
```

The snapshot preserves parent paths and SHA-256 hashes. It must be restored only for the affected Phase 5 surface and must not restore any root Object Tree shim, modal-era Object Tree file, or object-tree barrel.

### 16.2 Target Extraction

- Extract toolbar menu rendering from `ObjectTreePanel.tsx` into a real leaf component under `components/panels/object-tree/`.
- Keep row components in `objectTreeRows.tsx`; do not move the public panel entrypoint.
- Extract drawing bulk actions into a typed resolver/helper if it reduces shell ownership without coupling to Redux.
- Keep `ObjectTreePanelProps` unchanged and keep Data Window anchors untouched.
- Keep direct leaf imports only; no `index.ts`, `export *`, compatibility shell, or legacy root import.

### 16.3 Acceptance Criteria

- `ObjectTreePanel.tsx` no longer renders inline z-order/global action menu bodies.
- The extracted menu component receives explicit callbacks and selected object state; it does not import Redux or mutate chart state directly.
- Drawing bulk operations keep the same empty-state error behavior.
- Runtime smoke still opens Object Tree and can exercise the toolbar without console errors.

### 16.4 Implemented Boundaries

- `ObjectTreeActionToolbar.tsx` owns the Object Tree toolbar, z-order menu, selected-object menu entries, and drawing global action menu rendering.
- `objectTreeDrawingActions.ts` owns the pure resolver for hide/show/lock/unlock all drawing operations and their empty-state messages.
- `ObjectTreePanel.tsx` remains the only runtime entrypoint and only orchestrates callbacks, Redux dispatches, and panel state.
- `DataWindowTab.tsx`, `objectTreeRows.tsx`, and the `dw-*` DOM anchor contract were not moved in Phase 5.

### 16.5 Validation Evidence

- `npx eslint` targeted Object Tree Phase 5 files passed.
- `./node_modules/.bin/tsc --noEmit --pretty false` passed.
- `node --test objectTreeActions + objectTreeDrawingActions` passed with 3 tests.
- `npm run test:technical-analysis-config` passed with 8 tests.
- `git diff --check` over the Phase 5 surface and rollback manifest passed.
- Anti-zombie and anti-barrel search over active panels/config object-tree code returned no matches.
- DOM anchor drift check still shows `useObjectTreePanel.ts` and `DataWindowTab.tsx` share the same `dw-*` and `dw-comp-*` anchors.
- Chrome DevTools MCP `list_pages` still returned `Transport closed`.
- Playwright/Chromium loaded `/equity/technical-analysis`, but the headless run did not render the Object Tree toolbar because the sidebar lazy content did not expose `button[title="Object tree and data window"]`; this is recorded as a browser-smoke limitation, not a Phase 5 runtime failure.

Next required action:

- Continue with a focused browser validation pass once Chrome DevTools MCP or the sidebar headless mount is restored, then decide whether to extract Object Tree inline confirm/error states.

## 17. Phase 6 - Browser Revalidation And Inline Confirm/Error Decision

Status: Blocked/deferred on 2026-06-05.

### 17.1 Browser Revalidation Attempt

The requested Object Tree browser validation was retried after Phase 5, but the prerequisite browser surface is still not restored:

- Browser Use integrated Node REPL backend is not exposed in this session, so the browser-use skill cannot drive the in-app browser directly.
- Chrome DevTools MCP `list_pages` still fails with `Transport closed`.
- Playwright/Chromium can load `/equity/technical-analysis` and the sidebar `<aside>` mounts, but its content remains the `SidebarModuleLoadingFallback` skeleton.
- The Object Tree entry point `button[title="Object tree and data window"]` is still absent in headless validation.
- Network diagnostics did not show failed `_next` JavaScript responses; the only console errors observed were development HMR WebSocket failures.

### 17.2 Decision

Do not extract Object Tree inline confirm/error states in this pass.

Reason: the requested gate was "relancer une validation navigateur Object Tree quand MCP/sidebar headless est restaure"; that condition is false. Extracting inline confirm/error UI before proving the real Object Tree runtime would be structural churn without human-visible validation.

### 17.3 Next Required Action

Restore one browser validation path first:

- Restore Chrome DevTools MCP transport or a usable browser-use backend.
- If MCP stays unavailable, fix or explain why the dynamic sidebar remains stuck on `SidebarModuleLoadingFallback` under headless Chromium.
- Then open Object Tree, exercise the toolbar, and only after that decide whether inline confirm/error states deserve a real leaf extraction with a new full rollback snapshot.

## 18. Phase 7 - Sidebar Dynamic Import Restoration

Status: Completed on 2026-06-05.

### 18.1 Rollback

Full rollback snapshot:

```text
_Rollback/panels-object-tree-phase7-sidebar-dynamic-20260605-151557/
  MANIFEST.md
  components/technical-analysis/TechnicalAnalysis.tsx
  components/technical-analysis/docs/prd/panels-realism-architecture.md
  AGENT-MEMOIRE_PROJECT_STATUS.scribe
```

The snapshot covers the lazy sidebar owner, this PRD, and causal memory only. It must not restore any Object Tree root shim, object-tree barrel, or modal-era Object Tree file.

### 18.2 Diagnosis

- Browser Use direct backend is unavailable because no Node REPL `js` tool is exposed.
- Chrome DevTools MCP `list_pages` still returns `Transport closed`.
- Playwright/Chromium loads `/equity/technical-analysis` and mounts the sidebar fallback for 30 seconds.
- No `_next` resource containing `sidebar` is requested during the fallback window.
- Next lazy-loading documentation says the `import()` path must be explicitly written inside the `dynamic()` call so Next can match bundles and module ids.
- The current sidebar loader is factored through `loadTechnicalAnalysisSidebar`, outside the `dynamic()` call.

### 18.3 Target Change

Mount the always-visible sidebar through a direct canonical import from `components/sidebar/TechnicalAnalysisSidebar.tsx` instead of a `ssr:false` dynamic boundary.

Reason: the inline `dynamic()` form generated a valid Turbopack async loader, but headless Chromium still kept the sidebar on `SidebarModuleLoadingFallback` and never requested the sidebar chunk. Since the sidebar is not an on-demand modal but a first-viewport operational surface, direct import is the lower-risk production behavior and restores the Object Tree validation path.

Non-goals:

- Do not extract inline confirm/error states in this phase.
- Do not modify Object Tree component internals.
- Do not introduce `index.ts`, `export *`, root compatibility files, or legacy panel shims.

### 18.4 Completion Criteria

- The sidebar content replaces `SidebarModuleLoadingFallback` in headless Chromium.
- The Object Tree toolbar button `button[title="Object tree and data window"]` is present.
- Clicking the Object Tree toolbar button opens `#gp-object-tree-overlay`.
- Console errors are limited to the known Next dev HMR WebSocket noise, with no page errors.
- `npx eslint` targeted `TechnicalAnalysis.tsx` passes.
- `./node_modules/.bin/tsc --noEmit --pretty false` passes.
- `git diff --check` passes on the Phase 7 surface.

### 18.5 Validation Evidence

- Browser Use direct backend remained unavailable because no Node REPL `js` tool is exposed.
- Chrome DevTools MCP tool transport still returned `Transport closed`.
- Direct CDP on `127.0.0.1:9222` connected to the existing Chrome localhost tab and verified React hydration on the Object Tree toolbar button.
- The sidebar toolbar and `button[title="Object tree and data window"]` were present after the direct canonical import.
- Clicking the Object Tree toolbar button opened `#gp-object-tree-overlay`.
- Data Window tab rendered `dw-date`, `dw-open`, `dw-high`, `dw-low`, `dw-close`, `dw-volume`, and `dw-change` anchors.
- Object Tree tab rendered the `BOABseries` and `Volumevolume` rows.
- Direct CDP validation reported zero page errors and zero console errors for the Object Tree interaction pass.
- `npx eslint` targeted `TechnicalAnalysis.tsx` and sidebar files passed.
- `./node_modules/.bin/tsc --noEmit --pretty false` passed.
- `git diff --check` passed on the Phase 7 surface.
- Anti-cruft search for removed sidebar lazy fallback symbols returned no matches.

Next required action:

- Decide whether inline confirm/error states deserve extraction only after a new full rollback snapshot. The browser validation prerequisite is now satisfied through CDP direct, while the formal Chrome DevTools MCP tool transport remains an external session issue.

## 19. Phase 8 - Inline Confirm/Error State Extraction

Status: Completed on 2026-06-05.

### 19.1 PRD Gate

PRD required? yes
Reason: This changes the Object Tree rendering boundary for a working runtime surface.
Architecture risk: low
Rollback tier: full

### 19.2 Rollback

Full rollback snapshot:

```text
_Rollback/panels-object-tree-phase8-inline-states-20260605-155100/
  MANIFEST.md
  components/technical-analysis/components/panels/object-tree/ObjectTreePanel.tsx
  components/technical-analysis/docs/prd/panels-realism-architecture.md
  AGENT-MEMOIRE_PROJECT_STATUS.scribe
```

`ObjectTreeInlineStates.tsx` did not exist before this phase. Rollback deletes it only if it still contains the Phase 8 extraction and has no newer human or parallel-agent edits.

### 19.3 Architecture Gate

Current dependency inventory:

| Legacy path | Current role | Imported by | Consumer count | Public API? | Decision |
| --- | --- | --- | ---: | --- | --- |
| `components/technical-analysis/components/panels/object-tree/ObjectTreePanel.tsx` | Runtime owner for Object Tree/Data Window state orchestration and rendering | Active sidebar panels tree | 1 active product consumer | No | Keep as canonical panel owner; reduce inline rendering only. |
| `components/technical-analysis/components/panels/object-tree/ObjectTreeInlineStates.tsx` | New leaf renderer for inline error, group creation, and delete-all confirmation UI | `ObjectTreePanel.tsx` | 1 | No | Add as canonical leaf component in the same folder. |

Responsibility test:

- The current folder is already a focused Object Tree boundary; no new subfolder is justified.
- Inline confirm/error UI is a separate rendering responsibility from panel orchestration, but it is not broad enough for a domain tree.
- Five well-named files in the current folder remain clearer than creating nested folders.

Chosen strategy:

- Keep the folder flat.
- Add one canonical leaf component next to the panel.
- Import it directly from `ObjectTreePanel.tsx`.
- Do not create `index.ts`, `export *`, same-name compatibility files, modal-era shims, or root re-export shells.

Rejected strategies:

- Move inline states into a new `inline-states/` folder because one component does not justify a new folder level.
- Keep the JSX inline because the panel already mixes orchestration, menu actions, grouping, and inline state rendering.
- Create a barrel adapter because there is only one active consumer and no public API boundary.

Canonical source of truth:

- `ObjectTreePanel.tsx` owns state, callbacks, and Object Tree/Data Window orchestration.
- `ObjectTreeInlineStates.tsx` owns only the inline error, create-group, and confirm-delete rendering.

Legacy removal proof:

- No legacy file is moved or preserved as an adapter.
- `rg "export \\*|from \"\.\"|from index.ts|index.ts" components/technical-analysis/components/panels/object-tree components/technical-analysis/config/object-tree` must return no active Object Tree barrel/zombie matches.

### 19.4 Completion Criteria

- Object Tree inline error, group creation, and delete-all confirmation UI remains visually and behaviorally unchanged.
- `ObjectTreePanel.tsx` delegates the inline state JSX to `ObjectTreeInlineStates.tsx`.
- The new component is prop-driven and does not import Redux, chart state, drawing models, or modal-era code.
- Browser validation still opens `#gp-object-tree-overlay`, renders Data Window anchors, renders Object Tree rows, and exercises one inline error or confirm state without page errors.
- Targeted ESLint passes for `ObjectTreePanel.tsx` and `ObjectTreeInlineStates.tsx`.
- TypeScript `tsc --noEmit --pretty false` passes.
- Object Tree action tests still pass.
- `git diff --check` passes on the Phase 8 surface.

### 19.5 Validation Evidence

- Rollback full created at `_Rollback/panels-object-tree-phase8-inline-states-20260605-155100/`.
- `ObjectTreeInlineStates.tsx` added as the only new canonical leaf renderer for inline Object Tree error, group creation, and delete-all confirmation states.
- `ObjectTreePanel.tsx` now delegates inline state rendering to `ObjectTreeInlineStates.tsx`; it still owns state, callbacks, grouping, and Object Tree/Data Window orchestration.
- Targeted `npx eslint` for `ObjectTreePanel.tsx` and `ObjectTreeInlineStates.tsx` passed.
- `./node_modules/.bin/tsc --noEmit --pretty false` passed.
- `node --test` for `objectTreeActions` and `objectTreeDrawingActions` passed with 3 tests after sandbox escalation for the `bwrap` failure.
- Anti-zombie/barrel search over active Object Tree panel/config code returned no matches.
- `git diff --check` passed on the Phase 8 surface.
- Chrome DevTools MCP `list_pages` still returned `Transport closed`.
- Browser Use direct Node REPL backend was not exposed in this session; `tool_search` exposed only multi-agent tooling, not a browser Node REPL.
- Direct CDP on `127.0.0.1:9222` opened `/equity/technical-analysis`, opened `#gp-object-tree-overlay`, mounted Data Window anchors `dw-date`, `dw-open`, `dw-high`, `dw-low`, `dw-close`, `dw-volume`, and `dw-change`, rendered `BOABseries` and `Volumevolume`, triggered the inline Object Tree error `Selectionnez un dessin pose pour creer un groupe.`, and reported zero console errors and zero page errors.

Next required action:

- Decide the next Object Tree split only if it has a concrete production payoff; the remaining `ObjectTreePanel.tsx` file is still above the file budget, but Phase 8 intentionally avoided a broader split without a new rollback and target gate.

## 20. Phase 9 Decision - Object Tree Drawing List Split Gate

Status: Completed on 2026-06-05.

### 20.1 Decision

The next Object Tree split does deserve a dedicated PRD gate and a new full rollback snapshot, but only if the implementation targets the drawing list/group rendering boundary.

Do not start with the symbol row or tab chrome. Those are mostly presentational and would reduce line count without enough production payoff.

### 20.2 Rationale

`ObjectTreePanel.tsx` remains above the file budget after Phase 8, but line count alone is not a sufficient reason to split. The remaining meaningful boundary is the drawings list because it combines empty state, group headers, collapsed group rendering, ungrouped drawing rendering, row callbacks, and selection behavior. That is a real behavior cluster and a plausible future test surface.

The split should keep the current flat Object Tree folder. A nested folder is still unjustified.

### 20.3 Required Gate Before Implementation

PRD required? yes
Reason: Extracting the drawings list changes a working Object Tree rendering boundary and can affect drawing selection, visibility, lock, delete, and group collapse behavior.
Architecture risk: low
Rollback tier: full

Before implementation, create a fresh rollback snapshot covering at least:

```text
components/technical-analysis/components/panels/object-tree/ObjectTreePanel.tsx
components/technical-analysis/docs/prd/panels-realism-architecture.md
AGENT-MEMOIRE_PROJECT_STATUS.scribe
```

If the implementation adds `ObjectTreeDrawingList.tsx`, the rollback manifest must record that it was absent before the phase and must delete it only if no newer human or parallel-agent edits exist.

### 20.3.1 Rollback Snapshot

Full rollback snapshot created before implementation:

```text
_Rollback/panels-object-tree-phase9-drawing-list-20260605-163648/
  MANIFEST.md
  components/technical-analysis/components/panels/object-tree/ObjectTreePanel.tsx
  components/technical-analysis/docs/prd/panels-realism-architecture.md
  AGENT-MEMOIRE_PROJECT_STATUS.scribe
```

`ObjectTreeDrawingList.tsx` did not exist before Phase 9. Rollback deletes it only if it still contains Phase 9 extraction work and has no newer human or parallel-agent edits.

### 20.4 Target Direction

Canonical target for the next split:

```text
components/technical-analysis/components/panels/object-tree/ObjectTreeDrawingList.tsx
```

Expected ownership:

- `ObjectTreePanel.tsx` keeps selected drawing/object state, callback wiring, Redux-derived object items, and Data Window tab orchestration.
- `ObjectTreeDrawingList.tsx` owns only empty drawing state, grouped drawing sections, ungrouped drawing rows, and the visual rendering of group collapse state.
- `collapsedGroups` should remain parent-owned unless the implementation proves tab switching does not regress collapse persistence.

Forbidden strategies:

- No `index.ts`.
- No `export *`.
- No compatibility adapter.
- No modal-era Object Tree shim.
- No nested `drawing-list/` folder for one file.

### 20.5 Required Validation If Implemented

- Targeted ESLint for `ObjectTreePanel.tsx` and `ObjectTreeDrawingList.tsx` passes.
- `./node_modules/.bin/tsc --noEmit --pretty false` passes.
- Object Tree action tests pass.
- Anti-zombie/barrel search over active Object Tree panel/config code returns no matches.
- Browser validation opens `#gp-object-tree-overlay`, confirms `BOABseries` and `Volumevolume`, verifies drawing empty state or rows, verifies Data Window anchors after opening Object Tree before hover, and reports zero console/page errors.

### 20.6 Validation Evidence

- Rollback full created at `_Rollback/panels-object-tree-phase9-drawing-list-20260605-163648/`.
- `ObjectTreeDrawingList.tsx` added as a flat canonical leaf component; no `index.ts`, `export *`, adapter, nested one-file folder, or modal-era shim was created.
- `ObjectTreePanel.tsx` now delegates empty drawing state, grouped drawing sections, and ungrouped drawing rows to `ObjectTreeDrawingList.tsx`; `collapsedGroups` remains parent-owned.
- `ObjectTreePanel.tsx` decreased from 534 lines to 477 lines; `ObjectTreeDrawingList.tsx` is 164 lines.
- Targeted `npx eslint` for `ObjectTreePanel.tsx` and `ObjectTreeDrawingList.tsx` passed.
- `./node_modules/.bin/tsc --noEmit --pretty false` passed.
- `node --test` for `objectTreeActions` and `objectTreeDrawingActions` passed with 3 tests after sandbox escalation for the `bwrap` failure.
- Anti-zombie/barrel search over active Object Tree panel/config code returned no matches.
- `git diff --check` passed on the Phase 9 surface.
- Chrome DevTools MCP `list_pages` still returned `Transport closed`.
- Browser Use direct Node REPL backend was not exposed in this session.
- Direct CDP on `127.0.0.1:9222` opened `/equity/technical-analysis`, opened `#gp-object-tree-overlay`, rendered `BOABseries`, `Volumevolume`, and `Aucun dessin sur le graphique.`, mounted Data Window anchors `dw-date`, `dw-open`, `dw-high`, `dw-low`, `dw-close`, `dw-volume`, and `dw-change`, triggered the inline Object Tree error `Selectionnez un dessin pose pour creer un groupe.`, and reported zero console errors and zero page errors.

Next required action:

- Stop splitting Object Tree by line count alone. Any further split needs a new production behavior boundary, likely symbol row/object item rows only if a concrete interaction or test surface justifies it.

### 20.7 Split Stop Gate

Status: Completed on 2026-06-05.

PRD required? yes
Reason: This is an architecture stop decision for the active Object Tree refactor series.
Architecture risk: none
Rollback tier: light

Decision:

- Stop Object Tree extraction work driven only by line count.
- Do not create a new rollback or implementation phase until a concrete behavior boundary is named.
- A valid future boundary must be tied to at least one of: a user-visible bug, a missing browser/test surface, a repeated behavior cluster, a measurable performance issue, or a change that cannot be safely validated while buried inside the shell.
- Invalid future boundaries: symbol row, tab chrome, or tiny JSX blocks extracted only to reduce `ObjectTreePanel.tsx` line count.

Current state after Phase 9:

- `ObjectTreePanel.tsx` remains the orchestrator for Redux-derived object items, selected object/drawing state, toolbar callbacks, Data Window tab switching, and chart visibility.
- `ObjectTreeInlineStates.tsx` owns inline error/create/confirm rendering.
- `ObjectTreeDrawingList.tsx` owns drawing empty state and grouped/ungrouped drawing rows while `collapsedGroups` remains parent-owned.

Resume criteria:

- Before any new Object Tree split, write the concrete behavior boundary in this PRD.
- Create a fresh full rollback only when implementation starts.
- Keep the folder flat unless multiple named siblings justify a folder.
- Continue forbidding `index.ts`, `export *`, compatibility adapters, same-name shells, and modal-era shims.
