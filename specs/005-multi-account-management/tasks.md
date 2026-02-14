# Tasks: Multi-WABA Account Management

**Input**: Design documents from `/specs/005-multi-account-management/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Included — the project enforces 80% coverage threshold (SC-007) and the testing strategy in CLAUDE.md is a core convention.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create directory structure and empty files for new modules

- [x] T001 Create `src/phone-numbers/` directory with empty `types.ts`, `phone-numbers.ts`, and `index.ts` files per plan.md structure

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define all shared types and the PhoneNumbers class constructor that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Define all type unions (QualityRating, CodeVerificationStatus, NameStatus, PlatformType, ThroughputLevel, AccountMode, MessagingLimitTier, CodeMethod, BusinessVertical) and all entity interfaces (PhoneNumber, Throughput, BusinessProfile, BusinessProfileUpdate, PhoneNumberListParams, PhoneNumberListResponse, BusinessProfileResponse, VerificationCodeRequest, VerifyCodeRequest, RegisterRequest, SuccessResponse) in `src/phone-numbers/types.ts` per data-model.md — all properties must be `readonly`, use `interface` for all shapes and `type` for unions
- [x] T003 Implement PhoneNumbers class skeleton with constructor accepting `HttpClient` and `businessAccountId` via constructor injection in `src/phone-numbers/phone-numbers.ts` — validate businessAccountId is non-empty (throw ValidationError), store both as private readonly fields, follow Templates class constructor pattern exactly
- [x] T004 Create barrel export in `src/phone-numbers/index.ts` — export PhoneNumbers class and all types/type unions from types.ts, named exports only

**Checkpoint**: Foundation ready — PhoneNumbers class can be instantiated, all types importable. User story implementation can begin.

---

## Phase 3: User Story 1 — List and Inspect Phone Numbers (Priority: P1) MVP

**Goal**: Developers can list all phone numbers for a WABA and get details for a specific phone number

**Independent Test**: Call `list()` and `get()` against a mocked HttpClient, verify correct API paths, query params, and typed response parsing

### Implementation for User Story 1

- [x] T005 [US1] Implement `list()` method in `src/phone-numbers/phone-numbers.ts` — GET `{businessAccountId}/phone_numbers` with optional PhoneNumberListParams (fields, limit, after, before) converted to query params, return `Promise<ApiResponse<PhoneNumberListResponse>>`, pass requestOptions to HttpClient.get()
- [x] T006 [US1] Implement `get()` method in `src/phone-numbers/phone-numbers.ts` — GET `{phoneNumberId}` with optional fields param, validate phoneNumberId is non-empty (throw ValidationError), return `Promise<ApiResponse<PhoneNumber>>`, pass requestOptions to HttpClient.get()
- [x] T007 [US1] Write unit tests for PhoneNumbers constructor and US1 methods in `tests/phone-numbers/phone-numbers.test.ts` — test constructor validation (empty businessAccountId throws ValidationError), list() with empty response, list() with data and pagination, list() with fields filter, list() with limit/cursor params, get() with valid ID, get() with empty ID validation error, get() with platform error (400, 401, 500)

**Checkpoint**: User Story 1 fully functional — `list()` and `get()` work independently. MVP deliverable.

---

## Phase 4: User Story 2 — Manage Business Profiles (Priority: P1)

**Goal**: Developers can view and update the business profile for any phone number

**Independent Test**: Call `getBusinessProfile()` and `updateBusinessProfile()` against a mocked HttpClient, verify correct API paths, payload construction, and response unwrapping

### Implementation for User Story 2

- [x] T008 [US2] Implement `getBusinessProfile()` method in `src/phone-numbers/phone-numbers.ts` — GET `{phoneNumberId}/whatsapp_business_profile` with optional fields param, validate phoneNumberId non-empty, unwrap the single-element `data` array from Meta's `BusinessProfileResponse` to return `Promise<ApiResponse<BusinessProfile>>`, pass requestOptions to HttpClient.get()
- [x] T009 [US2] Implement `updateBusinessProfile()` method in `src/phone-numbers/phone-numbers.ts` — POST `{phoneNumberId}/whatsapp_business_profile` with `{ messaging_product: "whatsapp", ...profile }` auto-injecting messaging_product, validate phoneNumberId non-empty, accept BusinessProfileUpdate partial object, return `Promise<ApiResponse<SuccessResponse>>`, pass requestOptions to HttpClient.post()
- [x] T010 [US2] Write unit tests for US2 methods in `tests/phone-numbers/phone-numbers.test.ts` — test getBusinessProfile() with valid response (verify data[0] unwrap), getBusinessProfile() with fields param, getBusinessProfile() with empty phoneNumberId validation error, updateBusinessProfile() with partial fields (verify only provided fields sent), updateBusinessProfile() with full fields, updateBusinessProfile() verify messaging_product auto-injected, updateBusinessProfile() with empty phoneNumberId error, platform errors (400, 403)

**Checkpoint**: User Stories 1 AND 2 both work independently. PhoneNumbers class covers all P1 functionality.

---

## Phase 5: User Story 3 — Register and Deregister Phone Numbers (Priority: P2)

**Goal**: Developers can register a new phone number through the full verification flow and deregister numbers no longer needed

**Independent Test**: Call `requestVerificationCode()`, `verifyCode()`, `register()`, `deregister()` against a mocked HttpClient, verify correct API paths, payloads, and client-side validation

### Implementation for User Story 3

- [x] T011 [US3] Implement `requestVerificationCode()` and `verifyCode()` methods in `src/phone-numbers/phone-numbers.ts` — requestVerificationCode: POST `{phoneNumberId}/request_code` with `{ code_method, language }`, validate phoneNumberId non-empty, validate codeMethod is 'SMS' or 'VOICE' (throw ValidationError with field 'codeMethod'), validate language non-empty; verifyCode: POST `{phoneNumberId}/verify_code` with `{ code }`, validate phoneNumberId and code non-empty; both return `Promise<ApiResponse<SuccessResponse>>`
- [x] T012 [US3] Implement `register()` and `deregister()` methods in `src/phone-numbers/phone-numbers.ts` — register: POST `{phoneNumberId}/register` with `{ messaging_product: "whatsapp", pin }`, validate phoneNumberId and pin non-empty; deregister: POST `{phoneNumberId}/deregister` with empty body `{}`, validate phoneNumberId non-empty; both return `Promise<ApiResponse<SuccessResponse>>`
- [x] T013 [US3] Write unit tests for US3 methods in `tests/phone-numbers/phone-numbers.test.ts` — test requestVerificationCode() with SMS, with VOICE, with invalid codeMethod validation error, with empty language error, with empty phoneNumberId error; verifyCode() with valid code, with empty code error; register() with valid pin, with empty pin error, verify messaging_product auto-injected; deregister() with valid ID, with empty ID error; platform errors (400, 401, 429, 500) for each method

**Checkpoint**: All PhoneNumbers functionality complete (US1 + US2 + US3). Phone number module is feature-complete.

---

## Phase 6: User Story 4 — Multi-Instance WhatsApp Client Management (Priority: P2)

**Goal**: Platform developers can create a multi-account manager to handle multiple WABAs/phone numbers with shared config, lazy initialization, and dynamic add/remove

**Independent Test**: Create a WhatsAppMultiAccount manager with multiple account configs, verify lazy instance creation, config merging, dynamic add/remove, and proper cleanup on destroy

### Implementation for User Story 4

- [x] T014 [P] [US4] Define AccountConfig and MultiAccountConfig interfaces in `src/multi-account/types.ts` — AccountConfig with required name/accessToken/phoneNumberId and optional businessAccountId plus all WhatsAppConfig override fields; MultiAccountConfig with required accounts array plus shared base settings (apiVersion, baseUrl, logger, rateLimitConfig, retryConfig, timeoutMs); all properties readonly
- [x] T015 [US4] Implement WhatsAppMultiAccount class constructor in `src/multi-account/multi-account.ts` — validate accounts array non-empty, validate each account has name/accessToken/phoneNumberId, validate account names unique (throw ValidationError for duplicates), store configs in `Map<string, AccountConfig>` keyed by name, build secondary `Map<string, string>` for phoneNumberId→accountName lookup, store shared base config separately, initialize empty `Map<string, WhatsApp>` for lazy instances, add private `destroyed` flag
- [x] T016 [US4] Implement `get()` and `has()` methods in `src/multi-account/multi-account.ts` — get(): look up by name first then phoneNumberId, check destroyed flag (throw ValidationError if destroyed), if instance exists in cache return it, otherwise merge shared base config with account-specific overrides (account overrides take priority), create new WhatsApp instance, cache it, return it; has(): return true if name or phoneNumberId found in maps
- [x] T017 [US4] Implement `addAccount()`, `removeAccount()`, `getAccounts()`, and `destroy()` methods in `src/multi-account/multi-account.ts` — addAccount: validate required fields, check name and phoneNumberId uniqueness, store in both maps; removeAccount: validate name exists, if lazy instance was created call destroy() on it, remove from all maps; getAccounts: return read-only Map of configs; destroy: iterate lazy instances calling destroy() on each, clear all maps, set destroyed flag
- [x] T018 [US4] Create barrel export in `src/multi-account/index.ts` — replace existing empty stub with exports of WhatsAppMultiAccount class and all types from types.ts, named exports only
- [x] T019 [US4] Write unit tests for WhatsAppMultiAccount in `tests/multi-account/multi-account.test.ts` — test constructor with valid config, constructor with empty accounts error, constructor with missing account fields error, constructor with duplicate names error; get() by name with lazy creation, get() by phoneNumberId, get() returns cached instance on second call, get() with unknown name/ID error, get() after destroy error; has() by name true/false, has() by phoneNumberId; addAccount() valid, addAccount() duplicate name error, addAccount() duplicate phoneNumberId error; removeAccount() valid without instance, removeAccount() valid with instance (verify destroy called), removeAccount() unknown name error; getAccounts() returns all configs; destroy() with mixed instantiated/uninstantiated accounts, destroy() clears all maps

**Checkpoint**: Multi-account manager fully functional. All four user stories independently testable.

---

## Phase 7: Integration & Exports

**Purpose**: Wire new modules into the unified WhatsApp client and root barrel exports

- [x] T020 Add `phoneNumbers` lazy accessor to WhatsApp class in `src/whatsapp.ts` — follow exact same pattern as `templates` accessor: private `_phoneNumbers?: PhoneNumbers` field, lazy getter that validates businessAccountId non-empty (throw ValidationError with field 'businessAccountId' and descriptive message), create PhoneNumbers instance on first access, cache and return
- [x] T021 Update barrel exports in `src/index.ts` — add PhoneNumbers class export from phone-numbers module, add WhatsAppMultiAccount class export from multi-account module, add all new type exports (PhoneNumber, BusinessProfile, BusinessProfileUpdate, QualityRating, CodeVerificationStatus, NameStatus, PlatformType, ThroughputLevel, AccountMode, MessagingLimitTier, CodeMethod, BusinessVertical, PhoneNumberListParams, PhoneNumberListResponse, BusinessProfileResponse, VerificationCodeRequest, VerifyCodeRequest, RegisterRequest, SuccessResponse, AccountConfig, MultiAccountConfig), verify all existing exports remain unchanged
- [x] T022 Write unit tests for phoneNumbers accessor in `tests/whatsapp.test.ts` — test phoneNumbers accessor returns PhoneNumbers instance when businessAccountId is provided, test phoneNumbers accessor throws ValidationError when businessAccountId is missing, test phoneNumbers accessor returns same cached instance on repeated access, verify all existing WhatsApp tests still pass
- [x] T023 Run full test suite with `pnpm test` and verify all existing tests pass without modification

**Checkpoint**: All modules integrated. SDK is feature-complete for this branch.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, quality checks, and final validation

- [x] T024 [P] Add TSDoc comments with @example blocks to all public PhoneNumbers methods in `src/phone-numbers/phone-numbers.ts` — constructor, list(), get(), getBusinessProfile(), updateBusinessProfile(), requestVerificationCode(), verifyCode(), register(), deregister(); follow existing Templates/Media TSDoc patterns with @param, @returns, @throws, @example
- [x] T025 [P] Add TSDoc comments with @example blocks to all public WhatsAppMultiAccount methods in `src/multi-account/multi-account.ts` — constructor, get(), addAccount(), removeAccount(), getAccounts(), has(), destroy(); include examples from quickstart.md
- [x] T026 Run `pnpm test:coverage` and verify all thresholds met — minimum 80% on lines, functions, branches, and statements for new phone-numbers and multi-account modules
- [x] T027 Run `pnpm typecheck && pnpm lint && pnpm format:check` and fix any issues

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational (Phase 2)
- **US2 (Phase 4)**: Depends on Foundational (Phase 2) — can start after US1 or concurrently if careful (same file)
- **US3 (Phase 5)**: Depends on Foundational (Phase 2) — recommended after US1+US2 (same file)
- **US4 (Phase 6)**: Depends on Foundational (Phase 2) — entirely separate files, CAN run in parallel with US3
- **Integration (Phase 7)**: Depends on US1 + US2 + US3 + US4 all complete
- **Polish (Phase 8)**: Depends on Integration complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational — no dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational — shares file with US1 so recommended after US1
- **User Story 3 (P2)**: Can start after Foundational — shares file with US1/US2 so recommended after US2
- **User Story 4 (P2)**: Can start after Foundational — entirely different files, independent of US1-3

### Within Each User Story

- Types/interfaces before class methods
- Class methods before unit tests
- Core methods before edge case handling

### Parallel Opportunities

- **T014** (US4 types) can run in parallel with **T011-T013** (US3 methods/tests) — different files
- **T024 and T025** (TSDoc) can run in parallel — different files
- **US3 and US4** can be developed concurrently by different team members

---

## Parallel Example: User Story 4

```bash
# US4 types can start while US3 is still in progress:
Task T014: "Define AccountConfig and MultiAccountConfig interfaces in src/multi-account/types.ts"
# (runs while T011-T013 complete in phone-numbers module)

