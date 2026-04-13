import { describe, it, expect, vi } from 'vitest';
import { createHmac } from 'node:crypto';
import { createNextRouteHandler } from '../../../src/webhooks/middleware/next.js';

const APP_SECRET = 'test_secret';
const VERIFY_TOKEN = 'test_verify';
const CONFIG = { appSecret: APP_SECRET, verifyToken: VERIFY_TOKEN };

function signBody(body: string): string {
  return `sha256=${createHmac('sha256', APP_SECRET).update(body).digest('hex')}`;
}

describe('createNextRouteHandler', () => {
  describe('GET handler', () => {
    it('should return challenge on valid verification', async () => {
      const { GET } = createNextRouteHandler(CONFIG, {});

      const url = `https://example.com/api/webhook?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=test_challenge`;
      const request = new Request(url, { method: 'GET' });

      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('should return challenge body text', async () => {
      const { GET } = createNextRouteHandler(CONFIG, {});

      const url = `https://example.com/api/webhook?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=my_challenge`;
      const request = new Request(url, { method: 'GET' });

      const response = await GET(request);
      const text = await response.text();
      expect(text).toBe('my_challenge');
    });

    it('should return 403 on invalid verification', async () => {
      const { GET } = createNextRouteHandler(CONFIG, {});

      const url = `https://example.com/api/webhook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=test`;
      const request = new Request(url, { method: 'GET' });

      const response = await GET(request);
      expect(response.status).toBe(403);
    });

    it('should invoke onInternalError and return 500 when GET throws a non-verification error', async () => {
      const onInternalError = vi.fn();
      const { GET } = createNextRouteHandler(CONFIG, {}, { onInternalError });

      // Fake a Request whose `url` getter throws to simulate a framework-side
      // malformed-URL edge case that escapes URL parsing in the handler.
      const request = {
        get url(): string {
          throw new TypeError('bad URL');
        },
        headers: new Headers(),
        method: 'GET',
      } as unknown as Request;

      const response = await GET(request);
      expect(response.status).toBe(500);
      expect(onInternalError).toHaveBeenCalledTimes(1);
      expect(onInternalError.mock.calls[0]![0]).toBeInstanceOf(TypeError);
    });
  });

  describe('POST handler', () => {
    it('should process valid webhook and return 200', async () => {
      const onMessage = vi.fn();
      const { POST } = createNextRouteHandler(CONFIG, { onMessage });

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
      const request = new Request('https://example.com/api/webhook', {
        method: 'POST',
        headers: { 'x-hub-signature-256': signBody(bodyStr) },
        body: bodyStr,
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      expect(onMessage).toHaveBeenCalledTimes(1);
    });

    it('should return 403 on invalid signature', async () => {
      const { POST } = createNextRouteHandler(CONFIG, {});

      const bodyStr = '{"object":"whatsapp_business_account","entry":[]}';
      const request = new Request('https://example.com/api/webhook', {
        method: 'POST',
        headers: { 'x-hub-signature-256': 'sha256=invalid' },
        body: bodyStr,
      });

      const response = await POST(request);
      expect(response.status).toBe(403);
    });

    it('should return 403 when signature header is missing', async () => {
      const { POST } = createNextRouteHandler(CONFIG, {});

      const bodyStr = '{"object":"whatsapp_business_account","entry":[]}';
      const request = new Request('https://example.com/api/webhook', {
        method: 'POST',
        body: bodyStr,
      });

      const response = await POST(request);
      expect(response.status).toBe(403);
    });

    it('should return 400 on invalid JSON body', async () => {
      const { POST } = createNextRouteHandler(CONFIG, {});

      const rawBody = 'not json{{{';
      const request = new Request('https://example.com/api/webhook', {
        method: 'POST',
        headers: { 'x-hub-signature-256': signBody(rawBody) },
        body: rawBody,
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should return 500 when callback throws', async () => {
      const onMessage = vi.fn().mockRejectedValue(new Error('fail'));
      const { POST } = createNextRouteHandler(CONFIG, { onMessage });

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
      const request = new Request('https://example.com/api/webhook', {
        method: 'POST',
        headers: { 'x-hub-signature-256': signBody(bodyStr) },
        body: bodyStr,
      });

      const response = await POST(request);
      expect(response.status).toBe(500);
      const text = await response.text();
      expect(text).toBe('Internal Server Error');
    });

    it('should surface callback errors to onInternalError before returning 500', async () => {
      const callbackError = new Error('callback boom');
      const onMessage = vi.fn().mockRejectedValue(callbackError);
      const onInternalError = vi.fn();
      const { POST } = createNextRouteHandler(
        CONFIG,
        { onMessage },
        { onInternalError },
      );

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
      const request = new Request('https://example.com/api/webhook', {
        method: 'POST',
        headers: { 'x-hub-signature-256': signBody(bodyStr) },
        body: bodyStr,
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      expect(onInternalError).toHaveBeenCalledTimes(1);
      expect(onInternalError).toHaveBeenCalledWith(callbackError, request);
    });

    it('should still return 500 if onInternalError itself throws', async () => {
      const onMessage = vi.fn().mockRejectedValue(new Error('callback boom'));
      const onInternalError = vi.fn().mockRejectedValue(new Error('observer boom'));
      const { POST } = createNextRouteHandler(
        CONFIG,
        { onMessage },
        { onInternalError },
      );

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
      const request = new Request('https://example.com/api/webhook', {
        method: 'POST',
        headers: { 'x-hub-signature-256': signBody(bodyStr) },
        body: bodyStr,
      });

      const response = await POST(request);
      expect(response.status).toBe(500);
    });
  });
});
