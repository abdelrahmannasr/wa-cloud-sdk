import type { HttpClient } from '../client/http-client.js';
import type { RequestOptions, ApiResponse } from '../client/types.js';
import { ValidationError } from '../errors/errors.js';
import type {
  PhoneNumber,
  PhoneNumberListParams,
  PhoneNumberListResponse,
  BusinessProfile,
  BusinessProfileUpdate,
  BusinessProfileResponse,
  VerificationCodeRequest,
  VerifyCodeRequest,
  RegisterRequest,
  SuccessResponse,
} from './types.js';

/**
 * Phone number management operations for the WhatsApp Cloud API
 *
 * Provides methods for listing phone numbers, managing business profiles,
 * and handling phone number registration and verification.
 *
 * @example
 * ```typescript
 * import { HttpClient, PhoneNumbers } from '@abdelrahmannasr-wa/cloud-api';
 *
 * const client = new HttpClient({
 *   accessToken: 'YOUR_ACCESS_TOKEN',
 *   phoneNumberId: 'YOUR_PHONE_NUMBER_ID',
 * });
 *
 * const phoneNumbers = new PhoneNumbers(client, 'YOUR_WABA_ID');
 *
 * // List all phone numbers
 * const result = await phoneNumbers.list();
 * console.log(result.data.data);
 * ```
 */
export class PhoneNumbers {
  private readonly client: HttpClient;
  private readonly businessAccountId: string;

