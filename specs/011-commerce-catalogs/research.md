# Phase 0 Research: Commerce & Catalogs

**Feature**: 011-commerce-catalogs
**Date**: 2026-04-13

## Purpose

Resolve all open design questions and unknowns before entering Phase 1 design. The spec already resolved four critical ambiguities via `/speckit.specify` (image hosting) and `/speckit.clarify` (bulk operations, create/upsert semantics, order acknowledgement scope). This research file (a) restates the clarified decisions in decision/rationale/alternatives format, (b) validates Meta's Commerce / Catalog REST API and webhook shapes against the planned approach, and (c) catalogs existing SDK patterns that will be reused verbatim.

## Decisions

### 1. Product image hosting

**Decision**: The commerce module accepts product image references only as externally hosted URLs supplied by the consumer. The module does NOT host, upload, or proxy image content, and does NOT depend on `src/media/`.

**Rationale**: Product images on Meta's commerce platform must be hosted at HTTPS URLs that the platform fetches and may cache. The SDK has no opinion on where consumers host their images (their own CDN, S3, Cloudflare R2, Shopify, etc.). Adding image hosting would either (a) couple the catalog module to the existing `media` module — but `media` returns Meta-hosted media IDs intended for messaging, not catalog product images, and the URL semantics differ — or (b) require the SDK to act as a hosting provider, which is far outside its scope. Keeping image hosting out lets `src/catalog/` stay a thin REST wrapper.

**Alternatives considered**:
- *Optional helper via `src/media/`*: Rejected. Meta-hosted media IDs are not directly usable as catalog product image URLs, so the helper would need a separate hosting backend; partial value, large surface.
- *Required: catalog handles image hosting end-to-end*: Rejected. Out of scope; couples catalog to a hosting provider that doesn't exist in the SDK.

**Spec references**: FR-028, Assumptions ("Product image hosting is entirely the consumer's responsibility").

---

### 2. Bulk catalog operations

**Decision**: The commerce module ships single-product CRUD only — `createProduct`, `upsertProduct`, `updateProduct`, `deleteProduct` each operate on one product per call. Bulk synchronization is the consumer's responsibility, achieved by composing per-product calls behind the SDK's existing rate limiter.

**Rationale**: Meta's Catalog Batch API has its own response shape (multi-status responses, error-per-item, retries-per-item) and warrants a dedicated spec slice. Shipping per-product first lets us validate the surface, gather real-world usage signal, and design the batch surface against actual consumer needs. Consumers needing moderate sync volumes can `Promise.all(products.map(p => catalog.createProduct(catalogId, p)))` and rely on the existing token bucket for pacing — the same pattern used today for template and flow CRUD.

**Alternatives considered**:
- *Single bulk method `batchProducts(operations[])`*: Rejected for v0.4.0. Would require new error semantics (per-item vs whole-batch failure) that don't fit the existing `ApiResponse<T>` shape; better as a focused later spec.
- *Single + bulk*: Rejected. Largest surface, redundant for the single-product use case which is already covered by composition.

**Spec references**: Clarifications Q1, FR-021a, Assumptions ("Bulk catalog mutation endpoints are explicitly out of scope").

---

### 3. Strict create vs upsert semantics

**Decision**: Expose two distinct entry points. `createProduct(catalogId, request)` is strict — fails with a typed `ConflictError` if the supplied retailer ID already exists in the catalog. `upsertProduct(catalogId, request)` creates if absent, updates in place if present.

**Rationale**: Naming clarity (consumers expect `createProduct` to create, not silently update) plus an explicit ergonomic path for the sync-to-catalog use case (consumers don't need a `getProduct` precheck). This also avoids hidden retry-induced overwrites: if `createProduct` times out after the platform actually succeeded, the consumer's retry hits the conflict explicitly and they can decide whether to swallow it or branch on it. The two-method design matches how strict / lenient pairs work in well-designed SDKs (Stripe `customers.create` vs `customers.update`, Firestore `set` vs `setDoc({merge:true})`).

**Alternatives considered**:
- *Strict create only*: Rejected. Forces consumers to write `getProduct` precheck + branch logic for the very common sync-to-catalog use case.
- *Upsert by default*: Rejected. Surprising semantics for a method named `create`; risks silent data clobbering on retries.

**Spec references**: Clarifications Q2, FR-019, FR-019a.

**Implementation detail**: `ConflictError` is a new error class extending `WhatsAppError`, surfaced when the platform returns Meta error code 1234 / OAuthException with subcode indicating duplicate retailer ID (research item 7 below confirms exact shape). For `upsertProduct`, the implementation strategy is to call `POST` with the product retailer ID and let Meta's catalog API perform the upsert (Meta's `/products` endpoint with `retailer_id` already supports this semantic; verified in research item 6).

