# Quickstart: Subpath Exports

## Usage

### Import individual modules (ESM)

```ts
// Media operations only
import { Media, MEDIA_CONSTRAINTS } from 'wa-cloud-sdk/media';

// Template management only
import { Templates, TemplateBuilder } from 'wa-cloud-sdk/templates';

// Phone number management only
import { PhoneNumbers } from 'wa-cloud-sdk/phone-numbers';

// Multi-account management only
import { WhatsAppMultiAccount, RoundRobinStrategy } from 'wa-cloud-sdk/multi-account';
```

### Import individual modules (CommonJS)

```js
const { Media, MEDIA_CONSTRAINTS } = require('wa-cloud-sdk/media');

const { Templates, TemplateBuilder } = require('wa-cloud-sdk/templates');

const { PhoneNumbers } = require('wa-cloud-sdk/phone-numbers');

const { WhatsAppMultiAccount, RoundRobinStrategy } = require('wa-cloud-sdk/multi-account');
```

### Full SDK import (unchanged)

```ts
// Still works — re-exports everything
import { WhatsApp } from 'wa-cloud-sdk';
```

## All Available Subpaths

| Subpath | Primary Exports |
|---------|----------------|
| `wa-cloud-sdk` | WhatsApp (unified client), all modules |
| `wa-cloud-sdk/errors` | WhatsAppError, ApiError, RateLimitError, etc. |
| `wa-cloud-sdk/messages` | Messages class, all message types |
| `wa-cloud-sdk/webhooks` | Webhooks, createWebhookHandler, middleware |
| `wa-cloud-sdk/media` | Media class, constraints, response types |
| `wa-cloud-sdk/templates` | Templates, TemplateBuilder, validation constants |
| `wa-cloud-sdk/phone-numbers` | PhoneNumbers, business profile types |
| `wa-cloud-sdk/multi-account` | WhatsAppMultiAccount, 3 distribution strategies |
