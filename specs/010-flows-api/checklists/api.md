# API Quality Checklist: WhatsApp Flows API

**Purpose**: Requirements-quality review of the public API surface introduced by the Flows feature — classes, methods, types, events, error paths, and integration points. This is "unit tests for English": each item asks whether a requirement is written well (complete, clear, consistent, measurable), not whether the eventual implementation works.
**Created**: 2026-04-09
**Feature**: [spec.md](../spec.md) · [plan.md](../plan.md) · [contracts/](../contracts/)
**Audience**: Peer reviewer during PR review
**Depth**: Standard (~30 items)

## Requirement Completeness

- [x] CHK001 Are all ten public methods of the Flows class enumerated in the spec or contracts with HTTP verb, path pattern, and request/response type shape? [Completeness, contracts/flows-class.md]
- [x] CHK002 Does the functional requirements catalog cover every capability the contracts promise (list, get, create, updateMetadata, updateAssets, publish, deprecate, delete, getPreview), or are any methods contract-only without a matching FR? [Completeness, Spec §FR-014..FR-023, contracts/flows-class.md]
- [x] CHK003 Are all fields of `FlowMessageOptions` (to, replyTo, body, flowCta, flowId, flowToken, mode, flowAction, flowActionPayload, flowMessageVersion, header, footer) specified with type, optionality, and default behavior? [Completeness, data-model.md §15, contracts/send-flow.md §Field assembly rules]
- [x] CHK004 Are all fields of `FlowCompletionEvent` (type, metadata, contact, messageId, flowToken, responseJson, response, timestamp) specified including the "always undefined in this release" note for flowToken? [Completeness, data-model.md §16, research.md §8]
- [x] CHK005 Are all default values for optional send parameters (`mode='published'`, `flowAction='navigate'`, `flowMessageVersion='3'`) explicitly stated in the FR catalog AND the contract docs AND the data model? [Completeness, Spec §FR-002, FR-002a, contracts/send-flow.md]
- [x] CHK006 Are the TSDoc requirements (summary, @param, @returns, @throws, @example) enumerated for every new public method, so PR reviewers can verify they were added? [Completeness, contracts/flows-class.md §TSDoc requirements]
- [x] CHK007 Are all new exported type names (Flow, FlowCategory, FlowStatus, FlowValidationError, FlowListParams, FlowListResponse, FlowGetOptions, CreateFlowRequest, CreateFlowResponse, UpdateFlowMetadataRequest, UpdateFlowAssetsRequest, UpdateFlowAssetsResponse, FlowDeleteResponse, FlowPublishResponse, FlowDeprecateResponse, FlowPreviewResponse, FlowMessageOptions, FlowCompletionEvent, WebhookNfmReply) listed in the barrel export contract? [Completeness, contracts/public-exports.md §Re-export checklist]

## Requirement Clarity

- [x] CHK008 Is "flow completion webhook" defined with an unambiguous discriminator (`interactive.type === 'nfm_reply'`) that reviewers can use to distinguish it from button_reply and list_reply? [Clarity, Spec §FR-008, FR-010, FR-011, contracts/webhook-events.md §Parser behavior]
- [x] CHK009 Is the boundary between `updateMetadata()` and `updateAssets()` explicit about which fields go where (name/categories/endpoint_uri/application_id vs. flow_json)? [Clarity, contracts/flows-class.md, data-model.md §10, §11]
- [x] CHK010 Is the polymorphic behavior of `UpdateFlowAssetsRequest.flow_json` (`string | Record<string, unknown>`) specified with the exact transformation rule (objects stringified by the SDK, not by the consumer)? [Clarity, Spec §FR-015, data-model.md §11, research.md §6]
- [x] CHK011 Is "graceful handling" of malformed `response_json` quantified with concrete behavior (event still delivered, raw string preserved, parsed response becomes `{}`, no exception thrown)? [Clarity, Spec §FR-013, research.md §9, contracts/webhook-events.md §Behavioral invariants]
- [x] CHK012 Is the per-call `flowMessageVersion` override behavior specified precisely enough that a reviewer can verify both the pinned default AND the override path in code? [Clarity, Spec §FR-002a, Clarifications Q3, contracts/send-flow.md §Field assembly rules]
- [x] CHK013 Is the "per-account flow identifier constraint" documented with actionable consumer guidance (not just "flows are scoped to WABAs" but "maintain a mapping from conceptual name to per-account ID inside your broadcast factory")? [Clarity, Spec §FR-007a, Edge Cases, research.md §4]

