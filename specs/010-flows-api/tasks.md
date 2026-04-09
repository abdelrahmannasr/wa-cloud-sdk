---
description: "Task list for WhatsApp Flows API (010-flows-api)"
---

# Tasks: WhatsApp Flows API

**Input**: Design documents from `/specs/010-flows-api/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md
**Branch**: `010-flows-api`

## Commit workflow (non-negotiable)

After completing each task below, run `/gen-commit-msg` and create **one commit** that contains only that task's changes. The commit message MUST NOT include the `Co-Authored-By: Claude …` footer. Tasks are sized deliberately so that one task == one atomic commit. Tasks labeled `[verify]` produce no commit — they are quality gates between commits.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: `[US1]`, `[US2]`, `[US3]`, `[US4]` — maps to user stories in spec.md
- **[verify]**: Verification-only task (no commit, no code change)
- All file paths are absolute or rooted at the repo root `/Users/amn/Documents/Projects/SDK/wa-cloud-sdk/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No new setup — branch `010-flows-api` is already checked out, specs are in place, scripts run.

- [X] T001 [verify] Confirm working branch is `010-flows-api`, working tree is clean, and `specs/010-flows-api/{spec.md,plan.md,research.md,data-model.md,contracts/,quickstart.md,checklists/}` all exist (use `git status` and `ls`)

**Checkpoint**: Ready to begin user-story work. No commit produced.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: This feature has **no foundational prerequisites** — each user story is independently implementable from scratch. Phase intentionally empty.

**Checkpoint**: Phase skipped. Proceed directly to Phase 3 (US1).

---

## Phase 3: User Story 1 — Send a Flow to a User (Priority: P1) 🎯 MVP

**Goal**: A consumer can call `messages.sendFlow({ to, body, flowCta, flowId })` and deliver an interactive flow invitation to a recipient, with full support for draft/published modes, reply-to, correlation tokens, initial screen + data, header/footer, per-call version override, and multi-account broadcast usage.

**Independent Test**: Mock `HttpClient.post`, call `messages.sendFlow(...)`, and assert the exact JSON payload shape sent to `{phoneNumberId}/messages`. Verify draft mode, version override, initial payload, reply-to, and header/footer all produce the expected wire fields. Separately, exercise `WhatsAppMultiAccount.broadcast()` with a factory that calls `sendFlow` across two mock accounts.

### Implementation for User Story 1

- [X] T002 [US1] Add `FlowMessageOptions` interface to `src/messages/types.ts` (extends `BaseMessageOptions`; fields: body, flowCta, flowId, flowToken?, mode?, flowAction?, flowActionPayload?, flowMessageVersion?, header?, footer?) — see `specs/010-flows-api/data-model.md §15` and `specs/010-flows-api/contracts/send-flow.md` for exact shape
- [X] T003 [US1] Export `FlowMessageOptions` type from `src/messages/index.ts` barrel
- [X] T004 [US1] Add `sendFlow(options, requestOptions?)` method to `src/messages/messages.ts`, inserted after `sendLocationRequest` (lines 417-430). Implementation follows `specs/010-flows-api/contracts/send-flow.md §Implementation detail` verbatim. Reuse `buildBasePayload()` and `buildInteractiveOptionals()`. Default `mode='published'`, `flow_action='navigate'`, `flow_message_version='3'`. Include TSDoc with `@example`.
- [X] T005 [US1] Add `sendFlow` unit test suite to `tests/messages/messages.test.ts` (~8 tests): minimal payload shape, draft mode, per-call version override, correlation token, initial screen + data, reply-to, header + footer, phone validation error. Follow mock pattern from `tests/messages/messages.test.ts:651-678` (`sendInteractiveCta`).
- [X] T006 [US1] Add broadcast-with-flows scenario test to `tests/multi-account/multi-account.test.ts` — a factory that calls `messages.sendFlow` across two mock accounts with per-account flow-ID mapping. Asserts each recipient receives the correct per-account flow_id on the wire. Satisfies FR-007a test requirement.
- [X] T007 [US1] [verify] Run `pnpm typecheck && pnpm lint && pnpm test -- tests/messages tests/multi-account` — must pass with zero errors. No commit.

