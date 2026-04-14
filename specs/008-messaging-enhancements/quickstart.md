# Quickstart: Messaging Enhancements (v0.2.0)

**Branch**: `008-messaging-enhancements` | **Date**: 2026-04-07

## Validation Scenarios

### 1. Reply-to Context

```ts
const wa = new WhatsApp({ accessToken: '...', phoneNumberId: '...' });

// Reply to a specific message
await wa.messages.sendText({
  to: '1234567890',
  body: 'Thanks for your question! Here is the answer...',
  replyTo: 'wamid.HBgNMTIzNDU2Nzg5MDIFEQ',
});

// Works with any message type
await wa.messages.sendImage({
  to: '1234567890',
  media: { link: 'https://example.com/product.jpg' },
  caption: 'Here is the product you asked about',
  replyTo: 'wamid.HBgNMTIzNDU2Nzg5MDIFEQ',
});

// Without replyTo — unchanged behavior
await wa.messages.sendText({ to: '1234567890', body: 'Hello!' });
```

**Verify**: Payload includes `context: { message_id: 'wamid...' }` when `replyTo` is set. No context when omitted.

### 2. CTA URL Button

```ts
await wa.messages.sendInteractiveCta({
  to: '1234567890',
  body: 'Check out our latest collection!',
  buttonText: 'Shop Now',
  url: 'https://example.com/shop',
});

// With header and dynamic URL parameter
await wa.messages.sendInteractiveCta({
  to: '1234567890',
  body: 'Your order is ready for tracking',
  buttonText: 'Track Order',
  url: 'https://example.com/track',
  urlSuffix: 'order-12345',
  header: { type: 'text', text: 'Order Update' },
  footer: 'Tap to view tracking details',
});
```

**Verify**: Platform accepts payload. Recipient sees tappable URL button.

### 3. Location Request

```ts
await wa.messages.sendLocationRequest({
  to: '1234567890',
  body: 'Please share your delivery address so we can estimate arrival time.',
});
```

**Verify**: Recipient sees "Send location" button. Tapping it shares GPS coordinates.

### 4. Typing Indicator

```ts
// Show typing while processing
await wa.messages.sendTypingIndicator({ to: '1234567890' });

// ... perform some work ...

await wa.messages.sendText({ to: '1234567890', body: 'Here is your result!' });
```

**Verify**: "typing..." appears in chat, then disappears when message arrives.

### 5. Subpath Imports

```ts
// Import only what you need
import { Media, MEDIA_CONSTRAINTS } from '@abdelrahmannasr-wa/cloud-api/media';
import { Templates, TemplateBuilder } from '@abdelrahmannasr-wa/cloud-api/templates';
import { PhoneNumbers } from '@abdelrahmannasr-wa/cloud-api/phone-numbers';
import { WhatsAppMultiAccount, RoundRobinStrategy } from '@abdelrahmannasr-wa/cloud-api/multi-account';
```

**Verify**: Each import resolves in both ESM and CJS. Types are available.

### 6. Conversation Pricing

```ts
import { extractConversationPricing } from '@abdelrahmannasr-wa/cloud-api';

// Inside webhook handler
const handler = createWebhookHandler(config, {
  onStatus(event) {
    const pricing = extractConversationPricing(event);
    if (pricing) {
      console.log(`Billable: ${pricing.billable}, Category: ${pricing.category}`);
    }
  },
});
```

**Verify**: Returns structured pricing for events with pricing data. Returns null otherwise.

## Full Validation Checklist

- [ ] Reply-to with sendText — payload includes context
- [ ] Reply-to with sendImage — payload includes context
- [ ] Reply-to omitted — no context in payload (backward compat)
- [ ] Reply-to empty string — silently ignored
- [ ] CTA URL button — platform accepts payload
- [ ] CTA URL with dynamic parameter — urlSuffix applied
- [ ] Location request — platform accepts payload
- [ ] Typing indicator — platform accepts payload
- [ ] Import from `./media` — resolves in ESM and CJS
- [ ] Import from `./templates` — resolves in ESM and CJS
- [ ] Import from `./phone-numbers` — resolves in ESM and CJS
- [ ] Import from `./multi-account` — resolves in ESM and CJS
- [ ] Pricing extraction — returns structured data
- [ ] Pricing extraction — returns null for missing data
- [ ] All existing tests pass unchanged
- [ ] Coverage >= 80% on all axes
- [ ] Zero runtime dependencies
- [ ] Build produces ESM + CJS + DTS for all entry points