## Requirement Consistency

- [x] CHK014 Are `FlowMessageOptions` field names (camelCase: flowId, flowCta, flowToken, flowMessageVersion, flowAction, flowActionPayload) consistently mapped to their wire equivalents (snake_case: flow_id, flow_cta, flow_token, flow_message_version, flow_action, flow_action_payload)? [Consistency, contracts/send-flow.md §Field assembly rules]
- [x] CHK015 Does the FR catalog's mutual-exclusivity requirement (FR-010: flow completion NOT routed to onMessage) stay consistent with the data-model's discriminated union (`type: 'flow_completion'` vs `type: 'message'`)? [Consistency, Spec §FR-010, data-model.md §16, contracts/webhook-events.md §Behavioral invariants]
- [x] CHK016 Is the subpath export naming convention (`./flows`) consistent with the established pattern across the other eight module subpaths (`./errors`, `./messages`, `./webhooks`, `./media`, `./templates`, `./phone-numbers`, `./multi-account`)? [Consistency, Spec §FR-026, contracts/public-exports.md, research.md §12]
- [x] CHK017 Is the lazy getter behavior for `wa.flows` consistent with the existing `wa.templates` pattern (both require businessAccountId, both throw ValidationError at first access when missing, both cache instance across accesses)? [Consistency, contracts/public-exports.md §Unified client integration]

## Acceptance Criteria Quality

- [x] CHK018 Can SC-015 ("never find flow response payload contents in the SDK's logger output") be objectively verified via a concrete audit step without running the system (e.g., a grep pattern specified in the contracts)? [Measurability, Spec §SC-015, contracts/webhook-events.md §Logging audit checklist]
- [x] CHK019 Can SC-016 ("dispatch the same conceptual flow to recipients across accounts") be objectively verified through a concrete test case target AND a runnable example file? [Measurability, Spec §SC-016, Spec §FR-007a, research.md §4]
- [x] CHK020 Are all 16 success criteria (SC-001 through SC-016) technology-agnostic (no references to TypeScript, HTTP verbs, class names, file paths, or framework APIs)? [Measurability, Spec §Success Criteria]

## Scenario Coverage

- [x] CHK021 Are requirements specified for every primary scenario listed in the user stories (send, receive, create+publish, administer lifecycle)? [Coverage, Spec §User Scenarios & Testing, Spec §FR-001..FR-024]
- [x] CHK022 Are exception scenarios covered in the edge-cases list (platform rejects publish, platform rejects delete of published flow, flow in BLOCKED/THROTTLED state, malformed webhook payload, at-least-once duplicate delivery, cross-account flow-ID misuse)? [Coverage, Spec §Edge Cases]
- [x] CHK023 Is the multi-account broadcast scenario specified end-to-end (Story 1 Scenario 7, FR-007a, SC-016, Edge Cases bullet, research decision, contract example) without gaps between the layers? [Coverage, Spec §Story 1 Scenario 7, FR-007a, SC-016, research.md §4]

## Edge Case Coverage

- [x] CHK024 Is the behavior for an empty/whitespace `businessAccountId` at `Flows` construction specified with the exact error class and field name? [Edge Case, contracts/flows-class.md §Constructor]
- [x] CHK025 Is the behavior specified when `onFlowCompletion` is NOT registered but a flow completion arrives — does the event get silently dropped, logged, or thrown? [Gap, Spec §FR-009, contracts/webhook-events.md] **Intentional delegation**: consistent with all other optional callbacks (`onMessage`, `onStatus`, `onError`) — handler uses optional chaining (`callbacks.onFlowCompletion?.(event)`), so unregistered callbacks silently drop the event. This is the established SDK pattern, not a gap.

