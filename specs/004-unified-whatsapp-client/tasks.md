# Tasks: Unified WhatsApp Client

**Input**: Design documents from `/specs/004-unified-whatsapp-client/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/whatsapp-api.md, quickstart.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify existing project compiles before adding new code

No setup tasks needed — the project infrastructure (TypeScript, Vitest, tsup, ESLint, Prettier) is fully configured. All dependent modules (client, messages, media, templates, webhooks) are already implemented.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

No foundational tasks needed — all prerequisite modules (`HttpClient`, `Messages`, `Media`, `Templates`, webhook standalone functions, `ValidationError`) are already implemented and tested. The unified client composes these existing modules.

**Checkpoint**: Foundation already ready — user story implementation can begin immediately

---

## Phase 3: User Story 1 — Single Entry Point Setup (Priority: P1) MVP

**Goal**: Developers create a single SDK instance with one config object and access messages, media, and templates through accessors on that instance.

**Independent Test**: Construct a `WhatsApp` instance with valid config → verify `messages`, `media`, `templates`, and `client` accessors are available and return correct module instances. Verify constructor rejects missing required config. Verify templates accessor throws when `businessAccountId` is absent.

### Implementation for User Story 1

- [x] T001 [US1] Implement the `WhatsApp` class in `src/whatsapp.ts` per the API contract in `specs/004-unified-whatsapp-client/contracts/whatsapp-api.md`. The class must: accept `WhatsAppConfig` in the constructor; validate that `accessToken` and `phoneNumberId` are non-empty strings (throw `ValidationError` with field name if missing); create a shared `HttpClient` instance; eagerly initialize `Messages` and `Media` with the shared client and `phoneNumberId`; expose `messages`, `media`, and `client` via getter properties that return cached instances; expose `templates` via a lazy getter that throws `ValidationError` with field `'businessAccountId'` and message `"businessAccountId is required for template operations. Provide it in the WhatsApp constructor config."` if `businessAccountId` was not provided, otherwise construct and cache a `Templates` instance; implement `destroy()` that delegates to `HttpClient.destroy()`. All public APIs must have TSDoc comments with `@example` blocks. Use named export only.

- [x] T002 [US1] Write unit tests for the `WhatsApp` class in `tests/whatsapp.test.ts`. Test cases: (1) constructs successfully with valid config (accessToken + phoneNumberId); (2) throws `ValidationError` with field `'accessToken'` when accessToken is missing or empty; (3) throws `ValidationError` with field `'phoneNumberId'` when phoneNumberId is missing or empty; (4) `messages` getter returns a `Messages` instance; (5) `media` getter returns a `Media` instance; (6) `client` getter returns an `HttpClient` instance; (7) `templates` getter returns a `Templates` instance when `businessAccountId` is provided; (8) `templates` getter throws `ValidationError` with field `'businessAccountId'` when `businessAccountId` is not provided; (9) repeated accessor calls return the same cached instance; (10) `destroy()` calls `HttpClient.destroy()`; (11) verify SC-001: import + construct + call `sendText` compiles in ≤5 lines (validate against quickstart.md "Basic Setup + Send a Text Message" example). Mock `HttpClient` to avoid real API calls. Follow existing test patterns from `tests/messages/` and `tests/templates/`.

**Checkpoint**: WhatsApp class is functional with messages, media, templates, and client accessors. Independently testable without webhook support.

---

## Phase 4: User Story 2 — Webhook Handling Through Unified Client (Priority: P2)

**Goal**: Developers access webhook verification, parsing, and middleware creation through the unified client's `webhooks` accessor without importing separate webhook modules.

**Independent Test**: Construct a `WhatsApp` instance with `appSecret` and `webhookVerifyToken` → verify `webhooks` accessor methods (`verify`, `verifySignature`, `parse`, `createHandler`, `createExpressMiddleware`, `createNextRouteHandler`) delegate correctly to existing standalone functions. Verify methods that require config throw `ValidationError` when config is absent.

### Implementation for User Story 2

- [x] T003 [P] [US2] Implement the `Webhooks` class in `src/webhooks/webhooks.ts` per the API contract in `specs/004-unified-whatsapp-client/contracts/whatsapp-api.md`. The class must: accept `WhatsAppConfig` in the constructor and store it privately; implement `verify(params)` — validate `webhookVerifyToken` is present (throw `ValidationError` with field `'webhookVerifyToken'`) then delegate to `verifyWebhook(params, config.webhookVerifyToken)`; implement `verifySignature(rawBody, signature)` — validate `appSecret` is present (throw `ValidationError` with field `'appSecret'`) then delegate to imported `verifySignature(rawBody, signature, config.appSecret)`; implement `parse(payload)` — delegate directly to `parseWebhookPayload(payload)` with no config validation; implement `createHandler(callbacks)` — validate both `appSecret` and `webhookVerifyToken` are present (throw `ValidationError` with field `'appSecret'`) then delegate to `createWebhookHandler({ appSecret, verifyToken }, callbacks)`; implement `createExpressMiddleware(callbacks)` — same validation then delegate to `createExpressMiddleware({ appSecret, verifyToken }, callbacks)`; implement `createNextRouteHandler(callbacks)` — same validation then delegate to `createNextRouteHandler({ appSecret, verifyToken }, callbacks)`. All public APIs must have TSDoc comments with `@example` blocks. Use named export only.

- [x] T004 [US2] Add the `webhooks` lazy getter to the `WhatsApp` class in `src/whatsapp.ts`. The getter must construct and cache a `Webhooks` instance on first access, passing the stored config. The `Webhooks` class import comes from `./webhooks/webhooks.js`. Unlike `templates`, the `webhooks` getter does NOT validate config — individual methods handle their own validation per FR-007.

- [x] T005 [P] [US2] Update the webhooks barrel export in `src/webhooks/index.ts` to re-export the `Webhooks` class: add `export { Webhooks } from './webhooks.js';`. All existing exports must remain unchanged.

- [x] T006 [P] [US2] Write unit tests for the `Webhooks` class in `tests/webhooks/webhooks.test.ts`. Test cases: (1) `verify()` delegates to `verifyWebhook` with bound `webhookVerifyToken`; (2) `verify()` throws `ValidationError` with field `'webhookVerifyToken'` when token not in config; (3) `verifySignature()` delegates to imported `verifySignature` with bound `appSecret`; (4) `verifySignature()` throws `ValidationError` with field `'appSecret'` when secret not in config; (5) `parse()` delegates to `parseWebhookPayload` without config validation; (6) `createHandler()` delegates to `createWebhookHandler` with bound config; (7) `createHandler()` throws `ValidationError` when `appSecret` missing; (8) `createHandler()` throws `ValidationError` when `webhookVerifyToken` missing; (9) `createExpressMiddleware()` delegates correctly with bound config; (10) `createExpressMiddleware()` throws `ValidationError` when config missing; (11) `createNextRouteHandler()` delegates correctly with bound config; (12) `createNextRouteHandler()` throws `ValidationError` when config missing. Mock the standalone webhook functions using `vi.mock()`.

- [x] T007 [US2] Add webhook accessor tests to `tests/whatsapp.test.ts`. Test cases: (1) `webhooks` getter returns a `Webhooks` instance; (2) repeated `webhooks` getter calls return the same cached instance; (3) `webhooks` accessor is available even without `appSecret` and `webhookVerifyToken` in config (deferred validation).

**Checkpoint**: Full webhook support through the unified client. All 6 webhook methods accessible via `wa.webhooks.*` with proper deferred config validation.

---

## Phase 5: User Story 3 — Gradual Migration from Direct Imports (Priority: P3)

**Goal**: Existing SDK users can continue using the direct-import pattern unchanged. The unified client is additive — no existing exports are removed or modified.

**Independent Test**: Verify all existing public exports from `src/index.ts` remain available. Run the full existing test suite and confirm zero failures. Verify `WhatsApp` and `Webhooks` are now also exported.

### Implementation for User Story 3

- [x] T008 [US3] Update the main barrel export in `src/index.ts` to add `WhatsApp` and `Webhooks` exports. Add `export { WhatsApp } from './whatsapp.js';` and `export { Webhooks } from './webhooks/index.js';`. All existing exports MUST remain completely unchanged — verify by diffing only addition lines.

- [x] T009 [US3] Run the full existing test suite (`pnpm test`) to verify zero regressions. All previously passing tests must continue to pass without modification. This validates FR-008 (backwards compatibility).

**Checkpoint**: All existing SDK users are unaffected. Both direct-import and unified-client patterns work.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Quality validation across all user stories

- [x] T010 Run the full quality suite: `pnpm typecheck` (zero type errors), `pnpm lint` (zero violations), `pnpm format:check` (all files formatted), `pnpm test:coverage` (80%+ on lines/functions/branches/statements for new files). Also verify SC-003: run `pnpm ls --prod --depth 0` and confirm zero runtime dependencies (only devDependencies). Fix any issues found.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Skipped — infrastructure already exists
- **Foundational (Phase 2)**: Skipped — all prerequisite modules already implemented
- **US1 (Phase 3)**: Can start immediately — no blocking dependencies
- **US2 (Phase 4)**: T003 can start in parallel with T002 (different files). T004 depends on T003. T005/T006 depend on T003 (can parallel with T004).T007 depends on T004.
- **US3 (Phase 5)**: Depends on T005 (webhooks barrel updated). T009 depends on T008.
- **Polish (Phase 6)**: Depends on all previous phases

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies — can start immediately
- **User Story 2 (P2)**: T003 can start in parallel with US1's T002. T004 depends on T001 (WhatsApp class must exist) and T003 (Webhooks class must exist).
- **User Story 3 (P3)**: Depends on T001 (WhatsApp exists) and T005 (Webhooks exported)

### Task Dependency Graph

```
T001 ──→ T002
  │         ↑ (parallel opportunity)
  │       T003 ──→ T004 ──→ T007
  │         │        │
  │         ├──→ T005 ──→ T008 ──→ T009 ──→ T010
  │         │
  │         └──→ T006
  │
  └──────────────→ T004 (also depends on T001)
