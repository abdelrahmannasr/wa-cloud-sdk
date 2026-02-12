import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withRetry, calculateDelay, DEFAULT_RETRY_CONFIG } from '../../src/utils/retry.js';
import { ApiError, RateLimitError, ValidationError } from '../../src/errors/errors.js';

describe('calculateDelay', () => {
  it('should apply exponential backoff', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const config = { ...DEFAULT_RETRY_CONFIG, jitterFactor: 0 };
    expect(calculateDelay(0, config)).toBe(1000); // 1000 * 2^0
    expect(calculateDelay(1, config)).toBe(2000); // 1000 * 2^1
    expect(calculateDelay(2, config)).toBe(4000); // 1000 * 2^2
    expect(calculateDelay(3, config)).toBe(8000); // 1000 * 2^3

    vi.restoreAllMocks();
  });

  it('should clamp to maxDelayMs', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const config = { ...DEFAULT_RETRY_CONFIG, maxDelayMs: 5000, jitterFactor: 0 };
    expect(calculateDelay(0, config)).toBe(1000);
    expect(calculateDelay(3, config)).toBe(5000); // clamped
    expect(calculateDelay(10, config)).toBe(5000); // clamped

    vi.restoreAllMocks();
  });

  it('should add jitter within bounds', () => {
    vi.spyOn(Math, 'random').mockReturnValue(1);

    const config = { ...DEFAULT_RETRY_CONFIG, jitterFactor: 0.2 };
    // delay = 1000 + 1000 * 0.2 * 1 = 1200
    expect(calculateDelay(0, config)).toBe(1200);

    vi.restoreAllMocks();
  });
});

describe('withRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return result on first successful call', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await withRetry(fn);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on ApiError with status >= 500', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new ApiError('server error', 500, 'ServerException'))
      .mockResolvedValue('recovered');

    const promise = withRetry(fn, { baseDelayMs: 100, jitterFactor: 0 });
    await vi.advanceTimersByTimeAsync(100);

    const result = await promise;
    expect(result).toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should retry on RateLimitError', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new RateLimitError('too many requests'))
      .mockResolvedValue('ok');

    const promise = withRetry(fn, { baseDelayMs: 100, jitterFactor: 0 });
    await vi.advanceTimersByTimeAsync(100);

    const result = await promise;
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should use retryAfterMs from RateLimitError', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new RateLimitError('too many requests', 2000))
      .mockResolvedValue('ok');

    const promise = withRetry(fn, { baseDelayMs: 100, jitterFactor: 0 });

    // Should wait 2000ms (retryAfterMs), not 100ms (baseDelayMs)
    await vi.advanceTimersByTimeAsync(100);
    expect(fn).toHaveBeenCalledTimes(1); // not yet retried

    await vi.advanceTimersByTimeAsync(1900);

    const result = await promise;
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should NOT retry on non-retryable errors', async () => {
    const fn = vi.fn().mockRejectedValue(new ValidationError('bad input', 'phone'));

    await expect(withRetry(fn)).rejects.toThrow(ValidationError);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should NOT retry on ApiError with status < 500', async () => {
    const fn = vi.fn().mockRejectedValue(new ApiError('not found', 404, 'GraphMethodException'));

    await expect(withRetry(fn)).rejects.toThrow(ApiError);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should throw after max retries exhausted', async () => {
    const error = new ApiError('server error', 500, 'ServerException');
    const fn = vi.fn().mockImplementation(() => Promise.reject(error));

    let caughtError: unknown;
    const promise = withRetry(fn, { maxRetries: 2, baseDelayMs: 100, jitterFactor: 0 }).catch(
      (e: unknown) => {
        caughtError = e;
      },
    );

    // Advance through all retries
    await vi.advanceTimersByTimeAsync(100); // retry 1
    await vi.advanceTimersByTimeAsync(200); // retry 2
    await vi.advanceTimersByTimeAsync(400); // settle

    await promise;
    expect(caughtError).toBeInstanceOf(ApiError);
    expect(fn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  });

  it('should use custom isRetryable function', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new ValidationError('retry this'))
      .mockResolvedValue('ok');

    const promise = withRetry(fn, {
      baseDelayMs: 100,
      jitterFactor: 0,
      isRetryable: (error) => error instanceof ValidationError,
    });

    await vi.advanceTimersByTimeAsync(100);

    const result = await promise;
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should apply exponential backoff between retries', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new ApiError('error', 503, 'ServerException'))
      .mockRejectedValueOnce(new ApiError('error', 503, 'ServerException'))
      .mockResolvedValue('ok');

    vi.spyOn(Math, 'random').mockReturnValue(0);

    const promise = withRetry(fn, { baseDelayMs: 100, jitterFactor: 0 });

    // First retry after 100ms (100 * 2^0)
    await vi.advanceTimersByTimeAsync(100);
    expect(fn).toHaveBeenCalledTimes(2);

    // Second retry after 200ms (100 * 2^1)
    await vi.advanceTimersByTimeAsync(200);

    const result = await promise;
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);

    vi.restoreAllMocks();
  });
});
