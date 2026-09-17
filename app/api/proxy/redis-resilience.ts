export class RedisLatencyBudgetExceededError extends Error {
  readonly code = 'REDIS_LATENCY_BUDGET_EXCEEDED';
  readonly component: string;
  readonly operation: string;
  readonly budgetMs: number;

  constructor(component: string, operation: string, budgetMs: number) {
    super(`Redis ${component} ${operation} exceeded ${budgetMs}ms latency budget`);
    this.name = 'RedisLatencyBudgetExceededError';
    this.component = component;
    this.operation = operation;
    this.budgetMs = budgetMs;
  }
}

export const isRedisLatencyBudgetExceeded = (
  error: unknown,
): error is RedisLatencyBudgetExceededError =>
  error instanceof RedisLatencyBudgetExceededError ||
  (error instanceof Error &&
    (error as Error & { code?: string }).code === 'REDIS_LATENCY_BUDGET_EXCEEDED');

export const resolveRedisBudgetMs = (
  rawValue: string | undefined,
  fallbackMs: number,
  minMs = 100,
  maxMs = 5_000,
): number => {
  const parsed = Number.parseInt(rawValue ?? '', 10);
  const candidate = Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackMs;
  return Math.min(maxMs, Math.max(minMs, candidate));
};

export async function withRedisLatencyBudget<T>(
  operation: Promise<T>,
  options: { component: string; operation: string; budgetMs: number },
): Promise<T> {
  const startedAt = performance.now();
  const latencyError = () => new RedisLatencyBudgetExceededError(
    options.component,
    options.operation,
    options.budgetMs,
  );
  // Promise.race alone is not sufficient under event-loop starvation: both the
  // operation callback and the budget timer can become runnable late, allowing
  // an already-over-budget operation to resolve first. Re-check elapsed time on
  // successful completion so latency semantics remain correct under load.
  const budgetGuardedOperation = operation.then((value) => {
    if (performance.now() - startedAt >= options.budgetMs) throw latencyError();
    return value;
  });

  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      budgetGuardedOperation,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(latencyError()), options.budgetMs);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

type RedisGateState = 'closed' | 'latency-bypass' | 'failure-bypass';

type RedisGateOptions = {
  latencyBreachThreshold?: number;
  latencyCooldownMs?: number;
  failureCooldownMs?: number;
};

export type RedisFailureClassification = {
  kind: 'latency' | 'failure';
  opened: boolean;
  bypassMs: number;
};

export class RedisResilienceGate {
  private state: RedisGateState = 'closed';
  private openUntil = 0;
  private consecutiveLatencyBreaches = 0;
  private readonly latencyBreachThreshold: number;
  private readonly latencyCooldownMs: number;
  private readonly failureCooldownMs: number;

  constructor(options: RedisGateOptions = {}) {
    this.latencyBreachThreshold = Math.max(1, options.latencyBreachThreshold ?? 3);
    this.latencyCooldownMs = Math.max(1_000, options.latencyCooldownMs ?? 15_000);
    this.failureCooldownMs = Math.max(1_000, options.failureCooldownMs ?? 60_000);
  }

  canAttempt(now = Date.now()): boolean {
    if (this.state === 'closed') return true;
    if (now < this.openUntil) return false;

    this.state = 'closed';
    this.openUntil = 0;
    return true;
  }

  recordSuccess(): void {
    this.state = 'closed';
    this.openUntil = 0;
    this.consecutiveLatencyBreaches = 0;
  }

  recordFailure(error: unknown, now = Date.now()): RedisFailureClassification {
    if (isRedisLatencyBudgetExceeded(error)) {
      this.consecutiveLatencyBreaches += 1;
      if (this.consecutiveLatencyBreaches < this.latencyBreachThreshold) {
        return { kind: 'latency', opened: false, bypassMs: 0 };
      }

      this.state = 'latency-bypass';
      this.openUntil = now + this.latencyCooldownMs;
      this.consecutiveLatencyBreaches = 0;
      return { kind: 'latency', opened: true, bypassMs: this.latencyCooldownMs };
    }

    this.state = 'failure-bypass';
    this.openUntil = now + this.failureCooldownMs;
    this.consecutiveLatencyBreaches = 0;
    return { kind: 'failure', opened: true, bypassMs: this.failureCooldownMs };
  }

  snapshot(now = Date.now()) {
    return {
      state: this.state,
      remainingBypassMs: this.state === 'closed' ? 0 : Math.max(0, this.openUntil - now),
      consecutiveLatencyBreaches: this.consecutiveLatencyBreaches,
    } as const;
  }
}
