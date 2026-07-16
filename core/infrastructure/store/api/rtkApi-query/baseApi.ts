// ================================================================================
// FICHIER : src/core/infrastructure/store/api/rtkApi-query/baseApi.ts
// RÔLE : FONDATION DE LA COUCHE API (RTK QUERY)
// VERSION : 2.1 (CORRECTION TAG TYPES)
// ================================================================================

import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithRetry } from './baseQuery';

/**
 * Instance de base de l'API RTK Query.
 * Elle est intentionnellement vide et sert de point d'injection
 * pour les autres fichiers d'API (userApi, commandApi, companyApi).
 * C'est la source de vérité pour la configuration globale de l'API.
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithRetry,
  
  // ================================================================================
  // CORRECTION : Ajout du tag 'Companies' à la liste des types de tags connus.
  // C'est la correction de la cause racine de l'erreur TypeScript.
  // ================================================================================
  tagTypes: [
    
    // 'User',
    
  ],

  refetchOnFocus: true,
  refetchOnReconnect: true,
  endpoints: () => ({}),
});






export const RTK_QUERY_CONFIGS = {
    default: {
      keepUnusedDataFor: 300,
      // ✅ Refetch si les données ont plus de 30 secondes
      // Cela garantit que les données ne sont jamais trop anciennes
      // tout en évitant des refetch inutiles (compromis performance/fraîcheur)
      refetchOnMountOrArgChange: 30,
      refetchOnReconnect: true,
      refetchOnFocus: true,
    },
    frequentUpdate: {
      keepUnusedDataFor: 5,
      refetchOnMountOrArgChange: true,
      refetchOnReconnect: true,
      refetchOnFocus: true,
    },
} as const;