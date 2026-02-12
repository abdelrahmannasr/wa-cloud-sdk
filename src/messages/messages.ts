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

  /** Send a text message. */
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

  /** Send an image message (by media ID or URL). */
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

  /** Send a video message. */
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

  /** Send an audio message. */
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

  /** Send a document message. */
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

  /** Send a sticker message. */
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

  /** Send a location message. */
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

  /** Send a contacts card message. */
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

  /** Send a reaction to an existing message. */
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

  /** Send an interactive button message (up to 3 buttons). */
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

  /** Send an interactive list message. */
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

  /** Send a pre-approved template message. */
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

  /** Mark a message as read (sends "read" receipt). */
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
