# Docs/migration — Migration technical-analysis → Backend API

Ce dossier regroupe TOUS les artefacts de la migration de la consommation de
données de `components/technical-analysis` depuis les sources locales
(`app/api/market-data` scraping BRVM + GitHub CSV) vers l'API backend Django
`Algo DataBase API v1`.

## Inventaire

| Fichier | Rôle |
|---|---|
| `BACKEND_MIGRATION_ROADMAP.md` | Roadmap stratégique (4 vagues), découverte `ActionDetails` |
| `PLAN_MIGRATION_TECHNICAL_ANALYSIS.md` | Plan d'exécution détaillé (5 phases + critères de succès) |
| `backend-schema/swagger.json` | Schéma OpenAPI 2.0 brut du backend (205 endpoints, 96 modèles) |
| `backend-schema/RESOURCE_ROADMAP.md` | Inventaire par ressource dérivé du schéma |

## Backend de référence

- **Base URL** : `http://a21mldhl1xhs0dumr7kfo1fg.85.190.99.121.sslip.io/api/v1`
- **Contrat** : DRF (drf-yasg), pagination `{count,next,previous,results[]}`,
  slash final obligatoire (`APPEND_SLASH=True`).

## Principe directeur (décision produit)

Source de vérité = **API UNIQUEMENT**. Les champs `null` renvoyés par l'API
restent `null` (aucun fallback de calcul local) : cela rend **visible** tout
indicateur défaillant côté backend, au lieu de le masquer. La logique math
locale est préservée dans le code mais **non branchée** en fallback.

## Alignement architecture

Toute la migration respecte `Docs/ARCHITECTURE_DATA_FLOW.md`
(Clean/Hexagonal, pattern 7-fichiers domain→infra→page, transformation UI
dans `lib/utils/`).