**Checkpoint**: User Story 1 is fully functional. A consumer can send flows using `new WhatsApp({...}).messages.sendFlow(...)`. Demo-ready as MVP.

---

## Phase 4: User Story 2 — Receive a Flow Completion Response (Priority: P2)

**Goal**: A consumer registers `onFlowCompletion` on the webhooks handler and receives a typed `FlowCompletionEvent` whenever a user submits a flow. Events carry `messageId` for consumer-side deduplication, raw `responseJson`, a parsed `response` object, and contact metadata. Button replies and list replies continue to route through `onMessage` unchanged.

**Independent Test**: Simulate a webhook POST with `interactive.type === 'nfm_reply'` via `parseWebhookPayload()` and `createWebhookHandler()` with a mock `onFlowCompletion` callback. Assert the callback fires with a `FlowCompletionEvent`, `onMessage` does NOT fire for the same payload, and button_reply payloads still fire `onMessage`.

### Implementation for User Story 2

- [ ] T008 [US2] Add `WebhookNfmReply` interface and extend `WebhookInteractivePayload` in `src/webhooks/types.ts` (add `'nfm_reply'` to the type union, add optional `nfm_reply?: WebhookNfmReply` field). Exact shapes in `specs/010-flows-api/contracts/webhook-events.md §New types`.
- [ ] T009 [US2] Add `FlowCompletionEvent` interface to `src/webhooks/types.ts` and extend the `WebhookEvent` union to include it. Fields: type discriminator, metadata, contact, messageId, flowToken? (always undefined), responseJson, response, timestamp. Shape from `data-model.md §16`.
- [ ] T010 [US2] Add `onFlowCompletion?` callback to `WebhookHandlerCallbacks` in `src/webhooks/types.ts`. Signature: `(event: FlowCompletionEvent) => void | Promise<void>`.
- [ ] T011 [US2] Edit `extractMessageEvents()` in `src/webhooks/parser.ts:49-72` to divert `nfm_reply` messages into a `FlowCompletionEvent` **instead of** a `MessageEvent`. Wrap `JSON.parse(response_json)` in try/catch; on failure, `response = {}` and `responseJson` still equals the raw string. Exact implementation in `contracts/webhook-events.md §Parser behavior`. **CRITICAL (FR-030)**: do NOT pass `response_json`, `responseJson`, `response`, or any `nfm_reply` field to the logger.
- [ ] T012 [US2] Add `case 'flow_completion':` branch to the dispatch switch in `src/webhooks/handler.ts:94-104`, calling `await callbacks.onFlowCompletion?.(event)`.
- [ ] T013 [US2] Re-export `FlowCompletionEvent` and `WebhookNfmReply` type names from `src/webhooks/index.ts`.
- [ ] T014 [US2] Add `describe('flow completion events')` block to `tests/webhooks/parser.test.ts` (~7 tests): diverts nfm_reply to FlowCompletionEvent (not MessageEvent); parses valid response_json into `response`; preserves raw `responseJson` byte-for-byte; tolerates malformed JSON (response = {}, no throw); `button_reply` still produces MessageEvent (regression); metadata/contact/timestamp populated correctly; asserts `event.flowToken === undefined` even when a `flow_token` field exists elsewhere in the payload (regression guard for Assumption 4 / research decision §8). Use existing `createPayload` fixture helper.
- [ ] T015 [US2] Add `describe('onFlowCompletion callback')` block to `tests/webhooks/handler.test.ts` (~3 tests): routed correctly when registered; `onMessage` NOT invoked for same nfm_reply payload; mixed payload (text + flow completion) invokes both callbacks exactly once each.
- [ ] T016 [US2] [verify] Run `pnpm typecheck && pnpm lint && pnpm test -- tests/webhooks` — must pass. No commit.
- [ ] T017 [US2] [verify] Run logging audit: `grep -rnE 'logger\.(debug\|info\|warn\|error).*(response_json\|responseJson\|nfm_reply\|\\bresponse\\b)' src/webhooks/` — must output zero matches. Satisfies FR-030 compliance check. No commit.

