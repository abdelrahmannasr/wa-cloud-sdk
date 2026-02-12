// Core client
export { HttpClient } from './client/index.js';
export type {
  WhatsAppConfig,
  RequestOptions,
  ApiResponse,
  HttpMethod,
  Logger,
} from './client/index.js';

// Errors
export {
  WhatsAppError,
  ApiError,
  RateLimitError,
  AuthenticationError,
  ValidationError,
  WebhookVerificationError,
  MediaError,
} from './errors/index.js';

// Utilities
export { TokenBucketRateLimiter } from './utils/index.js';
export type { RateLimiterConfig } from './utils/index.js';
export { withRetry, DEFAULT_RETRY_CONFIG } from './utils/index.js';
export type { RetryConfig } from './utils/index.js';
export { validatePhoneNumber, isValidPhoneNumber } from './utils/index.js';
