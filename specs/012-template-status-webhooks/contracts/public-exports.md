# Contract: Public Exports

**Feature**: 012-template-status-webhooks
**Files**: `src/webhooks/index.ts`, `src/index.ts`, `package.json`

---

## `src/webhooks/index.ts`

Append type re-exports. Names follow the existing alphabetical-by-category style:

```ts
export type {
  // ... existing exports ...
  TemplateEventMetadata,
  TemplateStatus,
  TemplateQualityScore,
  TemplateStatusEvent,
  TemplateQualityEvent,
  WebhookTemplateStatusPayload,
  WebhookTemplateQualityPayload,
} from './types.js';
```

Value exports (`Webhooks` class, `parseWebhookPayload`, `createWebhookHandler`, `verifyWebhook`, `verifySignature`, `createExpressMiddleware`, `createNextRouteHandler`) remain unchanged.

---

## `src/index.ts`

The main barrel re-exports the webhook module. Add the same seven names to the existing webhooks export block. Example shape (preserve existing surrounding exports):

```ts
export type {
  // ... existing webhook types ...
  TemplateEventMetadata,
  TemplateStatus,
  TemplateQualityScore,
  TemplateStatusEvent,
  TemplateQualityEvent,
  WebhookTemplateStatusPayload,
  WebhookTemplateQualityPayload,
} from './webhooks/index.js';
```

---

## `package.json`

- `version`: `"0.4.0"` → `"0.5.0"` (first feature of v0.5.0 milestone).
- `exports`: **no change**. `./webhooks` subpath already exists (from feature 009).
- `dependencies` / `peerDependencies`: **no change** — zero runtime deps preserved.

---

## `tsup.config.ts`

No change. `src/webhooks/index.ts` is already built as an entry point.

---

## Subpath import parity

After this feature the following import statements must all resolve to the same runtime type identity (verified by `tests/exports/subpath-exports.test.ts`):

```ts
import type { TemplateStatusEvent } from '@abdelrahmannasr-wa/cloud-api';
import type { TemplateStatusEvent } from '@abdelrahmannasr-wa/cloud-api/webhooks';
```

Same for the other six new names.

---

## CLAUDE.md

Edits under two sections:

1. **Module Structure → webhooks**: update the file description for `types.ts` to list the new types (`TemplateEventMetadata`, `TemplateStatus`, `TemplateQualityScore`, `TemplateStatusEvent`, `TemplateQualityEvent`) and for `parser.ts` to note field-based dispatch.
2. **Implementation Status → webhooks**: append `+ TemplateStatusEvent/TemplateQualityEvent + onTemplateStatus/onTemplateQuality`.
3. **Meta WhatsApp Cloud API Reference**: add two lines under the webhook section:
   - `- Webhook template status events: change.field === 'message_template_status_update'`
   - `- Webhook template quality events: change.field === 'message_template_quality_update'`
4. **Recent Changes**: prepend a `012-template-status-webhooks: Added TemplateStatusEvent and TemplateQualityEvent with WABA-scoped TemplateEventMetadata; field-based parser routing replacing messages-only gate; onTemplateStatus/onTemplateQuality callbacks on WebhookHandlerCallbacks and Webhooks wrapper class; seven new type re-exports; runnable example` entry.

## README.md

Append under the existing Webhooks section a short "Template lifecycle events" subsection with an example using `onTemplateStatus` and `onTemplateQuality` via the unified client. Keep under 30 lines. Do NOT create a new top-level README section.
