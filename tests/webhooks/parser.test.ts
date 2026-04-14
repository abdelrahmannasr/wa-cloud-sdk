import { describe, it, expect, vi } from 'vitest';
import { parseWebhookPayload } from '../../src/webhooks/parser.js';
import type {
  WebhookPayload,
  MessageEvent,
  StatusEvent,
  ErrorEvent,
  FlowCompletionEvent,
  OrderEvent,
  TemplateStatusEvent,
  TemplateQualityEvent,
} from '../../src/webhooks/types.js';

function createPayload(value: Record<string, unknown>): WebhookPayload {
  return {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'WABA_ID',
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '15551234567',
                phone_number_id: '123456',
              },
              ...value,
            },
            field: 'messages',
          },
        ],
      },
    ],
  };
}

describe('parseWebhookPayload', () => {
  describe('text message', () => {
    it('should parse a text message into a MessageEvent', () => {
      const payload = createPayload({
        contacts: [{ profile: { name: 'John' }, wa_id: '15559876543' }],
        messages: [
          {
            from: '15559876543',
            id: 'wamid.abc123',
            timestamp: '1700000000',
            type: 'text',
            text: { body: 'Hello' },
          },
        ],
      });

      const events = parseWebhookPayload(payload);

      expect(events).toHaveLength(1);
      const event = events[0] as MessageEvent;
      expect(event.type).toBe('message');
      expect(event.contact.name).toBe('John');
      expect(event.contact.waId).toBe('15559876543');
      expect(event.message.type).toBe('text');
      expect(event.message.text?.body).toBe('Hello');
      expect(event.metadata.phoneNumberId).toBe('123456');
      expect(event.metadata.displayPhoneNumber).toBe('15551234567');
    });

    it('should convert timestamp from Unix seconds to Date', () => {
      const payload = createPayload({
        contacts: [{ profile: { name: 'John' }, wa_id: '15559876543' }],
        messages: [
          {
            from: '15559876543',
            id: 'wamid.abc123',
            timestamp: '1700000000',
            type: 'text',
            text: { body: 'Hi' },
          },
        ],
      });

      const events = parseWebhookPayload(payload);
      const event = events[0] as MessageEvent;
      expect(event.timestamp).toEqual(new Date(1700000000 * 1000));
    });
  });

  describe('media message', () => {
    it('should parse an image message', () => {
      const payload = createPayload({
        contacts: [{ profile: { name: 'Jane' }, wa_id: '15559876543' }],
        messages: [
          {
            from: '15559876543',
            id: 'wamid.img123',
            timestamp: '1700000000',
            type: 'image',
            image: { id: 'media_id', mime_type: 'image/jpeg', sha256: 'abc' },
          },
        ],
      });

      const events = parseWebhookPayload(payload);
      const event = events[0] as MessageEvent;
      expect(event.message.type).toBe('image');
      expect(event.message.image?.id).toBe('media_id');
      expect(event.message.image?.mime_type).toBe('image/jpeg');
    });

    it('should parse a document message with filename', () => {
      const payload = createPayload({
        contacts: [{ profile: { name: 'Jane' }, wa_id: '15559876543' }],
        messages: [
          {
            from: '15559876543',
            id: 'wamid.doc123',
            timestamp: '1700000000',
            type: 'document',
            document: {
              id: 'doc_id',
              mime_type: 'application/pdf',
              sha256: 'def',
              filename: 'report.pdf',
            },
          },
        ],
      });

      const events = parseWebhookPayload(payload);
      const event = events[0] as MessageEvent;
      expect(event.message.type).toBe('document');
      expect(event.message.document?.filename).toBe('report.pdf');
    });
  });

  describe('status updates', () => {
    it('should parse delivered status into StatusEvent', () => {
      const payload = createPayload({
        statuses: [
          {
            id: 'wamid.status123',
            status: 'delivered',
            timestamp: '1700000000',
            recipient_id: '15551234567',
          },
        ],
      });

      const events = parseWebhookPayload(payload);
      expect(events).toHaveLength(1);
      const event = events[0] as StatusEvent;
      expect(event.type).toBe('status');
      expect(event.status.status).toBe('delivered');
      expect(event.status.recipient_id).toBe('15551234567');
      expect(event.timestamp).toEqual(new Date(1700000000 * 1000));
    });

    it('should parse failed status with errors', () => {
      const payload = createPayload({
        statuses: [
          {
            id: 'wamid.fail123',
            status: 'failed',
            timestamp: '1700000000',
            recipient_id: '15551234567',
            errors: [{ code: 131047, title: 'Message failed to send' }],
          },
        ],
      });

      const events = parseWebhookPayload(payload);
      const event = events[0] as StatusEvent;
      expect(event.status.status).toBe('failed');
      expect(event.status.errors?.[0]?.code).toBe(131047);
    });
  });

  describe('error events', () => {
    it('should parse webhook errors into ErrorEvent', () => {
      const payload = createPayload({
        errors: [{ code: 130429, title: 'Rate limit hit', message: 'Too many messages' }],
      });

      const events = parseWebhookPayload(payload);
      expect(events).toHaveLength(1);
      const event = events[0] as ErrorEvent;
      expect(event.type).toBe('error');
      expect(event.error.code).toBe(130429);
      expect(event.error.title).toBe('Rate limit hit');
    });
  });

  describe('multiple events', () => {
    it('should handle messages and statuses in the same change', () => {
      const payload = createPayload({
        contacts: [{ profile: { name: 'John' }, wa_id: '15559876543' }],
        messages: [
          {
            from: '15559876543',
            id: 'wamid.msg1',
            timestamp: '1700000000',
            type: 'text',
            text: { body: 'Hello' },
          },
        ],
        statuses: [
          {
            id: 'wamid.status1',
            status: 'sent',
            timestamp: '1700000001',
            recipient_id: '15559876543',
          },
        ],
      });

      const events = parseWebhookPayload(payload);
      expect(events).toHaveLength(2);
      expect(events[0]!.type).toBe('message');
      expect(events[1]!.type).toBe('status');
    });

    it('should handle multiple messages in one payload', () => {
      const payload = createPayload({
        contacts: [
          { profile: { name: 'Alice' }, wa_id: '15551111111' },
          { profile: { name: 'Bob' }, wa_id: '15552222222' },
        ],
        messages: [
          {
            from: '15551111111',
            id: 'wamid.1',
            timestamp: '1700000000',
            type: 'text',
            text: { body: 'Hi' },
          },
          {
            from: '15552222222',
            id: 'wamid.2',
            timestamp: '1700000001',
            type: 'text',
            text: { body: 'Hey' },
          },
        ],
      });

      const events = parseWebhookPayload(payload);
      expect(events).toHaveLength(2);
      expect((events[0] as MessageEvent).contact.name).toBe('Alice');
      expect((events[1] as MessageEvent).contact.name).toBe('Bob');
    });
  });

  describe('edge cases', () => {
    it('should return empty array for non-whatsapp_business_account object', () => {
      const payload: WebhookPayload = {
        object: 'instagram',
        entry: [],
      };

      expect(parseWebhookPayload(payload)).toEqual([]);
    });

    it('should log the unknown object value when a logger is provided', () => {
      const payload: WebhookPayload = {
        object: 'instagram',
        entry: [],
      };

      const debug = vi.fn();
      const logger = { debug, info: vi.fn(), warn: vi.fn(), error: vi.fn() };

      expect(parseWebhookPayload(payload, { logger })).toEqual([]);
      expect(debug).toHaveBeenCalledTimes(1);
      expect(debug.mock.calls[0]![0]).toContain('instagram');
    });

    it('should sanitize attacker-controlled payload.object before logging', () => {
      const hostile = `\u001b[31mred\u001b[0m${'x'.repeat(500)}\nextra`;
      const payload = {
        object: hostile,
        entry: [],
      } as unknown as WebhookPayload;

      const debug = vi.fn();
      const logger = { debug, info: vi.fn(), warn: vi.fn(), error: vi.fn() };

      expect(parseWebhookPayload(payload, { logger })).toEqual([]);
      expect(debug).toHaveBeenCalledTimes(1);
      const logged = debug.mock.calls[0]![0] as string;
      // No raw ANSI escape byte (0x1b) or raw newline bleed into the log line.
      expect(logged).not.toContain('\u001b');
      expect(logged.split('\n')).toHaveLength(1);
      // Length is bounded (prefix + up to 66 chars for the JSON slice + suffix).
      expect(logged.length).toBeLessThan(150);
    });

    it('should return empty array when messages and statuses are both absent', () => {
      const payload = createPayload({});
      expect(parseWebhookPayload(payload)).toEqual([]);
    });

    it('should handle missing contacts array gracefully', () => {
      const payload = createPayload({
        messages: [
          {
            from: '15559876543',
            id: 'wamid.nocontact',
            timestamp: '1700000000',
            type: 'text',
            text: { body: 'No contact' },
          },
        ],
      });

      const events = parseWebhookPayload(payload);
      expect(events).toHaveLength(1);
      const event = events[0] as MessageEvent;
      expect(event.contact.name).toBe('Unknown');
      expect(event.contact.waId).toBe('15559876543');
    });

    it('should skip changes with field other than messages', () => {
      const payload: WebhookPayload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'WABA_ID',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: { display_phone_number: '15551234567', phone_number_id: '123456' },
                },
                field: 'account_update',
              },
            ],
          },
        ],
      };

      expect(parseWebhookPayload(payload)).toEqual([]);
    });

    it('should handle empty entry array', () => {
      const payload: WebhookPayload = {
        object: 'whatsapp_business_account',
        entry: [],
      };

      expect(parseWebhookPayload(payload)).toEqual([]);
    });
  });

  describe('interactive messages', () => {
    it('should parse button_reply interactive message', () => {
      const payload = createPayload({
        contacts: [{ profile: { name: 'User' }, wa_id: '15559876543' }],
        messages: [
          {
            from: '15559876543',
            id: 'wamid.interactive1',
            timestamp: '1700000000',
            type: 'interactive',
            interactive: {
              type: 'button_reply',
              button_reply: { id: 'btn1', title: 'Option A' },
            },
          },
        ],
      });

      const events = parseWebhookPayload(payload);
      const event = events[0] as MessageEvent;
      expect(event.message.type).toBe('interactive');
      expect(event.message.interactive?.type).toBe('button_reply');
      expect(event.message.interactive?.button_reply?.id).toBe('btn1');
    });

    it('should parse list_reply interactive message', () => {
      const payload = createPayload({
        contacts: [{ profile: { name: 'User' }, wa_id: '15559876543' }],
        messages: [
          {
            from: '15559876543',
            id: 'wamid.interactive2',
            timestamp: '1700000000',
            type: 'interactive',
            interactive: {
              type: 'list_reply',
              list_reply: { id: 'row1', title: 'Item 1', description: 'First item' },
            },
          },
        ],
      });

      const events = parseWebhookPayload(payload);
      const event = events[0] as MessageEvent;
      expect(event.message.interactive?.type).toBe('list_reply');
      expect(event.message.interactive?.list_reply?.id).toBe('row1');
    });
  });

  describe('reaction messages', () => {
    it('should parse reaction message', () => {
      const payload = createPayload({
        contacts: [{ profile: { name: 'User' }, wa_id: '15559876543' }],
        messages: [
          {
            from: '15559876543',
            id: 'wamid.reaction1',
            timestamp: '1700000000',
            type: 'reaction',
            reaction: { message_id: 'wamid.original', emoji: '\u{1F44D}' },
          },
        ],
      });

      const events = parseWebhookPayload(payload);
      const event = events[0] as MessageEvent;
      expect(event.message.type).toBe('reaction');
      expect(event.message.reaction?.message_id).toBe('wamid.original');
      expect(event.message.reaction?.emoji).toBe('\u{1F44D}');
    });
  });

  describe('flow completion events', () => {
    const flowResponseData = {
      screen_name: 'SUCCESS',
      form: { full_name: 'Alice Example', email: 'alice@example.com' },
    };

    function createNfmReplyPayload(responseJson: string = JSON.stringify(flowResponseData)) {
      return createPayload({
        contacts: [{ profile: { name: 'Alice' }, wa_id: '15559876543' }],
        messages: [
          {
            from: '15559876543',
            id: 'wamid.flow1',
            timestamp: '1712620800',
            type: 'interactive',
            interactive: {
              type: 'nfm_reply',
              nfm_reply: {
                name: 'flow',
                body: 'Sent',
                response_json: responseJson,
              },
            },
          },
        ],
      });
    }

    it('should divert nfm_reply to FlowCompletionEvent instead of MessageEvent', () => {
      const payload = createNfmReplyPayload();
      const events = parseWebhookPayload(payload);

      expect(events).toHaveLength(1);
      const event = events[0] as FlowCompletionEvent;
      expect(event.type).toBe('flow_completion');
      expect(events.filter((e) => e.type === 'message')).toHaveLength(0);
    });

    it('should parse valid response_json into response object', () => {
      const payload = createNfmReplyPayload();
      const events = parseWebhookPayload(payload);
      const event = events[0] as FlowCompletionEvent;

      expect(event.response).toStrictEqual(flowResponseData);
    });

    it('should preserve raw responseJson byte-for-byte', () => {
      const rawJson = JSON.stringify(flowResponseData);
      const payload = createNfmReplyPayload(rawJson);
      const events = parseWebhookPayload(payload);
      const event = events[0] as FlowCompletionEvent;

      expect(event.responseJson).toBe(rawJson);
    });

    it('should tolerate malformed JSON without throwing', () => {
      const payload = createNfmReplyPayload('not valid json{{{');
      const events = parseWebhookPayload(payload);

      expect(events).toHaveLength(1);
      const event = events[0] as FlowCompletionEvent;
      expect(event.type).toBe('flow_completion');
      expect(event.response).toStrictEqual({});
      expect(event.responseJson).toBe('not valid json{{{');
    });

    it('should treat JSON array response_json as empty response', () => {
      const payload = createNfmReplyPayload('[1, 2, 3]');
      const events = parseWebhookPayload(payload);
      const event = events[0] as FlowCompletionEvent;

      expect(event.response).toStrictEqual({});
      expect(event.responseJson).toBe('[1, 2, 3]');
    });

    it('should not throw when response_json is not a string at runtime', () => {
      const payload = createNfmReplyPayload(null as unknown as string);
      expect(() => parseWebhookPayload(payload)).not.toThrow();

      const events = parseWebhookPayload(payload);
      const event = events[0] as FlowCompletionEvent;
      expect(event.type).toBe('flow_completion');
      expect(event.response).toStrictEqual({});
      expect(event.responseJson).toBe('');
    });

    it('should still parse button_reply as MessageEvent (regression)', () => {
      const payload = createPayload({
        contacts: [{ profile: { name: 'User' }, wa_id: '15559876543' }],
        messages: [
          {
            from: '15559876543',
            id: 'wamid.btn1',
            timestamp: '1700000000',
            type: 'interactive',
            interactive: {
              type: 'button_reply',
              button_reply: { id: 'btn1', title: 'Option A' },
            },
          },
        ],
      });

      const events = parseWebhookPayload(payload);
      expect(events).toHaveLength(1);
      const event = events[0] as MessageEvent;
      expect(event.type).toBe('message');
      expect(event.message.interactive?.type).toBe('button_reply');
    });

    it('should populate metadata, contact, messageId, and timestamp correctly', () => {
      const payload = createNfmReplyPayload();
      const events = parseWebhookPayload(payload);
      const event = events[0] as FlowCompletionEvent;

      expect(event.metadata.phoneNumberId).toBe('123456');
      expect(event.metadata.displayPhoneNumber).toBe('15551234567');
      expect(event.contact.name).toBe('Alice');
      expect(event.contact.waId).toBe('15559876543');
      expect(event.messageId).toBe('wamid.flow1');
      expect(event.timestamp).toEqual(new Date(1712620800 * 1000));
    });

    it('should leave flowToken as undefined', () => {
      const payload = createNfmReplyPayload();
      const events = parseWebhookPayload(payload);
      const event = events[0] as FlowCompletionEvent;

      expect(event.flowToken).toBeUndefined();
    });
  });

  describe('order event', () => {
    function createOrderPayload(
      orderOverride?: Partial<{
        catalog_id: string;
        product_items: unknown;
        text: string;
      }>,
    ): WebhookPayload {
      return createPayload({
        contacts: [{ profile: { name: 'Bob' }, wa_id: '15559876543' }],
        messages: [
          {
            from: '15559876543',
            id: 'wamid.order001',
            timestamp: '1712620800',
            type: 'order',
            order: {
              catalog_id: 'cat-001',
              product_items: [
                { product_retailer_id: 'SKU-A', quantity: 2, item_price: 999, currency: 'USD' },
              ],
              ...orderOverride,
            },
          },
        ],
      });
    }

    it('should parse a well-formed order with one item', () => {
      const events = parseWebhookPayload(createOrderPayload());

      expect(events).toHaveLength(1);
      const event = events[0] as OrderEvent;
      expect(event.type).toBe('order');
      expect(event.messageId).toBe('wamid.order001');
      expect(event.from).toBe('15559876543');
      expect(event.catalogId).toBe('cat-001');
      expect(event.items).toHaveLength(1);
      expect(event.items[0]).toEqual({
        product_retailer_id: 'SKU-A',
        quantity: 2,
        item_price: 999,
        currency: 'USD',
      });
      expect(event.raw).toBe(
        JSON.stringify({
          catalog_id: 'cat-001',
          product_items: [
            { product_retailer_id: 'SKU-A', quantity: 2, item_price: 999, currency: 'USD' },
          ],
        }),
      );
    });

    it('should normalize metadata to EventMetadata (camelCase)', () => {
      const events = parseWebhookPayload(createOrderPayload());
      const event = events[0] as OrderEvent;
      expect(event.metadata.phoneNumberId).toBe('123456');
      expect(event.metadata.displayPhoneNumber).toBe('15551234567');
    });

    it('should normalize contact to EventContact (flat, camelCase)', () => {
      const events = parseWebhookPayload(createOrderPayload());
      const event = events[0] as OrderEvent;
      expect(event.contact.name).toBe('Bob');
      expect(event.contact.waId).toBe('15559876543');
    });

    it('should fall back contact.name to "Unknown" when no contact entry matches', () => {
      const payload = createPayload({
        messages: [
          {
            from: '15559876543',
            id: 'wamid.order001',
            timestamp: '1712620800',
            type: 'order',
            order: {
              catalog_id: 'cat-001',
              product_items: [
                { product_retailer_id: 'SKU-A', quantity: 2, item_price: 999, currency: 'USD' },
              ],
            },
          },
        ],
      });
      const events = parseWebhookPayload(payload);
      const event = events[0] as OrderEvent;
      expect(event.contact.name).toBe('Unknown');
      expect(event.contact.waId).toBe('15559876543');
    });

    it('should parse a well-formed order with multiple items', () => {
      const payload = createOrderPayload({
        product_items: [
          { product_retailer_id: 'SKU-A', quantity: 1, item_price: 500, currency: 'USD' },
          { product_retailer_id: 'SKU-B', quantity: 3, item_price: 250, currency: 'USD' },
        ],
      });
      const events = parseWebhookPayload(payload);
      const event = events[0] as OrderEvent;
      expect(event.items).toHaveLength(2);
      expect(event.items[1]?.product_retailer_id).toBe('SKU-B');
    });

    it('should include optional text field when present', () => {
      const events = parseWebhookPayload(createOrderPayload({ text: 'Please deliver by 5pm' }));
      const event = events[0] as OrderEvent;
      expect(event.text).toBe('Please deliver by 5pm');
    });

    it('should surface event with items:[] and raw preserved when product_items is null', () => {
      const payload = createOrderPayload({ product_items: null });
      const events = parseWebhookPayload(payload);
      const event = events[0] as OrderEvent;
      expect(event.type).toBe('order');
      expect(event.items).toEqual([]);
      expect(event.raw).toContain('catalog_id');
    });

    it('should set items:[] and preserve raw when a product item is missing required fields', () => {
      const payload = createOrderPayload({
        product_items: [
          { product_retailer_id: 'SKU-A' }, // missing quantity, item_price, currency
        ],
      });
      const events = parseWebhookPayload(payload);
      const event = events[0] as OrderEvent;
      expect(event.items).toEqual([]);
      expect(event.raw).toContain('SKU-A');
    });

    it('should set items:[] when product_items is an empty array', () => {
      const payload = createOrderPayload({ product_items: [] });
      const events = parseWebhookPayload(payload);
      const event = events[0] as OrderEvent;
      expect(event.type).toBe('order');
      expect(event.items).toEqual([]);
    });

    it('should set items:[] and discard partial results when second item is malformed', () => {
      const payload = createOrderPayload({
        product_items: [
          { product_retailer_id: 'SKU-A', quantity: 1, item_price: 500, currency: 'USD' },
          { product_retailer_id: 'SKU-B' }, // malformed — missing required fields
        ],
      });
      const events = parseWebhookPayload(payload);
      const event = events[0] as OrderEvent;
      // Must discard the valid first item along with the malformed second item.
      expect(event.items).toEqual([]);
    });

    it('should parse mixed batch (order + text message) as independent events', () => {
      const payload: WebhookPayload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'WABA_ID',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: { display_phone_number: '15551234567', phone_number_id: '123456' },
                  contacts: [{ profile: { name: 'Bob' }, wa_id: '15559876543' }],
                  messages: [
                    {
                      from: '15559876543',
                      id: 'wamid.order001',
                      timestamp: '1712620800',
                      type: 'order',
                      order: {
                        catalog_id: 'cat-001',
                        product_items: [
                          {
                            product_retailer_id: 'SKU-A',
                            quantity: 1,
                            item_price: 999,
                            currency: 'USD',
                          },
                        ],
                      },
                    },
                    {
                      from: '15559876543',
                      id: 'wamid.text001',
                      timestamp: '1712620801',
                      type: 'text',
                      text: { body: 'Hello' },
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      };

      const events = parseWebhookPayload(payload);
      expect(events).toHaveLength(2);
      const orderEvent = events.find((e) => e.type === 'order');
      const msgEvent = events.find((e) => e.type === 'message');
      expect(orderEvent).toBeDefined();
      expect(msgEvent).toBeDefined();
      // Order event must NOT also appear as a message event
      expect(events.filter((e) => e.type === 'message')).toHaveLength(1);
    });
  });

  function createTemplatePayload(
    field: string,
    changeValue: Record<string, unknown>,
    entryTime = 1700000000,
  ): WebhookPayload {
    return {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'WABA_001',
          time: entryTime,
          changes: [{ field, value: changeValue as never }],
        },
      ],
    };
  }

  describe('message_template_status_update', () => {
    const createStatusPayload = (v: Record<string, unknown>, t?: number) =>
      createTemplatePayload('message_template_status_update', v, t);

    const baseValue = {
      event: 'APPROVED',
      message_template_id: 'tmpl-123',
      message_template_name: 'order_confirmation',
      message_template_language: 'en_US',
    };

    it('should parse an APPROVED status event', () => {
      const events = parseWebhookPayload(createStatusPayload(baseValue));
      expect(events).toHaveLength(1);
      const e = events[0] as TemplateStatusEvent;
      expect(e.type).toBe('template_status');
      expect(e.metadata.businessAccountId).toBe('WABA_001');
      expect(e.templateId).toBe('tmpl-123');
      expect(e.templateName).toBe('order_confirmation');
      expect(e.language).toBe('en_US');
      expect(e.status).toBe('APPROVED');
      expect(e.reason).toBeUndefined();
      expect(e.timestamp).toEqual(new Date(1700000000 * 1000));
    });

    it('should parse a REJECTED status event with reason', () => {
      const events = parseWebhookPayload(
        createStatusPayload({ ...baseValue, event: 'REJECTED', reason: 'ABUSIVE_CONTENT' }),
      );
      expect(events).toHaveLength(1);
      const e = events[0] as TemplateStatusEvent;
      expect(e.status).toBe('REJECTED');
      expect(e.reason).toBe('ABUSIVE_CONTENT');
    });

    it('should normalize reason "NONE" to undefined', () => {
      const events = parseWebhookPayload(
        createStatusPayload({ ...baseValue, event: 'REJECTED', reason: 'NONE' }),
      );
      const e = events[0] as TemplateStatusEvent;
      expect(e.reason).toBeUndefined();
    });

    it('should parse PENDING status', () => {
      const events = parseWebhookPayload(createStatusPayload({ ...baseValue, event: 'PENDING' }));
      expect((events[0] as TemplateStatusEvent).status).toBe('PENDING');
    });

    it('should parse PAUSED status', () => {
      const events = parseWebhookPayload(createStatusPayload({ ...baseValue, event: 'PAUSED' }));
      expect((events[0] as TemplateStatusEvent).status).toBe('PAUSED');
    });

    it('should parse DISABLED status', () => {
      const events = parseWebhookPayload(createStatusPayload({ ...baseValue, event: 'DISABLED' }));
      expect((events[0] as TemplateStatusEvent).status).toBe('DISABLED');
    });

    it('should preserve an unknown status string verbatim (FR-008)', () => {
      const events = parseWebhookPayload(
        createStatusPayload({ ...baseValue, event: 'FUTURE_PLATFORM_STATUS' }),
      );
      expect((events[0] as TemplateStatusEvent).status).toBe('FUTURE_PLATFORM_STATUS');
    });

    it('should set otherInfo to undefined when platform sends other_info: null', () => {
      const events = parseWebhookPayload(
        createStatusPayload({ ...baseValue, other_info: null }),
      );
      const e = events[0] as TemplateStatusEvent;
      expect(e.type).toBe('template_status');
      // Guard must not leak null through typeof obj === 'object' — otherInfo stays absent.
      expect(e.otherInfo).toBeUndefined();
      expect('otherInfo' in e).toBe(false);
    });

    it('should preserve otherInfo object when present', () => {
      const events = parseWebhookPayload(
        createStatusPayload({
          ...baseValue,
          event: 'REJECTED',
          reason: 'ABUSIVE_CONTENT',
          other_info: { appeal_deadline: '2026-05-01' },
        }),
      );
      expect((events[0] as TemplateStatusEvent).otherInfo).toEqual({
        appeal_deadline: '2026-05-01',
      });
    });

    it('should coerce numeric message_template_id to string', () => {
      const events = parseWebhookPayload(
        createStatusPayload({ ...baseValue, message_template_id: 987654321 }),
      );
      expect((events[0] as TemplateStatusEvent).templateId).toBe('987654321');
    });

    it('should log-and-skip when message_template_id is missing', () => {
      const logger = { warn: vi.fn(), debug: vi.fn(), info: vi.fn(), error: vi.fn() };
      const noId: Record<string, unknown> = { ...baseValue };
      delete noId['message_template_id'];
      const events = parseWebhookPayload(createStatusPayload(noId), { logger });
      expect(events).toHaveLength(0);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('missing required identity'),
      );
    });

    it('should log-and-skip when message_template_name is missing', () => {
      const logger = { warn: vi.fn(), debug: vi.fn(), info: vi.fn(), error: vi.fn() };
      const noName: Record<string, unknown> = { ...baseValue };
      delete noName['message_template_name'];
      const events = parseWebhookPayload(createStatusPayload(noName), { logger });
      expect(events).toHaveLength(0);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('missing required identity'),
      );
    });

    it('should log-and-skip when message_template_language is missing', () => {
      const logger = { warn: vi.fn(), debug: vi.fn(), info: vi.fn(), error: vi.fn() };
      const noLang: Record<string, unknown> = { ...baseValue };
      delete noLang['message_template_language'];
      const events = parseWebhookPayload(createStatusPayload(noLang), { logger });
      expect(events).toHaveLength(0);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('missing required identity'),
      );
    });

    it('should log-and-skip when event field is missing', () => {
      const logger = { warn: vi.fn(), debug: vi.fn(), info: vi.fn(), error: vi.fn() };
      const noEvent: Record<string, unknown> = { ...baseValue };
      delete noEvent['event'];
      const events = parseWebhookPayload(createStatusPayload(noEvent), { logger });
      expect(events).toHaveLength(0);
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('missing event'));
    });

    it('should log-and-skip when entry.time is missing', () => {
      const logger = { warn: vi.fn(), debug: vi.fn(), info: vi.fn(), error: vi.fn() };
      // Build a payload without `time` on the entry to simulate missing entry.time.
      const payload: WebhookPayload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'WABA_001',
            changes: [{ field: 'message_template_status_update', value: baseValue as never }],
          },
        ],
      };
      const events = parseWebhookPayload(payload, { logger });
      expect(events).toHaveLength(0);
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('missing entry.time'));
    });

    it('should log-and-skip when change.value is null (FR-009)', () => {
      const logger = { warn: vi.fn(), debug: vi.fn(), info: vi.fn(), error: vi.fn() };
      const events = parseWebhookPayload(
        createStatusPayload(null as unknown as Record<string, unknown>),
        { logger },
      );
      expect(events).toHaveLength(0);
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('non-object change.value'));
    });

    it('should log-and-skip when change.value is an array (FR-009)', () => {
      const logger = { warn: vi.fn(), debug: vi.fn(), info: vi.fn(), error: vi.fn() };
      const events = parseWebhookPayload(
        createStatusPayload([] as unknown as Record<string, unknown>),
        { logger },
      );
      expect(events).toHaveLength(0);
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('non-object change.value'));
    });
  });

  describe('message_template_quality_update', () => {
    const createQualityPayload = (v: Record<string, unknown>, t?: number) =>
      createTemplatePayload('message_template_quality_update', v, t);

    const baseValue = {
      new_quality_score: 'GREEN',
      previous_quality_score: 'GREEN',
      message_template_id: 'tmpl-456',
      message_template_name: 'promo_template',
      message_template_language: 'es_MX',
    };

    it('should parse a GREEN→YELLOW quality event', () => {
      const events = parseWebhookPayload(
        createQualityPayload({
          ...baseValue,
          new_quality_score: 'YELLOW',
          previous_quality_score: 'GREEN',
        }),
      );
      expect(events).toHaveLength(1);
      const e = events[0] as TemplateQualityEvent;
      expect(e.type).toBe('template_quality');
      expect(e.metadata.businessAccountId).toBe('WABA_001');
      expect(e.templateId).toBe('tmpl-456');
      expect(e.templateName).toBe('promo_template');
      expect(e.language).toBe('es_MX');
      expect(e.newScore).toBe('YELLOW');
      expect(e.previousScore).toBe('GREEN');
      expect(e.timestamp).toEqual(new Date(1700000000 * 1000));
    });

    it('should parse a YELLOW→RED quality event', () => {
      const events = parseWebhookPayload(
        createQualityPayload({
          ...baseValue,
          new_quality_score: 'RED',
          previous_quality_score: 'YELLOW',
        }),
      );
      const e = events[0] as TemplateQualityEvent;
      expect(e.newScore).toBe('RED');
      expect(e.previousScore).toBe('YELLOW');
    });

    it('should parse a RED→GREEN quality event', () => {
      const events = parseWebhookPayload(
        createQualityPayload({
          ...baseValue,
          new_quality_score: 'GREEN',
          previous_quality_score: 'RED',
        }),
      );
      const e = events[0] as TemplateQualityEvent;
      expect(e.newScore).toBe('GREEN');
      expect(e.previousScore).toBe('RED');
    });

    it('should set previousScore to undefined when absent (first rating)', () => {
      const noprev: Record<string, unknown> = { ...baseValue };
      delete noprev['previous_quality_score'];
      const events = parseWebhookPayload(createQualityPayload(noprev));
      const e = events[0] as TemplateQualityEvent;
      expect(e.previousScore).toBeUndefined();
    });

    it('should preserve an unknown quality score string verbatim', () => {
      const events = parseWebhookPayload(
        createQualityPayload({ ...baseValue, new_quality_score: 'FUTURE_SCORE' }),
      );
      expect((events[0] as TemplateQualityEvent).newScore).toBe('FUTURE_SCORE');
    });

    it('should coerce numeric message_template_id to string', () => {
      const events = parseWebhookPayload(
        createQualityPayload({ ...baseValue, message_template_id: 111222333 }),
      );
      expect((events[0] as TemplateQualityEvent).templateId).toBe('111222333');
    });

    it('should log-and-skip on missing required identity', () => {
      const logger = { warn: vi.fn(), debug: vi.fn(), info: vi.fn(), error: vi.fn() };
      const noId: Record<string, unknown> = { ...baseValue };
      delete noId['message_template_id'];
      const events = parseWebhookPayload(createQualityPayload(noId), { logger });
      expect(events).toHaveLength(0);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('missing required identity'),
      );
    });

    it('should log-and-skip when new_quality_score is missing', () => {
      const logger = { warn: vi.fn(), debug: vi.fn(), info: vi.fn(), error: vi.fn() };
      const noScore: Record<string, unknown> = { ...baseValue };
      delete noScore['new_quality_score'];
      const events = parseWebhookPayload(createQualityPayload(noScore), { logger });
      expect(events).toHaveLength(0);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('missing new_quality_score'),
      );
    });

    it('should log-and-skip when change.value is null (FR-009)', () => {
      const logger = { warn: vi.fn(), debug: vi.fn(), info: vi.fn(), error: vi.fn() };
      const events = parseWebhookPayload(
        createQualityPayload(null as unknown as Record<string, unknown>),
        { logger },
      );
      expect(events).toHaveLength(0);
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('non-object change.value'));
    });

    it('should log-and-skip when change.value is an array (FR-009)', () => {
      const logger = { warn: vi.fn(), debug: vi.fn(), info: vi.fn(), error: vi.fn() };
      const events = parseWebhookPayload(
        createQualityPayload([] as unknown as Record<string, unknown>),
        { logger },
      );
      expect(events).toHaveLength(0);
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('non-object change.value'));
    });
  });

  describe('mixed-batch routing (US3)', () => {
    it('should route a batch containing messages + template_status + template_quality + unknown field', () => {
      const logger = { debug: vi.fn(), warn: vi.fn(), info: vi.fn(), error: vi.fn() };
      const payload: WebhookPayload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'WABA_001',
            time: 1700000000,
            changes: [
              {
                field: 'messages',
                value: {
                  messaging_product: 'whatsapp',
                  metadata: { display_phone_number: '15551234567', phone_number_id: '123456' },
                  contacts: [{ profile: { name: 'Alice' }, wa_id: '15559876543' }],
                  messages: [
                    {
                      from: '15559876543',
                      id: 'wamid.msg001',
                      timestamp: '1700000000',
                      type: 'text',
                      text: { body: 'Hi' },
                    },
                  ],
                } as never,
              },
              {
                field: 'message_template_status_update',
                value: {
                  event: 'APPROVED',
                  message_template_id: 'tmpl-001',
                  message_template_name: 'order_confirm',
                  message_template_language: 'en_US',
                } as never,
              },
              {
                field: 'message_template_quality_update',
                value: {
                  new_quality_score: 'YELLOW',
                  previous_quality_score: 'GREEN',
                  message_template_id: 'tmpl-001',
                  message_template_name: 'order_confirm',
                  message_template_language: 'en_US',
                } as never,
              },
              {
                field: 'template_category_update',
                value: {} as never,
              },
            ],
          },
        ],
      };
      const events = parseWebhookPayload(payload, { logger });
      expect(events).toHaveLength(3);
      expect(events[0]!.type).toBe('message');
      expect(events[1]!.type).toBe('template_status');
      expect(events[2]!.type).toBe('template_quality');
      expect(logger.debug).toHaveBeenCalledTimes(1);
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('unrecognized change.field'),
      );
    });

    it('should deliver multiple template_status events in payload order (ordering guarantee)', () => {
      const payload: WebhookPayload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'WABA_001',
            time: 1700000000,
            changes: [
              {
                field: 'message_template_status_update',
                value: {
                  event: 'APPROVED',
                  message_template_id: 'tmpl-A',
                  message_template_name: 'template_a',
                  message_template_language: 'en_US',
                } as never,
              },
            ],
          },
          {
            id: 'WABA_001',
            time: 1700000001,
            changes: [
              {
                field: 'message_template_quality_update',
                value: {
                  new_quality_score: 'RED',
                  previous_quality_score: 'YELLOW',
                  message_template_id: 'tmpl-B',
                  message_template_name: 'template_b',
                  message_template_language: 'es_MX',
                } as never,
              },
              {
                field: 'message_template_status_update',
                value: {
                  event: 'REJECTED',
                  message_template_id: 'tmpl-C',
                  message_template_name: 'template_c',
                  message_template_language: 'fr_FR',
                  reason: 'INVALID_FORMAT',
                } as never,
              },
            ],
          },
        ],
      };
      const events = parseWebhookPayload(payload);
      expect(events).toHaveLength(3);
      expect(events[0]!.type).toBe('template_status');
      expect((events[0] as TemplateStatusEvent).templateId).toBe('tmpl-A');
      expect(events[1]!.type).toBe('template_quality');
      expect((events[1] as TemplateQualityEvent).templateId).toBe('tmpl-B');
      expect(events[2]!.type).toBe('template_status');
      expect((events[2] as TemplateStatusEvent).templateId).toBe('tmpl-C');
      expect((events[2] as TemplateStatusEvent).reason).toBe('INVALID_FORMAT');
    });
  });

  describe('unknown change.field (default branch)', () => {
    it('should log at debug and produce zero events for an unknown field', () => {
      const logger = { debug: vi.fn(), warn: vi.fn(), info: vi.fn(), error: vi.fn() };
      const payload: WebhookPayload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'WABA_ID',
            time: 1700000000,
            changes: [
              {
                field: 'template_category_update',
                value: {
                  messaging_product: 'whatsapp',
                  metadata: { display_phone_number: '1555', phone_number_id: '123' },
                } as Record<string, unknown> as never,
              },
            ],
          },
        ],
      };
      const events = parseWebhookPayload(payload, { logger });
      expect(events).toHaveLength(0);
      expect(logger.debug).toHaveBeenCalledTimes(1);
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('unrecognized change.field'),
      );
    });
  });
});
