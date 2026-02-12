import { createHmac, timingSafeEqual } from 'node:crypto';
import { WebhookVerificationError } from '../errors/errors.js';

/**
 * Verify a webhook subscription challenge (GET request).
 *
 * @param params - Query parameters from the GET request
 * @param expectedToken - The verify token configured in your app
 * @returns The challenge string that must be returned in the response body
 * @throws WebhookVerificationError if mode is not 'subscribe' or token doesn't match
 */
export function verifyWebhook(
  params: Record<string, string | string[] | undefined>,
  expectedToken: string,
): string {
  const mode = extractParam(params, 'hub.mode');
  const token = extractParam(params, 'hub.verify_token');
  const challenge = extractParam(params, 'hub.challenge');

  if (mode !== 'subscribe') {
    throw new WebhookVerificationError(
      `Invalid hub.mode: expected "subscribe", got "${String(mode)}"`,
    );
  }

  if (token !== expectedToken) {
    throw new WebhookVerificationError('Verify token mismatch');
  }

  if (!challenge) {
    throw new WebhookVerificationError('Missing hub.challenge parameter');
  }

  return challenge;
}

/**
 * Verify the HMAC SHA-256 signature of a webhook POST body.
 *
 * @param rawBody - The raw request body (Buffer or string)
 * @param signature - The X-Hub-Signature-256 header value (format: "sha256=<hex>")
 * @param appSecret - Your Meta app secret
 * @returns true if signature is valid
 * @throws WebhookVerificationError if signature is missing, malformed, or invalid
 */
export function verifySignature(
  rawBody: Buffer | string,
  signature: string | undefined,
  appSecret: string,
): boolean {
  if (!signature) {
    throw new WebhookVerificationError('Missing X-Hub-Signature-256 header');
  }

  if (!signature.startsWith('sha256=')) {
    throw new WebhookVerificationError(
      'Invalid signature format: expected "sha256=<hex>"',
    );
  }

  const expectedHex = signature.slice('sha256='.length);

  // Validate hex format explicitly — Buffer.from(str, 'hex') silently ignores non-hex chars
  if (!/^[0-9a-f]{64}$/i.test(expectedHex)) {
    throw new WebhookVerificationError('Webhook signature verification failed');
  }

  const hmac = createHmac('sha256', appSecret);
  hmac.update(rawBody);
  const computedHex = hmac.digest('hex');

  const expectedBuffer = Buffer.from(expectedHex, 'hex');
  const computedBuffer = Buffer.from(computedHex, 'hex');

  if (!timingSafeEqual(expectedBuffer, computedBuffer)) {
    throw new WebhookVerificationError('Webhook signature verification failed');
  }

  return true;
}

/** Extract a single value from a query parameter (handles arrays). */
function extractParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = params[key];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}
