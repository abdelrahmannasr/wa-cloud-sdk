/**
 * Example: Express Webhook Server
 *
 * Demonstrates: How to set up an Express server to receive WhatsApp webhook events
 *
 * Prerequisites:
 *   - npm install @abdelrahmannasr-wa/cloud-api express
 *   - npm install --save-dev @types/express
 *
 * Required environment variables:
 *   - WHATSAPP_APP_SECRET: Your Meta app secret for signature verification
 *   - WHATSAPP_VERIFY_TOKEN: Your webhook verify token (set during webhook setup)
 *
 * Run: npx tsx examples/webhooks-express.ts
 *
 * Note: Expose this server with ngrok or similar to receive webhooks from Meta:
 *       ngrok http 3000
 */

import express from 'express';
import { createExpressMiddleware } from '@abdelrahmannasr-wa/cloud-api/webhooks';

const app = express();
const PORT = process.env.PORT || 3000;

// Mount the webhook middleware
app.use(
  '/webhook',
  createExpressMiddleware(
    {
      appSecret: process.env.WHATSAPP_APP_SECRET!,
      verifyToken: process.env.WHATSAPP_VERIFY_TOKEN!,
    },
    {
      // Handle incoming messages
      onMessage: (event) => {
        console.log('📩 Message received:');
        console.log('  From:', event.from);
        console.log('  Type:', event.message.type);

        if (event.message.text) {
          console.log('  Text:', event.message.text.body);
        }

        if (event.message.image) {
          console.log('  Image ID:', event.message.image.id);
        }

        // Add your message processing logic here
      },

      // Handle status updates (sent, delivered, read, failed)
      onStatus: (event) => {
        console.log('📊 Status update:');
        console.log('  Message ID:', event.messageId);
        console.log('  Status:', event.status.status);
        console.log('  Timestamp:', new Date(event.status.timestamp * 1000).toISOString());
      },

      // Handle errors
      onError: (event) => {
        console.error('❌ Error event:');
        console.error('  Code:', event.error.code);
        console.error('  Title:', event.error.title);
        console.error('  Message:', event.error.message);
      },
    }
  )
);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start the server
app.listen(PORT, () => {
  console.log(`✓ Express webhook server running on http://localhost:${PORT}`);
  console.log(`  Webhook endpoint: http://localhost:${PORT}/webhook`);
  console.log(`  Health check: http://localhost:${PORT}/health`);
  console.log('\nWaiting for webhook events...');
});
