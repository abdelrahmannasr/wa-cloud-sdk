# Implementation Plan: Messaging Enhancements (v0.2.0)

**Branch**: `008-messaging-enhancements` | **Date**: 2026-04-07 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/008-messaging-enhancements/spec.md`

## Summary

Extend the SDK with six commonly needed features: reply-to context on all send methods, CTA URL button messages, location request messages, typing indicators, subpath exports for four modules, and conversation pricing utilities. All changes are additive — no existing APIs are modified.

## Technical Context

**Language/Version**: TypeScript 5.3+ with strict mode
**Primary Dependencies**: Zero runtime dependencies (Node.js 18+ built-in APIs only)
**Storage**: N/A
**Testing**: Vitest 3 with v8 coverage, 80% minimum thresholds
**Target Platform**: Node.js 18+
**Project Type**: Library (npm package)
**Performance Goals**: No measurable overhead vs current SDK
**Constraints**: Zero runtime dependencies, full backward compatibility, ESM + CJS dual output
**Scale/Scope**: 6 features, ~15 files modified/created

## Constitution Check

*Constitution not configured (template placeholders). No gates to enforce.*

## Project Structure

### Documentation (this feature)

```text
specs/008-messaging-enhancements/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── messages-api.md  # Extended Messages API contract
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── messages/
│   ├── types.ts          # ADD: CtaUrlButtonMessageOptions, LocationRequestMessageOptions, context on all options
│   ├── messages.ts       # ADD: sendInteractiveCta(), sendLocationRequest(), sendTypingIndicator(), context support on all sends
│   └── index.ts          # UPDATE: export new types
├── media/
│   └── index.ts          # EXISTS (barrel export for subpath)
├── templates/
│   └── index.ts          # EXISTS (barrel export for subpath)
├── phone-numbers/
│   └── index.ts          # EXISTS (barrel export for subpath)
├── multi-account/
│   └── index.ts          # EXISTS (barrel export for subpath)
├── webhooks/
│   └── types.ts          # EXISTS (StatusEvent already has pricing/conversation fields)
├── utils/
│   ├── pricing.ts        # NEW: extractConversationPricing() utility
│   └── index.ts          # UPDATE: export pricing utility
├── whatsapp.ts           # No changes needed
└── index.ts              # UPDATE: export pricing types

tests/
├── messages/
│   └── messages.test.ts  # ADD: tests for context, CTA, location request, typing
└── utils/
    └── pricing.test.ts   # NEW: pricing utility tests

package.json              # ADD: 4 new subpath exports
tsup.config.ts            # ADD: 4 new entry points
```

**Structure Decision**: Single project (existing). All changes extend existing module structure. One new file (`src/utils/pricing.ts`), one new test file (`tests/utils/pricing.test.ts`). Everything else modifies existing files.

## Implementation Approach

### US1: Reply-to Context (P1)

**Approach**: Add optional `replyTo?: string` to all message option interfaces. In `buildBasePayload()`, if `replyTo` is provided and non-empty, include `context: { message_id: replyTo }` in the base payload. This gives every send method context support with a single code change.

**Key pattern** (in `buildBasePayload`):
```
Add replyTo param → trim → if non-empty, add context field to returned object
```

**Files**: `src/messages/types.ts`, `src/messages/messages.ts`

### US2: CTA URL Buttons (P2)

**Approach**: Add `sendInteractiveCta()` method following existing interactive pattern. Payload structure:
```
interactive: { type: 'cta_url', body: { text }, action: { name: 'cta_url', parameters: { display_text, url } }, header?, footer? }
```

Dynamic URL support: `parameters.url` is the base URL, `parameters.example` contains the parameter value (Meta's format for URL templates).

**Files**: `src/messages/types.ts` (new `CtaUrlButtonMessageOptions`), `src/messages/messages.ts` (new method)

### US3: Location Request (P3)

**Approach**: Add `sendLocationRequest()` method. Payload:
```
interactive: { type: 'location_request_message', body: { text }, action: { name: 'send_location' } }
```

**Files**: `src/messages/types.ts` (new `LocationRequestMessageOptions`), `src/messages/messages.ts` (new method)

### US4: Typing Indicators (P4)

**Approach**: Add `sendTypingIndicator()` method. Uses the same messages endpoint but with a status-based payload instead of a message type:
```
POST /{phone_number_id}/messages
{ messaging_product: 'whatsapp', status: 'typing', recipient_type: 'individual', to }
```

**Files**: `src/messages/types.ts`, `src/messages/messages.ts` (new method)

### US5: Subpath Exports (P5)

**Approach**: Add 4 new entries to `tsup.config.ts` and 4 new export paths to `package.json`. Each module already has a barrel `index.ts` — no new source files needed.

**New entries**:
- `./media` → `src/media/index.ts`
- `./templates` → `src/templates/index.ts`
- `./phone-numbers` → `src/phone-numbers/index.ts`
- `./multi-account` → `src/multi-account/index.ts`

**Files**: `package.json`, `tsup.config.ts`

### US6: Conversation Pricing Utility (P6)

**Approach**: Create `src/utils/pricing.ts` with `extractConversationPricing(event: StatusEvent)` function. The webhook `StatusEvent` already contains `conversation` and `pricing` fields on `WebhookStatus`. The utility extracts and structures these into a clean `ConversationPricing` interface.

**Files**: `src/utils/pricing.ts` (new), `src/utils/index.ts` (update export), `src/index.ts` (update export), `tests/utils/pricing.test.ts` (new)
