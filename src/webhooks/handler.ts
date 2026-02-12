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

  /** Handle POST webhook notification. */
  handlePost(
    rawBody: Buffer | string,
    body: WebhookPayload,
    signature: string | undefined,
  ): Promise<WebhookHandlerResult>;
}

/**
 * Create a webhook handler with verification and typed event dispatching.
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

    async handlePost(rawBody, body, signature): Promise<WebhookHandlerResult> {
      try {
        verifySignature(rawBody, signature, config.appSecret);
      } catch (error: unknown) {
        if (error instanceof WebhookVerificationError) {
          return { statusCode: 403, body: 'Invalid signature' };
        }
        throw error;
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
