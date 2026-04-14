# Phase 0: Research — Template Status Webhook Events

**Feature**: 012-template-status-webhooks
**Date**: 2026-04-14

All `NEEDS CLARIFICATION` markers in Technical Context are resolved either directly in the spec's Clarifications section (2026-04-14 session) or below.

---

## 1. Platform wire contract for `message_template_status_update`

**Decision**: Parse the change value as:

```json
{
  "event": "APPROVED" | "REJECTED" | "PENDING" | "PAUSED" | "DISABLED" | "PENDING_DELETION" | "IN_APPEAL" | "LIMIT_EXCEEDED" | "FLAGGED" | <string>,
  "message_template_id": "<number-as-string or number>",
  "message_template_name": "<string>",
  "message_template_language": "<BCP-47 e.g. en_US>",
  "reason": "<string or null>",
  "other_info": { ... } | undefined
}
```

and surface it as a `TemplateStatusEvent` with fields `templateId: string`, `templateName: string`, `language: string`, `status: TemplateStatus`, `reason?: string`, plus a `Date` timestamp computed from the enclosing `entry.time` (epoch seconds × 1000, like `MessageEvent.timestamp`).

**Rationale**: Meta's documented fields are stable across app-dashboard subscription versions v17→v21. The `event` field is the canonical status carrier (not `status`), reflected verbatim in platform docs and historical webhook samples. `message_template_id` is numeric in Meta JSON but converts safely to `string` at the SDK boundary to match how the SDK already treats identifiers (phone number IDs, WABA IDs, template IDs from the Templates CRUD module are all strings). `reason` is sometimes `"NONE"`, sometimes `null`, sometimes absent on approvals — the SDK normalizes to `undefined` when missing or equal to the sentinel string `"NONE"` so callers branch cleanly on truthiness. `other_info` is an opaque bag Meta uses for appeal deadlines and title-tag diagnostics; pass through as `readonly otherInfo?: Record<string, unknown>` without interpreting.

**Alternatives considered**:

- **Model `status` as a closed TypeScript union**: rejected. Meta has added new status values over time (`IN_APPEAL`, `FLAGGED`) without SDK notice. A union-plus-string (`TemplateStatus = 'APPROVED' | 'REJECTED' | ... | (string & {})`) satisfies FR-008 — callers can `switch` on the known members and still have `event.status` as a string for fall-through branches. The idiom `(string & {})` preserves autocomplete on the literals while accepting any string, and is the project's existing pattern for extensible unions.
- **Surface numeric `templateId`**: rejected. The rest of the SDK (Templates module, Flows module) treats IDs as strings.
- **Drop `reason` when `"NONE"`**: kept. `reason` is meaningful only on rejection; promoting `"NONE"` to `undefined` saves callers from writing `if (reason && reason !== 'NONE')`.
- **Source timestamp from `change.value.event_time` or similar**: rejected — the platform does not emit a per-change timestamp for template updates. `entry.time` is the authoritative batch timestamp and matches how `MessageEvent.timestamp` is built (from `message.timestamp` which is likewise epoch seconds). For parity, template event timestamps are built from `entry.time`.

---

## 2. Platform wire contract for `message_template_quality_update`

**Decision**: Parse the change value as:

```json
{
  "previous_quality_score": "GREEN" | "YELLOW" | "RED" | "UNKNOWN" | undefined,
  "new_quality_score": "GREEN" | "YELLOW" | "RED" | "UNKNOWN" | <string>,
  "message_template_id": "<number-as-string or number>",
  "message_template_name": "<string>",
  "message_template_language": "<BCP-47>"
}
```

and surface it as a `TemplateQualityEvent` with `templateId: string`, `templateName: string`, `language: string`, `newScore: TemplateQualityScore`, `previousScore?: TemplateQualityScore`, plus a `Date` timestamp from `entry.time`.

**Rationale**: Same union-plus-string approach as status — `TemplateQualityScore = 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN' | (string & {})`. First-time quality ratings omit `previous_quality_score` entirely (not null, not empty string); the SDK preserves that as `previousScore: undefined` in line with the user's clarification-session answer and matching the spec's explicit edge case.

**Alternatives considered**:

- **Coerce missing `previous_quality_score` to `'UNKNOWN'`**: rejected per clarification 2 ("fabricated default" is bad). Absence is information.
- **Expose a synthesized `delta: 'improved' | 'degraded' | 'first'` helper**: rejected as YAGNI. Callers doing real monitoring already have ordering logic; adding a helper is an abstraction we'd then have to maintain as Meta adds scores.

---

## 3. Parser routing strategy

**Decision**: Replace the current gate

```ts
if (change.field !== 'messages') {
  continue;
}
```

with a `switch` on `change.field`:

