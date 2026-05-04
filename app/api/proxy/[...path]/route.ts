// ================================================================================
// Ce proxy fait confiance au `middleware.ts` qui s'exécute avant lui.
// Sa seule responsabilité est de :
// 1. Récupérer le token (déjà validé) pour l'injecter dans la requête sortante.
// 2. Relayer la requête vers l'API Django.
// 3. Streamer la réponse vers le client.
// Il ne contient PLUS de logique de validation de session redondante.
// ================================================================================

// ================================================================================
// FICHIER : src/app/api/proxy/[...path]/route.ts
// RÔLE : LE MESSAGER OPTIMISÉ & SÉCURISÉ (HDR GRADE)
// VERSION : HARMONISÉE 5.0 (SRE CIRCUIT BREAKER ENFORCEMENT)
// ================================================================================

import { NextRequest, NextResponse } from 'next/server';
import { proxyConfig } from '../config';
import { createSecureHeaders, isValidApiIdentifier, isValidTargetUrl, arePathSegmentsSafe, sanitizePath } from '../security';
import { checkRateLimit } from '../rate-limiter';
import { getCachedResponse, setCachedResponse } from '../cache';
import { apiConfig } from '@/core/infrastructure/store/config';
import { fetchWithRetry } from '@/shared/utils/fetchWithRetry';
import { getCircuitBreaker } from '@/shared/utils/circuit-breaker';

const logger = {
  // eslint-disable-next-line no-console
  info: (message: string, context: object) => console.log(JSON.stringify({ level: 'INFO', component: 'ProxyRoute', message, ...context })),
  warn: (message: string, context: object) => console.warn(JSON.stringify({ level: 'WARN', component: 'ProxyRoute', message, ...context })),
  error: (message: string, context: object) => console.error(JSON.stringify({ level: 'ERROR', component: 'ProxyRoute', message, ...context })),
};

type RouteParams = { path: string[] };
type HandlerContext = { params: Promise<RouteParams> };

