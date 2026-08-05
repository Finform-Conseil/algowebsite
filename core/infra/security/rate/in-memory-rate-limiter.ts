// CHEMIN : src/core/infrastructure/security/rate/in-memory-rate-limiter.ts
import { checkRedisRateLimit } from './redis-rate-limiter';

// 🧬 LÉGAT-VULCAN PRIME: Détermination claire de la stratégie. Redis est la norme en production.
const useRedis = process.env.NODE_ENV === 'production';

// --- Implémentation en mémoire, maintenant UNIQUEMENT pour le développement local ---
const inMemoryStore = new Map<string, { count: number; expiry: number }>();
const checkInMemoryRateLimit = (identifier: string): { success: boolean; message: string } => {
  const RATE_LIMIT_CONFIG = {
    windowMs: 5 * 60 * 1000,
    maxAttempts: 5,
  };
  const now = Date.now();
  const record = inMemoryStore.get(identifier) || { count: 0, expiry: 0 };

  if (now > record.expiry) {
    record.count = 0;
    record.expiry = now + RATE_LIMIT_CONFIG.windowMs;
  }

  record.count++;
  inMemoryStore.set(identifier, record);

  if (record.count > RATE_LIMIT_CONFIG.maxAttempts) {
    return { success: false, message: "Trop de tentatives. Veuillez patienter." };
  }
  return { success: true, message: "Tentative autorisée." };
};

/**
 * 🧬 LÉGAT-VULCAN PRIME: Adaptateur de Rate Limiter.
 * C'est le point d'entrée unique pour le reste de l'application.
 * Il choisit la stratégie de limitation (Redis en production, in-memory en dev)
 * et vérifie si la requête est autorisée.
 * @param identifier L'identifiant unique à suivre.
 * @returns Un objet indiquant si la requête est autorisée.
 */
export const rateLimiter = {
  check: async (identifier: string): Promise<{ success: boolean; message: string }> => {
    if (useRedis) {
      // En production, on utilise la solution robuste et distribuée.
      return checkRedisRateLimit(identifier);
    } else {
      // En développement, on utilise la solution simple en mémoire pour ne pas bloquer le workflow.
      return Promise.resolve(checkInMemoryRateLimit(identifier));
    }
  },
};