# Quickstart: Template Status Webhook Events

**Feature**: 012-template-status-webhooks
**Audience**: Consumers of `@abdelrahmannasr-wa/cloud-api` who already have webhook verification working and want to react to template approval/rejection/quality changes.

---

## Prerequisites

- Existing webhook endpoint working for message/status events (i.e. `wa.webhooks.createExpressMiddleware(...)` or equivalent is live).
- WABA app in the Meta App Dashboard with webhook subscriptions enabled for `message_template_status_update` and `message_template_quality_update` under the WhatsApp Business Account product. **The SDK does not toggle subscriptions** — the dashboard toggle is required.

---

## Unified-client usage (recommended)

```ts
import { WhatsApp } from '@abdelrahmannasr-wa/cloud-api';

const wa = new WhatsApp({
  accessToken: process.env.WA_TOKEN!,
  phoneNumberId: process.env.WA_PHONE_ID!,
  businessAccountId: process.env.WA_WABA_ID!,
  appSecret: process.env.WA_APP_SECRET!,
  webhookVerifyToken: process.env.WA_VERIFY_TOKEN!,
});

// 1. Register handlers for template events.
wa.webhooks
  .onTemplateStatus(async (event) => {
    switch (event.status) {
      case 'APPROVED':
        await db.markTemplateLive(event.templateId);
        break;
      case 'REJECTED':
        await alerts.page({
          template: event.templateName,
          language: event.language,
          reason: event.reason ?? 'no reason provided',
        });
        break;
      case 'PAUSED':
      case 'DISABLED':
        await db.deactivateCampaignsUsing(event.templateId);
        break;
      default:
        // Any new platform status — log and review before auto-acting.
        console.warn('Unhandled template status:', event.status);
    }
  })
  .onTemplateQuality(async (event) => {
    // previousScore is undefined for the first-ever rating.
    if (event.newScore === 'RED') {
      await throttle.pauseCampaign(event.templateId);
    } else if (event.newScore === 'YELLOW' && event.previousScore === 'GREEN') {
      await throttle.slowCampaign(event.templateId);
    }
  });

// 2. Mount the middleware as usual — the registered callbacks merge into
//    whatever you pass to createHandler / createExpressMiddleware.
const app = express();
app.use('/webhook', wa.webhooks.createExpressMiddleware({
  onMessage: (evt) => console.log('msg from', evt.contact.waId),
}));
```

---

## Standalone-handler usage

For consumers not using the unified `WhatsApp` client:

```ts
import { createWebhookHandler } from '@abdelrahmannasr-wa/cloud-api/webhooks';

const handler = createWebhookHandler(
  {
    appSecret: process.env.WA_APP_SECRET!,
    verifyToken: process.env.WA_VERIFY_TOKEN!,
  },
  {
    onTemplateStatus: (event) => { /* ... */ },
    onTemplateQuality: (event) => { /* ... */ },
  },
);

// Then wire handler.handleGet and handler.handlePost to your framework.
```

---

## Parsing payloads directly (no HTTP framework)

```ts
import { parseWebhookPayload } from '@abdelrahmannasr-wa/cloud-api/webhooks';

const events = parseWebhookPayload(rawJsonBody);
for (const event of events) {
  if (event.type === 'template_status' && event.status === 'REJECTED') {
    console.log(event.templateName, '→', event.reason);
  }
}
```

---

## What the events contain

### `TemplateStatusEvent`

```ts
{
  type: 'template_status',
  metadata: { businessAccountId: '123456789' },
  templateId: '987654321',
  templateName: 'order_confirmation',
  language: 'en_US',
  status: 'REJECTED',         // union-plus-string; unknown platform values pass through
  reason: 'ABUSIVE_CONTENT',  // undefined on APPROVED; 'NONE' is normalized to undefined
  otherInfo: { ... },         // opaque diagnostic bag; undefined if absent
  timestamp: Date              // from entry.time × 1000
}
```

### `TemplateQualityEvent`

```ts
{
  type: 'template_quality',
  metadata: { businessAccountId: '123456789' },
  templateId: '987654321',
  templateName: 'order_confirmation',
  language: 'en_US',
  newScore: 'YELLOW',         // union-plus-string
  previousScore: 'GREEN',     // undefined on first-ever rating
  timestamp: Date
}
```

Note: template events use `metadata.businessAccountId`. They do NOT carry `metadata.phoneNumberId` or `metadata.displayPhoneNumber` — those only exist on message/status/error/flow/order events.

---

## End-to-end verification

1. In the Meta App Dashboard, subscribe to `message_template_status_update` and `message_template_quality_update` for your WABA.
2. Submit a new template for review via `wa.templates.create(...)`.
3. Watch the logs for `template_status` events: first `PENDING`, then `APPROVED` or `REJECTED`.
4. For quality, wait until the template has received production traffic — quality ratings are batch-computed by the platform and can take hours to days to fire.
5. Run the example:

```bash
pnpm tsx examples/template-webhooks.ts
```

Send a simulated payload from a curl:

```bash
curl -X POST http://localhost:3000/webhook \
  -H 'Content-Type: application/json' \
  -H 'X-Hub-Signature-256: sha256=<sig>' \
  -d @specs/012-template-status-webhooks/quickstart.sample.json
```

(Signature generation for local testing uses the same `crypto.createHmac('sha256', APP_SECRET).update(rawBody).digest('hex')` pattern documented for the existing webhook examples.)

---

## Idempotency

The platform delivers webhooks **at-least-once**. The SDK does not deduplicate. If your handlers touch external state, use `(templateId, status, timestamp)` — or `(templateId, newScore, timestamp)` for quality events — as an idempotency tuple. This matches how the SDK's existing `StatusEvent` / `OrderEvent` paths behave.
