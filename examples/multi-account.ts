/**
 * Example: Multi-Account Management
 *
 * Demonstrates: How to manage multiple WhatsApp Business Accounts
 *
 * Prerequisites:
 *   - npm install @abdelrahmannasr-wa/cloud-api
 *
 * Required environment variables:
 *   - WHATSAPP_ACCESS_TOKEN: Your Meta access token (shared across accounts)
 *   - ACCOUNT1_PHONE_NUMBER_ID: First account phone number ID
 *   - ACCOUNT2_PHONE_NUMBER_ID: Second account phone number ID
 *
 * Run: npx tsx examples/multi-account.ts
 */

import { WhatsAppMultiAccount } from '@abdelrahmannasr-wa/cloud-api';

async function main() {
  // Initialize multi-account manager with account-specific configs
  const multiAccount = new WhatsAppMultiAccount(
    {
      // Account 1 - Sales team
      sales: {
        phoneNumberId: process.env.ACCOUNT1_PHONE_NUMBER_ID!,
        // Account-specific overrides can be added here
        rateLimitConfig: {
          maxTokens: 80,
          refillRate: 80,
        },
      },

      // Account 2 - Support team
      support: {
        phoneNumberId: process.env.ACCOUNT2_PHONE_NUMBER_ID!,
        rateLimitConfig: {
          maxTokens: 80,
          refillRate: 80,
        },
      },
    },
    {
      // Shared base configuration for all accounts
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
      retryConfig: {
        maxRetries: 3,
        baseDelayMs: 1000,
      },
    }
  );

  try {
    console.log('Multi-account manager initialized with 2 accounts\n');

    // Get all account names
    const accountNames = multiAccount.getAccounts();
    console.log('Available accounts:', accountNames.join(', '));

    // Send a message via the sales account
    console.log('\nSending message via sales account...');
    const salesClient = multiAccount.get('sales');

    const result1 = await salesClient.messages.sendText({
      to: '1234567890', // Replace with actual recipient
      text: 'Hello from the Sales team! 📈',
    });

    console.log('✓ Sales message sent! ID:', result1.data.messages[0].id);

    // Send a message via the support account
    console.log('\nSending message via support account...');
    const supportClient = multiAccount.get('support');

    const result2 = await supportClient.messages.sendText({
      to: '1234567890', // Replace with actual recipient
      text: 'Hello from the Support team! 🛠️',
    });

    console.log('✓ Support message sent! ID:', result2.data.messages[0].id);

    // Check if an account exists
    console.log('\nChecking account existence...');
    console.log('  sales exists?', multiAccount.has('sales'));
    console.log('  billing exists?', multiAccount.has('billing'));

    // Add a new account dynamically
    console.log('\nAdding a new account (marketing)...');
    multiAccount.addAccount('marketing', {
      phoneNumberId: process.env.ACCOUNT1_PHONE_NUMBER_ID!, // Reuse for demo
    });

    console.log('✓ Marketing account added!');
    console.log('  Total accounts:', multiAccount.getAccounts().length);

    // Remove an account
    console.log('\nRemoving marketing account...');
    multiAccount.removeAccount('marketing');

    console.log('✓ Marketing account removed!');
    console.log('  Remaining accounts:', multiAccount.getAccounts().join(', '));

    // Lookup by phone number ID
    console.log('\nLooking up account by phone number ID...');
    const clientByPhoneId = multiAccount.get(process.env.ACCOUNT1_PHONE_NUMBER_ID!);

    console.log('✓ Found account via phone number ID lookup');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Clean up all account clients
    console.log('\nCleaning up all accounts...');
    multiAccount.destroy();
    console.log('✓ All accounts cleaned up!');
  }
}

main();
