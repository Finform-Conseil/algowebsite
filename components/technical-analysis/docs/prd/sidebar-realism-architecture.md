# PRD - Technical Analysis Sidebar Realism And Architecture

Status: Implemented
Date: 2026-06-04
Owner: Technical Analysis frontend
Scope: `components/technical-analysis/components/sidebar`

PRD required? yes
Reason: The sidebar is a high-blast-radius Technical Analysis surface that mixes market data, fundamentals, derived models, ECharts lifecycle code, modal UI, external actions, and presentation copy in one folder.
Architecture risk: high
Rollback tier: full

## 1. Deep Analysis Verdict

The sidebar is useful, but it is not yet realistic enough to keep its current
claims without qualification. It currently combines verified data, local
catalog fallbacks, derived formulas, synthetic mock values, and unavailable
features in the same visual surface.

The refactor must reconnect every displayed value to its real provenance:

- Real market mode must never invent fundamentals, dividends, targets, yields,
  dates, volume, or news.
- Mock mode may keep synthetic values only when the UI marks them as demo data.
- Derived values must be labeled as model outputs, not analyst facts.
- Empty or stale data must render as unavailable, not as a precise number.
- Disabled or decorative controls must either become real workflows or be
  removed.

This PRD is the required gate before touching runtime code in the sidebar
folder.

## 2. Problem Statement

`TechnicalAnalysisSidebar.tsx` has become a 2405-line god component. It fetches
data, normalizes response state, drives ECharts instances, calculates
fundamental and technical summaries, renders multiple panels, opens external
BRVM links, manages modal state, and exposes unavailable toolbar actions.

That shape hides three production risks:

1. Realism risk: users can see values that look sourced while they are derived,
   fallback, stale, or synthetic.
2. Regression risk: chart lifecycle, fetch state, and JSX are coupled tightly,
   so a small UI edit can break data behavior.
3. Cruft risk: disabled controls, duplicate class names, inline style systems,
   and silent failure paths make the surface look more complete than it is.

The affected users are Technical Analysis end users, market-data maintainers,
and future agents working on financial data quality.

If this is not corrected, the sidebar will continue to blur the line between
BRVM reality, local catalog approximations, and internal model heuristics.

## 3. Current Inventory

| File | Current Role | Realism Or Architecture Issue | Target Direction |
| --- | --- | --- | --- |
| `TechnicalAnalysisSidebar.tsx` | Main sidebar component, data orchestration, chart orchestration, derived metrics, panels, actions | 2405 lines, many responsibilities, mixed real/mock/display logic, repeated ECharts lifecycle blocks, disabled toolbar actions, duplicate class tokens | Keep as thin public shell and move panels, data contracts, chart hooks, and actions into owned modules |
| `TechnicalAnalysisSidebar.helpers.ts` | Fundamentals types, ticker normalization, data readers, source labels, latest-value helpers | Normalization is useful, but source labeling can overstate verification when data source is missing or local | Split provenance-aware normalization from display formatting and make source trust explicit |
| `sidebarEChartsRuntime.ts` | Lazy ECharts runtime registration and chart disposal | Useful runtime cache, but no shared hook for init, resize, observer lifecycle, tooltip safety, or option ownership | Keep runtime core and add a reusable sidebar chart lifecycle layer |
| `DividendHistoryModal.tsx` | Portal modal for dividend table | No Escape handling, no focus trap, no `role="dialog"`, no accessible close label, drops ex-date and pay-date fields | Replace with a modal contract that matches the common modal standard and renders all verified dividend fields |

## 4. Realism Audit

