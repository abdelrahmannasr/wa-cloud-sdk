# Security Requirements Quality Checklist: Template Status Webhook Events

**Purpose**: Unit-test the security-relevant requirements — signature-verification preservation, logging hygiene (sensitive-data leakage), malformed-payload resilience, and attack surface — for completeness, clarity, and consistency. Reviewer-facing PR gate.
**Created**: 2026-04-14
**Feature**: [spec.md](../spec.md) · [plan.md](../plan.md) · [research.md](../research.md) · [contracts/parser-dispatch.md](../contracts/parser-dispatch.md)

## Signature Verification & Transport Integrity

- [x] CHK001 - Is the requirement that HMAC SHA-256 signature verification remain unchanged explicit rather than inferred? [Completeness, Spec §FR-011]
- [x] CHK002 - Is the requirement that template events flow through the SAME HTTP entry points as existing events (no new unverified path) explicit? [Completeness, Spec §FR-011]
- [x] CHK003 - Is the verify-token challenge flow confirmed unchanged (no new GET behavior)? [Completeness, Spec §FR-011]
- [x] CHK004 - Is the raw-body handling (UTF-8 strict decoding, `timingSafeEqual`) confirmed unchanged for template events? [Consistency, Plan §Technical Context]
- [x] CHK005 - Is there any requirement that accidentally allows a template event to bypass signature verification (e.g. a pre-verify hook)? [Consistency, Spec §FR-011 — verify negative]

## Logging Hygiene — Sensitive Data Scope

- [x] CHK006 - Is the set of values that MUST NEVER be logged enumerated (template name, rejection reason, quality score, language, `other_info`, any `change.value` content)? [Completeness, Research §9]
- [x] CHK007 - Is the permitted logging payload specified as a positive allow-list (literal marker + field name, JSON-escaped + length-capped) rather than a prose suggestion? [Clarity, Research §9; Contracts parser-dispatch.md §Logging contract]
- [x] CHK008 - Is the existing webhook logging-hygiene contract (FR-030 from feature 011, "never log webhook body content") referenced explicitly rather than silently inherited? [Consistency, Plan Constitution Check]
- [x] CHK009 - Are log levels for each diagnostic case specified (`warn` for known-field-but-malformed, `debug` for unknown field)? [Clarity, Research §9]

## Logging Hygiene — Specific Fields

- [x] CHK010 - Is there a requirement that `message_template_name` MUST NOT appear in any log line, even on malformed-payload errors? [Completeness, Research §9]
- [x] CHK011 - Is there a requirement that `reason` (potentially quoting submitted content) MUST NOT appear in any log line? [Completeness, Research §9]
- [x] CHK012 - Is there a requirement that `new_quality_score` / `previous_quality_score` (audit-sensitive) MUST NOT appear in any log line? [Completeness, Research §9]
- [x] CHK013 - Is there a requirement that `other_info` (opaque Meta bag, unknown contents) MUST NOT appear in any log line? [Completeness, Research §9]
- [x] CHK014 - Is the decision NOT to log `message_template_id` for operator correlation documented with rationale? [Clarity, Research §9]

## Malformed Payload Resilience

- [x] CHK015 - Is the log-and-skip policy on missing identity (template_id / template_name / language) specified as mandatory rather than recommended? [Completeness, Spec §FR-009]
- [x] CHK016 - Is the "no degraded event" requirement explicit (parser never emits an event with empty/placeholder identity)? [Completeness, Research §8]
- [x] CHK017 - Is the "no throw" requirement on malformed template payloads explicit (so a bad payload cannot DOS the rest of the batch)? [Completeness, Research §8]
- [x] CHK018 - Is behavior specified for `change.value` that is null, an array, or a primitive? [Gap, Contracts parser-dispatch.md]
- [x] CHK019 - Is behavior specified for `entry.time` that is missing, negative, or non-integer? [Edge Case, Contracts parser-dispatch.md]
- [x] CHK020 - Is the decision to SKIP (not reject the batch) on malformed template payloads consistent with how existing order/flow malformed payloads are handled? [Consistency, Research §8]

## Attack Surface & Input Trust

- [x] CHK021 - Is the scope of code paths that handle attacker-controlled input (post-signature-verification parser + dispatch) bounded to `src/webhooks/`? [Completeness, Plan §Project Structure]
- [x] CHK022 - Is there a requirement that unknown `change.field` values be diagnosed at `debug` (not `warn`), so an attacker cannot inflate operator log volume by crafting novel field names? [Clarity, Contracts parser-dispatch.md §Logging contract]
- [x] CHK023 - Is the length cap on any attacker-influenced string used in a log message specified (e.g. `.slice(0, 66)` for `change.field`)? [Completeness, Contracts parser-dispatch.md]
- [x] CHK024 - Is there any requirement that at-least-once delivery be handled WITHOUT SDK-level dedup (making clear the SDK does not store attacker-replay history)? [Clarity, Spec §FR-012]

## Forward Compatibility

- [x] CHK025 - Is the requirement to preserve unknown status / quality strings verbatim (no silent coercion, no silent drop) specified? [Completeness, Spec §FR-008]
- [x] CHK026 - Is the requirement that unknown template-related fields be logged-and-dropped (never thrown, never coerced into a known event type) specified? [Completeness, Spec §FR-010]
- [x] CHK027 - Is there a requirement that the SDK not call any Meta HTTP endpoint in response to receiving a template webhook (i.e. pure inbound, no outbound side-effects)? [Gap, verify negative]

## Consistency with Existing Security Posture

- [x] CHK028 - Is the invariant "no new `any` usage" preserved for template parser paths (only `unknown` narrowed)? [Consistency, Plan Constitution Check]
- [x] CHK029 - Is the invariant "no new runtime dependencies" preserved (no new imports, even internally)? [Consistency, Plan Constitution Check]
- [x] CHK030 - Is the invariant "no default exports" preserved for new types and callbacks? [Consistency, Plan Constitution Check]

## Ambiguities & Conflicts

- [x] CHK031 - Is there any conflict between FR-009 (log-and-skip on missing identity) and CHK010/CHK011 (never log template name or reason)? [Conflict — resolved? — Research §8, §9]
- [x] CHK032 - Does the spec leave "malformed" undefined (e.g. is an empty-string `template_name` malformed)? [Ambiguity, Spec §FR-009]
- [x] CHK033 - Is the decision about logging `message_template_id` for correlation finalized or left open? [Ambiguity, Research §9]

## Notes

- Check items off as completed: `[x]`
- `[Conflict — resolved?]` markers flag items where two requirements interact and the checklist reviewer should confirm the resolution is durable.
- This checklist tests whether the security-relevant requirements are specified tightly enough to prevent implementer discretion from introducing leakage or bypass.
- ≥80% of items reference a specific spec/plan/research/contract section for traceability.
