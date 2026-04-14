# Tasks: Subpath Exports for Remaining Modules

**Input**: Design documents from `/specs/009-subpath-exports/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md

**Key Context**: Research found that all four subpath exports are already fully configured and building (package.json exports map, tsup entry points, barrel exports, dist output). Remaining work is verification, testing, and documentation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Verification (Existing Configuration)

**Purpose**: Confirm existing build configuration is correct and complete before writing tests

- [x] T001 Verify package.json exports map has correct paths for all 4 new subpaths (./media, ./templates, ./phone-numbers, ./multi-account) in package.json
- [x] T002 Verify tsup.config.ts has all 4 entry points configured alongside existing 3 in tsup.config.ts
- [x] T003 Run `pnpm build` and verify dist output exists for all 4 subpaths: dist/media/, dist/templates/, dist/phone-numbers/, dist/multi-account/ — each with index.js, index.cjs, index.d.ts, index.d.cts

**Checkpoint**: Build configuration verified — all subpath exports produce expected output files

---

## Phase 2: User Story 1 - Import Media Module via Subpath (Priority: P1)

**Goal**: Verify the media subpath export resolves correctly and exposes Media class and all related types

**Independent Test**: Import from the media subpath in a test and verify Media class and MEDIA_CONSTRAINTS are accessible

- [x] T004 [US1] Create test file with describe block for media subpath exports in tests/subpath-exports.test.ts
- [x] T005 [US1] Add test verifying Media class is importable from media barrel export in tests/subpath-exports.test.ts
- [x] T006 [US1] Add test verifying MEDIA_CONSTRAINTS constant is importable from media barrel export in tests/subpath-exports.test.ts
- [x] T007 [US1] Add test verifying all media types (MediaCategory, MediaUploadOptions, MediaUploadResponse, MediaUrlResponse, MediaDeleteResponse) are exported from src/media/index.ts

**Checkpoint**: Media subpath tests pass independently

---

## Phase 3: User Story 2 - Import Templates Module via Subpath (Priority: P2)

**Goal**: Verify the templates subpath export resolves correctly and exposes Templates class, TemplateBuilder, and all related types

**Independent Test**: Import from the templates subpath and verify Templates, TemplateBuilder, and validation constants are accessible

- [x] T008 [US2] Add describe block for templates subpath exports in tests/subpath-exports.test.ts
- [x] T009 [US2] Add test verifying Templates class and TemplateBuilder are importable from templates barrel export in tests/subpath-exports.test.ts
- [x] T010 [US2] Add test verifying validation constants (TEMPLATE_NAME_PATTERN, MAX_BODY_LENGTH, MAX_HEADER_TEXT_LENGTH, MAX_FOOTER_LENGTH, MAX_BUTTON_TEXT_LENGTH, MAX_QUICK_REPLY_BUTTONS, MAX_URL_BUTTONS, MAX_PHONE_NUMBER_BUTTONS) are exported from src/templates/index.ts

**Checkpoint**: Templates subpath tests pass independently

---

## Phase 4: User Story 3 - Import Phone Numbers Module via Subpath (Priority: P3)

**Goal**: Verify the phone-numbers subpath export resolves correctly and exposes PhoneNumbers class and all related types

**Independent Test**: Import from the phone-numbers subpath and verify PhoneNumbers class is accessible

- [x] T011 [P] [US3] Add describe block for phone-numbers subpath exports in tests/subpath-exports.test.ts
- [x] T012 [US3] Add test verifying PhoneNumbers class and all related types are importable from phone-numbers barrel export in tests/subpath-exports.test.ts

**Checkpoint**: Phone-numbers subpath tests pass independently

---

## Phase 5: User Story 4 - Import Multi-Account Module via Subpath (Priority: P4)

**Goal**: Verify the multi-account subpath export resolves correctly and exposes WhatsAppMultiAccount, all 3 distribution strategies, and all related types

**Independent Test**: Import from the multi-account subpath and verify WhatsAppMultiAccount and all strategies are accessible

- [x] T013 [P] [US4] Add describe block for multi-account subpath exports in tests/subpath-exports.test.ts
- [x] T014 [US4] Add test verifying WhatsAppMultiAccount, RoundRobinStrategy, WeightedStrategy, StickyStrategy are importable from multi-account barrel export in tests/subpath-exports.test.ts
- [x] T015 [US4] Add test verifying all multi-account types (AccountConfig, MultiAccountConfig, DistributionStrategy, BroadcastMessageFactory, BroadcastOptions, BroadcastResult) are exported from src/multi-account/index.ts

**Checkpoint**: Multi-account subpath tests pass independently

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Regression coverage for existing subpaths, documentation, and final validation

- [x] T016 [P] Add describe block and tests for existing subpath exports (./errors, ./messages, ./webhooks) as regression coverage in tests/subpath-exports.test.ts
- [x] T017 [P] Add test verifying main entry point (.) re-exports all modules in tests/subpath-exports.test.ts
- [x] T018 Add describe block testing CJS require() resolution for all 7 subpaths using createRequire() in tests/subpath-exports.test.ts
- [x] T019 [P] Add test verifying simultaneous import from main entry point and individual subpaths produces no conflicts or duplicate instances in tests/subpath-exports.test.ts
- [x] T020 Update README.md with subpath import examples for all 7 subpaths (ESM and CommonJS) in README.md
- [x] T021 Run `pnpm build && pnpm test && pnpm lint && pnpm typecheck` to validate all checks pass
- [x] T022 Run `pnpm test:coverage` to verify coverage remains at or above 80% threshold

---

## Dependencies & Execution Order

### Phase Dependencies

- **Verification (Phase 1)**: No dependencies — start immediately
- **User Stories (Phases 2-5)**: Depend on Phase 1 verification passing
  - All user stories are independent and can proceed in parallel
  - They share the same test file but use separate describe blocks
- **Polish (Phase 6)**: Depends on all user story phases being complete

### User Story Dependencies

- **User Story 1 (P1) - Media**: Can start after Phase 1 — creates the test file
- **User Story 2 (P2) - Templates**: Can start after T004 creates the test file — adds to it
- **User Story 3 (P3) - Phone Numbers**: Can start after T004 creates the test file — adds to it
- **User Story 4 (P4) - Multi-Account**: Can start after T004 creates the test file — adds to it

### Parallel Opportunities

- T008, T011, T013 can run in parallel (separate describe blocks in same file)
- T016, T017 can run in parallel (separate describe blocks)
- US2, US3, US4 can proceed in parallel after US1 creates the test file

---

## Parallel Example: User Stories 2-4

```bash
# After T004 creates the test file, these can run in parallel:
Task: "[US2] Add describe block for templates subpath exports"
Task: "[US3] Add describe block for phone-numbers subpath exports"
Task: "[US4] Add describe block for multi-account subpath exports"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Verify existing config
2. Complete Phase 2: Media subpath tests
3. **STOP and VALIDATE**: Run `pnpm test` — media tests pass
4. Proceed to remaining stories

### Incremental Delivery

1. Verify config → Configuration confirmed correct
2. Add media tests (US1) → Test independently → First subpath verified
3. Add templates tests (US2) → Test independently → Second subpath verified
4. Add phone-numbers tests (US3) → Test independently → Third subpath verified
5. Add multi-account tests (US4) → Test independently → All subpaths verified
6. Add regression + docs → Full validation → Feature complete

---

## Notes

- All 4 subpath exports are already configured and building — tasks focus on verification and testing
- Single test file (`tests/subpath-exports.test.ts`) with separate describe blocks per subpath for maintainability
- Tests verify import resolution and export completeness, not runtime behavior (that's covered by existing module tests)
- Include existing 3 subpaths (./errors, ./messages, ./webhooks) in tests for regression coverage
