import type { WhatsAppConfig } from '../client/types.js';
import { ValidationError } from '../errors/errors.js';
import { verifyWebhook, verifySignature as verifySignatureUtil } from './verify.js';
import { parseWebhookPayload } from './parser.js';
import { createWebhookHandler } from './handler.js';
import type { WebhookHandler } from './handler.js';
import { createExpressMiddleware as createExpressMiddlewareUtil } from './middleware/express.js';
import { createNextRouteHandler as createNextRouteHandlerUtil } from './middleware/next.js';
import type {
  WebhookPayload,
  WebhookEvent,
  WebhookHandlerCallbacks,
  WebhookRequest,
  WebhookResponse,
  WebhookNextFunction,
} from './types.js';

/**
 * Webhook operations for the WhatsApp Cloud API.
 *
 * Wraps standalone webhook functions with pre-bound configuration,
 * providing methods for webhook verification, payload parsing, and
 * handler/middleware creation.
 *
 * @example
 * ```typescript
 * import { WhatsApp } from '@abdelrahmannasr-wa/cloud-api';
 *
 * const wa = new WhatsApp({
 *   accessToken: 'YOUR_ACCESS_TOKEN',
 *   phoneNumberId: 'YOUR_PHONE_NUMBER_ID',
 *   appSecret: 'YOUR_APP_SECRET',
 *   webhookVerifyToken: 'YOUR_VERIFY_TOKEN',
 * });
 *
 * // Verify a GET subscription request
 * const challenge = wa.webhooks.verify(queryParams);
 *
 * // Verify POST payload signature
 * const valid = wa.webhooks.verifySignature(rawBody, signature);
 *
 * // Parse webhook payload into typed events
 * const events = wa.webhooks.parse(webhookPayload);
 * ```
 */
export class Webhooks {
  private readonly config: WhatsAppConfig;

  /**
   * Creates a new Webhooks instance.
   *
   * @param config - WhatsAppConfig containing appSecret and webhookVerifyToken
   */
  constructor(config: WhatsAppConfig) {
    this.config = config;
  }

  private requireWebhookConfig(): { appSecret: string; verifyToken: string } {
    if (!this.config.appSecret || this.config.appSecret.trim() === '') {
      throw new ValidationError(
        'appSecret is required for webhook handler creation. Provide it in the WhatsApp constructor config.',
        'appSecret',
      );
    }
    if (!this.config.webhookVerifyToken || this.config.webhookVerifyToken.trim() === '') {
      throw new ValidationError(
        'webhookVerifyToken is required for webhook handler creation. Provide it in the WhatsApp constructor config.',
        'webhookVerifyToken',
      );
    }
    return { appSecret: this.config.appSecret, verifyToken: this.config.webhookVerifyToken };
  }

  /**
   * Verify a webhook subscription request (GET endpoint).
   *
   * Validates the hub.mode, hub.verify_token, and hub.challenge parameters
   * from the verification request.
   *
   * @param params - Query parameters from the verification request
   * @returns The hub.challenge value to echo back
   * @throws ValidationError if webhookVerifyToken was not provided in config
   * @throws WebhookVerificationError if verification fails
   *
   * @example
   * ```typescript
   * const challenge = wa.webhooks.verify(req.query);
   * res.status(200).send(challenge);
   * ```
   */
  verify(params: Record<string, string | string[] | undefined>): string {
    if (!this.config.webhookVerifyToken || this.config.webhookVerifyToken.trim() === '') {
      throw new ValidationError(
        'webhookVerifyToken is required for webhook verification. Provide it in the WhatsApp constructor config.',
        'webhookVerifyToken',
      );
    }
    return verifyWebhook(params, this.config.webhookVerifyToken);
  }

