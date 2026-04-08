import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Messages } from '../../src/messages/messages.js';
import type { HttpClient } from '../../src/client/http-client.js';
import { ValidationError } from '../../src/errors/errors.js';

const PHONE_NUMBER_ID = '123456';

const MOCK_RESPONSE = {
  data: {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '15551234567', wa_id: '15551234567' }],
    messages: [{ id: 'wamid.test123' }],
  },
  status: 200,
  headers: new Headers(),
};

function createMockClient(): { client: HttpClient; postSpy: ReturnType<typeof vi.fn> } {
  const postSpy = vi.fn().mockResolvedValue(MOCK_RESPONSE);
  const client = { post: postSpy } as unknown as HttpClient;
  return { client, postSpy };
}

describe('Messages', () => {
  let postSpy: ReturnType<typeof vi.fn>;
  let messages: Messages;

  beforeEach(() => {
    const mock = createMockClient();
    postSpy = mock.postSpy;
    messages = new Messages(mock.client, PHONE_NUMBER_ID);
  });

  describe('sendText', () => {
    it('should send a text message with correct payload', async () => {
      await messages.sendText({ to: '+15551234567', body: 'Hello!' });

      expect(postSpy).toHaveBeenCalledWith(
        `${PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: '15551234567',
          type: 'text',
          text: { preview_url: false, body: 'Hello!' },
        },
        undefined,
      );
    });

    it('should set preview_url when specified', async () => {
      await messages.sendText({
        to: '15551234567',
        body: 'Check https://example.com',
        previewUrl: true,
      });

      const payload = postSpy.mock.calls[0]![1] as Record<string, unknown>;
      expect(payload['text']).toEqual({ preview_url: true, body: 'Check https://example.com' });
    });

    it('should validate and normalize phone number', async () => {
      await messages.sendText({ to: '+1 (555) 123-4567', body: 'Hi' });

      const payload = postSpy.mock.calls[0]![1] as Record<string, unknown>;
      expect(payload['to']).toBe('15551234567');
    });

    it('should throw ValidationError on invalid phone', async () => {
      await expect(messages.sendText({ to: 'abc', body: 'Hi' })).rejects.toThrow(ValidationError);
    });

    it('should forward requestOptions', async () => {
      const reqOpts = { headers: { 'X-Custom': 'value' } };
      await messages.sendText({ to: '15551234567', body: 'Hi' }, reqOpts);

      expect(postSpy).toHaveBeenCalledWith(
        `${PHONE_NUMBER_ID}/messages`,
        expect.any(Object),
        reqOpts,
      );
    });

    it('should return the API response', async () => {
      const result = await messages.sendText({ to: '15551234567', body: 'Hi' });
      expect(result.data.messages[0]!.id).toBe('wamid.test123');
      expect(result.status).toBe(200);
    });
  });

  describe('sendImage', () => {
    it('should send image by media ID', async () => {
      await messages.sendImage({ to: '15551234567', media: { id: 'media_123' } });

      const payload = postSpy.mock.calls[0]![1] as Record<string, unknown>;
      expect(payload['type']).toBe('image');
      expect(payload['image']).toEqual({ id: 'media_123' });
    });

    it('should send image by link', async () => {
      await messages.sendImage({
        to: '15551234567',
        media: { link: 'https://example.com/img.jpg' },
      });

      const payload = postSpy.mock.calls[0]![1] as Record<string, unknown>;
      expect(payload['image']).toEqual({ link: 'https://example.com/img.jpg' });
    });

    it('should include caption when provided', async () => {
      await messages.sendImage({
        to: '15551234567',
        media: { id: 'media_123' },
        caption: 'A photo',
      });

      const payload = postSpy.mock.calls[0]![1] as Record<string, unknown>;
      expect(payload['image']).toEqual({ id: 'media_123', caption: 'A photo' });
    });

    it('should omit caption when not provided', async () => {
      await messages.sendImage({ to: '15551234567', media: { id: 'media_123' } });

      const payload = postSpy.mock.calls[0]![1] as Record<string, unknown>;
      expect(payload['image']).toEqual({ id: 'media_123' });
    });
  });

  describe('sendVideo', () => {
    it('should send video with caption', async () => {
      await messages.sendVideo({
        to: '15551234567',
        media: { link: 'https://example.com/video.mp4' },
        caption: 'Watch this',
      });

      const payload = postSpy.mock.calls[0]![1] as Record<string, unknown>;
      expect(payload['type']).toBe('video');
      expect(payload['video']).toEqual({
        link: 'https://example.com/video.mp4',
        caption: 'Watch this',
      });
    });
  });

  describe('sendAudio', () => {
    it('should send audio without caption', async () => {
      await messages.sendAudio({ to: '15551234567', media: { id: 'audio_123' } });

      const payload = postSpy.mock.calls[0]![1] as Record<string, unknown>;
      expect(payload['type']).toBe('audio');
      expect(payload['audio']).toEqual({ id: 'audio_123' });
    });
  });

  describe('sendDocument', () => {
    it('should send document with filename and caption', async () => {
      await messages.sendDocument({
        to: '15551234567',
        media: { id: 'doc_123' },
        caption: 'Report',
        filename: 'report.pdf',
      });

      const payload = postSpy.mock.calls[0]![1] as Record<string, unknown>;
      expect(payload['type']).toBe('document');
      expect(payload['document']).toEqual({
        id: 'doc_123',
        caption: 'Report',
        filename: 'report.pdf',
      });
    });

    it('should send document with media only', async () => {
      await messages.sendDocument({
        to: '15551234567',
        media: { link: 'https://example.com/doc.pdf' },
      });

      const payload = postSpy.mock.calls[0]![1] as Record<string, unknown>;
      expect(payload['document']).toEqual({ link: 'https://example.com/doc.pdf' });
    });
  });

  describe('sendSticker', () => {
    it('should send sticker', async () => {
      await messages.sendSticker({ to: '15551234567', media: { id: 'sticker_123' } });

      const payload = postSpy.mock.calls[0]![1] as Record<string, unknown>;
      expect(payload['type']).toBe('sticker');
      expect(payload['sticker']).toEqual({ id: 'sticker_123' });
    });
  });

  describe('sendLocation', () => {
    it('should send location with required fields', async () => {
      await messages.sendLocation({
        to: '15551234567',
        longitude: -122.4194,
        latitude: 37.7749,
      });

      const payload = postSpy.mock.calls[0]![1] as Record<string, unknown>;
      expect(payload['type']).toBe('location');
      expect(payload['location']).toEqual({
        longitude: -122.4194,
        latitude: 37.7749,
      });
    });

    it('should include optional name and address', async () => {
      await messages.sendLocation({
        to: '15551234567',
        longitude: -122.4194,
        latitude: 37.7749,
        name: 'San Francisco',
        address: '123 Market St',
      });

      const payload = postSpy.mock.calls[0]![1] as Record<string, unknown>;
      expect(payload['location']).toEqual({
        longitude: -122.4194,
        latitude: 37.7749,
        name: 'San Francisco',
        address: '123 Market St',
      });
    });
  });

  describe('sendContacts', () => {
    it('should send contact card', async () => {
      const contacts = [
        {
          name: { formatted_name: 'John Doe', first_name: 'John', last_name: 'Doe' },
          phones: [{ phone: '+15551234567', type: 'CELL' as const }],
        },
      ];

      await messages.sendContacts({ to: '15551234567', contacts });

      const payload = postSpy.mock.calls[0]![1] as Record<string, unknown>;
      expect(payload['type']).toBe('contacts');
      expect(payload['contacts']).toEqual(contacts);
    });

    it('should send minimal contact with formatted_name only', async () => {
      const contacts = [{ name: { formatted_name: 'Jane' } }];

      await messages.sendContacts({ to: '15551234567', contacts });

      const payload = postSpy.mock.calls[0]![1] as Record<string, unknown>;
      expect(payload['contacts']).toEqual(contacts);
    });
  });

  describe('sendReaction', () => {
    it('should send reaction', async () => {
      await messages.sendReaction({
        to: '15551234567',
        messageId: 'wamid.abc123',
        emoji: '\u{1F44D}',
      });

      const payload = postSpy.mock.calls[0]![1] as Record<string, unknown>;
      expect(payload['type']).toBe('reaction');
      expect(payload['reaction']).toEqual({
        message_id: 'wamid.abc123',
        emoji: '\u{1F44D}',
      });
    });
  });

  describe('sendInteractiveButtons', () => {
    it('should send button message', async () => {
      await messages.sendInteractiveButtons({
        to: '15551234567',
        body: 'Choose an option:',
        buttons: [
          { type: 'reply', reply: { id: 'btn1', title: 'Option A' } },
          { type: 'reply', reply: { id: 'btn2', title: 'Option B' } },
        ],
      });

      const payload = postSpy.mock.calls[0]![1] as Record<string, unknown>;
      expect(payload['type']).toBe('interactive');
      expect(payload['interactive']).toEqual({
        type: 'button',
        body: { text: 'Choose an option:' },
        action: {
          buttons: [
            { type: 'reply', reply: { id: 'btn1', title: 'Option A' } },
            { type: 'reply', reply: { id: 'btn2', title: 'Option B' } },
          ],
        },
      });
    });

    it('should include optional header and footer', async () => {
      await messages.sendInteractiveButtons({
        to: '15551234567',
        body: 'Choose:',
        buttons: [{ type: 'reply', reply: { id: 'btn1', title: 'OK' } }],
        header: { type: 'text', text: 'Header Text' },
        footer: 'Footer text',
      });

      const payload = postSpy.mock.calls[0]![1] as Record<string, unknown>;
      const interactive = payload['interactive'] as Record<string, unknown>;
      expect(interactive['header']).toEqual({ type: 'text', text: 'Header Text' });
      expect(interactive['footer']).toEqual({ text: 'Footer text' });
    });

    it('should include image media header', async () => {
      await messages.sendInteractiveButtons({
        to: '15551234567',
        body: 'Choose:',
        buttons: [{ type: 'reply', reply: { id: 'btn1', title: 'OK' } }],
        header: { type: 'image', image: { id: 'img_123' } },
      });

      const payload = postSpy.mock.calls[0]![1] as Record<string, unknown>;
      const interactive = payload['interactive'] as Record<string, unknown>;
      expect(interactive['header']).toEqual({ type: 'image', image: { id: 'img_123' } });
    });

    it('should include video media header', async () => {
      await messages.sendInteractiveButtons({
        to: '15551234567',
        body: 'Choose:',
        buttons: [{ type: 'reply', reply: { id: 'btn1', title: 'OK' } }],
        header: { type: 'video', video: { link: 'https://example.com/video.mp4' } },
      });

      const payload = postSpy.mock.calls[0]![1] as Record<string, unknown>;
      const interactive = payload['interactive'] as Record<string, unknown>;
      expect(interactive['header']).toEqual({
        type: 'video',
        video: { link: 'https://example.com/video.mp4' },
      });
    });

    it('should include document media header', async () => {
      await messages.sendInteractiveButtons({
        to: '15551234567',
        body: 'Choose:',
        buttons: [{ type: 'reply', reply: { id: 'btn1', title: 'OK' } }],
        header: { type: 'document', document: { id: 'doc_123' } },
      });

      const payload = postSpy.mock.calls[0]![1] as Record<string, unknown>;
      const interactive = payload['interactive'] as Record<string, unknown>;
      expect(interactive['header']).toEqual({ type: 'document', document: { id: 'doc_123' } });
    });
  });

  describe('sendInteractiveList', () => {
    it('should send list message', async () => {
      await messages.sendInteractiveList({
        to: '15551234567',
        body: 'Pick one:',
        buttonText: 'View Options',
        sections: [
          {
            title: 'Section 1',
            rows: [
              { id: 'row1', title: 'Row 1', description: 'First row' },
              { id: 'row2', title: 'Row 2' },
            ],
          },
        ],
      });

      const payload = postSpy.mock.calls[0]![1] as Record<string, unknown>;
      expect(payload['type']).toBe('interactive');
      const interactive = payload['interactive'] as Record<string, unknown>;
      expect(interactive['type']).toBe('list');
      expect(interactive['body']).toEqual({ text: 'Pick one:' });
      expect(interactive['action']).toEqual({
        button: 'View Options',
        sections: [
          {
            title: 'Section 1',
            rows: [
              { id: 'row1', title: 'Row 1', description: 'First row' },
              { id: 'row2', title: 'Row 2' },
            ],
          },
        ],
      });
    });

    it('should include text header and footer', async () => {
      await messages.sendInteractiveList({
        to: '15551234567',
        body: 'Pick:',
        buttonText: 'Menu',
        sections: [{ rows: [{ id: 'r1', title: 'Item' }] }],
        header: 'My Header',
        footer: 'My Footer',
      });

      const payload = postSpy.mock.calls[0]![1] as Record<string, unknown>;
      const interactive = payload['interactive'] as Record<string, unknown>;
      expect(interactive['header']).toEqual({ type: 'text', text: 'My Header' });
      expect(interactive['footer']).toEqual({ text: 'My Footer' });
    });
  });

  describe('sendTemplate', () => {
    it('should send template with name and language', async () => {
      await messages.sendTemplate({
        to: '15551234567',
        templateName: 'hello_world',
        language: 'en_US',
      });

      const payload = postSpy.mock.calls[0]![1] as Record<string, unknown>;
      expect(payload['type']).toBe('template');
      expect(payload['template']).toEqual({
        name: 'hello_world',
        language: { code: 'en_US' },
      });
    });

    it('should include components when provided', async () => {
      await messages.sendTemplate({
        to: '15551234567',
        templateName: 'order_update',
        language: 'en_US',
        components: [
          {
            type: 'body',
            parameters: [{ type: 'text', text: 'ORDER-123' }],
          },
        ],
      });

      const payload = postSpy.mock.calls[0]![1] as Record<string, unknown>;
      const template = payload['template'] as Record<string, unknown>;
      expect(template['components']).toEqual([
        {
          type: 'body',
          parameters: [{ type: 'text', text: 'ORDER-123' }],
        },
      ]);
    });

    it('should pass through currency parameter type', async () => {
      await messages.sendTemplate({
        to: '15551234567',
        templateName: 'payment_update',
        language: 'en_US',
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'currency',
                currency: { fallback_value: '$100.00', code: 'USD', amount_1000: 100000 },
              },
            ],
          },
        ],
      });

      const payload = postSpy.mock.calls[0]![1] as Record<string, unknown>;
      const template = payload['template'] as Record<string, unknown>;
      const components = template['components'] as Array<Record<string, unknown>>;
      expect(components[0]!['parameters']).toEqual([
        {
          type: 'currency',
          currency: { fallback_value: '$100.00', code: 'USD', amount_1000: 100000 },
        },
      ]);
    });

    it('should pass through date_time parameter type', async () => {
      await messages.sendTemplate({
        to: '15551234567',
        templateName: 'appointment',
        language: 'en_US',
        components: [
          {
            type: 'body',
            parameters: [{ type: 'date_time', date_time: { fallback_value: 'February 13, 2026' } }],
          },
        ],
      });

      const payload = postSpy.mock.calls[0]![1] as Record<string, unknown>;
      const template = payload['template'] as Record<string, unknown>;
      const components = template['components'] as Array<Record<string, unknown>>;
      expect(components[0]!['parameters']).toEqual([
        { type: 'date_time', date_time: { fallback_value: 'February 13, 2026' } },
      ]);
    });

    it('should pass through image and document header parameters', async () => {
      await messages.sendTemplate({
        to: '15551234567',
        templateName: 'promo',
        language: 'en_US',
        components: [
          {
            type: 'header',
            parameters: [{ type: 'image', image: { link: 'https://example.com/img.jpg' } }],
          },
          {
            type: 'body',
            parameters: [{ type: 'text', text: 'Hello' }],
          },
        ],
      });

      const payload = postSpy.mock.calls[0]![1] as Record<string, unknown>;
      const template = payload['template'] as Record<string, unknown>;
      const components = template['components'] as Array<Record<string, unknown>>;
      expect(components[0]!['parameters']).toEqual([
        { type: 'image', image: { link: 'https://example.com/img.jpg' } },
      ]);
    });

    it('should pass through quick_reply button component', async () => {
      await messages.sendTemplate({
        to: '15551234567',
        templateName: 'feedback',
        language: 'en_US',
        components: [
          {
            type: 'button',
            sub_type: 'quick_reply',
            index: 0,
            parameters: [{ type: 'payload', payload: 'btn_yes_payload' }],
          },
        ],
      });

      const payload = postSpy.mock.calls[0]![1] as Record<string, unknown>;
      const template = payload['template'] as Record<string, unknown>;
      const components = template['components'] as Array<Record<string, unknown>>;
      expect(components[0]).toEqual({
        type: 'button',
        sub_type: 'quick_reply',
        index: 0,
        parameters: [{ type: 'payload', payload: 'btn_yes_payload' }],
      });
    });
  });

  describe('markAsRead', () => {
    it('should send mark-as-read payload', async () => {
      postSpy.mockResolvedValueOnce({
        data: { success: true },
        status: 200,
        headers: new Headers(),
      });

      const result = await messages.markAsRead({ messageId: 'wamid.abc123' });

      expect(postSpy).toHaveBeenCalledWith(
        `${PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: 'wamid.abc123',
        },
        undefined,
      );
      expect(result.data.success).toBe(true);
    });

    it('should NOT include to, type, or recipient_type', async () => {
      await messages.markAsRead({ messageId: 'wamid.abc123' });

      const payload = postSpy.mock.calls[0]![1] as Record<string, unknown>;
      expect(payload).not.toHaveProperty('to');
      expect(payload).not.toHaveProperty('type');
      expect(payload).not.toHaveProperty('recipient_type');
    });
  });

  describe('phone validation', () => {
    it('should throw ValidationError for empty phone on sendImage', async () => {
      await expect(messages.sendImage({ to: '', media: { id: 'media_123' } })).rejects.toThrow(
        ValidationError,
      );
    });

    it('should throw ValidationError for too-short phone on sendLocation', async () => {
      await expect(messages.sendLocation({ to: '123', longitude: 0, latitude: 0 })).rejects.toThrow(
        ValidationError,
      );
    });
  });

  describe('endpoint path', () => {
    it('should use phoneNumberId in the endpoint path', async () => {
      await messages.sendText({ to: '15551234567', body: 'Hi' });

      expect(postSpy.mock.calls[0]![0]).toBe(`${PHONE_NUMBER_ID}/messages`);
    });
  });

  // ── Reply-to context ──

  describe('reply-to context', () => {
    it('should include context when replyTo is provided on sendText', async () => {
      await messages.sendText({ to: '15551234567', body: 'Reply!', replyTo: 'wamid.abc123' });

      const payload = postSpy.mock.calls[0]![1] as Record<string, unknown>;
      expect(payload).toHaveProperty('context');
      expect(payload.context).toEqual({ message_id: 'wamid.abc123' });
    });

    it('should include context when replyTo is provided on sendImage', async () => {
      await messages.sendImage({
        to: '15551234567',
        media: { id: 'img_123' },
        replyTo: 'wamid.img456',
      });

      const payload = postSpy.mock.calls[0]![1] as Record<string, unknown>;
      expect(payload).toHaveProperty('context');
      expect(payload.context).toEqual({ message_id: 'wamid.img456' });
    });

    it('should not include context when replyTo is omitted', async () => {
      await messages.sendText({ to: '15551234567', body: 'No reply' });

      const payload = postSpy.mock.calls[0]![1] as Record<string, unknown>;
      expect(payload).not.toHaveProperty('context');
    });

    it('should not include context when replyTo is empty string', async () => {
      await messages.sendText({ to: '15551234567', body: 'Empty', replyTo: '' });

      const payload = postSpy.mock.calls[0]![1] as Record<string, unknown>;
      expect(payload).not.toHaveProperty('context');
    });

    it('should not include context when replyTo is whitespace only', async () => {
      await messages.sendText({ to: '15551234567', body: 'Whitespace', replyTo: '   ' });

      const payload = postSpy.mock.calls[0]![1] as Record<string, unknown>;
      expect(payload).not.toHaveProperty('context');
    });
  });

  // ── CTA URL Button ──

  describe('sendInteractiveCta', () => {
    it('should send CTA URL button with correct payload', async () => {
      await messages.sendInteractiveCta({
        to: '15551234567',
        body: 'Check this out',
        buttonText: 'Shop Now',
        url: 'https://example.com/shop',
      });

      const payload = postSpy.mock.calls[0]![1] as Record<string, unknown>;
      expect(payload).toMatchObject({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: '15551234567',
        type: 'interactive',
        interactive: {
          type: 'cta_url',
          body: { text: 'Check this out' },
          action: {
            name: 'cta_url',
            parameters: {
              display_text: 'Shop Now',
              url: 'https://example.com/shop',
            },
          },
        },
      });
    });

    it('should include header and footer when provided', async () => {
      await messages.sendInteractiveCta({
        to: '15551234567',
        body: 'Body text',
        buttonText: 'Click',
        url: 'https://example.com',
        header: { type: 'text', text: 'Header' },
        footer: 'Footer text',
      });

      const payload = postSpy.mock.calls[0]![1] as Record<string, unknown>;
      const interactive = payload.interactive as Record<string, unknown>;
      expect(interactive).toHaveProperty('header', { type: 'text', text: 'Header' });
      expect(interactive).toHaveProperty('footer', { text: 'Footer text' });
    });

    it('should handle urlSuffix with dynamic parameter', async () => {
      await messages.sendInteractiveCta({
        to: '15551234567',
        body: 'Track order',
        buttonText: 'Track',
        url: 'https://example.com/track/',
        urlSuffix: 'order-12345',
      });

      const payload = postSpy.mock.calls[0]![1] as Record<string, unknown>;
      const interactive = payload.interactive as Record<string, unknown>;
      const action = interactive.action as Record<string, unknown>;
      const parameters = action.parameters as Record<string, unknown>;
      expect(parameters.url).toBe('https://example.com/track/{{1}}');
      expect(parameters.example).toEqual(['order-12345']);
    });

    it('should include context when replyTo is provided', async () => {
      await messages.sendInteractiveCta({
        to: '15551234567',
        body: 'CTA',
        buttonText: 'Go',
        url: 'https://example.com',
        replyTo: 'wamid.cta123',
      });

      const payload = postSpy.mock.calls[0]![1] as Record<string, unknown>;
      expect(payload).toHaveProperty('context', { message_id: 'wamid.cta123' });
    });

    it('should reject invalid phone number', async () => {
      await expect(
        messages.sendInteractiveCta({
          to: '123',
          body: 'CTA',
          buttonText: 'Go',
          url: 'https://example.com',
        }),
      ).rejects.toThrow(ValidationError);
    });
  });

  // ── Location Request ──

  describe('sendLocationRequest', () => {
    it('should send location request with correct payload', async () => {
      await messages.sendLocationRequest({
        to: '15551234567',
        body: 'Please share your delivery address.',
      });

      const payload = postSpy.mock.calls[0]![1] as Record<string, unknown>;
      expect(payload).toMatchObject({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: '15551234567',
        type: 'interactive',
        interactive: {
          type: 'location_request_message',
          body: { text: 'Please share your delivery address.' },
          action: { name: 'send_location' },
        },
      });
    });

    it('should include context when replyTo is provided', async () => {
      await messages.sendLocationRequest({
        to: '15551234567',
        body: 'Share location',
        replyTo: 'wamid.loc123',
      });

      const payload = postSpy.mock.calls[0]![1] as Record<string, unknown>;
      expect(payload).toHaveProperty('context', { message_id: 'wamid.loc123' });
    });

    it('should reject invalid phone number', async () => {
      await expect(messages.sendLocationRequest({ to: '12', body: 'Where?' })).rejects.toThrow(
        ValidationError,
      );
    });
  });

  // ── Typing Indicator ──

  describe('sendTypingIndicator', () => {
    it('should send typing indicator with correct payload', async () => {
      postSpy.mockResolvedValueOnce({
        data: { success: true },
        status: 200,
        headers: new Headers(),
      });

      const result = await messages.sendTypingIndicator({ to: '15551234567' });

      const payload = postSpy.mock.calls[0]![1] as Record<string, unknown>;
      expect(payload).toEqual({
        messaging_product: 'whatsapp',
        status: 'typing',
        recipient_type: 'individual',
        to: '15551234567',
      });
      expect(result.data.success).toBe(true);
    });

    it('should reject invalid phone number', async () => {
      await expect(messages.sendTypingIndicator({ to: '12' })).rejects.toThrow(ValidationError);
    });
  });
});
