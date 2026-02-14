import type { WhatsAppConfig } from './client/types.js';
import { HttpClient } from './client/http-client.js';
import { Messages } from './messages/messages.js';
import { Media } from './media/media.js';
import { Templates } from './templates/templates.js';
import { Webhooks } from './webhooks/webhooks.js';
import { PhoneNumbers } from './phone-numbers/phone-numbers.js';
import { ValidationError } from './errors/errors.js';

/**
 * Unified WhatsApp Cloud API client.
 *
 * Provides a single entry point for all SDK operations including message sending,
 * media management, template operations, and webhook handling. All operations share
 * a single HTTP client instance for consistent rate limiting, retry behavior, and
 * authentication.
 *
 * @example
 * ```typescript
 * import { WhatsApp } from '@abdelrahmannasr-wa/cloud-api';
 *
 * const wa = new WhatsApp({
 *   accessToken: 'YOUR_ACCESS_TOKEN',
 *   phoneNumberId: 'YOUR_PHONE_NUMBER_ID',
 *   businessAccountId: 'YOUR_WABA_ID', // optional, needed for templates
 * });
 *
 * // Send a message
 * await wa.messages.sendText({
 *   to: '1234567890',
 *   text: 'Hello from the unified client!',
 * });
 *
 * // Clean up when done
 * wa.destroy();
 * ```
 */
export class WhatsApp {
  private readonly config: WhatsAppConfig;
  private readonly _client: HttpClient;
  private readonly _messages: Messages;
  private readonly _media: Media;
  private _templates?: Templates;
  private _webhooks?: Webhooks;
  private _phoneNumbers?: PhoneNumbers;

  /**
   * Creates a unified WhatsApp Cloud API client.
   *
   * @param config - Configuration object containing credentials and settings
   * @throws ValidationError if accessToken or phoneNumberId is missing/empty
   *
   * @example
   * ```typescript
   * const wa = new WhatsApp({
   *   accessToken: 'YOUR_ACCESS_TOKEN',
   *   phoneNumberId: 'YOUR_PHONE_NUMBER_ID',
   * });
   * ```
   */
  constructor(config: WhatsAppConfig) {
    // Validate required configuration
    if (!config.accessToken || config.accessToken.trim() === '') {
      throw new ValidationError('accessToken is required', 'accessToken');
    }
    if (!config.phoneNumberId || config.phoneNumberId.trim() === '') {
      throw new ValidationError('phoneNumberId is required', 'phoneNumberId');
    }

    this.config = { ...config };

    // Create shared HTTP client
    this._client = new HttpClient(config);

    // Eagerly initialize core modules (Messages and Media)
    this._messages = new Messages(this._client, config.phoneNumberId);
    this._media = new Media(this._client, config.phoneNumberId);
  }

  /**
   * Message-sending operations (text, image, video, audio, etc.).
   *
   * @example
   * ```typescript
   * await wa.messages.sendText({
   *   to: '1234567890',
   *   text: 'Hello!',
   * });
   * ```
   */
  get messages(): Messages {
    return this._messages;
  }

  /**
   * Media upload, download, URL retrieval, and deletion.
   *
   * @example
   * ```typescript
   * const upload = await wa.media.upload({
   *   file: buffer,
   *   mimeType: 'image/png',
   *   filename: 'photo.png',
   * });
   * ```
   */
  get media(): Media {
    return this._media;
  }

  /**
   * Template CRUD operations (list, get, create, update, delete).
   *
   * @throws ValidationError if businessAccountId was not provided in config
   *
   * @example
   * ```typescript
   * const templates = await wa.templates.list({ limit: 10 });
   * ```
   */
  get templates(): Templates {
    if (!this._templates) {
      // Lazy initialization with validation
      if (!this.config.businessAccountId || this.config.businessAccountId.trim() === '') {
        throw new ValidationError(
          'businessAccountId is required for template operations. Provide it in the WhatsApp constructor config.',
          'businessAccountId',
        );
      }
      this._templates = new Templates(this._client, this.config.businessAccountId);
    }
    return this._templates;
  }

  /**
   * Webhook verification, parsing, and handler/middleware creation.
   *
   * Note: Individual webhook methods validate their required config fields at invocation time.
   *
   * @example
   * ```typescript
   * const challenge = wa.webhooks.verify(queryParams);
   * const events = wa.webhooks.parse(webhookPayload);
   * ```
   */
  get webhooks(): Webhooks {
    if (!this._webhooks) {
      // Lazy initialization without config validation
      // Individual methods will validate their requirements
      this._webhooks = new Webhooks(this.config);
    }
    return this._webhooks;
  }

  /**
   * Phone number management operations (list, get, register, business profiles).
   *
   * @throws ValidationError if businessAccountId was not provided in config
   *
   * @example
   * ```typescript
   * const phones = await wa.phoneNumbers.list();
   * const profile = await wa.phoneNumbers.getBusinessProfile('PHONE_NUMBER_ID');
   * ```
   */
  get phoneNumbers(): PhoneNumbers {
    if (!this._phoneNumbers) {
      // Lazy initialization with validation
      if (!this.config.businessAccountId || this.config.businessAccountId.trim() === '') {
        throw new ValidationError(
          'businessAccountId is required for phone number operations. Provide it in the WhatsApp constructor config.',
          'businessAccountId',
        );
      }
      this._phoneNumbers = new PhoneNumbers(this._client, this.config.businessAccountId);
    }
    return this._phoneNumbers;
  }

  /**
   * Underlying HTTP client for advanced/custom API calls.
   *
   * @example
   * ```typescript
   * const response = await wa.client.get('/some/custom/endpoint');
   * ```
   */
  get client(): HttpClient {
    return this._client;
  }

  /**
   * Cleans up internal resources (rate limiter intervals, etc.).
   *
   * Call this method when you're done using the client to allow the Node.js
   * process to exit cleanly.
   *
   * @example
   * ```typescript
   * wa.destroy();
   * ```
   */
  destroy(): void {
    this._client.destroy();
  }
}
