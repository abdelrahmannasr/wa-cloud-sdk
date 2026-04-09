import type { HttpClient } from '../client/http-client.js';
import type { RequestOptions, ApiResponse } from '../client/types.js';
import { validatePhoneNumber } from '../utils/phone.js';
import type {
  MessageResponse,
  MarkAsReadResponse,
  MessageType,
  TextMessageOptions,
  ImageMessageOptions,
  VideoMessageOptions,
  AudioMessageOptions,
  DocumentMessageOptions,
  StickerMessageOptions,
  LocationMessageOptions,
  ContactsMessageOptions,
  ReactionMessageOptions,
  InteractiveButtonMessageOptions,
  InteractiveListMessageOptions,
  TemplateMessageOptions,
  CtaUrlButtonMessageOptions,
  LocationRequestMessageOptions,
  FlowMessageOptions,
  TypingIndicatorOptions,
  MarkAsReadOptions,
  MediaSource,
  InteractiveHeader,
} from './types.js';

/** Meta's dynamic URL parameter placeholder for CTA URL buttons. */
const CTA_URL_DYNAMIC_SUFFIX = '{{1}}';

export class Messages {
  private readonly client: HttpClient;
  private readonly phoneNumberId: string;

  constructor(client: HttpClient, phoneNumberId: string) {
    this.client = client;
    this.phoneNumberId = phoneNumberId;
  }

