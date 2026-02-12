import { ApiError, RateLimitError } from '../errors/errors.js';

export interface RetryConfig {
  /** Maximum number of retries (default: 3) */
  readonly maxRetries: number;
  /** Base delay in ms (default: 1000) */
  readonly baseDelayMs: number;
  /** Maximum delay in ms (default: 30000) */
  readonly maxDelayMs: number;
  /** Jitter factor 0-1 (default: 0.2) */
  readonly jitterFactor: number;
  /** Function to determine if an error is retryable */
  readonly isRetryable?: (error: unknown) => boolean;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  jitterFactor: 0.2,
};

/**
 * Calculate delay with exponential backoff and jitter.
 * Formula: min(baseDelay * 2^attempt, maxDelay) * (1 + random * jitterFactor)
 */
export function calculateDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt);
  const clampedDelay = Math.min(exponentialDelay, config.maxDelayMs);
  const jitter = clampedDelay * config.jitterFactor * Math.random();
  return clampedDelay + jitter;
}

/**
 * Default retryable check: retry on RateLimitError and ApiError with status >= 500.
 */
function defaultIsRetryable(error: unknown): boolean {
  if (error instanceof RateLimitError) {
    return true;
  }
  if (error instanceof ApiError && error.statusCode >= 500) {
    return true;
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a function with retry logic.
 * Retries on 5xx errors and 429 (RateLimitError) by default.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config?: Partial<RetryConfig>,
): Promise<T> {
  const resolvedConfig: RetryConfig = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  };

  const isRetryable = resolvedConfig.isRetryable ?? defaultIsRetryable;
  let lastError: unknown;

  for (let attempt = 0; attempt <= resolvedConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;

      if (attempt >= resolvedConfig.maxRetries || !isRetryable(error)) {
        throw error;
      }

      let delayMs: number;

      if (error instanceof RateLimitError && error.retryAfterMs !== undefined) {
        delayMs = error.retryAfterMs;
      } else {
        delayMs = calculateDelay(attempt, resolvedConfig);
      }

      await sleep(delayMs);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
}