## Non-Functional Requirements

- [x] CHK026 Is the logging prohibition specified at the field level (which exact fields: `responseJson`, `response`, `nfm_reply.response_json`) AND the log-level scope (all levels including `debug`)? [NFR, Spec §FR-030, SC-015, research.md §2, contracts/webhook-events.md §Behavioral invariants]
- [x] CHK027 Is the zero-runtime-dependency requirement specified with an auditable definition for this feature (no new `dependencies` entries in package.json, only Node 18+ built-ins: fetch, crypto, FormData, URL, URLSearchParams, Buffer)? [NFR, Spec §FR-029, SC-013, plan.md §Technical Context §Primary Dependencies]
- [x] CHK028 Is the backward-compatibility guarantee specified with verifiable criteria (existing message sending unchanged, existing webhook button/list replies still route through `onMessage`, existing subpath exports unchanged, no existing type removed or retyped)? [NFR, Spec §FR-028, SC-012, contracts/public-exports.md §Backward compatibility]
- [x] CHK029 Is the rate-limiting envelope for new Flows CRUD operations specified (shared with the existing token bucket, no separate bucket, 80 MPS default)? [NFR, plan.md §Technical Context §Performance Goals, research.md §10]

## Dependencies & Assumptions

- [x] CHK030 Is the assumption that `HttpClient.upload()` already exists and handles multipart form-data validated with a source reference (spec 002 media upload)? [Assumption, research.md §5, §10, contracts/flows-class.md §updateAssets]
- [x] CHK031 Is the limitation that Meta does not echo `flow_token` back in `nfm_reply` payloads documented as an explicit assumption with a consumer-actionable workaround (phone+time correlation or in-flow preservation)? [Assumption, Spec Assumption 4, research.md §8, Story 1 Scenario 4, quickstart.md §4]

## Ambiguities & Conflicts

- [x] CHK032 Does the spec clarify whether `sendFlow` validates `flowId` format client-side (e.g., UUID check) or delegates entirely to the platform? [Ambiguity, Gap, Spec §FR-007] **Intentional delegation**: data-model.md §15 notes "No client-side validation on flowId" and research.md §13 confirms delegation to the platform. The SDK validates only the recipient phone number client-side; all other field validation is the platform's responsibility.
- [x] CHK033 Does the spec clarify whether `Flows.create()` / `updateMetadata()` client-side validate `categories.length` against `MAX_FLOW_CATEGORIES` (= 3) before sending, or delegate to the platform's validation? [Ambiguity, Gap, data-model.md §Validation constants, research.md §13] **Intentional delegation**: research.md §13 explicitly states "No client-side validation is enforced in the SDK." `MAX_FLOW_CATEGORIES` is exported for consumer reference but the SDK does not pre-check — validation is the platform's responsibility.

## Notes

- Check items off as completed: `[x]`
- `[Completeness]`, `[Clarity]`, `[Consistency]`, `[Measurability]`, `[Coverage]`, `[Edge Case]`, `[NFR]`, `[Assumption]`, `[Gap]`, `[Ambiguity]` markers identify the quality dimension each item tests
- `[Spec §X]` markers reference the spec section being checked
- `[Gap]` marks items that probe for missing requirements that the spec may have overlooked
- This checklist tests the spec/plan/contracts, NOT the implementation. It runs before code is written. See `checklists/requirements.md` for the original spec-quality checklist from `/speckit.specify`
- Items CHK025, CHK032, CHK033 are known open gaps flagged for reviewer decision — they can be resolved by either editing the spec to add the missing requirement OR marking the gap as intentional delegation to the platform
