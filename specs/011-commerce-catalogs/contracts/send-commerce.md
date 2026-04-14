# Contract: Commerce send methods on `Messages`

**Module**: `src/messages/messages.ts` (extended)
**Subpath import**: `@abdelrahmannasr-wa/cloud-api/messages` (existing, unchanged path)
**Unified-client access**: `wa.messages`

Three new methods are added to the existing `Messages` class. None of them require additional constructor arguments; they reuse the already-injected `HttpClient` and `phoneNumberId`.

## `sendProduct(options, requestOptions?)`

```ts
sendProduct(
  options: ProductMessageOptions,
  requestOptions?: RequestOptions,
): Promise<ApiResponse<MessageResponse>>
```

**Maps to**: `POST /{phoneNumberId}/messages` with body:
```json
{
  "messaging_product": "whatsapp",
  "to": "{options.to}",
  "type": "interactive",
  "context": { "message_id": "..." },          // present iff options.context provided
  "interactive": {
    "type": "product",
    "body": { "text": "{options.body}" },       // present iff options.body provided
    "footer": { "text": "{options.footer}" },   // present iff options.footer provided
    "action": {
      "catalog_id": "{options.catalogId}",
      "product_retailer_id": "{options.productRetailerId}"
    }
  }
}
```

**Validation** (client-side, throws `ValidationError`):
- `to` matches E.164 (existing helper)
- `catalogId` non-empty after trim
- `productRetailerId` non-empty after trim

**Errors**:
- `ValidationError` for client-side rule failures
- `ApiError` for platform errors (invalid product reference, missing commerce account)
- `RateLimitError`, `AuthenticationError` from `HttpClient`

## `sendProductList(options, requestOptions?)`

```ts
sendProductList(
  options: ProductListMessageOptions,
  requestOptions?: RequestOptions,
): Promise<ApiResponse<MessageResponse>>
```

**Maps to**: `POST /{phoneNumberId}/messages` with body:
```json
{
  "messaging_product": "whatsapp",
  "to": "{options.to}",
  "type": "interactive",
  "context": { "message_id": "..." },
  "interactive": {
    "type": "product_list",
    "header": { "type": "text", "text": "{options.header}" },
    "body": { "text": "{options.body}" },
    "footer": { "text": "{options.footer}" },
    "action": {
      "catalog_id": "{options.catalogId}",
      "sections": [
        { "title": "...", "product_items": [{ "product_retailer_id": "..." }, ...] },
        ...
      ]
    }
  }
}
```

**Validation** (client-side, throws `ValidationError` BEFORE network call — FR-006):
- `to` matches E.164
- `catalogId` non-empty
- `header` non-empty (Meta requires text header)
- `body` non-empty
- `sections.length` ≥ 1 and ≤ `MULTI_PRODUCT_LIMITS.MAX_SECTIONS` (10)
- Total `product_items` count across all sections ≥ 1 and ≤ `MULTI_PRODUCT_LIMITS.MAX_TOTAL_ITEMS` (30)
- Each section's `title` is non-empty and ≤ `MULTI_PRODUCT_LIMITS.MAX_SECTION_TITLE_LENGTH` (24)
- Each `product_items` array is non-empty
- Each `product_retailer_id` is non-empty

The `ValidationError` message MUST identify which limit was breached so consumers can act programmatically.

**Errors**: same as `sendProduct`.

## `sendCatalogMessage(options, requestOptions?)`

```ts
sendCatalogMessage(
  options: CatalogMessageOptions,
  requestOptions?: RequestOptions,
): Promise<ApiResponse<MessageResponse>>
```

**Maps to**: `POST /{phoneNumberId}/messages` with body:
```json
{
  "messaging_product": "whatsapp",
  "to": "{options.to}",
  "type": "interactive",
  "context": { "message_id": "..." },
  "interactive": {
    "type": "catalog_message",
    "body": { "text": "{options.body}" },
    "footer": { "text": "{options.footer}" },
    "action": {
      "name": "catalog_message",
      "parameters": {                                                // present iff thumbnailProductRetailerId provided
        "thumbnail_product_retailer_id": "{options.thumbnailProductRetailerId}"
      }
    }
  }
}
```

**Validation** (client-side, throws `ValidationError`):
- `to` matches E.164
- `body` non-empty (Meta requires body)
- `thumbnailProductRetailerId`, if present, is non-empty

**Errors**: same as `sendProduct`. Additionally, if the WABA does not have a connected commerce account / catalog, the platform returns an error that surfaces as `ApiError` — consumers branch on the Meta subcode to detect the precondition (FR-009 indirectly via Edge Cases bullet).

## Multi-account broadcast

All three methods are valid factory targets for `WhatsAppMultiAccount.broadcast`. Example:

```ts
await wa.broadcast(recipients, (account, recipient) => {
  return account.messages.sendProduct({
    to: recipient,
    catalogId: catalogIdMap[account.name],         // per-account mapping
    productRetailerId: 'sku-123',
    body: 'Limited offer for you',
  });
});
```

Documented constraint (FR-009, US1 acceptance scenario 5): catalog IDs are scoped to a single business account, so consumers MUST maintain a per-account `catalogId` mapping when broadcasting "the same conceptual product" across accounts.

## Logger contract

These methods MUST NOT log option bodies (`body`, `footer`, `header`), product retailer IDs (acceptable to log catalog ID but not item identifiers), or any product attribute pulled from the catalog (FR-027). Logging is restricted to method-entry / method-exit signals containing only `to` (recipient phone), `type` (single/list/catalog), and outcome status.

## Behaviors NOT supported in this release

- `sendOrderStatusMessage` and order acknowledgement messages (deferred per Clarifications Q3).
- Header media types (image/video/document) on `sendProduct` and `sendCatalogMessage` (Meta does not support these for the product / catalog_message types).
