# Phase 0 Research: WhatsApp Flows API

**Feature**: 010-flows-api
**Date**: 2026-04-09

## Purpose

Resolve all open design questions and unknowns before entering Phase 1 design. Because the spec already resolved four critical ambiguities via `/speckit.clarify`, and the existing plan at `/Users/amn/Documents/Projects/SDK/technical-plans/wa-cloud-sdk-plans/010-flows-api-plan.md` predates those clarifications, this research file (a) restates the clarified decisions in decision/rationale/alternatives format, (b) validates Meta's Flows REST API and webhook shapes against the approach, and (c) catalogs existing SDK patterns that will be reused verbatim.

## Decisions

### 1. Webhook deduplication

**Decision**: The SDK does not deduplicate flow completion events. `messageId` is exposed on every event; consumers implement idempotency in their own persistence layer.

**Rationale**: The SDK is stateless and single-process by design (see CLAUDE.md: "Zero Dependencies", "All classes accept HttpClient via constructor injection"). Auto-dedup would introduce stateful complexity, conflict with consumers who already have idempotency in their CRM / DB, and behave inconsistently across multi-instance deployments (horizontal scale-out). Exposing `messageId` as a stable, platform-provided identifier lets consumers implement dedup with whatever consistency guarantees they need (Redis `SETNX`, DB unique constraint, etc.).

**Alternatives considered**:
- *Opt-in in-memory LRU helper*: Rejected. Adds public surface area, still fails in multi-instance deployments, and most consumers will need DB-level dedup anyway.
- *Automatic in-process dedup*: Rejected. Surprising default, silently drops events in ways that are hard to debug, and breaks in multi-instance deployments.

**Spec references**: Clarifications Q1, Edge Cases bullet on at-least-once delivery.

---

### 2. Flow response payload logging

**Decision**: The SDK never passes flow response payload contents (raw `response_json` string or parsed object) to the configured `Logger` at any level, including `debug`. Logging of response data is the consumer's explicit responsibility.

**Rationale**: Flow responses may contain PII or regulated data (names, phone numbers, addresses, DOB, payment info, health info) depending on what the consumer's flow captures. The SDK has no way to know a given flow's sensitivity. A "never log by default" contract is the only zero-surprise choice for regulated industries (healthcare, finance, government). Consumers who want logs can add a single line in their own `onFlowCompletion` handler after making an informed decision about their data's sensitivity.

**Alternatives considered**:
- *Log at debug level*: Rejected. Debug level is convention, not enforcement. Consumers who misconfigure production logging would silently leak PII.
- *Redact with placeholder*: Rejected. Adds redaction logic and a new config flag, still hides information from consumers who explicitly want to log. Zero-code option wins.

**Spec references**: Clarifications Q2, FR-030, SC-015.

**Implementation note**: During implementation, audit all new code paths (parser, handler, dispatch) with `grep "logger\." src/webhooks/parser.ts src/webhooks/handler.ts` to confirm no logger call receives `nfm_reply`, `response_json`, or `response` fields.

---

### 3. `flow_message_version` stability contract

**Decision**: The SDK ships with a pinned default of `flow_message_version: "3"` sent on every flow message, with a per-call `flowMessageVersion` override on `FlowMessageOptions`.

**Rationale**: Pinning gives consumers predictable behavior across minor SDK releases; per-call override gives power users an escape hatch to test new Meta versions before the SDK formally bumps its default. Changing the pinned default becomes an intentional SDK release decision (minor version bump for backward-compatible changes, major bump for breaking changes). This matches how the SDK already handles `apiVersion` (centralized default with per-call flexibility).

**Alternatives considered**:
- *Hard-pin with no override*: Rejected. Blocks consumers from testing new versions without an SDK release, slows adoption of Meta's improvements.
- *Auto-follow latest*: Rejected. Silent breakage risk. Violates the SDK's stability contract.

**Spec references**: Clarifications Q3, FR-002a.

**Implementation detail**: `FlowMessageOptions.flowMessageVersion?: string` (optional). Default applied in `sendFlow()`: `flow_message_version: options.flowMessageVersion ?? '3'`.

