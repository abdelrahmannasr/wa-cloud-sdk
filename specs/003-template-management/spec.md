# Feature Specification: Template Management

**Feature Branch**: `003-template-management`
**Created**: 2026-02-14
**Status**: Draft
**Input**: User description: "Phase 5: Templates Module — CRUD operations for message templates plus fluent TemplateBuilder"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - List and Retrieve Templates (Priority: P1)

A developer integrating the SDK needs to view their existing message templates to determine which ones are available before sending template messages. They list all templates for their WhatsApp Business Account, optionally filtering by status, and can retrieve templates by name.

**Why this priority**: Listing and retrieving templates is the foundational read operation. Developers need visibility into their templates before creating, updating, or deleting them. This is also the lowest-risk operation to implement first.

**Independent Test**: Can be fully tested by calling `list()` and `get()` against a mocked client and verifying correct API paths, query parameters, and response parsing. Delivers immediate value by giving developers template visibility.

**Acceptance Scenarios**:

1. **Given** a configured Templates instance with a valid business account ID, **When** the developer calls `list()`, **Then** the SDK returns a typed list of templates with their name, language, status, category, and components.
2. **Given** templates exist on the account, **When** the developer calls `list()` with pagination parameters (limit, cursor), **Then** the SDK passes those parameters to the API and returns the paginated response including cursor information for the next page.
3. **Given** a known template name, **When** the developer calls `get(templateName)`, **Then** the SDK returns the matching templates with their full details (all language variants).
4. **Given** a non-existent template name, **When** the developer calls `get(templateName)`, **Then** the SDK returns an empty list.

---

### User Story 2 - Create Templates via Builder (Priority: P1)

A developer needs to create new message templates on their WhatsApp Business Account. Rather than manually constructing the complex nested request payload, they use a fluent TemplateBuilder API to define the template's structure (header, body, footer, buttons) and submit it for Meta's review process.

**Why this priority**: Template creation is the core write operation and the TemplateBuilder is the primary developer-experience differentiator. Building templates manually requires constructing deeply nested JSON — the builder eliminates this friction.

**Independent Test**: Can be fully tested by chaining builder methods, calling `.build()`, and verifying the output matches the expected request shape. Separately, calling `create()` with a mocked client verifies the correct API endpoint and payload.

**Acceptance Scenarios**:

1. **Given** a TemplateBuilder instance, **When** the developer sets the name, language, category, and body text then calls `.build()`, **Then** the builder returns a valid creation request object.
2. **Given** a TemplateBuilder with all optional components (header, footer, buttons), **When** `.build()` is called, **Then** the output includes all components in the correct structure.
3. **Given** a valid creation request, **When** the developer calls `create(request)`, **Then** the SDK posts to the business account's template endpoint and returns the created template's ID and status.
4. **Given** a TemplateBuilder with missing required fields (no name or no category), **When** `.build()` is called, **Then** the builder throws a validation error identifying the missing field.
5. **Given** a TemplateBuilder, **When** the developer adds quick-reply buttons and URL buttons, **Then** the builder correctly structures button components with their types and payloads.

---

### User Story 3 - Update Existing Templates (Priority: P2)

A developer needs to modify an existing template that was rejected by Meta or needs content changes. They update specific components of the template and resubmit.

**Why this priority**: Updates are needed for iterating on templates after Meta review, but depend on the create and list operations being available first.

**Independent Test**: Can be fully tested by calling `update()` with a mocked client and verifying the correct API endpoint, method, and payload structure.

**Acceptance Scenarios**:

1. **Given** an existing template ID and an update payload, **When** the developer calls `update(templateId, updates)`, **Then** the SDK posts the updates to the template endpoint and returns the updated response.
2. **Given** an invalid template ID, **When** `update()` is called, **Then** the SDK throws an error from the platform.

---

### User Story 4 - Delete Templates (Priority: P2)

A developer needs to remove obsolete or rejected templates from their WhatsApp Business Account by name.

**Why this priority**: Deletion is necessary for account hygiene but is a less frequent operation than create/list.

**Independent Test**: Can be fully tested by calling `delete()` with a mocked client and verifying the correct API endpoint and query parameter.

**Acceptance Scenarios**:

1. **Given** a template name that exists on the account, **When** the developer calls `delete(templateName)`, **Then** the SDK sends a deletion request with the template name and returns a success confirmation.
2. **Given** a template name that does not exist, **When** `delete()` is called, **Then** the SDK throws an error with the platform's error details.