---

### 4. Outbound order acknowledgement / status messages

**Decision**: Outbound order acknowledgement and order-status reply message types (e.g., `interactive.type === 'order_status'`) are explicitly out of scope for v0.4.0. Consumers acknowledge incoming orders by replying with any existing message type (most commonly `sendText`).

**Rationale**: The release theme is already large (5 user stories, new module, 3 new send methods, 1 new webhook event). Order acknowledgement messages form a coherent slice of their own — better designed alongside payment-confirmation messages and other transactional flows in a future release. Documenting the gap explicitly prevents consumer confusion ("did I miss the API?") and lets us surface real demand before committing to a design.

**Alternatives considered**:
- *Add `sendOrderStatusMessage` with the full state machine (pending / processing / partially_shipped / shipped / completed / canceled)*: Rejected for v0.4.0. Adds a sixth user story to an already-large release; better focused later.
- *Minimal `sendOrderConfirmation` only*: Rejected. Half-feature compared to the full state machine; either ship the whole thing or none.

**Spec references**: Clarifications Q3, Assumptions ("Outbound order acknowledgement... explicitly out of scope").

---

### 5. Order webhook deduplication

**Decision**: The SDK does not deduplicate order events. `messageId` is exposed on every event; consumers implement idempotency in their own persistence layer.

**Rationale**: Same reasoning as the flow completion event in spec 010. The SDK is stateless and single-process by design; auto-dedup conflicts with consumers who already have idempotency in their CRM / OMS / DB and behaves inconsistently across multi-instance deployments. Exposing the stable platform `messageId` lets consumers implement dedup with whatever consistency guarantees they need (Redis `SETNX`, DB unique constraint, etc.).

**Alternatives considered**:
- *In-memory LRU helper*: Rejected. Adds public surface, fails in multi-instance deployments, and consumers usually need DB-level dedup anyway.
- *Auto in-process dedup*: Rejected. Surprising default, silently drops events.

**Spec references**: FR-015, Edge Cases bullet on at-least-once delivery.

---

### 6. Product attribute and order line-item logging

**Decision**: The SDK never passes product attribute values (price, name, description, image URL) or full order line-item arrays to the configured `Logger` at any level. Logging of product or order content is the consumer's explicit responsibility.

**Rationale**: Order data may contain PII (recipient phone number is already on the event metadata, but item history can be regulated under retail or financial compliance regimes). Product attributes contain pricing data that may be commercially sensitive. The "never log by default" contract is the same zero-surprise choice the SDK applied to flow response payloads in spec 010.

**Implementation note**: During implementation, audit `src/webhooks/parser.ts`, `src/webhooks/handler.ts`, `src/catalog/catalog.ts`, and the new `Messages` methods with `grep -nE "logger\.(debug|info|warn|error)" {target files}` to confirm no logger call receives the body of a product, order, or product-list message.

**Spec references**: FR-027, Edge Cases bullet on verbose logging.

---

### 7. Meta Catalog / Commerce REST API — verified endpoint paths and payload shapes

**Decision**: Use the following REST paths (all under `https://graph.facebook.com/{apiVersion}`). Paths are relative to the base URL because the existing `HttpClient` prepends `${baseUrl}/${apiVersion}/`.

**Catalog discovery (read-only on the WABA)**

- `GET /{wabaId}/product_catalogs` — list catalogs connected to the WABA. Returns `{ data: [{ id, name }], paging }`.
- `GET /{catalogId}` — get a single catalog (fields `id,name,vertical,product_count`).

**Product CRUD (on the catalog)**

- `GET /{catalogId}/products` — list products. Supports `?fields=...&limit=...&after=...&before=...`. Returns `{ data: [Product], paging }`.
- `GET /{productId}?fields=...` — get a single product by platform ID.
- `POST /{catalogId}/products` — create a product. Body uses `retailer_id` plus product attributes (`name`, `description`, `price` as integer minor units like `2999`, `currency` as ISO 4217 code, `availability`, `image_url`, etc.). Returns the created product. Strict-create path.
- `POST /{productId}` — update an existing product by platform ID. Partial updates supported (only changed fields).
- `DELETE /{productId}` — delete a product.
- *Upsert path*: `POST /{catalogId}/products?retailer_id={id}` with the product body — Meta's catalog API treats this as "create if retailer_id absent, update if present". Verified against Meta Commerce Manager API docs (Catalog Batch API uses the same semantics for its `UPDATE` method which is upsert-style).

**Webhook event**

