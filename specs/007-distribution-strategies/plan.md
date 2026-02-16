# Implementation Plan: Distribution Strategies & Broadcast

**Branch**: `007-distribution-strategies` | **Date**: 2026-02-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-distribution-strategies/spec.md`

## Summary

Add distribution strategies (round-robin, weighted, sticky) and broadcast capability to the multi-account manager. Strategies route individual sends across accounts via `getNext(recipient?)`. Broadcast fans out messages to many recipients in parallel using the configured strategy. Custom strategies are supported via a `DistributionStrategy` interface. Full backward compatibility — existing `get()` lookup is unchanged.

## Technical Context

**Language/Version**: TypeScript 5.3+ with strict mode
**Primary Dependencies**: Zero runtime dependencies (Node.js built-in APIs only)
**Storage**: N/A (stateless SDK library — strategies maintain only in-memory counters)
**Testing**: Vitest 3 with v8 coverage (80% threshold)
**Target Platform**: Node.js 18+
**Project Type**: Single library (npm package)
**Performance Goals**: Strategy selection < 1ms overhead; broadcast handles 1000+ recipients
**Constraints**: Zero runtime dependencies; all existing tests must continue passing
**Scale/Scope**: 3 built-in strategies, 1 broadcast method, ~300-400 new lines of source, ~500-600 new lines of tests

## Constitution Check

*Constitution is a placeholder template — no gates defined. Proceeding.*

## Project Structure

### Documentation (this feature)

```text
specs/007-distribution-strategies/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 research decisions
├── data-model.md        # Entity/type definitions
├── quickstart.md        # Usage examples
├── contracts/
│   └── strategy-contract.ts  # TypeScript interface contracts
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
src/multi-account/
├── types.ts             # MODIFY — add DistributionStrategy, Broadcast*, strategy on config
├── strategies.ts        # NEW — RoundRobinStrategy, WeightedStrategy, StickyStrategy
├── multi-account.ts     # MODIFY — add getNext(), broadcast()
└── index.ts             # MODIFY — export new types and strategies

src/index.ts             # MODIFY — export new types and strategies from barrel

tests/multi-account/
├── strategies.test.ts   # NEW — unit tests for all 3 strategies
└── multi-account.test.ts # MODIFY — add tests for getNext(), broadcast()
```

**Structure Decision**: All changes are within the existing `src/multi-account/` module. One new source file (`strategies.ts`) and one new test file (`strategies.test.ts`). No new modules or directories needed.

## Implementation Details

### File: `src/multi-account/types.ts` (MODIFY)

Add to existing file:

```typescript
// Strategy contract
interface DistributionStrategy {
  select(accountNames: readonly string[], recipient?: string): string;
}

// AccountConfig — NO changes (weights live on WeightedStrategy constructor)

// Extend MultiAccountConfig — add optional strategy
// readonly strategy?: DistributionStrategy;  (add to existing interface)

// Broadcast types
type BroadcastMessageFactory = (wa: WhatsApp, recipient: string) => Promise<ApiResponse<MessageResponse>>;

interface BroadcastOptions {
  readonly concurrency?: number;
}

interface BroadcastSuccess {
  readonly recipient: string;
  readonly response: ApiResponse<MessageResponse>;
}

interface BroadcastFailure {
  readonly recipient: string;
  readonly error: unknown;
}

interface BroadcastResult {
  readonly successes: readonly BroadcastSuccess[];
  readonly failures: readonly BroadcastFailure[];
  readonly total: number;
}
```

### File: `src/multi-account/strategies.ts` (NEW)

Three classes, each implementing `DistributionStrategy`:

1. **RoundRobinStrategy**: Internal `index` counter. `select()` returns `accountNames[index++ % length]`. On account list change, index wraps via modulo.

2. **WeightedStrategy**: Constructor takes `ReadonlyMap<string, number>` of weights. `select()` computes cumulative weights from the filtered `accountNames`, picks random in [0, total), scans to find the target. Accounts not in weight map default to 1. Weight 0 = excluded. Throws if all available accounts have weight 0.

3. **StickyStrategy**: Stateless. `select()` hashes `recipient` string using FNV-1a-inspired hash, returns `accountNames[hash % length]`. If `recipient` is undefined, falls back to first account with a logged warning.

### File: `src/multi-account/multi-account.ts` (MODIFY)

Add two new methods to `WhatsAppMultiAccount`:

1. **`getNext(recipient?: string): WhatsApp`**
   - Throws `ValidationError` if no strategy configured
   - Throws `ValidationError` if no accounts registered
   - Gets ordered account name list from `accountConfigs.keys()`
   - Calls `strategy.select(names, recipient)`
   - Returns `this.get(selectedName)` (reuses existing lazy instantiation)

2. **`broadcast(recipients, factory, options?): Promise<BroadcastResult>`**
   - Throws `ValidationError` if no strategy configured
   - Empty recipients → return `{ successes: [], failures: [], total: 0 }`
   - Validates concurrency >= 1 if provided
   - For each recipient: calls `getNext(recipient)` to pick account, then `factory(wa, recipient)`
   - Uses pool-based concurrency: maintain N active promises, start next when one settles
   - Collects results into `BroadcastSuccess[]` and `BroadcastFailure[]`
   - Returns `BroadcastResult`

Store `strategy` from config as private field. `null` if not provided.

### File: `src/multi-account/index.ts` (MODIFY)

Export: `RoundRobinStrategy`, `WeightedStrategy`, `StickyStrategy`, and all new types.

### File: `src/index.ts` (MODIFY)

Re-export all new symbols from `./multi-account/index.js`.

### File: `tests/multi-account/strategies.test.ts` (NEW)

Test each strategy independently:

- **RoundRobinStrategy**: cyclic order, wraps around, handles account list changes
- **WeightedStrategy**: proportional distribution over 1000 calls (±5%), weight 0 excluded, equal weights ≈ even, all-zero throws
- **StickyStrategy**: same recipient → same account (10 calls), different recipients → distributed, account removal → deterministic reassignment, undefined recipient fallback

### File: `tests/multi-account/multi-account.test.ts` (MODIFY)

Add test blocks for:

- **getNext()**: returns WhatsApp instance, delegates to strategy, throws without strategy, throws with no accounts, throws when destroyed
- **broadcast()**: distributes across accounts, collects successes/failures, handles empty recipients, respects concurrency limit, per-recipient factory customization, throws without strategy

## Complexity Tracking

No constitution violations — no tracking needed.
