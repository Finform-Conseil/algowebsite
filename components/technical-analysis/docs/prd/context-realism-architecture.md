# PRD - Technical Analysis Context Realism And Architecture

Status: Implemented
Date: 2026-06-04
Owner: Technical Analysis frontend
Scope: `components/technical-analysis/context`

PRD required? yes
Reason: The context layer changes existing data flow, provider contracts, chart refs, and runtime consumers.
Architecture risk: high
Rollback tier: full

## 2. Problem Statement

The `context` folder works at runtime, but it mixes honest provider wiring with
several fragile contracts:

- context consumers in `TechnicalAnalysis.tsx` use non-null assertions instead
  of provider-bound hooks, so a broken provider tree fails unclearly;
- `ChartRefsProvider` creates a new context value object on every render, which
  can invalidate consumers even though the refs themselves are stable;
- `ChartStateProvider` exposes `displaySymbolName` as a market identity while
  anonymous UI state can turn that identity into a pseudo in downstream alert or
  broker flows;
- the folder has no PRD-level record proving why it should stay flat instead of
  being split into artificial domain subfolders.

Affected users are the Technical Analysis chart, sidebar, price-axis overlay,
trade HUD, modal orchestration, drawing layer, and future maintainers who need a
clear provider contract.

This needs a PRD because the folder is small but sits on high-risk runtime
wiring: data mode, ticker selection, currency conversion, chart refs, drawing
state, and market-data consumers.

If this work is not done, future changes can keep adding `useContext(...)!`,
provider identity churn, and identity mixing between market symbols and anonymous
presentation labels.

## 3. Current Inventory

| File or Area | Current Role | Issue | Target Direction |
| --- | --- | --- | --- |
| `context/TechnicalAnalysisProviders.tsx` | Owns Broker, Currency, ChartRefs, MarketData, ChartState, Drawing providers and exports raw contexts | Small folder, but the file contains provider order, derived chart state, filtered data, currency conversion, chart refs, and runtime identity | Keep as the canonical context entrypoint; make runtime contracts explicit with required hooks and stable provider values |
| `TechnicalAnalysis.tsx` consumers | Reads all TA contexts for connected leaf components and chart shell | Uses `useContext(Context)!`, hiding missing-provider failures and coupling consumers to raw contexts | Import required hooks from the context entrypoint and remove non-null context assertions |
| `TickerSelectorProvider` boundary | Provides selected BRVM security and modal state | Context provider passes initial BOAB and later restores persisted ticker; this is valid and must not be broken | Preserve provider order and selected-ticker behavior |
| Anonymous UI state | Controls public display/publishing pseudo | Can contaminate `displaySymbolName` if market identity is treated as a presentation label | Keep market symbol as real ticker; use anonymous state only for profile initials/presentation-specific controls |
| `ChartRefsProvider` | Shares imperative DOM/ECharts refs | Ref object is recreated per render although individual refs are stable | Memoize the provider value so ref consumers do not re-render from object identity churn |

### 3.1 Local Rollback Snapshot

Because the PRD gate was re-read after implementation had already started, this
PRD records a late-gate barrier instead of pretending a true pre-edit snapshot
exists.

Rollback snapshot:

```text
_Rollback/context-deep-analysis-late-gate-20260604-125022/
  MANIFEST.md
  components/technical-analysis/context/TechnicalAnalysisProviders.tsx
  components/technical-analysis/TechnicalAnalysis.tsx
  AGENT-MEMOIRE_PROJECT_STATUS.scribe
```

Files in the safety baseline:

| Original path | Reason |
| --- | --- |
| `components/technical-analysis/context/TechnicalAnalysisProviders.tsx` | Primary context contract and provider tree |
| `components/technical-analysis/TechnicalAnalysis.tsx` | Direct runtime consumer of all TA contexts |
| `AGENT-MEMOIRE_PROJECT_STATUS.scribe` | Causal memory surface if the final SCRIBE update needs correction |

Snapshot method:

- `mkdir -p _Rollback/context-deep-analysis-late-gate-20260604-125022`
- `cp --parents <files> _Rollback/context-deep-analysis-late-gate-20260604-125022/`
- `MANIFEST.md` stores SHA-256 hashes and the late-gate reason.

Baseline validation before first edit was not available because the PRD gate was
re-read after initial edits. Resume validation is therefore mandatory before the
work can be marked implemented.

Restore rule:

- Compare current files against this snapshot before restoring.
- Restore only the delta introduced after this late gate, or patch back the
  smallest broken section.
- Never overwrite newer human or parallel-agent changes blindly.

## 4. Goals

1. Make context access fail fast with named provider errors.
2. Preserve the existing Technical Analysis provider order and visible behavior.
3. Keep `context` flat because the folder has one canonical runtime entrypoint.
4. Stabilize chart refs context identity without changing ref semantics.
5. Keep market identity as a real BRVM ticker even when anonymous UI mode is on.

## 5. Non-Goals

