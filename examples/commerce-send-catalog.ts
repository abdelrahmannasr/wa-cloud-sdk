/**
 * Example: Send a Catalog Message (US4)
 *
 * Demonstrates: Send a "browse the catalog" invitation to a recipient,
 * with and without a thumbnail product pinned to the entry point.
 *
 * Prerequisites:
 *   - npm install @abdelrahmannasr-wa/cloud-api
 *
 * Required environment variables:
 *   - WHATSAPP_ACCESS_TOKEN: Your Meta access token
 *   - WHATSAPP_PHONE_NUMBER_ID: Your phone number ID
 *   - WHATSAPP_BUSINESS_ACCOUNT_ID: Your WhatsApp Business Account ID (WABA)
 *   - RECIPIENT_PHONE: Recipient phone number (E.164)
 *
 * Optional environment variables:
 *   - THUMBNAIL_PRODUCT_RETAILER_ID: Retailer ID of the product to pin as thumbnail
 *
 * Run: npx tsx examples/commerce-send-catalog.ts
 */

import { WhatsApp } from '@abdelrahmannasr-wa/cloud-api';

async function main() {
  const wa = new WhatsApp({
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID!,
  });

  const recipient = process.env.RECIPIENT_PHONE!;
  const thumbnailProductRetailerId = process.env.THUMBNAIL_PRODUCT_RETAILER_ID;

  // ─── 1. Send catalog invitation (no thumbnail) ───────────────────────
  console.log(`Sending catalog invitation to ${recipient}...`);
  const basicResult = await wa.messages.sendCatalogMessage({
    to: recipient,
    body: 'Browse our full collection and find what you need.',
    footer: 'Free shipping on orders over $50',
  });
  console.log(`Sent (no thumbnail)! Message ID: ${basicResult.data.messages[0]?.id}`);

  // ─── 2. Send catalog invitation with thumbnail product ───────────────
  if (thumbnailProductRetailerId) {
    console.log(`Sending catalog invitation with thumbnail to ${recipient}...`);
    const thumbResult = await wa.messages.sendCatalogMessage({
      to: recipient,
      body: 'Check out our featured product and browse the full catalog.',
      footer: 'New arrivals added weekly',
      thumbnailProductRetailerId,
    });
    console.log(`Sent (with thumbnail)! Message ID: ${thumbResult.data.messages[0]?.id}`);
  } else {
    console.log('Skipping thumbnail example (THUMBNAIL_PRODUCT_RETAILER_ID not set)');
  }

  wa.destroy();
}

main().catch(console.error);