  /**
   * Creates a new PhoneNumbers instance
   *
   * @param client - HTTP client for making API requests
   * @param businessAccountId - WhatsApp Business Account ID (WABA ID)
   * @throws {ValidationError} If businessAccountId is empty or not provided
   *
   * @example
   * ```typescript
   * const phoneNumbers = new PhoneNumbers(client, 'YOUR_WABA_ID');
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
   * List all phone numbers registered under the business account
   *
   * Retrieves phone numbers with optional pagination and field filtering.
   * Supports cursor-based pagination using before/after cursors.
   *
   * @param params - Optional pagination and filter parameters
   * @param requestOptions - Optional request configuration (timeout, signal, headers)
   * @returns Promise resolving to list of phone numbers with pagination info
   *
   * @example
   * ```typescript
   * // List all phone numbers
   * const result = await phoneNumbers.list();
   * console.log(result.data.data);
   *
   * // List with pagination
   * const page1 = await phoneNumbers.list({ limit: 10 });
   * const page2 = await phoneNumbers.list({
   *   limit: 10,
   *   after: page1.data.paging?.cursors?.after
   * });
   *
   * // Filter by specific fields
   * const result = await phoneNumbers.list({
   *   fields: 'id,display_phone_number,quality_rating'
   * });
   * ```
   */
  async list(
    params?: PhoneNumberListParams,
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<PhoneNumberListResponse>> {
    const queryParams: Record<string, string> = {};

    if (params) {
      if (params.fields) queryParams.fields = params.fields;
      if (params.limit !== undefined) queryParams.limit = params.limit.toString();
      if (params.after) queryParams.after = params.after;
      if (params.before) queryParams.before = params.before;
    }

    if (Object.keys(queryParams).length > 0) {
      const options: RequestOptions = {
        ...requestOptions,
        params: queryParams,
      };
      return this.client.get<PhoneNumberListResponse>(
        `${this.businessAccountId}/phone_numbers`,
        options,
      );
    }

    return this.client.get<PhoneNumberListResponse>(
      `${this.businessAccountId}/phone_numbers`,
      requestOptions,
    );
  }

  /**
   * Get details for a specific phone number
   *
   * Retrieves full details for a phone number by its ID, with optional field filtering.
   *
   * @param phoneNumberId - Phone number ID to retrieve
   * @param params - Optional field filter parameters
   * @param requestOptions - Optional request configuration (timeout, signal, headers)
   * @returns Promise resolving to phone number details
   * @throws {ValidationError} If phoneNumberId is empty
   *
   * @example
   * ```typescript
   * // Get full phone number details
   * const phone = await phoneNumbers.get('PHONE_NUMBER_ID');
   * console.log(phone.data.verified_name);
   *
   * // Get specific fields only
   * const phone = await phoneNumbers.get('PHONE_NUMBER_ID', {
   *   fields: 'id,display_phone_number,quality_rating'
   * });
   * ```
   */
  async get(
    phoneNumberId: string,
    params?: { readonly fields?: string },
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<PhoneNumber>> {
    if (!phoneNumberId || phoneNumberId.trim() === '') {
      throw new ValidationError('phoneNumberId is required and cannot be empty', 'phoneNumberId');
    }

    if (params?.fields) {
      const options: RequestOptions = {
        ...requestOptions,
        params: { fields: params.fields },
      };
      return this.client.get<PhoneNumber>(phoneNumberId, options);
    }

    return this.client.get<PhoneNumber>(phoneNumberId, requestOptions);
  }

  /**
   * Get the business profile for a phone number
   *
   * Retrieves business profile data including description, address, websites, and more.
   * The SDK automatically unwraps the single-element data array returned by the Meta API.
   *
   * @param phoneNumberId - Phone number ID to retrieve profile for
   * @param params - Optional field filter parameters
   * @param requestOptions - Optional request configuration (timeout, signal, headers)
   * @returns Promise resolving to business profile
   * @throws {ValidationError} If phoneNumberId is empty
   *
   * @example
   * ```typescript
   * // Get full business profile
   * const profile = await phoneNumbers.getBusinessProfile('PHONE_NUMBER_ID');
   * console.log(profile.data.description);
   *
   * // Get specific fields only
   * const profile = await phoneNumbers.getBusinessProfile('PHONE_NUMBER_ID', {
   *   fields: 'description,websites,vertical'
   * });
   * ```
   */
  async getBusinessProfile(
    phoneNumberId: string,
    params?: { readonly fields?: string },
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<BusinessProfile>> {
    if (!phoneNumberId || phoneNumberId.trim() === '') {
      throw new ValidationError('phoneNumberId is required and cannot be empty', 'phoneNumberId');
    }

    const options: RequestOptions | undefined = params?.fields
      ? { ...requestOptions, params: { fields: params.fields } }
      : requestOptions;

    const response = await this.client.get<BusinessProfileResponse>(
      `${phoneNumberId}/whatsapp_business_profile`,
      options,
    );

    // Unwrap the single-element data array from Meta API
    const profile = response.data.data[0];
    if (!profile) {
      throw new ValidationError(
        'Business profile not found - Meta API returned empty data array',
        'businessProfile',
      );
    }

    return {
      data: profile,
      status: response.status,
      headers: response.headers,
    };
  }

  /**
   * Update the business profile for a phone number
   *
   * Updates business profile fields. Only provided fields are sent to the API.
   * The SDK automatically injects the required 'messaging_product' field.
   *
   * @param phoneNumberId - Phone number ID to update profile for
   * @param profile - Partial profile update (only fields to change)
   * @param requestOptions - Optional request configuration (timeout, signal, headers)
   * @returns Promise resolving to success confirmation
   * @throws {ValidationError} If phoneNumberId is empty
   *
   * @example
   * ```typescript
   * // Update description and websites
   * await phoneNumbers.updateBusinessProfile('PHONE_NUMBER_ID', {
   *   description: 'New business description',
   *   websites: ['https://example.com'],
   * });
   *
   * // Update vertical only
   * await phoneNumbers.updateBusinessProfile('PHONE_NUMBER_ID', {
   *   vertical: 'RETAIL',
   * });
   * ```
   */
  async updateBusinessProfile(
    phoneNumberId: string,
    profile: BusinessProfileUpdate,
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<SuccessResponse>> {
    if (!phoneNumberId || phoneNumberId.trim() === '') {
      throw new ValidationError('phoneNumberId is required and cannot be empty', 'phoneNumberId');
    }

    // Auto-inject messaging_product as required by Meta API
    const payload = {
      messaging_product: 'whatsapp',
      ...profile,
    };

    return this.client.post<SuccessResponse>(
      `${phoneNumberId}/whatsapp_business_profile`,
      payload,
      requestOptions,
    );
  }

  /**
   * Request a verification code for phone number registration
   *
   * Initiates phone number verification by sending a code via SMS or voice call.
   * The SDK validates the code method client-side before making the API request.
   *
   * @param phoneNumberId - Phone number ID to verify
   * @param options - Verification method and language settings
   * @param requestOptions - Optional request configuration (timeout, signal, headers)
   * @returns Promise resolving to success confirmation
   * @throws {ValidationError} If phoneNumberId is empty, codeMethod is invalid, or language is empty
   *
   * @example
   * ```typescript
   * // Request code via SMS
   * await phoneNumbers.requestVerificationCode('PHONE_NUMBER_ID', {
   *   code_method: 'SMS',
   *   language: 'en_US',
   * });
   *
   * // Request code via voice call
   * await phoneNumbers.requestVerificationCode('PHONE_NUMBER_ID', {
   *   code_method: 'VOICE',
   *   language: 'es_ES',
   * });
   * ```
   */
  async requestVerificationCode(
    phoneNumberId: string,
    options: VerificationCodeRequest,
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<SuccessResponse>> {
    if (!phoneNumberId || phoneNumberId.trim() === '') {
      throw new ValidationError('phoneNumberId is required and cannot be empty', 'phoneNumberId');
    }

    const validMethods: ReadonlyArray<string> = ['SMS', 'VOICE'];
    if (!validMethods.includes(options.code_method)) {
      throw new ValidationError('code_method must be either "SMS" or "VOICE"', 'code_method');
    }

    if (!options.language || options.language.trim() === '') {
      throw new ValidationError('language is required and cannot be empty', 'language');
    }

    return this.client.post<SuccessResponse>(
      `${phoneNumberId}/request_code`,
      { code_method: options.code_method, language: options.language },
      requestOptions,
    );
  }

  /**
   * Submit a verification code for phone number verification
   *
   * Verifies a phone number by submitting the code received via SMS or voice call.
   *
   * @param phoneNumberId - Phone number ID to verify
   * @param options - Verification code
   * @param requestOptions - Optional request configuration (timeout, signal, headers)
   * @returns Promise resolving to success confirmation
   * @throws {ValidationError} If phoneNumberId or code is empty
   *
   * @example
   * ```typescript
   * await phoneNumbers.verifyCode('PHONE_NUMBER_ID', {
   *   code: '123456',
   * });
   * ```
   */
  async verifyCode(
    phoneNumberId: string,
    options: VerifyCodeRequest,
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<SuccessResponse>> {
    if (!phoneNumberId || phoneNumberId.trim() === '') {
      throw new ValidationError('phoneNumberId is required and cannot be empty', 'phoneNumberId');
    }

    if (!options.code || options.code.trim() === '') {
      throw new ValidationError('code is required and cannot be empty', 'code');
    }

    const payload = {
      code: options.code,
    };

    return this.client.post<SuccessResponse>(
      `${phoneNumberId}/verify_code`,
      payload,
      requestOptions,
    );
  }

  /**
   * Register a verified phone number with the Cloud API
   *
   * Registers a phone number that has been verified. Requires a two-step verification PIN.
   * The SDK automatically injects the required 'messaging_product' field.
   *
   * @param phoneNumberId - Phone number ID to register
   * @param options - Two-step verification PIN
   * @param requestOptions - Optional request configuration (timeout, signal, headers)
   * @returns Promise resolving to success confirmation
   * @throws {ValidationError} If phoneNumberId or pin is empty
   *
   * @example
   * ```typescript
   * await phoneNumbers.register('PHONE_NUMBER_ID', {
   *   pin: '123456',
   * });
   * ```
   */
  async register(
    phoneNumberId: string,
    options: RegisterRequest,
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<SuccessResponse>> {
    if (!phoneNumberId || phoneNumberId.trim() === '') {
      throw new ValidationError('phoneNumberId is required and cannot be empty', 'phoneNumberId');
    }

    if (!options.pin || options.pin.trim() === '') {
      throw new ValidationError('pin is required and cannot be empty', 'pin');
    }

    const payload = {
      messaging_product: 'whatsapp',
      pin: options.pin,
    };

    return this.client.post<SuccessResponse>(`${phoneNumberId}/register`, payload, requestOptions);
  }

  /**
   * Deregister a phone number from the Cloud API
   *
   * Removes a phone number from the Cloud API, freeing up the slot.
   *
   * @param phoneNumberId - Phone number ID to deregister
   * @param requestOptions - Optional request configuration (timeout, signal, headers)
   * @returns Promise resolving to success confirmation
   * @throws {ValidationError} If phoneNumberId is empty
   *
   * @example
   * ```typescript
   * await phoneNumbers.deregister('PHONE_NUMBER_ID');
   * ```
   */
  async deregister(
    phoneNumberId: string,
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<SuccessResponse>> {
    if (!phoneNumberId || phoneNumberId.trim() === '') {
      throw new ValidationError('phoneNumberId is required and cannot be empty', 'phoneNumberId');
    }

    return this.client.post<SuccessResponse>(`${phoneNumberId}/deregister`, {}, requestOptions);
  }
}
