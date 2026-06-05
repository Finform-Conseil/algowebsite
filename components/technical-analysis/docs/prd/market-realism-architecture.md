# PRD - Technical Analysis Market Realism And Architecture

Status: Implemented
Date: 2026-06-04
Owner: Technical Analysis frontend
Scope: `components/technical-analysis/components/market`

PRD required? yes
Reason: The market folder owns visible security identity and currency controls consumed by TA and alert workflows.
Architecture risk: low
Rollback tier: full

## 2. Problem Statement

The market folder exists as the canonical home for `CurrencySelector` and
`SecurityBadge`, but the runtime contracts are still uneven.

`CurrencySelector` is visually a button, but the trigger is still a `div
role="button"` with manual keyboard behavior. That makes the control harder to
reason about than the footer controls that were just normalized to native
buttons. It also keeps the currency ref typed as a `HTMLDivElement`, forcing the
hook to model a pseudo-control.

`SecurityBadge` has the right domain dependency on BRVM securities and the
shared `BrvmLogoMark`, but its fallback copy can expose an unverified ticker in
a way that does not clearly separate verified catalog securities from external
or unknown inputs.

This needs a PRD because the folder is small but visible, and a direct
"cleanup" can easily touch currency conversion state, alert symbol rendering, or
the chart overlay layout.

If the work is not done, future agents may keep patching pseudo-button keyboard
logic instead of making the currency trigger a native control.

## 3. Current Inventory

| File or Area | Current Role | Issue | Target Direction |
| --- | --- | --- | --- |
| `CurrencySelector.tsx` | Renders selected currency trigger and portal listbox | Trigger is a pseudo-button; listbox is mostly realistic | Convert trigger to native button and keep portal/listbox state intact |
| `SecurityBadge.tsx` | Renders security logo, ticker and delisted badge | Verified vs fallback identity copy can be clearer | Keep rendering stable, improve semantic fallback contract only |
| `useCurrencyState.ts` | Owns currency open/query/ref state | Ref is typed for the pseudo-trigger | Retype ref to native button after trigger conversion |
| `styles/pages/_technical-analysis-final.scss` | Owns currency trigger/listbox visual density | Trigger styles are div-oriented and lack focus-visible | Add button reset and focus-visible without layout change |
| `TechnicalAnalysis.tsx` | Direct currency selector consumer | Prop contract must remain behaviorally stable | No behavioral change expected |

### 3.1 Local Rollback Snapshot

Rollback snapshot:

```text
_Rollback/market-realism-architecture-20260604-181023/
  MANIFEST.md
  components/technical-analysis/components/market/CurrencySelector.tsx
  components/technical-analysis/components/market/SecurityBadge.tsx
  components/technical-analysis/hooks/useCurrencyState.ts
  styles/pages/_technical-analysis-final.scss
  components/technical-analysis/TechnicalAnalysis.tsx
  AGENT-MEMOIRE_PROJECT_STATUS.scribe
```

Baseline validation before edits:

- `npx eslint components/technical-analysis/components/market/CurrencySelector.tsx components/technical-analysis/components/market/SecurityBadge.tsx components/technical-analysis/hooks/useCurrencyState.ts`: PASS
- `./node_modules/.bin/sass styles/pages/_technical-analysis-final.scss /tmp/ta-market-baseline.css`: PASS
- `./node_modules/.bin/tsc --noEmit --pretty false`: PASS
- `git diff --check -- components/technical-analysis/components/market/CurrencySelector.tsx components/technical-analysis/components/market/SecurityBadge.tsx components/technical-analysis/hooks/useCurrencyState.ts styles/pages/_technical-analysis-final.scss`: PASS

Restore rule:

- Restore only files touched by this PRD after comparing against the snapshot.
- Do not overwrite unrelated local edits in `TechnicalAnalysis.tsx` or SCSS.

## 4. Goals

1. Make the currency trigger a native `button type="button"`.
2. Keep currency dropdown filtering, listbox selection, Escape close, outside
   click close and focus return behavior.
3. Keep the market folder flat; it currently has only two focused components.
4. Preserve `SecurityBadge` rendering while clarifying fallback identity.
5. Add focus-visible styling without changing chart layout or floating trigger
   position.

## 5. Non-Goals

1. No currency conversion logic change.
2. No new currency list or exchange-rate source.
3. No chart viewport, footer, sidebar or toolbar layout change.
4. No migration of BRVM security catalog data.
5. No file move out of `components/market`.

## 6. Target Structure

```text
components/technical-analysis/components/market/
  CurrencySelector.tsx
  SecurityBadge.tsx
```

The folder remains flat. No barrel is added, because both components are
imported directly and a barrel would add a new public path without reducing
complexity.

### 6.1 Architecture Decision Gate

| Path | Current Role | Imported by | Consumer count | Public API? | Decision |
| --- | --- | --- | ---: | --- | --- |
| `components/market/CurrencySelector.tsx` | Currency trigger and dropdown | `TechnicalAnalysis.tsx`, types in providers/hooks | 3 | TA-internal | Keep path, harden trigger |
| `components/market/SecurityBadge.tsx` | Security identity badge | Alert details modal | 1 | TA-internal | Keep path, harden label contract |
| `hooks/useCurrencyState.ts` | Currency state and ref | Provider tree | 1 | TA-internal | Retype trigger ref only |
| `_technical-analysis-final.scss` | Visual contract | TA route | 1 route | Route style | Add scoped focus/reset rules |

Rejected strategies:

- Extracting a currency hook into `market`: current state is already owned by
  `useCurrencyState`; moving it would create churn without improving behavior.
