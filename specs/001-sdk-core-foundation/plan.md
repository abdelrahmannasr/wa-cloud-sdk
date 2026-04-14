# Implementation Plan: WhatsApp Cloud API SDK -- Core Foundation

**Branch**: `001-sdk-core-foundation` | **Date**: 2026-02-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-sdk-core-foundation/spec.md`
**Status**: Retroactive (phases 0-3 already implemented)

## Summary

Build the core WhatsApp Cloud API SDK covering project scaffolding (Phase 0), error handling and HTTP infrastructure with rate limiting and retry (Phase 1), outbound message sending for all 11 message types plus mark-as-read (Phase 2), and inbound webhook processing with signature verification and framework adapters for Express and Next.js (Phase 3). The SDK has zero runtime dependencies and produces dual ESM/CJS output with full type definitions.

## Technical Context

**Language/Version**: TypeScript 5.3+ with strict mode enabled
**Primary Dependencies**: Zero runtime dependencies. Dev: tsup 8, vitest 3, eslint 9, prettier 3
**Storage**: N/A (stateless SDK library)
**Testing**: Vitest with v8 coverage, 80% thresholds on lines/functions/branches/statements
**Target Platform**: Node.js 18+ (uses native fetch, crypto, URL, FormData, AbortController)
**Project Type**: Single npm library with dual ESM/CJS output
**Performance Goals**: 80 messages/second throughput (matching Meta's standard business tier rate limit)
**Constraints**: Zero runtime dependencies, <30s default request timeout, timing-safe signature verification
**Scale/Scope**: SDK consumed by applications; single phone number per instance

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution not yet configured for this project (template placeholders only). No gates to evaluate. Proceeding with standard engineering best practices as defined in CLAUDE.md:

- Zero runtime dependencies: **PASS** (verified - empty `dependencies` in package.json)
- No `any` types: **PASS** (enforced by ESLint + TypeScript strict)
- No default exports: **PASS** (enforced by ESLint rule)
- Named exports only: **PASS**
- 80% test coverage: **PASS** (enforced by vitest config thresholds)
- No console.log: **PASS** (uses configurable Logger interface)

## Project Structure

### Documentation (this feature)

```text
specs/001-sdk-core-foundation/
├── plan.md              # This file
├── spec.md              # Feature specification (retroactive)
├── research.md          # Phase 0: Technical decisions
├── data-model.md        # Phase 1: Entity model
├── quickstart.md        # Phase 1: Integration guide
├── contracts/           # Phase 1: API contracts
│   ├── client-api.md    # HttpClient contract
│   ├── messages-api.md  # Messages contract
│   └── webhooks-api.md  # Webhooks contract
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2: Task breakdown (via /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── index.ts                          # Main barrel export (88+ exports)
├── client/
│   ├── types.ts                      # WhatsAppConfig, RequestOptions, ApiResponse, Logger, etc.
│   ├── http-client.ts                # HttpClient: auth, rate limiting, retry, timeout
│   └── index.ts                      # Barrel export
├── errors/
│   ├── errors.ts                     # 7 error classes: WhatsAppError hierarchy
│   └── index.ts
├── utils/
│   ├── rate-limiter.ts               # TokenBucketRateLimiter (80 req/s default)
│   ├── retry.ts                      # withRetry: exponential backoff + jitter
│   ├── phone.ts                      # E.164 phone validation (7-15 digits)
│   └── index.ts
├── messages/
│   ├── types.ts                      # 11 message types + MessageType union + contacts
│   ├── messages.ts                   # Messages class: 13 send methods + markAsRead
│   └── index.ts
├── webhooks/
│   ├── types.ts                      # Raw + parsed webhook types (65+ interfaces)
│   ├── parser.ts                     # parseWebhookPayload → WebhookEvent[]
│   ├── verify.ts                     # verifyWebhook + verifySignature (HMAC SHA-256)
│   ├── handler.ts                    # createWebhookHandler with typed callbacks
│   ├── utils.ts                      # Query/header extraction helpers
│   ├── middleware/
│   │   ├── express.ts                # createExpressMiddleware
│   │   └── next.ts                   # createNextRouteHandler
│   └── index.ts
├── media/
│   └── index.ts                      # Stub (Phase 4)
├── templates/
│   └── index.ts                      # Stub (Phase 5)
└── multi-account/
    └── index.ts                      # Stub (Phase 6)

tests/
├── client/
│   └── http-client.test.ts           # Auth, URL, error parsing, rate limit, retry, timeout
├── errors/
│   └── errors.test.ts                # instanceof chain, properties, prototype integrity
├── messages/
│   └── messages.test.ts              # All 13 methods, payload shapes, phone validation
├── utils/
│   ├── phone.test.ts                 # E.164, formatting, edge cases
│   ├── rate-limiter.test.ts          # Token consumption, refill, queue, burst, destroy
│   └── retry.test.ts                 # Backoff, exhaustion, non-retryable, retryAfter
└── webhooks/
    ├── parser.test.ts                # All message types, multi-entry, missing fields
    ├── verify.test.ts                # Valid/invalid signatures, challenge, wrong token
    ├── handler.test.ts               # Callback routing, signature integration
    └── middleware/
        ├── express.test.ts           # GET/POST, raw body, error forwarding
        └── next.test.ts              # GET/POST, error catching, method not allowed
```

**Structure Decision**: Single npm library (not monorepo). Modules organized by domain (client, errors, utils, messages, webhooks) with barrel exports at each level. Tests mirror source structure in a separate `tests/` root directory.

## Complexity Tracking

No complexity violations to justify. The architecture is intentionally simple:
- No abstraction layers beyond what's needed
- No runtime dependencies
- Constructor injection (not DI framework)
- No ORMs, no state management libraries
- Direct use of Node.js built-ins only