- `'messages'` → existing path (`extractMessageEvents` + `extractStatusEvents` + `extractErrorEvents`), unchanged.
- `'message_template_status_update'` → `extractTemplateStatusEvents(change.value, entry.id, entry.time, events, options.logger)`.
- `'message_template_quality_update'` → `extractTemplateQualityEvents(change.value, entry.id, entry.time, events, options.logger)`.
- any other non-empty field (including future template variants like `template_category_update`) → `options.logger?.debug(\`parseWebhookPayload: unrecognized change.field \${JSON.stringify(field).slice(0, 66)}, skipping\`)` and continue. Matches the existing "unknown payload.object" diagnostic.

**Rationale**: Field-based `switch` is the minimum-diff change that (a) keeps the `messages`-path shape verbatim, (b) enables two new paths, (c) converts the current silent drop of template fields into an observable diagnostic without surfacing the dropped fields as real events. The helper signature takes `entry.id` (the WABA id) and `entry.time` because template events need both and they live on `entry`, not `change.value`.

**Alternatives considered**:

- **Map of `field → extractor`**: rejected as over-engineering for three branches. A switch is clearer and the TypeScript exhaustiveness check doesn't apply because `change.field` is `string` (platform-extensible), not a closed union.
- **Keep the `messages`-only gate and add a separate second pass for template fields**: rejected. Two passes over `payload.entry` is wasteful and the dispatch logic then has to be coordinated across two loops.
- **Extract template fields inside `extractMessageEvents`**: rejected — violates single-responsibility; the field discriminator belongs at the outermost loop.

---

## 4. `TemplateEventMetadata` placement and export surface

**Decision**: Define `TemplateEventMetadata { readonly businessAccountId: string }` in `src/webhooks/types.ts` alongside the existing `EventMetadata`. Export it through `src/webhooks/index.ts` and the main barrel `src/index.ts`. Template events carry `metadata: TemplateEventMetadata` at the event root — replacing, not augmenting, the phone-scoped `EventMetadata`.

**Rationale**: Matches clarification 1. Locality keeps the two metadata shapes side-by-side for readers. A distinct type means consumers doing `event.metadata.phoneNumberId` on a `TemplateStatusEvent` get a compile-time error instead of silent `undefined`.

**Alternatives considered**:

- **Optional `EventMetadata` fields**: rejected per clarification (option B). Would force `string | undefined` on `phoneNumberId`/`displayPhoneNumber` everywhere, regressing type safety on the four existing event types.
- **Put the metadata at the event root without a wrapper**: rejected per clarification (option C). Breaks the SDK's existing convention that every parsed event carries a `metadata` object — consistent shape pays off in caller ergonomics (`event.metadata.businessAccountId` / `event.metadata.phoneNumberId` — same accessor depth).

---

## 5. Extending the discriminated union without breaking existing consumers

**Decision**: Add two new members to the existing `export type WebhookEvent = MessageEvent | StatusEvent | ErrorEvent | FlowCompletionEvent | OrderEvent` to produce `| TemplateStatusEvent | TemplateQualityEvent`. Existing consumers that use `event.type === 'message'` or `switch (event.type)` continue to work; consumers that exhaustively handle all branches will get TypeScript exhaustiveness errors at compile time for the two new types — this is a breaking change for exhaustive consumers only, and it is the intended behavior (they should handle or explicitly ignore the new events).

**Rationale**: Meta's at-least-once delivery model means an ignored event type is a no-op, not a fault. Callers using the discriminated union exhaustively are a small minority; they will surface the build error, decide whether to wire a handler, and move on. Callers using narrow `if (event.type === 'message')` predicates see no change.

**Alternatives considered**:

- **Make the new members of the union structurally compatible with something existing**: rejected. Structural aliasing would defeat the whole purpose of a discriminated union.
- **Ship template events under a separate `TemplateEvent` union type** and expose a second top-level parse method `parseTemplateEvents()`: rejected. Contradicts FR-013 (single `WebhookEvent` union) and duplicates parse infrastructure.

---

## 6. Handler dispatch extension

**Decision**: Add two `case` branches to the `switch (event.type)` in `createWebhookHandler`'s POST handler:

```ts
case 'template_status':
  await callbacks.onTemplateStatus?.(event);
  break;
case 'template_quality':
  await callbacks.onTemplateQuality?.(event);
  break;
```

The existing `await`-sequential semantics apply: callbacks run in payload order, one at a time; a throw from either callback aborts the remaining events and propagates up to Express/Next middleware.

