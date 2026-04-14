# Data Model: Media Upload, Download, and Management

**Branch**: `002-media-upload-download` | **Date**: 2026-02-14 | **Plan**: [plan.md](./plan.md)

## Entities

### MediaCategory

A classification that determines validation rules for media uploads.

**Values**: `'image' | 'video' | 'audio' | 'document' | 'sticker'`

Each value maps to a set of accepted MIME types and a maximum file size through the `MEDIA_CONSTRAINTS` constant.

---

### StickerSubtype

A refinement of the sticker category that determines the applicable size limit.

**Values**: `'static' | 'animated'`

- `static` → maximum 500 KB (512,000 bytes)
- `animated` → maximum 1 MB (1,048,576 bytes)

Required only when `MediaCategory` is `'sticker'`. Ignored for all other categories.

---

### MediaConstraint

The validation rules for a single media category.

| Field | Type | Description |
|-------|------|-------------|
| mimeTypes | Set of strings | Accepted MIME types for this category |
| maxSizeBytes | Number | Maximum file size in bytes |

---

### MEDIA_CONSTRAINTS (constant)

Static map from `MediaCategory` to `MediaConstraint`. Defines the full validation matrix:

| Category | Accepted MIME Types | Max Size |
|----------|-------------------|----------|
| image | `image/jpeg`, `image/png` | 5 MB (5,242,880 bytes) |
| video | `video/mp4`, `video/3gpp` | 16 MB (16,777,216 bytes) |
| audio | `audio/aac`, `audio/mp4`, `audio/mpeg`, `audio/amr`, `audio/ogg` | 16 MB (16,777,216 bytes) |
| document | `application/pdf`, `text/plain`, `text/csv`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `application/vnd.ms-powerpoint`, `application/vnd.openxmlformats-officedocument.presentationml.presentation`, `application/vnd.oasis.opendocument.text`, `application/vnd.oasis.opendocument.spreadsheet`, `application/vnd.oasis.opendocument.presentation` | 100 MB (104,857,600 bytes) |
| sticker | `image/webp` | 500 KB static (512,000 bytes) / 1 MB animated (1,048,576 bytes) |

---

### MediaUploadOptions

Consumer-provided options for uploading a media file.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | Buffer or Blob | Yes | The raw file content to upload |
| mimeType | String | Yes | The MIME type of the file (e.g., `image/jpeg`) |
| category | MediaCategory | Yes | The media category for validation routing |
| filename | String | No | Optional filename hint for the platform |
| stickerType | StickerSubtype | Conditional | Required when `category` is `'sticker'`; determines size limit |

**Validation rules** (applied before network request):
1. `file` must not be empty (0 bytes) → `MediaError`
2. `mimeType` must be in the accepted set for the given `category` → `MediaError`
3. File size must not exceed the limit for the `category` (and `stickerType` for stickers) → `MediaError`
4. `stickerType` must be provided when `category` is `'sticker'` → `ValidationError`

---

### MediaUploadResponse

Platform response after a successful upload.

| Field | Type | Description |
|-------|------|-------------|
| id | String | Platform-assigned media identifier |

---

### MediaUrlResponse

Platform response when retrieving a media asset's download URL.

| Field | Type | Description |
|-------|------|-------------|
| id | String | The media identifier |
| url | String | Temporary, authenticated download URL |
| mime_type | String | Content type of the media asset |
| sha256 | String | SHA-256 hash of the media content |
| file_size | Number | File size in bytes |
| messaging_product | String | Always `"whatsapp"` |

---

### MediaDeleteResponse

Platform response after a successful deletion.

| Field | Type | Description |
|-------|------|-------------|
| success | Boolean | `true` if deletion succeeded |

---

## Entity Relationships

```text
MediaUploadOptions ──uses──▶ MediaCategory ──maps to──▶ MediaConstraint (via MEDIA_CONSTRAINTS)
                    ──uses──▶ StickerSubtype (conditional, when category = sticker)

MediaUploadOptions ──produces──▶ MediaUploadResponse (contains media id)

MediaUploadResponse.id ──input to──▶ getUrl() ──produces──▶ MediaUrlResponse (contains URL)
MediaUrlResponse.url ──input to──▶ download() ──produces──▶ binary content (ArrayBuffer)
MediaUploadResponse.id ──input to──▶ delete() ──produces──▶ MediaDeleteResponse
```

## State Transitions

Media assets have a simple lifecycle managed entirely by the platform:

```text
[Not Exists] ──upload()──▶ [Uploaded] ──delete()──▶ [Deleted/Not Exists]
                              │
                              ├──getUrl()──▶ [URL Retrieved] (URL expires after platform-defined period)
                              │
                              └──(inbound message)──▶ [Received] (same as Uploaded from SDK perspective)
```

The SDK does not track state. Each operation is stateless and idempotent from the SDK's perspective. The platform manages lifecycle and expiration.
