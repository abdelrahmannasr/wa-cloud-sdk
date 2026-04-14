# Feature Specification: Commerce & Catalogs

**Feature Branch**: `011-commerce-catalogs`
**Created**: 2026-04-13
**Status**: Draft
**Input**: User description: "v0.4.0 Commerce & Catalogs: Catalog/Commerce API (product CRUD) plus Single Product, Multi-Product, and Catalog interactive message types, plus incoming order webhook events"

## Clarifications

### Session 2026-04-13

- Q: Should the catalog management API include a bulk operation method, or only single-product CRUD? → A: Single-product CRUD only — `createProduct`, `updateProduct`, `deleteProduct` each operate on one product per call. Bulk sync is the consumer's responsibility (compose with the SDK's existing rate-limiter). A dedicated bulk endpoint, if ever needed, will be a separate future spec.
- Q: How should the catalog API behave when a consumer attempts to create a product whose retailer identifier already exists? → A: Expose two distinct methods. Strict create — fails with a typed conflict error if the retailer identifier already exists. Upsert — creates if absent, updates in place if present. Consumers choose semantics explicitly per call; this avoids hidden retry-induced overwrites while still serving the sync-to-catalog use case without an extra `getProduct` round-trip.
- Q: Should the SDK include an outbound order acknowledgement / status message (e.g., `sendOrderStatusMessage`) alongside the inbound order webhook event in this release? → A: Out of scope for v0.4.0. The release ships order receipt only. Consumers acknowledge orders by replying with `sendText` (or any existing message type) until a future release adds dedicated order-status / confirmation message types. The spec documents this gap explicitly so consumers can plan around it.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Send a Single Product Message (Priority: P1)

As an SDK consumer building a conversational commerce experience (storefront chatbot, customer support upsell, abandoned cart recovery), I need a first-class way to display a single specific product from my catalog inside a WhatsApp conversation so that the recipient can view product details and add it to their cart without leaving the chat.

**Why this priority**: Single-product messaging is the entry point of the commerce feature set. Without it, none of the higher-volume commerce use cases work — every multi-product flow eventually drills down to one item, and one-product recommendations are the most common automated commerce trigger (post-support upsell, single-SKU restock notification, targeted promotion). Consumers who can only send single-product messages already have a viable commerce integration; everything else amplifies it.

**Independent Test**: Can be fully tested in isolation by sending a single-product message that references an existing catalog identifier and product retailer identifier to a test recipient and observing that the recipient sees an interactive product card with image, name, price, and an "Add to cart" affordance.

**Acceptance Scenarios**:

1. **Given** a consumer has a catalog identifier and a product retailer identifier for a product that exists in that catalog, **When** they send a single-product message to a recipient with a body text, **Then** the recipient receives an interactive product card and the consumer receives a delivery confirmation identifying the sent message.

2. **Given** a consumer wants to add textual context around the product card, **When** they include an optional footer alongside the product, **Then** the footer is displayed beneath the product card.

3. **Given** a consumer is replying to an earlier message from the recipient (e.g., a "do you have this in stock?" inquiry), **When** they send the product message as a quoted reply, **Then** the product card appears in the recipient's chat as a reply to the quoted message, preserving conversation threading.

4. **Given** a consumer references a product retailer identifier that does not exist in the named catalog, **When** the message is sent, **Then** the consumer receives a typed error from the platform identifying the invalid product reference rather than a silent send failure.

5. **Given** a consumer is operating a multi-account platform and wants to send the same conceptual product offer from different accounts, **When** they use the existing multi-account broadcast API with a factory function that returns a single-product send for each account-recipient pair, **Then** each recipient receives the product message from the correct account, subject to the constraint that each account must have its own catalog identifier and product retailer identifier mapping because catalog identifiers are scoped to a single business account.

---

### User Story 2 - Send a Multi-Product Message (Priority: P2)

As an SDK consumer who wants to present a curated selection of products to a recipient (a recommended set after a category browse, a list of items in a recently-viewed history, a hand-picked seasonal promotion), I need to send a structured multi-product message organized into named sections so that the recipient can compare options inside the chat without the consumer authoring a separate single-product message per item.

**Why this priority**: Curated multi-product messages drive the majority of real-world commerce conversion flows because customers compare before they buy. This is P2 because a consumer can technically achieve a similar outcome with a sequence of single-product messages, but that flow is fragmented and a worse experience for the recipient — the multi-product list message is the standard pattern customers expect.

**Independent Test**: Can be fully tested by sending a multi-product message with a header, body, and one or more named sections containing product retailer identifiers to a test recipient and observing that the recipient sees a structured list grouped by section with each product showing image, name, and price.

