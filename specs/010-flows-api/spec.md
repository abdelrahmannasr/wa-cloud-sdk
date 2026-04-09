# Feature Specification: WhatsApp Flows API

**Feature Branch**: `010-flows-api`
**Created**: 2026-04-09
**Status**: Draft
**Input**: User description: "WhatsApp Flows API: send flow messages, Flows CRUD module, and flow completion webhook events (full v0.3.0 scope as described in /Users/amn/Documents/Projects/SDK/technical-plans/wa-cloud-sdk-plans/010-flows-api-plan.md)"

## Clarifications

### Session 2026-04-09

- Q: Who is responsible for deduplicating flow completion webhooks that may be delivered more than once by the platform's at-least-once retry behavior? → A: Consumer responsibility. The SDK exposes the message identifier on every flow completion event for external deduplication, does not maintain any internal deduplication state, and documents at-least-once delivery as an expected behavior. Consumers implement idempotency in their own persistence layer (database, cache, etc.).
- Q: How should the SDK handle flow response payloads (which may contain PII or regulated data) in its own logging output? → A: Never log flow response data. The SDK must not pass the raw response string or the parsed response object to its configured logger at any level, including debug. Consumers who want to log response data do so explicitly from their own handler after making an informed decision about their data's sensitivity.
- Q: Which flow message protocol version should the SDK send, and can consumers override it per call? → A: Pinned default with per-call override. The SDK ships with a single pinned default version (currently "3") that is sent on every flow message unless the consumer provides an explicit per-call override. Changing the pinned default is a deliberate SDK release decision; consumers who need to test or adopt a newer version sooner can pass the version explicitly on each call without waiting for an SDK update.
- Q: Is sending flows through the existing multi-account broadcast API an explicit, documented, and tested use case for this release, or is it out of scope? → A: First-class support. Multi-account broadcast with flows is explicitly in scope — documented, tested with at least one scenario, and supported by a runnable example. No new API surface is needed since the broadcast factory is already generic. The spec also documents the constraint that a flow identifier is scoped to a single business account, so each account must have its own flow identifier for the same conceptual flow when broadcasting.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Send a Flow to a User (Priority: P1)

As an SDK consumer building a conversational experience (lead capture, appointment booking, sign-up, survey, support intake), I need a first-class way to deliver an existing WhatsApp Flow to a user during a conversation so that the user can fill out a structured multi-screen form inside WhatsApp instead of being redirected to a web form.

**Why this priority**: Sending flows is the entry point of the entire feature. Without it, nothing else matters — a consumer who cannot deliver a flow to a user gains zero value even if every other capability exists. This is also the highest-volume operation: consumers typically send many flows per authored flow.

**Independent Test**: Can be fully tested in isolation by sending a flow message for an existing published flow to a test number and observing that the recipient receives an interactive flow invitation with the correct call-to-action, header, body, and footer.

**Acceptance Scenarios**:

1. **Given** a consumer has the identifier of a published flow, **When** they send a flow message to a recipient with a body, a call-to-action label, and the flow identifier, **Then** the recipient receives an interactive flow invitation in WhatsApp and the consumer receives a delivery confirmation identifying the sent message.

2. **Given** a consumer wants to test an unpublished flow before launch, **When** they send the flow in draft mode, **Then** the flow is delivered for testing purposes without requiring the flow to be published.

3. **Given** a consumer wants to pass initial context data to the flow (e.g., a pre-filled name or a starting screen), **When** they send the flow with an initial screen and initial data, **Then** the flow opens on the specified screen with the provided data available to the flow definition.