---

### Edge Cases

- What happens when listing templates on an account with zero templates? The SDK returns an empty list, not an error.
- What happens when a pagination cursor is expired or invalid? The SDK propagates the platform's error.
- What happens when the developer tries to build a template with a name containing invalid characters (spaces, uppercase)? The builder throws a validation error since Meta requires lowercase alphanumeric names with underscores only.
- What happens when the developer adds more buttons than Meta allows (max 3 quick-reply, 2 URL, or 1 phone-number button)? The builder throws a validation error.
- What happens when a template body exceeds the 1024-character limit? The builder throws a validation error.
- What happens when `businessAccountId` is not provided? The Templates constructor throws a validation error immediately.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: SDK MUST provide a Templates class that accepts a client and business account ID via constructor injection, consistent with the existing Messages and Media class patterns.
- **FR-002**: SDK MUST provide a `list()` operation to retrieve all templates for the business account, supporting optional pagination parameters (limit, cursor) and returning typed template objects.
- **FR-003**: SDK MUST provide a `get()` operation to retrieve templates by name, filtering the list endpoint since Meta does not expose a single-template GET endpoint.
- **FR-004**: SDK MUST provide a `create()` operation to submit a new template for Meta review, posting to the business account's template endpoint.
- **FR-005**: SDK MUST provide an `update()` operation to modify an existing template by posting updates to the template's endpoint.
- **FR-006**: SDK MUST provide a `delete()` operation to remove a template by name via the business account's template endpoint with the name as a query parameter.
- **FR-007**: SDK MUST provide a TemplateBuilder class with a fluent API for constructing template creation requests, supporting name, language, category, header, body, footer, and button configuration.
- **FR-008**: The TemplateBuilder's `build()` method MUST validate required fields (name, language, category, at least a body component) and throw a validation error for missing or invalid fields.
- **FR-009**: The TemplateBuilder MUST validate Meta's constraints: template name format (lowercase alphanumeric + underscores, max 512 characters), body text length (max 1024 characters), header text length (max 60 characters), footer text length (max 60 characters), and button count limits.
- **FR-010**: All Templates class methods MUST accept an optional request options parameter for timeout, signal, and header overrides, consistent with other SDK modules.
- **FR-011**: All Templates class methods MUST return typed response data wrapped in the SDK's standard response structure, consistent with other SDK modules.
- **FR-012**: The Templates constructor MUST throw a validation error if the business account ID is empty or not provided.

### Key Entities

- **Template**: A reusable message structure registered with Meta's platform, containing a name, language code, category, approval status, and component definitions (header, body, footer, buttons).
- **TemplateComponent**: A structural element within a template — header (text, image, video, document), body (text with variable placeholders), footer (text), or button (quick-reply, URL, phone-number).
- **TemplateButton**: An interactive element attached to a template — quick-reply buttons (up to 3) or call-to-action buttons such as URL (up to 2) or phone-number (up to 1), each with a type and text label.
- **CreateTemplateRequest**: The validated payload structure sent to the platform to register a new template, produced by the TemplateBuilder.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developers can perform all five template operations (list, get, create, update, delete) using the SDK without constructing raw API payloads.
- **SC-002**: Developers can build a complete template creation request using the fluent builder in 5 or fewer chained method calls for a standard template (name, language, category, body, one button).
- **SC-003**: All builder validation errors are caught before any network request is made, with clear error messages identifying the specific field and constraint violated.
- **SC-004**: The Templates module follows the same patterns as Messages and Media (constructor injection, standard response types, request options support), requiring zero additional learning for developers already using the SDK.
- **SC-005**: All template operations and builder methods are covered by unit tests meeting the project's 80% coverage threshold.

## Assumptions

- Template names follow Meta's documented format: lowercase letters, numbers, and underscores only (no spaces, no uppercase).
- Meta's current API version is used, consistent with the rest of the SDK's default configuration.
- The TemplateBuilder produces request payloads only — it does not call the API itself. Developers pass the built request to the `create()` method.
- Pagination for `list()` uses Meta's cursor-based pagination with `before`/`after` cursors and a `limit` parameter.
- The `update()` method submits component updates via POST to the template ID endpoint, per Meta's API design.
- Button type constraints follow Meta's current limits: up to 3 quick-reply buttons, up to 2 URL buttons, or up to 1 phone-number button per template.
