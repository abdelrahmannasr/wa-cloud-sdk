# Feature Specification: Messaging Enhancements (v0.2.0)

**Feature Branch**: `008-messaging-enhancements`
**Created**: 2026-04-07
**Status**: Draft
**Input**: User description: "Messaging enhancements: add reply-to context support (context.message_id on all send methods), CTA URL button messages (interactive cta_url type), location request messages (interactive location_request_message type), typing indicators (send typing status), subpath exports for media/templates/phone-numbers/multi-account modules, and conversation pricing utilities to extract pricing info from webhook status events"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reply to Specific Messages (Priority: P1)

As an SDK consumer building a conversational bot, I need to reply to a specific incoming message so that my response appears as a quoted reply in the recipient's chat, maintaining conversational context and making it clear which message I am responding to.

**Why this priority**: Reply-to is the single most commonly needed messaging feature missing from the SDK. Nearly every customer support bot, FAQ bot, and interactive flow uses quoted replies. Without it, conversations lose context when multiple topics are discussed simultaneously.

**Independent Test**: Can be fully tested by sending a text message with a `context.message_id` referencing a prior message and verifying the platform accepts the payload with the context field included.

**Acceptance Scenarios**:

1. **Given** a consumer has received a message with a known message identifier, **When** they send any message type (text, image, video, audio, document, sticker, location, contacts, reaction, interactive, or template) and include a reply-to message identifier, **Then** the outbound message includes the context reference and the platform delivers it as a quoted reply to the specified message.

2. **Given** a consumer sends a message without specifying a reply-to identifier, **When** the message is sent, **Then** the behavior is unchanged from the current SDK — no context field is included and the message is delivered as a standalone message. Backward compatibility is fully preserved.

3. **Given** a consumer provides a reply-to identifier that is empty or contains only whitespace, **When** the send operation is attempted, **Then** the identifier is silently ignored and the message is sent without a context reference (no error is raised).

---

### User Story 2 - Send CTA URL Button Messages (Priority: P2)

As an SDK consumer building marketing or customer engagement flows, I need to send call-to-action URL button messages so that recipients can tap a button that opens a specific URL — for example, a product page, a payment link, or a booking form.

**Why this priority**: CTA URL buttons are the most common interactive message type for business use cases after basic text. They drive conversions by providing a single-tap path to a web destination. The SDK currently supports reply buttons and list messages but not URL-based call-to-action buttons.

**Independent Test**: Can be fully tested by sending a CTA URL button message to a recipient and verifying the platform accepts the payload and the recipient sees a tappable button that opens the specified URL.

**Acceptance Scenarios**:

1. **Given** a consumer wants to send a message with a URL button, **When** they provide body text, a button display text, and a target URL, **Then** the platform delivers a message with a tappable button that opens the specified URL when tapped.

2. **Given** a consumer provides an optional header (text, image, video, or document) and an optional footer, **When** the CTA message is sent, **Then** the header and footer are rendered alongside the body and button.

3. **Given** a consumer provides a URL containing a dynamic parameter placeholder, **When** they also supply the parameter value, **Then** the final URL is delivered with the placeholder replaced by the supplied value.

---

### User Story 3 - Send Location Request Messages (Priority: P3)

As an SDK consumer building a delivery or logistics application, I need to request the recipient's location so that they can share their GPS coordinates with a single tap, enabling me to provide delivery estimates, find nearby stores, or dispatch a driver.

**Why this priority**: Location request is essential for delivery, ride-hailing, and store-finder use cases. It removes friction compared to asking users to type an address. The platform provides a dedicated interactive type for this.

**Independent Test**: Can be fully tested by sending a location request message to a recipient and verifying the platform delivers a message with a "Send location" button.

**Acceptance Scenarios**:

1. **Given** a consumer wants to request the recipient's location, **When** they provide body text explaining why the location is needed, **Then** the platform delivers an interactive message with a location-sharing button.

2. **Given** the recipient taps the location button and shares their GPS coordinates, **When** the webhook event arrives, **Then** the SDK parses it as a location message event with latitude, longitude, and optional name/address fields (this is already handled by the existing webhook parser).

---

### User Story 4 - Show Typing Indicators (Priority: P4)

As an SDK consumer building a conversational experience, I need to show a "typing..." indicator in the recipient's chat so that the user knows a response is being prepared, creating a more natural and responsive conversational feel.

**Why this priority**: Typing indicators are a UX polish feature that improves perceived responsiveness. They are especially valuable for bots that perform processing (API calls, database lookups) before responding. Lower priority because conversations work without them — they are an enhancement, not a blocker.

**Independent Test**: Can be fully tested by sending a typing indicator to a recipient and verifying the platform accepts the request without error.

**Acceptance Scenarios**:

1. **Given** a consumer wants to indicate that a response is being composed, **When** they invoke the typing indicator for a specific recipient, **Then** the platform shows a "typing..." status in the recipient's chat for up to 25 seconds or until a message is sent.

