// ================================================================================
// FICHIER : app/api/proxy/response-guard.test.mjs
// RÔLE   : Preuve exécutable de isGatewayInterception (Défaut #5).
// RUN    : node --test app/api/proxy/response-guard.test.mjs
// ================================================================================
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isGatewayInterception, isMalformedJsonResponse } from './response-guard.mjs';

test('2xx + text/html => interception détectée (le cas du bug)', () => {
  assert.equal(isGatewayInterception(200, 'text/html'), true);
  assert.equal(isGatewayInterception(200, 'text/html; charset=utf-8'), true);
  assert.equal(isGatewayInterception(201, 'text/html'), true);
  assert.equal(isGatewayInterception(299, 'TEXT/HTML'), true); // insensible à la casse
});

test('2xx + application/json => OK (pas d\'interception)', () => {
  assert.equal(isGatewayInterception(200, 'application/json'), false);
  assert.equal(isGatewayInterception(200, 'application/json; charset=utf-8'), false);
});

test('2xx + exports légitimes (CSV/PDF/binaire/image) => OK, jamais bloqués', () => {
  assert.equal(isGatewayInterception(200, 'text/csv'), false);
  assert.equal(isGatewayInterception(200, 'application/pdf'), false);
  assert.equal(isGatewayInterception(200, 'application/octet-stream'), false);
  assert.equal(isGatewayInterception(200, 'image/png'), false);
  assert.equal(isGatewayInterception(200, 'text/plain'), false);
});

test('non-2xx => jamais signalé ici (géré/relayé ailleurs)', () => {
  assert.equal(isGatewayInterception(301, 'text/html'), false);
  assert.equal(isGatewayInterception(302, 'text/html'), false);
  assert.equal(isGatewayInterception(404, 'text/html'), false);
  assert.equal(isGatewayInterception(500, 'text/html'), false);
});

test('Content-Type absent/null => OK (on ne sur-bloque pas)', () => {
  assert.equal(isGatewayInterception(200, null), false);
  assert.equal(isGatewayInterception(200, undefined), false);
  assert.equal(isGatewayInterception(200, ''), false);
});

test('bornes de la classe 2xx', () => {
  assert.equal(isGatewayInterception(199, 'text/html'), false); // avant 2xx
  assert.equal(isGatewayInterception(200, 'text/html'), true);  // début 2xx
  assert.equal(isGatewayInterception(299, 'text/html'), true);  // fin 2xx
  assert.equal(isGatewayInterception(300, 'text/html'), false); // après 2xx
});

test('JSON vide ou tronqué en 2xx => réponse invalide', () => {
  const empty = new TextEncoder().encode('').buffer;
  const truncated = new TextEncoder().encode('{"data":').buffer;
  const valid = new TextEncoder().encode('{"data":[]}').buffer;
  assert.equal(isMalformedJsonResponse(200, 'application/json', empty), true);
  assert.equal(isMalformedJsonResponse(200, 'application/json; charset=utf-8', truncated), true);
  assert.equal(isMalformedJsonResponse(200, 'application/json', valid), false);
});

test('formats non JSON préservés', () => {
  const body = new TextEncoder().encode('binary-or-csv').buffer;
  assert.equal(isMalformedJsonResponse(200, 'text/csv', body), false);
  assert.equal(isMalformedJsonResponse(200, 'application/pdf', body), false);
  assert.equal(isMalformedJsonResponse(502, 'application/json', body), false);
});
