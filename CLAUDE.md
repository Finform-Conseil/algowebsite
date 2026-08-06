# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Package manager

This project uses **pnpm exclusively**. A `preinstall` guard aborts if invoked through npm. Use `pnpm install`, `pnpm dev`, `pnpm add <pkg>`. Node `>=18` (README targets 20.x).

## Common commands

```bash
pnpm dev                 # next dev — runs predev bootstrap generation + verification first
pnpm build               # next build — runs prebuild bootstrap generation + verification first
pnpm start               # next start (production)
pnpm lint                # eslint . --ext .js,.jsx,.ts,.tsx

# Bootstrap CSS scoping pipeline (see architecture below)
pnpm generate:technical-bootstrap
pnpm verify:technical-bootstrap
pnpm test:technical-bootstrap        # node --test scripts/tests/scope-bootstrap-css.test.mjs

# Test suites (plain node --test / node runners, no Jest/Vitest)
pnpm test                            # candlestick-patterns + alerts-rail + pine-editor
pnpm test:candlestick-patterns
pnpm test:technical-analysis-config
pnpm test:alerts-rail
pnpm test:pine-editor
pnpm test:brvm-logos
```

Run a single test file directly with the built-in Node test runner:

```bash
node --test path/to/file.test.cjs
node --test path/to/file.test.mjs
```

`tsc` type-checking uses `noEmit`; run `npx tsc --noEmit` to type-check without building. `strict` is on.

To fully reset caches when builds misbehave: `rm -rf .next/cache` (see `commandes.txt` for the fuller node_modules reset).

## High-level architecture

Next.js 16 App Router application (`quantum-ledger` / branded "AfriMarket") for African stock-market (BRVM) financial intelligence: quotes, indices, screeners, OPCVM funds, fixed income, news, and an advanced TradingView-style technical-analysis charting module. React 19, TypeScript strict, SCSS + scoped Bootstrap.

### Routing and i18n

- All user routes live under `app/[locale]/` with locales `en` (default) and `fr`, driven by `next-intl`. `proxy.ts` is the `next-intl` middleware (matcher excludes `api`, `_next`, static files). Translations in `messages/en.json` and `messages/fr.json`; config in `i18n/routing.ts` and `i18n/request.ts`.
- API routes live under `app/api/` (not localized): `auth` (NextAuth), `market-data/*` (BRVM scrapers/data routes), and `proxy`.
- `app/[locale]/layout.tsx` wraps everything in `SessionProviderWrapper` (NextAuth) + `NextIntlClientProvider` + `CurrencyInitializer` + `Navbar`.

### Layered core (`core/`)

The codebase follows a Clean-Architecture split. Two directory pairs coexist from an in-progress migration — check both before assuming a location:
- `core/domain/` — `entities/`, `enums/`, `repositories/`, `schemas/` (zod), `types/`.
- `core/data/` — TypeScript interfaces plus static/seed datasets (e.g. `brvm-securities.ts`, `brvm-logo-registry.ts`, screener configs, `TechnicalAnalysis.ts`).
- `core/infra/` and `core/infrastructure/` — Redux store (`store/`, `@reduxjs/toolkit` + `react-redux`), API layer, `auth/`, and `security/`. The app-level store provider is `core/infra/auth/sessionProvider` and `core/infra/store/StoreProvider.tsx`.
- `core/presentation/` and `core/presenter/` — presentation components and hooks.

Path alias `@/*` maps to the repo root (`tsconfig.json`).

### Market data

BRVM data comes from server-side scraping/fetching under `app/api/market-data/*` using `cheerio` (JSDOM was deliberately removed to avoid serverless OOM). `undici` is used for fetches, `@upstash/redis` for caching. Commercial symbol names are normalized to dataset symbols via a shared mapping before building dataset URLs (e.g. `SONATEL` → `SNTS`). Data flow for charts is daily OHLCV (CSV) stitched with a live BRVM snapshot when available — no intraday BRVM backend exists and none should be simulated.

### Technical Analysis module (`components/technical-analysis/`)

The most complex subsystem — a self-contained TradingView-style charting widget. Read `components/technical-analysis/TODO.md` (roadmap, resolved battles, technical debt) and `integration.md` (dependency/export contract) before non-trivial changes. Key internals:
- `TechnicalAnalysis.tsx` — entry component; state is decentralized into Redux + specialized hooks (`useDrawingManager`, `useFloatingToolbar`, `useAlertMonitor`, `useMarketData`, `useMasterRenderLoop`, `useEChartsRenderer`), not a god component.
- `store/` — dedicated Redux slice `technicalAnalysisSlice` (drawings, indicators, alerts, layout, compare series) with `reducers/`, `selectors.ts`, `policies/`, `templates/`.
- `config/` — indicator, drawing, layout, market, object-tree, and persistence configuration, each with `__tests__/`.
- Heavy indicator math (MACD, RSI, Bollinger, Ichimoku…) runs in `indicators.worker.ts` (Web Worker) to keep 60 FPS. Rendering uses `echarts` / `echarts-for-react`; drawing uses a dedicated RAF loop plus refs (zero-lag pattern, minimal setState).
- Rendering targets "financial proof": every displayed value (OHLCV, indicators, compare %) must be source-traceable and auditable. Treat displayed numbers as decision-grade — see the AXIOM sections in `TODO.md`.
- `docs/` is documentation-only (PRDs, gates) and is never imported by the app; do not add runtime code there.

### Styling and the Bootstrap scoping pipeline

SCSS is modular under `styles/` (`abstracts/`, `base/`, `components/`, `layout/`, `pages/`, entry `globals.scss`). Theming uses CSS variables (`--gp-*`, dark default). Bootstrap 5 is scoped so it cannot leak into the rest of the app: `scripts/generate-technical-analysis-bootstrap.mjs` rewrites `bootstrap.min.css` selectors under `:where(.technical-analysis-bootstrap-scope)` into `styles/generated/technical-analysis-bootstrap.generated.css`. This file is generated — never edit it by hand. The generator + verifier run automatically on `predev`/`prebuild`; if you change the scoping logic, update `scripts/lib/scope-bootstrap-css.mjs` and re-run generate + verify + `test:technical-bootstrap`.

## Testing conventions

Tests use the **Node built-in test runner** (`node --test`), not Jest/Vitest. Files are colocated in `__tests__/` folders next to the code they cover, named `*.test.cjs` or `*.test.mjs`. There is no single aggregate `pnpm test` that runs everything — the `test` script runs a curated subset; invoke the individual `test:*` scripts or `node --test <file>` for targeted runs.

## Environment

`.env` holds `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_HOST`, `ALLOWED_ORIGINS_PROXY`, and Upstash Redis credentials. NextAuth (`next-auth` v4) handles auth via `app/api/auth`. Deployment config in `netlify.toml` and `next.config.js` (`optimizePackageImports` for phosphor/framer-motion/lucide; `browserToTerminal` logging enabled).

## Agent tooling note

This repo carries an `.agent/` workflow (AGENT-SCRIBE-GRAPHIFY / TENOR) with its own MCP orchestration described in `AGENTS.md`, and a graphify knowledge graph convention in `GEMINI.md`. Those systems are optional and independent of Claude Code; `.agent/` changes are out of scope for normal product commits unless explicitly requested. Default commit/push scope is the product source, and `.agent/state/outputs/` should stay out of commits.
