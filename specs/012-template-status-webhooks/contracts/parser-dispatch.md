# Contract: Parser Field Dispatch

**Feature**: 012-template-status-webhooks
**File**: `src/webhooks/parser.ts` (edits)

The parser's per-change gate changes from `if (change.field !== 'messages') continue;` to a field-based `switch`.

---

## Before (current)

```ts
for (const entry of payload.entry) {
  for (const change of entry.changes) {
    if (change.field !== 'messages') {
      continue;                           // silent drop of template & all other fields
    }

    const value = change.value;
    const metadata = buildMetadata(value);

    extractMessageEvents(value, metadata, events);
    extractStatusEvents(value, metadata, events);
    extractErrorEvents(value, metadata, events);
  }
}
```

## After

```ts
for (const entry of payload.entry) {
  for (const change of entry.changes) {
    switch (change.field) {
      case 'messages': {
        const metadata = buildMetadata(change.value);
        extractMessageEvents(change.value, metadata, events);
        extractStatusEvents(change.value, metadata, events);
        extractErrorEvents(change.value, metadata, events);
        break;
      }
      case 'message_template_status_update':
        extractTemplateStatusEvents(change.value, entry, events, options?.logger);
        break;
      case 'message_template_quality_update':
        extractTemplateQualityEvents(change.value, entry, events, options?.logger);
        break;
      default: {
        // Unknown field (e.g. future template_category_update). Log the
        // field name only — never the change.value — and skip.
        const safeField = JSON.stringify(change.field).slice(0, 66);
        options?.logger?.debug(
          `parseWebhookPayload: unrecognized change.field ${safeField}, skipping`,
        );
      }
    }
  }
}
```

The `messages` case is a pure refactor — same three helper calls, same order, same metadata shape. No behavior change for existing callers.

---

## `extractTemplateStatusEvents` (new helper)

```ts
function extractTemplateStatusEvents(
  value: WebhookChangeValue,                  // typed as `unknown` at the call boundary; narrowed here
  entry: WebhookEntry,
  events: WebhookEvent[],
  logger: Logger | undefined,
): void {
  // Guard against malformed change.value (null, array, primitive) — satisfies FR-009.
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    logger?.warn(
      'parseWebhookPayload: message_template_status_update has non-object change.value, skipping',
    );
    return;
  }

  // Narrow by field access — logs-and-skip on missing identity.
  const raw = value as unknown as WebhookTemplateStatusPayload;

  const templateIdRaw = raw.message_template_id;
  const templateId =
    typeof templateIdRaw === 'string' ? templateIdRaw
    : typeof templateIdRaw === 'number' ? String(templateIdRaw)
    : '';
  const templateName = typeof raw.message_template_name === 'string' ? raw.message_template_name : '';
  const language = typeof raw.message_template_language === 'string' ? raw.message_template_language : '';

  if (!templateId || !templateName || !language) {
    logger?.warn(
      'parseWebhookPayload: message_template_status_update missing required identity, skipping',
    );
    return;
  }

  const status = typeof raw.event === 'string' ? raw.event : '';
  if (!status) {
    logger?.warn('parseWebhookPayload: message_template_status_update missing event, skipping');
    return;
  }

  const reason =
    typeof raw.reason === 'string' && raw.reason !== 'NONE' ? raw.reason : undefined;
  const otherInfo =
    raw.other_info !== null &&
    typeof raw.other_info === 'object' &&
    !Array.isArray(raw.other_info)
      ? (raw.other_info as Record<string, unknown>)
      : undefined;

  const timestampRaw = entry.time;
  const timestampMs = typeof timestampRaw === 'number' ? timestampRaw * 1000 : NaN;
  if (!Number.isFinite(timestampMs)) {
    logger?.warn(
      'parseWebhookPayload: message_template_status_update missing entry.time, skipping',
    );
    return;
  }

  events.push({
    type: 'template_status',
    metadata: { businessAccountId: entry.id },
    templateId,
    templateName,
    language,
    status: status as TemplateStatus,
    ...(reason !== undefined && { reason }),
    ...(otherInfo !== undefined && { otherInfo }),
    timestamp: new Date(timestampMs),
  });
}
```

