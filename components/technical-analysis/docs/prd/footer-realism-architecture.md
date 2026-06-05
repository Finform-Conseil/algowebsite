# PRD - Technical Analysis Footer Realism And Architecture

Status: Implemented
Date: 2026-06-04
Owner: Technical Analysis frontend
Scope: `components/technical-analysis/components/footer`

PRD required? yes
Reason: The footer is a visible chart-control surface with keyboard, layout, and BRVM market-clock behavior.
Architecture risk: low
Rollback tier: full

## 2. Problem Statement

The footer works at compile time, but it still contains unrealistic UI contracts:
time range controls are spans with `role="button"` and no keyboard activation,
class names are duplicated, the date picker button lacks an explicit button
type and accessible label, and the market-clock behavior is embedded directly in
the render component without a named contract.

The affected users are keyboard users and maintainers of the Technical Analysis
layout. The affected surface is small, but it sits inside the chart height chain
that has already produced footer visibility regressions. This needs a PRD
because a cosmetic cleanup can accidentally change footer height, BRVM time
truth, or date picker behavior.

If the work is not done, the footer remains visually functional but semantically
crude, and future agents may repair accessibility by changing layout height or
market-clock semantics instead of the actual control contract.

## 3. Current Inventory

| File or Area | Current Role | Issue | Target Direction |
| --- | --- | --- | --- |
| `TechnicalAnalysisFooter.tsx` | Renders time ranges, date picker trigger, market status, display clock | Spans fake buttons, duplicate classes, inline clock contract, date picker button type missing | Keep one component, make controls native and clock contract explicit |
| `styles/pages/_technical-analysis-final.scss` | Owns footer layout and control styling | Styles time range spans only | Add a stable class for native time range buttons without changing footer dimensions |
| `TechnicalAnalysis.tsx` | Mounts memoized footer and owns range/date actions | Direct consumer; no change expected | Keep prop contract stable |
| `utils/brvmMarketSession.ts` | BRVM time/status source of truth | No change expected | Keep GMT+1 display and UTC session calculations intact |

### 3.1 Local Rollback Snapshot

Before implementation, create:

```text
_Rollback/footer-realism-architecture-<YYYYMMDD-HHMMSS>/
  MANIFEST.md
  components/technical-analysis/components/footer/TechnicalAnalysisFooter.tsx
  styles/pages/_technical-analysis-final.scss
  components/technical-analysis/TechnicalAnalysis.tsx
```

Files are included because the footer component and its SCSS own runtime
behavior and visual dimensions, while `TechnicalAnalysis.tsx` is the direct
consumer whose prop contract must stay stable.

Preserve parent paths with `cp --parents` from the repository root. The manifest
records SHA-256 hashes before edit, baseline validation results, and restore
rules.

Baseline validation before edits:

- `npx eslint components/technical-analysis/components/footer/TechnicalAnalysisFooter.tsx`
- `./node_modules/.bin/sass styles/pages/_technical-analysis-final.scss /tmp/ta-footer-baseline.css`
- `./node_modules/.bin/tsc --noEmit --pretty false`
- `git diff --check -- components/technical-analysis/components/footer/TechnicalAnalysisFooter.tsx styles/pages/_technical-analysis-final.scss`

Restore rule:

- Compare current files against the snapshot before restoring.
- Restore only files changed by this implementation.
- Never overwrite newer human or parallel-agent edits blindly.

## 4. Goals

1. Make time range controls native keyboard-accessible controls.
2. Preserve the existing footer dimensions and chart layout contract.
3. Keep BRVM display time in GMT+1 and session calculations in the existing utility.
4. Remove duplicate class tokens and implicit button behavior.
5. Keep the public footer prop contract stable for `TechnicalAnalysis.tsx`.

## 5. Non-Goals

1. No visual redesign of the footer.
2. No change to time range values or Redux time range behavior.
3. No change to BRVM market session rules.
4. No change to chart height ownership or viewport calculations.
5. No new dependency and no import migration outside the footer surface.

## 6. Target Structure

```text
components/technical-analysis/components/footer/
  TechnicalAnalysisFooter.tsx
```

The folder remains flat because it contains one component and no reusable
sub-domain yet. Adding subfolders would create architecture ceremony without
reducing real complexity.

Canonical ownership:

- `TechnicalAnalysisFooter.tsx` owns footer rendering, labels, and local clock
  tick lifecycle.
- `utils/brvmMarketSession.ts` remains the source of truth for market status and
  display clock formatting.
- `styles/pages/_technical-analysis-final.scss` owns footer layout and visual
  control styling.

Old paths to delete:

- None.

Temporary adapters:

- None.

### 6.1 Architecture Decision Gate

Architecture Gate:

Current dependency inventory:

