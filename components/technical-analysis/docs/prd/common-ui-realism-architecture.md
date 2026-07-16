# PRD - Technical Analysis Common UI Realism And Architecture

Status: Implemented - validated from SCRIBE journal and current static gates
Date: 2026-06-03
Owner: Technical Analysis frontend
Scope: `components/technical-analysis/components/common`

PRD required? yes
Reason: This refactor changes shared UI contracts, import ownership, and file architecture across Technical Analysis common components.
Architecture risk: high
Rollback tier: full

## 2. Problem Statement

The current `common` folder works at the compiler level, but several files claim
professional accessibility, canonical icon ownership, or design-system quality
that the implementation does not actually provide.

The affected users are Technical Analysis maintainers and end users of modals,
dropdowns, drawing tools, and color controls. The work needs a PRD because a
partial refactor would create duplicate import paths, zombie barrels, and hidden
regression risk across many consumers.

If the work is not done, future agents will keep importing from ambiguous icon
paths, modal accessibility will remain overstated, and the existing common UI
layer will keep mixing source-of-truth files with re-export shells.

## 3. Current Inventory

| File or Area | Current Role | Issue | Target Direction |
| --- | --- | --- | --- |
| `primitives/BaseModal.tsx` | Shared modal shell | Dialog has ARIA basics, but no focus trap, no Escape handling, and body overflow restore is not stateful | Keep as primitive source of truth and make the contract honest |
| `primitives/ToolPortal.tsx` | Drawing toolbar dropdown portal | Search uses `contentEditable` as a searchbox and syncs with `textContent` | Replace with a controlled input and keep Escape close behavior |
| `primitives/FloatingMenu.tsx` | Chart toolbar floating menu | Instance-safe by ref, but no viewport collision behavior | Keep source of truth; do not expand scope unless validation shows a real regression |
| `primitives/ModalTabs.tsx` | Modal tab buttons | Visual tabs lack tablist/tab semantics | Add tab semantics without changing layout |
| `inputs/SettingsField.tsx` | Settings form controls | Claims full accessibility while labels are not bound to controls and empty number fields become `0` | Bind IDs/labels and make empty parsing explicit through the existing value contract |
| `inputs/ProColorPicker.tsx` | Custom color picker | Window listeners can survive unmount during drag; comments overstate production grade | Add listener cleanup and accurate component contract |
| `icons/drawing/ToolIcons.tsx` | Monolithic drawing icon source | 609-line mixed bundle with Bootstrap wrappers, SVG icons, category icons, and duplicate concepts | Split into domain source files and delete the monolith |
| `icons/drawing/*.ts` | Re-export shells | Domain folders exist but do not own definitions | Convert each file into the source of truth for its domain |
| `icons/chart.tsx` | Alert condition icons plus duplicate drawing icons | It duplicates drawing icon concepts and has misleading ownership | Move alert condition definitions to `icons/alerts.tsx`; delete chart duplicates if no active consumer remains |
| `common/index.ts`, `icons/index.ts`, `icons/drawing/index.ts` | Barrels | No proven active public consumer in current internal code | Delete unless import inventory proves a real boundary consumer |

### 3.1 Local Rollback Snapshot

Before implementation, create:

```text
_Rollback/common-ui-realism-architecture-<YYYYMMDD-HHMMSS>/
  MANIFEST.md
  components/technical-analysis/components/common/
  components/technical-analysis/components/toolbar/VerticalDrawingToolbar.tsx
  components/technical-analysis/components/overlays/PriceAxisOverlay.tsx
  components/technical-analysis/components/modals/alerts/AlertDetailsModal.tsx
  components/technical-analysis/config/drawing/drawingToolIconRegistry.tsx
```

Files are included because they are either common UI sources of truth or direct
consumers whose imports must migrate away from deleted paths.

Preserve parent paths with `cp --parents` from the repository root. The manifest
records SHA-256 hashes before edit, baseline validation results, and restore
rules.

Baseline validation before edits:

- `npx eslint components/technical-analysis/components/common`
- `./node_modules/.bin/tsc --noEmit`

