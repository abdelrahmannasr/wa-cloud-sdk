# Tasks: Distribution Strategies & Broadcast

**Input**: Design documents from `/specs/007-distribution-strategies/`
**Prerequisites**: plan.md (required), spec.md (required), data-model.md, contracts/, research.md, quickstart.md

**Tests**: Included — project requires 80% coverage threshold (vitest v8).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No setup tasks needed — project infrastructure, build tooling, and module structure already exist.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types and interfaces that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T001 Add DistributionStrategy interface, broadcast types (BroadcastMessageFactory, BroadcastOptions, BroadcastSuccess, BroadcastFailure, BroadcastResult), and optional `strategy` field to MultiAccountConfig in `src/multi-account/types.ts` (AccountConfig unchanged — weights live on WeightedStrategy constructor)

**Checkpoint**: All shared types available — user story implementation can begin

---

## Phase 3: User Story 1 - Round-Robin Distribution + getNext (Priority: P1) MVP

**Goal**: Developers can distribute individual message sends evenly across accounts using round-robin strategy via `getNext()`

**Independent Test**: Configure 3 accounts with round-robin, send 9 messages via `getNext()`, verify each account handled exactly 3 in cyclic order (A, B, C, A, B, C, A, B, C)

### Implementation for User Story 1

- [x] T002 [US1] Implement RoundRobinStrategy class with internal index counter and cyclic `select()` in `src/multi-account/strategies.ts` (creates file)
- [x] T003 [US1] Add private `strategy` field storage and `getNext(recipient?)` method to WhatsAppMultiAccount in `src/multi-account/multi-account.ts` — validates strategy is configured, delegates to `strategy.select()`, returns `this.get(selectedName)`
- [x] T004 [US1] Export RoundRobinStrategy, DistributionStrategy, and all new broadcast types from `src/multi-account/index.ts` and re-export from `src/index.ts`
- [x] T005 [P] [US1] Write unit tests for RoundRobinStrategy in `tests/multi-account/strategies.test.ts` (creates file) — cyclic order, wrap-around, account list changes (add/remove mid-session)
- [x] T006 [US1] Write unit tests for `getNext()` in `tests/multi-account/multi-account.test.ts` — returns WhatsApp instance, delegates to strategy, throws ValidationError without strategy, throws when destroyed, throws with zero accounts

**Checkpoint**: Round-robin distribution works end-to-end. `getNext()` returns strategy-selected WhatsApp instances. Existing `get()` still works without strategy.

---

## Phase 4: User Story 2 - Broadcast (Priority: P2)

**Goal**: Developers can send a message to many recipients in parallel, distributed across accounts using the configured strategy

**Independent Test**: Broadcast to 10 recipients across 3 accounts, verify all 10 sent with per-recipient success/failure reporting and factory customization

### Implementation for User Story 2

- [x] T007 [US2] Implement `broadcast(recipients, factory, options?)` method with pool-based concurrency control in `src/multi-account/multi-account.ts` — uses `getNext(recipient)` per recipient, executes factory in parallel respecting concurrency limit, collects BroadcastResult
- [x] T008 [US2] Write unit tests for `broadcast()` in `tests/multi-account/multi-account.test.ts` — distributes across accounts, collects successes and failures separately, handles empty recipients (returns empty result), respects concurrency limit, per-recipient factory customization, throws without strategy, scale test with 1000 recipients across 5 accounts (SC-004), destroy() called during in-progress broadcast does not initiate new sends

**Checkpoint**: Broadcast distributes work across accounts with full success/failure reporting. Combined with US1, developers have both individual and bulk distribution.

---

## Phase 5: User Story 3 - Weighted Distribution (Priority: P3)

**Goal**: Developers can route messages proportionally based on per-account weights (e.g., enterprise account gets 80% of traffic)

**Independent Test**: Configure 2 accounts with weights 80 and 20, send 1000 messages, verify ~80/20 split within ±5% tolerance

### Implementation for User Story 3

- [x] T009 [US3] Implement WeightedStrategy class in `src/multi-account/strategies.ts` — constructor takes weight map, `select()` uses cumulative weight random selection, defaults unspecified accounts to weight 1, excludes weight 0, throws if all weights are 0
- [x] T010 [US3] Export WeightedStrategy from `src/multi-account/index.ts` and `src/index.ts`
- [x] T011 [US3] Write unit tests for WeightedStrategy in `tests/multi-account/strategies.test.ts` — proportional distribution over 1000 calls (±5%), weight 0 excluded, equal weights ≈ even, missing accounts default to 1, all-zero throws ValidationError

