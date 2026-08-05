// ================================================================================
// FICHIER : app/api/proxy/path-normalizer.test.mjs
// RÔLE   : Preuve exécutable des invariants de normalizeDjangoPath (Défaut #4).
// RUN    : node --test app/api/proxy/path-normalizer.test.mjs
// ================================================================================
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeDjangoPath } from './path-normalizer.mjs';

test('ajoute un slash final à une ressource sans slash (le bug d\'origine: "sectors")', () => {
  assert.equal(normalizeDjangoPath('sectors'), '/sectors/');
  assert.equal(normalizeDjangoPath('actions'), '/actions/');
  assert.equal(normalizeDjangoPath('currencies'), '/currencies/');
});

test('garantit un slash initial unique', () => {
  assert.equal(normalizeDjangoPath('/sectors'), '/sectors/');
  assert.equal(normalizeDjangoPath('//sectors'), '/sectors/');
  // Les slashes internes/finaux redondants ne sont PAS nettoyés ici : c'est la
  // responsabilité de sanitizePath() en amont (séparation des préoccupations).
  // On garantit uniquement l'unicité du slash de TÊTE.
  assert.equal(normalizeDjangoPath('///sectors'), '/sectors/');
});

test('préserve une ressource déjà correctement terminée (idempotence stricte)', () => {
  assert.equal(normalizeDjangoPath('/sectors/'), '/sectors/');
  assert.equal(normalizeDjangoPath('opcvms/topflop/'), '/opcvms/topflop/');
});

test('INVARIANT idempotence : normalize(normalize(p)) === normalize(p)', () => {
  const samples = [
    'sectors', '/sectors', '/sectors/', 'opcvms/topflop', 'indices/42/cours',
    'files/report.csv', '', '/', 'a/b/c', '//weird///path',
  ];
  for (const s of samples) {
    const once = normalizeDjangoPath(s);
    const twice = normalizeDjangoPath(once);
    assert.equal(twice, once, `non-idempotent pour "${s}": ${once} -> ${twice}`);
  }
});

test('gère les paths imbriqués multi-segments', () => {
  assert.equal(normalizeDjangoPath('opcvms/topflop'), '/opcvms/topflop/');
  assert.equal(normalizeDjangoPath('indices/42/cours'), '/indices/42/cours/');
  assert.equal(normalizeDjangoPath('opcvm-metrics'), '/opcvm-metrics/');
});

test('NE met PAS de slash sur un fichier à extension (Django statique -> 404 sinon)', () => {
  assert.equal(normalizeDjangoPath('files/report.csv'), '/files/report.csv');
  assert.equal(normalizeDjangoPath('data/SNTS.daily.csv'), '/data/SNTS.daily.csv');
  assert.equal(normalizeDjangoPath('export/x.pdf'), '/export/x.pdf');
  // slash final erroné sur un fichier => retiré
  assert.equal(normalizeDjangoPath('files/report.csv/'), '/files/report.csv');
});

test('cas de base : vide et racine => racine canonique', () => {
  assert.equal(normalizeDjangoPath(''), '/');
  assert.equal(normalizeDjangoPath('/'), '/');
});

test('un segment "point" en tête n\'est pas confondu avec une extension', () => {
  // dotIndex doit être > 0 : un segment commençant par "." n'est pas un "fichier"
  assert.equal(normalizeDjangoPath('v1/.well-known'), '/v1/.well-known/');
});

test('robustesse adversariale : slashes multiples internes préservés hors tête/queue', () => {
  // On ne "sur-nettoie" pas les slashes internes : responsabilité de sanitizePath en amont.
  const out = normalizeDjangoPath('a//b');
  assert.equal(out, '/a//b/');
  assert.equal(normalizeDjangoPath(out), out); // toujours idempotent
});
