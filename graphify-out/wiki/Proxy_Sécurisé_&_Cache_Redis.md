# Proxy Sécurisé & Cache Redis

> 35 nodes · cohesion 0.09

## Key Concepts

- **handleRequest()** (16 connections) — `app/api/proxy/[...path]/route.ts`
- **CircuitBreaker** (10 connections) — `shared/utils/circuit-breaker.ts`
- **route.ts** (8 connections) — `app/api/proxy/[...path]/route.ts`
- **security.ts** (5 connections) — `app/api/proxy/security.ts`
- **cache.ts** (4 connections) — `app/api/proxy/cache.ts`
- **.execute()** (4 connections) — `shared/utils/circuit-breaker.ts`
- **.transitionTo()** (4 connections) — `shared/utils/circuit-breaker.ts`
- **GET()** (3 connections) — `app/api/proxy/[...path]/route.ts`
- **checkRateLimit()** (3 connections) — `core/infrastructure/security/rate/redis-rate-limiter.ts`
- **.canAttempt()** (3 connections) — `shared/utils/circuit-breaker.ts`
- **.onFailure()** (3 connections) — `shared/utils/circuit-breaker.ts`
- **.onSuccess()** (3 connections) — `shared/utils/circuit-breaker.ts`
- **redis-rate-limiter.ts** (2 connections) — `core/infrastructure/security/rate/redis-rate-limiter.ts`
- **DELETE()** (2 connections) — `app/api/proxy/[...path]/route.ts`
- **HEAD()** (2 connections) — `app/api/proxy/[...path]/route.ts`
- **OPTIONS()** (2 connections) — `app/api/proxy/[...path]/route.ts`
- **PATCH()** (2 connections) — `app/api/proxy/[...path]/route.ts`
- **POST()** (2 connections) — `app/api/proxy/[...path]/route.ts`
- **PUT()** (2 connections) — `app/api/proxy/[...path]/route.ts`
- **getCachedResponse()** (2 connections) — `app/api/proxy/cache.ts`
- **setCachedResponse()** (2 connections) — `app/api/proxy/cache.ts`
- **arePathSegmentsSafe()** (2 connections) — `app/api/proxy/security.ts`
- **createSecureHeaders()** (2 connections) — `app/api/proxy/security.ts`
- **isValidApiIdentifier()** (2 connections) — `app/api/proxy/security.ts`
- **isValidTargetUrl()** (2 connections) — `app/api/proxy/security.ts`
- *... and 10 more nodes in this community*

## Relationships

- No strong cross-community connections detected

## Source Files

- `app/api/proxy/[...path]/route.ts`
- `app/api/proxy/cache.ts`
- `app/api/proxy/security.ts`
- `core/infrastructure/security/rate/redis-rate-limiter.ts`
- `shared/utils/circuit-breaker.ts`

## Audit Trail

- EXTRACTED: 88 (83%)
- INFERRED: 18 (17%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*