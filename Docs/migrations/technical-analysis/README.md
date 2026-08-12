# Migration — Page `technical-analysis` vers le Backend `Algo DataBase API v1`

> **Périmètre :** page **`/equity/technical-analysis`**
> (`app/[locale]/equity/technical-analysis/page.tsx`) et module
> **`components/technical-analysis`**.
>
> **Objet :** remplacer la consommation de données locales (scraping BRVM via
> `app/api/market-data` + GitHub CSV via `proxy/9`) par l'API backend Django
> `Algo DataBase API v1`, à travers la couche `core/` (Clean/Hexagonal).

## Statut global (vérifié dans le code)

| Élément | État |
|---|---|
| Hub `useMarketData` sur repos `core/` | ✅ FAIT |
| Transformers `lib/utils/marketDataTransform.ts` | ✅ FAIT |
| Routes locales archivées `app/api/market-data_Old` | ✅ FAIT |
| Mode `mock` supprimé | ✅ FAIT |
| News BRVM (scraping) | ⚠️ EXCEPTION — conservé (pas d'API) |
| `marketData.parsers.ts` / `realtimeEnrichment.ts` | 🟡 DETTE résiduelle |

Détail vérifié : voir
[TECHNICAL_ANALYSIS_MIGRATION_STATUS.md](./TECHNICAL_ANALYSIS_MIGRATION_STATUS.md).

## Avant / Après

```
AVANT (supprimé)
  BRVM (site) --scraping--> app/api/market-data/* --┐
  GitHub CSV --proxy/9--> Fredysessie/*.csv --------┤--> useMarketData --> page
  mode "mock" local ---------------------------------┘

APRÈS (actuel)
  Algo DataBase API v1 --> core/ (repos RTK Query) -->
    lib/utils/marketDataTransform.ts --> useMarketData --> page
```

## Inventaire

| Fichier | Rôle |
|---|---|
| `README.md` | Ce fichier — index de la migration (page-anchored) |
| `TECHNICAL_ANALYSIS_MIGRATION_STATUS.md` | Checklist des critères de succès, état **vérifié** dans le code |
| `PLAN_MIGRATION_TECHNICAL_ANALYSIS.md` | Plan d'exécution détaillé (5 phases) annoté selon l'état réel |
| `BACKEND_MIGRATION_ROADMAP.md` | Roadmap stratégique (4 vagues) + découverte `ActionDetails` |
| `backend-schema/` | Schéma OpenAPI global du backend (voir note) |

## Backend de référence

- **Base URL** : `http://a21mldhl1xhs0dumr7kfo1fg.85.190.99.121.sslip.io/api/v1`
- **Contrat** : DRF (drf-yasg), pagination `{count,next,previous,results[]}`, slash final obligatoire.

> **Note `backend-schema/`** : le schéma OpenAPI (`swagger.json`, 1.3 Mo minifié,
> 205 endpoints, 96 modèles) et `RESOURCE_ROADMAP.md` sont des artefacts **globaux**
> du backend, partagés avec d'autres migrations. Pour préserver le fichier minifié
> `swagger.json` sans perte (ligne unique non réécrivable par changeset), ce dossier
> reste physiquement sous `Docs/migration/backend-schema/`.

## Principe directeur (décision produit)

Source de vérité = **API UNIQUEMENT**. Les champs `null` renvoyés par l'API
restent `null` (aucun fallback de calcul local) : cela rend **visible** tout
indicateur défaillant côté backend. La logique math locale est préservée dans
le code mais **non branchée** en fallback.

## Conformité

`Docs/ARCHITECTURE_DATA_FLOW.md` (Clean/Hexagonal, pattern 7-fichiers
domain→infra→page, transformation UI dans `lib/utils/`).
