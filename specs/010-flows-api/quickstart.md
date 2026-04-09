# Quickstart: WhatsApp Flows API

**Feature**: 010-flows-api
**Audience**: SDK consumers — developers integrating the `@abdelrahmannasr-wa/cloud-api` package into their own application or platform.

This guide shows how to use every capability the Flows API ships with, in the order a consumer is likely to need them. Each section is runnable as-is once you have a WhatsApp Business Account, a phone number ID, and an access token.

## Prerequisites

```bash
pnpm add @abdelrahmannasr-wa/cloud-api
# or
npm install @abdelrahmannasr-wa/cloud-api
```

- Node.js 18+
- A WhatsApp Business Account (WABA) ID for flow administration
- A phone number ID for sending flows
- An access token with `whatsapp_business_management` and `whatsapp_business_messaging` scopes
- (For receiving flow completions) a configured webhook with `appSecret` and `verifyToken`

## 1. Send an existing flow to a user

The simplest use case: you've authored a flow in Meta's Business Manager and want to deliver it to a user.

```ts
import { WhatsApp } from '@abdelrahmannasr-wa/cloud-api';

const wa = new WhatsApp({
  accessToken: process.env.WA_ACCESS_TOKEN!,
  phoneNumberId: process.env.WA_PHONE_NUMBER_ID!,
});

await wa.messages.sendFlow({
  to: '15551234567',
  body: 'Please complete your appointment booking.',
  flowCta: 'Book Now',
  flowId: '1234567890',  // Your published flow ID
});
```

That's it. The recipient sees an interactive flow invitation with the body text and a "Book Now" call-to-action button.

## 2. Test a draft flow before publishing

Send in draft mode to preview a flow without publishing it. Useful during development.

```ts
await wa.messages.sendFlow({
  to: '15551234567',
  body: 'Preview build — test the onboarding flow',
  flowCta: 'Start',
  flowId: '1234567890',
  mode: 'draft', // ← defaults to 'published' if omitted
});
```

## 3. Pre-populate initial screen and data

Pass an initial screen name and data to open the flow at a specific point with pre-populated context.

```ts
await wa.messages.sendFlow({
  to: '15551234567',
  body: 'Review your profile details',
  flowCta: 'Continue',
  flowId: '1234567890',
  flowActionPayload: {
    screen: 'EDIT_PROFILE',
    data: {
      name: 'Alice Johnson',
      email: 'alice@example.com',
    },
  },
});
```

## 4. Correlate sends with responses (best-effort)

Attach a correlation token to match flow completions back to the original send. **Note**: Meta does not echo this token back by default; it's only returned if your flow's terminal screen or Data Endpoint response explicitly preserves it.

```ts
const correlationId = crypto.randomUUID();

await wa.messages.sendFlow({
  to: '15551234567',
  body: 'Quick survey',
  flowCta: 'Start Survey',
  flowId: '1234567890',
  flowToken: correlationId,
});

// Store correlationId → user mapping in your own DB for later matching
```

If your flow doesn't preserve the token, match by `(contact.waId, timestamp window)` instead.

## 5. Receive flow completions via webhook

Flow completions arrive as a dedicated `FlowCompletionEvent`, NOT as a regular `onMessage` event. Register a separate callback.

```ts
import { WhatsApp } from '@abdelrahmannasr-wa/cloud-api';

const wa = new WhatsApp({
  accessToken: process.env.WA_ACCESS_TOKEN!,
  phoneNumberId: process.env.WA_PHONE_NUMBER_ID!,
  appSecret: process.env.WA_APP_SECRET!,
  webhookVerifyToken: process.env.WA_WEBHOOK_VERIFY_TOKEN!,
});

const handler = wa.webhooks.createHandler({
  onMessage: async (event) => {
    // Text, images, button replies, list replies — unchanged behavior
    console.log(`Message from ${event.contact.waId}: ${event.message.type}`);
  },
  onFlowCompletion: async (event) => {
    // Dedicated flow submission handler

    // IMPORTANT: flow completions can be delivered more than once
    // (Meta retries on handler errors). Dedupe using event.messageId.
    if (await db.isProcessed(event.messageId)) {
      return;
    }
    await db.markProcessed(event.messageId);

    // event.response is the parsed form data (or {} if parsing failed)
    // event.responseJson is the raw string (preserved exactly)
    const formData = event.response;

    // Your own persistence / business logic:
    await crm.saveSubmission({
      userPhone: event.contact.waId,
      name: event.contact.name,
      data: formData,
      messageId: event.messageId,
      receivedAt: event.timestamp,
    });
  },
});

// Wire `handler` into your HTTP framework of choice:
// Express: app.use('/webhook', wa.webhooks.createExpressMiddleware({...}));
// Next.js: export { GET, POST } = wa.webhooks.createNextRouteHandler({...});
```

