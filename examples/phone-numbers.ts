/**
 * Example: Phone Number Management
 *
 * Demonstrates: How to manage phone numbers and business profiles
 *
 * Prerequisites:
 *   - npm install @abdelrahmannasr-wa/cloud-api
 *
 * Required environment variables:
 *   - WHATSAPP_ACCESS_TOKEN: Your Meta access token
 *   - WHATSAPP_PHONE_NUMBER_ID: Your phone number ID
 *   - WHATSAPP_BUSINESS_ACCOUNT_ID: Your WhatsApp Business Account ID (WABA)
 *
 * Run: npx tsx examples/phone-numbers.ts
 */

import { WhatsApp } from '@abdelrahmannasr-wa/cloud-api';

async function main() {
  const wa = new WhatsApp({
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID!,
  });

  try {
    // List all phone numbers under this WABA
    console.log('Fetching phone numbers...');
    const numbers = await wa.phoneNumbers.list();

    console.log(`✓ Found ${numbers.data.data.length} phone number(s):`);
    numbers.data.data.forEach((number) => {
      console.log(`  - ${number.displayPhoneNumber}`);
      console.log(`    ID: ${number.id}`);
      console.log(`    Verified: ${number.codeVerificationStatus}`);
      console.log(`    Quality: ${number.qualityRating}`);
    });

    // Get details for a specific phone number
    console.log('\nFetching phone number details...');
    const phoneDetails = await wa.phoneNumbers.get(process.env.WHATSAPP_PHONE_NUMBER_ID!);

    console.log('✓ Phone number:', phoneDetails.data.displayPhoneNumber);
    console.log('  Verified:', phoneDetails.data.codeVerificationStatus);

    // Get business profile
    console.log('\nFetching business profile...');
    const profile = await wa.phoneNumbers.getBusinessProfile(
      process.env.WHATSAPP_PHONE_NUMBER_ID!
    );

    console.log('✓ Business profile:');
    console.log('  Description:', profile.data.about || 'Not set');
    console.log('  Address:', profile.data.address || 'Not set');
    console.log('  Website:', profile.data.websites?.[0] || 'Not set');

    // Update business profile
    console.log('\nUpdating business profile...');
    await wa.phoneNumbers.updateBusinessProfile(process.env.WHATSAPP_PHONE_NUMBER_ID!, {
      description: 'Your trusted business partner - powered by WhatsApp Cloud API SDK',
      websites: ['https://example.com'],
    });

    console.log('✓ Business profile updated!');

    // Request verification code (uncomment to test)
    // Note: This sends a real SMS/voice call to the phone number
    /*
    console.log('\nRequesting verification code via SMS...');
    await wa.phoneNumbers.requestVerificationCode(
      process.env.WHATSAPP_PHONE_NUMBER_ID!,
      {
        codeMethod: 'SMS',
        language: 'en',
      }
    );

    console.log('✓ Verification code sent!');
    */

    // Verify the code (use after receiving the code above)
    /*
    console.log('\nVerifying code...');
    await wa.phoneNumbers.verifyCode(
      process.env.WHATSAPP_PHONE_NUMBER_ID!,
      { code: '123456' } // Replace with actual code
    );

    console.log('✓ Code verified!');
    */
  } catch (error) {
    console.error('Error:', error);
  } finally {
    wa.destroy();
  }
}

main();