## `extractTemplateQualityEvents` (new helper)

```ts
function extractTemplateQualityEvents(
  value: WebhookChangeValue,
  entry: WebhookEntry,
  events: WebhookEvent[],
  logger: Logger | undefined,
): void {
  // Guard against malformed change.value (null, array, primitive) — satisfies FR-009.
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    logger?.warn(
      'parseWebhookPayload: message_template_quality_update has non-object change.value, skipping',
    );
    return;
  }

  const raw = value as unknown as WebhookTemplateQualityPayload;

  const templateIdRaw = raw.message_template_id;
  const templateId =
    typeof templateIdRaw === 'string' ? templateIdRaw
    : typeof templateIdRaw === 'number' ? String(templateIdRaw)
    : '';
  const templateName = typeof raw.message_template_name === 'string' ? raw.message_template_name : '';
  const language = typeof raw.message_template_language === 'string' ? raw.message_template_language : '';

  if (!templateId || !templateName || !language) {
    logger?.warn(
      'parseWebhookPayload: message_template_quality_update missing required identity, skipping',
    );
    return;
  }

  const newScore = typeof raw.new_quality_score === 'string' ? raw.new_quality_score : '';
  if (!newScore) {
    logger?.warn(
      'parseWebhookPayload: message_template_quality_update missing new_quality_score, skipping',
    );
    return;
  }

  const previousScore =
    typeof raw.previous_quality_score === 'string' ? raw.previous_quality_score : undefined;

  const timestampRaw = entry.time;
  const timestampMs = typeof timestampRaw === 'number' ? timestampRaw * 1000 : NaN;
  if (!Number.isFinite(timestampMs)) {
    logger?.warn(
      'parseWebhookPayload: message_template_quality_update missing entry.time, skipping',
    );
    return;
  }

  events.push({
    type: 'template_quality',
    metadata: { businessAccountId: entry.id },
    templateId,
    templateName,
    language,
    newScore: newScore as TemplateQualityScore,
    ...(previousScore !== undefined && { previousScore: previousScore as TemplateQualityScore }),
    timestamp: new Date(timestampMs),
  });
}
```

---

## `WebhookEntry` schema touch-up

The current `WebhookEntry` type in `src/webhooks/types.ts` is:

```ts
export interface WebhookEntry {
  readonly id: string;
  readonly changes: readonly WebhookChange[];
}
```

Add an optional `time?: number` field to reflect Meta's actual payload (epoch seconds). This is a pure wire-shape addition and does not change existing parse paths — message/status/error events source their timestamps from `message.timestamp` / `status.timestamp`, not `entry.time`.

```ts
export interface WebhookEntry {
  readonly id: string;
  readonly time?: number;    // NEW — epoch seconds; used only for template events
  readonly changes: readonly WebhookChange[];
}
```

---

## Logging contract (FR-009, FR-010)

- Every new `logger?.warn` / `logger?.debug` call includes only: the literal `'parseWebhookPayload:'` prefix, the constant field name (either inline as a string literal OR the `JSON.stringify(...).slice(0, 66)` pattern for the `default` branch), and a short literal marker.
- No template name, template id, reason, score, language, `other_info`, or any value from `change.value` / `entry` appears in any log message.
- Log level is `warn` for known-field-but-malformed payloads (SDK/platform contract break), and `debug` for unrecognized fields (expected when operators subscribe to future platform fields the SDK doesn't yet know about).

---

## Behavior guarantees

- **No new throws.** The helpers return without adding to `events` on any malformed-payload path.
- **No partial events.** Either an event is fully populated and pushed, or the malformed input is logged and skipped — the array never contains events with empty `templateId` / `templateName`.
- **Preserves unknown status and score strings.** The `status as TemplateStatus` / `newScore as TemplateQualityScore` casts intentionally widen — the value is whatever the platform sent.
- **Preserves `previousScore` absence.** First-time ratings do not get `previousScore: 'UNKNOWN'` coerced in.
- **Message events unchanged.** The `case 'messages'` branch still calls the exact same three helpers with the exact same metadata shape.
