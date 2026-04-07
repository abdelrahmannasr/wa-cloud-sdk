# Data Model: Messaging Enhancements (v0.2.0)

**Branch**: `008-messaging-enhancements` | **Date**: 2026-04-07

## Entities

### MessageContext (new)

Optional field on all outbound message option interfaces.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| message_id | string | Yes | Platform message ID to reply to |

**Validation**: If provided, must be non-empty after trimming. Empty/whitespace values are silently ignored (no context sent).

**Relationship**: Attached to any outbound message payload as `context: { message_id }`.

---

### CtaUrlButtonMessageOptions (new)

Options for sending a CTA URL button message.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| to | string | Yes | Recipient phone number |
| body | string | Yes | Message body text |
| buttonText | string | Yes | Button display text |
| url | string | Yes | Target URL |
| urlSuffix | string | No | Dynamic URL parameter appended to the URL |
| header | InteractiveHeader | No | Header (text, image, video, or document) |
| footer | string | No | Footer text |
| replyTo | string | No | Message ID to reply to |

---

### LocationRequestMessageOptions (new)

Options for sending a location request message.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| to | string | Yes | Recipient phone number |
| body | string | Yes | Body text explaining why location is needed |
| replyTo | string | No | Message ID to reply to |

---

### TypingIndicatorOptions (new)

Options for sending a typing indicator.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| to | string | Yes | Recipient phone number |

**Note**: No `replyTo` — typing indicators are not messages and don't support context.

---

### ConversationPricing (new)

Structured pricing information extracted from webhook status events.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| billable | boolean | Yes | Whether the message is billable |
| pricingModel | string | Yes | Pricing model (e.g., "CBP") |
| category | string | Yes | Pricing category (marketing, utility, authentication, service, referral_conversion) |
| conversationId | string | No | Conversation identifier |
| originType | string | No | Conversation origin type (e.g., "business_initiated", "user_initiated") |
| expirationTimestamp | string | No | Conversation expiration timestamp |

**Source**: Extracted from `StatusEvent.status.pricing` and `StatusEvent.status.conversation` fields.

**Forward compatibility**: `category` is typed as `string` (not a union) to preserve unrecognized platform values.

---

## Modified Entities

### All Existing Message Options (modified)

Every existing message option interface gains one optional field:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| replyTo | string | No | Message ID to reply to (quoted reply) |

**Affected interfaces**: TextMessageOptions, ImageMessageOptions, VideoMessageOptions, AudioMessageOptions, DocumentMessageOptions, StickerMessageOptions, LocationMessageOptions, ContactsMessageOptions, ReactionMessageOptions, InteractiveButtonMessageOptions, InteractiveListMessageOptions, TemplateMessageOptions

**Not affected**: MarkAsReadOptions (not a message send)
