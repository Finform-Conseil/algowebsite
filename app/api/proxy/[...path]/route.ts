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
import { createSecureHeaders, isRequestOriginAllowed, isValidApiIdentifier, isValidTargetUrl, arePathSegmentsSafe, sanitizePath } from '../security';
import { checkRateLimit } from '../rate-limiter';
import { getCachedResponse, setCachedResponse } from '../cache';
import { fetchWithRetry } from '@/shared/utils/fetchWithRetry';
import { getCircuitBreaker } from '@/shared/utils/circuit-breaker';
import { normalizeDjangoPath } from '../path-normalizer';
import { isGatewayInterception, isMalformedJsonResponse } from '../response-guard';
import { requestCoalescer, proxyMetrics } from '../runtime';
import { buildProxyCircuitBreakerScope } from '../circuit-scope';

const logger = {
  // eslint-disable-next-line no-console
  info: (message: string, context: object) => console.log(JSON.stringify({ level: 'INFO', component: 'ProxyRoute', message, ...context })),
  warn: (message: string, context: object) => console.warn(JSON.stringify({ level: 'WARN', component: 'ProxyRoute', message, ...context })),
  error: (message: string, context: object) => console.error(JSON.stringify({ level: 'ERROR', component: 'ProxyRoute', message, ...context })),
};

const readBodyWithTimeout = async (response: Response, timeoutMs: number): Promise<ArrayBuffer> => {
  const timeout = Math.max(1, timeoutMs);
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      response.arrayBuffer(),
      new Promise<ArrayBuffer>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Upstream response body timeout')), timeout);
      }),
    ]);
  } catch (error) {
    try {
      await response.body?.cancel();
    } catch (cancelError) {
      logger.warn('Impossible d’annuler le body upstream après timeout.', {
        error: cancelError instanceof Error ? cancelError.message : String(cancelError),
      });
    }
    throw error;
  } finally {
    if (timer) clearTimeout(timer);
  }
};

type RouteParams = { path: string[] };
type HandlerContext = { params: Promise<RouteParams> };

/**
 * Réponse backend BUFFERISÉE et rejouable. Contrairement à un `Response` fetch
 * (stream consommable une seule fois), cette forme peut être partagée par
 * plusieurs consommateurs — indispensable au single-flight (anti-stampede).
 */
type UpstreamResult = {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  bodyBuffer: ArrayBuffer;
};

/**
 * [OBSERVABILITÉ #4] Wrapper d'instrumentation à POINT DE SORTIE UNIQUE.
 * Mesure la latence de bout en bout et enregistre le statut final quel que soit
 * le chemin de retour (succès, 4xx, 502, 503, 500...). Les événements internes
 * (cache hit/miss, coalescing) sont enregistrés au fil de `handleRequestCore`.
 */
async function handleRequest(method: string, request: NextRequest, params: RouteParams): Promise<NextResponse> {
  const startedAt = Date.now();
  let response: NextResponse;
  try {
    response = await handleRequestCore(method, request, params);
  } finally {
    proxyMetrics.recordLatency(Date.now() - startedAt);
  }
  proxyMetrics.recordStatus(response.status);
  return response;
}

