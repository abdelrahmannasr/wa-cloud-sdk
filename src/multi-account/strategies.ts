import { ValidationError } from '../errors/errors.js';
import type { DistributionStrategy } from './types.js';

/**
 * Round-robin distribution strategy.
 * Cycles through accounts in order: A → B → C → A → B → C → ...
 *
 * @remarks
 * The internal counter is modulo the current account list length at call
 * time. Adding or removing accounts between calls therefore shifts which
 * account is "next" — the strategy does not reset to 0 on mutation, nor
 * does it remember which account was served last. This is intentional: a
 * reset would cause every client to re-hammer the first account whenever
 * the account set changes.
 *
 * @example
 * ```typescript
 * const strategy = new RoundRobinStrategy();
 * const manager = new WhatsAppMultiAccount({ strategy, accounts: [...] });
 * const wa1 = manager.getNext(); // Account A
 * const wa2 = manager.getNext(); // Account B
 * const wa3 = manager.getNext(); // Account C
 * const wa4 = manager.getNext(); // Account A (wraps around)
 * ```
 */
export class RoundRobinStrategy implements DistributionStrategy {
  private index = 0;

  /**
   * Select the next account using round-robin logic.
   *
   * @param accountNames - Ordered list of available account names
   * @param _recipient - Ignored by round-robin strategy
   * @returns The name of the selected account
   */
  select(accountNames: readonly string[], _recipient?: string): string {
    if (accountNames.length === 0) {
      throw new ValidationError('Cannot select from empty account list', 'accountNames');
    }

    const selected = accountNames[this.index % accountNames.length];
    if (!selected) {
      throw new ValidationError('Account selection failed', 'accountNames');
    }
    // Reset before MAX_SAFE_INTEGER so index + 1 never silently loses precision.
    this.index = this.index < Number.MAX_SAFE_INTEGER - 1 ? this.index + 1 : 0;
    return selected;
  }
}

/**
 * Weighted distribution strategy.
 * Selects accounts proportionally based on configured weights.
 *
 * @example
 * ```typescript
 * const strategy = new WeightedStrategy(
 *   new Map([
 *     ['enterprise', 80],  // gets ~80% of traffic
 *     ['business-1', 10],  // gets ~10% of traffic
 *     ['business-2', 10],  // gets ~10% of traffic
 *   ])
 * );
 * ```
 */
export class WeightedStrategy implements DistributionStrategy {
  /**
   * @param weights - Map of account name → weight (default: 1, 0 = excluded)
   */
  constructor(private readonly weights: ReadonlyMap<string, number>) {
    for (const [name, weight] of weights) {
      if (weight < 0) {
        throw new ValidationError(
          `weight for account "${name}" must be non-negative, got ${weight}`,
          'weights',
        );
      }
    }
  }

  /**
   * Select an account using weighted random selection.
   *
   * @param accountNames - Ordered list of available account names
   * @param _recipient - Ignored by weighted strategy
   * @returns The name of the selected account
   */
  select(accountNames: readonly string[], _recipient?: string): string {
    if (accountNames.length === 0) {
      throw new ValidationError('Cannot select from empty account list', 'accountNames');
    }

    // Build cumulative weight distribution from available accounts
    const accountWeights: Array<{ name: string; weight: number }> = [];
    let totalWeight = 0;

    for (const name of accountNames) {
      const weight = this.weights.get(name) ?? 1; // Default to 1
      if (weight > 0) {
        accountWeights.push({ name, weight });
        totalWeight += weight;
      }
    }

    // Validate we have at least one account with positive weight
    if (totalWeight === 0 || accountWeights.length === 0) {
      throw new ValidationError('All available accounts have weight 0 — cannot select', 'weights');
    }

    // Weighted random selection
    const random = Math.random() * totalWeight;
    let cumulative = 0;

    for (const { name, weight } of accountWeights) {
      cumulative += weight;
      if (random < cumulative) {
        return name;
      }
    }

    // Fallback (should never reach due to floating point)
    const fallback = accountWeights[accountWeights.length - 1];
    if (!fallback) {
      throw new ValidationError('Account selection failed', 'accountNames');
    }
    return fallback.name;
  }
}

/**
 * Sticky routing strategy.
 * Deterministically maps each recipient to a consistent account via hashing.
 * Ensures the same recipient always routes to the same account for conversation continuity.
 *
 * @example
 * ```typescript
 * const strategy = new StickyStrategy();
 * const manager = new WhatsAppMultiAccount({ strategy, accounts: [...] });
 *
 * const wa1 = manager.getNext('1234567890'); // Always account A
 * const wa2 = manager.getNext('1234567890'); // Always account A (same recipient)
 * const wa3 = manager.getNext('9876543210'); // Account B (different recipient)
 * ```
 */
export class StickyStrategy implements DistributionStrategy {
  /**
   * Select an account using deterministic hash-based routing.
   *
   * @param accountNames - Ordered list of available account names
   * @param recipient - Recipient phone number to hash (optional)
   * @returns The name of the selected account
   */
  select(accountNames: readonly string[], recipient?: string): string {
    if (accountNames.length === 0) {
      throw new ValidationError('Cannot select from empty account list', 'accountNames');
    }

    // If no recipient provided, fall back to first account
    if (recipient === undefined) {
      const firstAccount = accountNames[0];
      if (!firstAccount) {
        throw new ValidationError('Account selection failed', 'accountNames');
      }
      return firstAccount;
    }

    // FNV-1a-inspired hash
    const hash = this.hashString(recipient);
    const index = hash % accountNames.length;
    const selected = accountNames[index];
    if (!selected) {
      throw new ValidationError('Account selection failed', 'accountNames');
    }
    return selected;
  }

  /**
   * Simple FNV-1a-inspired string hash function.
   * Produces deterministic positive integers for consistent routing.
   *
   * @param str - String to hash
   * @returns Non-negative integer hash
   */
  private hashString(str: string): number {
    let hash = 2166136261; // FNV offset basis

    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619); // FNV prime
    }

    // Convert to unsigned 32-bit and ensure positive
    return hash >>> 0;
  }
}
