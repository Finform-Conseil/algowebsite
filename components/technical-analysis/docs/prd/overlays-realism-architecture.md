# PRD - Technical Analysis Overlays Realism And Architecture

Status: Implemented - Deep-Analysis closed
Date: 2026-06-04
Owner: Technical Analysis frontend
Scope: `components/technical-analysis/components/overlays`

PRD required? yes
Reason: The overlays folder controls price-axis rendering, cursor actions, alert/order entry points, and pointer-event boundaries.
Architecture risk: high for runtime edits
Rollback tier: full

## 2. Problem Statement

The overlays folder has not received a dedicated Deep-Analysis pass. It is small,
but it sits on top of the chart interaction layer and exposes price actions that
can affect alerts, orders, horizontal lines, and cursor behavior.

Today the folder is indirectly covered by common-ui validation, but no PRD owns
its contracts directly. That leaves future work vulnerable to treating
`PriceAxisOverlay` as a cosmetic layer while it is actually part of the chart
interaction and price provenance surface.

If this work is not done, future agents can break pointer-event isolation,
stale price labels, action menu positioning, keyboard semantics, or BRVM price
truth while believing they only changed visual markup.

## 3. Current Inventory

| File or Area | Current Role | Issue | Target Direction |
| --- | --- | --- | --- |
| `components/technical-analysis/components/overlays/PriceAxisOverlay.tsx` | Renders last-price badge, cursor-price badge, cursor action trigger, and price action menu | No dedicated PRD; dense inline styles; action menu semantics and selector contracts need proof | Keep as canonical overlay surface, document contracts, harden semantics without changing chart layering |
| `components/technical-analysis/hooks/usePriceAxisMenu.ts` | Owns menu positioning, outside click, Escape close, and resize handling | Uses overlay class names as behavioral selectors | Treat as overlay dependency during implementation |
| `components/technical-analysis/hooks/useChartViewport.ts` | Protects viewport interactions from price-axis action clicks | Contains price-axis selector checks that must remain aligned with overlay class names | Include in validation and selector drift checks |
| `styles/pages/_technical-analysis-final.scss` | Styles price-axis menu portal/items | Styling lives outside overlay folder | Keep shared SCSS touched only when visual contract requires it |
| `components/technical-analysis/TechnicalAnalysis.tsx` | Connects overlay to refs, symbol, labels, menu state, and action handlers | Direct consumer and data source | Preserve prop contract and price action behavior |

### 3.1 Local Rollback Snapshot

Rollback snapshot created before runtime hardening:

```text
_Rollback/overlays-realism-architecture-20260604-184016/
  MANIFEST.md
  components/technical-analysis/components/overlays/PriceAxisOverlay.tsx
  components/technical-analysis/hooks/usePriceAxisMenu.ts
  components/technical-analysis/hooks/useChartViewport.ts
  components/technical-analysis/TechnicalAnalysis.tsx
  styles/pages/_technical-analysis-final.scss
  components/technical-analysis/docs/prd/overlays-realism-architecture.md
```

Baseline validation:

- `npx eslint components/technical-analysis/components/overlays/PriceAxisOverlay.tsx components/technical-analysis/hooks/usePriceAxisMenu.ts components/technical-analysis/hooks/useChartViewport.ts`: PASS
- `./node_modules/.bin/tsc --noEmit --pretty false`: PASS
- `git diff --check -- components/technical-analysis/components/overlays/PriceAxisOverlay.tsx components/technical-analysis/hooks/usePriceAxisMenu.ts components/technical-analysis/hooks/useChartViewport.ts components/technical-analysis/TechnicalAnalysis.tsx styles/pages/_technical-analysis-final.scss components/technical-analysis/docs/prd/overlays-realism-architecture.md _Rollback/overlays-realism-architecture-20260604-184016/MANIFEST.md`: PASS

## 4. Goals

- Give `overlays` a dedicated PRD owner.
- Preserve price-axis badge, cursor badge, and action menu behavior.
- Prove class-name selector contracts used by viewport/menu hooks.
- Keep pointer-event layering explicit and testable.
- Avoid changing chart height, ECharts lifecycle, or market-data calculations.

## 5. Non-Goals

- Do not refactor chart rendering.
- Do not change alert/order business logic.
- Do not move `PriceAxisOverlay.tsx` unless a later PRD proves a new folder boundary.
- Do not restyle the whole price axis.
- Do not touch `panels/object-tree` in this PRD.

## 6. Target Structure

The canonical implementation remains:

