# Data Model: Unified WhatsApp Client

**Feature**: 004-unified-whatsapp-client
**Date**: 2026-02-14

## Entities

This feature introduces no new data entities. The unified client is a facade that composes existing modules. All existing types (`WhatsAppConfig`, `Messages`, `Media`, `Templates`, webhook types) remain unchanged.

### New Types

#### WhatsApp (class)

The top-level entry-point class. Composes all SDK modules under a single instance.

| Property | Type | Access | Initialization | Description |
|----------|------|--------|----------------|-------------|
| messages | Messages | getter (readonly) | Eager | Message-sending operations |
| media | Media | getter (readonly) | Eager | Media upload/download operations |
| templates | Templates | getter (readonly) | Lazy (throws if no businessAccountId) | Template CRUD operations |
| webhooks | Webhooks | getter (readonly) | Lazy (always available) | Webhook verification, parsing, handlers |
| client | HttpClient | getter (readonly) | Eager | Underlying HTTP client for advanced use |

**Constructor**: `WhatsApp(config: WhatsAppConfig)`

**Validation at construction**:
- `accessToken` must be a non-empty string → throws `ValidationError` with field `'accessToken'`
- `phoneNumberId` must be a non-empty string → throws `ValidationError` with field `'phoneNumberId'`

**Methods**:
- `destroy(): void` — delegates to `HttpClient.destroy()` for resource cleanup

#### Webhooks (class)

Wraps existing standalone webhook functions with pre-bound configuration.

| Method | Parameters | Returns | Required Config |
|--------|------------|---------|-----------------|
| verify | params: `Record<string, string \| string[] \| undefined>` | `string` (challenge) | webhookVerifyToken |
| verifySignature | rawBody: `Buffer \| string`, signature: `string \| undefined` | `boolean` | appSecret |
| parse | payload: `WebhookPayload` | `WebhookEvent[]` | (none) |
| createHandler | callbacks: `WebhookHandlerCallbacks` | `WebhookHandler` | appSecret, webhookVerifyToken |
| createExpressMiddleware | callbacks: `WebhookHandlerCallbacks` | Express middleware | appSecret, webhookVerifyToken |
| createNextRouteHandler | callbacks: `WebhookHandlerCallbacks` | `{ GET, POST }` | appSecret, webhookVerifyToken |

**Deferred validation**: Methods that require `appSecret` or `webhookVerifyToken` throw `ValidationError` at invocation if the corresponding config field was not provided.

## Existing Types (unchanged)

The following types are reused without modification:

- `WhatsAppConfig` — constructor config interface (from `src/client/types.ts`)
- `Messages` — message-sending class (from `src/messages/messages.ts`)
- `Media` — media operations class (from `src/media/media.ts`)
- `Templates` — template CRUD class (from `src/templates/templates.ts`)
- `HttpClient` — HTTP client (from `src/client/http-client.ts`)
- `ValidationError` — error class for config validation (from `src/errors/errors.ts`)
- All webhook types — `WebhookPayload`, `WebhookEvent`, `WebhookConfig`, `WebhookHandlerCallbacks`, `WebhookHandler`, `WebhookHandlerResult`, `WebhookRequest`, `WebhookResponse`, `WebhookNextFunction` (from `src/webhooks/types.ts`)

## Relationships

```
WhatsApp
├── owns HttpClient (1:1, eager)
├── owns Messages (1:1, eager, shares HttpClient)
├── owns Media (1:1, eager, shares HttpClient)
├── owns Templates (1:1, lazy, shares HttpClient)
└── owns Webhooks (1:1, lazy, uses config values)
```

All module instances share the same `HttpClient`, ensuring consistent rate limiting, retry behavior, and authentication across all operations.
