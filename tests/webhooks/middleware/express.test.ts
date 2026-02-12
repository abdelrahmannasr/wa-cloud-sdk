import { describe, it, expect, vi } from 'vitest';
import { createHmac } from 'node:crypto';
import { createExpressMiddleware } from '../../../src/webhooks/middleware/express.js';
import type { WebhookRequest, WebhookResponse, WebhookNextFunction } from '../../../src/webhooks/types.js';

const APP_SECRET = 'test_secret';
const VERIFY_TOKEN = 'test_verify';
const CONFIG = { appSecret: APP_SECRET, verifyToken: VERIFY_TOKEN };

function signBody(body: string): string {
  return `sha256=${createHmac('sha256', APP_SECRET).update(body).digest('hex')}`;
}

function createMockRes(): WebhookResponse & { statusCode: number; body: unknown } {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    send(body: unknown) {
      res.body = body;
    },
  };
  return res;
}

describe('createExpressMiddleware', () => {
  const next: WebhookNextFunction = vi.fn();

  it('should handle valid GET verification', () => {
    const middleware = createExpressMiddleware(CONFIG, {});

    const req: WebhookRequest = {
      method: 'GET',
      query: {
        'hub.mode': 'subscribe',
        'hub.verify_token': VERIFY_TOKEN,
        'hub.challenge': 'test_challenge',
      },
      body: undefined,
      headers: {},
    };
    const res = createMockRes();

    middleware(req, res, next);

    expect(res.statusCode).toBe(200);
    expect(res.body).toBe('test_challenge');
  });

  it('should return 403 on invalid GET verification', () => {
    const middleware = createExpressMiddleware(CONFIG, {});

    const req: WebhookRequest = {
      method: 'GET',
      query: {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'wrong_token',
        'hub.challenge': 'challenge',
      },
      body: undefined,
      headers: {},
    };
    const res = createMockRes();

    middleware(req, res, next);

    expect(res.statusCode).toBe(403);
  });

  it('should process valid POST webhook', async () => {
    const onMessage = vi.fn();
    const middleware = createExpressMiddleware(CONFIG, { onMessage });

    const payload = {
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
                  { from: '15559876543', id: 'wamid.1', timestamp: '1700000000', type: 'text', text: { body: 'Hi' } },
                ],
              },
              field: 'messages',
            },
          ],
        },
      ],
    };

    const bodyStr = JSON.stringify(payload);
    const req: WebhookRequest = {
      method: 'POST',
      query: {},
      body: payload,
      headers: { 'x-hub-signature-256': signBody(bodyStr) },
      rawBody: bodyStr,
    };
    const res = createMockRes();

    middleware(req, res, next);

    // Wait for async handler
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(res.statusCode).toBe(200);
    expect(onMessage).toHaveBeenCalledTimes(1);
  });

  it('should use JSON.stringify fallback when rawBody is absent', async () => {
    const middleware = createExpressMiddleware(CONFIG, {});

    const payload = {
      object: 'whatsapp_business_account',
      entry: [],
    };

    const bodyStr = JSON.stringify(payload);
    const req: WebhookRequest = {
      method: 'POST',
      query: {},
      body: payload,
      headers: { 'x-hub-signature-256': signBody(bodyStr) },
      // rawBody intentionally omitted
    };
    const res = createMockRes();

    middleware(req, res, next);
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(res.statusCode).toBe(200);
  });

  it('should return 405 for non-GET/POST methods', () => {
    const middleware = createExpressMiddleware(CONFIG, {});

    const req: WebhookRequest = {
      method: 'PUT',
      query: {},
      body: undefined,
      headers: {},
    };
    const res = createMockRes();

    middleware(req, res, next);

    expect(res.statusCode).toBe(405);
  });

  it('should return 500 on unhandled callback error', async () => {
    const onMessage = vi.fn().mockRejectedValue(new Error('fail'));
    const middleware = createExpressMiddleware(CONFIG, { onMessage });

    const payload = {
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
                  { from: '15559876543', id: 'wamid.1', timestamp: '1700000000', type: 'text', text: { body: 'Hi' } },
                ],
              },
              field: 'messages',
            },
          ],
        },
      ],
    };

    const bodyStr = JSON.stringify(payload);
    const req: WebhookRequest = {
      method: 'POST',
      query: {},
      body: payload,
      headers: { 'x-hub-signature-256': signBody(bodyStr) },
      rawBody: bodyStr,
    };
    const res = createMockRes();

    middleware(req, res, next);
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(res.statusCode).toBe(500);
  });
});
