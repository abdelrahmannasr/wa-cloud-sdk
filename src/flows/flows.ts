import type { HttpClient } from '../client/http-client.js';
import type { RequestOptions, ApiResponse } from '../client/types.js';
import { ValidationError } from '../errors/errors.js';
import type {
  Flow,
  FlowListParams,
  FlowListResponse,
  FlowGetOptions,
  CreateFlowRequest,
  CreateFlowResponse,
  UpdateFlowMetadataRequest,
  UpdateFlowAssetsRequest,
  UpdateFlowAssetsResponse,
  FlowPublishResponse,
  FlowDeprecateResponse,
  FlowDeleteResponse,
  FlowPreviewResponse,
} from './types.js';

/**
 * Flow lifecycle management for the WhatsApp Cloud API.
 *
 * Provides methods for listing, creating, updating, publishing, deprecating,
 * and deleting WhatsApp Flows.
 * All operations use the WhatsApp Business Account ID (WABA ID).
 *
 * @example
 * ```typescript
 * import { HttpClient, Flows } from '@abdelrahmannasr-wa/cloud-api';
 *
 * const client = new HttpClient({
 *   accessToken: 'YOUR_ACCESS_TOKEN',
 *   phoneNumberId: 'YOUR_PHONE_NUMBER_ID',
 *   businessAccountId: 'YOUR_WABA_ID',
 * });
 *
 * const flows = new Flows(client, 'YOUR_WABA_ID');
 * const result = await flows.create({ name: 'signup', categories: ['SIGN_UP'] });
 * await flows.publish(result.data.id);
 * ```
 */
export class Flows {
  private readonly client: HttpClient;
  private readonly businessAccountId: string;