| Area | Current Signal | Risk | Required Correction |
| --- | --- | --- | --- |
| Real vs mock mode | `dataMode` exists, but several panels still compute synthetic values in mock mode using ticker hashes or fallback formulas | Demo data can be mistaken for real market intelligence | Add a visible `synthetic_mock` provenance state and forbid synthetic values in real mode |
| Fundamentals source label | Missing source can become a local catalog label | Local catalog fallback can look like verified external data | Add explicit source kinds: `verified_external`, `local_catalog`, `derived_model`, `synthetic_mock`, `unavailable` |
| Model rating | Sidebar computes score and one-year target from technicals, P/E, EPS, and dividend yield | Looks like an analyst target while it is an internal heuristic | Rename to model heuristic, show formula provenance, or hide when required inputs are not verified |
| Dividend history | Modal displays year and dividend only | It omits ex-date and pay-date despite the normalized dividend type supporting them | Render year, amount, ex-date, pay-date, and source coverage, or label the table as annual dividend summary |
| News feed | News API may return fallback or non-link records | Placeholder-like links can look like verified news | Reject `#` links in real mode or label the card as local fallback content |
| Bonds panel | Highest YTM section can imply live bond ranking | If data is stale or unavailable, the ranking looks precise without freshness context | Show timestamp, source, unavailable state, and stale warning |
| Watchlist settings | Local checkbox state affects only the current UI session | User can think settings are persistent | Persist settings or downgrade the UI to session-only controls |
| External links | `window.open` is called directly | Reverse-tabnabbing and malformed ticker URL risk | Centralize BRVM URL building, ticker encoding, and `noopener,noreferrer` behavior |
| Clipboard copy | Clipboard write has no visible success or error path | Copy failures are silent | Add async status and failure handling |
| Chart tooltips | Several ECharts tooltips return HTML strings | Remote labels or names can become HTML injection surface if not escaped | Escape tooltip text or use constrained plain renderers |
| Disabled controls | Bottom toolbar contains unavailable actions | Cruft suggests features exist when they do not | Remove them or connect them to real, specified workflows |
| Styling | Sidebar mixes SCSS classes, utility classes, inline colors, and duplicated class names | Maintenance cost and visual drift | Move modal and repeated sidebar styles to the existing SCSS ownership model |

## 5. Goals

1. Make every sidebar value traceable to a real provenance state.
2. Prevent mock, fallback, and derived values from being presented as verified
   market facts.
3. Split the sidebar into small owned modules without leaving zombie adapters.
4. Preserve the existing visual hierarchy unless a UI element is proven cruft.
5. Harden external actions, clipboard behavior, modal accessibility, and tooltip
   rendering.
6. Keep Technical Analysis route behavior stable while reducing the sidebar
   blast radius.

## 6. Non-Goals

1. No change to the `components/technical-analysis/lib` engine in this phase.
2. No redesign of the whole Technical Analysis page.
3. No new charting library.
4. No new market-data provider.
5. No backend API rewrite except for narrow response-contract fixes discovered
   by this sidebar work.
6. No global state migration unless a sidebar setting must become persistent.

## 7. Target Architecture

```text
components/technical-analysis/components/sidebar/
  TechnicalAnalysisSidebar.tsx
  data/
    sidebarDataTypes.ts
    sidebarFetchers.ts
    sidebarProvenance.ts
    sidebarFundamentals.ts
  charts/
    sidebarEChartsRuntime.ts
    sidebarChartOptions.ts
    useSidebarChart.ts
  actions/
    sidebarExternalLinks.ts
    sidebarClipboard.ts
  panels/
    WatchlistPanel.tsx
    SidebarNewsPanel.tsx
    SidebarStatsPanel.tsx
    FundamentalsPanel.tsx
    DividendsPanel.tsx
    IncomeStatementPanel.tsx
    PerformancePanel.tsx
    SeasonalityPanel.tsx
    TechnicalsPanel.tsx
    ModelHeuristicPanel.tsx
    BondsPanel.tsx
    ProfilePanel.tsx
  modals/
    DividendHistoryModal.tsx
```

Canonical ownership:

- `TechnicalAnalysisSidebar.tsx` owns layout composition, panel visibility, and
  public props only.
- `data/` owns fetchers, abort handling, response normalization, freshness, and
  provenance.
- `charts/` owns ECharts registration, option builders, lifecycle hooks,
  resize, disposal, observer behavior, and tooltip escaping.
- `actions/` owns external URL building, safe `window.open`, and clipboard
  status.
- `panels/` owns presentational sections only.
- `modals/` owns sidebar-specific modal content and delegates modal behavior to
  the common modal primitive where possible.

Old files must not remain as hollow re-export shells. If a file stays, it must
own real behavior.

## 8. Architecture Decision Gate

Current dependency inventory:

