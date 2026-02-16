/**
 * Example: Next.js App Router Webhook Handler
 *
 * Demonstrates: How to handle WhatsApp webhooks in Next.js App Router
 *
 * Prerequisites:
 *   - npm install @abdelrahmannasr-wa/cloud-api next
 *
 * Required environment variables:
 *   - WHATSAPP_APP_SECRET: Your Meta app secret for signature verification
 *   - WHATSAPP_VERIFY_TOKEN: Your webhook verify token
 *
 * Usage:
 *   1. Copy this file to your Next.js project at: app/api/webhook/route.ts
 *   2. Deploy your Next.js app
 *   3. Configure the webhook URL in Meta: https://yourdomain.com/api/webhook
 *
 * Note: This file demonstrates the route handler structure. In production,
 *       move the handler logic to app/api/webhook/route.ts
 */

import { createNextRouteHandler } from '@abdelrahmannasr-wa/cloud-api/webhooks';

// Create the route handlers (GET for verification, POST for events)
const { GET, POST } = createNextRouteHandler(
  {
    appSecret: process.env.WHATSAPP_APP_SECRET!,
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN!,
  },
  {
    // Handle incoming messages
    onMessage: (event) => {
      console.log('📩 Message received from:', event.message.from);

      if (event.message.text) {
        console.log('Text:', event.message.text.body);

        // Example: Echo the message back (implement in your app logic)
        // await sendReply(event.message.from, event.message.text.body);
      }

      if (event.message.image) {
        console.log('Image received:', event.message.image.id);
      }

      // Add your message processing logic here
      // You might want to:
      // - Store the message in a database
      // - Trigger a workflow
      // - Send an auto-reply
      // - Forward to a queue for processing
    },

    // Handle status updates
    onStatus: (event) => {
      console.log('📊 Status update for message:', event.status.id);
      console.log('Status:', event.status.status);

      // Track delivery status in your database
      // await updateMessageStatus(event.status.id, event.status.status);
    },

    // Handle errors
    onError: (event) => {
      console.error('❌ Error:', event.error.title);
      console.error('Message:', event.error.message);

      // Log errors to your monitoring system
      // await logError(event.error);
    },
  }
);

// Export the route handlers
export { GET, POST };
