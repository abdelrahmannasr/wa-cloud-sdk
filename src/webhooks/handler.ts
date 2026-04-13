import { parseWebhookPayload } from './parser.js';
import { verifyWebhook, verifySignature } from './verify.js';
import { WebhookVerificationError } from '../errors/errors.js';
import type { WebhookConfig, WebhookHandlerCallbacks, WebhookPayload } from './types.js';

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
 *
 * @example
 * ```ts
 * const handler = createWebhookHandler(
 *   { appSecret: process.env.APP_SECRET!, verifyToken: process.env.VERIFY_TOKEN! },
 *   { onMessage: (event) => console.log(event.message) },
 * );
 * const result = handler.handleGet(req.query);
 * res.status(result.statusCode).send(result.body);
 * ```
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
        const parsed: unknown = JSON.parse(text);
        if (
          typeof parsed !== 'object' ||
          parsed === null ||
          !('object' in parsed) ||
          !('entry' in parsed)
        ) {
          config.logger?.warn('handlePost: signed webhook body has unexpected structure');
          return { statusCode: 400, body: 'Invalid webhook payload structure' };
        }
        body = parsed as WebhookPayload;
      } catch (error: unknown) {
        // Signed-but-unparseable bodies signal a real Meta/SDK contract break;
        // surface for operators, never include the body (FR-030).
        config.logger?.warn('handlePost: failed to parse signed webhook body as JSON', error);
        return { statusCode: 400, body: 'Invalid JSON' };
      }

      const events = parseWebhookPayload(body, { logger: config.logger });

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
          case 'flow_completion':
            await callbacks.onFlowCompletion?.(event);
            break;
        }
      }

      return { statusCode: 200, body: 'OK' };
    },
  };
}
