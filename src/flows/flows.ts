import type { HttpClient } from '../client/http-client.js';
import type { RequestOptions, ApiResponse } from '../client/types.js';
import { ValidationError } from '../errors/errors.js';
import type {
  CreateFlowRequest,
  CreateFlowResponse,
  FlowPublishResponse,
} from './types.js';

/**
 * Flow lifecycle management for the WhatsApp Cloud API.
 *
 * Provides methods for creating and publishing WhatsApp Flows.
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
}
