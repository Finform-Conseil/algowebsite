// ================================================================================
// FICHIER : app/api/proxy/single-flight.test.mjs
// RÔLE   : Preuve exécutable du single-flight (anti-stampede, Blocage #4).
// RUN    : node --test app/api/proxy/single-flight.test.mjs
// ================================================================================
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SingleFlight } from './single-flight.mjs';

/** Petit deferred pour contrôler la résolution manuellement. */
function deferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

test('coalescing : k appels concurrents sur la même clé => 1 seule exécution', async () => {
  const sf = new SingleFlight();
  let calls = 0;
  const d = deferred();
  const fn = () => { calls++; return d.promise; };

  const p1 = sf.run('k', fn);
  const p2 = sf.run('k', fn);
  const p3 = sf.run('k', fn);
  assert.equal(sf.size, 1, 'un seul vol en cours');

  d.resolve('value');
  const [r1, r2, r3] = await Promise.all([p1, p2, p3]);

  assert.equal(calls, 1, 'fn exécutée une seule fois');
  assert.deepEqual([r1, r2, r3], ['value', 'value', 'value'], 'même résultat partagé');
});

test('nettoyage garanti : le vol est retiré après résolution (succès)', async () => {
  const sf = new SingleFlight();
  const d = deferred();
  const p = sf.run('k', () => d.promise);
  assert.equal(sf.size, 1);
  d.resolve('ok');
  await p;
  assert.equal(sf.size, 0, 'vol nettoyé après succès');
});

test('propagation d\'erreur : followers rejettent avec la MÊME erreur, puis nettoyage', async () => {
  const sf = new SingleFlight();
  let calls = 0;
  const d = deferred();
  const fn = () => { calls++; return d.promise; };

  const p1 = sf.run('k', fn);
  const p2 = sf.run('k', fn);
  const boom = new Error('backend down');
  d.reject(boom);

  await assert.rejects(p1, /backend down/);
  await assert.rejects(p2, /backend down/);
  assert.equal(calls, 1, 'une seule exécution malgré l\'échec');
  assert.equal(sf.size, 0, 'vol nettoyé même après échec (finally)');
});

test('clés distinctes => exécutions indépendantes et parallèles', async () => {
  const sf = new SingleFlight();
  let a = 0, b = 0;
  const da = deferred(), db = deferred();
  const pa = sf.run('a', () => { a++; return da.promise; });
  const pb = sf.run('b', () => { b++; return db.promise; });
  assert.equal(sf.size, 2, 'deux vols distincts');
  da.resolve('A'); db.resolve('B');
  assert.deepEqual(await Promise.all([pa, pb]), ['A', 'B']);
  assert.equal(a, 1); assert.equal(b, 1);
});

test('nouvelle vague après résolution => ré-exécution (le vol n\'est PAS un cache)', async () => {
  const sf = new SingleFlight();
  let calls = 0;
  const first = deferred();
  const p1 = sf.run('k', () => { calls++; return first.promise; });
  first.resolve('v1');
  await p1;

  const second = deferred();
  const p2 = sf.run('k', () => { calls++; return second.promise; });
  second.resolve('v2');
  assert.equal(await p2, 'v2');
  assert.equal(calls, 2, 'deux vagues séparées => deux exécutions');
});

test('borne OOM : au-delà de maxInFlight, dégradation gracieuse (exécution directe)', async () => {
  const sf = new SingleFlight({ maxInFlight: 2 });
  const dA = deferred(), dB = deferred(), dC = deferred();
  const pA = sf.run('A', () => dA.promise); // vol 1
  const pB = sf.run('B', () => dB.promise); // vol 2 (map pleine)
  assert.equal(sf.size, 2);

  let cCalls = 0;
  const pC = sf.run('C', () => { cCalls++; return dC.promise; }); // dépasse la borne
  assert.equal(sf.size, 2, 'C non enregistré (borne respectée)');
  assert.equal(cCalls, 1, 'C exécuté directement, sans coalescing');

  dA.resolve('a'); dB.resolve('b'); dC.resolve('c');
  assert.deepEqual(await Promise.all([pA, pB, pC]), ['a', 'b', 'c']);
});

test('size reflète fidèlement les vols en cours', async () => {
  const sf = new SingleFlight();
  assert.equal(sf.size, 0);
  const d = deferred();
  const p = sf.run('k', () => d.promise);
  assert.equal(sf.size, 1);
  d.resolve('x');
  await p;
  assert.equal(sf.size, 0);
});

test('onCoalesced : notifié UNIQUEMENT pour les followers, jamais pour le leader', async () => {
  const sf = new SingleFlight();
  let coalesced = 0;
  const d = deferred();
  const fn = () => d.promise;
  const onCoalesced = () => { coalesced++; };

  const pLeader = sf.run('k', fn, onCoalesced);   // leader => PAS notifié
  const pF1 = sf.run('k', fn, onCoalesced);        // follower => notifié
  const pF2 = sf.run('k', fn, onCoalesced);        // follower => notifié
  assert.equal(coalesced, 2, '2 followers notifiés, leader exclu');

  d.resolve('v');
  await Promise.all([pLeader, pF1, pF2]);
});

test('onCoalesced : une exception du callback ne casse pas le chemin de requête', async () => {
  const sf = new SingleFlight();
  const d = deferred();
  const fn = () => d.promise;
  const throwing = () => { throw new Error('metrics exploded'); };

  const pLeader = sf.run('k', fn);
  // Le follower avec callback défaillant doit tout de même recevoir le résultat.
  const pFollower = sf.run('k', fn, throwing);
  d.resolve('safe');
  assert.equal(await pFollower, 'safe', 'résultat livré malgré le callback en erreur');
  await pLeader;
});

test('onCoalesced : borne OOM ne notifie pas (exécution directe = pas un follower)', async () => {
  const sf = new SingleFlight({ maxInFlight: 1 });
  let coalesced = 0;
  const dA = deferred(), dB = deferred();
  const pA = sf.run('A', () => dA.promise);                     // vol 1 (map pleine)
  const pB = sf.run('B', () => dB.promise, () => { coalesced++; }); // dépasse => direct
  assert.equal(coalesced, 0, 'exécution directe n\'est pas un coalescing');
  dA.resolve('a'); dB.resolve('b');
  await Promise.all([pA, pB]);
});
