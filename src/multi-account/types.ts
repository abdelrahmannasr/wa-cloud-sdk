import type { ApiResponse, Logger } from '../client/types.js';
import type { MessageResponse } from '../messages/types.js';
import type { WhatsApp } from '../whatsapp.js';

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
 * Distribution strategy interface for routing sends across multiple accounts.
 * All built-in and custom strategies implement this contract.
 *
 * @example
 * ```typescript
 * class PriorityStrategy implements DistributionStrategy {
 *   select(accountNames: readonly string[]): string {
 *     return accountNames[0]!; // Always use first account
 *   }
 * }
 * ```
 */
export interface DistributionStrategy {
  /**
   * Select the next account to use for a send operation.
   *
   * @param accountNames - Ordered list of available account names
   * @param recipient - Optional recipient phone number (used by sticky strategy)
   * @returns The name of the selected account
   */
  select(accountNames: readonly string[], recipient?: string): string;
}

/**
 * Factory function that sends a message through the given WhatsApp instance.
 * The developer controls which message type and content to use.
 *
 * @example
 * ```typescript
 * const factory: BroadcastMessageFactory = async (wa, recipient) =>
 *   wa.messages.sendText({ to: recipient, body: 'Hello!' });
 * ```
 */
export type BroadcastMessageFactory = (
  wa: WhatsApp,
  recipient: string,
) => Promise<ApiResponse<MessageResponse>>;

/**
 * Options for broadcast execution
 */
export interface BroadcastOptions {
  /** Max concurrent sends. Default: unlimited. Must be >= 1. */
  readonly concurrency?: number;
}

/**
 * A single successful send in a broadcast
 */
export interface BroadcastSuccess {
  readonly recipient: string;
  readonly response: ApiResponse<MessageResponse>;
}

/**
 * A single failed send in a broadcast
 */
export interface BroadcastFailure {
  readonly recipient: string;
  readonly error: unknown;
}

/**
 * Aggregate result of a broadcast operation
 */
export interface BroadcastResult {
  readonly successes: readonly BroadcastSuccess[];
  readonly failures: readonly BroadcastFailure[];
  readonly total: number;
}

/**
 * Top-level configuration for the multi-account manager
 */
export interface MultiAccountConfig {
  /** Array of account configurations (at least one required) */
  readonly accounts: readonly AccountConfig[];
  /** Distribution strategy for routing sends. If omitted, getNext() and broadcast() throw. */
  readonly strategy?: DistributionStrategy;
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