  /**
   * Send a text message.
   *
   * @example
   * ```ts
   * const response = await messages.sendText({
   *   to: '+1234567890',
   *   body: 'Hello from the SDK!',
   *   previewUrl: true,
   * });
   * ```
   */
  async sendText(
    options: TextMessageOptions,
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<MessageResponse>> {
    const payload = {
      ...this.buildBasePayload(options.to, 'text', options.replyTo),
      text: {
        preview_url: options.previewUrl ?? false,
        body: options.body,
      },
    };
    return this.send(payload, requestOptions);
  }

  /**
   * Send an image message (by media ID or URL).
   *
   * @example
   * ```ts
   * const response = await messages.sendImage({
   *   to: '+1234567890',
   *   media: { link: 'https://example.com/image.jpg' },
   *   caption: 'Check this out',
   * });
   * ```
   */
  async sendImage(
    options: ImageMessageOptions,
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<MessageResponse>> {
    const payload = {
      ...this.buildBasePayload(options.to, 'image', options.replyTo),
      image: {
        ...this.resolveMedia(options.media),
        ...(options.caption !== undefined && { caption: options.caption }),
      },
    };
    return this.send(payload, requestOptions);
  }

  /**
   * Send a video message.
   *
   * @example
   * ```ts
   * const response = await messages.sendVideo({
   *   to: '+1234567890',
   *   media: { id: 'media_id_123' },
   *   caption: 'Watch this',
   * });
   * ```
   */
  async sendVideo(
    options: VideoMessageOptions,
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<MessageResponse>> {
    const payload = {
      ...this.buildBasePayload(options.to, 'video', options.replyTo),
      video: {
        ...this.resolveMedia(options.media),
        ...(options.caption !== undefined && { caption: options.caption }),
      },
    };
    return this.send(payload, requestOptions);
  }

  /**
   * Send an audio message.
   *
   * @example
   * ```ts
   * const response = await messages.sendAudio({
   *   to: '+1234567890',
   *   media: { id: 'media_id_123' },
   * });
   * ```
   */
  async sendAudio(
    options: AudioMessageOptions,
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<MessageResponse>> {
    const payload = {
      ...this.buildBasePayload(options.to, 'audio', options.replyTo),
      audio: this.resolveMedia(options.media),
    };
    return this.send(payload, requestOptions);
  }

  /**
   * Send a document message.
   *
   * @example
   * ```ts
   * const response = await messages.sendDocument({
   *   to: '+1234567890',
   *   media: { link: 'https://example.com/report.pdf' },
   *   filename: 'report.pdf',
   *   caption: 'Monthly report',
   * });
   * ```
   */
  async sendDocument(
    options: DocumentMessageOptions,
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<MessageResponse>> {
    const payload = {
      ...this.buildBasePayload(options.to, 'document', options.replyTo),
      document: {
        ...this.resolveMedia(options.media),
        ...(options.caption !== undefined && { caption: options.caption }),
        ...(options.filename !== undefined && { filename: options.filename }),
      },
    };
    return this.send(payload, requestOptions);
  }

  /**
   * Send a sticker message.
   *
   * @example
   * ```ts
   * const response = await messages.sendSticker({
   *   to: '+1234567890',
   *   media: { id: 'media_id_123' },
   * });
   * ```
   */
  async sendSticker(
    options: StickerMessageOptions,
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<MessageResponse>> {
    const payload = {
      ...this.buildBasePayload(options.to, 'sticker', options.replyTo),
      sticker: this.resolveMedia(options.media),
    };
    return this.send(payload, requestOptions);
  }

  /**
   * Send a location message.
   *
   * @example
   * ```ts
   * const response = await messages.sendLocation({
   *   to: '+1234567890',
   *   longitude: -122.4194,
   *   latitude: 37.7749,
   *   name: 'San Francisco',
   *   address: 'San Francisco, CA',
   * });
   * ```
   */
  async sendLocation(
    options: LocationMessageOptions,
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<MessageResponse>> {
    const payload = {
      ...this.buildBasePayload(options.to, 'location', options.replyTo),
      location: {
        longitude: options.longitude,
        latitude: options.latitude,
        ...(options.name !== undefined && { name: options.name }),
        ...(options.address !== undefined && { address: options.address }),
      },
    };
    return this.send(payload, requestOptions);
  }

  /**
   * Send a contacts card message.
   *
   * @example
   * ```ts
   * const response = await messages.sendContacts({
   *   to: '+1234567890',
   *   contacts: [{ name: { formatted_name: 'Jane Doe' }, phones: [{ phone: '+0987654321' }] }],
   * });
   * ```
   */
  async sendContacts(
    options: ContactsMessageOptions,
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<MessageResponse>> {
    const payload = {
      ...this.buildBasePayload(options.to, 'contacts', options.replyTo),
      contacts: options.contacts,
    };
    return this.send(payload, requestOptions);
  }

  /**
   * Send a reaction to an existing message.
   *
   * @example
   * ```ts
   * const response = await messages.sendReaction({
   *   to: '+1234567890',
   *   messageId: 'wamid.abc123',
   *   emoji: '\ud83d\udc4d',
   * });
   * ```
   */
  async sendReaction(
    options: ReactionMessageOptions,
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<MessageResponse>> {
    const payload = {
      ...this.buildBasePayload(options.to, 'reaction'),
      reaction: {
        message_id: options.messageId,
        emoji: options.emoji,
      },
    };
    return this.send(payload, requestOptions);
  }

  /**
   * Send an interactive button message (up to 3 buttons).
   *
   * @example
   * ```ts
   * const response = await messages.sendInteractiveButtons({
   *   to: '+1234567890',
   *   body: 'Choose an option:',
   *   buttons: [
   *     { type: 'reply', reply: { id: 'btn_yes', title: 'Yes' } },
   *     { type: 'reply', reply: { id: 'btn_no', title: 'No' } },
   *   ],
   * });
   * ```
   */
  async sendInteractiveButtons(
    options: InteractiveButtonMessageOptions,
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<MessageResponse>> {
    const payload = {
      ...this.buildBasePayload(options.to, 'interactive', options.replyTo),
      interactive: {
        type: 'button',
        body: { text: options.body },
        action: { buttons: options.buttons },
        ...this.buildInteractiveOptionals(options.header, options.footer),
      },
    };
    return this.send(payload, requestOptions);
  }

  /**
   * Send an interactive list message.
   *
   * @example
   * ```ts
   * const response = await messages.sendInteractiveList({
   *   to: '+1234567890',
   *   body: 'Select a product:',
   *   buttonText: 'View options',
   *   sections: [{ title: 'Products', rows: [{ id: 'p1', title: 'Widget' }] }],
   * });
   * ```
   */
  async sendInteractiveList(
    options: InteractiveListMessageOptions,
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<MessageResponse>> {
    const payload = {
      ...this.buildBasePayload(options.to, 'interactive', options.replyTo),
      interactive: {
        type: 'list',
        body: { text: options.body },
        action: {
          button: options.buttonText,
          sections: options.sections,
        },
        ...this.buildInteractiveOptionals(
          options.header !== undefined
            ? { type: 'text' as const, text: options.header }
            : undefined,
          options.footer,
        ),
      },
    };
    return this.send(payload, requestOptions);
  }

  /**
   * Send a pre-approved template message.
   *
   * @example
   * ```ts
   * const response = await messages.sendTemplate({
   *   to: '+1234567890',
   *   templateName: 'hello_world',
   *   language: 'en_US',
   *   components: [{ type: 'body', parameters: [{ type: 'text', text: 'John' }] }],
   * });
   * ```
   */
  async sendTemplate(
    options: TemplateMessageOptions,
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<MessageResponse>> {
    const payload = {
      ...this.buildBasePayload(options.to, 'template', options.replyTo),
      template: {
        name: options.templateName,
        language: { code: options.language },
        ...(options.components !== undefined && { components: options.components }),
      },
    };
    return this.send(payload, requestOptions);
  }

  /**
   * Send a CTA URL button message.
   *
   * @example
   * ```ts
   * const response = await messages.sendInteractiveCta({
   *   to: '+1234567890',
   *   body: 'Check out our latest collection!',
   *   buttonText: 'Shop Now',
   *   url: 'https://example.com/shop',
   * });
   * ```
   */
  async sendInteractiveCta(
    options: CtaUrlButtonMessageOptions,
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<MessageResponse>> {
    const urlValue = options.urlSuffix ? `${options.url}${CTA_URL_DYNAMIC_SUFFIX}` : options.url;
    const parameters: {
      display_text: string;
      url: string;
      example?: string[];
    } = {
      display_text: options.buttonText,
      url: urlValue,
      ...(options.urlSuffix ? { example: [options.urlSuffix] } : {}),
    };
    const payload = {
      ...this.buildBasePayload(options.to, 'interactive', options.replyTo),
      interactive: {
        type: 'cta_url',
        body: { text: options.body },
        action: {
          name: 'cta_url',
          parameters,
        },
        ...this.buildInteractiveOptionals(options.header, options.footer),
      },
    };
    return this.send(payload, requestOptions);
  }

  /**
   * Send a location request message.
   *
   * @example
   * ```ts
   * const response = await messages.sendLocationRequest({
   *   to: '+1234567890',
   *   body: 'Please share your delivery address.',
   * });
   * ```
   */
  async sendLocationRequest(
    options: LocationRequestMessageOptions,
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<MessageResponse>> {
    const payload = {
      ...this.buildBasePayload(options.to, 'interactive', options.replyTo),
      interactive: {
        type: 'location_request_message',
        body: { text: options.body },
        action: { name: 'send_location' },
      },
    };
    return this.send(payload, requestOptions);
  }

  /**
   * Send a WhatsApp Flow as an interactive message.
   *
   * Delivers a flow invitation to the recipient with a call-to-action button
   * that opens the flow. Supports draft and published modes, optional initial
   * screen and data, correlation tokens, reply-to, and optional header/footer.
   *
   * Defaults: `mode='published'`, `flowAction='navigate'`, `flowMessageVersion='3'`.
   *
   * @example
   * ```ts
   * await messages.sendFlow({
   *   to: '+1234567890',
   *   body: 'Complete your appointment booking',
   *   flowCta: 'Book Now',
   *   flowId: '1234567890',
   *   flowActionPayload: {
   *     screen: 'SELECT_DATE',
   *     data: { default_date: '2026-04-15' },
   *   },
   * });
   * ```
   */
  async sendFlow(
    options: FlowMessageOptions,
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<MessageResponse>> {
    const parameters: {
      flow_message_version: string;
      flow_id: string;
      flow_cta: string;
      mode?: 'draft';
      flow_action?: 'navigate' | 'data_exchange';
      flow_token?: string;
      flow_action_payload?: { screen: string; data?: Record<string, unknown> };
    } = {
      flow_message_version: options.flowMessageVersion ?? '3',
      flow_id: options.flowId,
      flow_cta: options.flowCta,
      ...(options.mode === 'draft' ? { mode: 'draft' } : {}),
      ...(options.flowAction !== undefined ? { flow_action: options.flowAction } : {}),
      ...(options.flowToken ? { flow_token: options.flowToken } : {}),
      ...(options.flowActionPayload ? { flow_action_payload: options.flowActionPayload } : {}),
    };
    const payload = {
      ...this.buildBasePayload(options.to, 'interactive', options.replyTo),
      interactive: {
        type: 'flow',
        body: { text: options.body },
        action: { name: 'flow', parameters },
        ...this.buildInteractiveOptionals(options.header, options.footer),
      },
    };
    return this.send(payload, requestOptions);
  }

  /**
   * Send a typing indicator to show "typing..." in the recipient's chat.
   *
   * @example
   * ```ts
   * await messages.sendTypingIndicator({ to: '+1234567890' });
   * ```
   */
  async sendTypingIndicator(
    options: TypingIndicatorOptions,
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<MarkAsReadResponse>> {
    const payload = {
      messaging_product: 'whatsapp' as const,
      recipient_type: 'individual' as const,
      to: validatePhoneNumber(options.to),
      status: 'typing',
    };
    return this.send<MarkAsReadResponse>(payload, requestOptions);
  }

  /**
   * Mark a message as read (sends "read" receipt).
   *
   * @example
   * ```ts
   * const response = await messages.markAsRead({ messageId: 'wamid.abc123' });
   * ```
   */
  async markAsRead(
    options: MarkAsReadOptions,
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<MarkAsReadResponse>> {
    const payload = {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: options.messageId,
    };
    return this.send<MarkAsReadResponse>(payload, requestOptions);
  }

  // ── Private helpers ──

  private buildBasePayload(
    to: string,
    type: MessageType,
    replyTo?: string,
  ): {
    messaging_product: 'whatsapp';
    recipient_type: 'individual';
    to: string;
    type: MessageType;
    context?: { message_id: string };
  } {
    const validatedTo = validatePhoneNumber(to);
    const trimmedReplyTo = replyTo?.trim();
    return {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: validatedTo,
      type,
      ...(trimmedReplyTo ? { context: { message_id: trimmedReplyTo } } : {}),
    };
  }

  private buildInteractiveOptionals(
    header?: InteractiveHeader,
    footer?: string,
  ): { header?: InteractiveHeader; footer?: { text: string } } {
    return {
      ...(header !== undefined && { header }),
      ...(footer !== undefined && { footer: { text: footer } }),
    };
  }

  private resolveMedia(media: MediaSource): { id: string } | { link: string } {
    if ('id' in media) {
      return { id: media.id };
    }
    return { link: media.link };
  }

  private async send<T = MessageResponse>(
    payload: Record<string, unknown>,
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.client.post<T>(`${this.phoneNumberId}/messages`, payload, requestOptions);
  }
}
