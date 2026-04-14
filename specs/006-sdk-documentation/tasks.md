# Tasks: SDK Documentation & Polish

**Input**: Design documents from `/specs/006-sdk-documentation/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, quickstart.md

**Tests**: Not requested for this feature (documentation-only, no source code changes).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: Confirm existing codebase baseline before adding documentation

- [x] T001 Run existing test suite to confirm all tests pass and baseline is stable (`pnpm test`)

---

## Phase 2: User Story 1 — Discover and Evaluate the SDK (Priority: P1) 🎯 MVP

**Goal**: Create a professional README.md that lets a developer understand, install, and use the SDK within 5 minutes of reading.

**Independent Test**: A developer visits the repository, reads the README, and can install the SDK and send their first message by copying the Quick Start example. The configuration table lists all WhatsAppConfig options with types, defaults, and descriptions.

**Acceptance criteria from spec**: AS-1.1 (understand purpose in 2 min), AS-1.2 (working quick start), AS-1.3 (feature list covers all modules), AS-1.4 (complete config table).

### Implementation for User Story 1

- [x] T002 [US1] Create README.md with title, npm badges (version, license, Node.js), overview paragraph, features bullet list (all 6 modules), and installation commands (npm/pnpm/yarn) in README.md
- [x] T003 [US1] Add Quick Start section with minimal send-text example using unified client (include try/catch block with comment referencing Error Handling section), and Configuration reference table (all 16 WhatsAppConfig options with types, required/optional, defaults, descriptions) to README.md
- [x] T004 [US1] Add Messages module documentation section (key methods: sendText, sendImage, sendTemplate, sendInteractiveButtons, markAsRead with code snippet) and Media module documentation section (upload, getUrl, download, delete with code snippet) to README.md
- [x] T005 [US1] Add Templates module documentation section (list, get, create with TemplateBuilder, update, delete with code snippet) and Webhooks module documentation section (parse, verifySignature, createExpressMiddleware, createNextRouteHandler with code snippets for both Express and Next.js) to README.md
- [x] T006 [US1] Add Phone Numbers module documentation section (list, get, getBusinessProfile, updateBusinessProfile, requestVerificationCode, verifyCode with code snippet) and Multi-Account module documentation section (WhatsAppMultiAccount setup, get, addAccount, removeAccount with code snippet) to README.md
- [x] T007 [US1] Add Advanced Usage section (direct module imports with HttpClient, custom rate limiter config, custom retry config, request options), ESM & CJS import syntax section (both import and require examples), and License (MIT) section to README.md

**Checkpoint**: README.md has 15 of 17 content sections (Error Handling added in US3, Examples link added in US2). A developer can read it and understand the full SDK. Quick Start code is copy-pasteable. Config table is complete.

---

## Phase 3: User Story 2 — Learn by Example (Priority: P2)

**Goal**: Provide 7 self-contained TypeScript reference example files covering all SDK modules, each with header comments, environment variable documentation, and inline comments.

**Independent Test**: Open any example file — it should be syntactically valid TypeScript, include a header comment explaining what it demonstrates and how to run it, list required environment variables, and demonstrate a complete use case with error handling.

**Acceptance criteria from spec**: AS-2.1 (send-text), AS-2.2 (webhooks-express), AS-2.3 (webhooks-nextjs), AS-2.4 (media-upload), AS-2.5 (templates), AS-2.6 (phone-numbers), AS-2.7 (multi-account).

### Implementation for User Story 2

- [X] T008 [P] [US2] Create send-text example: WhatsApp client creation, sendText call, response handling, typed error catching. Env vars: WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, RECIPIENT_PHONE. File: examples/send-text.ts
- [X] T009 [P] [US2] Create media-upload example: read file from disk with fs, upload via media.upload(), send image message using returned media ID. Env vars: WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, RECIPIENT_PHONE. File: examples/media-upload.ts
- [X] T010 [P] [US2] Create templates example: list existing templates, create new template with TemplateBuilder (name, language, category, header, body, footer, buttons), send template message. Env vars: WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_BUSINESS_ACCOUNT_ID, RECIPIENT_PHONE. File: examples/templates.ts
- [X] T011 [P] [US2] Create webhooks-express example: Express server setup, createExpressMiddleware with onMessage/onStatus/onError callbacks, webhook verification GET endpoint, server start on port 3000. Env vars: WHATSAPP_APP_SECRET, WHATSAPP_VERIFY_TOKEN. File: examples/webhooks-express.ts
- [X] T012 [P] [US2] Create webhooks-nextjs example: Next.js App Router route.ts with GET handler (webhook verification) and POST handler (event processing) using createNextRouteHandler. Env vars: WHATSAPP_APP_SECRET, WHATSAPP_VERIFY_TOKEN. File: examples/webhooks-nextjs.ts
- [X] T013 [P] [US2] Create phone-numbers example: list phone numbers under WABA, get specific number details, getBusinessProfile, updateBusinessProfile (description + website), requestVerificationCode via SMS, verifyCode. Env vars: WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_BUSINESS_ACCOUNT_ID. File: examples/phone-numbers.ts
- [X] T014 [P] [US2] Create multi-account example: WhatsAppMultiAccount setup with 2+ accounts (shared base config + per-account overrides), get by name, get by phoneNumberId, send message through specific account, destroy cleanup. Env vars: WHATSAPP_ACCESS_TOKEN, ACCOUNT1_PHONE_NUMBER_ID, ACCOUNT2_PHONE_NUMBER_ID. File: examples/multi-account.ts
- [X] T015 [US2] Add Examples section to README.md with brief descriptions of each example file and link to examples/ directory

**Checkpoint**: All 7 example files exist in examples/. Each is syntactically valid TypeScript with proper header comments. README links to examples directory.

---

## Phase 4: User Story 3 — Understand Error Handling Patterns (Priority: P3)

**Goal**: Document the error class hierarchy, each class's properties, and provide code examples for the 3 most common error handling patterns (API errors, rate limits, validation errors).

**Independent Test**: A developer reads the Error Handling section and understands all error types, their inheritance chain, available properties, and how to write try/catch blocks for different error scenarios.

**Acceptance criteria from spec**: AS-3.1 (class hierarchy understood), AS-3.2 (rate limit retry pattern), AS-3.3 (validation error field identification).

### Implementation for User Story 3

- [X] T016 [US3] Add Error Handling section to README.md: ASCII hierarchy tree (WhatsAppError → ApiError → RateLimitError/AuthenticationError, ValidationError, WebhookVerificationError, MediaError), properties table per class (code, statusCode, errorType, retryAfterMs, field, mediaType), and 3 code examples: (1) catching ApiError with statusCode check, (2) handling RateLimitError with retryAfterMs, (3) catching ValidationError with field property. Map to FR-007.

**Checkpoint**: Error Handling section is complete. A developer can determine the correct catch pattern for any SDK error.

---

## Phase 5: User Story 4 — Verify SDK Readiness for Publishing (Priority: P4)

**Goal**: Run the full verification suite to confirm the SDK is ready for npm publishing: build output is correct, tests pass with adequate coverage, no lint errors, and package contents are correct.

**Independent Test**: Run all 5 verification commands and confirm zero errors. Pack dry-run shows only dist/, README.md, LICENSE, package.json.

**Acceptance criteria from spec**: AS-4.1 (build output correct), AS-4.2 (coverage >80%), AS-4.3 (lint zero errors), AS-4.4 (pack contents correct).

### Implementation for User Story 4

- [X] T017 [US4] Run typecheck verification: `pnpm typecheck` — confirm zero type errors
- [X] T018 [US4] Run build verification: `pnpm build` — confirm dist/ contains ESM (.js), CJS (.cjs), and declaration (.d.ts, .d.cts) files for each entry point (index, errors/index, messages/index, webhooks/index)
- [X] T019 [US4] Run test coverage verification: `pnpm test:coverage` — confirm lines, functions, branches, statements all exceed 80%
- [X] T020 [US4] Run lint verification: `pnpm lint` — confirm zero errors and zero warnings
- [X] T021 [US4] Run pack dry-run verification: `pnpm pack --dry-run` — confirm only dist/, README.md, LICENSE, package.json are included; examples/ and src/ are excluded

**Checkpoint**: All verification commands pass. SDK is ready for npm publish.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final quality pass across all documentation

- [X] T022 Review README.md end-to-end: verify all code snippets use correct SDK import paths and method signatures, markdown tables render correctly, no broken internal links, consistent formatting throughout
- [X] T023 Cross-reference examples against README: verify every module documented in README has a corresponding example file, and every example file is referenced in the README Examples section

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **US1 (Phase 2)**: Depends on Setup (T001) — README is the foundation
- **US2 (Phase 3)**: Can start after Setup (T001) — examples are independent files; T015 (README update) depends on US1 completion
- **US3 (Phase 4)**: Depends on US1 (Phase 2) — adds section to existing README
- **US4 (Phase 5)**: Depends on US1 + US2 + US3 completion — verifies final state
- **Polish (Phase 6)**: Depends on US1 + US2 + US3 completion

### User Story Dependencies

- **US1 (P1)**: No dependencies on other stories. Creates README.md from scratch.
- **US2 (P2)**: Example files (T008-T014) are independent of US1 and can start in parallel. Only T015 (README Examples section) depends on US1.
- **US3 (P3)**: Depends on US1 — adds Error Handling section to existing README.md.
- **US4 (P4)**: Depends on all content being complete (US1 + US2 + US3).

### Within Each User Story

- **US1**: Tasks T002-T007 are sequential (all modify README.md)
- **US2**: Tasks T008-T014 are all [P] parallel (different files). T015 is sequential after T008-T014 + US1.
- **US3**: Single task (T016), sequential after US1.
- **US4**: Tasks T017-T021 are sequential (each verification builds on previous).

### Parallel Opportunities

```
After T001 (baseline confirmed):

  ┌─ US1 (T002→T003→T004→T005→T006→T007) ─ sequential, README.md
  │
  └─ US2 examples (T008‖T009‖T010‖T011‖T012‖T013‖T014) ─ 7 parallel files

