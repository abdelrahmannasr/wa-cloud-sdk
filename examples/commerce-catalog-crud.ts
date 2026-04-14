/**
 * Example: Programmatic Catalog Management (US5)
 *
 * Demonstrates: List catalogs, list products with pagination, strict-create a
 * product (with ConflictError fall-through to upsert), partial update, delete,
 * and confirm removal by listing again.
 *
 * Prerequisites:
 *   - npm install @abdelrahmannasr-wa/cloud-api
 *
 * Required environment variables:
 *   - WHATSAPP_ACCESS_TOKEN: Your Meta access token
 *   - WHATSAPP_PHONE_NUMBER_ID: Your phone number ID
 *   - WHATSAPP_BUSINESS_ACCOUNT_ID: Your WhatsApp Business Account ID (WABA)
 *   - CATALOG_ID: Your platform-assigned catalog ID
 *
 * Run: npx tsx examples/commerce-catalog-crud.ts
 */

import { WhatsApp, ConflictError } from '@abdelrahmannasr-wa/cloud-api';

async function main() {
  const wa = new WhatsApp({
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID!,
  });

  const catalogId = process.env.CATALOG_ID!;

  // ─── 1. List catalogs connected to the WABA ──────────────────────────
  console.log('Listing catalogs...');
  const catalogs = await wa.catalog.listCatalogs();
  for (const cat of catalogs.data.data) {
    console.log(`  ${cat.id}: ${cat.name} (${cat.product_count ?? '?'} products)`);
  }

  // ─── 2. List products with pagination ───────────────────────────────
  console.log('\nListing products (page 1)...');
  const page1 = await wa.catalog.listProducts(catalogId, { limit: 5 });
  for (const product of page1.data.data) {
    console.log(`  ${product.retailer_id}: ${product.name}`);
  }

  if (page1.data.paging?.cursors?.after) {
    console.log('Fetching page 2...');
    const page2 = await wa.catalog.listProducts(catalogId, {
      limit: 5,
      after: page1.data.paging.cursors.after,
    });
    console.log(`  Page 2 has ${page2.data.data.length} products`);
  }

  // ─── 3. Strict-create a product ─────────────────────────────────────
  const newRetailerId = `demo-${Date.now()}`;
  let productId: string | undefined;

  try {
    console.log(`\nCreating product ${newRetailerId}...`);
    const created = await wa.catalog.createProduct(catalogId, {
      retailer_id: newRetailerId,
      name: 'Demo Wireless Headphones',
      description: 'Premium noise-cancelling headphones',
      image_url: 'https://example.com/images/headphones.jpg',
      price: 4999,
      currency: 'USD',
      availability: 'in stock',
      condition: 'new',
      visibility: 'published',
    });
    productId = created.data.id;
    console.log(`  Created: ${productId} (retailer_id: ${newRetailerId})`);
  } catch (err) {
    if (err instanceof ConflictError) {
      // retailer_id already exists — fall through to upsert
      console.log(`  ConflictError: ${err.message}. Falling back to upsertProduct...`);
      const upserted = await wa.catalog.upsertProduct(catalogId, {
        retailer_id: newRetailerId,
        name: 'Demo Wireless Headphones',
        image_url: 'https://example.com/images/headphones.jpg',
        price: 4999,
        currency: 'USD',
      });
      productId = upserted.data.id;
      console.log(`  Upserted: ${productId}`);
    } else {
      throw err;
    }
  }

  if (!productId) {
    console.error('No product ID available — skipping update/delete steps');
    wa.destroy();
    return;
  }

  // ─── 4. Upsert a product (create-or-update) ──────────────────────────
  console.log(`\nUpserting product ${newRetailerId} (idempotent)...`);
  const upserted = await wa.catalog.upsertProduct(catalogId, {
    retailer_id: newRetailerId,
    name: 'Demo Wireless Headphones',
    image_url: 'https://example.com/images/headphones.jpg',
    price: 3999,
    currency: 'USD',
    availability: 'in stock',
  });
  console.log(`  Upserted product ID: ${upserted.data.id}`);

  // ─── 5. Partial update — price only ──────────────────────────────────
  console.log(`\nUpdating price for product ${productId}...`);
  const updated = await wa.catalog.updateProduct(productId, {
    price: 3499,
    currency: 'USD',
  });
  console.log(`  New price: ${updated.data.price} ${updated.data.currency ?? ''}`);

  // ─── 6. Delete the product ────────────────────────────────────────────
  console.log(`\nDeleting product ${productId}...`);
  await wa.catalog.deleteProduct(productId);
  console.log('  Deleted');

  // ─── 7. Confirm removal ──────────────────────────────────────────────
  console.log('\nListing products to confirm removal...');
  const afterDelete = await wa.catalog.listProducts(catalogId, { limit: 5 });
  const stillExists = afterDelete.data.data.some((p) => p.id === productId);
  console.log(`  Product still present: ${stillExists ? 'YES (unexpected)' : 'NO (expected)'}`);

  wa.destroy();
}

main().catch(console.error);
