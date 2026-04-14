# Contract: Webhooks Class Callback Methods

**Feature**: 012-template-status-webhooks
**File**: `src/webhooks/webhooks.ts` (edits)

Two new fluent registration methods on the `Webhooks` wrapper class, mirroring the existing `onOrder` / `onFlowCompletion` pattern.

---

## `Webhooks._pendingCallbacks` (extended private field)

```ts
private _pendingCallbacks: {
  onOrder?: WebhookHandlerCallbacks['onOrder'];
  onFlowCompletion?: WebhookHandlerCallbacks['onFlowCompletion'];
  onTemplateStatus?: WebhookHandlerCallbacks['onTemplateStatus'];   // NEW
  onTemplateQuality?: WebhookHandlerCallbacks['onTemplateQuality']; // NEW
} = {};
```

## `Webhooks.onTemplateStatus()` (new)

```ts
/**
 * Register a callback for template lifecycle events (approval, rejection,
 * pause, disable, re-approval).
 *
 * Callbacks registered here are merged as defaults when creating handlers via
 * `createHandler`, `createExpressMiddleware`, or `createNextRouteHandler`.
 * Explicitly passed callbacks always take precedence over registered ones.
 *
 * The SDK does NOT deduplicate events — use `(templateId, status, timestamp)`
 * as an idempotency tuple if needed.
 *
 * @example
 * ```ts
 * wa.webhooks.onTemplateStatus(async (event) => {
 *   if (event.status === 'APPROVED') {
 *     await db.markTemplateLive(event.templateId);
 *   } else if (event.status === 'REJECTED') {
 *     await alerts.page({ name: event.templateName, reason: event.reason });
 *   }
 * });
 * ```
 */
onTemplateStatus(
  callback: (event: TemplateStatusEvent) => void | Promise<void>,
): this;
```

## `Webhooks.onTemplateQuality()` (new)

```ts
/**
 * Register a callback for template quality-score updates (GREEN / YELLOW /
 * RED / UNKNOWN).
 *
 * Callbacks registered here are merged as defaults when creating handlers.
 * Explicitly passed callbacks take precedence.
 *
 * `event.previousScore` is `undefined` on first rating.
 *
 * @example
 * ```ts
 * wa.webhooks.onTemplateQuality(async (event) => {
 *   if (event.newScore === 'RED' || event.newScore === 'YELLOW') {
 *     await throttle.campaign(event.templateName);
 *   }
 * });
 * ```
 */
onTemplateQuality(
  callback: (event: TemplateQualityEvent) => void | Promise<void>,
): this;
```

---

## Merge precedence (unchanged)

```ts
const merged: WebhookHandlerCallbacks = {
  ...this._pendingCallbacks,
  ...callbacks,
};
```

- If `_pendingCallbacks.onTemplateStatus` is set and the caller does NOT pass `onTemplateStatus` in the args to `createHandler`, the pending callback is used.
- If the caller passes `onTemplateStatus` explicitly, the explicit callback wins.
- Order of chained `on*` calls is irrelevant — each setter overwrites the slot for that specific event type.

No new merge logic; the spread pattern already handles the new fields.

---

## Handler dispatch (`src/webhooks/handler.ts`)

Inside `createWebhookHandler(...).handlePost(...)`, add two cases to the dispatch switch:

```ts
switch (event.type) {
  case 'message':
    await callbacks.onMessage?.(event);
    break;
  case 'status':
    await callbacks.onStatus?.(event);
    break;
  case 'error':
    await callbacks.onError?.(event);
    break;
  case 'flow_completion':
    await callbacks.onFlowCompletion?.(event);
    break;
  case 'order':
    await callbacks.onOrder?.(event);
    break;
  case 'template_status':             // NEW
    await callbacks.onTemplateStatus?.(event);
    break;
  case 'template_quality':            // NEW
    await callbacks.onTemplateQuality?.(event);
    break;
}
```

Semantics (unchanged from existing dispatch):

- Callbacks are awaited sequentially in payload order.
- A throw from either new callback propagates to the caller (Express `next(err)` / Next.js error path), aborting remaining events in the same payload.
- Missing callbacks short-circuit via optional chaining — no error, no log.
