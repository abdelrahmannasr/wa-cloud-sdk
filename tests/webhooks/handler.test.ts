import { describe, it, expect, vi } from 'vitest';
import { createHmac } from 'node:crypto';
import { createWebhookHandler } from '../../src/webhooks/handler.js';
import type {
  MessageEvent,
  StatusEvent,
  ErrorEvent,
  FlowCompletionEvent,
  OrderEvent,
} from '../../src/webhooks/types.js';

const APP_SECRET = 'test_secret';
const VERIFY_TOKEN = 'test_verify';

function signBody(body: string): string {
  return `sha256=${createHmac('sha256', APP_SECRET).update(body).digest('hex')}`;
}

function createTextPayloadBody(): string {
  return JSON.stringify({
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'WABA_ID',
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: { display_phone_number: '15551234567', phone_number_id: '123456' },
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
            },
            field: 'messages',
          },
        ],
      },
    ],
  });
}

describe('createWebhookHandler', () => {
  const config = { appSecret: APP_SECRET, verifyToken: VERIFY_TOKEN };

  describe('handleGet', () => {
    it('should return 200 with challenge on valid verification', () => {
      const handler = createWebhookHandler(config, {});

      const result = handler.handleGet({
        'hub.mode': 'subscribe',
        'hub.verify_token': VERIFY_TOKEN,
        'hub.challenge': 'test_challenge',
      });

      expect(result.statusCode).toBe(200);
      expect(result.body).toBe('test_challenge');
    });

    it('should return 403 on invalid verification', () => {
      const handler = createWebhookHandler(config, {});

      const result = handler.handleGet({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'wrong_token',
        'hub.challenge': 'test_challenge',
      });

      expect(result.statusCode).toBe(403);
      expect(result.body).toBe('Forbidden');
    });
  });

  describe('handlePost', () => {
    // Uses 'sha256=invalid' which is not 64 hex chars — exercises hex format
    // validation in verifySignature, not the HMAC comparison path.
    it('should return 403 on invalid signature', async () => {
      const handler = createWebhookHandler(config, {});
      const body = createTextPayloadBody();

      const result = await handler.handlePost(body, 'sha256=invalid');

      expect(result.statusCode).toBe(403);
      expect(result.body).toBe('Invalid signature');
    });

    it('should return 400 on invalid JSON body', async () => {
      const handler = createWebhookHandler(config, {});
      const rawBody = 'not json{{{';

      const result = await handler.handlePost(rawBody, signBody(rawBody));

      expect(result.statusCode).toBe(400);
      expect(result.body).toBe('Invalid JSON');
    });

    it('should log a warning when a signed body fails to parse as JSON', async () => {
      const warn = vi.fn();
      const logger = { debug: vi.fn(), info: vi.fn(), warn, error: vi.fn() };
      const handler = createWebhookHandler({ ...config, logger }, {});
      const rawBody = 'not json{{{';

      const result = await handler.handlePost(rawBody, signBody(rawBody));

      expect(result.statusCode).toBe(400);
      expect(warn).toHaveBeenCalledTimes(1);
      // FR-030: the raw body must not appear in the log message.
      const message = warn.mock.calls[0]![0] as string;
      expect(message).toContain('failed to parse');
      expect(message).not.toContain(rawBody);
    });

    it('should return 400 when a signed Buffer body is not valid UTF-8', async () => {
      // Standalone 0xC3 byte — valid UTF-8 start, no continuation → invalid.
      const invalidUtf8 = Buffer.from([0xc3, 0x28, 0x7b, 0x7d]);
      const warn = vi.fn();
      const logger = { debug: vi.fn(), info: vi.fn(), warn, error: vi.fn() };
      const handler = createWebhookHandler({ ...config, logger }, {});

      const signature = `sha256=${createHmac('sha256', APP_SECRET).update(invalidUtf8).digest('hex')}`;
      const result = await handler.handlePost(invalidUtf8, signature);

      expect(result.statusCode).toBe(400);
      expect(result.body).toContain('UTF-8');
      expect(warn).toHaveBeenCalledTimes(1);
    });

    it('should log a warning when a signed body has unexpected structure', async () => {
      const warn = vi.fn();
      const logger = { debug: vi.fn(), info: vi.fn(), warn, error: vi.fn() };
      const handler = createWebhookHandler({ ...config, logger }, {});
      const rawBody = JSON.stringify({ hello: 'world' });

      const result = await handler.handlePost(rawBody, signBody(rawBody));

      expect(result.statusCode).toBe(400);
      expect(warn).toHaveBeenCalledTimes(1);
      const message = warn.mock.calls[0]![0] as string;
      expect(message).toContain('unexpected structure');
      expect(message).not.toContain('world');
    });

    it('should call onMessage callback for message events', async () => {
      const onMessage = vi.fn();
      const handler = createWebhookHandler(config, { onMessage });

      const body = createTextPayloadBody();
      const signature = signBody(body);

      const result = await handler.handlePost(body, signature);

      expect(result.statusCode).toBe(200);
      expect(onMessage).toHaveBeenCalledTimes(1);
      const event = onMessage.mock.calls[0]![0] as MessageEvent;
      expect(event.type).toBe('message');
      expect(event.message.text?.body).toBe('Hello');
    });

    it('should call onStatus callback for status events', async () => {
      const onStatus = vi.fn();
      const handler = createWebhookHandler(config, { onStatus });

      const body = JSON.stringify({
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'WABA_ID',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: { display_phone_number: '15551234567', phone_number_id: '123456' },
                  statuses: [
                    {
                      id: 'wamid.s1',
                      status: 'delivered',
                      timestamp: '1700000000',
                      recipient_id: '15559876543',
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      });

      await handler.handlePost(body, signBody(body));

      expect(onStatus).toHaveBeenCalledTimes(1);
      const event = onStatus.mock.calls[0]![0] as StatusEvent;
      expect(event.status.status).toBe('delivered');
    });

    it('should call onError callback for error events', async () => {
      const onError = vi.fn();
      const handler = createWebhookHandler(config, { onError });

      const body = JSON.stringify({
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'WABA_ID',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: { display_phone_number: '15551234567', phone_number_id: '123456' },
                  errors: [{ code: 130429, title: 'Rate limit hit' }],
                },
                field: 'messages',
              },
            ],
          },
        ],
      });

      await handler.handlePost(body, signBody(body));

      expect(onError).toHaveBeenCalledTimes(1);
      const event = onError.mock.calls[0]![0] as ErrorEvent;
      expect(event.error.code).toBe(130429);
    });

    it('should return 200 when no callbacks are defined', async () => {
      const handler = createWebhookHandler(config, {});
      const body = createTextPayloadBody();

      const result = await handler.handlePost(body, signBody(body));
      expect(result.statusCode).toBe(200);
    });

    it('should await async callbacks', async () => {
      const order: string[] = [];
      const onMessage = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        order.push('message');
      });

      const handler = createWebhookHandler(config, { onMessage });
      const body = createTextPayloadBody();

      await handler.handlePost(body, signBody(body));

      expect(order).toEqual(['message']);
    });

    it('should propagate callback errors', async () => {
      const onMessage = vi.fn().mockRejectedValue(new Error('DB write failed'));
      const handler = createWebhookHandler(config, { onMessage });
      const body = createTextPayloadBody();

      await expect(handler.handlePost(body, signBody(body))).rejects.toThrow('DB write failed');
    });

    it('should return 400 on valid JSON that is not a webhook payload', async () => {
      const handler = createWebhookHandler(config, {});
      const rawBody = JSON.stringify({ foo: 'bar' });

      const result = await handler.handlePost(rawBody, signBody(rawBody));

      expect(result.statusCode).toBe(400);
      expect(result.body).toBe('Invalid webhook payload structure');
    });
  });

  describe('onFlowCompletion callback', () => {
    function createFlowCompletionBody(): string {
      return JSON.stringify({
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'WABA_ID',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: { display_phone_number: '15551234567', phone_number_id: '123456' },
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
                          response_json: JSON.stringify({ screen: 'SUCCESS', name: 'Alice' }),
                        },
                      },
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      });
    }

    it('should route flow completion to onFlowCompletion callback', async () => {
      const onFlowCompletion = vi.fn();
      const handler = createWebhookHandler(config, { onFlowCompletion });
      const body = createFlowCompletionBody();

      const result = await handler.handlePost(body, signBody(body));

      expect(result.statusCode).toBe(200);
      expect(onFlowCompletion).toHaveBeenCalledTimes(1);
      const event = onFlowCompletion.mock.calls[0]![0] as FlowCompletionEvent;
      expect(event.type).toBe('flow_completion');
      expect(event.messageId).toBe('wamid.flow1');
      expect(event.response).toStrictEqual({ screen: 'SUCCESS', name: 'Alice' });
    });

    it('should not invoke onMessage for flow completion payload', async () => {
      const onMessage = vi.fn();
      const onFlowCompletion = vi.fn();
      const handler = createWebhookHandler(config, { onMessage, onFlowCompletion });
      const body = createFlowCompletionBody();

      await handler.handlePost(body, signBody(body));

      expect(onFlowCompletion).toHaveBeenCalledTimes(1);
      expect(onMessage).not.toHaveBeenCalled();
    });

    it('should invoke both onMessage and onFlowCompletion for mixed payload', async () => {
      const onMessage = vi.fn();
      const onFlowCompletion = vi.fn();
      const handler = createWebhookHandler(config, { onMessage, onFlowCompletion });

      const body = JSON.stringify({
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'WABA_ID',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: { display_phone_number: '15551234567', phone_number_id: '123456' },
                  contacts: [{ profile: { name: 'Alice' }, wa_id: '15559876543' }],
                  messages: [
                    {
                      from: '15559876543',
                      id: 'wamid.text1',
                      timestamp: '1712620800',
                      type: 'text',
                      text: { body: 'Hello' },
                    },
                    {
                      from: '15559876543',
                      id: 'wamid.flow1',
                      timestamp: '1712620801',
                      type: 'interactive',
                      interactive: {
                        type: 'nfm_reply',
                        nfm_reply: {
                          name: 'flow',
                          body: 'Sent',
                          response_json: '{"done":true}',
                        },
                      },
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      });

      await handler.handlePost(body, signBody(body));

      expect(onMessage).toHaveBeenCalledTimes(1);
      expect(onFlowCompletion).toHaveBeenCalledTimes(1);
    });
  });

  describe('onOrder callback', () => {
    function createOrderBody(withText = false): string {
      return JSON.stringify({
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
                            quantity: 2,
                            item_price: 999,
                            currency: 'USD',
                          },
                        ],
                        ...(withText && { text: 'Please rush' }),
                      },
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      });
    }

    it('should invoke onOrder callback once for an order event', async () => {
      const onOrder = vi.fn();
      const handler = createWebhookHandler(config, { onOrder });
      const body = createOrderBody();

      await handler.handlePost(body, signBody(body));

      expect(onOrder).toHaveBeenCalledTimes(1);
      const event = onOrder.mock.calls[0]![0] as OrderEvent;
      expect(event.type).toBe('order');
      expect(event.messageId).toBe('wamid.order001');
      expect(event.catalogId).toBe('cat-001');
      expect(event.items).toHaveLength(1);
    });

    it('should NOT invoke onMessage for an order event', async () => {
      const onMessage = vi.fn();
      const onOrder = vi.fn();
      const handler = createWebhookHandler(config, { onMessage, onOrder });
      const body = createOrderBody();

      await handler.handlePost(body, signBody(body));

      expect(onOrder).toHaveBeenCalledTimes(1);
      expect(onMessage).not.toHaveBeenCalled();
    });

    it('should not throw when no onOrder callback is registered', async () => {
      const handler = createWebhookHandler(config, {});
      const body = createOrderBody();

      await expect(handler.handlePost(body, signBody(body))).resolves.toMatchObject({
        statusCode: 200,
      });
    });

    it('should await async onOrder callback', async () => {
      let resolved = false;
      const onOrder = vi.fn().mockImplementation(async () => {
        await new Promise<void>((r) => setTimeout(r, 10));
        resolved = true;
      });
      const handler = createWebhookHandler(config, { onOrder });
      const body = createOrderBody();

      await handler.handlePost(body, signBody(body));

      expect(resolved).toBe(true);
    });
  });
});