4. **Given** a consumer wants to correlate a flow send with the eventual user submission, **When** they attach a correlation token to the send request, **Then** the token is transmitted with the flow so the consumer can later match the response to the original send (with the known limitation that the token is only echoed back if the flow's terminal screen or endpoint explicitly returns it).

5. **Given** a consumer is replying to an earlier message from the user, **When** they send a flow as a quoted reply, **Then** the flow invitation appears in the recipient's chat as a reply to the quoted message, preserving conversation threading.

6. **Given** a consumer wants to add visual or textual context around the flow invitation, **When** they include an optional header (text, image, video, or document) and an optional footer, **Then** both are displayed alongside the flow call-to-action.

7. **Given** a consumer is operating a multi-account platform and wants to send the same conceptual flow to a set of recipients distributed across accounts, **When** they use the existing multi-account broadcast API with a factory function that calls the flow send for each (account, recipient) pair, **Then** each recipient receives the flow from the correct account, subject to the constraint that each account must have its own flow identifier for the conceptual flow because flow identifiers are scoped to a single business account.

---

### User Story 2 - Receive a Flow Completion Response (Priority: P2)

As an SDK consumer who has sent a flow to a user, I need to receive the user's completed form submission as a typed, dedicated webhook event so that I can act on the data without writing custom parsing logic or distinguishing flow responses from other interactive replies.

**Why this priority**: Sending flows without receiving their responses is a half-feature. Consumers need the round-trip to capture leads, bookings, survey answers, and so on. This is P2 because a consumer can still use P1 for awareness flows that do not require capturing structured data (e.g., a purely informational flow), but the vast majority of real-world uses require the response.

**Independent Test**: Can be fully tested by simulating an incoming webhook payload containing a flow submission and verifying that the SDK surfaces a dedicated flow completion event with the parsed form data, without the same payload being mistakenly routed to the general message event handler.

**Acceptance Scenarios**:

1. **Given** a user has completed and submitted a flow, **When** the webhook delivers the response to the consumer's system, **Then** the consumer receives a dedicated flow completion event distinct from regular message events, containing the sender's contact information, the message identifier, the timestamp, and the submitted form data.

2. **Given** a consumer has registered a callback for flow completions, **When** a flow completion webhook arrives, **Then** only the flow completion callback is invoked — the general message callback is not also invoked for the same event, avoiding double-handling.

3. **Given** a flow submission contains structured form data, **When** the consumer inspects the event, **Then** the form data is available both as a parsed object (for immediate use) and as the original raw string (for consumers who need to verify signatures, store the exact payload, or parse it themselves).

4. **Given** a flow submission contains malformed or unexpected structured data, **When** the webhook is parsed, **Then** the consumer still receives the event with the raw data intact, and the parsed object is an empty object rather than throwing an error that halts webhook processing.

5. **Given** the user replies to a button or a list (non-flow interactive types), **When** the webhook is parsed, **Then** the existing general message event handler continues to receive these as regular message events — flow handling does not interfere with existing button reply and list reply behaviors.

---

### User Story 3 - Create and Publish a New Flow (Priority: P3)

As an SDK consumer building a platform that programmatically manages flow content (e.g., a marketing automation tool, a no-code flow designer, or a CI/CD pipeline for flow updates), I need to create new flows and publish them from code so that flow authoring does not require manual steps inside Meta's business tools.

**Why this priority**: Programmatic flow creation unlocks automation but is not strictly required to use flows — a consumer can author flows manually in Meta's web tools and only use P1/P2 to send and receive them. This is still high-value for platform builders and teams that need version-controlled, reproducible flow definitions.

**Independent Test**: Can be fully tested by creating a new flow with a name, categories, and a flow definition, then publishing it, and verifying that the flow appears in the account's list of flows with the correct status transition from draft to published.

**Acceptance Scenarios**:

1. **Given** a consumer has a flow definition prepared, **When** they create a flow with a name, one or more categories, and the flow definition, **Then** the flow is created in draft status and the consumer receives the new flow's identifier along with any validation errors reported by the platform.

2. **Given** a consumer has prepared their flow definition as a structured object in their application code, **When** they submit it to the SDK, **Then** they do not need to manually serialize it to a string — the SDK handles serialization on their behalf.

3. **Given** a consumer has a draft flow that has passed validation, **When** they publish the flow, **Then** the flow transitions from draft to published status and becomes available for sending to users in published mode.

4. **Given** a consumer attempts to create a flow but the platform reports validation errors in the flow definition, **When** the response returns, **Then** the consumer receives the structured validation errors (error type, message, and location information where applicable) so they can correct the definition.

5. **Given** a consumer needs to update the flow definition of an existing flow, **When** they upload a revised flow definition, **Then** the asset is replaced and the consumer receives confirmation along with any new validation errors.

---

### User Story 4 - Administer the Flow Lifecycle (Priority: P4)

As an SDK consumer operating a production integration with many flows, I need complete lifecycle management — listing, inspecting, updating metadata, previewing, deprecating, and deleting flows — so that I can audit, maintain, and retire flows without manual intervention in Meta's business tools.

**Why this priority**: Administrative operations support the long tail of flow management but are needed less frequently than P1/P2/P3. A consumer can go to production with just sending, receiving, and creating flows — administration becomes important once the flow catalog grows or governance requirements arise.

**Independent Test**: Can be fully tested by listing existing flows, selecting one, updating its name and categories, generating a preview URL for stakeholder review, deprecating it, and (for a draft flow) deleting it, verifying that each operation succeeds and is reflected in subsequent list queries.

**Acceptance Scenarios**:

1. **Given** a consumer wants to audit their flows, **When** they list flows with pagination parameters, **Then** they receive the set of flows in the account with identifying metadata (name, status, categories) and pagination cursors for subsequent pages.

2. **Given** a consumer needs detailed information about a specific flow, **When** they fetch the flow by identifier, **Then** they receive the complete flow record including status, categories, validation errors (if any), and associated metadata.

3. **Given** a consumer wants to rename a flow or change its categories, **When** they submit a metadata update, **Then** the name and categories are changed without affecting the flow definition or status.

4. **Given** a consumer wants to share a flow with a non-technical stakeholder for review, **When** they request a preview for the flow, **Then** they receive a temporary preview URL that can be opened in a browser to interact with the flow, along with the URL's expiration time.

5. **Given** a consumer wants to retire a flow that should no longer be sent to new users, **When** they deprecate the flow, **Then** the flow transitions to deprecated status and the consumer cannot send it to new recipients, while any flows already in progress with existing recipients continue to function.

6. **Given** a consumer wants to delete a draft flow that will never be published, **When** they delete the flow, **Then** the flow is removed and no longer appears in subsequent list queries.

7. **Given** a consumer's application does not have a business account identifier configured, **When** they attempt any flow administration operation, **Then** they receive a clear, actionable error at the point of first use indicating that a business account identifier is required, while unrelated send operations continue to work.

---

### Edge Cases

- What happens when a consumer tries to send a flow in published mode but the flow is still in draft status? The underlying platform rejects the send and the SDK surfaces the rejection as a typed error so the consumer can respond (e.g., fall back to draft mode or prompt the author to publish).
- What happens when a consumer tries to delete a published flow? The platform only permits deletion of draft flows. The SDK surfaces the platform's rejection as a typed error.
- What happens when a flow is in a throttled or blocked health state? Sends may be rate-limited or rejected; these are surfaced to the consumer through the standard error-handling path and are not special-cased.
- What happens when a correlation token is attached to a flow send but the flow's terminal screen does not echo it back? The consumer receives the flow completion event with no correlation token — the SDK documents this as a known platform limitation and the consumer must implement alternative correlation (e.g., matching on the recipient phone number plus a time window).
- What happens when the flow submission webhook arrives with a form payload that cannot be parsed? The consumer still receives the flow completion event with the raw string intact and an empty parsed object; webhook processing does not halt.
- What happens when the same flow completion event is delivered more than once due to the platform's at-least-once retry behavior (e.g., the consumer's handler timed out or returned an error on a previous attempt)? The SDK delivers each attempt as a separate flow completion event, exposes the stable message identifier on every event, and does not maintain any internal deduplication state. Consumers are responsible for implementing idempotency in their own persistence layer using the message identifier as the dedup key.
- What happens when a consumer imports only the flows functionality via a dedicated subpath? The import resolves and exposes all flow-related classes, types, and constants without pulling in unrelated modules, consistent with the existing subpath export behavior for other SDK modules.
- What happens when the underlying platform's validation of a flow definition reports errors? The SDK surfaces the structured validation errors (type, message, and location where available) rather than a generic failure, so consumers can correct their definitions.
- What happens when a consumer tries to use the same flow identifier across multiple accounts in a multi-account broadcast? A flow identifier is scoped to a single business account, so passing the same identifier to a different account's send will fail. Consumers operating multi-account platforms must maintain a mapping from conceptual flow name to per-account flow identifier and look up the correct identifier inside the broadcast factory function.

