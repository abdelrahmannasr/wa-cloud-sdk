import { parseWebhookPayload } from './parser.js';
import { verifyWebhook, verifySignature } from './verify.js';
import { WebhookVerificationError } from '../errors/errors.js';
import type {
  WebhookConfig,
  WebhookHandlerCallbacks,
  WebhookPayload,
} from './types.js';

export interface WebhookHandlerResult {
  readonly statusCode: number;
  readonly body: unknown;
}

export interface WebhookHandler {
  /** Handle GET verification challenge. */
  handleGet(params: Record<string, string | string[] | undefined>): WebhookHandlerResult;

  /** Handle POST webhook notification. Verifies signature, parses JSON, then dispatches events. */
  handlePost(
    rawBody: Buffer | string,
    signature: string | undefined,
  ): Promise<WebhookHandlerResult>;
}

/**
 * Create a webhook handler with verification and typed event dispatching.
 *
 * The POST handler performs steps in this order: (1) verify HMAC signature,
 * (2) parse JSON body, (3) dispatch to callbacks. No processing occurs on
 * unverified payloads.
 *
 * Callbacks are awaited sequentially per event. If a callback throws, the error
 * propagates immediately and remaining events in the same payload are skipped.
 * For Express middleware this means the error is forwarded via `next(error)`;
 * for Next.js handlers the error propagates to the framework.
 *
 * @param config - App secret and verify token
 * @param callbacks - Event handlers for messages, statuses, and errors
 */
export function createWebhookHandler(
  config: WebhookConfig,
  callbacks: WebhookHandlerCallbacks,
): WebhookHandler {
  return {
    handleGet(params): WebhookHandlerResult {
      try {
        const challenge = verifyWebhook(params, config.verifyToken);
        return { statusCode: 200, body: challenge };
      } catch (error: unknown) {
        if (error instanceof WebhookVerificationError) {
          return { statusCode: 403, body: 'Forbidden' };
        }
        throw error;
      }
    },

    async handlePost(rawBody, signature): Promise<WebhookHandlerResult> {
      try {
        verifySignature(rawBody, signature, config.appSecret);
      } catch (error: unknown) {
        if (error instanceof WebhookVerificationError) {
          return { statusCode: 403, body: 'Invalid signature' };
        }
        throw error;
      }

      let body: WebhookPayload;
      try {
        const text = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf-8');
        body = JSON.parse(text) as WebhookPayload;
      } catch {
        return { statusCode: 400, body: 'Invalid JSON' };
      }

      const events = parseWebhookPayload(body);

      for (const event of events) {
        switch (event.type) {
          case 'message':
            await callbacks.onMessage?.(event);
            break;
          case 'status':
            await callbacks.onStatus?.(event);
            break;
          case 'error':
            await callbacks.onError?.(event);
            break;
        }
      }

      return { statusCode: 200, body: 'OK' };
    },
  };
}