| Path | Current role | Imported by | Consumer count | Public API? | Decision |
| --- | --- | --- | ---: | --- | --- |
| `components/footer/TechnicalAnalysisFooter.tsx` | Footer component | `TechnicalAnalysis.tsx` | 1 | No | Keep in place and harden behavior |
| `utils/brvmMarketSession.ts` | BRVM clock/status utility | Footer, sidebar, price axis | Multiple | Yes within TA | Do not modify |
| `styles/pages/_technical-analysis-final.scss` | TA visual contract | Global TA style bundle | 1 route surface | Yes within TA | Add one button class, no height change |

Responsibility test:

- The current folder has one source file, so a split would not reduce cognitive
  load.
- The realistic boundary is semantic hardening, not file movement.

Chosen strategy:

- Keep the footer flat, replace fake button semantics with native buttons, add a
  named time range button style, and keep layout dimensions unchanged.

Rejected strategies:

- Extracting a hook for the clock: the component is still small and the hook
  would add an abstraction without a second consumer.
- Moving footer styles into a CSS module: the Technical Analysis page currently
  uses a shared SCSS contract, and migrating one footer slice would create mixed
  ownership.
- Changing BRVM session utilities: that would exceed the footer PRD and risk
  breaking price-axis/sidebar time truth.

## 7. Requirements

### FR-001 - Native Time Range Controls

Time range controls must be real buttons.

Acceptance:

- Each range uses `button type="button"`.
- Active range exposes `aria-pressed`.
- Keyboard activation uses native button behavior.
- Existing visual spacing and active color are preserved.

### FR-002 - Date Picker Trigger Contract

The date picker trigger must be explicit and accessible.

Acceptance:

- The trigger uses `type="button"`.
- The trigger has a stable accessible label.
- The icon is hidden from assistive tech.
- Duplicate class tokens are removed.

### FR-003 - BRVM Clock Contract

The footer must preserve the existing BRVM time and session behavior.

Acceptance:

- Clock remains client-updated at 1 Hz.
- Initial render keeps the hydration guard behavior.
- Display suffix remains `GMT+1`.
- Market status still comes from `getBrvmMarketStatus`.

### FR-004 - Layout Non-Regression

Footer dimensions must not change accidentally.

Acceptance:

- `.gp-chart-footer` flex basis and min-height remain unchanged.
- No viewport or height calculation is added.
- Browser smoke shows footer visible with no document vertical overflow.

## 8. Non-Functional Requirements

- Accessibility: native controls, accessible labels, and stateful pressed
  semantics.
- Maintainability: no duplicated class tokens and no false role semantics.
- Performance: one interval per mounted footer, cleaned on unmount.
- Regression safety: do not touch chart height ownership or BRVM utility rules.

## 9. Migration Plan

### Phase 1 - Rollback And Baseline

Objective:

Create a restore barrier and prove current baseline status.

Actions:

1. Create `_Rollback/footer-realism-architecture-<timestamp>/`.
2. Copy footer, SCSS, and direct consumer files with parent paths preserved.
3. Write `MANIFEST.md` with hashes and baseline validation.
4. Run baseline lint, sass, typecheck, and diff-check.

Exit criteria:

- Snapshot exists.
- Baseline commands are recorded.

Rollback:

- Restore only footer/SCSS sections changed by this implementation after
  comparing against the snapshot.

### Phase 2 - Control Contract Hardening

Objective:

Make footer controls honest without changing visual layout.

Actions:

1. Replace range spans with native buttons.
2. Add `aria-pressed` to active time range controls.
3. Add explicit date picker button type and accessible label.
4. Remove duplicate class tokens.
5. Add SCSS for `.gp-time-range-btn` under the existing footer selector.

Exit criteria:

- Footer file remains under 300 lines.
- Static validations pass.

Rollback:

- Revert `TechnicalAnalysisFooter.tsx` and the SCSS footer selector from the
  snapshot if layout or keyboard validation regresses.

### Phase 3 - Validation And Closure

Objective:

Prove that the footer is Deep-Analysed and can be marked implemented.

Actions:

1. Run focused ESLint, Sass, TypeScript, and diff-check.
2. Run UI smoke on `/equity/technical-analysis` when Chrome DevTools is
   available.
3. Verify footer visibility, no document vertical overflow, active range button
   state, date picker opening, and market status/time visibility.
4. Update this PRD to `Status: Implemented` with validation notes.

Exit criteria:

- All acceptance criteria pass.
- SCRIBE journal records why this folder is closed.

Rollback:

- If UI smoke fails, stop and restore the smallest changed section that caused
  the regression.

## 10. Validation Plan

- `npx eslint components/technical-analysis/components/footer/TechnicalAnalysisFooter.tsx`
- `./node_modules/.bin/sass styles/pages/_technical-analysis-final.scss /tmp/ta-footer-final.css`
- `./node_modules/.bin/tsc --noEmit --pretty false`
- `git diff --check -- components/technical-analysis/components/footer/TechnicalAnalysisFooter.tsx styles/pages/_technical-analysis-final.scss components/technical-analysis/docs/prd/footer-realism-architecture.md`