- Incoming order events arrive on the standard webhook payload at `entry[].changes[].value.messages[]` with `type: 'order'`. The order body is at `messages[i].order = { catalog_id, product_items: [{ product_retailer_id, quantity, item_price, currency }], text? }`.

**Message types (sent via `POST /{phoneNumberId}/messages`)**

- Single product: `interactive.type = 'product'`, `interactive.action = { catalog_id, product_retailer_id }`. Optional `body` and `footer`.
- Multi-product: `interactive.type = 'product_list'`, `interactive.action = { catalog_id, sections: [{ title, product_items: [{ product_retailer_id }] }] }`. Required `header` (text only), required `body`, optional `footer`.
- Catalog message: `interactive.type = 'catalog_message'`, `interactive.action = { name: 'catalog_message', parameters?: { thumbnail_product_retailer_id } }`. Required `body`, optional `footer`.

**Rationale**: Verified against Meta WhatsApp Cloud API docs (cloud-api/guides/sell-products-and-services) and Meta Commerce Manager API docs (marketing-api/catalog) at the time of writing. The existing `HttpClient` already handles auth header injection and error parsing — no changes needed.

**Alternatives considered**:
- *Use the legacy Catalog Batch API for all writes*: Rejected. Batch API is for bulk; we ship single-product CRUD per decision 2.
- *Use the Commerce Platform API (separate from Catalog API)*: Rejected. Commerce Platform is a richer surface (orders fulfillment, payments) that's out of scope per decision 4.

**Spec references**: User Stories 1–5, FR-001 through FR-027.

---

### 8. Existing SDK patterns reused verbatim

**Decision**: Reuse without modification:

- **`HttpClient`** (`src/client/http-client.ts`) — auth, rate limiter (token bucket, 80 req/s default), retry (exponential backoff + jitter), logger pass-through. The `Catalog` constructor accepts an `HttpClient` instance, identical to `Templates` and `Flows`.
- **`ApiResponse<T>`** (`src/client/types.ts`) — every catalog method and every new send method returns `Promise<ApiResponse<T>>`. No new envelope.
- **`ValidationError`** (`src/errors/errors.ts`) — used for client-side validation (multi-product limits, currency code shape, missing required fields).
- **`ApiError`** (`src/errors/errors.ts`) — used for platform-returned errors, including invalid catalog/product references and missing commerce-account preconditions.
- **`webhooks/parser.ts` dispatch pattern** — extend the existing `parseMessage` switch on `message.type` to handle `'order'` (mirrors how spec 010 added `'nfm_reply'` divergence inside the `'interactive'` branch).
- **`webhooks/handler.ts` dispatch pattern** — extend the `WebhookHandlerCallbacks` interface with `onOrder?: (event: OrderEvent) => void | Promise<void>` and add an `'order'` case to the dispatch switch (mirrors `onFlowCompletion`).
- **Subpath export pattern** — `package.json` `exports['./catalog']` follows the spec 009 pattern verbatim (ESM `import`, CJS `require`, `types`).
- **Lazy unified client getter** — `wa.catalog` follows the same lazy-init pattern as `wa.templates` and `wa.flows` (validate `businessAccountId` on first access, cache the instance).
- **Multi-account broadcast** — already generic; the new send methods drop in as factory targets without any new API surface.

**Rationale**: Consistency reduces consumer learning curve and reuse keeps the codebase small.

---

### 9. ConflictError placement

**Decision**: Add `ConflictError extends WhatsAppError` in `src/errors/errors.ts`. Re-export from `src/errors/index.ts` and the main barrel.

**Rationale**: The SDK doesn't currently have a conflict-shaped error; existing options are `ApiError` (too generic — consumers can't catch a duplicate-retailer-ID specifically) or `ValidationError` (semantically wrong — the value was valid, the conflict is server-side state). A dedicated class keeps the strict-vs-upsert distinction crisp at the catch site:

```ts
try {
  await wa.catalog.createProduct(catalogId, { retailer_id: 'sku-123', ... });
} catch (err) {
  if (err instanceof ConflictError) { /* fall through to update */ }
  else throw err;
}
```

**Alternatives considered**:
- *Use `ApiError` with a `code === 'CONFLICT'` field*: Rejected. Consumers would need string comparison; less type-safe.
- *Use `ValidationError`*: Rejected. Semantically wrong (the input was valid).

**Spec references**: FR-019, Clarifications Q2.

---

## Summary

All open decisions resolved. Constitution check (against CLAUDE.md) passes. No `[NEEDS CLARIFICATION]` items remain. Phase 1 design (data model, contracts, quickstart) can proceed.
