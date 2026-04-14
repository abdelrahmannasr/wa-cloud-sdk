/**
 * Example: Send a Multi-Product List Message (US2)
 *
 * Demonstrates: Send a curated list of up to 30 products organized into
 * named sections. Also shows the client-side ValidationError when limits
 * are exceeded.
 *
 * Prerequisites:
 *   - npm install @abdelrahmannasr-wa/cloud-api
 *
 * Required environment variables:
 *   - WHATSAPP_ACCESS_TOKEN: Your Meta access token
 *   - WHATSAPP_PHONE_NUMBER_ID: Your phone number ID
 *   - WHATSAPP_BUSINESS_ACCOUNT_ID: Your WhatsApp Business Account ID (WABA)
 *   - CATALOG_ID: Your platform-assigned catalog ID
 *   - RECIPIENT_PHONE: Recipient phone number (E.164)
 *
 * Run: npx tsx examples/commerce-send-product-list.ts
 */

import { WhatsApp, ValidationError } from '@abdelrahmannasr-wa/cloud-api';

async function main() {
  const wa = new WhatsApp({
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID!,
  });

  const catalogId = process.env.CATALOG_ID!;
  const recipient = process.env.RECIPIENT_PHONE!;

  // ─── 1. Send a multi-product list with 2 sections × 3 items ─────────
  console.log(`Sending multi-product list to ${recipient}...`);
  const result = await wa.messages.sendProductList({
    to: recipient,
    catalogId,
    header: "Today's Specials",
    body: "Here's our curated selection — tap any item to learn more.",
    footer: 'Prices valid while stocks last',
    sections: [
      {
        title: 'Beverages',
        productRetailerIds: ['cola-001', 'juice-002', 'water-003'],
      },
      {
        title: 'Snacks',
        productRetailerIds: ['chips-001', 'nuts-002', 'bar-003'],
      },
    ],
  });
  console.log(`Sent! Message ID: ${result.data.messages[0]?.id}`);

  // ─── 2. Client-side validation error for exceeding 30 items ─────────
  //
  // The SDK validates limits before making any network call.
  // Uncomment the block below to see the ValidationError in action:
  //
  // try {
  //   const thirtyOneIds = Array.from({ length: 31 }, (_, i) => `product-${i}`);
  //   await wa.messages.sendProductList({
  //     to: recipient,
  //     catalogId,
  //     header: 'Too Many Products',
  //     body: 'This will throw before hitting the API',
  //     sections: [
  //       { title: 'All Products', productRetailerIds: thirtyOneIds },
  //     ],
  //   });
  // } catch (err) {
  //   if (err instanceof ValidationError) {
  //     console.error(`Caught ValidationError: ${err.message}`);
  //     // "Total product items (31) exceeds the maximum of 30"
  //   }
  // }

  // Example of catching the validation error programmatically:
  try {
    await wa.messages.sendProductList({
      to: recipient,
      catalogId,
      header: 'Limit Demo',
      body: 'Intentionally over the 10-section limit',
      sections: Array.from({ length: 11 }, (_, i) => ({
        title: `Section ${i + 1}`,
        productRetailerIds: [`product-${i}`],
      })),
    });
  } catch (err) {
    if (err instanceof ValidationError) {
      console.log(`Expected ValidationError caught: ${err.message}`);
    }
  }

  wa.destroy();
}

main().catch(console.error);
