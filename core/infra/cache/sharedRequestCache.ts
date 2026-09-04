export interface SharedRequestCacheOptions {
  maxSettledEntries?: number;
  now?: () => number;
}

type SettledEntry = {
  value: unknown;
  expiresAt: number;
};

type SettledRead<T> =
  | { hit: true; value: T }
  | { hit: false };

/**
 * Session-scoped transport cache.
 *
 * This is deliberately NOT an OHLCV source of truth: Redux owns resolved market
 * series. This cache only coalesces identical transport requests and briefly
 * reuses settled API page responses so multiple chart consumers cannot fan out
 * duplicate network work.
 */
export class SharedRequestCache {
  private readonly inFlight = new Map<string, Promise<unknown>>();
  private readonly settled = new Map<string, SettledEntry>();
  private readonly maxSettledEntries: number;
  private readonly now: () => number;

  constructor(options: SharedRequestCacheOptions = {}) {
    const requestedMax = Number(options.maxSettledEntries ?? 256);
    this.maxSettledEntries = Number.isSafeInteger(requestedMax) && requestedMax > 0
      ? requestedMax
      : 256;
    this.now = options.now ?? Date.now;
  }

  getOrCreate<T>(key: string, factory: () => Promise<T>, ttlMs: number): Promise<T> {
    const settled = this.readSettled<T>(key);
    if (settled.hit) return Promise.resolve(settled.value);

    const existing = this.inFlight.get(key);
    if (existing) return existing as Promise<T>;

    const request = Promise.resolve().then(factory);
    this.inFlight.set(key, request as Promise<unknown>);

    void request.then(
      (value) => {
        if (this.inFlight.get(key) === request) this.inFlight.delete(key);
        const boundedTtl = Number.isFinite(ttlMs) ? Math.max(0, ttlMs) : 0;
        if (boundedTtl === 0) return;
        this.pruneExpired();
        this.settled.delete(key);
        this.settled.set(key, { value, expiresAt: this.now() + boundedTtl });
        this.evictOverflow();
      },
      () => {
        if (this.inFlight.get(key) === request) this.inFlight.delete(key);
      },
    );

    return request;
  }

  clear(): void {
    this.settled.clear();
  }

  get settledSize(): number {
    this.pruneExpired();
    return this.settled.size;
  }

  get inFlightSize(): number {
    return this.inFlight.size;
  }

  private readSettled<T>(key: string): SettledRead<T> {
    const entry = this.settled.get(key);
    if (!entry) return { hit: false };
    if (entry.expiresAt <= this.now()) {
      this.settled.delete(key);
      return { hit: false };
    }

    this.settled.delete(key);
    this.settled.set(key, entry);
    return { hit: true, value: entry.value as T };
  }

  private pruneExpired(): void {
    const now = this.now();
    for (const [key, entry] of this.settled) {
      if (entry.expiresAt <= now) this.settled.delete(key);
    }
  }

  private evictOverflow(): void {
    while (this.settled.size > this.maxSettledEntries) {
      const oldestKey = this.settled.keys().next().value as string | undefined;
      if (!oldestKey) return;
      this.settled.delete(oldestKey);
    }
  }
}