**Checkpoint**: User Story 2 is fully functional. Consumers receive flow submissions as a distinct, typed event.

---

## Phase 5: User Story 3 — Create and Publish a New Flow (Priority: P3)

**Goal**: A consumer can programmatically create a new flow (name, categories, optional flow_json), upload the flow JSON as a string or object, and publish the flow — all without using Meta's business tools web UI. This phase delivers the `Flows` class skeleton plus the create/publish methods.

**Independent Test**: Instantiate `new Flows(mockClient, 'waba_id')` directly (no unified client integration yet). Call `create({ name, categories })` with a mocked POST spy and assert the request body. Call `publish(flowId)` and assert the path. Verify validation errors from the mock response pass through in `CreateFlowResponse.validation_errors`.

### Implementation for User Story 3

- [ ] T018 [US3] Create `src/flows/types.ts` with Phase 5 types: `FlowCategory` union, `FlowStatus` union, `FlowValidationError` interface, `Flow` interface, `CreateFlowRequest`, `CreateFlowResponse`, `FlowPublishResponse`, and validation constants (`MAX_FLOW_NAME_LENGTH`, `MAX_FLOW_CATEGORIES`, `MAX_FLOW_JSON_BYTES`). Re-export `PagingInfo` from `../templates/types.js` for use in US4. Exact shapes in `data-model.md §§1-9` and `§13`.
- [ ] T019 [US3] Create `src/flows/flows.ts` with `Flows` class: constructor `(client: HttpClient, businessAccountId: string)` with empty/whitespace validation → `ValidationError('businessAccountId is required and cannot be empty', 'businessAccountId')`. Add `create(request, requestOptions?)` and `publish(flowId, requestOptions?)` methods. Follow the shape of `src/templates/templates.ts` exactly. Include TSDoc with `@example` on every public symbol. Implementation detail in `contracts/flows-class.md §Public methods`.
- [ ] T020 [US3] Create `src/flows/index.ts` barrel that re-exports `Flows` class and the Phase 5 types (`FlowCategory`, `FlowStatus`, `Flow`, `FlowValidationError`, `CreateFlowRequest`, `CreateFlowResponse`, `FlowPublishResponse`) and constants. Leave the remaining US4 types as a TODO comment to be added in T026.
- [ ] T021 [US3] Create `tests/flows/flows.test.ts` with constructor tests (~5) + create tests (~3) + publish tests (~2). Copy `createMockClient()` helper from `tests/templates/templates.test.ts:9-26`, extended to include an `upload` spy alongside `get/post/delete`. Assert exact HTTP path (`{wabaId}/flows`, `{flowId}/publish`) and body shape.
- [ ] T022 [US3] [verify] Run `pnpm typecheck && pnpm lint && pnpm test -- tests/flows` — must pass. No commit.

**Checkpoint**: User Story 3 is fully functional via direct `new Flows(client, wabaId)` instantiation. Unified client integration is deferred to Polish phase (T039).

---

## Phase 6: User Story 4 — Administer the Flow Lifecycle (Priority: P4)

**Goal**: Extend the `Flows` class with the remaining lifecycle operations: `list`, `get`, `updateMetadata`, `updateAssets` (multipart flow JSON upload), `deprecate`, `delete`, and `getPreview`. Consumers can now audit, maintain, and retire flows entirely from code.

**Independent Test**: Extend existing `tests/flows/flows.test.ts` with mocked tests for each new method. Verify `list()` query-string assembly, `get()` path, `updateMetadata()` body, `updateAssets()` FormData construction (both string and object `flow_json` inputs), `publish`/`deprecate` path, `delete()` DELETE verb, and `getPreview()` query param.

### Implementation for User Story 4

