// ================================================================================
// FICHIER : src/app/api/proxy/security.ts (VERSION FINALE CORRIGÉE ET DURCIE)
// OPÉRATION : [SUTURE DÉFINITIVE - PERFORMANCE UNLOCK]
// ================================================================================

import { proxyConfig } from './config';

const securityLogger = {
  critical: (message: string, context: object) =>
    console.error(JSON.stringify({ level: 'CRITICAL', component: 'ProxySecurity', message, ...context })),
};

const ALLOWED_API_IDENTIFIERS = new Set(Object.keys(proxyConfig.apiTargets));

export function isValidApiIdentifier(identifier: string): boolean {
  const formatValid = /^[a-zA-Z0-9_-]+$/.test(identifier);
  const inAllowedList = ALLOWED_API_IDENTIFIERS.has(identifier);
  return formatValid && inAllowedList;
}

export function arePathSegmentsSafe(segments: string[]): boolean {
  for (const segment of segments) {
    if (segment === '' || segment === '.' || segment === '..' || segment.includes('\\')) {
      return false;
    }
  }
  return true;
}

export function isValidTargetUrl(url: string | undefined): url is string {
  if (!url) return false;

  try {
    const parsed = new URL(url);

    if (process.env.NODE_ENV === 'production') {
      if (parsed.protocol !== 'https:') return false;

      const hostname = parsed.hostname.toLowerCase();
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '::1' ||
        hostname.startsWith('10.') ||
        hostname.startsWith('192.168.') ||
        hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)
      ) {
        securityLogger.critical('Tentative de SSRF détectée et bloquée', {
          targetUrl: url,
          hostname: hostname,
        });
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

export function sanitizePath(path: string): string {
  const segments = path.split('/');
  const resolvedSegments: string[] = [];

  for (const segment of segments) {
    if (segment === '..') {
      resolvedSegments.pop();
    } else if (segment !== '.' && segment !== '') {
      resolvedSegments.push(segment);
    }
  }

  return resolvedSegments.join('/');
}

export function createSecureHeaders(originalHeaders: Headers): Headers {
  const headers = new Headers(originalHeaders);

  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // MODIFICATION : Ajout d'une Politique de Sécurité de Contenu (CSP) robuste
  // [TENOR 2026 FIX] SCAR-042 / LESSON-019 : Ajout de worker-src 'self' blob:;
  // Cela permet l'instanciation du Web Worker d'ECharts, libérant le thread principal
  // et restaurant les 60 FPS pour le moteur de rendu Canvas.
  // Les domaines légitimes (Google, Recaptcha, Upstash) sont explicitement autorisés.
  const csp = [
    "default-src 'self';",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://www.googletagmanager.com https://www.google.com https://www.gstatic.com https://www.recaptcha.net;",
    "worker-src 'self' blob:;",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net;",
    "img-src 'self' data: blob: https:;",
    "font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net https://anima-uploads.s3.amazonaws.com;",
    "connect-src 'self' https://api.algoway.online https://www.upstash.io https://www.google.com https://www.recaptcha.net;",
    "frame-src 'self' https://www.google.com https://www.recaptcha.net;",
    "object-src 'none';",
    "frame-ancestors 'none';",
    "form-action 'self';",
    "base-uri 'self';",
    "upgrade-insecure-requests;"
  ].join(' ');

  // Recommandation : Déployer d'abord en mode "Report-Only" pour collecter les violations sans les bloquer.
  // Remplacez 'Content-Security-Policy' par 'Content-Security-Policy-Report-Only' pour tester.
  headers.set('Content-Security-Policy', csp);

  headers.delete('server');
  headers.delete('x-powered-by');

  return headers;
}