**Acceptance Scenarios**:

1. **Given** a consumer has a catalog identifier and a curated set of product retailer identifiers organized into one or more named sections, **When** they send a multi-product message with a header text, body text, and the sections, **Then** the recipient receives a structured product list grouped by section and the consumer receives a delivery confirmation.

2. **Given** a consumer attempts to send a multi-product message containing more than the platform's per-message item maximum (30 items in total) or more than the platform's section maximum (10 sections), **When** they invoke the send, **Then** the SDK rejects the request before contacting the platform with a typed validation error indicating which limit was exceeded.

3. **Given** a consumer wants a footer beneath the product list, **When** they include an optional footer, **Then** the footer is displayed at the bottom of the list.

4. **Given** a consumer wants to send a multi-product message as a reply to an earlier conversation turn, **When** they include a quoted-reply reference, **Then** the product list appears as a reply to the quoted message.

5. **Given** a consumer's multi-product message references a product retailer identifier that does not exist in the named catalog, **When** the message is sent, **Then** the consumer receives a typed error from the platform identifying the invalid product reference; the SDK does not attempt to drop the invalid item silently.

---

### User Story 3 - Receive Order Notifications from Customers (Priority: P3)

As an SDK consumer who has sent product or catalog messages to recipients, I need to receive each recipient's order as a typed, dedicated webhook event so that I can fulfill the order without writing custom payload-parsing logic and without confusing order events with regular text messages.

**Why this priority**: Sending product messages without receiving the resulting orders is a half-feature — every transactional commerce use case requires the round-trip. This is P3 because some commerce-adjacent uses (catalog browsing, awareness campaigns, in-store discovery) do not require receiving structured orders, but the majority of consumers who build commerce flows need the order-receipt path.

**Independent Test**: Can be fully tested by simulating an incoming webhook payload containing an order and verifying that the SDK surfaces a dedicated order event with parsed line-item data, without the same payload being mistakenly routed to the general message event handler.

**Acceptance Scenarios**:

1. **Given** a recipient has reviewed products from a previously sent product or catalog message and submitted a cart, **When** the platform delivers the order webhook, **Then** the consumer receives a dedicated order event distinct from regular message events, containing the sender's contact information, the message identifier, the timestamp, the catalog identifier, the array of ordered items (each with product retailer identifier, quantity, item price, and currency), and any accompanying text the recipient sent with the order.

2. **Given** a consumer has registered a callback for order events, **When** an order webhook arrives, **Then** only the order callback is invoked — the general message callback is not also invoked for the same event, avoiding double-handling.

3. **Given** an order webhook arrives with a malformed or unexpected line-item payload, **When** the webhook is parsed, **Then** the consumer still receives the event with the original raw payload intact, the parsed line-item array is empty rather than throwing an error, and webhook processing does not halt for other events in the same batch.

4. **Given** the recipient submits multiple separate orders over time, **When** each order webhook arrives, **Then** each is delivered to the order callback as a separate event with its own message identifier; the SDK does not maintain any internal correlation or deduplication state across events.

5. **Given** the recipient sends a regular text message, an interactive button reply, or an interactive list reply (non-order events), **When** the webhook is parsed, **Then** the existing general message event handler continues to receive these as regular message events — order handling does not interfere with existing message-handling behaviors.

---

### User Story 4 - Send a Catalog Message (Priority: P4)

As an SDK consumer who wants to invite a recipient to browse the consumer's full product catalog inside WhatsApp (a "shop now" prompt, a discovery message after a "what do you sell?" inquiry, a generic re-engagement campaign), I need to send a catalog message that opens the recipient's view of the entire catalog so that the recipient can self-navigate without the consumer pre-curating products.

**Why this priority**: Catalog messages cover the long-tail discovery use case where the consumer does not know which specific product the recipient wants. This is P4 because consumers who already have a clear product or curated set in mind get more conversion value from US1 and US2; catalog messages are most valuable for awareness and browsing flows that do not require structured curation.

**Independent Test**: Can be fully tested by sending a catalog message with a body and an optional thumbnail product retailer identifier to a test recipient and observing that the recipient sees a "View catalog" entry point that opens the consumer's full catalog.

**Acceptance Scenarios**:

1. **Given** a consumer has a body text and optionally a product retailer identifier to use as a thumbnail, **When** they send a catalog message to a recipient, **Then** the recipient receives a catalog invitation displaying the body text and a "View catalog" affordance.

2. **Given** a consumer wants additional context beneath the catalog invitation, **When** they include an optional footer, **Then** the footer is displayed beneath the invitation.

