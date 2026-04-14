# Data Model: WhatsApp Cloud API SDK -- Core Foundation

**Branch**: `001-sdk-core-foundation` | **Date**: 2026-02-13

## Entity Relationship Overview

```text
WhatsAppConfig ──creates──► HttpClient
                              │
                    ┌─────────┼─────────┐
                    ▼         ▼         ▼
                Messages    Media*   Templates*
                    │
                    ▼
            MessageResponse

WebhookConfig ──creates──► WebhookHandler
                              │
                    ┌─────────┼─────────┐
                    ▼         ▼         ▼
              MessageEvent StatusEvent ErrorEvent

TokenBucketRateLimiter ◄── used by ── HttpClient
RetryConfig            ◄── used by ── HttpClient

Error Hierarchy:
  WhatsAppError
  ├── ApiError
  │   ├── RateLimitError
  │   └── AuthenticationError
  ├── ValidationError
  ├── WebhookVerificationError
  └── MediaError

* = stub, not yet implemented
```

## Entities

### Configuration

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| accessToken | string | Yes | - | Bearer token for Meta Graph API authentication |
| phoneNumberId | string | Yes | - | WhatsApp Business phone number ID |
| businessAccountId | string | No | - | WhatsApp Business Account ID (required for templates) |
| apiVersion | string | No | `"v21.0"` | Meta Graph API version |
| baseUrl | string | No | `"https://graph.facebook.com"` | API base URL |
| logger | Logger | No | - | Configurable logging interface (debug/info/warn/error) |
| rateLimitConfig.maxTokens | number | No | `80` | Maximum tokens in rate limiter bucket |
| rateLimitConfig.refillRate | number | No | `80` | Tokens refilled per second |
| rateLimitConfig.enabled | boolean | No | `true` | Enable/disable rate limiting |
| retryConfig.maxRetries | number | No | `3` | Maximum retry attempts |
| retryConfig.baseDelayMs | number | No | `1000` | Base delay for exponential backoff |
| retryConfig.maxDelayMs | number | No | `30000` | Maximum backoff delay cap |
| retryConfig.jitterFactor | number | No | `0.2` | Randomization factor (0-1) |
| timeoutMs | number | No | `30000` | Request timeout in milliseconds |
| appSecret | string | No | - | App secret for webhook signature verification |
| webhookVerifyToken | string | No | - | Token for webhook subscription verification |

**Validation rules**:
- `accessToken` must be non-empty string
- `phoneNumberId` must be non-empty string
- `rateLimitConfig.maxTokens` must be positive integer
- `rateLimitConfig.refillRate` must be positive number
- `retryConfig.maxRetries` must be non-negative integer
- `retryConfig.jitterFactor` must be between 0 and 1

---

### Message (Outbound)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| to | string | Yes | Recipient phone number (validated to 7-15 digits) |
| type | MessageType | Yes | One of 11 types (see below) |
| messaging_product | `"whatsapp"` | Yes | Always "whatsapp" (auto-set by SDK) |

**Message types** (union): `text | image | video | audio | document | sticker | location | contacts | reaction | interactive | template`

**Type-specific payload shapes**:

| Type | Required Fields | Optional Fields |
|------|----------------|-----------------|
| text | body (string) | previewUrl (boolean) |
| image | media (MediaSource) | caption (string) |
| video | media (MediaSource) | caption (string) |
| audio | media (MediaSource) | - |
| document | media (MediaSource) | caption, filename |
| sticker | media (MediaSource) | - |
| location | longitude, latitude (number) | name, address (string) |
| contacts | contacts (ContactInfo[]) | - |
| reaction | messageId, emoji (string) | - |
| interactive (buttons) | body, buttons (max 3) | header, footer |
| interactive (list) | body, buttonText, sections | header, footer |
| template | templateName, language | components (TemplateComponent[]) |

---

### MediaSource

Exclusive union -- exactly one of:

| Variant | Field | Type | Description |
|---------|-------|------|-------------|
| By ID | id | string | Platform-assigned media identifier |
| By URL | link | string | Publicly accessible media URL |

