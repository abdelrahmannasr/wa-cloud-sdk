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

// ── Base ──

/** Shared fields for all outbound message option interfaces. */
export interface BaseMessageOptions {
  /** Recipient phone number (E.164 or digits-only) */
  readonly to: string;
  /** Message ID to reply to (quoted reply) */
  readonly replyTo?: string;
}

// ── Text ──

export interface TextMessageOptions extends BaseMessageOptions {
  /** Message body (up to 4096 characters) */
  readonly body: string;
  /** Enable URL preview for links in the body */
  readonly previewUrl?: boolean;
}

// ── Image ──

export interface ImageMessageOptions extends BaseMessageOptions {
  readonly media: MediaSource;
  readonly caption?: string;
}

// ── Video ──

export interface VideoMessageOptions extends BaseMessageOptions {
  readonly media: MediaSource;
  readonly caption?: string;
}

// ── Audio ──

export interface AudioMessageOptions extends BaseMessageOptions {
  readonly media: MediaSource;
}

// ── Document ──

export interface DocumentMessageOptions extends BaseMessageOptions {
  readonly media: MediaSource;
  readonly caption?: string;
  readonly filename?: string;
}

// ── Sticker ──

export interface StickerMessageOptions extends BaseMessageOptions {
  readonly media: MediaSource;
}

// ── Location ──

export interface LocationMessageOptions extends BaseMessageOptions {
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

export interface ContactsMessageOptions extends BaseMessageOptions {
  readonly contacts: readonly ContactInfo[];
}

// ── Reaction ──

export interface ReactionMessageOptions extends Omit<BaseMessageOptions, 'replyTo'> {
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

export interface InteractiveButtonMessageOptions extends BaseMessageOptions {
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

export interface InteractiveListMessageOptions extends BaseMessageOptions {
  readonly body: string;
  readonly buttonText: string;
  readonly sections: readonly InteractiveListSection[];
  /** Text-only header. Meta's API only supports text headers for list messages (unlike button messages which also support image/video/document headers). */
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

export interface TemplateMessageOptions extends BaseMessageOptions {
  readonly templateName: string;
  readonly language: string;
  readonly components?: readonly TemplateComponent[];
}

// ── CTA URL Button ──

export interface CtaUrlButtonMessageOptions extends BaseMessageOptions {
  /** Message body text */
  readonly body: string;
  /** Button display text */
  readonly buttonText: string;
  /** Target URL */
  readonly url: string;
  /** Dynamic URL suffix appended to the URL at delivery time */
  readonly urlSuffix?: string;
  /** Optional header (text, image, video, or document) */
  readonly header?: InteractiveHeader;
  /** Optional footer text */
  readonly footer?: string;
}

// ── Location Request ──

export interface LocationRequestMessageOptions extends BaseMessageOptions {
  /** Body text explaining why the location is needed */
  readonly body: string;
}

// ── Flow ──

/**
 * Initial screen and data passed to a flow when it opens.
 *
 * Used with `flowAction='navigate'` to open the flow on a specific screen
 * with pre-populated context. When `flowAction='data_exchange'` is used
 * instead, `screen` is ignored because the flow's backend decides which
 * screen to render based on the exchanged data.
 */
export interface FlowActionPayload {
  /** Screen name to open the flow on (ignored when flowAction='data_exchange') */
  readonly screen: string;
  /** Pre-populated data made available to the flow definition */
  readonly data?: Record<string, unknown>;
}

/**
 * Options for sendFlow — sends an interactive flow message.
 *
 * Delivers a WhatsApp Flow invitation to a recipient. The recipient sees a
 * body message with a call-to-action button that, when tapped, opens the
 * flow for them to complete.
 *
 * See https://developers.facebook.com/docs/whatsapp/flows/guides/sendingaflow/
 */
export interface FlowMessageOptions extends BaseMessageOptions {
  /** Main message body text shown above the CTA button */
  readonly body: string;
  /** CTA button label (e.g. "Open", "Start", "View") */
  readonly flowCta: string;
  /** UUID of the published or draft flow */
  readonly flowId: string;
  /**
   * Optional token transmitted with the flow for correlating sends with
   * webhook responses. Note: Meta does NOT echo this token back in flow
   * completion payloads by default; it is only returned if the flow's
   * terminal screen or endpoint explicitly includes it in its response.
   */
  readonly flowToken?: string;
  /**
   * Flow testing mode. Omit to send the flow in its default ('published')
   * mode. Set to 'draft' to test an unpublished flow before launch.
   */
  readonly mode?: 'draft' | 'published';
  /**
   * Flow navigation action:
   * - `'navigate'` — open a specific screen; requires `flowActionPayload.screen`.
   * - `'data_exchange'` — invoke the flow's backend endpoint on open; the
   *   backend decides the initial screen, so `flowActionPayload.screen` is
   *   ignored if supplied.
   *
   * Omit to let Meta apply its server-side default.
   */
  readonly flowAction?: 'navigate' | 'data_exchange';
  /** Initial screen name and data (used when flowAction='navigate') */
  readonly flowActionPayload?: FlowActionPayload;
  /**
   * Flow message protocol version. The SDK defaults to '3'. Override only
   * if you need to test or adopt a newer Meta version before the SDK
   * updates its pinned default. Typed as a string union to preserve
   * autocomplete for the default while still allowing any string.
   */
  readonly flowMessageVersion?: '3' | (string & {});
  /** Optional interactive header (text, image, video, or document) */
  readonly header?: InteractiveHeader;
  /** Optional footer text */
  readonly footer?: string;
}

// ── Typing Indicator ──

export type TypingIndicatorOptions = Omit<BaseMessageOptions, 'replyTo'>;

// ── Mark as Read ──

export interface MarkAsReadOptions {
  /** The wamid of the message to mark as read */
  readonly messageId: string;
}
