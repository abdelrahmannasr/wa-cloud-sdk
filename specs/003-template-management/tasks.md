# Tasks: Template Management

**Input**: Design documents from `/specs/003-template-management/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/templates-api.md

**Tests**: Included — the spec requires 80% coverage threshold (SC-005) and the project's testing strategy mandates unit tests for all modules.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Type definitions and barrel exports — shared foundation for all user stories

- [X] T001 Define all template type definitions (Template, TemplateCategory, TemplateStatus, TemplateComponentResponse, ButtonResponse, QualityScore, CreateTemplateRequest, CreateTemplateComponent, CreateTemplateButton, CreateTemplateResponse, TemplateDeleteResponse, TemplateListParams, TemplateGetOptions, TemplateDeleteOptions, TemplateListResponse, PagingInfo) with TSDoc and readonly properties per data-model.md in `src/templates/types.ts`
- [X] T002 Define validation constants (TEMPLATE_NAME_PATTERN, MAX_BODY_LENGTH, MAX_HEADER_TEXT_LENGTH, MAX_FOOTER_LENGTH, MAX_BUTTON_TEXT_LENGTH, MAX_QUICK_REPLY_BUTTONS, MAX_URL_BUTTONS, MAX_PHONE_NUMBER_BUTTONS) per data-model.md validation constraints in `src/templates/types.ts`

**Checkpoint**: Type system complete — all interfaces, types, and constants available for implementation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Templates CRUD class skeleton with constructor validation — required before any user story

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Implement Templates class with constructor accepting `(client: HttpClient, businessAccountId: string)`, storing both as private readonly fields, and throwing `ValidationError` if businessAccountId is empty/falsy (FR-001, FR-012). Add TSDoc with @example. File: `src/templates/templates.ts`
- [X] T006 Write Templates constructor tests: valid construction, empty businessAccountId throws ValidationError, undefined businessAccountId throws ValidationError. Use mock client pattern from existing tests. File: `tests/templates/templates.test.ts`

**Checkpoint**: Templates class instantiable with validation — user story implementation can now begin

---

## Phase 3: User Story 1 — List and Retrieve Templates (Priority: P1) MVP

**Goal**: Developers can list all templates with pagination/filtering and retrieve templates by name

**Independent Test**: Call `list()` and `get()` against mocked client, verify correct API paths, query parameters, and response types

### Tests for User Story 1

- [X] T007 [P] [US1] Write tests for `list()`: calls `client.get()` with path `${businessAccountId}/message_templates`, passes pagination params (limit, after, before) as query params, passes status/name filter params, returns typed `TemplateListResponse`, forwards requestOptions. File: `tests/templates/templates.test.ts`
- [X] T008 [P] [US1] Write tests for `get()`: calls `client.get()` with path `${businessAccountId}/message_templates` and `name` query param, passes optional language filter, forwards requestOptions. File: `tests/templates/templates.test.ts`

### Implementation for User Story 1

- [X] T009 [US1] Implement `list(params?, requestOptions?)` method: convert `TemplateListParams` to query string params (limit, after, before, status, name, fields as comma-joined string), call `client.get<TemplateListResponse>('${businessAccountId}/message_templates', { params, ...requestOptions })`. Add TSDoc with @example. File: `src/templates/templates.ts`
- [X] T010 [US1] Implement `get(templateName, options?, requestOptions?)` method: build params object with `name` and optional language from `TemplateGetOptions`, call `client.get<TemplateListResponse>('${businessAccountId}/message_templates', { params, ...requestOptions })`. Add TSDoc with @example. File: `src/templates/templates.ts`

**Checkpoint**: User Story 1 complete — `list()` and `get()` functional and tested

---

## Phase 4: User Story 2 — Create Templates via Builder (Priority: P1)

**Goal**: Developers can build template creation payloads using a fluent API and submit them for Meta review

**Independent Test**: Chain builder methods, call `.build()`, verify output shape and validation errors. Call `create()` with mocked client, verify correct endpoint and payload.

### Tests for User Story 2

- [X] T011 [P] [US2] Write TemplateBuilder tests — valid builds: minimal template (name + language + category + body) produces correct `CreateTemplateRequest`, full template (header text + body + footer + buttons + allowCategoryChange) produces correct nested structure, header media format produces correct component. File: `tests/templates/builder.test.ts`
- [X] T012 [P] [US2] Write TemplateBuilder validation tests: missing name throws ValidationError with field 'name', missing language throws ValidationError, missing category throws ValidationError, missing body throws ValidationError, invalid name format (uppercase, spaces, too long) throws ValidationError, body exceeding 1024 chars throws, header text exceeding 60 chars throws, footer exceeding 60 chars throws, button text exceeding 20 chars throws, exceeding 3 quick-reply buttons throws, exceeding 2 URL buttons throws, exceeding 1 phone-number button throws. File: `tests/templates/builder.test.ts`
- [X] T013 [P] [US2] Write tests for `create()`: calls `client.post()` with path `${businessAccountId}/message_templates` and template request body, returns typed `CreateTemplateResponse`, forwards requestOptions. File: `tests/templates/templates.test.ts`

### Implementation for User Story 2

- [X] T014 [US2] Implement TemplateBuilder class with private state fields (name, language, category, allowCategoryChange, components array), fluent setter methods (`setName`, `setLanguage`, `setCategory`, `allowCategoryChange`) each returning `this`. Add TSDoc with @example on class and all public methods. File: `src/templates/builder.ts`
- [X] T015 [US2] Implement TemplateBuilder component methods: `addHeaderText(text)`, `addHeaderMedia(format, example?)`, `addBody(text, example?)`, `addFooter(text)`, `addQuickReplyButton(text)`, `addUrlButton(text, url)`, `addPhoneNumberButton(text, phoneNumber)` — each appending to internal components array and returning `this`. File: `src/templates/builder.ts`
- [X] T016 [US2] Implement TemplateBuilder `build()` method with validation: check required fields (name, language, category, body component present), validate name against `TEMPLATE_NAME_PATTERN`, validate text lengths (body <= 1024, header text <= 60, footer <= 60, button text <= 20), validate button counts (quick-reply <= 3, URL <= 2, phone-number <= 1), throw `ValidationError` with field name on failures, return assembled `CreateTemplateRequest`. File: `src/templates/builder.ts`
- [X] T017 [US2] Implement `create(template, requestOptions?)` method: call `client.post<CreateTemplateResponse>('${businessAccountId}/message_templates', template, requestOptions)`. Add TSDoc with @example. File: `src/templates/templates.ts`

**Checkpoint**: User Stories 1 AND 2 complete — list, get, create, and builder all functional and tested

---

## Phase 5: User Story 3 — Update Existing Templates (Priority: P2)

**Goal**: Developers can update template components by posting to the template ID endpoint

**Independent Test**: Call `update()` with mocked client, verify correct endpoint (`POST /{templateId}`) and payload shape

### Tests for User Story 3

- [X] T018 [P] [US3] Write tests for `update()`: calls `client.post()` with path `${templateId}` and `{ components }` body, returns typed response, forwards requestOptions. File: `tests/templates/templates.test.ts`

### Implementation for User Story 3

- [X] T019 [US3] Implement `update(templateId, components, requestOptions?)` method: call `client.post<CreateTemplateResponse>(templateId, { components }, requestOptions)`. Add TSDoc with @example. File: `src/templates/templates.ts`

**Checkpoint**: User Story 3 complete — update functional and tested

---

## Phase 6: User Story 4 — Delete Templates (Priority: P2)

**Goal**: Developers can delete templates by name, optionally targeting a specific language variant

**Independent Test**: Call `delete()` with mocked client, verify correct endpoint and query parameters

### Tests for User Story 4

- [X] T020 [P] [US4] Write tests for `delete()`: calls `client.delete()` with path `${businessAccountId}/message_templates` and `name` query param, passes optional `hsm_id` param from `TemplateDeleteOptions`, returns typed `TemplateDeleteResponse`, forwards requestOptions. File: `tests/templates/templates.test.ts`

### Implementation for User Story 4

- [X] T021 [US4] Implement `delete(templateName, options?, requestOptions?)` method: build params with `name` and optional `hsm_id` from `TemplateDeleteOptions`, call `client.delete<TemplateDeleteResponse>('${businessAccountId}/message_templates', { params, ...requestOptions })`. Add TSDoc with @example. File: `src/templates/templates.ts`

**Checkpoint**: All 4 user stories complete — full CRUD + builder functional and tested

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, exports verification, and quality checks

- [X] T022 Create barrel export for templates module exporting Templates class, TemplateBuilder class, all types, and validation constants in `src/templates/index.ts`
- [X] T023 Update root barrel export to re-export all templates module public API (class, builder, types, constants) in `src/index.ts`
- [X] T024 Run `pnpm typecheck` to verify no type errors across the entire project
- [X] T025 Run `pnpm test` to verify all tests pass
- [X] T026 Run `pnpm test:coverage` to verify 80% coverage threshold is met for templates module
- [X] T027 Run `pnpm lint` to verify no lint errors
- [X] T028 Verify barrel exports: confirm `src/templates/index.ts` exports Templates, TemplateBuilder, all types, and constants; confirm `src/index.ts` re-exports them
- [X] T029 Validate quickstart.md examples compile and run against the implemented API

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (types must exist for Templates class)
- **User Story 1 (Phase 3)**: Depends on Phase 2 (Templates class must be constructable)
- **User Story 2 (Phase 4)**: Depends on Phase 1 (types for builder) — can run in parallel with US1
- **User Story 3 (Phase 5)**: Depends on Phase 2 — can run in parallel with US1/US2
- **User Story 4 (Phase 6)**: Depends on Phase 2 — can run in parallel with US1/US2/US3
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (List/Get)**: Depends on Phase 2 only — no cross-story dependencies
- **US2 (Create/Builder)**: Builder depends on Phase 1 types only; `create()` depends on Phase 2
- **US3 (Update)**: Depends on Phase 2 only — no cross-story dependencies
- **US4 (Delete)**: Depends on Phase 2 only — no cross-story dependencies

### Within Each User Story

- Tests written first (verify they reference correct types/methods)
- Implementation follows (tests guide correctness)
- TSDoc added during implementation

### Parallel Opportunities

- T001 and T002 are sequential (same file)
- T007 and T008 can run in parallel (different describe blocks, same file)
- T011, T012, and T013 can all run in parallel (T011/T012 in builder.test.ts, T013 in templates.test.ts)
- T018 and T020 can run in parallel (different describe blocks)
- US1, US2, US3, US4 implementation phases can run in parallel after Phase 2

---

## Parallel Example: User Story 2

```bash
# Launch all test tasks for US2 together:
Task: "T011 - TemplateBuilder valid build tests in tests/templates/builder.test.ts"
Task: "T012 - TemplateBuilder validation tests in tests/templates/builder.test.ts"
Task: "T013 - Templates.create() tests in tests/templates/templates.test.ts"

# Then launch builder implementation tasks:
Task: "T014 - TemplateBuilder class skeleton in src/templates/builder.ts"
# T015 depends on T014 (same file, sequential)
# T016 depends on T015 (same file, sequential)
# T017 can run in parallel with T014-T016 (different file)
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (types + exports)
2. Complete Phase 2: Foundational (Templates constructor)
3. Complete Phase 3: User Story 1 (list + get)
4. Complete Phase 4: User Story 2 (create + builder)
5. **STOP and VALIDATE**: Run `pnpm test && pnpm typecheck` — developers can now list, create, and retrieve templates
6. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Type system and class skeleton ready
2. Add US1 (list/get) → Test independently → First usable increment
3. Add US2 (create/builder) → Test independently → Core CRUD complete
4. Add US3 (update) → Test independently → Edit workflow enabled
5. Add US4 (delete) → Test independently → Full CRUD complete
6. Polish → Coverage, linting, export verification

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All public methods require TSDoc with @example blocks per CLAUDE.md conventions
- Use `ValidationError` from `src/errors/errors.ts` for all client-side validation
- Follow existing patterns from Messages and Media modules for consistency
