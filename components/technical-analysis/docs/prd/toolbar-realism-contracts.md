# PRD - Technical Analysis Toolbar Realism Contracts

Status: Implemented
Date: 2026-06-04
Owner: Technical Analysis frontend
Scope: `components/technical-analysis/components/toolbar`

PRD required? yes
Reason: Toolbar controls are visible user promises; changing inert controls needs a written scope to avoid reopening the completed toolbar architecture refactor.
Architecture risk: low
Rollback tier: full

## 2. Problem Statement

The toolbar architecture PRD is implemented and the folder structure is already
canonical. The remaining risk is not folder ownership; it is UI truth.

`QuickOptionsPopup` still renders two disabled `SettingsToggle` controls with
empty `onChange` handlers:

- `Niveaux` for Fibonacci speed resistance arcs;
- `Lignes` for Pitchfan.

These controls look like switches even though they are not actionable. A
disabled switch can be acceptable when the unavailable state is the product
contract, but here the values are not unavailable settings. They are structural
parts of the drawing renderer that are always active or managed through level
configuration. Keeping them as disabled switches makes the popup look partially
broken.

This needs a PRD because the toolbar folder has already been refactored, and a
direct edit could accidentally become another architecture pass. The work must
stay limited to reconnecting visible controls to realistic behavior.

If this work is not done, future users and agents can interpret those switches
as broken features instead of fixed drawing properties.

## 3. Current Inventory

| File or Area | Current Role | Issue | Target Direction |
| --- | --- | --- | --- |
| `toolbar/floating/QuickOptionsPopup.tsx` | Quick settings for selected Gann, Fibonacci, Pitchfan, and anchored volume profile drawings | Two rows are disabled toggles with no-op handlers, which visually imply a blocked action | Replace no-op switches with non-interactive status rows |
| `toolbar/floating/ToolbarButtonPopups.tsx` | Mounts the quick options popup in the selected-drawing floating toolbar | No issue found; caller stays stable | Preserve unchanged |
| `toolbar/floating/ToolbarButton.tsx` | Decides whether the selected drawing has a quick options popup | No issue found; quick-options eligibility remains valid | Preserve unchanged |
| `toolbar/drawing/DrawingToolbarFooter.tsx` | Shows drawing utility/footer actions | Disabled actions have explicit unavailable titles and no empty handlers | Preserve unchanged |
| `ChartToolbar.tsx` | Horizontal toolbar actions | Capture is explicitly disabled and labelled unavailable; save/load/publish are real actions | Preserve unchanged |

### 3.1 Local Rollback Snapshot

Rollback snapshot to create before implementation:

```text
_Rollback/toolbar-realism-contracts-20260604-153918/
  MANIFEST.md
  components/technical-analysis/components/toolbar/floating/QuickOptionsPopup.tsx
  components/technical-analysis/docs/prd/toolbar-realism-contracts.md
  AGENT-MEMOIRE_PROJECT_STATUS.scribe
```

Files in the safety baseline:

| Original path | Reason |
| --- | --- |
| `components/technical-analysis/components/toolbar/floating/QuickOptionsPopup.tsx` | Only planned runtime/UI file for this pass |
| `components/technical-analysis/docs/prd/toolbar-realism-contracts.md` | PRD state for this implementation pass |
| `AGENT-MEMOIRE_PROJECT_STATUS.scribe` | Causal memory surface if the final update needs correction |

Snapshot method:

- `mkdir -p _Rollback/toolbar-realism-contracts-20260604-153918`
- `cp --parents <files> _Rollback/toolbar-realism-contracts-20260604-153918/`
- `MANIFEST.md` records hashes, baseline validation, and restore rule.

Baseline validation before edits:

- `npx eslint components/technical-analysis/components/toolbar/floating/QuickOptionsPopup.tsx components/technical-analysis/components/toolbar/floating/ToolbarButtonPopups.tsx components/technical-analysis/components/toolbar/ChartToolbar.tsx components/technical-analysis/components/toolbar/VerticalDrawingToolbar.tsx`
- `./node_modules/.bin/tsc --noEmit --pretty false`

Restore rule:

- Compare current files against the snapshot before restoring.
- Restore only files touched by this implementation.
- Never overwrite newer human or parallel-agent changes blindly.

## 4. Goals

1. Remove fake or no-op interactive controls from the quick-options popup.
2. Preserve all currently actionable quick-option settings.
3. Keep the toolbar folder architecture unchanged.
4. Keep the selected-drawing floating toolbar behavior unchanged.
5. Make fixed drawing properties read as fixed states, not broken switches.

## 5. Non-Goals

1. No visual redesign of the toolbar.
2. No new drawing feature.
3. No change to drawing geometry, hit testing, or renderer behavior.
4. No moving files or changing import paths.
5. No change to disabled footer actions that already advertise their unavailable state honestly.
6. No new dependency.