---

### MessageResponse

| Field | Type | Description |
|-------|------|-------------|
| messaging_product | `"whatsapp"` | Always "whatsapp" |
| contacts | Contact[] | Resolved recipient identifiers |
| contacts[].input | string | Original input phone number |
| contacts[].wa_id | string | WhatsApp ID |
| messages | Message[] | Platform-assigned message identifiers |
| messages[].id | string | Message ID (e.g., `wamid.xxx`) |

---

### WebhookEvent

Discriminated union on `type` field:

| Variant | Type Field | Key Data |
|---------|-----------|----------|
| MessageEvent | `"message"` | contact (name + waId), message (full payload), timestamp |
| StatusEvent | `"status"` | status object (id, status, recipient, conversation, pricing) |
| ErrorEvent | `"error"` | error object (code, title, message, error_data) |

**Common fields** (EventMetadata):

| Field | Type | Description |
|-------|------|-------------|
| phoneNumberId | string | Business phone number ID |
| displayPhoneNumber | string | Human-readable phone number |

**Message types supported** (WebhookMessageType): `text | image | video | audio | document | sticker | location | contacts | interactive | reaction | button | order | unsupported`

---

### Status Lifecycle (Platform-Defined)

```text
sent → delivered → read
  └──────────────→ failed
```

| Status | Description |
|--------|-------------|
| sent | Message accepted by WhatsApp servers |
| delivered | Message delivered to recipient's device |
| read | Recipient opened the message |
| failed | Delivery failed (error details in `errors` array) |

---

### Error Hierarchy

| Class | Parent | Unique Fields | Machine Code |
|-------|--------|---------------|--------------|
| WhatsAppError | Error | code (string) | Varies |
| ApiError | WhatsAppError | statusCode, errorType, errorSubcode?, fbTraceId? | `"API_ERROR"` |
| RateLimitError | ApiError | retryAfterMs? | `"RATE_LIMIT_ERROR"` |
| AuthenticationError | ApiError | - | `"AUTHENTICATION_ERROR"` |
| ValidationError | WhatsAppError | field? | `"VALIDATION_ERROR"` |
| WebhookVerificationError | WhatsAppError | - | `"WEBHOOK_VERIFICATION_ERROR"` |
| MediaError | WhatsAppError | mediaType? | `"MEDIA_ERROR"` |

**Error-to-HTTP mapping**:

| HTTP Status | Platform Code | SDK Error Class |
|-------------|--------------|-----------------|
| 401 | 190 | AuthenticationError |
| 429 | 4 | RateLimitError |
| 400 | * | ApiError |
| 404 | * | ApiError |
| >= 500 | * | ApiError (retryable) |

---

### WebhookHandler

| Component | Input | Output |
|-----------|-------|--------|
| handleGet | query params (mode, token, challenge) | { statusCode, body: challenge string } |
| handlePost | rawBody (Buffer/string), signature (string) | { statusCode, body } + callback invocations |

**Callbacks** (all optional, async-supported):

| Callback | Receives | Invoked When |
|----------|----------|-------------|
| onMessage | MessageEvent | Incoming user message |
| onStatus | StatusEvent | Delivery status change |
| onError | ErrorEvent | Platform error notification |

---

### TokenBucketRateLimiter

| State | Type | Description |
|-------|------|-------------|
| tokens | number | Current available tokens (0 to maxTokens) |
| maxTokens | number | Bucket capacity |
| refillRate | number | Tokens added per second |
| queue | Promise[] | Pending acquire() calls waiting for tokens |

**State transitions**:
- `acquire()` → tokens > 0: consume token, resolve immediately
- `acquire()` → tokens = 0: enqueue, wait for refill
- `tryAcquire()` → tokens > 0: consume token, return true
- `tryAcquire()` → tokens = 0: return false (no waiting)
- Refill timer: adds tokens at `refillRate/sec`, drains queue
- `destroy()` → reject all queued, clear timers
- `reset()` → reject all queued, refill to maxTokens
