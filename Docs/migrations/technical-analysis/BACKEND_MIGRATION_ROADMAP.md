# ROADMAP — Migration `technical-analysis` vers le backend Django `Algo DataBase API v1`

> **Statut :** Roadmap opérationnelle. Établie STRICTEMENT à partir du schéma
> OpenAPI réel du backend (`swagger.json`, 205 endpoints, 96 modèles) et alignée
> sur `Docs/ARCHITECTURE_DATA_FLOW.md` (pattern 7-fichiers Clean/Hexagonal).
> **Route cible :** `/equity/technical-analysis`.

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
| Slash final | **OBLIGATOIRE** partout (`APPEND_SLASH=True`) |
| Auth | Bearer token (déjà géré par `base.api.ts` `prepareHeaders`) |

---

## 1. LA DÉCOUVERTE DÉCISIVE pour `technical-analysis`

Le backend fournit **tout le calcul d'analyse technique côté serveur**, déjà agrégé
 dans un seul modèle : `ActionDetails`. Cet objet embarque en imbriqué :

- `latest_price_metric` → **`EquityLatestPriceMetric`** (~55 champs)
- `latest_technical_indicator` → **`EquityLatestTechnicalIndicator`** (~230 champs)
- `latest_valuation_ratio` → **`EquityLatestValuationRatio`** (~150 champs)

### Conséquence directe

`components/technical-analysis` n'a **plus besoin** du scraping BRVM
(`app/api/market-data` + `resilient-scraper`). **Une seule requête**
`GET /api/v1/actions/{id}/` (ou `/actions/?ticker=...`) renvoie l'intégralité des
indicateurs. → C'est le déclencheur qui a permis de basculer `app/api/market-data`
en `_Old`.

### Endpoint moteur (screener)

`GET /api/v1/actions/` retourne des `ActionDetails` paginés avec **1534 query-params**
de filtrage (lookups Django `__gte/__lte/__gt/__lt/__icontains`) + `search`,
`ordering`, `page`, `page_size`. → screener 100% server-side.

---

## 2. Vague 1 — CŒUR technical-analysis (PRIORITÉ ABSOLUE)

### 2.1 Entité `action` (pivot de la page)

Endpoints : `/actions/` (GET, POST), `/actions/bulk-import/` (POST),
`/actions/ordering-fields/` (GET), `/actions/ticker/` (GET),
`/actions/{id}/` (GET, PUT, PATCH, DELETE), `/actions/{id}/restore/` (POST).

Modèles portés en `core/domain/` : `Action`, `ActionShort`, **`ActionDetails`**,
`EquityLatestPriceMetric`, `EquityLatestTechnicalIndicator`,
`EquityLatestValuationRatio` ; schéma Zod + types `z.infer` ; port
`IActionRepository` (`getAllActions` LAZY, `getActionById` via `skipToken`,
`getActionByTicker`) ; tranche `action.api.ts` (slash final) + impl.

### 2.2 Entité `cours` (séries OHLCV)

Endpoints : `/cours/` (GET, POST), `/cours/bulk-import/` (POST),
`/cours/{id}/` (GET, PUT, PATCH, DELETE).

`Cours` / `CoursDetails` : OHLC + volume + `timeframe` (60→2592000 s) +
`timestamp`. Source des chandeliers du graphe TA.

### 2.3 Entité `society` (fiche émetteur)

Endpoints : `/societies/`, `/societies/bulk-import/`, `/societies/parents/`,
`/societies/subsidiaires/{parent_id}/`, `/societies/{id}/`.

`Society` / `SocietyDetails` / `SocietyShort`.

### 2.4 Entités de contexte

- `indices` (9 endpoints) → `Indice`, `IndiceDetails`, `IndiceCours`
- `sectors` (3 endpoints) → `Sector`, `SectorShort`

**Definition of Done Vague 1 :** page `technical-analysis` rendue à 100% depuis
`core/` + backend, `app/api/market-data` renommé `_Old`, `tsc --noEmit` propre.

---

## 3. Vague 2 — Référentiels & marché

`bourses`, `countries`, `currencies`, `industries`, `activities`, `instruments`,
`sgis`/`sgos`, `dividends`, `actionnariats`, `events`, `results`, `result-metrics`.
Beaucoup ont déjà leur tranche `.api.ts` — vérifier conformité slash + `ActionDetails`.

---

## 4. Vague 3 — Modules riches (post-TA)

- `opcvms` + `opcvm-metrics` → carte OPCVM
- `fixed-income` (17) → screener obligataire
- `macro` (40) → séries macro sectorielles
- `financial-statements` / `financial-items` / `financial-values` / `sheets` / `periods` / `templates` / `pages`
- `documents` (7), `files` (2), `notifications` (2), `rates` (5), `cours-imports` (7)

---

## 5. Vague 4 — Auth & users (transverse)

`users` (13 : Login, Register, TokenRefresh, ChangePassword, ResetPassword,
ChangeEmail, ValidateUID…) → aligner sur `base.api.ts` reauth.

---

## 6. Discipline de migration (rappel ARCHITECTURE_DATA_FLOW)

1. Interfaces `core/domain/` écrites STRICTEMENT d'après le schéma.
2. `.api.ts` : `injectEndpoints`, `overrideExisting:true`, **slash final systématique**.
3. Page passe TOUJOURS par `use{X}Repository` (jamais `.api.ts` direct).
4. Transformation UI dans `lib/utils/*`, pas dans domain/repository.
5. Legacy → suffixe `_Old` (jamais delete immédiat).
6. `tsc --noEmit` vert à chaque entité.

---

## 7. Exécution — synthèse (post-roadmap)

- Phase 1 (transformers) + Phase 2 (hub `useMarketData`) : **terminées**.
- Phase 3 (déconnexion) : **sauf news BRVM** (exception validée, aucune API).
- Phase 4 (archive) : **terminée** (`market-data_Old`).
- Phase 5 (tests) : à revalider (environnement sans `tsc`).
- Dette résiduelle : `marketData.parsers.ts` (importé), `realtimeEnrichment.ts` (orphelin).
