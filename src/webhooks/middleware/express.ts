import { createWebhookHandler } from '../handler.js';
import type {
  WebhookConfig,
  WebhookHandlerCallbacks,
  WebhookRequest,
  WebhookResponse,
  WebhookNextFunction,
  WebhookPayload,
} from '../types.js';

/**
 * Create Express-compatible middleware for WhatsApp webhooks.
 *
 * Requires raw body access for signature verification. Configure body-parser with:
 * ```
 * app.use('/webhook', express.json({
 *   verify: (req, _res, buf) => { (req as any).rawBody = buf; },
 * }));
 * ```
 */
export function createExpressMiddleware(
  config: WebhookConfig,
  callbacks: WebhookHandlerCallbacks,
): (req: WebhookRequest, res: WebhookResponse, next: WebhookNextFunction) => void {
  const handler = createWebhookHandler(config, callbacks);

  return (req, res, _next) => {
    if (req.method === 'GET') {
      const result = handler.handleGet(req.query);
      res.status(result.statusCode).send(result.body);
      return;
    }

    if (req.method === 'POST') {
      const signature = extractHeader(req.headers, 'x-hub-signature-256');
      const rawBody = req.rawBody ?? JSON.stringify(req.body);

      handler
        .handlePost(rawBody, req.body as WebhookPayload, signature)
        .then((result) => {
          res.status(result.statusCode).send(result.body);
        })
        .catch(() => {
          res.status(500).send('Internal Server Error');
        });
      return;
    }

    res.status(405).send('Method Not Allowed');
  };
}

function extractHeader(
  headers: Record<string, string | string[] | undefined>,
  name: string,
): string | undefined {
  const value = headers[name];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}
