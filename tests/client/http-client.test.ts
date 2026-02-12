import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpClient } from '../../src/client/http-client.js';
import type { WhatsAppConfig } from '../../src/client/types.js';
import { ApiError, AuthenticationError, RateLimitError } from '../../src/errors/errors.js';

const BASE_CONFIG: WhatsAppConfig = {
  accessToken: 'test-token',
  phoneNumberId: '123456',
  rateLimitConfig: { enabled: false },
  retryConfig: { maxRetries: 0 },
  timeoutMs: 5000,
};

function createMockResponse(
  data: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    json: vi.fn().mockResolvedValue(data),
    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
    text: vi.fn().mockResolvedValue(JSON.stringify(data)),
  } as unknown as Response;
}

describe('HttpClient', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('URL construction', () => {
    it('should build the correct URL with default base and version', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true }));
      const client = new HttpClient(BASE_CONFIG);

      await client.get('123456/messages');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://graph.facebook.com/v21.0/123456/messages',
        expect.objectContaining({ method: 'GET' }),
      );
      client.destroy();
    });

    it('should use custom base URL and API version', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true }));
      const client = new HttpClient({
        ...BASE_CONFIG,
        baseUrl: 'https://custom.api.com',
        apiVersion: 'v22.0',
      });

      await client.get('test/path');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://custom.api.com/v22.0/test/path',
        expect.objectContaining({ method: 'GET' }),
      );
      client.destroy();
    });

    it('should append query parameters', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true }));
      const client = new HttpClient(BASE_CONFIG);

      await client.get('path', { params: { limit: '10', offset: '5' } });

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      const url = new URL(calledUrl);
      expect(url.searchParams.get('limit')).toBe('10');
      expect(url.searchParams.get('offset')).toBe('5');
      client.destroy();
    });
  });

  describe('Authentication', () => {
    it('should include Authorization header in all requests', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true }));
      const client = new HttpClient(BASE_CONFIG);

      await client.get('test');

      const calledOptions = mockFetch.mock.calls[0]![1] as RequestInit;
      expect(calledOptions.headers).toEqual(
        expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      );
      client.destroy();
    });

    it('should include custom headers alongside auth', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true }));
      const client = new HttpClient(BASE_CONFIG);

      await client.get('test', { headers: { 'X-Custom': 'value' } });

      const calledOptions = mockFetch.mock.calls[0]![1] as RequestInit;
      expect(calledOptions.headers).toEqual(
        expect.objectContaining({
          Authorization: 'Bearer test-token',
          'X-Custom': 'value',
        }),
      );
      client.destroy();
    });
  });

  describe('HTTP methods', () => {
    it('should make GET requests', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ id: '1' }));
      const client = new HttpClient(BASE_CONFIG);

      const result = await client.get<{ id: string }>('test');

      expect(mockFetch.mock.calls[0]![1]).toEqual(expect.objectContaining({ method: 'GET' }));
      expect(result.data).toEqual({ id: '1' });
      expect(result.status).toBe(200);
      client.destroy();
    });

    it('should make POST requests with JSON body', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ created: true }));
      const client = new HttpClient(BASE_CONFIG);
      const body = { messaging_product: 'whatsapp', to: '1234567890' };

      await client.post('123/messages', body);

      const calledOptions = mockFetch.mock.calls[0]![1] as RequestInit;
      expect(calledOptions.method).toBe('POST');
      expect(calledOptions.body).toBe(JSON.stringify(body));
      expect(calledOptions.headers).toEqual(
        expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      );
      client.destroy();
    });

    it('should make DELETE requests', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true }));
      const client = new HttpClient(BASE_CONFIG);

      await client.delete('media/123');

      expect(mockFetch.mock.calls[0]![1]).toEqual(expect.objectContaining({ method: 'DELETE' }));
      client.destroy();
    });

    it('should not include body for GET requests', async () => {
      mockFetch.mockResolvedValue(createMockResponse({}));
      const client = new HttpClient(BASE_CONFIG);

      await client.request('GET', 'test', { ignored: true });

      const calledOptions = mockFetch.mock.calls[0]![1] as RequestInit;
      expect(calledOptions.body).toBeUndefined();
      client.destroy();
    });
  });

  describe('Error handling', () => {
    it('should throw AuthenticationError on 401', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse(
          {
            error: {
              message: 'Invalid OAuth access token',
              type: 'OAuthException',
              code: 190,
            },
          },
          401,
        ),
      );
      const client = new HttpClient(BASE_CONFIG);

      await expect(client.get('test')).rejects.toThrow(AuthenticationError);
      client.destroy();
    });

    it('should throw AuthenticationError on error code 190 regardless of status', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse(
          {
            error: {
              message: 'Token expired',
              type: 'OAuthException',
              code: 190,
            },
          },
          400,
        ),
      );
      const client = new HttpClient(BASE_CONFIG);

      await expect(client.get('test')).rejects.toThrow(AuthenticationError);
      client.destroy();
    });

    it('should throw RateLimitError on 429', async () => {
      expect.assertions(2);
      mockFetch.mockResolvedValue(
        createMockResponse(
          {
            error: {
              message: 'Too many requests',
              type: 'OAuthException',
              code: 4,
            },
          },
          429,
          { 'Retry-After': '5' },
        ),
      );
      const client = new HttpClient(BASE_CONFIG);

      try {
        await client.get('test');
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError);
        expect((error as RateLimitError).retryAfterMs).toBe(5000);
      }
      client.destroy();
    });

    it('should throw RateLimitError on error code 4', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse(
          {
            error: {
              message: 'Rate limited',
              type: 'OAuthException',
              code: 4,
            },
          },
          400,
        ),
      );
      const client = new HttpClient(BASE_CONFIG);

      await expect(client.get('test')).rejects.toThrow(RateLimitError);
      client.destroy();
    });

    it('should throw ApiError on other error status codes', async () => {
      expect.assertions(5);
      mockFetch.mockResolvedValue(
        createMockResponse(
          {
            error: {
              message: 'Not found',
              type: 'GraphMethodException',
              code: 100,
              error_subcode: 33,
              fbtrace_id: 'trace123',
            },
          },
          404,
        ),
      );
      const client = new HttpClient(BASE_CONFIG);

      try {
        await client.get('test');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.statusCode).toBe(404);
        expect(apiError.errorType).toBe('GraphMethodException');
        expect(apiError.errorSubcode).toBe(33);
        expect(apiError.fbTraceId).toBe('trace123');
      }
      client.destroy();
    });

    it('should throw ApiError with UnknownError type on non-JSON error body', async () => {
      const mockResponse = {
        ok: false,
        status: 502,
        headers: new Headers(),
        json: vi.fn().mockRejectedValue(new SyntaxError('Unexpected token')),
      } as unknown as Response;
      mockFetch.mockResolvedValue(mockResponse);
      const client = new HttpClient(BASE_CONFIG);

      await expect(client.get('test')).rejects.toThrow(ApiError);
      await expect(
        client.get('test'),
      ).rejects.toMatchObject({
        message: 'HTTP 502 error',
        statusCode: 502,
        errorType: 'UnknownError',
      });
      client.destroy();
    });

    it('should handle malformed error response without error field', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({}, 500),
      );
      const client = new HttpClient(BASE_CONFIG);

      await expect(client.get('test')).rejects.toThrow(ApiError);
      await expect(client.get('test')).rejects.toMatchObject({
        message: 'HTTP 500 error',
        errorType: 'UnknownError',
      });
      client.destroy();
    });

    it('should throw ApiError on 500 server error', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse(
          {
            error: {
              message: 'Internal server error',
              type: 'ServerException',
              code: 1,
            },
          },
          500,
        ),
      );
      const client = new HttpClient(BASE_CONFIG);

      await expect(client.get('test')).rejects.toThrow(ApiError);
      client.destroy();
    });
  });

  describe('Upload', () => {
    it('should send FormData with auth header', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ id: 'media_123' }));
      const client = new HttpClient(BASE_CONFIG);

      const formData = new FormData();
      formData.append('file', new Blob(['test']), 'test.txt');
      formData.append('messaging_product', 'whatsapp');

      const result = await client.upload<{ id: string }>('123/media', formData);

      expect(result.data).toEqual({ id: 'media_123' });
      const calledOptions = mockFetch.mock.calls[0]![1] as RequestInit;
      expect(calledOptions.method).toBe('POST');
      expect(calledOptions.body).toBe(formData);
      expect(calledOptions.headers).toEqual(
        expect.objectContaining({ Authorization: 'Bearer test-token' }),
      );
      client.destroy();
    });
  });

  describe('Download', () => {
    it('should download media with auth header', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers(),
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(16)),
        json: vi.fn(),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);
      const client = new HttpClient(BASE_CONFIG);

      const result = await client.downloadMedia('https://media.example.com/file.jpg');

      expect(result.data).toBeInstanceOf(ArrayBuffer);
      expect(result.data.byteLength).toBe(16);
      const calledOptions = mockFetch.mock.calls[0]![1] as RequestInit;
      expect(calledOptions.headers).toEqual(
        expect.objectContaining({ Authorization: 'Bearer test-token' }),
      );
      client.destroy();
    });
  });

  describe('Rate limiting integration', () => {
    it('should acquire token before making request when enabled', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ ok: true }));
      const client = new HttpClient({
        ...BASE_CONFIG,
        rateLimitConfig: { enabled: true, maxTokens: 1, refillRate: 1 },
      });

      // First request should succeed
      await client.get('test');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      client.destroy();
    });

    it('should skip rate limiting when skipRateLimit is true', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ ok: true }));
      const client = new HttpClient({
        ...BASE_CONFIG,
        rateLimitConfig: { enabled: true, maxTokens: 1, refillRate: 1 },
      });

      await client.get('test');
      // Second request with skipRateLimit should succeed immediately
      await client.get('test', { skipRateLimit: true });

      expect(mockFetch).toHaveBeenCalledTimes(2);
      client.destroy();
    });
  });

  describe('Retry integration', () => {
    it('should retry on 500 errors when retries are enabled', async () => {
      vi.useFakeTimers();

      mockFetch
        .mockResolvedValueOnce(
          createMockResponse(
            { error: { message: 'Server error', type: 'ServerException', code: 1 } },
            500,
          ),
        )
        .mockResolvedValueOnce(createMockResponse({ success: true }));

      const client = new HttpClient({
        ...BASE_CONFIG,
        retryConfig: { maxRetries: 1, baseDelayMs: 100, jitterFactor: 0 },
      });

      const promise = client.get('test');
      await vi.advanceTimersByTimeAsync(100);

      const result = await promise;
      expect(result.data).toEqual({ success: true });
      expect(mockFetch).toHaveBeenCalledTimes(2);

      client.destroy();
      vi.useRealTimers();
    });

    it('should not retry when skipRetry is true', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse(
          { error: { message: 'Server error', type: 'ServerException', code: 1 } },
          500,
        ),
      );

      const client = new HttpClient({
        ...BASE_CONFIG,
        retryConfig: { maxRetries: 3 },
      });

      await expect(client.get('test', { skipRetry: true })).rejects.toThrow(ApiError);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      client.destroy();
    });
  });

  describe('Abort signal', () => {
    it('should abort immediately when passed an already-aborted signal', async () => {
      mockFetch.mockImplementation((_url: string, init?: RequestInit) => {
        if (init?.signal?.aborted) {
          return Promise.reject(new DOMException('The operation was aborted.', 'AbortError'));
        }
        return Promise.resolve(createMockResponse({ success: true }));
      });
      const client = new HttpClient(BASE_CONFIG);

      const controller = new AbortController();
      controller.abort('cancelled');

      await expect(
        client.get('test', { signal: controller.signal }),
      ).rejects.toThrow();

      client.destroy();
    });
  });

  describe('Destroy', () => {
    it('should clean up rate limiter on destroy', () => {
      const client = new HttpClient({
        ...BASE_CONFIG,
        rateLimitConfig: { enabled: true },
      });

      // Should not throw
      expect(() => client.destroy()).not.toThrow();
    });

    it('should handle destroy when rate limiter is disabled', () => {
      const client = new HttpClient(BASE_CONFIG);
      expect(() => client.destroy()).not.toThrow();
    });
  });
});
