# PRD - Technical Analysis Style Backup Archive

Status: Closed - archived non-runtime folder
Date: 2026-06-05
Owner: Technical Analysis frontend
Scope: `components/technical-analysis/style_backup`

## 1. Deep Analysis Verdict

`components/technical-analysis/style_backup` is not a runtime domain. It is a
local archive containing historical CSS/SCSS snapshots from the Technical
Analysis route style migration.

The correct closure is explicit archive classification, not a structural split
and not a compatibility shim. The runtime source of truth remains
`styles/pages/_technical-analysis-final.scss`, which is loaded by
`styles/globals.scss`.

## 2. Inventory

| File | Role | Runtime Consumers | Decision |
| --- | --- | --- | --- |
| `style.module.css.OLD` | Historical CSS module snapshot | None | Keep archived until an explicit purge is requested |
| `Base-Old-Project_style.module.css` | Older project CSS snapshot | None | Keep archived until an explicit purge is requested |
| `_technical-analysis-final.scss.BACKUP` | Historical flat CSS/SCSS source snapshot referenced by the active SCSS comment | None | Keep archived; not canonical |
| `README.md` | Archive boundary contract | Maintainers | Keep as the no-runtime ownership marker |

## 3. Architecture Decision Gate

Decision: mark the folder as an archive and keep it outside all runtime import
graphs.

Rejected alternatives:

| Alternative | Rejection Reason |
| --- | --- |
| Add `style_backup/index.ts` | Would create an artificial entrypoint for non-code archival files |
| Import backup CSS into the route | Would reintroduce stale style behavior and create two styling sources of truth |
| Move the backups under `components/technical-analysis/docs` now | A move would be churn without runtime benefit and could confuse the active SCSS historical-source note |
| Delete the folder now | Deletion is an archive purge, not a Deep-Analyse closure; it needs explicit approval because the active SCSS still documents the historical snapshot |

## 4. Risk Model

- A maintainer can mistake the backup files for canonical route styles because
  their names look close to active module/style files.
- Copying backup rules back into the route can undo later layout, responsive,
  and reset-isolation fixes.
- Keeping the folder undocumented leaves a zombie-looking source tree even
  though there is no runtime import path.

## 5. Validation Evidence

- `rg --files components/technical-analysis/style_backup` returned exactly the
  three historical style snapshots plus this archive marker.
- `rg` for `style_backup`, `style.module.css.OLD`,
  `Base-Old-Project_style.module.css`, and
  `_technical-analysis-final.scss.BACKUP` across active `components`, `app`,
  and `styles` found no runtime import. The only active reference is a source
  note in `styles/pages/_technical-analysis-final.scss`.
- `styles/globals.scss` loads `pages/technical-analysis-final`, not the backup
  folder.
- No `index.ts` or barrel exists in `style_backup`.

## 6. Completion Criteria

- The folder is documented as archive-only and non-runtime.
- Runtime styling continues to resolve through `styles/pages/_technical-analysis-final.scss`.
- No backup file is imported, re-exported, or used as a compatibility shim.
- Any future deletion is handled as a separate explicit archive-purge task.

## 7. Next Required Action

`components/technical-analysis/docs` is now classified separately. Leave
`components/technical-analysis/lib` for the final pass as requested.
