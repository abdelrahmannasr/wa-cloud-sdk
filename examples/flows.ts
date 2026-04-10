/**
 * Example: WhatsApp Flows
 *
 * Demonstrates: Create a flow, upload flow JSON, publish, send to a user,
 * handle flow completion webhooks, and multi-account broadcast with flows.
 *
 * Prerequisites:
 *   - npm install @abdelrahmannasr-wa/cloud-api
 *
 * Required environment variables:
 *   - WHATSAPP_ACCESS_TOKEN: Your Meta access token
 *   - WHATSAPP_PHONE_NUMBER_ID: Your phone number ID
 *   - WHATSAPP_BUSINESS_ACCOUNT_ID: Your WhatsApp Business Account ID (WABA)
 *   - WHATSAPP_APP_SECRET: Your app secret (for webhook verification)
 *   - WHATSAPP_VERIFY_TOKEN: Your webhook verify token
 *   - RECIPIENT_PHONE: The recipient's phone number (E.164 format)
 *
 * Run: npx tsx examples/flows.ts
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
    appSecret: process.env.WHATSAPP_APP_SECRET!,
    webhookVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN!,
  });

  const recipient = process.env.RECIPIENT_PHONE!;

  // ─── 1. Create a flow ───────────────────────────────────────────────
  console.log('Creating flow...');
  const created = await wa.flows.create({
    name: 'example_signup_flow',
    categories: ['SIGN_UP'],
  });
  const flowId = created.data.id;
  console.log(`Flow created: ${flowId}`);

  if (created.data.validation_errors?.length) {
    for (const err of created.data.validation_errors) {
      console.error(`  Validation: ${err.error_type}: ${err.message}`);
    }
  }

  // ─── 2. Upload flow JSON via updateAssets ────────────────────────────
  console.log('Uploading flow JSON...');
  const flowDefinition = {
    version: '3.0',
    screens: [
      {
        id: 'WELCOME',
        title: 'Welcome',
        layout: {
          type: 'SingleColumnLayout',
          children: [
            { type: 'TextHeading', text: 'Sign Up' },
            { type: 'TextInput', name: 'full_name', label: 'Full Name', required: true },
            { type: 'TextInput', name: 'email', label: 'Email', input_type: 'email' },
            {
              type: 'Footer',
              label: 'Submit',
              on_click_action: {
                name: 'complete',
                payload: { screen_name: 'SUCCESS', full_name: '${form.full_name}', email: '${form.email}' },
              },
            },
          ],
        },
      },
    ],
  };

  const assetsResult = await wa.flows.updateAssets(flowId, {
    flow_json: flowDefinition, // SDK stringifies objects automatically
  });

  if (assetsResult.data.validation_errors?.length) {
    console.error('Flow JSON validation errors:');
    for (const err of assetsResult.data.validation_errors) {
      console.error(`  ${err.error}: ${err.message}`);
    }
  } else {
    console.log('Flow JSON uploaded successfully');
  }

  // ─── 3. Publish the flow ────────────────────────────────────────────
  console.log('Publishing flow...');
  await wa.flows.publish(flowId);
  console.log('Flow published');

  // ─── 4. Send the flow to a user ─────────────────────────────────────
  console.log(`Sending flow to ${recipient}...`);
  await wa.messages.sendFlow({
    to: recipient,
    body: 'Please complete your registration.',
    flowCta: 'Sign Up',
    flowId,
  });
  console.log('Flow sent');

  // ─── 5. Handle flow completions via webhook ─────────────────────────
  // This would normally be wired into your HTTP server.
  const processedIds = new Set<string>();

  const handler = wa.webhooks.createHandler({
    onMessage: async (event) => {
      console.log(`Message from ${event.contact.waId}: ${event.message.type}`);
    },
    onFlowCompletion: async (event) => {
      // Consumer-side dedup using messageId
      if (processedIds.has(event.messageId)) {
        console.log(`Duplicate flow completion ${event.messageId}, skipping`);
        return;
      }
      processedIds.add(event.messageId);

      console.log(`Flow completion from ${event.contact.waId}:`);
      console.log(`  Name: ${event.response.full_name ?? 'N/A'}`);
      console.log(`  Email: ${event.response.email ?? 'N/A'}`);
      console.log(`  Raw JSON: ${event.responseJson}`);
    },
  });

  // Example: handler.handlePost(rawBody, signature) in your HTTP route
  console.log('Webhook handler created (wire into your HTTP server)');
  void handler; // Avoid unused variable lint error in this example

  // ─── 6. Multi-account broadcast with per-account flow IDs ───────────
  // Flow IDs are scoped to a single WABA. When broadcasting the "same"
  // flow across accounts, each account has its own flow ID.
  const manager = new WhatsAppMultiAccount({
    accounts: [
      {
        name: 'us',
        config: {
          accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
          phoneNumberId: 'phone_us',
        },
      },
      {
        name: 'eu',
        config: {
          accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
          phoneNumberId: 'phone_eu',
        },
      },
    ],
    strategy: new RoundRobinStrategy(),
  });

  const flowIdByAccount: Record<string, string> = {
    us: 'flow_id_in_us_account',
    eu: 'flow_id_in_eu_account',
  };

  const broadcastResult = await manager.broadcast(
    ['15551234567', '15559876543'],
    (account, to) =>
      account.messages.sendFlow({
        to,
        body: 'Complete your registration',
        flowCta: 'Get Started',
        flowId: flowIdByAccount[account.name]!,
      }),
    { concurrency: 5 },
  );

  console.log(`Broadcast: ${broadcastResult.succeeded.length} sent, ${broadcastResult.failed.length} failed`);

  // ─── 7. Lifecycle: list, preview, deprecate, delete ─────────────────
  const flows = await wa.flows.list({ limit: 5 });
  for (const f of flows.data.data) {
    console.log(`  ${f.id}: ${f.name} (${f.status})`);
  }

  const preview = await wa.flows.getPreview(flowId);
  console.log(`Preview URL: ${preview.data.preview.preview_url}`);

  // Deprecate the flow (it can no longer be sent to new users)
  await wa.flows.deprecate(flowId);
  console.log('Flow deprecated');

  // Clean up
  wa.destroy();
  manager.destroy();
}

main().catch(console.error);
