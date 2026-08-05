// ================================================================================
// FICHIER : app/api/proxy/metrics/route.ts
// RÔLE   : Endpoint d'OBSERVABILITÉ (Blocage d'échelle #4).
//          Expose l'instantané des métriques du proxy (latence p50/p95/p99,
//          hit-rate cache, requêtes coalescées, classes de statut) + l'état des
//          circuit breakers. READ-ONLY, sans effet de bord.
// ================================================================================
//
// ⚠️  SÉCURITÉ — SURFACE OPÉRATIONNELLE INTERNE :
//   Ces métriques révèlent la santé interne du système (taux d'erreur, latence,
//   état des dépendances). Elles ne doivent PAS être exposées publiquement.
//   Défenses appliquées ici :
//     1. Blocage de l'accès direct par navigation (sec-fetch-dest: document).
//     2. Contrôle d'origine (allowlist proxyConfig.allowedOrigins).
//     3. Réponse non-cacheable (no-store).
//   Note : ces métriques sont PAR ISOLATE (serverless) — elles ne reflètent que
//   l'instance courante, pas une vue globale du cluster. Pour une agrégation
//   multi-instances, brancher un backend de métriques (Prometheus/OTel).
// ================================================================================

import { NextRequest, NextResponse } from 'next/server';
import { proxyConfig } from '../config';
import { proxyMetrics } from '../runtime';
import { getCircuitBreakerSnapshots } from '@/shared/utils/circuit-breaker';

export async function GET(request: NextRequest): Promise<NextResponse> {
  // [DÉFENSE 1] Pas d'accès direct par navigation.
  if (request.headers.get('sec-fetch-dest') === 'document') {
    return NextResponse.redirect(new URL('/not-found', request.url));
  }

  // [DÉFENSE 2] Contrôle d'origine (si une origine est présente).
  const origin = request.headers.get('origin');
  if (origin && !proxyConfig.allowedOrigins.includes(origin)) {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    scope: 'per-isolate',
    proxy: proxyMetrics.snapshot(),
    circuitBreakers: getCircuitBreakerSnapshots(),
  };

  // [DÉFENSE 3] Jamais mis en cache (données volatiles + sensibles).
  return NextResponse.json(payload, {
    status: 200,
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
  });
}
// --- EOF ---