2. **Given** a consumer sends a typing indicator followed by a message, **When** the message is delivered, **Then** the typing indicator disappears and is replaced by the actual message.

---

### User Story 5 - Import Individual Modules via Subpath (Priority: P5)

As an SDK consumer who only needs a subset of the SDK (e.g., only media operations or only template management), I need dedicated import paths for each module so that I can import exactly what I need and benefit from smaller bundle sizes through tree-shaking.

**Why this priority**: Subpath exports improve developer experience and allow consumers to import individual modules without pulling in the entire SDK. The SDK already has subpath exports for `./errors`, `./messages`, and `./webhooks`, but `./media`, `./templates`, `./phone-numbers`, and `./multi-account` are missing.

**Independent Test**: Can be fully tested by importing from each new subpath and verifying that the expected classes and types are available.

**Acceptance Scenarios**:

1. **Given** a consumer wants to use only the media module, **When** they import from the media subpath, **Then** they receive the media class and all related types without importing messages, templates, or other unrelated modules.

2. **Given** a consumer wants to use only the template module, **When** they import from the templates subpath, **Then** they receive the templates class, the template builder, and all related types.

3. **Given** a consumer wants to use only the phone numbers module, **When** they import from the phone-numbers subpath, **Then** they receive the phone numbers class and all related types.

4. **Given** a consumer wants to use only the multi-account module, **When** they import from the multi-account subpath, **Then** they receive the multi-account manager, all distribution strategies, and all related types.

5. **Given** a consumer imports from a new subpath in either module system, **When** the import resolves, **Then** it works correctly in both ESM and CommonJS environments with full type definitions available.

---

### User Story 6 - Extract Conversation Pricing from Webhooks (Priority: P6)

As an SDK consumer tracking messaging costs, I need utilities to extract and structure conversation pricing information from webhook status events so that I can monitor spending, categorize costs by conversation type, and build billing dashboards without manually parsing raw webhook payloads.

**Why this priority**: Pricing data is embedded in webhook status events but requires specific knowledge of the payload structure to extract. A utility function makes this data immediately accessible and enables cost tracking use cases. Lower priority because it is a convenience feature — consumers can manually extract this data today.

**Independent Test**: Can be fully tested by passing a webhook status event payload containing pricing data to the utility and verifying the returned structured object contains the expected billable flag, pricing model, and conversation category.

**Acceptance Scenarios**:

1. **Given** a webhook status event contains conversation and pricing metadata, **When** the consumer passes the event to the pricing utility, **Then** they receive a structured object containing: whether the message is billable, the pricing model, the pricing category, and the conversation identifier with its origin type and optional expiration timestamp.

2. **Given** a webhook status event does not contain pricing metadata (e.g., a "sent" status before billing is determined), **When** the consumer passes the event to the pricing utility, **Then** the utility returns null or an empty result indicating no pricing data is available.

3. **Given** a consumer wants to aggregate costs over a period, **When** they process multiple status events through the utility, **Then** they can accumulate totals by conversation category (marketing, utility, authentication, service, referral_conversion).

---

### Edge Cases

- What happens when a consumer provides a reply-to message identifier for a message that has been deleted or is from a different conversation? The SDK sends the context as-is; the platform determines whether the reply reference is valid and may silently drop the context if invalid.
- What happens when a consumer sends a CTA URL button with a URL that exceeds the platform's maximum length (2000 characters)? The SDK passes the URL as-is; the platform validates and returns an error if it exceeds limits.
- What happens when a consumer sends a typing indicator to an invalid or unregistered phone number? The platform returns an error, which the SDK surfaces as a typed error following existing error handling patterns.
- What happens when a consumer imports from a subpath that has not yet been configured? The import fails with a standard module-not-found error at build time.
- What happens when a webhook status event contains an unrecognized pricing category? The utility preserves the raw category value as a string rather than discarding it, ensuring forward compatibility with new categories the platform may add.
- What happens when multiple reply-to contexts are chained (reply to a reply)? The SDK only supports a single context.message_id per send, matching the platform's single-level reply behavior.

## Requirements *(mandatory)*

### Functional Requirements

**Reply-to Context**

- **FR-001**: The system MUST allow consumers to include an optional reply-to message identifier on any outbound message type (text, image, video, audio, document, sticker, location, contacts, reaction, interactive, template).
- **FR-002**: When a reply-to identifier is provided, the system MUST include a context object with the message identifier in the outbound payload.
- **FR-003**: When no reply-to identifier is provided, the system MUST send the message without a context object, preserving full backward compatibility with existing code.
- **FR-004**: The system MUST silently ignore empty or whitespace-only reply-to identifiers (no error, no context sent).

**CTA URL Button Messages**

