# Research: Media Upload, Download, and Management

**Branch**: `002-media-upload-download` | **Date**: 2026-02-14 | **Plan**: [plan.md](./plan.md)

## Overview

No NEEDS CLARIFICATION items existed in the Technical Context — the existing codebase infrastructure (HttpClient, error hierarchy, module patterns) is fully understood from Phase 1. This research documents the key technical decisions for the media module.

---

## Decision 1: File Input Representation for Upload

**Decision**: Accept `Buffer | Blob` as the file content input.

**Rationale**: Node.js 18+ provides native `Blob` support alongside `Buffer`. Both are compatible with the native `FormData` API used by `HttpClient.upload()`. Accepting both covers the two most common patterns: `Buffer` for consumers reading files from disk via `fs.readFile()`, and `Blob` for consumers working with in-memory data or web-compatible APIs. Both can be measured for size (`.byteLength` / `.size`) for pre-upload validation.

**Alternatives considered**:
- `ReadableStream` — Rejected. The spec explicitly declares streaming uploads out of scope. File must fit in memory for size validation.
- `string` (file path) — Rejected. Would require `fs.readFile()` internally, adding I/O responsibility to the SDK. Consumers can read files themselves and pass the buffer.
- `ArrayBuffer` — Rejected. Less common in Node.js server code. Consumers can wrap in `Blob` if needed.
- `File` (web API) — Rejected. `File` extends `Blob` and is less commonly available in Node.js server environments. Consumers can use `Blob` directly.

---

## Decision 2: MIME Type Validation Strategy

**Decision**: Maintain a static `MEDIA_CONSTRAINTS` map keyed by `MediaCategory` that maps each category to its accepted MIME type set and size limit. Validate content type against this map before upload.

**Rationale**: Client-side validation provides immediate feedback without a network round-trip. The Meta WhatsApp Cloud API has well-documented supported types per category. A static map is simple, testable, and has zero runtime overhead. The map can be updated when Meta changes their supported types.

**Alternatives considered**:
- Magic-byte content detection (file-type sniffing) — Rejected. The spec explicitly declares content type auto-detection out of scope. Would also require a dependency or significant code for binary format parsing.
- No client-side validation (let platform reject) — Rejected. Spec requires FR-002/FR-003: validation MUST occur before any network request.
- Configurable/extensible allow-lists — Rejected. Over-engineering for current needs. The MIME types are dictated by the platform. If a consumer needs to bypass validation, they can use HttpClient directly.

---

## Decision 3: Document Category MIME Allow-List

**Decision**: Include the following MIME types in the document allow-list:
- `text/plain`
- `application/pdf`
- `application/vnd.ms-powerpoint`, `application/vnd.openxmlformats-officedocument.presentationml.presentation`
- `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `application/vnd.oasis.opendocument.text`, `application/vnd.oasis.opendocument.spreadsheet`, `application/vnd.oasis.opendocument.presentation`
- `text/csv`

**Rationale**: This list covers the document types explicitly supported by the Meta WhatsApp Cloud API documentation. It includes legacy Microsoft Office formats (.doc, .xls, .ppt), modern Office formats (.docx, .xlsx, .pptx), OpenDocument formats (.odt, .ods, .odp), PDF, plain text, and CSV. This matches the clarification decision (Q2) to validate against an explicit allow-list.

**Alternatives considered**:
- Accept any MIME type — Rejected per clarification Q2.
- Smaller list (PDF/text only) — Rejected. Would block legitimate document types the platform supports.
- Larger list with obscure types — Rejected. Can be expanded later based on consumer requests. Start with known-supported types.

---

## Decision 4: Sticker Subtype Mechanism

**Decision**: Add a `stickerType` field of type `'static' | 'animated'` to the upload options. When the media category is `sticker`, this field is required and determines the size limit (500 KB for static, 1 MB for animated).

**Rationale**: Per clarification Q1, the consumer explicitly declares the sticker subtype. A discriminated union or required field is the simplest approach. Making it required only for stickers (not for other categories) can be enforced at the type level with a conditional options type or at runtime with validation.

**Alternatives considered**:
- Infer from file size — Rejected per clarification Q1.
- Separate upload methods — Rejected per clarification Q1.
- Optional with default to static — Considered but rejected. Defaulting silently could cause unexpected rejections for animated stickers. Explicit is better.

---

## Decision 5: Media Download URL Validation

**Decision**: The `download` method accepts any URL string. The HttpClient already adds the Authorization header. No domain validation is performed by the SDK.

**Rationale**: The HttpClient's `downloadMedia` comment notes "callers should validate URL is from trusted source," but the SDK cannot reliably predict Meta's CDN domains (which may change). Domain validation would be fragile. The consumer is responsible for only passing URLs obtained from `getUrl()`. The existing HttpClient adds the auth header automatically, which is the security-critical aspect.

**Alternatives considered**:
- Validate URL matches Meta CDN pattern — Rejected. Meta's CDN domains are not guaranteed stable. Would cause false rejections.
- Combined `getUrlAndDownload(mediaId)` convenience method — Deferred to future enhancement. The spec defines these as separate operations (P2 and P3).

---

## Decision 6: Upload Options Interface Design

**Decision**: Use a single `MediaUploadOptions` interface with a `category` field that determines which validation rules apply, plus an optional `stickerType` field required only when `category` is `'sticker'`.

**Rationale**: A single interface with a category discriminator keeps the API surface minimal (one `upload` method). Runtime validation ensures `stickerType` is provided when needed. This matches the Messages class pattern where a single method handles the common case with type-specific fields.

**Alternatives considered**:
- Separate method per category (`uploadImage`, `uploadVideo`, etc.) — Rejected. Would create 5 nearly-identical methods. The Messages class uses separate methods because each message type has a substantially different payload shape. Media upload payload is identical across categories except for validation constraints.
- Union of per-category option types — Over-engineering. The options only differ in which validation rules apply, not in their shape.
