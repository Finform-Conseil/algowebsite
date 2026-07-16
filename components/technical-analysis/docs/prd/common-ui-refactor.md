# PRD - Technical Analysis Common UI Refactor

Status: Implemented - canonical imports migrated, root adapters removed
Date: 2026-06-01
Owner: Technical Analysis frontend
Scope: `components/technical-analysis/components/common`

## 1. Problem Statement

The `common` folder is currently used as a shared UI toolbox for the
Technical Analysis module, but it has accumulated mixed responsibilities:
generic UI primitives, domain-specific BRVM widgets, icon registries, form
controls, pickers, and modal infrastructure live side by side.

This creates three concrete risks:

1. Shared UI changes can unexpectedly affect BRVM-specific behavior.
2. The folder name implies clean reuse, but several components are not generic.
3. Accessibility, portal behavior, and icon ownership are fragile enough to
   create UI regressions during future feature work.

The refactor must turn `common` into a reliable internal design-system layer for
Technical Analysis without changing user-facing behavior.

## 2. Original Inventory

| File | Current Role | Main Issue | Target Direction |
| --- | --- | --- | --- |
| `BaseModal.tsx` | Shared modal shell | `aria-hidden` on the overlay parent can hide the dialog from assistive tech | Move to `common/primitives`, fix a11y |
| `FloatingMenu.tsx` | Floating portal menu | Fixed `id="gp-floating-menu"` is unsafe with multiple menus | Move to `common/primitives`, use refs/stable instance IDs |
| `ToolPortal.tsx` | Toolbar dropdown portal | Accepts `onClose` but does not use it | Move to `common/primitives`, make API honest or implement close behavior |
| `ModalTabs.tsx` | Modal tab navigation | Primitive with inline styling | Move to `common/primitives`, keep API stable |
| `ErrorBoundary.tsx` | Runtime fallback | Primitive but visual style is not aligned with dark TA UI | Move to `common/primitives`, dark fallback optional |
| `SettingsField.tsx` | Settings form controls | Comment says native inputs are eradicated, but native inputs remain | Move to `common/inputs`, fix comments and validation behavior |
| `ProColorPicker.tsx` | Color picker | Syncs props via state updates during render | Move to `common/inputs`, sync via effect/reducer |
| `ToolIcons.tsx` | Drawing tool icons | 601-line icon bundle, mixed Bootstrap/SVG, duplicate concepts | Split under `common/icons/drawing` |
| `ChartIcons.tsx` | Chart/alert icons | Duplicates alert and drawing icon concepts | Split under `common/icons/chart` and `common/icons/alerts` |
| `AlertConditionIcons.tsx` | Alert condition icons | Likely redundant with `ChartIcons.tsx` | Merge or re-export from canonical alert icons |
| `CurrencySelector.tsx` | Currency dropdown | Domain-specific market data in `common` | Move toward `market/CurrencySelector` |
| `SecurityBadge.tsx` | Security logo/ticker badge | Reads `BRVM_SECURITIES`; not generic | Move toward `market/SecurityBadge` |

## 3. Goals

1. Make `common` mean reusable UI infrastructure, not domain storage.
2. Preserve behavior during the first migration phase, then migrate internal call sites to canonical imports.
3. Remove the known a11y defect in `BaseModal`.
4. Make floating menu/portal behavior safe when multiple menus exist.
5. Consolidate icon ownership so each icon has one canonical source.
6. Remove misleading comments and APIs.
7. Keep visual output, keyboard behavior, and performance stable.

## 4. Non-Goals

1. No visual redesign of the Technical Analysis module.
2. No change to drawing-tool behavior.
3. No change to market data, currency conversion, or BRVM security metadata.
4. No removal of legacy import paths until internal consumers are migrated and validation is green.
5. No migration to an external design-system package in this phase.
6. No dependency addition unless a measurable problem cannot be solved locally.

## 5. Target Structure

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
    chart.tsx
    drawing/
      categories.ts
      trend.ts
      fibonacci.ts
      patterns.ts
      forecasting.ts
      index.ts
    index.ts
  index.ts
```

Domain-specific components have moved out of `common`:

```text
components/technical-analysis/components/market/
  CurrencySelector.tsx
  SecurityBadge.tsx
