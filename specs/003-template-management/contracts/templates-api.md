# API Contract: Templates Module

**Feature**: 003-template-management
**Date**: 2026-02-14

## SDK Public API

### Templates Class

```typescript
class Templates {
  constructor(client: HttpClient, businessAccountId: string)

  list(params?: TemplateListParams, requestOptions?: RequestOptions): Promise<ApiResponse<TemplateListResponse>>
  get(templateName: string, options?: TemplateGetOptions, requestOptions?: RequestOptions): Promise<ApiResponse<TemplateListResponse>>
  create(template: CreateTemplateRequest, requestOptions?: RequestOptions): Promise<ApiResponse<CreateTemplateResponse>>
  update(templateId: string, components: CreateTemplateComponent[], requestOptions?: RequestOptions): Promise<ApiResponse<CreateTemplateResponse>>
  delete(templateName: string, options?: TemplateDeleteOptions, requestOptions?: RequestOptions): Promise<ApiResponse<TemplateDeleteResponse>>
}
```

### TemplateBuilder Class

```typescript
class TemplateBuilder {
  setName(name: string): TemplateBuilder
  setLanguage(language: string): TemplateBuilder
  setCategory(category: TemplateCategory): TemplateBuilder
  allowCategoryChange(allow: boolean): TemplateBuilder
  addHeaderText(text: string): TemplateBuilder
  addHeaderMedia(format: 'IMAGE' | 'VIDEO' | 'DOCUMENT', example?: HeaderMediaExample): TemplateBuilder
  addBody(text: string, example?: BodyExample): TemplateBuilder
  addFooter(text: string): TemplateBuilder
  addQuickReplyButton(text: string): TemplateBuilder
  addUrlButton(text: string, url: string): TemplateBuilder
  addPhoneNumberButton(text: string, phoneNumber: string): TemplateBuilder
  build(): CreateTemplateRequest
}
```

## Meta Graph API Endpoints

### List Templates

```
GET /{waba_id}/message_templates
```

**Query Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| limit | number | Results per page |
| after | string | Cursor for next page |
| before | string | Cursor for previous page |
| status | string | Filter by status (e.g., `APPROVED`) |
| name | string | Filter by template name |
| fields | string | Comma-separated fields to return |

**SDK Mapping**: `templates.list(params?, requestOptions?)`
- Path: `${businessAccountId}/message_templates`
- Method: `client.get()` with params passed via `RequestOptions.params`

**Response**:
```json
{
  "data": [
    {
      "id": "123456",
      "name": "order_confirmation",
      "language": "en_US",
      "status": "APPROVED",
      "category": "UTILITY",
      "components": [
        { "type": "HEADER", "format": "TEXT", "text": "Order {{1}}" },
        { "type": "BODY", "text": "Your order {{1}} has been confirmed." },
        { "type": "FOOTER", "text": "Thank you for shopping with us" },
        { "type": "BUTTONS", "buttons": [{ "type": "URL", "text": "Track", "url": "https://example.com/{{1}}" }] }
      ]
    }
  ],
  "paging": {
    "cursors": { "before": "abc", "after": "xyz" },
    "next": "https://graph.facebook.com/v21.0/..."
  }
}
```

### Get Templates by Name

```
GET /{waba_id}/message_templates?name={name}
```

**SDK Mapping**: `templates.get(templateName, options?, requestOptions?)`
- Path: `${businessAccountId}/message_templates`
- Method: `client.get()` with `params: { name, ...optionalLanguageFilter }`

**Note**: No dedicated single-template endpoint exists. This filters the list endpoint by name.

### Create Template

```
POST /{waba_id}/message_templates
```

**SDK Mapping**: `templates.create(template, requestOptions?)`
- Path: `${businessAccountId}/message_templates`
- Method: `client.post()` with template as body

**Request Body**:
```json
{
  "name": "order_confirmation",
  "language": "en_US",
  "category": "UTILITY",
  "allow_category_change": true,
  "components": [
    { "type": "HEADER", "format": "TEXT", "text": "Order {{1}}" },
    { "type": "BODY", "text": "Your order {{1}} has been confirmed." },
    { "type": "FOOTER", "text": "Thank you" },
    {
      "type": "BUTTONS",
      "buttons": [
        { "type": "URL", "text": "Track Order", "url": "https://example.com/{{1}}" }
      ]
    }
  ]
}
```

**Response**:
```json
{
  "id": "123456",
  "status": "PENDING",
  "category": "UTILITY"
}
```

### Update Template

```
POST /{template_id}
```

**SDK Mapping**: `templates.update(templateId, components, requestOptions?)`
- Path: `${templateId}`
- Method: `client.post()` with `{ components }` as body

**Request Body**:
```json
{
  "components": [
    { "type": "BODY", "text": "Updated body text {{1}}" }
  ]
}
```

**Response**:
```json
{
  "success": true
}
```

### Delete Template

```
DELETE /{waba_id}/message_templates?name={name}
```

**SDK Mapping**: `templates.delete(templateName, options?, requestOptions?)`
- Path: `${businessAccountId}/message_templates`
- Method: `client.delete()` with `params: { name, ...optionalHsmId }`

**Query Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| name | string | Template name (required) |
| hsm_id | string | Specific language variant ID (optional) |

**Response**:
```json
{
  "success": true
}
```

## Type Definitions Summary

### Input Types (developer-facing)

| Type | Purpose |
|------|---------|
| TemplateListParams | Query params for list() |
| TemplateGetOptions | Options for get() (language filter) |
| TemplateDeleteOptions | Options for delete() (hsm_id) |
| CreateTemplateRequest | Full template creation payload (from builder or manual) |
| CreateTemplateComponent | Component in creation request |
| CreateTemplateButton | Button in creation request |
| TemplateCategory | `'MARKETING' \| 'UTILITY' \| 'AUTHENTICATION'` |

### Response Types (API response shapes)

| Type | Purpose |
|------|---------|
| Template | Single template object from API |
| TemplateListResponse | Paginated list response with templates + paging |
| CreateTemplateResponse | Response after create (id, status, category) |
| TemplateDeleteResponse | Response after delete (success boolean) |
| TemplateStatus | `'APPROVED' \| 'PENDING' \| 'REJECTED' \| 'PAUSED' \| 'DISABLED' \| 'IN_APPEAL'` |
| TemplateComponentResponse | Component in response shape |
| ButtonResponse | Button in response shape |
| PagingInfo | Cursor-based pagination metadata |
