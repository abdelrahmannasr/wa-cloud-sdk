# Feature Specification: Media Upload, Download, and Management

**Feature Branch**: `002-media-upload-download`
**Created**: 2026-02-14
**Status**: Draft
**Input**: User description: "Phase 4 — Media upload, download, retrieval, and deletion for the WhatsApp Cloud API SDK"

## Clarifications

### Session 2026-02-14

- Q: How should the system determine whether a sticker upload is static or animated? → A: Single upload operation with an explicit sticker subtype parameter ("static" or "animated") that selects the correct size limit.
- Q: Should the system validate content types for the "Document" media category? → A: Validate against an explicit allow-list of common document MIME types (PDF, Word, Excel, CSV, text, etc.).
- Q: Should the spec explicitly declare what is out of scope for this feature? → A: Yes — add out-of-scope section: no streaming, no transcoding/transformation, no content type auto-detection, no URL caching, no thumbnail generation.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Upload Media for Messaging (Priority: P1)

As an SDK consumer, I need to upload media files (images, videos, audio, documents, and stickers) to the WhatsApp platform so that I can later send them to recipients by referencing the uploaded asset instead of a public URL.

**Why this priority**: Uploading media is the prerequisite for sending media-by-ID messages and is the most common media workflow. Without upload capability, consumers must host all media on publicly accessible URLs, which is a significant operational burden and a security risk for sensitive content.

**Independent Test**: Can be fully tested by uploading a sample image file and receiving a platform-assigned media identifier in return. Delivers immediate value by enabling private, URL-free media messaging.

**Acceptance Scenarios**:

1. **Given** a consumer has a valid media file (e.g., a JPEG image under 5 MB), **When** they upload it specifying the file content and its content type, **Then** they receive a confirmation containing the platform-assigned media identifier that can be used in subsequent send-media operations.

2. **Given** a consumer attempts to upload a file that exceeds the platform's size limit for its media type (e.g., an image larger than 5 MB), **When** the upload is attempted, **Then** the operation is rejected immediately with a validation error identifying the size constraint before any network request is made.

3. **Given** a consumer attempts to upload a file with an unsupported content type for the intended media category (e.g., a `.exe` file as an image), **When** the upload is attempted, **Then** the operation is rejected immediately with a validation error identifying the unsupported content type before any network request is made.

4. **Given** a consumer uploads a media file successfully, **When** the platform processes the upload, **Then** the returned media identifier is usable in any subsequent message send that accepts a media-by-ID reference.

---

### User Story 2 - Retrieve a Media URL (Priority: P2)

As an SDK consumer, I need to obtain the download URL for a previously uploaded or received media asset by its identifier so that I can download the content or pass the URL to other systems for processing.

**Why this priority**: When consumers receive inbound messages containing media (images, voice notes, documents from customers), they receive only a media identifier. To access the actual file content, they must first retrieve the URL. This is the critical bridge between receiving a media message and processing its content.

**Independent Test**: Can be fully tested by providing a known media identifier and verifying that a URL and metadata (content type, file size) are returned.

**Acceptance Scenarios**:

1. **Given** a consumer has a valid media identifier (from a previous upload or an inbound message), **When** they request the media URL, **Then** they receive the download URL along with metadata including content type, file size, and the identifier.

2. **Given** a consumer provides a media identifier that does not exist or has expired, **When** they request the media URL, **Then** the operation fails with a descriptive error indicating the media was not found.

---

### User Story 3 - Download Media Content (Priority: P3)

As an SDK consumer, I need to download the binary content of a media asset from a platform-provided URL so that I can store, process, or forward the media within my application.

**Why this priority**: Downloading completes the inbound media workflow. After retrieving the URL (P2), the consumer needs the actual file bytes. This is P3 because it depends on URL retrieval and is the final step in a multi-step process. However, it is essential for any application that processes customer-sent media.

**Independent Test**: Can be fully tested by providing a valid media download URL, executing the download, and verifying that binary content is returned with the expected content type.

**Acceptance Scenarios**:

1. **Given** a consumer has obtained a valid media download URL (from the URL retrieval operation), **When** they download the media content, **Then** they receive the binary file data suitable for saving to storage or further processing.

2. **Given** a consumer provides a media URL that has expired (URLs are temporary and expire after a platform-defined period), **When** they attempt to download, **Then** the operation fails with a descriptive error indicating the URL is no longer valid.

3. **Given** a consumer initiates a media download, **When** the download is in progress, **Then** the consumer can cancel the operation at any point using an external cancellation mechanism.

