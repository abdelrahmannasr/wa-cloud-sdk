# Tasks: Messaging Enhancements (v0.2.0)

**Input**: Design documents from `/specs/008-messaging-enhancements/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Build configuration changes needed before any feature work.

- [x] T001 [P] Add 4 new entry points to `tsup.config.ts`: `'media/index': 'src/media/index.ts'`, `'templates/index': 'src/templates/index.ts'`, `'phone-numbers/index': 'src/phone-numbers/index.ts'`, `'multi-account/index': 'src/multi-account/index.ts'`
- [x] T002 [P] Add 4 new subpath exports to `package.json` exports field: `./media`, `./templates`, `./phone-numbers`, `./multi-account` — each with `import` (types + default) and `require` (types + default) following the existing `./errors`/`./messages`/`./webhooks` pattern

**Checkpoint**: `pnpm build` should produce ESM + CJS + DTS output for all 8 entry points (4 existing + 4 new).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared type changes that all user stories depend on.

**CRITICAL**: US1 (reply-to) modifies all option interfaces and `buildBasePayload()`. Must complete before US2/US3 which add new methods that also need reply-to support.

- [x] T003 Add optional `readonly replyTo?: string` field to all 12 message option interfaces in `src/messages/types.ts`: TextMessageOptions, ImageMessageOptions, VideoMessageOptions, AudioMessageOptions, DocumentMessageOptions, StickerMessageOptions, LocationMessageOptions, ContactsMessageOptions, ReactionMessageOptions, InteractiveButtonMessageOptions, InteractiveListMessageOptions, TemplateMessageOptions. Do NOT add to MarkAsReadOptions.
- [x] T004 Update `buildBasePayload()` in `src/messages/messages.ts` to accept optional `replyTo?: string` parameter. If provided and non-empty after trimming, include `context: { message_id: replyTo }` in the returned payload object. If empty/whitespace/undefined, omit context entirely.
- [x] T005 Update all 12 send methods in `src/messages/messages.ts` to pass `options.replyTo` to `buildBasePayload()`. Each method's payload construction changes from `...this.buildBasePayload(options.to, '<type>')` to `...this.buildBasePayload(options.to, '<type>', options.replyTo)`.

**Checkpoint**: All existing tests still pass. No new methods yet — just the reply-to plumbing on existing methods.

---

## Phase 3: User Story 1 — Reply-to Context (Priority: P1) MVP

**Goal**: Consumers can send quoted replies on any message type.

**Independent Test**: Send a text message with `replyTo` set, verify payload includes `context.message_id`.

### Tests for User Story 1

- [ ] T006 [US1] Add tests in `tests/messages/messages.test.ts` for reply-to context:
  - Test `sendText` with `replyTo` includes `context: { message_id }` in payload
  - Test `sendImage` with `replyTo` includes context
  - Test `sendText` without `replyTo` has no context field (backward compat)
  - Test `sendText` with empty string `replyTo` sends no context
  - Test `sendText` with whitespace-only `replyTo` sends no context

### Implementation for User Story 1

- [ ] T007 [US1] Update `src/messages/index.ts` barrel export — no new types needed (replyTo is added to existing interfaces in T003)
- [ ] T008 [US1] Run `pnpm test` to verify all reply-to tests pass and all existing tests remain green

**Checkpoint**: Reply-to works on all message types. Backward compatibility confirmed.

---

## Phase 4: User Story 2 — CTA URL Button Messages (Priority: P2)

**Goal**: Consumers can send CTA URL button messages.

**Independent Test**: Send a CTA URL button message, verify payload matches Meta's `cta_url` interactive format.

### Tests for User Story 2

- [ ] T009 [US2] Add tests in `tests/messages/messages.test.ts` for CTA URL buttons:
  - Test `sendInteractiveCta` with required fields (to, body, buttonText, url) sends correct payload
  - Test with optional header (text type) includes header in interactive payload
  - Test with optional footer includes footer in interactive payload
  - Test with `urlSuffix` includes `url` with `{{1}}` appended and `example` array in parameters
  - Test with `replyTo` includes context alongside interactive payload
  - Test phone number validation (invalid number throws ValidationError)

### Implementation for User Story 2

- [ ] T010 [US2] Add `CtaUrlButtonMessageOptions` interface to `src/messages/types.ts` with fields: `to`, `body`, `buttonText`, `url`, `urlSuffix?`, `header?` (InteractiveHeader), `footer?`, `replyTo?`
- [ ] T011 [US2] Add `sendInteractiveCta()` method to `src/messages/messages.ts`. Build payload with `interactive.type: 'cta_url'`, `action.name: 'cta_url'`, `action.parameters: { display_text, url }`. Handle optional urlSuffix, header, footer. Pass replyTo to buildBasePayload.
- [ ] T012 [US2] Export `CtaUrlButtonMessageOptions` from `src/messages/index.ts`
- [ ] T013 [US2] Run `pnpm test` to verify CTA URL button tests pass

**Checkpoint**: CTA URL buttons work with all optional combinations.

---

## Phase 5: User Story 3 — Location Request Messages (Priority: P3)

**Goal**: Consumers can request recipient's location.

**Independent Test**: Send a location request message, verify payload matches Meta's `location_request_message` interactive format.

### Tests for User Story 3

- [ ] T014 [US3] Add tests in `tests/messages/messages.test.ts` for location request:
  - Test `sendLocationRequest` with required fields (to, body) sends correct payload with `interactive.type: 'location_request_message'` and `action.name: 'send_location'`
  - Test with `replyTo` includes context
  - Test phone number validation

### Implementation for User Story 3

- [ ] T015 [US3] Add `LocationRequestMessageOptions` interface to `src/messages/types.ts` with fields: `to`, `body`, `replyTo?`
- [ ] T016 [US3] Add `sendLocationRequest()` method to `src/messages/messages.ts`. Build payload with `interactive.type: 'location_request_message'`, `body.text`, `action.name: 'send_location'`.
- [ ] T017 [US3] Export `LocationRequestMessageOptions` from `src/messages/index.ts`
- [ ] T018 [US3] Run `pnpm test` to verify location request tests pass

**Checkpoint**: Location request messages work.

---

## Phase 6: User Story 4 — Typing Indicators (Priority: P4)

**Goal**: Consumers can show typing status.

**Independent Test**: Send a typing indicator, verify payload uses `status: 'typing'`.

### Tests for User Story 4

- [ ] T019 [US4] Add tests in `tests/messages/messages.test.ts` for typing indicators:
  - Test `sendTypingIndicator` with `to` sends payload with `messaging_product: 'whatsapp'`, `status: 'typing'`, `recipient_type: 'individual'`, `to`
  - Test phone number validation

### Implementation for User Story 4

- [ ] T020 [US4] Add `TypingIndicatorOptions` interface to `src/messages/types.ts` with field: `to`
- [ ] T021 [US4] Add `sendTypingIndicator()` method to `src/messages/messages.ts`. Build payload with `{ messaging_product: 'whatsapp', status: 'typing', recipient_type: 'individual', to: validatePhoneNumber(options.to) }`. Use `this.send()` to post to messages endpoint.
- [ ] T022 [US4] Export `TypingIndicatorOptions` from `src/messages/index.ts`
- [ ] T023 [US4] Run `pnpm test` to verify typing indicator tests pass

**Checkpoint**: Typing indicators work.

---

## Phase 7: User Story 5 — Subpath Exports (Priority: P5)

**Goal**: Each of 4 modules importable via dedicated subpath.

**Independent Test**: Build output contains ESM + CJS + DTS for all 4 new entry points.

### Implementation for User Story 5

- [ ] T024 [US5] Run `pnpm build` and verify output in `dist/` contains: `media/index.js`, `media/index.cjs`, `media/index.d.ts`, `media/index.d.cts` (and same for templates, phone-numbers, multi-account). This validates T001 + T002 from Phase 1.
- [ ] T025 [US5] Run `pnpm typecheck` to verify no type errors with new entry points

**Checkpoint**: All subpath exports build correctly.

---

## Phase 8: User Story 6 — Conversation Pricing Utilities (Priority: P6)

**Goal**: Consumers can extract structured pricing from webhook status events.

**Independent Test**: Pass a status event with pricing data, receive structured ConversationPricing.

### Tests for User Story 6

- [ ] T026 [P] [US6] Create `tests/utils/pricing.test.ts` with tests:
  - Test `extractConversationPricing` with full pricing + conversation data returns structured `ConversationPricing`
  - Test with missing pricing data returns `null`
  - Test with missing conversation data (but pricing present) returns partial result
  - Test with unrecognized category preserves raw string value
  - Test with "failed" status event containing pricing returns pricing data

### Implementation for User Story 6

- [ ] T027 [US6] Create `src/utils/pricing.ts` with:
  - `ConversationPricing` interface: `billable`, `pricingModel`, `category`, `conversationId?`, `originType?`, `expirationTimestamp?`
  - `extractConversationPricing(event: StatusEvent): ConversationPricing | null` function
  - Import `StatusEvent` type from `../webhooks/types.js`
- [ ] T028 [US6] Export `extractConversationPricing` and `ConversationPricing` from `src/utils/index.ts`
- [ ] T029 [US6] Export `extractConversationPricing` and `ConversationPricing` from `src/index.ts` main barrel
- [ ] T030 [US6] Run `pnpm test` to verify pricing utility tests pass

**Checkpoint**: Pricing extraction works. All 6 user stories complete.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across all user stories.

- [ ] T031 Run full quality suite: `pnpm typecheck` (zero type errors), `pnpm lint` (zero violations), `pnpm format:check` (all files formatted), `pnpm test:coverage` (80%+ on lines/functions/branches/statements for new code). Fix any issues found.
- [ ] T032 Verify `pnpm build` produces correct output for all 8 entry points (4 existing + 4 new). Spot-check that `dist/media/index.js`, `dist/templates/index.js`, `dist/phone-numbers/index.js`, `dist/multi-account/index.js` exist with ESM + CJS + DTS.
- [ ] T033 Verify zero runtime dependencies: `pnpm ls --prod --depth 0` should show no production dependencies.
- [ ] T034 Run `pnpm pack --dry-run` to inspect package contents and verify all new entry points are included.
- [ ] T035 Add TSDoc with `@example` blocks to all new public methods: `sendInteractiveCta`, `sendLocationRequest`, `sendTypingIndicator`, `extractConversationPricing`. Follow existing TSDoc pattern in messages.ts.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion (build must work)
- **US1 Reply-to (Phase 3)**: Depends on Phase 2 (replyTo types + buildBasePayload changes)
- **US2 CTA (Phase 4)**: Depends on Phase 2 (needs replyTo on new options)
- **US3 Location (Phase 5)**: Depends on Phase 2 (needs replyTo on new options)
- **US4 Typing (Phase 6)**: Depends on Phase 2 (uses send() helper)
- **US5 Subpath (Phase 7)**: Depends on Phase 1 only (build config)
- **US6 Pricing (Phase 8)**: No dependencies on other user stories (uses webhook types only)
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Foundational phase — BLOCKS US2, US3 (they need buildBasePayload with replyTo)
- **US2 (P2)**: Can start after Phase 2. Independent of US3-US6.
- **US3 (P3)**: Can start after Phase 2. Independent of US2, US4-US6.
- **US4 (P4)**: Can start after Phase 2. Independent of US2, US3, US5, US6.
- **US5 (P5)**: Can start after Phase 1. Independent of all other user stories.
- **US6 (P6)**: Can start immediately. Independent of all other user stories.

### Parallel Opportunities

After Phase 2 completes:
- US2 (CTA), US3 (Location), US4 (Typing) can all proceed in parallel
- US5 (Subpath) can start after Phase 1 (doesn't need Phase 2)
- US6 (Pricing) can start immediately (no dependencies)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (build config)
2. Complete Phase 2: Foundational (replyTo types + buildBasePayload)
3. Complete Phase 3: User Story 1 (reply-to tests + validation)
4. **STOP and VALIDATE**: All existing tests pass + reply-to works
5. Continue with remaining stories

### Incremental Delivery

1. Phase 1 + 2 → Foundation ready
2. Phase 3 (US1) → Reply-to works → validate
3. Phase 4 (US2) → CTA buttons work → validate
4. Phase 5 (US3) → Location request works → validate
5. Phase 6 (US4) → Typing indicators work → validate
6. Phase 7 (US5) → Subpath exports verified → validate
7. Phase 8 (US6) → Pricing utility works → validate
8. Phase 9 → Full quality pass → release-ready

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each phase or logical group
- Stop at any checkpoint to validate story independently
- Total tasks: 35
