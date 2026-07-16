# Technical Analysis Style Backup Archive

Status: archived, non-runtime.

This folder contains historical style snapshots from the Technical Analysis
route migration. These files are not imported by the application and must not
be treated as canonical styling sources.

Canonical runtime style entry:

- `styles/pages/_technical-analysis-final.scss`, loaded by `styles/globals.scss`

Rules:

- Do not import files from this folder.
- Do not add an `index.ts`, barrel, adapter, or compatibility entrypoint here.
- Do not copy rules back into runtime styles without a dedicated visual PRD and
  Sass/browser validation.
- Delete this archive only through an explicit archive-purge task, because the
  active SCSS still documents the historical source snapshot.