Restore rule:

- Compare current files against the snapshot before restoring.
- Restore only files changed by this implementation.
- Never overwrite newer human or parallel-agent edits blindly.

## 4. Goals

1. Make every common UI contract match reality.
2. Preserve existing visual behavior for Technical Analysis modals, dropdowns,
   toolbar controls, and color picking.
3. Eliminate zombie icon files and unowned barrels from `common`.
4. Ensure each icon domain file owns its definitions directly.
5. Migrate active internal imports to canonical paths before deleting old files.
6. Keep TypeScript and focused ESLint green.

## 5. Non-Goals

1. No visual redesign of Technical Analysis.
2. No change to drawing tool behavior.
3. No new dependency.
4. No broad rewrite of modals, toolbar state, or drawing strategy logic.
5. No cleanup outside the common UI architecture and direct import consumers.

## 6. Target Structure

```text
components/technical-analysis/components/common/
  primitives/
    BaseModal.tsx
    ErrorBoundary.tsx
    FloatingMenu.tsx
    ModalTabs.tsx
    ToolPortal.tsx
  inputs/
    ProColorPicker.tsx
    SettingsField.tsx
  icons/
    alerts.tsx
    drawing/
      categories.tsx
      trend.tsx
      fibonacci.tsx
      patterns.tsx
      forecasting.tsx
```

Canonical ownership:

- `primitives/` owns modal, tab, menu, portal, and error boundary primitives.
- `inputs/` owns reusable settings controls and color picker behavior.
- `icons/alerts.tsx` owns alert condition icons.
- `icons/drawing/trend.tsx` owns trend, line, channel, and position drawing icons.
- `icons/drawing/fibonacci.tsx` owns Fibonacci, Gann, and pitchfork drawing icons.
- `icons/drawing/patterns.tsx` owns harmonic, geometric, Elliott, and cycle icons.
- `icons/drawing/forecasting.tsx` owns forecasting, volume, anchored VWAP, and anchored volume profile icons.
- `icons/drawing/categories.tsx` owns drawing toolbar category icons.

Old paths to delete:

- `components/technical-analysis/components/common/icons/drawing/ToolIcons.tsx`
- `components/technical-analysis/components/common/icons/chart.tsx`
- `components/technical-analysis/components/common/index.ts`
- `components/technical-analysis/components/common/icons/index.ts`
- `components/technical-analysis/components/common/icons/drawing/index.ts`
- `components/technical-analysis/components/common/primitives/index.ts`
- `components/technical-analysis/components/common/inputs/index.ts`

No old path remains temporarily. This is an internal module refactor, so active
imports must migrate in the same implementation phase.

### 6.1 Architecture Decision Gate

Architecture Gate:

Current dependency inventory:

| Legacy path | Current role | Imported by | Consumer count | Public API? | Decision |
| --- | --- | --- | ---: | --- | --- |
| `common/icons/drawing/ToolIcons` | Monolithic drawing icon source | Toolbar, overlay, drawing icon registry | 4 direct active areas | No | Split definitions by domain, migrate consumers, delete file |
| `common/icons/chart` | Alert import path plus duplicate drawing icons | Alert details modal | 1 active consumer | No | Move alert condition icons to `alerts.tsx`, migrate consumer, delete file |
| `common/index.ts` | Folder barrel | No active internal consumer expected | 0 after validation | No | Delete |
| `common/icons/index.ts` | Icon barrel | No active internal consumer expected | 0 after validation | No | Delete |
| `common/icons/drawing/index.ts` | Drawing barrel | No active internal consumer expected | 0 after validation | No | Delete |
| `common/primitives/index.ts` | Primitive barrel | No active internal consumer found | 0 after validation | No | Delete |
| `common/inputs/index.ts` | Input barrel | No active internal consumer found | 0 after validation | No | Delete |

Responsibility test:

- The current folder is broad because it mixes primitives, inputs, alert icons,
  drawing icons, and toolbar dropdown behavior.