  /**
   * Verify the signature of an incoming webhook payload.
   *
   * Validates the X-Hub-Signature-256 header using HMAC SHA-256.
   *
   * @param rawBody - Raw webhook payload (Buffer or string)
   * @param signature - X-Hub-Signature-256 header value
   * @returns true if signature is valid
   * @throws ValidationError if appSecret was not provided in config
   * @throws WebhookVerificationError if signature is invalid
   *
   * @example
   * ```typescript
   * const signature = req.headers['x-hub-signature-256'];
   * const valid = wa.webhooks.verifySignature(req.body, signature);
   * ```
   */
  verifySignature(rawBody: Buffer | string, signature: string | undefined): boolean {
    if (!this.config.appSecret || this.config.appSecret.trim() === '') {
      throw new ValidationError(
        'appSecret is required for webhook signature verification. Provide it in the WhatsApp constructor config.',
        'appSecret',
      );
    }
    return verifySignatureUtil(rawBody, signature, this.config.appSecret);
  }

  /**
   * Parse a webhook payload into typed events.
   *
   * No config required — always available.
   *
   * @param payload - Raw webhook payload
   * @returns Array of typed webhook events
   *
   * @example
   * ```typescript
   * const events = wa.webhooks.parse(req.body);
   * for (const event of events) {
   *   if (event.type === 'message') {
   *     console.log('Received message:', event);
   *   }
   * }
   * ```
   */
  parse(payload: WebhookPayload): WebhookEvent[] {
    return parseWebhookPayload(payload);
  }

  /**
   * Create a webhook handler with typed callbacks.
   *
   * @param callbacks - Event callbacks (onMessage, onStatus, etc.)
   * @returns WebhookHandler instance
   * @throws ValidationError if appSecret or webhookVerifyToken was not provided
   *
   * @example
   * ```typescript
   * const handler = wa.webhooks.createHandler({
   *   onMessage: (message) => {
   *     console.log('Received message:', message);
   *   },
   * });
   *
   * const result = await handler.handlePost(rawBody, signature);
   * ```
   */
  createHandler(callbacks: WebhookHandlerCallbacks): WebhookHandler {
    const { appSecret, verifyToken } = this.requireWebhookConfig();
    return createWebhookHandler({ appSecret, verifyToken }, callbacks);
  }

  /**
   * Create Express middleware for webhook handling.
   *
   * @param callbacks - Event callbacks (onMessage, onStatus, etc.)
   * @returns Express middleware function
   * @throws ValidationError if appSecret or webhookVerifyToken was not provided
   *
   * @example
   * ```typescript
   * import express from 'express';
   *
   * const app = express();
   * const middleware = wa.webhooks.createExpressMiddleware({
   *   onMessage: (message) => {
   *     console.log('Received message:', message);
   *   },
   * });
   *
   * app.use('/webhook', middleware);
   * ```
   */
  createExpressMiddleware(
    callbacks: WebhookHandlerCallbacks,
  ): (req: WebhookRequest, res: WebhookResponse, next: WebhookNextFunction) => void {
    const { appSecret, verifyToken } = this.requireWebhookConfig();
    return createExpressMiddlewareUtil({ appSecret, verifyToken }, callbacks);
  }

  /**
   * Create Next.js App Router handler for webhook handling.
   *
   * @param callbacks - Event callbacks (onMessage, onStatus, etc.)
   * @returns Object with GET and POST handlers for Next.js App Router
   * @throws ValidationError if appSecret or webhookVerifyToken was not provided
   *
   * @example
   * ```typescript
   * // app/api/webhook/route.ts
   * const handler = wa.webhooks.createNextRouteHandler({
   *   onMessage: (message) => {
   *     console.log('Received message:', message);
   *   },
   * });
   *
   * export const { GET, POST } = handler;
   * ```
   */
  createNextRouteHandler(callbacks: WebhookHandlerCallbacks): {
    GET: (request: Request) => Response;
    POST: (request: Request) => Promise<Response>;
  } {
    const { appSecret, verifyToken } = this.requireWebhookConfig();
    return createNextRouteHandlerUtil({ appSecret, verifyToken }, callbacks);
  }
}