- [ ] T023 [US4] Extend `src/flows/types.ts` with Phase 6 types: `FlowListParams`, `FlowListResponse`, `FlowGetOptions`, `UpdateFlowMetadataRequest`, `UpdateFlowAssetsRequest` (polymorphic `flow_json: string | Record<string, unknown>`), `UpdateFlowAssetsResponse`, `FlowDeleteResponse`, `FlowDeprecateResponse`, `FlowPreviewResponse`. Shapes in `data-model.md §§5-7` and `§§10-14`.
- [ ] T024 [US4] Add `list(params?, requestOptions?)` and `get(flowId, options?, requestOptions?)` methods to `src/flows/flows.ts`. Build `queryParams` record; join `fields` array with `,`. Contract in `contracts/flows-class.md`. TSDoc with `@example` on each.
- [ ] T025 [US4] Add `updateMetadata(flowId, updates, requestOptions?)` and `updateAssets(flowId, request, requestOptions?)` methods to `src/flows/flows.ts`. `updateAssets` stringifies `flow_json` when it's an object, constructs a `Blob` with `type: 'application/json'`, and builds FormData with `name` (default `'flow.json'`), `asset_type` (default `'FLOW_JSON'`), `file`. Routes through the existing `HttpClient.upload()`. TSDoc with `@example` on each.
- [ ] T026 [US4] Add `deprecate(flowId, requestOptions?)`, `delete(flowId, requestOptions?)`, and `getPreview(flowId, requestOptions?)` methods to `src/flows/flows.ts`. `getPreview` is a thin shortcut over `get()` with `fields: ['preview.invalidate(false)']`. TSDoc with `@example` on each.
- [ ] T027 [US4] Extend `src/flows/index.ts` barrel to export the Phase 6 types added in T023 and remove the US4 TODO comment.
- [ ] T028 [US4] Extend `tests/flows/flows.test.ts` with list + get unit tests (~7 cases): no params, limit/after/before, fields joined, requestOptions forwarded, response typing, get with flowId, get with fields option.
- [ ] T029 [US4] Extend `tests/flows/flows.test.ts` with updateMetadata + updateAssets unit tests (~7 cases): partial metadata update, full metadata update, updateAssets with string flow_json, updateAssets with object flow_json (verify SDK stringifies), default FormData name/asset_type, explicit FormData name/asset_type, requestOptions forwarded.
- [ ] T030 [US4] Extend `tests/flows/flows.test.ts` with deprecate + delete + getPreview unit tests (~6 cases): deprecate path, delete DELETE verb, getPreview query param, each with requestOptions forwarded.
- [ ] T031 [US4] [verify] Run `pnpm typecheck && pnpm lint && pnpm test -- tests/flows` — must pass. No commit.

**Checkpoint**: User Story 4 is fully functional via direct `new Flows(client, wabaId)` instantiation. All ten public Flows methods now exist and are tested.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Unified client integration, main barrel exports, subpath export, build config, documentation, examples, and final verification. Each task is a separate commit except those marked `[verify]`.

### Unified client + exports

- [ ] T032 Add lazy `flows` getter to `src/whatsapp.ts`: private `_flows?: Flows;` field, import `Flows` from `./flows/index.js`, and `get flows()` method mirroring `get templates()` at lines 122-134 (validates `businessAccountId`, throws `ValidationError` at first access if missing, caches instance). Contract in `contracts/public-exports.md §Unified client integration`.
- [ ] T033 Extend `tests/whatsapp.test.ts` with flows lazy-init tests (~3 cases): access succeeds with `businessAccountId` set; access throws `ValidationError` with field `'businessAccountId'` when missing; `wa.flows === wa.flows` (cached instance).
- [ ] T034 Extend main barrel `src/index.ts` to export `Flows` class and all flow types from `./flows/index.js` (following the templates block at lines 92-121 as a pattern). `FlowMessageOptions`, `FlowCompletionEvent`, and `WebhookNfmReply` are already reachable via the messages and webhooks re-exports — no additional edits needed for those.
- [ ] T035 Add `./flows` subpath export to `package.json` `exports` map (after `./templates` at lines 89-98), following the established ESM/CJS/types pattern.
- [ ] T036 Add `'flows/index': 'src/flows/index.ts'` entry to `tsup.config.ts` `entry` object (alongside the existing eight module entries).
- [ ] T037 Extend `tests/exports/` subpath verification tests to cover `./flows` (ESM import, CJS require, type-only imports work). Mirror existing `./templates` or `./media` test cases.
- [ ] T038 [verify] Run `pnpm build` and verify `dist/flows/index.js`, `dist/flows/index.cjs`, `dist/flows/index.d.ts`, `dist/flows/index.d.cts` all exist. No commit.
- [ ] T039 [verify] Run `pnpm pack --dry-run` and confirm `./flows` subpath is listed in the published exports. No commit.