- Replacing the portal/listbox with a native select: it would lose search and
  current interaction density.
- Moving `SecurityBadge` to common primitives: it imports BRVM domain data and
  is intentionally market-specific.

## 7. Requirements

### FR-001 - Native Currency Trigger

Acceptance:

- Trigger uses `button type="button"`.
- Ref type is `HTMLButtonElement`.
- Existing open/close, Escape, outside click and focus return behaviors remain.
- Accessible name still includes the selected currency.

### FR-002 - Currency Listbox Contract

Acceptance:

- Search input remains native.
- Options remain `role="option"` under `role="listbox"`.
- Selected option exposes `aria-selected`.
- Empty filtered state remains visible and non-interactive.

### FR-003 - Security Badge Identity Contract

Acceptance:

- Verified BRVM securities expose company name and ticker.
- Delisted securities keep the delisted marker.
- Unknown input is labelled as an unknown security, not silently as verified
  catalog data.
- Logo rendering stays delegated to `BrvmLogoMark`.

### FR-004 - Layout Non-Regression

Acceptance:

- `.gp-currency-btn` position, z-index and dimensions remain stable.
- No viewport, root height, chart height or sidebar width calculation is added.
- Browser smoke shows no document overflow.

## 8. Non-Functional Requirements

- Accessibility: native trigger, stable labels, keyboard support and visible
  focus.
- Maintainability: no pseudo-button trigger contract.
- Performance: no new render loop, observer, timer or resize calculation.
- Regression safety: no change to selected currency type or currency list
  values.

## 9. Migration Plan

### Phase 1 - Rollback And Baseline

Completed before implementation.

### Phase 2 - Native Trigger Hardening

Actions:

1. Convert currency trigger from `div role="button"` to `button type="button"`.
2. Retype `currencyBtnRef` to `HTMLButtonElement`.
3. Preserve click, Enter/Space, Escape and focus return behavior.
4. Add scoped button reset/focus-visible styles.

### Phase 3 - Badge Label Hardening

Actions:

1. Keep BRVM catalog lookup untouched.
2. Clarify unknown-security accessible/title copy.
3. Preserve visual ticker and delisted badge output.

### Phase 4 - Validation And Closure

Actions:

1. Run focused ESLint, Sass, TypeScript and diff-check.
2. Run route smoke on `/equity/technical-analysis`.
3. Verify the currency trigger opens the dropdown, filter works, option click
   closes it, and footer/layout overflow stays clean.
4. Mark PRD implemented and update SCRIBE.

## 10. Validation Plan

- `npx eslint components/technical-analysis/components/market/CurrencySelector.tsx components/technical-analysis/components/market/SecurityBadge.tsx components/technical-analysis/hooks/useCurrencyState.ts`
- `./node_modules/.bin/sass styles/pages/_technical-analysis-final.scss /tmp/ta-market-final.css`
- `./node_modules/.bin/tsc --noEmit --pretty false`
- `git diff --check -- components/technical-analysis/components/market/CurrencySelector.tsx components/technical-analysis/components/market/SecurityBadge.tsx components/technical-analysis/hooks/useCurrencyState.ts styles/pages/_technical-analysis-final.scss components/technical-analysis/docs/prd/market-realism-architecture.md`
- Browser/CDP smoke on `/equity/technical-analysis`.

## 11. Risk Register

| Risk | Probability | Impact | Mitigation |
| --- | --- | --- | --- |
| Button default styles alter trigger density | Medium | Medium | Add explicit reset under `.gp-currency-btn` |
| Ref type change breaks hook consumers | Low | Medium | TypeScript noEmit validates all consumers |
| Portal position changes | Low | Medium | Keep `getBoundingClientRect` logic unchanged |
| Unknown badge fallback becomes misleading | Medium | Low | Explicit unknown-security title/label |

## 12. Rollback

Use `_Rollback/market-realism-architecture-20260604-181023/`.

If a regression appears:

1. Stop further market work.
2. Compare current files against the snapshot.
3. Restore the smallest changed section or file.
4. Rerun the failed validation command.

## 13. Completion Criteria

- FR-001 through FR-004 implemented.
- No chart or viewport layout change introduced.
- Focused validations pass.
- Runtime smoke proves dropdown behavior and no overflow.
- SCRIBE records why the market folder is closed.

## 14. Implementation Closure

Implemented on 2026-06-04.

Runtime changes:

- CurrencySelector trigger is now a native button type=button.
- currencyBtnRef is now typed as HTMLButtonElement.
- Manual Enter/Space trigger emulation was removed because native buttons own
  that contract; Escape close remains explicit.
- gp-currency-btn has a scoped button reset and visible focus outline without
  changing position, z-index or dimensions.
- SecurityBadge unknown fallback copy now labels unknown inputs as unknown
  securities instead of presenting them like verified catalog records.

Validation results:

- npx eslint components/technical-analysis/components/market/CurrencySelector.tsx components/technical-analysis/components/market/SecurityBadge.tsx components/technical-analysis/hooks/useCurrencyState.ts: PASS
- ./node_modules/.bin/sass styles/pages/_technical-analysis-final.scss /tmp/ta-market-final.css: PASS
- ./node_modules/.bin/tsc --noEmit --pretty false: PASS
- git diff --check on market, currency hook and TA SCSS scope: PASS
- curl -I http://localhost:3000/equity/technical-analysis: HTTP 200
- Browser/CDP smoke: trigger tag BUTTON, dropdown opens, search filters usd to
  USD only, option click closes dropdown, focus returns to trigger, document/body
  overflow remains zero.
