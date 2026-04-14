/**
 * Example: Send a Single-Product Message (US1)
 *
 * Demonstrates: Send a rich product card to a recipient and broadcast the
 * same message across multiple WhatsApp accounts using a per-account catalog
 * ID map.
 *
 * Prerequisites:
 *   - npm install @abdelrahmannasr-wa/cloud-api
 *
 * Required environment variables:
 *   - WHATSAPP_ACCESS_TOKEN: Your Meta access token
 *   - WHATSAPP_PHONE_NUMBER_ID: Your phone number ID
 *   - WHATSAPP_BUSINESS_ACCOUNT_ID: Your WhatsApp Business Account ID (WABA)
 *   - CATALOG_ID: Your platform-assigned catalog ID
 *   - PRODUCT_RETAILER_ID: The retailer-defined product ID
 *   - RECIPIENT_PHONE: Recipient phone number (E.164)
 *
 * Run: npx tsx examples/commerce-send-product.ts
 */

import {
  WhatsApp,
  WhatsAppMultiAccount,
  RoundRobinStrategy,
} from '@abdelrahmannasr-wa/cloud-api';

async function main() {
  const wa = new WhatsApp({
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID!,
  });

  const catalogId = process.env.CATALOG_ID!;
  const productRetailerId = process.env.PRODUCT_RETAILER_ID!;
  const recipient = process.env.RECIPIENT_PHONE!;

  // ─── 1. Send a single-product message ───────────────────────────────
  console.log(`Sending product message to ${recipient}...`);
  const result = await wa.messages.sendProduct({
    to: recipient,
    catalogId,
    productRetailerId,
    body: 'Check out this item — just restocked!',
    footer: 'Limited stock',
  });
  console.log(`Sent! Message ID: ${result.data.messages[0]?.id}`);

  // ─── 2. Multi-account broadcast with per-account catalog IDs ────────
  //
  // Catalog IDs are scoped to a single WABA. When sending the "same" product
  // across accounts that belong to different WABAs, each account needs its
  // own catalog ID (the product retailer ID can be identical across catalogs).
  const manager = new WhatsAppMultiAccount({
    accounts: [
      {
        name: 'us',
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
        phoneNumberId: 'phone_us',
        businessAccountId: 'waba_us',
      },
      {
        name: 'eu',
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
        phoneNumberId: 'phone_eu',
        businessAccountId: 'waba_eu',
      },
    ],
    strategy: new RoundRobinStrategy(),
  });

  // Map account name → catalog ID for each WABA
  const catalogIdByAccount: Record<string, string> = {
    us: 'catalog_id_for_us_waba',
    eu: 'catalog_id_for_eu_waba',
  };

  const broadcastRecipients = ['15551234567', '15559876543', '15550001111'];

  const broadcastResult = await manager.broadcast(
    broadcastRecipients,
    (account, to) => {
      const accountName = account.phoneNumberId; // or resolve from the accounts map
      const perAccountCatalogId = catalogIdByAccount[accountName] ?? catalogId;
      return account.messages.sendProduct({
        to,
        catalogId: perAccountCatalogId,
        productRetailerId,
        body: 'Check out this item!',
      });
    },
    { concurrency: 5 },
  );

  console.log(
    `Broadcast: ${broadcastResult.successes.length} sent, ` +
      `${broadcastResult.failures.length} failed`,
  );
  for (const failure of broadcastResult.failures) {
    console.error(`  Failed for ${failure.recipient}: ${String(failure.error)}`);
  }

  wa.destroy();
  manager.destroy();
}

main().catch(console.error);