---

### 4. Multi-account broadcast with flows

**Decision**: Multi-account broadcast with flows is first-class for this release. No new API surface — the existing generic `broadcast(recipients, factory, options?)` already works. Scope includes:
- One automated test in `tests/multi-account/multi-account.test.ts` exercising broadcast with `sendFlow` in the factory
- One runnable example in `examples/flows.ts` showing the pattern
- Documentation in README.md and example of the per-account flow-identifier constraint (a flow ID is scoped to a single WABA; the "same" conceptual flow must have a different identifier in each account)

**Rationale**: The broadcast factory is already generic, so adding first-class support costs one test and one doc change. This prevents consumers from discovering the per-account flow-identifier constraint in production. Consistent with how spec 007 (distribution strategies) treated broadcast as a first-class, documented pattern.

**Alternatives considered**:
- *Implicit support only*: Rejected. Consumers would hit the per-account flow-ID constraint at runtime with a confusing error from Meta.
- *Explicit defer*: Rejected. The feature spec already has Story 1 Acceptance Scenario 7 covering this; splitting it out to a separate spec adds coordination cost with zero benefit.

**Spec references**: Clarifications Q4, FR-007a, SC-016, Story 1 Scenario 7, Edge Cases bullet on cross-account flow identifiers.

**Implementation detail**: The example demonstrates a flow-ID map keyed by account name: `const flowMap = { 'us': 'flow_id_us', 'eu': 'flow_id_eu' }; broadcast(recipients, (account, recipient) => messages.sendFlow({ to: recipient, flowId: flowMap[account.name], ... }))`.

---

### 5. Meta Flows REST API — verified endpoint paths and payload shapes

**Decision**: Use the following REST paths (all under `https://graph.facebook.com/{apiVersion}`). Paths are relative to the base URL because the existing `HttpClient` prepends `${baseUrl}/${apiVersion}/`:

| Operation | HTTP | Path | Body / Query |
|---|---|---|---|
| `list` | GET | `{wabaId}/flows` | query: `limit`, `after`, `before`, `fields` (comma-joined) |
| `get` | GET | `{flowId}` | query: `fields` (comma-joined, optional) |
| `create` | POST | `{wabaId}/flows` | JSON body with `name`, `categories`, `flow_json?`, `endpoint_uri?`, `publish?`, `clone_flow_id?` |
| `updateMetadata` | POST | `{flowId}` | JSON body with `name?`, `categories?`, `endpoint_uri?`, `application_id?` |
| `updateAssets` | POST | `{flowId}/assets` | **multipart/form-data**: `name='flow.json'`, `asset_type='FLOW_JSON'`, `file=<Blob>` |
| `publish` | POST | `{flowId}/publish` | empty JSON `{}` |
| `deprecate` | POST | `{flowId}/deprecate` | empty JSON `{}` |
| `delete` | DELETE | `{flowId}` | — |
| `getPreview` | GET | `{flowId}` | query: `fields=preview.invalidate(false)` |

**Rationale**: Validated against Meta's published Flows API reference at `developers.facebook.com/docs/whatsapp/flows/reference/flowsapi/` (fetched during clarify/research phase of the outer plan). The asymmetry between `updateMetadata` (JSON POST to `{flowId}`) and `updateAssets` (multipart POST to `{flowId}/assets`) is a platform constraint — Meta treats flow metadata and flow definition as separate resources.

**Alternatives considered**:
- *Combine metadata and assets into one `update()` method*: Rejected. Would hide the multipart/JSON split from consumers and make the SDK's behavior opaque. Explicit naming (`updateMetadata` vs `updateAssets`) makes the split obvious and matches Meta's REST boundaries.
- *Shortcut `get(flowId, { preview: true })` instead of `getPreview(flowId)`*: Considered. Both are valid; kept `getPreview()` as a dedicated shortcut because it returns a narrower, more ergonomic response type (`FlowPreviewResponse`) and surfaces the feature discoverably in IDE autocomplete.