- The responsibilities are large enough to justify subfolders because icons
  alone span multiple trading domains and exceed the file budget.
- Five flat files would not be clearer because icon ownership already maps to
  concrete drawing domains used by the toolbar.

Chosen strategy:

- Move to domain files, migrate all imports, then delete legacy files.

Rejected strategies:

- Keep flat files only because `ToolIcons.tsx` is already too large and mixes
  unrelated icon domains.
- Keep domain folders plus re-export shells because it creates two competing
  architectures and repeats the zombie-file failure mode.
- Keep temporary adapters because all consumers are internal and can be migrated
  in this PRD.

Canonical source of truth:

- `icons/alerts.tsx` owns alert condition icons.
- `icons/drawing/*.tsx` domain files own drawing icons directly.
- `primitives/*` and `inputs/*` own shared UI behavior directly.

Legacy removal proof:

- `rg "common/icons/drawing/ToolIcons|common/icons/chart|common/icons\" <scope>` must return no active code matches for deleted paths.
- The final tree must not contain same-name root files that only re-export domain files.

## 7. Requirements

### FR-001 - Honest Settings Inputs

Settings controls must expose accessible labels and stop claiming full
accessibility unless the markup supports it.

Acceptance:

- Input/select/textarea labels are bound by stable IDs.
- Custom checkbox and switch controls expose stable accessible names.
- Focus and keyboard toggling still work.

### FR-002 - Modal Contract Reality

`BaseModal` must provide the behavior implied by `aria-modal`.

Acceptance:

- Escape calls `onClose`.
- Initial focus moves inside the dialog.
- Tab navigation is trapped while the modal is open.
- Previous body overflow style is restored after the last modal closes.

### FR-003 - ToolPortal Real Search Input

Toolbar portal search must use a controlled input instead of a contentEditable
surrogate.

Acceptance:

- Search value is controlled by `searchQuery`.
- Escape clears and closes as before.
- Keyboard input, IME, and screen-reader semantics use native input behavior.

### FR-004 - Color Picker Listener Hygiene

`ProColorPicker` must not leak window listeners when unmounted mid-drag.

Acceptance:

- Drag listeners are removed on mouseup/touchend and on component unmount.
- Preset alpha preservation remains unchanged.
- External prop synchronization remains effect-based.

### FR-005 - Canonical Icon Domains

Drawing and alert icon ownership must be unambiguous.

Acceptance:

- `ToolIcons.tsx` is deleted.
- Domain icon files contain definitions, not only re-exports.
- Active imports use canonical domain paths.
- `chart.tsx` duplicate drawing icon ownership is removed.

## 8. Non-Functional Requirements

- Accessibility: labels, modal focus, tabs, and search must use real semantics.
- Maintainability: no zombie files, no unowned barrels, no duplicate canonical source.
- Performance: no new hot-path state loops or portal remount loops.
- Backward compatibility: visual output and user-facing behavior remain stable.

## 9. Migration Plan

### Phase 1 - Rollback And Baseline

Objective:

Create a local restore barrier and prove current validation status.

Actions:

1. Create `_Rollback/common-ui-realism-architecture-<timestamp>/`.
2. Copy targeted files with parent paths preserved.
3. Write `MANIFEST.md` with hashes and baseline validation.
4. Run baseline lint and typecheck.

Exit criteria:

- Snapshot exists.
- Baseline commands are recorded.

Rollback:

- Use the snapshot only for files changed by this implementation.

### Phase 2 - Behavior Contract Fixes

Objective:

Make existing primitives and inputs match their stated contracts without visual
redesign.

Actions:

1. Update `BaseModal`.
2. Update `ToolPortal`.
3. Update `SettingsField`.
4. Update `ProColorPicker`.
5. Update `ModalTabs` tab semantics.

Exit criteria:

- Focus, Escape, search, labels, and listener cleanup are implemented.
- TypeScript remains green.

Rollback:

- Patch back the changed primitive/input file from the snapshot if validation
  points to a regression.

### Phase 3 - Icon Ownership Completion

Objective:

Finish the icon architecture instead of leaving shell re-exports.