```

Compatibility adapters were allowed only during migration and have been removed after all internal call sites moved to canonical imports. Canonical replacements live under:

```text
components/technical-analysis/components/common/primitives/
components/technical-analysis/components/common/inputs/
components/technical-analysis/components/common/icons/
components/technical-analysis/components/market/
```

New code must import from the canonical subfolder directly. Do not recreate
root-level same-name adapters under `common`.

## 6. Functional Requirements

### FR-001 - Compatibility First

Existing internal imports from `components/technical-analysis/components/common/*`
must be migrated to canonical subfolders after Phase 1 and Phase 2.

Acceptance:

- `npx eslint` passes on all touched files.
- `./node_modules/.bin/tsc --noEmit` passes.
- No root-level same-name adapter remains after the migration is validated.

### FR-002 - Modal Accessibility

`BaseModal` must expose a valid accessible dialog tree.

Acceptance:

- The dialog node has `role="dialog"` and `aria-modal="true"`.
- The dialog remains reachable by assistive technologies.
- No ancestor of the dialog has `aria-hidden="true"`.
- Escape and close-button behavior remain unchanged.
- Overlay click-to-close remains unchanged.

### FR-003 - Floating Menu Instance Safety

`FloatingMenu` must not depend on a global fixed DOM ID for outside-click logic.

Acceptance:

- Each mounted menu can be identified by its own ref or stable generated ID.
- Outside-click handling closes only the intended menu.
- Multiple menus in transient React states do not conflict.
- Existing `anchorRect`, `width`, `className`, and `zIndex` behavior remains
  compatible.

### FR-004 - ToolPortal API Honesty

`ToolPortal` must either use `onClose` or remove it through a compatibility-safe
deprecation path.

Acceptance:

- If `onClose` stays in props, Escape invokes `onClose`.
- Click-outside behavior is explicit and documented in the component contract.
- No unused prop alias such as `_onClose` remains.

### FR-005 - Settings Input Correctness

`SettingsField` must stop claiming that native inputs are eradicated unless that
is actually true.

Acceptance:

- Comments describe the real implementation.
- Number parsing does not silently convert an empty field to `0` unless the
  caller explicitly wants that behavior.
- Controls keep keyboard accessibility.
- Existing settings modals do not lose values or reset unexpectedly.

### FR-006 - Color Picker State Sync

`ProColorPicker` must not call state setters during render.

Acceptance:

- External `color` and `opacity` updates sync through `useEffect` or reducer
  logic.
- User dragging remains responsive.
- No render loop occurs when mathematically equivalent colors are passed.
- Alpha preservation on preset click remains unchanged.

### FR-007 - Canonical Icon Ownership

Alert condition, chart, and drawing icons must have one canonical export path.

Acceptance:

- Duplicate alert condition icon definitions are removed or converted to
  re-exports.
- Drawing icons are grouped by domain rather than kept in one oversized file.
- Existing imports keep working through adapters until migration is complete.
- Bundle behavior must not regress measurably.

### FR-008 - Domain Extraction

`CurrencySelector` and `SecurityBadge` must be treated as market/domain
components, not generic common primitives.

Acceptance:

- New canonical path exists under `components/technical-analysis/components/market`.
- Old common paths re-export the market components during migration.
- No BRVM data import remains in the generic primitive folder after the final
  phase.

## 7. Non-Functional Requirements

### NFR-001 - No Visual Regression

The refactor must preserve the current Technical Analysis UI.

Required smoke flows:

- Open `/equity/technical-analysis`.
- Open and close each modal that uses `BaseModal`.
- Open chart type menu.
- Open drawing toolbar portals.
- Use color picker in toolbar.
- Open alert details modal and its floating menus.

### NFR-002 - Performance

The refactor must not add render work to the chart hot path.

Acceptance:

- No new state update loop in render.
- No document-level event listener leak after menus close.
- No repeated portal remount on stable props.
- No new dependency in the ECharts render loop.

### NFR-003 - SSR and Hydration Safety

Portal components must remain safe in Next.js client rendering.

Acceptance:

- Components that touch `document` or `window` guard usage correctly.
- No hydration error is introduced.
- No server-side import path touches browser-only APIs at module evaluation time.

### NFR-004 - Accessibility Baseline

All primitives should have predictable keyboard behavior.

Acceptance:

- Escape closes menus/modals where already expected.
- Buttons have accessible labels when icon-only.
- Tab navigation remains possible inside modal content.
- Checkbox/switch controls expose `role`, `aria-checked`, and keyboard toggles.

## 8. Migration Plan

### Phase 0 - Baseline Audit

Actions:

1. Record current file list and import call sites.
2. Run TypeScript and ESLint before changing code.
3. Capture current UI smoke behavior for:
   - chart toolbar menu,
   - vertical drawing toolbar portals,
   - global settings modal,
   - drawing settings modal,
   - alert details modal,
   - color picker.

Exit criteria:

- Baseline validation commands are known.
- All call sites are mapped.

### Phase 1 - Defect Fixes Without Moving Files

Actions:

1. Fix `BaseModal` a11y tree.
2. Replace `FloatingMenu` fixed ID lookup with a ref-based check.
3. Make `ToolPortal` use `onClose` for Escape or remove the prop through a
   controlled adapter.
4. Move `ProColorPicker` prop sync out of render.
5. Correct misleading comments in `SettingsField`.

Exit criteria:

- No structural import churn yet.
- All smoke flows still pass.
- TypeScript and ESLint are clean.

### Phase 2 - Introduce Canonical Subfolders

Actions:

1. Create `common/primitives`.
2. Create `common/inputs`.
3. Move implementations into canonical paths.
4. Keep old files as re-export adapters.

Exit criteria:

- Old imports still compile.
- New imports are available for future code.
- No behavior changes beyond Phase 1 fixes.

### Phase 3 - Icon Consolidation

Actions:

1. Split drawing icons by group.
2. Consolidate alert condition icons into one source.
3. Convert duplicate icon files to re-exports.
4. Update internal imports only when the blast radius is small and validated.

Exit criteria:

- One canonical icon definition per icon concept.
- `ToolIcons.tsx` becomes an adapter or smaller index.
- No visual icon regression in drawing toolbar or alert modal.

### Phase 4 - Domain Extraction

Actions:

1. Move `CurrencySelector` and `SecurityBadge` to `components/market`.
2. Keep old common paths as adapters.
3. Update direct internal imports gradually.

Exit criteria:

- Generic `common/primitives` does not import BRVM data.
- Market/domain components are clearly owned.
- Technical Analysis page remains visually unchanged.

### Phase 5 - Adapter Cleanup

Actions:

1. Remove old compatibility adapters only after every call site is migrated.
2. Run full validation.
3. Update module documentation.

Exit criteria:

- No stale common path remains unless intentionally public.
- No duplicate icon definitions remain.
- PRD checklist is fully satisfied.

## 9. Validation Commands

Minimum validation before delivery:

```bash
./node_modules/.bin/tsc --noEmit
npx eslint components/technical-analysis/components/common components/technical-analysis/components/modals components/technical-analysis/components/toolbar
git diff --check -- components/technical-analysis
curl -I http://localhost:3000/equity/technical-analysis
```

Recommended browser smoke validation:

```text
1. Load /equity/technical-analysis.
2. Open chart type FloatingMenu and select another chart type.
3. Open Settings modal and verify tabs, fields, close, overlay close.
4. Open Drawing Settings modal and verify numeric/color controls.
5. Open vertical toolbar ToolPortal groups and verify Escape/click behavior.
6. Open a ProColorPicker and drag hue, saturation/value, alpha.
7. Open Alert Details modal and verify nested FloatingMenu behavior.
```

## 10. Rollback Strategy

The refactor must be delivered in small reversible steps.

Rollback rules:

- Phase 1 fixes can be reverted file-by-file.
- Phase 2 moves must keep old adapter paths until all consumers are migrated.
- Phase 3 icon split must preserve old exports until visual parity is proven.
- Phase 4 domain extraction must keep common re-exports until all imports are
  migrated.

No destructive cleanup is allowed in the same PR as a structural move unless the
diff proves no external import can break.

## 11. Risks

| Risk | Severity | Mitigation |
| --- | --- | --- |
| Modal a11y fix changes overlay semantics | Medium | Browser smoke and keyboard testing |
| Menu outside-click behavior regresses | High | Ref-based implementation plus chart type and alert modal smoke tests |
| Icon split breaks toolbar imports | High | Keep adapter exports and migrate gradually |
| Color picker state sync changes drag responsiveness | Medium | Manual drag test and no setState during render |
| Domain extraction causes circular imports | Medium | Move through adapters and validate TypeScript after each phase |
| Inline style cleanup changes layout | Medium | Defer visual cleanup until after behavior refactor |

## 12. Open Questions

1. Should `common` remain private to Technical Analysis, or should stable
   primitives eventually move to a repo-level design system?
2. Should icon rendering standardize on local SVGs, Bootstrap icons, or a single
   typed icon registry?
3. Should `BaseModal` implement focus trapping now, or should that be a separate
   accessibility PR?
4. Should settings inputs keep native controls for browser ergonomics, or move to
   fully custom controls only where the product requires TradingView parity?

## 13. Definition of Done

The refactor is done when:

- `common/primitives`, `common/inputs`, and `common/icons` exist.
- BRVM/domain components are no longer implemented in generic common folders.
- `BaseModal` no longer hides its dialog from assistive tech.
- `FloatingMenu` no longer uses a fixed global ID for instance ownership.
- `ToolPortal` no longer exposes unused close behavior.
- `ProColorPicker` has no state setter during render.
- Duplicate alert icon definitions are removed or converted to re-exports.
- Existing user flows on `/equity/technical-analysis` are visually unchanged.
- TypeScript, ESLint, diff-check, and browser smoke validation pass.

## 14. Implementation Guardrails

1. Do not use `git add .`.
2. Do not include `.agent/`, `.agent/workflow/scribe/`, `graphify-out/`, or
   `scribe-out/` in implementation commits.
3. Do not mix this refactor with chart-rendering behavior changes.
4. Do not remove compatibility exports until every import path is migrated.
5. Keep each PR phase small enough to review with a focused diff.
