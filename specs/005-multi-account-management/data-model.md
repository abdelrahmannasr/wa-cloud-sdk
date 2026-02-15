# Data Model: Multi-WABA Account Management

**Feature Branch**: `005-multi-account-management`
**Date**: 2026-02-14

## Entities

### PhoneNumber

Represents a WhatsApp-enabled phone number registered under a WABA.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string | Yes | Phone number ID (Meta Graph API node ID) |
| `displayPhoneNumber` | string | Yes | International format (e.g., "+1 631-555-5555") |
| `verifiedName` | string | Yes | Verified business display name |
| `qualityRating` | QualityRating | Yes | `GREEN`, `YELLOW`, `RED`, `NA`, `UNKNOWN` |
| `codeVerificationStatus` | CodeVerificationStatus | Yes | `NOT_VERIFIED`, `VERIFIED`, `EXPIRED` |
| `isOfficialBusinessAccount` | boolean | Yes | Whether verified by Meta |
| `nameStatus` | NameStatus | Yes | `APPROVED`, `PENDING_REVIEW`, `DECLINED`, etc. |
| `newNameStatus` | string | No | Status of pending name change |
| `platformType` | PlatformType | Yes | `CLOUD_API`, `ON_PREMISE`, `NOT_APPLICABLE` |
| `throughput` | Throughput | No | `{ level: "STANDARD" \| "HIGH" \| "NOT_APPLICABLE" }` |
| `accountMode` | AccountMode | No | `SANDBOX`, `LIVE` |
| `messagingLimitTier` | MessagingLimitTier | No | `TIER_50` through `TIER_UNLIMITED` |
| `isPinEnabled` | boolean | No | Two-step verification status |
| `lastOnboardedTime` | string | No | ISO timestamp |

**Identity**: Unique by `id` (Meta-assigned phone number ID).

### BusinessProfile

Public-facing business information tied to a specific phone number.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `messagingProduct` | string | Yes | Always `"whatsapp"` |
| `about` | string | No | Max 139 characters |
| `address` | string | No | Max 256 characters |
| `description` | string | No | Max 512 characters |
| `email` | string | No | Max 128 characters |
| `profilePictureUrl` | string | No | Read-only, Meta CDN URL |
| `websites` | string[] | No | Max 2 URLs, each max 256 chars |
| `vertical` | BusinessVertical | No | One of 19 industry values |

**Identity**: One-to-one relationship with PhoneNumber (identified by phone number ID).

### BusinessProfileUpdate

Partial update payload for business profile modifications.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `about` | string | No | Max 139 characters |
| `address` | string | No | Max 256 characters |
| `description` | string | No | Max 512 characters |
| `email` | string | No | Max 128 characters |
| `vertical` | BusinessVertical | No | Industry category |
| `websites` | string[] | No | Max 2 URLs |
| `profilePictureHandle` | string | No | Write-only, from Resumable Upload API |

### VerificationCodeRequest

Request to initiate phone number verification.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `codeMethod` | CodeMethod | Yes | `SMS` or `VOICE` |
| `language` | string | Yes | Locale code (e.g., `en_US`, `es_ES`) |

**Validation**: `codeMethod` must be `SMS` or `VOICE` (client-side validation).

### VerifyCodeRequest

Submit a verification code.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `code` | string | Yes | 6-digit numeric string |

### RegisterRequest

Register a phone number with the Cloud API.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `pin` | string | Yes | 6-digit two-step verification PIN |

### AccountConfig

Configuration for a single managed account in WhatsAppMultiAccount.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | Yes | Unique account label |
| `accessToken` | string | Yes | Access token for this account |
| `phoneNumberId` | string | Yes | Phone number ID for this account |
| `businessAccountId` | string | No | WABA ID (needed for templates, phone numbers) |
| `apiVersion` | string | No | Override shared base |
| `baseUrl` | string | No | Override shared base |
| `logger` | Logger | No | Override shared base |
| `rateLimitConfig` | RateLimitConfig | No | Override shared base |
| `retryConfig` | RetryConfig | No | Override shared base |
| `timeoutMs` | number | No | Override shared base |
| `appSecret` | string | No | For webhook verification |
| `webhookVerifyToken` | string | No | For webhook verification |

