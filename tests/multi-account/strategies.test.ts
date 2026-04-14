import { describe, it, expect } from 'vitest';
import {
  RoundRobinStrategy,
  WeightedStrategy,
  StickyStrategy,
} from '../../src/multi-account/strategies.js';
import { ValidationError } from '../../src/errors/errors.js';

describe('RoundRobinStrategy', () => {
  it('should cycle through accounts in order', () => {
    const strategy = new RoundRobinStrategy();
    const accounts = ['account-a', 'account-b', 'account-c'];

    expect(strategy.select(accounts)).toBe('account-a');
    expect(strategy.select(accounts)).toBe('account-b');
    expect(strategy.select(accounts)).toBe('account-c');
  });

  it('should wrap around after reaching the last account', () => {
    const strategy = new RoundRobinStrategy();
    const accounts = ['account-a', 'account-b'];

    expect(strategy.select(accounts)).toBe('account-a');
    expect(strategy.select(accounts)).toBe('account-b');
    expect(strategy.select(accounts)).toBe('account-a'); // Wrap around
    expect(strategy.select(accounts)).toBe('account-b');
  });

  it('should handle account list changes gracefully', () => {
    const strategy = new RoundRobinStrategy();

    // Start with 3 accounts
    let accounts = ['account-a', 'account-b', 'account-c'];
    expect(strategy.select(accounts)).toBe('account-a'); // index=0
    expect(strategy.select(accounts)).toBe('account-b'); // index=1

    // Remove account-b mid-session
    accounts = ['account-a', 'account-c'];
    expect(strategy.select(accounts)).toBe('account-a'); // index=2 % 2 = 0

    // Add account-d
    accounts = ['account-a', 'account-c', 'account-d'];
    expect(strategy.select(accounts)).toBe('account-a'); // index=3 % 3 = 0
  });

  it('should throw ValidationError for empty account list', () => {
    const strategy = new RoundRobinStrategy();
    expect(() => strategy.select([])).toThrow(ValidationError);
    expect(() => strategy.select([])).toThrow('Cannot select from empty account list');
  });
});

describe('WeightedStrategy', () => {
  it('should distribute according to weights over many calls', () => {
    const strategy = new WeightedStrategy(
      new Map([
        ['account-a', 80],
        ['account-b', 20],
      ]),
    );
    const accounts = ['account-a', 'account-b'];

    const results = { 'account-a': 0, 'account-b': 0 };
    const iterations = 1000;

    for (let i = 0; i < iterations; i++) {
      const selected = strategy.select(accounts);
      results[selected as keyof typeof results]++;
    }

    // Allow ±5% tolerance (80/20 ± 5%)
    const ratioA = results['account-a'] / iterations;
    const ratioB = results['account-b'] / iterations;

    expect(ratioA).toBeGreaterThan(0.75); // 80% - 5%
    expect(ratioA).toBeLessThan(0.85); // 80% + 5%
    expect(ratioB).toBeGreaterThan(0.15); // 20% - 5%
    expect(ratioB).toBeLessThan(0.25); // 20% + 5%
  });

  it('should exclude accounts with weight 0', () => {
    const strategy = new WeightedStrategy(
      new Map([
        ['account-a', 50],
        ['account-b', 0], // Excluded
        ['account-c', 50],
      ]),
    );
    const accounts = ['account-a', 'account-b', 'account-c'];

    const results = new Set<string>();
    for (let i = 0; i < 100; i++) {
      results.add(strategy.select(accounts));
    }

    expect(results.has('account-a')).toBe(true);
    expect(results.has('account-b')).toBe(false); // Weight 0 = excluded
    expect(results.has('account-c')).toBe(true);
  });

  it('should default missing accounts to weight 1', () => {
    const strategy = new WeightedStrategy(
      new Map([
        ['account-a', 80],
        // account-b not in map → defaults to 1
      ]),
    );
    const accounts = ['account-a', 'account-b'];

    const results = { 'account-a': 0, 'account-b': 0 };
    for (let i = 0; i < 1000; i++) {
      const selected = strategy.select(accounts);
      results[selected as keyof typeof results]++;
    }

    // account-a weight 80, account-b weight 1 → 80:1 ratio
    const ratioA = results['account-a'] / 1000;
    expect(ratioA).toBeGreaterThan(0.93); // ~98.7% with tolerance
    expect(results['account-b']).toBeGreaterThan(0); // Should get some selections
  });

  it('should distribute evenly when all weights are equal', () => {
    const strategy = new WeightedStrategy(
      new Map([
        ['account-a', 50],
        ['account-b', 50],
      ]),
    );
    const accounts = ['account-a', 'account-b'];

    const results = { 'account-a': 0, 'account-b': 0 };
    for (let i = 0; i < 1000; i++) {
      const selected = strategy.select(accounts);
      results[selected as keyof typeof results]++;
    }

    const ratioA = results['account-a'] / 1000;
    const ratioB = results['account-b'] / 1000;

    // Both should be ~50% ± 5%
    expect(ratioA).toBeGreaterThan(0.45);
    expect(ratioA).toBeLessThan(0.55);
    expect(ratioB).toBeGreaterThan(0.45);
    expect(ratioB).toBeLessThan(0.55);
  });

  it('should use an injected RNG for deterministic selection', () => {
    // Scripted RNG: first call returns 0.1 (→ account-a), then 0.9 (→ account-b)
    // With weights 50/50 and totalWeight 100: 0.1 * 100 = 10 < 50 (a), 0.9 * 100 = 90 >= 50 (b)
    const scripted = [0.1, 0.9, 0.1];
    let index = 0;
    const rng = (): number => scripted[index++ % scripted.length]!;

    const strategy = new WeightedStrategy(
      new Map([
        ['account-a', 50],
        ['account-b', 50],
      ]),
      rng,
    );
    const accounts = ['account-a', 'account-b'];

    expect(strategy.select(accounts)).toBe('account-a');
    expect(strategy.select(accounts)).toBe('account-b');
    expect(strategy.select(accounts)).toBe('account-a');
  });

  it('should throw ValidationError when all weights are 0', () => {
    const strategy = new WeightedStrategy(
      new Map([
        ['account-a', 0],
        ['account-b', 0],
      ]),
    );
    const accounts = ['account-a', 'account-b'];

    expect(() => strategy.select(accounts)).toThrow(ValidationError);
    expect(() => strategy.select(accounts)).toThrow(
      'All available accounts have weight 0 — cannot select',
    );
  });

  it('should throw ValidationError for empty account list', () => {
    const strategy = new WeightedStrategy(new Map([['account-a', 50]]));
    expect(() => strategy.select([])).toThrow(ValidationError);
    expect(() => strategy.select([])).toThrow('Cannot select from empty account list');
  });

  it('should throw ValidationError for negative weight', () => {
    expect(
      () =>
        new WeightedStrategy(
          new Map([
            ['account-a', 80],
            ['account-b', -10],
          ]),
        ),
    ).toThrow(ValidationError);
    expect(
      () =>
        new WeightedStrategy(
          new Map([
            ['account-a', 80],
            ['account-b', -10],
          ]),
        ),
    ).toThrow('weight for account "account-b" must be non-negative, got -10');
  });
});

