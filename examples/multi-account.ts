/**
 * Example: Multi-Account Management & Distribution Strategies
 *
 * Demonstrates:
 *   - Managing multiple WhatsApp Business Accounts
 *   - Distribution strategies (round-robin, weighted, sticky)
 *   - Broadcast messaging with concurrency control
 *   - Dynamic account add/remove
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

import {
  WhatsAppMultiAccount,
  RoundRobinStrategy,
  WeightedStrategy,
  StickyStrategy,
} from '@abdelrahmannasr-wa/cloud-api';

async function main() {
  // ── Basic Multi-Account Management ──────────────────────────────────

  // Initialize multi-account manager with shared base config and per-account configs
  const multiAccount = new WhatsAppMultiAccount({
    // Shared base configuration for all accounts
    retryConfig: {
      maxRetries: 3,
      baseDelayMs: 1000,
    },

    // Per-account configurations
    accounts: [
      {
        // Account 1 - Sales team
        name: 'sales',
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
        phoneNumberId: process.env.ACCOUNT1_PHONE_NUMBER_ID!,
        rateLimitConfig: {
          maxTokens: 80,
          refillRate: 80,
        },
      },
      {
        // Account 2 - Support team
        name: 'support',
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
        phoneNumberId: process.env.ACCOUNT2_PHONE_NUMBER_ID!,
        rateLimitConfig: {
          maxTokens: 80,
          refillRate: 80,
        },
      },
    ],
  });

  try {
    console.log('Multi-account manager initialized with 2 accounts\n');

    // Get all account names
    const accounts = multiAccount.getAccounts();
    const accountNames = Array.from(accounts.keys());
    console.log('Available accounts:', accountNames.join(', '));

    // Send a message via the sales account
    console.log('\nSending message via sales account...');
    const salesClient = multiAccount.get('sales');

    const result1 = await salesClient.messages.sendText({
      to: '1234567890', // Replace with actual recipient
      body: 'Hello from the Sales team!',
    });

    console.log('Sales message sent! ID:', result1.data.messages[0].id);

    // Send a message via the support account
    console.log('\nSending message via support account...');
    const supportClient = multiAccount.get('support');

    const result2 = await supportClient.messages.sendText({
      to: '1234567890', // Replace with actual recipient
      body: 'Hello from the Support team!',
    });

    console.log('Support message sent! ID:', result2.data.messages[0].id);

    // Check if an account exists
    console.log('\nChecking account existence...');
    console.log('  sales exists?', multiAccount.has('sales'));
    console.log('  billing exists?', multiAccount.has('billing'));

    // Add a new account dynamically
    console.log('\nAdding a new account (marketing)...');
    multiAccount.addAccount({
      name: 'marketing',
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
      phoneNumberId: process.env.ACCOUNT1_PHONE_NUMBER_ID!, // Reuse for demo
    });

    console.log('Marketing account added!');
    console.log('  Total accounts:', multiAccount.getAccounts().size);

    // Remove an account
    console.log('\nRemoving marketing account...');
    multiAccount.removeAccount('marketing');

    console.log('Marketing account removed!');
    console.log('  Remaining accounts:', Array.from(multiAccount.getAccounts().keys()).join(', '));

    // Lookup by phone number ID
    console.log('\nLooking up account by phone number ID...');
    const clientByPhoneId = multiAccount.get(process.env.ACCOUNT1_PHONE_NUMBER_ID!);

    console.log('Found account via phone number ID lookup');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Clean up all account clients
    console.log('\nCleaning up basic manager...');
    multiAccount.destroy();
    console.log('All accounts cleaned up!');
  }

  // ── Round-Robin Distribution Strategy ───────────────────────────────

  console.log('\n--- Round-Robin Strategy ---\n');

  const roundRobinManager = new WhatsAppMultiAccount({
    strategy: new RoundRobinStrategy(),
    accounts: [
      {
        name: 'account-a',
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
        phoneNumberId: process.env.ACCOUNT1_PHONE_NUMBER_ID!,
      },
      {
        name: 'account-b',
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
        phoneNumberId: process.env.ACCOUNT2_PHONE_NUMBER_ID!,
      },
    ],
  });

  try {
    // getNext() cycles through accounts: A -> B -> A -> B -> ...
    for (let i = 0; i < 4; i++) {
      const wa = roundRobinManager.getNext();
      await wa.messages.sendText({
        to: '1234567890',
        body: `Round-robin message ${i + 1}`,
      });
      console.log(`Message ${i + 1} sent via round-robin`);
    }
  } catch (error) {
    console.error('Round-robin error:', error);
  } finally {
    roundRobinManager.destroy();
  }

  // ── Broadcast Messaging ─────────────────────────────────────────────

  console.log('\n--- Broadcast ---\n');

  const broadcastManager = new WhatsAppMultiAccount({
    strategy: new RoundRobinStrategy(),
    accounts: [
      {
        name: 'account-a',
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
        phoneNumberId: process.env.ACCOUNT1_PHONE_NUMBER_ID!,
      },
      {
        name: 'account-b',
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
        phoneNumberId: process.env.ACCOUNT2_PHONE_NUMBER_ID!,
      },
    ],
  });

  try {
    const recipients = ['1111111111', '2222222222', '3333333333', '4444444444'];

    // Broadcast a message to all recipients with concurrency limit
    const result = await broadcastManager.broadcast(
      recipients,
      async (wa, to) => wa.messages.sendText({ to, body: 'Campaign message!' }),
      { concurrency: 10 },
    );

    console.log(`Broadcast complete: ${result.successes.length} sent, ${result.failures.length} failed`);

    // Handle failures
    for (const failure of result.failures) {
      console.error(`Failed to send to ${failure.recipient}:`, failure.error);
    }
  } catch (error) {
    console.error('Broadcast error:', error);
  } finally {
    broadcastManager.destroy();
  }

  // ── Weighted Distribution Strategy ──────────────────────────────────

  console.log('\n--- Weighted Strategy ---\n');

  const weightedManager = new WhatsAppMultiAccount({
    strategy: new WeightedStrategy(
      new Map([
        ['enterprise', 80],  // gets ~80% of traffic
        ['standard', 20],    // gets ~20% of traffic
      ]),
    ),
    accounts: [
      {
        name: 'enterprise',
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
        phoneNumberId: process.env.ACCOUNT1_PHONE_NUMBER_ID!,
      },
      {
        name: 'standard',
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
        phoneNumberId: process.env.ACCOUNT2_PHONE_NUMBER_ID!,
      },
    ],
  });

  try {
    const wa = weightedManager.getNext();
    await wa.messages.sendText({ to: '1234567890', body: 'Weighted message' });
    console.log('Weighted message sent (enterprise account gets ~80% of traffic)');
  } catch (error) {
    console.error('Weighted error:', error);
  } finally {
    weightedManager.destroy();
  }

  // ── Sticky Routing Strategy ─────────────────────────────────────────

  console.log('\n--- Sticky Strategy ---\n');

  const stickyManager = new WhatsAppMultiAccount({
    strategy: new StickyStrategy(),
    accounts: [
      {
        name: 'account-a',
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
        phoneNumberId: process.env.ACCOUNT1_PHONE_NUMBER_ID!,
      },
      {
        name: 'account-b',
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
        phoneNumberId: process.env.ACCOUNT2_PHONE_NUMBER_ID!,
      },
    ],
  });

  try {
    // Same recipient always routes to the same account
    const recipient = '1234567890';
    const wa = stickyManager.getNext(recipient);
    await wa.messages.sendText({ to: recipient, body: 'Sticky message' });
    console.log('Sticky message sent (same recipient always routes to same account)');
  } catch (error) {
    console.error('Sticky error:', error);
  } finally {
    stickyManager.destroy();
  }
}

main();
