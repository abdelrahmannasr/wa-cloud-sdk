# Research: Template Management

**Feature**: 003-template-management
**Date**: 2026-02-14

## Decision Log

### D1: Templates class uses businessAccountId, not phoneNumberId

- **Decision**: The `Templates` constructor accepts `(client: HttpClient, businessAccountId: string)` — different from Messages/Media which use `phoneNumberId`.
- **Rationale**: All template CRUD endpoints operate on `/{waba_id}/message_templates`, not `/{phone_number_id}/...`. The `businessAccountId` field already exists in `WhatsAppConfig`.
- **Alternatives considered**: Using phoneNumberId + a separate wabaId param — rejected because the WABA ID is the sole identifier for all template operations.

### D2: No dedicated GET-by-ID endpoint — use list with filters

- **Decision**: `get(templateName, options?)` lists templates filtered by name and optionally by language, rather than fetching by template ID.
- **Rationale**: Meta's API does not expose a dedicated `GET /{template_id}` endpoint for retrieving a single template. The only way to retrieve template details is via `GET /{waba_id}/message_templates` with `name` filter. Each language variant has its own ID, but there's no single-template endpoint.
- **Alternatives considered**: `get(templateId)` hitting `GET /{template_id}` — rejected because this endpoint doesn't exist in Meta's documented API.

### D3: Delete by name removes all language variants

- **Decision**: `delete(templateName)` deletes the template and all its language variants. To delete a specific language variant, `delete(templateName, { hsmId })` uses the `hsm_id` query parameter.
- **Rationale**: Meta's `DELETE /{waba_id}/message_templates?name={name}` deletes all variants. Adding optional `hsm_id` param gives fine-grained control.
- **Alternatives considered**: Separate methods for name-delete vs ID-delete — rejected to keep API surface minimal.

### D4: Builder validates only client-side constraints

- **Decision**: `TemplateBuilder` validates name format, text lengths, button counts, and required fields. It does NOT validate category-content alignment (Meta does that server-side).
- **Rationale**: Category-content validation requires AI/ML on Meta's side. Client-side validation catches obvious errors before making a network request, reducing API round-trips.
- **Alternatives considered**: No client-side validation — rejected because it leads to unnecessary API calls for clearly invalid inputs.

### D5: Button count limits follow Meta's current documented constraints

- **Decision**: Max 3 quick-reply buttons, max 2 URL buttons, max 1 phone-number button per template. Authentication templates support 1 copy-code or 1 OTP button.
- **Rationale**: Meta's documentation consistently states these limits. Some sources mention up to 10 quick-reply buttons, but 3 is the standard documented limit for template creation.
- **Alternatives considered**: Supporting up to 10 quick-reply — deferred; can be adjusted if Meta's API accepts more.

### D6: Template categories are MARKETING, UTILITY, AUTHENTICATION

- **Decision**: `TemplateCategory` type is `'MARKETING' | 'UTILITY' | 'AUTHENTICATION'`.
- **Rationale**: These are the only three categories documented by Meta. The `allow_category_change` field lets Meta reclassify if needed.
- **Alternatives considered**: Making it a free-form string — rejected because known categories enable client-side validation.

### D7: Template statuses for the response type

- **Decision**: `TemplateStatus` includes: `APPROVED`, `PENDING`, `REJECTED`, `PAUSED`, `DISABLED`, `IN_APPEAL`.
- **Rationale**: These are the documented status values from Meta's API. Quality sub-states (e.g., "Active - Medium Quality") are conveyed via a separate `quality_score` field, not the status field.
- **Alternatives considered**: Only including the 3 basic statuses — rejected because PAUSED/DISABLED are operationally significant.

### D8: Pagination uses Meta's cursor-based model

- **Decision**: `list()` accepts `TemplateListParams` with `limit`, `after`, `before`, `status`, `name`, and `fields` parameters. Response includes `paging` object with cursors.
- **Rationale**: Meta's Graph API uses cursor-based pagination across all endpoints. The SDK should pass through these params naturally.
- **Alternatives considered**: Iterator/async-generator pagination — deferred to a future enhancement; raw cursor passthrough is simpler and more predictable.

### D9: Update endpoint uses POST to template ID

- **Decision**: `update(templateId, components, requestOptions?)` posts updated components to `POST /{template_id}`.
- **Rationale**: Meta's API accepts component updates via POST to the template's language-variant ID. Updates are limited (1 per 24 hours, 10 per 30 days) but these are server-side enforced.
- **Alternatives considered**: Accepting full template object for update — rejected because only components can be updated per Meta's API.

### D10: Authentication template special handling deferred

- **Decision**: The builder supports authentication templates via standard category + component methods but does NOT enforce authentication-specific constraints (mandatory OTP button, no URLs/media/emojis).
- **Rationale**: Authentication template rules are complex and evolving. Over-constraining the builder risks rejecting valid templates as Meta changes rules. Meta's server-side validation catches these.
- **Alternatives considered**: Dedicated `buildAuthTemplate()` method — deferred to a future enhancement if developer demand warrants it.