**Rationale**: Matches existing dispatch style exactly. Callbacks are optional (`?.`) so consumers registering only `onTemplateStatus` are unaffected by quality events (they're delivered to `undefined` and discarded).

**Alternatives considered**:

- **Emit a single generic `onTemplateEvent`**: rejected. Consumers almost always care about approval/rejection specifically (a critical-path signal) and treat quality updates as a monitoring feed — different code paths, different persistence, different alerting. A single callback forces every consumer to switch-case internally.

---

## 7. `Webhooks` wrapper class surface

**Decision**: Extend `_pendingCallbacks` with `onTemplateStatus?` and `onTemplateQuality?` fields. Add two fluent methods to the class mirroring `onOrder` / `onFlowCompletion`:

```ts
onTemplateStatus(callback: (event: TemplateStatusEvent) => void | Promise<void>): this;
onTemplateQuality(callback: (event: TemplateQualityEvent) => void | Promise<void>): this;
```

Each returns `this` for chaining. `createHandler`, `createExpressMiddleware`, and `createNextRouteHandler` already merge `_pendingCallbacks` with caller-provided callbacks (`{ ...this._pendingCallbacks, ...callbacks }`) so no changes to those methods are needed beyond TypeScript picking up the wider `WebhookHandlerCallbacks` type.

**Rationale**: Exact parity with `onOrder` and `onFlowCompletion`. No new ergonomics to document, no new merge semantics to explain.

**Alternatives considered**:

- **Require callers to always pass callbacks via `createHandler({...})`**: rejected. The `on*` fluent style is already established and encouraged in the existing README.

---

## 8. Malformed payload handling

**Decision**: Log-and-skip at the `extractTemplate*Events` helper level when either `message_template_id` or `message_template_name` is missing or non-string/non-number. Emit a `logger?.warn` with a literal marker that names the offending field only (never echo the template name, the reason, or any quality score). Do not throw.

**Rationale**: FR-009 + existing malformed-payload convention (`OrderEvent` parser surfaces `items: []` on bad product_items rather than throwing; `FlowCompletionEvent` parser treats bad JSON in `response_json` as `response: {}`). Throwing would abort the rest of the payload batch, losing events the platform delivered correctly alongside the malformed one. Skipping preserves the rest.

**Alternatives considered**:

- **Surface a degraded event with `templateName: 'Unknown'`**: rejected. Template identity is the whole point of the event; a placeholder would encourage buggy downstream logic (dedup keys that collide, alerts keyed on the wrong template).
- **Throw a typed error**: rejected. Parser-level throws would force every webhook host to wrap handler invocations, breaking the simple middleware mental model.

---

## 9. Logging hygiene

**Decision**: Logger invocations in the new paths never include: the template name, the rejection reason, the quality score, the language, `other_info`, or any value from `change.value`. They include only: the literal string `'parseWebhookPayload'` prefix, the constant field name (JSON-escaped and length-capped like the existing unknown-object diagnostic), and a short literal marker describing the condition (e.g. `'missing template_id'`).

**Rationale**: Mirrors the existing safe-logging contract already followed by `parseWebhookPayload`'s unknown-`object` diagnostic and the OrderEvent parser. Template names can embed business identifiers; rejection reasons can quote submitted sample content; quality scores are audit-sensitive. Nothing of that should ever reach a log aggregator by default.

**Alternatives considered**:

- **Log the `message_template_id` for operator correlation**: rejected for the malformed-identity case (it may be missing — that's the whole trigger). For the unknown-field case, even the template id is unnecessary — operators need the field name to decide whether to subscribe to additional webhook fields on the Meta side.

---

## 10. Version bump

**Decision**: Bump `package.json` `version` to `0.5.0`. This is the first feature of the v0.5.0 milestone per `technical-plans/wa-cloud-sdk-plans/sdk-roadmap-review.md`.

**Rationale**: The SDK is pre-1.0; minor-version bumps signal new platform surface even when the change is additive. The roadmap explicitly places "Template status webhook events" in v0.5.0 — tagging the release accordingly matches the published version cadence.

**Alternatives considered**:

- **Ship as a patch release (0.4.x)**: rejected. The roadmap column for this feature is `v0.5.0`; the user is following that roadmap as the source of truth for the next feature.

---

## Summary table

| Decision | Location |
|---|---|
| Field-based parser routing via `switch` on `change.field` | `src/webhooks/parser.ts` |
| Two extractor helpers: `extractTemplateStatusEvents`, `extractTemplateQualityEvents` | `src/webhooks/parser.ts` |
| Timestamp = `Date(entry.time × 1000)` | `src/webhooks/parser.ts` |
| Dedicated `TemplateEventMetadata { businessAccountId }` | `src/webhooks/types.ts` |
| Union-plus-string for status/quality: `'APPROVED' \| ... \| (string & {})` | `src/webhooks/types.ts` |
| `TemplateStatusEvent` + `TemplateQualityEvent` added to `WebhookEvent` union | `src/webhooks/types.ts` |
| `onTemplateStatus` / `onTemplateQuality` on `WebhookHandlerCallbacks` and `Webhooks` class | `src/webhooks/types.ts`, `src/webhooks/webhooks.ts` |
| Two new `case` branches in `createWebhookHandler` dispatch | `src/webhooks/handler.ts` |
| Log-and-skip on missing identity / unknown field | `src/webhooks/parser.ts` |
| Log only field names + literal markers; never body content | `src/webhooks/parser.ts` |
| Version → `0.5.0` | `package.json` |

No outstanding `NEEDS CLARIFICATION` markers remain.
