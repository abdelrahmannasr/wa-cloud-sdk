# Research: Messaging Enhancements (v0.2.0)

**Branch**: `008-messaging-enhancements` | **Date**: 2026-04-07
**Status**: Complete

## Decision Log

### D-001: Reply-to Context Injection Point

**Decision**: Add `replyTo` to `buildBasePayload()` rather than to each individual send method.

**Rationale**: All 12 send methods call `buildBasePayload()`. Adding context handling there gives every message type reply support with a single code change. Adding `replyTo?: string` to each options interface is still needed for type safety, but the payload logic is centralized.

**Alternatives considered**:
- Per-method context handling: 12x code duplication, higher maintenance
- Middleware/interceptor pattern: Over-engineered for a single optional field
- Wrapper function: Breaks the existing method-call ergonomics

---

### D-002: CTA URL Button Payload Structure

**Decision**: Use Meta's `interactive.type: 'cta_url'` with `action.name: 'cta_url'` and `action.parameters: { display_text, url }`.

**Rationale**: This is Meta's documented payload structure for CTA URL buttons. Dynamic parameters use `action.parameters.url` for the template URL and separate parameter values.

**Alternatives considered**:
- Using template messages for URL buttons: Different API, more complex, not interactive type
- Custom URL wrapping: Would break platform validation

---

### D-003: Typing Indicator API Endpoint

**Decision**: Use `POST /{phone_number_id}/messages` with `{ messaging_product: 'whatsapp', status: 'typing', recipient_type: 'individual', to }`.

**Rationale**: The Meta Cloud API uses the messages endpoint for typing indicators but with `status: 'typing'` instead of a message type. This is a different payload shape than regular messages.

**Alternatives considered**:
- Separate endpoint: Meta doesn't provide one; it's the same messages endpoint
- WebSocket-based: Not supported by Cloud API

---

### D-004: Pricing Utility Location

**Decision**: Place in `src/utils/pricing.ts`, export via `src/utils/index.ts` and main barrel.

**Rationale**: Pricing extraction is a pure utility function with no class dependencies. It operates on webhook types but doesn't belong in the webhooks module (it's a consumer-facing convenience, not webhook infrastructure). The utils module is the natural home.

**Alternatives considered**:
- In webhooks module: Mixes concerns; webhook module handles parsing/verification, not business logic
- Standalone module: Over-engineered for a single function + interface
- In a new `billing/` module: Premature; may make sense if billing features grow later

---

### D-005: Subpath Export Build Strategy

**Decision**: Add 4 new entries to `tsup.config.ts` entry map and mirror in `package.json` exports field. No new source files needed — existing barrel `index.ts` files in each module are sufficient.

**Rationale**: Each module already has a well-structured `index.ts` barrel export. The only missing pieces are the build configuration and package.json mappings. This follows the exact same pattern as existing subpath exports (`./errors`, `./messages`, `./webhooks`).

**Alternatives considered**:
- Creating separate entry files: Unnecessary; barrel exports already exist
- Dynamic exports: Not supported by Node.js module resolution