3. **Given** a consumer omits the thumbnail product, **When** they send the catalog message, **Then** the recipient still receives the invitation with the platform's default catalog representation.

4. **Given** the consumer's business account does not have a catalog connected, **When** they attempt to send a catalog message, **Then** the consumer receives a typed error explaining the precondition rather than an opaque platform rejection.

---

### User Story 5 - Programmatically Manage the Product Catalog (Priority: P5)

As an SDK consumer operating a commerce integration that owns its product data (a multi-channel retailer syncing inventory from a primary system of record, a marketplace platform onboarding new merchants, a release pipeline that promotes catalog changes from staging to production), I need to create, read, update, delete, and list products in my catalog from code so that catalog management does not require manual work in the platform's commerce administration tools.

**Why this priority**: Programmatic catalog management is high-value for platform builders and teams with existing systems of record, but it is not strictly required to use the commerce messaging features — a consumer can author and maintain their catalog manually in the platform's web tools and still receive full value from US1, US2, US3, and US4. This puts it last on the priority list for the release.

**Independent Test**: Can be fully tested by creating a new product in a catalog with a name, retailer identifier, price, currency, and image URL; listing the catalog and observing the new product appears; updating a single field (e.g., the price); listing again to observe the change; deleting the product; and listing one more time to observe its removal.

**Acceptance Scenarios**:

1. **Given** a consumer has a connected catalog and the required product attributes (retailer identifier, name, description, price, currency, availability, image URL), **When** they create a product in the catalog, **Then** the consumer receives the new product's record including any platform-assigned identifiers and any validation warnings.

2. **Given** a consumer wants to enumerate products in a catalog, **When** they list products with pagination parameters, **Then** they receive the set of products with identifying metadata and pagination cursors for subsequent pages.

3. **Given** a consumer wants to enumerate the catalogs available to their business account, **When** they list catalogs, **Then** they receive each catalog's identifier and metadata.

4. **Given** a consumer wants to inspect a single product, **When** they fetch the product by identifier, **Then** they receive the complete product record.

5. **Given** a consumer needs to change one or more attributes of a product (price, availability, image URL), **When** they submit an update with only the changed fields, **Then** the platform applies the changes without requiring the consumer to resend the full product definition.

6. **Given** a consumer wants to remove a product from the catalog, **When** they delete the product by identifier, **Then** the product is removed and no longer appears in subsequent list queries.

7. **Given** a consumer's application does not have a business account identifier configured, **When** they attempt any catalog management operation, **Then** they receive a clear, actionable error at the point of first use indicating that a business account identifier is required, while unrelated send operations continue to work.

---

### Edge Cases

- What happens when a consumer references a catalog identifier that exists for a different business account than the one configured? The platform rejects the operation and the SDK surfaces the rejection as a typed error so the consumer can correct the mapping.
- What happens when a multi-product message contains the same product retailer identifier in more than one section? The platform accepts duplicates and the SDK passes them through; deduplication is the consumer's responsibility because intentional repetition (e.g., featuring a popular item in two named sections) is a valid use case.
- What happens when a multi-product message exceeds the per-message item limit (30 items in total) or section limit (10 sections)? The SDK rejects the request client-side before contacting the platform with a typed validation error indicating which limit was exceeded.
- What happens when a consumer sends a catalog message to a recipient whose handset does not support the catalog message type? The platform delivers a fallback representation; the SDK does not special-case device capability.
- What happens when an order webhook arrives with a missing or unrecognized currency code on a line item? The SDK preserves the raw value and surfaces the line item with the currency field present; the consumer is responsible for validating against their own list of supported currencies.
- What happens when the same order event is delivered more than once due to the platform's at-least-once retry behavior (e.g., the consumer's handler timed out or returned an error on a previous attempt)? The SDK delivers each attempt as a separate order event, exposes the stable message identifier on every event, and does not maintain any internal deduplication state. Consumers are responsible for implementing idempotency in their own persistence layer using the message identifier as the deduplication key.
- What happens when a consumer imports only the commerce functionality via a dedicated subpath import? The import resolves and exposes all catalog-related classes, types, and constants without pulling in unrelated modules, consistent with the existing subpath export behavior for other SDK modules.
- What happens when a consumer attempts to create a product whose required attributes are missing or whose price or currency shape is invalid? The SDK rejects the request client-side with a typed validation error before contacting the platform, identifying which attribute failed.
- What happens when the underlying platform reports a catalog-level error (e.g., catalog has been disabled, account is restricted)? The SDK surfaces the platform's structured error so consumers can respond programmatically rather than parse error strings.
- What happens when a consumer attempts to send a product, multi-product, or catalog message and the SDK's internal logger is set to a verbose level? The SDK does not log full product attributes (price, name, image URL) or full order line-item arrays at any level, matching the data-handling discipline established for flow response payloads.

