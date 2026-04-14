# API Contract: Messages

**Module**: `@abdelrahmannasr-wa/cloud-api` (main) or `@abdelrahmannasr-wa/cloud-api/messages`

## Class: Messages

### Constructor

```
new Messages(client: HttpClient, phoneNumberId: string)
```

Creates a Messages instance bound to a specific phone number ID.

### Methods

All send methods follow the same pattern:
1. Validate recipient phone number via `validatePhoneNumber(options.to)`
2. Build payload with `messaging_product: "whatsapp"` + type-specific fields
3. Call `client.post("{phoneNumberId}/messages", payload, requestOptions)`
4. Return `Promise<ApiResponse<MessageResponse>>`

---

#### sendText(options, requestOptions?) → Promise\<ApiResponse\<MessageResponse\>\>

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| to | string | Yes | Recipient phone number |
| body | string | Yes | Text message content |
| previewUrl | boolean | No | Enable URL preview in message |

**Payload type**: `"text"`

---

#### sendImage(options, requestOptions?) → Promise\<ApiResponse\<MessageResponse\>\>

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| to | string | Yes | Recipient phone number |
| media | MediaSource | Yes | `{ id: string }` or `{ link: string }` |
| caption | string | No | Image caption |

**Payload type**: `"image"`

---

#### sendVideo(options, requestOptions?) → Promise\<ApiResponse\<MessageResponse\>\>

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| to | string | Yes | Recipient phone number |
| media | MediaSource | Yes | `{ id: string }` or `{ link: string }` |
| caption | string | No | Video caption |

**Payload type**: `"video"`

---

#### sendAudio(options, requestOptions?) → Promise\<ApiResponse\<MessageResponse\>\>

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| to | string | Yes | Recipient phone number |
| media | MediaSource | Yes | `{ id: string }` or `{ link: string }` |

**Payload type**: `"audio"`

---

#### sendDocument(options, requestOptions?) → Promise\<ApiResponse\<MessageResponse\>\>

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| to | string | Yes | Recipient phone number |
| media | MediaSource | Yes | `{ id: string }` or `{ link: string }` |
| caption | string | No | Document caption |
| filename | string | No | Display filename |

**Payload type**: `"document"`

---

#### sendSticker(options, requestOptions?) → Promise\<ApiResponse\<MessageResponse\>\>

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| to | string | Yes | Recipient phone number |
| media | MediaSource | Yes | `{ id: string }` or `{ link: string }` |

**Payload type**: `"sticker"`

---

#### sendLocation(options, requestOptions?) → Promise\<ApiResponse\<MessageResponse\>\>

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| to | string | Yes | Recipient phone number |
| longitude | number | Yes | Geographic longitude |
| latitude | number | Yes | Geographic latitude |
| name | string | No | Location name |
| address | string | No | Location address |

**Payload type**: `"location"`

---

#### sendContacts(options, requestOptions?) → Promise\<ApiResponse\<MessageResponse\>\>

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| to | string | Yes | Recipient phone number |
| contacts | ContactInfo[] | Yes | Array of contact cards (min 1) |

Each ContactInfo requires `name.formatted_name` at minimum. Optional: phones, emails, addresses, org, urls, birthday.

**Payload type**: `"contacts"`

---

#### sendReaction(options, requestOptions?) → Promise\<ApiResponse\<MessageResponse\>\>

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| to | string | Yes | Recipient phone number |
| messageId | string | Yes | ID of message to react to |
| emoji | string | Yes | Emoji character |

**Payload type**: `"reaction"`

---

#### sendInteractiveButtons(options, requestOptions?) → Promise\<ApiResponse\<MessageResponse\>\>

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| to | string | Yes | Recipient phone number |
| body | string | Yes | Message body text |
| buttons | InteractiveReplyButton[] | Yes | 1-3 reply buttons |
| header | InteractiveHeader | No | Text, image, video, or document header |
| footer | string | No | Footer text |

Each button: `{ type: "reply", reply: { id: string, title: string } }`

**Payload type**: `"interactive"` with `type: "button"`

---

#### sendInteractiveList(options, requestOptions?) → Promise\<ApiResponse\<MessageResponse\>\>

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| to | string | Yes | Recipient phone number |
| body | string | Yes | Message body text |
| buttonText | string | Yes | Menu trigger button label |
| sections | InteractiveListSection[] | Yes | List sections with rows |
| header | string | No | Header text |
| footer | string | No | Footer text |

Each section: `{ title?: string, rows: [{ id, title, description? }] }`

**Payload type**: `"interactive"` with `type: "list"`

---

#### sendTemplate(options, requestOptions?) → Promise\<ApiResponse\<MessageResponse\>\>

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| to | string | Yes | Recipient phone number |
| templateName | string | Yes | Pre-approved template name |
| language | string | Yes | Language code (e.g., `"en_US"`) |
| components | TemplateComponent[] | No | Header, body, button parameters |

**Payload type**: `"template"`

---

#### markAsRead(options, requestOptions?) → Promise\<ApiResponse\<MarkAsReadResponse\>\>

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| messageId | string | Yes | ID of message to mark as read |

**Payload**: `{ messaging_product: "whatsapp", status: "read", message_id: messageId }`

**Returns**: `{ success: boolean }`

---

## Common Patterns

**All send methods**:
- Accept optional `requestOptions?: RequestOptions` as second parameter
- Validate phone number before network call (throws `ValidationError`)
- Return `ApiResponse<MessageResponse>` with `data.messages[0].id` as the message ID
- Throw typed errors from HttpClient on failure

**Meta API endpoint**: `POST /{phoneNumberId}/messages`

**Base payload structure**:
```json
{
  "messaging_product": "whatsapp",
  "to": "{validated_phone}",
  "type": "{message_type}",
  "{message_type}": { ... type-specific fields ... }
}
```
