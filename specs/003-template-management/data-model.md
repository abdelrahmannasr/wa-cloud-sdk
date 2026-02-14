# Data Model: Template Management

**Feature**: 003-template-management
**Date**: 2026-02-14

## Entities

### Template (API response shape)

Represents a message template as returned by Meta's API.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | yes | Platform-assigned template ID (unique per language variant) |
| name | string | yes | Template name (lowercase alphanumeric + underscores) |
| language | string | yes | BCP 47 language code (e.g., `en_US`, `pt_BR`) |
| status | TemplateStatus | yes | Approval status |
| category | TemplateCategory | yes | Template category |
| components | TemplateComponentResponse[] | yes | Template structure (header, body, footer, buttons) |
| rejected_reason | string | no | Reason for rejection if status is REJECTED |
| quality_score | QualityScore | no | Template quality rating |

### TemplateCategory

Union type: `'MARKETING' | 'UTILITY' | 'AUTHENTICATION'`

### TemplateStatus

Union type: `'APPROVED' | 'PENDING' | 'REJECTED' | 'PAUSED' | 'DISABLED' | 'IN_APPEAL'`

### QualityScore

Union type: `'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN'`

### TemplateComponentResponse (API response shape)

A component as returned in template list/get responses.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | string | yes | `'HEADER'`, `'BODY'`, `'FOOTER'`, or `'BUTTONS'` |
| format | string | no | Header format: `'TEXT'`, `'IMAGE'`, `'VIDEO'`, `'DOCUMENT'` |
| text | string | no | Text content (for HEADER/BODY/FOOTER) |
| buttons | ButtonResponse[] | no | Button definitions (for BUTTONS component) |
| example | object | no | Example values for variables |

### ButtonResponse (API response shape)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | string | yes | `'QUICK_REPLY'`, `'URL'`, `'PHONE_NUMBER'`, `'COPY_CODE'`, `'OTP'` |
| text | string | yes | Button display text (max 20 chars) |
| url | string | no | URL for URL-type buttons |
| phone_number | string | no | Phone number for PHONE_NUMBER-type buttons |

---

### CreateTemplateRequest (builder output / API request shape)

The payload structure for `POST /{waba_id}/message_templates`.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | yes | Template name (lowercase alphanumeric + underscores, max 512) |
| language | string | yes | BCP 47 language code |
| category | TemplateCategory | yes | Template category |
| allow_category_change | boolean | no | Allow Meta to reclassify category |
| components | CreateTemplateComponent[] | yes | Template components (at least body required) |

### CreateTemplateComponent (API request shape)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | string | yes | `'HEADER'`, `'BODY'`, `'FOOTER'`, or `'BUTTONS'` |
| format | string | no | Header format: `'TEXT'`, `'IMAGE'`, `'VIDEO'`, `'DOCUMENT'` |
| text | string | no | Text content (for text-based components) |
| buttons | CreateTemplateButton[] | no | Button definitions (for BUTTONS component) |
| example | object | no | Example values for variable placeholders |

### CreateTemplateButton (API request shape)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | string | yes | `'QUICK_REPLY'`, `'URL'`, `'PHONE_NUMBER'` |
| text | string | yes | Button display text (max 20 chars) |
| url | string | no | URL (required for URL buttons, supports `{{1}}` variable) |
| phone_number | string | no | Phone number (required for PHONE_NUMBER buttons) |

---

### CreateTemplateResponse (API response shape)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | yes | Created template's platform ID |
| status | TemplateStatus | yes | Initial status (typically `PENDING`) |
| category | TemplateCategory | yes | Assigned category (may differ if reclassified) |

### TemplateDeleteResponse (API response shape)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| success | boolean | yes | True if deletion succeeded |

---

### TemplateListParams (SDK query parameters)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| limit | number | no | Number of templates per page |
| after | string | no | Cursor for next page |
| before | string | no | Cursor for previous page |
| status | TemplateStatus | no | Filter by template status |
| name | string | no | Filter by template name |
| fields | string[] | no | Specific fields to return |

### TemplateListResponse (API response shape)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| data | Template[] | yes | Array of templates |
| paging | PagingInfo | no | Pagination cursors |

### PagingInfo

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| cursors | { before?: string; after?: string } | no | Pagination cursors |
| next | string | no | URL for next page |
| previous | string | no | URL for previous page |

## Validation Constraints

| Constraint | Value | Applied At |
|------------|-------|------------|
| Template name pattern | `^[a-z0-9_]{1,512}$` | Builder (client-side) |
| Body text max length | 1024 characters | Builder (client-side) |
| Header text max length | 60 characters | Builder (client-side) |
| Footer text max length | 60 characters | Builder (client-side) |
| Button text max length | 20 characters | Builder (client-side) |
| Max quick-reply buttons | 3 | Builder (client-side) |
| Max URL buttons | 2 | Builder (client-side) |
| Max phone-number buttons | 1 | Builder (client-side) |
| Category values | MARKETING, UTILITY, AUTHENTICATION | Builder (client-side) |
| Category-content alignment | Server-determined | Meta API (server-side) |
| Edit frequency limits | 1/24h, 10/30d | Meta API (server-side) |
