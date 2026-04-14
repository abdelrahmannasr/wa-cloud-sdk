# Contract: Webhook Events

**Feature**: 012-template-status-webhooks
**File**: `src/webhooks/types.ts` (edits)

Public types added or extended.

---

## `TemplateEventMetadata` (new)

```ts
/**
 * Metadata for template-lifecycle webhook events.
 *
 * Distinct from `EventMetadata` because template events are WABA-scoped and
 * carry no phone-number identity on the wire. Sourced from `entry.id`.
 */
export interface TemplateEventMetadata {
  readonly businessAccountId: string;
}
```

## `TemplateEventStatus` (new)

```ts
/**
 * Template lifecycle status. Documented platform values are listed; any
 * additional string is accepted and preserved verbatim so callers can branch
 * on platform additions without an SDK upgrade.
 */
export type TemplateEventStatus =
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
```

## `TemplateQualityScore` (new)

```ts
/**
 * Template user-perceived quality score. Union-plus-string for platform
 * extensibility.
 */
export type TemplateQualityScore =
  | 'GREEN'
  | 'YELLOW'
  | 'RED'
  | 'UNKNOWN'
  | (string & {});
```

## `TemplateStatusEvent` (new)

```ts
/**
 * Emitted when the platform changes a message template's lifecycle state
 * (approved, rejected, paused, disabled, re-approved, etc.).
 *
 * Delivered exclusively to the `onTemplateStatus` callback — never to
 * `onMessage`, `onStatus`, `onError`, `onFlowCompletion`, or `onOrder`.
 *
 * The SDK does NOT deduplicate at-least-once deliveries. Use
 * `(templateId, status, timestamp)` as an idempotency tuple if needed.
 *
 * @example
 * ```ts
 * wa.webhooks.onTemplateStatus((event) => {
 *   if (event.status === 'REJECTED') {
 *     console.log(`Template ${event.templateName} rejected: ${event.reason}`);
 *   }
 * });
 * ```
 */
export interface TemplateStatusEvent {
  readonly type: 'template_status';
  readonly metadata: TemplateEventMetadata;
  readonly templateId: string;
  readonly templateName: string;
  readonly language: string;
  readonly status: TemplateEventStatus;
  /** Present on `REJECTED`; the literal `'NONE'` is normalized to `undefined`. */
  readonly reason?: string;
  /** Opaque platform diagnostic bag (appeal deadlines, title-tag hints). */
  readonly otherInfo?: Record<string, unknown>;
  readonly timestamp: Date;
}
```

## `TemplateQualityEvent` (new)

```ts
/**
 * Emitted when the platform updates a template's user-perceived quality score
 * (GREEN / YELLOW / RED / UNKNOWN).
 *
 * Delivered exclusively to the `onTemplateQuality` callback.
 *
 * `previousScore` is `undefined` for first-time ratings — the SDK does NOT
 * coerce the absence to `'UNKNOWN'`.
 *
 * @example
 * ```ts
 * wa.webhooks.onTemplateQuality((event) => {
 *   if (event.newScore === 'RED') alert(event.templateName);
 * });
 * ```
 */
export interface TemplateQualityEvent {
  readonly type: 'template_quality';
  readonly metadata: TemplateEventMetadata;
  readonly templateId: string;
  readonly templateName: string;
  readonly language: string;
  readonly newScore: TemplateQualityScore;
  readonly previousScore?: TemplateQualityScore;
  readonly timestamp: Date;
}
```

## `WebhookTemplateStatusPayload` (new — raw wire type)

```ts
/** Raw `change.value` shape for `field === 'message_template_status_update'`. */
export interface WebhookTemplateStatusPayload {
  readonly event: string;
  readonly message_template_id: string | number;
  readonly message_template_name: string;
  readonly message_template_language: string;
  readonly reason?: string | null;
  readonly other_info?: Record<string, unknown>;
}
```

## `WebhookTemplateQualityPayload` (new — raw wire type)

```ts
/** Raw `change.value` shape for `field === 'message_template_quality_update'`. */
export interface WebhookTemplateQualityPayload {
  readonly new_quality_score: string;
  readonly previous_quality_score?: string;
  readonly message_template_id: string | number;
  readonly message_template_name: string;
  readonly message_template_language: string;
}
```

## `WebhookEvent` (extended)

```ts
export type WebhookEvent =
  | MessageEvent
  | StatusEvent
  | ErrorEvent
  | FlowCompletionEvent
  | OrderEvent
  | TemplateStatusEvent     // NEW
  | TemplateQualityEvent;   // NEW
```

**Breaking-change disclosure**: consumers who `switch (event.type)` exhaustively will receive compile-time errors until they handle `'template_status'` and `'template_quality'` (or add a `default` branch). Consumers using narrow predicates (`if (event.type === 'message')`) see no change.

## `WebhookHandlerCallbacks` (extended)

```ts
export interface WebhookHandlerCallbacks {
  readonly onMessage?: (event: MessageEvent) => void | Promise<void>;
  readonly onStatus?: (event: StatusEvent) => void | Promise<void>;
  readonly onError?: (event: ErrorEvent) => void | Promise<void>;
  readonly onFlowCompletion?: (event: FlowCompletionEvent) => void | Promise<void>;
  readonly onOrder?: (event: OrderEvent) => void | Promise<void>;
  readonly onTemplateStatus?: (event: TemplateStatusEvent) => void | Promise<void>;   // NEW
  readonly onTemplateQuality?: (event: TemplateQualityEvent) => void | Promise<void>; // NEW
}
```

---

## Exported from `src/webhooks/index.ts`

Add re-exports for: `TemplateEventMetadata`, `TemplateEventStatus`, `TemplateQualityScore`, `TemplateStatusEvent`, `TemplateQualityEvent`, `WebhookTemplateStatusPayload`, `WebhookTemplateQualityPayload`.

## Exported from `src/index.ts`

Add the same seven names to the main barrel's `export type { ... } from './webhooks/index.js'` block.