### Documentation

- [ ] T040 Update `CLAUDE.md`: add `src/flows/` block to the Module Structure tree; add "flows" to the Implemented list in Implementation Status; add Flows API endpoints to the "Meta WhatsApp Cloud API Reference" section; update the "Subpath exports" line to include `./flows`. Preserve the existing `## Active Technologies` / `## Recent Changes` sections — only edit the sections that exist to describe the modules.
- [ ] T041 [P] Update `README.md` with a new "Flows" section documenting `sendFlow()`, the `Flows` CRUD class (all 10 methods), the `onFlowCompletion` callback, and the per-account flow-identifier constraint for multi-account broadcast. Include runnable snippets pulled from `specs/010-flows-api/quickstart.md`.
- [ ] T042 [P] Create `examples/flows.ts` — runnable example demonstrating: create a flow (T018-style), upload flow JSON via `updateAssets`, publish, send to a user via `sendFlow`, handle a flow completion via `onFlowCompletion` with consumer-side dedup using `messageId`, multi-account broadcast with per-account flow-ID map. Mirror the structure of existing `examples/` files.

### Final gates

- [ ] T043 [verify] Run `pnpm test:coverage` and confirm lines/functions/branches/statements are all ≥ 80%. If any metric drops below 80%, add targeted tests until the gate passes (add these as extra tasks before T043 re-runs). No commit.
- [ ] T044 [verify] Run full logging audit across the whole new module surface: `grep -rnE 'logger\.(debug\|info\|warn\|error).*(response_json\|responseJson\|nfm_reply\|flow_json)' src/ tests/` — must output zero matches outside of test fixtures. Confirms FR-030 + SC-015 at final scope. No commit.
- [ ] T045 [verify] Manual smoke test against `specs/010-flows-api/quickstart.md`: walk through sections 1, 2, 3, 5, 6, 7, 8, 9, 11 in a scratch file (not committed), confirming every import resolves, every method typechecks, and the example compiles. Repeat for section 12 (subpath import). No commit.
- [ ] T046 [verify] Backward-compat audit: from the main barrel (`src/index.ts`) and every subpath entry (`src/errors/index.ts`, `src/messages/index.ts`, `src/webhooks/index.ts`, `src/media/index.ts`, `src/templates/index.ts`, `src/phone-numbers/index.ts`, `src/multi-account/index.ts`), list all exported symbol names and compare against the pre-feature baseline (`git show main:src/index.ts` etc.). Confirm **no existing symbol has been removed, renamed, or had its type narrowed**. Satisfies FR-028 / SC-012. No commit.
- [ ] T047 [verify] Zero-dependency audit: run `jq '.dependencies // {} | length' package.json` and confirm the result is `0` (or the `dependencies` field is absent). Also `grep -n '"dependencies"' package.json` to inspect the exact field contents. Confirms no runtime dependency was introduced. Satisfies FR-029 / SC-013. No commit.
- [ ] T048 [verify] Run `pnpm typecheck && pnpm lint && pnpm test && pnpm build` one final time. All green. No commit.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — verification only
- **Phase 2 (Foundational)**: Empty — no prerequisites
- **Phase 3 (US1)**: No dependencies on other user stories. Can start immediately.
- **Phase 4 (US2)**: No dependencies on US1. Can be worked in parallel with US1.
- **Phase 5 (US3)**: No dependencies on US1/US2. Can be worked in parallel.
- **Phase 6 (US4)**: Depends on Phase 5 (uses the `Flows` class created in US3). Must start after US3.
- **Phase 7 (Polish)**: Depends on all user stories being complete.

