# @abdelrahmannasr-wa/cloud-api

[![npm version](https://img.shields.io/npm/v/@abdelrahmannasr-wa/cloud-api.svg)](https://www.npmjs.com/package/@abdelrahmannasr-wa/cloud-api)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js >= 18](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

## Overview

A comprehensive, zero-dependency, type-safe TypeScript SDK for the Meta WhatsApp Cloud API. Built for Node.js 18+, this SDK provides a unified client interface for sending messages, managing media, creating templates, handling webhooks, managing phone numbers, and coordinating multiple WhatsApp Business Accounts (WABAs). Perfect for building WhatsApp integrations, chatbots, and campaign systems.

## Features

- **Messages** — Send text, media (images, videos, audio, documents, stickers), locations, contacts, reactions, interactive buttons/lists, and templates
- **Media** — Upload, download, retrieve URLs, and delete media assets with client-side validation
- **Templates** — Create, list, update, and delete message templates with a fluent TemplateBuilder API
- **Flows** — Create, publish, update, deprecate, and delete WhatsApp Flows; send flow messages; receive flow completions as typed events
- **Webhooks** — Parse incoming events (including flow completions), verify signatures, and integrate with Express or Next.js App Router
- **Phone Numbers** — List, manage business profiles, request verification codes, and register/deregister numbers
- **Multi-Account** — Manage multiple WABAs with distribution strategies (round-robin, weighted, sticky), broadcast messaging with concurrency control, and dynamic account management

## Installation

```bash
# npm
npm install @abdelrahmannasr-wa/cloud-api

# pnpm
pnpm add @abdelrahmannasr-wa/cloud-api

# yarn
yarn add @abdelrahmannasr-wa/cloud-api
```

## Quick Start

```typescript
import { WhatsApp } from '@abdelrahmannasr-wa/cloud-api';

// Initialize the client
const wa = new WhatsApp({
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
});

// Send a text message
try {
  const result = await wa.messages.sendText({
    to: '1234567890',
    body: 'Hello from WhatsApp Cloud API!',
  });

  console.log('Message sent:', result.data.messages[0].id);
} catch (error) {
  // See Error Handling section for typed error handling patterns
  console.error('Failed to send message:', error);
}

// Clean up
wa.destroy();
```

## Configuration

The `WhatsApp` client accepts a configuration object with the following options:

| Option                       | Type      | Required | Default                        | Description                                           |
| ---------------------------- | --------- | -------- | ------------------------------ | ----------------------------------------------------- |
| `accessToken`                | `string`  | Yes      | —                              | Meta access token for authentication                  |
| `phoneNumberId`              | `string`  | Yes      | —                              | WhatsApp phone number ID                              |
| `businessAccountId`          | `string`  | No       | —                              | WhatsApp Business Account ID (required for templates) |
| `apiVersion`                 | `string`  | No       | `'v21.0'`                      | Graph API version                                     |
| `baseUrl`                    | `string`  | No       | `'https://graph.facebook.com'` | API base URL                                          |
| `logger`                     | `Logger`  | No       | —                              | Custom logger instance                                |
| `rateLimitConfig.maxTokens`  | `number`  | No       | `80`                           | Max tokens in bucket                                  |
| `rateLimitConfig.refillRate` | `number`  | No       | `80`                           | Tokens refilled per second                            |
| `rateLimitConfig.enabled`    | `boolean` | No       | `true`                         | Enable/disable rate limiting                          |
| `retryConfig.maxRetries`     | `number`  | No       | `3`                            | Maximum retry attempts                                |
| `retryConfig.baseDelayMs`    | `number`  | No       | `1000`                         | Base delay between retries (ms)                       |
| `retryConfig.maxDelayMs`     | `number`  | No       | `30000`                        | Maximum delay cap (ms)                                |
| `retryConfig.jitterFactor`   | `number`  | No       | `0.2`                          | Jitter randomization factor (0-1)                     |
| `timeoutMs`                  | `number`  | No       | `30000`                        | Request timeout in milliseconds                       |
| `appSecret`                  | `string`  | No       | —                              | App secret for webhook signature verification         |
| `webhookVerifyToken`         | `string`  | No       | —                              | Webhook verify token                                  |

## Messages

Send various types of messages using the `messages` module:

```typescript
// Text message
await wa.messages.sendText({
  to: '1234567890',
  body: 'Hello! 👋',
  previewUrl: true, // Enable URL preview
});

// Image message
await wa.messages.sendImage({
  to: '1234567890',
  media: { link: 'https://example.com/image.jpg' },
  caption: 'Check out this image!',
});

// Template message
await wa.messages.sendTemplate({
  to: '1234567890',
  templateName: 'hello_world',
  language: 'en_US',
});

// Interactive buttons
await wa.messages.sendInteractiveButtons({
  to: '1234567890',
  body: 'Choose an option:',
  buttons: [
    { type: 'reply', reply: { id: 'btn1', title: 'Option 1' } },
    { type: 'reply', reply: { id: 'btn2', title: 'Option 2' } },
  ],
});

// Mark message as read
await wa.messages.markAsRead({
  messageId: 'wamid.ABC123...',
});
```

Additional message types:

```typescript
// Video message
await wa.messages.sendVideo({
  to: '1234567890',
  media: { id: 'media_id_123' },
  caption: 'Watch this video',
});

// Audio message
await wa.messages.sendAudio({
  to: '1234567890',
  media: { link: 'https://example.com/audio.mp3' },
});

// Document message
await wa.messages.sendDocument({
  to: '1234567890',
  media: { link: 'https://example.com/report.pdf' },
  filename: 'report.pdf',
  caption: 'Monthly report',
});

// Sticker message
await wa.messages.sendSticker({
  to: '1234567890',
  media: { id: 'sticker_media_id' },
});

// Location message
await wa.messages.sendLocation({
  to: '1234567890',
  longitude: -122.4194,
  latitude: 37.7749,
  name: 'San Francisco',
  address: 'San Francisco, CA',
});

// Contacts message
await wa.messages.sendContacts({
  to: '1234567890',
  contacts: [
    {
      name: { formatted_name: 'Jane Doe' },
      phones: [{ phone: '+0987654321', type: 'WORK' }],
    },
  ],
});

// Reaction (emoji react to an existing message)
await wa.messages.sendReaction({
  to: '1234567890',
  messageId: 'wamid.ABC123...',
  emoji: '\u{1F44D}', // Use empty string to remove reaction
});

// Interactive list message
await wa.messages.sendInteractiveList({
  to: '1234567890',
  body: 'Select a product:',
  buttonText: 'View options',
  sections: [
    {
      title: 'Products',
      rows: [
        { id: 'p1', title: 'Widget', description: 'A useful widget' },
        { id: 'p2', title: 'Gadget', description: 'A fancy gadget' },
      ],
    },
  ],
  header: 'Our Catalog',
  footer: 'Reply STOP to opt out',
});
```

## Media

Upload, download, and manage media files:

```typescript
import { readFileSync } from 'fs';

// Upload media
const uploadResult = await wa.media.upload({
  file: readFileSync('./image.jpg'),
  mimeType: 'image/jpeg',
  category: 'image',
  filename: 'image.jpg',
});

const mediaId = uploadResult.data.id;

// Get media URL
const urlResult = await wa.media.getUrl(mediaId);
console.log('Download URL:', urlResult.data.url);

// Download media
const downloadResult = await wa.media.download(urlResult.data.url);
const buffer = Buffer.from(downloadResult.data);

// Delete media
await wa.media.delete(mediaId);
```

### Supported Media Types

The SDK validates MIME types and file sizes client-side before uploading:

| Category             | MIME Types                                                                   | Max Size |
| -------------------- | ---------------------------------------------------------------------------- | -------- |
| `image`              | `image/jpeg`, `image/png`                                                    | 5 MB     |
| `video`              | `video/mp4`, `video/3gpp`                                                    | 16 MB    |
| `audio`              | `audio/aac`, `audio/mp4`, `audio/mpeg`, `audio/amr`, `audio/ogg`             | 16 MB    |
| `document`           | `application/pdf`, `text/plain`, `text/csv`, MS Office, OpenDocument formats | 100 MB   |
| `sticker` (static)   | `image/webp`                                                                 | 500 KB   |
| `sticker` (animated) | `image/webp`                                                                 | 1 MB     |

```typescript
// Upload a sticker (stickerType is required for stickers)
await wa.media.upload({
  file: stickerBuffer,
  mimeType: 'image/webp',
  category: 'sticker',
  stickerType: 'static', // or 'animated'
});
```

## Templates

Create and manage message templates:

```typescript
import { TemplateBuilder } from '@abdelrahmannasr-wa/cloud-api';

// List templates
const templates = await wa.templates.list({ limit: 10 });

// Get specific template
const template = await wa.templates.get('hello_world');

// Create template with TemplateBuilder
const newTemplate = new TemplateBuilder()
  .setName('order_confirmation')
  .setLanguage('en_US')
  .setCategory('UTILITY')
  .addBody('Your order {{1}} has been confirmed. Total: {{2}}.')
  .addQuickReplyButton('Track Order')
  .build();

await wa.templates.create(newTemplate);

// Full template with all builder options
const promoTemplate = new TemplateBuilder()
  .setName('summer_sale')
  .setLanguage('en_US')
  .setCategory('MARKETING')
  .allowCategoryChange(true)
  .addHeaderText('Summer Sale!')
  .addBody('Hi {{1}}, enjoy {{2}}% off all items this week.')
  .addFooter('Terms and conditions apply')
  .addQuickReplyButton('Shop Now')
  .addQuickReplyButton('Not Interested')
  .addUrlButton('View Catalog', 'https://example.com/catalog/{{1}}')
  .addPhoneNumberButton('Call Support', '+1234567890')
  .build();

await wa.templates.create(promoTemplate);

// Update template components
await wa.templates.update('template_id', [
  { type: 'BODY', text: 'Updated: Your order {{1}} has been confirmed.' },
]);

// Delete template
await wa.templates.delete('old_template');
```

**TemplateBuilder methods:** `setName()`, `setLanguage()`, `setCategory()`, `allowCategoryChange()`, `addHeaderText()`, `addHeaderMedia(format, example?)`, `addBody(text, example?)`, `addFooter()`, `addQuickReplyButton()` (max 3), `addUrlButton()` (max 2), `addPhoneNumberButton()` (max 1).

## Flows

Create and manage WhatsApp Flows for interactive forms, surveys, and guided journeys:

### Send a Flow

```typescript
// Send a published flow to a user
await wa.messages.sendFlow({
  to: '1234567890',
  body: 'Please complete your appointment booking.',
  flowCta: 'Book Now',
  flowId: '9876543210',
});

// Test a draft flow before publishing
await wa.messages.sendFlow({
  to: '1234567890',
  body: 'Preview the onboarding flow',
  flowCta: 'Start',
  flowId: '9876543210',
  mode: 'draft',
});

// Pre-populate initial screen data
await wa.messages.sendFlow({
  to: '1234567890',
  body: 'Review your profile',
  flowCta: 'Continue',
  flowId: '9876543210',
  flowActionPayload: {
    screen: 'EDIT_PROFILE',
    data: { name: 'Alice', email: 'alice@example.com' },
  },
});
```

### Receive Flow Completions

Flow completions arrive as a dedicated `FlowCompletionEvent` via the `onFlowCompletion` callback (NOT via `onMessage`):

```typescript
const handler = wa.webhooks.createHandler({
  onMessage: async (event) => {
    // Text, images, button/list replies — unchanged
  },
  onFlowCompletion: async (event) => {
    // Deduplicate (Meta retries on errors)
    if (await db.isProcessed(event.messageId)) return;
    await db.markProcessed(event.messageId);

    // event.response is the parsed form data (or {} if malformed)
    // event.responseJson is the raw string, preserved exactly
    await saveSubmission(event.contact.waId, event.response);
  },
});
```

### Flow Lifecycle (CRUD)

Requires `businessAccountId` in the client config:

```typescript
const wa = new WhatsApp({
  accessToken: '...',
  phoneNumberId: '...',
  businessAccountId: 'YOUR_WABA_ID',
});

// Create a flow
const created = await wa.flows.create({
  name: 'customer_onboarding',
  categories: ['SIGN_UP'],
});

// Upload flow JSON (accepts string or object — SDK stringifies objects)
await wa.flows.updateAssets(created.data.id, {
  flow_json: { version: '3.0', screens: [/* ... */] },
});

// Publish
await wa.flows.publish(created.data.id);

// List, get, update metadata, preview, deprecate, delete
const list = await wa.flows.list({ limit: 10 });
const flow = await wa.flows.get('flow_id');
await wa.flows.updateMetadata('flow_id', { name: 'new_name' });
const preview = await wa.flows.getPreview('flow_id');
await wa.flows.deprecate('flow_id');
await wa.flows.delete('draft_flow_id'); // Only draft flows can be deleted
```

### Multi-Account Broadcast with Flows

Flow IDs are scoped to a single WABA. When broadcasting across accounts, maintain a per-account flow ID mapping:

```typescript
const flowIdByAccount = {
  us: 'flow_id_in_us_account',
  eu: 'flow_id_in_eu_account',
};

const result = await manager.broadcast(
  ['15551234567', '442071234567'],
  (account, recipient) => account.messages.sendFlow({
    to: recipient,
    body: 'Complete your registration',
    flowCta: 'Get Started',
    flowId: flowIdByAccount[account.name as keyof typeof flowIdByAccount],
  }),
);
```

**Flows methods:** `list()`, `get()`, `create()`, `updateMetadata()`, `updateAssets()`, `publish()`, `deprecate()`, `delete()`, `getPreview()`.

## Commerce & Catalogs

Send product messages, receive order notifications, and manage your product catalog programmatically. All catalog operations require `businessAccountId` in the client config.

### Send a Single Product Message

```typescript
// Display one product card to a recipient
await wa.messages.sendProduct({
  to: '1234567890',
  catalogId: 'CATALOG_ID',
  productRetailerId: 'SKU-001',
  body: 'Check out this item — just restocked!',
  footer: 'Limited stock',
});
```

### Send a Multi-Product List

Up to 30 products across up to 10 named sections (validated client-side before the API call):

```typescript
await wa.messages.sendProductList({
  to: '1234567890',
  catalogId: 'CATALOG_ID',
  header: "Today's Specials",
  body: "Here's our curated selection.",
  sections: [
    {
      title: 'Beverages',
      productRetailerIds: ['cola-001', 'juice-002'],
    },
    {
      title: 'Snacks',
      productRetailerIds: ['chips-001', 'nuts-002'],
    },
  ],
});
```

### Send a Catalog Message

Invite the recipient to browse your entire catalog. Optionally pin a featured product as a thumbnail:

```typescript
await wa.messages.sendCatalogMessage({
  to: '1234567890',
  body: 'Browse our full collection.',
  footer: 'Free shipping on orders over $50',
  thumbnailProductRetailerId: 'featured-item-001', // optional
});
```

### Receive Order Notifications

When a recipient submits a cart, the SDK fires a dedicated `OrderEvent` via `onOrder`. This event is **never** delivered to the generic `onMessage` callback:

```typescript
wa.webhooks.onOrder(async (event) => {
  // Deduplicate using the stable platform message ID
  if (await db.isProcessed(event.messageId)) return;
  await db.markProcessed(event.messageId);

  console.log(`Order from ${event.from}: ${event.items.length} item(s)`);
  for (const item of event.items) {
    console.log(`  ${item.product_retailer_id} × ${item.quantity} @ ${item.item_price} ${item.currency}`);
  }

  // Reply to confirm
  await wa.messages.sendText({
    to: event.from,
    body: `Thanks! We received your order and will process it shortly.`,
  });
});
```

`event.raw` preserves the original JSON-stringified payload for storage or auditing. If `product_items` is malformed, `event.items` is `[]` and `event.raw` is still preserved.

### Template lifecycle events

React to template approvals, rejections, and quality changes without polling the templates API. Events arrive on the same webhook URL, routed automatically by the SDK:

```typescript
wa.webhooks
  .onTemplateStatus(async (event) => {
    if (event.status === 'APPROVED') {
      await db.markTemplateLive(event.templateId);
    } else if (event.status === 'REJECTED') {
      await alerts.notify({
        template: event.templateName,
        language: event.language,
        reason: event.reason ?? 'no reason provided',
      });
    }
  })
  .onTemplateQuality(async (event) => {
    // previousScore is undefined for first-time ratings
    if (event.newScore === 'RED') {
      await throttle.pauseCampaign(event.templateId);
    }
  });
```

Template events use a WABA-scoped `metadata.businessAccountId` (sourced from `entry.id`) instead of `phoneNumberId`. The `status` and `newScore` fields preserve unknown platform-added values verbatim so your code doesn't break when Meta adds new states. Requires subscribing to `message_template_status_update` and `message_template_quality_update` in the Meta App Dashboard.

### Catalog Management

Create, update, and delete products from code. Requires `businessAccountId`:

```typescript
// List catalogs connected to the WABA
const { data } = await wa.catalog.listCatalogs();

// Create a product (strict — throws ConflictError on duplicate retailer_id)
try {
  await wa.catalog.createProduct('CATALOG_ID', {
    retailer_id: 'SKU-001',
    name: 'Wireless Headphones',
    image_url: 'https://example.com/sku-001.jpg',
    price: 4999,       // integer minor units ($49.99)
    currency: 'USD',
    availability: 'in stock',
  });
} catch (err) {
  if (err instanceof ConflictError) {
    // Fall back to upsert (create-or-update)
    await wa.catalog.upsertProduct('CATALOG_ID', { /* same payload */ });
  }
}

// Partial update
await wa.catalog.updateProduct('PRODUCT_ID', { price: 3999 });

// Delete
await wa.catalog.deleteProduct('PRODUCT_ID');
```

**Catalog methods:** `listCatalogs()`, `getCatalog()`, `listProducts()`, `getProduct()`, `createProduct()`, `upsertProduct()`, `updateProduct()`, `deleteProduct()`.

### Limitations

- **No bulk product mutations** — single-product CRUD only; compose multiple calls for bulk sync.
- **No product image hosting** — `image_url` must be a publicly accessible HTTPS URL hosted by the consumer (own CDN, S3, Cloudflare R2, etc.).
- **No order acknowledgement messages** — reply to orders with any existing message type (e.g., `sendText`); dedicated `sendOrderStatusMessage` is out of scope for v0.4.0.
- **No lookup by `retailer_id`** — use `listProducts` with a filter to find a product by its retailer ID, or use `upsertProduct` for create-or-update semantics.
- **Catalog IDs are WABA-scoped** — when broadcasting across multiple accounts in different WABAs, maintain a per-account catalog ID mapping.

## Webhooks

Handle incoming webhook events from WhatsApp:

**Express.js:**

```typescript
import express from 'express';
import { createExpressMiddleware } from '@abdelrahmannasr-wa/cloud-api/webhooks';

const app = express();

app.use(
  '/webhook',
  createExpressMiddleware(
    {
      appSecret: process.env.WHATSAPP_APP_SECRET!,
      verifyToken: process.env.WHATSAPP_VERIFY_TOKEN!,
    },
    {
      onMessage: (event) => {
        console.log('Message received:', event.message.text?.body);
      },
      onStatus: (event) => {
        console.log('Status update:', event.status.status);
      },
      onError: (event) => {
        console.error('Error:', event.error);
      },
    },
  ),
);

app.listen(3000);
```

**Next.js App Router:**

```typescript
// app/api/webhook/route.ts
import { createNextRouteHandler } from '@abdelrahmannasr-wa/cloud-api/webhooks';

const { GET, POST } = createNextRouteHandler(
  {
    appSecret: process.env.WHATSAPP_APP_SECRET!,
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN!,
  },
  {
    onMessage: (event) => {
      console.log('Message received:', event.message.text?.body);
    },
    onStatus: (event) => {
      console.log('Status update:', event.status.status);
    },
  },
);

export { GET, POST };
```

**Unified Client:**

When using the `WhatsApp` client, webhooks are available via `wa.webhooks`:

```typescript
const wa = new WhatsApp({
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
  appSecret: process.env.WHATSAPP_APP_SECRET!,
  webhookVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN!,
});

// Parse webhook payload into typed events
const events = wa.webhooks.parse(webhookPayload);
for (const event of events) {
  if (event.type === 'message') {
    console.log('Message from:', event.message.from);
  }
}

// Verify webhook subscription (GET endpoint)
const challenge = wa.webhooks.verify(queryParams);

// Verify payload signature (POST endpoint)
wa.webhooks.verifySignature(rawBody, signatureHeader);

// Or create middleware directly from the unified client
app.use(
  '/webhook',
  wa.webhooks.createExpressMiddleware({
    onMessage: (event) => console.log('Message:', event.message.text?.body),
  }),
);
```

## Phone Numbers

Manage phone numbers and business profiles:

```typescript
// List phone numbers
const numbers = await wa.phoneNumbers.list();

// Get phone number details
const number = await wa.phoneNumbers.get('phone_number_id');

// Get business profile
const profile = await wa.phoneNumbers.getBusinessProfile('phone_number_id');

// Update business profile
await wa.phoneNumbers.updateBusinessProfile('phone_number_id', {
  description: 'Your trusted business partner',
  websites: ['https://example.com'],
});

// Request verification code
await wa.phoneNumbers.requestVerificationCode('phone_number_id', {
  code_method: 'SMS',
  language: 'en',
});

// Verify code
await wa.phoneNumbers.verifyCode('phone_number_id', { code: '123456' });

// Register a verified phone number
await wa.phoneNumbers.register('phone_number_id', {
  pin: '123456', // Two-step verification PIN
});

// Deregister a phone number
await wa.phoneNumbers.deregister('phone_number_id');
```

## Multi-Account

Manage multiple WhatsApp Business Accounts:

```typescript
import { WhatsAppMultiAccount } from '@abdelrahmannasr-wa/cloud-api';

const multiAccount = new WhatsAppMultiAccount({
  // Shared base config
  retryConfig: { maxRetries: 3 },

  // Per-account configurations
  accounts: [
    {
      name: 'account1',
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
      phoneNumberId: process.env.ACCOUNT1_PHONE_NUMBER_ID!,
    },
    {
      name: 'account2',
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
      phoneNumberId: process.env.ACCOUNT2_PHONE_NUMBER_ID!,
    },
  ],
});

// Send via specific account
const client1 = multiAccount.get('account1');
await client1.messages.sendText({
  to: '1234567890',
  body: 'Hello from account 1!',
});

// Lookup by phone number ID
const client2 = multiAccount.get(process.env.ACCOUNT2_PHONE_NUMBER_ID!);

// Clean up all accounts
multiAccount.destroy();
```

### Dynamic Account Management

Add, remove, and query accounts at runtime:

```typescript
// Check if an account exists (by name or phone number ID)
if (!manager.has('marketing')) {
  // Add a new account dynamically
  manager.addAccount({
    name: 'marketing',
    accessToken: 'TOKEN_M',
    phoneNumberId: 'PHONE_M',
    businessAccountId: 'WABA_M',
  });
}

// List all registered accounts
const accounts = manager.getAccounts();
for (const [name, config] of accounts) {
  console.log(`${name}: ${config.phoneNumberId}`);
}

// Remove an account (destroys its client if created)
manager.removeAccount('marketing');
```

### Distribution Strategies

Automatically distribute sends across accounts using built-in strategies:

```typescript
import { WhatsAppMultiAccount, RoundRobinStrategy } from '@abdelrahmannasr-wa/cloud-api';

const manager = new WhatsAppMultiAccount({
  strategy: new RoundRobinStrategy(),
  accounts: [
    { name: 'account-a', accessToken: 'TOKEN_A', phoneNumberId: 'PHONE_A' },
    { name: 'account-b', accessToken: 'TOKEN_B', phoneNumberId: 'PHONE_B' },
    { name: 'account-c', accessToken: 'TOKEN_C', phoneNumberId: 'PHONE_C' },
  ],
});

// Each call cycles: A → B → C → A → B → ...
const wa = manager.getNext();
await wa.messages.sendText({ to: '1234567890', body: 'Hello!' });
```

### Weighted Distribution

Route traffic proportionally based on per-account weights:

```typescript
import { WhatsAppMultiAccount, WeightedStrategy } from '@abdelrahmannasr-wa/cloud-api';

const manager = new WhatsAppMultiAccount({
  strategy: new WeightedStrategy(
    new Map([
      ['enterprise', 80], // gets ~80% of traffic
      ['business-1', 10], // gets ~10% of traffic
      ['business-2', 10], // gets ~10% of traffic
    ]),
  ),
  accounts: [
    { name: 'enterprise', accessToken: 'TOKEN_E', phoneNumberId: 'PHONE_E' },
    { name: 'business-1', accessToken: 'TOKEN_1', phoneNumberId: 'PHONE_1' },
    { name: 'business-2', accessToken: 'TOKEN_2', phoneNumberId: 'PHONE_2' },
  ],
});

const wa = manager.getNext();
await wa.messages.sendText({ to: '1234567890', body: 'Hello!' });
```

### Sticky Routing

Ensure the same recipient always routes to the same account for conversation continuity:

```typescript
import { WhatsAppMultiAccount, StickyStrategy } from '@abdelrahmannasr-wa/cloud-api';

const manager = new WhatsAppMultiAccount({
  strategy: new StickyStrategy(),
  accounts: [
    { name: 'account-a', accessToken: 'TOKEN_A', phoneNumberId: 'PHONE_A' },
    { name: 'account-b', accessToken: 'TOKEN_B', phoneNumberId: 'PHONE_B' },
  ],
});

// Same recipient always routes to the same account
const wa = manager.getNext('1234567890');
await wa.messages.sendText({ to: '1234567890', body: 'Hello!' });
```

> **Stickiness is not stable across account-set mutations.** `StickyStrategy`
> uses a simple `hash(recipient) % accountNames.length` mapping, so calling
> `addAccount()` or `removeAccount()` shifts the modulo result and reroutes
> most recipients to a different account. If your deployment adds or removes
> accounts while conversations are in flight and you need routing to survive
> those changes, implement a custom `DistributionStrategy` using rendezvous
> (HRW) or consistent hashing — they rebind only ~1/N of recipients on
> mutation.

### Broadcast

Send a message to many recipients in parallel, distributed across accounts:

```typescript
const recipients = ['1111111111', '2222222222', '3333333333', '4444444444'];

const result = await manager.broadcast(
  recipients,
  async (wa, to) => wa.messages.sendText({ to, body: 'Campaign message!' }),
  { concurrency: 10 }, // limit to 10 concurrent sends
);

console.log(`Sent: ${result.successes.length}, Failed: ${result.failures.length}`);

for (const failure of result.failures) {
  console.error(`Failed to send to ${failure.recipient}:`, failure.error);
}
```

### Custom Strategy

Implement the `DistributionStrategy` interface for custom routing logic:

```typescript
import type { DistributionStrategy } from '@abdelrahmannasr-wa/cloud-api';

class PriorityStrategy implements DistributionStrategy {
  select(accountNames: readonly string[], _recipient?: string): string {
    return accountNames[0]; // Always prefer the first account
  }
}

const manager = new WhatsAppMultiAccount({
  strategy: new PriorityStrategy(),
  accounts: [
    { name: 'primary', accessToken: 'TOKEN_P', phoneNumberId: 'PHONE_P' },
    { name: 'fallback', accessToken: 'TOKEN_F', phoneNumberId: 'PHONE_F' },
  ],
});
```

## Examples

Complete, runnable examples are available in the [`examples/`](./examples) directory. Each example demonstrates a specific feature with inline documentation and environment variable setup:

- **[send-text.ts](./examples/send-text.ts)** — Send a simple text message with typed error handling (ApiError, RateLimitError)
- **[media-upload.ts](./examples/media-upload.ts)** — Upload a file from disk, send as image message, handle MediaError
- **[templates.ts](./examples/templates.ts)** — List existing templates, create new template with TemplateBuilder, send template message
- **[webhooks-express.ts](./examples/webhooks-express.ts)** — Complete Express server with webhook middleware (GET verification, POST event handling)
- **[webhooks-nextjs.ts](./examples/webhooks-nextjs.ts)** — Next.js App Router webhook handler (app/api/webhook/route.ts structure)
- **[phone-numbers.ts](./examples/phone-numbers.ts)** — List phone numbers, manage business profile, request/verify verification code
- **[multi-account.ts](./examples/multi-account.ts)** — Manage multiple WABAs with distribution strategies (round-robin, weighted, sticky), broadcast messaging, and dynamic account management

Run any example with:

```bash
# Set required environment variables
export WHATSAPP_ACCESS_TOKEN="your_access_token"
export WHATSAPP_PHONE_NUMBER_ID="your_phone_number_id"

# Run with tsx
npx tsx examples/send-text.ts
```

## Error Handling

The SDK uses a typed error hierarchy for precise error handling. All errors extend `WhatsAppError` for unified catch blocks:

### Error Class Hierarchy

```
WhatsAppError (base)
├── ApiError (API response errors)
│   ├── RateLimitError (429 Too Many Requests)
│   └── AuthenticationError (401 Unauthorized)
├── NotFoundError (semantic "resource missing" — see note below)
├── ValidationError (client-side validation)
├── WebhookVerificationError (signature verification)
└── MediaError (media upload/download)
```

> **Note on `NotFoundError`:** It deliberately does **not** extend `ApiError`.
> Meta's API returns 200 with an empty `data` array for several "missing
> resource" cases (e.g. `getBusinessProfile` when the profile is not
> provisioned). The SDK surfaces those as `NotFoundError`, which a
> `catch (err) { if (err instanceof ApiError && err.statusCode === 404) }`
> branch will **not** catch. See the example under "Error Handling Patterns"
> below for the recommended dual-catch shape.

### Error Properties

| Error Class                | Extends         | Properties                                                                                     |
| -------------------------- | --------------- | ---------------------------------------------------------------------------------------------- |
| `WhatsAppError`            | `Error`         | `code: string`                                                                                 |
| `ApiError`                 | `WhatsAppError` | `statusCode: number`<br>`errorType: string`<br>`errorSubcode?: number`<br>`fbTraceId?: string` |
| `RateLimitError`           | `ApiError`      | All ApiError properties<br>`retryAfterMs?: number`                                             |
| `AuthenticationError`      | `ApiError`      | All ApiError properties                                                                        |
| `NotFoundError`            | `WhatsAppError` | `resource?: string`                                                                            |
| `ValidationError`          | `WhatsAppError` | `field?: string`                                                                               |
| `WebhookVerificationError` | `WhatsAppError` | None                                                                                           |
| `MediaError`               | `WhatsAppError` | `mediaType?: string`                                                                           |

### Error Handling Patterns

**1. Handling API errors with status code checks:**

```typescript
import { ApiError, RateLimitError } from '@abdelrahmannasr-wa/cloud-api';

try {
  await wa.messages.sendText({ to: '1234567890', body: 'Hello!' });
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`API Error ${error.statusCode}: ${error.message}`);
    console.error(`Error type: ${error.errorType}`);
    if (error.fbTraceId) {
      console.error(`FB Trace ID: ${error.fbTraceId}`);
    }
  } else {
    console.error('Unexpected error:', error);
  }
}
```

**2. Handling rate limits with retry delay:**

```typescript
import { RateLimitError } from '@abdelrahmannasr-wa/cloud-api';

try {
  await wa.messages.sendText({ to: '1234567890', body: 'Hello!' });
} catch (error) {
  if (error instanceof RateLimitError) {
    const delayMs = error.retryAfterMs || 60000; // Default 60s if not provided
    console.log(`Rate limited. Retry after ${delayMs}ms`);

    // Wait and retry
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await wa.messages.sendText({ to: '1234567890', body: 'Hello!' });
  } else {
    throw error; // Re-throw if not a rate limit error
  }
}
```

**3. Handling validation errors with field identification:**

```typescript
import { ValidationError } from '@abdelrahmannasr-wa/cloud-api';

try {
  await wa.media.upload({
    file: buffer,
    mimeType: 'invalid/type', // Invalid MIME type
    category: 'document',
    filename: 'file.txt',
  });
} catch (error) {
  if (error instanceof ValidationError) {
    console.error(`Validation failed: ${error.message}`);
    if (error.field) {
      console.error(`Invalid field: ${error.field}`);
    }
  } else {
    throw error;
  }
}
```

**4. Handling "resource missing" responses separately from 404s:**

```typescript
import { ApiError, NotFoundError } from '@abdelrahmannasr-wa/cloud-api';

try {
  const profile = await wa.phoneNumbers.getBusinessProfile(phoneNumberId);
  console.log(profile.data.description);
} catch (error) {
  if (error instanceof NotFoundError) {
    // Meta returned 200 with an empty data array — the resource simply
    // isn't provisioned. `error.resource` names the specific resource.
    console.log(`No ${error.resource} configured yet`);
  } else if (error instanceof ApiError && error.statusCode === 404) {
    // Explicit wire-level 404 from Meta — e.g. the phoneNumberId is bogus.
    console.error('Unknown phone number ID');
  } else {
    throw error;
  }
}
```

## Advanced Usage

### Direct Module Imports

For advanced use cases or tree-shaking, import individual modules via dedicated subpaths:

```typescript
// Import only what you need
import { Messages } from '@abdelrahmannasr-wa/cloud-api/messages';
import { Media, MEDIA_CONSTRAINTS } from '@abdelrahmannasr-wa/cloud-api/media';
import { Templates, TemplateBuilder } from '@abdelrahmannasr-wa/cloud-api/templates';
import { PhoneNumbers } from '@abdelrahmannasr-wa/cloud-api/phone-numbers';
import { WhatsAppMultiAccount, RoundRobinStrategy } from '@abdelrahmannasr-wa/cloud-api/multi-account';
import { Webhooks, createExpressMiddleware } from '@abdelrahmannasr-wa/cloud-api/webhooks';
import { WhatsAppError, ApiError } from '@abdelrahmannasr-wa/cloud-api/errors';
```

**Available subpath exports:**

| Subpath | Primary Exports |
|---------|----------------|
| `@abdelrahmannasr-wa/cloud-api` | `WhatsApp` (unified client), all modules |
| `@abdelrahmannasr-wa/cloud-api/messages` | `Messages`, all message type interfaces |
| `@abdelrahmannasr-wa/cloud-api/media` | `Media`, `MEDIA_CONSTRAINTS`, media types |
| `@abdelrahmannasr-wa/cloud-api/templates` | `Templates`, `TemplateBuilder`, validation constants |
| `@abdelrahmannasr-wa/cloud-api/phone-numbers` | `PhoneNumbers`, business profile types |
| `@abdelrahmannasr-wa/cloud-api/multi-account` | `WhatsAppMultiAccount`, distribution strategies |
| `@abdelrahmannasr-wa/cloud-api/webhooks` | `Webhooks`, middleware factories, parser |
| `@abdelrahmannasr-wa/cloud-api/errors` | `WhatsAppError`, `ApiError`, `RateLimitError`, etc. |

All subpaths support ESM (`import`), CommonJS (`require`), and include full TypeScript declarations.

```typescript
// Direct module usage with HttpClient
import { HttpClient } from '@abdelrahmannasr-wa/cloud-api';
import { Messages } from '@abdelrahmannasr-wa/cloud-api/messages';

const client = new HttpClient({
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
});

const messages = new Messages(client, process.env.WHATSAPP_PHONE_NUMBER_ID!);

await messages.sendText({
  to: '1234567890',
  body: 'Hello!',
});

client.destroy();
```

### Custom Rate Limiter

```typescript
const wa = new WhatsApp({
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
  rateLimitConfig: {
    maxTokens: 1000, // Enterprise tier
    refillRate: 1000,
    enabled: true,
  },
});
```

### Custom Retry Configuration

```typescript
const wa = new WhatsApp({
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
  retryConfig: {
    maxRetries: 5,
    baseDelayMs: 2000,
    maxDelayMs: 60000,
    jitterFactor: 0.3,
  },
});
```

### Request Options

Pass custom options to individual requests:

```typescript
await wa.messages.sendText(
  {
    to: '1234567890',
    body: 'Hello!',
  },
  {
    timeoutMs: 10000, // Override timeout for this request
    skipRateLimit: false,
    skipRetry: false,
  },
);
```

## ESM & CJS

This SDK supports both ESM and CommonJS:

**ESM (recommended):**

```typescript
import { WhatsApp } from '@abdelrahmannasr-wa/cloud-api';
```

**CommonJS:**

```javascript
const { WhatsApp } = require('@abdelrahmannasr-wa/cloud-api');
```

## License

MIT © AbdelRahman Nasr
