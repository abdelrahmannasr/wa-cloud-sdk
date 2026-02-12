# wa-cloud-sdk — Meta WhatsApp Cloud API TypeScript SDK

## Project Overview
A comprehensive, zero-dependency, type-safe TypeScript SDK for the Meta WhatsApp Cloud API.
Published as `@abdelrahmannasr-wa/cloud-api` on npm. MIT license.

This is the foundation package for the Khalsa platform (a trust-based distributed WhatsApp campaign system), but the SDK is generic and usable by any project that needs WhatsApp Cloud API integration.

## Commands
- `pnpm build` — Compile ESM + CJS dual output via tsup
- `pnpm test` — Run Vitest test suite
- `pnpm test:watch` — Run tests in watch mode
- `pnpm test:coverage` — Run tests with v8 coverage (minimum 80% threshold)
- `pnpm lint` — ESLint check
- `pnpm lint:fix` — ESLint auto-fix
- `pnpm format` — Prettier formatting
- `pnpm typecheck` — TypeScript type check (no emit)
- `pnpm clean` — Remove dist/

## Tech Stack
- **Language:** TypeScript 5.3+ with strict mode enabled
- **Runtime:** Node.js 18+ (uses native fetch — NO axios, node-fetch, or got)
- **Module System:** ESM + CJS dual export via tsup
- **Testing:** Vitest with v8 coverage, minimum 80% on lines/functions/branches/statements
- **Linting:** ESLint 9 flat config with typescript-eslint strict + Prettier
- **Package Manager:** pnpm
- **Dependencies:** ZERO runtime dependencies. Only devDependencies for build/test/lint tools.

## Architecture Rules

### Zero Dependencies
This package has ZERO runtime dependencies. Only use Node.js built-in APIs:
- `fetch` (native in Node 18+) for HTTP requests
- `crypto` for HMAC signature verification
- `Buffer` for binary data handling
- `URL` and `URLSearchParams` for URL construction
NEVER import axios, node-fetch, got, superagent, or any HTTP library.

### Module Structure
```
src/
├── index.ts              # Main barrel export — exports WhatsApp class + all types
├── whatsapp.ts           # Main WhatsApp class (constructor, module wiring)
├── client/               # Core HTTP client
│   ├── types.ts          # WhatsAppConfig, RequestOptions, ApiResponse interfaces
│   ├── http-client.ts    # HTTP client with auth, rate limiting, retry
│   └── index.ts          # Barrel export
├── messages/             # Message sending
│   ├── types.ts          # All message type interfaces
│   ├── messages.ts       # Messages class with sendText, sendImage, sendTemplate, etc.
│   └── index.ts
├── webhooks/             # Incoming webhook handling
│   ├── types.ts          # WebhookEvent, MessageEvent, StatusEvent interfaces
│   ├── parser.ts         # Parse raw webhook payloads into typed events
│   ├── verify.ts         # Signature verification (X-Hub-Signature-256)
│   ├── handler.ts        # createHandler with typed callbacks
│   ├── middleware/
│   │   ├── next.ts       # Next.js App Router middleware factory
│   │   └── express.ts    # Express middleware factory
│   └── index.ts
├── media/                # Media upload/download
│   ├── types.ts
│   ├── media.ts          # Media class with upload, download, getUrl, delete
│   └── index.ts
├── templates/            # Template CRUD
│   ├── types.ts
│   ├── templates.ts      # Templates class with create, list, get, update, delete
│   ├── builder.ts        # Fluent builder API
│   └── index.ts
├── multi-account/        # Multi-WABA management
│   ├── types.ts
│   ├── manager.ts        # MultiAccountManager class
│   ├── strategies.ts     # Distribution strategies (round-robin, capacity, sticky)
│   └── index.ts
├── errors/               # Typed error classes
│   ├── errors.ts         # WhatsAppError, ApiError, RateLimitError, AuthenticationError, etc.
│   └── index.ts
└── utils/                # Shared utilities
    ├── rate-limiter.ts   # Token bucket rate limiter
    ├── retry.ts          # Exponential backoff + jitter
    ├── phone.ts          # E.164 phone number validation
    └── index.ts
```

### Code Conventions
- Use `interface` for public API shapes, `type` for unions and intersections
- All public APIs must have TSDoc comments with @example blocks
- Use `readonly` on all interface properties that shouldn't be mutated
- Prefer `unknown` over `any` — narrow types explicitly
- NO default exports — always use named exports
- File naming: kebab-case (e.g., `rate-limiter.ts`, `http-client.ts`)
- All classes accept HttpClient via constructor injection (except WhatsApp which creates it)
- Every method that calls the API returns Promise<ApiResponse<T>> or a typed result
- Error handling: throw typed error classes, never throw plain strings or Error()

### API Design Patterns
- Constructor-based: `new WhatsApp(config)` creates the client
- Module access via properties: `wa.messages.sendText(...)`, `wa.webhooks.parse(...)`
- Methods with >2 params use a config object (not positional args)
- All optional params use `?` — never `undefined` as default
- Method overloads: use union types in a single signature, not TypeScript overloads

### Testing Strategy
- Test files go in `tests/` mirroring `src/` structure
- Unit tests mock HTTP responses using a mock function — NEVER call Meta API in unit tests
- Test each error path (400, 401, 404, 429, 500)
- Test rate limiter under load (concurrent acquires)
- Test retry with simulated sequential failures
- Integration tests (filename: `*.integration.test.ts`) CAN call Meta sandbox — skip in CI
- Use `describe` blocks matching module/class names
- Use `it` blocks with descriptive names: `it("should return message ID on successful send")`

### Meta WhatsApp Cloud API Reference
- Base URL: `https://graph.facebook.com/v21.0`
- Messages: `POST /{phone_number_id}/messages`
- Media upload: `POST /{phone_number_id}/media`
- Media URL: `GET /{media_id}`
- Media download: `GET /{media_url}` (requires auth header)
- Media delete: `DELETE /{media_id}`
- Templates list: `GET /{waba_id}/message_templates`
- Template create: `POST /{waba_id}/message_templates`
- Template delete: `DELETE /{waba_id}/message_templates?name={name}`
- Webhook verification: `GET /webhook` with hub.mode, hub.verify_token, hub.challenge
- Webhook events: `POST /webhook` with X-Hub-Signature-256 header
- All message sends require body: `{ messaging_product: "whatsapp", to, type, [type_data] }`
- Rate limit: 80 messages/second (Business tier), 1000/sec (Enterprise)
- Docs: https://developers.facebook.com/docs/whatsapp/cloud-api

### What NOT To Do
- Do NOT add any runtime dependencies
- Do NOT use `any` type anywhere — use `unknown` and narrow
- Do NOT use default exports
- Do NOT write tests that depend on network calls (except *.integration.test.ts)
- Do NOT console.log — use the configurable logger from client config
- Do NOT hardcode API version — always use config.apiVersion
- Do NOT throw plain Error() — always use typed error classes from errors/
