# Quickstart: Multi-WABA Account Management

**Feature Branch**: `005-multi-account-management`

## Phone Number Management

### List phone numbers for a WABA

```typescript
import { WhatsApp } from '@abdelrahmannasr-wa/cloud-api';

const wa = new WhatsApp({
  accessToken: 'YOUR_ACCESS_TOKEN',
  phoneNumberId: 'YOUR_PHONE_NUMBER_ID',
  businessAccountId: 'YOUR_WABA_ID',
});

// List all phone numbers
const result = await wa.phoneNumbers.list();
for (const phone of result.data.data) {
  console.log(`${phone.verifiedName}: ${phone.displayPhoneNumber} (${phone.qualityRating})`);
}

// List with specific fields only
const filtered = await wa.phoneNumbers.list({
  fields: 'id,display_phone_number,quality_rating',
  limit: 10,
});

wa.destroy();
```

### Get phone number details

```typescript
const phone = await wa.phoneNumbers.get('PHONE_NUMBER_ID');
console.log(phone.data.verifiedName);
console.log(phone.data.messagingLimitTier);
```

## Business Profile Management

### Get business profile

```typescript
const profile = await wa.phoneNumbers.getBusinessProfile('PHONE_NUMBER_ID');
console.log(profile.data.description);
console.log(profile.data.websites);
```

### Update business profile

```typescript
await wa.phoneNumbers.updateBusinessProfile('PHONE_NUMBER_ID', {
  description: 'Updated business description',
  websites: ['https://example.com'],
  vertical: 'RETAIL',
});
```

## Phone Number Registration

### Full verification and registration flow

```typescript
// Step 1: Request verification code
await wa.phoneNumbers.requestVerificationCode('PHONE_NUMBER_ID', {
  codeMethod: 'SMS',
  language: 'en_US',
});

// Step 2: Verify code (user provides the code received)
await wa.phoneNumbers.verifyCode('PHONE_NUMBER_ID', {
  code: '123456',
});

// Step 3: Register the phone number
await wa.phoneNumbers.register('PHONE_NUMBER_ID', {
  pin: '123456',
});
```

### Deregister a phone number

```typescript
await wa.phoneNumbers.deregister('PHONE_NUMBER_ID');
```

## Multi-Account Management

### Create a multi-account manager

```typescript
import { WhatsAppMultiAccount } from '@abdelrahmannasr-wa/cloud-api';

const manager = new WhatsAppMultiAccount({
  // Shared base config (applies to all accounts)
  apiVersion: 'v21.0',
  timeoutMs: 30000,
  retryConfig: { maxRetries: 3 },

  // Per-account configurations
  accounts: [
    {
      name: 'business-a',
      accessToken: 'TOKEN_A',
      phoneNumberId: 'PHONE_A',
      businessAccountId: 'WABA_A',
    },
    {
      name: 'business-b',
      accessToken: 'TOKEN_B',
      phoneNumberId: 'PHONE_B',
      businessAccountId: 'WABA_B',
    },
  ],
});
```

### Send messages through specific accounts

```typescript
// Get by account name
const waA = manager.get('business-a');
await waA.messages.sendText({ to: '1234567890', text: 'Hello from Business A!' });

// Get by phone number ID
const waB = manager.get('PHONE_B');
await waB.messages.sendText({ to: '1234567890', text: 'Hello from Business B!' });
```

### Dynamic account management

```typescript
// Add a new account at runtime
manager.addAccount({
  name: 'business-c',
  accessToken: 'TOKEN_C',
  phoneNumberId: 'PHONE_C',
  businessAccountId: 'WABA_C',
});

// Check if account exists
if (manager.has('business-c')) {
  const waC = manager.get('business-c');
  await waC.messages.sendText({ to: '1234567890', text: 'Hello from Business C!' });
}

// Remove an account (cleans up resources if accessed)
manager.removeAccount('business-c');
```

### Iterate over all accounts

```typescript
// Get all account configs (does not trigger lazy initialization)
const accounts = manager.getAccounts();
for (const [name, config] of accounts) {
  console.log(`Account: ${name}, Phone: ${config.phoneNumberId}`);
}
```

### Clean up

```typescript
// Destroys all lazily-created WhatsApp instances
manager.destroy();
```

## Direct Import (Advanced)

For users who prefer direct class instantiation:

```typescript
import { HttpClient, PhoneNumbers } from '@abdelrahmannasr-wa/cloud-api';

const client = new HttpClient({
  accessToken: 'YOUR_ACCESS_TOKEN',
  phoneNumberId: 'YOUR_PHONE_NUMBER_ID',
});

const phoneNumbers = new PhoneNumbers(client, 'YOUR_WABA_ID');
const result = await phoneNumbers.list();

client.destroy();
```