```

### Parallel Opportunities

**Batch 1** (can run in parallel):
- T001 [US1] — `src/whatsapp.ts`
- T003 [US2] — `src/webhooks/webhooks.ts`

**Batch 2** (after Batch 1, can run in parallel):
- T002 [US1] — `tests/whatsapp.test.ts`
- T004 [US2] — update `src/whatsapp.ts` (webhooks getter)
- T005 [US2] — `src/webhooks/index.ts`
- T006 [US2] — `tests/webhooks/webhooks.test.ts`

> **Note**: T002 tests the US1 version of `src/whatsapp.ts` while T004 modifies the same source file. Complete T002 before T004 when executing sequentially. When batching in parallel, T002 and T004 target different concerns (tests vs source) but share a file — run T002 first if ordering matters.

**Batch 3** (after Batch 2):
- T007 [US2] — update `tests/whatsapp.test.ts`
- T008 [US3] — `src/index.ts`

**Batch 4** (sequential):
- T009 [US3] → T010

---

## Parallel Example: Batch 1

```bash
# Launch US1 and US2 implementation in parallel (different files):
Task: "Implement WhatsApp class in src/whatsapp.ts"
Task: "Implement Webhooks class in src/webhooks/webhooks.ts"
```

## Parallel Example: Batch 2

```bash
# After Batch 1 completes, launch these in parallel:
Task: "Write WhatsApp unit tests in tests/whatsapp.test.ts"
Task: "Add webhooks getter to WhatsApp class in src/whatsapp.ts"
Task: "Update webhooks barrel in src/webhooks/index.ts"
Task: "Write Webhooks unit tests in tests/webhooks/webhooks.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T001: WhatsApp class with messages, media, templates, client, destroy
2. Complete T002: Unit tests for WhatsApp class
3. **STOP and VALIDATE**: `pnpm test` — WhatsApp class works independently
4. Developers can now use `new WhatsApp(config)` for messages, media, and templates

### Incremental Delivery

1. T001 + T002 → US1 complete (MVP — unified client for send operations)
2. T003 + T004 + T005 + T006 + T007 → US2 complete (webhooks through unified client)
3. T008 + T009 → US3 complete (backwards compatibility verified)
4. T010 → Quality validated

### Optimal Execution (Single Developer)

1. T001 → T003 → T002 + T004 + T005 + T006 → T007 + T008 → T009 → T010

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- All tasks reference the API contract in `contracts/whatsapp-api.md` for exact signatures and error messages
- Mock `HttpClient` in tests — never call Meta API in unit tests
- Follow existing test patterns from `tests/messages/` and `tests/templates/`
- Commit after each task or logical batch
