# Feature Specification: WhatsApp Cloud API SDK -- Core Foundation

**Feature Branch**: `001-sdk-core-foundation`
**Created**: 2026-02-13
**Status**: Retroactive
**Input**: User description: "Build core WhatsApp Cloud API SDK: project scaffolding, error handling, rate limiting, retry logic, HTTP client, message sending (13 types), and webhook processing with framework adapters"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Send Outbound WhatsApp Messages (Priority: P1)

As an SDK consumer building a WhatsApp integration, I need to send messages of any supported type to my customers so that I can communicate with them through the WhatsApp channel without needing to understand the raw platform payload format.

**Why this priority**: Sending messages is the primary value proposition of a WhatsApp SDK. Without outbound messaging, no business workflow can be completed. This is the single most critical capability and the reason most consumers adopt the SDK.

**Independent Test**: Can be fully tested by configuring credentials and sending a text message to a recipient. Delivers immediate value by proving the SDK can reach the WhatsApp Cloud API and deliver a message.

**Acceptance Scenarios**:

1. **Given** a consumer has configured valid credentials and a phone number ID, **When** they send a text message to a valid recipient phone number, **Then** they receive a confirmation containing the message identifier assigned by the platform.

2. **Given** a consumer wants to send rich media (image, video, audio, document, sticker), **When** they provide the recipient, media reference (either a previously uploaded media identifier or a publicly accessible URL), and optional caption, **Then** the message is delivered and they receive a confirmation with the message identifier.

3. **Given** a consumer wants to send a location, **When** they provide the recipient and geographic coordinates (with optional name and address), **Then** a location pin message is delivered to the recipient.

4. **Given** a consumer wants to share contact information, **When** they provide the recipient and one or more contact cards containing at minimum a formatted name, **Then** the contact card message is delivered.

5. **Given** a consumer wants to send an interactive message with quick-reply buttons (up to 3), **When** they provide the recipient, body text, and button definitions each with an identifier and display title, **Then** the recipient receives a message with tappable buttons.

6. **Given** a consumer wants to send an interactive list with selectable options, **When** they provide the recipient, body text, a button label, and one or more sections containing rows, **Then** the recipient receives a message with a selectable list menu.

7. **Given** a consumer wants to send a pre-approved template message, **When** they provide the recipient, template name, language code, and any required parameter values, **Then** the template message is delivered with the parameters substituted.

8. **Given** a consumer wants to react to a received message, **When** they provide the recipient, the original message identifier, and an emoji, **Then** the reaction is applied to the specified message.

9. **Given** a consumer wants to acknowledge receipt of a message, **When** they provide the message identifier to mark as read, **Then** the platform records a read receipt and the consumer receives a success confirmation.

10. **Given** a consumer provides a recipient phone number in any common format (with plus sign, dashes, spaces, parentheses, or dots), **When** the send operation is executed, **Then** the phone number is normalized to digits-only format before being sent and no validation error occurs.

11. **Given** a consumer provides a phone number that is too short (fewer than 7 digits), too long (more than 15 digits), or contains non-numeric characters after formatting is stripped, **When** the send operation is attempted, **Then** the operation is rejected immediately with a validation error before any network request is made, and the error identifies the problematic field.

---

### User Story 2 - Receive and Process Inbound Webhooks (Priority: P2)

As an SDK consumer, I need to receive real-time notifications from WhatsApp (incoming messages, delivery statuses, and errors) so that I can build responsive, two-way conversational experiences.

**Why this priority**: Receiving inbound messages is the second-most critical capability. Without it, the SDK only supports one-way broadcast. Two-way communication unlocks customer support, conversational commerce, and interactive bot scenarios. However, outbound messaging (P1) can function independently, which is why this is P2.

**Independent Test**: Can be fully tested by registering a webhook endpoint, subscribing it with the platform, sending a message to the business number, and verifying the callback receives a structured event.

**Acceptance Scenarios**:

