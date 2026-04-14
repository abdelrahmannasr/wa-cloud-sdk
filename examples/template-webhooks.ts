/**
 * Example: Template Status & Quality Webhook Events
 *
 * Demonstrates: How to react to template lifecycle changes (approval, rejection,
 * quality degradation) delivered by the platform on the same webhook endpoint
 * as regular messages.
 *
 * Prerequisites:
 *   - npm install @abdelrahmannasr-wa/cloud-api express
 *   - npm install --save-dev @types/express
 *   - In the Meta App Dashboard: subscribe to `message_template_status_update`
 *     and `message_template_quality_update` under your WhatsApp Business Account product.
 *
 * Required environment variables:
 *   - WHATSAPP_ACCESS_TOKEN: Your Meta access token
 *   - WHATSAPP_PHONE_NUMBER_ID: Your phone number ID
 *   - WHATSAPP_WABA_ID: Your WhatsApp Business Account ID
 *   - WHATSAPP_APP_SECRET: Your Meta app secret (for signature verification)
 *   - WHATSAPP_VERIFY_TOKEN: Your webhook verify token
 *
 * Run: npx tsx examples/template-webhooks.ts
 */

import express from 'express';
import { WhatsApp } from '@abdelrahmannasr-wa/cloud-api';

const wa = new WhatsApp({
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
  businessAccountId: process.env.WHATSAPP_WABA_ID!,
  appSecret: process.env.WHATSAPP_APP_SECRET!,
  webhookVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN!,
});

// ── Register template-lifecycle callbacks ──────────────────────────────────

wa.webhooks
  .onTemplateStatus(async (event) => {
    console.log(`[template_status] ${event.templateName} (${event.language}): ${event.status}`);
    console.log(`  WABA: ${event.metadata.businessAccountId}`);
    console.log(`  Template ID: ${event.templateId}`);
    console.log(`  Timestamp: ${event.timestamp.toISOString()}`);

    switch (event.status) {
      case 'APPROVED':
        console.log('  → Template is live. Campaigns may proceed.');
        // e.g.: await db.setTemplateStatus(event.templateId, 'live');
        break;
      case 'REJECTED':
        console.warn(`  → Template rejected. Reason: ${event.reason ?? 'none provided'}`);
        // e.g.: await alerts.notify({ templateId: event.templateId, reason: event.reason });
        break;
      case 'PAUSED':
        console.warn('  → Template paused by platform (likely quality-driven). Throttle campaigns.');
        break;
      case 'DISABLED':
        console.error('  → Template disabled. Remove from active campaign rotation immediately.');
        break;
      default:
        // Platform may add new states — log and handle later.
        console.warn(`  → Unhandled template status: ${event.status}`);
    }

    // Other fields that may be present:
    if (event.otherInfo) {
      console.log('  otherInfo:', JSON.stringify(event.otherInfo));
    }
  })
  .onTemplateQuality(async (event) => {
    const arrow =
      event.previousScore !== undefined ? `${event.previousScore} → ` : '';
    console.log(
      `[template_quality] ${event.templateName}: ${arrow}${event.newScore}`,
    );
    console.log(`  Template ID: ${event.templateId}  Language: ${event.language}`);

    if (event.newScore === 'RED') {
      console.error('  → Quality is RED. Pausing campaigns for this template.');
      // e.g.: await campaignManager.pause(event.templateId);
    } else if (event.newScore === 'YELLOW' && event.previousScore === 'GREEN') {
      console.warn('  → Quality dropped GREEN → YELLOW. Consider throttling send rate.');
    } else if (event.newScore === 'GREEN') {
      console.log('  → Quality is healthy.');
    }

    // previousScore is undefined for first-ever quality rating
    if (event.previousScore === undefined) {
      console.log('  → First quality rating for this template.');
    }
  });

// ── Mount Express middleware ───────────────────────────────────────────────

const app = express();

// The middleware handles GET (verify-token challenge) and POST (event delivery).
// It also fires the onMessage, onStatus, onError callbacks registered above
// alongside the new template callbacks — all on the same route.
app.use(
  '/webhook',
  wa.webhooks.createExpressMiddleware({
    onMessage: (event) => {
      console.log(`[message] from ${event.contact.waId}: ${event.message.type}`);
    },
    onStatus: (event) => {
      console.log(`[status] ${event.status.id}: ${event.status.status}`);
    },
  }),
);

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
  console.log(`Webhook server listening on http://localhost:${PORT}/webhook`);
  console.log('Waiting for template status and quality events from Meta…');
});
