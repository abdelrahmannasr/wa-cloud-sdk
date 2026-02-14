import type { HttpClient } from '../client/http-client.js';
import type { RequestOptions, ApiResponse } from '../client/types.js';
import { ValidationError } from '../errors/errors.js';
import type {
  CreateTemplateRequest,
  CreateTemplateResponse,
  TemplateDeleteResponse,
  TemplateDeleteOptions,
  TemplateListParams,
  TemplateListResponse,
  TemplateGetOptions,
  CreateTemplateComponent,
} from './types.js';

/**
 * Template management operations for the WhatsApp Cloud API
 *
 * Provides methods for creating, listing, retrieving, updating, and deleting message templates.
 * All operations use the WhatsApp Business Account ID (WABA ID) instead of phone number ID.
 *
 * @example
 * ```typescript
 * import { HttpClient, Templates } from '@abdelrahmannasr-wa/cloud-api';
 *
 * const client = new HttpClient({
 *   accessToken: 'YOUR_ACCESS_TOKEN',
 *   phoneNumberId: 'YOUR_PHONE_NUMBER_ID',
 *   businessAccountId: 'YOUR_WABA_ID',
 * });
 *
 * const templates = new Templates(client, 'YOUR_WABA_ID');
 *
 * // List all templates
 * const result = await templates.list();
 * console.log(result.data.data);
 * ```
 */
export class Templates {
  private readonly client: HttpClient;
  private readonly businessAccountId: string;

  /**
   * Creates a new Templates instance
   *
   * @param client - HTTP client for making API requests
   * @param businessAccountId - WhatsApp Business Account ID (WABA ID)
   * @throws {ValidationError} If businessAccountId is empty or not provided
   *
   * @example
   * ```typescript
   * const templates = new Templates(client, 'YOUR_WABA_ID');
   * ```
   */
  constructor(client: HttpClient, businessAccountId: string) {
    if (!businessAccountId || businessAccountId.trim() === '') {
      throw new ValidationError(
        'businessAccountId is required and cannot be empty',
        'businessAccountId',
      );
    }

    this.client = client;
    this.businessAccountId = businessAccountId;
  }

