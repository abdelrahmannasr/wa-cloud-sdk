# Contract: `Catalog` class

**Module**: `src/catalog/catalog.ts`
**Subpath import**: `@abdelrahmannasr-wa/cloud-api/catalog`
**Unified-client access**: `wa.catalog`

## Constructor

```ts
new Catalog(client: HttpClient, businessAccountId: string)
```

- Throws `ValidationError` if `businessAccountId` is empty or whitespace-only (FR-022).
- Mirrors `Templates(client, businessAccountId)` and `Flows(client, businessAccountId)`.

## Methods

### `listCatalogs(params?, requestOptions?)`

```ts
listCatalogs(
  params?: { limit?: number; after?: string; before?: string },
  requestOptions?: RequestOptions,
): Promise<ApiResponse<ListCatalogsResponse>>
```

- Maps to `GET /{wabaId}/product_catalogs`.
- Supports cursor pagination (`after`, `before`) and page size (`limit`).
- Returns `{ data: Catalog[], paging? }`.

### `getCatalog(catalogId, fields?, requestOptions?)`

```ts
getCatalog(
  catalogId: string,
  fields?: readonly string[],
  requestOptions?: RequestOptions,
): Promise<ApiResponse<Catalog>>
```

- Maps to `GET /{catalogId}?fields=...`.
- Throws `ValidationError` if `catalogId` is empty.
- `fields` defaults to `['id','name','vertical','product_count']` when omitted.

### `listProducts(catalogId, params?, requestOptions?)`

```ts
listProducts(
  catalogId: string,
  params?: ListProductsParams,
  requestOptions?: RequestOptions,
): Promise<ApiResponse<ListProductsResponse>>
```

- Maps to `GET /{catalogId}/products`.
- Throws `ValidationError` if `catalogId` is empty.
- Cursor pagination identical to `listCatalogs`.

### `getProduct(productId, fields?, requestOptions?)`

```ts
getProduct(
  productId: string,
  fields?: readonly string[],
  requestOptions?: RequestOptions,
): Promise<ApiResponse<Product>>
```

- Maps to `GET /{productId}?fields=...`.
- Note: `productId` is the platform-assigned ID, not `retailer_id`. To look up by retailer ID, use `listProducts` with a filter, or use `upsertProduct` to fetch+update in one call.
- Throws `ValidationError` if `productId` is empty.

### `createProduct(catalogId, request, requestOptions?)`

```ts
createProduct(
  catalogId: string,
  request: CreateProductRequest,
  requestOptions?: RequestOptions,
): Promise<ApiResponse<Product>>
```

- Maps to `POST /{catalogId}/products` (strict-create variant — does NOT include `retailer_id` in the query string upsert form).
- Throws `ValidationError` for client-side rule failures (missing required fields, invalid currency shape, no `image_url` and no `url`).
- Throws `ConflictError` if the platform reports duplicate `retailer_id` (FR-019).
- Throws `ApiError` for other platform failures.
- Implements **strict** semantics: never silently updates an existing product. To handle the conflict path, use `upsertProduct` or catch `ConflictError` explicitly.

### `upsertProduct(catalogId, request, requestOptions?)`

```ts
upsertProduct(
  catalogId: string,
  request: CreateProductRequest,
  requestOptions?: RequestOptions,
): Promise<ApiResponse<Product>>
```

- Maps to `POST /{catalogId}/products?retailer_id={request.retailer_id}` (Meta upsert form).
- Same client-side validation as `createProduct`.
- Returns the resulting product whether created or updated; consumers needing to distinguish should compare with a prior `getProduct` (or accept upsert semantics as opaque).
- Never throws `ConflictError` (the whole point of this method).

### `updateProduct(productId, updates, requestOptions?)`

```ts
updateProduct(
  productId: string,
  updates: UpdateProductRequest,
  requestOptions?: RequestOptions,
): Promise<ApiResponse<Product>>
```

- Maps to `POST /{productId}` with partial body.
- Throws `ValidationError` if `productId` is empty or `updates` is an empty object.
- Per-field validation matches `CreateProductRequest` for any field present.

### `deleteProduct(productId, requestOptions?)`

```ts
deleteProduct(
  productId: string,
  requestOptions?: RequestOptions,
): Promise<ApiResponse<{ success: boolean }>>
```

- Maps to `DELETE /{productId}`.
- Throws `ValidationError` if `productId` is empty.

## Error contract

| Thrown class | Trigger |
|---|---|
| `ValidationError` | Empty `businessAccountId`, empty IDs, missing required fields, invalid currency shape, no image/URL pair, multi-product limit breach (latter from Messages, but documented here for symmetry), empty update payload |
| `ConflictError` | Strict `createProduct` against an existing `retailer_id` |
| `ApiError` | All other platform errors (rate limit, auth, invalid catalog, missing commerce account, etc.) — preserves Meta error code and subcode for consumer branching |
| `RateLimitError`, `AuthenticationError` | Inherited from existing `HttpClient` error mapping |

## Logger contract

Catalog methods MUST NOT log product attribute values (`name`, `description`, `price`, `image_url`) or update payload bodies at any logger level (FR-027). Logging is restricted to method-entry / method-exit signals containing only IDs and outcome status (success/error code).

## Behaviors NOT supported in this release

- Bulk product mutation (deferred per Clarifications Q1).
- Product image hosting (deferred per FR-028 — consumer responsibility).
- Order fulfillment / status APIs (deferred per Clarifications Q3).
- Lookup product by `retailer_id` directly (use `listProducts` + filter, or `upsertProduct`).
