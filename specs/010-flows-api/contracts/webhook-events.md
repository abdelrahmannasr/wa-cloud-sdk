# Contract: Flow completion webhook events

**Files**:
- `src/webhooks/types.ts` (extend `WebhookInteractivePayload`, add `WebhookNfmReply`, add `FlowCompletionEvent`, extend `WebhookEvent` union, extend `WebhookHandlerCallbacks`)
- `src/webhooks/parser.ts` (extend `extractMessageEvents`)
- `src/webhooks/handler.ts` (extend dispatch switch)
- `src/webhooks/index.ts` (re-export new types)

## New types

### `WebhookNfmReply`

```ts
export interface WebhookNfmReply {
  readonly name: string;          // Always 'flow'
  readonly body: string;          // Typically 'Sent'
  readonly response_json: string; // Stringified form data
}
```

### Extended `WebhookInteractivePayload`

Edit the existing type at `src/webhooks/types.ts:126-137`:

```ts
export interface WebhookInteractivePayload {
  readonly type: 'button_reply' | 'list_reply' | 'nfm_reply'; // ← add 'nfm_reply'
  readonly button_reply?: { readonly id: string; readonly title: string };
  readonly list_reply?: {
    readonly id: string;
    readonly title: string;
    readonly description?: string;
  };
  readonly nfm_reply?: WebhookNfmReply; // ← new
}
```

### `FlowCompletionEvent`

```ts
export interface FlowCompletionEvent {
  readonly type: 'flow_completion';
  readonly metadata: EventMetadata;
  readonly contact: { readonly name: string; readonly waId: string };
  readonly messageId: string;
  readonly flowToken?: string;      // Always undefined in this release (Meta platform limitation)
  readonly responseJson: string;    // Raw string from platform
  readonly response: Record<string, unknown>; // Parsed, or {} on parse failure
  readonly timestamp: Date;
}
```

### Extended `WebhookEvent` union

```ts
export type WebhookEvent = MessageEvent | StatusEvent | ErrorEvent | FlowCompletionEvent;
```

### Extended `WebhookHandlerCallbacks`

```ts
export interface WebhookHandlerCallbacks {
  readonly onMessage?: (event: MessageEvent) => void | Promise<void>;
  readonly onStatus?: (event: StatusEvent) => void | Promise<void>;
  readonly onError?: (event: ErrorEvent) => void | Promise<void>;
  readonly onFlowCompletion?: (event: FlowCompletionEvent) => void | Promise<void>; // ← new
}
```

## Parser behavior

Edit `extractMessageEvents()` in `src/webhooks/parser.ts:49-72`. The change is local: divert `nfm_reply` messages to a `FlowCompletionEvent` **instead of** a `MessageEvent` (mutually exclusive — the same payload must not produce both event types).

```ts
for (const message of value.messages) {
  const contact = value.contacts?.find((c) => c.wa_id === message.from);
  const contactInfo = {
    name: contact?.profile.name ?? 'Unknown',
    waId: contact?.wa_id ?? message.from,
  };
  const timestamp = new Date(parseInt(message.timestamp, 10) * 1000);

  // NEW: divert nfm_reply to FlowCompletionEvent
  if (
    message.type === 'interactive' &&
    message.interactive?.type === 'nfm_reply' &&
    message.interactive.nfm_reply
  ) {
    const nfm = message.interactive.nfm_reply;
    let parsedResponse: Record<string, unknown> = {};
    try {
      const parsed: unknown = JSON.parse(nfm.response_json);
      if (typeof parsed === 'object' && parsed !== null) {
        parsedResponse = parsed as Record<string, unknown>;
      }
    } catch {
      // Malformed JSON — leave response as {}. Raw string still in responseJson.
      // DO NOT log the payload (FR-030, SC-015).
    }
    events.push({
      type: 'flow_completion',
      metadata,
      contact: contactInfo,
      messageId: message.id,
      responseJson: nfm.response_json,
      response: parsedResponse,
      timestamp,
    });
    continue;
  }

  // Existing behavior for all other message types (including button_reply, list_reply)
  events.push({
    type: 'message',
    metadata,
    contact: contactInfo,
    message,
    timestamp,
  });
}
```

## Handler dispatch

Edit the switch statement in `src/webhooks/handler.ts:94-104`:

```ts
for (const event of events) {
  switch (event.type) {
    case 'message':
      await callbacks.onMessage?.(event);
      break;
    case 'status':
      await callbacks.onStatus?.(event);
      break;
    case 'error':
      await callbacks.onError?.(event);
      break;
    case 'flow_completion':             // ← new
      await callbacks.onFlowCompletion?.(event);
      break;
  }
}
```

