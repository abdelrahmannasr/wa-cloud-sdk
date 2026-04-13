import { WhatsAppError } from '../errors/errors.js';

// Prefer the monotonic clock (unaffected by NTP adjustments) when available,
// falling back to Date.now for exotic runtimes. performance.now is a global
// on Node 16+ and modern browsers.
const monotonicNow: () => number =
  typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? () => performance.now()
    : () => Date.now();

export interface RateLimiterConfig {
  /** Maximum tokens in the bucket (burst capacity) */
  readonly maxTokens: number;
  /** Tokens added per second (sustained rate) */
  readonly refillRate: number;
}

interface QueueEntry {
  resolve: () => void;
  reject: (error: Error) => void;
}

export class TokenBucketRateLimiter {
  private tokens: number;
  private lastRefillTimestamp: number;
  private readonly maxTokens: number;
  private readonly refillRate: number;
  private readonly queue: QueueEntry[];
  private drainTimer: ReturnType<typeof setTimeout> | null;
  private destroyed: boolean;

  constructor(config: RateLimiterConfig) {
    this.maxTokens = config.maxTokens;
    this.refillRate = config.refillRate;
    this.tokens = config.maxTokens;
    this.lastRefillTimestamp = monotonicNow();
    this.queue = [];
    this.drainTimer = null;
    this.destroyed = false;
  }

  /**
   * Acquire a token. Returns a Promise that resolves when a token is available.
   * If no tokens are available, the request is queued.
   */
  async acquire(): Promise<void> {
    if (this.destroyed) {
      throw new WhatsAppError('Rate limiter has been destroyed', 'RATE_LIMITER_DESTROYED');
    }

    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }

    return new Promise<void>((resolve, reject) => {
      this.queue.push({ resolve, reject });
      this.scheduleDrain();
    });
  }

  /**
   * Try to acquire a token immediately. Returns true if successful, false otherwise.
   */
  tryAcquire(): boolean {
    if (this.destroyed) {
      return false;
    }

    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }

    return false;
  }

  /** Number of currently available tokens. */
  get availableTokens(): number {
    this.refill();
    return Math.floor(this.tokens);
  }

  /** Cancel all pending requests in the queue. */
  reset(): void {
    const queuedEntries = this.queue.splice(0);
    for (const entry of queuedEntries) {
      entry.reject(new WhatsAppError('Rate limiter was reset', 'RATE_LIMITER_RESET'));
    }
    this.tokens = this.maxTokens;
    this.lastRefillTimestamp = monotonicNow();
    if (this.drainTimer !== null) {
      clearTimeout(this.drainTimer);
      this.drainTimer = null;
    }
  }

  /** Destroy the rate limiter, clearing timers and rejecting pending requests. */
  destroy(): void {
    this.destroyed = true;
    if (this.drainTimer !== null) {
      clearTimeout(this.drainTimer);
      this.drainTimer = null;
    }
    const queuedEntries = this.queue.splice(0);
    for (const entry of queuedEntries) {
      entry.reject(new WhatsAppError('Rate limiter has been destroyed', 'RATE_LIMITER_DESTROYED'));
    }
  }

  private refill(): void {
    const now = monotonicNow();
    // Clamp to handle any residual non-monotonic edge case (e.g. a mocked
    // clock). Always advance lastRefillTimestamp so the bucket cannot stall.
    const elapsed = Math.max(0, (now - this.lastRefillTimestamp) / 1000);
    const tokensToAdd = elapsed * this.refillRate;

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    }
    this.lastRefillTimestamp = now;
  }

  private scheduleDrain(): void {
    if (this.drainTimer !== null || this.destroyed) {
      return;
    }

    const msPerToken = 1000 / this.refillRate;

    this.drainTimer = setTimeout(() => {
      this.drainTimer = null;
      this.drainQueue();
    }, msPerToken);
  }

  private drainQueue(): void {
    if (this.destroyed) {
      return;
    }

    this.refill();

    while (this.queue.length > 0 && this.tokens >= 1) {
      this.tokens -= 1;
      const entry = this.queue.shift();
      entry?.resolve();
    }

    if (this.queue.length > 0) {
      this.scheduleDrain();
    }
  }
}
