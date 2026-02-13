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
  MarkAsReadOptions,
  MediaSource,
} from './types.js';

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
      ...this.buildBasePayload(options.to, 'text'),
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
      ...this.buildBasePayload(options.to, 'image'),
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
      ...this.buildBasePayload(options.to, 'video'),
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
      ...this.buildBasePayload(options.to, 'audio'),
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
      ...this.buildBasePayload(options.to, 'document'),
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
      ...this.buildBasePayload(options.to, 'sticker'),
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
      ...this.buildBasePayload(options.to, 'location'),
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
      ...this.buildBasePayload(options.to, 'contacts'),
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
      ...this.buildBasePayload(options.to, 'interactive'),
      interactive: {
        type: 'button',
        body: { text: options.body },
        action: { buttons: options.buttons },
        ...(options.header !== undefined && { header: options.header }),
        ...(options.footer !== undefined && { footer: { text: options.footer } }),
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
      ...this.buildBasePayload(options.to, 'interactive'),
      interactive: {
        type: 'list',
        body: { text: options.body },
        action: {
          button: options.buttonText,
          sections: options.sections,
        },
        ...(options.header !== undefined && { header: { type: 'text', text: options.header } }),
        ...(options.footer !== undefined && { footer: { text: options.footer } }),
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
      ...this.buildBasePayload(options.to, 'template'),
      template: {
        name: options.templateName,
        language: { code: options.language },
        ...(options.components !== undefined && { components: options.components }),
      },
    };
    return this.send(payload, requestOptions);
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
  ): Record<string, unknown> {
    const validatedTo = validatePhoneNumber(to);
    return {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: validatedTo,
      type,
    };
  }

  private resolveMedia(media: MediaSource): Record<string, string> {
    if ('id' in media) {
      return { id: media.id };
    }
    return { link: media.link };
  }

  private async send<T = MessageResponse>(
    payload: Record<string, unknown>,
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.client.post<T>(
      `${this.phoneNumberId}/messages`,
      payload,
      requestOptions,
    );
  }
}