**Implementation note**: `HttpClient.upload(path, formData, options?)` is already in place (added for media uploads in spec 002). The multipart `updateAssets` call routes through it verbatim — no HttpClient changes.

---

### 6. Flow send message payload shape

**Decision**: Use the following JSON shape when sending a flow message (posted to `{phoneNumberId}/messages`):

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "<validated digits>",
  "type": "interactive",
  "context": { "message_id": "<optional reply_to>" },
  "interactive": {
    "type": "flow",
    "header": { ... optional ... },
    "body": { "text": "<body>" },
    "footer": { "text": "<optional>" },
    "action": {
      "name": "flow",
      "parameters": {
        "flow_message_version": "3",
        "flow_id": "<flowId>",
        "flow_cta": "<buttonText>",
        "mode": "published",
        "flow_action": "navigate",
        "flow_token": "<optional>",
        "flow_action_payload": { "screen": "<name>", "data": { ... } }
      }
    }
  }
}
```

**Rationale**: Matches Meta's published flow send reference. Delegates `buildBasePayload()` (for `messaging_product`, `recipient_type`, `to`, `type`, `context`) and `buildInteractiveOptionals()` (for header and footer) to the existing private helpers in `src/messages/messages.ts:475-505` — no new infrastructure needed. The `action.parameters` object is assembled inline in `sendFlow()` following the same pattern as `sendInteractiveCta()` at `src/messages/messages.ts:377-404`.

**Alternatives considered**: None significant. The payload shape is prescribed by Meta's platform.

---

### 7. Flow webhook event shape — `nfm_reply`

**Decision**: Extend `WebhookInteractivePayload` in `src/webhooks/types.ts` to include the `nfm_reply` variant:

```ts
export interface WebhookNfmReply {
  readonly name: string;          // always 'flow'
  readonly body: string;          // typically 'Sent'
  readonly response_json: string; // stringified form data
}

