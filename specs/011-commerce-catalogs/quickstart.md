# Quickstart: Commerce & Catalogs

**Feature**: 011-commerce-catalogs
**Audience**: SDK consumers — developers integrating the `@abdelrahmannasr-wa/cloud-api` package into their own application or platform.

This guide shows how to use every capability the Commerce module ships with, in the order a consumer is likely to need them. Each section is runnable as-is once you have a WhatsApp Business Account, a phone number ID, an access token, and a connected commerce catalog.

## Prerequisites

```bash
pnpm add @abdelrahmannasr-wa/cloud-api
# or
npm install @abdelrahmannasr-wa/cloud-api
```

- Node.js 18+
- A WhatsApp Business Account (WABA) ID for catalog management
- A phone number ID for sending commerce messages
- An access token with `whatsapp_business_management`, `whatsapp_business_messaging`, and `catalog_management` scopes
- A commerce account / catalog already connected to your WABA (one-time setup in Meta Commerce Manager — outside the SDK)
- For receiving order webhooks: configured webhook with `appSecret` and `verifyToken`
- For product image hosting: a publicly accessible HTTPS URL for each product image (the SDK does not host images)

## 1. List your catalogs

```ts
import { WhatsApp } from '@abdelrahmannasr-wa/cloud-api';

const wa = new WhatsApp({
  accessToken: process.env.WA_ACCESS_TOKEN!,
  phoneNumberId: process.env.WA_PHONE_NUMBER_ID!,
  businessAccountId: process.env.WA_WABA_ID!,
});

const { data } = await wa.catalog.listCatalogs();
console.log(data.data); // [{ id, name, vertical?, product_count? }, ...]
```

## 2. Send a single product

The most common entry point: surface one product from your catalog inside a chat.

```ts
await wa.messages.sendProduct({
  to: '15551234567',
  catalogId: '1234567890',
  productRetailerId: 'sku-blue-shirt-m',
  body: 'Thanks for asking! Here it is — still 20% off this week.',
  footer: 'Free shipping on orders over $50',
});
```

The recipient sees a rich product card with image, name, price, and an "Add to cart" affordance.

## 3. Send a curated list of products

Group up to 30 products into up to 10 sections.

```ts
await wa.messages.sendProductList({
  to: '15551234567',
  catalogId: '1234567890',
  header: 'Recommended for you',
  body: 'Based on your recent browse',
  footer: 'Tap any item to add to cart',
  sections: [
    {
      title: 'Tops',
      product_items: [
        { product_retailer_id: 'sku-blue-shirt-m' },
        { product_retailer_id: 'sku-grey-tee-m' },
      ],
    },
    {
      title: 'Accessories',
      product_items: [
        { product_retailer_id: 'sku-belt-leather' },
      ],
    },
  ],
});
```

The SDK validates limits client-side — you'll get a `ValidationError` before hitting the network if you exceed 30 items or 10 sections.

## 4. Send a "browse the catalog" invitation

For when you don't have a curated set in mind.

```ts
await wa.messages.sendCatalogMessage({
  to: '15551234567',
  body: 'Have a look around — new arrivals in this week!',
  footer: 'Free returns within 30 days',
  thumbnailProductRetailerId: 'sku-featured-jacket', // optional pinned thumbnail
});
```

## 5. Reply to a product question with a quoted product

Use the existing `context.message_id` field that all send methods now support:

```ts
await wa.messages.sendProduct({
  to: '15551234567',
  catalogId: '1234567890',
  productRetailerId: 'sku-blue-shirt-m',
  body: 'Yes — this one is in stock in your size!',
  context: { message_id: incomingMessageId },
});
```

## 6. Receive an order

```ts
import { WhatsApp } from '@abdelrahmannasr-wa/cloud-api';

const wa = new WhatsApp({ /* config */ });

wa.webhooks.onOrder(async (event) => {
  // event.messageId — use this for idempotency in your DB
  // event.from — recipient's E.164 phone
  // event.catalogId — catalog the order was placed against
  // event.items — [{ product_retailer_id, quantity, item_price, currency }, ...]
  // event.text — optional message the customer sent with the order
  // event.raw — original JSON payload (preserve for verification or storage)

  await myDb.recordOrder({
    idempotencyKey: event.messageId,
    customer: event.from,
    catalogId: event.catalogId,
    lines: event.items,
  });

  // Acknowledge with a regular text reply (dedicated order-status messages
  // are not in this release — see "Limitations" below).
  await wa.messages.sendText({
    to: event.from,
    body: `Got it! Your order is being processed.`,
    context: { message_id: event.messageId },
  });
});

// Mount the handler in Express:
app.use('/webhook', wa.webhooks.express());
```

**Important**: Meta delivers webhooks at-least-once. If your handler returns an error or times out, the same `OrderEvent` may arrive again. Use `event.messageId` as a dedup key in your persistence layer — the SDK does NOT deduplicate.

## 7. Manage your product catalog from code

### List products

```ts
const { data } = await wa.catalog.listProducts(catalogId, { limit: 50 });
console.log(data.data); // Product[]

// Paginate:
let cursor = data.paging?.cursors?.after;
while (cursor) {
  const next = await wa.catalog.listProducts(catalogId, { limit: 50, after: cursor });
  // process next.data.data
  cursor = next.data.paging?.cursors?.after;
}
```

### Looking up by retailer ID

