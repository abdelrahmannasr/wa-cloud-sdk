# Implementation Plan: Template Status Webhook Events

**Branch**: `012-template-status-webhooks` | **Date**: 2026-04-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/012-template-status-webhooks/spec.md`

## Summary

Extend the SDK's webhook module to recognize two new platform change fields — `message_template_status_update` and `message_template_quality_update` — as first-class typed events (`TemplateStatusEvent`, `TemplateQualityEvent`). The current parser filters every `change` down to `field === 'messages'` and drops the rest silently; this feature replaces that filter with per-field routing, so template-lifecycle changes no longer disappear. Two new event types join the `WebhookEvent` discriminated union; two new callbacks (`onTemplateStatus`, `onTemplateQuality`) extend `WebhookHandlerCallbacks` and the `Webhooks` wrapper class; two new `case` branches join the handler dispatch switch. Template events deliberately use a dedicated `TemplateEventMetadata = { businessAccountId }` shape (sourced from `entry.id`) rather than the existing phone-number-scoped `EventMetadata`, per clarification 1. Event timestamps are `Date` objects (epoch-seconds converted by the parser) for consistency with `MessageEvent`/`StatusEvent`/`FlowCompletionEvent`, per clarification 2. No changes to HTTP entry points, signature verification, verify-token challenge, rate limiting, or retry — template events flow through the same pipeline as every other webhook. Category/language/retailer-template-id metadata is surfaced when present in the payload; unknown status or quality values are preserved verbatim (union-plus-string) so future platform additions don't require an SDK upgrade. Subpath export `./webhooks` already exists — no package.json changes needed beyond a patch-level version bump. The feature ships one runnable example and a quickstart that demonstrates registering handlers in both the unified client (`wa.webhooks.onTemplateStatus`) and the standalone `createWebhookHandler` shape.

## Technical Context

**Language/Version**: TypeScript 5.3+ with strict mode enabled, compiling to ES2022 target for both ESM and CJS dual output
**Primary Dependencies**: Zero runtime dependencies. Uses only Node.js 18+ built-in APIs (no new imports introduced by this feature)
**Storage**: N/A — library, stateless
**Testing**: Vitest 3 with v8 coverage (minimum 80% thresholds on lines/functions/branches/statements), mock `HttpClient` via `vi.fn()` for unit tests where needed. Webhook tests feed literal JSON payloads through `parseWebhookPayload` and `createWebhookHandler` — no network, no mock HTTP client required for this feature.
**Target Platform**: Node.js 18+ (server-side library). ESM + CJS dual export via tsup 8
**Project Type**: Zero-dependency TypeScript library (single project, no frontend/backend split)
**Performance Goals**: No new latency targets. Webhook-parsing complexity stays O(changes × per-change-items), with per-change work bounded by the number of template events in a single POST (platform batches are small). No new rate-limit bucket, no new retry configuration.
**Constraints**:
- MUST preserve zero runtime dependencies
- MUST NOT introduce any `any` usage (strict mode + project ESLint config bans it)
- MUST NOT use default exports (project convention)
- MUST NOT break any existing public API — all new types and callbacks are additive and optional
- MUST NOT deliver template events to `onMessage` / `onStatus` / `onError` / `onFlowCompletion` / `onOrder`
- MUST NOT deduplicate template events — at-least-once semantics are the caller's problem
- MUST NOT log webhook body contents; operator diagnostics only log field names and safely truncated tokens (existing logging-hygiene contract)
- MUST preserve unknown status / quality strings verbatim so callers can branch on platform additions
- MUST maintain ≥ 80% code coverage across new code
- MUST not regress any existing webhook behavior — existing tests continue to pass unchanged
**Scale/Scope**: ~0 new source files; ~4 edited source files (`src/webhooks/types.ts`, `src/webhooks/parser.ts`, `src/webhooks/handler.ts`, `src/webhooks/webhooks.ts`; minor re-export in `src/webhooks/index.ts`). ~2 new config/doc files (`examples/template-webhooks.ts`, README section). ~4 edited test files (`tests/webhooks/parser.test.ts`, `tests/webhooks/handler.test.ts`, `tests/webhooks/webhooks.test.ts` if it exists — otherwise folded into handler tests, `tests/exports/subpath-exports.test.ts` for the two new type names). Estimated ~22 new test cases: ~10 parser cases (status approve/reject/pending/paused/disabled/unknown-string, quality green→yellow/yellow→red/first-rating, mixed batch with messages, malformed identity, missing field metadata), ~6 handler dispatch cases (each new callback fires; cross-callback leak guards; onTemplateStatus without onTemplateQuality still works; merged with `_pendingCallbacks`), ~4 wrapper-class cases (`onTemplateStatus`/`onTemplateQuality` pending registration + merge precedence), ~2 exports cases.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Constitution status**: The project's `.specify/memory/constitution.md` is an unfilled template with placeholder principle names. There is no ratified constitution to gate against at this time.

**Fallback governance**: The authoritative project guide is `CLAUDE.md` at the repo root. This feature MUST comply with the rules encoded there:

| CLAUDE.md rule | Compliance status |
|---|---|
| Zero runtime dependencies | No new imports. Reuses `crypto.timingSafeEqual` already used in `verify.ts`; parser uses only built-in language features. |
| No `any` — use `unknown` and narrow | Template event types use `interface` with `readonly` properties. `unknown` used only at parse boundary when narrowing `change.value.event`/`new_status`/quality-score strings. |
| No default exports | New types/callbacks exported as named exports via `src/webhooks/index.ts` and the main barrel `src/index.ts`. |
| Throw typed error classes, never plain `Error()` | No new error classes needed — parser follows log-and-skip on malformed template payloads (FR-009), mirroring existing order-event behavior. |
| File naming: kebab-case | All edits stay in existing kebab-case files. No new files in `src/`. |
| All classes accept `HttpClient` via constructor injection | N/A — no new class; extends existing `Webhooks` class. |
| API methods return `Promise<ApiResponse<T>>` or typed result | N/A — this is webhook inbound, not outbound API calls. Callbacks return `void \| Promise<void>` like existing callbacks. |
| Methods with >2 params use a config object | N/A — no new multi-param methods. Wrapper class single-callback setters mirror `onOrder` / `onFlowCompletion`. |
| TSDoc on all public APIs with `@example` blocks | Enforced during implementation for every new type, callback, and method. |
| Tests in `tests/` mirroring `src/` structure | All new tests land in `tests/webhooks/` and `tests/exports/`. |
| NO network in unit tests — mock `fetch` / `HttpClient` | All tests use literal JSON payloads against parser + handler; no network. |
| Don't hardcode API version — always use `config.apiVersion` | N/A — webhook parser never calls out. |
| Don't `console.log` — use the configurable logger | Parser diagnostics for malformed identity and unknown fields use `options.logger?.debug` / `warn`, matching `parseWebhookPayload`'s existing unknown-`object` behavior. |
| Never log webhook body contents (existing webhook logging-hygiene contract, FR-030 from 011) | Operator diagnostics log only the unrecognized `change.field` name (a platform-defined constant, safely truncated) and a literal marker for missing identity fields — never template names, rejection reasons, or quality scores. |

**Gate result**: PASS. No violations. No entries needed in Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/012-template-status-webhooks/
├── plan.md                  # This file (/speckit.plan output)
├── spec.md                  # Feature specification (from /speckit.specify + /speckit.clarify)
├── research.md              # Phase 0 output — research findings and decisions
├── data-model.md            # Phase 1 output — entity shapes and relationships
├── quickstart.md            # Phase 1 output — consumer-facing integration guide
├── contracts/               # Phase 1 output — public API contracts
│   ├── webhook-events.md       # TemplateStatusEvent, TemplateQualityEvent, TemplateEventMetadata shapes + discriminated union extension
│   ├── callbacks.md            # onTemplateStatus / onTemplateQuality on WebhookHandlerCallbacks + Webhooks class
│   ├── parser-dispatch.md      # Field-routing contract (message_template_status_update, message_template_quality_update) + unknown-field behavior
│   └── public-exports.md       # Main barrel + ./webhooks subpath additions
├── checklists/
│   └── requirements.md      # Spec quality checklist (from /speckit.specify)
└── tasks.md                 # Phase 2 output — NOT created by /speckit.plan
```

