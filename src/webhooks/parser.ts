import type { Logger } from '../client/types.js';
import type {
  WebhookPayload,
  WebhookEntry,
  WebhookEvent,
  WebhookChangeValue,
  WebhookTemplateStatusPayload,
  WebhookTemplateQualityPayload,
  EventMetadata,
  FlowCompletionEvent,
  OrderEvent,
  OrderItem,
  TemplateEventStatus,
  TemplateQualityScore,
} from './types.js';

export interface ParseWebhookPayloadOptions {
  /** Optional logger for operator diagnostics (no body content is logged). */
  readonly logger?: Logger;
}

/**
 * Parse a raw webhook payload from Meta into an array of typed events.
 *
 * @param payload - The raw JSON body from the webhook POST
 * @param options - Optional parser options (logger for operator diagnostics)
 * @returns Array of parsed WebhookEvent objects (may be empty if no recognized events)
 *
 * @example
 * ```ts
 * const events = parseWebhookPayload(JSON.parse(rawBody));
 * for (const event of events) {
 *   if (event.type === 'message') console.log(event.message);
 * }
 * ```
 */
export function parseWebhookPayload(
  payload: WebhookPayload,
  options?: ParseWebhookPayloadOptions,
): WebhookEvent[] {
  if (payload.object !== 'whatsapp_business_account') {
    // Meta only documents `whatsapp_business_account`; log so operators can
    // spot misconfigured subscriptions instead of returning a silent 200.
    // JSON.stringify + slice caps length and escapes ANSI/newlines so an
    // attacker cannot inject control bytes into operator log streams. We log
    // the literal value only — never the payload body (FR-030).
    const safeObject = JSON.stringify(payload.object).slice(0, 66);
    options?.logger?.debug(`parseWebhookPayload: unknown payload.object ${safeObject}, skipping`);
    return [];
  }

  const events: WebhookEvent[] = [];

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

  return events;
}

function buildMetadata(value: WebhookChangeValue): EventMetadata {
  return {
    phoneNumberId: value.metadata.phone_number_id,
    displayPhoneNumber: value.metadata.display_phone_number,
  };
}

function extractMessageEvents(
  value: WebhookChangeValue,
  metadata: EventMetadata,
  events: WebhookEvent[],
): void {
  if (!value.messages) {
    return;
  }

  for (const message of value.messages) {
    const contact = value.contacts?.find((c) => c.wa_id === message.from);
    const contactInfo = {
      name: contact?.profile.name ?? 'Unknown',
      waId: contact?.wa_id ?? message.from,
    };
    const timestamp = new Date(parseInt(message.timestamp, 10) * 1000);

    // ── Order events (FR-013): routed exclusively to onOrder, never to onMessage ──
    if (message.type === 'order' && message.order) {
      const order = message.order;
      const raw = JSON.stringify(order);
      let items: readonly OrderItem[] = [];
      try {
        const rawItems: unknown = order.product_items;
        if (Array.isArray(rawItems)) {
          const parsed: OrderItem[] = [];
          let allValid = true;
          for (const item of rawItems) {
            if (
              item !== null &&
              typeof item === 'object' &&
              typeof (item as Record<string, unknown>)['product_retailer_id'] === 'string' &&
              typeof (item as Record<string, unknown>)['quantity'] === 'number' &&
              typeof (item as Record<string, unknown>)['item_price'] === 'number' &&
              typeof (item as Record<string, unknown>)['currency'] === 'string'
            ) {
              const typedItem = item as {
                product_retailer_id: string;
                quantity: number;
                item_price: number;
                currency: string;
              };
              parsed.push({
                product_retailer_id: typedItem.product_retailer_id,
                quantity: typedItem.quantity,
                item_price: typedItem.item_price,
                currency: typedItem.currency,
              });
            } else {
              // Malformed item — discard all items and surface empty array.
              allValid = false;
              break;
            }
          }
          if (allValid) items = parsed;
        }
      } catch {
        // Best-effort: surfacing the event with items:[] is always safer than throwing.
        items = [];
      }

      const orderEvent: OrderEvent = {
        type: 'order',
        metadata,
        messageId: message.id,
        from: message.from,
        timestamp: timestamp.toISOString(),
        contact: contactInfo,
        catalogId: order.catalog_id,
        items,
        ...(order.text !== undefined && { text: order.text }),
        raw,
      };
      events.push(orderEvent);
      // MUST NOT fall through to the generic message path (FR-013).
      continue;
    }

    // ── Flow completion events ──
    if (
      message.type === 'interactive' &&
      message.interactive?.type === 'nfm_reply' &&
      message.interactive.nfm_reply
    ) {
      const nfm = message.interactive.nfm_reply;
      // Coerce defensively: the interface types response_json as string, but
      // runtime input from Meta or a fuzz test can still be null/undefined/
      // non-string and we must not throw outside the try/catch below.
      const rawResponseJson: string =
        typeof nfm.response_json === 'string' ? nfm.response_json : '';
      let parsedResponse: Record<string, unknown> = {};
      try {
        const parsed: unknown = JSON.parse(rawResponseJson);
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
          parsedResponse = parsed as Record<string, unknown>;
        }
      } catch {
        // Leave parsedResponse as empty object; raw string still in responseJson.
      }

      const flowEvent: FlowCompletionEvent = {
        type: 'flow_completion',
        metadata,
        contact: contactInfo,
        messageId: message.id,
        responseJson: rawResponseJson,
        response: parsedResponse,
        timestamp,
      };
      events.push(flowEvent);
      continue;
    }

    events.push({
      type: 'message',
      metadata,
      contact: contactInfo,
      message,
      timestamp,
    });
  }
}