`getProduct(productId)` takes the **platform-assigned** product ID, not your `retailer_id`. The SDK does not provide a direct retailer-ID lookup — this is intentional, because the platform endpoints don't accept retailer IDs as path parameters. Two pragmatic patterns:

```ts
// Option 1: list + filter (when you don't already have the platform ID cached)
const { data } = await wa.catalog.listProducts(catalogId, { limit: 100 });
const product = data.data.find(p => p.retailer_id === 'sku-blue-shirt-m');

// Option 2: upsertProduct as fetch-or-create (when you intend to mutate anyway)
const { data: product } = await wa.catalog.upsertProduct(catalogId, {
  retailer_id: 'sku-blue-shirt-m',
  name: 'Blue Shirt (Medium)',
  // ...all other required fields
});
```

For high-volume integrations, cache the `retailer_id → platform id` mapping in your own store after the first list.

### Strict create (fails on duplicate retailer ID)

```ts
import { ConflictError } from '@abdelrahmannasr-wa/cloud-api';

try {
  const created = await wa.catalog.createProduct(catalogId, {
    retailer_id: 'sku-blue-shirt-m',
    name: 'Blue Shirt (Medium)',
    description: 'Classic cotton, slim fit',
    price: 2999,        // integer minor units = $29.99
    currency: 'USD',
    availability: 'in stock',
    image_url: 'https://cdn.example.com/products/blue-shirt-m.jpg',
    url: 'https://example.com/products/blue-shirt-m',
  });
} catch (err) {
  if (err instanceof ConflictError) {
    // sku-blue-shirt-m already exists; decide whether to upsert instead
  } else {
    throw err;
  }
}
```

### Upsert (create or update by retailer ID)

The "I have a list of N products and want them in the catalog" use case:

```ts
for (const product of myProducts) {
  await wa.catalog.upsertProduct(catalogId, {
    retailer_id: product.sku,
    name: product.name,
    price: Math.round(product.priceUsd * 100),
    currency: 'USD',
    availability: product.inStock ? 'in stock' : 'out of stock',
    image_url: product.imageUrl,
  });
}
// Existing products with matching retailer_id are updated in place;
// new retailer_ids are created. Pacing is handled by the SDK's rate limiter.
```

### Update one field by platform product ID

```ts
await wa.catalog.updateProduct(productId, {
  price: 2499,             // 20% off
  availability: 'in stock',
});
```

### Delete

```ts
await wa.catalog.deleteProduct(productId);
```

## 8. Multi-account broadcast

Same API surface as the existing broadcast — the new send methods drop in as factory targets.

```ts
import { WhatsAppMultiAccount } from '@abdelrahmannasr-wa/cloud-api/multi-account';

const multi = new WhatsAppMultiAccount({ /* accounts config */ });

// Catalog IDs are scoped to a single WABA — keep a per-account map:
const catalogIdMap: Record<string, string> = {
  us: 'us_catalog_id',
  eu: 'eu_catalog_id',
};

await multi.broadcast(recipients, (account, recipient) => {
  return account.messages.sendProduct({
    to: recipient,
    catalogId: catalogIdMap[account.name],
    productRetailerId: 'sku-blue-shirt-m',
    body: 'Limited offer for you',
  });
});
```

## 9. Subpath import (smaller bundle)

If you only need commerce, import directly from the subpath to skip the rest of the SDK:

```ts
import { Catalog, type OrderEvent } from '@abdelrahmannasr-wa/cloud-api/catalog';
import { HttpClient } from '@abdelrahmannasr-wa/cloud-api/client';

const client = new HttpClient({ accessToken: '...', phoneNumberId: '...' });
const catalog = new Catalog(client, 'YOUR_WABA_ID');
```

## Limitations in this release (v0.4.0)

- **No bulk catalog mutation endpoint**. Compose `upsertProduct` calls in a loop or `Promise.all`; the SDK's rate limiter handles pacing.
- **No outbound order-status / acknowledgement message types**. Reply to orders with `sendText` (or any existing message type). Dedicated order-status messages are planned for a future release.
- **No image hosting**. Provide a publicly accessible HTTPS `image_url` for each product. Use your own CDN, S3, R2, or any image host.
- **No SDK-side deduplication of order webhook events**. Use `event.messageId` for idempotency in your own persistence layer.
- **No SDK logging of product attributes or order line items**. The SDK is intentionally silent about commerce data at every logger level — log explicitly from your own handlers when you need it.

## Errors you may encounter

| Error class | When |
|---|---|
| `ValidationError` | Empty IDs, missing required product attributes, invalid currency code shape, multi-product limits exceeded, missing `businessAccountId` for catalog operations |
| `ConflictError` | Strict `createProduct` against an existing retailer ID — catch and decide whether to switch to `upsertProduct` |
| `ApiError` | Platform errors — invalid catalog/product reference, missing commerce account on WABA, account restricted; check `.errorType` and `.errorSubcode` to branch |
| `RateLimitError` | You've exceeded the platform rate limit; the SDK already retries with backoff, so receiving this means retries are also exhausted |
| `AuthenticationError` | Access token missing the required scope; ensure `catalog_management` is granted |

## Where to go next

- Full API contracts: see `contracts/catalog-class.md`, `contracts/send-commerce.md`, `contracts/webhook-events.md`, `contracts/public-exports.md` in the spec directory.
- Data shapes: `data-model.md` lists every TypeScript interface in the new module.
- Full feature spec with acceptance scenarios: `spec.md`.
