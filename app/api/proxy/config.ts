// Fichier: src/app/api/proxy/config.ts
// Version Finale - OPÉRATION [CHRONOS-GARDEN]


// 🧬 LÉGAT-VULCAN PRIME: CORRECTION - Ajout d'un type explicite pour apiTargets.
type ApiTargets = Record<string, string | undefined>;

// 🧬 IMPORT CENTRALISÉ DES RÈGLES DE SÉCURITÉ
import { RATE_LIMIT_CONFIGS } from '@/core/infrastructure/security/rate/redis-rate-limiter';


export const proxyConfig = {
  // 🧬 Jack-Josias: [STRATÉGIE "L'INTERRUPTEUR DE CONTOURNEMENT"]
  // Active/désactive le rate limiting. Nécessite Redis.
  // Mettre à `true` dans .env pour activer en production.
  rateLimitingEnabled: process.env.PROXY_RATE_LIMITING_ENABLED === 'true',

  // 🧬 Jack-Josias: [STRATÉGIE "ADAPTATEUR DE PERSISTANCE"]
  // Choisit la stratégie de cache et configure sa durée de vie.
  cache: {
    // 'redis' for Upstash Redis (production), 'memory' pour le cache en mémoire (développement).
    strategy: process.env.PROXY_CACHE_STRATEGY || 'none',

    // Durée de vie par défaut pour les routes non spécifiquement configurées ci-dessous.
    defaultTtlSeconds: parseInt(process.env.PROXY_CACHE_DEFAULT_TTL_SECONDS || '300', 10), // 5 minutes

    // 🧬 Jack-Josias: [RÈGLES DE CACHE SPÉCIFIQUES - OPÉRATION CHRONOS-GARDEN]
    // Dictionnaire de règles pour des TTL personnalisés. La première correspondance est utilisée.
    // Un TTL de 0 désactive le cache pour la route correspondante.
    routeTtls: new Map<RegExp, number>([
      // Données très volatiles (ex: le cours d'une action en temps réel) -> 30 secondes
      [/^\/api\/proxy\/1\/realtime-stock\/.*/, 30],

      // Données modérément volatiles (ex: liste des dernières commandes) -> 1 minute
      // [/^\/api\/proxy\/1\/commands(\?.*)?$/, 60],

      // Données stables (ex: informations sur un utilisateur, géolocalisation) -> 1 heure
      // [/^\/api\/proxy\/1\/auth\/me/, 3600],

      // Données quasi-statiques (API de géolocalisation externes) -> 24 heures
      // [/^\/api\/proxy\/[2-8]\/.*/, 86400],

      // Route pour laquelle on ne veut JAMAIS de cache
      [/^\/api\/proxy\/1\/sensitive-operation/, 0],

    ]),
  },



  rateLimit: {
    // 🧬 ALIGNEMENT : Utilisation des constantes centrales (60 req / 60 sec) par défaut.
    // Conversion de ms (Core) en secondes (Redis expire)
    window: parseInt(process.env.PROXY_RATE_LIMIT_WINDOW_SECONDS || (RATE_LIMIT_CONFIGS.api.windowMs / 1000).toString(), 10),
    maxRequests: parseInt(process.env.PROXY_RATE_LIMIT_MAX_REQUESTS || RATE_LIMIT_CONFIGS.api.limit.toString(), 10),
  },
  fetch: {
    timeout: parseInt(process.env.PROXY_REQUEST_TIMEOUT_MS || '30000', 10),
  },
  body: {
    maxSize: parseInt(process.env.PROXY_MAX_BODY_SIZE_BYTES || '10485760', 10), // 10Mo
  },

  // 🧬 LÉGAT-VULCAN PRIME: CORRECTION - Application du type explicite.
  apiTargets: {
    '1': process.env.API_TARGET_1,
    '2': process.env.API_TARGET_2,
    '3': process.env.API_TARGET_3,
    '4': process.env.API_TARGET_4,
    '5': process.env.API_TARGET_5,
    '6': process.env.API_TARGET_6,
    '7': process.env.API_TARGET_7,
    '8': process.env.API_TARGET_8,
    '9': process.env.API_TARGET_9,
  } as ApiTargets,

  allowedOrigins: (process.env.ALLOWED_ORIGINS_PROXY || `http://localhost:${process.env.PORT || 3000}`)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};