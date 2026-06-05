# PRD - Technical Analysis Header Realism Contracts

Status: Implemented - dormant surface classified, no runtime change required
Date: 2026-06-04
Owner: Technical Analysis frontend
Scope: `components/technical-analysis/components/header`

## 1. Deep Analysis Verdict

The `header` folder currently contains a single client component,
`ChartHeader.tsx`. It is not imported by the active Technical Analysis route.
Graphify exposes it as an isolated node, and the current import search finds no
runtime consumer outside the file itself.

The realistic action is not to mount the header again. The active route already
uses the top navigation, ticker tape, horizontal toolbar, chart body, sidebar,
and footer. Reintroducing this header would duplicate market identity, price,
news, and action controls without a proven layout budget.

## 2. Current Surface

| File | Runtime Status | Risk | Decision |
| --- | --- | --- | --- |
| `ChartHeader.tsx` | Dormant / not rendered by active TA route | Looks like a real header contract but contains old action labels and would duplicate visible TA controls if remounted | Keep dormant until a dedicated route-level header PRD proves why it must return |

## 3. Realism Issues

1. The component exposes actions labeled `Analyze`, `Convert`, `Alert`, and
   `Trade`, but the current file does not receive action handlers.
2. It renders `NewsSection` and `CommonTickerPanel`, which would duplicate
   sidebar/news/toolbar surfaces already present on the page.
3. It depends on Redux UI zen mode, so it is a client component and should not
   be treated as a passive presentational fragment.
4. It is still referenced by the BRVM logo anti-regression test, which means the
   file remains part of the logo-surface audit even while it is dormant.

## 4. Contract

The header folder is classified as dormant Technical Analysis UI.

Future work must follow these rules:

1. Do not import `ChartHeader` into `TechnicalAnalysis.tsx` as a quick visual
   patch.
2. If the header returns, every visible action must be connected to a real
   workflow or removed.
3. If the header returns, price, volume, logo, news, and currency must use the
   same provenance rules as sidebar/toolbar market surfaces.
4. If the header returns, run a real-browser layout validation across desktop
   and mobile before considering it done.
5. If the header is deleted later, update the logo-surface test intentionally in
   the same change.

## 5. Acceptance

- `ChartHeader.tsx` remains unmounted by the active TA route.
- No runtime header is added to the page.
- The existing logo-surface guard remains intact.
- Toolbar validation remains green after this classification.
- TypeScript and targeted lint stay green.

## 6. Validation Evidence

- Graphify query located `ChartHeader.tsx` as an isolated node.
- Runtime import search found no active `ChartHeader` consumer.
- Chrome real-page toolbar validation: 42 visible toolbar nodes, 0 out of
  viewport.
- Chrome real-page root validation: document/body `scrollHeight` equals
  `clientHeight`, TA root bounded with `overflow-y: hidden`.

## 7. Rollback

Rollback snapshot:

```text
_Rollback/header-realism-contracts-20260604-162425/
```

Restore the saved files only if this PRD classification is rejected.
