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
  /**
   * Batch timestamp (epoch seconds). Present on WABA-scoped change fields
   * (e.g. template lifecycle updates). Used as the event `timestamp` source
   * for those change types; absent on `messages`-field changes.
   */
  readonly time?: number;
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

/** Raw `change.value` shape for `field === 'message_template_status_update'`. */
export interface WebhookTemplateStatusPayload {
  readonly event: string;
  readonly message_template_id: string | number;
  readonly message_template_name: string;
  readonly message_template_language: string;
  readonly reason?: string | null;
  readonly other_info?: Record<string, unknown> | null;
}

/** Raw `change.value` shape for `field === 'message_template_quality_update'`. */
export interface WebhookTemplateQualityPayload {
  readonly new_quality_score: string;
  readonly previous_quality_score?: string;
  readonly message_template_id: string | number;
  readonly message_template_name: string;
  readonly message_template_language: string;
}

// ════════════════════════════════════════════
// PARSED TYPES (developer-friendly events)
// ════════════════════════════════════════════

export interface EventMetadata {
  readonly phoneNumberId: string;
  readonly displayPhoneNumber: string;
}

/**
 * Metadata for template-lifecycle webhook events.
 *
 * Deliberately distinct from {@link EventMetadata}: template events are
 * WABA-scoped and carry no `phone_number_id` / `display_phone_number` on the
 * wire. Sourced from `entry.id`.
 */
export interface TemplateEventMetadata {
  readonly businessAccountId: string;
}

// ════════════════════════════════════════════
// TEMPLATE EVENT PARSED TYPES
// ════════════════════════════════════════════

/**
 * Template lifecycle status.
 *
 * Documented platform values are listed; any additional string is accepted
 * and preserved verbatim so callers can branch on platform additions without
 * an SDK upgrade (FR-008). The `(string & {})` idiom preserves autocomplete
 * for the named literals while accepting any string at runtime.
 */
export type TemplateEventStatus =
  | 'APPROVED'
  | 'REJECTED'
  | 'PENDING'
  | 'PAUSED'
  | 'DISABLED'
  | 'PENDING_DELETION'
  | 'IN_APPEAL'
  | 'LIMIT_EXCEEDED'
  | 'FLAGGED'
  | (string & {});

/**
 * Template user-perceived quality score.
 *
 * Union-plus-string for platform extensibility. `UNKNOWN` covers both the
 * "indeterminate" state and first-time ratings before any score is assigned.
 */
export type TemplateQualityScore = 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN' | (string & {});

/**
 * Emitted when the platform changes a message template's lifecycle state
 * (approved, rejected, paused, disabled, re-approved, etc.).
 *
 * Delivered exclusively to the `onTemplateStatus` callback — never to
 * `onMessage`, `onStatus`, `onError`, `onFlowCompletion`, or `onOrder`.
 *
 * The SDK does NOT deduplicate at-least-once deliveries. Use
 * `(templateId, status, timestamp)` as an idempotency tuple if needed.
 *
 * @example
 * ```ts
 * wa.webhooks.onTemplateStatus((event) => {
 *   if (event.status === 'REJECTED') {
 *     console.log(`Template ${event.templateName} rejected: ${event.reason}`);
 *   }
 * });
 * ```
 */
export interface TemplateStatusEvent {
  readonly type: 'template_status';
  readonly metadata: TemplateEventMetadata;
  readonly templateId: string;
  readonly templateName: string;
  readonly language: string;
  readonly status: TemplateEventStatus;
  /** Present on `REJECTED`; the literal `'NONE'` is normalized to `undefined`. */
  readonly reason?: string;
  /** Opaque platform diagnostic bag (appeal deadlines, title-tag hints). */
  readonly otherInfo?: Record<string, unknown>;
  readonly timestamp: Date;
}

