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
 * Thrown when a platform response contains no matching resource
 * (e.g. an empty `data` array where the SDK expected a single element).
 * Semantically distinct from `ApiError` (explicit 4xx/5xx from the wire)
 * and `ValidationError` (caller passed invalid input).
 *
 * @remarks
 * `NotFoundError` deliberately extends `WhatsAppError` directly — **not**
 * `ApiError`. The Meta API did not return a 404; it returned a 200 with an
 * empty result set, and the SDK is translating that into a semantic
 * "resource missing" signal. Because of this, code that narrows by HTTP
 * status (`err instanceof ApiError && err.statusCode === 404`) will **not**
 * catch this error. Consumers should add a dedicated branch:
 *
 * ```ts
 * try {
 *   await wa.phoneNumbers.getBusinessProfile(id);
 * } catch (err) {
 *   if (err instanceof NotFoundError) {
 *     // empty data array from Meta
 *   } else if (err instanceof ApiError && err.statusCode === 404) {
 *     // explicit wire-level 404
 *   }
 * }
 * ```
 */
export class NotFoundError extends WhatsAppError {
  public readonly resource?: string;

  constructor(message: string, resource?: string) {
    super(message, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
    this.resource = resource;
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

/**
 * Thrown when a strict-create operation fails because the resource already exists.
 * Use `upsertProduct` instead of `createProduct` if you want idempotent creation.
 *
 * @example
 * ```ts
 * import { ConflictError } from '@abdelrahmannasr-wa/cloud-api/errors';
 *
 * try {
 *   await wa.catalog.createProduct(catalogId, { retailer_id: 'SKU-001', ... });
 * } catch (err) {
 *   if (err instanceof ConflictError) {
 *     // product with this retailer_id already exists — use upsertProduct
 *     console.error(`Conflict on resource: ${err.resource}`);
 *   }
 * }
 * ```
 */
export class ConflictError extends WhatsAppError {
  public readonly resource?: string;

  constructor(message: string, resource?: string) {
    super(message, 'CONFLICT');
    this.name = 'ConflictError';
    this.resource = resource;
  }
}
