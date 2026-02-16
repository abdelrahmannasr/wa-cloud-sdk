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
- **Webhooks** — Parse incoming events, verify signatures, and integrate with Express or Next.js App Router
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

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `accessToken` | `string` | Yes | — | Meta access token for authentication |
| `phoneNumberId` | `string` | Yes | — | WhatsApp phone number ID |
| `businessAccountId` | `string` | No | — | WhatsApp Business Account ID (required for templates) |
| `apiVersion` | `string` | No | `'v21.0'` | Graph API version |
| `baseUrl` | `string` | No | `'https://graph.facebook.com'` | API base URL |
| `logger` | `Logger` | No | — | Custom logger instance |
| `rateLimitConfig.maxTokens` | `number` | No | `80` | Max tokens in bucket |
| `rateLimitConfig.refillRate` | `number` | No | `80` | Tokens refilled per second |
| `rateLimitConfig.enabled` | `boolean` | No | `true` | Enable/disable rate limiting |
| `retryConfig.maxRetries` | `number` | No | `3` | Maximum retry attempts |
| `retryConfig.baseDelayMs` | `number` | No | `1000` | Base delay between retries (ms) |
| `retryConfig.maxDelayMs` | `number` | No | `30000` | Maximum delay cap (ms) |
| `retryConfig.jitterFactor` | `number` | No | `0.2` | Jitter randomization factor (0-1) |
| `timeoutMs` | `number` | No | `30000` | Request timeout in milliseconds |
| `appSecret` | `string` | No | — | App secret for webhook signature verification |
| `webhookVerifyToken` | `string` | No | — | Webhook verify token |

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

// Update template components
await wa.templates.update('template_id', [
  { type: 'BODY', text: 'Updated: Your order {{1}} has been confirmed.' },
]);

// Delete template
await wa.templates.delete('old_template');
```

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
    }
  )
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
  }
);

export { GET, POST };
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
  codeMethod: 'SMS',
  language: 'en',
});

// Verify code
await wa.phoneNumbers.verifyCode('phone_number_id', { code: '123456' });
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

### Distribution Strategies

Automatically distribute sends across accounts using built-in strategies:

```typescript
import {
  WhatsAppMultiAccount,
  RoundRobinStrategy,
} from '@abdelrahmannasr-wa/cloud-api';

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
import {
  WhatsAppMultiAccount,
  WeightedStrategy,
} from '@abdelrahmannasr-wa/cloud-api';

const manager = new WhatsAppMultiAccount({
  strategy: new WeightedStrategy(
    new Map([
      ['enterprise', 80],  // gets ~80% of traffic
      ['business-1', 10],  // gets ~10% of traffic
      ['business-2', 10],  // gets ~10% of traffic
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
import {
  WhatsAppMultiAccount,
  StickyStrategy,
} from '@abdelrahmannasr-wa/cloud-api';

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
├── ValidationError (client-side validation)
├── WebhookVerificationError (signature verification)
└── MediaError (media upload/download)
```

### Error Properties

| Error Class | Extends | Properties |
|------------|---------|------------|
| `WhatsAppError` | `Error` | `code: string` |
| `ApiError` | `WhatsAppError` | `statusCode: number`<br>`errorType: string`<br>`errorSubcode?: number`<br>`fbTraceId?: string` |
| `RateLimitError` | `ApiError` | All ApiError properties<br>`retryAfterMs?: number` |
| `AuthenticationError` | `ApiError` | All ApiError properties |
| `ValidationError` | `WhatsAppError` | `field?: string` |
| `WebhookVerificationError` | `WhatsAppError` | None |
| `MediaError` | `WhatsAppError` | `mediaType?: string` |

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
    await new Promise(resolve => setTimeout(resolve, delayMs));
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

## Advanced Usage

### Direct Module Imports

For advanced use cases, import modules directly:

```typescript
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
  }
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

