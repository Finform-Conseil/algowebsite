// core/infrastructure/store/index.ts
import { configureStore } from '@reduxjs/toolkit';

// 🧬 Jack-Josias: [CORRECTION FINALE] Import de la nouvelle fondation de l'API.
// C'est la source de vérité pour le reducer et le middleware de RTK Query.
import { baseApi } from './api/rtkApi-query/baseApi';
import technicalAnalysisReducer from '@/components/technical-analysis/store/technicalAnalysisSlice';

export const makeStore = () => {
  return configureStore({
    reducer: {
      // 🧬 Jack-Josias: Utilisation des propriétés de `baseApi` pour configurer le store.
      [baseApi.reducerPath]: baseApi.reducer,
      technicalAnalysis: technicalAnalysisReducer,
    },
    // 🧬 Jack-Josias: Le middleware de `baseApi` est concaténé.
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        // [TENOR 2026 FIX] SCAR-162: Eradicate CPU Stuttering in Dev Mode
        // Redux Toolkit's dev middlewares recursively check every property of every object
        // for serializability and immutability. When dispatching an array of 10,000+ candles,
        // this takes >100ms and freezes the UI thread.
        // We surgically bypass these checks ONLY for the massive marketData cache.
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
      }).concat(baseApi.middleware),
    devTools: process.env.NODE_ENV !== 'production',
  });
};

// Les types inférés restent corrects et n'ont pas besoin de changer.
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];