## Requirements *(mandatory)*

### Functional Requirements

**Sending product messages**

- **FR-001**: System MUST allow a consumer to send a single-product message identifying a catalog identifier, a product retailer identifier, and a body text to a recipient.
- **FR-002**: Single-product messages MUST support an optional footer text.
- **FR-003**: Single-product messages MUST support a quoted-reply reference to an earlier message in the conversation.
- **FR-004**: System MUST allow a consumer to send a multi-product message identifying a catalog identifier, a header text, a body text, and one or more named sections of product retailer identifiers to a recipient.
- **FR-005**: Multi-product messages MUST support an optional footer text and an optional quoted-reply reference.
- **FR-006**: System MUST reject a multi-product message client-side with a typed validation error if the total number of products across all sections exceeds 30 or if the number of sections exceeds 10, before contacting the platform.
- **FR-007**: System MUST allow a consumer to send a catalog message identifying a body text and optionally a product retailer identifier to use as a thumbnail.
- **FR-008**: Catalog messages MUST support an optional footer text.
- **FR-009**: All three new message types MUST be usable as factory targets in the existing multi-account broadcast workflow without any additional broadcast API surface.

**Receiving order events**

- **FR-010**: System MUST surface an incoming order webhook as a dedicated typed order event distinct from regular message events.
- **FR-011**: An order event MUST expose the sender's contact information, the message identifier, the timestamp, the catalog identifier, the array of ordered line items, and any accompanying text the recipient sent with the order.
- **FR-012**: Each order line item MUST expose the product retailer identifier, the quantity, the item price, and the currency.
- **FR-013**: An order event MUST be delivered exclusively to the dedicated order callback; the general message callback MUST NOT also receive the same event.
- **FR-014**: When the order line-item payload is malformed or cannot be parsed, the order event MUST still be delivered with the original raw payload intact and an empty parsed line-item array; webhook processing MUST NOT halt for other events in the same batch.
- **FR-015**: System MUST NOT maintain internal deduplication state across order events; each delivery attempt MUST be surfaced as a separate event with its stable message identifier exposed for consumer-side idempotency.

**Catalog management**

- **FR-016**: System MUST allow a consumer to list catalogs available to their business account with pagination support.
- **FR-017**: System MUST allow a consumer to list products in a catalog with pagination support.
- **FR-018**: System MUST allow a consumer to fetch a single product by identifier and receive its complete record.
- **FR-019**: System MUST allow a consumer to create a product in a catalog by supplying a retailer identifier, name, description, price, currency, availability, and image URL. The strict-create operation MUST fail with a typed conflict error if the supplied retailer identifier already exists in the catalog; the SDK MUST NOT silently overwrite an existing product when the consumer used the strict-create path.
- **FR-019a**: System MUST additionally provide an upsert operation that creates a product if its retailer identifier is absent or updates it in place if the retailer identifier already exists. The upsert path MUST be a separate, named entry point from the strict-create path so that consumers select semantics explicitly per call rather than relying on hidden behavior.
- **FR-020**: System MUST allow a consumer to update a product by supplying only the fields that are changing; the platform-assigned identifier and unchanged fields MUST NOT be required.
- **FR-021**: System MUST allow a consumer to delete a product by identifier.
- **FR-021a**: Catalog mutation methods (create, update, delete) MUST operate on a single product per call; the SDK MUST NOT expose a bulk-mutation endpoint in this release. Consumers requiring bulk synchronization compose multiple calls themselves and rely on the SDK's existing rate-limiter for pacing.
- **FR-022**: System MUST reject any catalog management operation client-side with a clear, actionable error at the point of first use if the consumer's application does not have a business account identifier configured; unrelated send operations MUST continue to work.
- **FR-023**: System MUST validate product attributes client-side (required fields present, currency code shape, price shape) before contacting the platform and surface validation failures as typed errors.

**Cross-cutting**

- **FR-024**: System MUST surface platform validation errors for invalid product retailer identifiers, invalid catalog identifiers, and missing commerce-account preconditions as typed errors that consumers can branch on programmatically rather than parse from error strings.
- **FR-025**: System MUST expose a dedicated subpath import for the commerce module so consumers who only need commerce functionality can avoid pulling in unrelated modules, consistent with existing module subpath exports.
- **FR-026**: System MUST integrate the commerce module into the unified client so that consumers using the unified entry point can access send methods, the order callback, and catalog management without instantiating the module directly.
- **FR-027**: System MUST NOT log product attributes (price, name, description, image URL) or full order line-item arrays at any logger level, including verbose; consumers who wish to log this data must do so explicitly from their own handlers.
- **FR-028**: System MUST accept product image references only as externally hosted URLs supplied by the consumer; the commerce module MUST NOT host, upload, or proxy image content, and MUST NOT depend on the existing media module for image hosting. Consumers who need image hosting are expected to provide it independently.

