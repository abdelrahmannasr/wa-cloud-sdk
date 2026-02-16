/**
 * API Contract: Distribution Strategies & Broadcast
 *
 * This file defines the TypeScript interfaces for the distribution strategies feature.
 * These are the contracts that implementation must satisfy.
 */

import type { ApiResponse } from '../../src/client/types.js';
import type { MessageResponse } from '../../src/messages/types.js';
import type { WhatsApp } from '../../src/whatsapp.js';

// ─── Strategy Contract ───────────────────────────────────────────────

/**
 * Distribution strategy interface.
 * All built-in and custom strategies implement this contract.
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

// ─── Built-in Strategies ─────────────────────────────────────────────

/**
 * Cycles through accounts in order: A → B → C → A → B → C → ...
 */
export declare class RoundRobinStrategy implements DistributionStrategy {
  select(accountNames: readonly string[], recipient?: string): string;
}

/**
 * Selects accounts proportionally based on configured weights.
 *
 * @param weights - Map of account name → weight (default: 1, 0 = excluded)
 */
export declare class WeightedStrategy implements DistributionStrategy {
  constructor(weights: ReadonlyMap<string, number>);
  select(accountNames: readonly string[], recipient?: string): string;
}

/**
 * Deterministically maps each recipient to a consistent account via hashing.
 */
export declare class StickyStrategy implements DistributionStrategy {
  select(accountNames: readonly string[], recipient?: string): string;
}

// ─── Broadcast Types ─────────────────────────────────────────────────

/**
 * Factory function that sends a message through the given WhatsApp instance.
 * The developer controls which message type and content to use.
 */
export type BroadcastMessageFactory = (
  wa: WhatsApp,
  recipient: string,
) => Promise<ApiResponse<MessageResponse>>;

/**
 * Options for broadcast execution.
 */
export interface BroadcastOptions {
  /** Max concurrent sends. Default: unlimited. Must be >= 1. */
  readonly concurrency?: number;
}

/**
 * A single successful send in a broadcast.
 */
export interface BroadcastSuccess {
  readonly recipient: string;
  readonly response: ApiResponse<MessageResponse>;
}

/**
 * A single failed send in a broadcast.
 */
export interface BroadcastFailure {
  readonly recipient: string;
  readonly error: unknown;
}

/**
 * Aggregate result of a broadcast operation.
 */
export interface BroadcastResult {
  readonly successes: readonly BroadcastSuccess[];
  readonly failures: readonly BroadcastFailure[];
  readonly total: number;
}

// ─── Config Extensions ───────────────────────────────────────────────

// AccountConfig: No changes. Weights are configured on WeightedStrategy constructor,
// not on individual accounts.

/**
 * Extended MultiAccountConfig — adds optional strategy field.
 * (Extends existing MultiAccountConfig; only new field shown here)
 */
export interface MultiAccountConfigExtension {
  /** Distribution strategy. If omitted, getNext() and broadcast() throw. */
  readonly strategy?: DistributionStrategy;
}

// ─── New Methods on WhatsAppMultiAccount ─────────────────────────────

/**
 * WhatsAppMultiAccount gains these new methods:
 *
 * getNext(recipient?: string): WhatsApp
 *   - Requires strategy to be configured
 *   - Delegates to strategy.select() with current account names
 *   - Returns the WhatsApp instance for the selected account
 *   - Throws ValidationError if no strategy configured or no accounts
 *
 * broadcast(
 *   recipients: readonly string[],
 *   factory: BroadcastMessageFactory,
 *   options?: BroadcastOptions
 * ): Promise<BroadcastResult>
 *   - Requires strategy to be configured
 *   - For each recipient: selects account via strategy, calls factory
 *   - Executes in parallel (respecting concurrency limit)
 *   - Returns aggregate result with per-recipient success/failure
 *   - Empty recipients array returns { successes: [], failures: [], total: 0 }
 */