| Existing Unit | Responsibility Count | Imported By | Decision |
| --- | ---: | --- | --- |
| `TechnicalAnalysisSidebar.tsx` | 10+ | Technical Analysis page lazy sidebar loader | Keep public entrypoint, reduce to composition shell |
| `TechnicalAnalysisSidebar.helpers.ts` | 4 | Sidebar component and helper tests to be added | Split into data and display modules, then delete or keep only if it owns a clear public contract |
| `sidebarEChartsRuntime.ts` | 2 | Sidebar charts | Move into `charts/` and keep runtime cache as source of truth |
| `DividendHistoryModal.tsx` | 2 | Sidebar dividend section | Move into `modals/` and upgrade accessibility and data coverage |

Responsibility test:

- The folder already crosses data, charts, UI panels, modal behavior, and
  external actions.
- The main component is far above the local complexity budget.
- Repeated chart initialization blocks prove that a shared lifecycle hook is
  justified.
- The realism problem requires a typed provenance contract, not scattered
  display conditions.

Chosen strategy:

- Progressive split by behavior, with no temporary public adapter paths.
- Keep `TechnicalAnalysisSidebar.tsx` as the stable import boundary.
- Migrate internal imports in the same implementation phase that creates each
  new module.

Rejected strategies:

- Keep one file and only patch copy labels. This leaves chart, fetch, and
  provenance coupling intact.
- Add re-export barrels for every new folder. This recreates the zombie-path
  failure mode already identified in other Technical Analysis PRDs.
- Hide all fallback data globally. Mock mode still needs demo visibility, but it
  must be clearly labeled as synthetic.

Legacy removal proof:

- `rg "TechnicalAnalysisSidebar.helpers|sidebarEChartsRuntime|DividendHistoryModal" components/technical-analysis/components/sidebar components/technical-analysis/TechnicalAnalysis.tsx`
  must show only intended canonical imports after migration.
- `rg "Horaires indisponibles|Details indisponibles|Détails indisponibles" components/technical-analysis/components/sidebar`
  must return no active UI control unless a real workflow exists.
- `rg "Mock/catalog|Mock dataset|Catalogue BRVM local" components/technical-analysis/components/sidebar`
  must return only explicit provenance labels, not default real-mode labels.

## 9. Functional Requirements

### FR-001 - Provenance Contract

Every value rendered by the sidebar must carry or derive from a provenance kind.

Allowed kinds:

- `verified_external`
- `local_catalog`
- `derived_model`
- `synthetic_mock`
- `unavailable`

Acceptance:

- Real mode never renders `synthetic_mock`.
- `local_catalog` displays as fallback, not verified live data.
- `derived_model` shows the model basis or a short formula label.
- `unavailable` renders as an explicit unavailable state, not `0`.

### FR-002 - Fetch State Discipline

Sidebar fetches must be abortable and request-order safe.

Acceptance:

- Fundamentals, news, indices, and bonds fetchers use `AbortController` or an
  equivalent request guard.
- A stale response cannot overwrite newer ticker data.
- Fetch errors produce UI state, not console-only failure.
- Cache keys include the normalized ticker and data class.

### FR-003 - Fundamentals Reality

Fundamentals and financial series must only render when their ticker and source
match the selected security.

Acceptance:

- Mismatched ticker responses are rejected.
- Missing year, date, or amount values do not become precise financial facts.
- Latest-value helpers expose freshness and source, not only a number.

### FR-004 - Derived Model Honesty

The model score and target must be presented as an internal heuristic.

Acceptance:

- Panel title and copy do not imply external analyst coverage.
- The score is hidden or degraded when required verified inputs are missing.
- The one-year target displays the model source and does not appear when EPS
  and fallback technical inputs are insufficient.

### FR-005 - Dividend Modal Reality

Dividend history must render the fields the normalized data can support.

Acceptance:

- Year, amount, ex-date, pay-date, and source/freshness are represented when
  present.
- If only annual values are available, the modal title says annual dividend
  summary.
- Empty dividend history renders an unavailable state.

### FR-006 - Modal Accessibility

The dividend modal must meet the same baseline as the common modal contract.

Acceptance:

- `role="dialog"` and `aria-modal="true"` are present.
- Dialog has a stable accessible title.
- Escape closes the modal.
- Initial focus lands inside the dialog.
- Focus is trapped while open.
- Close button has an accessible label.

