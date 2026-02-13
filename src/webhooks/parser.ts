import type {
  WebhookPayload,
  WebhookEvent,
  WebhookChangeValue,
  EventMetadata,
} from './types.js';

/**
 * Parse a raw webhook payload from Meta into an array of typed events.
 *
 * @param payload - The raw JSON body from the webhook POST
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
export function parseWebhookPayload(payload: WebhookPayload): WebhookEvent[] {
  if (payload.object !== 'whatsapp_business_account') {
    return [];
  }

  const events: WebhookEvent[] = [];

  for (const entry of payload.entry) {
    for (const change of entry.changes) {
      if (change.field !== 'messages') {
        continue;
      }

      const value = change.value;
      const metadata = buildMetadata(value);

      extractMessageEvents(value, metadata, events);
      extractStatusEvents(value, metadata, events);
      extractErrorEvents(value, metadata, events);
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
    const contact = value.contacts?.find(c => c.wa_id === message.from);

    events.push({
      type: 'message',
      metadata,
      contact: {
        name: contact?.profile.name ?? 'Unknown',
        waId: contact?.wa_id ?? message.from,
      },
      message,
      timestamp: new Date(parseInt(message.timestamp, 10) * 1000),
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
