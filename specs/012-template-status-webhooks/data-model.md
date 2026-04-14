# Data Model: Template Status Webhook Events

**Feature**: 012-template-status-webhooks
**Date**: 2026-04-14

All shapes below are TypeScript interfaces/types defined in `src/webhooks/types.ts`. Raw (wire) shapes mirror Meta JSON exactly; parsed (developer-facing) shapes normalize names to camelCase and convert timestamps to `Date`.

---

## Raw wire shapes (as emitted by Meta)

### `WebhookTemplateStatusPayload`

Raw `change.value` object when `change.field === 'message_template_status_update'`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `event` | `string` | Yes | Platform-defined lifecycle state. Documented values: `'APPROVED' \| 'REJECTED' \| 'PENDING' \| 'PAUSED' \| 'DISABLED' \| 'PENDING_DELETION' \| 'IN_APPEAL' \| 'LIMIT_EXCEEDED' \| 'FLAGGED'`. Accepted as raw `string` to tolerate future additions. |
| `message_template_id` | `string \| number` | Yes | Template identifier. Normalized to `string` at parse time. |
| `message_template_name` | `string` | Yes | Template name (business-scoped). |
| `message_template_language` | `string` | Yes | BCP-47 locale (e.g. `en_US`, `es_MX`). |
| `reason` | `string \| null` | No | Present on `REJECTED` and occasionally `PAUSED`/`DISABLED`. The sentinel literal `'NONE'` is normalized to `undefined`. |
| `other_info` | `Record<string, unknown>` | No | Opaque diagnostic bag — pass through verbatim. |

### `WebhookTemplateQualityPayload`

Raw `change.value` object when `change.field === 'message_template_quality_update'`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `new_quality_score` | `string` | Yes | Documented values: `'GREEN' \| 'YELLOW' \| 'RED' \| 'UNKNOWN'`. Accepted as raw `string`. |
| `previous_quality_score` | `string` | No | **Absent** on first rating — must be preserved as missing (do not coerce). |
| `message_template_id` | `string \| number` | Yes | Normalized to `string` at parse time. |
| `message_template_name` | `string` | Yes | |
| `message_template_language` | `string` | Yes | |

### Extended `WebhookChange`

No schema change needed — `field: string` is already open. The parser routes on `field` values.

---

## Parsed (developer-facing) shapes

### `TemplateEventMetadata`

New metadata shape used exclusively by template events. Distinct from `EventMetadata` (which carries `phoneNumberId` + `displayPhoneNumber` for message/status/error/flow/order events).

```ts
interface TemplateEventMetadata {
  /** WhatsApp Business Account ID sourced from the webhook `entry.id`. */
  readonly businessAccountId: string;
}
```

Sourcing: `businessAccountId ← entry.id`.

### `TemplateEventStatus` and `TemplateQualityScore` (union-plus-string)

```ts
type TemplateEventStatus =
  | 'APPROVED'
  | 'REJECTED'
  | 'PENDING'
  | 'PAUSED'
  | 'DISABLED'
  | 'PENDING_DELETION'
  | 'IN_APPEAL'
  | 'LIMIT_EXCEEDED'
  | 'FLAGGED'
  | (string & {});

type TemplateQualityScore =
  | 'GREEN'
  | 'YELLOW'
  | 'RED'
  | 'UNKNOWN'
  | (string & {});
```

The `(string & {})` clause preserves IDE autocomplete for the named literals while accepting any platform-added value (FR-008). Consumers can `switch` exhaustively on the documented values and fall through on unknowns.

### `TemplateStatusEvent`

```ts
interface TemplateStatusEvent {
  readonly type: 'template_status';
  readonly metadata: TemplateEventMetadata;
  readonly templateId: string;
  readonly templateName: string;
  readonly language: string;
  readonly status: TemplateEventStatus;
  /** Present on `REJECTED` and occasionally `PAUSED`/`DISABLED`. `'NONE'` is normalized to `undefined`. */
  readonly reason?: string;
  /** Opaque platform diagnostic bag (appeal deadlines, title-tag hints). Passed through verbatim. */
  readonly otherInfo?: Record<string, unknown>;
  /** Batch timestamp, sourced from `entry.time` (epoch seconds × 1000). */
  readonly timestamp: Date;
}
```

### `TemplateQualityEvent`