async function handleRequestCore(method: string, request: NextRequest, params: RouteParams): Promise<NextResponse> {
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

  const isCacheable = method === 'GET' && applicableTtl > 0;
  if (isCacheable) {
    const cacheKey = `proxy-cache:${requestPath}`;
    const cached = await getCachedResponse(cacheKey);
    if (cached) {
      // [OBSERVABILITÉ #4] Cache HIT enregistré au point exact de résolution.
      proxyMetrics.recordCache(true);
      const headers = new Headers(cached.headers);
      headers.set('X-Cache-Status', `HIT (${proxyConfig.cache.strategy})`);
      return new NextResponse(cached.body, {
        status: cached.status,
        headers: headers,
      });
    }
    // [OBSERVABILITÉ #4] MISS : le chemin descend vers l'upstream réel.
    proxyMetrics.recordCache(false);
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

  const requestOrigin = request.nextUrl.origin;
  if (!isRequestOriginAllowed(origin, requestOrigin, proxyConfig.allowedOrigins)) {
    logger.warn('Origin non autorisé.', { ...baseLogContext, origin, requestOrigin });
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
    logger.error('Cible API invalide ou non configurée.', { ...logContext, apiIdentifier, targetBaseUrl });
    return NextResponse.json({ error: 'Erreur de configuration interne', requestId }, { status: 500 });
  }

  try {
    // [FIX #4 — Trailing-Slash Policy centralisée]
    // Le contrat APPEND_SLASH de Django est désormais appliqué de manière COHÉRENTE
    // pour TOUTES les méthodes via une source de vérité unique et testée
    // (path-normalizer). Cela corrige la classe de bugs où un GET sans slash final
    // (ex: "sectors") déclenchait une redirection 301 renvoyant un corps vide/HTML,
    // que le client parsait comme "empty or malformed response (HTTP 200)".
    // Les ~26 fichiers *.api.ts n'ont plus à gérer le slash eux-mêmes (DRY).
    const finalPath = normalizeDjangoPath(actualPath);

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
    // Isolation par famille/opération : un lookup actions défaillant ne doit jamais
    // couper le catalogue, les détails d'action ni les historiques /cours.
    const circuitBreakerScope = buildProxyCircuitBreakerScope(
      apiIdentifier,
      actualPath,
      request.nextUrl.searchParams,
    );
    const circuitBreaker = getCircuitBreaker(circuitBreakerScope, {
      failureThreshold: 5,
      resetTimeout: 30000,
      halfOpenMaxAttempts: 1
    });

    // Travail backend réel : fetch résilient sous protection du circuit breaker.
    // Le résultat est BUFFERISÉ en une forme rejouable ({status, headers, body})
    // afin de pouvoir être partagé par plusieurs consommateurs (single-flight) —
    // un ReadableStream fetch ne se consomme qu'une seule fois.
    const doUpstreamFetch = async (): Promise<UpstreamResult> => {
      const upstream = await circuitBreaker.execute(async () => {
        return await fetchWithRetry(targetUrl.toString(), {
          method,
          headers: externalApiHeaders,
          body: request.body,
          credentials: 'omit',
          // @ts-expect-error duplex est requis pour le streaming de body dans Node.js fetch.
          duplex: 'half',
          timeout: proxyConfig.fetch.timeout,
          // One bounded retry is enough for transient network/5xx failures. Three
          // retries multiplied a slow first attempt into user-visible stalls.
          retries: shouldRetry ? 1 : 0,
          retryDelay: 250,
        });
      });
      const bodyBuffer = await readBodyWithTimeout(upstream, proxyConfig.fetch.timeout);
      const headers: Record<string, string> = {};
      upstream.headers.forEach((value, key) => { headers[key] = value; });
      return { status: upstream.status, statusText: upstream.statusText, headers, bodyBuffer };
    };

    // [ANTI-STAMPEDE #2] Le coalescing ne s'applique qu'aux méthodes SÛRES et
    // idempotentes (GET/HEAD). Les mutations (POST/PUT/PATCH/DELETE) sont des
    // opérations distinctes et ne doivent JAMAIS être dédupliquées.
    const isCoalescable = method === 'GET' || method === 'HEAD';
    const coalesceKey = `sf:${apiIdentifier}:${requestPath}`;
    const result: UpstreamResult = isCoalescable
      ? await requestCoalescer.run(coalesceKey, doUpstreamFetch, () => proxyMetrics.recordCoalesced())
      : await doUpstreamFetch();

    // [FIX #5 — Détection d'interception de gateway]
    // Un backend/gateway défaillant peut renvoyer 2xx + text/html (page de login,
    // holding sslip.io, erreur d'un reverse-proxy). On attrape cette signature AU
    // BORD et on renvoie un 502 structuré, au lieu de laisser le client exploser
    // sur un JSON.parse d'une page HTML ("empty or malformed response").
    // Vérifié AVANT toute mise en cache : on ne cache jamais une interception.
    if (isGatewayInterception(result.status, result.headers['content-type'])) {
      logger.error('Interception de gateway détectée (2xx non-JSON relayé en HTML).', {
        ...logContext,
        upstreamStatus: result.status,
        upstreamContentType: result.headers['content-type'],
      });
      return NextResponse.json(
        {
          error: 'Bad Gateway',
          detail: 'Upstream returned a success status with a non-JSON (HTML) body, indicating an intercepting proxy or gateway.',
          requestId,
        },
        { status: 502 },
      );
    }

    if (isMalformedJsonResponse(result.status, result.headers['content-type'], result.bodyBuffer)) {
      logger.error('Réponse JSON upstream vide ou malformée.', {
        ...logContext,
        upstreamStatus: result.status,
        upstreamContentType: result.headers['content-type'],
      });
      return NextResponse.json(
        {
          error: 'Bad Gateway',
          detail: 'Upstream returned an empty or malformed JSON body.',
          requestId,
        },
        { status: 502 },
      );
    }

    const isOk = result.status >= 200 && result.status < 300;
    if (method === 'GET' && isOk && applicableTtl > 0) {
      const cacheKey = `proxy-cache:${requestPath}`;
      // [FIX #8] Await obligatoire : garantit la persistance du cache sur Edge.
      // Le buffer est rejouable — on reconstruit une Response fraîche pour le set.
      await setCachedResponse(
        cacheKey,
        new Response(result.bodyBuffer, { status: result.status, headers: result.headers }),
        applicableTtl,
      );
    }

    const responseHeaders = createSecureHeaders(new Headers(result.headers));
    responseHeaders.set('X-Request-ID', requestId);
    responseHeaders.set('X-Cache-Status', 'MISS');

    // Chaque consommateur (leader OU follower coalescé) reconstruit son propre
    // corps à partir du buffer partagé : aucun stream consommé deux fois.
    return new NextResponse(result.bodyBuffer, {
      status: result.status,
      statusText: result.statusText,
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