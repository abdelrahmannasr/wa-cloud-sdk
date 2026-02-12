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
    it('should return challenge on valid verification', () => {
      const { GET } = createNextRouteHandler(CONFIG, {});

      const url = `https://example.com/api/webhook?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=test_challenge`;
      const request = new Request(url, { method: 'GET' });

      const response = GET(request);

      expect(response.status).toBe(200);
    });

    it('should return challenge body text', async () => {
      const { GET } = createNextRouteHandler(CONFIG, {});

      const url = `https://example.com/api/webhook?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=my_challenge`;
      const request = new Request(url, { method: 'GET' });

      const response = GET(request);
      const text = await response.text();
      expect(text).toBe('my_challenge');
    });

    it('should return 403 on invalid verification', () => {
      const { GET } = createNextRouteHandler(CONFIG, {});

      const url = `https://example.com/api/webhook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=test`;
      const request = new Request(url, { method: 'GET' });

      const response = GET(request);
      expect(response.status).toBe(403);
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

    it('should return 400 on invalid JSON body', async () => {
      const { POST } = createNextRouteHandler(CONFIG, {});

      const request = new Request('https://example.com/api/webhook', {
        method: 'POST',
        headers: { 'x-hub-signature-256': 'sha256=abc' },
        body: 'not json{{{',
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should return 500 on callback error', async () => {
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