function extractStatusEvents(
  value: WebhookChangeValue,
  metadata: EventMetadata,
  events: WebhookEvent[],
): void {
  if (!value.statuses) {
    return;
  }

  for (const status of value.statuses) {
    events.push({
      type: 'status',
      metadata,
      status,
      timestamp: new Date(parseInt(status.timestamp, 10) * 1000),
    });
  }
}

function extractErrorEvents(
  value: WebhookChangeValue,
  metadata: EventMetadata,
  events: WebhookEvent[],
): void {
  if (!value.errors) {
    return;
  }

  for (const error of value.errors) {
    events.push({
      type: 'error',
      metadata,
      error,
    });
  }
}

/** Shared result of validating the common fields on any template-change payload. */
interface TemplateBase {
  readonly templateId: string;
  readonly templateName: string;
  readonly language: string;
  /** Validated non-null object; callers narrow via `as unknown as SpecificPayload`. */
  readonly raw: unknown;
  readonly timestamp: Date;
}

/**
 * Validates the non-object guard, identity fields, and `entry.time` that are
 * identical across every template change type (FR-009). Returns `null` and logs
 * a diagnostic on any failure so the caller can return early.
 */
function parseTemplateBase(
  value: unknown,
  entry: WebhookEntry,
  fieldName: string,
  logger: Logger | undefined,
): TemplateBase | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    logger?.warn(`parseWebhookPayload: ${fieldName} has non-object change.value, skipping`);
    return null;
  }

  const raw = value as unknown as Record<string, unknown>;
  const rawId = raw['message_template_id'];
  const templateId =
    typeof rawId === 'string' ? rawId : typeof rawId === 'number' ? String(rawId) : '';
  const templateName =
    typeof raw['message_template_name'] === 'string' ? raw['message_template_name'] : '';
  const language =
    typeof raw['message_template_language'] === 'string' ? raw['message_template_language'] : '';

  if (!templateId || !templateName || !language) {
    logger?.warn(`parseWebhookPayload: ${fieldName} missing required identity, skipping`);
    return null;
  }

  const timestampMs = typeof entry.time === 'number' ? entry.time * 1000 : NaN;
  if (!Number.isFinite(timestampMs)) {
    logger?.warn(`parseWebhookPayload: ${fieldName} missing entry.time, skipping`);
    return null;
  }

  return { templateId, templateName, language, raw: value, timestamp: new Date(timestampMs) };
}

function extractTemplateStatusEvents(
  value: unknown,
  entry: WebhookEntry,
  events: WebhookEvent[],
  logger: Logger | undefined,
): void {
  const base = parseTemplateBase(value, entry, 'message_template_status_update', logger);
  if (!base) return;

  const raw = base.raw as WebhookTemplateStatusPayload;
  const status = typeof raw.event === 'string' ? raw.event : '';
  if (!status) {
    logger?.warn('parseWebhookPayload: message_template_status_update missing event, skipping');
    return;
  }

  const reason = typeof raw.reason === 'string' && raw.reason !== 'NONE' ? raw.reason : undefined;
  const otherInfo =
    raw.other_info !== null &&
    typeof raw.other_info === 'object' &&
    !Array.isArray(raw.other_info)
      ? raw.other_info
      : undefined;

  events.push({
    type: 'template_status',
    metadata: { businessAccountId: entry.id },
    templateId: base.templateId,
    templateName: base.templateName,
    language: base.language,
    status: status as TemplateEventStatus,
    ...(reason !== undefined && { reason }),
    ...(otherInfo !== undefined && { otherInfo }),
    timestamp: base.timestamp,
  });
}

function extractTemplateQualityEvents(
  value: unknown,
  entry: WebhookEntry,
  events: WebhookEvent[],
  logger: Logger | undefined,
): void {
  const base = parseTemplateBase(value, entry, 'message_template_quality_update', logger);
  if (!base) return;

  const raw = base.raw as WebhookTemplateQualityPayload;
  const newScore = typeof raw.new_quality_score === 'string' ? raw.new_quality_score : '';
  if (!newScore) {
    logger?.warn(
      'parseWebhookPayload: message_template_quality_update missing new_quality_score, skipping',
    );
    return;
  }

  const previousScore =
    typeof raw.previous_quality_score === 'string' ? raw.previous_quality_score : undefined;

  events.push({
    type: 'template_quality',
    metadata: { businessAccountId: entry.id },
    templateId: base.templateId,
    templateName: base.templateName,
    language: base.language,
    newScore: newScore as TemplateQualityScore,
    ...(previousScore !== undefined && { previousScore: previousScore as TemplateQualityScore }),
    timestamp: base.timestamp,
  });
}
