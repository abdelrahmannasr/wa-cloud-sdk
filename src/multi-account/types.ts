import type { Logger } from '../client/types.js';

/**
 * Configuration for a single managed account
 */
export interface AccountConfig {
  /** Unique account label */
  readonly name: string;
  /** Access token for this account */
  readonly accessToken: string;
  /** Phone number ID for this account */
  readonly phoneNumberId: string;
  /** WhatsApp Business Account ID (needed for templates, phone numbers) */
  readonly businessAccountId?: string;
  /** API version override */
  readonly apiVersion?: string;
  /** Base URL override */
  readonly baseUrl?: string;
  /** Logger override */
  readonly logger?: Logger;
  /** Rate limiter configuration override */
  readonly rateLimitConfig?: {
    readonly maxTokens?: number;
    readonly refillRate?: number;
    readonly enabled?: boolean;
  };
  /** Retry configuration override */
  readonly retryConfig?: {
    readonly maxRetries?: number;
    readonly baseDelayMs?: number;
    readonly maxDelayMs?: number;
    readonly jitterFactor?: number;
  };
  /** Request timeout override */
  readonly timeoutMs?: number;
  /** App secret for webhook signature verification */
  readonly appSecret?: string;
  /** Webhook verify token */
  readonly webhookVerifyToken?: string;
}

/**
 * Top-level configuration for the multi-account manager
 */
export interface MultiAccountConfig {
  /** Array of account configurations (at least one required) */
  readonly accounts: readonly AccountConfig[];
  /** Shared base API version (default: 'v21.0') */
  readonly apiVersion?: string;
  /** Shared base URL (default: 'https://graph.facebook.com') */
  readonly baseUrl?: string;
  /** Shared base logger */
  readonly logger?: Logger;
  /** Shared base rate limiter configuration */
  readonly rateLimitConfig?: {
    readonly maxTokens?: number;
    readonly refillRate?: number;
    readonly enabled?: boolean;
  };
  /** Shared base retry configuration */
  readonly retryConfig?: {
    readonly maxRetries?: number;
    readonly baseDelayMs?: number;
    readonly maxDelayMs?: number;
    readonly jitterFactor?: number;
  };
  /** Shared base request timeout in ms (default: 30000) */
  readonly timeoutMs?: number;
}
