import type { PagingInfo } from '../templates/types.js';

// ════════════════════════════════════════════
// ENUMS
// ════════════════════════════════════════════

export type FlowCategory =
  | 'SIGN_UP'
  | 'SIGN_IN'
  | 'APPOINTMENT_BOOKING'
  | 'LEAD_GENERATION'
  | 'CONTACT_US'
  | 'CUSTOMER_SUPPORT'
  | 'SURVEY'
  | 'OTHER';

export type FlowStatus = 'DRAFT' | 'PUBLISHED' | 'DEPRECATED' | 'BLOCKED' | 'THROTTLED';

// ════════════════════════════════════════════
// CORE ENTITIES
// ════════════════════════════════════════════

export interface FlowValidationError {
  readonly error: string;
  readonly error_type: string;
  readonly message: string;
  readonly line_start?: number;
  readonly line_end?: number;
  readonly column_start?: number;
  readonly column_end?: number;
  readonly pointers?: readonly unknown[];
}

export interface Flow {
  readonly id: string;
  readonly name: string;
  readonly status: FlowStatus;
  readonly categories: readonly FlowCategory[];
  readonly validation_errors?: readonly FlowValidationError[];
  readonly json_version?: string;
  readonly data_api_version?: string;
  readonly endpoint_uri?: string;
  readonly preview?: {
    readonly preview_url: string;
    readonly expires_at: string;
  };
  readonly whatsapp_business_account?: { readonly id: string };
  readonly application?: { readonly id: string; readonly name: string };
}

// ════════════════════════════════════════════
// REQUEST / RESPONSE SHAPES
// ════════════════════════════════════════════

export interface FlowListParams {
  readonly limit?: number;
  readonly after?: string;
  readonly before?: string;
  readonly fields?: readonly string[];
}

export interface FlowListResponse {
  readonly data: readonly Flow[];
  readonly paging?: PagingInfo;
}

export interface FlowGetOptions {
  readonly fields?: readonly string[];
}

export interface CreateFlowRequest {
  readonly name: string;
  readonly categories: readonly FlowCategory[];
  readonly flow_json?: string;
  readonly endpoint_uri?: string;
  readonly publish?: boolean;
  readonly clone_flow_id?: string;
}

export interface CreateFlowResponse {
  readonly id: string;
  readonly success: boolean;
  readonly validation_errors?: readonly FlowValidationError[];
}

export interface UpdateFlowMetadataRequest {
  readonly name?: string;
  readonly categories?: readonly FlowCategory[];
  readonly endpoint_uri?: string;
  readonly application_id?: string;
}

export interface UpdateFlowAssetsRequest {
  readonly flow_json: string | Record<string, unknown>;
  readonly name?: string;
  readonly asset_type?: string;
}

export interface UpdateFlowAssetsResponse {
  readonly success: boolean;
  readonly validation_errors?: readonly FlowValidationError[];
}

export interface FlowDeleteResponse {
  readonly success: boolean;
}

export interface FlowPublishResponse {
  readonly success: boolean;
}

export interface FlowDeprecateResponse {
  readonly success: boolean;
}

export interface FlowPreviewResponse {
  readonly id: string;
  readonly preview: {
    readonly preview_url: string;
    readonly expires_at: string;
  };
}

// ════════════════════════════════════════════
// VALIDATION CONSTANTS
// ════════════════════════════════════════════

export const MAX_FLOW_NAME_LENGTH = 200;
export const MAX_FLOW_CATEGORIES = 3;
export const MAX_FLOW_JSON_BYTES = 10 * 1024 * 1024; // 10 MB