## Requirements *(mandatory)*

### Functional Requirements

**Sending flows (P1)**

- **FR-001**: The system MUST allow consumers to send a flow message to a recipient, specifying the recipient, the flow identifier, a body text, and a call-to-action label.
- **FR-002**: The system MUST support sending flows in either draft mode or published mode. The SDK MUST NOT emit the mode field on the wire unless the consumer explicitly sets it, letting the underlying platform apply its server-side default (published). Consumers who want draft-mode testing opt in explicitly.
- **FR-002a**: The system MUST ship with a single pinned default for the flow message protocol version that is used on every flow send unless the consumer provides an explicit per-call override. Changing the pinned default is a deliberate SDK release decision; consumers who need to adopt a different version sooner can pass the version explicitly on each call.
- **FR-002b**: The system MUST NOT emit the flow action field on the wire unless the consumer explicitly sets it. This preserves the platform's contract that the flow action payload (initial screen) is required when navigate action is used, and prevents the SDK from producing invalid minimal-call payloads that the platform would reject. Consumers who need navigate behavior supply both the action and the action payload together; consumers who need data-exchange behavior supply the action alone.
- **FR-003**: The system MUST allow consumers to optionally attach an initial screen and initial data to the flow send, enabling the flow to start on a specific screen with pre-populated context.
- **FR-004**: The system MUST allow consumers to optionally attach a correlation token to the flow send, with documented guidance that the token is only returned in the flow completion response if the flow definition explicitly preserves it.
- **FR-005**: The system MUST support optional header content (text, image, video, or document) and optional footer text on the flow invitation.
- **FR-006**: The system MUST support sending a flow as a quoted reply to an earlier message, preserving conversation threading.
- **FR-007**: The system MUST validate the recipient phone number before attempting to send the flow, failing early with a validation error if the number is invalid.
- **FR-007a**: The system MUST support sending flows through the existing multi-account broadcast API without requiring any new API surface, must include at least one automated test exercising broadcast-with-flows, and must ship a runnable example demonstrating the pattern. The system MUST document in consumer-facing guidance that flow identifiers are scoped to a single business account and that consumers operating multi-account platforms must maintain a mapping from conceptual flow name to per-account flow identifier.

