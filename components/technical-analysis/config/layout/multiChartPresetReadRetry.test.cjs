/* eslint-env node */
const assert = require("node:assert/strict");
const test = require("node:test");

require("../../store/__tests__/testTypeScriptLoader.cjs");

const {
  readPresetWithBoundedRetry,
  shouldRetryPresetRead,
} = require("./multiChartPresetReadRetry.ts");

test("preset reads retry only transient transport/server failures", () => {
  assert.equal(shouldRetryPresetRead({ status: 500 }), true);
  assert.equal(shouldRetryPresetRead({ status: 503 }), true);
  assert.equal(shouldRetryPresetRead({ status: "FETCH_ERROR" }), true);
  assert.equal(shouldRetryPresetRead({ status: "TIMEOUT_ERROR" }), true);
  assert.equal(shouldRetryPresetRead({ status: 404 }), false);
  assert.equal(shouldRetryPresetRead(new Error("semantic failure")), false);
});

test("preset read succeeds after one transient 500 and forces a bounded second attempt", async () => {
  const attempts = [];
  const sleeps = [];
  const result = await readPresetWithBoundedRetry(async (attempt) => {
    attempts.push(attempt);
    if (attempt === 1) throw { status: 500 };
    return "ok";
  }, {
    delaysMs: [10, 20],
    sleep: async (delay) => { sleeps.push(delay); },
  });

  assert.equal(result, "ok");
  assert.deepEqual(attempts, [1, 2]);
  assert.deepEqual(sleeps, [10]);
});

test("preset read does not retry deterministic client errors", async () => {
  let attempts = 0;
  await assert.rejects(
    () => readPresetWithBoundedRetry(async () => {
      attempts += 1;
      throw { status: 400 };
    }, { sleep: async () => {} }),
  );
  assert.equal(attempts, 1);
});

test("preset read stops after the configured retry budget", async () => {
  const attempts = [];
  await assert.rejects(
    () => readPresetWithBoundedRetry(async (attempt) => {
      attempts.push(attempt);
      throw { status: 502 };
    }, { maxAttempts: 3, delaysMs: [0, 0], sleep: async () => {} }),
  );
  assert.deepEqual(attempts, [1, 2, 3]);
});