### Key behavioral points

- **At-least-once delivery**: Meta retries on handler timeouts / errors. You MUST implement idempotency using `event.messageId` as the dedup key. The SDK is stateless and does not dedupe for you.
- **No PII in SDK logs**: The SDK never emits `event.response` or `event.responseJson` to its configured logger at any level. Any logs you see with response data came from your own handler code. If you want to log response data, you must do it explicitly in your handler — after deciding whether your data is safe to log.
- **Exclusive routing**: A flow completion payload invokes `onFlowCompletion` only. It does NOT also invoke `onMessage`. Button replies and list replies continue to invoke `onMessage` unchanged.
- **Malformed JSON tolerance**: If `response_json` is malformed, you still receive the event with `event.response === {}` and `event.responseJson === <raw string>`. Webhook processing does not halt.

## 6. Create a new flow programmatically

For platforms that manage flow content in code (CMS, CI/CD, migration tools).

```ts
const wa = new WhatsApp({
  accessToken: process.env.WA_ACCESS_TOKEN!,
  phoneNumberId: process.env.WA_PHONE_NUMBER_ID!,
  businessAccountId: process.env.WA_BUSINESS_ACCOUNT_ID!, // ← Required for flow admin
});

const result = await wa.flows.create({
  name: 'customer_onboarding_v2',
  categories: ['SIGN_UP'],
  // flow_json is optional at create time; you can upload via updateAssets() later
});

console.log(`Flow created: ${result.data.id}`);

if (result.data.validation_errors && result.data.validation_errors.length > 0) {
  for (const error of result.data.validation_errors) {
    console.error(`${error.error_type}: ${error.message}`);
    if (error.line_start !== undefined) {
      console.error(`  at line ${error.line_start}, column ${error.column_start}`);
    }
  }
}
```

## 7. Upload the flow definition

Use `updateAssets()` for the flow JSON. The SDK accepts either a pre-serialized string or a structured object (which it stringifies for you).

```ts
// Option A: As an object (SDK stringifies internally)
const flowDefinition = {
  version: '3.0',
  screens: [
    {
      id: 'WELCOME',
      title: 'Welcome',
      layout: { type: 'SingleColumnLayout', children: [/* ... */] },
    },
    // ... more screens
  ],
};

await wa.flows.updateAssets(result.data.id, {
  flow_json: flowDefinition,
});

// Option B: As a pre-serialized string
await wa.flows.updateAssets(result.data.id, {
  flow_json: JSON.stringify(flowDefinition),
});
```

## 8. Publish the flow

Once the flow JSON is valid, publish it.

```ts
await wa.flows.publish(result.data.id);
// Flow is now in PUBLISHED status and can be sent with mode: 'published'
```

## 9. Generate a stakeholder preview link

Share a temporary URL with a non-technical reviewer (product manager, designer) to interact with the flow in a browser.

```ts
const preview = await wa.flows.getPreview(result.data.id);
console.log(`Preview URL: ${preview.data.preview.preview_url}`);
console.log(`Expires at: ${preview.data.preview.expires_at}`);
```

## 10. List, get, update metadata, deprecate, delete

Full lifecycle operations.

