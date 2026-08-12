# PLAN DE MIGRATION — page `technical-analysis` vers l'API backend Django

> **Route cible :** `/equity/technical-analysis`
> **Module :** `components/technical-analysis`
> **Statut du plan :** phases 1-4 terminées ; phase 5 (tests) non exécutable ici.
> Détail : [TECHNICAL_ANALYSIS_MIGRATION_STATUS.md](./TECHNICAL_ANALYSIS_MIGRATION_STATUS.md).

## OBJECTIF FINAL

- `app/api/market-data` → renommé `app/api/market-data_Old` ✅
- `components/technical-analysis` ne requête PLUS AUCUNE route locale market-data ⚠️ (sauf news)
- Toutes les données proviennent de l'API backend via `core/` (Clean/Hexagonal) ✅

## ÉTAPES D'EXÉCUTION

### PHASE 1: Mapping & Transformers (lib/utils/) — ✅ FAIT

1.1. `lib/utils/marketDataTransform.ts` — ✅ créé
   - `coursSeriesToChartData`, `priceMetricToLiveSnapshot`
   - Mappers exacts, champs null préservés (stratégie diagnostic)

### PHASE 2: Réécriture du hub (hooks/MarketData/) — ✅ FAIT

2.1. Backup `_Rollback/MarketData_<timestamp>/` — effectué lors de la migration
2.2. `useMarketData.ts` — ✅
   - `useActionRepository` / `useCoursRepository`
   - Fetches `/api/market-data/*` et `/api/proxy/9/*CSV` supprimés
   - Contrat de sortie inchangé ; mode `"mock"` supprimé
2.3. Nettoyage fetchers — 🟡 partiel
   - `marketData.fetchers.ts` supprimé ✅
   - `marketData.parsers.ts` conservé (encore importé par `useIndicatorBacktestDashboard.ts`)
   - `realtimeEnrichment.ts` présent mais orphelin

### PHASE 3: Vérification de déconnexion — ⚠️ sauf news

3.1. Grep `api/market-data` → reste uniquement la news (`sidebarDataPortAdapter.ts:223`)
3.2. Grep `proxy/9/Fredysessie` → 0 occurrence ✅

### PHASE 4: Archive — ✅ FAIT

4.1. `app/api/market-data` → `app/api/market-data_Old` ✅
4.2. Commit conventionnel — à faire au prochain commit

### PHASE 5: Tests de non-régression — ⏭️ (environnement limité)

5.1. `pnpm exec tsc --noEmit` → non exécutable ici
5.2. Smoke test visuel `/equity/technical-analysis` → à revalider

## CRITÈRES DE SUCCÈS

- [x] `app/api/market-data_Old` existe
- [~] Zéro appel `/api/market-data` dans technical-analysis (sauf news)
- [x] Zéro appel `/api/proxy/9/...CSV`
- [x] `lib/utils/marketDataTransform.ts` existe
- [x] `useMarketData` consomme `useActionRepository`/`useCoursRepository`
- [x] Mode `mock` supprimé
- [ ] `pnpm exec tsc --noEmit` vert (non vérifiable ici)
- [ ] Page fonctionne (test visuel — non vérifiable ici)
- [x] Champs null API restent null