1. **Given** a consumer has registered their webhook endpoint with the platform, **When** the platform sends a subscription verification challenge (a GET request containing mode, token, and challenge values), **Then** the SDK verifies the mode is "subscribe", confirms the token matches, and returns the challenge string with a success status.

2. **Given** a consumer has configured their app secret, **When** the platform sends an inbound event notification (POST) with a cryptographic signature header, **Then** the SDK verifies the signature using timing-safe comparison before processing the payload, preventing forgery.

3. **Given** a POST notification arrives with a valid signature containing one or more incoming messages, **When** the payload is processed, **Then** the SDK parses the raw platform payload into structured event objects and dispatches each message event to the consumer's registered message callback, including the sender's identity, message content, and timestamp.

4. **Given** a POST notification contains delivery status updates (sent, delivered, read, or failed), **When** the payload is processed, **Then** each status update is dispatched to the consumer's registered status callback with the message identifier, new status, recipient, and optional conversation and pricing metadata.

5. **Given** a POST notification contains error entries, **When** the payload is processed, **Then** each error is dispatched to the consumer's registered error callback with the error code, title, and optional detail information.

6. **Given** a consumer receives a message event, **When** they inspect the event, **Then** they can determine the message type (text, image, video, audio, document, sticker, location, contacts, interactive reply, reaction, button, or order) and access the type-specific data.

7. **Given** a POST arrives with a missing or invalid signature, **When** the SDK processes the request, **Then** the payload is rejected with a forbidden status and no callbacks are invoked.

8. **Given** a POST arrives with a valid signature but malformed or unparseable content, **When** the SDK processes the request, **Then** a bad request status is returned and no callbacks are invoked.

9. **Given** a GET verification request has a mode other than "subscribe" or a token that does not match, **When** the SDK processes the request, **Then** a forbidden status is returned.

---

### User Story 3 - Integrate Webhooks into Popular Server Frameworks (Priority: P3)

As an SDK consumer using a common server framework (Express or Next.js App Router), I need pre-built middleware adapters so that I can mount webhook handling with minimal boilerplate and without manually wiring request parsing, signature verification, and response formatting.

**Why this priority**: While the core webhook handler (P2) provides full functionality, most consumers use a web framework. Pre-built adapters dramatically reduce integration time from hours to minutes. This is P3 because the underlying handler can be used directly without an adapter -- the adapters are a convenience layer.

**Independent Test**: Can be tested by mounting the adapter in a framework project, configuring credentials, hitting the endpoint with a verification GET request, and confirming the challenge is returned correctly.

**Acceptance Scenarios**:

1. **Given** a consumer is building with Express, **When** they create the Express middleware adapter with their app secret, verify token, and event callbacks, **Then** they receive a standard middleware function that can be mounted on any route and handles both GET verification and POST event processing.

2. **Given** a consumer is building with Next.js App Router, **When** they create the Next.js route handler with their configuration and callbacks, **Then** they receive named GET and POST handler functions that can be directly exported from a route file.

3. **Given** the Express middleware receives a POST request, **When** the raw request body is available (via body parser configuration), **Then** signature verification and event dispatching proceed automatically, and errors in callbacks are forwarded to the framework's error handling chain.

4. **Given** the Express middleware receives a POST request without a raw body available, **When** the request is processed, **Then** a server error status is returned with guidance about configuring body parsing for signature verification.

5. **Given** the Next.js handler receives a POST request, **When** a callback throws an error, **Then** the error is caught and a server error response is returned, preventing the framework from crashing.

6. **Given** either middleware adapter receives a request with an unsupported HTTP method (not GET or POST), **When** the request is processed, **Then** a "Method Not Allowed" status is returned.

---

### User Story 4 - Operate Reliably Under API Failures and Rate Limits (Priority: P4)

As an SDK consumer sending messages at scale, I need the SDK to automatically handle transient failures, rate limits, and timeouts so that I can focus on business logic rather than building resilience infrastructure.

**Why this priority**: Reliability features are invisible when things work and critical when they do not. For consumers sending at volume (campaigns, notifications), automatic retry and rate limiting prevent message loss and account suspension. This is P4 because low-volume consumers may never encounter these scenarios, but high-volume consumers cannot operate without them.

