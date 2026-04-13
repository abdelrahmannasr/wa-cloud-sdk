import type { Logger } from '../client/types.js';

// ════════════════════════════════════════════
// RAW TYPES (match Meta's webhook JSON exactly)
// ════════════════════════════════════════════

export interface WebhookPayload {
  readonly object: string;
  readonly entry: readonly WebhookEntry[];
}

export interface WebhookEntry {
  readonly id: string;
  readonly changes: readonly WebhookChange[];
}

export interface WebhookChange {
  readonly value: WebhookChangeValue;
  readonly field: string;
}

export interface WebhookChangeValue {
  readonly messaging_product: string;
  readonly metadata: WebhookMetadata;
  readonly contacts?: readonly WebhookContact[];
  readonly messages?: readonly WebhookMessage[];
  readonly statuses?: readonly WebhookStatus[];
  readonly errors?: readonly WebhookError[];
}

export interface WebhookMetadata {
  readonly display_phone_number: string;
  readonly phone_number_id: string;
}

export interface WebhookContact {
  readonly profile: {
    readonly name: string;
  };
  readonly wa_id: string;
}

/**
 * Raw incoming webhook message from Meta.
 *
 * This interface uses a flat structure with optional fields per message type,
 * mirroring Meta's JSON exactly. A discriminated union per type would prevent
 * accessing type-specific fields when the type is only known at runtime —
 * the flat shape allows `message.text?.body` regardless of `message.type`.
 */
export interface WebhookMessage {
  readonly from: string;
  readonly id: string;
  readonly timestamp: string;
  readonly type: WebhookMessageType;
  readonly text?: { readonly body: string };
  readonly image?: WebhookMediaPayload;
  readonly video?: WebhookMediaPayload;
  readonly audio?: WebhookMediaPayload;
  readonly document?: WebhookDocumentPayload;
  readonly sticker?: WebhookStickerPayload;
  readonly location?: WebhookLocationPayload;
  readonly contacts?: readonly WebhookContactCard[];
  readonly interactive?: WebhookInteractivePayload;
  readonly reaction?: WebhookReactionPayload;
  readonly button?: WebhookButtonPayload;
  readonly order?: WebhookOrderPayload;
  readonly errors?: readonly WebhookError[];
  readonly context?: WebhookContext;
  readonly referral?: WebhookReferral;
}

export type WebhookMessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'sticker'
  | 'location'
  | 'contacts'
  | 'interactive'
  | 'reaction'
  | 'button'
  | 'order'
  | 'unsupported';

export interface WebhookMediaPayload {
  readonly id: string;
  readonly mime_type: string;
  readonly sha256: string;
  readonly caption?: string;
}

export interface WebhookDocumentPayload extends WebhookMediaPayload {
  readonly filename?: string;
}

export interface WebhookStickerPayload {
  readonly id: string;
  readonly mime_type: string;
  readonly sha256: string;
  readonly animated?: boolean;
}

export interface WebhookLocationPayload {
  readonly longitude: number;
  readonly latitude: number;
  readonly name?: string;
  readonly address?: string;
}

export interface WebhookContactCard {
  readonly name: {
    readonly formatted_name: string;
    readonly first_name?: string;
    readonly last_name?: string;
  };
  readonly phones?: readonly WebhookContactCardPhone[];
}

export interface WebhookContactCardPhone {
  readonly phone: string;
  readonly type?: string;
  readonly wa_id?: string;
}

export interface WebhookNfmReply {
  readonly name: string;
  readonly body: string;
  readonly response_json: string;
}

export interface WebhookInteractivePayload {
  readonly type: 'button_reply' | 'list_reply' | 'nfm_reply';
  readonly button_reply?: {
    readonly id: string;
    readonly title: string;
  };
  readonly list_reply?: {
    readonly id: string;
    readonly title: string;
    readonly description?: string;
  };
  readonly nfm_reply?: WebhookNfmReply;
}

export interface WebhookReactionPayload {
  readonly message_id: string;
  readonly emoji: string;
}

export interface WebhookButtonPayload {
  readonly payload: string;
  readonly text: string;
}

export interface WebhookOrderPayload {
  readonly catalog_id: string;
  readonly product_items: readonly WebhookOrderProductItem[];
  readonly text?: string;
}

export interface WebhookOrderProductItem {
  readonly product_retailer_id: string;
  readonly quantity: number;
  readonly item_price: number;
  readonly currency: string;
}

export interface WebhookContext {
  readonly from: string;
  readonly id: string;
  readonly referred_product?: {
    readonly catalog_id: string;
    readonly product_retailer_id: string;
  };
}

