export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

export interface WhatsAppConfig {
  /** Access token for the WhatsApp Business API */
  readonly accessToken: string;
  /** Phone number ID for sending messages */
  readonly phoneNumberId: string;
  /** WhatsApp Business Account ID (required for template operations) */
  readonly businessAccountId?: string;
  /** API version (default: 'v21.0') */
  readonly apiVersion?: string;
  /** Base URL (default: 'https://graph.facebook.com') */
  readonly baseUrl?: string;
  /** Logger instance */
  readonly logger?: Logger;
  /** Rate limiter configuration */
  readonly rateLimitConfig?: {
    readonly maxTokens?: number;
    readonly refillRate?: number;
    readonly enabled?: boolean;
  };
  /** Retry configuration */
  readonly retryConfig?: {
    readonly maxRetries?: number;
    readonly baseDelayMs?: number;
    readonly maxDelayMs?: number;
    readonly jitterFactor?: number;
  };
  /** Request timeout in ms (default: 30000) */
  readonly timeoutMs?: number;
  /** App secret for webhook signature verification */
  readonly appSecret?: string;
  /** Webhook verify token */
  readonly webhookVerifyToken?: string;
  /**
   * Hostnames the bearer token may be sent to when downloading media.
   * Entries starting with '.' are treated as suffix matches (e.g. '.fbcdn.net'
   * matches 'cdn.fbcdn.net'); bare entries match the hostname exactly.
   * Defaults to Meta's media CDN hosts. Override only for self-hosted sandboxes.
   */
  readonly allowedMediaHosts?: readonly string[];
}

export interface RequestOptions {
  /** Additional headers to include */
  readonly headers?: Record<string, string>;
  /** Override timeout for this request */
  readonly timeoutMs?: number;
  /** Skip rate limiting for this request */
  readonly skipRateLimit?: boolean;
  /** Skip retry for this request */
  readonly skipRetry?: boolean;
  /** Query parameters */
  readonly params?: Record<string, string>;
  /** Signal for request cancellation */
  readonly signal?: AbortSignal;
}

export interface ApiResponse<T> {
  /** Parsed response data */
  readonly data: T;
  /** HTTP status code */
  readonly status: number;
  /** Response headers */
  readonly headers: Headers;
}

/** Meta API error response shape (fields optional to handle malformed responses) */
export interface MetaApiErrorResponse {
  readonly error?: {
    readonly message?: string;
    readonly type?: string;
    readonly code?: number;
    readonly error_subcode?: number;
    readonly fbtrace_id?: string;
  };
}