After US1 complete:
  T015 → T016 (both modify README.md — sequential, order flexible)

After US1 + US2 + US3 complete:
  └─ US4 (T017→T018→T019→T020→T021) ─ sequential verification
  └─ Polish (T022, T023) ─ parallel with US4
```

---

## Parallel Example: User Story 2

```bash
# Launch all 7 example files in parallel (different files, no dependencies):
Task: "Create send-text example in examples/send-text.ts"
Task: "Create media-upload example in examples/media-upload.ts"
Task: "Create templates example in examples/templates.ts"
Task: "Create webhooks-express example in examples/webhooks-express.ts"
Task: "Create webhooks-nextjs example in examples/webhooks-nextjs.ts"
Task: "Create phone-numbers example in examples/phone-numbers.ts"
Task: "Create multi-account example in examples/multi-account.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: US1 — README.md (T002-T007)
3. **STOP and VALIDATE**: README is readable, Quick Start is correct, Config table is complete
4. This alone provides value — developers can discover and evaluate the SDK

### Incremental Delivery

1. T001 → Baseline confirmed
2. US1 (T002-T007) → README complete → **MVP ready**
3. US2 (T008-T015) → Examples added → Developers can learn by example
4. US3 (T016) → Error handling documented → Production-ready guidance
5. US4 (T017-T021) → Verification passed → Publishing ready
6. Polish (T022-T023) → Quality assured

### Optimal Parallel Strategy

1. Start T001 (baseline)
2. After T001: Launch US1 (T002) AND US2 examples (T008-T014) simultaneously
3. US1 proceeds sequentially (T002→T007) while all 7 examples build in parallel
4. After US1 + examples: T015 + T016 in sequence (both modify README)
5. After all content: US4 verification + Polish

---

## Notes

- All tasks create new files — no existing source code is modified
- [P] tasks = different files, no dependencies on each other
- [Story] label maps each task to its user story for traceability
- README tasks (T002-T007, T015, T016) are sequential — they all modify the same file
- Example tasks (T008-T014) are the primary parallel opportunity (7 independent files)
- No test tasks included — this feature adds documentation only, no source code changes
- Commit after each completed phase or logical group of tasks