- No visual redesign.
- No file move or domain folder split.
- No changes to market-data fetchers, chart rendering, Redux reducer behavior, or modal ownership.
- No new compatibility adapter or barrel.
- No change to the public route `/equity/technical-analysis`.

## 6. Target Structure

The target structure stays flat:

```text
components/technical-analysis/context/
  TechnicalAnalysisProviders.tsx
```

`TechnicalAnalysisProviders.tsx` remains the canonical source of truth for:

- provider tree order;
- raw context declarations;
- required context hooks;
- chart refs creation;
- chart-state derivation from ticker, currency, market data, and Redux UI state;
- drawing provider wiring.

This structure is necessary because there is only one context file. Creating
subfolders for a one-file folder would add architecture without reducing real
complexity. The correct improvement is contract realism, not a fake domain tree.

Old files or paths to delete: none.

Temporary adapters: none.

## 6.1 Architecture Decision Gate

Architecture Gate:

Current dependency inventory:

| Legacy path | Current role | Imported by | Consumer count | Public API? | Decision |
| --- | --- | --- | ---: | --- | --- |
| `components/technical-analysis/context/TechnicalAnalysisProviders.tsx` | Context provider tree and context exports | `components/technical-analysis/TechnicalAnalysis.tsx` | 1 | Internal module API | Keep canonical and flat; add required hooks in the same file |
| Raw context symbols from `TechnicalAnalysisProviders.tsx` | Context objects consumed with non-null assertions | `TechnicalAnalysis.tsx` connected leaves and chart shell | 6 consumer blocks | Internal | Replace direct runtime consumption with required hooks |

Responsibility test:

- Is the current folder too broad because it mixes different responsibilities? No. The folder has one file and one boundary: Technical Analysis provider wiring.
- Are the responsibilities large enough to justify subfolders? No. The file has several providers, but a folder split would create single-file subfolders and import churn.
- Would five well-named files in one folder be clearer than a domain tree? Not yet. There is no proven need to split provider implementations today.

Chosen strategy:

- Keep flat and improve contracts in the canonical file.

Rejected strategies:

- Move to domain folders, because it would create artificial one-file folders and no deletion value.
- Keep raw context imports in consumers, because `useContext(...)!` hides provider-tree failures.
- Create a compatibility barrel, because there is only one active internal consumer and no public folder API.

Canonical source of truth:

- `components/technical-analysis/context/TechnicalAnalysisProviders.tsx` owns Technical Analysis provider order, context declarations, and required context hooks.

Legacy removal proof:

- `rg "useContext\((BrokerContext|CurrencyContext|ChartRefsContext|MarketDataContext|ChartStateContext|DrawingContext)" components/technical-analysis/TechnicalAnalysis.tsx` must return no active matches.
- No same-name root adapter or re-export file may be added under `context/`.

## 7. Requirements

### FR-001 - Required Context Hooks

Consumers must read TA contexts through required hooks exported by the context
entrypoint.

Acceptance:

- `TechnicalAnalysis.tsx` does not call `useContext(TAContext)!` for TA contexts.
- Missing provider errors name the missing context and expected provider.

### FR-002 - Stable Chart Refs Context

`ChartRefsProvider` must preserve a stable context value object for the lifetime
of the provider.

Acceptance:

- The provider value is memoized.
- The individual refs remain the same React refs used by existing consumers.

### FR-003 - Real Market Identity

`displaySymbolName` must remain a real market ticker and must not become an
anonymous pseudo.

Acceptance:

- Alert and broker flows still receive real symbols such as `BOAB`.
- Anonymous UI mode only changes user/profile presentation, not instrument identity.

### FR-004 - Provider Order Preservation

The provider tree must preserve the existing runtime order.

Acceptance:

- `TickerSelectorProvider` remains above `MarketDataProvider` and `ChartStateProvider`.
- `ChartRefsProvider` remains above `DrawingProvider`.
- `TickerSelectorModal` remains mounted inside the provider tree.

## 8. Non-Functional Requirements

Performance:

- Avoid avoidable context re-renders from ref container identity churn.

Reliability:

- Provider misuse must fail fast with clear error messages.

Maintainability:

- Keep one canonical context source and no duplicate import paths.

Backward compatibility:

- Preserve existing import path `./context/TechnicalAnalysisProviders`.
- Preserve route and visible behavior.

Testability:

- Validation must include TypeScript, ESLint, and direct search proving raw context assertions are gone from `TechnicalAnalysis.tsx`.

## 9. Migration Plan

### Phase 0 - Late Gate Correction

Objective:

Record the current delta, create a late rollback barrier, and define the PRD
before resuming implementation.

Actions:

1. Read `.agent/workflow/prd/README.md`.
2. Create `_Rollback/context-deep-analysis-late-gate-20260604-125022/`.
3. Record the late-gate status in this PRD.

Files or areas affected:

- `_Rollback/context-deep-analysis-late-gate-20260604-125022/`
- `components/technical-analysis/docs/prd/context-realism-architecture.md`

