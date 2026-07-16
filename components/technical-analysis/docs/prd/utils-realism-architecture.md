# PRD - Technical Analysis Utils Realism And Architecture

Status: Implemented - BRVM market session contract covered
Date: 2026-06-05
Owner: Technical Analysis frontend
Scope: `components/technical-analysis/utils`

## 1. Deep Analysis Verdict

`components/technical-analysis/utils` is a single-file utility folder. It does not need a domain split, a root barrel, or a compatibility adapter. Its only active owner file is `brvmMarketSession.ts`, which is a shared clock/session contract for the footer, sidebar, and price-axis countdown.

The right closure is therefore contract coverage and ownership documentation, not structural refactoring.

## 2. Inventory

| File | Role | Consumers | Decision |
| --- | --- | --- | --- |
| `brvmMarketSession.ts` | BRVM session status, display clocks, timeframe countdown labels | `TechnicalAnalysis.tsx`, `TechnicalAnalysisFooter.tsx`, `TechnicalAnalysisSidebarContent.tsx`, `useSidebarMarketClock.ts` | Keep as canonical leaf utility |
| `__tests__/brvmMarketSession.test.cjs` | Node contract tests for session boundaries, countdown labels, UTC/display clock separation | Node test runner | Keep beside the utility |

## 3. Architecture Decision Gate

Decision: keep `brvmMarketSession.ts` as a single canonical leaf module.

Rejected alternatives:

| Alternative | Rejection Reason |
| --- | --- |
| Add `utils/index.ts` | Would create a barrel for one file and repeat the zombie-index failure mode |
| Move the utility into footer | Sidebar and price-axis countdown also consume it |
| Move the utility into config | The file computes runtime clock state; it is not static configuration |
| Split parse/countdown/format helpers now | The file is under the local budget and has one cohesive responsibility |

## 4. Risk Model

- Footer status can show the wrong open/closed state if UTC session boundaries drift.
- Sidebar and footer can disagree if display GMT+1 formatting and exchange UTC formatting are conflated.
- Price-axis countdown can mislead users if daily and intraday timeframe boundaries are not tested.

## 5. Validation Evidence

- Added `components/technical-analysis/utils/__tests__/brvmMarketSession.test.cjs`.
- The test covers weekday open/close, weekend close, daily opening countdown, intraday candle countdown, daily close countdown, and UTC vs GMT+1 display formatting.
- No `utils/index.ts` was created.
- `node --test components/technical-analysis/utils/__tests__/brvmMarketSession.test.cjs` passed with 3/3 tests.
- `npx eslint components/technical-analysis/utils/brvmMarketSession.ts components/technical-analysis/utils/__tests__/brvmMarketSession.test.cjs components/technical-analysis/components/footer/TechnicalAnalysisFooter.tsx components/technical-analysis/components/sidebar/hooks/useSidebarMarketClock.ts` passed.
- `./node_modules/.bin/tsc --noEmit --pretty false` passed.

## 6. Completion Criteria

- `brvmMarketSession.ts` remains the canonical source for BRVM session labels and display clocks.
- No barrel or root adapter exists in `utils`.
- The utility has direct contract tests before any future session-hour or display-time changes.

## 7. Next Required Action

Leave `lib` for last as requested. If another small untreated folder remains before `lib`, audit it with the same PRD-first/no-barrel discipline.
