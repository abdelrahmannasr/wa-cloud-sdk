# Quickstart: Unified WhatsApp Client

**Feature**: 004-unified-whatsapp-client
**Date**: 2026-02-14

## Basic Setup

```typescript
import { WhatsApp } from '@abdelrahmannasr-wa/cloud-api';

const wa = new WhatsApp({
  accessToken: 'YOUR_ACCESS_TOKEN',
  phoneNumberId: 'YOUR_PHONE_NUMBER_ID',
  businessAccountId: 'YOUR_WABA_ID',       // optional, needed for templates
  appSecret: 'YOUR_APP_SECRET',             // optional, needed for webhook verification
  webhookVerifyToken: 'YOUR_VERIFY_TOKEN',  // optional, needed for webhook verification
});
```

## Send a Text Message

```typescript
const result = await wa.messages.sendText({
  to: '1234567890',
  body: 'Hello from the unified client!',
});
console.log('Message ID:', result.data.messages[0].id);
```

## Send an Image

```typescript
await wa.messages.sendImage({
  to: '1234567890',
  media: { link: 'https://example.com/photo.jpg' },
  caption: 'Check this out!',
});
```

## Upload and Send Media

```typescript
const upload = await wa.media.upload({
  file: Buffer.from('...'),
  mimeType: 'image/png',
  category: 'image',
  filename: 'photo.png',
});

await wa.messages.sendImage({
  to: '1234567890',
  media: { id: upload.data.id },
});
```

## List Templates

```typescript
const templates = await wa.templates.list({ limit: 10 });
for (const template of templates.data.data) {
  console.log(`${template.name} (${template.language}): ${template.status}`);
}
```

## Create a Template

```typescript
import { TemplateBuilder } from '@abdelrahmannasr-wa/cloud-api';

const request = new TemplateBuilder()
  .setName('order_shipped')
  .setLanguage('en_US')
  .setCategory('UTILITY')
  .addBody('Hi {{1}}, your order {{2}} has shipped!')
  .addUrlButton('Track Order', 'https://example.com/track/{{1}}')
  .build();

const result = await wa.templates.create(request);
console.log('Created:', result.data.id, result.data.status);
```

## Webhook Verification (Manual)

```typescript
// Verify a GET subscription request
const challenge = wa.webhooks.verify(queryParams);

// Verify POST payload signature
const valid = wa.webhooks.verifySignature(rawBody, signature);

// Parse webhook payload into typed events
const events = wa.webhooks.parse(webhookPayload);
```

## Webhook with Express Middleware

```typescript
import express from 'express';

const app = express();

const middleware = wa.webhooks.createExpressMiddleware({
  onMessage: (message) => {
    console.log('Received message:', message);
  },
  onStatus: (status) => {
    console.log('Status update:', status);
  },
});

app.use('/webhook', middleware);
```

## Webhook with Next.js App Router

```typescript
// app/api/webhook/route.ts
const handler = wa.webhooks.createNextRouteHandler({
  onMessage: (message) => {
    console.log('Received message:', message);
  },
});

export const { GET, POST } = handler;
```

## Advanced: Access the HTTP Client

```typescript
// Make custom API calls using the underlying HTTP client
const response = await wa.client.get('/some/custom/endpoint');
```

## Cleanup

```typescript
// Call destroy() when your application shuts down
wa.destroy();
```

## Error Handling

```typescript
import { WhatsApp, ValidationError, ApiError } from '@abdelrahmannasr-wa/cloud-api';

// Construction error — missing required config
try {
  const wa = new WhatsApp({ accessToken: '', phoneNumberId: '' });
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Config error:', error.message, 'Field:', error.field);
  }
}

// Deferred error — accessing templates without businessAccountId
const wa = new WhatsApp({
  accessToken: 'token',
  phoneNumberId: 'phone123',
  // no businessAccountId!
});

try {
  await wa.templates.list(); // throws at access time
} catch (error) {
  if (error instanceof ValidationError) {
    console.error(error.message);
    // "businessAccountId is required for template operations..."
  }
}
```

## Comparison: Before and After

### Before (direct imports)

```typescript
import { HttpClient, Messages, Media, Templates } from '@abdelrahmannasr-wa/cloud-api';

const client = new HttpClient({
  accessToken: 'token',
  phoneNumberId: 'phone123',
  businessAccountId: 'waba456',
});

const messages = new Messages(client, 'phone123');
const media = new Media(client, 'phone123');
const templates = new Templates(client, 'waba456');

await messages.sendText({ to: '1234567890', body: 'Hello!' });
```

### After (unified client)

```typescript
import { WhatsApp } from '@abdelrahmannasr-wa/cloud-api';

const wa = new WhatsApp({
  accessToken: 'token',
  phoneNumberId: 'phone123',
  businessAccountId: 'waba456',
});

await wa.messages.sendText({ to: '1234567890', body: 'Hello!' });
```
