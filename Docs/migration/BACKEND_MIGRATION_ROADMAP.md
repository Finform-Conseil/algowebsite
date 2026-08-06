# ROADMAP — Migration `technical-analysis` vers le backend Django `Algo DataBase API v1`

> **Statut :** Roadmap opérationnelle. Établie STRICTEMENT à partir du schéma
> OpenAPI réel du backend (`swagger.json`, 205 endpoints, 96 modèles) et alignée
> sur `Docs/ARCHITECTURE_DATA_FLOW.md` (pattern 7-fichiers Clean/Hexagonal).
> **Backend inspecté en direct** via Chrome DevTools (CDP :9222, onglet Swagger déjà ouvert).

---

## 0. Faits établis (source de vérité)

| Élément | Valeur |
| --- | --- |
| Titre | `Algo DataBase API` |
| Version | `v1` (OpenAPI 2.0 / drf-yasg) |
| Base path | `/api/v1` |
| Base URL prod | `http://a21mldhl1xhs0dumr7kfo1fg.85.190.99.121.sslip.io/api/v1` |
| Endpoints | **205** répartis en **35 groupes** de ressources |
| Modèles | **96** définitions |
| Pagination | DRF standard : `{ count, next, previous, results[] }` |
| Slash final | **OBLIGATOIRE** partout (`APPEND_SLASH=True`) — confirme le fix `.api.ts` |
| Auth | Bearer token (déjà géré par `base.api.ts` `prepareHeaders`) |

---

## 1. LA DÉCOUVERTE DÉCISIVE pour `technical-analysis`

Le backend fournit **tout le calcul d'analyse technique côté serveur**, déjà agrégé
dans un seul modèle : `ActionDetails`. Cet objet embarque en imbriqué :

- `latest_price_metric` → **`EquityLatestPriceMetric`** (~55 champs : prix, 52w,
  perf 1d→20y, total return, CAGR, ATH/ATL, volumes moyens…)
- `latest_technical_indicator` → **`EquityLatestTechnicalIndicator`** (~230 champs :
  SMA/EMA/WMA/DEMA/TEMA/HMA, MACD, Ichimoku, ADX, RSI/Stoch/CCI/MFI, Bollinger,
  Keltner, Donchian, ATR, OBV, VWAP, pivots standard+fibonacci, **60+ patterns
  chandeliers booléens**, golden/death cross, breakouts…)