  /**
   * Creates a new Flows instance.
   *
   * @param client - HTTP client for making API requests
   * @param businessAccountId - WhatsApp Business Account ID (WABA ID)
   * @throws {ValidationError} If businessAccountId is empty or not provided
   *
   * @example
   * ```typescript
   * const flows = new Flows(client, 'YOUR_WABA_ID');
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
   * List all flows for the business account.
   *
   * Retrieves flows with optional pagination and field selection.
   *
   * @param params - Optional pagination and field parameters
   * @param requestOptions - Optional request configuration
   * @returns Promise resolving to list of flows with pagination info
   *
   * @example
   * ```typescript
   * const result = await flows.list({ limit: 10 });
   * console.log(result.data.data);
   * ```
   */
  async list(
    params?: FlowListParams,
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<FlowListResponse>> {
    const queryParams: Record<string, string> = {};

    if (params) {
      if (params.limit !== undefined) queryParams.limit = params.limit.toString();
      if (params.after) queryParams.after = params.after;
      if (params.before) queryParams.before = params.before;
      if (params.fields) queryParams.fields = params.fields.join(',');
    }

    if (Object.keys(queryParams).length > 0) {
      return this.client.get<FlowListResponse>(`${this.businessAccountId}/flows`, {
        ...requestOptions,
        params: { ...(requestOptions?.params ?? {}), ...queryParams },
      });
    }

    return this.client.get<FlowListResponse>(
      `${this.businessAccountId}/flows`,
      requestOptions,
    );
  }

  /**
   * Get a single flow by ID.
   *
   * @param flowId - The flow ID to retrieve
   * @param options - Optional field selection
   * @param requestOptions - Optional request configuration
   * @returns Promise resolving to the flow details
   *
   * @example
   * ```typescript
   * const result = await flows.get('1234567890');
   * console.log(result.data.name, result.data.status);
   * ```
   */
  async get(
    flowId: string,
    options?: FlowGetOptions,
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<Flow>> {
    if (options?.fields && options.fields.length > 0) {
      return this.client.get<Flow>(flowId, {
        ...requestOptions,
        params: {
          ...(requestOptions?.params ?? {}),
          fields: options.fields.join(','),
        },
      });
    }

    return this.client.get<Flow>(flowId, requestOptions);
  }

  /**
   * Create a new WhatsApp Flow.
   *
   * Submits a flow definition with name and categories. Optionally include
   * flow_json, endpoint_uri, or clone_flow_id. Validation errors from the
   * platform are returned inside `CreateFlowResponse.validation_errors`
   * within a 2xx response (no exception thrown).
   *
   * @param request - Flow creation request
   * @param requestOptions - Optional request configuration
   * @returns Promise resolving to the new flow ID and validation status
   * @throws {ApiError} On platform 4xx/5xx errors
   *
   * @example
   * ```typescript
   * const result = await flows.create({
   *   name: 'lead_gen_form',
   *   categories: ['LEAD_GENERATION'],
   * });
   * console.log(`Flow ${result.data.id} created`);
   * ```
   */
  async create(
    request: CreateFlowRequest,
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<CreateFlowResponse>> {
    return this.client.post<CreateFlowResponse>(
      `${this.businessAccountId}/flows`,
      request,
      requestOptions,
    );
  }

  /**
   * Update flow metadata (name, categories, endpoint_uri, application_id).
   *
   * Does not modify the flow JSON definition — use {@link updateAssets} for that.
   *
   * @param flowId - The flow ID to update
   * @param updates - Metadata fields to update (at least one should be provided)
   * @param requestOptions - Optional request configuration
   * @returns Promise resolving to success confirmation
   *
   * @example
   * ```typescript
   * await flows.updateMetadata('1234567890', {
   *   name: 'updated_signup',
   *   categories: ['SIGN_UP', 'LEAD_GENERATION'],
   * });
   * ```
   */
  async updateMetadata(
    flowId: string,
    updates: UpdateFlowMetadataRequest,
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<{ success: boolean }>> {
    return this.client.post<{ success: boolean }>(flowId, updates, requestOptions);
  }

  /**
   * Upload or replace the flow JSON definition.
   *
   * Uses multipart/form-data via the `{flowId}/assets` endpoint.
   * If `flow_json` is an object, the SDK stringifies it automatically.
   *
   * @param flowId - The flow ID to update
   * @param request - Flow JSON and optional FormData field overrides
   * @param requestOptions - Optional request configuration
   * @returns Promise resolving to success status and any validation errors
   *
   * @example
   * ```typescript
   * await flows.updateAssets('1234567890', {
   *   flow_json: { version: '3.0', screens: [] },
   * });
   * ```
   */
  async updateAssets(
    flowId: string,
    request: UpdateFlowAssetsRequest,
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<UpdateFlowAssetsResponse>> {
    const jsonString =
      typeof request.flow_json === 'string'
        ? request.flow_json
        : JSON.stringify(request.flow_json);

    const blob = new Blob([jsonString], { type: 'application/json' });
    const formData = new FormData();
    formData.append('name', request.name ?? 'flow.json');
    formData.append('asset_type', request.asset_type ?? 'FLOW_JSON');
    formData.append('file', blob);

    return this.client.upload<UpdateFlowAssetsResponse>(
      `${flowId}/assets`,
      formData,
      requestOptions,
    );
  }

  /**
   * Publish a draft flow, making it available to send to users.
   *
   * Only flows in DRAFT status with valid flow JSON can be published.
   * Once published, the flow JSON cannot be modified.
   *
   * @param flowId - The flow ID to publish
   * @param requestOptions - Optional request configuration
   * @returns Promise resolving to publish confirmation
   * @throws {ApiError} If the flow is not in DRAFT status or has validation errors
   *
   * @example
   * ```typescript
   * await flows.publish('1234567890');
   * ```
   */
  async publish(
    flowId: string,
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<FlowPublishResponse>> {
    return this.client.post<FlowPublishResponse>(`${flowId}/publish`, {}, requestOptions);
  }

  /**
   * Deprecate a published flow.
   *
   * Deprecated flows cannot be sent to new users, but existing
   * flows-in-progress continue to work.
   *
   * @param flowId - The flow ID to deprecate
   * @param requestOptions - Optional request configuration
   * @returns Promise resolving to deprecation confirmation
   * @throws {ApiError} If the flow is not in PUBLISHED status
   *
   * @example
   * ```typescript
   * await flows.deprecate('1234567890');
   * ```
   */
  async deprecate(
    flowId: string,
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<FlowDeprecateResponse>> {
    return this.client.post<FlowDeprecateResponse>(`${flowId}/deprecate`, {}, requestOptions);
  }

  /**
   * Delete a draft flow.
   *
   * Only flows in DRAFT status can be deleted. The platform rejects
   * deletion of published or deprecated flows.
   *
   * @param flowId - The flow ID to delete
   * @param requestOptions - Optional request configuration
   * @returns Promise resolving to deletion confirmation
   * @throws {ApiError} If the flow is not in DRAFT status
   *
   * @example
   * ```typescript
   * await flows.delete('1234567890');
   * ```
   */
  async delete(
    flowId: string,
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<FlowDeleteResponse>> {
    return this.client.delete<FlowDeleteResponse>(flowId, requestOptions);
  }

  /**
   * Get a preview URL for a flow.
   *
   * Returns a temporary browser-accessible URL to preview the flow.
   * Shortcut for `get(flowId, { fields: ['preview.invalidate(false)'] })`.
   *
   * @param flowId - The flow ID to preview
   * @param requestOptions - Optional request configuration
   * @returns Promise resolving to flow ID and preview URL with expiration
   *
   * @example
   * ```typescript
   * const result = await flows.getPreview('1234567890');
   * console.log(result.data.preview.preview_url);
   * ```
   */
  async getPreview(
    flowId: string,
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<FlowPreviewResponse>> {
    return this.client.get<FlowPreviewResponse>(flowId, {
      ...requestOptions,
      params: {
        // SDK default first, caller wins — lets a caller request a narrower
        // field selection for the preview response when they need it.
        fields: 'preview.invalidate(false)',
        ...(requestOptions?.params ?? {}),
      },
    });
  }
}