---

### User Story 4 - Delete Media (Priority: P4)

As an SDK consumer, I need to delete previously uploaded media assets from the platform so that I can manage storage, comply with data retention policies, and remove content that is no longer needed.

**Why this priority**: Deletion is important for housekeeping and compliance but is not required for core media messaging workflows. Most consumers can function without deletion initially. This is P4 because it is a management operation, not a messaging flow.

**Independent Test**: Can be fully tested by uploading a media file, deleting it by its identifier, and confirming the deletion succeeded.

**Acceptance Scenarios**:

1. **Given** a consumer has a valid media identifier for a previously uploaded asset, **When** they request deletion, **Then** the media is removed from the platform and a success confirmation is returned.

2. **Given** a consumer attempts to delete a media asset they do not own (uploaded by a different business account), **When** the deletion is attempted, **Then** the operation fails with an appropriate authorization error.

3. **Given** a consumer attempts to delete a media identifier that does not exist, **When** the deletion is attempted, **Then** the operation fails with a descriptive error indicating the media was not found.

---

### Edge Cases

- What happens when a consumer uploads a file with zero bytes? The operation is rejected with a validation error before any network request, indicating the file must not be empty.
- What happens when a consumer uploads a file with a valid content type but corrupt or unreadable content? The platform rejects the upload and the SDK surfaces the platform's error with appropriate context.
- What happens when the platform's media download URL expires between retrieval and download? The download fails with an error. The consumer must re-retrieve the URL and retry.
- What happens when the consumer attempts to upload with no content type specified? The operation is rejected with a validation error indicating the content type is required.
- What happens when the platform imposes a rate limit during media upload or download? The SDK's existing rate limiting and retry mechanisms handle this transparently, consistent with the behavior established in Phase 1 (Core Infrastructure).
- What happens when a media download is interrupted mid-transfer due to network issues? The SDK treats this as a transient failure and applies the configured retry policy.
- What happens when the consumer uploads a file at exactly the size limit boundary? The upload is accepted; only files exceeding the limit are rejected.

## Requirements *(mandatory)*

### Functional Requirements

**Media Upload**

- **FR-001**: The system MUST allow consumers to upload media files to the platform by providing the file content and its content type, receiving a platform-assigned media identifier on success.
- **FR-002**: The system MUST validate the content type of the uploaded file against the set of supported types for each media category before making any network request. Supported categories and their accepted content types are:
  - Image: JPEG, PNG
  - Video: MP4, 3GPP
  - Audio: AAC, MP4 audio, MPEG audio, AMR, OGG audio (with Opus codec)
  - Document: An explicit allow-list of common document types including PDF, plain text, Microsoft Office formats (Word, Excel, PowerPoint), OpenDocument formats, CSV, and similar standard document content types. The allow-list is maintained by the SDK and rejects unrecognized content types with a validation error.
  - Sticker: WebP (static and animated)
- **FR-003**: The system MUST validate the file size against the platform's limits for each media category before making any network request:
  - Image: maximum 5 MB
  - Video: maximum 16 MB
  - Audio: maximum 16 MB
  - Document: maximum 100 MB
  - Sticker: maximum 500 KB (static), 1 MB (animated). The consumer specifies the sticker subtype ("static" or "animated") via an explicit parameter on the upload operation; the system applies the corresponding size limit.
- **FR-004**: The system MUST reject uploads of empty files (zero bytes) with a validation error before any network request.
- **FR-005**: The system MUST surface all platform-side upload errors (invalid format, processing failure, quota exceeded) as structured, typed errors consistent with the SDK's error hierarchy.

**Media URL Retrieval**

- **FR-006**: The system MUST allow consumers to retrieve the download URL and metadata (content type, file size) for any media asset identified by its platform-assigned media identifier.
- **FR-007**: The system MUST surface "not found" platform responses as descriptive, typed errors when a media identifier does not exist or has expired.

**Media Download**

- **FR-008**: The system MUST allow consumers to download the binary content of a media asset from a platform-provided download URL, returning the raw file data.
- **FR-009**: The system MUST support external cancellation of in-progress downloads, allowing consumers to abort a download at any time.
- **FR-010**: The system MUST surface expired or invalid URL errors as descriptive, typed errors when a download URL is no longer valid.

**Media Deletion**

