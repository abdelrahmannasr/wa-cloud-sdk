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
- `pnpm format:check` — Prettier check (no write)
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
├── index.ts              # Main barrel export — re-exports all modules
├── whatsapp.ts           # Unified client — single entry point for all SDK operations
├── client/               # Core HTTP client
│   ├── types.ts          # WhatsAppConfig, RequestOptions, ApiResponse interfaces
│   ├── http-client.ts    # HTTP client with auth, rate limiting, retry
│   └── index.ts          # Barrel export
├── messages/             # Message sending
│   ├── types.ts          # All message type interfaces + MessageType enum
│   ├── messages.ts       # Messages class with sendText, sendImage, sendTemplate, etc.
│   └── index.ts
├── webhooks/             # Incoming webhook handling
│   ├── types.ts          # WebhookEvent, MessageEvent, StatusEvent interfaces
│   ├── parser.ts         # Parse raw webhook payloads into typed events
│   ├── verify.ts         # Signature verification (X-Hub-Signature-256 + timingSafeEqual)
│   ├── handler.ts        # createWebhookHandler with typed callbacks
│   ├── webhooks.ts       # Webhooks class — wraps standalone functions with pre-bound config
│   ├── utils.ts          # Helper for extracting values from query params/headers
│   ├── middleware/
│   │   ├── next.ts       # Next.js App Router middleware factory
│   │   └── express.ts    # Express middleware factory
│   └── index.ts
├── media/                # Media upload/download/management
│   ├── types.ts          # MediaCategory, MEDIA_CONSTRAINTS, upload/url/delete response types
│   ├── media.ts          # Media class with upload, getUrl, download, delete
│   └── index.ts
├── templates/            # Template CRUD + fluent TemplateBuilder
│   ├── types.ts          # TemplateCategory, TemplateStatus, CreateTemplateRequest, validation constants
│   ├── templates.ts      # Templates class with list, get, create, update, delete
│   ├── builder.ts        # TemplateBuilder fluent API with client-side validation
│   └── index.ts
├── flows/                # WhatsApp Flows lifecycle management
│   ├── types.ts          # Flow, FlowCategory, FlowStatus, CRUD request/response types, validation constants
│   ├── flows.ts          # Flows class with list, get, create, updateMetadata, updateAssets, publish, deprecate, delete, getPreview
│   └── index.ts
├── phone-numbers/        # Phone number management
│   ├── types.ts          # PhoneNumber, BusinessProfile, request/response types
│   ├── phone-numbers.ts  # PhoneNumbers class with list, get, getBusinessProfile, updateBusinessProfile, requestVerificationCode, verifyCode, register, deregister
│   └── index.ts
├── multi-account/        # Multi-WABA management + distribution strategies
│   ├── types.ts          # AccountConfig, MultiAccountConfig, DistributionStrategy, Broadcast* types
│   ├── strategies.ts     # RoundRobinStrategy, WeightedStrategy, StickyStrategy
│   ├── multi-account.ts  # WhatsAppMultiAccount class with lazy instantiation, getNext(), broadcast()
│   └── index.ts
├── catalog/              # Commerce catalog management
│   ├── types.ts          # Catalog, Product, ProductAvailability, CreateProductRequest, UpdateProductRequest, pagination types, CATALOG_VALIDATION
│   ├── catalog.ts        # Catalog class with listCatalogs, getCatalog, listProducts, getProduct, createProduct, upsertProduct, updateProduct, deleteProduct
│   └── index.ts
├── errors/               # Typed error classes
│   ├── errors.ts         # WhatsAppError, ApiError, RateLimitError, AuthenticationError, ConflictError, etc.
│   └── index.ts
└── utils/                # Shared utilities
    ├── rate-limiter.ts   # Token bucket rate limiter
    ├── retry.ts          # Exponential backoff + jitter
    ├── phone.ts          # E.164 phone number validation
    └── index.ts