- **FR-005**: The system MUST allow consumers to send interactive CTA URL button messages containing body text, button display text, and a target URL.
- **FR-006**: The system MUST support optional header content (text, image, video, or document) on CTA URL button messages.
- **FR-007**: The system MUST support an optional footer on CTA URL button messages.
- **FR-008**: The system MUST support dynamic URL parameters, allowing consumers to provide a base URL and an optional suffix value. When a suffix is provided, the platform appends it to the base URL at delivery time.

**Location Request Messages**

- **FR-009**: The system MUST allow consumers to send interactive location request messages containing body text that explains why the location is needed.
- **FR-010**: The location request message MUST be delivered with a location-sharing prompt that the recipient can tap to share their GPS coordinates.

**Typing Indicators**

- **FR-011**: The system MUST allow consumers to send a typing indicator to a specific recipient, causing a "typing..." status to appear in the recipient's chat.
- **FR-012**: The typing indicator MUST persist for up to 25 seconds or until a message is sent to the same recipient, whichever occurs first.
- **FR-012a**: The typing indicator uses a different payload structure from regular messages — it sends a status field instead of a message type. This is a platform requirement, not a design choice.

**Subpath Exports**

- **FR-013**: The system MUST provide dedicated import paths for the media module, exposing the media class and all related types.
- **FR-014**: The system MUST provide dedicated import paths for the templates module, exposing the templates class, template builder, and all related types.
- **FR-015**: The system MUST provide dedicated import paths for the phone-numbers module, exposing the phone numbers class and all related types.
- **FR-016**: The system MUST provide dedicated import paths for the multi-account module, exposing the multi-account manager, all distribution strategies, and all related types.
- **FR-017**: All new subpath exports MUST work correctly in both ESM and CommonJS environments with full type definitions.

**Conversation Pricing Utilities**

- **FR-018**: The system MUST provide a utility that extracts structured pricing information from webhook status events, including: billable flag, pricing model, pricing category, conversation identifier, conversation origin type, and optional expiration timestamp.
- **FR-019**: When a status event contains no pricing metadata, the utility MUST return a null or empty result rather than throwing an error.
- **FR-020**: The utility MUST preserve unrecognized pricing category values as raw strings for forward compatibility with new platform categories.

### Key Entities

- **Message Context**: An optional reference attached to any outbound message, containing a single message identifier that causes the message to appear as a quoted reply to the referenced message.

- **CTA URL Button**: An interactive message component containing display text and a target URL. Optionally includes a dynamic parameter placeholder that is replaced with a consumer-provided value at delivery time.

- **Location Request**: An interactive message type that prompts the recipient to share their GPS coordinates via a single-tap button.

- **Typing Indicator**: A transient signal sent to a specific recipient that displays a "typing..." status in their chat for up to 25 seconds.

- **Conversation Pricing**: Structured billing information extracted from webhook status events, containing whether a message is billable, the pricing model, the pricing category (marketing, utility, authentication, service, referral_conversion), and conversation metadata (identifier, origin type, expiration).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A consumer can send a quoted reply using any of the 12 message types with no more than one additional parameter added to their existing send call.
- **SC-002**: Existing send calls that do not specify a reply-to identifier continue to work identically with zero code changes required.
- **SC-003**: A consumer can send a CTA URL button message using a single method call with body text, button text, and a URL.
- **SC-004**: A consumer can request a recipient's location using a single method call with body text.
- **SC-005**: A consumer can show a typing indicator using a single method call with a recipient phone number.
- **SC-006**: Each of the four new subpath imports resolves correctly in both module systems and provides complete type definitions.
- **SC-007**: A consumer can extract pricing information from a webhook status event using a single utility function call, receiving a structured result or null.
- **SC-008**: All new functionality is covered by automated tests with coverage meeting or exceeding the project's 80% threshold on lines, functions, branches, and statements.
- **SC-009**: The SDK retains zero runtime dependencies after all changes.
- **SC-010**: All existing tests continue to pass without modification, confirming full backward compatibility.

## Assumptions

1. **Platform API compatibility**: The Meta WhatsApp Cloud API v21.0 supports all message types and features described in this specification (CTA URL buttons, location requests, typing indicators, message context). No new API version is required.
2. **Single-level reply**: The platform supports only a single level of reply context (one message_id per send). Nested or threaded replies are not supported by the platform.
3. **Typing indicator duration**: The platform enforces a maximum typing indicator duration of 25 seconds. The SDK does not need to manage timer-based expiration.
4. **Pricing categories**: The current known pricing categories are marketing, utility, authentication, service, and referral_conversion. The utility must be forward-compatible with additional categories.
5. **Backward compatibility**: All changes must be additive. No existing method signatures, type definitions, or export paths are modified or removed.
6. **Existing webhook parser**: The webhook parser already handles incoming location messages from recipients. No webhook changes are needed for the location request feature.
7. **Subpath export pattern**: New subpath exports follow the same pattern as existing ones (`./errors`, `./messages`, `./webhooks`) — each produces ESM, CJS, and declaration files via the existing build tooling.