Exit criteria:

- PRD exists with target structure, architecture gate, validation, and rollback.

Rollback:

- Remove the new PRD only if the user cancels the context work before implementation resumes.

### Phase 1 - Context Contract Realism

Objective:

Make context access explicit, stable, and honest without moving files.

Actions:

1. Export required context hooks from `TechnicalAnalysisProviders.tsx`.
2. Memoize `ChartRefsProvider` value.
3. Keep market symbol identity real under anonymous UI mode.
4. Migrate `TechnicalAnalysis.tsx` context consumers to the required hooks.

Files or areas affected:

- `components/technical-analysis/context/TechnicalAnalysisProviders.tsx`
- `components/technical-analysis/TechnicalAnalysis.tsx`

Exit criteria:

- TypeScript passes.
- ESLint passes on the affected files.
- Raw TA `useContext(...!)` reads are gone from `TechnicalAnalysis.tsx`.

Rollback:

- Patch back the hook migration or restore from the late-gate snapshot if a regression appears.

### Phase 2 - Validation And Status Update

Objective:

Prove the context folder deep analysis is complete and update lifecycle status.

Actions:

1. Run validation commands.
2. Update PRD status to `Implemented` only if validation is green.
3. Update SCRIBE with the causal lesson, not structural facts.

Exit criteria:

- PRD status reflects the real implementation state.
- SCRIBE YAML remains valid.

Rollback:

- If validation fails, keep PRD status `Approved` and patch the smallest failing section.

## 10. Validation Plan

Validation:

- `./node_modules/.bin/tsc --noEmit --pretty false`
- `npx eslint components/technical-analysis/context/TechnicalAnalysisProviders.tsx components/technical-analysis/TechnicalAnalysis.tsx`
- `rg "useContext\((BrokerContext|CurrencyContext|ChartRefsContext|MarketDataContext|ChartStateContext|DrawingContext)" components/technical-analysis/TechnicalAnalysis.tsx` returns no active matches.
- `rg "export \* from" components/technical-analysis/context` returns no matches.
- Runtime smoke in browser on `/equity/technical-analysis` if static validation exposes no blocker.

## 11. Risk Register

| Risk | Probability | Impact | Mitigation |
| --- | --- | --- | --- |
| Provider hooks throw because a consumer is rendered outside `TechnicalAnalysisProviderTree` | Low | High | `TechnicalAnalysis` root still wraps `ChartUI` in the provider tree; validation checks imports and runtime smoke |
| Memoized ref object changes hook behavior | Low | Medium | Individual refs remain declared with `useRef`; only the containing object is memoized |
| Anonymous pseudo removal from `displaySymbolName` changes expected UI copy | Medium | Medium | Toolbar already controls anonymous label separately; market-facing flows require real ticker identity |
| Late PRD gate hides original pre-edit baseline | Medium | Medium | Manifest states this honestly and uses a resume barrier instead of pretending pre-edit hashes exist |

## 12. Rollback

Rollback uses `_Rollback/context-deep-analysis-late-gate-20260604-125022/`.

Safe rollback scope:

- `components/technical-analysis/context/TechnicalAnalysisProviders.tsx`
- `components/technical-analysis/TechnicalAnalysis.tsx`
- final SCRIBE update if it is malformed

No data migration is involved.

No compatibility adapters are introduced.

A targeted patch-back is preferred. Full-file restore is only safe after comparing
current files against the snapshot and confirming no newer human or parallel-agent
changes would be overwritten.

Rollback validation:

- Re-run the same TypeScript and ESLint commands from the validation plan.
- Re-run the raw-context import search.


## 13. Implementation Notes

Implemented on 2026-06-04.

Changes completed:

- Added required context hooks in `TechnicalAnalysisProviders.tsx`.
- Replaced raw TA `useContext(... )!` reads in `TechnicalAnalysis.tsx` with required hooks.
- Memoized `ChartRefsProvider` value while preserving all existing refs.
- Kept `displaySymbolName` as a real BRVM ticker under anonymous mode.
- Preserved the flat `context/` structure and avoided adapters/barrels.

Validation results:

- `./node_modules/.bin/tsc --noEmit --pretty false` passed.
- `npx eslint components/technical-analysis/context/TechnicalAnalysisProviders.tsx components/technical-analysis/TechnicalAnalysis.tsx` passed.
- `rg "useContext\((BrokerContext|CurrencyContext|ChartRefsContext|MarketDataContext|ChartStateContext|DrawingContext)" components/technical-analysis/TechnicalAnalysis.tsx` returned no active matches.
- `rg "export \* from" components/technical-analysis/context` returned no active matches.
- `curl -I http://localhost:3000/equity/technical-analysis` returned `HTTP/1.1 200 OK`.
- Chromium headless loaded `/equity/technical-analysis` with exit code 0 and produced a non-blank 780x493 PNG; Chromium GCM authentication logs were unrelated browser-service noise.