### Within each user story

- Types before implementation: add interfaces first (T002, T008, T018, T023), then use them in class/function code (T004, T011, T019, T024).
- Implementation before tests: but in this feature tests are additive — they don't gate the impl. Order is flexible as long as each task's changes are self-contained.
- Re-export barrel before final verify: ensure the new symbols are reachable from the public surface before the `[verify]` steps.

### Parallel opportunities

| Parallelizable task pairs | Rationale |
|---|---|
| **US1 (Phase 3) ∥ US2 (Phase 4) ∥ US3 (Phase 5)** | Three user stories touch non-overlapping files — can be worked by three developers concurrently |
| T006 [P] ∥ rest of US1 | Touches `tests/multi-account/multi-account.test.ts`, independent of messages tests |
| T041 [P] ∥ T042 [P] | README.md and examples/flows.ts are separate files |

**Note**: Despite parallelism being possible for story-level work, **the atomic-commit requirement means one task at a time per developer**. Parallelism is useful across developers, not within one developer's work.

---

## Parallel Example: User Story 1

```bash
# Sequential (single developer) — one commit per task:
pnpm task T002    # types(messages): add FlowMessageOptions
/gen-commit-msg
pnpm task T003    # export(messages): re-export FlowMessageOptions
/gen-commit-msg
pnpm task T004    # feat(messages): add sendFlow method
/gen-commit-msg
pnpm task T005    # test(messages): add sendFlow unit tests
/gen-commit-msg
pnpm task T006    # test(multi-account): add broadcast-with-flows scenario
/gen-commit-msg
pnpm typecheck && pnpm lint && pnpm test    # T007 verify gate — no commit
```

With multiple developers:

```bash
# Developer A: US1 (messages send path)
# Developer B: US2 (webhooks receive path)
# Developer C: US3 (Flows class skeleton) — then hands off to Developer D for US4
# Each developer commits their own tasks atomically
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Skip Phase 1 (verify-only) and Phase 2 (empty)
2. Complete Phase 3 (US1) — 6 tasks, ~6 commits
3. **STOP and validate**: `pnpm test` green, `sendFlow` ships in a test consumer
4. Merge / demo if ready — consumer can send existing (manually authored) flows to users

### Incremental delivery after MVP

1. US1 done → US2 (receive completions) → ~10 commits → consumers have round-trip
2. US2 done → US3 (create + publish) → ~5 commits → consumers can author flows from code
3. US3 done → US4 (full lifecycle) → ~9 commits → full admin capabilities
4. US4 done → Polish → ~15 commits → unified client, docs, examples, build, release ready

Total: ~45 atomic commits from start to finish (plus ~17 verification gates that produce no commits).

### Parallel team strategy

With 3 developers:

| Developer | Phase 3+ work | Commits |
|---|---|---|
| A | US1 (Phase 3) | ~6 |
| B | US2 (Phase 4) | ~10 |
| C | US3 (Phase 5) → US4 (Phase 6) | ~5 + ~9 = ~14 |

After US4 completes, all three collaborate on Phase 7 (Polish) — ~15 more commits shared among team.

---

## Notes

- `[P]` tasks = different files, no dependencies, safe to parallelize across developers
- `[Story]` label maps task to user story for traceability (US1..US4)
- `[verify]` tasks are gates — they produce no commit. They exist to prevent broken intermediate states from being committed.
- Each non-verify task maps to **exactly one** atomic commit via `/gen-commit-msg`. No batching across tasks.
- **NO Claude footer** in commit messages. The repo's existing commit history shows clean atomic commits without footers — maintain that convention.
- The file paths in each task are specific and actionable. An LLM (or human) should be able to complete any task without re-reading the full spec/plan — the contract files under `specs/010-flows-api/contracts/` contain all the exact code-level detail needed.
- Before starting any task, re-read the task description + the referenced contract section. Do not speculate.
- If a verify task fails: fix the issue in a dedicated commit before continuing. Do not amend the previous commit.
- If a PR reviewer finds a gap: add a new task at the end of the relevant phase, complete it, commit atomically.