# Within Phase 8, TSDoc tasks can run in parallel:
Task T024: "Add TSDoc to PhoneNumbers methods in src/phone-numbers/phone-numbers.ts"
Task T025: "Add TSDoc to WhatsAppMultiAccount methods in src/multi-account/multi-account.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (types + constructor + barrel)
3. Complete Phase 3: User Story 1 (list + get + tests)
4. **STOP and VALIDATE**: Test `list()` and `get()` independently
5. Deploy/demo if ready — developers can already inspect phone numbers

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → **MVP** (phone number listing)
3. Add User Story 2 → Test independently → Business profile management
4. Add User Story 3 → Test independently → Full phone number lifecycle
5. Add User Story 4 → Test independently → Multi-tenant platform support
6. Integration + Polish → Feature-complete branch ready for PR

### Parallel Team Strategy

With two developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 → US2 → US3 (all in phone-numbers module, same file context)
   - Developer B: US4 (entirely separate multi-account module)
3. Both complete → Integration phase → Polish

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US1 and US2 share the same PhoneNumbers class file — implement sequentially
- US4 is entirely in separate files (`src/multi-account/`) — can develop independently
- All methods follow existing SDK patterns: config object params, `Promise<ApiResponse<T>>` return, `RequestOptions` as last optional param
- The existing `src/multi-account/index.ts` stub (`export {};`) will be replaced in T018
- Commit after each phase or logical group of tasks