```ts
// List flows with pagination
const page1 = await wa.flows.list({ limit: 10 });
for (const flow of page1.data.data) {
  console.log(`${flow.id}: ${flow.name} (${flow.status})`);
}

// Get a specific flow
const flow = await wa.flows.get('1234567890');
console.log(flow.data.status);

// Update metadata only (not the flow JSON)
await wa.flows.updateMetadata('1234567890', {
  name: 'customer_onboarding_v3',
  categories: ['SIGN_UP', 'LEAD_GENERATION'],
});

// Deprecate a published flow
await wa.flows.deprecate('1234567890');

// Delete a draft flow (platform only allows deleting drafts)
await wa.flows.delete('1234567890');
```

## 11. Multi-account broadcast with flows

Use the existing generic `broadcast()` API with a factory function. **Important**: a flow identifier is scoped to a single WhatsApp Business Account. If you are broadcasting across accounts, each account has its own flow ID even for the "same" conceptual flow — maintain a mapping from conceptual name to per-account flow ID.

```ts
import { WhatsAppMultiAccount, RoundRobinStrategy } from '@abdelrahmannasr-wa/cloud-api';

const manager = new WhatsAppMultiAccount({
  accounts: [
    { name: 'us', config: { accessToken: '...', phoneNumberId: 'phone_us' } },
    { name: 'eu', config: { accessToken: '...', phoneNumberId: 'phone_eu' } },
  ],
  strategy: new RoundRobinStrategy(),
});

// Per-account flow ID map (the same conceptual flow has a different ID per WABA)
const flowIdByAccount = {
  us: 'flow_id_in_us_account',
  eu: 'flow_id_in_eu_account',
};

const result = await manager.broadcast(
  ['15551234567', '15559876543', '442071234567'],
  (account, recipient) => account.messages.sendFlow({
    to: recipient,
    body: 'Complete your registration',
    flowCta: 'Get Started',
    flowId: flowIdByAccount[account.name as keyof typeof flowIdByAccount],
  }),
  { concurrency: 5 },
);

console.log(`Sent: ${result.succeeded.length}, Failed: ${result.failed.length}`);
```

## 12. Subpath import for tree-shaking

If you only need flow functionality and want to enable tree-shaking in your bundler, import from the subpath:

```ts
import { Flows } from '@abdelrahmannasr-wa/cloud-api/flows';
import { HttpClient } from '@abdelrahmannasr-wa/cloud-api';

const client = new HttpClient({ accessToken: '...', phoneNumberId: '...' });
const flows = new Flows(client, 'business_account_id');

const list = await flows.list({ limit: 10 });
```

`FlowMessageOptions` is available via `@abdelrahmannasr-wa/cloud-api/messages`, and `FlowCompletionEvent` via `@abdelrahmannasr-wa/cloud-api/webhooks`. All symbols are also accessible from the main barrel.

## Verification checklist

After adding the feature to your integration, verify each capability works end-to-end:

- [ ] Create a flow with `wa.flows.create()` — receive an ID
- [ ] Upload flow JSON with `wa.flows.updateAssets()` — no validation errors
- [ ] Publish with `wa.flows.publish()` — status transitions to PUBLISHED
- [ ] Send the flow to a test number with `wa.messages.sendFlow()` — recipient receives the interactive invitation
- [ ] User submits the flow — your `onFlowCompletion` handler fires with the parsed response
- [ ] Verify `event.messageId` is stable across retries (simulate by returning 5xx once, then 2xx)
- [ ] Verify no flow response data appears in the SDK's logger output
- [ ] Deprecate the flow with `wa.flows.deprecate()` — status transitions
- [ ] Delete a draft flow with `wa.flows.delete()` — removed from list
- [ ] Attempt to delete a published flow — receive a typed error

## Further reading

- Spec: `specs/010-flows-api/spec.md`
- Research decisions: `specs/010-flows-api/research.md`
- Data model: `specs/010-flows-api/data-model.md`
- Contracts: `specs/010-flows-api/contracts/`
- Meta Flows documentation: [developers.facebook.com/docs/whatsapp/flows](https://developers.facebook.com/docs/whatsapp/flows)
