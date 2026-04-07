# API Requirements Quality Checklist: Messaging Enhancements (v0.2.0)

**Purpose**: Validate requirement completeness, clarity, and consistency for the messaging enhancements feature before implementation
**Created**: 2026-04-07
**Feature**: [spec.md](../spec.md)
**Depth**: Standard
**Audience**: PR reviewer
**Focus**: API contract completeness, backward compatibility, cross-feature consistency

## Requirement Completeness

- [ ] CHK001 Are requirements defined for all 12 message types that should gain reply-to support? [Completeness, Spec §FR-001]
- [ ] CHK002 Is the full list of affected option interfaces explicitly enumerated in the spec or data model? [Completeness, Data Model §Modified Entities]
- [ ] CHK003 Are requirements specified for reply-to behavior on `markAsRead()`? (Spec excludes it — is this documented?) [Completeness, Spec §FR-001]
- [ ] CHK004 Are all required fields for CTA URL button payload documented (body, buttonText, url)? [Completeness, Spec §FR-005]
- [ ] CHK005 Are all optional fields for CTA URL button documented (header types, footer, urlSuffix, replyTo)? [Completeness, Spec §FR-006, §FR-007, §FR-008]
- [ ] CHK006 Is the typing indicator endpoint and payload structure documented in the contract? [Completeness, Contract §sendTypingIndicator]
- [ ] CHK007 Are all four new subpath modules explicitly listed with what they expose? [Completeness, Spec §FR-013 through §FR-016]
- [ ] CHK008 Are all fields of the ConversationPricing entity documented with types and required/optional status? [Completeness, Data Model §ConversationPricing]
- [ ] CHK009 Is the return type for pricing extraction when no data exists explicitly specified (null vs undefined vs empty object)? [Completeness, Spec §FR-019]
- [ ] CHK010 Are requirements defined for which module system formats (ESM/CJS/DTS) each subpath export must produce? [Completeness, Spec §FR-017]

## Requirement Clarity

- [ ] CHK011 Is "silently ignored" for empty reply-to identifiers defined precisely — does it mean no error AND no context, or just no error? [Clarity, Spec §FR-004]
- [ ] CHK012 Is "empty or whitespace-only" defined for reply-to — does it include `null`, `undefined`, or only string values? [Clarity, Spec §FR-004]
- [ ] CHK013 Is the CTA URL dynamic parameter format specified — what does the placeholder look like in the URL? [Clarity, Spec §FR-008]
- [ ] CHK014 Is "up to 25 seconds" for typing indicators sourced from platform documentation or an assumption? [Clarity, Spec §FR-012, Assumption §3]
- [ ] CHK015 Is `urlSuffix` naming consistent with Meta's API terminology (Meta uses "example" for dynamic parameters)? [Clarity, Data Model §CtaUrlButtonMessageOptions]
- [ ] CHK016 Are the pricing category values (marketing, utility, authentication, service, referral_conversion) sourced from platform documentation? [Clarity, Spec §FR-020, Assumption §4]

## Requirement Consistency

- [ ] CHK017 Is the `replyTo` field name consistent across all option interfaces and the contract? [Consistency, Spec §FR-001, Data Model, Contract]
- [ ] CHK018 Does the CTA URL button method name (`sendInteractiveCta`) follow the existing naming convention (`sendInteractiveButtons`, `sendInteractiveList`)? [Consistency, Contract]
- [ ] CHK019 Is the location request method name (`sendLocationRequest`) consistent with the existing `sendLocation` (which sends coordinates)? Could this cause confusion? [Consistency, Contract]
- [ ] CHK020 Does the pricing utility function name (`extractConversationPricing`) follow existing utility naming conventions in the project? [Consistency, Contract]
- [ ] CHK021 Are the new subpath export patterns consistent with existing ones (`./errors`, `./messages`, `./webhooks`)? [Consistency, Spec §FR-017, Assumption §7]

## Acceptance Criteria Quality

- [ ] CHK022 Can SC-001 ("no more than one additional parameter") be objectively measured? [Measurability, Spec §SC-001]
- [ ] CHK023 Can SC-006 ("resolves correctly in both module systems") be objectively tested without implementation details? [Measurability, Spec §SC-006]
- [ ] CHK024 Is SC-008 ("80% threshold") aligned with the project's actual coverage configuration? [Measurability, Spec §SC-008]
- [ ] CHK025 Does SC-010 ("all existing tests pass without modification") account for tests that may need updating due to type changes (e.g., new optional field on interfaces)? [Measurability, Spec §SC-010]

## Scenario Coverage

- [ ] CHK026 Are requirements defined for sending a CTA button with reply-to context simultaneously? [Coverage, Spec §FR-005 + §FR-001]
- [ ] CHK027 Are requirements defined for sending a location request with reply-to context? [Coverage, Spec §FR-009 + §FR-001]
- [ ] CHK028 Are requirements specified for what happens when a typing indicator is sent to a number that hasn't messaged the business first (outside 24-hour window)? [Coverage, Edge Case, Gap]
- [ ] CHK029 Are requirements specified for CTA URL button with an empty or invalid URL? [Coverage, Edge Case, Gap]
- [ ] CHK030 Are requirements defined for pricing extraction from a "failed" status event vs "delivered" status event? [Coverage, Spec §FR-018]

## Edge Case Coverage

- [ ] CHK031 Is the behavior specified for reply-to with a `null` value (not just empty string or whitespace)? [Edge Case, Spec §FR-004]
- [ ] CHK032 Is the behavior specified for CTA URL button without body text (is body truly required or could it be empty)? [Edge Case, Spec §FR-005]
- [ ] CHK033 Is the maximum URL length for CTA buttons documented as a hard requirement or deferred to platform? [Edge Case, Spec Edge Cases]
- [ ] CHK034 Is behavior specified for calling `sendTypingIndicator` multiple times in succession? [Edge Case, Gap]
- [ ] CHK035 Are requirements defined for pricing extraction when `conversation` exists but `pricing` does not (or vice versa)? [Edge Case, Spec §FR-018, §FR-019]

## Dependencies & Assumptions

- [ ] CHK036 Is Assumption §1 (API v21.0 supports all features) validated against Meta's current documentation? [Assumption]
- [ ] CHK037 Is Assumption §6 (webhook parser already handles location) validated by checking the current parser code? [Assumption]
- [ ] CHK038 Is the dependency on existing `buildBasePayload()` method documented as a design dependency? [Dependency, Plan]
- [ ] CHK039 Is the dependency on existing `InteractiveHeader` type for CTA headers documented? [Dependency, Plan]
- [ ] CHK040 Are the existing barrel export files (`src/media/index.ts`, etc.) confirmed to export everything needed for subpath consumers? [Dependency, Assumption §7]

## Notes

- 40 items total across 7 quality dimensions
- Focus: API contract correctness and backward compatibility for a zero-dependency library
- 90% traceability (36/40 items reference spec sections, data model, contract, or use gap/assumption markers)
- Items CHK028, CHK029, CHK031, CHK034 identify potential gaps not covered in the current spec
