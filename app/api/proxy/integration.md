# 🚀 Guide d'Intégration du Proxy "Gardien-Messager" (TENOR HDR 2026)

Ce document détaille les étapes pour exporter et intégrer l'architecture de proxy sécurisé d'Algoway (v15.0.0) dans un autre projet Next.js. Ce système remplace le middleware standard pour offrir une protection Anti-Bot, une gestion de cache distribué et un relais "aveugle" (BFF) des tokens.

---

## 1. 📦 Dépendances NPM Requises

Le proxy repose sur des librairies de haute performance pour le réseau et la persistance.

```bash
npm install next-auth           # Gestion des sessions et JWT
npm install @upstash/redis      # Rate limiting distribué et Cache (Cloud Native)
npm install undici              # Client HTTP résilient (Anti-Bypass Header)
```

---

## 2. 📂 Structure des Fichiers à Migrer

Pour une intégration réussie, copiez les répertoires et fichiers suivants en respectant l'arborescence :

### A. Le Messager (Relais API)
- `src/app/api/proxy/` **(Dossier complet)**
  - `[...path]/route.ts` : Le cœur du relais.
  - `config.ts` : Configuration centrale.
  - `cache.ts` : Abstraction Redis / Memory.
  - `rate-limiter.ts` : Algorithmes de protection DDoS.
  - `security.ts` : Sanity checks et Secure Headers.

### B. Le Gardien (Middleware Unique)
- `src/proxy.ts` : **À placer à la racine de `src/`**. 
  - *Note : Ce fichier remplace `middleware.ts` pour centraliser la sécurité Anti-Bot avant que la requête n'atteigne le proxy.*

### C. Dépendances Transverses (Indispensables)
Vous aurez besoin de ces utilitaires pour satisfaire les imports :
- `src/shared/utils/fetchWithRetry.ts` (+ `circuit-breaker.ts` et `resilient-scraper.ts`)
- `src/core/infrastructure/store/api/config.ts` (Définit les routes publiques)
- `src/core/domain/enums/user.enum.ts` (Enumération des rôles RBAC)
- `src/core/infrastructure/security/rate/redis-rate-limiter.ts` (Configurations par défaut)

---

## 3. ⚙️ Configuration du Client (Variables d'Env)

Le proxy est piloté par des variables d'environnement strictes. À ajouter dans votre `.env` :

```bash
# Sécurité & Auth
NEXTAUTH_SECRET="votre_secret_jwt"
ALLOWED_ORIGINS_PROXY="https://votre-domaine.com,http://localhost:3000"

# Upstash Redis (Vital pour Prod)
UPSTASH_REDIS_REST_URL="https://votre-instance.upstash.io"
UPSTASH_REDIS_REST_TOKEN="votre_token"

# Configuration Proxy
PROXY_RATE_LIMITING_ENABLED="true"
PROXY_CACHE_STRATEGY="redis" # 'redis', 'memory' ou 'none'
PROXY_CACHE_DEFAULT_TTL_SECONDS="300"

# Cibles API (Le mapping numérique)
API_TARGET_1="https://votre-backend-django.com"
API_TARGET_2="https://api-service-externe.com"
```

---

## 4. 🛡️ Implémentation du Gardien (`proxy.ts`)

Dans Next.js, le fichier de middleware doit s'appeler `middleware.ts`. Pour utiliser notre `src/proxy.ts` :

1.  Assurez-vous qu'aucun fichier `middleware.ts` n'existe à la racine ou dans `src/`.
2.  Créez un fichier `src/middleware.ts` (ou à la racine si pas de `src/`) qui exporte notre logique :

```typescript
// src/middleware.ts
export { default, config } from './proxy';
```

---

## 5. 🔌 Branchement dans le Code Client (Frontend)

Pour utiliser le proxy depuis vos composants React (ou RTK Query), utilisez l'URL préfixée par l'identifiant de cible :

```typescript
// Exemple : Appeler l'API Target 1
const response = await fetch('/api/proxy/1/users/me'); 
// Sera relayé vers : https://votre-backend-django.com/users/me
// Avec injection automatique du Bearer Token (HttpOnly)
```

---

## ✅ Checklist d'Intégration HDR

- [ ] **Pas de Double Validation** : Vérifiez que `route.ts` ne contient plus de logique de validation manuelle (déléguée à `src/proxy.ts`).
- [ ] **Circuit Breaker** : Testez le comportement en coupant Redis (le système doit basculer en `in-memory` sans crash).
- [ ] **Streaming** : Vérifiez que les gros payloads (ex: téléchargement de rapports) sont bien streamés (TTFB immédiat).
- [ ] **Sanitization** : Testez l'envoi d'un segment de chemin malveillant (`/../etc/passwd`) ; il doit être bloqué par `security.ts`.
- [ ] **Rate Limit** : Vérifiez la présence des headers `X-RateLimit-*` dans les réponses.

> **Protocole TENOR 2026** : Ce proxy est conçu pour une latence < 10ms. Ne jamais ajouter de `console.log` synchrone dans le `route.ts` en production ; utilisez le `logger` asynchrone structuré déjà en place pour ne pas bloquer l'Event Loop de l'Edge Runtime.
