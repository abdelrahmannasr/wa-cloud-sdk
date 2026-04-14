# Phase 1 Data Model: Commerce & Catalogs

**Feature**: 011-commerce-catalogs
**Date**: 2026-04-13
**Input**: `spec.md` (entities) + `research.md` (decisions)

## Purpose

Concrete entity shapes for the commerce feature, expressed as TypeScript interfaces (the project's primary contract language). Every field is annotated with its purpose, source (platform-defined vs. SDK-defined), and whether it is required or optional. Validation rules from the spec are captured inline.

## Entity catalog

### 1. `Catalog`

Catalog metadata returned by `GET /{wabaId}/product_catalogs` and `GET /{catalogId}`.

```ts
export interface Catalog {
  readonly id: string;                          // Platform: catalog ID
  readonly name: string;                        // Consumer-chosen catalog name
  readonly vertical?: string;                   // Platform: catalog vertical (e.g., 'commerce', 'destinations')
  readonly product_count?: number;              // Platform: total products in catalog (when requested via fields)
}
```

**Source**: Platform-defined.
**Relationships**: Many catalogs may belong to one WABA. A catalog holds zero or more `Product`s.

### 2. `ProductAvailability`

```ts
export type ProductAvailability =
  | 'in stock'
  | 'out of stock'
  | 'available for order'
  | 'discontinued';
```

**Source**: Platform-defined enum (Meta Catalog API canonical strings, lowercase with spaces).
**Validation**: Client-side checked against this union before `createProduct` / `upsertProduct` (FR-023).

### 3. `Product`

Product record returned by `GET /{productId}` and `GET /{catalogId}/products`.

```ts
export interface Product {
  readonly id: string;                          // Platform-assigned product ID
  readonly retailer_id: string;                 // Consumer-chosen unique-within-catalog ID
  readonly name: string;
  readonly description?: string;
  readonly price?: number;                      // Integer minor units (e.g., 2999 for $29.99)
  readonly currency?: string;                   // ISO 4217 three-letter code (e.g., 'USD')
  readonly availability?: ProductAvailability;
  readonly image_url?: string;                  // Consumer-hosted public HTTPS URL
  readonly url?: string;                        // Consumer's product page URL
  readonly category?: string;
  readonly brand?: string;
  readonly condition?: 'new' | 'refurbished' | 'used';
  readonly visibility?: 'published' | 'staging';
  readonly review_status?: string;              // Platform-assigned moderation outcome
}
```

**Source**: Platform-defined; consumer-supplied at create/update time.
**Relationships**: Many products belong to one catalog. Identified by `retailer_id` from the consumer's perspective; platform also assigns its own `id`.
**Validation**: Required at create-time: `retailer_id`, `name`, plus at least one of `image_url` or `url` (Meta requirement). `currency` MUST match `/^[A-Z]{3}$/` if supplied. `price` MUST be a non-negative integer if supplied.

### 4. `CreateProductRequest`

Request body for `createProduct` and `upsertProduct`.

```ts
export interface CreateProductRequest {
  readonly retailer_id: string;                 // Required
  readonly name: string;                        // Required
  readonly description?: string;
  readonly price?: number;                      // Integer minor units
  readonly currency?: string;                   // ISO 4217
  readonly availability?: ProductAvailability;
  readonly image_url?: string;                  // Required if `url` not provided
  readonly url?: string;                        // Required if `image_url` not provided
  readonly category?: string;
  readonly brand?: string;
  readonly condition?: 'new' | 'refurbished' | 'used';
  readonly visibility?: 'published' | 'staging';
}
```

**Validation rules** (client-side, throw `ValidationError`):
- `retailer_id` non-empty after trim
- `name` non-empty after trim
- At least one of `image_url` / `url` present
- `currency` matches `/^[A-Z]{3}$/` if provided
- `price` is a non-negative integer if provided

### 5. `UpdateProductRequest`

Partial update payload for `updateProduct`.

```ts
export interface UpdateProductRequest {
  readonly name?: string;
  readonly description?: string;
  readonly price?: number;
  readonly currency?: string;
  readonly availability?: ProductAvailability;
  readonly image_url?: string;
  readonly url?: string;
  readonly category?: string;
  readonly brand?: string;
  readonly condition?: 'new' | 'refurbished' | 'used';
  readonly visibility?: 'published' | 'staging';
}
```

**Validation rules** (client-side):
- Object must contain at least one field (no empty updates)
- Same field-level shape rules as `CreateProductRequest` for any field present

**Note**: The `retailer_id` cannot be changed; it is the addressing key. To "rename" a product's retailer ID, delete and re-create.

### 6. `ListProductsParams`

```ts
export interface ListProductsParams {
  readonly limit?: number;                      // Page size; platform default applies if omitted
  readonly after?: string;                      // Pagination cursor
  readonly before?: string;                     // Pagination cursor
  readonly fields?: readonly string[];          // Subset of Product fields to return
}
```

### 7. `ListProductsResponse`

```ts
export interface ListProductsResponse {
  readonly data: readonly Product[];
  readonly paging?: {
    readonly cursors?: { readonly before?: string; readonly after?: string };
    readonly next?: string;
    readonly previous?: string;
  };
}
```

### 8. `ListCatalogsResponse`

```ts
export interface ListCatalogsResponse {
  readonly data: readonly Catalog[];
  readonly paging?: ListProductsResponse['paging'];
}
```

### 9. `ProductSection` (for multi-product send)

```ts
export interface ProductSection {
  readonly title: string;                       // Section header (≤ 24 chars per Meta)
  readonly product_items: readonly { readonly product_retailer_id: string }[];
}
```

**Validation rules**:
- `title` non-empty, ≤ 24 chars
- `product_items` length ≥ 1

### 10. `ProductMessageOptions` (Messages.sendProduct)

```ts
export interface ProductMessageOptions {
  readonly to: string;                          // E.164 recipient
  readonly catalogId: string;                   // Required
  readonly productRetailerId: string;           // Required
  readonly body?: string;                       // Optional accompanying body text
  readonly footer?: string;                     // Optional footer text
  readonly context?: { readonly message_id: string };  // Quoted-reply reference
}
```

### 11. `ProductListMessageOptions` (Messages.sendProductList)

```ts
export interface ProductListMessageOptions {
  readonly to: string;
  readonly catalogId: string;
  readonly header: string;                      // Required text header
  readonly body: string;                        // Required body
  readonly footer?: string;
  readonly sections: readonly ProductSection[]; // Required, ≥ 1
  readonly context?: { readonly message_id: string };
}
```

**Client-side validation** (throw `ValidationError` before API call, FR-006):
- `sections.length` ≥ 1 and ≤ 10
- Total product items across all sections ≥ 1 and ≤ 30
- Each section passes `ProductSection` validation

### 12. `CatalogMessageOptions` (Messages.sendCatalogMessage)

```ts
export interface CatalogMessageOptions {
  readonly to: string;
  readonly body: string;                        // Required
  readonly footer?: string;
  readonly thumbnailProductRetailerId?: string; // Optional thumbnail
  readonly context?: { readonly message_id: string };
}
```

### 13. `OrderItem`

Single line item inside an incoming order. **Canonical home**: `src/webhooks/types.ts` (US3 owns the type). The catalog module does not define or re-export it.

```ts
export interface OrderItem {
  readonly product_retailer_id: string;
  readonly quantity: number;
  readonly item_price: number;                  // Integer minor units
  readonly currency: string;                    // ISO 4217
}
```

**Source**: Platform-defined (Meta webhook payload).

### 14. `WebhookOrderPayload`

Raw order payload as it arrives in the webhook.

```ts
export interface WebhookOrderPayload {
  readonly catalog_id: string;
  readonly product_items: readonly OrderItem[];
  readonly text?: string;                       // Optional accompanying message from the customer
}
```

### 15. `OrderEvent`

Dedicated typed event surfaced to the consumer's `onOrder` callback.

```ts
export interface OrderEvent {
  readonly type: 'order';
  readonly messageId: string;                   // Stable platform identifier (use for dedup)
  readonly from: string;                        // E.164 sender
  readonly timestamp: string;                   // ISO 8601 from platform
  readonly contact?: WebhookContact;            // Existing shape from webhooks/types.ts
  readonly catalogId: string;
  readonly items: readonly OrderItem[];         // Parsed best-effort; empty array if payload malformed
  readonly text?: string;                       // Customer's accompanying message
  readonly raw: string;                         // Original JSON-stringified payload (for consumer-side verification / storage)
  readonly metadata: WebhookMetadata;           // Existing shape (display_phone_number, phone_number_id)
}
```

**Source**: SDK-defined wrapper around platform payload.
**Routing**: Surfaces ONLY through `onOrder` callback. The general `onMessage` callback MUST NOT receive order events (FR-013).
**Failure mode**: When `WebhookOrderPayload.product_items` is malformed, `items` is `[]` and `raw` preserves the original payload (FR-014).

### 16. Public constants

`MULTI_PRODUCT_LIMITS` is owned by the messages module (used by `sendProductList` validation, no catalog dependency):

```ts
// src/messages/types.ts
export const MULTI_PRODUCT_LIMITS = {
  MAX_SECTIONS: 10,
  MAX_TOTAL_ITEMS: 30,
  MAX_SECTION_TITLE_LENGTH: 24,
} as const;
```

`CATALOG_VALIDATION` is owned by the catalog module (used by `createProduct` / `upsertProduct` validation):

```ts
// src/catalog/types.ts
export const CATALOG_VALIDATION = {
  CURRENCY_PATTERN: /^[A-Z]{3}$/,
} as const;
```

**Source**: Platform-defined constraints, surfaced for consumer reference and used by client-side validators. The split keeps US1–US4 file-disjoint from `src/catalog/`.

### 17. New error class

```ts
export class ConflictError extends WhatsAppError {
  readonly code = 'CONFLICT';
  constructor(message: string, readonly resource?: string) {
    super(message);
    this.name = 'ConflictError';
  }
}
```

**Source**: SDK-defined. Thrown by `createProduct` (strict path) when the platform reports a duplicate retailer ID.

## State transitions

Products do not have an SDK-modeled lifecycle (`visibility` and `review_status` are platform-managed strings; the SDK passes them through). Orders are immutable events (no state transition; consumers acknowledge orders via outbound messages, but that's their state, not the order's).

## Cross-references to spec

| Spec reference | Data model element |
|---|---|
| FR-001, US1 | `ProductMessageOptions`, `Messages.sendProduct` |
| FR-004, FR-006, US2 | `ProductListMessageOptions`, `ProductSection`, `MULTI_PRODUCT_LIMITS` |
| FR-007, US4 | `CatalogMessageOptions` |
| FR-010 through FR-015, US3 | `OrderEvent`, `WebhookOrderPayload`, `OrderItem` |
| FR-016, FR-017, US5 | `Catalog`, `Product`, `ListCatalogsResponse`, `ListProductsResponse`, `ListProductsParams` |
| FR-019, FR-019a, US5 | `CreateProductRequest`, `ConflictError` |
| FR-020, US5 | `UpdateProductRequest` |
| FR-023 | Validation rules on `CreateProductRequest`, `UpdateProductRequest`, `ProductSection`, `ProductListMessageOptions` |
| FR-028 | No `image_url` upload helper; `image_url` is opaque consumer-supplied string |
