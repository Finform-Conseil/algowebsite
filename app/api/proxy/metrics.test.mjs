// ================================================================================
// FICHIER : app/api/proxy/metrics.test.mjs
// RÔLE   : Preuve exécutable du collecteur de métriques (Observabilité #4).
// RUN    : node --test app/api/proxy/metrics.test.mjs
// ================================================================================
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ProxyMetrics, percentile } from './metrics.mjs';

test('percentile : nearest-rank correct sur un jeu connu', () => {
  const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  assert.equal(percentile(data, 50), 5);
  assert.equal(percentile(data, 95), 10);
  assert.equal(percentile(data, 99), 10);
  assert.equal(percentile(data, 0), 1);
  assert.equal(percentile(data, 100), 10);
});

test('percentile : tableau vide => 0 (pas de crash)', () => {
  assert.equal(percentile([], 99), 0);
});

test('latences : p50/p95/p99 estimés cohérents', () => {
  const m = new ProxyMetrics();
  for (let i = 1; i <= 100; i++) m.recordLatency(i);
  const s = m.snapshot();
  assert.equal(s.latencyMs.p50, 50);
  assert.equal(s.latencyMs.p95, 95);
  assert.equal(s.latencyMs.p99, 99);
  assert.equal(s.latencyMs.samples, 100);
});

test('latences : valeurs invalides ignorées (NaN, négatif, non-number)', () => {
  const m = new ProxyMetrics();
  m.recordLatency(NaN);
  m.recordLatency(-5);
  m.recordLatency('x');
  m.recordLatency(Infinity);
  assert.equal(m.snapshot().latencyMs.samples, 0);
});

test('réservoir borné : jamais plus de reservoirSize échantillons stockés', () => {
  const m = new ProxyMetrics({ reservoirSize: 50, rng: () => 0.999 });
  for (let i = 0; i < 100000; i++) m.recordLatency(i);
  assert.equal(m.snapshot().latencyMs.samples, 50, 'mémoire bornée à 50 malgré 100k observations');
});

test('hitRate : hits / (hits + misses)', () => {
  const m = new ProxyMetrics();
  assert.equal(m.hitRate, 0, 'aucun échantillon => 0');
  m.recordCache(true);
  m.recordCache(true);
  m.recordCache(true);
  m.recordCache(false);
  assert.equal(m.hitRate, 0.75);
  assert.equal(m.snapshot().cache.hitRate, 0.75);
});

test('statuts : classés par famille (2xx/4xx/5xx)', () => {
  const m = new ProxyMetrics();
  m.recordStatus(200); m.recordStatus(201);
  m.recordStatus(404);
  m.recordStatus(502); m.recordStatus(503);
  const s = m.snapshot();
  assert.equal(s.statusClasses['2xx'], 2);
  assert.equal(s.statusClasses['4xx'], 1);
  assert.equal(s.statusClasses['5xx'], 2);
  assert.equal(s.totalRequests, 5);
});

test('coalesced : compteur incrémenté', () => {
  const m = new ProxyMetrics();
  m.recordCoalesced(); m.recordCoalesced();
  assert.equal(m.snapshot().coalescedRequests, 2);
});

test('snapshot : instantané immuable (ne fuite pas l\'état interne)', () => {
  const m = new ProxyMetrics();
  m.recordStatus(200);
  const s = m.snapshot();
  s.statusClasses['2xx'] = 999; // mutation externe
  assert.equal(m.snapshot().statusClasses['2xx'], 1, 'état interne intact');
});

test('reset : remet tous les compteurs à zéro', () => {
  const m = new ProxyMetrics();
  m.recordLatency(10); m.recordCache(true); m.recordStatus(200); m.recordCoalesced();
  m.reset();
  const s = m.snapshot();
  assert.equal(s.totalRequests, 0);
  assert.equal(s.latencyMs.samples, 0);
  assert.equal(s.cache.hits, 0);
  assert.equal(s.coalescedRequests, 0);
});
