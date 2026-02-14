# Research: Multi-WABA Account Management

**Feature Branch**: `005-multi-account-management`
**Date**: 2026-02-14

## Meta WhatsApp API Endpoints — Phone Number Management

### Decision: API Endpoint Patterns Verified

**Rationale**: Cross-referenced multiple open-source SDKs (Ruby, Java, Python/pywa, Meta's official Node.js SDK) and third-party API documentation (Kapso) to verify endpoint patterns.

**Endpoints confirmed:**

| Operation | Method | Path | Body / Params |
|-----------|--------|------|---------------|
| List phone numbers | GET | `/{waba_id}/phone_numbers` | Query: `fields`, `limit`, `after`, `before` |
| Get phone number | GET | `/{phone_number_id}` | Query: `fields` |
| Get business profile | GET | `/{phone_number_id}/whatsapp_business_profile` | Query: `fields` |
| Update business profile | POST | `/{phone_number_id}/whatsapp_business_profile` | Body: `messaging_product`, `about`, `address`, `description`, `email`, `vertical`, `websites`, `profile_picture_handle` |
| Request verification code | POST | `/{phone_number_id}/request_code` | Body: `code_method`, `language` |
| Verify code | POST | `/{phone_number_id}/verify_code` | Body: `code` |
| Register | POST | `/{phone_number_id}/register` | Body: `messaging_product`, `pin` |
| Deregister | POST | `/{phone_number_id}/deregister` | Body: empty or `{}` |

**Alternatives considered**: None — these are the only documented Meta Graph API endpoints for phone number management.

---

## Phone Number Response Fields

### Decision: Use comprehensive field set from Meta Graph API

**Rationale**: Multiple SDK implementations and Kapso docs confirm these fields are returned by the phone numbers endpoint.

**Fields available on `GET /{waba_id}/phone_numbers` and `GET /{phone_number_id}`:**

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Phone number ID |
| `verified_name` | string | Verified business display name |
| `display_phone_number` | string | International format (e.g., "+1 631-555-5555") |
| `quality_rating` | enum | `GREEN`, `YELLOW`, `RED`, `NA`, `UNKNOWN` |
| `code_verification_status` | string | `NOT_VERIFIED`, `VERIFIED`, `EXPIRED` |
| `is_official_business_account` | boolean | Whether officially verified by Meta |
| `name_status` | enum | `APPROVED`, `PENDING_REVIEW`, `DECLINED`, etc. |
| `new_name_status` | string | Status of pending name change |
| `platform_type` | string | `CLOUD_API`, `ON_PREMISE`, `NOT_APPLICABLE` |
| `throughput` | object | `{ level: "STANDARD" \| "HIGH" \| "NOT_APPLICABLE" }` |
| `account_mode` | enum | `SANDBOX`, `LIVE` |
| `messaging_limit_tier` | string | `TIER_50`, `TIER_250`, `TIER_1K`, `TIER_10K`, `TIER_100K`, `TIER_UNLIMITED` |
| `is_pin_enabled` | boolean | Two-step verification status |
| `last_onboarded_time` | string | Timestamp of last onboarding |

**Alternatives considered**: Minimal field set (id, name, number only) — rejected because quality rating, messaging limits, and verification status are critical for multi-account monitoring.

---

## Business Profile Fields

### Decision: Support all Meta-documented business profile fields

**Rationale**: All fields are commonly needed for multi-tenant platform administration.

**Fields:**

| Field | Type | Constraints |
|-------|------|-------------|
| `messaging_product` | string | Always `"whatsapp"` (required on update) |
| `about` | string | Max 139 characters |
| `address` | string | Max 256 characters |
| `description` | string | Max 512 characters |
| `email` | string | Max 128 characters |
| `profile_picture_url` | string | Read-only URL from Meta CDN |
| `websites` | string[] | Max 2 URLs, each max 256 chars |
| `vertical` | enum | 19 values: `UNDEFINED`, `OTHER`, `AUTO`, `BEAUTY`, `APPAREL`, `EDU`, `ENTERTAIN`, `EVENT_PLAN`, `FINANCE`, `GROCERY`, `GOVT`, `HOTEL`, `HEALTH`, `NONPROFIT`, `PROF_SERVICES`, `RETAIL`, `TRAVEL`, `RESTAURANT`, `NOT_A_BIZ` |
| `profile_picture_handle` | string | Write-only handle from Resumable Upload API |

**Note**: `profile_picture_url` is read-only (returned on GET), while `profile_picture_handle` is write-only (sent on POST). The SDK exposes both appropriately.

**Response wrapping**: Business profile GET returns `{ data: [{ ... }] }` — the SDK should unwrap the single-element `data` array.

---

## Registration Flow

### Decision: Model as three separate methods matching Meta's API surface

**Rationale**: Meta's API separates the registration flow into three distinct steps with separate endpoints. Combining them into a single method would hide the asynchronous nature of code delivery (user must receive and input the code between request and verify).

**Flow**: `requestVerificationCode()` → user receives code → `verifyCode()` → `register()`

**Key details**:
- `register()` requires `messaging_product: "whatsapp"` and a 6-digit `pin` (two-step verification PIN)
- `request_code` requires `code_method` (`SMS` | `VOICE`) and `language` (locale code like `en_US`)
- `verify_code` requires `code` (6-digit string)
- `deregister()` sends empty body or `{}`
- Rate limit: 10 registration/deregistration requests per phone number per 72-hour window

**Alternatives considered**: Single `registerWithVerification()` method — rejected because the async code delivery step makes a synchronous combined method impractical.

---

## Pagination Pattern

### Decision: Use Meta cursor-based pagination consistent with Templates module

**Rationale**: The phone numbers list endpoint uses the same Meta Graph API cursor-based pagination as templates. The existing `TemplateListParams` pattern (with `limit`, `after`, `before`) should be reused.

**Response pagination shape:**
```json
{
  "data": [...],
  "paging": {
    "cursors": {
      "before": "abc123",
      "after": "def456"
    }
  }
}
```

**Alternatives considered**: Offset-based pagination — not available on this Meta endpoint.

---

## SDK Pattern Alignment

### Decision: Follow established Templates/Media class patterns exactly

**Rationale**: The existing SDK has well-established patterns confirmed across 4 implemented modules. Consistency reduces the learning curve for developers.

**Patterns to follow:**
1. Constructor: `(client: HttpClient, businessAccountId: string)` with `ValidationError` on empty
2. Methods: Config object params, return `Promise<ApiResponse<T>>`, `RequestOptions` as last param
3. Types: `interface` for contracts, `type` for unions, `readonly` everywhere, constants in `types.ts`
4. Validation: Private methods, throw typed errors before network calls
5. HttpClient: `get()`, `post()`, `delete()` with relative paths and `options.params`
6. Exports: Module barrel → root barrel, named only
7. Errors: `ValidationError` for input, domain errors for domain validation

**Alternatives considered**: None — deviating from established patterns would be inconsistent.

---

## WhatsAppMultiAccount Design

### Decision: Map-based lazy manager with shared base config

**Rationale**: Lazy initialization matches the unified client's pattern for optional modules. A Map provides O(1) lookups by account name or phone number ID.

**Key design decisions:**
- Store account configs in a `Map<string, AccountConfig>` (keyed by account name)
- Store a secondary `Map<string, string>` for phoneNumberId → accountName lookup
- Store lazily-created instances in a `Map<string, WhatsApp>` (keyed by account name)
- Shared base config (apiVersion, baseUrl, logger, rateLimitConfig, retryConfig, timeoutMs) merged with per-account overrides at instance creation time
- `addAccount()` and `removeAccount()` for dynamic lifecycle
- `destroy()` only cleans up instantiated instances
- Iteration via `accounts()` method returning account name/config entries (not WhatsApp instances, to avoid forcing lazy initialization)

**Alternatives considered:**
- Array-based storage — rejected for O(n) lookups
- Eager initialization — rejected for resource waste with many accounts
- Hybrid (validate eagerly, create lazily) — unnecessary complexity; validation happens at creation time

---

## Sources

- Kapso WhatsApp Cloud API docs (mirrors Meta API)
- WhatsApp Business Java API (Bindambc/whatsapp-business-java-api)
- Ruby WhatsApp SDK (ignacio-chiazzo/ruby_whatsapp_sdk)
- Meta Official WhatsApp Node.js SDK (WhatsApp/WhatsApp-Nodejs-SDK)
- PyWa Python SDK (pywa.readthedocs.io)
- Existing SDK modules: templates, media, client, whatsapp, errors
