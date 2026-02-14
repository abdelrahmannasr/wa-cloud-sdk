# Tasks: Media Upload, Download, and Management

**Input**: Design documents from `/specs/002-media-upload-download/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/media-api.md

**Tests**: Included — the project mandates 80% test coverage on lines/functions/branches/statements (SC-007, vitest config thresholds).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Create the media module file structure within the existing project

- [x] T001 Create test directory at tests/media/ and verify existing src/media/ directory contains the stub index.ts

---

## Phase 2: Foundational (Types, Class Skeleton, Barrel Exports)

**Purpose**: Define all shared types, the MEDIA_CONSTRAINTS validation map, the Media class constructor, and wire barrel exports. MUST complete before any user story work.

**CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 Define all media types and constants in src/media/types.ts: MediaCategory type (`'image' | 'video' | 'audio' | 'document' | 'sticker'`), StickerSubtype type (`'static' | 'animated'`), MediaConstraint interface (readonly mimeTypes: ReadonlySet\<string\>, readonly maxSizeBytes: number), MEDIA_CONSTRAINTS constant (Record\<MediaCategory, MediaConstraint\> with sticker having separate entries accessed by StickerSubtype), MediaUploadOptions interface (file: Buffer | Blob, mimeType: string, category: MediaCategory, filename?: string, stickerType?: StickerSubtype), MediaUploadResponse interface (readonly id: string), MediaUrlResponse interface (readonly id, url, mime_type, sha256, file_size, messaging_product), MediaDeleteResponse interface (readonly success: boolean). Reference data-model.md for exact fields and MIME type lists per category.
- [x] T003 Create Media class skeleton in src/media/media.ts: constructor accepting HttpClient and phoneNumberId (matching Messages class pattern), private readonly fields for client and phoneNumberId. Import types from ./types. Do not implement methods yet — leave as stubs that throw Error('Not implemented').
- [x] T004 [P] Replace stub in src/media/index.ts with barrel export: re-export Media class from ./media, re-export all types and MEDIA_CONSTRAINTS from ./types.
- [x] T005 [P] Update main barrel export in src/index.ts: add re-exports for Media class, all media types (MediaCategory, StickerSubtype, MediaConstraint, MediaUploadOptions, MediaUploadResponse, MediaUrlResponse, MediaDeleteResponse), and MEDIA_CONSTRAINTS constant from ./media/index.

**Checkpoint**: `pnpm typecheck` passes. All media types and the Media class skeleton are importable from the package root.

---

## Phase 3: User Story 1 — Upload Media for Messaging (Priority: P1) MVP

**Goal**: Consumers can upload media files (image, video, audio, document, sticker) with client-side MIME type and file size validation, receiving a platform-assigned media identifier.

**Independent Test**: Upload a sample image file and receive a media ID. Validate that invalid files (wrong MIME, oversized, empty, sticker without subtype) are rejected before any network call.

### Implementation for User Story 1

- [x] T006 [US1] Implement private validateUpload method in src/media/media.ts: check file is not empty (0 bytes) → throw MediaError with mediaType set to category; check mimeType is in MEDIA_CONSTRAINTS[category].mimeTypes → throw MediaError; determine size limit (for sticker: require stickerType, use 512000 for static / 1048576 for animated → throw ValidationError if missing stickerType; for others: use MEDIA_CONSTRAINTS[category].maxSizeBytes); check file size (Buffer.byteLength or Blob.size) does not exceed limit → throw MediaError. Size at exactly the limit is accepted; only exceeding is rejected.
- [x] T007 [US1] Implement upload() public method in src/media/media.ts: call validateUpload, build FormData with fields messaging_product='whatsapp', file (as Blob with correct mimeType and optional filename), type=mimeType, call this.client.upload\<MediaUploadResponse\>(`${this.phoneNumberId}/media`, formData, requestOptions), return the ApiResponse. Add TSDoc with @example block per contract in contracts/media-api.md.
- [x] T008 [US1] Write unit tests for upload in tests/media/media.test.ts: create mock HttpClient with uploadSpy (vi.fn().mockResolvedValue(mockResponse)); test successful upload for each of the 5 categories (image, video, audio, document, sticker) verifying FormData is passed with correct fields; test MIME rejection for each category (e.g., 'application/exe' for image → MediaError); test size limit rejection for each category (e.g., 6MB image → MediaError); test file at exact size boundary is accepted; test empty file (0 bytes Buffer and empty Blob) → MediaError; test sticker without stickerType → ValidationError; test sticker with stickerType='static' at 512001 bytes → MediaError; test sticker with stickerType='animated' at 1048577 bytes → MediaError; test requestOptions forwarding to client.upload.

**Checkpoint**: `pnpm test` passes for upload tests. Upload validation rejects all invalid inputs before network calls. All 5 media categories work correctly.

---

## Phase 4: User Story 2 — Retrieve a Media URL (Priority: P2)

**Goal**: Consumers can retrieve the temporary download URL and metadata for any media asset by its platform-assigned identifier.

**Independent Test**: Provide a known media ID and verify the response contains url, mime_type, file_size, sha256, and id fields.

### Implementation for User Story 2

- [x] T009 [US2] Implement getUrl() method in src/media/media.ts: call this.client.get\<MediaUrlResponse\>(mediaId, requestOptions), return the ApiResponse. The mediaId IS the path (not prefixed with phoneNumberId — media IDs are global). Add TSDoc with @example block per contract.
- [x] T010 [US2] Write unit tests for getUrl in tests/media/media.test.ts: create mock HttpClient with getSpy; test successful retrieval verifying correct path (mediaId) and response shape; test requestOptions forwarding; test that ApiError with status 404 propagates correctly (mock client.get to reject with ApiError).

**Checkpoint**: `pnpm test` passes for getUrl tests.

---

## Phase 5: User Story 3 — Download Media Content (Priority: P3)

**Goal**: Consumers can download binary media content from a platform-provided URL, with support for cancellation.

**Independent Test**: Provide a valid media download URL, execute download, verify binary content (ArrayBuffer) is returned.

### Implementation for User Story 3

- [x] T011 [US3] Implement download() method in src/media/media.ts: call this.client.downloadMedia(mediaUrl, requestOptions), return the ApiResponse\<ArrayBuffer\>. The mediaUrl is a full URL passed directly to HttpClient.downloadMedia. Consumers pass signal via requestOptions for cancellation. Add TSDoc with @example block per contract.
- [x] T012 [US3] Write unit tests for download in tests/media/media.test.ts: create mock HttpClient with downloadMediaSpy; test successful download verifying correct URL passed and ArrayBuffer returned; test requestOptions forwarding (including signal); test that ApiError propagates correctly for expired/invalid URLs.

**Checkpoint**: `pnpm test` passes for download tests.

---

## Phase 6: User Story 4 — Delete Media (Priority: P4)

**Goal**: Consumers can delete previously uploaded media assets by their platform-assigned identifier.

**Independent Test**: Provide a media ID, execute delete, verify success response `{ success: true }`.

### Implementation for User Story 4

- [x] T013 [US4] Implement delete() method in src/media/media.ts: call this.client.delete\<MediaDeleteResponse\>(mediaId, requestOptions), return the ApiResponse. The mediaId IS the path (global, not prefixed). Add TSDoc with @example block per contract.
- [x] T014 [US4] Write unit tests for delete in tests/media/media.test.ts: create mock HttpClient with deleteSpy; test successful deletion verifying correct path and response shape; test requestOptions forwarding; test that ApiError with status 404 (not found) and 403 (unauthorized) propagate correctly.

**Checkpoint**: `pnpm test` passes for delete tests.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: TSDoc, verification, and quality assurance

- [x] T015 Add TSDoc comments with @example blocks to all exported types and the MEDIA_CONSTRAINTS constant in src/media/types.ts
- [x] T016 Verify barrel exports in src/media/index.ts and src/index.ts: confirm all 9 exports (Media, MediaCategory, StickerSubtype, MediaConstraint, MediaUploadOptions, MediaUploadResponse, MediaUrlResponse, MediaDeleteResponse, MEDIA_CONSTRAINTS) are importable from the package root
- [x] T017 Run full verification: pnpm typecheck && pnpm lint && pnpm test:coverage — ensure no type errors, no lint violations, and coverage meets 80% threshold on all four axes for the media module
- [x] T018 Run quickstart.md validation: manually trace each code example in specs/002-media-upload-download/quickstart.md against the implemented API to confirm accuracy (method names, parameter shapes, import paths, return types)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001) — BLOCKS all user stories
- **User Stories (Phases 3–6)**: All depend on Foundational phase (T002–T005) completion
  - US1 is the MVP; implement first
  - US2, US3, US4 are independent of each other — can proceed in any order after US1
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational — no dependencies on other stories. MVP milestone.
- **User Story 2 (P2)**: Can start after Foundational — independent of US1. Implements getUrl().
- **User Story 3 (P3)**: Can start after Foundational — independent of US1/US2 from a code perspective (download() takes a URL string directly). Logically follows US2 in a user workflow but has no code dependency.
- **User Story 4 (P4)**: Can start after Foundational — independent of all other stories. Implements delete().

### Within Each User Story

- Implementation before tests (tests mock the class methods)
- Core method before edge case handling
- Story complete when its checkpoint passes

### Parallel Opportunities

- T004 and T005 can run in parallel (different files, both depend on T002/T003)
- After Foundational: US2 (T009–T010), US3 (T011–T012), and US4 (T013–T014) are independent and could theoretically proceed in parallel if modifying separate sections — but all modify src/media/media.ts and tests/media/media.test.ts, so sequential execution is safer
- T015 and T016 in Polish phase can run in parallel

---

## Parallel Example: Foundational Phase

```text
# Sequential: T002 (types) → T003 (class skeleton)
# Then parallel: T004 (media barrel) + T005 (main barrel)