## Behavioral invariants

1. **Exclusivity**: For a given incoming message, the parser emits **exactly one** event. A flow completion emits a `FlowCompletionEvent` and nothing else. A button_reply still emits a `MessageEvent` (unchanged). A text message still emits a `MessageEvent` (unchanged).

2. **No logging of response data**: Neither the parser, handler, nor any downstream SDK code MAY pass `nfm_reply.response_json`, `responseJson`, or `response` to the SDK's logger. This applies at all log levels (including `debug`). Consumers who want to log response data do so explicitly from their own `onFlowCompletion` handler.

3. **Malformed JSON tolerance**: `JSON.parse` failure MUST NOT throw from the parser. The raw string is preserved in `responseJson`; `response` becomes `{}`. Webhook processing continues.

4. **`flowToken` is always undefined**: In this release, the parser does not attempt to populate `flowToken`. The field exists on the event type for future use; consumers MUST treat it as potentially undefined.

5. **Backward compatibility**: `button_reply` and `list_reply` events continue to flow through `onMessage` as before (FR-011). Consumers with only `onMessage` registered see no change to those events.

## Test coverage targets

### `tests/webhooks/parser.test.ts` — new `describe('flow completion events')` block:

1. **Diversion**: A webhook payload with `interactive.type: 'nfm_reply'` produces a single `FlowCompletionEvent`, and the same event does NOT appear as a `MessageEvent`
2. **Parsed response**: Valid `response_json` produces a populated `event.response` object
3. **Raw preservation**: `event.responseJson` equals the original string exactly (byte-for-byte)
4. **Malformed JSON tolerance**: Invalid `response_json` produces `event.response === {}` without throwing, and `event.responseJson` still equals the original raw string
5. **Button/list unchanged**: A `button_reply` webhook still produces a `MessageEvent` (regression check)
6. **Metadata preservation**: `messageId`, `contact.waId`, `timestamp` are populated correctly

**~5–6 new tests.**

### `tests/webhooks/handler.test.ts` — new `describe('onFlowCompletion callback')` block:

1. **Routing**: A `FlowCompletionEvent` invokes `onFlowCompletion` exactly once
2. **Isolation**: `onMessage` is NOT invoked for the same flow completion payload
3. **Coexistence**: A webhook payload containing both a text message AND a flow completion invokes `onMessage` once (for text) and `onFlowCompletion` once (for flow)

**~3 new tests.**

### `tests/webhooks/verify.test.ts` — no changes needed. Signature verification is orthogonal to event typing.

## Fixture helper

The existing `createPayload(value)` helper in `tests/webhooks/parser.test.ts:10-32` is sufficient for constructing flow completion test payloads. New fixture data added inline per test.

Example fixture for a flow completion:

```ts
const payload = createPayload({
  contacts: [{ profile: { name: 'Alice' }, wa_id: '15559876543' }],
  messages: [
    {
      from: '15559876543',
      id: 'wamid.flow1',
      timestamp: '1712620800',
      type: 'interactive',
      interactive: {
        type: 'nfm_reply',
        nfm_reply: {
          name: 'flow',
          body: 'Sent',
          response_json: JSON.stringify({
            screen_name: 'SUCCESS',
            form: { full_name: 'Alice Example', email: 'alice@example.com' },
          }),
        },
      },
    },
  ],
});
```

## Logging audit checklist (implementation verification)

Before merging, run:

```bash
grep -rnE 'logger\.(debug|info|warn|error).*response' src/webhooks/
```

Expected output: **zero matches**. If any match appears, the feature violates FR-030 and must be fixed.

## Consumer API example

```ts
const wa = new WhatsApp({ accessToken, phoneNumberId, appSecret, webhookVerifyToken });

const handler = wa.webhooks.createHandler({
  onMessage: async (event) => {
    // Handles text, image, button_reply, list_reply, etc. — unchanged behavior
    console.log(`Message from ${event.contact.waId}: ${event.message.type}`);
  },
  onFlowCompletion: async (event) => {
    // Dedicated flow completion handler
    const { messageId, contact, response } = event;
    // Consumer-side dedup using messageId (SDK does not dedup)
    if (await alreadyProcessed(messageId)) return;
    await markProcessed(messageId);
    // Consumer explicitly chooses to log response data after their own review
    await persistFormSubmission(contact.waId, response);
  },
});
```