### FR-007 - Chart Lifecycle Extraction

Every sidebar ECharts block must use a shared lifecycle abstraction.

Acceptance:

- Chart init, dispose, resize, and intersection observer behavior are not
  duplicated per panel.
- Tooltip text is escaped or constrained to safe values.
- Chart option builders are pure functions where practical.
- Chart disposal remains safe if runtime loading resolves after unmount.

### FR-008 - External Action Hardening

External BRVM links and clipboard actions must be centralized.

Acceptance:

- BRVM ticker URLs are built from encoded normalized tickers.
- `window.open` includes `noopener,noreferrer`.
- Clipboard copy reports success and failure.
- Unsupported browser clipboard behavior is handled without throwing.

### FR-009 - Cruft Removal

Unavailable UI controls must not remain decorative.

Acceptance:

- Disabled "schedule" and "details" toolbar controls are removed unless a real
  workflow is implemented.
- Duplicate class tokens are removed.
- Session-only settings are labeled as session-only or persisted.
- Inline styling in sidebar-specific UI moves to the SCSS layer unless dynamic.

## 10. Non-Functional Requirements

### NFR-001 - Performance

- The sidebar must keep lazy loading behavior.
- Secondary sidebar fetches must remain deferred from initial chart load.
- Extracted panels must not cause broad rerenders on every market tick.
- ECharts runtime must still be registered once.

### NFR-002 - Reliability

- A failed secondary fetch cannot collapse the entire sidebar.
- Aborted requests must not log noisy user-visible errors.
- Chart unmount must not leak ECharts instances.

### NFR-003 - Security

- External actions must avoid reverse-tabnabbing.
- Tooltip strings must not trust remote labels.
- URLs must be encoded from normalized ticker values.

### NFR-004 - Maintainability

- No new file should exceed 300 lines unless it is a deliberate data registry.
- Panel components should be presentational and typed.
- Data fetchers must not import React.
- Chart option builders must not mutate component state.

## 11. Implementation Plan

### Phase 0 - Baseline And Rollback

Create a rollback snapshot before runtime edits:

```text
_Rollback/sidebar-realism-architecture-<YYYYMMDD-HHMMSS>/
  MANIFEST.md
  components/technical-analysis/components/sidebar/
  components/technical-analysis/TechnicalAnalysis.tsx
  styles/pages/_technical-analysis-final.scss
  app/api/market-data/brvm-fundamentals/route.ts
  app/api/market-data/brvm-news/route.ts
  app/api/market-data/brvm-bonds/route.ts
  app/api/market-data/indices/route.ts
```

Baseline validation:

- `npx eslint components/technical-analysis/components/sidebar components/technical-analysis/TechnicalAnalysis.tsx`
- `./node_modules/.bin/tsc --noEmit`
- Browser smoke test for the Technical Analysis route.

Restore rule:

- Restore only files touched by the implementation.
- Compare hashes against `MANIFEST.md` before restoring.
- Never overwrite newer human or parallel-agent changes blindly.

### Phase 1 - Data And Provenance

1. Create typed provenance helpers.
2. Move fundamentals normalization into `data/sidebarFundamentals.ts`.
3. Create abortable fetchers for fundamentals, news, indices, and bonds.
4. Add stale and unavailable states.
5. Replace real-mode synthetic fallback with explicit unavailable rendering.

### Phase 2 - Action And Modal Hardening

1. Create `actions/sidebarExternalLinks.ts`.
2. Create `actions/sidebarClipboard.ts`.
3. Move the dividend modal into `modals/`.
4. Upgrade modal accessibility and dividend field coverage.
5. Remove or implement unavailable toolbar actions.

### Phase 3 - Chart Lifecycle

1. Move runtime to `charts/sidebarEChartsRuntime.ts`.
2. Add `useSidebarChart`.
3. Extract option builders into `charts/sidebarChartOptions.ts`.
4. Escape tooltip labels.
5. Verify disposal after delayed runtime resolution.

### Phase 4 - Panel Extraction

Extract panels in this order:

