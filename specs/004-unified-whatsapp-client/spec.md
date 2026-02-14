# Feature Specification: Unified WhatsApp Client

**Feature Branch**: `004-unified-whatsapp-client`
**Created**: 2026-02-14
**Status**: Draft
**Input**: User description: "Unified WhatsApp client class that wires all SDK modules under a single entry point"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Single Entry Point Setup (Priority: P1)

A developer integrating the WhatsApp Cloud API wants to get started with minimal boilerplate. Instead of importing and wiring multiple classes manually, they create a single SDK instance with one configuration object and immediately access all messaging, media, and template capabilities through that instance.

**Why this priority**: This is the core value proposition — reducing setup friction from 4+ class imports and manual wiring to a single constructor call. It directly addresses the primary developer experience gap in the current SDK.

**Independent Test**: Can be fully tested by constructing a single SDK instance with valid configuration and verifying that the core module accessors (messages, media, templates, and client) are available and functional. Delivers immediate value by simplifying every integration. Webhook support is validated independently in User Story 2.

**Acceptance Scenarios**:

1. **Given** a developer has valid API credentials (access token, phone number ID), **When** they create a new SDK instance with those credentials, **Then** they can immediately send a text message through the messages accessor without any additional setup.
2. **Given** a developer has valid API credentials including a business account ID, **When** they create a new SDK instance, **Then** they can access messages, media, and templates through dedicated accessors on the same instance.
3. **Given** a developer creates an SDK instance without a business account ID, **When** they attempt to access the templates accessor, **Then** they receive a clear, actionable error explaining that the business account ID is required for template operations.

---

### User Story 2 - Webhook Handling Through Unified Client (Priority: P2)

A developer receiving inbound WhatsApp messages and status updates wants to set up webhook handling through the same SDK instance they use for sending. They configure webhook verification and event handling without importing separate webhook modules.

**Why this priority**: Webhook handling is essential for bidirectional communication, which most production integrations require. Offering it through the unified client completes the "single import" developer experience.

**Independent Test**: Can be tested by creating an SDK instance with webhook configuration (app secret, verify token) and verifying that signature verification and event parsing work through the instance's webhook accessor.

**Acceptance Scenarios**:

1. **Given** a developer creates an SDK instance with app secret and webhook verify token, **When** they access the webhook accessor, **Then** they can verify webhook signatures and parse incoming events.
2. **Given** a developer creates an SDK instance without webhook configuration (no app secret), **When** they attempt to use the webhook accessor for signature verification, **Then** they receive a clear error explaining that app secret is required.
3. **Given** a developer uses the unified client's webhook accessor, **When** they register typed event callbacks, **Then** they receive properly parsed and typed message and status events.

---

### User Story 3 - Gradual Migration from Direct Imports (Priority: P3)

An existing SDK user who already uses the direct-import pattern (manually creating HttpClient, Messages, Media, Templates) wants to migrate to the unified client incrementally. The unified client does not break their existing code, and they can adopt it module by module.

**Why this priority**: Backwards compatibility protects existing users. The unified client is an additive convenience layer, not a replacement for the existing module-level API.

**Independent Test**: Can be tested by verifying that all existing public exports remain available and unchanged, and that both the direct-import and unified-client patterns can coexist in the same project.

**Acceptance Scenarios**:

1. **Given** an existing project uses the direct-import pattern, **When** the SDK is updated to include the unified client, **Then** all existing imports and code continue to work without modification.
2. **Given** a developer uses both the unified client and direct imports in the same project, **When** they run their application, **Then** both patterns function correctly without conflicts.

---

### Edge Cases

- What happens when configuration is missing required fields (e.g., no access token or no phone number ID)? The SDK must throw a clear validation error at construction time.
- What happens when a developer accesses a module that requires optional configuration not provided (e.g., templates without business account ID, webhooks without app secret)? The SDK must throw a descriptive error at the point of access, not at construction.
- What happens when the developer passes an invalid API version or base URL? Existing validation in the HTTP client handles this; the unified client delegates without adding duplicate validation.
- How does the SDK behave when the same instance is used concurrently from multiple async operations? The shared HTTP client's existing rate limiter and retry logic apply uniformly, ensuring thread-safe concurrent usage.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The SDK MUST provide a single entry-point class that accepts one configuration object containing all credentials and settings needed for WhatsApp Cloud API integration.
- **FR-002**: The entry-point class MUST expose a messages accessor that provides all message-sending capabilities (text, image, video, audio, document, sticker, location, contacts, reactions, interactive messages, and template messages).
- **FR-003**: The entry-point class MUST expose a media accessor that provides all media operations (upload, get URL, download, delete).
- **FR-004**: The entry-point class MUST expose a templates accessor that provides all template management operations (list, get, create, update, delete). The TemplateBuilder remains available as an independent import (it has no dependencies on the unified client).
- **FR-005**: The entry-point class MUST expose a webhooks accessor that provides webhook signature verification, event parsing, and handler registration.
- **FR-006**: The entry-point class MUST validate that required configuration fields (access token, phone number ID) are present at construction time and provide clear error messages for missing fields.
- **FR-007**: When optional configuration is missing for a specific module (e.g., business account ID for templates, app secret for webhook verification), the SDK MUST defer the error to the point of use and provide an actionable error message explaining which configuration field is needed.
- **FR-008**: All existing public exports (HttpClient, Messages, Media, Templates, webhook functions, error classes, utilities) MUST remain available and unchanged for backwards compatibility.
- **FR-009**: The entry-point class MUST share a single internal HTTP client instance across all module accessors to ensure consistent configuration (rate limiting, retry, timeouts, authentication).
- **FR-010**: The entry-point class MUST allow developers to access the underlying HTTP client for advanced use cases (custom API calls, debugging).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer can go from zero to sending their first WhatsApp message in under 5 lines of code (import, construct, send).
- **SC-002**: All existing SDK tests continue to pass without modification after the unified client is added.
- **SC-003**: The unified client introduces zero additional runtime dependencies.
- **SC-004**: Test coverage for the unified client meets or exceeds the project minimum of 80% on lines, functions, branches, and statements.
- **SC-005**: 100% of existing module functionality is accessible through the unified client's accessors.

## Assumptions

- The existing configuration interface already contains all fields needed for the unified client (access token, phone number ID, business account ID, API version, base URL, logger, rate limit config, retry config, timeout, app secret, webhook verify token). No new configuration fields are required.
- Module accessors (messages, media, templates, webhooks) are initialized lazily or eagerly at construction time — the implementation will determine the optimal approach based on performance and error-handling trade-offs.
- The unified client is a convenience layer only — it does not add new API capabilities beyond what the individual modules already provide.
- The phone number ID is always required because Messages and Media (the core modules) depend on it. Templates require the separate business account ID.

## Scope Boundaries

### In Scope

- The unified entry-point class
- Module accessors for messages, media, templates, and webhooks
- Configuration validation at construction time
- Clear error messages for missing optional configuration at point of use
- Full backwards compatibility with existing exports
- Comprehensive unit tests

### Out of Scope

- Multi-account management (reserved for a future phase)
- New API capabilities not already provided by existing modules
- Breaking changes to existing public APIs
- Runtime dependency additions
