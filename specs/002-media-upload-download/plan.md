# Implementation Plan: Media Upload, Download, and Management

**Branch**: `002-media-upload-download` | **Date**: 2026-02-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-media-upload-download/spec.md`
**Status**: Active

## Summary

Add a media module to the WhatsApp Cloud API SDK enabling consumers to upload media files (image, video, audio, document, sticker) with client-side content type and file size validation, retrieve download URLs by media identifier, download binary media content, and delete previously uploaded media assets. The module follows the same constructor-injection pattern established by the Messages class, builds on the existing HttpClient infrastructure (including its `upload` and `downloadMedia` methods), and uses the existing `MediaError` class for media-specific error conditions. All validation (MIME type allow-lists, size limits, empty file checks) happens before any network request.

## Technical Context

**Language/Version**: TypeScript 5.3+ with strict mode enabled
**Primary Dependencies**: Zero runtime dependencies. Dev: tsup 8, vitest 3, eslint 9, prettier 3
**Storage**: N/A (stateless SDK library)
**Testing**: Vitest with v8 coverage, 80% thresholds on lines/functions/branches/statements
**Target Platform**: Node.js 18+ (uses native fetch, crypto, URL, FormData, AbortController, Buffer, Blob)
**Project Type**: Single npm library with dual ESM/CJS output
**Performance Goals**: Inherits 80 requests/second throughput from Phase 1 rate limiter
**Constraints**: Zero runtime dependencies, <30s default request timeout, client-side file validation before upload, file must fit in memory (no streaming)
**Scale/Scope**: SDK consumed by applications; single phone number per instance

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution not yet configured for this project (template placeholders only). No gates to evaluate. Proceeding with standard engineering best practices as defined in CLAUDE.md:

- Zero runtime dependencies: **PASS** (media module uses only Node.js built-ins: FormData, Blob, Buffer)
- No `any` types: **PASS** (enforced by ESLint + TypeScript strict)
- No default exports: **PASS** (enforced by ESLint rule)
- Named exports only: **PASS**
- 80% test coverage: **PASS** (enforced by vitest config thresholds)
- No console.log: **PASS** (uses configurable Logger interface via HttpClient)

## Project Structure

### Documentation (this feature)

```text
specs/002-media-upload-download/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: Technical decisions
├── data-model.md        # Phase 1: Entity model
├── quickstart.md        # Phase 1: Integration guide
├── contracts/
│   └── media-api.md     # Phase 1: Media API contract
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2: Task breakdown (via /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── media/
│   ├── types.ts          # MediaUploadOptions, MediaUploadResponse, MediaUrlResponse,
│   │                     # MediaDeleteResponse, MEDIA_CONSTRAINTS, MediaCategory,
│   │                     # StickerSubtype
│   ├── media.ts          # Media class: upload, getUrl, download, delete
│   └── index.ts          # Barrel export (replaces current stub)
└── index.ts              # Updated barrel: add Media class + media types

tests/
└── media/
    └── media.test.ts     # Unit tests: upload validation, each endpoint, error paths
```

**Structure Decision**: Follows the existing single-module pattern established by `src/messages/`. New files within `src/media/` only. The `Media` class mirrors the `Messages` class pattern: constructor injection of `HttpClient` + `phoneNumberId`, methods return `Promise<ApiResponse<T>>`, validation errors thrown as `MediaError` or `ValidationError` before network calls.

## Complexity Tracking

No complexity violations to justify. The architecture follows the existing pattern exactly:
- Constructor injection of HttpClient (no DI framework)
- Direct use of Node.js built-ins (FormData, Blob, Buffer)
- Static validation constants (no configuration files or external lookups)
- No new abstraction layers beyond the single `Media` class