Task: "Define all media types and constants in src/media/types.ts"
Task: "Create Media class skeleton in src/media/media.ts"
# ↓ then in parallel:
Task: "Replace stub in src/media/index.ts with barrel export"
Task: "Update main barrel export in src/index.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002–T005)
3. Complete Phase 3: User Story 1 — Upload (T006–T008)
4. **STOP and VALIDATE**: `pnpm typecheck && pnpm test` — upload works end-to-end
5. This alone delivers the most critical media capability

### Incremental Delivery

1. Setup + Foundational → Foundation ready (T001–T005)
2. Add US1 Upload → Test → **MVP!** (T006–T008)
3. Add US2 Get URL → Test → Inbound media workflow begins (T009–T010)
4. Add US3 Download → Test → Full inbound media workflow complete (T011–T012)
5. Add US4 Delete → Test → Full media lifecycle management (T013–T014)
6. Polish → Production ready (T015–T018)

---

## Notes

- All methods follow the existing Messages class pattern: constructor injection, `Promise<ApiResponse<T>>` return, typed errors
- The Media class uses the existing `MediaError` and `ValidationError` from `src/errors/` — no new error classes needed
- MEDIA_CONSTRAINTS is a static constant, not a class — it can be imported directly for validation without instantiating Media
- Tests mock HttpClient methods (upload, get, downloadMedia, delete) using `vi.fn()` — never call the actual Meta API
- The document MIME allow-list includes 12 MIME types per research.md Decision 3
- Sticker size limits require the consumer to pass `stickerType` explicitly per clarification Q1
