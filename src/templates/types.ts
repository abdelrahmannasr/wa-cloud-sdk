/**
 * Template management types for the WhatsApp Cloud API
 * @packageDocumentation
 */

// ── Template Categories ──

/**
 * Template category type
 *
 * @example
 * ```typescript
 * const category: TemplateCategory = 'UTILITY';
 * ```
 */
export type TemplateCategory = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';

// ── Template Status ──

/**
 * Template approval status
 *
 * @example
 * ```typescript
 * const status: TemplateStatus = 'APPROVED';
 * ```
 */
export type TemplateStatus =
  | 'APPROVED'
  | 'PENDING'
  | 'REJECTED'
  | 'PAUSED'
  | 'DISABLED'
  | 'IN_APPEAL';

// ── Quality Score ──

/**
 * Template quality rating
 *
 * @example
 * ```typescript
 * const quality: QualityScore = 'GREEN';
 * ```
 */
export type QualityScore = 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN';

// ── API Response Types ──

/**
 * Template component as returned by the API
 *
 * @example
 * ```typescript
 * const component: TemplateComponentResponse = {
 *   type: 'BODY',
 *   text: 'Hello {{1}}, your order {{2}} is ready'
 * };
 * ```
 */
export interface TemplateComponentResponse {
  readonly type: string;
  readonly format?: string;
  readonly text?: string;
  readonly buttons?: readonly ButtonResponse[];
  readonly example?: unknown;
}

/**
 * Button as returned by the API
 *
 * @example
 * ```typescript
 * const button: ButtonResponse = {
 *   type: 'URL',
 *   text: 'Visit Website',
 *   url: 'https://example.com'
 * };
 * ```
 */
export interface ButtonResponse {
  readonly type: string;
  readonly text: string;
  readonly url?: string;
  readonly phone_number?: string;
}

/**
 * Template as returned by the API
 *
 * @example
 * ```typescript
 * const template: Template = {
 *   id: '123456',
 *   name: 'order_confirmation',
 *   language: 'en_US',
 *   status: 'APPROVED',
 *   category: 'UTILITY',
 *   components: [...]
 * };
 * ```
 */
export interface Template {
  readonly id: string;
  readonly name: string;
  readonly language: string;
  readonly status: TemplateStatus;
  readonly category: TemplateCategory;
  readonly components: readonly TemplateComponentResponse[];
  readonly rejected_reason?: string;
  readonly quality_score?: QualityScore;
}

// ── Create Template Types ──

/**
 * Button for template creation request
 *
 * @example
 * ```typescript
 * const button: CreateTemplateButton = {
 *   type: 'QUICK_REPLY',
 *   text: 'Yes'
 * };
 * ```
 */
export interface CreateTemplateButton {
  readonly type: string;
  readonly text: string;
  readonly url?: string;
  readonly phone_number?: string;
}

/**
 * Component for template creation request
 *
 * @example
 * ```typescript
 * const component: CreateTemplateComponent = {
 *   type: 'BODY',
 *   text: 'Your verification code is {{1}}'
 * };
 * ```
 */
export interface CreateTemplateComponent {
  readonly type: string;
  readonly format?: string;
  readonly text?: string;
  readonly buttons?: readonly CreateTemplateButton[];
  readonly example?: unknown;
}

/**
 * Template creation request payload
 *
 * @example
 * ```typescript
 * const request: CreateTemplateRequest = {
 *   name: 'order_shipped',
 *   language: 'en_US',
 *   category: 'UTILITY',
 *   components: [
 *     { type: 'BODY', text: 'Your order {{1}} has shipped!' }
 *   ]
 * };
 * ```
 */
export interface CreateTemplateRequest {
  readonly name: string;
  readonly language: string;
  readonly category: TemplateCategory;
  readonly allow_category_change?: boolean;
  readonly components: readonly CreateTemplateComponent[];
}

/**
 * Response after creating a template
 *
 * @example
 * ```typescript
 * const response: CreateTemplateResponse = {
 *   id: '123456',
 *   status: 'PENDING',
 *   category: 'UTILITY'
 * };
 * ```
 */
export interface CreateTemplateResponse {
  readonly id: string;
  readonly status: TemplateStatus;
  readonly category: TemplateCategory;
}

// ── Delete Template Types ──

/**
 * Response after deleting a template
 *
 * @example
 * ```typescript
 * const response: TemplateDeleteResponse = {
 *   success: true
 * };
 * ```
 */
export interface TemplateDeleteResponse {
  readonly success: boolean;
}

/**
 * Options for deleting a template
 *
 * @example
 * ```typescript
 * const options: TemplateDeleteOptions = {
 *   hsmId: 'hsm_id_for_specific_variant'
 * };
 * ```
 */
export interface TemplateDeleteOptions {
  readonly hsmId?: string;
}

// ── List Template Types ──

/**
 * Pagination information
 *
 * @example
 * ```typescript
 * const paging: PagingInfo = {
 *   cursors: { before: 'abc', after: 'xyz' },
 *   next: 'https://...'
 * };
 * ```
 */
export interface PagingInfo {
  readonly cursors?: {
    readonly before?: string;
    readonly after?: string;
  };
  readonly next?: string;
  readonly previous?: string;
}

/**
 * Parameters for listing templates
 *
 * @example
 * ```typescript
 * const params: TemplateListParams = {
 *   limit: 10,
 *   status: 'APPROVED'
 * };
 * ```
 */
export interface TemplateListParams {
  readonly limit?: number;
  readonly after?: string;
  readonly before?: string;
  readonly status?: TemplateStatus;
  readonly name?: string;
  readonly fields?: readonly string[];
}

/**
 * Response when listing templates
 *
 * @example
 * ```typescript
 * const response: TemplateListResponse = {
 *   data: [...],
 *   paging: { cursors: { after: 'xyz' } }
 * };
 * ```
 */
export interface TemplateListResponse {
  readonly data: readonly Template[];
  readonly paging?: PagingInfo;
}

// ── Get Template Types ──

/**
 * Options for retrieving templates by name
 *
 * @example
 * ```typescript
 * const options: TemplateGetOptions = {
 *   language: 'en_US'
 * };
 * ```
 */
export interface TemplateGetOptions {
  readonly language?: string;
}

// ── Validation Constants ──

/**
 * Regex pattern for valid template names (lowercase alphanumeric + underscores, 1-512 chars)
 *
 * @example
 * ```typescript
 * TEMPLATE_NAME_PATTERN.test('order_confirmation'); // true
 * TEMPLATE_NAME_PATTERN.test('Order_Confirmation'); // false (uppercase)
 * ```
 */
export const TEMPLATE_NAME_PATTERN = /^[a-z0-9_]{1,512}$/;

/**
 * Maximum length for template body text (Meta limit)
 */
export const MAX_BODY_LENGTH = 1024;

/**
 * Maximum length for header text (Meta limit)
 */
export const MAX_HEADER_TEXT_LENGTH = 60;

/**
 * Maximum length for footer text (Meta limit)
 */
export const MAX_FOOTER_LENGTH = 60;

/**
 * Maximum length for button text (Meta limit)
 */
export const MAX_BUTTON_TEXT_LENGTH = 20;

/**
 * Maximum number of quick-reply buttons per template (Meta limit)
 */
export const MAX_QUICK_REPLY_BUTTONS = 3;

/**
 * Maximum number of URL buttons per template (Meta limit)
 */
export const MAX_URL_BUTTONS = 2;

/**
 * Maximum number of phone-number buttons per template (Meta limit)
 */
export const MAX_PHONE_NUMBER_BUTTONS = 1;