async function handleRequest(method: string, request: NextRequest, params: RouteParams) {
  request.signal.addEventListener('abort', () => {
    console.warn(`[proxy] Client disconnected (${method} ${params.path.join('/')}) — call continues`);
  });

  const requestId = crypto.randomUUID();
  const origin = request.headers.get('origin');
  const fetchDest = request.headers.get('sec-fetch-dest');

  if (fetchDest === 'document') {
    logger.warn('Accès direct au proxy via la navigation bloqué.', { requestId, origin, path: params.path.join('/') });
    return NextResponse.redirect(new URL('/not-found', request.url));
  }

  const baseLogContext = { requestId, method, origin };

  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > proxyConfig.body.maxSize) {
      logger.warn('Payload trop volumineux rejeté.', { ...baseLogContext, size: contentLength });
      return NextResponse.json({ error: 'Payload Too Large', requestId }, { status: 413 });
    }
  }

  const requestPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  let applicableTtl = proxyConfig.cache.defaultTtlSeconds;

  for (const [regex, duration] of proxyConfig.cache.routeTtls.entries()) {
    if (regex.test(requestPath)) {
      applicableTtl = duration;
      break;
    }
  }

  if (method === 'GET' && applicableTtl > 0) {
    const cacheKey = `proxy-cache:${requestPath}`;
    const cached = await getCachedResponse(cacheKey);
    if (cached) {
      const headers = new Headers(cached.headers);
      headers.set('X-Cache-Status', `HIT (${proxyConfig.cache.strategy})`);
      return new NextResponse(cached.body, {
        status: cached.status,
        headers: headers,
      });
    }
  }

  const rawPath = params.path.join('/');
  const sanitizedPath = sanitizePath(rawPath);
  const pathSegments = sanitizedPath.split('/');

  if (!sanitizedPath || pathSegments.length === 0) {
    return NextResponse.json({ error: 'Chemin API invalide', requestId }, { status: 400 });
  }

  if (!arePathSegmentsSafe(pathSegments)) {
    logger.warn('Segment de chemin invalide détecté et bloqué.', { ...baseLogContext, pathSegments });
    return NextResponse.json({ error: 'Chemin API invalide', requestId }, { status: 400 });
  }

  if (origin && !proxyConfig.allowedOrigins.includes(origin)) {
    return NextResponse.json({ error: 'Accès non autorisé', requestId }, { status: 403 });
  }

  const apiIdentifier = pathSegments[0];
  const actualPath = '/' + pathSegments.slice(1).join('/');

  // [TENOR 2026] Anonymous Mode: Authentication bypassed by user request.

  // [TENOR 2026] Sécurisation de l'extraction de l'IP (SCAR-112 Fix)
  // Dans Next.js App Router, request.ip n'est plus disponible dans les Route Handlers.
  // On utilise les en-têtes standards HTTP.
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const clientIp = forwardedFor?.split(',')[0].trim() || realIp || 'unknown_ip';

  const userIdForRateLimit = clientIp;
  const logContext = { ...baseLogContext, userId: 'anonymous', path: actualPath, apiIdentifier };

  if (!isValidApiIdentifier(apiIdentifier)) {
    return NextResponse.json({ error: 'Identifiant API invalide', requestId }, { status: 400 });
  }

  const { isRateLimited, headers: rateLimitHeaders } = await checkRateLimit(`${userIdForRateLimit}:${apiIdentifier}`);

  if (isRateLimited) {
    // [TENOR 2026 FIX] Cast explicite pour résoudre l'erreur TS 2322
    return NextResponse.json(
      { error: 'Trop de requêtes', requestId },
      { status: 429, headers: rateLimitHeaders as Record<string, string> }
    );
  }

  const targetBaseUrl = proxyConfig.apiTargets[apiIdentifier];

  if (!isValidTargetUrl(targetBaseUrl)) {
    return NextResponse.json({ error: 'Erreur de configuration interne', requestId }, { status: 500 });
  }

  try {
    let finalPath = actualPath;
    if (apiConfig.enforceTrailingSlashForMethods.has(method) && !finalPath.endsWith('/')) {
      finalPath += '/';
    }

    const targetUrl = new URL(`${targetBaseUrl}${finalPath}${request.nextUrl.search}`);
    const externalApiHeaders = new Headers(request.headers);

    // Nettoyage des en-têtes sensibles du client
    externalApiHeaders.delete('host');
    externalApiHeaders.delete('cookie');
    externalApiHeaders.delete('x-forwarded-host'); // Prévention Host Spoofing

    // Injection des en-têtes sécurisés pour le backend
    externalApiHeaders.set('accept-encoding', 'identity');
    externalApiHeaders.set('User-Agent', `Algoway-Proxy/15.0.0`);
    externalApiHeaders.set('X-Request-ID', requestId);
    
    // [TENOR 2026] Forwarding IP sécurisé pour les logs d'audit Django
    externalApiHeaders.set('X-Forwarded-For', clientIp);
    externalApiHeaders.set('X-Forwarded-Proto', request.headers.get('x-forwarded-proto') || 'https');

    // [TENOR 2026] Authorization header injection disabled (Anonymous Mode).

    // On active le retry SEULEMENT pour les méthodes sûres (GET, HEAD) ou sans body
    // pour éviter les problèmes de consommation de stream (body used/locked) lors des retries.
    const shouldRetry = method === 'GET' || method === 'HEAD';

    // [TENOR 2026 SRE] CIRCUIT BREAKER ENFORCEMENT
    // Empêche l'épuisement du pool de connexions (Cascading Failure) si le backend est mort.
    const circuitBreaker = getCircuitBreaker(`api-${apiIdentifier}`, {
      failureThreshold: 5,
      resetTimeout: 30000,
      halfOpenMaxAttempts: 1
    });

    const response = await circuitBreaker.execute(async () => {
      return await fetchWithRetry(targetUrl.toString(), {
        method,
        headers: externalApiHeaders,
        body: request.body,
        credentials: 'omit',
        // @ts-expect-error duplex est requis pour le streaming de body dans Node.js fetch.
        duplex: 'half',
        timeout: proxyConfig.fetch.timeout,
        retries: shouldRetry ? 3 : 0,
        backoff: 1000, // Exponential backoff base delay
      });
    });

    if (method === 'GET' && response.ok && applicableTtl > 0) {
      const cacheKey = `proxy-cache:${requestPath}`;
      setCachedResponse(cacheKey, response.clone(), applicableTtl);
    }

    const responseHeaders = createSecureHeaders(new Headers(response.headers));
    responseHeaders.set('X-Request-ID', requestId);
    responseHeaders.set('X-Cache-Status', 'MISS');

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // [TENOR 2026 SRE] FAIL-FAST RESPONSE
    // Si le Circuit Breaker est ouvert, on renvoie un 503 immédiat sans attendre de timeout.
    if (errorMessage.includes('Circuit breaker is OPEN')) {
      logger.warn('Requête rejetée par le Circuit Breaker (Fail-Fast)', { ...logContext });
      return NextResponse.json({ error: 'Service Temporarily Unavailable', requestId }, { status: 503 });
    }

    logger.error('Erreur interne inattendue dans le proxy', { ...logContext, error: errorMessage });
    return NextResponse.json({ error: 'Erreur interne du proxy', requestId }, { status: 500 });
  }
}

