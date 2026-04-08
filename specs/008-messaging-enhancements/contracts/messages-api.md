# API Contract: Messages Module Extensions

**Branch**: `008-messaging-enhancements` | **Date**: 2026-04-07

## Existing Method Extensions

### All send methods — reply-to context

Every existing send method (sendText, sendImage, sendVideo, sendAudio, sendDocument, sendSticker, sendLocation, sendContacts, sendReaction, sendInteractiveButtons, sendInteractiveList, sendTemplate) gains optional `replyTo` on its options interface.

```
messages.sendText({ to: '1234567890', body: 'Reply!', replyTo: 'wamid.abc123' })
```

**Payload change**: When `replyTo` is non-empty, adds `context: { message_id: '<replyTo>' }` to the outbound payload.

---

## New Methods

### sendInteractiveCta(options, requestOptions?)

Send a CTA URL button message.

**Options**:
- `to` (string, required) — Recipient phone number
- `body` (string, required) — Message body text
- `buttonText` (string, required) — Button display text
- `url` (string, required) — Target URL
- `urlSuffix` (string, optional) — Dynamic URL parameter
- `header` (InteractiveHeader, optional) — Header content
- `footer` (string, optional) — Footer text
- `replyTo` (string, optional) — Message ID to reply to

**Returns**: `Promise<ApiResponse<MessageResponse>>`

**Platform payload**:
```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "<to>",
  "type": "interactive",
  "interactive": {
    "type": "cta_url",
    "body": { "text": "<body>" },
    "action": {
      "name": "cta_url",
      "parameters": {
        "display_text": "<buttonText>",
        "url": "<url>"
      }
    }
  }
}
```

With optional `urlSuffix`: adds `"url": "<url>{{1}}"` and `"example": ["<urlSuffix>"]` to parameters (Meta's dynamic URL pattern).

---

### sendLocationRequest(options, requestOptions?)

Send a location request message.

**Options**:
- `to` (string, required) — Recipient phone number
- `body` (string, required) — Body text
- `replyTo` (string, optional) — Message ID to reply to

**Returns**: `Promise<ApiResponse<MessageResponse>>`

**Platform payload**:
```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "<to>",
  "type": "interactive",
  "interactive": {
    "type": "location_request_message",
    "body": { "text": "<body>" },
    "action": { "name": "send_location" }
  }
}
```

---

### sendTypingIndicator(options, requestOptions?)

Send a typing indicator.

**Options**:
- `to` (string, required) — Recipient phone number

**Returns**: `Promise<ApiResponse<MessageResponse>>`

**Platform payload**:
```json
{
  "messaging_product": "whatsapp",
  "status": "typing",
  "recipient_type": "individual",
  "to": "<to>"
}
```

---

## New Utility Function

### extractConversationPricing(event)

Extract structured pricing info from a webhook status event.

**Input**: `StatusEvent` from webhooks module
**Returns**: `ConversationPricing | null`

Returns `null` when the status event has no pricing metadata.

---

## New Subpath Exports

| Subpath | Entry | Exposes |
|---------|-------|---------|
| `./media` | `src/media/index.ts` | Media, MEDIA_CONSTRAINTS, all media types |
| `./templates` | `src/templates/index.ts` | Templates, TemplateBuilder, all template types + constants |
| `./phone-numbers` | `src/phone-numbers/index.ts` | PhoneNumbers, all phone number types |
| `./multi-account` | `src/multi-account/index.ts` | WhatsAppMultiAccount, strategies, all multi-account types |
