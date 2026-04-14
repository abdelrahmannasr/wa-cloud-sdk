# API Contract: Unified WhatsApp Client

**Feature**: 004-unified-whatsapp-client
**Date**: 2026-02-14

## SDK Public API

### WhatsApp Class

```typescript
import { WhatsAppConfig } from './client/types.js';
import { Messages } from './messages/messages.js';
import { Media } from './media/media.js';
import { Templates } from './templates/templates.js';
import { Webhooks } from './webhooks/webhooks.js';
import { HttpClient } from './client/http-client.js';

class WhatsApp {
  /**
   * Creates a unified WhatsApp Cloud API client.
   * @throws ValidationError if accessToken or phoneNumberId is missing/empty
   */
  constructor(config: WhatsAppConfig)

  /** Message-sending operations (text, image, video, audio, etc.) */
  get messages(): Messages

  /** Media upload, download, URL retrieval, and deletion */
  get media(): Media

  /**
   * Template CRUD operations (list, get, create, update, delete).
   * @throws ValidationError if businessAccountId was not provided in config
   */
  get templates(): Templates

  /** Webhook verification, parsing, and handler/middleware creation */
  get webhooks(): Webhooks

  /** Underlying HTTP client for advanced/custom API calls */
  get client(): HttpClient

  /** Cleans up internal resources (rate limiter intervals). Call when done. */
  destroy(): void
}
```

### Webhooks Class

```typescript
import {
  WebhookPayload,
  WebhookEvent,
  WebhookHandlerCallbacks,
  WebhookHandler,
  WebhookRequest,
  WebhookResponse,
  WebhookNextFunction,
} from './types.js';

class Webhooks {
  /**
   * @param config - WhatsAppConfig containing appSecret and webhookVerifyToken
   */
  constructor(config: WhatsAppConfig)

  /**
   * Verify a webhook subscription request (GET endpoint).
   * @throws ValidationError if webhookVerifyToken was not provided in config
   * @throws WebhookVerificationError if verification fails
   */
  verify(params: Record<string, string | string[] | undefined>): string

  /**
   * Verify the signature of an incoming webhook payload.
   * @throws ValidationError if appSecret was not provided in config
   * @throws WebhookVerificationError if signature is invalid
   */
  verifySignature(rawBody: Buffer | string, signature: string | undefined): boolean

  /**
   * Parse a webhook payload into typed events.
   * No config required — always available.
   */
  parse(payload: WebhookPayload): WebhookEvent[]

  /**
   * Create a webhook handler with typed callbacks.
   * @throws ValidationError if appSecret or webhookVerifyToken was not provided
   */
  createHandler(callbacks: WebhookHandlerCallbacks): WebhookHandler

  /**
   * Create Express middleware for webhook handling.
   * @throws ValidationError if appSecret or webhookVerifyToken was not provided
   */
  createExpressMiddleware(
    callbacks: WebhookHandlerCallbacks,
  ): (req: WebhookRequest, res: WebhookResponse, next: WebhookNextFunction) => void

  /**
   * Create Next.js App Router handler for webhook handling.
   * @throws ValidationError if appSecret or webhookVerifyToken was not provided
   */
  createNextRouteHandler(
    callbacks: WebhookHandlerCallbacks,
  ): { GET: (request: Request) => Response; POST: (request: Request) => Promise<Response> }
}
```

## Module Accessor Mapping

| Accessor | Delegates To | Constructor Args | Initialization |
|----------|-------------|------------------|----------------|
| `wa.messages` | `new Messages(httpClient, phoneNumberId)` | From config | Eager |
| `wa.media` | `new Media(httpClient, phoneNumberId)` | From config | Eager |
| `wa.templates` | `new Templates(httpClient, businessAccountId)` | From config (optional) | Lazy |
| `wa.webhooks` | `new Webhooks(config)` | Full config | Lazy |
| `wa.client` | `new HttpClient(config)` | Full config | Eager |

## Error Contract

### Construction-Time Errors

| Condition | Error Type | Error Message | Field |
|-----------|-----------|---------------|-------|
| Missing/empty `accessToken` | `ValidationError` | `"accessToken is required"` | `accessToken` |
| Missing/empty `phoneNumberId` | `ValidationError` | `"phoneNumberId is required"` | `phoneNumberId` |

### Deferred Access Errors

| Condition | Error Type | Error Message | Field |
|-----------|-----------|---------------|-------|
| Access `templates` without `businessAccountId` | `ValidationError` | `"businessAccountId is required for template operations. Provide it in the WhatsApp constructor config."` | `businessAccountId` |
| Call `webhooks.verify()` without `webhookVerifyToken` | `ValidationError` | `"webhookVerifyToken is required for webhook verification. Provide it in the WhatsApp constructor config."` | `webhookVerifyToken` |
| Call `webhooks.verifySignature()` without `appSecret` | `ValidationError` | `"appSecret is required for webhook signature verification. Provide it in the WhatsApp constructor config."` | `appSecret` |
| Call `webhooks.createHandler()` without full webhook config | `ValidationError` | `"appSecret and webhookVerifyToken are required for webhook handler creation. Provide them in the WhatsApp constructor config."` | `appSecret` |
| Call `webhooks.createExpressMiddleware()` without full webhook config | `ValidationError` | (same as createHandler) | `appSecret` |
| Call `webhooks.createNextRouteHandler()` without full webhook config | `ValidationError` | (same as createHandler) | `appSecret` |

## Barrel Export Updates

The following additions to `src/index.ts`:

```typescript
// New exports
export { WhatsApp } from './whatsapp.js';
export { Webhooks } from './webhooks/webhooks.js';

// All existing exports remain unchanged
```
