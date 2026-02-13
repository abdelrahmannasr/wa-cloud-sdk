# API Contract: HttpClient

**Module**: `@abdelrahmannasr-wa/cloud-api` (main) or `@abdelrahmannasr-wa/cloud-api/client`

## Class: HttpClient

### Constructor

```
new HttpClient(config: WhatsAppConfig)
```

Creates an HTTP client instance with authentication, rate limiting, and retry capabilities.

- Initializes rate limiter from `config.rateLimitConfig` (default: 80 tokens/sec)
- Stores retry configuration from `config.retryConfig`
- Sets default timeout from `config.timeoutMs` (default: 30000ms)
- Uses `config.baseUrl` (default: `https://graph.facebook.com`) and `config.apiVersion` (default: `v21.0`)

### Methods

#### request\<T\>(method, path, body?, options?) → Promise\<ApiResponse\<T\>\>

General-purpose HTTP request to the Meta Graph API.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| method | HttpMethod | Yes | `GET`, `POST`, `PUT`, `PATCH`, or `DELETE` |
| path | string | Yes | API path (e.g., `{phoneNumberId}/messages`) |
| body | unknown | No | Request body (JSON-serialized) |
| options | RequestOptions | No | Per-request overrides |

**Behavior**:
1. Acquires rate limit token (unless `options.skipRateLimit`)
2. Builds URL: `{baseUrl}/{apiVersion}/{path}`
3. Adds `Authorization: Bearer {accessToken}` header
4. Adds `Content-Type: application/json` header (if body present)
5. Creates AbortController with timeout
6. Wraps in retry logic (unless `options.skipRetry`)
7. Parses response or throws typed error

**Returns**: `{ data: T, status: number, headers: Headers }`

**Throws**: `ApiError`, `RateLimitError`, `AuthenticationError`

---

#### get\<T\>(path, options?) → Promise\<ApiResponse\<T\>\>

Convenience wrapper for `request('GET', path, undefined, options)`.

---

#### post\<T\>(path, body?, options?) → Promise\<ApiResponse\<T\>\>

Convenience wrapper for `request('POST', path, body, options)`.

---

#### delete\<T\>(path, options?) → Promise\<ApiResponse\<T\>\>

Convenience wrapper for `request('DELETE', path, undefined, options)`.

---

#### upload\<T\>(path, formData, options?) → Promise\<ApiResponse\<T\>\>

Multipart file upload via native FormData.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| path | string | Yes | API path |
| formData | FormData | Yes | Native FormData with file data |
| options | RequestOptions | No | Per-request overrides |

**Behavior**: Same as `request` but does NOT set `Content-Type` (browser/Node sets multipart boundary automatically).

---

#### downloadMedia(url, options?) → Promise\<ApiResponse\<ArrayBuffer\>\>

Download media binary from a media URL.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| url | string | Yes | Full media URL (from `getUrl` response) |
| options | RequestOptions | No | Per-request overrides |

**Behavior**: Makes authenticated GET request, returns response as ArrayBuffer.

---

#### destroy() → void

Cleanup resources. Destroys the rate limiter (rejects pending requests, clears timers).

---

## RequestOptions

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| headers | Record\<string, string\> | `{}` | Additional request headers |
| timeoutMs | number | `30000` | Per-request timeout override |
| skipRateLimit | boolean | `false` | Bypass rate limiter for this request |
| skipRetry | boolean | `false` | Disable retry for this request |
| params | Record\<string, string\> | - | URL query parameters |
| signal | AbortSignal | - | External cancellation signal |

## Error Mapping

| HTTP Status | Condition | Error Thrown |
|-------------|-----------|-------------|
| 401 | Any, or error code 190 | AuthenticationError |
| 429 | Any, or error code 4 | RateLimitError |
| 400, 404 | Any other | ApiError |
| >= 500 | Any | ApiError (retryable) |
| Timeout | AbortController fires | ApiError (retryable) |
