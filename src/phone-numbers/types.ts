/**
 * Type unions for phone number and business profile fields
 */
export type QualityRating = 'GREEN' | 'YELLOW' | 'RED' | 'NA' | 'UNKNOWN';
export type CodeVerificationStatus = 'NOT_VERIFIED' | 'VERIFIED' | 'EXPIRED';
export type NameStatus = 'APPROVED' | 'PENDING_REVIEW' | 'DECLINED' | 'EXPIRED' | 'NONE';
export type PlatformType = 'CLOUD_API' | 'ON_PREMISE' | 'NOT_APPLICABLE';
export type ThroughputLevel = 'STANDARD' | 'HIGH' | 'NOT_APPLICABLE';
export type AccountMode = 'SANDBOX' | 'LIVE';
export type MessagingLimitTier =
  | 'TIER_50'
  | 'TIER_250'
  | 'TIER_1K'
  | 'TIER_10K'
  | 'TIER_100K'
  | 'TIER_UNLIMITED';
export type CodeMethod = 'SMS' | 'VOICE';
export type BusinessVertical =
  | 'UNDEFINED'
  | 'OTHER'
  | 'AUTO'
  | 'BEAUTY'
  | 'APPAREL'
  | 'EDU'
  | 'ENTERTAIN'
  | 'EVENT_PLAN'
  | 'FINANCE'
  | 'GROCERY'
  | 'GOVT'
  | 'HOTEL'
  | 'HEALTH'
  | 'NONPROFIT'
  | 'PROF_SERVICES'
  | 'RETAIL'
  | 'TRAVEL'
  | 'RESTAURANT'
  | 'NOT_A_BIZ';

/**
 * Throughput configuration for a phone number
 */
export interface Throughput {
  readonly level: ThroughputLevel;
}

/**
 * A WhatsApp-enabled phone number registered under a WABA.
 * Fields mirror Meta's wire format (snake_case) so responses pass through
 * without transformation.
 */
export interface PhoneNumber {
  readonly id: string;
  readonly display_phone_number: string;
  readonly verified_name: string;
  readonly quality_rating: QualityRating;
  readonly code_verification_status: CodeVerificationStatus;
  readonly is_official_business_account: boolean;
  readonly name_status: NameStatus;
  readonly new_name_status?: string;
  readonly platform_type: PlatformType;
  readonly throughput?: Throughput;
  readonly account_mode?: AccountMode;
  readonly messaging_limit_tier?: MessagingLimitTier;
  readonly is_pin_enabled?: boolean;
  readonly last_onboarded_time?: string;
}

/**
 * Business profile information for a phone number.
 * Fields mirror Meta's wire format (snake_case).
 */
export interface BusinessProfile {
  readonly messaging_product: string;
  readonly about?: string;
  readonly address?: string;
  readonly description?: string;
  readonly email?: string;
  readonly profile_picture_url?: string;
  readonly websites?: readonly string[];
  readonly vertical?: BusinessVertical;
}

/**
 * Partial update payload for business profile.
 * Fields use snake_case to match Meta's POST body.
 */
export interface BusinessProfileUpdate {
  readonly about?: string;
  readonly address?: string;
  readonly description?: string;
  readonly email?: string;
  readonly vertical?: BusinessVertical;
  readonly websites?: readonly string[];
  readonly profile_picture_handle?: string;
}

/**
 * Request parameters for listing phone numbers
 */
export interface PhoneNumberListParams {
  readonly fields?: string;
  readonly limit?: number;
  readonly after?: string;
  readonly before?: string;
}

/**
 * Response from listing phone numbers
 */
export interface PhoneNumberListResponse {
  readonly data: readonly PhoneNumber[];
  readonly paging?: {
    readonly cursors?: {
      readonly before?: string;
      readonly after?: string;
    };
  };
}

/**
 * Response from getting business profile (Meta API returns single-element array)
 */
export interface BusinessProfileResponse {
  readonly data: readonly BusinessProfile[];
}

/**
 * Request to initiate phone number verification
 */
export interface VerificationCodeRequest {
  readonly code_method: CodeMethod;
  readonly language: string;
}

/**
 * Submit a verification code
 */
export interface VerifyCodeRequest {
  readonly code: string;
}

/**
 * Register a phone number with the Cloud API
 */
export interface RegisterRequest {
  readonly pin: string;
}

/**
 * Standard success response
 */
export interface SuccessResponse {
  readonly success: boolean;
}
