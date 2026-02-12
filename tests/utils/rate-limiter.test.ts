import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TokenBucketRateLimiter } from '../../src/utils/rate-limiter.js';
import { WhatsAppError } from '../../src/errors/errors.js';

describe('TokenBucketRateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should start with maxTokens available', () => {
    const limiter = new TokenBucketRateLimiter({ maxTokens: 10, refillRate: 10 });
    expect(limiter.availableTokens).toBe(10);
    limiter.destroy();
  });

  it('should consume tokens on acquire', async () => {
    const limiter = new TokenBucketRateLimiter({ maxTokens: 5, refillRate: 5 });
    await limiter.acquire();
    expect(limiter.availableTokens).toBe(4);
    await limiter.acquire();
    expect(limiter.availableTokens).toBe(3);
    limiter.destroy();
  });

  it('should consume tokens on tryAcquire', () => {
    const limiter = new TokenBucketRateLimiter({ maxTokens: 2, refillRate: 2 });
    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.tryAcquire()).toBe(false);
    limiter.destroy();
  });

  it('should queue requests when tokens are exhausted', async () => {
    const limiter = new TokenBucketRateLimiter({ maxTokens: 1, refillRate: 1 });

    await limiter.acquire();
    expect(limiter.availableTokens).toBe(0);

    let resolved = false;
    const promise = limiter.acquire().then(() => {
      resolved = true;
    });

    expect(resolved).toBe(false);

    // Advance time to refill 1 token (1 second at rate of 1/s)
    vi.advanceTimersByTime(1000);

    await promise;
    expect(resolved).toBe(true);
    limiter.destroy();
  });

  it('should refill tokens over time', () => {
    const limiter = new TokenBucketRateLimiter({ maxTokens: 10, refillRate: 10 });

    // Consume all tokens
    for (let i = 0; i < 10; i++) {
      limiter.tryAcquire();
    }
    expect(limiter.availableTokens).toBe(0);

    // Advance 500ms — should refill 5 tokens (10/s * 0.5s)
    vi.advanceTimersByTime(500);
    expect(limiter.availableTokens).toBe(5);

    limiter.destroy();
  });

  it('should not exceed maxTokens on refill', () => {
    const limiter = new TokenBucketRateLimiter({ maxTokens: 5, refillRate: 10 });

    // Advance a long time
    vi.advanceTimersByTime(10000);
    expect(limiter.availableTokens).toBe(5);
    limiter.destroy();
  });

  it('should drain queued requests as tokens refill', async () => {
    const limiter = new TokenBucketRateLimiter({ maxTokens: 1, refillRate: 2 });

    await limiter.acquire();

    const results: number[] = [];
    const p1 = limiter.acquire().then(() => results.push(1));
    const p2 = limiter.acquire().then(() => results.push(2));

    // Advance 500ms — refills 1 token (2/s * 0.5s)
    vi.advanceTimersByTime(500);
    await p1;

    // Advance another 500ms for the second queued request
    vi.advanceTimersByTime(500);
    await p2;

    expect(results).toEqual([1, 2]);
    limiter.destroy();
  });

  it('should reject pending on reset', async () => {
    const limiter = new TokenBucketRateLimiter({ maxTokens: 1, refillRate: 1 });
    await limiter.acquire();

    const promise = limiter.acquire();
    limiter.reset();

    await expect(promise).rejects.toThrow(WhatsAppError);
    expect(limiter.availableTokens).toBe(1);
    limiter.destroy();
  });

  it('should reject pending on destroy', async () => {
    const limiter = new TokenBucketRateLimiter({ maxTokens: 1, refillRate: 1 });
    await limiter.acquire();

    const promise = limiter.acquire();
    limiter.destroy();

    await expect(promise).rejects.toThrow(WhatsAppError);
  });

  it('should throw on acquire after destroy', async () => {
    const limiter = new TokenBucketRateLimiter({ maxTokens: 5, refillRate: 5 });
    limiter.destroy();

    await expect(limiter.acquire()).rejects.toThrow('Rate limiter has been destroyed');
  });

  it('should return false on tryAcquire after destroy', () => {
    const limiter = new TokenBucketRateLimiter({ maxTokens: 5, refillRate: 5 });
    limiter.destroy();

    expect(limiter.tryAcquire()).toBe(false);
  });

  it('should handle burst capacity correctly', () => {
    const limiter = new TokenBucketRateLimiter({ maxTokens: 80, refillRate: 80 });

    // Burst: consume all 80 tokens using tryAcquire
    for (let i = 0; i < 80; i++) {
      expect(limiter.tryAcquire()).toBe(true);
    }

    expect(limiter.availableTokens).toBe(0);

    // 81st should fail
    expect(limiter.tryAcquire()).toBe(false);

    // Advance enough time for 1 token to refill (1/80s = 12.5ms)
    vi.advanceTimersByTime(13);
    expect(limiter.tryAcquire()).toBe(true);

    limiter.destroy();
  });
});
