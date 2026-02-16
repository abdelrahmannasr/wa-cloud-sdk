# Research: Distribution Strategies & Broadcast

**Feature**: 007-distribution-strategies | **Date**: 2026-02-16

## Decision 1: Strategy Contract Shape

**Decision**: Interface with a single `select(accountNames, recipient?)` method returning the selected account name.

**Rationale**: Strategies only need to make a routing decision — they don't need access to WhatsApp instances or configs. Receiving account names (strings) and returning a name keeps the contract minimal and testable. The `recipient` parameter is optional — only sticky strategy uses it.

**Alternatives considered**:
- Function signature `(accounts, recipient?) => string` — too loose, no room for stateful strategies (round-robin needs internal counter)
- Full object with lifecycle methods (init/destroy) — over-engineered for stateless routing logic
- Strategy receives WhatsApp instances — leaks implementation details into strategy contract

## Decision 2: MessageFactory for Broadcast

**Decision**: `(wa: WhatsApp, recipient: string) => Promise<ApiResponse<MessageResponse>>` — factory receives a WhatsApp instance and recipient, returns the send result.

**Rationale**: This is the most flexible design. The factory has full control over which send method to call (sendText, sendTemplate, sendImage, etc.) and can customize content per recipient. It follows the existing SDK patterns where developers call `wa.messages.sendText()` directly.

**Alternatives considered**:
- Factory returns a message payload object (e.g., `Omit<TextMessageOptions, 'to'>`) — requires a discriminated union of all 12+ message types, complex to type, and limits to single message type per broadcast
- Factory returns `{ method: string, options: unknown }` — stringly-typed, loses type safety
- Separate broadcast method per message type (`broadcastText`, `broadcastTemplate`) — combinatorial explosion

## Decision 3: Concurrency Control for Broadcast

**Decision**: Simple pool-based concurrency limiter using Promise chaining. No new utility file — implement inline in the broadcast method using a sliding window pattern.

**Rationale**: The SDK has zero runtime dependencies. A pool pattern (maintain N active promises, start next when one settles) is ~15 lines and doesn't warrant a separate utility. Default concurrency is unlimited (all sends fire in parallel).

**Alternatives considered**:
- Reuse rate limiter for concurrency — wrong abstraction (rate limiter is time-based, concurrency is count-based)
- Add a generic `withConcurrencyLimit` utility — YAGNI unless used elsewhere
- Use `Promise.all` with chunking — less efficient (waits for entire chunk before starting next)

## Decision 4: Weighted Strategy Algorithm

**Decision**: Weighted random selection using cumulative weight distribution. For each selection, generate a random number in [0, totalWeight) and find the account whose cumulative weight range contains it.

**Rationale**: Simple O(n) scan per selection, no precomputation needed beyond total weight. Handles dynamic account changes (add/remove) naturally since it reads account weights on each call. Produces statistically proportional distribution.

**Alternatives considered**:
- Weighted round-robin (WRR) with interleaving — more complex, harder to get right for arbitrary weights, and the statistical guarantee is per-cycle rather than aggregate
- Alias method — O(1) per selection but O(n) precomputation that must be redone on any account change

## Decision 5: Sticky Strategy Hashing

**Decision**: Simple string hash of recipient phone number, modulo account count. Use a basic FNV-1a-inspired hash (pure math, no `crypto` dependency needed for this).

**Rationale**: Deterministic, fast, and produces good distribution. When accounts are removed, only recipients mapped to the removed account are re-hashed — most stick. No external dependency needed.

**Alternatives considered**:
- `crypto.createHash('sha256')` — works but heavyweight for a simple modulo selection
- Consistent hashing (hash ring) — provides better stability on account changes but significantly more complex, overkill for typical 2-10 account setups
- Map/cache of recipient→account — unbounded memory growth for large recipient sets

## Decision 6: Weight Configuration

**Decision**: Weights are configured solely on the `WeightedStrategy` constructor via a `ReadonlyMap<string, number>`. `AccountConfig` is NOT modified. Weight of 0 means the account is excluded. Accounts not in the map default to weight 1.

**Rationale**: Keeps weight authority in one place (the strategy), avoiding dual-source confusion. The strategy is self-contained and testable independently of account configs. Developers specify weights once, alongside the strategy, not scattered across account definitions.

**Alternatives considered**:
- `weight` field on `AccountConfig` — creates dual source of truth (strategy map vs account field) with potential for conflicts; rejected during cross-artifact analysis
- Separate `WeightedAccountConfig extends AccountConfig` — unnecessary type complexity
- Manager extracts weights from `AccountConfig` and passes to strategy — couples strategy to account config shape
