# Data Model: Distribution Strategies & Broadcast

**Feature**: 007-distribution-strategies | **Date**: 2026-02-16

## Entities

### DistributionStrategy (interface)

The contract that all strategies (built-in and custom) must implement.

| Field  | Type                                                        | Description                                                        |
| ------ | ----------------------------------------------------------- | ------------------------------------------------------------------ |
| select | `(accountNames: readonly string[], recipient?: string) => string` | Returns the name of the account to use for the next send. `recipient` is optional — only sticky strategy uses it. |

**Validation**: `select` must return a name that exists in the provided `accountNames` array.

### RoundRobinStrategy (implements DistributionStrategy)

Cycles through accounts in insertion order. Maintains an internal index counter that wraps around.

| Field | Type   | Description                          |
| ----- | ------ | ------------------------------------ |
| index | number | Internal counter (starts at 0, wraps on overflow) |

**State**: Mutable (index increments on each `select` call). Handles account list changes gracefully by applying modulo on current index.

### WeightedStrategy (implements DistributionStrategy)

Selects accounts proportionally based on their configured weights.

| Field   | Type                              | Description                                      |
| ------- | --------------------------------- | ------------------------------------------------ |
| weights | `ReadonlyMap<string, number>`     | Account name → weight mapping. Provided at construction. |

**Validation**: All weights must be non-negative. At least one account must have weight > 0. Accounts not in the weight map default to weight 1.

### StickyStrategy (implements DistributionStrategy)

Deterministically maps recipient phone numbers to accounts using hashing.

| Field | Type | Description |
| ----- | ---- | ----------- |
| (none) | — | Stateless — hash is computed on each call |

**Behavior**: `hash(recipient) % accountNames.length` produces a deterministic index. When an account is removed, only recipients mapped to that account are reassigned.

### AccountConfig (existing — unchanged)

No new fields. Weights are configured on the `WeightedStrategy` constructor, not on individual accounts.

### MultiAccountConfig (existing — extended)

| Field    | Type                      | Description                                                   | New? |
| -------- | ------------------------- | ------------------------------------------------------------- | ---- |
| strategy | DistributionStrategy?     | Distribution strategy instance. If omitted, only manual `get()` is available; `getNext()` and `broadcast()` throw. | Yes  |

All other existing fields remain unchanged.

### BroadcastOptions

| Field       | Type    | Description                                                  |
| ----------- | ------- | ------------------------------------------------------------ |
| concurrency | number? | Max concurrent sends (default: unlimited). Must be >= 1.     |

### BroadcastSuccess

| Field     | Type                            | Description                       |
| --------- | ------------------------------- | --------------------------------- |
| recipient | string                          | Phone number of the recipient     |
| response  | ApiResponse\<MessageResponse\>  | Successful send response          |

### BroadcastFailure

| Field     | Type    | Description                       |
| --------- | ------- | --------------------------------- |
| recipient | string  | Phone number of the recipient     |
| error     | unknown | The error that caused the failure |

### BroadcastResult

| Field     | Type                         | Description                                |
| --------- | ---------------------------- | ------------------------------------------ |
| successes | readonly BroadcastSuccess[]  | Successfully sent messages                 |
| failures  | readonly BroadcastFailure[]  | Failed sends with error details            |
| total     | number                       | Total recipients attempted (successes + failures) |

### BroadcastMessageFactory (type alias)

```
(wa: WhatsApp, recipient: string) => Promise<ApiResponse<MessageResponse>>
```

A function that receives a WhatsApp instance (strategy-selected) and a recipient phone number, and performs the send operation. The developer controls which message type and content to use.

## Relationships

```
MultiAccountConfig
  ├── accounts: AccountConfig[] (1:N)
  └── strategy?: DistributionStrategy (0..1)

WhatsAppMultiAccount
  ├── get(name) → WhatsApp          (existing, unchanged)
  ├── getNext(recipient?) → WhatsApp (new, requires strategy)
  └── broadcast(recipients, factory, options?) → BroadcastResult (new, requires strategy)

DistributionStrategy
  ├── RoundRobinStrategy
  ├── WeightedStrategy
  └── StickyStrategy
```
