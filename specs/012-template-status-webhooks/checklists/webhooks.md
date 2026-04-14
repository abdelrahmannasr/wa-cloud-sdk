# Webhooks Requirements Quality Checklist: Template Status Webhook Events

**Purpose**: Unit-test the webhook-specific requirements in the spec/plan for completeness, clarity, consistency, and coverage. Reviewer-facing PR gate.
**Created**: 2026-04-14
**Feature**: [spec.md](../spec.md) · [plan.md](../plan.md) · [research.md](../research.md) · [data-model.md](../data-model.md)

## Requirement Completeness

- [x] CHK001 - Are the exact platform `change.field` names the SDK must recognize enumerated explicitly? [Completeness, Spec §FR-001, FR-002]
- [x] CHK002 - Is the identity source for WABA (`entry.id`) vs. template-event fields (`change.value`) documented at the requirement level? [Completeness, Plan Summary, Data-Model §Field mapping]
- [x] CHK003 - Are the required parsed-event fields enumerated for BOTH status events (id, name, language, status, reason, timestamp) and quality events (id, name, language, newScore, previousScore, timestamp)? [Completeness, Spec §FR-003, FR-004]
- [x] CHK004 - Is the behavior when `previous_quality_score` is absent (first rating) explicitly stated, including that it must NOT be coerced to a default? [Completeness, Spec User Story 2 Acceptance Scenario 2; Clarifications]
- [x] CHK005 - Does the spec declare what should happen to template payloads lacking a required identity field (`template_id` / `template_name`)? [Completeness, Spec §FR-009]
- [x] CHK006 - Does the spec declare what should happen to `change.field` values the SDK does not recognize (e.g. future `template_category_update`)? [Completeness, Spec §FR-010]
- [x] CHK007 - Are requirements defined for what happens when the platform emits a status value outside the documented lifecycle set? [Completeness, Spec §FR-008]
- [x] CHK008 - Are the events defined as members of the existing `WebhookEvent` discriminated union (single `parse()` surface), or as a separate union? [Completeness, Spec §FR-013]

## Requirement Clarity

- [x] CHK009 - Is the discriminator field `type` for each new event given an exact string value (e.g. `'template_status'`, `'template_quality'`)? [Clarity, Data-Model §Parsed shapes]
- [x] CHK010 - Is the `metadata` shape for template events specified unambiguously (distinct type, single `businessAccountId` field) rather than described in prose? [Clarity, Spec Clarifications 1]
- [x] CHK011 - Is the event `timestamp` shape (e.g. `Date`) specified precisely, including its source (`entry.time` × 1000)? [Clarity, Spec Clarifications 2; Research §1]
- [x] CHK012 - Is the handling of `reason === 'NONE'` specified (e.g. normalize to `undefined`) so parser behavior is not left to implementer interpretation? [Clarity, Research §1]
- [x] CHK013 - Is the union-plus-string extensibility pattern described clearly enough that an implementer would not substitute a closed enum? [Clarity, Spec §FR-008; Research §1]
- [x] CHK014 - Are the numeric-to-string normalization rules for `message_template_id` documented at the requirement level? [Clarity, Data-Model §Field mapping]

## Requirement Consistency

- [x] CHK015 - Are the template-event routing rules consistent with the existing message/status/error/flow/order dispatch pattern (per-field matching, not per-type)? [Consistency, Contracts parser-dispatch.md]
- [x] CHK016 - Is the `TemplateEventMetadata` shape consistent with how other event metadata is structured (single object under `event.metadata`) rather than hoisted to the event root? [Consistency, Data-Model; Clarifications 1]
- [x] CHK017 - Is the "log-and-skip on malformed payload" requirement consistent with existing order/flow parser behavior (no throws, best-effort emission)? [Consistency, Research §8]
- [x] CHK018 - Is the at-least-once delivery requirement consistent with how `StatusEvent` and `OrderEvent` are specified (no SDK-level dedup)? [Consistency, Spec §FR-012]
- [x] CHK019 - Are the new callback naming conventions (`onTemplateStatus`, `onTemplateQuality`) consistent with the existing `on*` family (`onMessage`, `onOrder`, `onFlowCompletion`)? [Consistency, Spec §FR-005]

## Scenario Coverage — Primary Flows