```text
components/technical-analysis/components/overlays/
  PriceAxisOverlay.tsx
```

Supporting dependencies remain outside the folder:

```text
components/technical-analysis/hooks/usePriceAxisMenu.ts
components/technical-analysis/hooks/useChartViewport.ts
styles/pages/_technical-analysis-final.scss
```

No barrel file is planned.

## 7. Architecture Decision Gate

Decision: keep overlays as a small runtime folder, not a generic UI primitive
folder.

Reason: `PriceAxisOverlay` is chart-positioned and depends on chart refs,
pointer-events, price labels, and active menu state. Moving it to `common`
would hide domain contracts.

Rejected alternatives:

| Alternative | Rejection Reason |
| --- | --- |
| Move overlay primitives to `common` | The surface is chart-domain specific and not reusable safely outside TA chart layers |
| Fold overlay markup back into `TechnicalAnalysis.tsx` | Reintroduces shell bloat and hides interaction contracts |
| Treat action menu as a modal | It is anchored to cursor/axis coordinates, not a document-level dialog workflow |

## 8. Implementation Phases

### Phase 1 - Contract Audit

- Confirm all selectors used by `usePriceAxisMenu` and `useChartViewport`.
- Confirm accessible labels for last price and action trigger.
- Confirm menu open/close paths: click trigger, outside click, Escape, resize.
- Confirm no stale price/symbol mismatch under multi-chart selection.

### Phase 2 - Realism Hardening

- Replace fragile inline event blocks with named handlers if needed.
- Add missing ARIA or title contracts without changing visual layout.
- Keep `pointerEvents: "none"` on passive overlay container and `"auto"` only on actionable controls.
- Preserve current price-axis positioning.

### Phase 3 - Runtime Validation

- Smoke the TA page.
- Hover the chart price axis enough to expose the cursor action.
- Open and close the price-axis action menu.
- Trigger horizontal-line action only in a controlled smoke path if safe.
- Check console for runtime errors.

## 9. Validation Plan

- Static gates from section 3.1.
- Runtime smoke for `/equity/technical-analysis`.
- Selector drift check:
  - `rg "gp-price-axis-action-menu|gp-price-axis-menu-portal|gp-price-axis-cursor-action" components/technical-analysis/hooks components/technical-analysis/components/overlays`
- No chart lifecycle regression:
  - chart canvas remains non-empty after menu open/close.

## 10. Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Pointer-event layer steals chart interactions | Medium | High | Keep passive container non-interactive and action nodes explicit |
| Selector drift between overlay and hooks | Medium | Medium | Add rg validation before closure |
| Action menu opens at stale coordinates | Low | Medium | Keep positioning owned by `usePriceAxisMenu` |
| Last price label lies under currency/rate unavailable state | Medium | High | Preserve label provenance from `TechnicalAnalysis.tsx` |

## 11. Completion Criteria

- `overlays` has an implemented PRD.
- Runtime behavior is validated in browser or tooling limitation is documented.
- Selector drift checks pass.
- No chart height, viewport, or ECharts lifecycle changes are introduced.
- SCRIBE records why overlays was chosen before panels.

## 12. Phase 1 Contract Audit

Status: Completed on 2026-06-04.

Contract findings:

| Contract | Evidence | Verdict | Next Action |
| --- | --- | --- | --- |
| Overlay trigger ref | `ChartRefsProvider` owns `cursorPriceActionRef` as `HTMLButtonElement`; `PriceAxisOverlay` renders a `button type="button"` with that ref | Pass | Preserve |
| Cursor price data source | `useEChartsRenderer` writes `data-price` and `data-price-label` onto the cursor action button | Pass | Preserve |
| Action menu positioning | `usePriceAxisMenu` computes coordinates from `layersStackRef`, matching the positioned overlay ancestor | Pass | Preserve |
| Outside click guard | `usePriceAxisMenu` ignores `.gp-price-axis-action-menu`, `.gp-price-axis-menu-portal`, and `.gp-price-axis-cursor-action` | Pass with legacy selector | Normalize in Phase 2 |
| Viewport interaction guard | `useChartViewport` ignores `.gp-price-axis-action-menu` and `.gp-price-axis-cursor-action`, but not the rendered `.gp-price-axis-menu-portal` | Drift found | Add portal selector guard in Phase 2 |
| Accessible last price label | `TechnicalAnalysis.tsx` builds `lastPriceAccessibleLabel` from symbol, displayed price, BRVM countdown, and data freshness | Pass | Preserve |
| Action labels | `PriceAxisOverlay` maps each action to a label including symbol and price | Pass | Preserve |
| Keyboard shortcut parity | `TechnicalAnalysis.tsx` global shortcuts read the same cursor action dataset when available | Pass with duplicated action logic | Leave for later shell-level PRD unless Phase 2 touches shortcuts |