**Identity**: Unique by `name` within a WhatsAppMultiAccount instance.

### MultiAccountConfig

Top-level configuration for the multi-account manager.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `accounts` | AccountConfig[] | Yes | At least one account |
| `apiVersion` | string | No | Shared base, default `v21.0` |
| `baseUrl` | string | No | Shared base, default `https://graph.facebook.com` |
| `logger` | Logger | No | Shared base logger |
| `rateLimitConfig` | RateLimitConfig | No | Shared base rate limit |
| `retryConfig` | RetryConfig | No | Shared base retry |
| `timeoutMs` | number | No | Shared base timeout |

## Type Unions

```
QualityRating     = 'GREEN' | 'YELLOW' | 'RED' | 'NA' | 'UNKNOWN'
CodeVerificationStatus = 'NOT_VERIFIED' | 'VERIFIED' | 'EXPIRED'
NameStatus        = 'APPROVED' | 'PENDING_REVIEW' | 'DECLINED' | 'EXPIRED' | 'NONE'
PlatformType      = 'CLOUD_API' | 'ON_PREMISE' | 'NOT_APPLICABLE'
ThroughputLevel   = 'STANDARD' | 'HIGH' | 'NOT_APPLICABLE'
AccountMode       = 'SANDBOX' | 'LIVE'
MessagingLimitTier = 'TIER_50' | 'TIER_250' | 'TIER_1K' | 'TIER_10K' | 'TIER_100K' | 'TIER_UNLIMITED'
CodeMethod        = 'SMS' | 'VOICE'
BusinessVertical  = 'UNDEFINED' | 'OTHER' | 'AUTO' | 'BEAUTY' | 'APPAREL' | 'EDU' | 'ENTERTAIN' | 'EVENT_PLAN' | 'FINANCE' | 'GROCERY' | 'GOVT' | 'HOTEL' | 'HEALTH' | 'NONPROFIT' | 'PROF_SERVICES' | 'RETAIL' | 'TRAVEL' | 'RESTAURANT' | 'NOT_A_BIZ'
```

## Response Types

### PhoneNumberListResponse

```
{
  data: PhoneNumber[]
  paging?: {
    cursors?: {
      before?: string
      after?: string
    }
  }
}
```

### PhoneNumberListParams

```
{
  fields?: string     // Comma-separated field names
  limit?: number      // Page size
  after?: string      // Forward cursor
  before?: string     // Backward cursor
}
```

### BusinessProfileResponse

```
{
  data: BusinessProfile[]    // Always single-element array from Meta API
}
```

### SuccessResponse

```
{
  success: boolean
}
```

Used by: register, deregister, requestVerificationCode, verifyCode, updateBusinessProfile.

## Relationships

```
WABA (businessAccountId) ──1:N──▶ PhoneNumber
PhoneNumber ──1:1──▶ BusinessProfile
MultiAccountConfig ──1:N──▶ AccountConfig
WhatsAppMultiAccount ──1:N──▶ WhatsApp (lazy, via AccountConfig)
```

## State Transitions

### Phone Number Lifecycle

```
[Added to WABA]
     │
     ▼
NOT_VERIFIED ──request_code──▶ [Code Sent] ──verify_code──▶ VERIFIED
     │                                                          │
     │                                                     register
     │                                                          │
     ▼                                                          ▼
  (unused)                                                 REGISTERED
                                                               │
                                                          deregister
                                                               │
                                                               ▼
                                                          DEREGISTERED
```

Note: The SDK does not track state — each operation is stateless. The platform enforces preconditions (e.g., cannot register without verification).
