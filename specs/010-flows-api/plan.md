# Implementation Plan: WhatsApp Flows API

**Branch**: `010-flows-api` | **Date**: 2026-04-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-flows-api/spec.md`

## Summary

Add full WhatsApp Flows support to `wa-cloud-sdk`: (1) a `sendFlow()` method on the existing `Messages` class that ships an interactive flow invitation to a recipient, (2) a new `Flows` CRUD class (list, get, create, updateMetadata, updateAssets, publish, deprecate, delete, getPreview) that mirrors the existing `Templates` module structure, and (3) a new `FlowCompletionEvent` webhook event type plus `onFlowCompletion` callback that routes `interactive.type === 'nfm_reply'` payloads separately from regular message events. The feature ships as a new `src/flows/` module with its own subpath export (`@abdelrahmannasr-wa/cloud-api/flows`), integrates into the unified `WhatsApp` client via a lazy `flows` getter (mirroring the existing `templates` getter), and preserves the SDK's zero-runtime-dependency guarantee. Multi-account broadcast with flows is first-class: the existing generic `broadcast()` factory pattern already supports it, and this feature adds one test and one runnable example documenting the per-account flow-identifier constraint. Four spec clarifications shape the design: (a) webhook deduplication is the consumer's responsibility — the SDK exposes `messageId` and is stateless; (b) the SDK never logs flow response payloads at any level; (c) `flow_message_version` is a pinned default (`"3"`) with a per-call override; (d) multi-account broadcast with flows is explicitly in scope.

## Technical Context

**Language/Version**: TypeScript 5.3+ with strict mode enabled, compiling to ES2022 target for both ESM and CJS dual output
**Primary Dependencies**: Zero runtime dependencies. Uses only Node.js 18+ built-in APIs (`fetch`, `crypto`, `FormData`, `URL`, `URLSearchParams`, `Buffer`)
**Storage**: N/A — library, stateless
**Testing**: Vitest 3 with v8 coverage (minimum 80% thresholds on lines/functions/branches/statements), mock `HttpClient` via `vi.fn()` for unit tests, optional `*.integration.test.ts` files for Meta sandbox calls (skipped in CI)
**Target Platform**: Node.js 18+ (server-side library). ESM + CJS dual export via tsup 8
**Project Type**: Zero-dependency TypeScript library (single project, no frontend/backend split)
**Performance Goals**: No new latency targets. Inherits the existing rate limiter (80 messages/second token bucket, default) and retry policy (3 retries, exponential backoff with jitter). Flow CRUD operations share the same rate limit envelope as template CRUD (no separate bucket).
**Constraints**:
- MUST preserve zero runtime dependencies
- MUST NOT introduce any `any` usage (strict mode + project ESLint config bans it)
- MUST NOT use default exports (project convention)
- MUST NOT emit flow response payloads to the logger at any level (FR-030, SC-015)
- MUST NOT break any existing public API (FR-028, SC-012)
- MUST maintain ≥ 80% code coverage across new code
- MUST add new tsup entry, new package.json subpath export, and extend the existing test suite for exports verification
**Scale/Scope**: ~3 new source files (`src/flows/{types.ts,flows.ts,index.ts}`), ~7 edited source files (`src/messages/{types,messages,index}.ts`, `src/webhooks/{types,parser,handler,index}.ts`, `src/whatsapp.ts`, `src/index.ts`, `package.json`, `tsup.config.ts`, `CLAUDE.md`, `README.md`, 1 new example), ~5 new or edited test files (`tests/flows/flows.test.ts`, `tests/messages/messages.test.ts` extensions, `tests/webhooks/parser.test.ts` extensions, `tests/webhooks/handler.test.ts` extensions, `tests/whatsapp.test.ts` extensions, `tests/exports/*` extensions). Estimated ~45 new test cases across ~9 methods.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Constitution status**: The project's `.specify/memory/constitution.md` is an unfilled template with placeholder principle names. There is no ratified constitution to gate against at this time.

**Fallback governance**: The authoritative project guide is `CLAUDE.md` at the repo root. This feature MUST comply with the rules encoded there:

| CLAUDE.md rule | Compliance status |
|---|---|
| Zero runtime dependencies | ✅ Uses only native `fetch`, `FormData`, `crypto`, `URL`. No new `dependencies` entries. |
| No `any` — use `unknown` and narrow | ✅ All new types use `interface` or `type` with `readonly` properties. `unknown` used only at parse boundaries (malformed JSON fallback). |
| No default exports | ✅ All new files use named exports only (barrel re-exports via `export { X } from './x.js'`). |
| Throw typed error classes, never plain `Error()` | ✅ Reuses `ValidationError` and `ApiError` from `src/errors/`. No new error class required (platform validation errors surface through existing `ApiError.errorType`/`errorSubcode`). |
| File naming: kebab-case | ✅ `src/flows/flows.ts`, `src/flows/types.ts`, `src/flows/index.ts` |
| All classes accept `HttpClient` via constructor injection | ✅ `Flows` constructor takes `(client: HttpClient, businessAccountId: string)` mirroring `Templates` |
| API methods return `Promise<ApiResponse<T>>` or typed result | ✅ All `Flows` methods return `Promise<ApiResponse<T>>`; `sendFlow` returns `Promise<ApiResponse<MessageResponse>>` |
| Methods with >2 params use a config object | ✅ `sendFlow(options: FlowMessageOptions, requestOptions?)`, `create(request: CreateFlowRequest, requestOptions?)` |
| TSDoc on all public APIs with `@example` blocks | Will be enforced during implementation |
| Tests in `tests/` mirroring `src/` structure | Will be enforced: new `tests/flows/` directory |
| NO network in unit tests — mock `fetch` / `HttpClient` | Will be enforced: use `vi.fn()` mock client |
| Don't hardcode API version — always use `config.apiVersion` | ✅ All calls route through `HttpClient` which already respects `apiVersion` |
| Don't `console.log` — use the configurable logger | ✅ The feature mandates *not* logging response data at all (FR-030); no new logger calls |

**Gate result**: ✅ **PASS**. No violations. No entries needed in Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/010-flows-api/
├── plan.md                # This file (/speckit.plan output)
├── spec.md                # Feature specification (from /speckit.specify + /speckit.clarify)
├── research.md            # Phase 0 output — research findings and decisions
├── data-model.md          # Phase 1 output — entity shapes and relationships
├── quickstart.md          # Phase 1 output — consumer-facing integration guide
├── contracts/             # Phase 1 output — public API contracts
│   ├── flows-class.md         # Flows CRUD class public methods
│   ├── send-flow.md           # Messages.sendFlow() public contract
│   ├── webhook-events.md      # FlowCompletionEvent + callback contract
│   └── public-exports.md      # Main barrel + subpath export + unified client getter
├── checklists/
│   └── requirements.md    # Spec quality checklist (from /speckit.specify)
└── tasks.md               # Phase 2 output — NOT created by /speckit.plan
```

### Source Code (repository root)

```text
src/
├── flows/                       # NEW — feature module
│   ├── types.ts                 # NEW — FlowCategory, FlowStatus, Flow, CreateFlowRequest, …
│   ├── flows.ts                 # NEW — Flows CRUD class
│   └── index.ts                 # NEW — barrel export
├── messages/
│   ├── types.ts                 # EDIT — add FlowMessageOptions
│   ├── messages.ts              # EDIT — add sendFlow() method
│   └── index.ts                 # EDIT — export FlowMessageOptions
├── webhooks/
│   ├── types.ts                 # EDIT — add WebhookNfmReply, extend WebhookInteractivePayload, add FlowCompletionEvent, extend WebhookEvent union, extend WebhookHandlerCallbacks
│   ├── parser.ts                # EDIT — divert nfm_reply to FlowCompletionEvent
│   ├── handler.ts               # EDIT — add 'flow_completion' case to dispatch switch
│   └── index.ts                 # EDIT — re-export FlowCompletionEvent, WebhookNfmReply
├── whatsapp.ts                  # EDIT — add lazy `flows` getter
└── index.ts                     # EDIT — main barrel adds Flows class and types

tests/
├── flows/                       # NEW
│   └── flows.test.ts            # NEW — ~28 unit tests for Flows CRUD
├── messages/
│   └── messages.test.ts         # EDIT — add sendFlow test suite (~8 cases)
├── webhooks/
│   ├── parser.test.ts           # EDIT — add flow_completion routing tests (~5 cases)
│   └── handler.test.ts          # EDIT — add onFlowCompletion dispatch tests (~3 cases)
├── multi-account/
│   └── multi-account.test.ts    # EDIT — add one broadcast-with-flows scenario (FR-007a)
├── whatsapp.test.ts             # EDIT — add flows lazy-init tests (~3 cases)
└── exports/
    └── subpath-exports.test.ts  # EDIT — add ./flows subpath resolution test

examples/
└── flows.ts                     # NEW — runnable example: create → publish → send → handle completion → broadcast pattern

package.json                     # EDIT — add "./flows" subpath export, bump version
tsup.config.ts                   # EDIT — add "flows/index": "src/flows/index.ts" entry
CLAUDE.md                        # EDIT — add src/flows/ to module structure, update Implemented status, add Flows endpoints to Meta API Reference
README.md                        # EDIT — add Flows section with usage examples
```

**Structure Decision**: Single-project TypeScript library (Option 1 — default). The `src/flows/` directory is a new peer of the existing `src/templates/` module and follows the same internal structure (`types.ts` + class file + `index.ts` barrel). No services, models, CLI, or UI subdirectories — this is a zero-dependency library. All cross-cutting integrations (webhooks, unified client, subpath exports) edit existing files in place rather than introducing new top-level directories.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*No violations — constitution unratified and all CLAUDE.md rules satisfied. Table intentionally empty.*
