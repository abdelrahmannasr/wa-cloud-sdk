# Contract: `OrderEvent` webhook event

**Module**: `src/webhooks/types.ts`, `src/webhooks/parser.ts`, `src/webhooks/handler.ts`
**Subpath import**: `@abdelrahmannasr-wa/cloud-api/webhooks`
**Unified-client access**: `wa.webhooks.onOrder(callback)`

## Event shape

```ts
export interface OrderEvent {
  readonly type: 'order';
  readonly messageId: string;                   // Stable platform identifier — consumers use this for idempotency
  readonly from: string;                        // E.164 sender phone number
  readonly timestamp: string;                   // ISO 8601, from platform
  readonly contact?: WebhookContact;            // Existing shape: { profile: { name }, wa_id }
  readonly catalogId: string;                   // Catalog the order was placed against
  readonly items: readonly OrderItem[];         // Best-effort parsed; empty array if payload malformed
  readonly text?: string;                       // Optional accompanying message from the customer
  readonly raw: string;                         // Original JSON-stringified order payload (for verification, storage, custom parsing)
  readonly metadata: WebhookMetadata;           // Existing shape: { display_phone_number, phone_number_id }
}
```

`OrderItem`:

```ts
export interface OrderItem {
  readonly product_retailer_id: string;
  readonly quantity: number;
  readonly item_price: number;        // Integer minor units (e.g., 2999 for $29.99)
  readonly currency: string;          // ISO 4217 three-letter code
}
```

## Parsing behavior

The parser scans `entry[].changes[].value.messages[]` for entries with `type: 'order'`. For each match it:

1. Extracts `messages[i].id` → `messageId`.
2. Extracts `messages[i].from` → `from`.
3. Extracts `messages[i].timestamp` → `timestamp`.
4. Extracts `messages[i].order.catalog_id` → `catalogId`.
5. Extracts `messages[i].order.text` → `text` (if present).
6. JSON-stringifies `messages[i].order` → `raw` (preserves the entire original payload, including any platform fields the SDK does not yet model).
7. Best-effort parses `messages[i].order.product_items` into `OrderItem[]`. If the array is missing, malformed, or any item is missing required fields, `items` is set to `[]` — the event still surfaces (FR-014).
8. Resolves `contact` from `entry[].changes[].value.contacts[]` using `wa_id` matching `from`.
9. Resolves `metadata` from `entry[].changes[].value.metadata`.

## Routing isolation

The parser MUST NOT also surface order-typed messages through the generic `MessageEvent` path. The dispatch switch in `handler.ts` adds an explicit `'order'` branch that calls `onOrder` and returns, mirroring the `'flow_completion'` branch.

Consumers registering only `onMessage` will NOT receive order events. This is intentional (FR-013) and is verified by a dedicated test that registers both callbacks, fires an order-only payload, and asserts `onMessage` was never invoked.

## Callback registration

Two equivalent registration paths:

**Standalone `createWebhookHandler`**:

```ts
import { createWebhookHandler } from '@abdelrahmannasr-wa/cloud-api/webhooks';

const handler = createWebhookHandler({
  appSecret: process.env.WA_APP_SECRET!,
  verifyToken: process.env.WA_VERIFY_TOKEN!,
  callbacks: {
    onOrder: async (event) => { /* fulfill order */ },
    onMessage: async (event) => { /* regular text/buttons/list */ },
  },
});
```

**Unified client `wa.webhooks`**:

```ts
wa.webhooks.onOrder(async (event) => { /* ... */ });
```

The `Webhooks` wrapper class lazily constructs the handler on first registration; `onOrder` follows the same pattern as `onMessage`, `onStatus`, `onFlowCompletion`.

## Deduplication

The SDK does NOT deduplicate order events (FR-015). Each delivery attempt by the platform's at-least-once retry surfaces as a separate `OrderEvent` with the same `messageId`. Consumers MUST implement idempotency in their own persistence layer using `messageId` as the dedup key.

## Logger contract

The parser and handler MUST NOT log `OrderEvent.items` or `OrderEvent.raw` at any logger level (FR-027). Logging is restricted to a single info-level entry per parsed event with `messageId` and `from` only.

## Test coverage

| Scenario | Asserts |
|---|---|
| Well-formed order payload with one item | Surfaces as `OrderEvent` with parsed `items[0]`, `raw` preserved |
| Well-formed order payload with multiple items | All items parsed in order |
| Order with `text` field | `text` present on event |
| Malformed `product_items` (missing required field) | Event still surfaces, `items` is `[]`, `raw` preserved |
| Order event registered with `onOrder` AND `onMessage` | `onMessage` is NOT called for the order |
| Order event with no callback registered | No throw; logged at debug only with `messageId` |
| Mixed batch (one order + one text message) | `onOrder` fires once, `onMessage` fires once, no cross-talk |
| Webhook signature failure | Existing rejection path; no callback fires |
