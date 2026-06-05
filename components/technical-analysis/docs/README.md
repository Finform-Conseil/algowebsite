# Technical Analysis Documentation

Status: documentation-only, non-runtime.

This folder stores Technical Analysis PRDs, architecture gates, validation
evidence, and deferred-risk notes. It is not imported by the application.

Canonical runtime sources remain in their owning folders:

- `components/technical-analysis/components`
- `components/technical-analysis/config`
- `components/technical-analysis/context`
- `components/technical-analysis/hooks`
- `components/technical-analysis/store`
- `components/technical-analysis/utils`
- `styles/pages/_technical-analysis-final.scss`

Rules:

- Do not add runtime code, barrels, adapters, or `index.ts` files here.
- Treat the top `Status:` line in each PRD as the current status.
- Treat older phase sections inside a PRD as history unless a later status says
  they are still active.
- Keep `components/technical-analysis/lib` for the final Deep-Analyse pass.
- Add new PRDs under `docs/prd/` with a clear owner, scope, decision gate, and
  validation evidence.
