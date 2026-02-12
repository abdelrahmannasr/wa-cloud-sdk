/**
 * Base error class for all WhatsApp SDK errors.
 * All SDK errors extend this class for unified catch handling.
 */
export class WhatsAppError extends Error {
  public readonly code: string;

  constructor(message: string, code: string = 'WHATSAPP_ERROR') {
    super(message);
    this.name = 'WhatsAppError';
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when the Meta API returns an error response (4xx, 5xx).
 */
export class ApiError extends WhatsAppError {
  public readonly statusCode: number;
  public readonly errorType: string;
  public readonly errorSubcode?: number;
  public readonly fbTraceId?: string;

  constructor(
    message: string,
    statusCode: number,
    errorType: string,
    options?: {
      errorSubcode?: number;
      fbTraceId?: string;
    },
  ) {
    super(message, 'API_ERROR');
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorType = errorType;
    this.errorSubcode = options?.errorSubcode;
    this.fbTraceId = options?.fbTraceId;
  }
}

/**
 * Thrown when the API responds with 429 (Too Many Requests).
 */
export class RateLimitError extends ApiError {
  public override readonly code = 'RATE_LIMIT_ERROR' as const;
  public readonly retryAfterMs?: number;

  constructor(message: string, retryAfterMs?: number) {
    super(message, 429, 'OAuthException');
    this.name = 'RateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}

/**
 * Thrown when authentication fails (invalid or expired token).
 */
export class AuthenticationError extends ApiError {
  public override readonly code = 'AUTHENTICATION_ERROR' as const;

  constructor(message: string) {
    super(message, 401, 'OAuthException');
    this.name = 'AuthenticationError';
  }
}

/**
 * Thrown when input validation fails before making an API request.
 */
export class ValidationError extends WhatsAppError {
  public readonly field?: string;

  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.field = field;
  }
}

/**
 * Thrown when webhook signature verification fails.
 */
export class WebhookVerificationError extends WhatsAppError {
  constructor(message: string) {
    super(message, 'WEBHOOK_VERIFICATION_ERROR');
    this.name = 'WebhookVerificationError';
  }
}

/**
 * Thrown when media operations fail (upload, download, size/MIME checks).
 */
export class MediaError extends WhatsAppError {
  public readonly mediaType?: string;

  constructor(message: string, mediaType?: string) {
    super(message, 'MEDIA_ERROR');
    this.name = 'MediaError';
    this.mediaType = mediaType;
  }
}