**Independent Test**: Can be tested by simulating a rate limit response (429) from the API, confirming the SDK waits and retries, and verifying the message eventually succeeds without consumer intervention.

**Acceptance Scenarios**:

1. **Given** the SDK is configured with default settings, **When** the consumer sends messages, **Then** outbound requests are automatically throttled to no more than 80 per second (matching the platform's standard business tier limit).

2. **Given** the platform responds with a rate limit error (HTTP 429), **When** the SDK processes this response, **Then** the request is automatically retried after respecting the platform's retry-after value, if provided.

3. **Given** the platform responds with a transient server error (HTTP 500 or above), **When** the SDK processes this response, **Then** the request is retried up to 3 times with exponential backoff and randomized jitter to avoid thundering-herd effects.

4. **Given** a request fails after exhausting all retry attempts, **When** the final retry fails, **Then** the SDK surfaces a specific, typed error to the consumer that includes the HTTP status, error type, and any platform-provided trace identifier for debugging.

5. **Given** the platform responds with an authentication error (HTTP 401 or platform error code 190), **When** the SDK processes this response, **Then** the request is NOT retried (since retrying with the same credentials is futile) and a specific authentication error is raised immediately.

6. **Given** a consumer wants to customize resilience behavior, **When** they provide configuration options, **Then** they can adjust the rate limit capacity, retry count, backoff delays, jitter factor, and request timeout. They can also disable rate limiting or retry on a per-request basis.

7. **Given** a request exceeds the configured timeout (default: 30 seconds), **When** the timeout elapses, **Then** the request is aborted and the SDK proceeds with the retry policy if applicable.

8. **Given** the consumer provides an external cancellation signal, **When** the signal is triggered, **Then** any in-flight request is aborted immediately regardless of retry state.

9. **Given** all errors returned by the SDK, **When** the consumer catches an error, **Then** every error is an instance of a known error hierarchy (not a generic error), carrying a machine-readable code and human-readable message. The hierarchy includes: base SDK error, API error, rate limit error, authentication error, validation error, webhook verification error, and media error.

---

### Edge Cases

- What happens when a consumer sends a message to a phone number that is all formatting characters (e.g., "+--()")? The phone number normalizer strips all formatting and produces an empty string, which fails validation with a clear error before any network call.
- What happens when the platform returns a non-JSON error body (e.g., a proxy HTML page from a 502 gateway error)? The SDK catches the parse failure and wraps it in an API error with the HTTP status code.
- What happens when webhook payloads arrive for a non-WhatsApp-Business-Account object type? The parser returns an empty event array; no callbacks are invoked and no error is raised.
- What happens when webhook payloads contain change entries for fields other than "messages"? Those entries are silently skipped; only "messages" field changes are processed.
- What happens when a webhook message event has no matching contact in the contacts array? The sender identity falls back to "Unknown" for the name and uses the sender field for the WhatsApp ID.
- What happens when the rate limiter is destroyed while requests are queued? All pending requests are rejected with a specific "rate limiter destroyed" error and all internal timers are cleaned up.
- What happens when the rate limiter is reset while requests are queued? All pending requests are rejected with a "rate limiter reset" error, the capacity is refilled to maximum, and new requests can proceed immediately.
- What happens when a webhook signature has the correct prefix ("sha256=") but contains non-hex characters or an incorrect length? The SDK rejects it with a verification error before attempting cryptographic comparison.
- What happens when a consumer provides a media reference using both an ID and a link? The structure enforces that each media reference is either an ID or a link, never both.
- What happens when a callback throws during webhook event dispatching? The error propagates immediately and remaining events in the same payload are skipped. For Express, errors are forwarded to the error handler. For Next.js, a 500 response is returned.

## Requirements *(mandatory)*

### Functional Requirements

**Outbound Messaging**

- **FR-001**: The system MUST allow consumers to send text messages to a specified recipient, with optional URL preview.
- **FR-002**: The system MUST allow consumers to send media messages (image, video, audio, document, sticker) referenced either by a previously uploaded media identifier or by a publicly accessible URL.
- **FR-003**: The system MUST allow consumers to send location messages with geographic coordinates and optional place name and address.
- **FR-004**: The system MUST allow consumers to send contact card messages containing one or more contacts, each with at minimum a formatted name.
- **FR-005**: The system MUST allow consumers to send reaction messages (emoji reactions) to existing messages, identified by the original message identifier.
- **FR-006**: The system MUST allow consumers to send interactive button messages with up to 3 quick-reply buttons, each with an identifier and display title.
- **FR-007**: The system MUST allow consumers to send interactive list messages with sections of selectable rows, triggered by a labeled button.
- **FR-008**: The system MUST allow consumers to send pre-approved template messages with language code and parameterized component values.
- **FR-009**: The system MUST allow consumers to mark a received message as read by its message identifier, triggering a read receipt on the platform.
- **FR-010**: The system MUST validate all recipient phone numbers against international format rules (7-15 digits) before making any network request, rejecting invalid numbers with a clear validation error that identifies the problematic field.

**Inbound Webhook Handling**

- **FR-011**: The system MUST handle webhook subscription verification by validating that the mode is "subscribe", the verify token matches, and a challenge value is present, returning the challenge on success or a forbidden status on failure.
- **FR-012**: The system MUST verify the cryptographic signature of every inbound webhook POST using timing-safe comparison, rejecting payloads with missing, malformed, or invalid signatures before any further processing.
- **FR-013**: The system MUST parse raw webhook payloads into structured, typed events categorized as message events, status events (sent, delivered, read, failed), or error events.
- **FR-014**: The system MUST support all inbound message types: text, image, video, audio, document, sticker, location, contacts, interactive (button reply and list reply), reaction, button, and order.
- **FR-015**: The system MUST dispatch parsed events to consumer-registered callbacks (one for messages, one for statuses, one for errors), invoking them sequentially per event within a payload.

**Framework Adapters**

- **FR-016**: The system MUST provide a pre-built middleware adapter for Express-compatible frameworks that handles GET verification and POST event processing on a single route mount point.
- **FR-017**: The system MUST provide a pre-built route handler adapter for Next.js App Router that exports named GET and POST functions for direct use in a route file.

**Resilience and Error Handling**

- **FR-018**: The system MUST enforce outbound request rate limiting with a configurable capacity (default: 80 requests per second, matching the platform's standard business tier).
- **FR-019**: The system MUST automatically retry failed requests that encounter transient server errors (5xx) or rate limit responses (429), using exponential backoff with randomized jitter, up to a configurable maximum number of attempts (default: 3).
- **FR-020**: The system MUST respect the platform's retry-after value when present on rate limit responses, using the specified wait duration instead of calculated backoff.
- **FR-021**: The system MUST NOT retry authentication failures (401 or platform error code 190), raising a specific authentication error immediately.
- **FR-022**: The system MUST enforce configurable request timeouts (default: 30 seconds) and support external cancellation signals for aborting in-flight requests.
- **FR-023**: The system MUST surface all errors as instances of a structured error hierarchy with machine-readable codes, never as generic or untyped errors. The hierarchy MUST include: base SDK error, API error (with HTTP status, error type, optional subcode, optional platform trace ID), rate limit error (with optional retry-after duration), authentication error, validation error (with optional field name), webhook verification error, and media error (with optional media type).

**Distribution and Compatibility**

- **FR-024**: The system MUST be distributed as a single package that works in both ECMAScript Module and CommonJS environments with full type definitions.
- **FR-025**: The system MUST have zero runtime dependencies, relying exclusively on platform-native capabilities available in the target runtime environment (Node.js 18+).

### Key Entities

- **Configuration**: The set of credentials and behavioral options that initialize the SDK. Includes access token, phone number ID, optional business account ID, optional API version override, optional logging interface, optional rate limit parameters, optional retry parameters, optional request timeout, optional app secret, and optional webhook verify token.

- **Message**: An outbound communication sent to a recipient. Characterized by a recipient phone number, a message type (one of: text, image, video, audio, document, sticker, location, contacts, reaction, interactive, template), and type-specific content. Every message produces a response containing the platform-assigned message identifier.

- **Media Source**: A reference to a media asset, identified either by a platform-assigned media identifier (for previously uploaded assets) or by a publicly accessible URL. Used across image, video, audio, document, and sticker message types.

- **Webhook Event**: An inbound notification from the platform, parsed into one of three categories: message event (incoming message from a user, with sender identity, message content, and timestamp), status event (delivery status change with optional conversation and pricing metadata), or error event (platform error with code, title, and optional details).

- **Error**: A structured problem report with a machine-readable code and human-readable message. Organized in a hierarchy: base SDK error at the root; API error for platform responses (carrying HTTP status and error type); rate limit error and authentication error as specializations of API error; validation error for input problems (carrying the offending field name); webhook verification error for signature and challenge failures; media error for asset operation problems.

- **Webhook Handler**: A processing unit that accepts raw HTTP requests (GET for verification, POST for events), performs security checks (token matching, signature verification), parses payloads, and dispatches structured events to consumer-registered callbacks.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A consumer can send their first message using the SDK with no more than 5 lines of setup code (configure credentials, create client, create messages module, call send method, handle response).
- **SC-002**: All 11 outbound message types (text, image, video, audio, document, sticker, location, contacts, reaction, interactive, template) and mark-as-read are exercisable through the SDK and return a platform-assigned message identifier on success.
- **SC-003**: Webhook signature verification rejects 100% of tampered payloads (invalid signature, missing signature, malformed signature format) while accepting 100% of legitimately signed payloads, with no timing side-channel vulnerability.
- **SC-004**: Inbound webhook payloads containing any of the 12 supported message types (text, image, video, audio, document, sticker, location, contacts, interactive, reaction, button, order) are parsed into structured events with correct type identification and type-specific data extraction.
- **SC-005**: Under sustained load, the rate limiter permits no more than the configured throughput (default: 80 requests/second) measured over any 1-second window, while queuing excess requests rather than rejecting them.
- **SC-006**: Transient failures (5xx, 429) result in automatic retry with the consumer observing eventual success, provided the failure is resolved within the retry window (default: 3 attempts with exponential backoff up to 30 seconds).
- **SC-007**: The distributed package has exactly zero runtime dependencies as verified by the package manifest.
- **SC-008**: The package functions correctly when consumed via both ECMAScript Module import and CommonJS require, verified by loading the package in both module systems.
- **SC-009**: Automated test coverage meets or exceeds 80% on all four axes (lines, functions, branches, statements).
- **SC-010**: Framework adapter integration (Express, Next.js) can be completed in under 10 lines of consumer code per framework, covering both webhook verification and event handling.

## Assumptions

1. **Runtime environment**: Consumers run Node.js 18 or later, which provides native fetch, crypto, URL, FormData, AbortController, and Buffer without polyfills.
2. **Credentials management**: Consumers are responsible for securely obtaining and managing their access token, app secret, and verify token. The SDK does not handle token refresh or secret rotation.
3. **Single phone number per instance**: Each SDK instance is configured with a single phone number ID. Consumers managing multiple phone numbers create multiple instances.
4. **Platform API stability**: The Meta WhatsApp Cloud API v21.0 contract (request/response shapes, error codes, webhook payload structure) remains stable. Changes to the platform API may require SDK updates.
5. **Raw body availability**: For Express webhook integration, consumers are responsible for configuring their body parser to preserve the raw request body, which is required for signature verification.
6. **Sequential callback execution**: Webhook event callbacks within a single payload are invoked sequentially. Consumers who need parallel processing must implement that within their callbacks.
7. **No message persistence**: The SDK does not store or queue messages locally. If a send call fails after exhausting retries, the message is lost unless the consumer implements their own persistence layer.
8. **Internet connectivity**: The SDK requires outbound HTTPS connectivity to the Meta Graph API. It does not support offline operation or local message queuing.
