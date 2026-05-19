# Technical Analysis Agent Doctrine

This folder is not a playground UI. It renders market data, prices, indicators, comparison percentages, broker-like actions, alerts, and visual signals that can influence real financial decisions.

Every future LLM or engineer working in `components/technical-analysis` must treat the interface as a financial proof surface:

- A displayed number must be traceable to its source data: symbol, date/time, open, high, low, close, volume, currency, and transformation.
- A plotted line must be explainable by formula and reproducible from the raw data.
- Compare mode must expose the base date, base close, current close, aligned date, formula, and calculated percentage.
- Missing, stale, illiquid, split/unadjusted, zero, malformed, or non-aligned data must be shown as a warning, not hidden behind a smooth curve.
- Visual polish must never outrank truth, provenance, and auditability.
- Do not invent local catalogues, color systems, mappings, financial formulas, or data normalizers when a shared source already exists.
- If a value cannot be proven, label it as unverified or refuse to render it as authoritative.
- Always check for and use dynamic async API calls to the real `/api/market-data/` endpoints instead of using or fabricating local simulation data.

Before changing any chart, compare, indicator, alert, data window, broker, or market-data code, ask first:

> Can a user put money behind this value, and can we prove it is true?

If the answer is not clearly yes, the work is incomplete.
