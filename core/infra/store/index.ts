// ================================================================================
// FICHIER : core/infra/store/index.ts
// RÔLE   : STORE REDUX CANONIQUE UNIQUE de l'application.
// ================================================================================
// [CONSOLIDATION] Ce fichier est désormais la SEULE source de vérité du store.
// L'ancien doublon `core/infrastructure/store` (baseApi vide + makeStore) a été
// absorbé ici : plus aucun `baseApi` mort, un seul `reducerPath: 'api'` réellement
// peuplé par les ~26 entités. Le reducer `technicalAnalysis` et le réglage fin du
// middleware (anti-stutter sur les gros datasets de marché) ont été rapatriés.
//
// Modèle : `makeStore()` (factory par requête, requis par le SSR Next.js App
// Router — un store neuf par requête serveur). Le provider en crée une instance
// unique côté client via useRef (voir StoreProvider).
// ================================================================================

import { configureStore } from '@reduxjs/toolkit';
import { api } from './api';
import { currencyReducer } from './slices/currencySlice';
import technicalAnalysisReducer from '@/components/technical-analysis/store/technicalAnalysisSlice';

export const makeStore = () => {
  return configureStore({
    reducer: {
      // API RTK Query unique, peuplée par toutes les entités (sector, country, …).
      [api.reducerPath]: api.reducer,
      currency: currencyReducer,
      technicalAnalysis: technicalAnalysisReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        // [TENOR 2026 FIX] SCAR-162: Éradication du stuttering CPU en dev.
        // Les middlewares dev de Redux Toolkit vérifient récursivement chaque
        // propriété de chaque objet (sérialisabilité + immutabilité). Sur un
        // dispatch de 10 000+ bougies, cela dépasse 100ms et fige le thread UI.
        // On contourne chirurgicalement ces checks UNIQUEMENT pour les données
        // massives de marché stockées dans le slice technicalAnalysis.
        serializableCheck: {
          ignoredActions: [
            'technicalAnalysis/updateMarketData',
            'technicalAnalysis/updateMarketSnapshot',
          ],
          ignoredPaths: [
            'technicalAnalysis.marketData',
            'technicalAnalysis.marketSnapshots',
          ],
          warnAfter: 128,
        },
        immutableCheck: {
          ignoredPaths: [
            'technicalAnalysis.marketData',
            'technicalAnalysis.marketSnapshots',
          ],
          warnAfter: 128,
        },
      }).concat(api.middleware),
    devTools: process.env.NODE_ENV !== 'production',
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