export interface WebhookInteractivePayload {
  readonly type: 'button_reply' | 'list_reply' | 'nfm_reply';
  readonly button_reply?: { readonly id: string; readonly title: string };
  readonly list_reply?: { readonly id: string; readonly title: string; readonly description?: string };
  readonly nfm_reply?: WebhookNfmReply;
}
```

Add a new discriminated event type `FlowCompletionEvent` to the `WebhookEvent` union. The parser in `src/webhooks/parser.ts` diverts `interactive.type === 'nfm_reply'` messages into a `FlowCompletionEvent` *instead of* a `MessageEvent` (so consumers with only `onMessage` do not see flow submissions, preventing accidental double-handling).

**Rationale**: Meta delivers flow completions inside the normal `messages` webhook array, with `interactive.type === 'nfm_reply'`. Surfacing them as a distinct event type means consumers do not have to write narrowing logic inside `onMessage`. The parser divert is a minimal, local change to `extractMessageEvents()` that preserves all other behaviors (button_reply, list_reply, text, image, etc.).

**Alternatives considered**:
- *Emit both a MessageEvent AND a FlowCompletionEvent*: Rejected. Causes double-handling for consumers who register both callbacks.
- *Only emit as a MessageEvent, let consumer narrow*: Rejected. Forces every consumer to write type-narrowing code and defeats the point of typed events.
- *Put flow completion into a new `entry.changes.field` filter*: Rejected. Meta does not deliver flow completions on a separate field — they arrive on `field === 'messages'`.

**Spec references**: FR-008, FR-009, FR-010, FR-011, FR-012, FR-013; Story 2 Acceptance Scenarios 1, 2, 5.

---

### 8. `flowToken` on FlowCompletionEvent — always undefined

**Decision**: `FlowCompletionEvent.flowToken` is declared as `readonly flowToken?: string` but the parser always leaves it `undefined`. TSDoc will explicitly document this as a platform limitation.

**Rationale**: Meta does NOT echo `flow_token` back in `nfm_reply` payloads. The token is only preserved if the flow's terminal screen or Data Endpoint response explicitly includes it. Since that's the consumer's responsibility (they author the flow), the SDK cannot reliably populate the field. Declaring it optional leaves room for future improvement if Meta changes behavior.

**Alternatives considered**:
- *Omit the field entirely*: Rejected. Breaks API stability if Meta later adds the field — consumers would have to change code to consume it.
- *Attempt to extract from `response_json` heuristically*: Rejected. No standard location for the token inside `response_json`; consumer-specific.

**Spec references**: Clarifications Q on correlation tokens (Assumption 4), Story 1 Acceptance Scenario 4.

---

### 9. Malformed `response_json` handling

**Decision**: Wrap `JSON.parse(nfm_reply.response_json)` in a try/catch inside the parser. On success, populate `FlowCompletionEvent.response` with the parsed object (narrowed to `Record<string, unknown>` for type safety). On failure, leave `response` as an empty object `{}`. Always populate `responseJson` with the raw string regardless.

**Rationale**: Webhook processing must never halt on malformed data (FR-013). Consumers who need exact fidelity get the raw string; consumers who want convenience get the parsed object or an empty object they can detect with `Object.keys(event.response).length === 0`.

**Alternatives considered**:
- *Parse lazily via a getter*: Rejected. Hidden failures at access time are worse than eager parsing.
- *Throw an error on malformed JSON*: Rejected. Violates FR-013 (graceful degradation).

**Spec references**: FR-013, Story 2 Acceptance Scenario 4, Edge Cases bullet on malformed payloads.

---

### 10. Reuse of existing SDK infrastructure

**Decision**: The following existing modules are reused verbatim without modification:

| Existing | Role in this feature |
|---|---|
| `HttpClient` (`src/client/http-client.ts`) | All HTTP calls route through it. `HttpClient.upload()` handles the `updateAssets` multipart case (already exists from spec 002-media-upload-download) |
| `TokenBucketRateLimiter` (`src/utils/rate-limiter.ts`) | Flow CRUD and send operations share the existing rate limit bucket with other messages and CRUD calls |
| `withRetry` + exponential backoff (`src/utils/retry.ts`) | Flow operations inherit the existing retry policy (3 retries, exponential backoff, retries on `RateLimitError` and 5xx) |
| `validatePhoneNumber` (`src/utils/phone.ts`) | `sendFlow` validates the recipient phone number through this helper before building the payload |
| `ValidationError`, `ApiError`, `RateLimitError`, `AuthenticationError` (`src/errors/errors.ts`) | All error paths use these existing types. No new error class introduced. |
| `buildBasePayload` + `buildInteractiveOptionals` (`src/messages/messages.ts:475-505`) | Private helpers reused for flow send payload construction |
| `extractMessageEvents` (`src/webhooks/parser.ts:49-72`) | Edited in place to divert `nfm_reply`. No new extraction function. |
| `createWebhookHandler` dispatch switch (`src/webhooks/handler.ts:94-104`) | Extended with a `case 'flow_completion':` branch |
| Templates CRUD structure (`src/templates/*`) | `src/flows/*` mirrors this structure file-for-file; the Flows class is a near-clone of Templates |
| Existing lazy getter pattern in `WhatsApp` (`src/whatsapp.ts:122-134` for templates) | New `flows` getter is an exact copy with `Flows` / `businessAccountId` references |

**Rationale**: Maximum code reuse, minimum new surface area. The feature is almost entirely additive with two minimal extensions to the webhook parser and dispatcher.

---

### 11. No new error class

**Decision**: Do not introduce a `FlowError` class. Surface flow-specific failures through the existing `ApiError` hierarchy with `errorType` / `errorSubcode` populated from Meta's error response.

**Rationale**: The SDK already has typed errors (`ApiError`, `RateLimitError`, `AuthenticationError`, `ValidationError`, `MediaError`, `WebhookVerificationError`). Adding `FlowError` for no behavioral difference is bloat. Meta's error responses already carry a structured `error.type` and `error.code` that consumers can discriminate on if needed.

**Alternatives considered**:
- *Dedicated `FlowError` class*: Rejected. No behavior to attach (no extra properties beyond `ApiError`), just a marker type. YAGNI.
- *`FlowValidationError` for the create-with-bad-JSON case*: Rejected. Meta returns structured `validation_errors` inside a 2xx response body (not a 4xx), so the existing `ApiError` path isn't even hit — these errors surface through `CreateFlowResponse.validation_errors`. No error class needed.

**Spec references**: FR-024.

---

### 12. Subpath export naming

**Decision**: The new subpath export is `@abdelrahmannasr-wa/cloud-api/flows` (literal string `./flows` in `package.json` exports map).

**Rationale**: Matches the established convention from spec 009: subpath names mirror source directory names (`./media`, `./templates`, `./phone-numbers`, `./multi-account`). No precedent for renaming.

**Alternatives considered**: None. Convention is well-established.

**Spec references**: FR-026.

---

### 13. Validation constants — minimal set

**Decision**: Expose three validation constants from `src/flows/types.ts`:

```ts
export const MAX_FLOW_NAME_LENGTH = 200;
export const MAX_FLOW_CATEGORIES = 3;
export const MAX_FLOW_JSON_BYTES = 10 * 1024 * 1024; // 10 MB
```

**Rationale**: Platform-imposed limits from Meta's Flows documentation. Exposed as named constants so consumers can reference them in their own validation (e.g., a CMS that writes flow definitions). No client-side validation is enforced in the SDK — it's the consumer's responsibility. This matches how the templates module exposes `MAX_BODY_LENGTH`, `MAX_HEADER_TEXT_LENGTH`, etc. as reference values without the class itself enforcing them.

**Note**: The templates module *does* enforce these in its `TemplateBuilder.build()` method, but Flows deliberately ships without a builder (research decision 14 below), so no enforcement path exists. Validation responsibility sits with the consumer or with Meta's server-side validation (surfaced via `validation_errors`).

**Alternatives considered**:
- *Enforce constants client-side inside `create()`*: Rejected. The SDK does not own the flow JSON spec and shouldn't pre-reject what Meta might accept. Let the platform be the arbiter.
- *Omit constants entirely*: Rejected. Consumers building their own tooling benefit from canonical reference values.

---

### 14. No `FlowBuilder` class

**Decision**: No fluent `FlowBuilder` class. Consumers compose `CreateFlowRequest` as a plain object and pass it to `flows.create()`.

**Rationale**: `TemplateBuilder` exists because templates have structured components (header, body, footer, buttons, each with their own sub-shapes) that benefit from chained construction. Flows are different — the complex part is the `flow_json` definition itself, which is authored to Meta's Flow JSON spec and is deliberately out of scope for this feature (Assumption 1). The surrounding metadata (`name`, `categories`, `endpoint_uri`, `publish`) is simple enough to construct as a literal. Adding a builder would add ~100 lines and one more test file for no ergonomic win.

**Alternatives considered**:
- *Minimal builder with `.setName().setCategories().setFlowJson().build()`*: Rejected. Trivially mechanical — nothing the builder adds that an object literal doesn't.

**Spec references**: Assumption 1.

---

### 15. Testing strategy — unit only in this spec

**Decision**: All new tests are unit tests using `vi.fn()`-mocked `HttpClient`. Integration tests against Meta sandbox are out of scope for this feature spec but can be added in a follow-up `tests/flows/flows.integration.test.ts` file (skipped in CI, runnable manually with real credentials) using the existing `*.integration.test.ts` convention.

**Rationale**: Consistent with how all nine prior specs tested their features. Unit tests cover payload shape, method routing, error paths, and behavioral contracts. Integration tests are a separate concern that doesn't block this feature. CLAUDE.md explicitly states: "NEVER call Meta API in unit tests."

**Spec references**: SC-014, CLAUDE.md "Testing Strategy" section.

---

## Open questions resolved during clarify

All four `/speckit.clarify` questions are recorded in `spec.md § Clarifications § Session 2026-04-09`. No unresolved `NEEDS CLARIFICATION` markers remain in the spec.

## Ready for Phase 1

All decisions documented with rationale. All Meta platform shapes verified. All existing SDK patterns identified and catalogued. Phase 1 may proceed.
