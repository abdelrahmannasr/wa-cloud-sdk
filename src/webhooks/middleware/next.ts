import { createWebhookHandler } from '../handler.js';
import type { WebhookConfig, WebhookHandlerCallbacks } from '../types.js';

/**
 * Create Next.js App Router route handlers for WhatsApp webhooks.
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
 * );
 * ```
 */
export function createNextRouteHandler(
  config: WebhookConfig,
  callbacks: WebhookHandlerCallbacks,
): {
  GET: (request: Request) => Response;
  POST: (request: Request) => Promise<Response>;
} {
  const handler = createWebhookHandler(config, callbacks);

  return {
    GET(request: Request): Response {
      const url = new URL(request.url);
      const params: Record<string, string> = {};
      for (const [key, value] of url.searchParams.entries()) {
        params[key] = value;
      }

      const result = handler.handleGet(params);
      return new Response(String(result.body), { status: result.statusCode });
    },

    async POST(request: Request): Promise<Response> {
      const rawBody = await request.text();
      const signature = request.headers.get('x-hub-signature-256') ?? undefined;

      const result = await handler.handlePost(rawBody, signature);
      return new Response(String(result.body), { status: result.statusCode });
    },
  };
}
