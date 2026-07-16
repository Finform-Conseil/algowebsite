# PRD - Technical Analysis Documentation Governance

Status: Closed - documentation surface classified
Date: 2026-06-05
Owner: Technical Analysis frontend
Scope: `components/technical-analysis/docs`

## 1. Deep Analysis Verdict

`components/technical-analysis/docs` is a governance surface, not an execution
surface. It contains PRDs and architecture evidence for Technical Analysis
folders already audited or currently deferred.

The correct closure is to document how PRD status is interpreted and to keep
the folder outside runtime imports. There is no refactor, extraction, barrel,
or test target to create for this folder.

## 2. Inventory

| Area | Role | Runtime Consumers | Decision |
| --- | --- | --- | --- |
| `README.md` | Documentation boundary and PRD interpretation rules | Maintainers | Keep as folder entry contract |
| `prd/*.md` | PRDs, architecture gates, validation evidence, deferred decisions | None | Keep as documentation records |

Current PRD coverage includes config, context, hooks, store, utils,
style_backup, common, chart, footer, header, layout, market, modals, overlays,
panels, sidebar, toolbar, vertical drawing toolbar, and documentation
governance surfaces.

## 3. Architecture Decision Gate

Decision: keep `docs` as documentation-only and make the PRD status rules
explicit.

Rejected alternatives:

| Alternative | Rejection Reason |
| --- | --- |
| Add `docs/index.ts` | Would create a fake runtime entrypoint for Markdown |
| Move PRDs into runtime folders | Would scatter governance evidence and make folder completion harder to audit |
| Delete historical PRD sections | Historical phase notes explain why old approaches were rejected or superseded |
| Treat every inner `Status:` as current | Inner phase statuses are local history; the top file status and latest closure notes are authoritative |

## 4. Risk Model

- Future agents can reopen already-closed work if they read an old inner phase
  status without the latest file-level status.
- A PRD can become a zombie document if it does not name owner, scope, decision,
  validation, and next action.
- Documentation folders can accidentally become runtime surfaces if imports or
  index files are added.

## 5. Validation Evidence

- `rg --files components/technical-analysis/docs` returned only Markdown PRD
  files plus this documentation root.
- Active `components`, `app`, and `styles` searches found no runtime import of
  `components/technical-analysis/docs`.
- No `index.ts`, `index.tsx`, `index.js`, or `index.md` exists under `docs`.
- The remaining non-runtime sequence is now closed before `lib`.

## 6. Completion Criteria

- `docs` is documented as a non-runtime governance folder.
- PRD interpretation rules are explicit at the folder root.
- No runtime import, index, barrel, or compatibility shim exists in `docs`.
- `lib` remains the final Technical Analysis folder to audit.

## 7. Next Required Action

Stop before `components/technical-analysis/lib` unless the user explicitly
starts the final lib pass.
