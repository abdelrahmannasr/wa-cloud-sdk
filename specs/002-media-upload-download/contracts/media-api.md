# API Contract: Media Module

**Branch**: `002-media-upload-download` | **Date**: 2026-02-14 | **Plan**: [plan.md](../plan.md)

## Module: Media

**Constructor**: `new Media(client: HttpClient, phoneNumberId: string)`

Mirrors the `Messages` class pattern. Accepts an `HttpClient` instance and the phone number ID for constructing upload paths.

---

### upload(options, requestOptions?)

Upload a media file to the platform.

**Signature**:
```
upload(options: MediaUploadOptions, requestOptions?: RequestOptions): Promise<ApiResponse<MediaUploadResponse>>
```

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| options.file | Buffer \| Blob | Yes | Raw file content |
| options.mimeType | string | Yes | MIME type (e.g., `image/jpeg`) |
| options.category | MediaCategory | Yes | Media category for validation |
| options.filename | string | No | Optional filename hint |
| options.stickerType | StickerSubtype | Conditional | Required when category is `sticker` |
| requestOptions | RequestOptions | No | Override timeout, skip rate limit, etc. |

**Returns**: `ApiResponse<MediaUploadResponse>` containing `{ id: string }`

**Validation** (before network request):
1. File must not be empty (0 bytes) → throws `MediaError` with `mediaType` set to the category
2. MIME type must be in accepted set for category → throws `MediaError`
3. File size must not exceed category limit → throws `MediaError`
4. `stickerType` required when category is `sticker` → throws `ValidationError`

**Platform endpoint**: `POST /{phone_number_id}/media`

**Request body**: `multipart/form-data` with fields:
- `messaging_product`: `"whatsapp"`
- `file`: the file content with the specified MIME type
- `type`: the MIME type string

**Success response** (HTTP 200):
```json
{
  "id": "1234567890"
}
```

**Error responses**:
- `MediaError` — validation failure (empty file, bad MIME, oversized)
- `ValidationError` — missing `stickerType` for sticker category
- `ApiError` — platform rejection (invalid format, quota exceeded)
- `RateLimitError` — throttled (handled by retry)
- `AuthenticationError` — invalid token

---

### getUrl(mediaId, requestOptions?)

Retrieve the download URL and metadata for a media asset.

**Signature**:
```
getUrl(mediaId: string, requestOptions?: RequestOptions): Promise<ApiResponse<MediaUrlResponse>>
```

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| mediaId | string | Yes | Platform-assigned media identifier |
| requestOptions | RequestOptions | No | Override timeout, skip rate limit, etc. |

**Returns**: `ApiResponse<MediaUrlResponse>`

**Platform endpoint**: `GET /{media_id}`

**Success response** (HTTP 200):
```json
{
  "url": "https://lookaside.fbsbx.com/whatsapp_business/attachments/?mid=1234&ext=...",
  "mime_type": "image/jpeg",
  "sha256": "abc123...",
  "file_size": 1048576,
  "id": "1234567890",
  "messaging_product": "whatsapp"
}
```

**Error responses**:
- `ApiError` with status 404 — media not found or expired
- `AuthenticationError` — invalid token

---

### download(mediaUrl, requestOptions?)

Download the binary content of a media asset from a platform-provided URL.

**Signature**:
```
download(mediaUrl: string, requestOptions?: RequestOptions): Promise<ApiResponse<ArrayBuffer>>
```

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| mediaUrl | string | Yes | Download URL from `getUrl()` response |
| requestOptions | RequestOptions | No | Override timeout, signal for cancellation, etc. |

**Returns**: `ApiResponse<ArrayBuffer>` where `data` is the raw binary content

**Platform endpoint**: `GET {media_url}` (full URL, not a relative path)

**Notes**:
- The `mediaUrl` is a full URL (not a path). The HttpClient's `downloadMedia` method handles this.
- Authorization header is added automatically by HttpClient.
- Consumers can pass `requestOptions.signal` for cancellation.

**Error responses**:
- `ApiError` — URL expired or invalid
- `AuthenticationError` — invalid token

---

### delete(mediaId, requestOptions?)

Delete a previously uploaded media asset.

**Signature**:
```
delete(mediaId: string, requestOptions?: RequestOptions): Promise<ApiResponse<MediaDeleteResponse>>
```

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| mediaId | string | Yes | Platform-assigned media identifier |
| requestOptions | RequestOptions | No | Override timeout, skip rate limit, etc. |

**Returns**: `ApiResponse<MediaDeleteResponse>` containing `{ success: true }`

**Platform endpoint**: `DELETE /{media_id}`

**Success response** (HTTP 200):
```json
{
  "success": true
}
```

**Error responses**:
- `ApiError` with status 404 — media not found
- `ApiError` with status 403 — not authorized to delete (different business account)
- `AuthenticationError` — invalid token

---

## Exported Types

All types are exported from `src/media/index.ts` and re-exported from `src/index.ts`:

| Export | Kind | Description |
|--------|------|-------------|
| `Media` | Class | The media operations class |
| `MediaCategory` | Type | `'image' \| 'video' \| 'audio' \| 'document' \| 'sticker'` |
| `StickerSubtype` | Type | `'static' \| 'animated'` |
| `MediaUploadOptions` | Interface | Upload method options |
| `MediaUploadResponse` | Interface | Upload response shape |
| `MediaUrlResponse` | Interface | URL retrieval response shape |
| `MediaDeleteResponse` | Interface | Delete response shape |
| `MEDIA_CONSTRAINTS` | Constant | Validation rules per category |
| `MediaConstraint` | Interface | Shape of a single constraint entry |
