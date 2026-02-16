/**
 * Example: Send Text Message
 *
 * Demonstrates: How to send a simple text message using the WhatsApp Cloud API SDK
 *
 * Prerequisites:
 *   - npm install @abdelrahmannasr-wa/cloud-api
 *
 * Required environment variables:
 *   - WHATSAPP_ACCESS_TOKEN: Your Meta access token
 *   - WHATSAPP_PHONE_NUMBER_ID: Your phone number ID
 *   - RECIPIENT_PHONE: The recipient's phone number (E.164 format, e.g., 1234567890)
 *
 * Run: npx tsx examples/send-text.ts
 */

import { WhatsApp, ApiError, RateLimitError } from '@abdelrahmannasr-wa/cloud-api';

async function main() {
  // Initialize the WhatsApp client
  const wa = new WhatsApp({
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
  });

  try {
    // Send a text message
    const result = await wa.messages.sendText({
      to: process.env.RECIPIENT_PHONE!,
      text: 'Hello! This is a test message from the WhatsApp Cloud API SDK.',
      previewUrl: true, // Enable URL preview if text contains links
    });

    console.log('✓ Message sent successfully!');
    console.log('Message ID:', result.data.messages[0].id);
    console.log('Status:', result.status);
  } catch (error) {
    // Handle rate limit errors
    if (error instanceof RateLimitError) {
      console.error('Rate limit exceeded. Retry after:', error.retryAfterMs, 'ms');
      return;
    }

    // Handle API errors
    if (error instanceof ApiError) {
      console.error('API Error:', error.statusCode, error.errorType);
      console.error('Message:', error.message);
      return;
    }

    // Handle other errors
    console.error('Unexpected error:', error);
  } finally {
    // Clean up resources
    wa.destroy();
  }
}

main();
