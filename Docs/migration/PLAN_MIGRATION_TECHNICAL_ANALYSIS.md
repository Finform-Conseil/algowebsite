# PLAN DE MIGRATION — technical-analysis vers API backend Django

## OBJECTIF FINAL
- `app/api/market-data` → renommé `app/api/market-data_Old`
- `components/technical-analysis` ne requête PLUS AUCUNE route locale market-data
- Toutes les données proviennent de l'API backend via `core/` (Clean/Hexagonal)

## ÉTAPES D'EXÉCUTION

### PHASE 1: Mapping & Transformers (lib/utils/)
**Créer les fonctions de transformation domain → UI dans `lib/utils/`**

1.1. `lib/utils/marketDataTransform.ts`
   - `coursToChartDataPoint(cours: CoursEntity[]): ChartDataPoint[]`
   - `priceMetricToLiveSnapshot(metric: PriceIndicatorEntity, symbol: string): LiveSnapshot`
   - Mappers exacts, champs null préservés (stratégie diagnostic)

### PHASE 2: Réécriture du hub (hooks/MarketData/)
**Rebrancher `useMarketData` sur les repositories `core/`**

2.1. Backup
   - `components/technical-analysis/hooks/MarketData/` → `_Rollback/MarketData_<timestamp>/`

2.2. Réécrire `useMarketData.ts`
   - Importer `useActionRepository`, `useCoursRepository`
   - `getActionByTicker(ticker)` → `ActionDetails` (avec les 3 métriques imbriquées)
   - `getAllCours({ instrument: actionData.instrument })` → série OHLCV
   - Supprimer les fetch `/api/market-data/*`, `/api/proxy/9/*CSV`
   - Conserver le contrat de sortie (`chartData`, `liveSnapshot`, `currentVolume`, etc.)
   - Mode `"mock"` → SUPPRIMÉ (conformité `AGENTS REAL API - NO SIMULATION.md`)

2.3. Nettoyer les fetchers
   - `marketData.fetchers.ts` : supprimer `fetchDailyCsvData` (GitHub CSV)
   - `marketData.parsers.ts` : supprimer `parseIndicatorCSV` (plus utilisé)
   - `realtimeEnrichment.ts` : supprimer le polling scraping BRVM

### PHASE 3: Vérification de déconnexion
**S'assurer que RIEN dans technical-analysis ne touche plus market-data**

3.1. Grep récursif
   ```bash
   grep -rn "api/market-data\|market-data/" components/technical-analysis/
   ```
   → Résultat attendu : 0 occurrence (sauf docs d'archive)

3.2. Grep proxy/9 (GitHub CSV)
   ```bash
   grep -rn "proxy/9/Fredysessie" components/technical-analysis/
   ```
   → Résultat attendu : 0 occurrence

### PHASE 4: Archive
**Renommer `app/api/market-data` → `app/api/market-data_Old`**

4.1. `git mv`
   ```bash
   git mv app/api/market-data app/api/market-data_Old
   ```

4.2. Commit conventionnel
   ```
   feat(migration)!: migrate technical-analysis to backend API — archive market-data scraping

   BREAKING CHANGE: app/api/market-data routes are now inactive (renamed _Old).
   All data consumption in components/technical-analysis now sourced from
   core/ repositories (ActionDetails with embedded metrics).

   - Created lib/utils/marketDataTransform.ts (domain→UI mappers)
   - Rewrote hooks/MarketData/useMarketData.ts to consume useActionRepository/useCoursRepository
   - Removed GitHub CSV fetching, BRVM scraping, indicator CSV parsing
   - Preserved null fields (diagnostic strategy: defaillant indicators remain visible)
   - Deleted mock mode (compliance with AGENTS REAL API - NO SIMULATION.md)

   Refs: Docs/BACKEND_MIGRATION_ROADMAP.md, Docs/ARCHITECTURE_DATA_FLOW.md
   ```

### PHASE 5: Tests de non-régression
5.1. Build TypeScript
   ```bash
   pnpm exec tsc --noEmit
   ```
   → Aucune erreur

5.2. Smoke test visuel
   - Lancer `pnpm dev`
   - Naviguer vers `/equity/technical-analysis`
   - Vérifier : graphique OHLCV se charge, snapshot live affiche price/variation
   - Vérifier : indicateurs défaillants (null) sont **visibles** (pas masqués par mock)

## CRITÈRES DE SUCCÈS
- [ ] `app/api/market-data_Old` existe (git history préservé)
- [ ] `components/technical-analysis` ne contient AUCUN appel `/api/market-data`
- [ ] `components/technical-analysis` ne contient AUCUN appel `/api/proxy/9/...CSV`
- [ ] `lib/utils/marketDataTransform.ts` existe avec mappers domain→UI
- [ ] `useMarketData` consomme `useActionRepository`/`useCoursRepository`
- [ ] Mode `"mock"` supprimé (pas de `GENERATE_INITIAL_DATA`)
- [ ] `pnpm exec tsc --noEmit` vert
- [ ] Page `/equity/technical-analysis` fonctionne (test visuel)
- [ ] Champs null API restent null (diagnostic visible)

