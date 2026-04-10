// Unified client
export { WhatsApp } from './whatsapp.js';

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
export { extractConversationPricing } from './utils/index.js';
export type { ConversationPricing, PricingCategory, PricingModel } from './utils/index.js';

// Messages
export { Messages } from './messages/index.js';
export type {
  BaseMessageOptions,
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
  CtaUrlButtonMessageOptions,
  LocationRequestMessageOptions,
  TypingIndicatorOptions,
  MarkAsReadOptions,
  MessageType,
} from './messages/index.js';

// Media
export { Media } from './media/index.js';
export type {
  MediaCategory,
  StickerSubtype,
  MediaConstraint,
  MediaUploadOptions,
  MediaUploadResponse,
  MediaUrlResponse,
  MediaDeleteResponse,
} from './media/index.js';
export { MEDIA_CONSTRAINTS } from './media/index.js';

// Templates
export { Templates, TemplateBuilder } from './templates/index.js';
export type {
  Template,
  TemplateCategory,
  TemplateStatus,
  QualityScore,
  TemplateComponentResponse,
  ButtonResponse,
  CreateTemplateRequest,
  CreateTemplateComponent,
  CreateTemplateButton,
  CreateTemplateResponse,
  TemplateDeleteResponse,
  TemplateDeleteOptions,
  PagingInfo,
  TemplateListParams,
  TemplateListResponse,
  TemplateGetOptions,
} from './templates/index.js';
export {
  TEMPLATE_NAME_PATTERN,
  MAX_BODY_LENGTH,
  MAX_HEADER_TEXT_LENGTH,
  MAX_FOOTER_LENGTH,
  MAX_BUTTON_TEXT_LENGTH,
  MAX_QUICK_REPLY_BUTTONS,
  MAX_URL_BUTTONS,
  MAX_PHONE_NUMBER_BUTTONS,
} from './templates/index.js';

// Webhooks
export { Webhooks } from './webhooks/index.js';
export {
  parseWebhookPayload,
  verifyWebhook,
  verifySignature,
  createWebhookHandler,
} from './webhooks/index.js';
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
  WebhookNfmReply,
  WebhookReactionPayload,
  WebhookButtonPayload,
  WebhookOrderPayload,
  WebhookOrderProductItem,
  WebhookContext,
  WebhookReferral,
  WebhookStatus,
  WebhookError,
  EventMetadata,
  EventContact,
  MessageEvent,
  StatusEvent,
  ErrorEvent,
  FlowCompletionEvent,
  WebhookEvent,
  WebhookConfig,
  WebhookHandlerCallbacks,
  WebhookRequest,
  WebhookResponse,
  WebhookNextFunction,
} from './webhooks/index.js';

// Phone Numbers
export { PhoneNumbers } from './phone-numbers/index.js';
export type {
  PhoneNumber,
  BusinessProfile,
  BusinessProfileUpdate,
  PhoneNumberListParams,
  PhoneNumberListResponse,
  BusinessProfileResponse,
  VerificationCodeRequest,
  VerifyCodeRequest,
  RegisterRequest,
  SuccessResponse,
  Throughput,
  QualityRating,
  CodeVerificationStatus,
  NameStatus,
  PlatformType,
  ThroughputLevel,
  AccountMode,
  MessagingLimitTier,
  CodeMethod,
  BusinessVertical,
} from './phone-numbers/index.js';

// Multi-Account
export {
  WhatsAppMultiAccount,
  RoundRobinStrategy,
  WeightedStrategy,
  StickyStrategy,
} from './multi-account/index.js';
export type {
  AccountConfig,
  MultiAccountConfig,
  DistributionStrategy,
  BroadcastMessageFactory,
  BroadcastOptions,
  BroadcastSuccess,
  BroadcastFailure,
  BroadcastResult,
} from './multi-account/index.js';
