import { describe, it, expect, vi } from 'vitest';
import { createHmac } from 'node:crypto';
import { createExpressMiddleware } from '../../../src/webhooks/middleware/express.js';
import type {
  WebhookRequest,
  WebhookResponse,
  WebhookNextFunction,
} from '../../../src/webhooks/types.js';

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
  it('should handle valid GET verification', () => {
    const next: WebhookNextFunction = vi.fn();
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
    const next: WebhookNextFunction = vi.fn();
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
    const next: WebhookNextFunction = vi.fn();
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
                  {
                    from: '15559876543',
                    id: 'wamid.1',
                    timestamp: '1700000000',
                    type: 'text',
                    text: { body: 'Hi' },
                  },
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

    await vi.waitFor(() => {
      expect(res.statusCode).toBe(200);
    });
    expect(onMessage).toHaveBeenCalledTimes(1);
  });

  it('should return 400 when rawBody is absent (operator misconfiguration)', () => {
    const next: WebhookNextFunction = vi.fn();
    const warn = vi.fn();
    const middleware = createExpressMiddleware(
      { ...CONFIG, logger: { debug: vi.fn(), info: vi.fn(), warn, error: vi.fn() } },
      {},
    );

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

    expect(res.statusCode).toBe(400);
    expect(res.body).toContain('Raw body is required');
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('should warn only once per factory when rawBody is repeatedly absent', () => {
    const next: WebhookNextFunction = vi.fn();
    const warn = vi.fn();
    const middleware = createExpressMiddleware(
      { ...CONFIG, logger: { debug: vi.fn(), info: vi.fn(), warn, error: vi.fn() } },
      {},
    );

    const buildReq = (): WebhookRequest => ({
      method: 'POST',
      query: {},
      body: {},
      headers: {},
      // rawBody intentionally omitted
    });

    for (let i = 0; i < 3; i++) {
      const res = createMockRes();
      middleware(buildReq(), res, next);
      expect(res.statusCode).toBe(400);
    }

    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('should return 405 for non-GET/POST methods', () => {
    const next: WebhookNextFunction = vi.fn();
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

  it('should forward callback errors via next()', async () => {
    const next: WebhookNextFunction = vi.fn();
    const callbackError = new Error('callback fail');
    const onMessage = vi.fn().mockRejectedValue(callbackError);
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
                  {
                    from: '15559876543',
                    id: 'wamid.1',
                    timestamp: '1700000000',
                    type: 'text',
                    text: { body: 'Hi' },
                  },
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

    await vi.waitFor(() => {
      expect(next).toHaveBeenCalledWith(callbackError);
    });
  });

  it('should return 403 when signature header is missing', async () => {
    const next: WebhookNextFunction = vi.fn();
    const middleware = createExpressMiddleware(CONFIG, {});

    const payload = {
      object: 'whatsapp_business_account',
      entry: [],
    };

    const req: WebhookRequest = {
      method: 'POST',
      query: {},
      body: payload,
      headers: {},
      rawBody: JSON.stringify(payload),
    };
    const res = createMockRes();

    middleware(req, res, next);

    await vi.waitFor(() => {
      expect(res.statusCode).toBe(403);
    });
  });
});