### Key Entities *(include if feature involves data)*

- **Catalog**: A grouping of products owned by a business account. Identified by an opaque platform-issued identifier. Holds zero or more products. Scoped to a single business account.
- **Product**: A single sellable item inside a catalog. Identified by a retailer-defined identifier (chosen by the consumer) and additionally by a platform-assigned identifier. Has attributes including name, description, price, currency, availability, and image URL.
- **Product Section**: A named display grouping of product retailer identifiers used inside a multi-product message. Sections are presentation-only and are not persisted in the catalog.
- **Order**: An incoming submission from a recipient that contains the catalog identifier, an array of ordered line items, and an optional accompanying text message. Exposed to consumers as a dedicated webhook event.
- **Order Item**: A single product retailer identifier together with the quantity ordered, the item price at the time of the order, and the currency of that price.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A consumer can author, send, and confirm receipt of a single-product message to a test recipient in under 5 minutes starting from a fresh package install, with the only prerequisites being a configured business account and an existing catalog with at least one product.
- **SC-002**: 100% of incoming order webhook events are delivered to the dedicated order callback and 0% are delivered to the general message callback, verified across the full test suite for this feature.
- **SC-003**: A consumer can send a multi-product message containing the platform's full supported limit (30 items across 10 sections) and the recipient sees every product render correctly.
- **SC-004**: A consumer can complete the full lifecycle of a product (create, list to confirm presence, update one attribute, list to confirm change, delete, list to confirm removal) without leaving their code editor and without manual steps in the platform's web tools.
- **SC-005**: Consumers receive a typed, programmatically branchable error for every documented failure path (invalid product retailer identifier, invalid catalog identifier, missing commerce-account precondition, missing business account identifier, exceeded multi-product limits, malformed product attributes). Client-side validation errors surface synchronously before any network call; platform errors surface as the corresponding typed class with the platform's error code preserved.
- **SC-006**: The new commerce capability ships with at least one runnable example for each user story (5 examples total), each runnable end-to-end against a configured sandbox in under 5 minutes.
- **SC-007**: Test coverage for the new commerce module meets or exceeds the project-wide 80% threshold across lines, functions, branches, and statements.
- **SC-008**: A consumer who only imports the commerce module via its dedicated subpath import does not pay any bundle-size cost for unrelated modules (messages-only consumers continue to receive the same bundle as before this feature).

## Assumptions

- The recipient's WhatsApp client supports interactive product, multi-product, and catalog message types; consumers operating in markets with older clients are responsible for their own fallback strategy.
- The consumer's business account already has a connected commerce account and at least one catalog; if not, every commerce operation surfaces a typed precondition error and the consumer is expected to complete the one-time commerce-account setup outside the SDK.
- Product and catalog identifiers are opaque platform-issued strings; the SDK validates only that they are non-empty and does not parse, normalize, or assert any internal structure.
- Currency codes follow the ISO 4217 three-letter convention; the SDK validates the shape (three uppercase letters) but does not maintain a list of valid codes — the platform is the authoritative validator.
- Order amounts are expressed by the platform as exposed; the SDK does not compute totals from line items, recompute taxes, or convert currencies — it surfaces what the platform delivers.
- Multi-account broadcast keeps its existing semantics; commerce send methods are usable as factory targets without any new broadcast API surface, with the documented constraint that catalog identifiers are scoped to a single business account and consumers must maintain a per-account mapping.
- The platform's at-least-once webhook delivery behavior applies to order events the same way it applies to all other webhook events; idempotency is a consumer-side responsibility implemented against the stable message identifier exposed on every event.
- The SDK follows its existing zero-runtime-dependencies and strict-typing constraints; no new external libraries are introduced.
- Product image hosting is entirely the consumer's responsibility; the commerce module does not provide upload, hosting, or proxying for images and does not depend on the existing media module.
- Outbound order acknowledgement and order-status reply message types are explicitly out of scope for this release. Consumers reply to incoming order events using the existing message-sending methods (e.g., `sendText`) until a future release introduces dedicated order-status messages.
- Bulk catalog mutation endpoints are explicitly out of scope for this release. Consumers compose multiple per-product calls using the SDK's existing rate-limiter when they need to synchronize many products at once.