```ts
interface TemplateQualityEvent {
  readonly type: 'template_quality';
  readonly metadata: TemplateEventMetadata;
  readonly templateId: string;
  readonly templateName: string;
  readonly language: string;
  readonly newScore: TemplateQualityScore;
  /** Absent on first rating — intentionally `undefined`, not coerced to `'UNKNOWN'`. */
  readonly previousScore?: TemplateQualityScore;
  readonly timestamp: Date;
}
```

### Extended `WebhookEvent` union

```ts
type WebhookEvent =
  | MessageEvent
  | StatusEvent
  | ErrorEvent
  | FlowCompletionEvent
  | OrderEvent
  | TemplateStatusEvent
  | TemplateQualityEvent;
```

### Extended `WebhookHandlerCallbacks`

```ts
interface WebhookHandlerCallbacks {
  readonly onMessage?: (event: MessageEvent) => void | Promise<void>;
  readonly onStatus?: (event: StatusEvent) => void | Promise<void>;
  readonly onError?: (event: ErrorEvent) => void | Promise<void>;
  readonly onFlowCompletion?: (event: FlowCompletionEvent) => void | Promise<void>;
  readonly onOrder?: (event: OrderEvent) => void | Promise<void>;
  readonly onTemplateStatus?: (event: TemplateStatusEvent) => void | Promise<void>;
  readonly onTemplateQuality?: (event: TemplateQualityEvent) => void | Promise<void>;
}
```

---

## Field mapping: wire → parsed

| Wire path | Parsed path | Transform |
|---|---|---|
| `entry.id` | `event.metadata.businessAccountId` | pass-through |
| `entry.time` | `event.timestamp` | `new Date(entry.time * 1000)` |
| `change.value.event` | `event.status` (status event) | pass-through string |
| `change.value.message_template_id` | `event.templateId` | `String(value)` — numbers coerced to strings |
| `change.value.message_template_name` | `event.templateName` | pass-through |
| `change.value.message_template_language` | `event.language` | pass-through |
| `change.value.reason` | `event.reason` | `undefined` if missing, `null`, or literal `'NONE'`; otherwise pass-through |
| `change.value.other_info` | `event.otherInfo` | pass-through (object) or `undefined` |
| `change.value.new_quality_score` | `event.newScore` (quality event) | pass-through string |
| `change.value.previous_quality_score` | `event.previousScore` | `undefined` if missing; otherwise pass-through |

---

## Lifecycle / state transitions

Template lifecycle transitions are platform-driven; the SDK does not maintain state. Callers receive each transition as an independent event. Canonical platform transitions:

- `PENDING` → `APPROVED` (happy path)
- `PENDING` → `REJECTED` (with `reason`)
- `APPROVED` → `PAUSED` (quality-driven pause; may accompany a quality event)
- `APPROVED` → `DISABLED` (policy violation; may include `reason`)
- `APPROVED` → `IN_APPEAL` / `PENDING` (operator-triggered re-review)
- `DISABLED` → `APPROVED` (post-appeal or post-edit re-submission)

Quality transitions (each `TemplateQualityEvent`):

- First rating: `newScore = 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN'`, `previousScore = undefined`
- Subsequent updates: both fields present, comparable by string equality

The SDK does not synthesize transitions — if the platform only emits `GREEN → RED`, the caller receives that single event; intermediate `YELLOW` is never fabricated.

---

## Validation & invariants

- `templateId`, `templateName`, `language` MUST be non-empty strings after normalization. If any is missing or empty, the parser logs a safe diagnostic and skips the event (does not emit a degraded event).
- `status` and `newScore` are preserved verbatim. Whitespace trimming is NOT applied — the platform always sends clean values; any whitespace would itself be a useful signal of a platform contract change.
- `reason` equal to the literal `'NONE'` collapses to `undefined`; any other string — including empty string, which the platform does not currently emit — passes through untouched.
- `timestamp` MUST be a valid `Date` (i.e. `entry.time` must be a positive integer after `parseInt`). A non-parseable timestamp triggers log-and-skip.
- `otherInfo` is passed through by reference without cloning — the interface marks it `readonly`, and the parser does not mutate.

---

## Key constants

None. No new constants are introduced in `src/webhooks/types.ts` — the status and quality unions are inline types for tree-shaking.
