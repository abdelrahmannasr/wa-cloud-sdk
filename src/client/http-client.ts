import type {
  WhatsAppConfig,
  RequestOptions,
  ApiResponse,
  HttpMethod,
  Logger,
  MetaApiErrorResponse,
} from './types.js';
import { TokenBucketRateLimiter } from '../utils/rate-limiter.js';
import { withRetry } from '../utils/retry.js';
import type { RetryConfig } from '../utils/retry.js';
import { ApiError, AuthenticationError, MediaError, RateLimitError } from '../errors/errors.js';

const DEFAULT_BASE_URL = 'https://graph.facebook.com';
const DEFAULT_API_VERSION = 'v21.0';
const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_ALLOWED_MEDIA_HOSTS: readonly string[] = [
  'lookaside.fbsbx.com',
  '.fbcdn.net',
  '.facebook.com',
  '.whatsapp.net',
];

const noopLogger: Logger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

export class HttpClient {
  private readonly baseUrl: string;
  private readonly apiVersion: string;
  private readonly accessToken: string;
  private readonly logger: Logger;
  private readonly timeoutMs: number;
  private readonly rateLimiter: TokenBucketRateLimiter | null;
  private readonly retryConfig: Partial<RetryConfig>;
  private readonly allowedMediaHosts: readonly string[];

  constructor(config: WhatsAppConfig) {
    this.accessToken = config.accessToken;
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
    this.apiVersion = config.apiVersion ?? DEFAULT_API_VERSION;
    this.logger = config.logger ?? noopLogger;
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.allowedMediaHosts = config.allowedMediaHosts ?? DEFAULT_ALLOWED_MEDIA_HOSTS;

    // Set up rate limiter
    const rateLimitEnabled = config.rateLimitConfig?.enabled !== false;
    if (rateLimitEnabled) {
      this.rateLimiter = new TokenBucketRateLimiter({
        maxTokens: config.rateLimitConfig?.maxTokens ?? 80,
        refillRate: config.rateLimitConfig?.refillRate ?? 80,
      });
    } else {
      this.rateLimiter = null;
    }

    // Store retry config (pass through only if provided — avoids undefined overriding defaults)
    this.retryConfig = config.retryConfig ?? {};
  }

  /**
   * Make an authenticated request to the Meta Graph API.
   */
  async request<T>(
    method: HttpMethod,
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path, options?.params);
    const headers = this.buildHeaders(options);

    if (body !== undefined && method !== 'GET') {
      headers['Content-Type'] = 'application/json';
    }

