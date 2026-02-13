import { createWebhookHandler } from '../handler.js';
import { extractFirstValue } from '../utils.js';
import type {
  WebhookConfig,
  WebhookHandlerCallbacks,
  WebhookRequest,
  WebhookResponse,
  WebhookNextFunction,
} from '../types.js';

/**
 * Create Express-compatible middleware for WhatsApp webhooks.
 *
 * Requires raw body access for signature verification.
 *
 * @example
 * ```ts
 * // Configure body-parser to capture raw body
 * app.use('/webhook', express.json({
 *   verify: (req, _res, buf) => { (req as any).rawBody = buf; },
 * }));
 *
 * // Mount the middleware
 * app.use('/webhook', createExpressMiddleware(
 *   { appSecret: process.env.APP_SECRET!, verifyToken: process.env.VERIFY_TOKEN! },
 *   { onMessage: async (event) => console.log(event.message) },
 * ));
 * ```
 */
export function createExpressMiddleware(
  config: WebhookConfig,
  callbacks: WebhookHandlerCallbacks,
): (req: WebhookRequest, res: WebhookResponse, next: WebhookNextFunction) => void {
  const handler = createWebhookHandler(config, callbacks);

  return (req, res, next) => {
    if (req.method === 'GET') {
      const result = handler.handleGet(req.query);
      res.status(result.statusCode).send(result.body);
      return;
    }

    if (req.method === 'POST') {
      if (!req.rawBody) {
        res
          .status(500)
          .send(
            'Raw body is required for signature verification. ' +
              'Configure body-parser with a verify callback that sets req.rawBody.',
          );
        return;
      }

      const signature = extractFirstValue(req.headers, 'x-hub-signature-256');

      handler
        .handlePost(req.rawBody, signature)
        .then((result) => {
          res.status(result.statusCode).send(result.body);
        })
        .catch((error: unknown) => {
          next(error);
        });
      return;
    }

    res.status(405).send('Method Not Allowed');
  };
}
