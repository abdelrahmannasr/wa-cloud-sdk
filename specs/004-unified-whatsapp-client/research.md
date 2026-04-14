# Research: Unified WhatsApp Client

**Feature**: 004-unified-whatsapp-client
**Date**: 2026-02-14

## Decision Log

### D1: Class name is `WhatsApp`, file is `src/whatsapp.ts`

- **Decision**: The unified entry-point class is named `WhatsApp` and lives at `src/whatsapp.ts` (top-level, not in a subdirectory).
- **Rationale**: CLAUDE.md explicitly plans for `new WhatsApp(config)`. A top-level file is appropriate because this is the root facade that wires all modules — it doesn't belong inside any single module directory.
- **Alternatives considered**: `WhatsAppClient` (rejected — verbose, `WhatsApp` is clear), `Client` (rejected — too generic, conflicts conceptually with `HttpClient`), placing in `src/client/whatsapp.ts` (rejected — the `client/` directory is for HTTP-level concerns, not the top-level facade).

### D2: Messages and Media are eagerly initialized; Templates and Webhooks are lazy

- **Decision**: `messages` and `media` are created in the constructor. `templates` is lazily initialized on first access and throws `ValidationError` if `businessAccountId` is missing. `webhooks` is lazily initialized on first access; individual methods that require `appSecret` or `webhookVerifyToken` throw at invocation time.
- **Rationale**: `phoneNumberId` is required, so Messages and Media can always be constructed. `businessAccountId` is optional, so Templates must defer. Webhook accessor methods have mixed config requirements — `parse()` needs nothing, `verifySignature()` needs `appSecret` — so the accessor is always available but individual methods validate.
- **Alternatives considered**: All lazy (rejected — unnecessary overhead for required modules), all eager with upfront validation of optional fields (rejected — violates FR-007's deferred error requirement, forces users to provide config they may not need).

### D3: Webhook accessor is a dedicated class wrapping standalone functions

- **Decision**: Create a `Webhooks` class in `src/webhooks/webhooks.ts` that wraps the existing standalone functions (`verifyWebhook`, `verifySignature`, `parseWebhookPayload`, `createWebhookHandler`, `createExpressMiddleware`, `createNextRouteHandler`) with pre-bound config.
- **Rationale**: The existing webhook module uses standalone functions that require explicit config passing. A wrapper class pre-binds `appSecret` and `webhookVerifyToken` from the unified client's config, eliminating repetitive config passing. This follows the same class-based pattern as Messages, Media, and Templates.
- **Alternatives considered**: Plain object literal with bound methods (rejected — inconsistent with the class-based pattern of other modules), re-exporting standalone functions without binding (rejected — defeats the purpose of the unified client), adding methods directly on the `WhatsApp` class (rejected — violates the module-accessor pattern).

### D4: Getters expose cached module instances as readonly

- **Decision**: Module accessors (`messages`, `media`, `templates`, `webhooks`, `client`) use getter properties. Eager modules return pre-constructed instances. Lazy modules construct-and-cache on first access.
- **Rationale**: Getters provide a clean API (`wa.messages.sendText(...)`) while allowing lazy initialization internally. Caching ensures the same instance is returned on repeated access.
- **Alternatives considered**: Public `readonly` fields (rejected — prevents lazy initialization for templates/webhooks), method accessors like `getMessages()` (rejected — less ergonomic than property access).

### D5: Constructor validates only `accessToken` and `phoneNumberId`

- **Decision**: The `WhatsApp` constructor validates that `accessToken` and `phoneNumberId` are non-empty strings. All other config fields are optional and validated at the point of use.
- **Rationale**: `accessToken` is needed for any API call (via HttpClient). `phoneNumberId` is needed for Messages and Media, the two core modules. Other fields like `businessAccountId`, `appSecret`, and `webhookVerifyToken` serve specific modules and should fail only when those modules are used (per FR-007).
- **Alternatives considered**: No validation at construction (rejected — better to fail fast on universally-required fields), validating all fields (rejected — violates deferred error requirement).

### D6: TemplateBuilder remains independently importable

- **Decision**: `TemplateBuilder` continues to be imported directly from the package. The `WhatsApp` class does NOT expose a builder factory method.
- **Rationale**: `TemplateBuilder` has zero dependencies — it doesn't need `HttpClient`, config, or `businessAccountId`. Adding a factory method would be redundant sugar. The builder is already well-documented and importable. FR-004 says templates accessor provides "template management operations... and the template builder" — this is satisfied by the existing export; the builder doesn't need to be on the accessor.
- **Alternatives considered**: `wa.templates.createBuilder()` factory (rejected — adds no value since the builder has no dependencies), `wa.createTemplateBuilder()` convenience method (rejected — over-engineering for zero benefit).

### D7: `destroy()` method delegates to HttpClient cleanup

- **Decision**: The `WhatsApp` class exposes a `destroy()` method that calls `HttpClient.destroy()` to clean up rate limiter intervals and any other resources.
- **Rationale**: The HttpClient's `destroy()` method clears the rate limiter's refill interval. Without calling it, the Node.js process may not exit cleanly. The unified client should surface this lifecycle method.
- **Alternatives considered**: No destroy method (rejected — would force users to access `wa.client.destroy()` for cleanup, leaking internal structure), automatic cleanup via `FinalizationRegistry` (rejected — unreliable timing, adds complexity).
