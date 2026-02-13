# Quickstart: WhatsApp Cloud API SDK -- Core Foundation

**Branch**: `001-sdk-core-foundation` | **Date**: 2026-02-13

## Installation

```bash
npm install @abdelrahmannasr-wa/cloud-api
# or
pnpm add @abdelrahmannasr-wa/cloud-api
```

## Send a Text Message (5 lines)

```typescript
import { HttpClient, Messages } from '@abdelrahmannasr-wa/cloud-api';

const client = new HttpClient({ accessToken: 'YOUR_TOKEN', phoneNumberId: 'YOUR_PHONE_ID' });
const messages = new Messages(client, 'YOUR_PHONE_ID');

const result = await messages.sendText({ to: '1234567890', body: 'Hello from the SDK!' });
console.log('Message ID:', result.data.messages[0].id);
```

## Send Media Messages

```typescript
// Image with caption
await messages.sendImage({
  to: '1234567890',
  media: { link: 'https://example.com/photo.jpg' },
  caption: 'Check this out!',
});

// Document with filename
await messages.sendDocument({
  to: '1234567890',
  media: { id: 'MEDIA_ID_FROM_UPLOAD' },
  filename: 'invoice.pdf',
});

// Location
await messages.sendLocation({
  to: '1234567890',
  latitude: 37.7749,
  longitude: -122.4194,
  name: 'San Francisco',
  address: 'San Francisco, CA',
});
```

## Send Interactive Messages

```typescript
// Buttons (up to 3)
await messages.sendInteractiveButtons({
  to: '1234567890',
  body: 'Choose an option:',
  buttons: [
    { type: 'reply', reply: { id: 'btn_yes', title: 'Yes' } },
    { type: 'reply', reply: { id: 'btn_no', title: 'No' } },
  ],
});

// List menu
await messages.sendInteractiveList({
  to: '1234567890',
  body: 'Browse our menu:',
  buttonText: 'View Menu',
  sections: [
    {
      title: 'Drinks',
      rows: [
        { id: 'coffee', title: 'Coffee', description: '$3.50' },
        { id: 'tea', title: 'Tea', description: '$2.50' },
      ],
    },
  ],
});
```

## Send Template Messages

```typescript
await messages.sendTemplate({
  to: '1234567890',
  templateName: 'order_confirmation',
  language: 'en_US',
  components: [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: 'John' },
        { type: 'text', text: 'ORD-12345' },
      ],
    },
  ],
});
```

## Receive Webhooks (Express)

```typescript
import express from 'express';
import { createExpressMiddleware } from '@abdelrahmannasr-wa/cloud-api/webhooks';

const app = express();
app.use(express.json({ verify: (req, _res, buf) => { (req as any).rawBody = buf; } }));

app.use('/webhook', createExpressMiddleware(
  { appSecret: 'YOUR_APP_SECRET', verifyToken: 'YOUR_VERIFY_TOKEN' },
  {
    onMessage: (event) => {
      console.log(`Message from ${event.contact.name}: ${event.message.type}`);
      if (event.message.type === 'text') {
        console.log('Text:', event.message.text?.body);
      }
    },
    onStatus: (event) => {
      console.log(`Status: ${event.status.status} for ${event.status.id}`);
    },
  },
));

app.listen(3000);
```

## Receive Webhooks (Next.js App Router)

```typescript
// app/api/webhook/route.ts
import { createNextRouteHandler } from '@abdelrahmannasr-wa/cloud-api/webhooks';

export const { GET, POST } = createNextRouteHandler(
  { appSecret: process.env.APP_SECRET!, verifyToken: process.env.VERIFY_TOKEN! },
  {
    onMessage: async (event) => {
      console.log(`Message from ${event.contact.name}:`, event.message.type);
    },
    onStatus: async (event) => {
      console.log(`Status update: ${event.status.status}`);
    },
  },
);
```

## Configure Rate Limiting & Retry

```typescript
const client = new HttpClient({
  accessToken: 'YOUR_TOKEN',
  phoneNumberId: 'YOUR_PHONE_ID',
  rateLimitConfig: {
    maxTokens: 80,      // Bucket capacity (default: 80)
    refillRate: 80,      // Tokens/second (default: 80)
    enabled: true,       // Set false to disable
  },
  retryConfig: {
    maxRetries: 3,       // Retry attempts (default: 3)
    baseDelayMs: 1000,   // Initial backoff (default: 1000ms)
    maxDelayMs: 30000,   // Max backoff cap (default: 30000ms)
    jitterFactor: 0.2,   // Randomization (default: 0.2)
  },
  timeoutMs: 30000,      // Request timeout (default: 30000ms)
});
```

## Error Handling

```typescript
import {
  ApiError,
  RateLimitError,
  AuthenticationError,
  ValidationError,
} from '@abdelrahmannasr-wa/cloud-api';

try {
  await messages.sendText({ to: '1234567890', body: 'Hello!' });
} catch (error) {
  if (error instanceof AuthenticationError) {
    // Token expired or invalid — refresh credentials
    console.error('Auth failed:', error.message);
  } else if (error instanceof RateLimitError) {
    // Rate limited — SDK already retried, this means retries exhausted
    console.error('Rate limited, retry after:', error.retryAfterMs, 'ms');
  } else if (error instanceof ValidationError) {
    // Invalid input (e.g., bad phone number)
    console.error('Validation error on field:', error.field);
  } else if (error instanceof ApiError) {
    // Other API error
    console.error(`API error ${error.statusCode}: ${error.errorType}`);
    console.error('Trace ID:', error.fbTraceId);
  }
}
```

## Cleanup

```typescript
// When shutting down, clean up rate limiter timers
client.destroy();
```

## Skip Rate Limit or Retry Per-Request

```typescript
// Skip rate limiting for this specific request
await messages.sendText(
  { to: '1234567890', body: 'Urgent!' },
  { skipRateLimit: true },
);

// Skip retry (fail immediately on error)
await messages.sendText(
  { to: '1234567890', body: 'No retry' },
  { skipRetry: true },
);

// Custom timeout for this request
await messages.sendText(
  { to: '1234567890', body: 'Quick timeout' },
  { timeoutMs: 5000 },
);
```