Runtime smoke when a browser session is available:

- Open `/equity/technical-analysis`.
- Verify `.gp-chart-footer` is visible.
- Verify document `scrollHeight === clientHeight`.
- Verify active time range is a button with `aria-pressed="true"`.
- Click another time range and verify active state moves.
- Click the date picker trigger and verify the date picker dialog opens.
- Verify market status and GMT+1 clock are visible.

## 11. Risk Register

| Risk | Probability | Impact | Mitigation |
| --- | --- | --- | --- |
| Button default styles change footer visual density | Medium | Medium | Add explicit reset style under `.gp-time-range-btn` |
| Footer height changes and revives chart overflow | Low | High | Keep `.gp-chart-footer` dimensions untouched and run browser smoke |
| Date picker action regresses | Low | Medium | Keep prop contract stable and smoke click the trigger |
| BRVM time label regresses | Low | Medium | Do not modify `brvmMarketSession.ts` |

## 12. Rollback

Rollback uses the targeted `_Rollback/footer-realism-architecture-<timestamp>/`
snapshot. No data migration is involved.

If a regression appears:

1. Stop further footer work.
2. Identify whether the failure is pre-existing or introduced by this PRD.
3. Diff the current file against the snapshot.
4. Restore the smallest safe section or file touched by this implementation.
5. Rerun the failed validation command.

## 13. Completion Criteria

- FR-001 through FR-004 are implemented.
- Footer file remains under 300 lines.
- No chart height or viewport calculation is introduced.
- Static validation passes.
- Runtime smoke passes or a tooling limitation is documented honestly.
- SCRIBE records the closure and next folder candidate.

## 14. Implementation Notes

Implemented on 2026-06-04.

Rollback snapshot:

- `_Rollback/footer-realism-architecture-20260604-174518/`

Changes made:

- Replaced fake time range `span role="button"` controls with native `button type="button"` controls.
- Added `aria-pressed` to the active time range.
- Removed duplicate footer class tokens.
- Replaced the inline calendar SVG with the existing `lucide-react` calendar icon.
- Added explicit date picker trigger type and accessible label.
- Aligned the active currency trigger ref contract to `HTMLButtonElement` so TypeScript matches the rendered button.
- Added `.gp-time-range-btn` styling while preserving `.gp-chart-footer` dimensions.

Validation results:

- `npx eslint components/technical-analysis/components/footer/TechnicalAnalysisFooter.tsx`: PASS
- `./node_modules/.bin/sass styles/pages/_technical-analysis-final.scss /tmp/ta-footer-final.css`: PASS
- `./node_modules/.bin/tsc --noEmit --pretty false`: PASS
- `git diff --check -- components/technical-analysis/components/footer/TechnicalAnalysisFooter.tsx components/technical-analysis/hooks/useCurrencyState.ts styles/pages/_technical-analysis-final.scss components/technical-analysis/docs/prd/footer-realism-architecture.md _Rollback/footer-realism-architecture-20260604-174518/MANIFEST.md`: PASS
- Browser smoke through Chrome system and Playwright runtime API: PASS
- Browser smoke details: footer visible at 38px, no document overflow, 9 native time range buttons, active range moves to `5J`, date picker dialog opens and closes with Escape, no console errors.
- Clock hydration check: PASS, `HH:MM:SS GMT+1` visible after hydration.

Tooling note:

- Codex `mcp__chrome_devtools` still returned `Transport closed`.
- Direct `chrome-devtools-mcp` stdio also did not answer the local JSON-RPC initialize request in this shell context.
- The runtime UI gate was therefore executed with the installed Playwright API against the system Chrome binary, without downloading browsers or adding dependencies.

## 15. Deep-Analysis Registry Closure

Footer is validated as Deep-Analysed on 2026-06-04.

Closure evidence:

- PRD status is `Implemented`.
- Runtime footer smoke passed through Playwright runtime and system Chrome.
- Static gates passed: ESLint, Sass, TypeScript, and diff-check.
- SCRIBE journal `JOURNAL-TA-FOOTER-NATIVE-CONTROLS-20260604` records the causal closure.

Next untreated component folder inventory:

| Folder | Dedicated PRD | Dedicated Deep-Analysis Status | Decision |
| --- | --- | --- | --- |
| `components/technical-analysis/components/overlays` | `overlays-realism-architecture.md` Draft | Not implemented | Next dedicated folder |
| `components/technical-analysis/components/panels` | Covered indirectly by modals/config PRDs | Not dedicated | After overlays |

Reason for next selection: `overlays` is only one runtime file but owns price-axis interactions and has no implemented dedicated PRD. `panels/object-tree` is much larger and was already partially covered by the modals migration, so it should follow after overlays.
