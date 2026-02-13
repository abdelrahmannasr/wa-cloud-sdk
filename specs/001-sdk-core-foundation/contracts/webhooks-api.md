# API Contract: Webhooks

**Module**: `@abdelrahmannasr-wa/cloud-api` (main) or `@abdelrahmannasr-wa/cloud-api/webhooks`

## Functions

### verifyWebhook(params, expectedToken) → string

Handles webhook subscription verification (GET endpoint).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| params | Record\<string, string \| string[] \| undefined\> | Yes | Query parameters from GET request |
| expectedToken | string | Yes | Expected verify token |

**Behavior**:
1. Extracts `hub.mode`, `hub.verify_token`, `hub.challenge` from params
2. Validates mode is `"subscribe"`
3. Validates token matches `expectedToken`
4. Returns challenge string on success

**Throws**: `WebhookVerificationError` if mode is wrong, token doesn't match, or challenge is missing.

---

### verifySignature(rawBody, signature, appSecret) → boolean

Verifies HMAC-SHA256 signature of webhook POST payload.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| rawBody | Buffer \| string | Yes | Raw request body bytes |
| signature | string \| undefined | Yes | `X-Hub-Signature-256` header value |
| appSecret | string | Yes | App secret from Meta dashboard |

**Behavior**:
1. Validates signature is present and has `sha256=` prefix
2. Computes HMAC-SHA256 of rawBody using appSecret
3. Compares computed hash with provided hash using timing-safe comparison
4. Returns `true` if valid, `false` if invalid

**Security**: Uses `crypto.timingSafeEqual` to prevent timing side-channel attacks.

---

### parseWebhookPayload(payload) → WebhookEvent[]

Parses raw webhook JSON into typed event objects.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| payload | WebhookPayload | Yes | Parsed JSON body matching Meta's webhook schema |

**Behavior**:
1. Validates `payload.object` is `"whatsapp_business_account"` (returns empty array if not)
2. Iterates `entry[].changes[]` where `field === "messages"`
3. Extracts messages → `MessageEvent[]` (with contact name resolution)
4. Extracts statuses → `StatusEvent[]`
5. Extracts errors → `ErrorEvent[]`
6. Returns flat array of all events

**Returns**: `WebhookEvent[]` (may be empty if no processable events)

---

### createWebhookHandler(config, callbacks) → WebhookHandler

Creates a webhook handler with GET verification and POST event processing.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| config | WebhookConfig | Yes | `{ appSecret, verifyToken }` |
| callbacks | WebhookHandlerCallbacks | Yes | `{ onMessage?, onStatus?, onError? }` |

**Returns**: `{ handleGet, handlePost }`

#### handler.handleGet(params) → WebhookHandlerResult

| Returns | When |
|---------|------|
| `{ statusCode: 200, body: challenge }` | Valid verification request |
| `{ statusCode: 403, body: "Forbidden" }` | Invalid mode, token, or missing challenge |

#### handler.handlePost(rawBody, signature) → Promise\<WebhookHandlerResult\>

| Returns | When |
|---------|------|
| `{ statusCode: 200, body: "OK" }` | Successfully processed |
| `{ statusCode: 403, body: "Invalid signature" }` | Signature verification failed |
| `{ statusCode: 400, body: "..." }` | Malformed payload |
| `{ statusCode: 500, body: "..." }` | Callback threw an error |

**Callback invocation order**: For each event in parsed payload, the matching callback is invoked sequentially. If a callback throws, remaining events are skipped.

---

### createExpressMiddleware(config, callbacks) → middleware

Creates Express-compatible middleware.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| config | WebhookConfig | Yes | `{ appSecret, verifyToken }` |
| callbacks | WebhookHandlerCallbacks | Yes | Event callbacks |

**Returns**: `(req, res, next) => void`

**Behavior by method**:
- `GET`: Runs `handleGet`, sends response
- `POST`: Extracts raw body from `req.rawBody`, runs `handlePost`, sends response. Calls `next(error)` on callback errors.
- Other: Responds with 405 Method Not Allowed

**Requirement**: Express body parser must be configured to preserve `rawBody` on the request object.

---

### createNextRouteHandler(config, callbacks) → { GET, POST }

Creates Next.js App Router route handlers.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| config | WebhookConfig | Yes | `{ appSecret, verifyToken }` |
| callbacks | WebhookHandlerCallbacks | Yes | Event callbacks |

**Returns**: `{ GET: (request: Request) => Response, POST: (request: Request) => Promise<Response> }`

**Behavior**:
- `GET`: Extracts search params, runs `handleGet`, returns `new Response(body, { status })`
- `POST`: Reads request body as text, extracts signature header, runs `handlePost`, returns Response

**Error handling**: Catches all errors and returns 500 response (prevents framework crash).

---

## Webhook Payload Flow

```text
Meta Platform
     │
     ├── GET /webhook?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...
     │        │
     │        └──► verifyWebhook() → challenge string (200) or error (403)
     │
     └── POST /webhook  [X-Hub-Signature-256: sha256=...]
              │
              ├──► verifySignature() → true/false
              │        │
              │        └── false → 403 Forbidden
              │
              └──► parseWebhookPayload() → WebhookEvent[]
                       │
                       ├── MessageEvent → callbacks.onMessage()
                       ├── StatusEvent  → callbacks.onStatus()
                       └── ErrorEvent   → callbacks.onError()
```
