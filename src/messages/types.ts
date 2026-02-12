// ── API Response ──

/** Response from POST /{phone_number_id}/messages */
export interface MessageResponse {
  readonly messaging_product: 'whatsapp';
  readonly contacts: readonly MessageResponseContact[];
  readonly messages: readonly MessageResponseMessage[];
}

export interface MessageResponseContact {
  readonly input: string;
  readonly wa_id: string;
}

export interface MessageResponseMessage {
  readonly id: string;
  readonly message_status?: string;
}

/** Response from POST /{phone_number_id}/messages with status: 'read' */
export interface MarkAsReadResponse {
  readonly success: boolean;
}

// ── Message type (outgoing) ──

export type MessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'sticker'
  | 'location'
  | 'contacts'
  | 'reaction'
  | 'interactive'
  | 'template';

// ── Media source (by ID or link) ──

export interface MediaId {
  readonly id: string;
}

export interface MediaLink {
  readonly link: string;
}

/** Media can be referenced by uploaded media ID or by public URL. */
export type MediaSource = MediaId | MediaLink;

// ── Text ──

export interface TextMessageOptions {
  /** Recipient phone number (E.164 or digits-only) */
  readonly to: string;
  /** Message body (up to 4096 characters) */
  readonly body: string;
  /** Enable URL preview for links in the body */
  readonly previewUrl?: boolean;
}

// ── Image ──

export interface ImageMessageOptions {
  readonly to: string;
  readonly media: MediaSource;
  readonly caption?: string;
}

// ── Video ──

export interface VideoMessageOptions {
  readonly to: string;
  readonly media: MediaSource;
  readonly caption?: string;
}

// ── Audio ──

export interface AudioMessageOptions {
  readonly to: string;
  readonly media: MediaSource;
}

// ── Document ──

export interface DocumentMessageOptions {
  readonly to: string;
  readonly media: MediaSource;
  readonly caption?: string;
  readonly filename?: string;
}

// ── Sticker ──

export interface StickerMessageOptions {
  readonly to: string;
  readonly media: MediaSource;
}

// ── Location ──

export interface LocationMessageOptions {
  readonly to: string;
  readonly longitude: number;
  readonly latitude: number;
  readonly name?: string;
  readonly address?: string;
}

// ── Contacts ──

export interface ContactName {
  readonly formatted_name: string;
  readonly first_name?: string;
  readonly last_name?: string;
  readonly middle_name?: string;
  readonly suffix?: string;
  readonly prefix?: string;
}

export interface ContactPhone {
  readonly phone?: string;
  readonly type?: 'CELL' | 'MAIN' | 'IPHONE' | 'HOME' | 'WORK';
  readonly wa_id?: string;
}

export interface ContactEmail {
  readonly email?: string;
  readonly type?: 'HOME' | 'WORK';
}

export interface ContactAddress {
  readonly street?: string;
  readonly city?: string;
  readonly state?: string;
  readonly zip?: string;
  readonly country?: string;
  readonly country_code?: string;
  readonly type?: 'HOME' | 'WORK';
}

export interface ContactOrg {
  readonly company?: string;
  readonly department?: string;
  readonly title?: string;
}

export interface ContactUrl {
  readonly url?: string;
  readonly type?: 'HOME' | 'WORK';
}

export interface ContactInfo {
  readonly name: ContactName;
  readonly phones?: readonly ContactPhone[];
  readonly emails?: readonly ContactEmail[];
  readonly addresses?: readonly ContactAddress[];
  readonly org?: ContactOrg;
  readonly urls?: readonly ContactUrl[];
  readonly birthday?: string;
}

export interface ContactsMessageOptions {
  readonly to: string;
  readonly contacts: readonly ContactInfo[];
}

// ── Reaction ──

export interface ReactionMessageOptions {
  readonly to: string;
  /** The wamid of the message to react to */
  readonly messageId: string;
  /** Emoji to react with. Empty string removes reaction. */
  readonly emoji: string;
}

// ── Interactive (Button) ──

export interface InteractiveReplyButton {
  readonly type: 'reply';
  readonly reply: {
    readonly id: string;
    readonly title: string;
  };
}

export type InteractiveHeader =
  | { readonly type: 'text'; readonly text: string }
  | { readonly type: 'image'; readonly image: MediaSource }
  | { readonly type: 'video'; readonly video: MediaSource }
  | { readonly type: 'document'; readonly document: MediaSource };

export interface InteractiveButtonMessageOptions {
  readonly to: string;
  readonly body: string;
  readonly buttons: readonly InteractiveReplyButton[];
  readonly header?: InteractiveHeader;
  readonly footer?: string;
}

// ── Interactive (List) ──

export interface InteractiveListRow {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
}

export interface InteractiveListSection {
  readonly title?: string;
  readonly rows: readonly InteractiveListRow[];
}

export interface InteractiveListMessageOptions {
  readonly to: string;
  readonly body: string;
  readonly buttonText: string;
  readonly sections: readonly InteractiveListSection[];
  readonly header?: string;
  readonly footer?: string;
}

// ── Template ──

export interface TemplateCurrency {
  readonly fallback_value: string;
  readonly code: string;
  readonly amount_1000: number;
}

export interface TemplateDateTime {
  readonly fallback_value: string;
}

export type TemplateParameter =
  | { readonly type: 'text'; readonly text: string }
  | { readonly type: 'currency'; readonly currency: TemplateCurrency }
  | { readonly type: 'date_time'; readonly date_time: TemplateDateTime }
  | { readonly type: 'image'; readonly image: MediaSource }
  | { readonly type: 'video'; readonly video: MediaSource }
  | { readonly type: 'document'; readonly document: MediaSource }
  | { readonly type: 'payload'; readonly payload: string };

export interface TemplateComponent {
  readonly type: 'header' | 'body' | 'button';
  readonly sub_type?: 'quick_reply' | 'url';
  readonly index?: number;
  readonly parameters?: readonly TemplateParameter[];
}

export interface TemplateMessageOptions {
  readonly to: string;
  readonly templateName: string;
  readonly language: string;
  readonly components?: readonly TemplateComponent[];
}

// ── Mark as Read ──

export interface MarkAsReadOptions {
  /** The wamid of the message to mark as read */
  readonly messageId: string;
}