### Source Code (repository root)

```text
src/
├── webhooks/
│   ├── types.ts             # EDIT — add raw wire shapes (WebhookTemplateStatusPayload, WebhookTemplateQualityPayload), add TemplateEventMetadata, TemplateStatus union-plus-string, TemplateQualityScore union-plus-string, TemplateStatusEvent, TemplateQualityEvent, extend WebhookEvent discriminated union, extend WebhookHandlerCallbacks with onTemplateStatus & onTemplateQuality
│   ├── parser.ts            # EDIT — replace the `if (change.field !== 'messages') continue;` gate with per-field routing; add extractTemplateStatusEvents() and extractTemplateQualityEvents() helpers; for any other non-empty field, log-and-skip via options.logger (FR-010)
│   ├── handler.ts           # EDIT — add 'template_status' and 'template_quality' cases to the dispatch switch
│   ├── webhooks.ts          # EDIT — extend _pendingCallbacks with onTemplateStatus/onTemplateQuality; add fluent onTemplateStatus()/onTemplateQuality() methods matching the onOrder/onFlowCompletion pattern; extend imports from ./types
│   └── index.ts             # EDIT — re-export TemplateStatusEvent, TemplateQualityEvent, TemplateEventMetadata, TemplateStatus, TemplateQualityScore, WebhookTemplateStatusPayload, WebhookTemplateQualityPayload
├── index.ts                 # EDIT — add re-exports for the six new names from src/webhooks/types.ts (following the existing webhooks re-export block)
├── whatsapp.ts              # NO CHANGE — `wa.webhooks` already exposes the Webhooks wrapper; new methods are picked up automatically
├── package.json             # EDIT — bump version to 0.5.0 (first v0.5.x feature per SDK roadmap); no new subpath entry — `./webhooks` already exists
├── tsup.config.ts           # NO CHANGE — no new entry module
├── CLAUDE.md                # EDIT — add new callbacks to webhooks line under "Implemented"; add the two new webhook field names to Meta WhatsApp Cloud API Reference
└── README.md                # EDIT — add `onTemplateStatus` and `onTemplateQuality` to the Webhooks section with a short example

tests/
├── webhooks/
│   ├── parser.test.ts       # EDIT — ~10 new cases: APPROVED/REJECTED w/ reason/PENDING/PAUSED/DISABLED/unknown-string status, quality GREEN→YELLOW, first-rating (no previous score), mixed batch (messages + template_status + template_quality), malformed identity (missing template_id) logs-and-skips, malformed identity (missing template_name) logs-and-skips, unknown `change.field` logs-and-skips
│   ├── handler.test.ts      # EDIT — ~6 new dispatch cases: onTemplateStatus fires exactly once; onTemplateQuality fires exactly once; no cross-contamination to onMessage/onStatus/onError/onFlowCompletion/onOrder; handler works when onTemplateStatus is registered but onTemplateQuality is not; callbacks awaited sequentially
│   └── webhooks.test.ts     # EDIT (create if missing) — ~4 new cases for Webhooks wrapper: onTemplateStatus registers pending callback, onTemplateQuality registers pending callback, explicit createHandler callbacks override pending ones, verify _pendingCallbacks merge order
└── exports/
    └── subpath-exports.test.ts  # EDIT — assert the six new type names are importable from both the main barrel and `./webhooks` subpath

examples/
└── template-webhooks.ts     # NEW — runnable Express example: boot a server with wa.webhooks.createExpressMiddleware({ onTemplateStatus, onTemplateQuality }), log approval/rejection transitions, demonstrate branching on REJECTED.reason and on quality GREEN→YELLOW
```

**Structure Decision**: Single-project TypeScript library. This feature is entirely additive to the existing `src/webhooks/` module and touches no other runtime module. No new directories. No new subpath exports (`./webhooks` already covers it). The `whatsapp.ts` unified client needs no change because `wa.webhooks` already returns a `Webhooks` instance — the new `onTemplateStatus()` / `onTemplateQuality()` methods appear on the class itself. The feature's integration surface is the existing `WebhookEvent` discriminated union plus the existing `WebhookHandlerCallbacks` interface; everything new flows through those two types.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*No violations — constitution unratified and all CLAUDE.md rules satisfied. Table intentionally empty.*
