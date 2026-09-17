import assert from 'node:assert/strict';
import test from 'node:test';
import {
  RedisLatencyBudgetExceededError,
  RedisResilienceGate,
  isRedisLatencyBudgetExceeded,
  resolveRedisBudgetMs,
  withRedisLatencyBudget,
} from './redis-resilience.ts';

test('redis budget parser clamps invalid and extreme values', () => {
  assert.equal(resolveRedisBudgetMs(undefined, 500), 500);
  assert.equal(resolveRedisBudgetMs('50', 500), 100);
  assert.equal(resolveRedisBudgetMs('9000', 500), 5000);
  assert.equal(resolveRedisBudgetMs('not-a-number', 750), 750);
});

test('latency budget breach is typed and distinguishable from connection failure', async () => {
  await assert.rejects(
    withRedisLatencyBudget(
      new Promise((resolve) => setTimeout(resolve, 30)),
      { component: 'cache', operation: 'GET', budgetMs: 5 },
    ),
    (error) => {
      assert.equal(isRedisLatencyBudgetExceeded(error), true);
      assert.equal(error instanceof RedisLatencyBudgetExceededError, true);
      return true;
    },
  );
});

test('latency circuit opens only after repeated breaches and uses short cooldown', () => {
  const gate = new RedisResilienceGate({
    latencyBreachThreshold: 3,
    latencyCooldownMs: 15_000,
    failureCooldownMs: 60_000,
  });
  const error = new RedisLatencyBudgetExceededError('cache', 'GET', 500);

  assert.deepEqual(gate.recordFailure(error, 1000), { kind: 'latency', opened: false, bypassMs: 0 });
  assert.deepEqual(gate.recordFailure(error, 1001), { kind: 'latency', opened: false, bypassMs: 0 });
  assert.deepEqual(gate.recordFailure(error, 1002), { kind: 'latency', opened: true, bypassMs: 15_000 });
  assert.equal(gate.canAttempt(10_000), false);
  assert.equal(gate.canAttempt(16_002), true);
});

test('real Redis failure opens the long circuit immediately', () => {
  const gate = new RedisResilienceGate({ failureCooldownMs: 60_000 });
  assert.deepEqual(
    gate.recordFailure(new Error('ECONNRESET'), 10_000),
    { kind: 'failure', opened: true, bypassMs: 60_000 },
  );
  assert.equal(gate.canAttempt(69_999), false);
  assert.equal(gate.canAttempt(70_000), true);
});

test('success closes the gate and resets latency history', () => {
  const gate = new RedisResilienceGate({ latencyBreachThreshold: 2 });
  const error = new RedisLatencyBudgetExceededError('rate-limiter', 'MULTI', 750);
  gate.recordFailure(error, 0);
  gate.recordSuccess();
  assert.deepEqual(gate.snapshot(1), {
    state: 'closed',
    remainingBypassMs: 0,
    consecutiveLatencyBreaches: 0,
  });
});