- **FR-011**: The system MUST allow consumers to delete a previously uploaded media asset by its platform-assigned media identifier, receiving a success confirmation on completion.
- **FR-012**: The system MUST surface authorization and "not found" errors as descriptive, typed errors when deletion fails.

**Cross-Cutting**

- **FR-013**: All media operations MUST inherit the SDK's existing rate limiting behavior, throttling requests according to the configured throughput limits.
- **FR-014**: All media operations MUST inherit the SDK's existing retry behavior, automatically retrying on transient failures with exponential backoff.
- **FR-015**: All media operation errors MUST be instances of the SDK's established error hierarchy, carrying machine-readable codes and human-readable messages. Upload and download errors specific to media MUST include the media type context where applicable.

### Key Entities

- **Media Asset**: A file uploaded to or received through the WhatsApp platform. Identified by a unique, platform-assigned media identifier. Characterized by its content type, file size, and media category (image, video, audio, document, or sticker). Has a lifecycle: created on upload or receipt, accessible via URL retrieval and download, removable via deletion.

- **Media Category**: A classification that determines which content types are accepted and what size limits apply. The five categories (image, video, audio, document, sticker) each have distinct validation rules governing what can be uploaded.

- **Media Constraints**: The set of validation rules (accepted content types and maximum file sizes) that apply to each media category. Used to reject invalid uploads before they reach the platform, providing fast feedback and avoiding unnecessary network requests.

- **Media URL**: A temporary, authenticated download link for a media asset. Retrieved by media identifier. Has a limited lifespan determined by the platform. Must be used promptly as it expires and cannot be reused after expiration.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A consumer can upload a media file and receive a usable media identifier in a single operation with no more than 3 lines of code beyond initial SDK setup.
- **SC-002**: All five media categories (image, video, audio, document, sticker) can be uploaded with the system enforcing the correct size limits and accepted content types for each.
- **SC-003**: 100% of uploads with invalid content types or oversized files are rejected before any network request is made, providing immediate feedback to the consumer.
- **SC-004**: A consumer can complete the full inbound media workflow — receive a media identifier from a webhook event, retrieve the download URL, and download the file content — in three sequential operations.
- **SC-005**: All media operations (upload, URL retrieval, download, delete) produce structured, typed errors on failure, with zero untyped or generic exceptions surfaced to the consumer.
- **SC-006**: Media operations respect the SDK's existing rate limiting and retry behavior with no additional configuration required by the consumer.
- **SC-007**: Automated test coverage for the media module meets or exceeds 80% on all four measurement axes (lines, functions, branches, statements).

## Out of Scope

The following capabilities are explicitly excluded from this feature:

- **Streaming uploads**: The system does not support streaming file content during upload. The entire file must be available in memory at upload time.
- **Media transcoding or transformation**: The system does not convert, resize, compress, or re-encode media files. Files are uploaded and downloaded as-is.
- **Content type auto-detection**: The system does not inspect file contents to infer the content type. The consumer must provide the correct content type explicitly.
- **Media URL caching**: The system does not cache or store download URLs. Each URL retrieval is a fresh request to the platform.
- **Thumbnail generation**: The system does not generate thumbnails or previews for uploaded or downloaded media.

## Assumptions

1. **Existing infrastructure**: The core HTTP client, rate limiter, retry mechanism, and error hierarchy from Phase 1 are fully implemented and stable. The media module builds on top of these without modifying them.
2. **Platform size limits**: The documented size limits (image: 5 MB, video: 16 MB, audio: 16 MB, document: 100 MB, sticker: 500 KB static / 1 MB animated) reflect the current platform constraints. These may change with platform updates.
3. **URL expiration**: Media download URLs provided by the platform are temporary. The SDK does not cache or extend these URLs. Consumers are responsible for using them promptly.
4. **Content type accuracy**: Consumers are responsible for providing the correct content type when uploading. The SDK validates against the supported set but does not inspect file contents to verify the claimed type matches the actual data.
5. **Single-file uploads**: Each upload operation handles a single file. Consumers who need to upload multiple files must make multiple upload calls.
6. **No local persistence**: The SDK does not store uploaded media identifiers, download URLs, or file content locally. Consumers manage their own persistence of these values.
7. **Authentication**: Media operations use the same access token and authentication mechanism as all other SDK operations, configured at SDK initialization.
8. **Sticker differentiation**: The upload operation accepts an explicit sticker subtype parameter ("static" or "animated"). Static stickers are limited to 500 KB, animated stickers to 1 MB. The system applies the corresponding size limit based on the consumer's declared subtype.
