# Statut vérifié — Migration page `technical-analysis`

> **Objet :** référentiel d'état de la migration de la page
> `/equity/technical-analysis` vers le backend `Algo DataBase API v1`.
> Chaque critère est confronté au **code réel** (preuve `fichier:ligne`),
> pas à l'intention.

## Légende

- ✅ FAIT — vérifié dans le code
- ⚠️ EXCEPTION — décision produit validée (pas d'alternative API)
- 🟡 DETTE — présence résiduelle assumée
- ⏭️ NON VÉRIFIÉ — exécutable indisponible dans cet environnement

## Critères de succès (Phase 5 du plan)

| Critère | État | Preuve |
|---|---|---|
| `app/api/market-data_Old` existe (git history préservé) | ✅ | `app/api/market-data_Old/{brvm-bonds,brvm-fundamentals,brvm-live,brvm-live-capitalisation,indices}` |
| technical-analysis ne requête AUCUNE route locale market-data | ⚠️ | Seule exception : `sidebarDataPortAdapter.ts:223` → `/api/market-data/brvm-news` |
| Aucun appel `/api/proxy/9/...CSV` | ✅ | `useMarketData.ts:6-8` (SUPPRIMÉ) ; `marketData.fetchers.ts` supprimé |
| `lib/utils/marketDataTransform.ts` avec mappers domain→UI | ✅ | `lib/utils/marketDataTransform.ts` (`coursSeriesToChartData`, `priceMetricToLiveSnapshot`) |
| `useMarketData` consomme `useActionRepository`/`useCoursRepository` | ✅ | `useMarketData.ts:52-53` (imports) |
| Mode `mock` supprimé | ✅ | `useMarketData.ts:9` (mode conservé pour compat signature, source toujours API) |
| Champs null API restent null | ✅ | `lib/utils/marketDataTransform.ts` (stratégie diagnostic) |
| `pnpm exec tsc --noEmit` vert | ⏭️ | `tsc` non exécutable dans cet environnement |
| Page `/equity/technical-analysis` fonctionne (test visuel) | ⏭️ | À revalider côté dev |

## Dette résiduelle

| Élément | État | Preuve |
|---|---|---|
| `marketData.parsers.ts` encore présent | 🟡 | `hooks/MarketData/marketData.parsers.ts:94` (`parseIndicatorCSV`) ; importé par `useIndicatorBacktestDashboard.ts:4` (`resolveBRVMDatasetTicker`) |
| `realtimeEnrichment.ts` orphelin | 🟡 | `hooks/MarketData/realtimeEnrichment.ts` — aucun import actif |
| `MarketDataArchitecture.md` obsolète | 🟡 | Documente l'architecture scraping pré-migration |

## Exceptions validées

| Donnée | Décision | Raison |
|---|---|---|
| News BRVM | Scraping conservé (`/api/market-data/brvm-news`) | Aucun endpoint news côté backend (cf. `BACKEND_MIGRATION_ROADMAP.md`) |

## Conformité

`Docs/ARCHITECTURE_DATA_FLOW.md` — pattern 7-fichiers, transformation UI dans
`lib/utils/`, page via `use{X}Repository`.