1. `SidebarStatsPanel`
2. `FundamentalsPanel`
3. `DividendsPanel`
4. `IncomeStatementPanel`
5. `PerformancePanel`
6. `TechnicalsPanel`
7. `ModelHeuristicPanel`
8. `BondsPanel`
9. `SidebarNewsPanel`
10. `WatchlistPanel`
11. `ProfilePanel`

Each panel must receive typed data props and must not fetch directly.

### Phase 5 - Cruft And Zombie Path Gate

1. Delete old helper/runtime/modal paths only after imports migrate.
2. Remove duplicate class tokens.
3. Remove disabled controls that do not map to a real workflow.
4. Keep no hollow barrel files.
5. Update this PRD status notes if the final implementation intentionally
   deviates from the target.

### Phase 6 - Validation

Run:

- `npx eslint components/technical-analysis/components/sidebar components/technical-analysis/TechnicalAnalysis.tsx`
- `./node_modules/.bin/tsc --noEmit`
- `rg "Horaires indisponibles|Details indisponibles|Détails indisponibles" components/technical-analysis/components/sidebar`
- `rg "Mock/catalog|Mock dataset|Catalogue BRVM local" components/technical-analysis/components/sidebar`
- `rg "window.open" components/technical-analysis/components/sidebar`
- Browser smoke test for:
  - real-mode selected security
  - mock-mode selected security
  - fundamentals unavailable
  - dividend modal open, Escape, close, focus
  - chart panel mount and unmount

## 12. Acceptance Criteria

The sidebar deep refactor is complete when:

1. `TechnicalAnalysisSidebar.tsx` is a composition shell below 300 lines.
2. Every displayed financial or market value maps to an explicit provenance kind.
3. Real mode renders no synthetic mock values.
4. The model rating panel is named and labeled as an internal heuristic.
5. Dividend modal renders accurate available fields and passes modal accessibility
   baseline.
6. ECharts lifecycle code is shared, disposable, and tooltip-safe.
7. External links and clipboard calls are centralized and hardened.
8. Disabled cruft controls are removed or implemented.
9. No zombie helper, runtime, modal, or barrel path remains.
10. ESLint, TypeScript, and browser smoke checks pass.

## 13. Test Strategy

Unit tests:

- `normalizeTicker`
- provenance assignment
- fundamentals normalization
- dividend normalization
- latest-value freshness helpers
- safe external URL builder
- clipboard fallback behavior
- chart tooltip escaping

Component tests:

- Dividend modal accessibility and keyboard behavior.
- Panel unavailable states.
- Model heuristic hidden/degraded states.
- Real mode rejection of synthetic values.

Browser smoke:

- Technical Analysis route loads with sidebar closed and open.
- Real ticker switch does not show previous ticker fundamentals.
- Deferred charts render after idle load.
- Opening and closing dividend modal leaves focus in a sane state.

## 14. Risk Register

| Risk | Severity | Mitigation |
| --- | --- | --- |
| Ticker switch race shows old fundamentals | High | Request IDs plus AbortController per ticker |
| Synthetic data leaks into real mode | High | Provenance gate and tests |
| ECharts instances leak after panel unmount | Medium | Shared lifecycle hook and dispose-after-load guard |
| Split creates import zombies | Medium | Canonical import inventory and deletion gate |
| Accessibility regression in modal | Medium | Common modal contract plus keyboard tests |
| Visual drift from panel extraction | Medium | Browser screenshot smoke before and after |

## 15. Open Questions

1. Should local catalog fallback be acceptable in real mode if it is clearly
   labeled, or should real mode only show externally verified fundamentals?
2. Should the model heuristic panel remain visible for all tickers, or only when
   EPS, P/E, dividend yield, and technical trend inputs are current?
3. Should watchlist settings be persisted per browser, per account, or removed
   until account-level settings exist?
4. Should fallback news from local data be displayed in real mode, or hidden
   behind a "local archive" label?

## 16. Production Readiness Gate

The sidebar is production-realistic only when a maintainer can answer these
questions for any visible number:

- What is the source?
- How fresh is it?
- Is it verified, local fallback, derived, synthetic, or unavailable?
- What happens when the source is missing?
- Can a user mistake this value for external analyst advice?

If any answer is unclear, the value must be hidden, relabeled, or downgraded
before the sidebar can claim real market behavior.
