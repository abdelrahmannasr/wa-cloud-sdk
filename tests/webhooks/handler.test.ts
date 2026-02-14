import { describe, it, expect, vi } from 'vitest';
import { createHmac } from 'node:crypto';
import { createWebhookHandler } from '../../src/webhooks/handler.js';
import type { MessageEvent, StatusEvent, ErrorEvent } from '../../src/webhooks/types.js';

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
});