  /**
   * List all message templates for the business account
   *
   * Retrieves templates with optional pagination and filtering.
   * Supports cursor-based pagination using before/after cursors.
   *
   * @param params - Optional pagination and filter parameters
   * @param requestOptions - Optional request configuration (timeout, signal, headers)
   * @returns Promise resolving to list of templates with pagination info
   *
   * @example
   * ```typescript
   * // List all templates
   * const result = await templates.list();
   * console.log(result.data.data);
   *
   * // List with pagination
   * const page1 = await templates.list({ limit: 10 });
   * const page2 = await templates.list({
   *   limit: 10,
   *   after: page1.data.paging?.cursors?.after
   * });
   *
   * // Filter by status
   * const approved = await templates.list({ status: 'APPROVED' });
   * ```
   */
  async list(
    params?: TemplateListParams,
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<TemplateListResponse>> {
    const queryParams: Record<string, string> = {};

    if (params) {
      if (params.limit !== undefined) queryParams.limit = params.limit.toString();
      if (params.after) queryParams.after = params.after;
      if (params.before) queryParams.before = params.before;
      if (params.status) queryParams.status = params.status;
      if (params.name) queryParams.name = params.name;
      if (params.fields) queryParams.fields = params.fields.join(',');
    }

    if (Object.keys(queryParams).length > 0) {
      const options: RequestOptions = {
        ...requestOptions,
        params: queryParams,
      };
      return this.client.get<TemplateListResponse>(
        `${this.businessAccountId}/message_templates`,
        options,
      );
    }

    return this.client.get<TemplateListResponse>(
      `${this.businessAccountId}/message_templates`,
      requestOptions,
    );
  }

  /**
   * Get templates by name
   *
   * Retrieves all language variants of a template by filtering the list endpoint.
   * Note: Meta does not provide a single-template GET endpoint, so this method
   * filters the list endpoint by name.
   *
   * @param templateName - The template name to retrieve
   * @param options - Optional filter options (language)
   * @param requestOptions - Optional request configuration (timeout, signal, headers)
   * @returns Promise resolving to matching templates (all language variants)
   *
   * @example
   * ```typescript
   * // Get all variants of a template
   * const result = await templates.get('order_confirmation');
   * console.log(result.data.data); // All language variants
   *
   * // Get specific language variant
   * const enOnly = await templates.get('order_confirmation', {
   *   language: 'en_US'
   * });
   * ```
   */
  async get(
    templateName: string,
    options?: TemplateGetOptions,
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<TemplateListResponse>> {
    const queryParams: Record<string, string> = {
      name: templateName,
    };

    if (options?.language) {
      queryParams.language = options.language;
    }

    const mergedOptions: RequestOptions = {
      ...requestOptions,
      params: queryParams,
    };

    return this.client.get<TemplateListResponse>(
      `${this.businessAccountId}/message_templates`,
      mergedOptions,
    );
  }

  /**
   * Create a new message template
   *
   * Submits a template for Meta review. The template status will be 'PENDING'
   * until Meta approves or rejects it. Use the TemplateBuilder to construct
   * the request payload with client-side validation.
   *
   * @param template - Template creation request (typically from TemplateBuilder.build())
   * @param requestOptions - Optional request configuration (timeout, signal, headers)
   * @returns Promise resolving to template ID, status, and category
   *
   * @example
   * ```typescript
   * import { TemplateBuilder } from '@abdelrahmannasr-wa/cloud-api';
   *
   * // Build the template
   * const request = new TemplateBuilder()
   *   .setName('order_confirmation')
   *   .setLanguage('en_US')
   *   .setCategory('UTILITY')
   *   .addBody('Hi {{1}}, your order {{2}} has been confirmed!')
   *   .addQuickReplyButton('Track Order')
   *   .build();
   *
   * // Submit for review
   * const result = await templates.create(request);
   * console.log(`Template ${result.data.id} is ${result.data.status}`);
   * // Template status will be 'PENDING' until Meta reviews
   * ```
   */
  async create(
    template: CreateTemplateRequest,
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<CreateTemplateResponse>> {
    return this.client.post<CreateTemplateResponse>(
      `${this.businessAccountId}/message_templates`,
      template,
      requestOptions,
    );
  }

  /**
   * Update an existing message template
   *
   * Updates template components by posting to the template ID endpoint.
   * The template will be resubmitted for Meta review with status 'PENDING'.
   *
   * @param templateId - The template ID to update
   * @param components - Updated component array
   * @param requestOptions - Optional request configuration (timeout, signal, headers)
   * @returns Promise resolving to updated template ID, status, and category
   *
   * @example
   * ```typescript
   * // Update template body
   * const result = await templates.update('123456', [
   *   { type: 'BODY', text: 'Updated: Your order {{1}} has shipped!' }
   * ]);
   * console.log(`Template status: ${result.data.status}`); // 'PENDING'
   * ```
   */
  async update(
    templateId: string,
    components: readonly CreateTemplateComponent[],
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<CreateTemplateResponse>> {
    return this.client.post<CreateTemplateResponse>(templateId, { components }, requestOptions);
  }

  /**
   * Delete a message template
   *
   * Deletes a template by name. Optionally target a specific language variant
   * using the hsm_id parameter.
   *
   * @param templateName - The template name to delete
   * @param options - Optional delete options (hsmId for specific variant)
   * @param requestOptions - Optional request configuration (timeout, signal, headers)
   * @returns Promise resolving to deletion success confirmation
   *
   * @example
   * ```typescript
   * // Delete all language variants
   * await templates.delete('order_confirmation');
   *
   * // Delete specific language variant by hsm_id
   * await templates.delete('order_confirmation', {
   *   hsmId: 'HSM_ID'
   * });
   * ```
   */
  async delete(
    templateName: string,
    options?: TemplateDeleteOptions,
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<TemplateDeleteResponse>> {
    const queryParams: Record<string, string> = {
      name: templateName,
    };

    if (options?.hsmId) {
      queryParams.hsm_id = options.hsmId;
    }

    const mergedOptions: RequestOptions = {
      ...requestOptions,
      params: queryParams,
    };

    return this.client.delete<TemplateDeleteResponse>(
      `${this.businessAccountId}/message_templates`,
      mergedOptions,
    );
  }
}