```

**Subpath exports:** `./errors`, `./messages`, `./webhooks`, `./media`, `./templates`, `./flows`, `./phone-numbers`, `./multi-account`, `./catalog` all have dedicated subpath exports in package.json.

### Implementation Status
- **Implemented:** client, errors, utils, messages (sendText, sendImage, sendTemplate, sendFlow, sendProduct, sendProductList, sendCatalogMessage + commerce interactive types), webhooks (with Express + Next.js middleware + Webhooks wrapper class + FlowCompletionEvent/onFlowCompletion + OrderEvent/onOrder), media (upload, download, getUrl, delete with client-side validation), templates (list, get, create, update, delete + TemplateBuilder with client-side validation), flows (list, get, create, updateMetadata, updateAssets, publish, deprecate, delete, getPreview), whatsapp (unified client with lazy/eager module initialization), phone-numbers (list, get, getBusinessProfile, updateBusinessProfile, requestVerificationCode, verifyCode, register, deregister), multi-account (WhatsAppMultiAccount with lazy client instantiation, dynamic account add/remove, lookup by name or phoneNumberId, distribution strategies: RoundRobinStrategy/WeightedStrategy/StickyStrategy, getNext(recipient?) for strategy-based selection, broadcast(recipients, factory, options?) with pool-based concurrency control), catalog (listCatalogs, getCatalog, listProducts, getProduct, createProduct strict with ConflictError, upsertProduct, updateProduct, deleteProduct + client-side validation)

### Code Conventions
- Use `interface` for public API shapes, `type` for unions and intersections
- All public APIs must have TSDoc comments with @example blocks
- Use `readonly` on all interface properties that shouldn't be mutated
- Prefer `unknown` over `any` — narrow types explicitly
- NO default exports — always use named exports
- File naming: kebab-case (e.g., `rate-limiter.ts`, `http-client.ts`)
- All classes accept HttpClient via constructor injection
- Every method that calls the API returns Promise<ApiResponse<T>> or a typed result
- Error handling: throw typed error classes, never throw plain strings or Error()

### API Design Patterns
- **Preferred:** Unified client — single constructor wires all modules with shared HttpClient
  ```ts
  const wa = new WhatsApp({ accessToken, phoneNumberId, businessAccountId });
  await wa.messages.sendText({ to: '1234567890', body: 'Hello!' });
  await wa.media.upload({ file, mimeType, category: 'image', filename });
  const templates = await wa.templates.list({ limit: 10 });
  const events = wa.webhooks.parse(payload);
  wa.destroy(); // clean up rate limiter intervals
  ```
- **Direct imports:** Still supported for advanced use cases or gradual migration
  ```ts
  const client = new HttpClient(config);
  const messages = new Messages(client, phoneNumberId);
  const media = new Media(client, phoneNumberId);
  const templates = new Templates(client, businessAccountId);
  ```
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
- Template update: `POST /{template_id}`
- Template delete: `DELETE /{waba_id}/message_templates?name={name}`
- Phone numbers list: `GET /{waba_id}/phone_numbers`
- Phone number get: `GET /{phone_number_id}`
- Register phone: `POST /{phone_number_id}/register`
- Deregister phone: `POST /{phone_number_id}/deregister`
- Request verification code: `POST /{phone_number_id}/request_code`
- Verify code: `POST /{phone_number_id}/verify_code`
- Business profile get: `GET /{phone_number_id}/whatsapp_business_profile`
- Business profile update: `POST /{phone_number_id}/whatsapp_business_profile`
- Flows list: `GET /{waba_id}/flows`
- Flow get: `GET /{flow_id}`
- Flow create: `POST /{waba_id}/flows`
- Flow update metadata: `POST /{flow_id}`
- Flow update assets: `POST /{flow_id}/assets` (multipart/form-data)
- Flow publish: `POST /{flow_id}/publish`
- Flow deprecate: `POST /{flow_id}/deprecate`
- Flow delete: `DELETE /{flow_id}`
- Catalog list: `GET /{waba_id}/product_catalogs`
- Catalog get: `GET /{catalog_id}?fields=...`
- Product list: `GET /{catalog_id}/products`
- Product get: `GET /{product_id}?fields=...`
- Product create (strict): `POST /{catalog_id}/products`
- Product upsert: `POST /{catalog_id}/products?retailer_id={id}`
- Product update: `POST /{product_id}` (partial body)
- Product delete: `DELETE /{product_id}`
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

## Active Technologies
- TypeScript 5.3+ with strict mode + Zero runtime dependencies (Node.js built-in APIs only)
- Dev tooling: tsup 8, vitest 3, eslint 9, prettier 3, pnpm

## Recent Changes
- 011-commerce-catalogs: Added Catalog class (listCatalogs, getCatalog, listProducts, getProduct, createProduct strict+ConflictError, upsertProduct, updateProduct, deleteProduct); commerce message send methods (sendProduct, sendProductList, sendCatalogMessage); OrderEvent/onOrder webhook; ConflictError class; ./catalog subpath export; wa.catalog lazy getter; 5 runnable examples
- 007-distribution-strategies: Added RoundRobinStrategy, WeightedStrategy, StickyStrategy implementing DistributionStrategy interface; getNext(recipient?) and broadcast(recipients, factory, options?) on WhatsAppMultiAccount; BroadcastMessageFactory, BroadcastOptions, BroadcastResult types; pool-based concurrency control; full backward compatibility
- 006-sdk-documentation: Added comprehensive README with install, config, all modules, error handling, advanced usage; 7 runnable examples; TSDoc on all public APIs
- 005-multi-account-management: Added WhatsAppMultiAccount class with lazy client instantiation, dynamic account add/remove, dual lookup by name or phoneNumberId; integrated phoneNumbers module into unified WhatsApp client with lazy init
- 004-unified-whatsapp-client: Added WhatsApp unified client class with single entry point; Webhooks wrapper class with pre-bound config and deferred validation; messages/media eager init, templates/webhooks lazy init; all existing exports preserved for backwards compatibility; extracted requireWebhookConfig() private helper with per-field validation errors; shallow copy config for runtime immutability; hardened test assertions with expect.fail pattern
- 003-template-management: Added Templates class with list, get, create, update, delete; TemplateBuilder fluent API with client-side validation (name format, text lengths, button counts); uses businessAccountId (WABA ID) instead of phoneNumberId
- 002-media-upload-download: Added Media class with upload, download, getUrl, delete; client-side validation (MIME type, file size); HttpClient upload/downloadMedia/destroy methods; MediaError class
- 001-sdk-core-foundation: Added TypeScript 5.3+ with strict mode enabled + Zero runtime dependencies. Dev: tsup 8, vitest 3, eslint 9, prettier 3
