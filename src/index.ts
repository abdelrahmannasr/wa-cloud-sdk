// Core client
export { HttpClient } from './client/index.js';
export type {
  WhatsAppConfig,
  RequestOptions,
  ApiResponse,
  HttpMethod,
  Logger,
} from './client/index.js';

// Errors
export {
  WhatsAppError,
  ApiError,
  RateLimitError,
  AuthenticationError,
  ValidationError,
  WebhookVerificationError,
  MediaError,
} from './errors/index.js';

// Utilities
export { TokenBucketRateLimiter } from './utils/index.js';
export type { RateLimiterConfig } from './utils/index.js';
export { withRetry, DEFAULT_RETRY_CONFIG } from './utils/index.js';
export type { RetryConfig } from './utils/index.js';
export { validatePhoneNumber, isValidPhoneNumber } from './utils/index.js';

// Messages
export { Messages } from './messages/index.js';
export type {
  MessageResponse,
  MarkAsReadResponse,
  MessageResponseContact,
  MessageResponseMessage,
  MediaSource,
  MediaId,
  MediaLink,
  TextMessageOptions,
  ImageMessageOptions,
  VideoMessageOptions,
  AudioMessageOptions,
  DocumentMessageOptions,
  StickerMessageOptions,
  LocationMessageOptions,
  ContactName,
  ContactPhone,
  ContactEmail,
  ContactAddress,
  ContactOrg,
  ContactUrl,
  ContactInfo,
  ContactsMessageOptions,
  ReactionMessageOptions,
  InteractiveReplyButton,
  InteractiveHeader,
  InteractiveButtonMessageOptions,
  InteractiveListRow,
  InteractiveListSection,
  InteractiveListMessageOptions,
  TemplateCurrency,
  TemplateDateTime,
  TemplateParameter,
  TemplateComponent,
  TemplateMessageOptions,
  MarkAsReadOptions,
} from './messages/index.js';

// Webhooks
export { parseWebhookPayload, verifyWebhook, verifySignature, createWebhookHandler } from './webhooks/index.js';
export { createExpressMiddleware, createNextRouteHandler } from './webhooks/index.js';
export type {
  WebhookHandler,
  WebhookHandlerResult,
  WebhookPayload,
  WebhookEntry,
  WebhookChange,
  WebhookChangeValue,
  WebhookMetadata,
  WebhookContact,
  WebhookMessage,
  WebhookMessageType,
  WebhookMediaPayload,
  WebhookDocumentPayload,
  WebhookStickerPayload,
  WebhookLocationPayload,
  WebhookContactCard,
  WebhookContactCardPhone,
  WebhookInteractivePayload,
  WebhookReactionPayload,
  WebhookButtonPayload,
  WebhookOrderPayload,
  WebhookOrderProductItem,
  WebhookContext,
  WebhookReferral,
  WebhookStatus,
  WebhookError,
  EventMetadata,
  MessageEvent,
  StatusEvent,
  ErrorEvent,
  WebhookEvent,
  WebhookConfig,
  WebhookHandlerCallbacks,
  WebhookRequest,
  WebhookResponse,
  WebhookNextFunction,
} from './webhooks/index.js';