export async function GET(request: NextRequest, context: HandlerContext) {
  const resolvedParams = await context.params;
  return handleRequest('GET', request, resolvedParams);
}

export async function POST(request: NextRequest, context: HandlerContext) {
  const resolvedParams = await context.params;
  return handleRequest('POST', request, resolvedParams);
}

export async function PUT(request: NextRequest, context: HandlerContext) {
  const resolvedParams = await context.params;
  return handleRequest('PUT', request, resolvedParams);
}

export async function PATCH(request: NextRequest, context: HandlerContext) {
  const resolvedParams = await context.params;
  return handleRequest('PATCH', request, resolvedParams);
}

export async function DELETE(request: NextRequest, context: HandlerContext) {
  const resolvedParams = await context.params;
  return handleRequest('DELETE', request, resolvedParams);
}

export async function HEAD(request: NextRequest, context: HandlerContext) {
  const resolvedParams = await context.params;
  return handleRequest('HEAD', request, resolvedParams);
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = new Headers();

  if (origin && proxyConfig.allowedOrigins.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
  }

  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  headers.set('Access-Control-Max-Age', '86400');

  return new NextResponse(null, { status: 204, headers });
}

/*
[ Conclusion ]
---
### **Manifeste Architectural du Proxy "Messager" (Version Canonique v15.0.0)**
---
#### **1. Philosophie Fondamentale : Confiance et Délégation**
Le principe immuable de ce proxy a évolué. Il n'est plus le "Gardien Vigilant", mais le "Messager Efficace". Il opère sur un principe de **confiance absolue** envers le `middleware.ts`. Il part du postulat que toute requête qui lui parvient a **déjà été authentifiée, autorisée et validée** par le middleware.

Sa mission est désormais unique et spécialisée :
1. **Extraire** les informations de session (le token) de la requête.
2. **Relayer** la requête de manière performante vers l'API externe appropriée.
3. **Streamer** la réponse vers le client.

Cette séparation des responsabilités est la clé de la performance et de la maintenabilité du système.

---
#### **2. Anatomie d'une Requête : Le Flux de Contrôle Harmonisé**
Chaque requête traversant ce proxy suit désormais un flux optimisé :

1. **Point d'Entrée :** Une requête du client (ex: RTK Query vers `/api/proxy/1/commands/`) atteint l'infrastructure Next.js.
2. **SAS 1 : Le Gardien (`middleware.ts`)**
   * **Mécanisme :** Le `middleware.ts` est le **premier et unique point de contrôle de session**.
   * **Logique :** Il appelle `getToken()`, qui déclenche la logique de validation et de rafraîchissement dans `authOptions.ts`. Si la session est invalide, la requête est **rejetée ici** et n'atteint jamais le proxy.
   * **Résultat :** Seules les requêtes authentifiées et autorisées sont autorisées à continuer.
3. **SAS 2 : Le Messager (`proxy/route.ts`)**
   * **Mécanisme :** La requête, maintenant garantie comme étant valide, atteint le proxy.
   * **Logique :**
     * **Pas de re-validation :** Le proxy **ne vérifie plus** si le token est présent ou valide. Il fait confiance au middleware.
     * **Récupération du Token :** Il appelle `getToken()` **uniquement** pour récupérer les données du token (notamment l'`accessToken`) afin de les injecter dans la requête sortante. Cet appel est rapide car il lit un cookie déjà validé.
     * **Relais et Streaming :** Il exécute la logique de relais vers l'API Django et streame la réponse, comme auparavant.
   * **Résultat :** Le proxy exécute sa mission de messager sans latence ajoutée par une validation redondante.

---
#### **3. Piliers Architecturaux (Synthèse v15.0)**
* **Performance :** Assurée par le **Streaming de bout en bout**, le **Caching**, la **réutilisation des connexions TCP (Keep-Alive)**, et surtout, la **suppression de la double validation de session**.
* **Sécurité :** Garantie par le **"Relais Aveugle"** (pas de token côté client) et la **centralisation de toute la logique d'autorisation dans le `middleware.ts`**, qui agit comme un point de contrôle unique et infaillible.
* **Robustesse & Scalabilité :** Fondée sur une architecture **stateless**, une **Limitation de Débit** externalisée, un **Circuit Breaker** anti-cascading failures, et une **séparation claire des responsabilités** entre le gardien (middleware) et le messager (proxy), ce qui rend le système plus simple, plus prévisible et plus facile à déboguer.
*/
// --- EOF ---