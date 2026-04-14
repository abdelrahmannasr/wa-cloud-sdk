import { createWebhookHandler } from '../handler.js';
import type { WebhookConfig, WebhookHandlerCallbacks } from '../types.js';

/**
 * Options for the Next.js route handler.
 */
export interface NextRouteHandlerOptions {
  /**
   * Observer for internal errors thrown during POST processing.
   * Receives any error that escapes the webhook handler (typically a throw
   * from a user-supplied callback). The POST handler still responds with 500.
   * Use this to log to your observability pipeline instead of losing the
   * error to a silent 500.
   */
  readonly onInternalError?: (error: unknown, request: Request) => void | Promise<void>;
}

/**
 * Create Next.js App Router route handlers for WhatsApp webhooks.
 *
 * Callback errors in the POST handler are caught and returned as a 500 response.
 * Provide `options.onInternalError` to observe the underlying error; otherwise
 * it is silently swallowed by the 500 response.
 *
 * @returns Object with GET and POST handler functions for use in route.ts
 *
 * @example
 * ```ts
 * // app/api/webhook/route.ts
 * import { createNextRouteHandler } from '@abdelrahmannasr-wa/cloud-api/webhooks';
 *
 * export const { GET, POST } = createNextRouteHandler(
 *   { appSecret: process.env.APP_SECRET!, verifyToken: process.env.VERIFY_TOKEN! },
 *   { onMessage: (event) => console.log(event) },
 *   { onInternalError: (err) => logger.error('webhook failed', err) },
 * );
 * ```
 */
export function createNextRouteHandler(
  config: WebhookConfig,
  callbacks: WebhookHandlerCallbacks,
  options?: NextRouteHandlerOptions,
): {
  GET: (request: Request) => Promise<Response>;
  POST: (request: Request) => Promise<Response>;
} {
  const handler = createWebhookHandler(config, callbacks);

  return {
    async GET(request: Request): Promise<Response> {
      try {
        const url = new URL(request.url);
        const params: Record<string, string> = {};
        for (const [key, value] of url.searchParams.entries()) {
          params[key] = value;
        }

        const result = handler.handleGet(params);
        return new Response(String(result.body), { status: result.statusCode });
      } catch (error: unknown) {
        // Non-verification errors on the GET path (e.g. a malformed
        // request.url) would otherwise surface as a silent framework 500.
        if (options?.onInternalError) {
          try {
            await options.onInternalError(error, request);
          } catch {
            // Never let the observer's own failure change the response.
          }
        }
        return new Response('Internal Server Error', { status: 500 });
      }
    },

    async POST(request: Request): Promise<Response> {
      try {
        const rawBody = await request.text();
        const signature = request.headers.get('x-hub-signature-256') ?? undefined;

        const result = await handler.handlePost(rawBody, signature);
        return new Response(String(result.body), { status: result.statusCode });
      } catch (error: unknown) {
        if (options?.onInternalError) {
          try {
            await options.onInternalError(error, request);
          } catch {
            // Never let the observer's own failure change the response.
          }
        }
        return new Response('Internal Server Error', { status: 500 });
      }
    },
  };
}
