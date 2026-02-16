/**
 * Example: Template Management
 *
 * Demonstrates: How to list, create, and send message templates
 *
 * Prerequisites:
 *   - npm install @abdelrahmannasr-wa/cloud-api
 *
 * Required environment variables:
 *   - WHATSAPP_ACCESS_TOKEN: Your Meta access token
 *   - WHATSAPP_PHONE_NUMBER_ID: Your phone number ID
 *   - WHATSAPP_BUSINESS_ACCOUNT_ID: Your WhatsApp Business Account ID (WABA)
 *   - RECIPIENT_PHONE: The recipient's phone number (E.164 format)
 *
 * Run: npx tsx examples/templates.ts
 */

import { WhatsApp, TemplateBuilder } from '@abdelrahmannasr-wa/cloud-api';

async function main() {
  const wa = new WhatsApp({
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID!,
  });

  try {
    // List existing templates
    console.log('Fetching templates...');
    const templates = await wa.templates.list({ limit: 5 });

    console.log(`✓ Found ${templates.data.data.length} template(s):`);
    templates.data.data.forEach((template) => {
      console.log(`  - ${template.name} (${template.language}) [${template.status}]`);
    });

    // Create a new template using TemplateBuilder
    console.log('\nCreating a new template...');
    const newTemplate = new TemplateBuilder()
      .setName('order_confirmation_v1')
      .setLanguage('en_US')
      .setCategory('UTILITY')
      .addBody(
        'Hi {{1}}! Your order #{{2}} has been confirmed. ' +
          'Total amount: {{3}}. Expected delivery: {{4}}.'
      )
      .addFooter('Thank you for your order!')
      .addQuickReplyButton('Track Order')
      .addQuickReplyButton('Contact Support')
      .build();

    const createResult = await wa.templates.create(newTemplate);
    console.log('✓ Template created! ID:', createResult.data.id);
    console.log('  Status:', createResult.data.status);
    console.log('  Note: Template must be approved by Meta before use.');

    // Send a template message (using an existing approved template)
    // Uncomment this section if you have an approved template
    /*
    console.log('\nSending template message...');
    const messageResult = await wa.messages.sendTemplate({
      to: process.env.RECIPIENT_PHONE!,
      name: 'hello_world', // Replace with your approved template name
      language: 'en_US',
    });

    console.log('✓ Template message sent!');
    console.log('Message ID:', messageResult.data.messages[0].id);
    */
  } catch (error) {
    console.error('Error:', error);
  } finally {
    wa.destroy();
  }
}

main();