**Receiving flow completions (P2)**

- **FR-008**: The system MUST expose flow completion submissions as a dedicated event type distinct from regular message events.
- **FR-009**: The system MUST allow consumers to register a dedicated callback for flow completion events.
- **FR-010**: The system MUST route a flow completion webhook to the flow completion callback only, and MUST NOT also route the same payload to the general message callback.
- **FR-011**: The system MUST continue to route button reply and list reply webhooks through the existing general message callback, unchanged by this feature.
- **FR-012**: Each flow completion event MUST include the sender's contact information, the message identifier, the event timestamp, the raw submitted data as a string, and the parsed submitted data as a structured object.
- **FR-013**: The system MUST gracefully handle flow submissions whose raw data cannot be parsed, delivering the event with the raw string intact and an empty parsed object rather than throwing or dropping the event.

**Flow creation and lifecycle (P3, P4)**

- **FR-014**: The system MUST allow consumers to create a new flow by providing a name, one or more categories, and a flow definition, and MUST return the new flow's identifier along with any validation errors reported by the platform.
- **FR-015**: The system MUST accept a flow definition as either a pre-serialized string or a structured object, handling any required serialization internally.
- **FR-016**: The system MUST allow consumers to list flows in an account with pagination support, returning flow metadata and pagination cursors.
- **FR-017**: The system MUST allow consumers to retrieve a single flow by its identifier, returning its full details.
- **FR-018**: The system MUST allow consumers to update flow metadata (name, categories, endpoint, application identifier) without replacing the flow definition.
- **FR-019**: The system MUST allow consumers to replace the flow definition of an existing flow as a separate operation from updating metadata.
- **FR-020**: The system MUST allow consumers to publish a draft flow, transitioning it to published status.
- **FR-021**: The system MUST allow consumers to deprecate a published flow, transitioning it to deprecated status.
- **FR-022**: The system MUST allow consumers to delete a flow, with the platform's restriction that only draft flows can be deleted surfaced as a typed error when the restriction is violated.
- **FR-023**: The system MUST allow consumers to retrieve a temporary preview URL for a flow, along with its expiration time.
- **FR-024**: The system MUST return structured validation errors (error type, message, and location where available) rather than generic failures when the platform rejects a flow definition.

