const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");

const source = fs.readFileSync("core/infra/cache/sharedRequestCache.ts", "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const localModule = { exports: {} };
new Function("module", "exports", "require", compiled)(localModule, localModule.exports, require);
const { SharedRequestCache } = localModule.exports;

const flush = () => new Promise((resolve) => setImmediate(resolve));

test("coalesces concurrent producers into one in-flight request", async () => {
  const cache = new SharedRequestCache();
  let calls = 0;
  let release;
  const factory = () => {
    calls += 1;
    return new Promise((resolve) => { release = resolve; });
  };

  const first = cache.getOrCreate("same", factory, 1000);
  const second = cache.getOrCreate("same", factory, 1000);
  assert.equal(calls, 0, "factory starts in the next microtask");
  await Promise.resolve();
  assert.equal(calls, 1);
  assert.equal(first, second);
  release("ok");
  assert.equal(await first, "ok");
});

test("reuses a settled value inside TTL and refreshes after expiry", async () => {
  let now = 1000;
  const cache = new SharedRequestCache({ now: () => now });
  let calls = 0;
  const factory = async () => ++calls;

  assert.equal(await cache.getOrCreate("page", factory, 100), 1);
  await flush();
  assert.equal(await cache.getOrCreate("page", factory, 100), 1);
  assert.equal(calls, 1);

  now = 1101;
  assert.equal(await cache.getOrCreate("page", factory, 100), 2);
  assert.equal(calls, 2);
});

test("rejections are never stored as settled cache entries", async () => {
  const cache = new SharedRequestCache();
  let calls = 0;
  await assert.rejects(cache.getOrCreate("bad", async () => {
    calls += 1;
    throw new Error("boom");
  }, 1000), /boom/);
  await flush();

  assert.equal(await cache.getOrCreate("bad", async () => {
    calls += 1;
    return "recovered";
  }, 1000), "recovered");
  assert.equal(calls, 2);
});

test("settled cache is bounded and evicts the least recently used entry", async () => {
  const cache = new SharedRequestCache({ maxSettledEntries: 2 });
  let calls = 0;
  const load = (key) => cache.getOrCreate(key, async () => `${key}:${++calls}`, 1000);

  assert.equal(await load("a"), "a:1");
  assert.equal(await load("b"), "b:2");
  await flush();
  assert.equal(await load("a"), "a:1", "reading a promotes it");
  assert.equal(await load("c"), "c:3");
  await flush();
  assert.equal(cache.settledSize, 2);
  assert.equal(await load("b"), "b:4", "b was the least recently used entry");
});
