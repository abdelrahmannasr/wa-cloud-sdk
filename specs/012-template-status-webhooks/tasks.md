---

description: "Task list for 012-template-status-webhooks"
---

# Tasks: Template Status Webhook Events

**Input**: Design documents from `/specs/012-template-status-webhooks/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included — CLAUDE.md requires ≥ 80% coverage, SC-005 requires no regressions, and FR-006 / FR-007 routing guarantees are only verifiable via tests.

**Organization**: Tasks are grouped by user story to enable independent implementation and verification of each story. US1 (status events) and US2 (quality events) are nearly independent — both depend only on the Foundational phase. US3 (routing integration) depends on BOTH US1 and US2 being present because its independent test requires a mixed-batch payload.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an in-progress task)
- **[Story]**: `[US1]`, `[US2]`, `[US3]` — maps to spec user stories
- File paths are absolute-from-repo-root (e.g. `src/webhooks/types.ts`)

## Path Conventions

Single TypeScript library. Source lives in `src/`, tests mirror in `tests/`. No sub-project splits.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Version bump and pre-work sanity check.

- [x] T001 Bump `"version"` in `package.json` from `0.4.0` to `0.5.0` (first v0.5.0 feature per SDK roadmap)
- [x] T002 Run `pnpm install && pnpm typecheck && pnpm test` to confirm the working tree is green before any edits

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared type additions and the behavior-preserving parser refactor that BOTH US1 and US2 build on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T003 Add optional `time?: number` to `WebhookEntry` in `src/webhooks/types.ts` (raw wire field; epoch seconds; used by template events only, safe no-op for existing events)
- [x] T004 Add `TemplateEventMetadata { readonly businessAccountId: string }` interface to `src/webhooks/types.ts` with TSDoc explaining why it is distinct from `EventMetadata` (reference Spec Clarifications §1)
- [x] T005 Refactor `parseWebhookPayload` in `src/webhooks/parser.ts`: replace `if (change.field !== 'messages') continue;` with a `switch (change.field)` containing only `case 'messages'` (existing behavior intact) and a `default` branch that logs `` `parseWebhookPayload: unrecognized change.field ${JSON.stringify(change.field).slice(0, 66)}, skipping` `` at `logger?.debug`. Pure refactor — all existing tests must continue to pass.
- [x] T006 Extend the existing parser refactor test suite in `tests/webhooks/parser.test.ts` with one new case asserting that a payload with an unknown `change.field` (e.g. `"template_category_update"`) produces zero events and calls `logger.debug` exactly once (validates T005 default branch; enables FR-010)
- [x] T006a [P] Re-export `TemplateEventMetadata` from `src/webhooks/index.ts` and from the main barrel `src/index.ts` (promoted to Foundational so US1 and US2 are each independently shippable; story-specific re-exports still live in T015/T029/T016/T030)

**Checkpoint**: `pnpm test && pnpm typecheck` green. The parser now has a field-routing skeleton; template cases will plug in during US1 and US2.

---

## Phase 3: User Story 1 — React to Template Review Decisions (Priority: P1) 🎯 MVP

**Goal**: Parse `message_template_status_update` payloads into `TemplateStatusEvent`s and dispatch them to a new `onTemplateStatus` callback — enabling callers to react to approvals, rejections (with reason), and other lifecycle transitions.

**Independent Test**: Feed a literal `message_template_status_update` JSON payload through `createWebhookHandler` with `onTemplateStatus` registered; assert the callback receives one event with the correct `templateId`, `templateName`, `language`, `status`, `reason`, and a `Date` `timestamp` — and that no other callback (onMessage/onStatus/onError/onFlowCompletion/onOrder) fires.

### Implementation for User Story 1

- [x] T007 [P] [US1] Add `TemplateStatus` union-plus-string type (`'APPROVED' | 'REJECTED' | 'PENDING' | 'PAUSED' | 'DISABLED' | 'PENDING_DELETION' | 'IN_APPEAL' | 'LIMIT_EXCEEDED' | 'FLAGGED' | (string & {})`) in `src/webhooks/types.ts` with TSDoc
- [x] T008 [P] [US1] Add `WebhookTemplateStatusPayload` raw wire type in `src/webhooks/types.ts` (fields: `event`, `message_template_id`, `message_template_name`, `message_template_language`, optional `reason`, optional `other_info`) matching contracts/webhook-events.md
- [x] T009 [US1] Add `TemplateStatusEvent` parsed interface in `src/webhooks/types.ts` with fields `type: 'template_status'`, `metadata: TemplateEventMetadata`, `templateId`, `templateName`, `language`, `status`, optional `reason`, optional `otherInfo`, `timestamp: Date` — and include it in the `WebhookEvent` discriminated union (depends on T004, T007, T008)
- [x] T010 [US1] Add optional `onTemplateStatus?: (event: TemplateStatusEvent) => void | Promise<void>` to `WebhookHandlerCallbacks` in `src/webhooks/types.ts` (depends on T009)
- [x] T011 [US1] Implement `extractTemplateStatusEvents(value, entry, events, logger)` helper in `src/webhooks/parser.ts` per contracts/parser-dispatch.md — guards against non-object `change.value` (null/array/primitive) at entry, narrows identity fields, coerces numeric `message_template_id` to string, normalizes `reason === 'NONE'` to `undefined`, sources `timestamp` from `entry.time * 1000`, log-and-skips on malformed value / missing identity / missing event / missing/non-numeric `entry.time`, never logs body content
- [x] T012 [US1] Add `case 'message_template_status_update': extractTemplateStatusEvents(change.value, entry, events, options?.logger); break;` to the parser switch in `src/webhooks/parser.ts` (depends on T011)
- [x] T013 [US1] Add `case 'template_status': await callbacks.onTemplateStatus?.(event); break;` to the dispatch switch in `createWebhookHandler` in `src/webhooks/handler.ts` (depends on T010)
- [x] T014 [US1] Extend `_pendingCallbacks` in `src/webhooks/webhooks.ts` with `onTemplateStatus?` and add fluent method `onTemplateStatus(callback): this` mirroring `onOrder` / `onFlowCompletion` patterns with TSDoc + `@example` (depends on T010)
- [x] T015 [P] [US1] Re-export `TemplateStatus`, `TemplateStatusEvent`, `WebhookTemplateStatusPayload` from `src/webhooks/index.ts` (`TemplateEventMetadata` is already re-exported by T006a)
- [x] T016 [P] [US1] Re-export the same three names from the main barrel `src/index.ts`

### Tests for User Story 1

- [x] T017 [P] [US1] Add parser tests in `tests/webhooks/parser.test.ts` covering: APPROVED, REJECTED with `reason`, REJECTED with `reason: 'NONE'` normalized to `undefined`, PENDING, PAUSED, DISABLED, unknown status string preserved verbatim, numeric `message_template_id` coerced to string, missing `message_template_id` log-and-skip, missing `message_template_name` log-and-skip, missing `message_template_language` log-and-skip, missing `event` log-and-skip, missing `entry.time` log-and-skip, non-object `change.value` (null and array) log-and-skip (~14 cases)
- [x] T018 [P] [US1] Add handler dispatch tests in `tests/webhooks/handler.test.ts`: onTemplateStatus fires exactly once for a single status payload; onTemplateStatus callback throw aborts remaining events in the batch; missing onTemplateStatus does not throw when a status event is present; delivering the same template_status payload twice fires onTemplateStatus twice (FR-012: SDK does not deduplicate) (~4 cases)
- [x] T019 [P] [US1] Add Webhooks-wrapper tests in `tests/webhooks/webhooks.test.ts` (create file if missing, otherwise extend): `onTemplateStatus()` stores into `_pendingCallbacks`, explicit `createHandler({ onTemplateStatus })` overrides the pending one, chained `.onTemplateStatus()` returns `this` (~3 cases)
- [x] T020 [US1] Run `pnpm test tests/webhooks/ && pnpm typecheck` — must be green before proceeding. This full-suite pass also implicitly verifies FR-011 (signature verification, raw-body handling, verify-token challenge, and middleware behavior remain unchanged) because all pre-existing webhook-security tests must run unmodified and pass.

**Checkpoint**: US1 MVP is fully functional. A caller can register `onTemplateStatus` and receive approval/rejection events with reason. Status events do not leak to other callbacks.

---

## Phase 4: User Story 2 — Monitor Template Quality Degradation (Priority: P2)

**Goal**: Parse `message_template_quality_update` payloads into `TemplateQualityEvent`s and dispatch them to a new `onTemplateQuality` callback — enabling callers to react to GREEN / YELLOW / RED / UNKNOWN transitions.

**Independent Test**: Feed a literal `message_template_quality_update` JSON payload through `createWebhookHandler` with `onTemplateQuality` registered; assert the callback receives one event with the correct `templateId`, `templateName`, `language`, `newScore`, `previousScore` (or `undefined` for first rating), and a `Date` `timestamp`.

### Implementation for User Story 2

- [x] T021 [P] [US2] Add `TemplateQualityScore` union-plus-string type (`'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN' | (string & {})`) in `src/webhooks/types.ts` with TSDoc
- [x] T022 [P] [US2] Add `WebhookTemplateQualityPayload` raw wire type in `src/webhooks/types.ts` matching contracts/webhook-events.md
- [x] T023 [US2] Add `TemplateQualityEvent` parsed interface in `src/webhooks/types.ts` with fields `type: 'template_quality'`, `metadata: TemplateEventMetadata`, `templateId`, `templateName`, `language`, `newScore`, optional `previousScore`, `timestamp: Date` — and extend the `WebhookEvent` union with it (depends on T021, T022)
- [x] T024 [US2] Add optional `onTemplateQuality?: (event: TemplateQualityEvent) => void | Promise<void>` to `WebhookHandlerCallbacks` in `src/webhooks/types.ts` (depends on T023)
- [x] T025 [US2] Implement `extractTemplateQualityEvents(value, entry, events, logger)` helper in `src/webhooks/parser.ts` per contracts/parser-dispatch.md — guards against non-object `change.value` (null/array/primitive) at entry, narrows identity fields, coerces numeric `message_template_id` to string, preserves absence of `previous_quality_score` as `undefined` (do NOT coerce to `'UNKNOWN'`), sources `timestamp` from `entry.time * 1000`, log-and-skips on malformed value / missing identity / missing `new_quality_score` / missing/non-numeric `entry.time`, never logs body content
- [x] T026 [US2] Add `case 'message_template_quality_update': extractTemplateQualityEvents(change.value, entry, events, options?.logger); break;` to the parser switch in `src/webhooks/parser.ts` (depends on T025)
- [x] T027 [US2] Add `case 'template_quality': await callbacks.onTemplateQuality?.(event); break;` to the dispatch switch in `createWebhookHandler` in `src/webhooks/handler.ts` (depends on T024)
- [x] T028 [US2] Extend `_pendingCallbacks` in `src/webhooks/webhooks.ts` with `onTemplateQuality?` and add fluent method `onTemplateQuality(callback): this` with TSDoc + `@example` (depends on T024)
- [x] T029 [P] [US2] Re-export `TemplateQualityScore`, `TemplateQualityEvent`, `WebhookTemplateQualityPayload` from `src/webhooks/index.ts`
- [x] T030 [P] [US2] Re-export the same three names from the main barrel `src/index.ts`

### Tests for User Story 2

- [x] T031 [P] [US2] Add parser tests in `tests/webhooks/parser.test.ts` covering: GREEN→YELLOW, YELLOW→RED, RED→GREEN, first rating with `previous_quality_score` absent (assert `previousScore === undefined`, NOT `'UNKNOWN'`), unknown score string preserved verbatim, numeric `message_template_id` coerced to string, missing required identity log-and-skip, missing `new_quality_score` log-and-skip, non-object `change.value` (null and array) log-and-skip (~9 cases)
- [x] T032 [P] [US2] Add handler dispatch tests in `tests/webhooks/handler.test.ts`: onTemplateQuality fires exactly once for a single quality payload; onTemplateQuality missing does not throw; both onTemplateStatus and onTemplateQuality registered receive only their own event types (~3 cases)
- [x] T033 [P] [US2] Add Webhooks-wrapper tests in `tests/webhooks/webhooks.test.ts`: `onTemplateQuality()` stores into `_pendingCallbacks`, explicit override precedence holds, chained `.onTemplateStatus().onTemplateQuality()` returns `this` each step (~3 cases)
- [x] T034 [US2] Run `pnpm test tests/webhooks/ && pnpm typecheck` — must be green before proceeding

**Checkpoint**: US1 AND US2 both functional. A caller can register both callbacks and receive the correct events for each.

---

## Phase 5: User Story 3 — Mixed-Batch Routing Integration (Priority: P3)

**Goal**: Prove the field-based routing fans out correctly for mixed-batch payloads and that no template event ever leaks into message/status/error/flow/order callbacks. Also cover forward-compatibility of unknown template-related fields and the full public-export surface.

**Independent Test**: Feed a single POST body containing `entry[0].changes[]` with a `messages` change AND a `message_template_status_update` change AND a `message_template_quality_update` change AND an unknown-field change; assert onMessage fires once for the message, onTemplateStatus fires once for the status update, onTemplateQuality fires once for the quality update, and the unknown field is logged at `debug` and ignored — with zero cross-callback contamination.

### Tests for User Story 3

- [x] T035 [P] [US3] Add mixed-batch parser test to `tests/webhooks/parser.test.ts`: single payload with a `messages` change + `message_template_status_update` + `message_template_quality_update` + unknown field in `entry.changes[]` produces exactly one of each expected event in order, and logs the unknown field at `debug` once
- [x] T036 [P] [US3] Add cross-contamination handler test to `tests/webhooks/handler.test.ts`: register ALL callbacks (onMessage, onStatus, onError, onFlowCompletion, onOrder, onTemplateStatus, onTemplateQuality) with spies; feed the mixed-batch payload from T035; assert each spy is called exactly the right number of times with events of the correct `type` and NOTHING else
- [x] T037 [P] [US3] Add "template events never reach message/status/error/flow/order callbacks" negative test to `tests/webhooks/handler.test.ts`: register only onMessage/onStatus/onError/onFlowCompletion/onOrder; feed a template_status + template_quality payload; assert NONE of the registered callbacks fire (FR-007)
- [x] T038 [P] [US3] Add ordering-preservation parser test to `tests/webhooks/parser.test.ts`: two template_status events and two template_quality events interleaved across two `entry` objects in a single payload produce the four events in the exact payload order
- [x] T039 [P] [US3] Add subpath export tests to `tests/exports/subpath-exports.test.ts` asserting all seven new names (`TemplateEventMetadata`, `TemplateStatus`, `TemplateQualityScore`, `TemplateStatusEvent`, `TemplateQualityEvent`, `WebhookTemplateStatusPayload`, `WebhookTemplateQualityPayload`) resolve identically from `@abdelrahmannasr-wa/cloud-api` and from `@abdelrahmannasr-wa/cloud-api/webhooks`
- [x] T040 [US3] Run `pnpm test && pnpm test:coverage` — assert full suite is green and coverage remains ≥ 80% on lines/functions/branches/statements per project threshold (SC-005)

**Checkpoint**: All three user stories are verified. Cross-story routing isolation and export surface are proven.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, runnable example, and final verification.

- [x] T041 [P] Add "Template lifecycle events" subsection to the existing Webhooks section of `README.md` (≤ 30 lines, use `onTemplateStatus` + `onTemplateQuality` via `wa.webhooks`, do NOT create a new top-level section) per contracts/public-exports.md
- [x] T042 [P] Update `CLAUDE.md`: extend the `src/webhooks/types.ts` description to name the new types; extend the `src/webhooks/parser.ts` description to mention field-based routing; append `+ TemplateStatusEvent/TemplateQualityEvent + onTemplateStatus/onTemplateQuality` to the webhooks entry under "Implementation Status"; add two new lines under "Meta WhatsApp Cloud API Reference" (`Webhook template status events: change.field === 'message_template_status_update'` and `Webhook template quality events: change.field === 'message_template_quality_update'`); prepend a new `012-template-status-webhooks: …` entry to the "Recent Changes" list
- [x] T043 [P] Create runnable example `examples/template-webhooks.ts`: boot an Express server, use `wa.webhooks.createExpressMiddleware` with `onTemplateStatus` and `onTemplateQuality`, log status transitions with rejection reason branching, log quality changes with `newScore`/`previousScore` branching
- [x] T044 Run `pnpm lint && pnpm format:check && pnpm build` and fix any findings
- [x] T045 Run `pnpm test:coverage` one final time to confirm ≥ 80% coverage on all new files and that no existing coverage regressed
- [x] T046 Walk through `specs/012-template-status-webhooks/quickstart.md` end-to-end: (1) run `pnpm tsx examples/template-webhooks.ts` and confirm the Express server boots with both callbacks registered; (2) confirm the standalone `createWebhookHandler` block from quickstart.md §"Standalone-handler usage" compiles in a throwaway `tsc --noEmit` check; (3) confirm the `parseWebhookPayload`-only block from quickstart.md §"Parsing payloads directly" compiles the same way; (4) verify subpath import parity using the same assertion pattern as T039 (`TemplateStatusEvent` imported from the main barrel and from `./webhooks` resolve to structurally identical types).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup.
- **US1 (Phase 3)** and **US2 (Phase 4)**: Each depends only on Foundational. They edit overlapping files (`src/webhooks/types.ts`, `parser.ts`, `handler.ts`, `webhooks.ts`, `src/webhooks/index.ts`, `src/index.ts`), so serial execution by one developer is recommended; if staffed by two, do US1 → rebase US2.
- **US3 (Phase 5)**: Depends on BOTH US1 and US2 being complete — its tests exercise mixed-batch routing that requires both extractors and both callbacks to exist.
- **Polish (Phase 6)**: Depends on US1 + US2 + US3.

### Within Each User Story

- Type additions before extractors.
- Extractors before parser switch case.
- Callbacks interface extension before handler dispatch case.
- Callbacks interface extension before `Webhooks` wrapper method.
- Implementation before tests.
- Re-exports independent (can run after any type addition).

### Parallel Opportunities

- Phase 2: T003 and T004 touch the same file; run sequentially. T005 is in a different file, so [P] with T003/T004 only until T005 needs both to be present (actually T005 doesn't depend on T003 or T004 — it's a pure refactor). None marked [P] to keep the phase small.
- Phase 3: T007, T008 [P] (different type definitions in same file — but same file requires serialization; so practically these can be one edit). T015, T016 [P] (different files). T017, T018, T019 [P] (different test files or different test blocks in the same file).
- Phase 4: Same pattern as Phase 3.
- Phase 5: T035, T036, T037, T038, T039 all [P] — different test blocks / files.
- Phase 6: T041, T042, T043 all [P] — different files.

### File-Level Contention

`src/webhooks/types.ts`, `src/webhooks/parser.ts`, `src/webhooks/handler.ts`, `src/webhooks/webhooks.ts`, `src/webhooks/index.ts`, and `src/index.ts` are each touched by both US1 and US2. Single-writer at a time within each story. Between stories, finish US1 commits before starting US2 to avoid rebase churn.

---

## Parallel Example: Tests for User Story 1

Once T007–T016 are done, the three test groups can run in parallel:

```bash
# Parser cases (T017) — tests/webhooks/parser.test.ts
# Handler dispatch cases (T018) — tests/webhooks/handler.test.ts
# Webhooks wrapper cases (T019) — tests/webhooks/webhooks.test.ts
pnpm test tests/webhooks/parser.test.ts &
pnpm test tests/webhooks/handler.test.ts &
pnpm test tests/webhooks/webhooks.test.ts &
wait
```

---

## Implementation Strategy

### MVP (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T002)
2. Complete Phase 2: Foundational (T003–T006)
3. Complete Phase 3: US1 (T007–T020)
4. **STOP and VALIDATE**: approvals/rejections reach `onTemplateStatus` with reason; no cross-callback leak; full suite green at ≥ 80% coverage
5. Ship as 0.5.0 if only status support is needed right now, or continue

### Incremental Delivery

1. Setup + Foundational → refactor-safe baseline
2. US1 → ship; callers can react to approvals/rejections
3. US2 → ship; callers can react to quality changes
4. US3 → verification only; no user-facing shipping step beyond the test assertions
5. Polish → README, example, CLAUDE.md

### Single-Developer Strategy

This feature is small and tightly scoped to `src/webhooks/`. Recommended path for one developer is straight serial execution T001 → T046.

### Parallel-Team Strategy

1. Developer A: T001–T006 (Setup + Foundational)
2. Once merged, Developer A takes US1 (T007–T020); Developer B takes US2 in a separate branch rebased on top of US1
3. Developer A or B takes US3 and Polish after both stories land

---

## Notes

- [P] tasks = different files or non-overlapping in the same file; no in-flight dependency
- Every task has an exact file path
- Tests live in `tests/webhooks/` mirroring `src/webhooks/`
- No network in any test — all tests feed literal JSON payloads into the parser/handler
- Commit atomically per logical change (per user feedback-memory on atomic commit style)
- Stop at any checkpoint to validate the increment before proceeding