## 6. Target Structure

The target structure is unchanged:

```text
components/technical-analysis/components/toolbar/
  ChartToolbar.tsx
  VerticalDrawingToolbar.tsx
  LayoutSetupControl.tsx
  floating/
    QuickOptionsPopup.tsx
```

Old files or paths to delete: none.

Temporary adapters: none.

## 6.1 Architecture Decision Gate

Architecture Gate:

| Candidate | Decision | Reason |
| --- | --- | --- |
| Reopen toolbar folder architecture | Reject | `toolbar-ui-refactor.md` is already implemented and the current issue is not ownership |
| Wire fake toggles to hidden renderer state | Reject | No simple boolean exists for Pitchfan lines, and Fib Speed Resistance Arcs levels are level-driven |
| Keep disabled `SettingsToggle` rows | Reject | They look like broken controls and use no-op handlers |
| Replace with read-only status rows | Accept | It communicates the fixed state without pretending the user can toggle it |

Canonical source of truth:

- `QuickOptionsPopup.tsx` owns visible quick-option rows for selected drawings.
- Drawing renderers remain the source of truth for whether structural lines or
  level collections are rendered.

Legacy removal proof:

- `rg "disabled onChange=\\{\\(\\) => \\{\\}\\}" components/technical-analysis/components/toolbar/floating/QuickOptionsPopup.tsx` must return no matches.

## 7. Requirements

### FR-001 - No No-Op Switches

The popup must not render disabled `SettingsToggle` controls with empty
handlers.

Acceptance:

- No `disabled onChange={() => {}}` remains in `QuickOptionsPopup.tsx`.

### FR-002 - Fixed State Rows

Fixed drawing properties must be rendered as non-interactive status rows.

Acceptance:

- Fib Speed Resistance Arcs `Niveaux` is shown as a read-only active state.
- Pitchfan `Lignes` is shown as a read-only active state.
- Rows do not have `role="switch"`, `checkbox`, or click handlers.

### FR-003 - Preserve Actionable Controls

Every currently actionable quick option must keep its existing update behavior.

Acceptance:

- Existing `updateDrawing(...)` handlers remain for actionable rows.
- No drawing prop shape changes.

## 8. Non-Functional Requirements

Reliability:

- The popup should no longer imply incomplete behavior for fixed renderer
  properties.

Accessibility:

- Read-only rows should expose text state instead of disabled switch semantics.

Maintainability:

- Add at most one small local helper component if it removes duplication.

## 9. Implementation Phases

### Phase 1 - Rollback And Baseline

Create the snapshot defined in section 3.1 and run baseline validation.

### Phase 2 - Realism Fix

Replace the two no-op switches with read-only status rows.

### Phase 3 - Validation

Run focused eslint, global TypeScript, `git diff --check`, legacy no-op search,
and TA route health check.

## 10. Implementation Result

Implemented on 2026-06-04:

- Fib Speed Resistance Arcs `Niveaux` is now a read-only active state row.
- Pitchfan `Lignes` is now a read-only active state row.
- The two no-op disabled switch handlers were removed.
- Actionable quick-option toggles keep their existing `updateDrawing(...)` behavior.
- No toolbar architecture, import path, drawing renderer, geometry, or CSS redesign changed.

Validation:

- `npx eslint components/technical-analysis/components/toolbar/floating/QuickOptionsPopup.tsx components/technical-analysis/components/toolbar/floating/ToolbarButtonPopups.tsx components/technical-analysis/components/toolbar/ChartToolbar.tsx components/technical-analysis/components/toolbar/VerticalDrawingToolbar.tsx` - passed.
- `./node_modules/.bin/tsc --noEmit --pretty false` - passed.
- `rg "disabled onChange=\{\(\) => \{\}\}|onChange=\{\(\) => \{\}\}" components/technical-analysis/components/toolbar/floating/QuickOptionsPopup.tsx` - no matches.
- `git diff --check -- components/technical-analysis/components/toolbar/floating/QuickOptionsPopup.tsx components/technical-analysis/docs/prd/toolbar-realism-contracts.md` - passed.
- `curl -I http://localhost:3000/equity/technical-analysis` - HTTP 200.
- Real Chrome post-pass check: document/body stayed viewport-bounded with no page-level vertical overflow.

## 11. Completion Criteria

- No no-op switch remains in `QuickOptionsPopup.tsx`.
- Focused eslint passes.
- Global TypeScript passes.
- `git diff --check` passes.
- Route `/equity/technical-analysis` returns HTTP 200.
- SCRIBE records only the causal lesson: toolbar realism means fixed states
  should not masquerade as disabled actions.