- `latest_valuation_ratio` → **`EquityLatestValuationRatio`** (~150 champs :
  market cap, PE/PS/PB/PEG, EV/*, marges, ROE/ROA/ROIC, croissances,
  Piotroski, Altman-Z, Graham, Lynch, beta/sharpe/sortino…)

### Conséquence directe

`components/technical-analysis` n'a **plus besoin** du scraping BRVM
(`app/api/market-data` + `resilient-scraper`). **Une seule requête**
`GET /api/v1/actions/{id}/` (ou `/actions/?ticker=...`) renvoie l'intégralité des
indicateurs. → C'est le déclencheur qui permet de basculer `app/api/market-data`
en `_Old`.

### Endpoint moteur (screener)

`GET /api/v1/actions/` retourne des `ActionDetails` paginés avec **1534 query-params**
de filtrage (lookups Django `__gte/__lte/__gt/__lt/__icontains` sur tous les champs
imbriqués) + `search`, `ordering`, `page`, `page_size`. → screener 100% server-side.

---

## 2. Vague 1 — CŒUR technical-analysis (PRIORITÉ ABSOLUE)

Migrer d'abord ce qui alimente directement la page. 7 fichiers par entité
(cf. §0 de `ARCHITECTURE_DATA_FLOW.md`), recopiés de la tranche `country`/`sector`.

### 2.1 Entité `action` (pivot de la page)

Endpoints backend :

- `GET|... /actions/` — GET, POST
- `GET|... /actions/bulk-import/` — POST
- `GET|... /actions/ordering-fields/` — GET
- `GET|... /actions/ticker/` — GET
- `GET|... /actions/{id}/` — GET, PUT, PATCH, DELETE
- `GET|... /actions/{id}/restore/` — POST

Modèles à porter en `core/domain/` :

- `entities/action.entity.ts` → `Action`, `ActionShort`, **`ActionDetails`**
- `entities/equity-metric.entity.ts` → `EquityLatestPriceMetric`,
  `EquityLatestTechnicalIndicator`, `EquityLatestValuationRatio` (imbriqués dans `ActionDetails`)
- `schemas/action.schema.ts` (Zod) + `types/action.type.ts` (`z.infer`)
- `repositories/action.repository.ts` → port `IActionRepository`
  (`getAllActions` LAZY, `getActionById` via `skipToken`, `getActionByTicker`)
- `infra/store/api/action.api.ts` (slash final partout) + barrel + `.repository.impl.ts`
- `tagTypes`: ajouter `'Actions'` dans `base.api.ts` (déjà présent — à réutiliser)

### 2.2 Entité `cours` (séries OHLCV pour les graphiques bougies)

Endpoints backend :

- `GET|... /cours/` — GET, POST
- `GET|... /cours/bulk-import/` — POST
- `GET|... /cours/{id}/` — GET, PUT, PATCH, DELETE

- `Cours` / `CoursDetails` : OHLC + volume + `timeframe` (enum secondes :
  60/300/900/1800/3600/14400/86400/604800/2592000) + `timestamp`.
- C'est la source des chandeliers/série temporelle du graphe TA.

### 2.3 Entité `society` (fiche émetteur affichée sur la page)

- `GET|... /societies/` — GET, POST
- `GET|... /societies/bulk-import/` — POST
- `GET|... /societies/parents/` — GET
- `GET|... /societies/subsidiaires/{parent_id}/` — GET
- `GET|... /societies/{id}/` — GET, PUT, PATCH, DELETE

- `Society` / `SocietyDetails` / `SocietyShort` (secteur, industrie, pays imbriqués).

### 2.4 Entités de contexte (indices comparatifs + secteurs)

- `indices` (9 endpoints) → `Indice`, `IndiceDetails`, `IndiceCours`
- `sectors` (3 endpoints) → `Sector`, `SectorShort`

**Definition of Done Vague 1 :** page `technical-analysis` rendue à 100% depuis
`core/` + backend, `app/api/market-data` renommé `_Old` (jamais supprimé d'emblée),
`pnpm exec tsc --noEmit` propre.

---

## 3. Vague 2 — Référentiels & marché (déjà partiellement présents)

`bourses`, `countries`, `currencies`, `industries`, `activities`, `instruments`,
`sgis`/`sgos`, `dividends`, `actionnariats`, `events`, `results`, `result-metrics`.
Beaucoup ont déjà leur tranche `.api.ts` — vérifier conformité slash + `ActionDetails`.

---

## 4. Vague 3 — Modules riches (post-TA)

- `opcvms` (6) + `opcvm-metrics` (5) → carte OPCVM déjà amorcée.
- `fixed-income` (**17** : `BondSecurity`, `BondCashflow`, `Secondary`, `Issuer`,
  `BondIssueLot`) → screener obligataire (page `fixed-income` déjà présente).
- `macro` (**40** endpoints !) → séries macro sectorielles (`Sector*Item/Value`).
- `financial-statements` / `financial-items` / `financial-values` / `sheets` /
  `periods` / `templates` / `pages` → états financiers.
- `documents` (7), `files` (2), `notifications` (2), `rates` (5), `cours-imports` (7).

---

## 5. Vague 4 — Auth & users (transverse)

`users` (13 : Login, Register, TokenRefresh, ChangePassword, ResetPassword,
ChangeEmail, ValidateUID…) → aligner sur `base.api.ts` reauth (route
`/auth/refresh-token/` déjà câblée).

---

## 6. Discipline de migration (rappel ARCHITECTURE_DATA_FLOW)

1. Interfaces `core/domain/` écrites STRICTEMENT d'après le schéma (aucun champ inventé).
2. `.api.ts` : `injectEndpoints`, `overrideExisting:true`, **slash final systématique**.
3. Page passe TOUJOURS par `use{X}Repository` (jamais `.api.ts` direct).
4. Transformation UI dans `lib/utils/*`, pas dans domain/repository.
5. Legacy → suffixe `_Old` (jamais delete immédiat).
6. `pnpm exec tsc --noEmit` vert à chaque entité.

[

PHASE 2 terminée. Le hub useMarketData est réécrit — zéro fetch local, source unique = API via repositories core/, champs null préservés, contrat de sortie inchangé. Le mode mock est supprimé (conformité AGENTS REAL API - NO SIMULATION.md), toute la mécanique SRE (race guards, lifecycle, polling visibility-aware, replay) est préservée.

Maintenant PHASE 3 : vérification de déconnexion — je m'assure qu'AUCUN appel /api/market-data ou /api/proxy/9/...CSV ne subsiste dans components/technical-analysis.

  Ran 1 shell command

La vérification révèle d'autres consommateurs locaux que le hub ne couvrait pas — c'est exactement le genre de dette cachée qu'un patch noyau doit traquer jusqu'au bout. Il reste 3 zones :

1. components/sidebar/data/sidebarFetchers.ts → brvm-fundamentals, indices, brvm-news, brvm-bonds
2. components/sidebar/panels/alertsRail/alertsRailLiveContexts.ts → brvm-live?ticker=ALL
3. hooks/MarketData/marketData.fetchers.ts → GitHub CSV (déjà orphelin mais à neutraliser)

Je cartographie ces consommateurs et leurs contrats de données pour les migrer vers l'API. Je lis les fetchers sidebar en priorité.

  Read 1 file

Ces 4 fetchers sidebar consomment 4 routes locales, avec des contrats de sortie précis :

- fundamentals → BRVMFundamentals (mappable sur ActionDetails.latest_valuation_ratio)
- indices → Record<string, BRVMIndexData> (mappable sur API indices + IndiceCours)
- news → BRVMNewsItem[] (pas d'équivalent API — backend n'a pas d'endpoint news)
- bonds → BRVMBond[] (mappable sur API fixed-income)

Je dois vérifier ce que l'API oérer le cas news (pas de sourceAPI). Je consulte le schéma pour ces 3 domaines et je regarde les autres consommateurs
(alertsRail).

  Ran 1 shell command

Je continue l'analyse des consoAPI n'a pas d'endpoint news —c'est un trou de couverture. Options :

1. Supprimer la fonctionnalité news (dégradation acceptable si peu utilisée).
2. Garder le scraping BRVM newsiée : pas d'alternative API).
3. Retourner un état vide (UI graceful degradation).

Décision validée : news = seule exception scraping conservée (pas d'alternative API). Tout le reste (fundamentals, indices, bonds, live alerts, OHLCV) → API.

]
