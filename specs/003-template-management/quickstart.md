# Quickstart: Template Management

**Feature**: 003-template-management
**Date**: 2026-02-14

## Prerequisites

```typescript
import { HttpClient, Templates, TemplateBuilder } from '@abdelrahmannasr-wa/cloud-api';

const client = new HttpClient({
  accessToken: 'YOUR_ACCESS_TOKEN',
  phoneNumberId: 'YOUR_PHONE_NUMBER_ID',
  businessAccountId: 'YOUR_WABA_ID',
});

const templates = new Templates(client, 'YOUR_WABA_ID');
```

## List All Templates

```typescript
const result = await templates.list();
for (const template of result.data.data) {
  console.log(`${template.name} (${template.language}): ${template.status}`);
}
```

## List with Pagination and Filters

```typescript
const result = await templates.list({
  limit: 10,
  status: 'APPROVED',
});

// Next page
if (result.data.paging?.cursors?.after) {
  const nextPage = await templates.list({
    limit: 10,
    after: result.data.paging.cursors.after,
  });
}
```

## Get Templates by Name

```typescript
const result = await templates.get('order_confirmation');
// Returns all language variants of the template
```

## Create a Template with the Builder

```typescript
const request = new TemplateBuilder()
  .setName('order_shipped')
  .setLanguage('en_US')
  .setCategory('UTILITY')
  .addBody('Hi {{1}}, your order {{2}} has shipped! Track it here.')
  .addUrlButton('Track Order', 'https://example.com/track/{{1}}')
  .build();

const result = await templates.create(request);
console.log('Created:', result.data.id, result.data.status);
// status will be 'PENDING' until Meta reviews
```

## Create a Marketing Template with All Components

```typescript
const request = new TemplateBuilder()
  .setName('summer_sale')
  .setLanguage('en_US')
  .setCategory('MARKETING')
  .allowCategoryChange(true)
  .addHeaderText('Summer Sale!')
  .addBody('Hi {{1}}, enjoy {{2}}% off all items this week. Use code {{3}} at checkout.')
  .addFooter('Terms and conditions apply')
  .addQuickReplyButton('Shop Now')
  .addQuickReplyButton('Not Interested')
  .build();

const result = await templates.create(request);
```

## Update a Template

```typescript
// Update the body component of a specific language variant
await templates.update('TEMPLATE_ID', [
  { type: 'BODY', text: 'Updated: Hi {{1}}, your order {{2}} has been shipped!' },
]);
```

## Delete a Template

```typescript
// Delete all language variants
await templates.delete('order_shipped');

// Delete a specific language variant by hsm_id
await templates.delete('order_shipped', { hsmId: 'HSM_ID' });
```

## Error Handling

```typescript
import { ValidationError, ApiError } from '@abdelrahmannasr-wa/cloud-api';

try {
  const request = new TemplateBuilder()
    .setName('INVALID NAME')  // uppercase not allowed
    .setLanguage('en_US')
    .setCategory('MARKETING')
    .addBody('Hello')
    .build();
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation failed:', error.message, 'Field:', error.field);
  }
}

try {
  await templates.delete('nonexistent_template');
} catch (error) {
  if (error instanceof ApiError) {
    console.error('API error:', error.statusCode, error.message);
  }
}
```
