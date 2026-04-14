/**
 * Example: Receive Order Notifications (US3)
 *
 * Demonstrates: Register an onOrder handler, mount Express middleware,
 * parse incoming OrderEvent objects, and use messageId for deduplication.
 *
 * Prerequisites:
 *   - npm install @abdelrahmannasr-wa/cloud-api express
 *   - npm install --save-dev @types/express
 *
 * Required environment variables:
 *   - WHATSAPP_ACCESS_TOKEN: Your Meta access token
 *   - WHATSAPP_PHONE_NUMBER_ID: Your phone number ID
 *   - WHATSAPP_APP_SECRET: Your app secret (for webhook signature verification)
 *   - WHATSAPP_VERIFY_TOKEN: Your webhook verify token
 *   - PORT: HTTP port (default 3000)
 *
 * Run: npx tsx examples/commerce-on-order.ts
 */

import express from 'express';
import { WhatsApp } from '@abdelrahmannasr-wa/cloud-api';
import type { OrderEvent } from '@abdelrahmannasr-wa/cloud-api';

async function main() {
  const wa = new WhatsApp({
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
    appSecret: process.env.WHATSAPP_APP_SECRET!,
    webhookVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN!,
  });

  // ─── In-memory dedup store (use Redis / DB in production) ───────────
  const processedOrderIds = new Set<string>();

  // ─── Register order handler ──────────────────────────────────────────
  wa.webhooks.onOrder(async (event: OrderEvent) => {
    // Deduplicate using the platform's stable message ID
    if (processedOrderIds.has(event.messageId)) {
      console.log(`Duplicate order ${event.messageId} — skipping`);
      return;
    }
    processedOrderIds.add(event.messageId);

    console.log(`New order from ${event.from}`);
    console.log(`  Catalog: ${event.catalogId}`);
    console.log(`  Items: ${event.items.length}`);
    for (const item of event.items) {
      console.log(
        `    ${item.product_retailer_id} × ${item.quantity} @ ${item.item_price} ${item.currency}`,
      );
    }
    if (event.text) {
      console.log(`  Note from customer: "${event.text}"`);
    }

    // Persist event for your OMS / fulfillment system
    await persistOrder(event);

    // Reply to the customer confirming the order
    await wa.messages.sendText({
      to: event.from,
      body:
        `Thanks for your order! We received ${event.items.length} item(s) ` +
        `and will process it shortly.`,
    });

    console.log(`Order ${event.messageId} processed`);
  });

  // ─── Mount Express middleware ────────────────────────────────────────
  const app = express();

  // GET /webhook: Meta's hub challenge verification
  app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'] as string | undefined;
    const token = req.query['hub.verify_token'] as string | undefined;
    const challenge = req.query['hub.challenge'] as string | undefined;

    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log('Webhook verified');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  });

  // POST /webhook: Incoming events (orders, messages, status updates)
  app.post('/webhook', wa.webhooks.express());

  const port = parseInt(process.env.PORT ?? '3000', 10);
  app.listen(port, () => {
    console.log(`Webhook server listening on port ${port}`);
    console.log('Waiting for order events...');
  });
}

/** Stub: Persist an order to your OMS or database. */
async function persistOrder(event: OrderEvent): Promise<void> {
  // In production: insert into your orders table, call your OMS API, etc.
  // The raw payload is preserved at event.raw for storage or audit logging.
  console.log(`[stub] Persisting order ${event.messageId} to OMS`);
  await Promise.resolve(); // simulate async I/O
}

main().catch(console.error);