**Integration and ergonomics**

- **FR-025**: The system MUST expose flow administration operations through the unified SDK client with the same lazy-initialization ergonomics already used for other account-scoped modules (template management), throwing a clear, actionable error at the point of first use if the required business account identifier is not configured.
- **FR-026**: The system MUST provide a dedicated import path for flow functionality so that consumers can import only flow capabilities without pulling in unrelated modules, consistent with the existing subpath export convention.
- **FR-027**: The system MUST expose all flow-related public types (event shapes, request/response shapes, status and category enumerations, validation error shapes) so that consumers using type checking get full autocompletion and type safety.
- **FR-028**: The system MUST preserve all existing public behaviors — existing message sending, webhook parsing, template management, and other modules MUST continue to work identically with no consumer code changes required.
- **FR-029**: The system MUST maintain zero runtime dependencies after all changes.
- **FR-030**: The system MUST NOT emit flow response payloads (raw submitted string or parsed submitted object) to the SDK's configured logger at any log level, including debug. Logging of response data is the consumer's explicit responsibility and must be initiated from the consumer's own handler code.

### Key Entities *(include if feature involves data)*

- **Flow**: A multi-screen interactive form defined by the consumer and hosted by the platform. It has an identifier, a name, one or more categories (e.g., sign-up, appointment booking, survey, lead generation), a status (draft, published, deprecated, blocked, throttled), an optional endpoint for backend data exchange, an optional preview URL, and a set of validation errors if the platform rejected the definition.

- **Flow Message**: An interactive invitation sent to a recipient that, when tapped, opens a specific flow. It references a flow by identifier, carries a body and a call-to-action label, optionally includes a header and footer, can start the flow on a specific screen with initial data, can carry a correlation token, and can be sent as a quoted reply.

- **Flow Completion Event**: A webhook event emitted when a user submits a flow. It contains the sender's contact information, the message identifier, the event timestamp, the raw submitted data as a string, and the parsed submitted data as a structured object. It is distinct from regular message events.

- **Flow Category**: A classification of a flow's business purpose. Valid values correspond to the platform's published set (sign-up, sign-in, appointment booking, lead generation, contact us, customer support, survey, other).

- **Flow Status**: A lifecycle state of a flow. Valid values are draft (editable and unpublished), published (sendable to users), deprecated (no longer sendable to new users), blocked (suspended due to critical issues), and throttled (rate-limited due to health issues).

- **Flow Validation Error**: A structured error reported by the platform when a flow definition fails validation. It includes an error type, a human-readable message, and optional location information (line and column ranges) indicating where in the definition the error occurred.