Phase 1 conclusion:

- No chart height, viewport math, or ECharts lifecycle edit is required for the audit.
- Phase 2 should harden selector drift first: define a shared predicate or constant for price-axis interactive targets, then apply it in `usePriceAxisMenu` and `useChartViewport`.
- Phase 2 must keep `.gp-price-axis-menu-portal` as the rendered menu class unless SCSS and hooks migrate together.



## 13. Phase 2 Realism Hardening

Status: Completed on 2026-06-05.

Implementation:

- Added `priceAxisInteractiveTargets.ts` as the single selector contract for price-axis interactive DOM targets.
- Applied the shared predicate in `usePriceAxisMenu` outside-click handling.
- Applied the same predicate in `useChartViewport` wheel, pointerdown, and double-click guards so `.gp-price-axis-menu-portal` no longer falls through to viewport interactions.
- Preserved `PriceAxisOverlay` rendered class names, chart height, viewport math, and ECharts lifecycle.

Validation:

- `npx eslint` on overlays/price-axis hooks: PASS.
- `tsc --noEmit --pretty false`: PASS.
- `git diff --check` on touched overlay/viewport files: PASS.
- Selector drift check: selectors are centralized in `priceAxisInteractiveTargets.ts` and rendered only by `PriceAxisOverlay.tsx`.
- Chrome DevTools smoke: price-axis menu opens, outside mousedown closes it, portal mousedown keeps it open, console has no errors.

## 14. Deep-Analysis Closure Gate

Status: Implemented on 2026-06-05.

Closure decision:

- `components/technical-analysis/components/overlays` has completed its dedicated Deep-Analysis pass.
- `PriceAxisOverlay.tsx` remains the canonical domain overlay surface. It is not promoted to `common` because its contracts are chart-positioned, price-aware, and selector-sensitive.
- Price-axis interactive target detection is centralized in `components/technical-analysis/hooks/priceAxisInteractiveTargets.ts` and consumed by both `usePriceAxisMenu.ts` and `useChartViewport.ts`.
- The rendered classes `.gp-price-axis-cursor-action` and `.gp-price-axis-menu-portal` stay stable because hooks and SCSS use them as behavior contracts.
- The cursor action trigger now has an explicit accessible name/title.
- No chart height, ECharts lifecycle, market-data, broker, order, or alert business logic was changed during closure.

Validation executed for this closure:

- `npx eslint components/technical-analysis/components/overlays/PriceAxisOverlay.tsx components/technical-analysis/hooks/usePriceAxisMenu.ts components/technical-analysis/hooks/useChartViewport.ts components/technical-analysis/hooks/priceAxisInteractiveTargets.ts`: PASS.
- `./node_modules/.bin/tsc --noEmit --pretty false`: PASS.
- `git diff --check -- components/technical-analysis/components/overlays/PriceAxisOverlay.tsx components/technical-analysis/hooks/usePriceAxisMenu.ts components/technical-analysis/hooks/useChartViewport.ts components/technical-analysis/hooks/priceAxisInteractiveTargets.ts components/technical-analysis/docs/prd/overlays-realism-architecture.md`: PASS.
- Selector drift check: PASS; selector ownership is centralized in `priceAxisInteractiveTargets.ts`, rendered by `PriceAxisOverlay.tsx`, and styled by `_technical-analysis-final.scss`.
- Chrome DevTools MCP smoke: PASS; `/equity/technical-analysis` rendered, primary chart canvas was non-blank, price-axis action menu opened, portal mousedown kept it open, `Escape` closed it, outside mousedown closed it, and the action trigger exposed `Open price actions for BOAB` as accessible name/title.
- Console proof: PASS for runtime errors; console contained Fast Refresh logs plus existing warnings for Next image quality and the smoke-script canvas readback.
- Screenshot: `/tmp/ta-overlays-panels-smoke.png`.

Next handoff:

- `components/technical-analysis/components/panels` is now the next Deep-Analysis surface. It starts with `ObjectTreePanel.tsx`, `useObjectTreePanel.ts`, and `config/object-tree/*`; it must not be treated as a cosmetic sidebar panel because it owns drawing controls, indicator visibility, comparison-symbol rows, and high-frequency Data Window DOM anchors.