export interface WebhookReferral {
  readonly source_url: string;
  readonly source_type: string;
  readonly source_id: string;
  readonly headline?: string;
  readonly body?: string;
}

export interface WebhookStatus {
  readonly id: string;
  readonly status: 'sent' | 'delivered' | 'read' | 'failed';
  readonly timestamp: string;
  readonly recipient_id: string;
  readonly conversation?: {
    readonly id: string;
    readonly origin?: {
      readonly type: string;
    };
    readonly expiration_timestamp?: string;
  };
  readonly pricing?: {
    readonly billable: boolean;
    readonly pricing_model: string;
    readonly category: string;
  };
  readonly errors?: readonly WebhookError[];
}

export interface WebhookError {
  readonly code: number;
  readonly title: string;
  readonly message?: string;
  readonly error_data?: {
    readonly details: string;
  };
  readonly href?: string;
}

// ════════════════════════════════════════════
// PARSED TYPES (developer-friendly events)
// ════════════════════════════════════════════

export interface EventMetadata {
  readonly phoneNumberId: string;
  readonly displayPhoneNumber: string;
}

export interface EventContact {
  readonly name: string;
  readonly waId: string;
}

/** Parsed message event. */
export interface MessageEvent {
  readonly type: 'message';
  readonly metadata: EventMetadata;
  readonly contact: EventContact;
  readonly message: WebhookMessage;
  readonly timestamp: Date;
}

/** Parsed status event (sent, delivered, read, failed). */
export interface StatusEvent {
  readonly type: 'status';
  readonly metadata: EventMetadata;
  readonly status: WebhookStatus;
  readonly timestamp: Date;
}

/** Parsed error event. */
export interface ErrorEvent {
  readonly type: 'error';
  readonly metadata: EventMetadata;
  readonly error: WebhookError;
}

/**
 * Parsed flow completion event.
 *
 * Emitted when a user submits a WhatsApp Flow (interactive.type === 'nfm_reply').
 * Routed to the `onFlowCompletion` callback instead of `onMessage`.
 */
export interface FlowCompletionEvent {
  readonly type: 'flow_completion';
  readonly metadata: EventMetadata;
  readonly contact: EventContact;
  readonly messageId: string;
  /**
   * Flow correlation token. Always `undefined` in this release — Meta does not
   * echo flow_token back in nfm_reply payloads. The field exists for future use.
   */
  readonly flowToken?: string;
  /** Raw response_json string as received from the platform. */
  readonly responseJson: string;
  /** Parsed response_json, or `{}` if JSON parsing failed. */
  readonly response: Record<string, unknown>;
  readonly timestamp: Date;
}

/** Discriminated union of all webhook events. */
export type WebhookEvent = MessageEvent | StatusEvent | ErrorEvent | FlowCompletionEvent;

// ════════════════════════════════════════════
// HANDLER CONFIGURATION
// ════════════════════════════════════════════

export interface WebhookConfig {
  /** App secret for HMAC SHA-256 signature verification */
  readonly appSecret: string;
  /** Verify token for GET challenge verification */
  readonly verifyToken: string;
  /**
   * Optional logger. Used for operator diagnostics (e.g. an unknown
   * `payload.object` that the SDK silently skips). Never receives webhook
   * body content — FR-030 logging hygiene applies.
   */
  readonly logger?: Logger;
}

export interface WebhookHandlerCallbacks {
  readonly onMessage?: (event: MessageEvent) => void | Promise<void>;
  readonly onStatus?: (event: StatusEvent) => void | Promise<void>;
  readonly onError?: (event: ErrorEvent) => void | Promise<void>;
  readonly onFlowCompletion?: (event: FlowCompletionEvent) => void | Promise<void>;
}

// ════════════════════════════════════════════
// MIDDLEWARE TYPES (framework-agnostic)
// ════════════════════════════════════════════

/** Minimal Express-like request interface (no Express dependency). */
export interface WebhookRequest {
  readonly method: string;
  readonly query: Record<string, string | string[] | undefined>;
  readonly body: unknown;
  readonly headers: Record<string, string | string[] | undefined>;
  /** Raw body buffer for signature verification. Must be set by body-parser. */
  readonly rawBody?: Buffer | string;
}

/** Minimal Express-like response interface. */
export interface WebhookResponse {
  status(code: number): WebhookResponse;
  send(body: unknown): void;
}

/** Express-like next function. */
export type WebhookNextFunction = (error?: unknown) => void;