- [x] CHK020 - Are requirements specified for the `APPROVED` status transition (happy path)? [Coverage, Spec User Story 1 Acceptance Scenario 1]
- [x] CHK021 - Are requirements specified for the `REJECTED` status transition with `reason` surfaced? [Coverage, Spec User Story 1 Acceptance Scenario 2]
- [x] CHK022 - Are requirements specified for each of the remaining documented lifecycle states (`PENDING`, `PAUSED`, `DISABLED`)? [Coverage, Spec User Story 1 Acceptance Scenario 3]
- [x] CHK023 - Are requirements specified for a quality transition that includes both previous and new scores? [Coverage, Spec User Story 2 Acceptance Scenario 1]

## Scenario Coverage — Alternate / Exception Flows

- [x] CHK024 - Are requirements defined for a mixed-batch payload (messages + template_status + template_quality in one POST) with no cross-callback contamination? [Coverage, Spec User Story 3 Acceptance Scenario 1]
- [x] CHK025 - Are requirements defined for an unrecognized template-adjacent field in the same batch? [Coverage, Spec User Story 3 Acceptance Scenario 2]
- [x] CHK026 - Is the ordering guarantee for multiple template events in a single POST specified (in payload order, one delivery each)? [Coverage, Spec Edge Cases; Contracts callbacks.md §Handler dispatch]

## Edge Case Coverage

- [x] CHK027 - Is behavior defined when the platform emits a status value the SDK does not yet know (forward compatibility)? [Edge Case, Spec §FR-008]
- [x] CHK028 - Is behavior defined when `reason` is missing entirely on a `REJECTED` event? [Edge Case, Spec Edge Cases]
- [x] CHK029 - Is behavior defined when a template event references a template id the caller has never created (shared WABA)? [Edge Case, Spec Edge Cases]
- [x] CHK030 - Is behavior defined when `entry.time` is missing or non-numeric? [Edge Case, Contracts parser-dispatch.md]
- [x] CHK031 - Is behavior defined when `change.value` is null or non-object? [Edge Case, Gap]
- [x] CHK032 - Are eventual-consistency concerns called out (event for a template before its create call returns)? [Edge Case, Spec Edge Cases]

## Acceptance Criteria Quality

- [x] CHK033 - Can FR-007 ("must not deliver template events to message/status/error/flow/order callbacks") be objectively verified with a single test payload? [Measurability, Spec §FR-007]
- [x] CHK034 - Is SC-003 ("zero cross-contamination across 100% of acceptance payloads") expressed as a pass/fail criterion rather than a tendency? [Measurability, Spec §SC-003]
- [x] CHK035 - Is SC-002 ("exactly once for every well-formed payload") testable without running against the live platform? [Measurability, Spec §SC-002]
- [x] CHK036 - Is SC-006 ("caller can branch on new platform values without SDK upgrade") expressible as a specific compile-time + runtime assertion? [Measurability, Spec §SC-006]

## Dependencies & Assumptions

- [x] CHK037 - Is the assumption that template events share the same webhook URL as message events explicit? [Assumption, Spec Assumptions]
- [x] CHK038 - Is the Meta App Dashboard subscription requirement (outside the SDK's control) called out so integrators don't expect SDK-driven subscription management? [Assumption, Spec Assumptions; Quickstart §Prerequisites]
- [x] CHK039 - Is the set of OUT-OF-SCOPE template fields for this release (`template_category_update`, `message_template_components_update`) documented so reviewers can confirm the MVP boundary? [Assumption, Spec Assumptions]

## Ambiguities & Conflicts

- [x] CHK040 - Is there any conflict between FR-003 (status event fields) and the Key Entities list? [Conflict, Spec §FR-003 vs Key Entities]
- [x] CHK041 - Is there any conflict between Clarifications 1 (dedicated metadata shape) and FR-006 (routing uses existing pattern)? [Conflict, Spec Clarifications §1 vs §FR-006]
- [x] CHK042 - Does the spec leave any term undefined that the plan later fills in (e.g. "event timestamp" resolved to `Date` only in Clarifications)? [Ambiguity, Spec §FR-003 vs Clarifications §2]

## Notes

- Check items off as completed: `[x]`
- `[Gap]` markers flag requirement-quality issues where the answer is likely "no" and a spec edit is needed before implementation.
- ≥80% of items reference a specific spec/plan/contract section for traceability.
