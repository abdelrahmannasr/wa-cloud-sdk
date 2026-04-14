/**
 * Template management module
 *
 * Provides CRUD operations for WhatsApp message templates plus a fluent
 * TemplateBuilder for constructing creation requests with client-side validation.
 *
 * @packageDocumentation
 */

// Classes
export { Templates } from './templates.js';
export { TemplateBuilder } from './builder.js';

// Types
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
} from './types.js';

// Constants
export {
  TEMPLATE_NAME_PATTERN,
  MAX_BODY_LENGTH,
  MAX_HEADER_TEXT_LENGTH,
  MAX_FOOTER_LENGTH,
  MAX_BUTTON_TEXT_LENGTH,
  MAX_QUICK_REPLY_BUTTONS,
  MAX_URL_BUTTONS,
  MAX_PHONE_NUMBER_BUTTONS,
} from './types.js';
