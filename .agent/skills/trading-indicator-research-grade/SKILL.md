---
name: trading-indicator-research-grade
description: Use when upgrading, auditing, fixing, or redesigning a technical-analysis indicator so it reaches professional trading-terminal quality. Triggers on TradingView-grade, GoCharting-grade, professional indicator rendering, amateur trading signal UI, BRVM/African capital-market context, candlestick patterns, overlays, oscillators, alerts, tooltips, label collisions, ECharts chart rendering, and any request to make an implemented indicator credible for experienced traders.
---

# Trading Indicator Research Grade

This skill turns an implemented trading indicator from local/amateur UI into professional, research-grounded chart behavior. It is mandatory before changing indicator rendering, signal validation, label placement, tooltips, alerts, or market-specific indicator assumptions.

## Non-Negotiable Rule

Do not code first.

Before editing an indicator, perform external research and local causal review. The agent must confront the local implementation against professional terminals and the target market reality.

## Required Inputs

Identify these before coding:

- Indicator name and family: candlestick pattern, price overlay, oscillator, volume, support/resistance, volatility, trend, breadth, custom signal.
- Current failure mode: false signal, visual clutter, label collision, weak tooltip, missing alert, bad threshold, misleading status text, poor mobile behavior, or weak market fit.
- Target market context: BRVM/Africa by default unless the user says otherwise.
- User-facing expectation: experienced traders must not feel a professionalism gap versus major terminals.

## Phase 1 - External Deep Research

Use internet research before code when network tools are available. Prefer official documentation, product help pages, screenshots, release notes, and reputable trading education pages. Use search only as discovery; cite sources used in the final response.

Research at least:

1. TradingView behavior or documentation for the indicator family.
2. GoCharting behavior or documentation for comparable chart tools.
3. One independent trading/domain source explaining the indicator logic, false positives, confirmation needs, or market interpretation.
4. African/BRVM market context when relevant: liquidity, stale candles, sparse sessions, spread sensitivity, delayed data, corporate actions, auction/session constraints.

If a referenced live terminal page is inaccessible, state that plainly and use accessible official docs/help pages plus screenshots supplied by the user. Do not pretend to have seen inaccessible UI.

## Phase 2 - Professional Benchmark Matrix

Create a short matrix before editing:

| Dimension | Local current | Professional target | Required change |
|:--|:--|:--|:--|
| Signal validity | | | |
| Visual density | | | |
| Label/collision handling | | | |
| Tooltip/domain explanation | | | |
| Alert/actionability | | | |
| BRVM/Africa market fit | | | |
| Mobile/viewport behavior | | | |

The target must be behavior-level, not a visual copy. Never clone proprietary UI. Match professional standards: clarity, rarity, justification, actionability, and non-polluting overlays.

## Phase 3 - Local Architecture Review

Before editing:

- Read `graphify-out/GRAPH_REPORT.md` if present.
- Use `graphify query` for the indicator, chart renderer, alert flow, and affected config.
- Read SCRIBE context with `.agent/workflow/scribe/scribe-rag context`.
- For Next.js work, read the relevant `node_modules/next/dist/docs/` page.
- Locate indicator calculation, presentation config, ECharts series construction, tooltip policy, alert/modals contract, and tests.

Do not read many raw files blindly when Graphify can narrow the surface.

## Phase 4 - Indicator Hardening Checklist

For every indicator upgrade, verify and fix as applicable:

- **Signal logic**: thresholds are defensible; weak/ambiguous detections are filtered or visually downgraded.
- **False positives**: require confirmation, relative magnitude, trend/volume context, or quality score when domain-appropriate.
- **Market data quality**: handle missing OHLC, zero range, stale bars, low liquidity, corporate-action anomalies, and sparse BRVM sessions.
- **Priority conflicts**: stronger patterns suppress weaker overlapping ones.
- **Visual density**: cap markers, enforce min bar gap, avoid high-frequency label spam.
- **Collision policy**: no label outside chart bounds; hide or shift only when professionally readable.
- **Tooltip**: explain why the signal exists using domain metrics, not generic text.
- **Alertability**: if an alert API exists, click/command should prefill a real alert. If not, expose an honest next-step affordance, not a fake control.
- **Legend/object tree**: names must be trader-readable and consistent.
- **Accessibility/mobile**: labels remain readable and do not occlude price action on small viewports.

## Phase 5 - Design Rules

- Prefer compact labels, restrained color, and semantic positioning over decorative shapes.
- Never show a text status line as a substitute for real chart evidence.
- Avoid indicators that fire everywhere. Professionals trust sparse, justified signals.
- Tooltips should answer: What happened? Why is it valid? What price/action matters?
- An alert-ready signal should map to an explicit condition such as `GREATER_THAN`, `LESS_THAN`, cross above, cross below, or range break.
- If the indicator is unreliable in illiquid African markets, say so in the UI or filter it.

## Phase 6 - Validation Gate

Before final response, run the strongest feasible local gate:

- Targeted ESLint for edited files.
- `./node_modules/.bin/tsc --noEmit` when TypeScript is touched.
- Relevant unit/config tests.
- `git diff --check`.
- `npm run lint -- components/technical-analysis` for broad chart work.
- Local route check with `curl -I` when the dev server is running.
- Browser/screenshot verification when available for visual changes. If unavailable, say so plainly.

## Final Response Requirements

Report in French:

- Sources consulted for external research.
- Professional benchmark verdict: acceptable, still amateur, or dangerous.
- What changed in code and why.
- What remains below TradingView/GoCharting-level, if anything.
- Validation commands and results.
- Files touched.

Do not claim TradingView/GoCharting parity unless tooltips, alerts/actionability, collision handling, data-quality behavior, and visual density were all addressed.
