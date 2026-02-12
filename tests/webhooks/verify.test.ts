import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';
import { verifyWebhook, verifySignature } from '../../src/webhooks/verify.js';
import { WebhookVerificationError } from '../../src/errors/errors.js';

const APP_SECRET = 'test_app_secret_123';
const VERIFY_TOKEN = 'my_verify_token';

function computeSignature(body: string, secret: string): string {
  const hmac = createHmac('sha256', secret);
  hmac.update(body);
  return `sha256=${hmac.digest('hex')}`;
}

describe('verifyWebhook', () => {
  it('should return challenge when mode is subscribe and token matches', () => {
    const params = {
      'hub.mode': 'subscribe',
      'hub.verify_token': VERIFY_TOKEN,
      'hub.challenge': 'challenge_value_123',
    };

    expect(verifyWebhook(params, VERIFY_TOKEN)).toBe('challenge_value_123');
  });

  it('should throw when mode is not subscribe', () => {
    const params = {
      'hub.mode': 'unsubscribe',
      'hub.verify_token': VERIFY_TOKEN,
      'hub.challenge': 'challenge_value',
    };

    expect(() => verifyWebhook(params, VERIFY_TOKEN)).toThrow(WebhookVerificationError);
    expect(() => verifyWebhook(params, VERIFY_TOKEN)).toThrow('Invalid hub.mode');
  });

  it('should throw when verify_token does not match', () => {
    const params = {
      'hub.mode': 'subscribe',
      'hub.verify_token': 'wrong_token',
      'hub.challenge': 'challenge_value',
    };

    expect(() => verifyWebhook(params, VERIFY_TOKEN)).toThrow(WebhookVerificationError);
    expect(() => verifyWebhook(params, VERIFY_TOKEN)).toThrow('Verify token mismatch');
  });

  it('should throw when challenge is missing', () => {
    const params = {
      'hub.mode': 'subscribe',
      'hub.verify_token': VERIFY_TOKEN,
    };

    expect(() => verifyWebhook(params, VERIFY_TOKEN)).toThrow(WebhookVerificationError);
    expect(() => verifyWebhook(params, VERIFY_TOKEN)).toThrow('Missing hub.challenge');
  });

  it('should handle array-valued query params (take first value)', () => {
    const params = {
      'hub.mode': ['subscribe', 'other'],
      'hub.verify_token': [VERIFY_TOKEN],
      'hub.challenge': ['challenge_abc'],
    };

    expect(verifyWebhook(params, VERIFY_TOKEN)).toBe('challenge_abc');
  });
});

describe('verifySignature', () => {
  const body = '{"object":"whatsapp_business_account","entry":[]}';
  const validSignature = computeSignature(body, APP_SECRET);

  it('should return true for a valid signature', () => {
    expect(verifySignature(body, validSignature, APP_SECRET)).toBe(true);
  });

  it('should throw for an invalid signature', () => {
    const invalidSignature = 'sha256=' + '0'.repeat(64);

    expect(() => verifySignature(body, invalidSignature, APP_SECRET)).toThrow(
      WebhookVerificationError,
    );
    expect(() => verifySignature(body, invalidSignature, APP_SECRET)).toThrow(
      'Webhook signature verification failed',
    );
  });

  it('should throw when signature header is missing', () => {
    expect(() => verifySignature(body, undefined, APP_SECRET)).toThrow(
      WebhookVerificationError,
    );
    expect(() => verifySignature(body, undefined, APP_SECRET)).toThrow(
      'Missing X-Hub-Signature-256 header',
    );
  });

  it('should throw when signature does not start with sha256=', () => {
    expect(() => verifySignature(body, 'md5=abc123', APP_SECRET)).toThrow(
      WebhookVerificationError,
    );
    expect(() => verifySignature(body, 'md5=abc123', APP_SECRET)).toThrow(
      'Invalid signature format',
    );
  });

  it('should handle string body', () => {
    const stringBody = '{"test":true}';
    const sig = computeSignature(stringBody, APP_SECRET);
    expect(verifySignature(stringBody, sig, APP_SECRET)).toBe(true);
  });

  it('should handle Buffer body', () => {
    const bufferBody = Buffer.from(body, 'utf-8');
    expect(verifySignature(bufferBody, validSignature, APP_SECRET)).toBe(true);
  });

  it('should throw for truncated signature hex', () => {
    const truncated = 'sha256=abcdef';
    expect(() => verifySignature(body, truncated, APP_SECRET)).toThrow(
      WebhookVerificationError,
    );
    expect(() => verifySignature(body, truncated, APP_SECRET)).toThrow(
      'Webhook signature verification failed',
    );
  });
});
