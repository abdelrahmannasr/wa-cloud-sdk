# Phase 1 Data Model: WhatsApp Flows API

**Feature**: 010-flows-api
**Date**: 2026-04-09
**Input**: `spec.md` (entities) + `research.md` (decisions)

## Purpose

Concrete entity shapes for the flows feature, expressed as TypeScript interfaces (the project's primary contract language). Every field is annotated with its purpose, source (platform-defined vs. SDK-defined), and whether it is required or optional. Validation rules from the spec are captured inline.

## Entity catalog

### 1. `Flow`

Core flow record returned by `GET /{flowId}` and `GET /{wabaId}/flows`.

```ts
export interface Flow {
  readonly id: string;                                    // Platform: flow UUID
  readonly name: string;                                  // Consumer-chosen display name
  readonly status: FlowStatus;                            // Lifecycle state
  readonly categories: readonly FlowCategory[];           // ≥ 1, ≤ 3 per Meta docs
  readonly validation_errors?: readonly FlowValidationError[]; // Present if flow JSON failed validation
  readonly json_version?: string;                         // Flow JSON schema version (set by platform after asset upload)
  readonly data_api_version?: string;                     // Data endpoint protocol version
  readonly endpoint_uri?: string;                         // Consumer-hosted flow endpoint URL
  readonly preview?: {
    readonly preview_url: string;                         // Temporary browser preview URL
    readonly expires_at: string;                          // ISO 8601 expiration timestamp
  };
  readonly whatsapp_business_account?: { readonly id: string };
  readonly application?: { readonly id: string; readonly name: string };
}
```

**Source**: Platform-defined.
**Relationships**: Many flows belong to one WhatsApp Business Account. A flow may reference a consumer-hosted endpoint URI. A flow may have zero or more validation errors.

### 2. `FlowCategory`

```ts
export type FlowCategory =
  | 'SIGN_UP'
  | 'SIGN_IN'
  | 'APPOINTMENT_BOOKING'
  | 'LEAD_GENERATION'
  | 'CONTACT_US'
  | 'CUSTOMER_SUPPORT'
  | 'SURVEY'
  | 'OTHER';
```

**Source**: Platform-defined enum.
**Constraint**: At least 1, at most 3 per flow (platform limit, not enforced client-side — see research decision 13).

### 3. `FlowStatus`

```ts
export type FlowStatus =
  | 'DRAFT'          // Editable, unpublished. Can be deleted.
  | 'PUBLISHED'      // Live, sendable to users in 'published' mode.
  | 'DEPRECATED'     // Retired. Not sendable to new users; existing flows-in-progress continue.
  | 'BLOCKED'        // Suspended due to critical issues. Not sendable.
  | 'THROTTLED';     // Rate-limited due to health issues. May auto-restore.
```

**Source**: Platform-defined enum.
**State transitions**:

```text
    create                  publish                 deprecate
  ────────▶ DRAFT ────────────────▶ PUBLISHED ──────────────▶ DEPRECATED
              │                        │
              │ delete                 │ (auto, on health issue)
              ▼                        ▼
           (deleted)                THROTTLED ─── (auto-recover) ──▶ PUBLISHED
                                        │
                                        ▼ (on critical issue)
                                     BLOCKED ──── (auto-recover) ──▶ THROTTLED/PUBLISHED
```

Only `DRAFT → deleted` is consumer-triggered for deletion. `BLOCKED` and `THROTTLED` transitions are platform-controlled.

### 4. `FlowValidationError`

```ts
export interface FlowValidationError {
  readonly error: string;          // Short error code (e.g., 'INVALID_SCREEN_ID')
  readonly error_type: string;     // Category (e.g., 'FLOW_JSON_ERROR')
  readonly message: string;        // Human-readable description
  readonly line_start?: number;    // 1-indexed line in flow JSON
  readonly line_end?: number;
  readonly column_start?: number;
  readonly column_end?: number;
  readonly pointers?: readonly unknown[]; // Platform-specific JSON pointers (opaque)
}
```

**Source**: Platform-defined. Returned inside `Flow.validation_errors`, `CreateFlowResponse.validation_errors`, or `UpdateFlowAssetsResponse.validation_errors`.
**Purpose**: Gives consumers enough information to display actionable feedback in their own tooling (e.g., highlight the offending line in a code editor).

### 5. `FlowListParams`

```ts
export interface FlowListParams {
  readonly limit?: number;            // Page size (platform default: 25)
  readonly after?: string;            // Pagination cursor (from previous response)
  readonly before?: string;           // Reverse pagination cursor
  readonly fields?: readonly string[]; // Field selector, comma-joined on the wire
}
```

**Source**: SDK-defined wrapper around platform query params.

### 6. `FlowListResponse`

```ts
export interface FlowListResponse {
  readonly data: readonly Flow[];
  readonly paging?: PagingInfo;  // Reused from src/templates/types.ts
}
```

**Source**: Platform response envelope. `PagingInfo` is re-exported from templates (research decision in plan.md).

### 7. `FlowGetOptions`

```ts
export interface FlowGetOptions {
  readonly fields?: readonly string[]; // e.g., ['preview.invalidate(false)']
}
```

**Source**: SDK-defined.

### 8. `CreateFlowRequest`

```ts
export interface CreateFlowRequest {
  readonly name: string;                         // 1..200 chars
  readonly categories: readonly FlowCategory[];  // 1..3 items
  readonly flow_json?: string;                   // Pre-serialized flow JSON
  readonly endpoint_uri?: string;                // Required for Data Endpoint flows (v3+)
  readonly publish?: boolean;                    // Publish immediately on creation
  readonly clone_flow_id?: string;               // Clone an existing flow as a starting point
}
```

**Source**: SDK-defined request shape that mirrors platform contract.
**Note**: `flow_json` accepts a pre-serialized string. For the "object" convenience described in FR-015, consumers use the separate `updateAssets()` flow (or pre-stringify themselves). Research decision: we did NOT add a `flowJsonObject` field to `CreateFlowRequest` to avoid dual fields with overlap; instead, `UpdateFlowAssetsRequest.flow_json` accepts `string | Record<string, unknown>` and the SDK stringifies objects internally.

### 9. `CreateFlowResponse`

```ts
export interface CreateFlowResponse {
  readonly id: string;                                          // New flow UUID
  readonly success: boolean;
  readonly validation_errors?: readonly FlowValidationError[];  // Present if flow JSON failed validation
}
```

**Source**: Platform response.

### 10. `UpdateFlowMetadataRequest`

```ts
export interface UpdateFlowMetadataRequest {
  readonly name?: string;
  readonly categories?: readonly FlowCategory[];
  readonly endpoint_uri?: string;
  readonly application_id?: string;
}
```

**Source**: SDK-defined. All fields optional (at least one should be provided; not enforced).
**Note**: Does NOT include `flow_json`. Flow definition updates go through `updateAssets()`.

### 11. `UpdateFlowAssetsRequest`

```ts
export interface UpdateFlowAssetsRequest {
  readonly flow_json: string | Record<string, unknown>;  // SDK stringifies objects internally
  readonly name?: string;      // FormData 'name' field, defaults to 'flow.json'
  readonly asset_type?: string; // FormData 'asset_type' field, defaults to 'FLOW_JSON'
}
```

**Source**: SDK-defined. Accepts polymorphic `flow_json` per FR-015.
**Implementation note**: When `flow_json` is an object, SDK calls `JSON.stringify()` before constructing `FormData`. Blob is built from the resulting string with `type: 'application/json'`.

### 12. `UpdateFlowAssetsResponse`

```ts
export interface UpdateFlowAssetsResponse {
  readonly success: boolean;
  readonly validation_errors?: readonly FlowValidationError[];
}
```

**Source**: Platform response.

### 13. `FlowDeleteResponse`, `FlowPublishResponse`, `FlowDeprecateResponse`

```ts
export interface FlowDeleteResponse {
  readonly success: boolean;
}

export interface FlowPublishResponse {
  readonly success: boolean;
}

export interface FlowDeprecateResponse {
  readonly success: boolean;
}
```

**Source**: Platform responses. Identical shape; kept as distinct types to allow future divergence without a breaking change.

### 14. `FlowPreviewResponse`

```ts
export interface FlowPreviewResponse {
  readonly id: string;
  readonly preview: {
    readonly preview_url: string;
    readonly expires_at: string;
  };
}
```

**Source**: Platform response (specifically the `GET /{flowId}?fields=preview.invalidate(false)` shape).

### 15. `FlowMessageOptions` (send path)

Defined in `src/messages/types.ts`, not in `src/flows/types.ts`, because it belongs to the messaging surface.

```ts
export interface FlowMessageOptions extends BaseMessageOptions {
  readonly body: string;                   // Main text shown above CTA button
  readonly flowCta: string;                // Button label (e.g., "Open", "Start", "View")
  readonly flowId: string;                 // UUID of published or draft flow
  readonly flowToken?: string;             // Optional correlation token (best-effort — see research decision 8)
  readonly mode?: 'draft' | 'published';   // Defaults to 'published'
  readonly flowAction?: 'navigate' | 'data_exchange'; // Defaults to 'navigate'
  readonly flowActionPayload?: {
    readonly screen: string;               // Initial screen name
    readonly data?: Record<string, unknown>; // Initial screen data
  };
  readonly flowMessageVersion?: string;    // Per-call override (pinned default is '3')
  readonly header?: InteractiveHeader;     // Reused from existing messages types
  readonly footer?: string;
  // BaseMessageOptions provides: to, replyTo
}
```

**Source**: SDK-defined. Extends the existing `BaseMessageOptions` (which provides `to` and `replyTo`) for consistency with other send methods.
**Validation**: `to` is validated via `validatePhoneNumber()` before payload construction (FR-007). No client-side validation on `flowId`, `body`, or `flowCta` — the platform is the arbiter.

### 16. `FlowCompletionEvent` (webhook path)

Defined in `src/webhooks/types.ts`.

```ts
export interface FlowCompletionEvent {
  readonly type: 'flow_completion';           // Discriminator
  readonly metadata: EventMetadata;            // Reused from existing webhooks types
  readonly contact: {
    readonly name: string;                     // Sender display name, or 'Unknown'
    readonly waId: string;                     // Sender WhatsApp ID
  };
  readonly messageId: string;                  // Stable Meta message ID — used for dedup
  readonly flowToken?: string;                 // Always undefined in this release (see research decision 8)
  readonly responseJson: string;               // Raw response_json string as received from platform
  readonly response: Record<string, unknown>;  // Parsed response_json (or {} if parse failed)
  readonly timestamp: Date;                    // Parsed from unix seconds
}

export type WebhookEvent = MessageEvent | StatusEvent | ErrorEvent | FlowCompletionEvent;
```

**Source**: SDK-defined. Fifth variant in the `WebhookEvent` discriminated union.
**Invariant**: The parser ONLY emits this event when `message.type === 'interactive' && message.interactive?.type === 'nfm_reply' && message.interactive.nfm_reply` are all truthy. In all other cases, the parser emits a `MessageEvent` (or `StatusEvent`/`ErrorEvent`) as before.
**Logging contract**: Per FR-030 and research decision 2, `responseJson` and `response` MUST NEVER be passed to the SDK's logger. Audit during implementation: no `logger.debug/info/warn/error` call should reference these fields.

### 17. `WebhookNfmReply` (raw platform payload)

```ts
export interface WebhookNfmReply {
  readonly name: string;          // Always 'flow'
  readonly body: string;          // Typically 'Sent'
  readonly response_json: string; // Stringified form data from the flow's terminal screen
}
```

**Source**: Platform-defined. Nested under `WebhookInteractivePayload.nfm_reply` when `WebhookInteractivePayload.type === 'nfm_reply'`.

### 18. Extended `WebhookInteractivePayload`

```ts
export interface WebhookInteractivePayload {
  readonly type: 'button_reply' | 'list_reply' | 'nfm_reply';  // ← 'nfm_reply' is new
  readonly button_reply?: { readonly id: string; readonly title: string };
  readonly list_reply?: {
    readonly id: string;
    readonly title: string;
    readonly description?: string;
  };
  readonly nfm_reply?: WebhookNfmReply;  // ← new
}
```

**Source**: Platform-defined (extended). This is the only edit to an existing webhook type.

### 19. Extended `WebhookHandlerCallbacks`

```ts
export interface WebhookHandlerCallbacks {
  readonly onMessage?: (event: MessageEvent) => void | Promise<void>;
  readonly onStatus?: (event: StatusEvent) => void | Promise<void>;
  readonly onError?: (event: ErrorEvent) => void | Promise<void>;
  readonly onFlowCompletion?: (event: FlowCompletionEvent) => void | Promise<void>; // ← new
}
```

**Source**: SDK-defined (extended). One new optional callback.

## Validation constants

```ts
export const MAX_FLOW_NAME_LENGTH = 200;
export const MAX_FLOW_CATEGORIES = 3;
export const MAX_FLOW_JSON_BYTES = 10 * 1024 * 1024; // 10 MB
```

**Purpose**: Platform-imposed limits exposed for consumer reference. Not enforced inside the `Flows` class (research decision 13).

## Relationships overview

```text
                                               ┌────────────────────┐
                                               │ WhatsAppBusinessAcct│
                                               │       (WABA)       │
                                               └─────────┬──────────┘
                                                         │ 1..N
                                                         ▼
┌──────────────────┐  1..1         ┌──────────────────────────────────┐
│  CreateFlowReq   │────────────▶  │             Flow                  │
└──────────────────┘   (create)    │ id, name, status, categories, ...│
                                   └─────┬──────────────┬──────────────┘
                                         │              │
                                         │ 1..1         │ 0..N
                                         ▼              ▼
                                ┌────────────────┐  ┌──────────────────────┐
                                │  FlowPreview   │  │ FlowValidationError  │
                                └────────────────┘  └──────────────────────┘

              ┌──────────────────────┐                    ┌─────────────────────┐
              │  FlowMessageOptions  │                    │ FlowCompletionEvent │
              │  (send path)         │                    │ (receive path)      │
              └──────────┬───────────┘                    └──────────┬──────────┘
                         │                                           │
                         │ references                                │ references
                         ▼                                           ▼
                  Flow (by flowId)                               Flow implicitly
                                                                (flowId not in payload)
```

## Field sourcing summary

| Entity | Platform-defined | SDK-defined |
|---|---|---|
| Flow | All fields | — |
| FlowCategory | ✓ enum values | — |
| FlowStatus | ✓ enum values | — |
| FlowValidationError | ✓ all fields | — |
| FlowListParams | `limit`, `after`, `before`, `fields` | Structure |
| FlowListResponse | `data`, `paging` | Structure |
| FlowGetOptions | `fields` values | Structure |
| CreateFlowRequest | All field names | Structure, parameter names match platform |
| CreateFlowResponse | All fields | — |
| UpdateFlowMetadataRequest | All field names | Structure |
| UpdateFlowAssetsRequest | `name`, `asset_type` field values | Polymorphic `flow_json: string \| object` |
| UpdateFlowAssetsResponse | All fields | — |
| FlowDeleteResponse | `success` | — |
| FlowPublishResponse | `success` | — |
| FlowDeprecateResponse | `success` | — |
| FlowPreviewResponse | All fields | — |
| **FlowMessageOptions** | `flow_id`, `flow_cta`, `mode`, `flow_action`, `flow_action_payload`, `flow_message_version`, `flow_token` | Structure + ergonomic camelCase + `replyTo` |
| **FlowCompletionEvent** | `messageId`, `responseJson` (from `response_json`), raw wire format | Structure, `type` discriminator, `timestamp: Date`, `response` parsed convenience field |
| WebhookNfmReply | All fields | — |
| WebhookHandlerCallbacks | — | Structure, added `onFlowCompletion` |

## Immutability

All interface properties are declared `readonly` per project convention (CLAUDE.md: "Use `readonly` on all interface properties that shouldn't be mutated"). Consumers treat all SDK-returned objects as frozen snapshots.
