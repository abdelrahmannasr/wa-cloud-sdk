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
import { ApiError, AuthenticationError, RateLimitError } from '../errors/errors.js';

const DEFAULT_BASE_URL = 'https://graph.facebook.com';
const DEFAULT_API_VERSION = 'v21.0';
const DEFAULT_TIMEOUT_MS = 30000;

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

  constructor(config: WhatsAppConfig) {
    this.accessToken = config.accessToken;
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
    this.apiVersion = config.apiVersion ?? DEFAULT_API_VERSION;
    this.logger = config.logger ?? noopLogger;
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;

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

    // Store retry config
    this.retryConfig = {
      maxRetries: config.retryConfig?.maxRetries,
      baseDelayMs: config.retryConfig?.baseDelayMs,
      maxDelayMs: config.retryConfig?.maxDelayMs,
      jitterFactor: config.retryConfig?.jitterFactor,
    };
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
    // Rate limiting
    if (!options?.skipRateLimit && this.rateLimiter) {
      await this.rateLimiter.acquire();
    }

    const url = this.buildUrl(path, options?.params);
    const headers = this.buildHeaders(options);

    const executeRequest = async (): Promise<ApiResponse<T>> => {
      const controller = new AbortController();
      const timeout = options?.timeoutMs ?? this.timeoutMs;

      const timeoutId = setTimeout(() => {
        controller.abort();
      }, timeout);

      // Merge user signal with timeout signal
      if (options?.signal) {
        options.signal.addEventListener('abort', () => {
          controller.abort(options.signal?.reason);
        });
      }

      try {
        this.logger.debug(`${method} ${url}`);

        const fetchOptions: RequestInit = {
          method,
          headers,
          signal: controller.signal,
        };

        if (body !== undefined && method !== 'GET') {
          fetchOptions.body = JSON.stringify(body);
          (fetchOptions.headers as Record<string, string>)['Content-Type'] = 'application/json';
        }

        const response = await fetch(url, fetchOptions);

        if (!response.ok) {
          const errorBody = (await response.json()) as MetaApiErrorResponse;
          this.parseErrorResponse(response.status, errorBody, response.headers);
        }

        const data = (await response.json()) as T;

        this.logger.debug(`${method} ${url} -> ${response.status}`);

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
      return executeRequest();
    }

    return withRetry(executeRequest, this.retryConfig);
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
    if (!options?.skipRateLimit && this.rateLimiter) {
      await this.rateLimiter.acquire();
    }

    const url = this.buildUrl(path, options?.params);

    const executeUpload = async (): Promise<ApiResponse<T>> => {
      const controller = new AbortController();
      const timeout = options?.timeoutMs ?? this.timeoutMs;

      const timeoutId = setTimeout(() => {
        controller.abort();
      }, timeout);

      if (options?.signal) {
        options.signal.addEventListener('abort', () => {
          controller.abort(options.signal?.reason);
        });
      }

      try {
        this.logger.debug(`POST (upload) ${url}`);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            ...options?.headers,
          },
          body: formData,
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorBody = (await response.json()) as MetaApiErrorResponse;
          this.parseErrorResponse(response.status, errorBody, response.headers);
        }

        const data = (await response.json()) as T;

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
      return executeUpload();
    }

    return withRetry(executeUpload, this.retryConfig);
  }

  /**
   * Download binary data from a URL (for media downloads).
   * The URL must include the full path (not relative to the base URL).
   */
  async downloadMedia(url: string, options?: RequestOptions): Promise<ApiResponse<ArrayBuffer>> {
    if (!options?.skipRateLimit && this.rateLimiter) {
      await this.rateLimiter.acquire();
    }

    const executeDownload = async (): Promise<ApiResponse<ArrayBuffer>> => {
      const controller = new AbortController();
      const timeout = options?.timeoutMs ?? this.timeoutMs;

      const timeoutId = setTimeout(() => {
        controller.abort();
      }, timeout);

      if (options?.signal) {
        options.signal.addEventListener('abort', () => {
          controller.abort(options.signal?.reason);
        });
      }

      try {
        this.logger.debug(`GET (download) ${url}`);

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            ...options?.headers,
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorBody = (await response.json()) as MetaApiErrorResponse;
          this.parseErrorResponse(response.status, errorBody, response.headers);
        }

        const data = await response.arrayBuffer();

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
      return executeDownload();
    }

    return withRetry(executeDownload, this.retryConfig);
  }

  /** Destroy the client, cleaning up rate limiter timers. */
  destroy(): void {
    this.rateLimiter?.destroy();
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

  private parseErrorResponse(
    status: number,
    body: MetaApiErrorResponse,
    headers: Headers,
  ): never {
    const errorData = body.error;
    const message = errorData.message;
    const errorType = errorData.type;
    const errorCode = errorData.code;
    const errorSubcode = errorData.error_subcode;
    const fbTraceId = errorData.fbtrace_id;

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
