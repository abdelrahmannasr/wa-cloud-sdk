# Quickstart: Subpath Exports

## Usage

### Import individual modules (ESM)

```ts
// Media operations only
import { Media, MEDIA_CONSTRAINTS } from '@abdelrahmannasr-wa/cloud-api/media';

// Template management only
import { Templates, TemplateBuilder } from '@abdelrahmannasr-wa/cloud-api/templates';

// Phone number management only
import { PhoneNumbers } from '@abdelrahmannasr-wa/cloud-api/phone-numbers';

// Multi-account management only
import { WhatsAppMultiAccount, RoundRobinStrategy } from '@abdelrahmannasr-wa/cloud-api/multi-account';
```

### Import individual modules (CommonJS)

```js
const { Media, MEDIA_CONSTRAINTS } = require('@abdelrahmannasr-wa/cloud-api/media');

const { Templates, TemplateBuilder } = require('@abdelrahmannasr-wa/cloud-api/templates');

const { PhoneNumbers } = require('@abdelrahmannasr-wa/cloud-api/phone-numbers');

const { WhatsAppMultiAccount, RoundRobinStrategy } = require('@abdelrahmannasr-wa/cloud-api/multi-account');
```

### Full SDK import (unchanged)

```ts
// Still works — re-exports everything
import { WhatsApp } from '@abdelrahmannasr-wa/cloud-api';
```

## All Available Subpaths

| Subpath | Primary Exports |
|---------|----------------|
| `@abdelrahmannasr-wa/cloud-api` | WhatsApp (unified client), all modules |
| `@abdelrahmannasr-wa/cloud-api/errors` | WhatsAppError, ApiError, RateLimitError, etc. |
| `@abdelrahmannasr-wa/cloud-api/messages` | Messages class, all message types |
| `@abdelrahmannasr-wa/cloud-api/webhooks` | Webhooks, createWebhookHandler, middleware |
| `@abdelrahmannasr-wa/cloud-api/media` | Media class, constraints, response types |
| `@abdelrahmannasr-wa/cloud-api/templates` | Templates, TemplateBuilder, validation constants |
| `@abdelrahmannasr-wa/cloud-api/phone-numbers` | PhoneNumbers, business profile types |
| `@abdelrahmannasr-wa/cloud-api/multi-account` | WhatsAppMultiAccount, 3 distribution strategies |