Actions:

1. Move icon definitions into domain files.
2. Migrate active imports to domain paths.
3. Delete `ToolIcons.tsx`, `chart.tsx`, and unused barrels.
4. Search for deleted legacy paths.

Exit criteria:

- Legacy import searches return no active code matches.
- Domain files own icon definitions directly.
- No same-name zombie adapters remain.

Rollback:

- Restore icon files and import consumers from the snapshot if TypeScript or
  toolbar smoke validation fails.

## 10. Validation Plan

- `npx eslint components/technical-analysis/components/common`
- `npx eslint components/technical-analysis/components/toolbar components/technical-analysis/components/overlays components/technical-analysis/components/modals/alerts components/technical-analysis/config/drawing`
- `./node_modules/.bin/tsc --noEmit`
- `rg "common/icons/drawing/ToolIcons|common/icons/chart" components/technical-analysis`
- `test ! -f components/technical-analysis/components/common/icons/drawing/ToolIcons.tsx`
- `test ! -f components/technical-analysis/components/common/icons/chart.tsx`

Runtime smoke when a browser session is available:

- Open Technical Analysis page.
- Open a modal that uses `BaseModal`.
- Open chart type menu.
- Open drawing toolbar dropdown search.
- Open color picker and drag hue, saturation/value, and alpha.

## 11. Risk Register

| Risk | Probability | Impact | Mitigation |
| --- | --- | --- | --- |
| Modal focus trap changes keyboard behavior | Medium | Medium | Keep trap minimal and limited to open modal content |
| Import migration misses one icon consumer | Medium | High | Use TypeScript and legacy path search |
| Icon split changes visual sizing | Medium | Medium | Preserve exact SVG markup and dimensions while moving files |
| Dirty worktree or parallel agent change conflicts | High | High | Use coordination claim, snapshot, and diff-based edits only |
| ToolPortal input changes event timing | Low | Medium | Preserve existing Escape, clear, and close behavior |

## 12. Rollback

Rollback uses the targeted `_Rollback/common-ui-realism-architecture-<timestamp>/`
snapshot. No data migration is involved.

If a regression appears:

1. Stop further refactor work.
2. Identify whether the failure is pre-existing or newly introduced.
3. Diff the current file against the snapshot.
4. Restore the smallest safe section or file touched by this implementation.
5. Rerun the same validation command that failed.

Temporary adapters are not used in this PRD. If validation proves an adapter is
required, the PRD must be revised before adding one.

## 13. Completion Criteria

- All behavior contract fixes in FR-001 through FR-004 are implemented.
- Icon ownership in FR-005 is implemented.
- Deleted legacy paths are absent from the active tree.
- No zombie re-export files remain in `common`.
- Validation plan commands pass or any pre-existing failure is documented.
- Implementation notes record the rollback snapshot path and validation results.


## 14. Implementation Notes

Validated on 2026-06-04 from the existing implementation and SCRIBE entry `JOURNAL-COMMON-UI-REALISM-ARCHITECTURE-20260603`.

Rollback snapshot:

- `_Rollback/common-ui-realism-architecture-20260603-092234/`

Validation results:

- `npx eslint components/technical-analysis/components/common`: PASS
- `npx eslint components/technical-analysis/components/toolbar components/technical-analysis/components/overlays components/technical-analysis/components/modals/alerts components/technical-analysis/config/drawing`: PASS
- `./node_modules/.bin/tsc --noEmit --pretty false`: PASS
- `rg "common/icons/drawing/ToolIcons|common/icons/chart|components/common/index|common/icons/index|common/icons/drawing/index|common/primitives/index|common/inputs/index" components/technical-analysis --glob "*.ts" --glob "*.tsx"`: PASS_NO_MATCH
- `git diff --check -- components/technical-analysis/docs/prd/common-ui-realism-architecture.md components/technical-analysis/components/common components/technical-analysis/components/toolbar components/technical-analysis/components/overlays components/technical-analysis/components/modals/alerts components/technical-analysis/config/drawing`: PASS
