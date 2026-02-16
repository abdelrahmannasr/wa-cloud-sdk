# Quickstart: Distribution Strategies & Broadcast

## Round-Robin Distribution

```typescript
import {
  WhatsAppMultiAccount,
  RoundRobinStrategy,
} from '@abdelrahmannasr-wa/cloud-api';

const manager = new WhatsAppMultiAccount({
  strategy: new RoundRobinStrategy(),
  accounts: [
    { name: 'account-a', accessToken: 'TOKEN_A', phoneNumberId: 'PHONE_A' },
    { name: 'account-b', accessToken: 'TOKEN_B', phoneNumberId: 'PHONE_B' },
    { name: 'account-c', accessToken: 'TOKEN_C', phoneNumberId: 'PHONE_C' },
  ],
});

// Each call cycles: A → B → C → A → B → ...
const wa = manager.getNext();
await wa.messages.sendText({ to: '1234567890', body: 'Hello!' });
```

## Weighted Distribution

```typescript
import {
  WhatsAppMultiAccount,
  WeightedStrategy,
} from '@abdelrahmannasr-wa/cloud-api';

const manager = new WhatsAppMultiAccount({
  strategy: new WeightedStrategy(
    new Map([
      ['enterprise', 80],   // gets ~80% of traffic
      ['business-1', 10],   // gets ~10% of traffic
      ['business-2', 10],   // gets ~10% of traffic
    ]),
  ),
  accounts: [
    { name: 'enterprise', accessToken: 'TOKEN_E', phoneNumberId: 'PHONE_E' },
    { name: 'business-1', accessToken: 'TOKEN_1', phoneNumberId: 'PHONE_1' },
    { name: 'business-2', accessToken: 'TOKEN_2', phoneNumberId: 'PHONE_2' },
  ],
});

const wa = manager.getNext();
await wa.messages.sendText({ to: '1234567890', body: 'Hello!' });
```

## Sticky Routing

```typescript
import {
  WhatsAppMultiAccount,
  StickyStrategy,
} from '@abdelrahmannasr-wa/cloud-api';

const manager = new WhatsAppMultiAccount({
  strategy: new StickyStrategy(),
  accounts: [
    { name: 'account-a', accessToken: 'TOKEN_A', phoneNumberId: 'PHONE_A' },
    { name: 'account-b', accessToken: 'TOKEN_B', phoneNumberId: 'PHONE_B' },
  ],
});

// Same recipient always routes to the same account
const wa = manager.getNext('1234567890');
await wa.messages.sendText({ to: '1234567890', body: 'Hello!' });
```

## Broadcast

```typescript
import {
  WhatsAppMultiAccount,
  RoundRobinStrategy,
} from '@abdelrahmannasr-wa/cloud-api';

const manager = new WhatsAppMultiAccount({
  strategy: new RoundRobinStrategy(),
  accounts: [
    { name: 'account-a', accessToken: 'TOKEN_A', phoneNumberId: 'PHONE_A' },
    { name: 'account-b', accessToken: 'TOKEN_B', phoneNumberId: 'PHONE_B' },
  ],
});

const recipients = ['1111111111', '2222222222', '3333333333', '4444444444'];

// Broadcast same message to all recipients
const result = await manager.broadcast(
  recipients,
  async (wa, to) => wa.messages.sendText({ to, body: 'Campaign message!' }),
);

console.log(`Sent: ${result.successes.length}, Failed: ${result.failures.length}`);

// Broadcast with per-recipient customization
const result2 = await manager.broadcast(
  recipients,
  async (wa, to) =>
    wa.messages.sendTemplate({
      to,
      templateName: 'welcome',
      language: 'en',
    }),
  { concurrency: 10 }, // limit to 10 concurrent sends
);

// Handle failures
for (const failure of result2.failures) {
  console.error(`Failed to send to ${failure.recipient}:`, failure.error);
}
```

## Custom Strategy

```typescript
import type { DistributionStrategy } from '@abdelrahmannasr-wa/cloud-api';

class PriorityStrategy implements DistributionStrategy {
  select(accountNames: readonly string[]): string {
    // Always prefer the first account; fall back to others
    return accountNames[0]!;
  }
}

const manager = new WhatsAppMultiAccount({
  strategy: new PriorityStrategy(),
  accounts: [
    { name: 'primary', accessToken: 'TOKEN_P', phoneNumberId: 'PHONE_P' },
    { name: 'fallback', accessToken: 'TOKEN_F', phoneNumberId: 'PHONE_F' },
  ],
});
```

## Backward Compatibility

```typescript
// No strategy = existing behavior, get() works as before
const manager = new WhatsAppMultiAccount({
  accounts: [
    { name: 'business-a', accessToken: 'TOKEN_A', phoneNumberId: 'PHONE_A' },
  ],
});

// Manual lookup still works
const wa = manager.get('business-a');
await wa.messages.sendText({ to: '1234567890', body: 'Hello!' });

// getNext() and broadcast() throw ValidationError without a strategy
// manager.getNext(); // ❌ ValidationError: strategy is required for getNext()
```