/**
 * Emitted when the platform updates a template's user-perceived quality score
 * (GREEN / YELLOW / RED / UNKNOWN).
 *
 * Delivered exclusively to the `onTemplateQuality` callback.
 *
 * `previousScore` is `undefined` for first-time ratings — the SDK does NOT
 * coerce the absence to `'UNKNOWN'`.
 *
 * @example
 * ```ts
 * wa.webhooks.onTemplateQuality((event) => {
 *   if (event.newScore === 'RED') alert(event.templateName);
 * });
 * ```
 */
export interface TemplateQualityEvent {
  readonly type: 'template_quality';
  readonly metadata: TemplateEventMetadata;
  readonly templateId: string;
  readonly templateName: string;
  readonly language: string;
  readonly newScore: TemplateQualityScore;
  readonly previousScore?: TemplateQualityScore;
  readonly timestamp: Date;
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

/**
 * A single product line item in an order, as sent by the recipient.
 *
 * This is the canonical developer-facing type. The raw wire counterpart is
 * `WebhookOrderProductItem`. Canonical home: `src/webhooks/types.ts`.
 */
export interface OrderItem {
  /** Retailer-defined product identifier */
  readonly product_retailer_id: string;
  /** Quantity of this product in the order */
  readonly quantity: number;
  /** Unit price in minor units (e.g. 2999 = $29.99) */
  readonly item_price: number;
  /** ISO 4217 three-letter currency code */
  readonly currency: string;
}

/**
 * Parsed order event.
 *
 * Emitted when a customer submits a cart from a product or catalog message
 * (messages[].type === 'order'). Routed to the `onOrder` callback and MUST NOT
 * also be delivered to the `onMessage` callback (FR-013).
 *
 * Use `messageId` as an idempotency key — the platform delivers at-least-once.
 * The SDK does NOT deduplicate (FR-015).
 *
 * @example
 * ```ts
 * wa.webhooks.onOrder(async (event) => {
 *   if (await db.orderExists(event.messageId)) return; // dedup
 *   await db.createOrder({
 *     catalogId: event.catalogId,
 *     items: event.items,
 *     customer: event.from,
 *   });
 * });
 * ```
 */
export interface OrderEvent {
  readonly type: 'order';
  readonly metadata: EventMetadata;
  /** Stable platform identifier — use for idempotency */
  readonly messageId: string;
  /** E.164 sender phone number */
  readonly from: string;
  /** ISO 8601 timestamp */
  readonly timestamp: string;
  /** Sender profile (normalized; falls back to `'Unknown'` if no contact entry matches) */
  readonly contact: EventContact;
  /** Platform-assigned catalog ID the order was placed against */
  readonly catalogId: string;
  /**
   * Parsed product line items. Empty array if the platform payload was
   * malformed or `product_items` was missing — the event still surfaces.
   */
  readonly items: readonly OrderItem[];
  /** Optional accompanying free-text from the customer */
  readonly text?: string;
  /** Original JSON-stringified order payload for verification, storage, or custom parsing */
  readonly raw: string;
}

/** Discriminated union of all webhook events. */
export type WebhookEvent =
  | MessageEvent
  | StatusEvent
  | ErrorEvent
  | FlowCompletionEvent
  | OrderEvent
  | TemplateStatusEvent
  | TemplateQualityEvent;

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
  readonly onOrder?: (event: OrderEvent) => void | Promise<void>;
  readonly onTemplateStatus?: (event: TemplateStatusEvent) => void | Promise<void>;
  readonly onTemplateQuality?: (event: TemplateQualityEvent) => void | Promise<void>;
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
  /**
   * Raw body for signature verification. Must be set by body-parser.
   * When provided as a Buffer, it MUST be UTF-8 encoded; the handler
   * rejects non-UTF-8 bodies with 400 because JSON.parse would otherwise
   * read U+FFFD-substituted mojibake.
   */
  readonly rawBody?: Buffer | string;
}

/** Minimal Express-like response interface. */
export interface WebhookResponse {
  status(code: number): WebhookResponse;
  send(body: unknown): void;
}

/** Express-like next function. */
export type WebhookNextFunction = (error?: unknown) => void;
