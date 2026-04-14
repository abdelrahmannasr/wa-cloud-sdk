# API Contract: WhatsAppMultiAccount Class

**Module**: `src/multi-account/multi-account.ts`
**Feature Branch**: `005-multi-account-management`

## Class: WhatsAppMultiAccount

### Constructor

```
WhatsAppMultiAccount(config: MultiAccountConfig)
```

**Config shape**:
```
{
  accounts: AccountConfig[]       // Required, at least one
  apiVersion?: string             // Shared base (default: 'v21.0')
  baseUrl?: string                // Shared base (default: 'https://graph.facebook.com')
  logger?: Logger                 // Shared base logger
  rateLimitConfig?: RateLimitConfig  // Shared base
  retryConfig?: RetryConfig       // Shared base
  timeoutMs?: number              // Shared base
}
```

**AccountConfig shape**:
```
{
  name: string                    // Required, unique identifier
  accessToken: string             // Required
  phoneNumberId: string           // Required
  businessAccountId?: string      // Optional (needed for templates, phone numbers)
  apiVersion?: string             // Override shared base
  baseUrl?: string                // Override shared base
  logger?: Logger                 // Override shared base
  rateLimitConfig?: RateLimitConfig  // Override shared base
  retryConfig?: RetryConfig       // Override shared base
  timeoutMs?: number              // Override shared base
  appSecret?: string              // For webhook verification
  webhookVerifyToken?: string     // For webhook verification
}
```

**Validation**:
- Throws `ValidationError` if `accounts` is empty
- Throws `ValidationError` if any account is missing `name`, `accessToken`, or `phoneNumberId`
- Throws `ValidationError` if duplicate account names detected

**Behavior**: Stores account configs; WhatsApp instances are NOT created at construction time (lazy initialization).

### Methods

---

#### get(nameOrPhoneNumberId) → WhatsApp

Retrieve a WhatsApp client instance by account name or phone number ID.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nameOrPhoneNumberId` | string | Yes | Account name or phone number ID |

**Behavior**:
1. Look up account config by name (primary) or phone number ID (secondary)
2. If instance already exists (lazily created), return it
3. If not, merge shared base config with account config, create new WhatsApp instance, cache it, and return it
4. Throws `ValidationError` if no matching account found

**Config merge priority**: Account-specific overrides > shared base config > defaults

---

#### addAccount(config) → void

Add a new account at runtime.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `config` | AccountConfig | Yes | Account configuration |

**Validation**:
- Throws `ValidationError` if `name`, `accessToken`, or `phoneNumberId` is missing
- Throws `ValidationError` if account name already exists
- Throws `ValidationError` if phone number ID already registered to another account

**Behavior**: Stores config; does NOT create WhatsApp instance (lazy).

---

#### removeAccount(name) → void

Remove an account and clean up its resources.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Account name |

**Validation**: Throws `ValidationError` if account name not found.

**Behavior**:
1. If a WhatsApp instance was lazily created for this account, call `destroy()` on it
2. Remove account config and instance from all internal maps

---

#### getAccounts() → ReadonlyMap<string, AccountConfig>

Return all registered account configurations.

**Behavior**: Returns a read-only view of account name → config mappings. Does NOT trigger lazy initialization of any WhatsApp instances.

---

#### has(nameOrPhoneNumberId) → boolean

Check if an account exists by name or phone number ID.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nameOrPhoneNumberId` | string | Yes | Account name or phone number ID |

---

#### destroy() → void

Clean up all instantiated WhatsApp client instances.

**Behavior**:
1. Iterate over all lazily-created WhatsApp instances
2. Call `destroy()` on each (cleans up rate limiter intervals)
3. Clear all internal maps (configs, instances, lookups)

After `destroy()`, the manager is unusable — calling any method should throw.