- **Flow Preview**: A temporary URL that allows interactive inspection of a flow in a browser, along with its expiration timestamp. Intended for stakeholder review of draft flows before publishing.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A consumer can send a flow to a recipient and receive a delivery confirmation in a single method call without composing the underlying message payload by hand.
- **SC-002**: A consumer can deliver the same flow in both draft and published modes by changing a single parameter, enabling the same code path for staging and production.
- **SC-003**: A consumer receives flow submissions as a typed, dedicated event without writing custom logic to distinguish them from button replies, list replies, or text messages.
- **SC-004**: A consumer can read the submitted form data of a flow response as a parsed structured object without manually parsing any strings.
- **SC-005**: A consumer can recover the exact raw submitted data from a flow response for use cases that require exact byte preservation (logging, signature verification, custom parsing).
- **SC-006**: A consumer whose flow response has malformed submitted data still receives the event and can process it; webhook handling does not halt on malformed payloads.
- **SC-007**: A consumer can create a flow, publish it, send it, receive its response, and deprecate it without using Meta's web-based business tools — the full lifecycle is automatable from code.
- **SC-008**: A consumer can supply a flow definition as either a string or a structured object without writing their own serialization code.
- **SC-009**: A consumer receives structured validation errors from the platform (type, message, and location) when a flow definition fails validation, enabling them to display actionable feedback in their own tools.
- **SC-010**: A consumer can import only the flow functionality via a dedicated import path without pulling in unrelated SDK modules.
- **SC-011**: A consumer whose application does not configure a business account identifier can still send flows (which only require a phone number identifier), and receives a clear error only if and when they attempt a flow administration operation that requires the business account identifier.
- **SC-012**: All pre-existing SDK behaviors continue to work identically — consumers who do not use flows observe no change in behavior, no required code changes, and no new runtime dependencies.
- **SC-013**: The SDK retains zero runtime dependencies after all changes.
- **SC-014**: All new flow capabilities are covered by automated tests, including the send path, the webhook parsing path, the lifecycle administration operations, the unified client integration, and the dedicated subpath import resolution.
- **SC-015**: A consumer can inspect the SDK's logger output (at any level, including debug) and will never find flow response payload contents there — the SDK never emits response data to the logger. Consumers who want response data logged can verify that any log line containing it originated from their own handler code, not the SDK.
- **SC-016**: A consumer running a multi-account platform can dispatch the same conceptual flow to a set of recipients distributed across accounts using the existing broadcast API with a factory function, and receives a broadcast result report identifying per-recipient success or failure. The per-account flow identifier constraint is clearly documented so this use case can be implemented without trial and error.

## Assumptions

1. **Flow definition authoring is out of scope**: Consumers compose flow definitions according to the platform's published flow definition specification. This feature does not provide a builder, validator, or visual editor for flow definitions — only the mechanics to send them to the platform.
2. **Flow endpoint (Data Endpoint) implementation is out of scope**: Flows that exchange data with a backend during the conversation rely on a consumer-hosted endpoint. Implementing that endpoint, including the required encryption, is the consumer's responsibility and not provided by this feature.
3. **Flow lifecycle webhook events (publish, deprecate, reject notifications) are out of scope**: This feature delivers only flow *completion* webhook events (user submissions). Lifecycle status change notifications from the platform are deferred to a follow-up feature and are poorly documented by the platform at this time.
4. **Correlation tokens are best-effort**: The platform does not return the correlation token in flow completion payloads by default; it is only returned if the flow's terminal screen or endpoint explicitly includes it in its response. Consumers who need guaranteed correlation must implement it within their flow definition or rely on alternative identifiers (recipient phone number, message ordering within a session).
5. **Flow administration requires a business account identifier**: Flow creation, listing, retrieval, metadata updates, definition updates, publishing, deprecation, deletion, and preview all require a business account identifier in the consumer's configuration. Sending a flow to a user only requires a phone number identifier (consistent with other send operations).
6. **Authentication, rate limiting, retry, and error handling are reused**: Existing SDK infrastructure (authentication, rate limiter, retry with exponential backoff, typed error classes) applies to all new flow operations without special treatment.
7. **Backward compatibility is absolute**: No existing public behavior changes. Consumers who never touch flows observe no differences in message sending, webhook parsing, or any other module.
8. **Zero runtime dependencies must be preserved**: No new runtime dependency may be introduced for any flow capability. Any required functionality (serialization, HTTP, form data, JSON parsing) must use platform-native capabilities.
