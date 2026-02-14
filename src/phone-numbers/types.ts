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
 * A WhatsApp-enabled phone number registered under a WABA
 */
export interface PhoneNumber {
  readonly id: string;
  readonly displayPhoneNumber: string;
  readonly verifiedName: string;
  readonly qualityRating: QualityRating;
  readonly codeVerificationStatus: CodeVerificationStatus;
  readonly isOfficialBusinessAccount: boolean;
  readonly nameStatus: NameStatus;
  readonly newNameStatus?: string;
  readonly platformType: PlatformType;
  readonly throughput?: Throughput;
  readonly accountMode?: AccountMode;
  readonly messagingLimitTier?: MessagingLimitTier;
  readonly isPinEnabled?: boolean;
  readonly lastOnboardedTime?: string;
}

/**
 * Business profile information for a phone number
 */
export interface BusinessProfile {
  readonly messagingProduct: string;
  readonly about?: string;
  readonly address?: string;
  readonly description?: string;
  readonly email?: string;
  readonly profilePictureUrl?: string;
  readonly websites?: readonly string[];
  readonly vertical?: BusinessVertical;
}

/**
 * Partial update payload for business profile
 */
export interface BusinessProfileUpdate {
  readonly about?: string;
  readonly address?: string;
  readonly description?: string;
  readonly email?: string;
  readonly vertical?: BusinessVertical;
  readonly websites?: readonly string[];
  readonly profilePictureHandle?: string;
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
  readonly codeMethod: CodeMethod;
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
