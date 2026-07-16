// src/core/infrastructure/store/api/rtkApi-query/baseQuery.ts
import { fetchBaseQuery, retry } from '@reduxjs/toolkit/query/react';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { apiConfig } from '../../config';

/**
 * Crée une instance de baseQuery configurée pour l'application.
 * Elle pointe simplement vers la base de notre proxy.
 */
const baseQuery = fetchBaseQuery({
  baseUrl: apiConfig.baseUrl,
});

/**
 * 🧬 LÉGAT-VULCAN PRIME: [CORRECTION INTÉGRALE CI=4]
 * Enveloppe le baseQuery avec une logique de retry conditionnelle.
 * Si une requête échoue, cette fonction est exécutée avant toute nouvelle tentative.
 * Elle implémente la cicatrice RDC-0012-RTKQ_RETRY_ANTI_PATTERN.
 */
const baseQueryWithConditionalRetry = retry(
  async (args, api, extraOptions) => {
    const result = await baseQuery(args, api, extraOptions);

    // 🔍 Logging détaillé en mode développement
    if (process.env.NODE_ENV === 'development' && result.error) {
      const error = result.error as any;
      console.group('🔴 [RTK Query] Erreur détectée');
      console.log('Endpoint:', typeof args === 'string' ? args : args.url);
      console.log('Status:', error.status);
      console.log('Error:', error);
      
      if (error.status === 'FETCH_ERROR' || error.error === 'fetch failed') {
        console.warn('Type: ERREUR RÉSEAU (fetch failed, CORS, ou timeout)');
      } else if (error.status >= 400 && error.status < 500) {
        console.warn('Type: ERREUR CLIENT (4xx)');
      } else if (error.status >= 500) {
        console.warn('Type: ERREUR SERVEUR (5xx)');
      }
      console.groupEnd();
    }

    // Condition de sortie pour le retry : ne jamais retenter sur une erreur client (4xx).
    // Une erreur 4xx signifie que la requête elle-même est invalide, la retenter ne changera rien.
    if (result.error && typeof result.error.status === 'number' && result.error.status >= 400 && result.error.status < 500) {
      // En appelant retry.fail, nous disons à RTK Query d'arrêter immédiatement les tentatives
      // et de considérer la requête comme échouée.
      retry.fail(result.error);
    }

    return result;
  },
  
  {
    // Nous conservons les 2 tentatives, mais elles ne s'appliqueront désormais qu'aux erreurs réseau
    // ou aux erreurs serveur (5xx), pour lesquelles une nouvelle tentative a du sens.
    maxRetries: 2,
  }
);

export const baseQueryWithRetry = baseQueryWithConditionalRetry;