describe('StickyStrategy', () => {
  it('should always return the same account for the same recipient', () => {
    const strategy = new StickyStrategy();
    const accounts = ['account-a', 'account-b', 'account-c'];
    const recipient = '1234567890';

    const first = strategy.select(accounts, recipient);

    // Call 10 times with same recipient
    for (let i = 0; i < 10; i++) {
      expect(strategy.select(accounts, recipient)).toBe(first);
    }
  });

  it('should distribute different recipients across accounts', () => {
    const strategy = new StickyStrategy();
    const accounts = ['account-a', 'account-b', 'account-c'];

    const results = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const recipient = `recipient-${i}`;
      results.add(strategy.select(accounts, recipient));
    }

    // With 100 different recipients, we should see all 3 accounts used
    expect(results.size).toBeGreaterThan(1);
  });

  it('should deterministically reassign when account is removed', () => {
    const strategy = new StickyStrategy();
    const recipient = '1234567890';

    // Initial selection with 3 accounts
    const accountsInitial = ['account-a', 'account-b', 'account-c'];
    strategy.select(accountsInitial, recipient);

    // Remove one account
    const accountsReduced = accountsInitial.filter((a) => a !== 'account-b');

    // Selection should be deterministic (same hash, different modulo)
    const selectedReduced = strategy.select(accountsReduced, recipient);

    // Call again to verify consistency
    expect(strategy.select(accountsReduced, recipient)).toBe(selectedReduced);
  });

  it('should fall back to first account when recipient is undefined', () => {
    const strategy = new StickyStrategy();
    const accounts = ['account-a', 'account-b', 'account-c'];

    expect(strategy.select(accounts)).toBe('account-a');
    expect(strategy.select(accounts, undefined)).toBe('account-a');
  });

  it('should hash empty string instead of falling back to first account', () => {
    const strategy = new StickyStrategy();
    const accounts = ['account-a', 'account-b', 'account-c'];

    // Empty string should be hashed deterministically, not fall back to first account
    const result1 = strategy.select(accounts, '');
    const result2 = strategy.select(accounts, '');
    expect(result1).toBe(result2); // Deterministic
  });

  it('should throw ValidationError for empty account list', () => {
    const strategy = new StickyStrategy();
    expect(() => strategy.select([], '1234567890')).toThrow(ValidationError);
    expect(() => strategy.select([], '1234567890')).toThrow(
      'Cannot select from empty account list',
    );
  });
});