    return this.executeWithLifecycle<T>(
      (signal) => {
        const fetchOptions: RequestInit = { method, headers, signal };
        if (body !== undefined && method !== 'GET') {
          fetchOptions.body = JSON.stringify(body);
        }
        this.logger.debug(`${method} ${url}`);
        return fetch(url, fetchOptions);
      },
      (response) => response.json() as Promise<T>,
      options,
    );
  }

  /** Convenience: GET request. */
  async get<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('GET', path, undefined, options);
  }

  /** Convenience: POST request. */
  async post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, body, options);
  }

  /** Convenience: DELETE request. */
  async delete<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', path, undefined, options);
  }

  /**
   * Upload a file via multipart/form-data.
   * Uses native FormData (Node 18+).
   */
  async upload<T>(
    path: string,
    formData: FormData,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path, options?.params);

    return this.executeWithLifecycle<T>(
      (signal) => {
        this.logger.debug(`POST (upload) ${url}`);
        return fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            ...options?.headers,
          },
          body: formData,
          signal,
        });
      },
      (response) => response.json() as Promise<T>,
      options,
    );
  }

  /**
   * Download binary data from a URL (for media downloads).
   * The URL must include the full path (not relative to the base URL).
   *
   * @remarks The bearer token is only sent to hosts in `allowedMediaHosts`
   * (defaults to Meta's CDN). Requests to other hosts throw `MediaError`
   * before any network call is made.
   */
  async downloadMedia(url: string, options?: RequestOptions): Promise<ApiResponse<ArrayBuffer>> {
    this.assertMediaHostAllowed(url);
    return this.executeWithLifecycle<ArrayBuffer>(
      (signal) => {
        this.logger.debug(`GET (download) ${url}`);
        return fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            ...options?.headers,
          },
          signal,
        });
      },
      (response) => response.arrayBuffer(),
      options,
    );
  }

  /** Destroy the client, cleaning up rate limiter timers. */
  destroy(): void {
    this.rateLimiter?.destroy();
  }

  private assertMediaHostAllowed(url: string): void {
    let hostname: string;
    try {
      hostname = new URL(url).hostname.toLowerCase();
    } catch {
      throw new MediaError(`Media URL is not a valid URL: "${url}"`);
    }

    const allowed = this.allowedMediaHosts.some((entry) => {
      const normalized = entry.toLowerCase();
      return normalized.startsWith('.')
        ? hostname.endsWith(normalized) || hostname === normalized.slice(1)
        : hostname === normalized;
    });

    if (!allowed) {
      throw new MediaError(
        `Refusing to send credentials to untrusted media host "${hostname}"`,
      );
    }
  }

  /**
   * Shared lifecycle for all request types: rate limit, timeout, signal forwarding,
   * error parsing, and retry.
   *
   * Rate limiting is applied once per logical request, not per retry attempt.
   * This models user-initiated throughput (e.g., "80 messages/second") rather than
   * raw HTTP calls. Retries from transient failures should not penalize the caller's
   * rate budget.
   */
  private async executeWithLifecycle<T>(
    executeFn: (signal: AbortSignal) => Promise<Response>,
    extractData: (response: Response) => Promise<T>,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    // Rate limiting (once per logical request, not per retry)
    if (!options?.skipRateLimit && this.rateLimiter) {
      await this.rateLimiter.acquire();
    }

    const execute = async (): Promise<ApiResponse<T>> => {
      const controller = new AbortController();
      const timeout = options?.timeoutMs ?? this.timeoutMs;

      const timeoutId = setTimeout(() => {
        controller.abort();
      }, timeout);

      // Forward external abort signal (handle already-aborted + { once: true } to prevent leaks)
      if (options?.signal) {
        if (options.signal.aborted) {
          controller.abort(options.signal.reason);
        } else {
          options.signal.addEventListener(
            'abort',
            () => {
              controller.abort(options.signal?.reason);
            },
            { once: true },
          );
        }
      }

      try {
        const response = await executeFn(controller.signal);

        if (!response.ok) {
          await this.handleErrorResponse(response);
        }

        const data = await extractData(response);

        return {
          data,
          status: response.status,
          headers: response.headers,
        };
      } finally {
        clearTimeout(timeoutId);
      }
    };

    if (options?.skipRetry) {
      return execute();
    }

    return withRetry(execute, this.retryConfig);
  }

  /**
   * Parse error body from a failed response. Wraps response.json() in try/catch
   * to handle non-JSON error bodies (e.g., 502 proxy errors, 503 load balancer).
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let errorBody: MetaApiErrorResponse | undefined;
    try {
      errorBody = (await response.json()) as MetaApiErrorResponse;
    } catch {
      throw new ApiError(`HTTP ${response.status} error`, response.status, 'UnknownError');
    }
    this.parseErrorResponse(response.status, errorBody, response.headers);
  }

  private buildUrl(path: string, params?: Record<string, string>): string {
    const url = new URL(`${this.apiVersion}/${path}`, this.baseUrl);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }

    return url.toString();
  }

  private buildHeaders(options?: RequestOptions): Record<string, string> {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      ...options?.headers,
    };
  }

  private parseErrorResponse(status: number, body: MetaApiErrorResponse, headers: Headers): never {
    const errorData = body.error;
    const message = errorData?.message ?? `HTTP ${status} error`;
    const errorType = errorData?.type ?? 'UnknownError';
    const errorCode = errorData?.code;
    const errorSubcode = errorData?.error_subcode;
    const fbTraceId = errorData?.fbtrace_id;

    // Authentication error (401 or error code 190)
    if (status === 401 || errorCode === 190) {
      throw new AuthenticationError(message);
    }

    // Rate limit error (429 or error code 4)
    if (status === 429 || errorCode === 4) {
      const retryAfterHeader = headers.get('Retry-After');
      const retryAfterMs = retryAfterHeader ? parseInt(retryAfterHeader, 10) * 1000 : undefined;
      throw new RateLimitError(message, retryAfterMs);
    }

    // Generic API error
    throw new ApiError(message, status, errorType, {
      errorSubcode,
      fbTraceId,
    });
  }
}