**Checkpoint**: Weighted distribution works with `getNext()` and `broadcast()`. Heterogeneous account tiers are supported.

---

## Phase 6: User Story 4 - Sticky Routing (Priority: P4)

**Goal**: Developers can ensure the same recipient always routes to the same account for conversation continuity

**Independent Test**: Send 10 messages to the same recipient, verify all go through the same account. Send to many different recipients, verify distribution across accounts.

### Implementation for User Story 4

- [x] T012 [US4] Implement StickyStrategy class in `src/multi-account/strategies.ts` — stateless FNV-1a-inspired hash of recipient phone, `hash % accountNames.length`, falls back to first account if recipient is undefined
- [x] T013 [US4] Export StickyStrategy from `src/multi-account/index.ts` and `src/index.ts`
- [x] T014 [US4] Write unit tests for StickyStrategy in `tests/multi-account/strategies.test.ts` — same recipient → same account (10 calls), different recipients → distributed across accounts, account removal → deterministic reassignment, undefined recipient → fallback

**Checkpoint**: All 3 strategies complete. Sticky routing provides conversation continuity.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final verification across all stories

- [x] T015 Run full verification: `pnpm typecheck && pnpm test:coverage && pnpm lint` — ensure all tests pass, coverage stays above 80%, no lint errors, no type errors
- [x] T016 Verify backward compatibility: existing multi-account tests pass unchanged, `get()` works without strategy configured

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — starts immediately
- **US1 (Phase 3)**: Depends on Foundational (Phase 2)
- **US2 (Phase 4)**: Depends on US1 (Phase 3) — broadcast uses `getNext()`
- **US3 (Phase 5)**: Depends on Foundational (Phase 2) only — can run in parallel with US1/US2
- **US4 (Phase 6)**: Depends on US3 (Phase 5) — shares `strategies.ts` and barrel exports with US3
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Blocked by Phase 2 — no story dependencies. **This is the MVP.**
- **US2 (P2)**: Blocked by US1 — broadcast calls `getNext()` internally
- **US3 (P3)**: Blocked by Phase 2 only — independent of US1/US2 (just adds a strategy class)
- **US4 (P4)**: Blocked by US3 — shares `strategies.ts`, `index.ts`, and `src/index.ts` with US3 (sequential, not parallel)

### Within Each User Story

- Implementation before tests (tests verify the implementation)
- Export updates after implementation
- Strategy implementation before integration with multi-account manager

### Parallel Opportunities

- **T005** [P] can run in parallel with T003/T004 (different files: strategies.test.ts vs multi-account.ts)
- **US3 then US4** must be sequential (both write to `strategies.ts`, `index.ts`, and `src/index.ts`)
- After US1 completes, US2 and US3 can proceed in parallel (different files). US4 follows US3.

---

## Parallel Example: User Story 1

```bash
# After T002 (RoundRobinStrategy implemented):
# These can run in parallel:
Task: T003 "Add getNext() to multi-account.ts"
Task: T005 "Write RoundRobinStrategy tests in strategies.test.ts"

# After T003 completes:
Task: T004 "Update barrel exports"
Task: T006 "Write getNext() tests"
```

## Sequential Example: US3 → US4

```bash
# After Phase 2 (Foundational) completes:
# US3 and US4 share strategies.ts and barrel exports — run sequentially:

# First: US3 (WeightedStrategy)
Task: T009 "Implement WeightedStrategy in strategies.ts"
Task: T010 "Export WeightedStrategy from index.ts and src/index.ts"
Task: T011 "Test WeightedStrategy"

# Then: US4 (StickyStrategy) — after US3 completes
Task: T012 "Implement StickyStrategy in strategies.ts"
Task: T013 "Export StickyStrategy from index.ts and src/index.ts"
Task: T014 "Test StickyStrategy"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (types)
2. Complete Phase 3: User Story 1 (RoundRobinStrategy + getNext)
3. **STOP and VALIDATE**: Run `pnpm test && pnpm typecheck`
4. Existing `get()` still works, `getNext()` works with round-robin

### Incremental Delivery

1. Phase 2 → Types ready
2. US1 → Round-robin + getNext → Validate (MVP!)
3. US2 → Broadcast → Validate (high-volume campaigns unlocked)
4. US3 → Weighted strategy → Validate (heterogeneous tiers supported)
5. US4 → Sticky strategy → Validate (conversation continuity)
6. Polish → Full verification pass

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All strategies share the same `DistributionStrategy` interface — custom strategies work automatically
- Backward compatibility: existing `get()` method and all current tests are unaffected
