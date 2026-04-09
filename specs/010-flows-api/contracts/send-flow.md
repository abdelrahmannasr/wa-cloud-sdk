# Contract: `Messages.sendFlow()` method

**File**: `src/messages/messages.ts`
**Type definition**: `src/messages/types.ts`
**Barrel export**: `src/messages/index.ts` (add `FlowMessageOptions`)

## Method signature

```ts
async sendFlow(
  options: FlowMessageOptions,
  requestOptions?: RequestOptions,
): Promise<ApiResponse<MessageResponse>>
```

Insertion point: after `sendLocationRequest` at `src/messages/messages.ts:417-430`.

## Input type

`FlowMessageOptions` (defined in `data-model.md §15`). Extends `BaseMessageOptions` for `to` and `replyTo` consistency with other send methods.

## HTTP contract

- **Method**: POST
- **Path**: `{phoneNumberId}/messages` (inherited from `send()` helper)
- **Body shape**:

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "<validated digits>",
  "type": "interactive",
  "context": { "message_id": "<replyTo trimmed>" },
  "interactive": {
    "type": "flow",
    "header": { ... if provided ... },
    "body": { "text": "<options.body>" },
    "footer": { "text": "<options.footer>" },
    "action": {
      "name": "flow",
      "parameters": {
        "flow_message_version": "3",
        "flow_id": "<options.flowId>",
        "flow_cta": "<options.flowCta>",
        "mode": "published",
        "flow_action": "navigate",
        "flow_token": "<options.flowToken>",
        "flow_action_payload": { "screen": "<name>", "data": {...} }
      }
    }
  }
}
```

## Implementation detail

```ts
async sendFlow(
  options: FlowMessageOptions,
  requestOptions?: RequestOptions,
): Promise<ApiResponse<MessageResponse>> {
  const parameters: Record<string, unknown> = {
    flow_message_version: options.flowMessageVersion ?? '3',
    flow_id: options.flowId,
    flow_cta: options.flowCta,
    mode: options.mode ?? 'published',
    flow_action: options.flowAction ?? 'navigate',
    ...(options.flowToken ? { flow_token: options.flowToken } : {}),
    ...(options.flowActionPayload ? { flow_action_payload: options.flowActionPayload } : {}),
  };
  const payload = {
    ...this.buildBasePayload(options.to, 'interactive', options.replyTo),
    interactive: {
      type: 'flow',
      body: { text: options.body },
      action: { name: 'flow', parameters },
      ...this.buildInteractiveOptionals(options.header, options.footer),
    },
  };
  return this.send(payload, requestOptions);
}
```

## Field assembly rules

| FlowMessageOptions field | Wire field | Default | Notes |
|---|---|---|---|
| `to` | `to` | — | Validated via `validatePhoneNumber()` inside `buildBasePayload` |
| `replyTo` | `context.message_id` | omit | Trimmed; whitespace-only is treated as absent |
| `body` | `interactive.body.text` | — | Required |
| `flowCta` | `interactive.action.parameters.flow_cta` | — | Required |
| `flowId` | `interactive.action.parameters.flow_id` | — | Required |
| `flowToken` | `interactive.action.parameters.flow_token` | omit if absent | Optional |
| `mode` | `interactive.action.parameters.mode` | `'published'` | Per FR-002 |
| `flowAction` | `interactive.action.parameters.flow_action` | `'navigate'` | |
| `flowActionPayload` | `interactive.action.parameters.flow_action_payload` | omit if absent | |
| `flowMessageVersion` | `interactive.action.parameters.flow_message_version` | `'3'` | Per FR-002a |
| `header` | `interactive.header` | omit if absent | Via `buildInteractiveOptionals` |
| `footer` | `interactive.footer` | omit if absent | Via `buildInteractiveOptionals` — wraps as `{ text: footer }` |

## Reused helpers

- `this.buildBasePayload(to, type, replyTo)` — `src/messages/messages.ts:475-495`
- `this.buildInteractiveOptionals(header, footer)` — `src/messages/messages.ts:497-505`
- `this.send(payload, requestOptions)` — existing private send helper

No new helpers needed.

## Test coverage targets

In `tests/messages/messages.test.ts` → new `describe('sendFlow')` block:

1. **Basic shape** — minimal options (to, body, flowCta, flowId) → asserts complete payload structure with defaults (`mode='published'`, `flow_action='navigate'`, `flow_message_version='3'`)
2. **Draft mode** — `mode='draft'` → asserts mode is sent as 'draft'
3. **Per-call version override** — `flowMessageVersion='4'` → asserts custom version on the wire
4. **Correlation token** — `flowToken='abc'` → asserts token on the wire
5. **Initial screen + data** — `flowActionPayload={ screen: 'X', data: {k:'v'} }` → asserts nested payload
6. **Reply-to** — `replyTo='wamid.123'` → asserts `context.message_id`
7. **Header + footer** — text header + footer → asserts nested `interactive.header` and `interactive.footer.text`
8. **Phone validation error** — invalid `to` → asserts `ValidationError` thrown

Total: ~8 new tests.

## Assertion pattern

Follow the existing pattern from `tests/messages/messages.test.ts:651-678` (`sendInteractiveCta` test). Extract payload via `postSpy.mock.calls[0]![1]` and use `expect(payload).toMatchObject({...})`.

## TSDoc requirement

Include `@example` demonstrating:

```ts
await messages.sendFlow({
  to: '15551234567',
  body: 'Complete your appointment booking',
  flowCta: 'Book Now',
  flowId: '1234567890',
  flowActionPayload: {
    screen: 'SELECT_DATE',
    data: { default_date: '2026-04-15' },
  },
});
```

## Non-functional contract

- **Logging**: `sendFlow` does NOT emit the flow body, CTA, or any parameters to the logger (FR-030 applies to response data, but as a matter of consistency, request bodies are also not logged by the SDK — the existing `HttpClient` already abstracts that away).
- **Rate limiting**: Inherited from `HttpClient`. No separate bucket.
- **Retry**: Inherited from `withRetry` wrapper.
- **Backward compatibility**: Purely additive. Existing message methods unchanged.
